import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiStar, FiCheckCircle } from 'react-icons/fi';
import { feedbackService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Feedback = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: '',
    rating: 5
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await feedbackService.submit(formData);
      setSuccess(true);
      setFormData({ ...formData, message: '' });
    } catch (error) {
      console.error("Feedback failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-center border border-emerald-100 dark:border-emerald-900"
        >
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Thank You!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Your feedback helps us improve Style AI for everyone.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
          >
            Send Another
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Share Your Experience</h1>
          <p className="text-gray-500 dark:text-gray-400">Help us make your fashion journey even better.</p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:outline-none transition-all text-sm font-medium"
                placeholder="Your Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:outline-none transition-all text-sm font-medium"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Rating</label>
            <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({...formData, rating: star})}
                  className={`transition-all ${formData.rating >= star ? 'text-amber-400 scale-125' : 'text-gray-300'}`}
                >
                  <FiStar fill={formData.rating >= star ? 'currentColor' : 'none'} size={24} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Your Message</label>
            <textarea 
              required
              rows="5"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:outline-none transition-all text-sm font-medium resize-none"
              placeholder="Tell us what you think..."
            ></textarea>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-primary transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? 'Submitting...' : (
              <>
                <span>Submit Feedback</span>
                <FiSend size={16} />
              </>
            )}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default Feedback;
