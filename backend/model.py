from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
import datetime

Base = declarative_base()

DB_URL = "sqlite:///cibinet_dev.db"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()

class User(Base):
    __tablename__ = 'users'
    user_id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False) # 'Donor', 'Recipient', or 'Admin'
    is_verified = Column(Boolean, default=False)
    is_suspended = Column(Boolean, default=False)
    suspension_reason = Column(Text, nullable=True)
    suspended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Listing(Base):
    __tablename__ = 'listings'
    listing_id = Column(Integer, primary_key=True)
    donor_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    food_type = Column(String(100), nullable=False)
    quantity = Column(String(100), nullable=False)
    status = Column(String(20), default='available') # 'available', 'claimed', 'expired'
    expiry_time = Column(DateTime, nullable=False)
    latitude = Column(Numeric(9, 6))
    longitude = Column(Numeric(9, 6))
    address_text = Column(Text, nullable=False)
    image_filename = Column(String(255), nullable=True)
    
    donor = relationship("User", backref="listings")

class Claim(Base):
    __tablename__ = 'claims'
    claim_id = Column(Integer, primary_key=True)
    listing_id = Column(Integer, ForeignKey('listings.listing_id'), unique=True, nullable=False)
    recipient_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    logistics_type = Column(String(50), nullable=False) # 'self_pickup' or 'third_party'
    external_ref_id = Column(String(100)) # ID from external service
    safety_ack_received = Column(Boolean, default=False) # Proves Recipient accepted responsibility
    claimed_at = Column(DateTime, default=datetime.datetime.utcnow)

    listing = relationship("Listing", backref="claim")
    recipient = relationship("User")

class Notification(Base):
    __tablename__ = 'notifications'
    notification_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    type = Column(String(50), nullable=False)
    message_body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    log_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=True)  # None for system events
    action = Column(String(100), nullable=False)  # e.g. 'listing_created', 'listing_claimed', 'listing_expired', 'claim_cancelled'
    entity_type = Column(String(50), nullable=False)  # 'listing' or 'claim'
    entity_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class ClaimDispute(Base):
    __tablename__ = 'claim_disputes'
    dispute_id = Column(Integer, primary_key=True)
    claim_id = Column(Integer, ForeignKey('claims.claim_id'), nullable=False)
    reporter_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    reason = Column(String(120), nullable=False)
    details = Column(Text, nullable=True)
    status = Column(String(30), default='open')  # 'open', 'reviewed', 'resolved', 'rejected'
    resolution_note = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    claim = relationship("Claim")
    reporter = relationship("User", foreign_keys=[reporter_id])


class SuspiciousActivity(Base):
    __tablename__ = 'suspicious_activities'
    activity_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    claim_id = Column(Integer, ForeignKey('claims.claim_id'), nullable=True)
    activity_type = Column(String(80), nullable=False)
    severity = Column(String(20), default='medium')  # 'low', 'medium', 'high'
    details = Column(Text, nullable=True)
    status = Column(String(30), default='open')  # 'open', 'reviewed', 'dismissed'
    reviewed_by = Column(Integer, ForeignKey('users.user_id'), nullable=True)
    review_note = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    claim = relationship("Claim")