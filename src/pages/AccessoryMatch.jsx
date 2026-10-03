import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUpload, FiCheck, FiImage, FiRefreshCw, FiStar, 
  FiInfo, FiTag, FiShoppingBag, FiWatch, FiBriefcase, 
  FiUser, FiSave, FiAlertCircle, FiEye, FiSun, FiLayers, FiSliders 
} from 'react-icons/fi';
import { accessoryService, recommendationService } from '../services/api';

const QUICK_COLORS = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Jet Black', hex: '#121212' },
  { name: 'Navy Blue', hex: '#0F1C40' },
  { name: 'Royal Blue', hex: '#1E4BB9' },
  { name: 'Emerald Green', hex: '#197D4B' },
  { name: 'Olive Green', hex: '#5F6E2D' },
  { name: 'Ruby Red', hex: '#C81928' },
  { name: 'Burgundy / Wine', hex: '#69122A' },
  { name: 'Mustard Yellow', hex: '#E1A519' },
  { name: 'Beige / Nude', hex: '#E0CCB2' },
  { name: 'Chocolate Brown', hex: '#4A2C1E' },
  { name: 'Blush Pink', hex: '#F5B9C3' },
  { name: 'Lavender / Lilac', hex: '#B49BD7' },
  { name: 'Burnt Orange / Rust', hex: '#C34B1E' }
];

const NECKLINES = [
  'V-Neck / Wrap',
  'Crew / High Neck',
  'Off-Shoulder / Sweetheart',
  'Collared Shirt / Blazer',
  'Turtleneck'
];

const STYLES = ['Casual', 'Formal', 'Party', 'Ethnic'];

const CATEGORY_TABS = [
  { id: 'all', label: 'Full Ensemble', icon: FiLayers },
  { id: 'bags', label: 'Bags & Carry', icon: FiShoppingBag },
  { id: 'footwear', label: 'Footwear', icon: FiBriefcase },
  { id: 'jewelry', label: 'Jewelry & Watches', icon: FiWatch },
  { id: 'accents', label: 'Accents & Eyewear', icon: FiSun },
];

