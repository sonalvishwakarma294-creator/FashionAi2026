
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCloud, FiSun, FiCloudRain, FiWind, FiMapPin, FiSearch, FiDroplet, FiMoon, FiRefreshCw, FiZap } from 'react-icons/fi';

const WeatherRecommendation = () => {
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('Current Location');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const fetchWeather = async (lat, lon, name = 'Current Location') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=auto`
      );
      const data = await response.json();
      
      const currentHour = new Date().getHours();
      const humidity = data.hourly.relativehumidity_2m[currentHour] || 0;
      
      setWeather({
        ...data.current_weather,
        humidity,
        location: name
      });
      setLocationName(name);
      setLoading(false);
      setShowSearch(false);
    } catch (err) {
      setError('Could not fetch weather data');
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { latitude, longitude, name, country } = data.results[0];
        await fetchWeather(latitude, longitude, `${name}, ${country}`);
      } else {
        setError('City not found. Please try again.');
      }
    } catch (err) {
      setError('Failed to search location.');
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      // Set a timeout for geolocation
      const geoTimeout = setTimeout(() => {
        console.log('Geolocation timeout, using default');
        fetchWeather(40.7128, -74.0060, 'New York, US');
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(geoTimeout);
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          clearTimeout(geoTimeout);
          console.warn('Geolocation error:', err.message);
          // Fallback to a default city if geolocation fails
          fetchWeather(40.7128, -74.0060, 'New York, US');
        },
        { timeout: 10000 }
      );
    } else {
      fetchWeather(40.7128, -74.0060, 'New York, US');
    }
  };

  useEffect(() => {
    getCurrentLocation();
    const interval = setInterval(() => {
      if (weather && weather.latitude) {
        fetchWeather(weather.latitude, weather.longitude, locationName);
      }
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getOutfitSuggestion = (currentWeather) => {
    if (!currentWeather) return null;

    const temp = currentWeather.temperature;
    const weatherCode = currentWeather.weathercode;
    const isDay = currentWeather.is_day === 1;
    const windSpeed = currentWeather.windspeed;

    let suggestion = {
      message: '',
      theme: 'from-blue-400 to-blue-600',
      icon: isDay ? <FiSun className="text-yellow-300" /> : <FiMoon className="text-blue-100" />,
      outfit: [],
      fabric: '',
      accessory: ''
    };

    const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode);

    if (isRainy) {
      suggestion.message = "Rainy skies ahead. Stay dry and stylish!";
      suggestion.theme = 'from-slate-700 to-slate-900';
      suggestion.outfit = ['Raincoat', 'Waterproof Boots', 'Pants'];
      suggestion.fabric = 'Water-resistant Nylon';
      suggestion.accessory = 'Compact Umbrella';
      suggestion.icon = <FiCloudRain className="text-blue-400" />;
    } else if (temp > 30) {
      suggestion.message = "It's scorching hot! High breathability is a must.";
      suggestion.theme = 'from-orange-400 to-red-500';
      suggestion.outfit = ['Cotton T-shirt', 'Linen Shorts', 'Sandals'];
      suggestion.fabric = '100% Organic Linen';
      suggestion.accessory = 'UV Sunglasses & Cap';
      suggestion.icon = <FiSun className="text-yellow-200" />;
    } else if (temp >= 20 && temp <= 30) {
      suggestion.message = "Perfect weather! Balance comfort with a clean look.";
      suggestion.theme = 'from-emerald-400 to-teal-600';
      suggestion.outfit = ['Slim-fit T-shirt', 'Tapered Chinos', 'Sneakers'];
      suggestion.fabric = 'Breathable Cotton';
      suggestion.accessory = 'Minimalist Watch';
      suggestion.icon = <FiSun className="text-yellow-300" />;
    } else if (temp >= 10 && temp < 20) {
      suggestion.message = "A bit crisp outside. Smart layering is your best friend.";
      suggestion.theme = 'from-blue-500 to-indigo-700';
      suggestion.outfit = ['Bomber Jacket', 'Hoodie', 'Jeans'];
      suggestion.fabric = 'Denim or Wool-blend';
      suggestion.accessory = 'Knit Beanie';
      suggestion.icon = <FiCloud className="text-blue-200" />;
    } else {
      suggestion.message = "Brrr! It's cold. Heavy layers for maximum warmth.";
      suggestion.theme = 'from-indigo-800 to-purple-900';
      suggestion.outfit = ['Puffer Jacket', 'Cashmere Sweater', 'Scarf'];
      suggestion.fabric = 'Heavy Wool or Down';
      suggestion.accessory = 'Gloves & Scarf';
      suggestion.icon = <FiWind className="text-white" />;
    }

    if (windSpeed > 20 && !isRainy) {
      suggestion.message += " Strong winds detected.";
      if (!suggestion.outfit.includes('Windbreaker')) suggestion.outfit.unshift('Windbreaker');
    }

    return suggestion;
  };

  if (loading && !weather) return (
    <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/20 mt-6 animate-pulse">
      <div className="flex items-center justify-center space-x-3 text-white/50">
        <FiRefreshCw className="animate-spin" />
        <span className="font-black uppercase text-xs tracking-widest">Scanning Skies...</span>
      </div>
    </div>
  );

  const suggestion = getOutfitSuggestion(weather);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${suggestion.theme} rounded-[2.5rem] p-8 mt-6 shadow-2xl relative overflow-hidden text-white border border-white/10`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        {suggestion?.icon && React.cloneElement(suggestion.icon, { className: 'w-48 h-48' })}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <FiMapPin className="w-4 h-4" />
            </div>
            <span className="font-black uppercase text-[10px] tracking-widest">{locationName}</span>
          </div>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all backdrop-blur-md border border-white/10"
          >
            {showSearch ? 'Close' : 'Change'}
          </button>
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.form
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              onSubmit={handleSearch}
              className="overflow-hidden"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter city..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white/50 text-sm backdrop-blur-md"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-white text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-opacity-90 disabled:opacity-50 transition-all"
                >
                  {isSearching ? <FiRefreshCw className="animate-spin" /> : 'Go'}
                </button>
              </div>
              {error && <p className="text-white/80 text-[10px] font-bold mt-2 uppercase tracking-tighter">{error}</p>}
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-7xl font-black tracking-tighter flex items-start">
              {Math.round(weather.temperature)}
              <span className="text-2xl font-light mt-2 ml-1">°C</span>
            </div>
            <div className="mt-2 flex gap-4 text-[10px] font-black uppercase tracking-widest opacity-70">
              <span className="flex items-center gap-1"><FiWind /> {weather.windspeed} km/h</span>
              <span className="flex items-center gap-1"><FiDroplet /> {weather.humidity}% Hum</span>
            </div>
          </div>
          <div className="text-5xl">
            {suggestion.icon}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
                <FiZap className="text-yellow-300 w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70">AI Recommendation</span>
            </div>
            <p className="text-sm font-bold leading-relaxed mb-4 italic">
              "{suggestion.message}"
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 block">Ideal Fabric</span>
                <span className="text-[10px] font-bold uppercase">{suggestion.fabric}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 block">Must-have</span>
                <span className="text-[10px] font-bold uppercase">{suggestion.accessory}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestion.outfit.map((item, index) => (
              <span
                key={index}
                className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherRecommendation;
