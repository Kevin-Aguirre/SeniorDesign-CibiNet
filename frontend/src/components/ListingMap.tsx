import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Listing } from '../types';
import { parseApiUtc } from '../utils/dateTime';

// Fix leaflet's broken default icon paths when bundled with Vite
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function formatExpiry(isoString: string): string {
  const diff = parseApiUtc(isoString).getTime() - Date.now();
  const hours = Math.floor(diff / 3600000);
  if (hours < 0) return 'Expired';
  if (hours < 1) return 'Expires soon';
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

function MapPopup({ listing, onClaimed }: { listing: Listing; onClaimed: (result: { coordinationId: string; address: string }) => void }) {
  const { user } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async (logisticsType: string) => {
    setClaiming(true);
    setError('');
    try {
      const res = await api.listings.claim(listing.id, logisticsType);
      setClaimed(true);
      onClaimed({ coordinationId: res.coordination_id, address: res.logistics_packet.address });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to claim');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div style={{ minWidth: 180 }}>
      {listing.image_url && (
        <img src={listing.image_url} alt={listing.food} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4, marginBottom: 6 }} />
      )}
      <p style={{ fontWeight: 700, marginBottom: 2 }}>{listing.food}</p>
      <p style={{ color: '#78716c', fontSize: 13, marginBottom: 2 }}>{listing.quantity}</p>
      <p style={{ color: '#a8a29e', fontSize: 12, marginBottom: 8 }}>{formatExpiry(listing.expiry_time)}</p>

      {error && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 6 }}>{error}</p>}

      {claimed ? (
        <div style={{ background: '#f0fdf4', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
          <p style={{ fontWeight: 700, color: '#15803d', marginBottom: 4 }}>✓ Donation claimed!</p>
          <Link to="/my-claims" style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'underline' }}>
            View in My Claims →
          </Link>
        </div>
      ) : user?.role === 'Recipient' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            disabled={claiming}
            onClick={() => handleClaim('self_pickup')}
            style={{ flex: 1, background: '#06b6d4', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 0', fontSize: 12, cursor: 'pointer' }}
          >
            {claiming ? '...' : 'Self Pickup'}
          </button>
          <button
            disabled={claiming}
            onClick={() => handleClaim('third_party')}
            style={{ flex: 1, background: '#fff', border: '1px solid #e7e5e4', borderRadius: 6, padding: '5px 0', fontSize: 12, cursor: 'pointer' }}
          >
            Delivery
          </button>
        </div>
      )}
    </div>
  );
}

interface Props {
  listings: Listing[];
  onClaimed: (result: { coordinationId: string; address: string }) => void;
}

export default function ListingMap({ listings, onClaimed }: Props) {
  const center: [number, number] = listings.length > 0
    ? [listings[0].lat, listings[0].lon]
    : [40.7128, -74.006];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ height: 520 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          maxClusterRadius={45}
        >
          {listings.map(listing => (
            <Marker
              key={listing.id}
              position={[listing.lat, listing.lon]}
              icon={defaultIcon}
            >
              <Popup>
                <MapPopup listing={listing} onClaimed={onClaimed} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
