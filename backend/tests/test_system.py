"""
SSDS Section 16.1 — System Test Cases TC01 through TC10.

Each test maps 1:1 to the SSDS test plan. Run order matters: a few cases
share state set up by earlier ones (TC05 claim referenced by TC06 and TC08).
Pytest's default file order preserves the TC01..TC10 sequence.

Usage:
    cd backend
    python db_seed.py              # one-time, conftest will reseed anyway
    python main.py                 # in another terminal
    pytest tests/                  # from this terminal
"""
import datetime
import pytest
import requests

from tests.conftest import (
    API,
    login,
    DONOR_EMAIL,
    DONOR2_EMAIL,
    RECIPIENT_EMAIL,
    RECIPIENT2_EMAIL,
    ADMIN_EMAIL,
)
from model import Listing


CLAIM_TARGET_FOOD = "Sourdough Bread"


def _find_available_listing_id(client, food_type=None):
    r = client.get(f"{API}/listings/nearby", params={"lat": 40.7128, "lon": -74.0060, "radius": 10})
    assert r.status_code == 200, r.text
    listings = r.json().get("listings", [])
    if food_type:
        listings = [l for l in listings if l.get("food") == food_type]
    assert listings, f"no available listing found (food_type={food_type})"
    return listings[0]["id"]


# ---------------------------------------------------------------------------
# TC01 — User Authentication (FR-01, UC01)
# ---------------------------------------------------------------------------
def test_TC01_user_authentication(client):
    body = login(client, DONOR_EMAIL)
    assert body["status"] == "success"
    assert body["user"]["role"] == "Donor"
    assert any(c.name == "cibinet_session" for c in client.cookies)


# ---------------------------------------------------------------------------
# TC02 — Invalid Credentials Rejection (FR-01, UC01 alt flow)
# ---------------------------------------------------------------------------
def test_TC02_invalid_credentials(client):
    r = client.post(f"{API}/auth/login", data={"email": DONOR_EMAIL, "password": "wrong"})
    assert r.status_code == 401
    assert "error" in r.json()


