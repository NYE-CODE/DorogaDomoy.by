import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../context/I18nContext';
import { reverseGeocodeStructured } from '../utils/geocode';
import { tokens } from '@/shared/styles/tokens';

interface LocationPickerProps {
  initialLocation: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  onAddressChange?: (address: string) => void;
  onLocationWithAddress?: (location: { lat: number; lng: number }, address: string) => void;
  /** Один reverse-запрос: подставить и адресную строку, и населённый пункт (напр. город). */
  onLocationPlaceSync?: (
    location: { lat: number; lng: number },
    place: { formattedAddress: string; locality: string | null },
  ) => void;
  /** Высота карты (по умолчанию h-48) */
  mapHeight?: string;
  /** Радиус зоны на карте в км (круг вокруг маркера). */
  radiusKm?: number;
  /** Подпись радиуса поверх карты. */
  radiusBadge?: string;
}

export function LocationPicker({
  initialLocation,
  onLocationSelect,
  onAddressChange,
  onLocationWithAddress,
  onLocationPlaceSync,
  mapHeight = 'h-48',
  radiusKm,
  radiusBadge,
}: LocationPickerProps) {
  const { t } = useI18n();
  const lp = t.locationPicker;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const prevRadiusKmRef = useRef<number | undefined>(undefined);
  const prevCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const onLocationSelectRef = useRef(onLocationSelect);
  const onAddressChangeRef = useRef(onAddressChange);
  const onLocationWithAddressRef = useRef(onLocationWithAddress);
  const onLocationPlaceSyncRef = useRef(onLocationPlaceSync);
  const geoFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  onLocationSelectRef.current = onLocationSelect;
  onAddressChangeRef.current = onAddressChange;
  onLocationWithAddressRef.current = onLocationWithAddress;
  onLocationPlaceSyncRef.current = onLocationPlaceSync;

  useEffect(() => {
    return () => {
      if (geoFallbackTimerRef.current) clearTimeout(geoFallbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const [lat, lng] = [initialLocation.lat, initialLocation.lng];
    const map = L.map(mapContainerRef.current).setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const pinIcon = L.divIcon({
      html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${tokens.colors.mapPin}" width="30" height="30">
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
      const place = await reverseGeocodeStructured(lat, lng);
      if (place && onLocationPlaceSyncRef.current) {
        onLocationPlaceSyncRef.current(loc, place);
        return;
      }
      if (place?.formattedAddress && onLocationWithAddressRef.current) {
        onLocationWithAddressRef.current(loc, place.formattedAddress);
      } else {
        onLocationSelectRef.current(loc);
        if (place?.formattedAddress) onAddressChangeRef.current?.(place.formattedAddress);
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
      if (circleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
      }
      circleRef.current = null;
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !isReady) return;

    const map = mapInstanceRef.current;
    const { lat, lng } = initialLocation;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    if (radiusKm == null || radiusKm <= 0) {
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      prevRadiusKmRef.current = radiusKm;
      map.flyTo([lat, lng], 14, { duration: 0.3 });
      return;
    }

    const radiusM = radiusKm * 1000;
    const baseStyle: L.PathOptions = {
      color: tokens.colors.primary,
      fillColor: tokens.colors.primary,
      fillOpacity: 0.16,
      weight: 2.5,
      opacity: 0.9,
    };

    if (!circleRef.current) {
      circleRef.current = L.circle([lat, lng], { radius: radiusM, ...baseStyle }).addTo(map);
    } else {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radiusM);
      circleRef.current.setStyle(baseStyle);
    }

    if (typeof circleRef.current.bringToBack === 'function') {
      circleRef.current.bringToBack();
    }
    const marker = markerRef.current;
    if (marker) {
      marker.remove();
      marker.addTo(map);
    }

    const radiusChanged = prevRadiusKmRef.current !== radiusKm;
    const prevCenter = prevCenterRef.current;
    const centerMoved =
      prevCenter != null &&
      (Math.abs(prevCenter.lat - lat) > 0.00001 || Math.abs(prevCenter.lng - lng) > 0.00001);
    prevRadiusKmRef.current = radiusKm;
    prevCenterRef.current = { lat, lng };

    if (radiusChanged) {
      circleRef.current.setStyle({ fillOpacity: 0.32, weight: 3.5 });
      window.setTimeout(() => {
        circleRef.current?.setStyle(baseStyle);
      }, 500);
      map.flyToBounds(circleRef.current.getBounds(), {
        padding: [32, 32],
        maxZoom: 15,
        duration: 0.45,
      });
    } else if (centerMoved) {
      map.panTo([lat, lng], { animate: true, duration: 0.3 });
    }
  }, [initialLocation.lat, initialLocation.lng, radiusKm, isReady]);

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error(lp.geoUnsupported);
      return;
    }
    setLocating(true);
    let resolved = false;

    const applyPosition = async (pos: GeolocationPosition) => {
      if (resolved) return;
      resolved = true;
      if (geoFallbackTimerRef.current) {
        clearTimeout(geoFallbackTimerRef.current);
        geoFallbackTimerRef.current = null;
      }
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      const loc = { lat, lng };
      const place = await reverseGeocodeStructured(lat, lng);
      if (place && onLocationPlaceSyncRef.current) {
        onLocationPlaceSyncRef.current(loc, place);
      } else if (place?.formattedAddress && onLocationWithAddressRef.current) {
        onLocationWithAddressRef.current(loc, place.formattedAddress);
      } else {
        onLocationSelectRef.current(loc);
        if (place?.formattedAddress) onAddressChangeRef.current?.(place.formattedAddress);
      }
      setLocating(false);
      if (mapInstanceRef.current) {
        if (circleRef.current && radiusKm != null && radiusKm > 0) {
          circleRef.current.setLatLng([lat, lng]);
          markerRef.current?.setLatLng([lat, lng]);
          mapInstanceRef.current.flyToBounds(circleRef.current.getBounds(), {
            padding: [32, 32],
            maxZoom: 15,
            duration: 0.5,
          });
        } else {
          mapInstanceRef.current.flyTo([lat, lng], 18, { duration: 0.5 });
        }
      }
      if (accuracy > 100) {
        toast.info(lp.approximatePosition, { duration: 5000 });
      }
    };

    const fail = (msg: string) => {
      if (resolved) return;
      resolved = true;
      if (geoFallbackTimerRef.current) {
        clearTimeout(geoFallbackTimerRef.current);
        geoFallbackTimerRef.current = null;
      }
      setLocating(false);
      toast.error(msg);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => applyPosition(pos),
      (err) => {
        if (err.code === 1) {
          fail(lp.geoDenied);
        } else if (err.code === 2) {
          fail(lp.geoUnavailable);
        } else if (err.code === 3) {
          fail(lp.geoTimeout);
        } else {
          fail(lp.geoFailed);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // страховка: если браузер завис и не вызвал callback — снимаем загрузку через 12 сек
    if (geoFallbackTimerRef.current) clearTimeout(geoFallbackTimerRef.current);
    geoFallbackTimerRef.current = setTimeout(() => {
      geoFallbackTimerRef.current = null;
      if (!resolved) {
        resolved = true;
        setLocating(false);
        toast.error(lp.geoNotResponding);
      }
    }, 12000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {lp.hint}
        </p>
        <button
          type="button"
          onClick={handleMyLocation}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? lp.locating : lp.myLocation}
        </button>
      </div>
      <div className="relative">
        <div ref={mapContainerRef} className={`${mapHeight} w-full rounded-lg border border-border overflow-hidden z-0`} />
        {radiusKm != null && radiusKm > 0 && radiusBadge ? (
          <div
            className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded-md border border-primary/35 bg-background/95 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur-sm"
            aria-live="polite"
          >
            {radiusBadge}
          </div>
        ) : null}
      </div>
    </div>
  );
}
