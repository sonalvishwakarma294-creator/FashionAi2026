import React from 'react';
import { motion } from 'framer-motion';

const Terms = () => (
  <div className="min-h-screen pt-32 pb-20 px-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-10 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Terms of Service</h1>
      <div className="space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed">
        <h2 className="text-xl font-bold text-black dark:text-white uppercase">User Responsibilities</h2>
        <p>By using Fashion AI Studio, you agree to provide accurate style data for the best recommendations. Misuse of the platform is prohibited.</p>
        <h2 className="text-xl font-bold text-black dark:text-white uppercase">Disclaimer</h2>
        <p>AI suggestions are based on algorithms and should be used as styling inspiration.</p>
      </div>
    </motion.div>
  </div>
);

export default Terms;