# ---------------------------------------------------------------------------
# TC03 — Create Donation Listing (FR-02, UC02)
# ---------------------------------------------------------------------------
def test_TC03_create_listing(donor_client):
    r = donor_client.post(f"{API}/listings/create", data={
        "food_type": "Test Bagels",
        "quantity": "12 Dozen",
        "address_text": "1 World Trade Center, New York, NY",
        "hours_until_expiry": "12",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    assert "listing_id" in body
    listing_id = body["listing_id"]

    r2 = donor_client.get(f"{API}/users/my_listings")
    assert r2.status_code == 200
    ids = [l["listing_id"] for l in r2.json()["listings"]]
    assert listing_id in ids


# ---------------------------------------------------------------------------
# TC04 — Geographic Discovery (FR-03, UC03) + NFR-03 address obfuscation
# ---------------------------------------------------------------------------
def test_TC04_geographic_discovery(recipient_client):
    r = recipient_client.get(f"{API}/listings/nearby", params={
        "lat": 40.7128, "lon": -74.0060, "radius": 5,
    })
    assert r.status_code == 200
    listings = r.json()["listings"]
    assert len(listings) > 0, "expected seeded listings within 5 mi of NYC"
    for l in listings:
        assert "address_text" not in l, f"NFR-03 violated — address leaked: {l}"


# ---------------------------------------------------------------------------
# TC05 — Atomic Donation Claiming (FR-05, UC05)
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def shared_claim_state():
    return {}


def test_TC05_atomic_claim(client, shared_claim_state):
    login(client, RECIPIENT_EMAIL)
    listing_id = _find_available_listing_id(client, food_type=CLAIM_TARGET_FOOD)
    r = client.post(f"{API}/listings/claim", data={
        "listing_id": listing_id,
        "logistics_type": "self_pickup",
    })
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "success"
    assert "coordination_id" in body
    shared_claim_state["listing_id"] = listing_id
    shared_claim_state["coordination_id"] = body["coordination_id"]

    r2 = client.get(f"{API}/listings/nearby", params={"lat": 40.7128, "lon": -74.0060, "radius": 10})
    visible_ids = [l["id"] for l in r2.json()["listings"]]
    assert listing_id not in visible_ids, "claimed listing still appears in discovery"


# ---------------------------------------------------------------------------
# TC06 — Double-Claim Prevention (FR-05, UC05 alt flow)
# ---------------------------------------------------------------------------
def test_TC06_double_claim_prevention(client, shared_claim_state):
    listing_id = shared_claim_state.get("listing_id")
    assert listing_id, "TC05 must run before TC06"
    login(client, RECIPIENT2_EMAIL)
    r = client.post(f"{API}/listings/claim", data={
        "listing_id": listing_id,
        "logistics_type": "self_pickup",
    })
    assert r.status_code == 409, f"expected 409 conflict, got {r.status_code}"
    assert "Item unavailable" in r.json().get("error", "")


# ---------------------------------------------------------------------------
# TC07 — Automated Safety Pruning (FR-06, UC06)
# ---------------------------------------------------------------------------
def test_TC07_automated_safety_pruning(client, db_session):
    login(client, DONOR2_EMAIL)
    r = client.post(f"{API}/listings/create", data={
        "food_type": "Expiring Salad",
        "quantity": "5 Bowls",
        "address_text": "1 World Trade Center, New York, NY",
        "hours_until_expiry": "1",
    })
    assert r.status_code == 200, r.text
    listing_id = r.json()["listing_id"]

    listing = db_session.query(Listing).filter_by(listing_id=listing_id).first()
    listing.expiry_time = datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    db_session.commit()

    rc = client.post(f"{API}/system/cleanup")
    assert rc.status_code == 200
    assert rc.json()["expired_items_removed"] >= 1

    db_session.expire_all()
    refreshed = db_session.query(Listing).filter_by(listing_id=listing_id).first()
    assert refreshed.status == "expired"

    login(client, RECIPIENT_EMAIL)
    rn = client.get(f"{API}/listings/nearby", params={"lat": 40.7128, "lon": -74.0060, "radius": 10})
    visible_ids = [l["id"] for l in rn.json()["listings"]]
    assert listing_id not in visible_ids


# ---------------------------------------------------------------------------
# TC08 — Notification Dispatch (FR-07, UC07)
# ---------------------------------------------------------------------------
def test_TC08_notification_dispatch(client, shared_claim_state):
    coord = shared_claim_state.get("coordination_id")
    assert coord, "TC05 must run before TC08"

    login(client, DONOR_EMAIL)
    rd = client.get(f"{API}/notifications/mine")
    assert rd.status_code == 200
    donor_notifs = rd.json()["notifications"]
    assert any(
        n["type"] == "claim_received" and coord in n.get("message", "")
        for n in donor_notifs
    ), f"donor missing claim_received notification with {coord}"

    login(client, RECIPIENT_EMAIL)
    rr = client.get(f"{API}/notifications/mine")
    assert rr.status_code == 200
    recipient_notifs = rr.json()["notifications"]
    assert any(
        n["type"] == "claim_confirmed" and coord in n.get("message", "")
        for n in recipient_notifs
    ), f"recipient missing claim_confirmed notification with {coord}"


# ---------------------------------------------------------------------------
# TC09 — Role Enforcement (NFR-03)
# ---------------------------------------------------------------------------
def test_TC09_role_enforcement(client):
    login(client, DONOR_EMAIL)
    r1 = client.post(f"{API}/listings/claim", data={
        "listing_id": 1,
        "logistics_type": "self_pickup",
    })
    assert r1.status_code == 403
    assert "error" in r1.json()

    client.cookies.clear()
    login(client, RECIPIENT_EMAIL)
    r2 = client.post(f"{API}/listings/create", data={
        "food_type": "X",
        "quantity": "1",
        "address_text": "1 World Trade Center, New York, NY",
        "hours_until_expiry": "1",
    })
    assert r2.status_code == 403
    assert "error" in r2.json()


# ---------------------------------------------------------------------------
# TC10 — Audit Log Integrity
# ---------------------------------------------------------------------------
def test_TC10_audit_log_integrity(admin_client):
    r = admin_client.get(f"{API}/system/audit_log", params={"limit": 200})
    assert r.status_code == 200, r.text
    actions = {entry["action"] for entry in r.json()["audit_log"]}
    assert "listing_created" in actions
    assert "listing_claimed" in actions
