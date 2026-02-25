from tg import TGController, expose, session as tg_session, response
from model import session, User # Note: 'session' is your DB session
import hashlib


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
            return {"error": str(e)}

    @expose('json')
    def login(self, email, password):
        """Validate credentials and start session"""
        hashed = hashlib.sha256(password.encode()).hexdigest()
        user = session.query(User).filter_by(email=email, password_hash=hashed).first()

        if not user:
            response.status = 401
            return {"error": "Invalid credentials"}

        # Store user info in the TG session
        tg_session['user_id'] = user.user_id
        tg_session['user_role'] = user.role
        tg_session.save()

        return {
            "status": "success", 
            "user": {"id": user.user_id, "email": user.email, "role": user.role}
        }

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
        return {"logged_in": True, "user_id": user_id}
