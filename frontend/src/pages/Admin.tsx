import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ClaimDispute, SuspiciousActivity, User } from '../types';
import { formatLocalDateTime } from '../utils/dateTime';

type Tab = 'users' | 'disputes' | 'suspicious';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<ClaimDispute[]>([]);
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [stats, setStats] = useState<{
    open_disputes: number;
    open_suspicious_activities: number;
    suspended_users: number;
    verified_users: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewRes, usersRes, disputesRes, suspiciousRes] = await Promise.all([
        api.admin.overview(),
        api.admin.users(),
        api.admin.disputes(),
        api.admin.suspicious()
      ]);
      setStats(overviewRes.stats);
      setUsers(usersRes.users);
      setDisputes(disputesRes.disputes);
      setActivities(suspiciousRes.activities);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleVerification = async (user: User) => {
    await api.admin.setVerification(user.user_id, !user.is_verified);
    await load();
  };

  const toggleSuspension = async (user: User) => {
    if (user.is_suspended) {
      await api.admin.unsuspendUser(user.user_id);
    } else {
      const reason = prompt('Suspension reason:', 'Policy violation');
      if (!reason) return;
      await api.admin.suspendUser(user.user_id, reason);
    }
    await load();
  };

  const reviewDispute = async (disputeId: number, status: 'reviewed' | 'resolved' | 'rejected') => {
    const note = prompt('Resolution note (optional):', '') || '';
    await api.admin.reviewDispute(disputeId, status, note);
    await load();
  };

  const reviewActivity = async (activityId: number, status: 'reviewed' | 'dismissed') => {
    const note = prompt('Review note (optional):', '') || '';
    await api.admin.reviewSuspicious(activityId, status, note);
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-extrabold text-surface-950 tracking-tight">Admin Console</h1>
        <p className="text-surface-400 mt-2 text-sm">Moderation and trust workflow management</p>
      </div>

      {error && (
        <div className="card-bordered px-5 py-4 text-sm text-red-600 bg-red-50 border-red-100 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-surface-200 border-t-primary-500" />
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="card-bordered p-4"><p className="text-xs text-surface-400">Open disputes</p><p className="font-display text-2xl font-bold">{stats.open_disputes}</p></div>
              <div className="card-bordered p-4"><p className="text-xs text-surface-400">Open suspicious</p><p className="font-display text-2xl font-bold">{stats.open_suspicious_activities}</p></div>
              <div className="card-bordered p-4"><p className="text-xs text-surface-400">Suspended users</p><p className="font-display text-2xl font-bold">{stats.suspended_users}</p></div>
              <div className="card-bordered p-4"><p className="text-xs text-surface-400">Verified users</p><p className="font-display text-2xl font-bold">{stats.verified_users}</p></div>
            </div>
          )}

          <div className="flex gap-2 mb-5">
            <button onClick={() => setTab('users')} className={`btn-ghost ${tab === 'users' ? '!bg-surface-100 !text-surface-900' : ''}`}>Users</button>
            <button onClick={() => setTab('disputes')} className={`btn-ghost ${tab === 'disputes' ? '!bg-surface-100 !text-surface-900' : ''}`}>Disputes</button>
            <button onClick={() => setTab('suspicious')} className={`btn-ghost ${tab === 'suspicious' ? '!bg-surface-100 !text-surface-900' : ''}`}>Suspicious Activity</button>
          </div>

          {tab === 'users' && (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.user_id} className="card-bordered p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-surface-900">{u.email}</p>
                    <p className="text-xs text-surface-400">{u.role}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`badge ${u.is_verified ? 'text-green-700 bg-green-50' : 'text-surface-500 bg-surface-100'}`}>{u.is_verified ? 'Verified' : 'Unverified'}</span>
                      <span className={`badge ${u.is_suspended ? 'text-red-700 bg-red-50' : 'text-surface-500 bg-surface-100'}`}>{u.is_suspended ? 'Suspended' : 'Active'}</span>
                    </div>
                    {u.suspension_reason && <p className="text-xs text-red-500 mt-1">{u.suspension_reason}</p>}
                  </div>
                  {u.role !== 'Admin' && (
                    <div className="flex gap-2">
                      <button onClick={() => toggleVerification(u)} className="btn-outline !py-2 !text-xs">
                        {u.is_verified ? 'Unverify' : 'Verify'}
                      </button>
                      <button onClick={() => toggleSuspension(u)} className={`btn-outline !py-2 !text-xs ${u.is_suspended ? '' : '!border-red-200 !text-red-600'}`}>
                        {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'disputes' && (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div key={d.dispute_id} className="card-bordered p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-surface-900">Claim #{d.claim_id} dispute</p>
                      <p className="text-xs text-surface-400">By {d.reporter_email} • {formatLocalDateTime(d.created_at)}</p>
                      <p className="text-sm text-surface-700 mt-2">{d.reason}</p>
                      {d.details && <p className="text-xs text-surface-500 mt-1">{d.details}</p>}
                      {d.resolution_note && <p className="text-xs text-surface-500 mt-1">Resolution: {d.resolution_note}</p>}
                    </div>
                    <span className="badge text-surface-700 bg-surface-100">{d.status}</span>
                  </div>
                  {d.status === 'open' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => reviewDispute(d.dispute_id, 'reviewed')} className="btn-outline !py-2 !text-xs">Mark Reviewed</button>
                      <button onClick={() => reviewDispute(d.dispute_id, 'resolved')} className="btn-accent !py-2 !text-xs">Resolve</button>
                      <button onClick={() => reviewDispute(d.dispute_id, 'rejected')} className="btn-ghost !py-2 !text-xs">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'suspicious' && (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.activity_id} className="card-bordered p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-surface-900">{a.activity_type}</p>
                      <p className="text-xs text-surface-400">
                        {a.user_email || 'Unknown user'} • Severity {a.severity} • {formatLocalDateTime(a.detected_at)}
                      </p>
                      {a.claim_id && <p className="text-xs text-surface-500 mt-1">Claim #{a.claim_id}</p>}
                      {a.details && <p className="text-sm text-surface-700 mt-2">{a.details}</p>}
                      {a.review_note && <p className="text-xs text-surface-500 mt-1">Review: {a.review_note}</p>}
                    </div>
                    <span className="badge text-surface-700 bg-surface-100">{a.status}</span>
                  </div>
                  {a.status === 'open' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => reviewActivity(a.activity_id, 'reviewed')} className="btn-outline !py-2 !text-xs">Review</button>
                      <button onClick={() => reviewActivity(a.activity_id, 'dismissed')} className="btn-ghost !py-2 !text-xs">Dismiss</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
