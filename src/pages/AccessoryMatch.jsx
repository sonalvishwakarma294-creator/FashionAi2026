import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiCheck, FiImage, FiRefreshCw, FiStar, FiInfo, FiTag, FiShoppingBag, FiWatch, FiBriefcase, FiUser, FiSave, FiAlertCircle } from 'react-icons/fi';
import { accessoryService, recommendationService } from '../services/api';

const AccessoryMatch = () => {
  const [image, setImage] = useState(null);
  const [selectedGender, setSelectedGender] = useState('female');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const [detectedColor, setDetectedColor] = useState('');
  const [autoDetect, setAutoDetect] = useState(true);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      processAnalysis(file);
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
      formData.append('gender', selectedGender);
      if (!autoDetect && detectedColor) {
        formData.append('detected_color', detectedColor);
      }
      
      const res = await accessoryService.analyze(formData);
      
      // Simulate professional analysis delay for UX
      setTimeout(() => {
        setResult(res.data);
        setAnalyzing(false);
      }, 2000);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('System malfunction during visual analysis. Please retry.');
      setAnalyzing(false);
    }
  };

  const saveToProfile = async () => {
    try {
      await recommendationService.saveRecommendation({
        type: 'accessory_guide',
        date: new Date().toLocaleDateString(),
        detected_color: result.detected_color,
        detected_style: result.detected_style,
        recommendations: result.recommendations,
        gender: result.gender
      });
      setIsSaved(true);
    } catch (error) {
      console.error('Save error:', error);
      setError('Identity confirmation failed. Unable to store report.');
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setIsSaved(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const garmentColors = ['Black', 'White', 'Navy Blue', 'Red', 'Grey', 'Olive', 'Beige', 'Pink', 'Royal Blue', 'Emerald', 'Gold', 'Burgundy'];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <span className="text-secondary font-black uppercase text-xs tracking-[0.3em] mb-4 block">AI Accessory Stylist</span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">Style <span className="text-secondary">Companion</span></h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium leading-relaxed">Our neural engine decodes your outfit's chromatic profile to curate a bespoke accessory collection.</p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-5 space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-black mb-8 uppercase tracking-tight">Visual Input</h2>
              
              <div className="flex gap-4 mb-8">
                {['male', 'female'].map(g => (
                  <button key={g} onClick={() => setSelectedGender(g)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${selectedGender === g ? 'bg-secondary text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    <FiUser /> {g}
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <span className="text-[10px] font-black uppercase opacity-40 block mb-4">Detection Mode</span>
                <button onClick={() => setAutoDetect(!autoDetect)} className={`w-full py-3 px-4 rounded-xl font-black text-[9px] uppercase tracking-wider border transition-all ${autoDetect ? 'bg-secondary text-white border-secondary shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-secondary'}`}>
                  {autoDetect ? '🤖 Neural Auto-Detection' : 'Manual Color Select'}
                </button>
                <AnimatePresence>
                  {!autoDetect && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 overflow-hidden">
                      <div className="flex flex-wrap gap-2 pt-2">
                        {garmentColors.map(c => (
                          <button key={c} onClick={() => setDetectedColor(c)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${detectedColor === c ? 'bg-secondary text-white border-secondary' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-secondary'}`}>{c}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div onClick={() => !analyzing && fileInputRef.current?.click()} className={`relative aspect-[3/4] border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${image ? 'border-secondary' : 'border-gray-100 dark:border-gray-800 hover:border-secondary/50'}`}>
                {image ? (
                  <img src={image} className={`w-full h-full object-cover transition-transform duration-700 ${analyzing ? 'scale-110 blur-sm' : 'scale-100'}`} alt="Uploaded dress" />
                ) : (
                  <div className="text-center group">
                    <FiUpload size={60} className="mx-auto text-gray-200 mb-6 group-hover:text-secondary transition-colors" />
                    <p className="font-black uppercase text-xs tracking-widest text-gray-400 group-hover:text-text dark:group-hover:text-white transition-colors">Deploy Garment Photo</p>
                  </div>
                )}
                
                <AnimatePresence>
                  {analyzing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white p-10 text-center">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-24 h-24 border-4 border-secondary border-t-transparent rounded-full mb-8 shadow-[0_0_30px_rgba(var(--secondary-rgb),0.5)]" />
                      <h3 className="text-xl font-black uppercase tracking-widest animate-pulse">Neural Decoding...</h3>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
                  <FiAlertCircle className="shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                </motion.div>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {result && (
                <button onClick={reset} className="w-full mt-8 bg-gray-100 dark:bg-gray-800 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2 group">
                  <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" /> New Session
                </button>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-10 border border-gray-100 dark:border-gray-700 shadow-xl flex-1 w-full">
                        <span className="text-secondary font-black uppercase text-[10px] mb-6 block">Analysis Metrics</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase opacity-40 block">Detected Color</span>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 shadow-md" style={{ backgroundColor: result.detected_color.toLowerCase().replace(' ', '') }} />
                                <span className="text-xl font-black uppercase tracking-tighter">{result.detected_color}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase opacity-40 block">User Profile</span>
                              <span className="text-xl font-black uppercase text-secondary tracking-tighter">{result.gender}</span>
                            </div>
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase opacity-40 block">Style Matrix</span>
                              <span className="text-xl font-black uppercase tracking-tighter">{result.detected_style}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={saveToProfile} disabled={isSaved} className={`w-full md:w-auto px-10 py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isSaved ? 'bg-green-500 text-white shadow-lg cursor-default' : 'bg-black dark:bg-white dark:text-black text-white shadow-xl hover:bg-secondary hover:text-white'}`}>
                      {isSaved ? <><FiCheck /> Encrypted & Stored</> : <><FiSave /> Commit to Vault</>}
                    </button>
                  </div>

                  <div className="bg-black text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-12">
                          <h4 className="font-black uppercase text-xs tracking-[0.3em] flex items-center gap-3">
                            <FiStar className="text-secondary fill-secondary" /> Optimized Collection
                          </h4>
                          <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">{result.recommendations.length} Components</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">
                          {result.recommendations.map((item, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              transition={{ delay: idx * 0.05 + 0.5 }} 
                              key={idx} 
                              className="flex items-center gap-4 py-4 border-b border-white/5 group/item hover:border-secondary transition-colors"
                            >
                              <span className="text-[9px] font-black opacity-10 group-hover/item:opacity-100 group-hover/item:text-secondary transition-all">
                                {idx < 9 ? `0${idx + 1}` : idx + 1}
                              </span>
                              <span className="text-sm font-bold uppercase tracking-tight group-hover/item:translate-x-2 transition-transform">
                                {item}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                    </div>
                    <div className="absolute -bottom-20 -right-20 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 rotate-12">
                      <FiShoppingBag size={400} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/30 rounded-[4rem] border-2 border-dashed border-gray-200 dark:border-gray-800 p-20 text-center relative overflow-hidden group">
                  <motion.div 
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="w-40 h-40 bg-white dark:bg-gray-800 rounded-[3rem] flex items-center justify-center shadow-2xl mb-10 relative z-10"
                  >
                    <FiImage size={60} className="text-gray-200 dark:text-gray-700 group-hover:text-secondary transition-colors duration-500" />
                  </motion.div>
                  <h3 className="text-3xl font-black tracking-tighter mb-4 text-text dark:text-darkText uppercase relative z-10">Neural Lab Standby</h3>
                  <p className="text-gray-500 max-w-sm font-black uppercase text-[10px] tracking-[0.2em] opacity-40 leading-relaxed relative z-10">Upload a garment photo to initialize the chromatic matching sequence and generate optimized accessory pairings.</p>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-10 left-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessoryMatch;
