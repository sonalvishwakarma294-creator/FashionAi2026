import React from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone } from 'react-icons/fi';

const Contact = () => (
  <div className="min-h-screen pt-32 pb-20 px-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-white dark:bg-gray-900 p-12 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800">
      <h1 className="text-4xl font-black uppercase mb-8 text-center">Contact Us</h1>
      <div className="space-y-6">
        <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
          <FiMail className="text-3xl text-primary" />
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">Email</p>
            <p className="font-bold">support@fashionai.com</p>
          </div>
        </div>
        <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
          <FiPhone className="text-3xl text-secondary" />
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400">Phone</p>
            <p className="font-bold">+1 (555) 123-4567</p>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

export default Contact;
