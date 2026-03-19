
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiArrowLeft, FiX, FiCheck } from 'react-icons/fi';
import { galleryService, BASE_URL } from '../services/api';

const OutfitDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const response = await galleryService.getOutfitDetail(id);
        setOutfit(response.data);
      } catch (error) {
        console.error('Error fetching outfit:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleLike = async () => {
    try {
      await galleryService.likeOutfit(outfit.id);
      setIsLiked(true);
    } catch (error) {
      console.error('Like failed:', error);
      alert("Please login to like outfits!");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
    </div>
  );

  if (!outfit) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h2 className="text-2xl font-bold mb-4 tracking-widest uppercase">Look Not Found</h2>
      <button onClick={() => navigate('/gallery')} className="px-8 py-3 bg-primary rounded-full font-black text-xs uppercase tracking-widest">Back to Gallery</button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center"
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10">
        <button onClick={() => navigate(-1)} className="text-white flex items-center gap-2 font-black uppercase text-xs tracking-widest bg-white/10 px-6 py-3 rounded-full backdrop-blur-md">
          <FiArrowLeft /> Close
        </button>
        <button 
          onClick={handleLike} 
          disabled={isLiked}
          className={`flex items-center gap-2 font-black uppercase text-xs tracking-widest px-8 py-3 rounded-full backdrop-blur-md transition-all ${isLiked ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white hover:text-black'}`}
        >
          {isLiked ? <><FiCheck /> Saved</> : <><FiHeart /> Like Look</>}
        </button>
      </div>

      {/* Full Image */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full h-full p-4 md:p-12 lg:p-20 flex items-center justify-center"
      >
        <img 
          src={`${BASE_URL}${outfit.image}`} 
          alt={outfit.name} 
          className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/5"
        />
      </motion.div>

      {/* Info Overlay Bottom */}
      <div className="absolute bottom-10 text-center">
        <span className="text-primary font-black uppercase text-[10px] tracking-[0.4em] mb-2 block">Premium Discovery</span>
        <h2 className="text-white text-2xl font-black uppercase tracking-tighter">{outfit.name}</h2>
        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">{outfit.occasion} Context</p>
      </div>
    </motion.div>
  );
};

export default OutfitDetail;
