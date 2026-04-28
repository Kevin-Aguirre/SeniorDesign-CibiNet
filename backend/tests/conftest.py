"""
Test harness for SSDS Section 16.1 system test cases (TC01–TC10).

Tests run against the live backend server expected to be running on
http://localhost:8080. Per the SSDS, no DB mocks are used; the suite
reseeds the real database once at the start of the session.
"""
import os
import sys
import socket
import pytest
import requests

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import db_seed
from model import Session

BASE_URL = os.environ.get('CIBINET_TEST_BASE_URL', 'http://localhost:8080')
API = f"{BASE_URL}/api"

DONOR_EMAIL = "kevins_bakery@example.com"
DONOR2_EMAIL = "greenmarket_grocery@example.com"
RECIPIENT_EMAIL = "downtown_foodbank@example.com"
RECIPIENT2_EMAIL = "eastside_shelter@example.com"
ADMIN_EMAIL = "admin@example.com"
PASSWORD = "password123"


def _server_reachable():
    host, port = BASE_URL.replace('http://', '').replace('https://', '').split(':')
    try:
        with socket.create_connection((host, int(port)), timeout=1):
            return True
    except OSError:
        return False


@pytest.fixture(scope='session', autouse=True)
def fresh_database():
    """Reseed the database once before any test runs."""
    if not _server_reachable():
        pytest.skip(f"Backend not running at {BASE_URL}")
    db_seed.seed_data()
    yield


@pytest.fixture
def client():
    """Return a fresh requests.Session (isolated cookie jar per test)."""
    s = requests.Session()
    return s


def login(client, email, password=PASSWORD):
    r = client.post(f"{API}/auth/login", data={"email": email, "password": password})
    assert r.status_code == 200, f"login failed for {email}: {r.text}"
    return r.json()


@pytest.fixture
def donor_client(client):
    login(client, DONOR_EMAIL)
    return client


@pytest.fixture
def recipient_client(client):
    login(client, RECIPIENT_EMAIL)
    return client


@pytest.fixture
def admin_client(client):
    login(client, ADMIN_EMAIL)
    return client


@pytest.fixture
def db_session():
    """Direct DB session for test setup (e.g., forcing expiry times)."""
    s = Session()
    yield s
    s.close()
