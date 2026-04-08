import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Claim } from '../types';
import { formatLocalDateTime } from '../utils/dateTime';

const DISPUTE_REASONS = [
  { value: 'pickup_issue', label: 'Pickup / handoff issue' },
  { value: 'wrong_item', label: 'Wrong item or quantity' },
  { value: 'safety_concern', label: 'Food safety concern' },
  { value: 'no_show', label: 'Other party did not show' },
  { value: 'other', label: 'Other' },
];

export default function MyClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionState, setActionState] = useState<Record<number, string>>({});
  const [disputeClaimId, setDisputeClaimId] = useState<number | null>(null);
  const [disputeReasonKey, setDisputeReasonKey] = useState('pickup_issue');
  const [disputeReasonOther, setDisputeReasonOther] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');

  const fetchClaims = () => {
    setLoading(true);
    api.claims.mine()
      .then(data => setClaims(data.claims))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load claims'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleAcknowledge = async (claimId: number) => {
    setActionState(s => ({ ...s, [claimId]: 'loading' }));
    try {
      await api.claims.acknowledge(claimId);
      setClaims(prev => prev.map(c =>
        c.claim_id === claimId ? { ...c, safety_ack_received: true } : c
      ));
      setActionState(s => ({ ...s, [claimId]: 'ack_done' }));
    } catch (err: unknown) {
      setActionState(s => ({ ...s, [claimId]: err instanceof Error ? err.message : 'Error' }));
    }
  };

  const handleCancel = async (claimId: number) => {
    setActionState(s => ({ ...s, [claimId]: 'cancelling' }));
    try {
      await api.claims.cancel(claimId);
      setClaims(prev => prev.filter(c => c.claim_id !== claimId));
    } catch (err: unknown) {
      setActionState(s => ({ ...s, [claimId]: err instanceof Error ? err.message : 'Error' }));
    }
  };

  const openDisputeModal = (claimId: number) => {
    setDisputeClaimId(claimId);
    setDisputeReasonKey('pickup_issue');
    setDisputeReasonOther('');
    setDisputeDetails('');
  };

  const closeDisputeModal = () => {
    setDisputeClaimId(null);
    setDisputeReasonOther('');
    setDisputeDetails('');
  };

  const submitDispute = async () => {
    if (disputeClaimId == null) return;
    const label = DISPUTE_REASONS.find(r => r.value === disputeReasonKey)?.label ?? disputeReasonKey;
    const reason =
      disputeReasonKey === 'other'
        ? (disputeReasonOther.trim() || 'Other')
        : label;
    setActionState(s => ({ ...s, [disputeClaimId]: 'reporting' }));
    try {
      await api.claims.reportDispute(disputeClaimId, reason, disputeDetails.trim() || undefined);
      setActionState(s => ({ ...s, [disputeClaimId]: 'dispute_reported' }));
      closeDisputeModal();
    } catch (err: unknown) {
      setActionState(s => ({
        ...s,
        [disputeClaimId]: err instanceof Error ? err.message : 'Error',
      }));
    }
  };

  const disputeClaim = disputeClaimId != null ? claims.find(c => c.claim_id === disputeClaimId) : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 relative">
      <div className="mb-10 animate-fade-up">
        <h1 className="font-display text-4xl font-extrabold text-surface-950 tracking-tight">My Claims</h1>
        <p className="text-surface-400 mt-2 text-sm">Donations you have reserved</p>
      </div>

      {error && (
        <div className="card-bordered px-5 py-4 text-sm text-red-600 bg-red-50 border-red-100 mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-28">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-surface-200 border-t-primary-500" />
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-28 animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-surface-950 mb-2">No claims yet</h3>
          <p className="text-surface-400 text-sm">Browse available donations and claim one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim, i) => {
            const state = actionState[claim.claim_id];
            const isLoading = state === 'loading' || state === 'cancelling' || state === 'reporting';

            return (
              <div
                key={claim.claim_id}
                className="card-elevated p-6 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-bold text-surface-950 font-display text-lg">{claim.food_type}</p>
                    <p className="text-sm text-surface-400 mt-0.5">{claim.quantity}</p>
                  </div>
                  <span className="badge text-primary-700 shrink-0" style={{ background: 'rgba(6,182,212,0.1)' }}>
                    {claim.logistics_type === 'self_pickup' ? 'Self Pickup' : 'Delivery'}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="card-bordered p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-300 mb-1">Coordination ID</p>
                    <p className="font-mono font-semibold text-surface-700">{claim.coordination_id}</p>
                  </div>
                  <div className="card-bordered p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-300 mb-1">Pickup Address</p>
                    <p className="text-surface-700">{claim.address}</p>
                  </div>
                  <div className="card-bordered p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-300 mb-1">Claimed</p>
                    <p className="text-surface-700">{formatLocalDateTime(claim.claimed_at)}</p>
                  </div>
                  <div className="card-bordered p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-surface-300 mb-1">Food Safety</p>
                    {claim.safety_ack_received ? (
                      <p className="text-green-600 font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Acknowledged
                      </p>
                    ) : (
                      <p className="text-orange-500 font-medium">Pending acknowledgment</p>
                    )}
                  </div>
                </div>

                {/* Action error */}
                {state && state !== 'loading' && state !== 'cancelling' && state !== 'ack_done' && (
                  <p className={`text-xs mt-3 ${state === 'dispute_reported' ? 'text-green-600' : 'text-red-600'}`}>
                    {state === 'dispute_reported' ? 'Dispute reported for admin review' : state}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {!claim.safety_ack_received && (
                    <button
                      disabled={isLoading}
                      onClick={() => handleAcknowledge(claim.claim_id)}
                      className="btn-accent !py-2 !text-xs !rounded-xl"
                    >
                      {state === 'loading' ? 'Acknowledging...' : 'Acknowledge Food Safety'}
                    </button>
                  )}
                  <button
                    disabled={isLoading}
                    onClick={() => handleCancel(claim.claim_id)}
                    className="btn-ghost !py-2 !text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                  >
                    {state === 'cancelling' ? 'Cancelling...' : 'Cancel Claim'}
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() => openDisputeModal(claim.claim_id)}
                    className="btn-outline !py-2 !text-xs"
                  >
                    Report Dispute
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {disputeClaimId != null && disputeClaim && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispute-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeDisputeModal}
            aria-label="Close dispute dialog"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-surface-100 overflow-hidden animate-scale-in">
            <div className="px-6 pt-6 pb-4 border-b border-surface-100 bg-surface-50/80">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="dispute-modal-title" className="font-display text-lg font-bold text-surface-950">
                    Report a dispute
                  </h2>
                  <p className="text-xs text-surface-400 mt-1">
                    {disputeClaim.food_type} · {disputeClaim.coordination_id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDisputeModal}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="dispute-reason" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                  Reason
                </label>
                <select
                  id="dispute-reason"
                  value={disputeReasonKey}
                  onChange={e => setDisputeReasonKey(e.target.value)}
                  className="input !py-3"
                >
                  {DISPUTE_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {disputeReasonKey === 'other' && (
                <div>
                  <label htmlFor="dispute-other" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                    Describe the issue
                  </label>
                  <input
                    id="dispute-other"
                    value={disputeReasonOther}
                    onChange={e => setDisputeReasonOther(e.target.value)}
                    className="input"
                    placeholder="Brief description"
                  />
                </div>
              )}
              <div>
                <label htmlFor="dispute-details" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                  Additional details <span className="font-normal normal-case text-surface-300">(optional)</span>
                </label>
                <textarea
                  id="dispute-details"
                  value={disputeDetails}
                  onChange={e => setDisputeDetails(e.target.value)}
                  rows={4}
                  className="input !py-3 resize-y min-h-[100px]"
                  placeholder="What happened? Include times or coordination notes if helpful."
                />
              </div>
            </div>

            <div className="px-6 py-4 flex gap-3 border-t border-surface-100 bg-surface-50/50">
              <button type="button" onClick={closeDisputeModal} className="btn-outline flex-1">
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDispute}
                disabled={actionState[disputeClaimId] === 'reporting'}
                className="btn-primary flex-1"
              >
                {actionState[disputeClaimId] === 'reporting' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  'Submit report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
