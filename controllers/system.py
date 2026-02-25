from tg import expose, TGController
from model import session, Listing
import datetime

class SystemController(TGController):
    @expose('json')
    def cleanup(self):
        """FR-05: Safety Pruning API"""
        now = datetime.datetime.utcnow()
        expired_count = session.query(Listing).filter(
            Listing.expiry_time < now, 
            Listing.status == 'available'
        ).update({"status": "expired"}, synchronize_session=False)
        session.commit()
        return {"expired_items_removed": expired_count}