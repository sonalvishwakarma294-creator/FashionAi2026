import React from 'react';
import { motion } from 'framer-motion';
import { FiBriefcase, FiUsers, FiAward, FiClock } from 'react-icons/fi';

const Careers = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
            Careers
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Join our revolutionary team building the future of AI-powered fashion. Be part of something extraordinary.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl hover:shadow-3xl border border-white/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 group"
          >
            <FiBriefcase className="w-16 h-16 text-primary mx-auto mb-6 opacity-75 group-hover:opacity-100 transition-all" />
            <h3 className="text-2xl font-bold mb-4 text-gray-900">AI Engineers</h3>
            <p className="text-gray-600 leading-relaxed mb-6">Build cutting-edge ML models for fashion recommendation and computer vision.</p>
            <button className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 px-6 rounded-2xl hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]">
              Apply Now
            </button>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl hover:shadow-3xl border border-white/50 hover:border-secondary/30 transition-all duration-500 hover:-translate-y-2 group"
          >
            <FiUsers className="w-16 h-16 text-secondary mx-auto mb-6 opacity-75 group-hover:opacity-100 transition-all" />
            <h3 className="text-2xl font-bold mb-4 text-gray-900">UX/UI Designers</h3>
            <p className="text-gray-600 leading-relaxed mb-6">Craft intuitive interfaces for fashion enthusiasts and AI power users.</p>
            <button className="w-full bg-gradient-to-r from-secondary to-primary text-white font-bold py-4 px-6 rounded-2xl hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]">
              Apply Now
            </button>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl hover:shadow-3xl border border-white/50 hover:border-accent/30 transition-all duration-500 hover:-translate-y-2 group"
          >
            <FiAward className="w-16 h-16 text-accent mx-auto mb-6 opacity-75 group-hover:opacity-100 transition-all" />
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Fashion Experts</h3>
            <p className="text-gray-600 leading-relaxed mb-6">Curate datasets and validate AI recommendations with your fashion expertise.</p>
            <button className="w-full bg-gradient-to-r from-accent to-primary text-white font-bold py-4 px-6 rounded-2xl hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]">
              Apply Now
            </button>
          </motion.div>
        </div>

        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center bg-white/50 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/30"
        >
          <h2 className="text-3xl lg:text-4xl font-black mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Why Join Us?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <FiClock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2 text-gray-900">Flexible Hours</h4>
              <p className="text-gray-600">Work when you're most creative. Async-first culture.</p>
            </div>
            <div>
              <FiUsers className="w-12 h-12 text-secondary mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2 text-gray-900">Remote First</h4>
              <p className="text-gray-600">Work from anywhere. Global team, unified vision.</p>
            </div>
            <div>
              <FiAward className="w-12 h-12 text-accent mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2 text-gray-900">Equity + Impact</h4>
              <p className="text-gray-600">Own part of the future of fashion. Make real impact.</p>
            </div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  );
};

export default Careers;
