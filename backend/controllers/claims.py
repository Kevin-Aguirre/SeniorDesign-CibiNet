from tg import expose, TGController, session as tg_session, response
from model import session, Claim, Listing, AuditLog, ClaimDispute, SuspiciousActivity, User
from schemas import ClaimSchema, ClaimDisputeSchema


class ClaimController(TGController):
    def _blocked_if_suspended(self, user_id):
        user = session.query(User).filter_by(user_id=user_id).first()
        if user and user.is_suspended:
            response.status = 403
            return {"error": f"Account suspended: {user.suspension_reason or 'Contact support'}"}
        return None

    @expose('json')
    def mine(self):
        """Get all claims made by the current session Recipient"""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        if tg_session.get('user_role') != 'Recipient':
            response.status = 403
            return {"error": "Only Recipients can view claims"}
        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        claims = session.query(Claim).filter_by(recipient_id=user_id).all()

        return {"claims": [ClaimSchema(c).to_dict() for c in claims]}

    @expose('json')
    def view(self, claim_id):
        """Get details of a specific claim — accessible by the Recipient or the Donor"""
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        claim = session.query(Claim).filter_by(claim_id=claim_id).first()
        if not claim:
            response.status = 404
            return {"error": "Claim not found"}

        # RBAC: only the recipient or the listing's donor may view this claim
        if claim.recipient_id != user_id and claim.listing.donor_id != user_id:
            response.status = 403
            return {"error": "Access denied"}
        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        return ClaimSchema(claim).to_dict()

    @expose('json')
    def acknowledge(self, claim_id):
        """
        Recipient acknowledges food safety responsibility.
        Sets safety_ack_received = True on the claim (NFR-03 / SSDS food safety disclaimer).
        """
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        claim = session.query(Claim).filter_by(
            claim_id=claim_id,
            recipient_id=user_id
        ).first()
        if not claim:
            response.status = 404
            return {"error": "Claim not found or does not belong to you"}

        if claim.safety_ack_received:
            return {"status": "success", "message": "Safety acknowledgment already recorded"}
        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        try:
            claim.safety_ack_received = True
            session.commit()
            return {"status": "success", "message": "Safety acknowledgment recorded"}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def cancel(self, claim_id):
        """
        Cancel a claim and return the listing to 'available' status.
        Only the Recipient who made the claim can cancel it.
        """
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        claim = session.query(Claim).filter_by(
            claim_id=claim_id,
            recipient_id=user_id
        ).first()
        if not claim:
            response.status = 404
            return {"error": "Claim not found or does not belong to you"}
        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        try:
            listing = session.query(Listing).filter_by(
                listing_id=claim.listing_id
            ).first()
            cancelled_claim_id = claim.claim_id
            listing.status = 'available'
            session.delete(claim)
            session.add(AuditLog(
                user_id=user_id,
                action='claim_cancelled',
                entity_type='claim',
                entity_id=cancelled_claim_id
            ))
            session.commit()
            return {"status": "success", "message": "Claim cancelled, listing is available again"}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}

    @expose('json')
    def report_dispute(self, claim_id, reason, details=None):
        user_id = tg_session.get('user_id')
        if not user_id:
            response.status = 401
            return {"error": "Not authenticated"}

        claim = session.query(Claim).filter_by(claim_id=claim_id).first()
        if not claim:
            response.status = 404
            return {"error": "Claim not found"}

        if claim.recipient_id != user_id and claim.listing.donor_id != user_id:
            response.status = 403
            return {"error": "Only involved claim users can report a dispute"}

        blocked = self._blocked_if_suspended(user_id)
        if blocked:
            return blocked

        try:
            dispute = ClaimDispute(
                claim_id=claim.claim_id,
                reporter_id=user_id,
                reason=reason,
                details=details
            )
            session.add(dispute)
            session.flush()
            session.add(SuspiciousActivity(
                user_id=claim.recipient_id,
                claim_id=claim.claim_id,
                activity_type='claim_dispute_reported',
                severity='medium',
                details=f"Dispute #{dispute.dispute_id} reported: {reason}"
            ))
            session.add(SuspiciousActivity(
                user_id=claim.listing.donor_id,
                claim_id=claim.claim_id,
                activity_type='claim_dispute_reported',
                severity='medium',
                details=f"Dispute #{dispute.dispute_id} reported: {reason}"
            ))
            session.add(AuditLog(
                user_id=user_id,
                action='claim_dispute_reported',
                entity_type='claim_dispute',
                entity_id=dispute.dispute_id
            ))
            session.commit()
            return {"status": "success", "dispute": ClaimDisputeSchema(dispute).to_dict()}
        except Exception as e:
            session.rollback()
            response.status = 500
            return {"error": "Database error", "details": str(e)}
