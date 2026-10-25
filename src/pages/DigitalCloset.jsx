import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiTrash2, FiLayers, FiZap, FiUploadCloud, 
  FiCamera, FiStar, FiCheck, FiFilter, FiTag, FiShoppingBag,
  FiLock, FiLogIn
} from 'react-icons/fi';
import { closetService } from '../services/api';
import SmartImage from '../components/SmartImage';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'top', label: 'Tops & Shirts' },
  { id: 'bottom', label: 'Pants & Skirts' },
  { id: 'dress', label: 'Dresses' },
  { id: 'outerwear', label: 'Jackets & Coats' },
  { id: 'shoes', label: 'Footwear' },
  { id: 'accessory', label: 'Accessories' },
];

const OCCASIONS = ['all', 'casual', 'office', 'party', 'formal'];

const DigitalCloset = () => {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOccasion, setSelectedOccasion] = useState('all');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    name: '',
    category: 'top',
    sub_category: '',
    occasion: 'casual',
    season: 'all-season',
    brand: '',
    file: null,
    preview: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Capsule generator state
  const [capsuleResults, setCapsuleResults] = useState(null);
  const [generatingCapsules, setGeneratingCapsules] = useState(false);
  const [isCapsuleModalOpen, setIsCapsuleModalOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) return; // login wall handled by render below
    fetchCloset();
  }, [selectedCategory, selectedOccasion, user, token, authLoading]);

  const fetchCloset = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await closetService.getItems({
        category: selectedCategory,
        occasion: selectedOccasion
      });
      setItems(res.data.items || []);
      setCounts(res.data.counts || {});
    } catch (err) {
      console.error("Failed to load closet items:", err);
      const msg = err.response?.data?.error || err.message || 'Could not load closet. Is the server running?';
      setFetchError(msg);
      setItems([]);
      setCounts({});
    } finally {
      setLoading(false);
    }
  };

  // ---- LOGIN WALL: if no logged-in user, show gated screen ----
  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-4 bg-background dark:bg-darkBackground">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <FiLock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-text dark:text-darkText">
              Your Smart Closet is <span className="text-primary">Locked</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Your wardrobe is private and tied to your personal account. Please log in
              to view, organize, and generate AI outfits from your closet.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-primary/30 transition-all"
              >
                <FiLogIn className="w-4 h-4" /> Login to My Closet
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Create Account
              </Link>
            </div>
            <div className="mt-7 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="grid grid-cols-3 gap-3 text-left">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <FiLayers className="w-5 h-5 text-primary mb-1" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Private</p>
                  <p className="text-[11px] text-gray-500">Only you can see your closet</p>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <FiTag className="w-5 h-5 text-primary mb-1" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Per‑User</p>
                  <p className="text-[11px] text-gray-500">Separate closet per account</p>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <FiZap className="w-5 h-5 text-primary mb-1" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">AI Capsules</p>
                  <p className="text-[11px] text-gray-500">Auto‑build outfits from yours</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({
        ...uploadData,
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadData.file && !uploadData.name) return;

    try {
      setUploading(true);
      setUploadError('');
      const formData = new FormData();
      if (uploadData.file) formData.append('image', uploadData.file);
      formData.append('name', uploadData.name || `My ${uploadData.category}`);
      formData.append('category', uploadData.category);
      // sub_category is required by backend validator – default to the category itself
      formData.append('sub_category', uploadData.sub_category || uploadData.category);
      formData.append('occasion', uploadData.occasion);
      formData.append('season', uploadData.season);
      formData.append('brand', uploadData.brand || '');

      await closetService.addItem(formData);

      setIsUploadOpen(false);
      setUploadData({
        name: '',
        category: 'top',
        sub_category: '',
        occasion: 'casual',
        season: 'all-season',
        brand: '',
        file: null,
        preview: ''
      });
      // Always re-fetch from server so each card shows its own unique image
      setSelectedCategory('all');
      setSelectedOccasion('all');
      await fetchCloset();
    } catch (err) {
      console.error("Failed to upload closet item:", err);
      setUploadError(err.response?.data?.error || 'Could not save this item. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await closetService.deleteItem(id);
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleGenerateCapsules = async () => {
    try {
      setGeneratingCapsules(true);
      setIsCapsuleModalOpen(true);
      const res = await closetService.generateCapsules({
        occasion: selectedOccasion
      });
      setCapsuleResults(res.data);
    } catch (err) {
      console.error("Failed to generate capsule outfits:", err);
    } finally {
      setGeneratingCapsules(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground text-text dark:text-darkText">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-800 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <FiLayers className="w-4 h-4" /> Digital Wardrobe
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              My Smart <span className="text-primary">Closet</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm max-w-xl">
              Digitize your wardrobe, auto-extract garment color profiles, and generate seamless capsule outfits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateCapsules}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-primary/30 transition-all"
            >
              <FiZap className="w-4 h-4" /> AI Capsule Generator
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs uppercase tracking-wider shadow hover:opacity-90 transition-all"
            >
              <FiPlus className="w-4 h-4" /> Add Garment
            </motion.button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label} {counts[cat.id] !== undefined && `(${counts[cat.id]})`}
            </button>
          ))}
        </div>

        {/* Error Banner */}
        {fetchError && !loading && (
          <div className="flex items-center justify-between gap-4 p-4 mb-6 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{fetchError}</p>
            <button
              onClick={fetchCloset}
              className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Closet Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 && !fetchError ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 p-8">
            <FiShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-bold">Your wardrobe is empty here</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6">
              Start adding your favorite pieces to unlock AI outfit combinations!
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-6 py-2.5 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider"
            >
              Add First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-white dark:bg-gray-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700/60"
              >
                {/* Image */}
                <div className="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
                  <SmartImage
                    src={item.image_url}
                    alt={item.name}
                    outfit={{
                      id: item.id,
                      name: item.name,
                      occasion: (item.occasion && item.occasion !== 'all') ? 'Casual' : 'Casual',
                      category: (
                        item.category === 'top' ? 'Tops'
                        : item.category === 'bottom' ? 'Bottoms'
                        : item.category === 'dress' ? 'Full Look'
                        : item.category === 'outerwear' ? 'Full Look'
                        : item.category === 'shoes' ? 'Shoes'
                        : 'Accessories'
                      ),
                      color: item.color_name,
                      hex: item.color_hex,
                    }}
                    imgClassName="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Color Badge */}
                  {item.color_hex && (
                    <div 
                      className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md z-10"
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-white" style={{ backgroundColor: item.color_hex }}></span>
                      {item.color_name || 'Color'}
                    </div>
                  )}
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
                    title="Remove item"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold truncate mt-0.5">{item.name}</h4>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
                    <span className="capitalize">{item.occasion}</span>
                    <span className="capitalize">{item.season}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <AnimatePresence>
          {isUploadOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black">Add Closet Garment</h3>
                  <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {uploadError && (
                    <p role="alert" className="text-xs font-semibold text-red-600">{uploadError}</p>
                  )}
                  {/* File / Camera Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4 text-center hover:border-primary transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {uploadData.preview ? (
                      <img src={uploadData.preview} alt="Garment preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                    ) : (
                      <div className="py-5">
                        <FiUploadCloud className="w-10 h-10 mx-auto text-primary mb-2" />
                        <p className="text-xs font-bold">Click or drag garment photo</p>
                        <p className="text-[10px] text-gray-400">Automatic color extraction enabled</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <label className="flex-1 py-2 px-3 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold text-center cursor-pointer transition-all">
                      📷 Snap with Camera
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold mb-1">Item Title</label>
                    <input
                      type="text"
                      value={uploadData.name}
                      onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                      placeholder="e.g. Navy Linen Button-down"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* Category & Occasion Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Category</label>
                      <select
                        value={uploadData.category}
                        onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs outline-none"
                      >
                        <option value="top">Top / Shirt</option>
                        <option value="bottom">Bottom / Pants</option>
                        <option value="dress">Dress</option>
                        <option value="outerwear">Outerwear</option>
                        <option value="shoes">Shoes</option>
                        <option value="accessory">Accessory</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Occasion</label>
                      <select
                        value={uploadData.occasion}
                        onChange={(e) => setUploadData({ ...uploadData, occasion: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs outline-none"
                      >
                        <option value="casual">Casual</option>
                        <option value="office">Office / Work</option>
                        <option value="party">Party / Night</option>
                        <option value="formal">Formal</option>
                        <option value="all">Any Occasion</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" /> Save To Closet
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capsule Results Modal */}
        <AnimatePresence>
          {isCapsuleModalOpen && (
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
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-gray-100 dark:border-gray-800 my-8"
              >
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                  <div>
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <FiStar className="text-primary" /> AI Capsule Outfits
                    </h3>
                    <p className="text-xs text-gray-500">
                      Auto-assembled complete looks using pieces exclusively from your closet.
                    </p>
                  </div>
                  <button onClick={() => setIsCapsuleModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
                </div>

                {generatingCapsules ? (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xs font-bold uppercase tracking-wider">Matching colors and styles...</p>
                  </div>
                ) : capsuleResults?.outfits?.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                      {capsuleResults.outfits.map((outfit) => (
                        <div
                          key={outfit.id}
                          className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700/60 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                {outfit.type}
                              </span>
                              <span className="text-xs font-bold text-green-500">
                                {outfit.synergy_score}% Synergy
                              </span>
                            </div>
                            <h4 className="font-bold text-sm mb-2">{outfit.title}</h4>
                            
                            {/* Garment Images Row */}
                            <div className="flex gap-2 mb-3">
                              {outfit.top && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                                  <SmartImage
                                    src={outfit.top.image_url}
                                    alt="Top"
                                    outfit={{ id: outfit.top?.id || 'cap-top', name: outfit.top?.name || 'Top', category: 'Tops', color: outfit.top?.color_name, hex: outfit.top?.color_hex }}
                                  />
                                </div>
                              )}
                              {outfit.bottom && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                                  <SmartImage
                                    src={outfit.bottom.image_url}
                                    alt="Bottom"
                                    outfit={{ id: outfit.bottom?.id || 'cap-bot', name: outfit.bottom?.name || 'Bottom', category: 'Bottoms', color: outfit.bottom?.color_name, hex: outfit.bottom?.color_hex }}
                                  />
                                </div>
                              )}
                              {outfit.dress && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                                  <SmartImage
                                    src={outfit.dress.image_url}
                                    alt="Dress"
                                    outfit={{ id: outfit.dress?.id || 'cap-dress', name: outfit.dress?.name || 'Dress', category: 'Full Look', color: outfit.dress?.color_name, hex: outfit.dress?.color_hex }}
                                  />
                                </div>
                              )}
                              {outfit.shoes && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                                  <SmartImage
                                    src={outfit.shoes.image_url}
                                    alt="Shoes"
                                    outfit={{ id: outfit.shoes?.id || 'cap-shoes', name: outfit.shoes?.name || 'Shoes', category: 'Shoes', color: outfit.shoes?.color_name, hex: outfit.shoes?.color_hex }}
                                  />
                                </div>
                              )}
                              {outfit.outerwear && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                                  <SmartImage
                                    src={outfit.outerwear.image_url}
                                    alt="Outerwear"
                                    outfit={{ id: outfit.outerwear?.id || 'cap-out', name: outfit.outerwear?.name || 'Outerwear', category: 'Full Look', color: outfit.outerwear?.color_name, hex: outfit.outerwear?.color_hex }}
                                  />
                                </div>
                              )}
                              {outfit.accessory && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 flex-shrink-0">
                                  <SmartImage
                                    src={outfit.accessory.image_url}
                                    alt="Accessory"
                                    outfit={{ id: outfit.accessory?.id || 'cap-acc', name: outfit.accessory?.name || 'Accessory', category: 'Accessories', color: outfit.accessory?.color_name, hex: outfit.accessory?.color_hex }}
                                  />
                                </div>
                              )}
                            </div>

                            <p className="text-[11px] text-gray-500 italic">
                              "{outfit.styling_tip}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Missing Staple Suggestion */}
                    {capsuleResults.missing_staples?.length > 0 && (
                      <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
                        <h5 className="text-xs font-black uppercase tracking-wider text-primary mb-1 flex items-center gap-1.5">
                          <FiStar /> Unlock More Outfits
                        </h5>
                        {capsuleResults.missing_staples.map((staple, i) => (
                          <div key={i} className="text-xs mt-1">
                            <span className="font-bold">{staple.name}: </span>
                            <span className="text-gray-500 dark:text-gray-400">{staple.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <p>Add at least one Top and one Bottom or Dress to generate capsule ensembles.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default DigitalCloset;
