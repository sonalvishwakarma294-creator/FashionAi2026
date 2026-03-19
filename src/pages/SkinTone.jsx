import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiCheck, FiImage, FiRefreshCw, FiDroplet, FiLayers, FiStar, FiXCircle, FiAward, FiInfo, FiUser, FiSave } from 'react-icons/fi';
import { accessoryService, recommendationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SkinTone = () => {
  const [image, setImage] = useState(null);
  const [selectedGender, setSelectedGender] = useState('female');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  const [isDBConnected, setIsDBConnected] = useState(false);
  const fileInputRef = useRef(null);

  const { user, logout } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem('fashionUser');
    if (stored) setSelectedGender(JSON.parse(stored).gender || 'female');
  }, []);

  const getColorHex = (colorName) => {
    if (!colorName) return '#CCCCCC';
    const normalizedName = colorName.toLowerCase().trim();
    const colors = {
      // Light Skin Tone Palette
      'peach': '#FFE5B4',
      'rose gold': '#B76E79',
      'ivory': '#FFFFF0',
      'blush': '#FADADD',
      'pastel yellow': '#FFFFE0',
      'champagne': '#F7E7CE',
      'pearl white': '#EAE6E1',
      'soft coral': '#F28C82',
      'shell pink': '#F4C2C2',
      'apricot': '#FBCEB1',
      'cream': '#FFFDD0',
      'powder blue': '#B0E0E6',
      'baby blue': '#89CFF0',
      'mint green': '#98FF98',
      'light pink': '#FFB6C1',
      'soft lavender': '#E6E6FA',
      'pale lilac': '#E6E6FA',
      'sky blue': '#87CEEB',
      'light beige': '#F5F5DC',
      'quartz': '#D6D6D6',

      // Medium/Wheatish Tone Palette
      'teal': '#008080',
      'emerald': '#50C878',
      'navy': '#000080',
      'gold': '#FFD700',
      'burgundy': '#800020',
      'coral': '#FF7F50',
      'mustard': '#FFDB58',
      'khaki': '#C3B091',
      'sapphire': '#0F52BA',
      'ochre': '#CC7722',
      'taupe': '#483C32',
      'camel': '#C19A6B',
      'plum': '#8E4585',
      'charcoal': '#36454F',
      'brick red': '#CB4154',
      'mahogany': '#C04000',
      'deep purple': '#301934',
      'forest green': '#228B22',
      'rust': '#B7410E',
      'olive': '#808000',

      // Olive Tone Palette
      'terracotta': '#E2725B',
      'warm gold': '#B8860B',
      'copper': '#B87333',
      'bronze': '#CD7F32',
      'saffron': '#F4C430',
      'amber': '#FFBF00',
      'burnt orange': '#CC5500',
      'rich brown': '#8B4513',
      'turquoise': '#40E0D0',
      'deep maroon': '#800000',

      // Dark/Deep Tone Palette
      'royal purple': '#7851A9',
      'crimson': '#DC143C',
      'emerald green': '#50C878',
      'sapphire blue': '#1261D3',
      'ruby': '#E0115F',
      'onyx': '#353839',
      'jet black': '#000000',
      'maroon': '#800000',
      'jewel tones': '#8B008B',
      'rich red': '#C71585',

      // Others
      'deep charcoal': '#2F2F2F',
      'pure white': '#FFFFFF',
      'stark black': '#000000',
      'icy pastels': '#E0FFFF',
      'cool pink': '#FF69B4',
      'icy blue': '#AFEEEE',
      'ash gray': '#B2BEB5',
      'pastel purple': '#B39EB5',
      'pale yellow': '#FFFFAA',
      'beige': '#F5F5DC',
      'light orange': '#FFB347'
    };
    
    if (!colors[normalizedName]) {
      console.warn(`Color mapping missing for: "${colorName}"`);
      return '#CCCCCC';
    }
    return colors[normalizedName];
  };

  const [selectedCombo, setSelectedCombo] = useState(null);

  const handleColorClick = async (color) => {
    try {
      const res = await accessoryService.getColorCombinations(color);
      setSelectedCombo(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch color combinations. Is the backend running?');
    }
  };

  const processAnalysis = async (file) => {
    setAnalyzing(true);
    setResult(null);
    setIsSaved(false);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const toneRes = await accessoryService.analyzeSkinTone(formData);
      
      const response = await recommendationService.getRecommendations({
        skin_tone: toneRes.data.skin_tone,
        skin_hex: toneRes.data.skin_hex,
        gender: selectedGender
      });

      setResult(response.data);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Analysis failed. Please ensure the backend server is running and you uploaded a valid image.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveReport = async () => {
    if (!user) {
      setError('Save failed: you must be logged in to save reports.');
      return;
    }

    if (!result) {
      setError('No skin-tone data available to save. Please analyze first.');
      return;
    }

    try {
      await recommendationService.saveRecommendation({
        type: 'tone_report',
        date: new Date().toLocaleDateString(),
        detected_tone: result.detected_tone,
        skin_hex: result.skin_hex,
        recommended_colors: result.recommended_colors,
        fabrics: result.fabrics,
        gender: selectedGender,
      });
      setIsSaved(true);
      setError(null);
    } catch (err) {
      console.error('Save failed', err);
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        setError('Save failed: authentication expired or invalid. Please login again.');
        logout();
      } else if (status === 422) {
        setError('Save failed: invalid token or malformed request. Please re-login.');
        logout();
      } else {
        setError('Save failed: server error. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="text-primary font-black uppercase text-xs tracking-[0.3em] mb-4 block">AI Complexion Lab</span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">Skin Tone <span className="text-primary">Mastery</span></h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed">Upload a selfie to extract your perfect 20-color matrix and bespoke fabric guide.</p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-5 space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-800">
              <div className="mb-8">
                <h2 className="text-2xl font-black mb-6 uppercase tracking-tight flex items-center gap-3">
                  <FiInfo className="text-primary" /> How to Analyze
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black flex-shrink-0 mt-1 shadow-inner">01</div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Natural Light</h4>
                      <p className="text-[11px] font-bold text-gray-400 uppercase leading-relaxed">Position yourself facing a window. Natural daylight gives the most accurate pigment detection.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center text-xs font-black flex-shrink-0 mt-1 shadow-inner">02</div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Raw Capture</h4>
                      <p className="text-[11px] font-bold text-gray-400 uppercase leading-relaxed">Avoid AI filters, heavy makeup, or studio lighting which can alter your natural skin undertones.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-2xl bg-accent/10 text-accent flex items-center justify-center text-xs font-black flex-shrink-0 mt-1 shadow-inner">03</div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Clear Focus</h4>
                      <p className="text-[11px] font-bold text-gray-400 uppercase leading-relaxed">Ensure your face is clearly visible and centered. The AI will scan the mid-face area for analysis.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div onClick={() => fileInputRef.current?.click()} className={`relative aspect-square border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${image ? 'border-primary' : 'border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                {image ? <img src={image} className="w-full h-full object-cover" /> : <div className="text-center"><FiUpload size={60} className="mx-auto text-gray-200 mb-6" /><p className="font-black uppercase text-xs tracking-widest text-gray-400">Upload Photo</p></div>}
                {analyzing && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-8"><motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mb-6"/><h3 className="text-xl font-black uppercase tracking-tighter">Analyzing Pigments...</h3></div>}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setImage(URL.createObjectURL(file));
                  processAnalysis(file);
                }
              }} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="w-full mt-8 bg-black dark:bg-white dark:text-black text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary transition-all">Start New Scan</button>
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl text-red-600 dark:text-red-400 font-bold uppercase text-xs tracking-widest flex items-center gap-3">
                <FiXCircle size={20} /> {error}
              </motion.div>
            )}
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex items-center gap-4">
                        <div>
                            <span className="text-primary font-black uppercase text-[10px] tracking-[0.3em] mb-2 block">Detection Successful</span>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full border-4 border-white dark:border-gray-800 shadow-xl" style={{ backgroundColor: result.skin_hex || '#B28F69' }} />
                              <h2 className="text-5xl font-black tracking-tighter leading-tight uppercase">Tone: <span className="text-primary">{result.detected_tone}</span></h2>
                            </div>
                        </div>
                    </div>
                    <button onClick={saveReport} disabled={isSaved || !user} className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${isSaved ? 'bg-green-500 text-white shadow-lg' : 'bg-black dark:bg-white dark:text-black text-white shadow-xl hover:bg-primary'} ${!user ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      {isSaved ? <><FiCheck /> Stored</> : <><FiSave /> {user ? 'Save Report' : 'Login to Save'}</>}
                    </button>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 md:p-12 border border-gray-100 dark:border-gray-800 shadow-xl">
                    <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-3">
                          <FiDroplet className="text-primary" />
                          <h4 className="font-black uppercase text-xs tracking-widest">Visual Color Palette</h4>
                      </div>
                      <span className="text-[8px] font-black uppercase opacity-30 tracking-widest">Click color for matches</span>
                    </div>
                    <div className="grid grid-cols-4 lg:grid-cols-5 gap-6 lg:gap-8">
                        {result.recommended_colors.slice(0, 20).map((c, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 group">
                                <motion.div 
                                  onClick={() => handleColorClick(c)}
                                  title={`#${getColorHex(c).slice(1).toUpperCase()}`}
                                  initial={{ scale: 0 }} 
                                  animate={{ scale: 1 }} 
                                  transition={{ delay: idx * 0.03 }} 
                                  className="w-28 h-28 lg:w-32 lg:h-32 rounded-3xl border-4 shadow-2xl cursor-pointer hover:scale-125 hover:shadow-3xl hover:shadow-primary/20 hover:ring-4 ring-white/70 transition-all shadow-xl relative group" 
                                  style={{ backgroundColor: getColorHex(c) || '#ff6b6b' }} 
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-[1.9rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-2xl text-xs font-black opacity-0 group-hover:opacity-100 transition-all text-gray-900 whitespace-nowrap">
                                    {getColorHex(c).toUpperCase()}
                                  </div>
                                </motion.div>
                                <span className="text-sm font-black uppercase text-center mt-3 px-3 py-2 bg-gradient-to-r from-black/95 via-gray-900/90 to-black/95 backdrop-blur-sm text-white rounded-2xl shadow-2xl border border-white/20">{c}</span>
                            </div>
                        ))}
                    </div>

                    <AnimatePresence>
                      {selectedCombo && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                            <FiStar /> Power Combinations for {selectedCombo.selected_color}
                          </h5>
                          <div className="flex flex-wrap gap-4">
                            {selectedCombo.recommended.map((rc, ridx) => (
                              <div key={ridx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
                                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: getColorHex(rc) }} />
                                <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">{rc}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="bg-black text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="font-black uppercase text-xs tracking-widest mb-10 flex items-center gap-2 text-primary"><FiLayers /> Essential Fabrics</h4>
                        <div className="flex flex-wrap gap-3">
                            {result.fabrics.map((f, idx) => (
                                <span key={idx} className="px-6 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5">{f}</span>
                            ))}
                        </div>
                        <p className="mt-10 text-sm opacity-60 leading-relaxed font-medium uppercase text-[10px] tracking-widest">Matched to light interaction profile.</p>
                    </div>
                    <FiStar className="absolute -bottom-10 -right-10 text-primary opacity-10" size={300} />
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-12 rounded-[3.5rem] border border-red-100 dark:border-red-900/20">
                    <h4 className="font-black uppercase text-xs tracking-widest mb-10 flex items-center gap-2 text-red-500"><FiXCircle /> Colors to Avoid</h4>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-6 text-center">
                        {result.avoid_colors.map((c, idx) => (
                            <div key={idx} className="space-y-2 group">
                                <div className="relative mx-auto w-12 h-12">
                                    <div className="w-full h-full rounded-full border-2 border-gray-100 shadow-inner group-hover:scale-105 transition-transform" style={{ backgroundColor: getColorHex(c) }} />
                                    <div className="absolute inset-0 flex items-center justify-center text-red-500"><FiXCircle size={20} /></div>
                                </div>
                                <span className="text-[7px] font-black uppercase opacity-40 block">{c}</span>
                            </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-[4rem] border-2 border-dashed border-gray-200 dark:border-gray-800 p-20 text-center">
                  <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-10"><FiImage size={50} className="text-gray-300" /></div>
                  <h3 className="text-3xl font-black tracking-tight mb-4 text-text dark:text-darkText uppercase">Lab Ready</h3>
                  <p className="text-gray-500 max-w-sm font-medium uppercase text-xs tracking-widest leading-loose">Upload your ID photo to generate a bespoke pigment report and fabric strategy.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkinTone;
