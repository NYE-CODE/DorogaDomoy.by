import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/layout/Header';
import { CitySelectModal } from '../components/city-select-modal';
import { SettingsContent } from '../components/settings-page';
import type { City } from '../utils/cities';

export default function SettingsPageRoute() {
  const navigate = useNavigate();

  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const saved = localStorage.getItem('pet_finder_user_location');
      if (saved) {
        const data = JSON.parse(saved);
        return (data.city || '').trim();
      }
    } catch {}
    return '';
  });
  const [showCityModal, setShowCityModal] = useState(false);

  const saveUserLocation = useCallback((loc: { lat: number; lng: number }, city?: string) => {
    try {
      const toSave: { lat: number; lng: number; city?: string } = { lat: loc.lat, lng: loc.lng };
      if (city) toSave.city = city;
      localStorage.setItem('pet_finder_user_location', JSON.stringify(toSave));
    } catch {}
  }, []);

  const handleCityModalSelect = useCallback((city: City | null) => {
    if (city) {
      setSelectedCity(city.name);
      saveUserLocation({ lat: city.coordinates[0], lng: city.coordinates[1] }, city.name);
    } else {
      setSelectedCity('');
      try { localStorage.removeItem('pet_finder_user_location'); } catch {}
    }
    try { localStorage.setItem('pet_finder_city_confirmed', 'true'); } catch {}
    setShowCityModal(false);
  }, [saveUserLocation]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        onViewChange={() => navigate('/')}
        selectedCity={selectedCity}
        onCityClick={() => setShowCityModal(true)}
      />

      <div className="flex-1">
        <SettingsContent />
      </div>

      <CitySelectModal
        open={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelect={handleCityModalSelect}
        currentCity={selectedCity}
      />
    </div>
  );
}
