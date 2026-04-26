from tg import TGController, expose, session as tg_session, response
from model import session, User, PasswordResetToken
from schemas import UserSchema
import hashlib
import secrets
import datetime
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

def _send_reset_email(to_email: str, token: str):
    """
    Send a password reset email via Gmail SMTP.
    Requires SMTP_USER and SMTP_PASS environment variables.
    Falls back to console print if credentials are not configured.
    """
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    if not SMTP_USER or not SMTP_PASS:
        print(f"[Password Reset] No SMTP configured. Token for {to_email}: {token}")
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'CibiNet — Reset your password'
    msg['From'] = f'CibiNet <{SMTP_USER}>'
    msg['To'] = to_email

    text_body = (
        f"Hi,\n\n"
        f"You requested a password reset for your CibiNet account.\n\n"
        f"Click the link below to set a new password (expires in 1 hour):\n"
        f"{reset_url}\n\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"— The CibiNet Team"
    )
    html_body = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111;">
      <h2 style="margin:0 0 8px;font-size:22px;">Reset your CibiNet password</h2>
      <p style="color:#555;margin:0 0 24px;">
        You requested a password reset. Click the button below — this link expires in <strong>1 hour</strong>.
      </p>
      <a href="{reset_url}"
         style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;
                padding:12px 24px;border-radius:8px;font-weight:600;font-size:15px;">
        Reset password
      </a>
      <p style="color:#999;font-size:12px;margin-top:32px;">
        If you didn't request this, ignore this email. Your password won't change.<br>
        Or copy this link manually: <a href="{reset_url}" style="color:#16a34a;">{reset_url}</a>
      </p>
    </div>
    """

    msg.attach(MIMEText(text_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS.replace(' ', ''))
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[Password Reset] SMTP error for {to_email}: {e}")
        return False



LOCKOUT_SECONDS = 60
_failed_attempts: dict = {}
MAX_ATTEMPTS = 5

def _check_lockout(email: str):
    """
    Returns (is_locked, seconds_remaining).
    Prunes stale attempt timestamps older than the lockout window.
    """
    now = datetime.datetime.utcnow()
    cutoff = now - datetime.timedelta(seconds=LOCKOUT_SECONDS)
    attempts = [t for t in _failed_attempts.get(email, []) if t > cutoff]
    _failed_attempts[email] = attempts
    if len(attempts) >= MAX_ATTEMPTS:
        oldest_in_window = attempts[0]
        unlock_at = oldest_in_window + datetime.timedelta(seconds=LOCKOUT_SECONDS)
        remaining = int((unlock_at - now).total_seconds()) + 1
        return True, max(remaining, 1)
    return False, 0


def _record_failure(email: str):
    now = datetime.datetime.utcnow()
    _failed_attempts.setdefault(email, []).append(now)


def _clear_attempts(email: str):
    _failed_attempts.pop(email, None)


class AuthController(TGController):
    
    @expose('json')
    def register(self, email, password, role, **kwargs):
        """Register a new User (Donor or Recipient)"""
        # 1. Validation
        if not email or not password or role not in ['Donor', 'Recipient']:
            response.status = 400
            return {"error": "Invalid email, password, or role"}

        # Check if user already exists
        exists = session.query(User).filter_by(email=email).first()
        if exists:
            response.status = 409
            return {"error": "User already exists"}

        # 2. Hash Password (Simple SHA256 for this setup)
        # Note: In production, use bcrypt or passlib!
        hashed = hashlib.sha256(password.encode()).hexdigest()

        try:
            new_user = User(
                email=email,
                password_hash=hashed,
                role=role
            )
            session.add(new_user)
            session.commit()
            return {"status": "success", "message": "User registered", "user_id": new_user.user_id}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": str(e)}

    @expose('json')
    def login(self, email, password):
        """Validate credentials and start session"""
        if not email or not password:
            response.status = 400
            return {"error": "Email and password are required"}

        is_locked, remaining = _check_lockout(email)
        if is_locked:
            response.status = 429
            return {"error": f"Too many failed attempts. Try again in {remaining} second{'s' if remaining != 1 else ''}."}

        hashed = hashlib.sha256(password.encode()).hexdigest()
        user = session.query(User).filter_by(email=email, password_hash=hashed).first()

        if not user:
            _record_failure(email)
            is_locked, remaining = _check_lockout(email)
            if is_locked:
                response.status = 429
                return {"error": f"Too many failed attempts. Account locked for {remaining} second{'s' if remaining != 1 else ''}."}
            attempts_left = MAX_ATTEMPTS - len(_failed_attempts.get(email, []))
            response.status = 401
            return {"error": f"Invalid credentials. {attempts_left} attempt{'s' if attempts_left != 1 else ''} remaining before lockout."}

        if user.is_suspended:
            response.status = 403
            return {"error": f"Account suspended: {user.suspension_reason or 'Contact support'}"}

        _clear_attempts(email)
        tg_session['user_id'] = user.user_id
        tg_session['user_role'] = user.role
        tg_session.save()

        return {"status": "success", "user": UserSchema(user).to_dict()}

    @expose('json')
    def logout(self):
        """Clear the session"""
        tg_session.invalidate()
        tg_session.save()
        return {"status": "success", "message": "Logged out"}

    @expose('json')
    def check_status(self):
        """Helper to verify if the frontend is still 'logged in'"""
        user_id = tg_session.get('user_id')
        if not user_id:
            return {"logged_in": False}
        return {"logged_in": True, "user_id": user_id, "user_role": tg_session.get('user_role')}

    @expose('json')
    def request_reset(self, email):
        """
        Generate a password reset token for the given email.
        Always returns success to prevent email enumeration.
        In production, email the token via SMTP instead of returning it in the response.
        """
        if not email:
            response.status = 400
            return {"error": "Email is required"}

        user = session.query(User).filter_by(email=email).first()

        if user:
            session.query(PasswordResetToken).filter_by(
                user_id=user.user_id, used=False
            ).update({"used": True})

            token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            reset_token = PasswordResetToken(
                user_id=user.user_id,
                token=token_hash,
                expires_at=expires_at
            )
            try:
                session.add(reset_token)
                session.commit()
            except Exception as e:
                session.rollback()
                response.status = 500
                return {"error": "Database error", "details": str(e)}

            email_sent = _send_reset_email(email, token)

            result = {
                "status": "success",
                "message": "If that email is registered, a reset link has been sent."
            }
            if not email_sent:
                result["dev_reset_token"] = token
            return result

        return {
            "status": "success",
            "message": "If that email is registered, a reset link has been sent."
        }

    @expose('json')
    def reset_password(self, token, new_password):
        """
        Reset a user's password using a valid, unexpired reset token.
        """
        if not token or not new_password:
            response.status = 400
            return {"error": "token and new_password are required"}

        if len(new_password) < 8:
            response.status = 400
            return {"error": "Password must be at least 8 characters"}

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        reset = session.query(PasswordResetToken).filter_by(
            token=token_hash, used=False
        ).first()

        if not reset:
            response.status = 400
            return {"error": "Invalid or expired reset token"}

        if reset.expires_at < datetime.datetime.utcnow():
            response.status = 400
            return {"error": "Reset token has expired"}

        try:
            user = session.query(User).filter_by(user_id=reset.user_id).first()
            user.password_hash = hashlib.sha256(new_password.encode()).hexdigest()
            reset.used = True
            session.commit()
            _clear_attempts(user.email)
            return {"status": "success", "message": "Password reset. You can now log in."}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}
