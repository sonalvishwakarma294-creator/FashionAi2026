
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiArrowLeft, FiCheck, FiUser, FiCalendar, FiAward, FiInfo, FiZap, FiBox, FiSave, FiImage, FiUpload, FiDroplet, FiLayers, FiStar, FiXCircle, FiLayout, FiShield, FiTrendingUp } from 'react-icons/fi';
import { accessoryService, recommendationService } from '../services/api';
import { getColorHex } from '../utils/colorUtils';

const BodyTypeVisual = ({ type }) => {
  const shapes = {
    hourglass: (
      <svg viewBox="0 0 100 150" className="w-12 h-16 fill-current">
        <path d="M20,10 L80,10 C70,40 70,60 80,90 L20,90 C30,60 30,40 20,10" className="opacity-40" />
        <path d="M20,10 Q50,75 20,140 M80,10 Q50,75 80,140" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    ),
    pear: (
      <svg viewBox="0 0 100 150" className="w-12 h-16 fill-current">
        <path d="M40,10 L60,10 L90,140 L10,140 Z" className="opacity-40" />
        <path d="M40,10 L60,10 L90,140 L10,140 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    ),
    apple: (
      <svg viewBox="0 0 100 150" className="w-12 h-16 fill-current">
        <ellipse cx="50" cy="75" rx="40" ry="60" className="opacity-40" />
        <ellipse cx="50" cy="75" rx="40" ry="60" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    ),
    inverted_triangle: (
      <svg viewBox="0 0 100 150" className="w-12 h-16 fill-current">
        <path d="M10,10 L90,10 L60,140 L40,140 Z" className="opacity-40" />
        <path d="M10,10 L90,10 L60,140 L40,140 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    ),
    rectangle: (
      <svg viewBox="0 0 100 150" className="w-12 h-16 fill-current">
        <rect x="20" y="10" width="60" height="130" className="opacity-40" />
        <rect x="20" y="10" width="60" height="130" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    ),
    trapezoid: (
      <svg viewBox="0 0 100 150" className="w-12 h-16 fill-current">
        <path d="M15,10 L85,10 L70,140 L30,140 Z" className="opacity-40" />
        <path d="M15,10 L85,10 L70,140 L30,140 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    ),
    triangle: (
      <svg viewBox="0 0 100 150" className="w-12 h-16 fill-current">
        <path d="M35,10 L65,10 L90,140 L10,140 Z" className="opacity-40" />
        <path d="M35,10 L65,10 L90,140 L10,140 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    ),
    oval: (
      <svg viewBox="0 0 100 150" className="w-12 h-16 fill-current">
        <ellipse cx="50" cy="75" rx="45" ry="60" className="opacity-40" />
        <ellipse cx="50" cy="75" rx="45" ry="60" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    )
  };
  return shapes[type] || <FiBox size={30} />;
};

const Recommendations = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: '',
    occasion: '',
    bodyType: '',
    skinToneImage: null
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('fashionUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.gender) setFormData(prev => ({ ...prev, gender: user.gender }));
    }
  }, []);

  const steps = [
    { id: 1, title: 'Identity', icon: FiUser },
    { id: 2, title: 'Vibe', icon: FiCalendar },
    { id: 3, title: 'Anatomy', icon: FiBox },
    { id: 4, title: 'Skin Tone', icon: FiImage },
    { id: 5, title: 'Guide', icon: FiAward },
  ];

  const bodyTypes = {
    female: [
      { id: 'hourglass', name: 'Hourglass' },
      { id: 'pear', name: 'Pear' },
      { id: 'apple', name: 'Apple' },
      { id: 'rectangle', name: 'Rectangle' },
      { id: 'inverted_triangle', name: 'Inverted Triangle' },
    ],
    male: [
      { id: 'trapezoid', name: 'Trapezoid' },
      { id: 'rectangle', name: 'Rectangle' },
      { id: 'triangle', name: 'Triangle' },
      { id: 'inverted_triangle', name: 'Inverted Triangle' },
      { id: 'oval', name: 'Oval' },
    ]
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
    else if (currentStep === 4) handleSubmit();
  };

  const handleSubmit = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const toneFormData = new FormData();
      toneFormData.append('image', formData.skinToneImage);
      const toneRes = await accessoryService.analyzeSkinTone(toneFormData);
      
      const response = await recommendationService.getRecommendations({
        gender: formData.gender,
        occasion: formData.occasion,
        body_type: formData.bodyType,
        skin_tone: toneRes.data.skin_tone,
        skin_hex: toneRes.data.skin_hex
      });

      setResults(response.data);
      setTimeout(() => { setIsAnalyzing(false); setCurrentStep(5); }, 2500);
    } catch (err) {
      setError("Analysis failed. Backend might be offline.");
      setIsAnalyzing(false);
    }
  };

  const saveToProfile = async () => {
    try {
      await recommendationService.saveRecommendation({
        type: 'styling_guide',
        date: new Date().toLocaleDateString(),
        ...formData,
        ...results
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch {
      alert('Login required to save.');
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) return formData.gender;
    if (currentStep === 2) return formData.occasion;
    if (currentStep === 3) return formData.bodyType;
    if (currentStep === 4) return formData.skinToneImage;
    return true;
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-12 sm:pb-16 bg-background dark:bg-darkBackground">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Stepper */}
        <div className="mb-8 sm:mb-12 flex justify-between relative px-2 sm:px-6 md:px-10">
          <div className="absolute top-1/2 left-6 right-6 sm:left-10 sm:right-10 h-[2px] bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0" />
          {steps.map(s => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <motion.div animate={{ scale: currentStep === s.id ? 1.15 : 1 }} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 text-xs sm:text-base transition-all ${currentStep >= s.id ? 'bg-primary border-primary text-white shadow-lg sm:shadow-xl shadow-primary/20' : 'bg-white dark:bg-gray-900 border-gray-200 text-gray-400'}`}>
                {currentStep > s.id ? <FiCheck /> : <s.icon />}
              </motion.div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!isAnalyzing ? (
            <motion.div key={currentStep} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white dark:bg-gray-800 rounded-3xl sm:rounded-[3rem] p-5 sm:p-8 md:p-12 shadow-2xl border border-gray-100 dark:border-gray-700">
              {currentStep === 1 && (
                <div className="text-center">
                  <h2 className="text-2xl sm:text-4xl font-black mb-6 sm:mb-12 uppercase tracking-tight">Who are we styling?</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 max-w-2xl mx-auto">
                    {['male', 'female'].map(g => (
                      <div key={g} onClick={() => setFormData({...formData, gender: g, bodyType: ''})} className={`cursor-pointer group relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-4 transition-all ${formData.gender === g ? 'border-primary scale-102 sm:scale-105 shadow-xl' : 'border-transparent opacity-60'}`}>
                        <img src={g === 'male' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600' : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600'} className="w-full h-52 sm:h-80 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex items-end p-5 sm:p-8"><span className="text-white font-black text-xl sm:text-2xl uppercase tracking-wider">{g}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="text-center">
                  <h2 className="text-2xl sm:text-4xl font-black mb-6 sm:mb-12 uppercase tracking-tight">Body Architecture</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-6">
                    {(bodyTypes[formData.gender] || []).map(bt => (
                      <div key={bt.id} onClick={() => setFormData({...formData, bodyType: bt.id})} className={`cursor-pointer p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center gap-3 sm:gap-6 transition-all ${formData.bodyType === bt.id ? 'border-primary bg-primary text-white shadow-xl scale-102 sm:scale-105' : 'border-gray-100 dark:border-gray-700'}`}>
                        <BodyTypeVisual type={bt.id} />
                        <span className="font-black text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest text-center">{bt.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 5 && results && (
                <div className="space-y-8 sm:space-y-12">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-8">
                    <div>
                      <span className="text-primary font-black uppercase text-[10px] tracking-widest mb-1.5 block">Neural Analysis Complete</span>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-white shadow-lg shrink-0" style={{ backgroundColor: results.skin_hex }} />
                        <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">Tone: <span className="text-primary">{results.detected_tone}</span></h2>
                      </div>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                      <button onClick={saveToProfile} disabled={isSaved} className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isSaved ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-primary'}`}>
                        {isSaved ? <FiCheck className="inline mr-2" /> : <FiSave className="inline mr-2" />} {isSaved ? 'Stored' : 'Save Guide'}
                      </button>
                    </div>
                  </div>

                  {/* Pro Styling Card */}
                  <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shadow-lg shrink-0"><FiTrendingUp size={24} /></div>
                    <div>
                        <h4 className="font-black uppercase text-xs tracking-widest text-primary mb-1">Professional Insight</h4>
                        <p className="font-bold text-sm sm:text-lg opacity-85 leading-snug">{results.styling_tip}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      <div className="bg-gray-50 dark:bg-gray-900 p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                        <h4 className="font-black uppercase text-xs tracking-widest mb-5 sm:mb-8 flex items-center gap-2 text-primary"><FiDroplet /> Recommended Spectrum</h4>
                        <div className="grid grid-cols-5 gap-2 sm:gap-4">
                            {results.recommended_colors.map((c, i) => (
                                <div key={i} className="flex flex-col items-center gap-1.5 group">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: getColorHex(c) }} />
                                    <span className="text-[7.5px] sm:text-[8px] font-black uppercase opacity-60 text-center truncate max-w-full">{c}</span>
                                </div>
                            ))}
                        </div>
                      </div>

                      <div className="bg-black text-white p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                        <h4 className="font-black uppercase text-xs tracking-widest mb-5 sm:mb-8 flex items-center gap-2 text-primary relative z-10"><FiLayers /> Essential Fabrics</h4>
                        <div className="flex flex-wrap gap-2 sm:gap-3 relative z-10">
                            {results.fabrics.map((f, i) => (
                                <span key={i} className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-white/10 rounded-xl text-[9px] sm:text-[10px] font-black uppercase border border-white/10">{f}</span>
                            ))}
                        </div>
                        <FiStar className="absolute -bottom-10 -right-10 text-primary opacity-10 pointer-events-none" size={200} />
                      </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                      <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider px-1">Expert Personas</h3>
                      {results.personas.map((p, i) => (
                          <div key={i} className="bg-white dark:bg-gray-900 p-5 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-shadow">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 sm:mb-4 block">Look Option 0{i+1}</span>
                              <h4 className="text-xl sm:text-3xl font-black mb-3 sm:mb-4 uppercase tracking-tight">{p.title}</h4>
                              <div className="bg-primary/5 p-4 sm:p-6 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 inline-block"><p className="font-bold text-sm sm:text-lg">{p.look}</p></div>
                              <p className="text-gray-500 italic font-medium leading-relaxed font-serif text-sm sm:text-lg">"{p.advice}"</p>
                          </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Steps (Vibe, Skin Tone) */}
              {currentStep === 2 && (
                <div className="text-center">
                    <h2 className="text-2xl sm:text-4xl font-black mb-6 sm:mb-12 uppercase tracking-tight">The Vibe</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                        {['casual', 'office', 'party'].map(occ => (
                            <div key={occ} onClick={() => setFormData({...formData, occasion: occ})} className={`cursor-pointer p-3 sm:p-4 rounded-2xl sm:rounded-[2.5rem] border-2 transition-all ${formData.occasion === occ ? 'border-primary bg-primary/5 shadow-lg' : 'border-gray-100 dark:border-gray-800'}`}>
                                <img src={occ === 'casual' ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' : occ === 'office' ? 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400' : 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400'} className="w-full h-44 sm:h-56 object-cover rounded-xl sm:rounded-[2rem] mb-3 sm:mb-4" />
                                <span className="font-black uppercase text-xs sm:text-sm tracking-widest">{occ}</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="text-center">
                    <h2 className="text-2xl sm:text-4xl font-black mb-2 sm:mb-4 uppercase tracking-tight">Neural Skin Scan</h2>
                    <p className="text-gray-400 mb-6 sm:mb-12 font-bold uppercase text-[9.5px] sm:text-[10px] tracking-wider sm:tracking-widest">Upload photo for color-math calibration</p>
                    <div onClick={() => document.getElementById('skin-upload').click()} className={`max-w-[280px] sm:max-w-md mx-auto aspect-square border-4 border-dashed rounded-2xl sm:rounded-[3rem] flex items-center justify-center cursor-pointer transition-all ${formData.skinToneImage ? 'border-primary shadow-2xl' : 'border-gray-200 dark:border-gray-700'}`}>
                        {formData.skinToneImage ? <img src={URL.createObjectURL(formData.skinToneImage)} className="w-full h-full object-cover rounded-xl sm:rounded-[2.8rem]" /> : <FiUpload size={40} className="text-gray-300" />}
                        <input id="skin-upload" type="file" className="hidden" onChange={(e) => setFormData({...formData, skinToneImage: e.target.files[0]})} />
                    </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="min-h-[350px] sm:min-h-[500px] flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-2xl sm:rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-16 h-16 sm:w-24 sm:h-24 border-t-4 border-primary rounded-full mb-6 sm:mb-8" />
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">Synthesizing Logic...</h3>
            </div>
          )}
        </AnimatePresence>

        {currentStep < 5 && !isAnalyzing && (
          <div className="flex justify-between items-center mt-8 sm:mt-12 px-2 sm:px-4">
            <button onClick={() => setCurrentStep(currentStep-1)} disabled={currentStep === 1} className="px-6 sm:px-10 py-3.5 sm:py-5 rounded-2xl font-black uppercase text-xs tracking-wider sm:tracking-widest opacity-40 hover:opacity-100 disabled:opacity-20 transition-opacity">Back</button>
            <button onClick={handleNext} disabled={!isStepValid()} className="px-8 sm:px-12 py-3.5 sm:py-5 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-wider sm:tracking-widest shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all">Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
