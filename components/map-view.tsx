import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { Pet } from '../types/pet';
import { statusLabels, animalTypeLabels, statusColors, formatDate } from '../utils/pet-helpers';
import { getPetPhotoCircleDivIcon, getSafePetPhotoSrc } from '../utils/leaflet-pet-photo-icon';

interface MapViewProps {
  pets: Pet[];
  onPetClick: (pet: Pet) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  center?: [number, number];
  zoom?: number;
}

const isTouchDevice = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function createPreviewContent(pet: Pet): HTMLDivElement {
  const container = document.createElement('div');
  container.style.width = '12rem';

  const image = document.createElement('img');
  image.src = getSafePetPhotoSrc(pet.photos?.[0]);
  image.alt = animalTypeLabels[pet.animalType];
  image.loading = 'lazy';
  image.style.width = '100%';
  image.style.height = '128px';
  image.style.objectFit = 'cover';
  image.style.borderRadius = '8px';
  image.style.marginBottom = '8px';
  container.appendChild(image);

  const info = document.createElement('div');
  info.style.display = 'flex';
  info.style.flexDirection = 'column';
  info.style.gap = '4px';

  const title = document.createElement('h4');
  title.style.fontWeight = '600';
  title.style.fontSize = '14px';
  title.style.margin = '0';
  title.textContent = pet.breed
    ? `${animalTypeLabels[pet.animalType]} · ${pet.breed}`
    : animalTypeLabels[pet.animalType];
  info.appendChild(title);

  const status = document.createElement('div');
  status.className = statusColors[pet.status];
  status.style.display = 'inline-flex';
  status.style.padding = '2px 6px';
  status.style.borderRadius = '4px';
  status.style.fontSize = '12px';
  status.style.width = 'fit-content';
  status.textContent = statusLabels[pet.status];
  info.appendChild(status);

  const city = document.createElement('p');
  city.style.fontSize = '12px';
  city.style.color = '#4b5563';
  city.style.margin = '0';
  city.textContent = pet.city;
  info.appendChild(city);

  const publishedAt = document.createElement('p');
  publishedAt.style.fontSize = '12px';
  publishedAt.style.color = '#6b7280';
  publishedAt.style.margin = '0';
  publishedAt.textContent = formatDate(pet.publishedAt);
  info.appendChild(publishedAt);

  container.appendChild(info);
  return container;
}

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
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#FF9800;color:#fff;font-weight:700;font-size:${count >= 100 ? 13 : 15}px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.28)">${count}</div>`,
        className: 'pet-map-cluster',
        iconSize: [size, size],
        iconAnchor: [half, half],
      });
    },
  });
}

export default function MapView({ pets, onPetClick, onBoundsChange, center = [53.9006, 27.5590], zoom = 11 }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null);

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

      const previewContent = createPreviewContent(pet);

      if (isTouchDevice) {
        previewContent.style.cursor = 'pointer';
        previewContent.addEventListener('click', () => {
          onPetClick(pet);
          mapInstanceRef.current?.closePopup();
        });

        marker.bindPopup(previewContent, {
          offset: [0, -10],
          closeButton: true,
          className: 'pet-preview-popup',
        });
      } else {
        marker.on('click', () => {
          onPetClick(pet);
        });

        marker.bindTooltip(createPreviewContent(pet), {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95,
        });
      }

      markersLayerRef.current?.addLayer(marker);
    });

  }, [pets, onPetClick]);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapContainerRef} className="h-full w-full z-0" />
    </div>
  );
}