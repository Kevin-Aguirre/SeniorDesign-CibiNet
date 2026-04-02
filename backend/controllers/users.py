from tg import expose, TGController, session as tg_session, response
from model import session, User, Listing
from schemas import UserSchema, ListingSchema
import hashlib


class UserController(TGController):

    @expose('json')
    def me(self):
        """Get the current session user's profile"""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        user = session.query(User).filter_by(user_id=user_id).first()
        if not user:
            response.status = 404
            return {"error": "User not found"}

        return UserSchema(user).to_dict()

    @expose('json')
    def update(self, username=None, email=None, current_password=None, new_password=None):
        """Update current user profile (username/email and/or password)."""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        user = session.query(User).filter_by(user_id=user_id).first()
        if not user:
            response.status = 404
            return {"error": "User not found"}

        if not username and not email and not new_password:
            response.status = 400
            return {"error": "Provide at least one field to update"}

        if username:
            username = str(username).strip()
            if not username:
                response.status = 400
                return {"error": "Invalid username"}
            if username != user.username:
                existing_username = session.query(User).filter_by(username=username).first()
                if existing_username:
                    response.status = 409
                    return {"error": "Username already in use"}
                user.username = username

        if email:
            email = str(email).strip().lower()
            if email and email != user.email:
                existing = session.query(User).filter_by(email=email).first()
                if existing:
                    response.status = 409
                    return {"error": "Email already in use"}
                user.email = email

        if new_password:
            if not current_password:
                response.status = 400
                return {"error": "Current password required to set a new password"}

            hashed_current = hashlib.sha256(current_password.encode()).hexdigest()
            if hashed_current != user.password_hash:
                response.status = 401
                return {"error": "Current password is incorrect"}

            user.password_hash = hashlib.sha256(new_password.encode()).hexdigest()

        try:
            session.add(user)
            session.commit()
            # Keep session role/user_id as is
            return UserSchema(user).to_dict()
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": str(e)}

    @expose('json')
    def my_listings(self):
        """Donor views all listings they have posted"""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        if tg_session.get('user_role') != 'Donor':
            response.status = 403
            return {"error": "Only Donors can view their listings"}

        listings = session.query(Listing).filter_by(donor_id=user_id).all()

        return {"listings": [ListingSchema(l).to_dict() for l in listings]}
