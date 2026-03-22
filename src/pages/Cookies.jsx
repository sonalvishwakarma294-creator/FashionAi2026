import React from 'react';
import { motion } from 'framer-motion';

const Cookies = () => (
  <div className="min-h-screen pt-32 pb-20 px-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white dark:bg-gray-900 p-10 md:p-16 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800">
      <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Cookie Policy</h1>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">We use cookies to keep you logged in and remember your dark mode and style preferences.</p>
    </motion.div>
  </div>
);

export default Cookies;
