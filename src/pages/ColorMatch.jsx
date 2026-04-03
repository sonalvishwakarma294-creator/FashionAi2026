import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiCopy, FiShare2, FiStar, FiTrendingUp, FiCheck, FiInfo, FiArrowRight } from 'react-icons/fi';
import { IoColorPaletteOutline } from 'react-icons/io5';
import { accessoryService } from '../services/api';
import { getColorHex } from '../utils/colorUtils';

const ColorMatch = () => {
  const [selectedColor, setSelectedColor] = useState('#001F3F');
  const [colorName, setColorName] = useState('Navy Blue');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState('');
  const [activeTab, setActiveTab] = useState('palette');

  const fashionColors = [
    { name: 'Navy Blue', hex: '#001F3F' },
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Burgundy', hex: '#800020' },
    { name: 'Emerald', hex: '#50C878' },
    { name: 'Gold', hex: '#FFD700' },
    { name: 'Royal Blue', hex: '#4169E1' },
    { name: 'Coral', hex: '#FF7F50' },
    { name: 'Mustard', hex: '#FFDB58' },
    { name: 'Charcoal', hex: '#36454F' }
  ];

  const analyzeColor = async (colorToUse = selectedColor) => {
    setLoading(true);
    setResult(null);
    try {
      // If it's a hex from picker, we send the hex
      const res = await accessoryService.getColorCombinations(colorToUse);
      setResult(res.data);
      
      // Update color name if it was a preset
      const preset = fashionColors.find(c => c.hex.toLowerCase() === colorToUse.toLowerCase());
      if (preset) setColorName(preset.name);
      else setColorName('Custom Color');
      
    } catch (error) {
      console.error('Color analysis failed:', error);
      setResult({
        complementary: ['Gold', 'White'],
        analogous: ['Royal Blue', 'Emerald'],
        triadic: ['Coral', 'Teal'],
        neutral: ['Ivory', 'Silver']
      });
    }
    setLoading(false);
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#f8fafc] dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
            <FiStar /> AI Style Assistant
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
            Color <span className="text-emerald-500 underline decoration-emerald-200 underline-offset-8">Harmony</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Master the art of color matching. Choose any color and our AI will generate professional palettes based on classic color theory.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Color Selection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-900 dark:text-white">
                <IoColorPaletteOutline className="text-emerald-500" size={24} />
                Pick Your Base Color
              </h2>

              {/* Color Picker Section */}
              <div className="mb-10 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <input 
                      type="color" 
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-24 h-24 rounded-2xl cursor-pointer border-4 border-white dark:border-gray-700 shadow-xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
                      <FiSearch size={14} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Selected Hex</label>
                    <div className="flex items-center gap-2">
                      <code className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                        {selectedColor}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(selectedColor, 'hex')}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
                      >
                        {copied === 'hex' ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="mb-10">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 block">Popular Fashion Colors</label>
                <div className="grid grid-cols-5 gap-4">
                  {fashionColors.map((color) => (
                    <motion.button
                      key={color.name}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedColor(color.hex)}
                      className={`h-12 rounded-xl transition-all relative ${
                        selectedColor.toLowerCase() === color.hex.toLowerCase() 
                        ? 'ring-4 ring-emerald-500 ring-offset-4 dark:ring-offset-gray-900' 
                        : 'hover:shadow-lg'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {selectedColor.toLowerCase() === color.hex.toLowerCase() && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FiCheck className={color.name === 'White' ? 'text-black' : 'text-white'} />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => analyzeColor()}
                disabled={loading}
                className="w-full py-5 px-8 bg-gray-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-lg uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Generate Palettes'}
                {!loading && <FiArrowRight />}
              </motion.button>
            </div>

            {/* Quick Tips */}
            <div className="bg-emerald-500 text-white rounded-[2.5rem] p-8 shadow-lg shadow-emerald-500/20">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <FiInfo /> Pro Tip
              </h3>
              <p className="text-emerald-50 text-sm leading-relaxed font-medium">
                For a balanced look, follow the <span className="font-bold">60-30-10 rule</span>: 60% dominant color, 30% secondary color, and 10% accent color.
              </p>
            </div>
          </motion.div>

          {/* Right Panel: Results */}
          <motion.div 
            className="lg:col-span-7"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-end mb-12">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Results for</h3>
                        <div className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                          {colorName}
                          <div className="w-8 h-8 rounded-full border-4 border-gray-100 dark:border-gray-800" style={{ backgroundColor: selectedColor }} />
                        </div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(JSON.stringify(result), 'all')}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors"
                      >
                        {copied === 'all' ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                        {copied === 'all' ? 'Copied' : 'Copy All'}
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8">
                      {Object.entries(result).map(([harmony, colors], idx) => (
                        <motion.div 
                          key={harmony}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">{harmony}</h4>
                            <span className="w-8 h-px bg-gray-100 dark:bg-gray-800 flex-1 mx-4" />
                          </div>
                          <div className="flex gap-3">
                            {colors.map((color, cIdx) => (
                              <motion.div
                                key={cIdx}
                                whileHover={{ y: -5 }}
                                className="group relative flex-1"
                              >
                                <div 
                                  className="h-24 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer flex items-center justify-center overflow-hidden"
                                  style={{ backgroundColor: getColorHex(color) }}
                                  onClick={() => copyToClipboard(color, color)}
                                >
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    {copied === color ? <FiCheck size={24} /> : <FiCopy size={20} />}
                                  </div>
                                </div>
                                <span className="block mt-2 text-[10px] font-black uppercase tracking-tighter text-gray-500 text-center truncate">
                                  {color}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation Card */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-emerald-900/20 dark:to-gray-900 rounded-[2.5rem] p-10 text-white">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <FiTrendingUp size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black mb-2 tracking-tight">Stylist's Recommendation</h3>
                        <p className="text-gray-400 leading-relaxed font-medium">
                          Based on {colorName}, we recommend using <span className="text-white font-bold">{result.complementary[0]}</span> as your main accessory color for high-impact events, or <span className="text-white font-bold">{result.analogous[0]}</span> for a sophisticated, professional vibe.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[600px] bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-32 h-32 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-8">
                    <IoColorPaletteOutline className="text-emerald-500" size={64} />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                    Waiting for Input
                  </h3>
                  <p className="text-gray-500 max-w-sm font-medium leading-relaxed">
                    Select a color from the panel and click "Generate" to see the magic of color theory in action.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ColorMatch;
