import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCheck, FiRefreshCw, FiArrowRight, FiDownload, FiSave } from 'react-icons/fi';
import { recommendationService } from '../services/api';

const BodyType = () => {
  const [measurements, setMeasurements] = useState({
    height: '',
    weight: '',
    bust: '',
    waist: '',
    hips: '',
    shoulders: ''
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  const saveReport = async () => {
    try {
      await recommendationService.saveRecommendation({
        type: 'body_type_report',
        date: new Date().toLocaleDateString(),
        body_type: result.name,
        description: result.description,
        recommendations: result.recommendations,
        characteristics: result.characteristics
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      alert('Save failed. Please login to save reports.');
      console.error(error);
    }
  };

  const bodyTypes = [
    {
      id: 'hourglass',
      name: 'Hourglass',
      description: 'Your bust and hips are nearly equal in measurement with a well-defined waist.',
      characteristics: ['Balanced bust and hips', 'Defined waistline', 'Curvy figure'],
      recommendations: ['Fitted dresses', 'High-waisted bottoms', 'Wrap dresses', 'Belted jackets'],
      avoid: ['Boxy silhouettes', 'Oversized clothing', 'Straight-leg pants without definition']
    },
    {
      id: 'pear',
      name: 'Pear',
      description: 'Your hips are wider than your shoulders, with a smaller bust area.',
      characteristics: ['Wider hips', 'Smaller bust', 'Defined waist'],
      recommendations: ['A-line skirts', 'Bootcut pants', 'V-neck tops', 'Statement necklines'],
      avoid: ['Tight-fitting bottoms', 'Cargo pants', 'Plain tees without detail']
    },
    {
      id: 'apple',
      name: 'Apple',
      description: 'Your midsection is broader with slimmer legs and a less defined waist.',
      characteristics: ['Broader midsection', 'Slimmer legs', 'Fuller bust'],
      recommendations: ['Empire waist dresses', 'Bootcut pants', 'V-neck tops', 'Structured jackets'],
      avoid: ['Tight waistbands', 'High-waisted pants', 'Oversized sweaters']
    },
    {
      id: 'rectangle',
      name: 'Rectangle',
      description: 'Your bust, waist, and hips are similar in measurement with minimal curves.',
      characteristics: ['Balanced measurements', 'Less defined waist', 'Athletic build'],
      recommendations: ['Peplum tops', 'Belted dresses', 'Puff sleeve details', 'Curved hemlines'],
      avoid: ['Baggy clothing', 'Straight-cut everything', 'Monochromatic looks without texture']
    },
    {
      id: 'athletic',
      name: 'Athletic',
      description: 'Your shoulders are broader than your hips with a defined muscle structure.',
      characteristics: ['Broad shoulders', 'Narrower hips', 'Well-defined muscles'],
      recommendations: ['V-neck tops', 'Wide-leg pants', 'A-line dresses', 'Statement earrings'],
      avoid: ['Padded shoulders', 'Cap sleeves', 'Neckline detail']
    }
  ];

  const handleInputChange = (e) => {
    setMeasurements({
      ...measurements,
      [e.target.name]: e.target.value
    });
  };

  const analyzeBodyType = () => {
    setAnalyzing(true);
    
    // Simple calculation based on measurements
    setTimeout(() => {
      const { bust, waist, hips, shoulders } = measurements;
      let bodyType;
      
      // Simple logic for demonstration
      if (waist && hips && Number(waist) < Number(hips) * 0.9) {
        bodyType = bodyTypes[0]; // Hourglass
      } else if (hips && shoulders && Number(hips) > Number(shoulders)) {
        bodyType = bodyTypes[1]; // Pear
      } else if (waist && bust && Number(waist) >= Number(bust) * 0.95) {
        bodyType = bodyTypes[2]; // Apple
      } else {
        bodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
      }
      
      setResult(bodyType);
      setAnalyzing(false);
    }, 2500);
  };

  const selectBodyType = (type) => {
    setResult(type);
  };

  const resetAnalysis = () => {
    setResult(null);
    setMeasurements({
      height: '',
      weight: '',
      bust: '',
      waist: '',
      hips: '',
      shoulders: ''
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background dark:bg-darkBackground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Body Type <span className="text-secondary">Analysis</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Enter your measurements or select your body type to get personalized outfit recommendations
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Enter Your Measurements</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={measurements.height}
                  onChange={handleInputChange}
                  placeholder="170"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={measurements.weight}
                  onChange={handleInputChange}
                  placeholder="70"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bust (cm)</label>
                <input
                  type="number"
                  name="bust"
                  value={measurements.bust}
                  onChange={handleInputChange}
                  placeholder="90"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Waist (cm)</label>
                <input
                  type="number"
                  name="waist"
                  value={measurements.waist}
                  onChange={handleInputChange}
                  placeholder="75"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hips (cm)</label>
                <input
                  type="number"
                  name="hips"
                  value={measurements.hips}
                  onChange={handleInputChange}
                  placeholder="95"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Shoulders (cm)</label>
                <input
                  type="number"
                  name="shoulders"
                  value={measurements.shoulders}
                  onChange={handleInputChange}
                  placeholder="40"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-primary bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <button
              onClick={analyzeBodyType}
              disabled={analyzing}
              className="w-full flex items-center justify-center space-x-2 bg-primary text-white py-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <FiUser />
                  <span>Analyze Body Type</span>
                </>
              )}
            </button>

            {/* Manual Selection */}
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4">Or select your body type manually:</h3>
              <div className="space-y-2">
                {bodyTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => selectBodyType(type)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      result?.id === type.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Your Body Type</h2>

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 relative mb-6">
                  <div className="absolute inset-0 border-4 border-secondary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-secondary rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-lg font-medium mb-2">Analyzing your body type...</p>
                <p className="text-sm text-gray-500">This may take a few seconds</p>
              </div>
            ) : result ? (
              <div>
                {/* Body Type Info */}
                <div className="text-center mb-8">
                  <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <FiUser className="w-16 h-16 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold">{result.name}</h3>
                  <p className="text-gray-500 mt-2">{result.description}</p>
                </div>

                {/* Characteristics */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Your Characteristics</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.characteristics.map((char, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">Recommended Styles</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendations.map((rec, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm"
                      >
                        {rec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* What to Avoid */}
                <div className="mb-8">
                  <h4 className="font-semibold mb-3">What to Avoid</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.avoid.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-sm"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                <button onClick={saveReport} disabled={isSaved} className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-black uppercase text-xs tracking-widest transition-all ${isSaved ? 'bg-green-500 text-white shadow-lg' : 'bg-primary text-white hover:shadow-lg hover:scale-105 shadow-primary/20'}`}>
                  {isSaved ? <FiCheck className="animate-pulse" /> : <FiSave />}
                  <span>{isSaved ? 'Saved!' : 'Save Report'}</span>
                </button>
                  <button className="flex-1 flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 py-3 rounded-lg hover:border-secondary transition-colors">
                    <FiDownload />
                    <span>Download Report</span>
                  </button>
                </div>

                <button
                  onClick={resetAnalysis}
                  className="w-full mt-4 flex items-center justify-center space-x-2 text-gray-500 hover:text-secondary transition-colors"
                >
                  <FiRefreshCw />
                  <span>Try Again</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FiUser className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">No analysis yet</p>
                <p className="text-sm text-gray-400">Enter your measurements or select your body type</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Body Type Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">Body Type Guide</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bodyTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                onClick={() => selectBodyType(type)}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer"
              >
                <h3 className="font-semibold text-lg mb-2">{type.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{type.description}</p>
                <div className="flex items-center text-primary text-sm font-medium">
                  <span>Learn more</span>
                  <FiArrowRight className="ml-2" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BodyType;
