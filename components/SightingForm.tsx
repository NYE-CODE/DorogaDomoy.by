import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pet } from '../types/pet';
import { getPetPhotoCircleDivIcon, SIGHTING_MARKER_BORDER_COLOR } from '../utils/leaflet-pet-photo-icon';
import { sightingsApi } from '../api/client';
import { useI18n } from '../context/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { cn } from '@/shared/lib/classNames';
import {
  surfaceCtaOutline,
  surfaceCtaPrimary,
  surfaceFieldLabel,
  surfaceInput,
} from '@/shared/styles/surface-classes';
import '../landing/styles/theme-scoped.css';

interface SightingFormProps {
  pet: Pet;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COMMENT_MAX = 500;
const CONTACT_MAX = 100;

function sightingPickIcon(pet: Pet) {
  return getPetPhotoCircleDivIcon({
    photoUrl: pet.photos?.[0],
    status: pet.status,
    borderColor: SIGHTING_MARKER_BORDER_COLOR,
    size: 32,
    borderWidth: 3,
  });
}

export function SightingForm({ pet, open, onClose, onSuccess }: SightingFormProps) {
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
    if (!open) return;
    setLocation(null);
    setComment('');
    setContact('');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setSeenAt(now.toISOString().slice(0, 16));
  }, [open, pet.id]);

  useEffect(() => {
    if (!open || !mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current).setView([pet.location.lat, pet.location.lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const petIcon = getPetPhotoCircleDivIcon({
      photoUrl: pet.photos?.[0],
      status: pet.status,
      size: 36,
      borderWidth: 2,
    });
    L.marker([pet.location.lat, pet.location.lng], { icon: petIcon }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLocation({ lat, lng });
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      markerRef.current = L.marker([lat, lng], { icon: sightingPickIcon(pet) }).addTo(map);
    });

    mapRef.current = map;
    const invalidateTimer = window.setTimeout(() => map.invalidateSize(), 150);

    return () => {
      window.clearTimeout(invalidateTimer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, pet]);

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
          markerRef.current = L.marker([latitude, longitude], {
            icon: sightingPickIcon(pet),
          }).addTo(mapRef.current);
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
      await sightingsApi.create(pet.id, {
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
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="landing-theme flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-card"
        showCloseButton
      >
        <DialogHeader className="border-b border-border/80 px-5 py-4 text-left sm:px-6">
          <DialogTitle className="font-display flex items-center gap-2 text-lg text-foreground">
            <MapPin className="size-5 text-primary" aria-hidden />
            {t.sightings.title}
          </DialogTitle>
          <DialogDescription className="sr-only">{t.sightings.mapHint}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-landing px-5 py-5 sm:px-6"
        >
          <div>
            <p className="mb-2 text-sm text-muted-foreground">{t.sightings.mapHint}</p>
            <div
              ref={mapContainerRef}
              className="h-48 overflow-hidden rounded-xl border border-border bg-card"
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="mt-2 text-sm font-medium text-primary hover:text-primary-hover"
            >
              {t.sightings.useMyLocation}
            </button>
            {!location && (
              <p className="mt-1 text-sm text-primary">{t.sightings.selectPoint}</p>
            )}
          </div>

          <div>
            <label htmlFor="sighting-seen-at" className={surfaceFieldLabel}>
              {t.sightings.whenSeen}
            </label>
            <input
              id="sighting-seen-at"
              type="datetime-local"
              value={seenAt}
              onChange={(e) => setSeenAt(e.target.value)}
              className={surfaceInput}
            />
          </div>

          <div>
            <label htmlFor="sighting-comment" className={surfaceFieldLabel}>
              {t.sightings.comment}{' '}
              <span className="normal-case tracking-normal text-muted-foreground/80">
                {t.sightings.optional}
              </span>
            </label>
            <textarea
              id="sighting-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
              placeholder={t.sightings.commentPlaceholder}
              rows={2}
              maxLength={COMMENT_MAX}
              className={cn(surfaceInput, 'resize-y')}
            />
            <p
              className={`mt-1 text-xs tabular-nums ${
                comment.length >= COMMENT_MAX ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {comment.length} / {COMMENT_MAX} {t.common.characters}
            </p>
          </div>

          <div>
            <label htmlFor="sighting-contact" className={surfaceFieldLabel}>
              {t.sightings.contact}{' '}
              <span className="normal-case tracking-normal text-muted-foreground/80">
                {t.sightings.optional}
              </span>
            </label>
            <input
              id="sighting-contact"
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value.slice(0, CONTACT_MAX))}
              placeholder={t.sightings.contactPlaceholder}
              maxLength={CONTACT_MAX}
              className={surfaceInput}
            />
            <p
              className={`mt-1 text-xs tabular-nums ${
                contact.length >= CONTACT_MAX ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {contact.length} / {CONTACT_MAX} {t.common.characters}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={onClose} className={cn(surfaceCtaOutline, 'sm:flex-1')}>
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={!location || submitting}
              className={cn(surfaceCtaPrimary, 'sm:flex-1')}
            >
              {submitting ? t.sightings.submitting : t.sightings.submit}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
