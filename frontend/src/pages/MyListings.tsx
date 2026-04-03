import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { ListingDetail } from '../types';

const STATUS_STYLES: Record<ListingDetail['status'], string> = {
  available: 'text-green-700 bg-green-50',
  claimed: 'text-blue-700 bg-blue-50',
  expired: 'text-surface-400 bg-surface-100',
};

function formatExpiry(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  const hours = Math.floor(diff / 3600000);
  if (hours < 0) return 'Expired';
  if (hours < 1) return 'Expires soon';
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export default function MyListings() {
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchListings = () => {
    setLoading(true);
    api.users.myListings()
      .then(data => setListings(data.listings))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load listings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListings(); }, []);

  const handleDelete = async (listingId: number) => {
    if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
    try {
      await api.listings.delete(listingId);
      setListings(prev => prev.filter(l => l.listing_id !== listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-10 animate-fade-up">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-surface-950 tracking-tight">My Donations</h1>
          <p className="text-surface-400 mt-2 text-sm">All listings you have posted</p>
        </div>
        <Link to="/new-listing" className="btn-accent">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Donation
        </Link>
      </div>

      {error && (
        <div className="card-bordered px-5 py-4 text-sm text-red-600 bg-red-50 border-red-100 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-28">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-surface-200 border-t-primary-500" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-28 animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-surface-950 mb-2">No donations yet</h3>
          <p className="text-surface-400 text-sm mb-6">Post your first donation to get started.</p>
          <Link to="/new-listing" className="btn-accent inline-flex">Post a Donation</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing, i) => (
            <div
              key={listing.listing_id}
              className="card-elevated p-5 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.food_type}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-surface-950 flex items-center justify-center shrink-0">
                      <svg className="w-4.5 h-4.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-surface-950 font-display">{listing.food_type}</p>
                    <p className="text-sm text-surface-400 mt-0.5">{listing.quantity}</p>
                    <p className="text-xs text-surface-300 mt-1 truncate">{listing.address_text}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`badge font-semibold ${STATUS_STYLES[listing.status]}`}>
                    {listing.status}
                  </span>
                  <span className="text-xs text-surface-400">{formatExpiry(listing.expiry_time)}</span>
                  {listing.status === 'available' && (
                    <div className="flex gap-1.5 mt-1">
                      <Link
                        to={`/edit-listing/${listing.listing_id}`}
                        className="text-[11px] font-medium text-surface-400 hover:text-primary-600 transition-colors"
                      >
                        Edit
                      </Link>
                      <span className="text-surface-200">|</span>
                      <button
                        onClick={() => handleDelete(listing.listing_id)}
                        className="text-[11px] font-medium text-surface-400 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
