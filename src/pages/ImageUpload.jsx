import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiImage, FiSearch, FiHeart, FiEye, FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';

const ImageUpload = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  // Sample similar outfits (in real app, these would come from ML)
  const similarOutfits = [
    { id: 1, name: 'Floral Summer Dress', similarity: 95, image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400', price: 89 },
    { id: 2, name: 'Bohemian Maxi', similarity: 92, image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400', price: 129 },
    { id: 3, name: 'Casual Chic', similarity: 88, image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400', price: 79 },
    { id: 4, name: 'Summer Vibes', similarity: 85, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', price: 69 },
    { id: 5, name: 'Elegant Wrap', similarity: 82, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400', price: 149 },
    { id: 6, name: 'Classic Style', similarity: 79, image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400', price: 99 },
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      analyzeImage(file);
    }
  };

  const analyzeImage = (file) => {
    setAnalyzing(true);
    // Simulate ML analysis
    setTimeout(() => {
      setResults(similarOutfits);
      setAnalyzing(false);
    }, 3000);
  };

  const resetAnalysis = () => {
    setUploadedImage(null);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            Image Based <span className="text-primary">Recommendations</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload a photo of any clothing item and our AI will find similar outfits and styles from our collection
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Upload Your Image</h2>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-primary transition-colors mb-6"
            >
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full max-h-96 object-contain rounded-xl"
                  />
                  {analyzing && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <div className="text-white text-center">
                        <FiRefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Finding similar outfits...</p>
                      </div>
                    </div>
                  )}
                  {!analyzing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetAnalysis();
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-16">
                  <FiImage className="w-20 h-20 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Click to upload a clothing image
                  </p>
                  <p className="text-sm text-gray-400">
                    Our AI will find similar styles
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tips for best results:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Use clear, well-lit photos</li>
                <li>• Include the entire clothing item</li>
                <li>• Avoid cluttered backgrounds</li>
                <li>• Works best with single items</li>
              </ul>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Similar Outfits</h2>

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 relative mb-6">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="text-lg font-medium mb-2">Analyzing your image...</p>
                <p className="text-sm text-gray-500">Finding similar outfits in our collection</p>
                
                {/* Progress Steps */}
                <div className="mt-8 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <FiCheck className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm">Processing image</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm">Extracting visual features</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    </div>
                    <span className="text-sm text-gray-400">Finding matches</span>
                  </div>
                </div>
              </div>
            ) : results ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-gray-500">{results.length} similar outfits found</p>
                  <button
                    onClick={resetAnalysis}
                    className="text-primary text-sm font-medium"
                  >
                    Upload Another
                  </button>
                </div>

                <div className="space-y-4">
                  {results.map((outfit, index) => (
                    <motion.div
                      key={outfit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="relative">
                        <img
                          src={outfit.image}
                          alt={outfit.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                          {outfit.similarity}%
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{outfit.name}</h4>
                        <p className="text-primary font-bold">${outfit.price}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary transition-colors">
                          <FiHeart className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/outfit/${outfit.id}`}
                          className="p-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Link
                  to="/gallery"
                  className="mt-6 w-full flex items-center justify-center space-x-2 bg-primary text-white py-3 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  <FiSearch />
                  <span>View All Similar Outfits</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FiImage className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">No results yet</p>
                <p className="text-sm text-gray-400">Upload an image to find similar outfits</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUpload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">1. Upload Image</h3>
              <p className="text-gray-500 text-sm">Take or upload a photo of any clothing item you like</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiImage className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">2. AI Analysis</h3>
              <p className="text-gray-500 text-sm">Our CNN model extracts visual features and patterns</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">3. Get Results</h3>
              <p className="text-gray-500 text-sm">Discover similar outfits from our collection</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ImageUpload;

