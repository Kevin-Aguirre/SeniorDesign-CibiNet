from sqlalchemy import create_engine
from model import Base  # Ensure your model.py is in the same folder

# Use three slashes for a relative path (standard for SQLite)
DB_URL = "sqlite:///cibinet_dev.db"

def initialize_database():
    print(f"--- CibiNet Database Initialization ---")
    engine = create_engine(DB_URL, echo=True)
    
    print("Checking for existing tables and creating new ones...")
    
    Base.metadata.create_all(engine)
    
    print("--- Initialization Complete! ---")
    print("File created: cibinet_dev.db")

if __name__ == "__main__":
    initialize_database()