import { useState, useEffect, useRef } from 'react';
import { X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pet } from '../types/pet';
import { sightingsApi } from '../api/client';
import { useI18n } from '../context/I18nContext';

interface SightingFormProps {
  pet: Pet;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMENT_MAX = 500;
const CONTACT_MAX = 100;

export function SightingForm({ pet, onClose, onSuccess }: SightingFormProps) {
  const { t } = useI18n();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [seenAt, setSeenAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [comment, setComment] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current).setView([pet.location.lat, pet.location.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const petIcon = L.divIcon({
      html: `<div style="background:#ef4444;width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([pet.location.lat, pet.location.lng], { icon: petIcon }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLocation({ lat, lng });
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      const sightIcon = L.divIcon({
        html: `<div style="background:#f59e0b;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:14px">👁</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      markerRef.current = L.marker([lat, lng], { icon: sightIcon }).addTo(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [pet]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        if (mapRef.current && markerRef.current) {
          mapRef.current.removeLayer(markerRef.current);
        }
        if (mapRef.current) {
          const sightIcon = L.divIcon({
            html: `<div style="background:#f59e0b;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:14px">👁</div>`,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          markerRef.current = L.marker([latitude, longitude], { icon: sightIcon }).addTo(mapRef.current);
          mapRef.current.setView([latitude, longitude], 15);
        }
      },
      () => {},
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;
    setSubmitting(true);
    try {
      await sightingsApi.create({
        pet_id: pet.id,
        location_lat: location.lat,
        location_lng: location.lng,
        seen_at: new Date(seenAt).toISOString(),
        comment: comment.trim() || undefined,
        contact: contact.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.sightings.sendError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[70]" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 sticky top-0 z-10 bg-card rounded-t-xl px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            {t.sightings.title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-accent dark:hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 min-h-0 overflow-y-auto">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t.sightings.mapHint}
            </p>
            <div ref={mapContainerRef} className="h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700" />
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="mt-2 text-sm text-primary hover:text-primary/90"
            >
              {t.sightings.useMyLocation}
            </button>
            {!location && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">{t.sightings.selectPoint}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.sightings.whenSeen}</label>
            <input
              type="datetime-local"
              value={seenAt}
              onChange={(e) => setSeenAt(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.sightings.comment} <span className="text-gray-400">{t.sightings.optional}</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
              placeholder={t.sightings.commentPlaceholder}
              rows={2}
              maxLength={COMMENT_MAX}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <p className={`mt-1 text-xs tabular-nums ${comment.length >= COMMENT_MAX ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {comment.length} / {COMMENT_MAX} {t.common.characters}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.sightings.contact} <span className="text-gray-400">{t.sightings.optional}</span>
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value.slice(0, CONTACT_MAX))}
              placeholder={t.sightings.contactPlaceholder}
              maxLength={CONTACT_MAX}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <p className={`mt-1 text-xs tabular-nums ${contact.length >= CONTACT_MAX ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {contact.length} / {CONTACT_MAX} {t.common.characters}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-accent dark:hover:bg-accent transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={!location || submitting}
              className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? t.sightings.submitting : t.sightings.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
