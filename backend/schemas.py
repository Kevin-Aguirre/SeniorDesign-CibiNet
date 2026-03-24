"""
Response schemas for CibiNet API.

Each class takes the relevant SQLAlchemy model object(s) in its constructor
and exposes a to_dict() method that controllers return as JSON.
"""


class UserSchema:
    """Profile data for a single user — used by auth login and users/me."""

    def __init__(self, user):
        self.user_id = user.user_id
        self.email = user.email
        self.role = user.role
        self.created_at = user.created_at.isoformat()

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at
        }


class ListingMapSchema:
    """
    Minimal listing shape for the map/discovery view.
    Only exposes public fields — donor address is intentionally excluded
    until a claim is made (NFR-03: address obfuscation).
    """

    def __init__(self, listing):
        self.listing_id = listing.listing_id
        self.food_type = listing.food_type
        self.lat = float(listing.latitude)
        self.lon = float(listing.longitude)

    def to_dict(self):
        return {
            "id": self.listing_id,
            "food": self.food_type,
            "lat": self.lat,
            "lon": self.lon
        }


class ListingSchema:
    """Full listing detail — used by the donor's own listings view."""

    def __init__(self, listing):
        self.listing_id = listing.listing_id
        self.food_type = listing.food_type
        self.quantity = listing.quantity
        self.status = listing.status
        self.address_text = listing.address_text
        self.expiry_time = listing.expiry_time.isoformat()

    def to_dict(self):
        return {
            "listing_id": self.listing_id,
            "food_type": self.food_type,
            "quantity": self.quantity,
            "status": self.status,
            "address_text": self.address_text,
            "expiry_time": self.expiry_time
        }


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
        self.sent_at = notification.sent_at.isoformat()

    def to_dict(self):
        return {
            "id": self.notification_id,
            "type": self.type,
            "message": self.message_body,
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
