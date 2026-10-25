import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHeart, FiEye, FiFilter, FiX, FiSearch, FiChevronDown, 
  FiRefreshCw, FiZap, FiAlertCircle, FiArrowRight, FiCheck, 
  FiCamera, FiUploadCloud, FiStar
} from 'react-icons/fi';
import api, { galleryService, searchService } from '../services/api';
import SmartImage from '../components/SmartImage';

const Gallery = () => {
  const location = useLocation();
  const [outfits, setOutfits] = useState([]);
  const [filteredOutfits, setFilteredOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [likedIds, setLikedIds] = useState([]);

  // Visual Search Modal States
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const [visualSearching, setVisualSearching] = useState(false);
  const [visualSearchResults, setVisualSearchResults] = useState(null);
  const [visualPreview, setVisualPreview] = useState('');
  
  const [selectedFilters, setSelectedFilters] = useState({
    occasion: []
  });

  const filterOptions = {
    occasion: ['Casual', 'Party', 'Office', 'Traditional']
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) {
      setSearchQuery(q);
    }
    fetchGallery(1, false);
    fetchLikes();
  }, [location.search]);

  const fetchGallery = async (pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadMoreLoading(true);
    else setLoading(true);
    setError(null);
    
    try {
      const response = await galleryService.getOutfits(pageNum, 100);
      if (response.data && response.data.images) {
        if (isLoadMore) {
          setOutfits(prev => [...prev, ...response.data.images]);
        } else {
          setOutfits(response.data.images);
        }
        setHasMore(response.data.has_more);
      }
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setError("Gallery connection error. Ensure backend is running.");
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
    }
  };

  const fetchLikes = async () => {
    try {
      const token = localStorage.getItem('fashionToken');
      if (token) {
        const response = await galleryService.getLikedOutfits();
        if (response.data && response.data.liked) {
          setLikedIds(response.data.liked.map(o => o.id));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch user likes:', err);
    }
  };

  const refreshIndex = async () => {
    setLoading(true);
    try {
      await api.post('/gallery/refresh');
      await fetchGallery(1, false);
    } catch (err) {
      setError("Failed to refresh index.");
      setLoading(false);
    }
  };

  const [paletteIndexing, setPaletteIndexing] = useState(false);
  const indexPalettes = async () => {
    if (paletteIndexing) return;
    setPaletteIndexing(true);
    try {
      const res = await searchService.indexPalettes();
      alert(`Palette indexing complete: ${res.data.newly_indexed} newly indexed, ${res.data.already_indexed} already indexed, ${res.data.failed} failed.`);
    } catch (err) {
      console.error('Palette indexing failed:', err);
      alert('Palette indexing could not complete. Check backend is running.');
    } finally {
      setPaletteIndexing(false);
    }
  };

  const handleLike = async (outfit) => {
    try {
      const response = await galleryService.likeOutfit(outfit.id);
      if (response.data.liked) {
        setLikedIds(prev => [...prev, outfit.id]);
      } else {
        setLikedIds(prev => prev.filter(id => id !== outfit.id));
      }
    } catch (err) {
      console.error('Error liking outfit:', err);
      if (err.response?.status === 401) {
        alert("Please login to like outfits!");
      }
    }
  };

  const handleVisualSearchUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVisualPreview(URL.createObjectURL(file));
    setVisualSearching(true);
    setVisualSearchResults(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await searchService.visualSearch(formData);
      setVisualSearchResults(res.data);
    } catch (err) {
      console.error("Visual search error:", err);
    } finally {
      setVisualSearching(false);
    }
  };

  useEffect(() => {
    let result = outfits;
    if (searchQuery) {
      result = result.filter(item => 
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.occasion || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.color || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    Object.keys(selectedFilters).forEach(key => {
      if (selectedFilters[key].length > 0) {
        result = result.filter(item => selectedFilters[key].includes(item[key]));
      }
    });
    setFilteredOutfits(result);
  }, [searchQuery, selectedFilters, outfits]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchGallery(nextPage, true);
  };

  const toggleFilter = (category, value) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev };
      if (newFilters[category].includes(value)) {
        newFilters[category] = newFilters[category].filter(v => v !== value);
      } else {
        newFilters[category] = [...newFilters[category], value];
      }
      return newFilters;
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground text-text dark:text-darkText font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        
        {/* Hero Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <FiStar /> AI Visual Search & Style Vault
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tight">
            Style <span className="text-primary">Discovery</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-widest">
            {filteredOutfits.length} Curated Looks • Natural Language & Visual Image Search
          </p>
        </motion.div>

        {/* Search and Action Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by keywords, vibes, occasions (e.g. 'office linen', 'summer pastel')..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-primary/30 transition-all font-bold text-xs" 
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
            {/* Visual Search Button */}
            <button 
              onClick={() => setVisualSearchOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
            >
              <FiCamera className="w-4 h-4 shrink-0" /> 
              <span>Visual Search</span>
            </button>

            {/* Filter Toggle */}
            <button 
              onClick={() => setFilterOpen(!filterOpen)} 
              className={`flex-1 sm:flex-initial px-4 sm:px-6 py-3 rounded-2xl border font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                filterOpen 
                  ? 'bg-primary text-white border-primary shadow-md' 
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
              }`}
            >
              <FiFilter /> Filters <FiChevronDown />
            </button>

            {/* Refresh */}
            <button 
              onClick={refreshIndex} 
              className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shrink-0"
              title="Refresh Gallery"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Index Palettes */}
            <button 
              onClick={indexPalettes} 
              disabled={paletteIndexing}
              className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:shadow-lg transition-all disabled:opacity-50 shrink-0"
              title="Pre-index outfit color palettes for faster & more accurate visual search"
            >
              <FiZap className={paletteIndexing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter Drawer */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl">
                {Object.entries(filterOptions).map(([cat, opts]) => (
                  <div key={cat}>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Occasion</h3>
                    <div className="flex flex-wrap gap-2">
                      {opts.map(o => (
                        <button
                          key={o}
                          onClick={() => toggleFilter(cat, o)}
                          className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase transition-all ${
                            selectedFilters[cat].includes(o)
                              ? 'bg-primary text-white shadow-md ring-2 ring-primary/30'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Visual Search Modal */}
      <AnimatePresence>
        {visualSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-gray-100 dark:border-gray-800 my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                <div>
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <FiCamera className="text-primary" /> Visual Inspiration Search
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Upload a photo from Pinterest, Instagram, or street-style to find matching gallery blueprints.
                  </p>
                </div>
                <button onClick={() => setVisualSearchOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
              </div>

              {/* Upload Input Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-primary transition-all relative cursor-pointer mb-6">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleVisualSearchUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                />
                {visualPreview ? (
                  <div className="flex items-center justify-center gap-4">
                    <img src={visualPreview} alt="Query" className="w-24 h-24 object-cover rounded-xl shadow-md" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-primary">Inspiration Photo Loaded</p>
                      <p className="text-[10px] text-gray-400">Click to upload another photo</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <FiUploadCloud className="w-10 h-10 mx-auto text-primary mb-2" />
                    <p className="text-xs font-bold">Drop inspiration photo here or click to browse</p>
                    <p className="text-[10px] text-gray-400 mt-1">Automatic color & silhouette matching</p>
                  </div>
                )}
              </div>

              {/* Loading & Results */}
              {visualSearching ? (
                <div className="py-12 text-center">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs font-bold uppercase tracking-wider">Scanning visual features & palette histograms with CIEDE2000 matching...</p>
                </div>
              ) : visualSearchResults?.results?.length > 0 ? (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h4 className="text-xs font-black uppercase text-gray-500">
                      Top Visual Matches ({visualSearchResults.results.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      {visualSearchResults.palette_swatches && visualSearchResults.palette_swatches.length > 0 && (
                        <div className="flex items-center gap-1" title="Query palette extracted from inspiration">
                          {visualSearchResults.palette_swatches.map((sw, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: sw.hex || `rgb(${(sw.rgb || [128,128,128]).join(',')})` }}
                              title={`${sw.name || 'Query color'} ${sw.percentage ? `(${sw.percentage}%)` : ''}`}
                            />
                          ))}
                        </div>
                      )}
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
                        {visualSearchResults.query_color}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1">
                    {visualSearchResults.results.map((item) => {
                      const score = item.match_score || 0;
                      const scoreColor = score >= 85
                        ? 'from-emerald-500 to-green-500'
                        : score >= 70
                          ? 'from-sky-500 to-blue-500'
                          : score >= 55
                            ? 'from-amber-500 to-orange-500'
                            : 'from-gray-400 to-gray-500';
                      return (
                        <Link
                          key={item.id}
                          to={`/outfit/${item.id}`}
                          onClick={() => setVisualSearchOpen(false)}
                          className="group bg-gray-50 dark:bg-gray-800 rounded-2xl p-2.5 border border-gray-100 dark:border-gray-700/60 hover:shadow-lg transition-all"
                        >
                          <div className="aspect-[3/4] w-full rounded-xl overflow-hidden relative mb-2">
                            <SmartImage
                              src={item.image}
                              alt={item.title || item.name}
                              outfit={item}
                              imgClassName="group-hover:scale-105 transition-transform"
                            />
                            <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black text-white backdrop-blur-md z-10 bg-gradient-to-r ${scoreColor}`}>
                              {score}% Match
                            </span>
                          </div>
                          <h5 className="text-xs font-bold truncate">{item.title || item.name}</h5>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.match_reason}</p>

                          {item.palette_swatches && item.palette_swatches.length > 0 && (
                            <div className="flex items-center gap-1 mt-2" title="Extracted outfit palette">
                              {item.palette_swatches.slice(0, 4).map((sw, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-black/10 shadow-inner flex-1 min-w-0"
                                  style={{
                                    backgroundColor: sw.hex || `rgb(${(sw.rgb || [128,128,128]).join(',')})`,
                                    maxWidth: '1.25rem'
                                  }}
                                  title={`${sw.name || 'Color'} ${sw.percentage ? `(${sw.percentage}%)` : ''}`}
                                />
                              ))}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Gallery Grid */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        {loading && !loadMoreLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="mb-3 sm:mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl sm:rounded-3xl animate-pulse h-64 sm:h-80 shadow-sm" />)}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto text-center py-20 space-y-4">
            <FiAlertCircle size={40} className="mx-auto text-red-500 opacity-60" />
            <h3 className="text-base font-bold">{error}</h3>
            <button onClick={refreshIndex} className="bg-primary text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider">
              Re-index Vault
            </button>
          </div>
        ) : (
          <>
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-6">
              {filteredOutfits.map((outfit, index) => (
                <motion.div key={outfit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index % 10) * 0.04 }} className="mb-3 sm:mb-6 break-inside-avoid group relative">
                  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-500 aspect-[3/4]">
                    <SmartImage
                      src={outfit.image}
                      alt={outfit.name}
                      outfit={outfit}
                      imgClassName="transform transition-transform duration-700 group-hover:scale-105"
                      wrapperClassName="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5">
                      <div className="space-y-3">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider rounded-full border border-white/20">
                          {outfit.occasion}
                        </span>
                        <div className="flex gap-2">
                          <Link to={`/outfit/${outfit.id}`} className="flex-1 py-2.5 bg-white text-black text-center text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all uppercase tracking-wider">
                            View Look
                          </Link>
                          <button 
                            onClick={() => handleLike(outfit)}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                              likedIds.includes(outfit.id) ? 'bg-primary text-white' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-black'
                            }`}
                          >
                            {likedIds.includes(outfit.id) ? <FiCheck /> : <FiHeart /> }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {hasMore && !searchQuery && !loading && (
              <div className="mt-12 text-center">
                <button 
                  onClick={handleLoadMore} 
                  disabled={loadMoreLoading}
                  className="px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold uppercase text-xs tracking-wider hover:bg-primary hover:text-white transition-all shadow-lg disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {loadMoreLoading ? <FiRefreshCw className="animate-spin" /> : <FiArrowRight /> }
                  {loadMoreLoading ? 'Fetching...' : 'Load More Looks'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Gallery;
