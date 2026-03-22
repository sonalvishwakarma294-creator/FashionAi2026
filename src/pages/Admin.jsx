import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiMessageSquare, FiTrendingUp, FiCheck, FiMail, FiCalendar, FiStar } from 'react-icons/fi';
import { adminService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState({ total_users: 0, total_feedback: 0 });
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && !user.is_admin)) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, feedbackRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getFeedback()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setFeedback(feedbackRes.data);
    } catch (error) {
      console.error("Admin fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Admin Command Center</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Control and monitor your fashion ecosystem.</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            {['stats', 'users', 'feedback'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard icon={FiUsers} label="Total Users" value={stats.total_users} color="text-indigo-500" />
            <StatCard icon={FiMessageSquare} label="Total Feedback" value={stats.total_feedback} color="text-emerald-500" />
            <StatCard icon={FiTrendingUp} label="Platform Growth" value="+12%" color="text-rose-500" />
          </div>
        )}

        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-800">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">User Details</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Gender</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Member Since</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-bold text-xs">
                            {u.name[0]}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{u.name}</div>
                            <div className="text-[11px] text-gray-400 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{u.gender}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <FiCalendar className="text-gray-400" />
                          {u.member_since}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'feedback' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feedback.map((f) => (
              <motion.div 
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 font-black">
                        {f.name[0]}
                      </div>
                      <div>
                        <div className="font-black text-sm uppercase tracking-tighter">{f.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{f.created_at}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} size={12} className={i < (f.rating || 0) ? 'text-amber-400' : 'text-gray-200'} fill={i < (f.rating || 0) ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 italic">"{f.message}"</p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                  <FiMail size={12} className="text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 truncate">{f.email}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-gray-800">
    <div className={`w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 ${color}`}>
      <Icon size={28} />
    </div>
    <div className="text-3xl font-black uppercase tracking-tighter mb-1">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</div>
  </div>
);

export default Admin;
