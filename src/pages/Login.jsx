
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiX } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import api from '../services/api';

  const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });
      
      console.log('Login Response:', response.data);
      if (response.data.user && response.data.access_token) {
        login(response.data.user, response.data.access_token);
      } else {
        setError('Login successful but session data missing.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Verify your identity.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(res.data.message);
    } catch (err) {
      setForgotMsg(err.response?.data?.error || "Error finding identity.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/img.jpg)', opacity: 0.4 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 backdrop-blur-2xl rounded-3xl sm:rounded-[3rem] p-6 sm:p-10 md:p-16 border border-white/10 shadow-2xl">
          <div className="text-center mb-8 sm:mb-12">
            <motion.div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 text-[10px] font-black uppercase tracking-[0.3em]"><FiShield /> <span>Secure Access</span></motion.div>
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3 sm:mb-4">Welcome <br/> <span className="text-primary">Back</span></h1>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Enter credentials to unlock vault</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 text-red-400 p-3 sm:p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 sm:mb-8 text-center border border-red-500/20">{error}</motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-3 sm:ml-4">Email Terminal</label>
              <div className="relative group">
                <FiMail className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="ID@FASHION.AI" autoComplete="email" required className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3.5 sm:py-5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:border-primary focus:bg-white/10 transition-all text-white font-bold placeholder:text-white/10 outline-none text-xs sm:text-sm" />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-3 sm:ml-4">Security Key</label>
              <div className="relative group">
                <FiLock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" autoComplete="current-password" required className="w-full pl-12 sm:pl-14 pr-12 sm:pr-14 py-3.5 sm:py-5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:border-primary focus:bg-white/10 transition-all text-white font-bold outline-none text-xs sm:text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">{showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}</button>
              </div>
              <div className="text-right pr-2 pt-1 sm:pt-2">
                <button type="button" onClick={() => setShowForgot(true)} className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Forgot Key?</button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="group relative w-full bg-white text-black py-4 sm:py-6 rounded-xl sm:rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-primary hover:text-white transition-all shadow-xl disabled:opacity-20">
              {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-3">Authorize Account <FiArrowRight /></span>}
            </button>
          </form>

          <p className="text-center mt-8 sm:mt-12 text-[10px] font-black uppercase tracking-widest text-white/20">New Member? <Link to="/signup" className="text-primary hover:text-white transition-colors ml-2 underline underline-offset-4">Establish Identity</Link></p>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-gray-900 border border-white/10 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md relative shadow-2xl">
              <button onClick={() => {setShowForgot(false); setForgotMsg('');}} className="absolute top-5 right-5 sm:top-6 sm:right-6 text-white/40 hover:text-white"><FiX size={20} /></button>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mb-2">Key Recovery</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-6 sm:mb-8">Confirm your identity terminal</p>
              
              {!forgotMsg ? (
                <form onSubmit={handleForgotSubmit} className="space-y-6">
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="ENTER REGISTERED EMAIL" required className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-white/10 outline-none focus:border-primary" />
                  <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:shadow-lg transition-all">Verify Identity</button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm font-bold text-primary uppercase leading-relaxed">{forgotMsg}</p>
                  <button onClick={() => setShowForgot(false)} className="mt-8 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white underline">Back to Login</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;
