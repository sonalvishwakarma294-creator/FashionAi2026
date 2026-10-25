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
  'Very Light': {
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
  'Tan': {
    season: 'Warm Autumn / Golden Spring',
    contrast: 'Medium to High Contrast',
    paletteName: 'Mustard, Saffron & Forest Green',
    styleTip: 'Vibrant golden hues, deep saffron, and forest green highlight golden and warm wheatish undertones.',
    bestJewelry: 'Polished 22K Gold, Copper, Amber'
  },
  'Deep': {
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
  const [activeTab, setActiveTab] = useState('camera');
  const [facingMode, setFacingMode] = useState('user');
  const [undertone, setUndertone] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [warnings, setWarnings] = useState([]);

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
    setWarnings([]);
    setUndertone(null);
    setConfidence(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const toneRes = await accessoryService.analyzeSkinTone(formData);
      
      const detected = toneRes.data.skin_tone || 'Medium';
      const seasonal = SEASONAL_PROFILES[detected] || SEASONAL_PROFILES['Medium'];

      setUndertone(toneRes.data.undertone || null);
      setConfidence(toneRes.data.confidence || null);
      setWarnings(toneRes.data.warnings || []);

      let recData = { recommended_colors: [], avoid_colors: [], fabrics: [] };
      try {
        const response = await recommendationService.getRecommendations({
          skin_tone: detected,
          skin_hex: toneRes.data.skin_hex,
          gender: selectedGender
        });
        recData = response.data || recData;
      } catch (recErr) {
        console.warn('Recommendation service unavailable, using tone analysis colors');
      }

      const toneRecColors = (toneRes.data.recommended_colors || []).map(c => c.name);
      const toneAvoidColors = (toneRes.data.colors_to_use_carefully || []).map(c => c.name);
      const recColors = toneRecColors.length > 0 ? toneRecColors : (recData.recommended_colors || []);
      const avoidColors = toneAvoidColors.length > 0 ? toneAvoidColors : (recData.avoid_colors || []);

      setResult({
        ...recData,
        recommended_colors: recColors,
        avoid_colors: avoidColors,
        color_details: {
          recommended: toneRes.data.recommended_colors || [],
          careful: toneRes.data.colors_to_use_carefully || []
        },
        detected_tone: detected,
        skin_hex: toneRes.data.skin_hex || '#B28F69',
        seasonal,
        analysis_not_available: toneRes.data.analysis_not_available || false
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

  const getUndertoneBadgeColor = (ut) => {
    if (!ut) return 'bg-gray-100 text-gray-600';
    const u = ut.toLowerCase();
    if (u === 'warm') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (u === 'cool') return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  };

  const getConfidenceColor = (c) => {
    if (!c) return 'bg-gray-300';
    if (c >= 80) return 'bg-emerald-500';
    if (c >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground text-text dark:text-darkText">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <FiStar className="w-4 h-4" /> AI Complexion & 12-Season Color Lab
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight uppercase">
            Skin Tone & <span className="text-primary">Seasonal</span> Harmony
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base">
            Unlock your personalized 12-season color matrix, power palettes, and fabric guide with a quick selfie scan.
          </p>
        </motion.div>

        {/* Gender Selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mb-8">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold">
            {['female', 'male'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  selectedGender === g
                    ? 'bg-white dark:bg-gray-900 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiUser className="w-4 h-4" /> {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Scanner / Uploader */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
              
              {/* Mode Toggle Tabs */}
              <div className="flex gap-2 mb-5 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => { setActiveTab('camera'); if (!cameraActive) setCameraActive(false); stopCamera(); }}
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
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center border-2 border-gray-700 shadow-2xl">
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
                      {/* Stop / Close Camera Button */}
                      <button
                        onClick={() => stopCamera()}
                        className="absolute top-3 left-3 p-2.5 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-red-500/70 transition-all z-10"
                        title="Turn Off Camera"
                      >
                        <FiXCircle className="w-4 h-4" />
                      </button>

                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-56 h-72 border-2 border-dashed border-primary/70 rounded-[3rem] shadow-[0_0_30px_rgba(255,107,107,0.35)]">
                          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
                          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>
                        </div>
                      </div>
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                        Align your face inside the frame
                      </div>

                      {/* Flip Camera Button */}
                      <button
                        onClick={flipCamera}
                        className="absolute top-3 right-3 p-2.5 rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition-all"
                        title="Switch Camera (Front/Back)"
                      >
                        <FiRepeat className="w-4 h-4" />
                      </button>

                      {/* Snap Button */}
                      <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                        <button
                          onClick={captureCameraFrame}
                          className="px-8 py-3.5 bg-gradient-to-r from-primary to-rose-500 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-white/20"
                        >
                          <FiCamera className="w-4 h-4" /> Capture & Analyze
                        </button>
                      </div>
                    </>
                  )}

                  {/* Inactive / Start Camera View */}
                  {!cameraActive && (
                    <div className="text-center p-8 text-white space-y-5">
                      {cameraLoading ? (
                        <div>
                          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-xs font-bold">Requesting camera access...</p>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/30 to-rose-500/20 border-2 border-primary/40 flex items-center justify-center backdrop-blur-sm">
                            <FiCamera className="w-10 h-10 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black mb-1">Ready for your scan?</h3>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                              Tap the button below to enable your webcam. Position your face in natural lighting for best results.
                            </p>
                          </div>
                          <button
                            onClick={() => startCamera('user')}
                            className="px-8 py-3.5 bg-gradient-to-r from-primary to-rose-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 mx-auto border border-white/10"
                          >
                            <FiVideo className="w-4 h-4" /> Start Live Camera
                          </button>
                          <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1"><FiInfo className="w-3 h-3" /> Front-facing</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span>No photo saved</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Static Upload Box */
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className={`relative aspect-[4/5] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${
                    image ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 hover:border-primary bg-gray-50 dark:bg-gray-800/30'
                  }`}
                >
                  {image ? (
                    <img src={image} alt="Selfie preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-8 space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-rose-500/10 border-2 border-dashed border-primary/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FiUpload className="w-9 h-9 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-wider mb-1">Upload a Selfie</p>
                        <p className="text-[11px] text-gray-500">Front-facing • Natural daylight • No filters</p>
                      </div>
                      <div className="pt-2">
                        <span className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 shadow-sm">
                          Tap to Browse Files
                        </span>
                      </div>
                    </div>
                  )}

                  {analyzing && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-6">
                      <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h4 className="text-sm font-black uppercase tracking-widest mb-1">Scanning Complexion</h4>
                      <p className="text-[10px] text-gray-400">Extracting pigments & undertones...</p>
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
                className="w-full mt-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <FiSmartphone className="w-4 h-4 text-primary" /> Use Phone Camera
              </button>
            </motion.div>
          </div>

          {/* Right Column: 12-Season & Diagnostic Results */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-3">
                <FiXCircle className="w-5 h-5 flex-shrink-0" /> {error}
              </motion.div>
            )}

            {/* Quality / Warning Banner */}
            {warnings.length > 0 && result && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-amber-700 dark:text-amber-400">
                <div className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FiInfo className="w-4 h-4" /> Scan Quality Notes
                </div>
                <ul className="space-y-1">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-xs font-medium leading-relaxed">
                      • {w}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  
                  {/* Result Header & Season Banner */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 mb-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div 
                            className="w-16 h-16 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg flex-shrink-0 ring-2 ring-primary/20"
                            style={{ backgroundColor: result.skin_hex }}
                          />
                          <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[8px] font-black uppercase tracking-widest shadow-sm text-gray-600 dark:text-gray-300">
                            {result.skin_hex}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Detected Profile
                          </span>
                          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-0.5">{result.detected_tone} Complexion</h2>
                          <span className="text-xs font-bold text-gray-500 mt-1 block">
                            {result.seasonal?.season}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {undertone && (
                          <span className={`px-3.5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${getUndertoneBadgeColor(undertone)}`}>
                            {undertone} Undertone
                          </span>
                        )}
                        <button
                          onClick={saveReport}
                          disabled={isSaved || !user}
                          className={`px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ml-auto sm:ml-0 ${
                            isSaved ? 'bg-emerald-500 text-white shadow-md' : 'bg-gradient-to-r from-primary to-rose-500 text-white shadow-md hover:shadow-lg'
                          } ${!user ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {isSaved ? <><FiCheck /> Saved</> : <><FiSave /> {user ? 'Save Report' : 'Login'}</>}
                        </button>
                      </div>
                    </div>

                    {/* Confidence Meter */}
                    {confidence !== null && (
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            Analysis Confidence
                          </span>
                          <span className="text-[11px] font-black text-gray-700 dark:text-gray-300">
                            {confidence}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${getConfidenceColor(confidence)}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 12-Season Deep Diagnostic Box */}
                  {result.seasonal && (
                    <div className="bg-gradient-to-br from-primary/12 via-rose-500/5 to-transparent p-6 rounded-3xl border border-primary/20 dark:border-primary/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5 relative z-10">
                        <FiAward className="w-4 h-4" /> 12-Season Style Intelligence
                      </h4>
                      <p className="text-base font-black mb-1.5 tracking-tight relative z-10">{result.seasonal.paletteName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4 relative z-10">
                        {result.seasonal.styleTip}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-bold relative z-10">
                        <span className="px-3.5 py-1.5 bg-white/90 dark:bg-gray-900/90 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
                          ✨ Best in: {result.seasonal.bestJewelry}
                        </span>
                        <span className="px-3.5 py-1.5 bg-white/90 dark:bg-gray-900/90 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm">
                          🎨 Contrast: {result.seasonal.contrast}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Power Color Palette */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <FiDroplet className="text-primary w-4 h-4" /> Your Perfect 10 Shades
                      </h4>
                      <span className="text-[10px] text-gray-400 font-bold">Tap a swatch for pairings</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {(result.color_details?.recommended?.length > 0 ? result.color_details.recommended.slice(0, 10) : result.recommended_colors.slice(0, 10).map(c => ({ name: c, hex: getColorHex(c), reason: '' }))).map((c, idx) => (
                        <div key={idx} className="group cursor-pointer rounded-2xl border border-gray-100 dark:border-gray-800 p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all" onClick={() => handleColorClick(c.name)}>
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-11 h-11 rounded-xl shadow-md border border-black/10 flex-shrink-0"
                              style={{ backgroundColor: c.hex || getColorHex(c.name) }}
                              title={c.name}
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-black truncate block text-gray-800 dark:text-gray-200">
                                {c.name}
                              </span>
                              <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">
                                {c.hex}
                              </span>
                            </div>
                          </div>
                          {c.reason && (
                            <p className="text-[9px] leading-snug text-gray-500 dark:text-gray-400 font-medium line-clamp-2">
                              {c.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Color Combinations Expansion */}
                    <AnimatePresence>
                      {selectedCombo && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 flex items-center gap-1.5">
                            ✨ Combinations for {selectedCombo.selected_color}
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {selectedCombo.recommended?.map((rc, ridx) => (
                              <div key={ridx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3.5 py-2 rounded-xl text-[11px] font-bold border border-gray-100 dark:border-gray-700">
                                <span className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: getColorHex(rc) }} />
                                {rc}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fabrics & Use-Carefully Colors Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fabrics */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 text-primary">
                        <FiLayers className="w-4 h-4" /> Flattering Fabrics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(result.fabrics && result.fabrics.length > 0 ? result.fabrics : ['Cotton', 'Linen', 'Silk', 'Chiffon', 'Wool Blends']).map((f, i) => (
                          <span key={i} className="px-3.5 py-1.5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/60 rounded-xl text-[10px] font-black uppercase tracking-wider border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Use Carefully Colors */}
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/30 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 text-rose-500">
                        <FiXCircle className="w-4 h-4" /> Use Carefully
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {(result.color_details?.careful?.length > 0
                          ? result.color_details.careful.slice(0, 5)
                          : (result.avoid_colors || []).slice(0, 5).map(c => ({ name: c, hex: getColorHex(c), reason: 'Style with caution' }))
                        ).map((c, i) => (
                          <div key={i} className="flex items-start gap-2.5 p-2 rounded-xl bg-rose-50/60 dark:bg-rose-900/10">
                            <div
                              className="w-7 h-7 rounded-lg border border-black/10 flex-shrink-0 mt-0.5 shadow-sm"
                              style={{ backgroundColor: c.hex || getColorHex(c.name) }}
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                                {c.name}
                              </span>
                              {c.reason && (
                                <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5 font-medium">
                                  {c.reason}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="h-full min-h-[520px] flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900/40 dark:via-gray-900/20 dark:to-gray-900/40 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-10 text-center relative overflow-hidden">
                  <div className="absolute top-10 left-10 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-10 right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/15 to-rose-500/10 border-2 border-dashed border-primary/30 flex items-center justify-center mb-5 relative z-10">
                    <FiImage className="w-11 h-11 text-primary/70" />
                  </div>
                  <h3 className="text-xl font-black mb-2 tracking-tight relative z-10">Your Personalized Analysis Awaits</h3>
                  <p className="text-gray-500 text-xs mt-1 max-w-sm leading-relaxed relative z-10">
                    Click <span className="font-bold text-primary">Start Live Camera</span> on the left, or upload a clear front-facing selfie.
                    Natural daylight produces the most accurate skin-tone & undertone results.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-6 relative z-10">
                    {['Very Light', 'Light', 'Medium', 'Tan', 'Deep'].map((tone) => (
                      <span key={tone} className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[9px] font-black uppercase tracking-wider text-gray-500 shadow-sm">
                        {tone}
                      </span>
                    ))}
                  </div>
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
