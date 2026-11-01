import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiAward, FiZap, FiGlobe } from 'react-icons/fi';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto px-4 py-24"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-6">
            About FashionAI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing personal styling through AI. From skin analysis to perfect outfit matches.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 mb-24 items-center">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black mb-8 text-gray-900">
              Our Mission
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              We believe fashion should be{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold">
                effortless, inclusive, and intelligent.
              </span>{' '}
              Our AI analyzes your unique characteristics to deliver personalized recommendations that celebrate your individuality.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4 p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50">
                <FiUsers className="w-12 h-12 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">1M+</h4>
                  <p className="text-gray-600 font-medium">Happy Users</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50">
                <FiAward className="w-12 h-12 text-secondary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">50K+</h4>
                  <p className="text-gray-600 font-medium">Outfits Saved</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="w-full h-96 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-3xl shadow-2xl border border-white/30 backdrop-blur-xl p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white/50">
                  <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-white/90 mb-2">AI-Powered</p>
                <p className="text-lg text-white/70">Fashion Revolution</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-xl rounded-3xl p-16 border border-primary/10 shadow-2xl text-center"
        >
          <h2 className="text-4xl lg:text-5xl font-black mb-12 bg-gradient-to-r from-gray-800 via-gray-700 to-black bg-clip-text text-transparent">
            Our Technology
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8">
              <FiZap className="w-16 h-16 text-primary mx-auto mb-6 opacity-80" />
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Computer Vision</h4>
              <p className="text-lg text-gray-700 leading-relaxed">Advanced ML models analyze skin tone, body shape, and outfit compatibility with 97% accuracy.</p>
            </div>
            <div className="p-8">
              <FiGlobe className="w-16 h-16 text-secondary mx-auto mb-6 opacity-80" />
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Recommendation Engine</h4>
              <p className="text-lg text-gray-700 leading-relaxed">Millions of fashion items analyzed daily to provide perfect matches for any occasion.</p>
            </div>
            <div className="p-8">
              <FiUsers className="w-16 h-16 text-accent mx-auto mb-6 opacity-80" />
              <h4 className="text-2xl font-bold mb-4 text-gray-900">Personalization</h4>
              <p className="text-lg text-gray-700 leading-relaxed">Your wardrobe, your style, your AI stylist that learns and improves with every interaction.</p>
            </div>
          </div>
        </motion.section>

        {/* Research & Styling Disclaimer Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 p-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xl shrink-0">
              ℹ️
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Project & Research Disclaimer
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Fashion Pro AI is a technology showcase combining computer vision (CIEDE2000, color extraction) and fashion harmony theory. Personal style, cultural context, and camera lighting all play a role in fashion perception. All suggestions are intended as creative styling guides rather than rigid rules.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 p-12 bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200"
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-black mb-6 text-gray-900">
              Ready to transform your style?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands discovering their perfect outfits through AI.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto">
            <button className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-black py-5 px-10 text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-white/20">
              Get Started Free
            </button>
            <button className="flex-1 bg-white text-primary font-black py-5 px-10 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-2 border-primary/30">
              Learn More
            </button>
          </div>
        </motion.section>

      </motion.main>
    </div>
  );
};

export default About;
