import { useEffect, useRef, useState } from 'react';
import { City, DEFAULT_CITY, findClosestCity } from '@/shared/lib/cities';
import { reverseGeocodeLocality } from '@/shared/lib/geocode';
import {
  BELARUS_CENTER,
  BELARUS_ZOOM,
  getSavedUserLocation,
  initialMapCenter,
  initialMapZoom,
  isCityConfirmed,
  saveUserLocation,
} from './search-storage';

export function useSearchCitySetup(saveCity: (lat: number, lng: number, name: string) => void, clearCity: () => void) {
  const savedLoc = getSavedUserLocation();
  const initialSavedLocRef = useRef(savedLoc);
  const cityConfirmed = isCityConfirmed();

  const [mapCenter, setMapCenter] = useState<[number, number]>(initialMapCenter(savedLoc, cityConfirmed));
  const [mapZoom, setMapZoom] = useState(initialMapZoom(savedLoc, cityConfirmed));
  const [showCityModal, setShowCityModal] = useState(false);
  const [showCityDetectPopup, setShowCityDetectPopup] = useState(false);
  const [detectedCityName, setDetectedCityName] = useState('');
  const detectedCityRef = useRef<City | null>(null);

  useEffect(() => {
    if (cityConfirmed) return;

    const ac = new AbortController();
    const timeoutMs = 5000;
    const timeoutId = window.setTimeout(() => ac.abort(), timeoutMs);

    const detectCity = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: ac.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (ac.signal.aborted) return;
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          const closest = findClosestCity(data.latitude, data.longitude);
          detectedCityRef.current = closest;
          setDetectedCityName(closest.name);
          setShowCityDetectPopup(true);
          return;
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if ((err instanceof DOMException || err instanceof Error) && err.name === 'AbortError') return;
        console.warn('[SearchPage] IP geolocation (ipapi.co) failed', err);
      }

      if (ac.signal.aborted) return;
      detectedCityRef.current = DEFAULT_CITY;
      setDetectedCityName(DEFAULT_CITY.name);
      setShowCityDetectPopup(true);
    };

    void detectCity();

    return () => {
      clearTimeout(timeoutId);
      ac.abort();
    };
  }, [cityConfirmed]);

  useEffect(() => {
    const initialSavedLoc = initialSavedLocRef.current;
    if (!initialSavedLoc?.city || !initialSavedLoc.city.includes(',')) return;

    let cancelled = false;
    reverseGeocodeLocality(initialSavedLoc.lat, initialSavedLoc.lng).then((locality) => {
      if (cancelled || !locality || locality === initialSavedLoc.city) return;
      saveCity(initialSavedLoc.lat, initialSavedLoc.lng, locality);
      saveUserLocation({ lat: initialSavedLoc.lat, lng: initialSavedLoc.lng }, locality);
    });

    return () => {
      cancelled = true;
    };
  }, [saveCity]);

  const confirmCity = (city: City) => {
    saveCity(city.coordinates[0], city.coordinates[1], city.name);
    setMapCenter(city.coordinates);
    setMapZoom(city.zoom || 12);
    saveUserLocation({ lat: city.coordinates[0], lng: city.coordinates[1] }, city.name);
  };

  const handleCityModalSelect = (city: City | null) => {
    if (city) {
      confirmCity(city);
    } else {
      clearCity();
      setMapCenter(BELARUS_CENTER);
      setMapZoom(BELARUS_ZOOM);
    }
    setShowCityModal(false);
  };

  const handleCityDetectConfirm = () => {
    const city = detectedCityRef.current;
    if (city) confirmCity(city);
    setShowCityDetectPopup(false);
  };

  const handleCityDetectReject = () => {
    setShowCityDetectPopup(false);
    setShowCityModal(true);
  };

  return {
    mapCenter,
    mapZoom,
    showCityModal,
    setShowCityModal,
    showCityDetectPopup,
    detectedCityName,
    handleCityModalSelect,
    handleCityDetectConfirm,
    handleCityDetectReject,
  };
}
