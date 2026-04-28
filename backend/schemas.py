"""
Response schemas for CibiNet API.

Each class takes the relevant SQLAlchemy model object(s) in its constructor
and exposes a to_dict() method that controllers return as JSON.
"""


class UserSchema:
    """Profile data for a single user — used by auth login and users/me."""

    def __init__(self, user):
        self.user_id = user.user_id
        self.username = user.username
        self.email = user.email
        self.role = user.role
        self.is_verified = user.is_verified
        self.is_suspended = user.is_suspended
        self.suspension_reason = user.suspension_reason
        self.suspended_at = user.suspended_at.isoformat() if user.suspended_at else None
        self.created_at = user.created_at.isoformat()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "is_verified": self.is_verified,
            "is_suspended": self.is_suspended,
            "suspension_reason": self.suspension_reason,
            "suspended_at": self.suspended_at,
            "created_at": self.created_at
        }


class ListingMapSchema:
    """
    Public listing shape for the map/discovery view.
    Address is intentionally excluded until a claim is made (NFR-03).
    Quantity and expiry_time are included so Recipients can judge urgency.
    """

    def __init__(self, listing):
        self.listing_id = listing.listing_id
        self.food_type = listing.food_type
        self.quantity = listing.quantity
        self.lat = float(listing.latitude)
        self.lon = float(listing.longitude)
        self.expiry_time = listing.expiry_time.isoformat()
        self.image_url = f"/uploads/{listing.image_filename}" if listing.image_filename else None

    def to_dict(self):
        d = {
            "id": self.listing_id,
            "food": self.food_type,
            "quantity": self.quantity,
            "lat": self.lat,
            "lon": self.lon,
            "expiry_time": self.expiry_time
        }
        if self.image_url:
            d["image_url"] = self.image_url
        return d


class ListingSchema:
    """Full listing detail — used by the donor's own listings view."""

    def __init__(self, listing):
        self.listing_id = listing.listing_id
        self.food_type = listing.food_type
        self.quantity = listing.quantity
        self.status = listing.status
        self.address_text = listing.address_text
        self.expiry_time = listing.expiry_time.isoformat()
        self.image_url = f"/uploads/{listing.image_filename}" if listing.image_filename else None

    def to_dict(self):
        d = {
            "listing_id": self.listing_id,
            "food_type": self.food_type,
            "quantity": self.quantity,
            "status": self.status,
            "address_text": self.address_text,
            "expiry_time": self.expiry_time
        }
        if self.image_url:
            d["image_url"] = self.image_url
        return d


class LogisticsPacketSchema:
    """
    Logistics handoff data returned to the recipient after a successful claim.
    FR-04: packages the pickup/drop-off coordinates for external delivery services.
    """

    def __init__(self, listing, logistics_type):
        self.address = listing.address_text
        self.lat = float(listing.latitude)
        self.lon = float(listing.longitude)
        self.logistics_type = logistics_type

    def to_dict(self):
        return {
            "address": self.address,
            "lat": self.lat,
            "lon": self.lon,
            "logistics_type": self.logistics_type
        }


class ClaimSchema:
    """
    Claim response shape used for both the list view (claims/mine)
    and the detail view (claims/view). Includes the Coordination ID
    required by UC07 for both-party notification.
    """

    def __init__(self, claim):
        self.claim_id = claim.claim_id
        self.coordination_id = f"COORD-{claim.claim_id}"
        self.listing_id = claim.listing_id
        self.food_type = claim.listing.food_type
        self.quantity = claim.listing.quantity
        self.address = claim.listing.address_text
        self.logistics_type = claim.logistics_type
        self.external_ref_id = claim.external_ref_id
        self.safety_ack_received = claim.safety_ack_received
        self.claimed_at = claim.claimed_at.isoformat()

    def to_dict(self):
        return {
            "claim_id": self.claim_id,
            "coordination_id": self.coordination_id,
            "listing_id": self.listing_id,
            "food_type": self.food_type,
            "quantity": self.quantity,
            "address": self.address,
            "logistics_type": self.logistics_type,
            "external_ref_id": self.external_ref_id,
            "safety_ack_received": self.safety_ack_received,
            "claimed_at": self.claimed_at
        }


class NotificationSchema:
    """A single in-app notification record for a user."""

    def __init__(self, notification):
        self.notification_id = notification.notification_id
        self.type = notification.type
        self.message_body = notification.message_body
        self.is_read = notification.is_read
        self.sent_at = notification.sent_at.isoformat()

    def to_dict(self):
        return {
            "id": self.notification_id,
            "type": self.type,
            "message": self.message_body,
            "is_read": self.is_read,
            "sent_at": self.sent_at
        }


class AuditLogSchema:
    """A single audit log entry — used by the system/audit_log endpoint."""

    def __init__(self, log):
        self.log_id = log.log_id
        self.user_id = log.user_id
        self.action = log.action
        self.entity_type = log.entity_type
        self.entity_id = log.entity_id
        self.timestamp = log.timestamp.isoformat()

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "user_id": self.user_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "timestamp": self.timestamp
        }


class ClaimDisputeSchema:
    def __init__(self, dispute):
        self.dispute_id = dispute.dispute_id
        self.claim_id = dispute.claim_id
        self.reporter_id = dispute.reporter_id
        self.reporter_email = dispute.reporter.email if dispute.reporter else None
        self.reason = dispute.reason
        self.details = dispute.details
        self.status = dispute.status
        self.resolution_note = dispute.resolution_note
        self.reviewed_by = dispute.reviewed_by
        self.created_at = dispute.created_at.isoformat()
        self.reviewed_at = dispute.reviewed_at.isoformat() if dispute.reviewed_at else None

    def to_dict(self):
        return {
            "dispute_id": self.dispute_id,
            "claim_id": self.claim_id,
            "reporter_id": self.reporter_id,
            "reporter_email": self.reporter_email,
            "reason": self.reason,
            "details": self.details,
            "status": self.status,
            "resolution_note": self.resolution_note,
            "reviewed_by": self.reviewed_by,
            "created_at": self.created_at,
            "reviewed_at": self.reviewed_at
        }


class SuspiciousActivitySchema:
    def __init__(self, activity):
        self.activity_id = activity.activity_id
        self.user_id = activity.user_id
        self.user_email = activity.user.email if activity.user else None
        self.claim_id = activity.claim_id
        self.activity_type = activity.activity_type
        self.severity = activity.severity
        self.details = activity.details
        self.status = activity.status
        self.reviewed_by = activity.reviewed_by
        self.review_note = activity.review_note
        self.detected_at = activity.detected_at.isoformat()
        self.reviewed_at = activity.reviewed_at.isoformat() if activity.reviewed_at else None

    def to_dict(self):
        return {
            "activity_id": self.activity_id,
            "user_id": self.user_id,
            "user_email": self.user_email,
            "claim_id": self.claim_id,
            "activity_type": self.activity_type,
            "severity": self.severity,
            "details": self.details,
            "status": self.status,
            "reviewed_by": self.reviewed_by,
            "review_note": self.review_note,
            "detected_at": self.detected_at,
            "reviewed_at": self.reviewed_at
        }
