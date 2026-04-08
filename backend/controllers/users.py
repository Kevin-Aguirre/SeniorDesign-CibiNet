from tg import expose, TGController, session as tg_session, response
from model import session, User, Listing
from schemas import UserSchema, ListingSchema


class UserController(TGController):
    def _blocked_if_suspended(self, user):
        if user and user.is_suspended:
            response.status = 403
            return {"error": f"Account suspended: {user.suspension_reason or 'Contact support'}"}
        return None

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
    def my_listings(self):
        """Donor views all listings they have posted"""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        if tg_session.get('user_role') != 'Donor':
            response.status = 403
            return {"error": "Only Donors can view their listings"}
        user = session.query(User).filter_by(user_id=user_id).first()
        blocked = self._blocked_if_suspended(user)
        if blocked:
            return blocked

        listings = session.query(Listing).filter_by(donor_id=user_id).all()

        return {"listings": [ListingSchema(l).to_dict() for l in listings]}
