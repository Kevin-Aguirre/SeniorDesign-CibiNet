import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import type { Listing } from '../types';

export default function Listings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listings.nearby(40.7128, -74.006);
      setListings(data.listings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 animate-fade-up">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-surface-950 tracking-tight">
            Available Donations
          </h1>
          <p className="text-surface-400 mt-2 text-sm">
            {loading
              ? 'Searching nearby...'
              : `${listings.length} listing${listings.length !== 1 ? 's' : ''} near you`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchListings} className="btn-ghost group">
            <svg
              className="w-4 h-4 text-surface-400 group-hover:text-surface-900 transition-transform duration-500 group-hover:rotate-180"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          {user?.role === 'Donor' && (
            <Link to="/new-listing" className="btn-accent">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Donation
            </Link>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card-bordered px-5 py-4 text-sm text-red-600 bg-red-50 border-red-100 mb-6 animate-scale-in">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-4 animate-fade-in">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-surface-200 border-t-primary-500" />
            <div className="absolute inset-0 h-12 w-12 rounded-full animate-pulse" style={{ background: 'rgba(6, 182, 212, 0.1)' }} />
          </div>
          <p className="text-sm text-surface-400 font-medium">Finding donations nearby...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-28 animate-fade-up">
          <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mx-auto mb-5">
            <svg className="w-9 h-9 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-surface-950 mb-2">No donations yet</h3>
          <p className="text-surface-400 text-sm max-w-xs mx-auto leading-relaxed">
            There are no active listings right now. Check back soon or be the first to share.
          </p>
          {user?.role === 'Donor' && (
            <Link to="/new-listing" className="btn-accent mt-6 inline-flex">
              Post a Donation
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, i) => (
            <div
              key={listing.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <ListingCard listing={listing} onClaimed={fetchListings} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
