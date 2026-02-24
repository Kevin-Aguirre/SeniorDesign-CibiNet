from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from model import Base, User, Listing
import datetime

# 1. Setup the connection
DB_URL = "sqlite:///cibinet_dev.db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()

def seed_data():
    print("Seeding CibiNet database...")

    # 2. Create a Test Donor
    donor = User(
        email="kevin_bakery@example.com",
        password_hash="hashed_pw_123", # In real app, use bcrypt
        role="Donor"
    )
    
    # 3. Create a Test Recipient
    recipient = User(
        email="downtown_foodbank@example.com",
        password_hash="hashed_pw_456",
        role="Recipient"
    )

    session.add(donor)
    session.add(recipient)
    session.commit() # Commit to get IDs

    # 4. Create Sample Food Listings (For Discovery Testing)
    listing1 = Listing(
        donor_id=donor.user_id,
        food_type="Sourdough Bread",
        quantity="15 Loaves",
        status="available",
        expiry_time=datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=1),
        latitude=40.7128,  # NYC coordinates for testing
        longitude=-74.0060,
        address_text="123 Baker St, New York, NY"
    )

    listing2 = Listing(
        donor_id=donor.user_id,
        food_type="Mixed Vegetables",
        quantity="2 Crates",
        status="available",
        expiry_time=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=6),
        latitude=40.7306,
        longitude=-73.9352,
        address_text="456 Market Ave, Brooklyn, NY"
    )

    session.add_all([listing1, listing2])
    session.commit()

    print(f"Successfully added {session.query(User).count()} users and {session.query(Listing).count()} listings.")

if __name__ == "__main__":
    seed_data()