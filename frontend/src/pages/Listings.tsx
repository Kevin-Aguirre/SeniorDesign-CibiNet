import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import ListingMap from '../components/ListingMap';
import type { Listing } from '../types';

type View = 'list' | 'map';

export default function Listings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('list');
  const [foodTypeFilter, setFoodTypeFilter] = useState('');

  const fetchListings = async (filter?: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listings.nearby(40.7128, -74.006, 5, filter || undefined);
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

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(foodTypeFilter.trim() || undefined);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 animate-fade-up">
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
          <button onClick={() => fetchListings(foodTypeFilter || undefined)} className="btn-ghost group">
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

      {/* Filter + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <form onSubmit={handleFilterSubmit} className="flex gap-2 flex-1">
          <input
            type="text"
            value={foodTypeFilter}
            onChange={e => setFoodTypeFilter(e.target.value)}
            placeholder="Filter by food type (e.g. bread, soup…)"
            className="input flex-1"
          />
          <button type="submit" className="btn-outline !px-5">
            Search
          </button>
          {foodTypeFilter && (
            <button
              type="button"
              onClick={() => { setFoodTypeFilter(''); fetchListings(); }}
              className="btn-ghost !px-4"
            >
              Clear
            </button>
          )}
        </form>

        {/* List / Map toggle */}
        <div className="flex items-center bg-surface-100 rounded-full p-1 gap-1 self-start sm:self-auto">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
              view === 'list' ? 'bg-white shadow-sm text-surface-950' : 'text-surface-400 hover:text-surface-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
              view === 'map' ? 'bg-white shadow-sm text-surface-950' : 'text-surface-400 hover:text-surface-700'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Map
          </button>
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
          <h3 className="font-display text-xl font-bold text-surface-950 mb-2">No donations found</h3>
          <p className="text-surface-400 text-sm max-w-xs mx-auto leading-relaxed">
            {foodTypeFilter
              ? `No listings matching "${foodTypeFilter}". Try a different search.`
              : 'No active listings right now. Check back soon.'}
          </p>
          {user?.role === 'Donor' && (
            <Link to="/new-listing" className="btn-accent mt-6 inline-flex">
              Post a Donation
            </Link>
          )}
        </div>
      ) : view === 'map' ? (
        <ListingMap listings={listings} onClaimed={() => fetchListings(foodTypeFilter || undefined)} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, i) => (
            <div
              key={listing.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <ListingCard listing={listing} onClaimed={() => fetchListings(foodTypeFilter || undefined)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
