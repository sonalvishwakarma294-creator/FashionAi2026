import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiCompass, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center relative z-10 space-y-6"
      >
        <div className="relative inline-block">
          <span className="text-8xl sm:text-9xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent select-none">
            404
          </span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Style Not Found
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The page or runway look you are searching for does not exist or has been relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:opacity-95 transition-all"
          >
            <FiHome className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/gallery"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
          >
            <FiCompass className="w-4 h-4" />
            <span>Browse Gallery</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
