import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Listing } from '../types';

interface Props {
  listing: Listing;
  onClaimed?: () => void;
}

export default function ListingCard({ listing, onClaimed }: Props) {
  const { user } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClaim = async (logisticsType: string) => {
    setClaiming(true);
    setError('');
    try {
      const res = await api.listings.claim(listing.id, logisticsType);
      setSuccess(`Claimed! Pickup at: ${res.logistics_packet.address}`);
      onClaimed?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to claim');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="card-elevated group p-0 overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-surface-950 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-surface-950 leading-snug font-display">
                {listing.food}
              </h3>
              {listing.quantity && (
                <p className="text-sm text-surface-400 mt-0.5">{listing.quantity}</p>
              )}
            </div>
          </div>
          <span className="badge text-green-700" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Available
          </span>
        </div>

        {/* Location */}
        {listing.address_text && (
          <div className="flex items-center gap-1.5 mt-4 text-sm text-surface-400">
            <svg className="w-3.5 h-3.5 shrink-0 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{listing.address_text}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 text-xs text-surface-300">
          <span>{listing.lat.toFixed(4)}, {listing.lon.toFixed(4)}</span>
        </div>

        {/* Feedback */}
        {error && (
          <div className="mt-3 card-bordered px-3 py-2 text-xs text-red-600 bg-red-50 border-red-100 animate-scale-in">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 card-bordered px-3 py-2 text-xs text-green-700 bg-green-50 border-green-100 animate-scale-in">
            {success}
          </div>
        )}

        {/* Claim buttons */}
        {user?.role === 'Recipient' && !success && (
          <div className="mt-4 flex gap-2">
            <button
              disabled={claiming}
              onClick={() => handleClaim('self_pickup')}
              className="btn-accent flex-1 !py-2.5 !text-xs !rounded-xl"
            >
              {claiming ? (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Self Pickup'}
            </button>
            <button
              disabled={claiming}
              onClick={() => handleClaim('third_party')}
              className="btn-outline flex-1 !py-2.5 !text-xs !rounded-xl"
            >
              {claiming ? '...' : 'Delivery'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom hover glow */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary-500/0 to-transparent group-hover:via-primary-500/40 transition-all duration-500" />
    </div>
  );
}