const AccessoryMatch = () => {
  const [image, setImage] = useState(null);
  const [selectedGender, setSelectedGender] = useState('female');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  const [activeStyle, setActiveStyle] = useState('Casual');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNeckline, setSelectedNeckline] = useState('V-Neck / Wrap');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef(null);
  const mobileCamRef = useRef(null);
  const currentFileRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      currentFileRef.current = file;
      setImage(URL.createObjectURL(file));
      processAnalysis(file);
    }
  };

  const processAnalysis = async (file, manualColor = null) => {
    setAnalyzing(true);
    setResult(null);
    setIsSaved(false);
    setError(null);
    try {
      const formData = new FormData();
      if (file) formData.append('image', file);
      formData.append('gender', selectedGender);
      if (manualColor) {
        formData.append('detected_color', manualColor);
      }
      
      const res = await accessoryService.analyze(formData);
      
      setTimeout(() => {
        setResult(res.data);
        setActiveStyle(res.data.detected_style || 'Casual');
        setAnalyzing(false);
      }, 900);
    } catch (error) {
      console.error('Analysis failed:', error);
      setError('Visual analysis failed. Please verify backend connection.');
      setAnalyzing(false);
    }
  };

  const handleColorOverride = (colorName) => {
    if (currentFileRef.current) {
      processAnalysis(currentFileRef.current, colorName);
    } else {
      // Direct update
      setResult(prev => ({
        ...prev,
        detected_color: colorName
      }));
    }
  };

  const saveToProfile = async () => {
    if (!result) return;
    try {
      await recommendationService.saveRecommendation({
        type: 'accessory_guide',
        date: new Date().toLocaleDateString(),
        detected_color: result.detected_color,
        detected_style: activeStyle,
        recommendations: result.recommendations,
        gender: selectedGender
      });
      setIsSaved(true);
    } catch (error) {
      console.error('Save error:', error);
      setError('Unable to store report. Please ensure you are logged in.');
    }
  };

  const visualSuite = result?.visual_suite || {};

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground text-text dark:text-darkText font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <FiWatch className="w-4 h-4" /> AI Styling & Precision CIELAB Color Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tight">
            Accessory <span className="text-primary">Match</span> Studio
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-xs md:text-sm font-medium">
            Accurate Delta-E color extraction with skin/background filtration, gold/silver harmonizer, and neckline rules.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Garment Uploader & Controls */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl">
              
              {/* Gender Selector */}
              <div className="flex gap-2 mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => { setSelectedGender('female'); if (currentFileRef.current) processAnalysis(currentFileRef.current); }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    selectedGender === 'female' ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Women's Styling
                </button>
                <button
                  onClick={() => { setSelectedGender('male'); if (currentFileRef.current) processAnalysis(currentFileRef.current); }}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    selectedGender === 'male' ? 'bg-white dark:bg-gray-900 text-primary shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Men's Styling
                </button>
              </div>

              {/* Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-[4/3] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  image ? 'border-primary' : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                }`}
              >
                {image ? (
                  <img src={image} alt="Uploaded outfit" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-6">
                    <FiUpload className="w-10 h-10 mx-auto text-primary/70 mb-2" />
                    <p className="font-bold text-xs uppercase tracking-wider">Drop Garment Photo</p>
                    <p className="text-[10px] text-gray-400 mt-1">Filters out skin & background for true fabric color</p>
                  </div>
                )}

                {analyzing && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-6">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Filtering background & computing CIELAB pigments...
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <input
                ref={mobileCamRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all text-center"
                >
                  {image ? 'Change Photo' : 'Upload File'}
                </button>
                <button
                  onClick={() => mobileCamRef.current?.click()}
                  className="py-3 bg-primary/10 border border-primary/30 text-primary rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/20 transition-all text-center"
                >
                  Take Photo
                </button>
              </div>
            </div>

            {/* Neckline Jewelry Rule Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                <FiInfo className="text-primary" /> Neckline Jewelry Matcher
              </h4>
              <select
                value={selectedNeckline}
                onChange={(e) => setSelectedNeckline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold outline-none mb-3"
              >
                {NECKLINES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              
              <div className="p-3 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                {result?.neckline_guides?.[selectedNeckline] || 
                  "V-Neck pairs best with delicate Y-lariat chains and studs to follow the downward angle."}
              </div>
            </div>
          </div>

          {/* Right Column: AI Accessory Recommendations & Swatches */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
                <FiAlertCircle /> {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  
                  {/* Status & Swatches Banner */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex items-center gap-3.5">
                        <span 
                          className="w-12 h-12 rounded-2xl border-2 border-white shadow-md flex-shrink-0"
                          style={{ backgroundColor: result.detected_hex || '#0F1C40' }}
                        />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Detected Garment Tone
                          </span>
                          <h3 className="text-2xl font-black">
                            {result.detected_color}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowColorPicker(!showColorPicker)}
                          className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                        >
                          <FiSliders /> Adjust Color
                        </button>

                        <button
                          onClick={saveToProfile}
                          disabled={isSaved}
                          className={`px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                            isSaved ? 'bg-green-500 text-white' : 'bg-primary text-white shadow-md hover:opacity-90'
                          }`}
                        >
                          {isSaved ? <><FiCheck /> Saved</> : <><FiSave /> Save Kit</>}
                        </button>
                      </div>
                    </div>

                    {/* Extracted Swatches Row */}
                    {result.swatches?.length > 1 && (
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
                          Detected Palette:
                        </span>
                        {result.swatches.map((sw, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleColorOverride(sw.name)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                              result.detected_color === sw.name 
                                ? 'border-primary bg-primary/10 text-primary' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sw.hex }} />
                            {sw.name} ({sw.percentage}%)
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Manual Color Override Palette Drawer */}
                    {showColorPicker && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-[10px] font-black uppercase text-gray-400 block mb-2">
                          Select Exact Color Palette:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {QUICK_COLORS.map((qc) => (
                            <button
                              key={qc.name}
                              onClick={() => { handleColorOverride(qc.name); setShowColorPicker(false); }}
                              className="flex items-center gap-2 p-1.5 rounded-xl text-left text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200"
                            >
                              <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: qc.hex }} />
                              <span className="truncate">{qc.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Metal & Leather Harmonization Widgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Metal Finish */}
                    <div className="bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-transparent p-5 rounded-3xl border border-yellow-500/20">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span 
                          className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: result.metal_harmony?.metal_hex || '#D4AF37' }}
                        />
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {result.metal_harmony?.recommended_metal || 'Warm Gold'}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {result.metal_harmony?.reason}
                      </p>
                    </div>

                    {/* Leather Tone */}
                    <div className="bg-gradient-to-br from-stone-500/10 via-neutral-500/5 to-transparent p-5 rounded-3xl border border-stone-500/20">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span 
                          className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                          style={{ backgroundColor: result.leather_harmony?.leather_hex || '#9E5B32' }}
                        />
                        <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
                          {result.leather_harmony?.recommended_leather || 'Cognac Leather'}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {result.leather_harmony?.reason}
                      </p>
                    </div>
                  </div>

                  {/* Style Override Filter Buttons */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] font-black uppercase text-gray-400 whitespace-nowrap mr-1">Vibe:</span>
                    {STYLES.map((st) => (
                      <button
                        key={st}
                        onClick={() => setActiveStyle(st)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap ${
                          activeStyle.toLowerCase() === st.toLowerCase()
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Visual 4-Category Accessory Suites */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                    
                    {/* Category Tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-2 border-b border-gray-100 dark:border-gray-800">
                      {CATEGORY_TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                              activeTab === tab.id
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" /> {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Category Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bags */}
                      {(activeTab === 'all' || activeTab === 'bags') && visualSuite.bags?.map((item, idx) => (
                        <div key={`bag-${idx}`} className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                {item.badge || 'Bag'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">{item.color}</span>
                            </div>
                            <h5 className="font-bold text-sm mb-1">{item.name}</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.tip}</p>
                          </div>
                        </div>
                      ))}

                      {/* Footwear */}
                      {(activeTab === 'all' || activeTab === 'footwear') && visualSuite.footwear?.map((item, idx) => (
                        <div key={`shoe-${idx}`} className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-secondary/10 text-secondary">
                                {item.badge || 'Footwear'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">{item.color}</span>
                            </div>
                            <h5 className="font-bold text-sm mb-1">{item.name}</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.tip}</p>
                          </div>
                        </div>
                      ))}

                      {/* Jewelry */}
                      {(activeTab === 'all' || activeTab === 'jewelry') && visualSuite.jewelry?.map((item, idx) => (
                        <div key={`jewel-${idx}`} className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                {item.badge || 'Jewelry'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">{item.color}</span>
                            </div>
                            <h5 className="font-bold text-sm mb-1">{item.name}</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.tip}</p>
                          </div>
                        </div>
                      ))}

                      {/* Accents */}
                      {(activeTab === 'all' || activeTab === 'accents') && visualSuite.accents?.map((item, idx) => (
                        <div key={`accent-${idx}`} className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {item.badge || 'Accent'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold">{item.color}</span>
                            </div>
                            <h5 className="font-bold text-sm mb-1">{item.name}</h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.tip}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="h-full min-h-[420px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
                  <FiWatch className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
                  <h3 className="text-lg font-bold">Awaiting Garment Upload</h3>
                  <p className="text-gray-500 text-xs mt-1 max-w-sm">
                    Upload an outfit photo to extract its color profile, metal finishes, leather shades, and complete accessory suite.
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

export default AccessoryMatch;
