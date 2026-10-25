
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiShield, FiUserPlus } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'female',
    agreeTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Security keys do not match.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        gender: formData.gender
      });
      
      if (response.data.user && response.data.access_token) {
        login(response.data.user, response.data.access_token);
        navigate('/dashboard');
      } else {
        setError('Registry successful but session data missing.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registry failed. This ID might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20 pb-10">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/img.jpg)', opacity: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 w-full max-w-xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-3xl rounded-3xl sm:rounded-[3.5rem] p-6 sm:p-10 md:p-16 border border-white/10 shadow-2xl"
        >
          <div className="text-center mb-8 sm:mb-12">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 text-[10px] font-black uppercase tracking-[0.3em]"
            >
              <FiUserPlus /> <span>New Member</span>
            </motion.div>
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-3 sm:mb-4">
              Establish <br/> <span className="text-secondary">Identity</span>
            </h1>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Create your digital fashion profile</p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 sm:p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mb-6 sm:mb-8 text-center border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-3 sm:ml-4">Legal Name</label>
                    <div className="relative group">
                        <FiUser className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary transition-colors" />
                        <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="NAME"
                        required
                        className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:border-secondary transition-all text-white font-bold placeholder:text-white/10 outline-none text-xs sm:text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-3 sm:ml-4">Gender</label>
                    <div className="flex gap-2">
                        {['male', 'female'].map(g => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setFormData({...formData, gender: g})}
                            className={`flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${formData.gender === g ? 'bg-secondary text-white' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}
                        >
                            {g}
                        </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-3 sm:ml-4">Email Channel</label>
              <div className="relative group">
                <FiMail className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ID@FASHION.AI"
                  required
                  className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:border-secondary transition-all text-white font-bold placeholder:text-white/10 outline-none text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-3 sm:ml-4">Secure Key</label>
                    <div className="relative group">
                        <FiLock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary transition-colors" />
                        <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••"
                        required
                        className="w-full pl-12 sm:pl-14 pr-12 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:border-secondary transition-all text-white font-bold outline-none text-xs sm:text-sm"
                        />
                    </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-3 sm:ml-4">Verify Key</label>
                    <div className="relative group">
                        <FiLock className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-secondary transition-colors" />
                        <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••"
                        required
                        className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl focus:border-secondary transition-all text-white font-bold outline-none text-xs sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer ml-3 sm:ml-4">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                required
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-secondary focus:ring-secondary"
              />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Accept Institutional Terms</span>
            </label>

            <button
              type="submit"
              disabled={loading || !formData.agreeTerms}
              className="group relative w-full overflow-hidden bg-secondary text-white py-4 sm:py-6 rounded-xl sm:rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:scale-[1.02] transition-all duration-500 shadow-xl disabled:opacity-20"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Initialize Membership
                    <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="text-center mt-8 sm:mt-12 text-[10px] font-black uppercase tracking-widest text-white/20">
            Existing Member?{' '}
            <Link to="/login" className="text-secondary hover:text-white transition-colors ml-2 underline underline-offset-4">
              Authorize ID
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
