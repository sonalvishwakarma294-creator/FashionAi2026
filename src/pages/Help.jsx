import React from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiHelpCircle } from 'react-icons/fi';

const Help = () => (
  <div className="min-h-screen pt-32 pb-20 px-6">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-black uppercase mb-12 text-center">Help Center</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <FiBook className="text-primary text-3xl mb-4" />
          <h3 className="text-xl font-bold mb-2 uppercase">Guides</h3>
          <p className="text-gray-500 text-sm">Step-by-step instructions on using AI analysis.</p>
        </div>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <FiHelpCircle className="text-secondary text-3xl mb-4" />
          <h3 className="text-xl font-bold mb-2 uppercase">FAQs</h3>
          <p className="text-gray-500 text-sm">Frequently asked questions about styling.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Help;
