import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, FiCheck, FiImage, FiRefreshCw, FiDroplet, 
  FiLayers, FiStar, FiXCircle, FiAward, FiInfo, FiUser, 
  FiSave, FiCamera, FiVideo, FiMaximize2, FiSmartphone, FiRepeat 
} from 'react-icons/fi';
import { accessoryService, recommendationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SEASONAL_PROFILES = {
  'Fair': {
    season: 'Cool Summer / Light Spring',
    contrast: 'Low to Medium Contrast',
    paletteName: 'Ethereal Pastels & Soft Berries',
    styleTip: 'Delicate, cool-toned pastels and soft heather neutrals illuminate your natural porcelain undertones without washing you out.',
    bestJewelry: 'Platinum, White Gold, Rose Quartz'
  },
  'Light': {
    season: 'Light Spring / Soft Summer',
    contrast: 'Low to Medium Contrast',
    paletteName: 'Peach, Champagne & Soft Rose',
    styleTip: 'Luminous warm pastels, soft peach, and champagne tones enhance your delicate sunlit complexion.',
    bestJewelry: 'Rose Gold, Light Yellow Gold, Pearl'
  },
  'Medium': {
    season: 'Warm Autumn / Soft Summer',
    contrast: 'Medium Contrast',
    paletteName: 'Rich Terracotta, Olive & Warm Amber',
    styleTip: 'Earth-grounded tones, deep olives, and spicy cinnamon hues elevate the natural warmth in your complexion.',
    bestJewelry: 'Yellow Gold, Antique Brass, Tiger Eye'
  },
  'Medium/Wheatish': {
    season: 'Warm Autumn / Golden Spring',
    contrast: 'Medium Contrast',
    paletteName: 'Mustard, Saffron & Forest Green',
    styleTip: 'Vibrant golden hues, deep saffron, and forest green highlight golden and warm wheatish undertones.',
    bestJewelry: 'Polished 22K Gold, Copper, Amber'
  },
  'Olive': {
    season: 'Deep Autumn / Bright Winter',
    contrast: 'Medium to High Contrast',
    paletteName: 'Jewel Tones, Saffron & Emerald',
    styleTip: 'Vibrant jewel tones, burnt orange, and rich teal create striking contrast against natural golden-green undertones.',
    bestJewelry: 'Polished Gold, Warm Bronze, Emerald Accents'
  },
  'Dark': {
    season: 'Deep Winter / Rich Autumn',
    contrast: 'High Contrast',
    paletteName: 'High-Voltage Jewel & Saturated Tones',
    styleTip: 'Deep royal purple, cobalt blue, stark white, and vivid crimson deliver regal, high-fashion impact on melanin-rich skin.',
    bestJewelry: 'High-Carat Gold, Diamond, Rubies & Sapphires'
  }
};

const SkinTone = () => {
  const [image, setImage] = useState(null);
  const [selectedGender, setSelectedGender] = useState('female');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('camera'); // Default to camera
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'

  // WebRTC Live Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [liveStream, setLiveStream] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);

  const { user, logout } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem('fashionUser');
    if (stored) setSelectedGender(JSON.parse(stored).gender || 'female');
    
    // Auto-attempt webcam on load
    startCamera('user');

    return () => {
      stopCamera();
    };
  }, []);

  // Hook to ensure video element always receives stream when stream changes
  useEffect(() => {
    if (videoRef.current && liveStream) {
      videoRef.current.srcObject = liveStream;
      videoRef.current.play().catch(e => {
        console.warn("Auto-play blocked or waiting for user interaction:", e);
      });
    }
  }, [liveStream, activeTab, cameraActive]);

  const startCamera = async (mode = facingMode) => {
    stopCamera();
    setCameraLoading(true);
    setError(null);

    // Check if mediaDevices is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraLoading(false);
      setCameraActive(false);
      setError("Webcam API not directly available in this browser context. Please use 'Mobile/Selfie Camera' or 'Upload Photo'.");
      return;
    }

    try {
      // 1. Try with facingMode constraint
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (modeErr) {
        // 2. Fallback to basic video constraint if facingMode fails on desktop
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setLiveStream(stream);
      setCameraActive(true);
      setFacingMode(mode);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.log("Play triggered on user gesture:", playErr);
        }
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Camera permission denied. Please click the camera icon in your browser URL bar to allow access, or tap 'Open Phone Camera'.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No camera device found on this system. Please upload a photo or use your smartphone.");
      } else {
        setError("Unable to start live webcam. Tap 'Open Phone Camera' below or upload a photo.");
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (liveStream) {
      liveStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      setLiveStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const flipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Ensure video is playing and has dimension
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    // Mirror if user-facing
    if (facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, w, h);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'webcam_skin_scan.jpg', { type: 'image/jpeg' });
        setImage(URL.createObjectURL(blob));
        processAnalysis(file);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleMobileCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      stopCamera();
      processAnalysis(file);
    }
  };

  const getColorHex = (colorName) => {
    if (!colorName) return '#CCCCCC';
    const normalizedName = colorName.toLowerCase().trim();
    const colors = {
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
    return colors[normalizedName] || '#CCCCCC';
  };

  const [selectedCombo, setSelectedCombo] = useState(null);

  const handleColorClick = async (color) => {
    try {
      const res = await accessoryService.getColorCombinations(color);
      setSelectedCombo(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch color combinations.');
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

      const detected = toneRes.data.skin_tone || 'Medium';
      const seasonal = SEASONAL_PROFILES[detected] || SEASONAL_PROFILES['Medium'];

      setResult({
        ...response.data,
        detected_tone: detected,
        skin_hex: toneRes.data.skin_hex || '#B28F69',
        seasonal
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Analysis failed. Please verify backend connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveReport = async () => {
    if (!user) {
      setError('Please login to save your custom complexion matrix.');
      return;
    }
    if (!result) return;

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
    } catch (err) {
      console.error('Save failed', err);
      setError('Save failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground text-text dark:text-darkText">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <FiStar className="w-4 h-4" /> AI Complexion & 12-Season Color Lab
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-3 tracking-tight uppercase">
            Skin Tone & <span className="text-primary">Seasonal</span> Harmony
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
            Scan via live webcam or snap with your smartphone to discover your 12-season color matrix, power palettes, and fabric guide.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Scanner / Uploader */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
              
              {/* Mode Toggle Tabs */}
              <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => { setActiveTab('camera'); startCamera(); }}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'camera' ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <FiCamera className="w-4 h-4" /> Live Webcam
                </button>
                <button
                  onClick={() => { setActiveTab('upload'); stopCamera(); }}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'upload' ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <FiUpload className="w-4 h-4" /> Photo Upload
                </button>
              </div>

              {/* Camera Box */}
              {activeTab === 'camera' ? (
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border-2 border-primary shadow-inner">
                  {/* Video Stream */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''} ${!cameraActive ? 'hidden' : 'block'}`}
                  />

                  {/* Face Target Guide Overlay */}
                  {cameraActive && (
                    <>
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-72 border-2 border-dashed border-primary/80 rounded-[50%] shadow-[0_0_25px_rgba(255,107,107,0.5)]"></div>
                      </div>

                      {/* Flip Camera Button */}
                      <button
                        onClick={flipCamera}
                        className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all text-xs"
                        title="Switch Camera (Front/Back)"
                      >
                        <FiRepeat className="w-4 h-4" />
                      </button>

                      {/* Snap Button */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <button
                          onClick={captureCameraFrame}
                          className="px-6 py-2.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <FiCamera /> Snap & Analyze
                        </button>
                      </div>
                    </>
                  )}

                  {/* Inactive / Loading View */}
                  {!cameraActive && (
                    <div className="text-center p-6 text-white space-y-3">
                      {cameraLoading ? (
                        <div>
                          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-xs font-bold">Initializing camera...</p>
                        </div>
                      ) : (
                        <div>
                          <FiVideo className="w-12 h-12 mx-auto text-primary/80 mb-2" />
                          <p className="text-xs font-bold mb-3">Live camera is paused or blocked</p>
                          <button
                            onClick={() => startCamera()}
                            className="px-5 py-2.5 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-lg hover:opacity-90"
                          >
                            Enable Live Camera
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Static Upload Box */
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`relative aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    image ? 'border-primary' : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                  }`}
                >
                  {image ? (
                    <img src={image} alt="Selfie preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-6">
                      <FiUpload className="w-12 h-12 mx-auto text-primary/70 mb-3" />
                      <p className="font-bold text-xs uppercase tracking-wider">Upload Selfie</p>
                      <p className="text-[11px] text-gray-400 mt-1">Natural daylight, front-facing</p>
                    </div>
                  )}

                  {analyzing && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-6">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h4 className="text-sm font-bold uppercase tracking-wider">Extracting Pigments & Undertones...</h4>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden File Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImage(URL.createObjectURL(file));
                    processAnalysis(file);
                  }
                }}
                className="hidden"
              />

              {/* Native Mobile Camera Input */}
              <input
                ref={mobileCameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleMobileCapture}
                className="hidden"
              />

              {/* Mobile Native Camera Button */}
              <button
                onClick={() => mobileCameraInputRef.current?.click()}
                className="w-full mt-3 py-3 rounded-2xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <FiSmartphone className="w-4 h-4" /> Open Phone / Mobile Camera
              </button>
            </motion.div>
          </div>

          {/* Right Column: 12-Season & Diagnostic Results */}
          <div className="lg:col-span-7">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-3">
                <FiXCircle className="w-5 h-5 flex-shrink-0" /> {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  
                  {/* Result Header & Season Banner */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg flex-shrink-0"
                        style={{ backgroundColor: result.skin_hex }}
                      />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                          Detected Profile
                        </span>
                        <h2 className="text-2xl font-black">{result.detected_tone} Complexion</h2>
                        <span className="text-xs font-bold text-gray-500">
                          {result.seasonal?.season}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={saveReport}
                      disabled={isSaved || !user}
                      className={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                        isSaved ? 'bg-green-500 text-white' : 'bg-primary text-white shadow-md'
                      } ${!user ? 'opacity-60' : ''}`}
                    >
                      {isSaved ? <><FiCheck /> Stored</> : <><FiSave /> {user ? 'Save Matrix' : 'Login to Save'}</>}
                    </button>
                  </div>

                  {/* 12-Season Deep Diagnostic Box */}
                  {result.seasonal && (
                    <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent p-6 rounded-3xl border border-primary/20">
                      <h4 className="text-xs font-black uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                        <FiAward /> 12-Season Style Intelligence
                      </h4>
                      <p className="text-sm font-bold mb-1">{result.seasonal.paletteName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                        {result.seasonal.styleTip}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                          ✨ Best Metals: {result.seasonal.bestJewelry}
                        </span>
                        <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                          🎨 Contrast: {result.seasonal.contrast}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Power Color Palette */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <FiDroplet className="text-primary" /> Harmonious Colors ({result.recommended_colors.length})
                      </h4>
                      <span className="text-[10px] text-gray-400">Click any swatch to view pairings</span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {result.recommended_colors.slice(0, 16).map((c, idx) => (
                        <div key={idx} className="flex flex-col items-center group cursor-pointer" onClick={() => handleColorClick(c)}>
                          <div
                            className="w-10 h-10 rounded-xl shadow-md group-hover:scale-110 transition-transform border border-black/10"
                            style={{ backgroundColor: getColorHex(c) }}
                            title={c}
                          />
                          <span className="text-[9px] font-bold truncate max-w-[50px] mt-1 text-center text-gray-600 dark:text-gray-400">
                            {c}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Color Combinations Expansion */}
                    <AnimatePresence>
                      {selectedCombo && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3">
                            Power Combinations for {selectedCombo.selected_color}
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {selectedCombo.recommended?.map((rc, ridx) => (
                              <div key={ridx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-xl text-xs font-bold">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorHex(rc) }} />
                                {rc}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fabrics & Avoid Colors Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fabrics */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <h4 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 text-primary">
                        <FiLayers /> Flattering Fabrics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.fabrics?.map((f, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-xl text-[10px] font-bold">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Avoid Colors */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-red-100 dark:border-red-900/20">
                      <h4 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 text-red-500">
                        <FiXCircle /> Colors To Avoid
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.avoid_colors?.map((c, i) => (
                          <span key={i} className="px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl text-[10px] font-bold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="h-full min-h-[450px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
                  <FiImage className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-bold">Awaiting Scan</h3>
                  <p className="text-gray-500 text-xs mt-1 max-w-sm">
                    Position your face within the camera guide or snap a photo to extract your personalized 12-season matrix.
                  </p>
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
