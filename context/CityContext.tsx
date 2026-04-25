import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'pet_finder_user_location';
const CONFIRMED_KEY = 'pet_finder_city_confirmed';

interface SavedLocation {
  lat: number;
  lng: number;
  city?: string;
}

function readFromStorage(): SavedLocation | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const data = JSON.parse(saved);
    const { lat, lng } = data;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng, city: (data.city || '').trim() };
    }
  } catch (err: unknown) {
    console.warn('[CityContext] readFromStorage parse failed', err);
  }
  return null;
}

interface CityContextValue {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  saveCity: (lat: number, lng: number, city: string) => void;
  clearCity: () => void;
}

const CityContext = createContext<CityContextValue | null>(null);

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<string>(() => {
    const loc = readFromStorage();
    return loc?.city || '';
  });

  const saveCity = useCallback((lat: number, lng: number, city: string) => {
    try {
      const toSave = { lat, lng, city: city.trim() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      localStorage.setItem(CONFIRMED_KEY, 'true');
      setSelectedCityState(city.trim());
    } catch (err: unknown) {
      console.warn('[CityContext] saveCity storage failed', err);
    }
  }, []);

  const clearCity = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(CONFIRMED_KEY, 'true');
      setSelectedCityState('');
    } catch (err: unknown) {
      console.warn('[CityContext] clearCity storage failed', err);
    }
  }, []);

  const setSelectedCity = useCallback((city: string) => {
    setSelectedCityState(city.trim());
  }, []);

  useEffect(() => {
    const loc = readFromStorage();
    if (loc?.city) setSelectedCityState(loc.city);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const loc2 = readFromStorage();
        setSelectedCityState(loc2?.city ?? '');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value: CityContextValue = {
    selectedCity,
    setSelectedCity,
    saveCity,
    clearCity,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
}

export function useCityOptional() {
  return useContext(CityContext);
}
