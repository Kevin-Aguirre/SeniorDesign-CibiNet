import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { parseApiUtc } from '../utils/dateTime';

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState(24);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageFileRef = useRef<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.listings.detail(Number(id))
      .then(listing => {
        setFoodType(listing.food_type);
        setQuantity(listing.quantity);
        setAddress(listing.address_text);
        const hoursLeft = Math.max(1, Math.round(
          (parseApiUtc(listing.expiry_time).getTime() - Date.now()) / 3600000
        ));
        setHours(hoursLeft);
        if (listing.image_url) setExistingImageUrl(listing.image_url);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load listing'))
      .finally(() => setFetching(false));
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      imageFileRef.current = file;
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    imageFileRef.current = undefined;
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setError('');
    setLoading(true);
    try {
      await api.listings.update({
        listing_id: Number(id),
        food_type: foodType,
        quantity,
        address_text: address,
        hours_until_expiry: hours,
      }, imageFileRef.current);
      navigate('/my-listings');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-28">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-surface-200 border-t-primary-500" />
      </div>
    );
  }

  const displayImage = imagePreview || existingImageUrl;

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <div className="mb-8 animate-fade-up">
        <button
          onClick={() => navigate('/my-listings')}
          className="btn-ghost text-xs -ml-3 mb-4 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to listings
        </button>
        <h1 className="font-display text-3xl font-extrabold text-surface-950 tracking-tight">
          Edit Donation
        </h1>
        <p className="text-surface-400 mt-2 text-sm">Update your listing details.</p>
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

        {/* Photo */}
        <div className="card-bordered p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-950 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold text-surface-950 font-display">Photo</h2>
          </div>

          {displayImage ? (
            <div className="relative">
              <img src={displayImage} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
              {imagePreview && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <label className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium cursor-pointer hover:bg-black/80 transition-colors">
                Replace
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-surface-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-200">
              <svg className="w-8 h-8 text-surface-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs text-surface-400 font-medium">Click to upload a photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
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
            />
            <p className="text-[11px] text-surface-300 mt-2">
              If you change the address, the map location will be updated automatically.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 animate-fade-up-2">
          <button type="button" onClick={() => navigate('/my-listings')} className="btn-outline flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              <>
                Save Changes
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
