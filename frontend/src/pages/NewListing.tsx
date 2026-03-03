import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function NewListing() {
  const navigate = useNavigate();
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState(24);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.listings.create({
        food_type: foodType,
        quantity,
        address_text: address,
        hours_until_expiry: hours,
      });
      navigate('/listings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      {/* Back + Header */}
      <div className="mb-8 animate-fade-up">
        <button
          onClick={() => navigate('/listings')}
          className="btn-ghost text-xs -ml-3 mb-4 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to listings
        </button>
        <h1 className="font-display text-3xl font-extrabold text-surface-950 tracking-tight">
          New Donation
        </h1>
        <p className="text-surface-400 mt-2 text-sm">Share surplus food with people who need it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up-1">
        {error && (
          <div className="card-bordered px-4 py-3 text-sm text-red-600 bg-red-50 border-red-100 animate-scale-in">
            {error}
          </div>
        )}

        {/* Food Details */}
        <div className="card-bordered p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-950 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-surface-950 font-display">Food Details</h2>
          </div>

          <div>
            <label htmlFor="food" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
              Food Type
            </label>
            <input
              id="food"
              required
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              className="input"
              placeholder="e.g. Sandwiches, Canned Soup, Fresh Produce"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="qty" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                Quantity
              </label>
              <input
                id="qty"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
                placeholder="e.g. 20 servings"
              />
            </div>
            <div>
              <label htmlFor="hours" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
                Expires in (hours)
              </label>
              <input
                id="hours"
                type="number"
                min={1}
                max={168}
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card-bordered p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-950 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-surface-950 font-display">Pickup Location</h2>
          </div>

          <div>
            <label htmlFor="address" className="block text-[11px] font-bold text-surface-400 uppercase tracking-widest mb-2">
              Address
            </label>
            <input
              id="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input"
              placeholder="123 Main St, New York, NY"
            />
            <p className="text-[11px] text-surface-300 mt-2">
              Recipients will see this address when claiming your listing.
            </p>
          </div>
        </div>

        {/* Safety note */}
        <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(6, 182, 212, 0.15)' }}>
            <svg className="w-4 h-4 text-primary-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-surface-900">Auto-expiry enabled</p>
            <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">
              Your listing will automatically expire after {hours} hour{hours !== 1 ? 's' : ''} for food safety compliance.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 animate-fade-up-2">
          <button type="button" onClick={() => navigate('/listings')} className="btn-outline flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Posting...
              </span>
            ) : (
              <>
                Post Donation
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
