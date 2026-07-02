import { useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { Pet } from '../types/pet';
import { getPetPhotoCircleDivIcon } from '../utils/leaflet-pet-photo-icon';
import { useI18n } from '@/app/providers/I18nContext';
import { PetMapPopup } from '@/entities/pet/ui/PetMapPopup';
import { tokens } from '@/shared/styles/tokens';

const { primary, textOnBrand, bgBase } = tokens.colors;
const mapClusterShadow = tokens.shadow.mapCluster;

interface MapViewProps {
  pets: Pet[];
  onPetClick: (pet: Pet) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  center?: [number, number];
  zoom?: number;
}

const isTouchDevice = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function createClusterGroup(): L.MarkerClusterGroup {
  return L.markerClusterGroup({
    maxClusterRadius: 72,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    chunkedLoading: true,
    iconCreateFunction(cluster) {
      const count = cluster.getChildCount();
      const size = count < 10 ? 40 : count < 100 ? 48 : 56;
      const half = Math.round(size / 2);
      return L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${primary};color:${textOnBrand};font-weight:700;font-size:${count >= 100 ? 13 : 15}px;display:flex;align-items:center;justify-content:center;border:3px solid ${bgBase};box-shadow:${mapClusterShadow}">${count}</div>`,
        className: 'pet-map-cluster',
        iconSize: [size, size],
        iconAnchor: [half, half],
      });
    },
  });
}

export default function MapView({ pets, onPetClick, onBoundsChange, center = [53.9006, 27.5590], zoom = 11 }: MapViewProps) {
  const { t } = useI18n();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const previewRootsRef = useRef<Root[]>([]);

  /** Рендерит PetMapPopup в отдельный React-корень: Leaflet принимает готовый DOM-узел. */
  const createPreviewNode = (pet: Pet, onDetails?: () => void): HTMLDivElement => {
    const container = document.createElement('div');
    const animal = t.pet.animalType[pet.animalType];
    const root = createRoot(container);
    root.render(
      <PetMapPopup
        pet={pet}
        title={pet.breed ? `${animal} — ${pet.breed}` : animal}
        statusLabel={t.pet.status[pet.status]}
        detailsLabel={t.petCard.details}
        onDetails={onDetails}
      />,
    );
    previewRootsRef.current.push(root);
    return container;
  };

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        keepBuffer: 4,
        updateWhenZooming: false,
        updateWhenIdle: true,
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = createClusterGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle bounds change
      const handleBoundsChange = () => {
        if (onBoundsChange) {
          onBoundsChange(map.getBounds());
        }
      };

      map.on('moveend', handleBoundsChange);
      map.on('zoomend', handleBoundsChange);
      
      // Initial bounds
      handleBoundsChange();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Update View when center/zoom props change
  useEffect(() => {
    if (mapInstanceRef.current && center && zoom) {
      mapInstanceRef.current.setView(center, zoom, { animate: true, duration: 0.5 });
    }
  }, [center, zoom]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    pets.forEach(pet => {
      const marker = L.marker(
        [pet.location.lat, pet.location.lng],
        { icon: getPetPhotoCircleDivIcon({ photoUrl: pet.photos?.[0], status: pet.status }) }
      );

      if (isTouchDevice) {
        marker.bindPopup(
          createPreviewNode(pet, () => {
            onPetClick(pet);
            mapInstanceRef.current?.closePopup();
          }),
          {
            offset: [0, -10],
            closeButton: true,
            className: 'pet-preview-popup',
          },
        );
      } else {
        marker.on('click', () => {
          onPetClick(pet);
        });

        marker.bindTooltip(createPreviewNode(pet), {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95,
        });
      }

      markersLayerRef.current?.addLayer(marker);
    });

    return () => {
      const roots = previewRootsRef.current;
      previewRootsRef.current = [];
      /* Асинхронно: React запрещает синхронный unmount корня из жизненного цикла другого дерева. */
      setTimeout(() => roots.forEach(root => root.unmount()), 0);
    };
  }, [pets, onPetClick, t]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border">
      <div ref={mapContainerRef} className="h-full w-full z-0" />
    </div>
  );
}