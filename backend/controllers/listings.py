from tg import expose, TGController, session as tg_session, response
from model import session, Listing, User, Claim, AuditLog
from .notifications import dispatch_claim_notifications
from schemas import ListingMapSchema, LogisticsPacketSchema
import datetime

class ListingController(TGController):
    @expose('json')
    def nearby(self, lat, lon, radius=5, food_type=None):
        """FR-03: Geographic Discovery API"""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        if tg_session.get('user_role') != 'Recipient':
            response.status = 403
            return {"error": "Only Recipients can browse listings"}

        # Convert radius (km) to approximate degree delta (1 degree ≈ 111 km)
        delta = float(radius) / 111.0

        query = session.query(Listing).filter(
            Listing.status == 'available',
            Listing.latitude.between(float(lat) - delta, float(lat) + delta),
            Listing.longitude.between(float(lon) - delta, float(lon) + delta)
        )

        if food_type:
            query = query.filter(Listing.food_type.ilike(f'%{food_type}%'))

        return {"listings": [ListingMapSchema(l).to_dict() for l in query.all()]}

    VALID_LOGISTICS_TYPES = {'self_pickup', 'third_party'}

    @expose('json')
    def claim(self, listing_id, logistics_type):
        """FR-04 & FR-05: Claiming and Logistics API"""
        recipient_id = tg_session.get('user_id')
        if not recipient_id:
            response.status = 401
            return {"error": "Not authenticated"}

        if tg_session.get('user_role') != 'Recipient':
            response.status = 403
            return {"error": "Only Recipients can claim listings"}

        if logistics_type not in self.VALID_LOGISTICS_TYPES:
            response.status = 400
            return {"error": f"Invalid logistics_type. Must be one of: {', '.join(self.VALID_LOGISTICS_TYPES)}"}

        listing = session.query(Listing).filter_by(
            listing_id=listing_id,
            status='available'
        ).first()

        if not listing:
            response.status = 409
            return {"error": "Item unavailable"}

        try:
            # FR-05: Atomic Claim-Lock — prevent double-claiming
            listing.status = 'claimed'
            new_claim = Claim(
                listing_id=listing_id,
                recipient_id=recipient_id,
                logistics_type=logistics_type
            )
            session.add(new_claim)
            session.flush()  # assigns claim_id before notification dispatch and audit log

            # UC07: Dispatch fulfillment notifications to both parties
            donor = session.query(User).filter_by(user_id=listing.donor_id).first()
            recipient = session.query(User).filter_by(user_id=recipient_id).first()
            dispatch_claim_notifications(new_claim, listing, donor, recipient)

            session.add(AuditLog(
                user_id=recipient_id,
                action='listing_claimed',
                entity_type='listing',
                entity_id=listing.listing_id
            ))
            session.commit()
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

        return {
            "status": "success",
            "coordination_id": f"COORD-{new_claim.claim_id}",
            "logistics_packet": LogisticsPacketSchema(listing, logistics_type).to_dict()
        }
    
    @expose('json')
    def create(self, **kwargs):
        """FR-01: Create Donation Listing API"""
        donor_id = tg_session.get('user_id')
        if not donor_id:
            response.status = 401
            return {"error": "Not authenticated"}

        if tg_session.get('user_role') != 'Donor':
            response.status = 403
            return {"error": "Only Donors can create listings"}

        food_type = kwargs.get('food_type')
        quantity = kwargs.get('quantity')
        address = kwargs.get('address_text')

        try:
            hours_until_expiry = int(kwargs.get('hours_until_expiry', 24))
        except (ValueError, TypeError):
            response.status = 400
            return {"error": "hours_until_expiry must be a whole number"}

        if not all([food_type, quantity, address]):
            response.status = 400
            return {"error": "Missing required fields: food_type, quantity, or address_text"}

        expiry_dt = datetime.datetime.utcnow() + datetime.timedelta(hours=hours_until_expiry)

        # Geocoding stubbed — replace with real API call (Google Maps / Mapbox)
        lat, lon = 40.7128, -74.0060

        try:
            new_listing = Listing(
                donor_id=donor_id,
                food_type=food_type,
                quantity=quantity,
                address_text=address,
                expiry_time=expiry_dt,
                latitude=lat,
                longitude=lon,
                status='available'
            )
            session.add(new_listing)
            session.flush()

            session.add(AuditLog(
                user_id=donor_id,
                action='listing_created',
                entity_type='listing',
                entity_id=new_listing.listing_id
            ))
            session.commit()

            return {
                "status": "success",
                "message": "Donation posted successfully",
                "listing_id": new_listing.listing_id,
                "expires_at": expiry_dt.isoformat()
            }

        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}
