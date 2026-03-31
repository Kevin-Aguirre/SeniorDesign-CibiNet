from tg import expose, TGController, session as tg_session, response
from model import session, Listing, User, Claim, AuditLog
from .notifications import dispatch_claim_notifications
from schemas import ListingMapSchema, ListingSchema, LogisticsPacketSchema
import datetime
import urllib.request
import urllib.parse
import json
import uuid
import os

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')


def geocode_address(address_text):
    """Geocode an address using OpenStreetMap Nominatim (free, no API key required)."""
    params = urllib.parse.urlencode({
        'q': address_text,
        'format': 'json',
        'limit': 1
    })
    url = f"https://nominatim.openstreetmap.org/search?{params}"
    req = urllib.request.Request(url, headers={'User-Agent': 'CibiNet/1.0 (senior-design-project)'})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception:
        pass
    return 40.7128, -74.0060


def save_upload(file_field):
    """Save an uploaded file and return the generated filename, or None."""
    if not file_field or not hasattr(file_field, 'file'):
        return None
    original = getattr(file_field, 'filename', 'upload.jpg')
    ext = os.path.splitext(original)[1].lower()
    if ext not in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}:
        return None
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, safe_name)
    with open(filepath, 'wb') as f:
        f.write(file_field.file.read())
    return safe_name


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

        delta = float(radius) / 111.0
        now = datetime.datetime.utcnow()

        query = session.query(Listing).filter(
            Listing.status == 'available',
            Listing.expiry_time > now,
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
            listing.status = 'claimed'
            new_claim = Claim(
                listing_id=listing_id,
                recipient_id=recipient_id,
                logistics_type=logistics_type
            )
            session.add(new_claim)
            session.flush()

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

        lat, lon = geocode_address(address)
        image_filename = save_upload(kwargs.get('image'))

        try:
            new_listing = Listing(
                donor_id=donor_id,
                food_type=food_type,
                quantity=quantity,
                address_text=address,
                expiry_time=expiry_dt,
                latitude=lat,
                longitude=lon,
                status='available',
                image_filename=image_filename
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

    @expose('json')
    def detail(self, listing_id):
        """Get a single listing by ID (donor must own it)."""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        listing = session.query(Listing).filter_by(listing_id=listing_id).first()
        if not listing:
            response.status = 404
            return {"error": "Listing not found"}

        if listing.donor_id != user_id:
            response.status = 403
            return {"error": "Access denied"}

        return ListingSchema(listing).to_dict()

    @expose('json')
    def update(self, **kwargs):
        """Update an existing listing (donor-only, available listings only)."""
        donor_id = tg_session.get('user_id')
        if not donor_id:
            response.status = 401
            return {"error": "Not authenticated"}

        if tg_session.get('user_role') != 'Donor':
            response.status = 403
            return {"error": "Only Donors can update listings"}

        listing_id = kwargs.get('listing_id')
        if not listing_id:
            response.status = 400
            return {"error": "listing_id is required"}

        listing = session.query(Listing).filter_by(
            listing_id=listing_id, donor_id=donor_id
        ).first()
        if not listing:
            response.status = 404
            return {"error": "Listing not found or access denied"}

        if listing.status != 'available':
            response.status = 400
            return {"error": "Can only edit available listings"}

        try:
            food_type = kwargs.get('food_type')
            quantity = kwargs.get('quantity')
            address = kwargs.get('address_text')

            if food_type:
                listing.food_type = food_type
            if quantity:
                listing.quantity = quantity
            if address and address != listing.address_text:
                listing.address_text = address
                lat, lon = geocode_address(address)
                listing.latitude = lat
                listing.longitude = lon

            hours = kwargs.get('hours_until_expiry')
            if hours:
                listing.expiry_time = datetime.datetime.utcnow() + datetime.timedelta(hours=int(hours))

            new_image = save_upload(kwargs.get('image'))
            if new_image:
                if listing.image_filename:
                    old_path = os.path.join(UPLOAD_DIR, listing.image_filename)
                    if os.path.isfile(old_path):
                        os.remove(old_path)
                listing.image_filename = new_image

            session.add(AuditLog(
                user_id=donor_id,
                action='listing_updated',
                entity_type='listing',
                entity_id=listing.listing_id
            ))
            session.commit()
            return {"status": "success", "message": "Listing updated"}

        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def delete(self, listing_id):
        """Delete a listing (donor-only, cannot delete claimed listings)."""
        donor_id = tg_session.get('user_id')
        if not donor_id:
            response.status = 401
            return {"error": "Not authenticated"}

        if tg_session.get('user_role') != 'Donor':
            response.status = 403
            return {"error": "Only Donors can delete listings"}

        listing = session.query(Listing).filter_by(
            listing_id=listing_id, donor_id=donor_id
        ).first()
        if not listing:
            response.status = 404
            return {"error": "Listing not found or access denied"}

        if listing.status == 'claimed':
            response.status = 400
            return {"error": "Cannot delete a claimed listing"}

        try:
            if listing.image_filename:
                img_path = os.path.join(UPLOAD_DIR, listing.image_filename)
                if os.path.isfile(img_path):
                    os.remove(img_path)

            deleted_id = listing.listing_id
            session.delete(listing)
            session.add(AuditLog(
                user_id=donor_id,
                action='listing_deleted',
                entity_type='listing',
                entity_id=deleted_id
            ))
            session.commit()
            return {"status": "success", "message": "Listing deleted"}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}
