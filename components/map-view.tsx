import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pet } from '../types/pet';
import { statusLabels, animalTypeLabels, statusColors, formatDate } from '../utils/pet-helpers';
import { Navigation } from 'lucide-react';

interface MapViewProps {
  pets: Pet[];
  onPetClick: (pet: Pet) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  center?: [number, number];
  zoom?: number;
}

// Create custom icons for different animal types and statuses
const createMarkerIcon = (animalType: string, status: string) => {
  const colors: Record<string, string> = {
    searching: '#ef4444',
    spotted: '#f97316',
    found: '#3b82f6',
    fostering: '#a855f7',
    shelter: '#6366f1',
    returned: '#10b981',
    adopted: '#059669',
    transferred: '#14b8a6',
  };

  const color = colors[status] || '#6b7280';
  const symbol = animalType === 'cat' ? '🐱' : animalType === 'dog' ? '🐕' : '🐾';

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 16px;
      ">
        ${symbol}
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export function MapView({ pets, onPetClick, onBoundsChange, center = [53.9006, 27.5590], zoom = 11 }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
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

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    pets.forEach(pet => {
      const marker = L.marker(
        [pet.location.lat, pet.location.lng],
        { icon: createMarkerIcon(pet.animalType, pet.status) }
      );

      const previewHtml = `
        <div class="w-48">
          <img 
            src="${pet.photos[0]}" 
            alt="${animalTypeLabels[pet.animalType]}"
            style="width: 100%; height: 128px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"
          />
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <h4 style="font-weight: 600; font-size: 14px; margin: 0;">
              ${animalTypeLabels[pet.animalType]} ${pet.breed ? `· ${pet.breed}` : ''}
            </h4>
            <div class="${statusColors[pet.status]}" style="display: inline-flex; padding: 2px 6px; border-radius: 4px; font-size: 12px; width: fit-content;">
              ${statusLabels[pet.status]}
            </div>
            <p style="font-size: 12px; color: #4b5563; margin: 0;">${pet.city}</p>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">${formatDate(pet.publishedAt)}</p>
          </div>
        </div>
      `;

      if (isTouchDevice) {
        const popupContent = document.createElement('div');
        popupContent.innerHTML = previewHtml;
        popupContent.style.cursor = 'pointer';
        popupContent.addEventListener('click', () => {
          onPetClick(pet);
          mapInstanceRef.current?.closePopup();
        });

        marker.bindPopup(popupContent, {
          offset: [0, -10],
          closeButton: true,
          className: 'pet-preview-popup',
        });
      } else {
        marker.on('click', () => {
          onPetClick(pet);
        });

        marker.bindTooltip(previewHtml, {
          direction: 'top',
          offset: [0, -10],
          opacity: 0.95
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