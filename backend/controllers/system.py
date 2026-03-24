from tg import expose, TGController
from model import session, Session, Listing, AuditLog
from schemas import AuditLogSchema
import datetime


def run_cleanup():
    """
    UC06: Automated Safety Pruning.
    Marks all available listings past their expiry_time as 'expired'
    and writes one AuditLog entry per expired listing.
    Called by both the scheduler thread and the manual /api/system/cleanup endpoint.

    Uses its own isolated session so the scheduler thread never shares the
    web-request session (SQLAlchemy sessions are not thread-safe).
    """
    cleanup_session = Session()
    try:
        now = datetime.datetime.utcnow()
        expired_listings = cleanup_session.query(Listing).filter(
            Listing.expiry_time < now,
            Listing.status == 'available'
        ).all()

        for listing in expired_listings:
            listing.status = 'expired'
            cleanup_session.add(AuditLog(
                user_id=None,
                action='listing_expired',
                entity_type='listing',
                entity_id=listing.listing_id
            ))

        cleanup_session.commit()
        return len(expired_listings)
    except Exception:
        cleanup_session.rollback()
        raise
    finally:
        cleanup_session.close()


class SystemController(TGController):

    @expose('json')
    def cleanup(self):
        """FR-06: Manual trigger for safety pruning (scheduler runs this automatically)."""
        expired_count = run_cleanup()
        return {"expired_items_removed": expired_count}

    @expose('json')
    def audit_log(self, limit=50):
        """Return the most recent audit log entries for review (SSDS Section 9.1)."""
        logs = session.query(AuditLog).order_by(
            AuditLog.timestamp.desc()
        ).limit(int(limit)).all()
        return {"audit_log": [AuditLogSchema(l).to_dict() for l in logs]}
