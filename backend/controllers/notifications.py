from tg import expose, TGController, session as tg_session, response
from model import session, Notification, User
from schemas import NotificationSchema


def dispatch_claim_notifications(claim, listing, donor, recipient):
    """
    UC07: Dispatch Fulfillment Notification
    Creates in-app Notification records for both the Donor and Recipient
    when a claim is successfully locked. Uses the claim_id as the
    Coordination ID since no external email service is configured yet.
    """
    coordination_id = f"COORD-{claim.claim_id}"

    donor_msg = (
        f"Your listing '{listing.food_type}' (Qty: {listing.quantity}) has been claimed. "
        f"Coordination ID: {coordination_id}. "
        f"Recipient contact: {recipient.email}. "
        f"Fulfillment method: {claim.logistics_type}."
    )
    donor_notification = Notification(
        user_id=donor.user_id,
        type="claim_received",
        message_body=donor_msg
    )

    recipient_msg = (
        f"You have successfully claimed '{listing.food_type}' (Qty: {listing.quantity}). "
        f"Coordination ID: {coordination_id}. "
        f"Donor contact: {donor.email}. "
        f"Pickup address: {listing.address_text}. "
        f"Fulfillment method: {claim.logistics_type}."
    )
    recipient_notification = Notification(
        user_id=recipient.user_id,
        type="claim_confirmed",
        message_body=recipient_msg
    )

    session.add(donor_notification)
    session.add(recipient_notification)


class NotificationController(TGController):
    def _blocked_if_suspended(self, user_id):
        user = session.query(User).filter_by(user_id=user_id).first()
        if user and user.is_suspended:
            response.status = 403
            return {"error": f"Account suspended: {user.suspension_reason or 'Contact support'}"}
        return None

    @expose('json')
    def mine(self):
        """UC07: Get all notifications for the current session user"""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}
        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        notifications = session.query(Notification).filter_by(
            user_id=user_id
        ).order_by(Notification.sent_at.desc()).all()

        return {"notifications": [NotificationSchema(n).to_dict() for n in notifications]}

    @expose('json')
    def mark_read(self, notification_id):
        """Mark a single notification as read."""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}
        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        notif = session.query(Notification).filter_by(
            notification_id=notification_id, user_id=user_id
        ).first()
        if not notif:
            response.status = 404
            return {"error": "Notification not found"}

        try:
            notif.is_read = True
            session.commit()
            return {"status": "success"}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def mark_all_read(self):
        """Mark all notifications for the current user as read."""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}
        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        try:
            session.query(Notification).filter_by(
                user_id=user_id, is_read=False
            ).update({Notification.is_read: True})
            session.commit()
            return {"status": "success"}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def unread_count(self):
        """Get the count of unread notifications for the current user."""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}
        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        count = session.query(Notification).filter_by(
            user_id=user_id, is_read=False
        ).count()
        return {"unread_count": count}
