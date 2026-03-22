import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAward, FiUsers, FiZap } from 'react-icons/fi';

const Press = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
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
            Press & Media
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            FashionAI is redefining personal styling with AI. Get the latest updates, interviews, and coverage.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-10 shadow-2xl hover:shadow-3xl border border-white/50 hover:border-primary/30 transition-all duration-500"
          >
            <FiTrendingUp className="w-20 h-20 text-primary mb-8 mx-auto opacity-75 hover:opacity-100 transition-all" />
            <h3 className="text-3xl font-bold mb-6 text-gray-900 text-center">Featured In</h3>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">VOGUE</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">"AI Revolutionizes Fashion Recommendations"</p>
                  <p className="text-sm text-gray-500">December 2024</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">ELLE</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">"The Future of Personal Styling"</p>
                  <p className="text-sm text-gray-500">November 2024</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-10 shadow-2xl hover:shadow-3xl border border-white/50 hover:border-secondary/30 transition-all duration-500"
          >
            <FiAward className="w-20 h-20 text-secondary mb-8 mx-auto opacity-75 hover:opacity-100 transition-all" />
            <h3 className="text-3xl font-bold mb-6 text-gray-900 text-center">Awards</h3>
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl text-white shadow-xl">
                <div className="text-2xl font-bold mb-2">🥇 1st Place</div>
                <div className="text-lg">AI for Fashion Innovation Awards 2024</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl text-white shadow-xl">
                <div className="text-2xl font-bold mb-2">🏆 Winner</div>
                <div className="text-lg">TechCrunch Fashion Tech Startup 2024</div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur-xl rounded-3xl p-12 border border-primary/20 shadow-2xl text-center"
        >
          <h2 className="text-3xl lg:text-4xl font-black mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Get In Touch
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Interested in featuring FashionAI? Contact our press team for interviews, demos, and exclusive stories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <button className="flex-1 bg-white text-primary font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border-2 border-primary/20">
              Press Kit
            </button>
            <button className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
              Contact Press
            </button>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Press;
