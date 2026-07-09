import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Pet } from '@/entities/pet/model/types';
import type { SightingItem } from '@/shared/api/client';
import { getPetPhotoCircleDivIcon, SIGHTING_MARKER_BORDER_COLOR } from '@/shared/lib/leaflet-pet-photo-icon';
import { createSightingPopupContent } from './pet-detail-helpers';

export function SinglePetMap({ pet, sightings = [], seenLabel }: { pet: Pet; sightings?: SightingItem[]; seenLabel: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    }).setView([pet.location.lat, pet.location.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const petIcon = getPetPhotoCircleDivIcon({
      photoUrl: pet.photos?.[0],
      status: pet.status,
      size: 40,
    });
    L.marker([pet.location.lat, pet.location.lng], { icon: petIcon }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    const invalidateTimer = setTimeout(() => map.invalidateSize(), 100);
    return () => {
      clearTimeout(invalidateTimer);
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, [pet]);
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    sightings.forEach((s) => {
      const icon = getPetPhotoCircleDivIcon({
        photoUrl: pet.photos?.[0],
        status: pet.status,
        borderColor: SIGHTING_MARKER_BORDER_COLOR,
        size: 32,
        borderWidth: 3,
      });
      const m = L.marker([s.location_lat, s.location_lng], { icon }).addTo(markersLayerRef.current!);
      m.bindPopup(createSightingPopupContent(seenLabel, s));
    });
  }, [sightings, seenLabel, pet]);
  return (
    <div ref={mapContainerRef} className="h-full w-full z-0" />
  );
}
