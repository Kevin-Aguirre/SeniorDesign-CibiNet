from tg import expose, TGController, AppConfig, request, response
from wsgiref.simple_server import make_server
from model import session, Listing, User, Claim
import datetime

class ListingController(TGController):
    @expose('json')
    def nearby(self, lat, lon, radius=5):
        """FR-02: Discovery API"""
        # Logic to find available food within a coordinate box
        results = session.query(Listing).filter(
            Listing.status == 'available',
            Listing.latitude.between(float(lat)-0.1, float(lat)+0.1)
        ).all()
        return {"listings": [
            {
                "id": l.listing_id, 
                "food": l.food_type, 
                "lat": float(l.latitude), 
                "lon": float(l.longitude)
            } for l in results
        ]}

    @expose('json')
    def claim(self, listing_id, logistics_type):
        """FR-04 & FR-03: Claiming and Logistics API"""
        listing = session.query(Listing).filter_by(
            listing_id=listing_id, 
            status='available'
        ).first()
        
        if not listing:
            response.status = 409 
            return {"error": "Item unavailable"}

        # Perform the atomic "Handshake"
        listing.status = 'claimed'
        
        # Note: In a real app, request.identity comes from auth middleware
        # For now, we'll assume a test user ID of 1
        new_claim = Claim(
            listing_id=listing_id,
            recipient_id=1, 
            logistics_type=logistics_type
        )
        session.add(new_claim)
        session.commit()
        
        return {
            "status": "success", 
            "logistics_packet": {"address": listing.address_text}
        }
    
    @expose('json')
    def create(self, **kwargs):
        """FR-01: Create Donation Listing API"""
        # 1. Extract data from the request (supports JSON or Form-data)
        # In a real app, you'd get donor_id from the session/token
        donor_id = kwargs.get('donor_id', 1) 
        food_type = kwargs.get('food_type')
        quantity = kwargs.get('quantity')
        address = kwargs.get('address_text')
        hours_until_expiry = int(kwargs.get('hours_until_expiry', 24))

        # 2. Basic Validation (Consistency Check)
        if not all([food_type, quantity, address]):
            response.status = 400
            return {"error": "Missing required fields: food_type, quantity, or address_text"}

        # 3. Calculate Expiry (FR-05 logic preparation)
        expiry_dt = datetime.datetime.utcnow() + datetime.timedelta(hours=hours_until_expiry)

        # 4. Simulated Geocoding (FR-02 prerequisite)
        # In production, call Google Maps or MapBox API here
        lat, lon = 40.7128, -74.0060 

        try:
            # 5. Create the database record based on our SSDS Schema
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
