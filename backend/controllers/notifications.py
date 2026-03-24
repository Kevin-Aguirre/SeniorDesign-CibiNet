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

    # Notification for the Donor
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

    # Notification for the Recipient
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
    # Caller is responsible for committing the session


class NotificationController(TGController):

    @expose('json')
    def mine(self):
        """UC07: Get all notifications for the current session user"""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        notifications = session.query(Notification).filter_by(
            user_id=user_id
        ).order_by(Notification.sent_at.desc()).all()

        return {"notifications": [NotificationSchema(n).to_dict() for n in notifications]}
