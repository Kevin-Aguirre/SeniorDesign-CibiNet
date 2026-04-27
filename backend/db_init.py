from sqlalchemy import create_engine
from model import Base, DB_URL

def initialize_database():
    print(f"--- CibiNet Database Initialization ---")
    print(f"Connecting to: {DB_URL}")
    engine = create_engine(DB_URL, echo=True)

    print("Checking for existing tables and creating new ones...")

    Base.metadata.create_all(engine)

    print("--- Initialization Complete! ---")

if __name__ == "__main__":
    initialize_database()
