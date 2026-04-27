from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from model import Base, User, Listing, Claim, Notification, AuditLog, ClaimDispute, SuspiciousActivity, DB_URL
import datetime
import hashlib

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()


def hash_pw(plain):
    return hashlib.sha256(plain.encode()).hexdigest()


def clear_all():
    """Delete all rows in dependency order before re-seeding."""
    session.query(SuspiciousActivity).delete()
    session.query(ClaimDispute).delete()
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
    admin1 = User(
        email="admin@example.com",
        password_hash=hash_pw("password123"),
        role="Admin",
        is_verified=True
    )

    session.add_all([donor1, donor2, recipient1, recipient2, admin1])
    session.commit()

    now = datetime.datetime.utcnow()

    # ------------------------------------------------------------------
    # LISTINGS
    # ------------------------------------------------------------------

    # --- Available listings (for /api/listings/nearby and /api/listings/claim) ---
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
    listing7 = Listing(
        donor_id=donor1.user_id,
        food_type="Croissants & Pastries",
        quantity="40 Pieces",
        status="available",
        expiry_time=now + datetime.timedelta(hours=10),
        latitude=40.7138,
        longitude=-74.0070,
        address_text="123 Baker St, New York, NY"
    )
    listing8 = Listing(
        donor_id=donor2.user_id,
        food_type="Fresh Apples",
        quantity="6 Bushels",
        status="available",
        expiry_time=now + datetime.timedelta(hours=72),
        latitude=40.7180,
        longitude=-74.0010,
        address_text="789 Greenmarket Blvd, New York, NY"
    )
    listing9 = Listing(
        donor_id=donor2.user_id,
        food_type="Yogurt Cups",
        quantity="60 Cups",
        status="available",
        expiry_time=now + datetime.timedelta(hours=18),
        latitude=40.7220,
        longitude=-74.0035,
        address_text="201 Dairy Way, New York, NY"
    )
    listing10 = Listing(
        donor_id=donor1.user_id,
        food_type="Whole Wheat Rolls",
        quantity="24 Rolls",
        status="available",
        expiry_time=now + datetime.timedelta(hours=4),
        latitude=40.7132,
        longitude=-74.0062,
        address_text="123 Baker St, New York, NY"
    )

    # --- Claimed listings ---
    # Claimed by recipient1, awaiting safety acknowledgement
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
    # Claimed by recipient2, ready for /cancel demo
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
    # Already-acknowledged claim by recipient1 (third-party delivery)
    listing11 = Listing(
        donor_id=donor1.user_id,
        food_type="Frozen Lasagna Trays",
        quantity="12 Trays",
        status="claimed",
        expiry_time=now + datetime.timedelta(hours=36),
        latitude=40.7160,
        longitude=-74.0090,
        address_text="312 Freezer Rd, New York, NY"
    )
    # Acknowledged claim by recipient2 (self pickup)
    listing12 = Listing(
        donor_id=donor2.user_id,
        food_type="Granola Bars",
        quantity="200 Bars",
        status="claimed",
        expiry_time=now + datetime.timedelta(days=5),
        latitude=40.7240,
        longitude=-74.0000,
        address_text="901 Snack Ln, New York, NY"
    )

    # --- Expired listings ---
    # Available but past expiry — the scheduler/cleanup endpoint will flip this
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
    # Already expired (status flipped previously)
    listing13 = Listing(
        donor_id=donor2.user_id,
        food_type="Day-Old Sushi Trays",
        quantity="8 Trays",
        status="expired",
        expiry_time=now - datetime.timedelta(hours=18),
        latitude=40.7195,
        longitude=-74.0050,
        address_text="50 Pier Ave, New York, NY"
    )
    listing14 = Listing(
        donor_id=donor1.user_id,
        food_type="Stale Bagels",
        quantity="2 Dozen",
        status="expired",
        expiry_time=now - datetime.timedelta(days=1, hours=6),
        latitude=40.7140,
        longitude=-74.0075,
        address_text="123 Baker St, New York, NY"
    )

    session.add_all([
        listing1, listing2, listing3, listing4, listing5, listing6,
        listing7, listing8, listing9, listing10, listing11, listing12,
        listing13, listing14,
    ])
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

    # Already-acknowledged third-party claim by recipient1
    claim3 = Claim(
        listing_id=listing11.listing_id,
        recipient_id=recipient1.user_id,
        logistics_type="third_party",
        safety_ack_received=True,
        claimed_at=now - datetime.timedelta(hours=4)
    )

    # Already-acknowledged self-pickup claim by recipient2
    claim4 = Claim(
        listing_id=listing12.listing_id,
        recipient_id=recipient2.user_id,
        logistics_type="self_pickup",
        safety_ack_received=True,
        claimed_at=now - datetime.timedelta(hours=2)
    )

    session.add_all([claim1, claim2, claim3, claim4])
    session.commit()

    # ------------------------------------------------------------------
    # NOTIFICATIONS
    # Mirrors what dispatch_claim_notifications() produces, plus extra
    # informational/system notifications to populate the inbox view.
    # Multi-line format: rendered with `whitespace-pre-line` on the frontend.
    # ------------------------------------------------------------------

    def claim_pair(donor, recipient, listing, claim, logistics_label, donor_read, recipient_read,
                   donor_age_minutes, recipient_age_minutes):
        coord = f"COORD-{claim.claim_id}"
        donor_notif = Notification(
            user_id=donor.user_id,
            type="claim_received",
            is_read=donor_read,
            sent_at=now - datetime.timedelta(minutes=donor_age_minutes),
            message_body=(
                f"Your listing has been claimed.\n"
                f"\n"
                f"Item: {listing.food_type} ({listing.quantity})\n"
                f"Coordination ID: {coord}\n"
                f"Recipient: {recipient.email}\n"
                f"Fulfillment: {logistics_label}"
            ),
        )
        recipient_notif = Notification(
            user_id=recipient.user_id,
            type="claim_confirmed",
            is_read=recipient_read,
            sent_at=now - datetime.timedelta(minutes=recipient_age_minutes),
            message_body=(
                f"You successfully claimed a listing.\n"
                f"\n"
                f"Item: {listing.food_type} ({listing.quantity})\n"
                f"Coordination ID: {coord}\n"
                f"Donor: {donor.email}\n"
                f"Pickup address: {listing.address_text}\n"
                f"Fulfillment: {logistics_label}"
            ),
        )
        return [donor_notif, recipient_notif]

    notifications = []
    notifications += claim_pair(donor2, recipient1, listing4, claim1, "Self pickup",
                                donor_read=False, recipient_read=False,
                                donor_age_minutes=30, recipient_age_minutes=30)
    notifications += claim_pair(donor2, recipient2, listing5, claim2, "Third-party delivery",
                                donor_read=False, recipient_read=False,
                                donor_age_minutes=10, recipient_age_minutes=10)
    notifications += claim_pair(donor1, recipient1, listing11, claim3, "Third-party delivery",
                                donor_read=True, recipient_read=True,
                                donor_age_minutes=240, recipient_age_minutes=240)
    notifications += claim_pair(donor2, recipient2, listing12, claim4, "Self pickup",
                                donor_read=True, recipient_read=False,
                                donor_age_minutes=120, recipient_age_minutes=120)

    # Acknowledgement follow-ups (recipients confirmed safety)
    notifications.append(Notification(
        user_id=donor1.user_id,
        type="safety_acknowledged",
        is_read=False,
        sent_at=now - datetime.timedelta(hours=3, minutes=45),
        message_body=(
            f"Safety acknowledgement received.\n"
            f"\n"
            f"Item: Frozen Lasagna Trays (12 Trays)\n"
            f"Coordination ID: COORD-{claim3.claim_id}\n"
            f"Recipient: {recipient1.email}\n"
            f"Status: Ready for handoff"
        ),
    ))
    notifications.append(Notification(
        user_id=donor2.user_id,
        type="safety_acknowledged",
        is_read=True,
        sent_at=now - datetime.timedelta(hours=1, minutes=50),
        message_body=(
            f"Safety acknowledgement received.\n"
            f"\n"
            f"Item: Granola Bars (200 Bars)\n"
            f"Coordination ID: COORD-{claim4.claim_id}\n"
            f"Recipient: {recipient2.email}\n"
            f"Status: Ready for handoff"
        ),
    ))

    # Listing-expired alerts to donors
    notifications.append(Notification(
        user_id=donor2.user_id,
        type="listing_expired",
        is_read=False,
        sent_at=now - datetime.timedelta(hours=18),
        message_body=(
            f"One of your listings expired before being claimed.\n"
            f"\n"
            f"Item: Day-Old Sushi Trays (8 Trays)\n"
            f"Listing ID: {listing13.listing_id}\n"
            f"Reason: Past stated expiry time"
        ),
    ))
    notifications.append(Notification(
        user_id=donor1.user_id,
        type="listing_expired",
        is_read=True,
        sent_at=now - datetime.timedelta(days=1, hours=5),
        message_body=(
            f"One of your listings expired before being claimed.\n"
            f"\n"
            f"Item: Stale Bagels (2 Dozen)\n"
            f"Listing ID: {listing14.listing_id}\n"
            f"Reason: Past stated expiry time"
        ),
    ))

    # Welcome / onboarding notifications
    notifications.append(Notification(
        user_id=recipient1.user_id,
        type="welcome",
        is_read=True,
        sent_at=now - datetime.timedelta(days=2),
        message_body=(
            "Welcome to CibiNet!\n"
            "\n"
            "You can browse nearby donations on the Listings page. "
            "After claiming, please acknowledge food safety terms before pickup."
        ),
    ))
    notifications.append(Notification(
        user_id=recipient2.user_id,
        type="welcome",
        is_read=False,
        sent_at=now - datetime.timedelta(days=1, hours=8),
        message_body=(
            "Welcome to CibiNet!\n"
            "\n"
            "You can browse nearby donations on the Listings page. "
            "After claiming, please acknowledge food safety terms before pickup."
        ),
    ))

    session.add_all(notifications)
    session.commit()

    # ------------------------------------------------------------------
    # AUDIT LOGS
    # Mirrors what controllers would have written for the listings and
    # claims above, plus a few admin and system events for variety.
    # Timestamps are spread out so the audit_log endpoint shows realistic
    # ordering instead of all entries sharing the same `now`.
    # ------------------------------------------------------------------
    def audit(user_id, action, entity_type, entity_id, age_minutes):
        return AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            timestamp=now - datetime.timedelta(minutes=age_minutes),
        )

    audit_logs = [
        # listing_created — every listing
        audit(donor1.user_id, 'listing_created', 'listing', listing1.listing_id, 600),
        audit(donor1.user_id, 'listing_created', 'listing', listing2.listing_id, 540),
        audit(donor2.user_id, 'listing_created', 'listing', listing3.listing_id, 480),
        audit(donor2.user_id, 'listing_created', 'listing', listing4.listing_id, 420),
        audit(donor2.user_id, 'listing_created', 'listing', listing5.listing_id, 360),
        audit(donor1.user_id, 'listing_created', 'listing', listing6.listing_id, 300),
        audit(donor1.user_id, 'listing_created', 'listing', listing7.listing_id, 280),
        audit(donor2.user_id, 'listing_created', 'listing', listing8.listing_id, 260),
        audit(donor2.user_id, 'listing_created', 'listing', listing9.listing_id, 240),
        audit(donor1.user_id, 'listing_created', 'listing', listing10.listing_id, 220),
        audit(donor1.user_id, 'listing_created', 'listing', listing11.listing_id, 500),
        audit(donor2.user_id, 'listing_created', 'listing', listing12.listing_id, 460),
        audit(donor2.user_id, 'listing_created', 'listing', listing13.listing_id, 1500),
        audit(donor1.user_id, 'listing_created', 'listing', listing14.listing_id, 2200),

        # listing_claimed — for each claim
        audit(recipient1.user_id, 'listing_claimed', 'listing', listing4.listing_id, 30),
        audit(recipient2.user_id, 'listing_claimed', 'listing', listing5.listing_id, 10),
        audit(recipient1.user_id, 'listing_claimed', 'listing', listing11.listing_id, 240),
        audit(recipient2.user_id, 'listing_claimed', 'listing', listing12.listing_id, 120),

        # safety acknowledgements (claims 3 and 4 have safety_ack_received=True)
        audit(recipient1.user_id, 'safety_acknowledged', 'claim', claim3.claim_id, 225),
        audit(recipient2.user_id, 'safety_acknowledged', 'claim', claim4.claim_id, 110),

        # listing_updated — donor edited an existing post
        audit(donor1.user_id, 'listing_updated', 'listing', listing1.listing_id, 200),
        audit(donor2.user_id, 'listing_updated', 'listing', listing8.listing_id, 180),

        # listing_expired — system flipped past-due listings
        audit(None, 'listing_expired', 'listing', listing13.listing_id, 1080),
        audit(None, 'listing_expired', 'listing', listing14.listing_id, 1800),

        # admin actions (admin1 verified a donor and reviewed activity)
        audit(admin1.user_id, 'user_verification_updated', 'user', donor1.user_id, 1440),
        audit(admin1.user_id, 'user_verification_updated', 'user', donor2.user_id, 1300),
    ]
    session.add_all(audit_logs)
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
    print(f"  Donor 1     (listings 1, 2, 6, 7, 10, 11, 14): {donor1.email}")
    print(f"  Donor 2     (listings 3, 4, 5, 8, 9, 12, 13):   {donor2.email}")
    print(f"  Recipient 1 (claims {claim1.claim_id}, {claim3.claim_id}): {recipient1.email}")
    print(f"  Recipient 2 (claims {claim2.claim_id}, {claim4.claim_id}): {recipient2.email}")
    print(f"  Admin: {admin1.email}")

    print("\n=== Endpoint coverage ===")
    print("  POST /api/auth/login          → use any credential above")
    print("  GET  /api/users/me            → login first, then call")
    print(f"  GET  /api/users/my_listings   → login as {donor1.email}")
    print(f"  GET  /api/listings/nearby     → lat=40.7128&lon=-74.0060  (7 available results)")
    print(f"  POST /api/listings/create     → login as a Donor")
    print(f"  POST /api/listings/claim      → login as a Recipient, use listing_id={listing1.listing_id}")
    print(f"  GET  /api/claims/mine         → login as {recipient1.email}  (2 claims)")
    print(f"  GET  /api/claims/view         → claim_id={claim1.claim_id}")
    print(f"  POST /api/claims/acknowledge  → claim_id={claim1.claim_id} (safety_ack=False)")
    print(f"  POST /api/claims/cancel       → login as {recipient2.email}, claim_id={claim2.claim_id}")
    print(f"  GET  /api/notifications/mine  → login as any user (each has multiple notifications)")
    print(f"  GET  /api/system/cleanup      → listing_id={listing6.listing_id} (expired, status=available)")
    print(f"  GET  /api/system/audit_log    → returns recent audit log entries (~25 entries)")


if __name__ == "__main__":
    seed_data()
