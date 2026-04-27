from tg import expose, TGController, session as tg_session, response
from model import session, User, Claim, ClaimDispute, SuspiciousActivity, AuditLog
from schemas import UserSchema, ClaimDisputeSchema, SuspiciousActivitySchema
import datetime


class AdminController(TGController):
    def _current_admin_id(self):
        user_id = tg_session.get('user_id')
        role = tg_session.get('user_role')
        if not user_id:
            response.status = 401
            return None, {"error": "Not authenticated"}
        if role != 'Admin':
            response.status = 403
            return None, {"error": "Admin access required"}
        return user_id, None

    @expose('json')
    def overview(self):
        admin_id, err = self._current_admin_id()
        if err:
            return err

        open_disputes = session.query(ClaimDispute).filter_by(status='open').count()
        open_suspicious = session.query(SuspiciousActivity).filter_by(status='open').count()
        suspended_users = session.query(User).filter_by(is_suspended=True).count()
        verified_users = session.query(User).filter_by(is_verified=True).count()

        return {
            "admin_id": admin_id,
            "stats": {
                "open_disputes": open_disputes,
                "open_suspicious_activities": open_suspicious,
                "suspended_users": suspended_users,
                "verified_users": verified_users
            }
        }

    @expose('json')
    def users(self):
        _, err = self._current_admin_id()
        if err:
            return err

        users = session.query(User).order_by(User.created_at.desc()).all()
        return {"users": [UserSchema(u).to_dict() for u in users]}

    @expose('json')
    def set_verification(self, user_id, verified):
        admin_id, err = self._current_admin_id()
        if err:
            return err

        user_id = int(user_id)
        user = session.query(User).filter_by(user_id=user_id).first()
        if not user:
            response.status = 404
            return {"error": "User not found"}

        verified_bool = str(verified).lower() == 'true'
        try:
            user.is_verified = verified_bool
            session.add(AuditLog(
                user_id=admin_id,
                action='user_verification_updated',
                entity_type='user',
                entity_id=user.user_id
            ))
            session.commit()
            return {"status": "success", "user": UserSchema(user).to_dict()}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def suspend_user(self, user_id, reason=None):
        admin_id, err = self._current_admin_id()
        if err:
            return err

        user_id = int(user_id)
        user = session.query(User).filter_by(user_id=user_id).first()
        if not user:
            response.status = 404
            return {"error": "User not found"}
        if user.role == 'Admin':
            response.status = 400
            return {"error": "Cannot suspend an Admin account"}

        try:
            user.is_suspended = True
            user.suspension_reason = reason or "Suspended by admin"
            user.suspended_at = datetime.datetime.utcnow()
            session.add(AuditLog(
                user_id=admin_id,
                action='user_suspended',
                entity_type='user',
                entity_id=user.user_id
            ))
            session.add(SuspiciousActivity(
                user_id=user.user_id,
                activity_type='account_suspended',
                severity='high',
                details=user.suspension_reason,
                status='reviewed',
                reviewed_by=admin_id,
                reviewed_at=datetime.datetime.utcnow()
            ))
            session.commit()
            return {"status": "success", "user": UserSchema(user).to_dict()}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def unsuspend_user(self, user_id):
        admin_id, err = self._current_admin_id()
        if err:
            return err

        user_id = int(user_id)
        user = session.query(User).filter_by(user_id=user_id).first()
        if not user:
            response.status = 404
            return {"error": "User not found"}

        try:
            user.is_suspended = False
            user.suspension_reason = None
            user.suspended_at = None
            session.add(AuditLog(
                user_id=admin_id,
                action='user_unsuspended',
                entity_type='user',
                entity_id=user.user_id
            ))
            session.commit()
            return {"status": "success", "user": UserSchema(user).to_dict()}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def disputes(self):
        _, err = self._current_admin_id()
        if err:
            return err

        disputes = session.query(ClaimDispute).order_by(ClaimDispute.created_at.desc()).all()
        return {"disputes": [ClaimDisputeSchema(d).to_dict() for d in disputes]}

    @expose('json')
    def review_dispute(self, dispute_id, status, resolution_note=None):
        admin_id, err = self._current_admin_id()
        if err:
            return err

        if status not in {'reviewed', 'resolved', 'rejected'}:
            response.status = 400
            return {"error": "Invalid status"}

        dispute_id = int(dispute_id)
        dispute = session.query(ClaimDispute).filter_by(dispute_id=dispute_id).first()
        if not dispute:
            response.status = 404
            return {"error": "Dispute not found"}

        try:
            dispute.status = status
            dispute.resolution_note = resolution_note
            dispute.reviewed_by = admin_id
            dispute.reviewed_at = datetime.datetime.utcnow()
            session.add(AuditLog(
                user_id=admin_id,
                action='dispute_reviewed',
                entity_type='claim_dispute',
                entity_id=dispute.dispute_id
            ))
            session.commit()
            return {"status": "success", "dispute": ClaimDisputeSchema(dispute).to_dict()}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def suspicious(self):
        _, err = self._current_admin_id()
        if err:
            return err

        activities = session.query(SuspiciousActivity).order_by(SuspiciousActivity.detected_at.desc()).all()
        return {"activities": [SuspiciousActivitySchema(a).to_dict() for a in activities]}

    @expose('json')
    def review_suspicious(self, activity_id, status, review_note=None):
        admin_id, err = self._current_admin_id()
        if err:
            return err

        if status not in {'reviewed', 'dismissed'}:
            response.status = 400
            return {"error": "Invalid status"}

        activity_id = int(activity_id)
        activity = session.query(SuspiciousActivity).filter_by(activity_id=activity_id).first()
        if not activity:
            response.status = 404
            return {"error": "Activity not found"}

        try:
            activity.status = status
            activity.reviewed_by = admin_id
            activity.review_note = review_note
            activity.reviewed_at = datetime.datetime.utcnow()
            session.add(AuditLog(
                user_id=admin_id,
                action='suspicious_activity_reviewed',
                entity_type='suspicious_activity',
                entity_id=activity.activity_id
            ))
            session.commit()
            return {"status": "success", "activity": SuspiciousActivitySchema(activity).to_dict()}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def flag_suspicious(self, user_id=None, claim_id=None, activity_type=None, severity='medium', details=None):
        admin_id, err = self._current_admin_id()
        if err:
            return err

        if not activity_type:
            response.status = 400
            return {"error": "activity_type is required"}
        if severity not in {'low', 'medium', 'high'}:
            response.status = 400
            return {"error": "Invalid severity"}
        claim_id = int(claim_id) if claim_id else None
        user_id = int(user_id) if user_id else None
        if claim_id and not session.query(Claim).filter_by(claim_id=claim_id).first():
            response.status = 404
            return {"error": "Claim not found"}
        if user_id and not session.query(User).filter_by(user_id=user_id).first():
            response.status = 404
            return {"error": "User not found"}

        try:
            activity = SuspiciousActivity(
                user_id=user_id,
                claim_id=claim_id,
                activity_type=activity_type,
                severity=severity,
                details=details
            )
            session.add(activity)
            session.flush()
            session.add(AuditLog(
                user_id=admin_id,
                action='suspicious_activity_flagged',
                entity_type='suspicious_activity',
                entity_id=activity.activity_id
            ))
            session.commit()
            return {"status": "success", "activity": SuspiciousActivitySchema(activity).to_dict()}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}
