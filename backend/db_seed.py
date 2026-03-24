from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from model import Base, User, Listing, Claim, Notification, AuditLog
import datetime
import hashlib

DB_URL = "sqlite:///cibinet_dev.db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()


def hash_pw(plain):
    return hashlib.sha256(plain.encode()).hexdigest()


def clear_all():
    """Delete all rows in dependency order before re-seeding."""
    session.query(AuditLog).delete()
    session.query(Notification).delete()
    session.query(Claim).delete()
    session.query(Listing).delete()
    session.query(User).delete()
    session.commit()


def seed_data():
    print("--- CibiNet Seed ---")
    clear_all()

    # ------------------------------------------------------------------
    # USERS
    # All accounts use password: "password123"
    # ------------------------------------------------------------------
    donor1 = User(
        email="kevins_bakery@example.com",
        password_hash=hash_pw("password123"),
        role="Donor"
    )
    donor2 = User(
        email="greenmarket_grocery@example.com",
        password_hash=hash_pw("password123"),
        role="Donor"
    )
    recipient1 = User(
        email="downtown_foodbank@example.com",
        password_hash=hash_pw("password123"),
        role="Recipient"
    )
    recipient2 = User(
        email="eastside_shelter@example.com",
        password_hash=hash_pw("password123"),
        role="Recipient"
    )

    session.add_all([donor1, donor2, recipient1, recipient2])
    session.commit()

    now = datetime.datetime.utcnow()

    # ------------------------------------------------------------------
    # LISTINGS
    # ------------------------------------------------------------------

    # Available — for GET /api/listings/nearby and POST /api/listings/claim
    listing1 = Listing(
        donor_id=donor1.user_id,
        food_type="Sourdough Bread",
        quantity="15 Loaves",
        status="available",
        expiry_time=now + datetime.timedelta(hours=24),
        latitude=40.7128,
        longitude=-74.0060,
        address_text="123 Baker St, New York, NY"
    )
    listing2 = Listing(
        donor_id=donor1.user_id,
        food_type="Mixed Vegetables",
        quantity="2 Crates",
        status="available",
        expiry_time=now + datetime.timedelta(hours=6),
        latitude=40.7150,
        longitude=-74.0080,
        address_text="456 Market Ave, New York, NY"
    )
    listing3 = Listing(
        donor_id=donor2.user_id,
        food_type="Canned Soup",
        quantity="48 Cans",
        status="available",
        expiry_time=now + datetime.timedelta(hours=48),
        latitude=40.7200,
        longitude=-74.0020,
        address_text="789 Greenmarket Blvd, New York, NY"
    )

    # Claimed by recipient1 — for GET /api/claims/mine, /view, /acknowledge
    listing4 = Listing(
        donor_id=donor2.user_id,
        food_type="Pasta and Sauce",
        quantity="30 Units",
        status="claimed",
        expiry_time=now + datetime.timedelta(hours=12),
        latitude=40.7306,
        longitude=-73.9352,
        address_text="10 Fulton St, Brooklyn, NY"
    )

    # Claimed by recipient2 — for POST /api/claims/cancel
    listing5 = Listing(
        donor_id=donor2.user_id,
        food_type="Bottled Water",
        quantity="4 Cases (96 Bottles)",
        status="claimed",
        expiry_time=now + datetime.timedelta(hours=24),
        latitude=40.7282,
        longitude=-73.9942,
        address_text="55 Water St, New York, NY"
    )

    # Available but already expired — for GET /api/system/cleanup
    listing6 = Listing(
        donor_id=donor1.user_id,
        food_type="Wilted Salad Greens",
        quantity="3 Bags",
        status="available",
        expiry_time=now - datetime.timedelta(hours=2),
        latitude=40.7128,
        longitude=-74.0060,
        address_text="123 Baker St, New York, NY"
    )

    session.add_all([listing1, listing2, listing3, listing4, listing5, listing6])
    session.commit()

    # ------------------------------------------------------------------
    # CLAIMS
    # ------------------------------------------------------------------

    # Claim on listing4 by recipient1 (safety_ack=False — ready for /acknowledge)
    claim1 = Claim(
        listing_id=listing4.listing_id,
        recipient_id=recipient1.user_id,
        logistics_type="self_pickup",
        safety_ack_received=False,
        claimed_at=now - datetime.timedelta(minutes=30)
    )

    # Claim on listing5 by recipient2 (ready for /cancel)
    claim2 = Claim(
        listing_id=listing5.listing_id,
        recipient_id=recipient2.user_id,
        logistics_type="third_party",
        safety_ack_received=False,
        claimed_at=now - datetime.timedelta(minutes=10)
    )

    session.add_all([claim1, claim2])
    session.commit()

    # ------------------------------------------------------------------
    # NOTIFICATIONS
    # Mirrors what dispatch_claim_notifications() would have produced
    # for the two pre-seeded claims above.
    # ------------------------------------------------------------------

    # Notifications for claim1 (Pasta and Sauce)
    coord1 = f"COORD-{claim1.claim_id}"
    session.add(Notification(
        user_id=donor2.user_id,
        type="claim_received",
        message_body=(
            f"Your listing 'Pasta and Sauce' (Qty: 30 Units) has been claimed. "
            f"Coordination ID: {coord1}. "
            f"Recipient contact: {recipient1.email}. "
            f"Fulfillment method: self_pickup."
        )
    ))
    session.add(Notification(
        user_id=recipient1.user_id,
        type="claim_confirmed",
        message_body=(
            f"You have successfully claimed 'Pasta and Sauce' (Qty: 30 Units). "
            f"Coordination ID: {coord1}. "
            f"Donor contact: {donor2.email}. "
            f"Pickup address: 10 Fulton St, Brooklyn, NY. "
            f"Fulfillment method: self_pickup."
        )
    ))

    # Notifications for claim2 (Bottled Water)
    coord2 = f"COORD-{claim2.claim_id}"
    session.add(Notification(
        user_id=donor2.user_id,
        type="claim_received",
        message_body=(
            f"Your listing 'Bottled Water' (Qty: 4 Cases (96 Bottles)) has been claimed. "
            f"Coordination ID: {coord2}. "
            f"Recipient contact: {recipient2.email}. "
            f"Fulfillment method: third_party."
        )
    ))
    session.add(Notification(
        user_id=recipient2.user_id,
        type="claim_confirmed",
        message_body=(
            f"You have successfully claimed 'Bottled Water' (Qty: 4 Cases (96 Bottles)). "
            f"Coordination ID: {coord2}. "
            f"Donor contact: {donor2.email}. "
            f"Pickup address: 55 Water St, New York, NY. "
            f"Fulfillment method: third_party."
        )
    ))

    session.commit()

    # ------------------------------------------------------------------
    # AUDIT LOGS
    # Mirrors what the controllers would have written for the pre-seeded
    # listings and claims above.
    # ------------------------------------------------------------------
    session.add_all([
        AuditLog(user_id=donor1.user_id, action='listing_created',
                 entity_type='listing', entity_id=listing1.listing_id),
        AuditLog(user_id=donor1.user_id, action='listing_created',
                 entity_type='listing', entity_id=listing2.listing_id),
        AuditLog(user_id=donor2.user_id, action='listing_created',
                 entity_type='listing', entity_id=listing3.listing_id),
        AuditLog(user_id=donor2.user_id, action='listing_created',
                 entity_type='listing', entity_id=listing4.listing_id),
        AuditLog(user_id=donor2.user_id, action='listing_created',
                 entity_type='listing', entity_id=listing5.listing_id),
        AuditLog(user_id=donor1.user_id, action='listing_created',
                 entity_type='listing', entity_id=listing6.listing_id),
        AuditLog(user_id=recipient1.user_id, action='listing_claimed',
                 entity_type='listing', entity_id=listing4.listing_id),
        AuditLog(user_id=recipient2.user_id, action='listing_claimed',
                 entity_type='listing', entity_id=listing5.listing_id),
    ])
    session.commit()

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print("\n=== Seed complete ===")
    print(f"  Users:         {session.query(User).count()}")
    print(f"  Listings:      {session.query(Listing).count()}")
    print(f"  Claims:        {session.query(Claim).count()}")
    print(f"  Notifications: {session.query(Notification).count()}")
    print(f"  Audit logs:    {session.query(AuditLog).count()}")

    print("\n=== Test credentials (all passwords: 'password123') ===")
    print(f"  Donor 1     (has listings 1-2, 6):  {donor1.email}")
    print(f"  Donor 2     (has listings 3-5):      {donor2.email}")
    print(f"  Recipient 1 (claim {claim1.claim_id} on listing {listing4.listing_id}): {recipient1.email}")
    print(f"  Recipient 2 (claim {claim2.claim_id} on listing {listing5.listing_id}): {recipient2.email}")

    print("\n=== Endpoint coverage ===")
    print("  POST /api/auth/login          → use any credential above")
    print("  GET  /api/users/me            → login first, then call")
    print(f"  GET  /api/users/my_listings   → login as {donor1.email}")
    print(f"  GET  /api/listings/nearby     → lat=40.7128&lon=-74.0060  (3 available results)")
    print(f"  POST /api/listings/create     → login as a Donor")
    print(f"  POST /api/listings/claim      → login as a Recipient, use listing_id={listing1.listing_id}")
    print(f"  GET  /api/claims/mine         → login as {recipient1.email}")
    print(f"  GET  /api/claims/view         → claim_id={claim1.claim_id}")
    print(f"  POST /api/claims/acknowledge  → claim_id={claim1.claim_id} (safety_ack=False)")
    print(f"  POST /api/claims/cancel       → login as {recipient2.email}, claim_id={claim2.claim_id}")
    print(f"  GET  /api/notifications/mine  → login as {recipient1.email} or {donor2.email}")
    print(f"  GET  /api/system/cleanup      → listing_id={listing6.listing_id} (expired, status=available)")
    print(f"  GET  /api/system/audit_log    → returns recent audit log entries")


if __name__ == "__main__":
    seed_data()
