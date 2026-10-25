import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCloud, FiSun, FiCloudRain, FiWind, FiMapPin, 
  FiSearch, FiDroplet, FiMoon, FiRefreshCw, FiZap, FiCheck 
} from 'react-icons/fi';

const WeatherRecommendation = ({ compact = false }) => {
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState(() => {
    return localStorage.getItem('fashion_weather_loc') || 'Detecting Location...';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Reverse geocode latitude/longitude to City, State/Country
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (res.ok) {
        const data = await res.json();
        const city = data.city || data.locality || data.principalSubdivision;
        const country = data.countryCode || data.countryName;
        if (city) {
          return country ? `${city}, ${country}` : city;
        }
      }
    } catch (e) {
      console.warn("Reverse geocode warning:", e);
    }
    return `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
  };

  const fetchWeather = async (lat, lon, customName = null) => {
    setLoading(true);
    setError(null);
    try {
      let displayName = customName;
      if (!displayName || displayName === 'Detecting Location...' || displayName === 'Current Location') {
        displayName = await reverseGeocode(lat, lon);
      }

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=auto`
      );
      if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
      const data = await response.json();
      
      // Match current time to the API's timezone-aware hourly timestamps
      const currentTime = data.current_weather?.time; // e.g. "2026-09-02T12:30"
      const currentHourStr = currentTime ? currentTime.slice(0, 13) + ':00' : null; // "2026-09-02T12:00"
      const hourlyTimes = data.hourly?.time || [];
      const hourIndex = currentHourStr
        ? Math.max(0, hourlyTimes.findIndex(t => t === currentHourStr))
        : new Date().getHours();
      const humidity = data.hourly?.relativehumidity_2m?.[hourIndex >= 0 ? hourIndex : 0] ?? 55;
      
      setWeather({
        ...data.current_weather,
        latitude: lat,
        longitude: lon,
        humidity,
        location: displayName
      });
      setLocationName(displayName);
      localStorage.setItem('fashion_weather_loc', displayName);
      localStorage.setItem('fashion_weather_lat', lat.toString());
      localStorage.setItem('fashion_weather_lon', lon.toString());
      setShowSearch(false);
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError('Could not fetch real-time weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=6&language=en&format=json`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        if (data.results.length === 1) {
          const { latitude, longitude, name, country_code, admin1 } = data.results[0];
          const formatted = admin1 ? `${name}, ${admin1}, ${country_code}` : `${name}, ${country_code || ''}`;
          await fetchWeather(latitude, longitude, formatted);
          setSearchQuery('');
          setSearchResults([]);
        } else {
          setSearchResults(data.results);
        }
      } else {
        setError('City not found. Please try another city.');
      }
    } catch (err) {
      setError('Failed to search location.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = async (result) => {
    const { latitude, longitude, name, country_code, admin1 } = result;
    const formatted = admin1 ? `${name}, ${admin1}, ${country_code}` : `${name}, ${country_code || ''}`;
    await fetchWeather(latitude, longitude, formatted);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Fallback to IP-based location if GPS is denied or unavailable
  const fetchIpLocation = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const name = data.city ? `${data.city}, ${data.country_name || data.country_code}` : 'My Location';
          await fetchWeather(data.latitude, data.longitude, name);
          return true;
        }
      }
    } catch (e) {
      console.warn("IP Geolocation fallback error:", e);
    }
    return false;
  };

  const detectLocation = () => {
    // 1. Check if user already had a saved custom location
    const savedLat = localStorage.getItem('fashion_weather_lat');
    const savedLon = localStorage.getItem('fashion_weather_lon');
    const savedLoc = localStorage.getItem('fashion_weather_loc');

    if (savedLat && savedLon && savedLoc) {
      fetchWeather(parseFloat(savedLat), parseFloat(savedLon), savedLoc);
      return;
    }

    setLoading(true);

    // 2. Try browser GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const name = await reverseGeocode(lat, lon);
          fetchWeather(lat, lon, name);
        },
        async (err) => {
          console.warn('Browser GPS not available/denied, trying IP location:', err.message);
          const ipSuccess = await fetchIpLocation();
          if (!ipSuccess) {
            // Default to Delhi/Mumbai or user timezone fallback
            fetchWeather(28.6139, 77.2090, 'New Delhi, India');
          }
        },
        { timeout: 7000, enableHighAccuracy: false }
      );
    } else {
      fetchIpLocation().then((success) => {
        if (!success) fetchWeather(28.6139, 77.2090, 'New Delhi, India');
      });
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const getOutfitSuggestion = (currentWeather) => {
    if (!currentWeather) return null;

    const temp = currentWeather.temperature;
    const weatherCode = currentWeather.weathercode;
    const isDay = currentWeather.is_day === 1;
    const windSpeed = currentWeather.windspeed;

    let suggestion = {
      message: '',
      theme: 'from-blue-500 to-indigo-700',
      icon: isDay ? <FiSun className="text-yellow-300" /> : <FiMoon className="text-blue-100" />,
      outfit: [],
      fabric: '',
      accessory: ''
    };

    const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode);

    if (isRainy) {
      suggestion.message = "Rainy skies ahead. Stay dry and effortlessly stylish!";
      suggestion.theme = 'from-slate-700 to-slate-900';
      suggestion.outfit = ['Trench Coat', 'Waterproof Chelsea Boots', 'Tailored Pants'];
      suggestion.fabric = 'Water-resistant Treated Cotton';
      suggestion.accessory = 'Compact Umbrella & Leather Bag';
      suggestion.icon = <FiCloudRain className="text-blue-400" />;
    } else if (temp > 30) {
      suggestion.message = "Sunny & warm today! Opt for ultra-breathable, breezy fits.";
      suggestion.theme = 'from-amber-500 to-orange-600';
      suggestion.outfit = ['Linen Button-down', 'Chino Shorts', 'Minimalist Slides'];
      suggestion.fabric = '100% Pure Organic Linen';
      suggestion.accessory = 'UV Polarized Sunglasses & Straw Fedora';
      suggestion.icon = <FiSun className="text-yellow-200" />;
    } else if (temp >= 20 && temp <= 30) {
      suggestion.message = "Pleasant weather! Perfect for sharp smart-casual combinations.";
      suggestion.theme = 'from-teal-600 to-emerald-700';
      suggestion.outfit = ['Structured Cotton Tee', 'Tapered Trousers', 'Clean White Sneakers'];
      suggestion.fabric = 'Breathable Pima Cotton';
      suggestion.accessory = 'Classic Chrono Watch';
      suggestion.icon = <FiSun className="text-yellow-300" />;
    } else if (temp >= 10 && temp < 20) {
      suggestion.message = "A bit crisp outside. Layer up with structured textures.";
      suggestion.theme = 'from-blue-600 to-indigo-800';
      suggestion.outfit = ['Oversized Blazer', 'Merino Knit', 'Straight-leg Denim'];
      suggestion.fabric = 'Mid-weight Wool & Denim';
      suggestion.accessory = 'Cashmere Scarf';
      suggestion.icon = <FiCloud className="text-blue-200" />;
    } else {
      suggestion.message = "Cold climate alert. Heavy thermal layering recommended.";
      suggestion.theme = 'from-indigo-900 to-slate-900';
      suggestion.outfit = ['Insulated Down Coat', 'Chunky Wool Turtleneck', 'Fleece-lined Boots'];
      suggestion.fabric = 'Heavy Wool & Down Insulation';
      suggestion.accessory = 'Thermal Gloves & Beanie';
      suggestion.icon = <FiWind className="text-white" />;
    }

    if (windSpeed > 20 && !isRainy) {
      suggestion.message += " Gusty winds detected.";
      if (!suggestion.outfit.includes('Windbreaker')) suggestion.outfit.unshift('Windbreaker');
    }

    return suggestion;
  };

  if (loading && !weather) return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/20 mt-4 sm:mt-6 animate-pulse">
      <div className="flex items-center justify-center space-x-3 text-white/70 py-3 sm:py-4">
        <FiRefreshCw className="animate-spin text-base sm:text-lg" />
        <span className="font-bold uppercase text-[11px] sm:text-xs tracking-wider">Detecting local weather & city...</span>
      </div>
    </div>
  );

  if (error && !weather) return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-red-400/30 mt-4 sm:mt-6">
      <div className="flex flex-col items-center justify-center space-y-2.5 text-white/80 py-2 sm:py-3 text-center">
        <FiCloudRain className="text-red-300 text-2xl" />
        <span className="font-bold uppercase text-[11px] sm:text-xs tracking-wider text-red-200">{error}</span>
        <button
          onClick={() => {
            localStorage.removeItem('fashion_weather_lat');
            localStorage.removeItem('fashion_weather_lon');
            localStorage.removeItem('fashion_weather_loc');
            setError(null);
            detectLocation();
          }}
          className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-3.5 py-1.5 rounded-full hover:bg-white/25 transition-all border border-white/20"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const suggestion = getOutfitSuggestion(weather);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${suggestion?.theme || 'from-blue-500 to-indigo-700'} ${compact ? 'rounded-2xl p-4 sm:p-5 mt-0' : 'rounded-2xl sm:rounded-3xl p-4 sm:p-7 mt-4 sm:mt-6'} shadow-2xl relative overflow-hidden text-white border border-white/15`}
    >
      {/* Background Decorative Icon */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        {suggestion?.icon && React.cloneElement(suggestion.icon, { size: 140, className: 'w-28 h-28 sm:w-44 sm:h-44' })}
      </div>

      <div className="relative z-10">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md shrink-0">
              <FiMapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-black uppercase text-[11px] sm:text-xs tracking-wider block truncate">
                {locationName}
              </span>
              <span className="text-[10px] sm:text-[10.5px] font-semibold text-white/85 block mt-0.5">
                Real-time Live Forecast
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => {
                localStorage.removeItem('fashion_weather_lat');
                localStorage.removeItem('fashion_weather_lon');
                localStorage.removeItem('fashion_weather_loc');
                detectLocation();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs transition-all"
              title="Auto-detect Current GPS Location"
              aria-label="Refresh location"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-3 py-1.5 rounded-full hover:bg-white/25 transition-all backdrop-blur-md border border-white/10"
            >
              {showSearch ? 'Close' : 'Change City'}
            </button>
          </div>
        </div>

        {/* Search City Drawer */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleSearch} className="mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city (e.g. Vasai, Mumbai, London)..."
                    className="flex-1 bg-white/15 border border-white/25 rounded-xl px-4 py-2.5 text-white placeholder-white/60 focus:outline-none focus:border-white text-xs backdrop-blur-md"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-white text-gray-900 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/90 disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5"
                  >
                    {isSearching ? <FiRefreshCw className="animate-spin" /> : <FiSearch />}
                    {isSearching ? '' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Multiple Matches List */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-1.5 mb-2"
                  >
                    <p className="text-[10.5px] font-black uppercase tracking-wider text-white/85 px-1 mb-1.5">
                      {searchResults.length} matches found — select your city:
                    </p>
                    {searchResults.map((r, i) => (
                      <button
                        key={`${r.id || r.latitude}-${i}`}
                        onClick={() => selectSearchResult(r)}
                        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/15 hover:border-white/30 transition-all group"
                      >
                        <div className="flex items-start gap-2.5 text-left">
                          <FiMapPin className="w-3.5 h-3.5 text-white/80 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11.5px] font-black block text-white truncate">
                              {r.name}
                            </span>
                            <span className="text-[10px] font-semibold text-white/75 block truncate">
                              {[r.admin1, r.admin2, r.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>
                        <FiCheck className="w-3.5 h-3.5 text-white/30 group-hover:text-white/90 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="text-red-200 text-[10px] font-bold mt-2 bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-400/20">⚠ {error}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* General error banner (outside search form) */}
        {error && !showSearch && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-200 text-[10px] font-bold mb-4 bg-red-900/30 px-3 py-2 rounded-xl border border-red-400/20"
          >
            ⚠ {error}
          </motion.p>
        )}

        {/* Temperature & Weather Stats */}
        {weather && (
          <div className={`flex items-end justify-between ${compact ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
            <div>
              <div className={`${compact ? 'text-3xl sm:text-5xl' : 'text-4xl sm:text-6xl'} font-black tracking-tight flex items-start`}>
                {Math.round(weather.temperature)}
                <span className={`${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-light mt-0.5 sm:mt-1 ml-1`}>°C</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/85">
                <span className="flex items-center gap-1"><FiWind /> {weather.windspeed} km/h Wind</span>
                <span className="flex items-center gap-1"><FiDroplet /> {weather.humidity}% Humidity</span>
              </div>
            </div>
            <div className={`${compact ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl'} shrink-0`}>
              {suggestion?.icon}
            </div>
          </div>
        )}

        {/* AI Outfit Suggestion Box */}
        {suggestion && (
          <div className={compact ? 'space-y-2.5' : 'space-y-3 sm:space-y-4'}>
            <div className={`bg-white/15 backdrop-blur-md rounded-2xl ${compact ? 'p-3' : 'p-3.5 sm:p-4'} border border-white/10`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <FiZap className="text-yellow-300 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-white/95">AI Weather Stylist</span>
              </div>
              <p className={`${compact ? 'text-xs mb-2' : 'text-xs sm:text-[13px] mb-3'} leading-relaxed font-bold text-white`}>
                "{suggestion.message}"
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px] sm:text-[10.5px]">
                <div>
                  <span className="text-white/75 block text-[8.5px] uppercase tracking-widest mb-0.5">Recommended Fabric</span>
                  <span className="font-black text-white">{suggestion.fabric}</span>
                </div>
                <div>
                  <span className="text-white/75 block text-[8.5px] uppercase tracking-widest mb-0.5">Accent / Accessory</span>
                  <span className="font-black text-white">{suggestion.accessory}</span>
                </div>
              </div>
            </div>

            {/* Garment Badges */}
            <div className="flex flex-wrap gap-1.5">
              {suggestion.outfit.map((item, index) => (
                <span
                  key={index}
                  className={`bg-white text-gray-900 ${compact ? 'text-[9px] px-2.5 py-1' : 'text-[9.5px] sm:text-[10.5px] px-2.5 sm:px-3.5 py-1.5 sm:py-2'} font-black uppercase tracking-wider rounded-full shadow-md border border-white/40`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WeatherRecommendation;
