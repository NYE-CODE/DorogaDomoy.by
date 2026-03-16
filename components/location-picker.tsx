import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { reverseGeocode } from '../utils/geocode';

interface LocationPickerProps {
  initialLocation: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  onAddressChange?: (address: string) => void;
  onLocationWithAddress?: (location: { lat: number; lng: number }, address: string) => void;
}

export function LocationPicker({ initialLocation, onLocationSelect, onAddressChange, onLocationWithAddress }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const onLocationSelectRef = useRef(onLocationSelect);
  const onAddressChangeRef = useRef(onAddressChange);
  const onLocationWithAddressRef = useRef(onLocationWithAddress);
  onLocationSelectRef.current = onLocationSelect;
  onAddressChangeRef.current = onAddressChange;
  onLocationWithAddressRef.current = onLocationWithAddress;

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const [lat, lng] = [initialLocation.lat, initialLocation.lng];
    const map = L.map(mapContainerRef.current).setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const pinIcon = L.divIcon({
      html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#2563eb" width="30" height="30">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
        </svg>
      </div>`,
      className: 'location-picker-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    const marker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map);
    markerRef.current = marker;
    mapInstanceRef.current = map;
    setIsReady(true);

    const handleLocationChange = async (lat: number, lng: number) => {
      const loc = { lat, lng };
      const address = await reverseGeocode(lat, lng);
      if (address && onLocationWithAddressRef.current) {
        onLocationWithAddressRef.current(loc, address);
      } else {
        onLocationSelectRef.current(loc);
        if (address) onAddressChangeRef.current?.(address);
      }
    };

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleLocationChange(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      handleLocationChange(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !isReady) return;
    mapInstanceRef.current.flyTo([initialLocation.lat, initialLocation.lng], 14, { duration: 0.3 });
    if (markerRef.current) {
      markerRef.current.setLatLng([initialLocation.lat, initialLocation.lng]);
    }
  }, [initialLocation.lat, initialLocation.lng, isReady]);

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }
    setLocating(true);
    let resolved = false;

    const applyPosition = async (pos: GeolocationPosition) => {
      if (resolved) return;
      resolved = true;
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const loc = { lat, lng };
      const address = await reverseGeocode(lat, lng);
      if (address && onLocationWithAddressRef.current) {
        onLocationWithAddressRef.current(loc, address);
      } else {
        onLocationSelectRef.current(loc);
        if (address) onAddressChangeRef.current?.(address);
      }
      setLocating(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 18, { duration: 0.5 });
      }
      if (accuracy > 100) {
        toast.info('Позиция приблизительная. Перетащите маркер для точного указания улицы.', { duration: 5000 });
      }
    };

    const fail = (msg: string) => {
      if (resolved) return;
      resolved = true;
      setLocating(false);
      alert(msg);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => applyPosition(pos),
      (err) => {
        if (err.code === 1) {
          fail('Доступ к геолокации запрещён. Разрешите доступ в настройках браузера и обновите страницу.');
        } else if (err.code === 2) {
          fail('Местоположение недоступно. Убедитесь, что GPS/Wi‑Fi включены, и попробуйте снова.');
        } else if (err.code === 3) {
          fail('Превышено время ожидания. Попробуйте выбрать точку на карте вручную.');
        } else {
          fail('Не удалось определить местоположение. Выберите точку на карте вручную.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // страховка: если браузер завис и не вызвал callback — снимаем загрузку через 12 сек
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLocating(false);
        alert('Геолокация не отвечает. Разрешите доступ к местоположению в браузере или выберите точку на карте.');
      }
    }, 12000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          Нажмите на карту, перетащите маркер или укажите текущее местоположение
        </p>
        <button
          type="button"
          onClick={handleMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? 'Определение…' : 'Моё местоположение'}
        </button>
      </div>
      <div ref={mapContainerRef} className="h-48 w-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-0" />
    </div>
  );
}
