import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Notification } from '../types';
import { formatLocalDateTime } from '../utils/dateTime';

const TYPE_STYLES: Record<string, string> = {
  claim_received: 'text-blue-700 bg-blue-50',
  claim_confirmed: 'text-green-700 bg-green-50',
};

const TYPE_LABELS: Record<string, string> = {
  claim_received: 'Claim Received',
  claim_confirmed: 'Claim Confirmed',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.notifications.mine()
      .then(data => setNotifications(data.notifications))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch {
      // silent fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // silent fail
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-10 animate-fade-up">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-surface-950 tracking-tight">Notifications</h1>
          <p className="text-surface-400 mt-2 text-sm">Fulfillment updates and coordination messages</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-ghost text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="card-bordered px-5 py-4 text-sm text-red-600 bg-red-50 border-red-100 mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-28">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-surface-200 border-t-primary-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-28 animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-surface-950 mb-2">No notifications yet</h3>
          <p className="text-surface-400 text-sm">You'll see claim updates and coordination messages here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              className={`card-elevated p-5 animate-fade-up transition-all duration-200 ${
                !n.is_read ? 'border-l-[3px] border-l-primary-500' : 'opacity-75'
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`badge ${TYPE_STYLES[n.type] ?? 'text-surface-500 bg-surface-100'}`}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-300 shrink-0">
                    {formatLocalDateTime(n.sent_at)}
                  </span>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-[11px] font-medium text-surface-400 hover:text-primary-600 transition-colors whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-surface-700 leading-relaxed">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
