import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiCheck, FiAlertTriangle, FiRefreshCw, FiLogIn } from 'react-icons/fi';
import { authService } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validation, setValidation] = useState({ valid: false, email: '', userName: '' });

  useEffect(() => {
    if (!token) {
      setValidation({ valid: false, email: '', userName: '' });
      setError('Reset link is missing. Please request a new password reset email from the login page.');
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authService.validateResetToken(token);
        setValidation({ valid: true, email: res.data.email, userName: res.data.user_name });
      } catch (err) {
        setValidation({ valid: false, email: '', userName: '' });
        setError(err.response?.data?.error || 'Reset link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const strength = () => {
    let score = 0;
    const p = newPassword;
    if (!p) return { score: 0, label: '', color: 'bg-gray-200' };
    if (p.length >= 8) score++;
    if (/[a-z]/.test(p)) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p) && p.length >= 10) score++;
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const colors = ['bg-red-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];
    return { score, label: labels[score], color: colors[score] };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setSubmitting(true);
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login?msg=password_reset'), 1600);
    } catch (err) {
      setError(err.response?.data?.error || 'Password update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const strengthInfo = strength();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/img.jpg)', opacity: 0.4 }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black" />
      </div>

      <div className="relative z-10 w-full max-w-xl px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 md:p-16 border border-white/10 shadow-2xl">
          <div className="text-center mb-10">
            <motion.div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 text-[10px] font-black uppercase tracking-[0.3em]"><FiShield /> <span>Reset Credentials</span></motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">Set New <br/> <span className="text-primary">Password</span></h1>
            {!loading && validation.valid && (
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                Resetting for <span className="text-primary">{validation.userName} · {validation.email}</span>
              </p>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-14 h-14 border-4 border-white/10 border-t-primary rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Verifying secure link…</p>
            </div>
          )}

          {!loading && error && !success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-red-400 mb-1">Link Issue</p>
                    <p className="text-xs text-red-200/80 leading-relaxed">{error}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors border border-white/10">
                  <FiLogIn className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            </motion.div>
          )}

          {!loading && success && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <FiCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="text-2xl font-black uppercase text-white mb-2">Password Reset</p>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-8">Redirecting to secure login…</p>
              <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                Login Now <FiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          )}

          {!loading && !error && !success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hidden token field (also in state/params) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">New Security Key</label>
                <div className="relative group">
                  <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="NEW STRONG PASSWORD"
                    required
                    autoComplete="new-password"
                    className="w-full pl-14 pr-14 py-5 bg-white/5 border border-white/10 rounded-2xl focus:border-primary focus:bg-white/10 transition-all text-white font-bold placeholder:text-white/10 outline-none"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                    {showNew ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>

                {/* Strength bar */}
                <div className="px-4 pt-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${strengthInfo.color} transition-all duration-300`} style={{ width: `${[0, 20, 40, 60, 80, 100][strengthInfo.score]}%` }} />
                  </div>
                  <div className="flex justify-between mt-2 items-end">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Strength</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${strengthInfo.score <= 1 ? 'text-red-400' : strengthInfo.score <= 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-[10px] text-white/40 uppercase tracking-widest pl-0.5">
                    {[
                      ['At least 8 characters', newPassword.length >= 8],
                      ['Contains lowercase', /[a-z]/.test(newPassword)],
                      ['Contains uppercase', /[A-Z]/.test(newPassword)],
                      ['Contains a number', /[0-9]/.test(newPassword)],
                      ['Not a common password', !['password', '123456', 'qwerty', 'abc123'].includes(newPassword.toLowerCase())],
                    ].map(([rule, ok], i) => (
                      <li key={i} className={`flex items-center gap-2 ${ok ? 'text-emerald-400' : ''}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                          <FiCheck className="w-2.5 h-2.5" />
                        </span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 ml-4">Confirm Security Key</label>
                <div className="relative group">
                  <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="TYPE IT AGAIN"
                    required
                    autoComplete="new-password"
                    className={`w-full pl-14 pr-14 py-5 bg-white/5 border rounded-2xl focus:bg-white/10 transition-all text-white font-bold placeholder:text-white/10 outline-none ${
                      confirmPassword
                        ? confirmPassword === newPassword
                          ? 'border-emerald-500/40 focus:border-emerald-500'
                          : 'border-red-500/40 focus:border-red-500'
                        : 'border-white/10 focus:border-primary'
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                    {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                  {confirmPassword && (
                    <div className={`absolute right-14 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center ${confirmPassword === newPassword ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {confirmPassword === newPassword ? (
                        <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <FiAlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" disabled={submitting || strengthInfo.score < 2} className="group relative w-full bg-white text-black py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-primary hover:text-white transition-all shadow-xl disabled:opacity-30">
                {submitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <FiRefreshCw className="w-4 h-4 animate-spin" /> Updating credentials…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">Set New Password <FiArrowRight /></span>
                )}
              </button>

              <p className="text-center text-[10px] font-black uppercase tracking-widest text-white/20">
                Need a new link? <Link to="/login" className="text-primary hover:text-white underline underline-offset-4">Request again</Link>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
