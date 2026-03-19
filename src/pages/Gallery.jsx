
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHeart, FiEye, FiFilter, FiX, FiSearch, FiChevronDown, FiRefreshCw, FiZap, FiAlertCircle, FiArrowRight, FiCheck } from 'react-icons/fi';
import api, { galleryService, BASE_URL } from '../services/api';

const Gallery = () => {
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
  
  const [selectedFilters, setSelectedFilters] = useState({
    occasion: [],
    color: [],
    style: [],
    category: []
  });

  const filterOptions = {
    occasion: ['Casual', 'Party', 'Office', 'Traditional'],
    color: ['Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Yellow', 'Purple'],
    style: ['Authentic', 'Modern', 'Classic', 'Traditional'],
    category: ['Full Look', 'Tops', 'Bottoms']
  };

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
        
        if (!isLoadMore && response.data.images.length === 0) {
          setError("No outfits found in the vault. Try refreshing the index.");
        }
      }
    } catch (err) {
      console.error('Gallery fetch error:', err);
      setError("Gallery connection error. Ensure backend is running.");
    } finally {
      setLoading(false);
      setLoadMoreLoading(false);
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

  const handleLike = async (outfit) => {
    try {
      await galleryService.likeOutfit(outfit.id);
      setLikedIds(prev => [...prev, outfit.id]);
    } catch (err) {
      console.error('Error liking outfit:', err);
      alert("Please login to like outfits!");
    }
  };

  useEffect(() => {
    fetchGallery(1, false);
  }, []);

  useEffect(() => {
    let result = outfits;
    if (searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.occasion.toLowerCase().includes(searchQuery.toLowerCase())
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary uppercase tracking-tighter">Discovery</h1>
          <p className="text-gray-500 text-sm uppercase tracking-[0.3em] font-black">Style Vault — {outfits.length} Items</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search Style IDs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-primary/30 transition-all font-bold text-sm" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setFilterOpen(!filterOpen)} className={`px-8 py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${filterOpen ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>Filters <FiChevronDown className="inline ml-1" /></button>
            <button onClick={refreshIndex} className="p-4 bg-primary text-white border border-primary rounded-2xl hover:shadow-lg transition-all shadow-sm"><FiRefreshCw className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        <AnimatePresence>
          {filterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-10 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl">
                {Object.entries(filterOptions).map(([cat, opts]) => (
                  <div key={cat}>
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-4 opacity-40">{cat}</h3>
                    <div className="flex flex-wrap gap-2">
                      {opts.map(o => (
                        <button key={o} onClick={() => toggleFilter(cat, o)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${selectedFilters[cat].includes(o) ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/20' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'}`}>{o}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {loading && !loadMoreLoading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="mb-6 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] animate-pulse h-80 shadow-sm" />)}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto text-center py-20 space-y-6">
            <FiAlertCircle size={50} className="mx-auto text-red-500 opacity-50" />
            <h3 className="text-xl font-black uppercase tracking-tighter">{error}</h3>
            <button onClick={refreshIndex} className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">Re-index Style Vault</button>
          </div>
        ) : (
          <>
            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-6">
              {filteredOutfits.map((outfit, index) => (
                <motion.div key={outfit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (index % 10) * 0.05 }} className="mb-6 break-inside-avoid group relative">
                  <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-500">
                    <img src={`${BASE_URL}${outfit.image}`} alt={outfit.name} loading="lazy" className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-110" style={{ minHeight: '200px' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                      <div className="space-y-4">
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-full border border-white/20">{outfit.occasion}</span>
                        <div className="flex gap-2">
                          <Link to={`/outfit/${outfit.id}`} className="flex-1 py-4 bg-white text-black text-center text-xs font-black rounded-2xl hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 uppercase tracking-widest">Open Blueprint</Link>
                          <button 
                            onClick={() => handleLike(outfit)}
                            disabled={likedIds.includes(outfit.id)}
                            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all transform translate-y-4 group-hover:translate-y-0 ${likedIds.includes(outfit.id) ? 'bg-primary text-white' : 'bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-black'}`}
                          >
                            {likedIds.includes(outfit.id) ? <FiCheck /> : <FiHeart /> }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 px-4 flex justify-end items-center">
                      <div className="flex items-center gap-1 text-[10px] font-bold opacity-30"><FiHeart size={12} /> {outfit.likes}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {hasMore && !searchQuery && !loading && (
              <div className="mt-16 text-center">
                <button 
                  onClick={handleLoadMore} 
                  disabled={loadMoreLoading}
                  className="px-12 py-5 bg-black dark:bg-white dark:text-black text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/10 disabled:opacity-50 flex items-center gap-3 mx-auto"
                >
                  {loadMoreLoading ? <FiRefreshCw className="animate-spin" /> : <FiArrowRight /> }
                  {loadMoreLoading ? 'Fetching...' : 'More Styles'}
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

