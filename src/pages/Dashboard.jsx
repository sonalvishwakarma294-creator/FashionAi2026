
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiHeart, FiTrendingUp, FiLogOut, FiImage, FiAward, FiFileText, FiDroplet, FiLayers, FiEye, FiCheck, FiShoppingBag, FiStar, FiActivity, FiArrowRight, FiShield, FiLayout, FiRefreshCw, FiX, FiInfo, FiZap, FiBox } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';
import SmartImage from '../components/SmartImage';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const { user, refreshProfile, logout, loading } = useAuth();
  const navigate = useNavigate();

  const getColorHex = (colorName) => {
    if (!colorName) return '#CCCCCC';
    const normalizedName = colorName.toLowerCase().trim();
    const colors = {
      // Light Skin Tone Palette
      'peach': '#FFE5B4', 'rose gold': '#B76E79', 'ivory': '#FFFFF0', 'blush': '#FADADD',
      'pastel yellow': '#FFFFE0', 'champagne': '#F7E7CE', 'pearl white': '#EAE6E1', 'soft coral': '#F28C82',
      'shell pink': '#F4C2C2', 'apricot': '#FBCEB1', 'cream': '#FFFDD0', 'powder blue': '#B0E0E6',
      'baby blue': '#89CFF0', 'mint green': '#98FF98', 'light pink': '#FFB6C1', 'soft lavender': '#E6E6FA',
      'pale lilac': '#E6E6FA', 'sky blue': '#87CEEB', 'light beige': '#F5F5DC', 'quartz': '#D6D6D6',
      // Medium/Wheatish Tone Palette
      'teal': '#008080', 'emerald': '#50C878', 'navy': '#000080', 'gold': '#FFD700',
      'burgundy': '#800020', 'coral': '#FF7F50', 'mustard': '#FFDB58', 'khaki': '#C3B091',
      'sapphire': '#0F52BA', 'ochre': '#CC7722', 'taupe': '#483C32', 'camel': '#C19A6B',
      'plum': '#8E4585', 'charcoal': '#36454F', 'brick red': '#CB4154', 'mahogany': '#C04000',
      'deep purple': '#301934', 'forest green': '#228B22', 'rust': '#B7410E', 'olive': '#808000',
      // Olive Tone Palette
      'terracotta': '#E2725B', 'warm gold': '#B8860B', 'copper': '#B87333', 'bronze': '#CD7F32',
      'saffron': '#F4C430', 'amber': '#FFBF00', 'burnt orange': '#CC5500', 'rich brown': '#8B4513',
      'turquoise': '#40E0D0', 'deep maroon': '#800000',
      // Dark/Deep Tone Palette
      'royal purple': '#7851A9', 'crimson': '#DC143C', 'emerald green': '#50C878', 'sapphire blue': '#1261D3',
      'ruby': '#E0115F', 'onyx': '#353839', 'jet black': '#000000', 'maroon': '#800000',
      'jewel tones': '#8B008B', 'rich red': '#C71585',
      // Others
      'black': '#000000', 'white': '#FFFFFF', 'grey': '#808080'
    };
    return colors[normalizedName] || '#CCCCCC';
  };

  const fetchDashboardData = async () => {
    if (!user || !localStorage.getItem('fashionToken')) {
      setLocalLoading(false);
      return;
    }
    setLocalLoading(true);
    try {
      const response = await userService.getDashboardStats();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      if (error.response?.status !== 422) {
        setDashboardData({
          stats: {
            total_liked: 0,
            total_saved: 0,
            top_occasion: 'Casual',
            report_breakdown: {}
          },
          saved_recommendations: [],
          liked_outfits: [],
          user: user
        });
      }
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  if (!user || loading || localLoading || !dashboardData) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center bg-background dark:bg-darkBackground">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Syncing with Stylist Terminal...</p>
      </div>
    );
  }

  const { stats, saved_recommendations, liked_outfits } = dashboardData;
  const userName = user?.name || 'Member';
  const userInitial = userName.charAt(0).toUpperCase();

  const tabs = [
    { id: 'overview', name: 'Studio', icon: FiLayout },
    { id: 'reports', name: 'Reports', icon: FiDroplet },
    { id: 'favorites', name: 'Vault', icon: FiHeart },
    { id: 'accessories', name: 'Accessories', icon: FiShoppingBag },
  ];

  const ReportModal = ({ report, onClose }) => {
    if (!report) return null;
    const data = report.rec_data;
    
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/10"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-10">
            <div>
              <span className="text-primary font-black uppercase text-[10px] tracking-[0.3em] mb-2 block">{report.rec_type?.replace('_', ' ')}</span>
              <h2 className="text-4xl font-black uppercase tracking-tighter">{data.occasion || data.detected_style || 'Analysis'} Blueprint</h2>
              <p className="text-gray-400 font-bold text-xs mt-2">Generated on {new Date(report.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={onClose} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-primary hover:text-white transition-all"><FiX /></button>
          </div>

          <div className="space-y-12">
            {/* Color Palette */}
            {(data.recommended_colors || []).length > 0 && (
              <div>
                <h4 className="font-black uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2 opacity-40"><FiDroplet /> Target Spectrum</h4>
                <div className="flex flex-wrap gap-4">
                  {data.recommended_colors.map((c, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full border-4 border-gray-100 dark:border-gray-800 shadow-lg" style={{ backgroundColor: getColorHex(c) }} />
                      <span className="text-[8px] font-black uppercase opacity-60">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fabrics */}
            {(data.fabrics || []).length > 0 && (
              <div>
                <h4 className="font-black uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2 opacity-40"><FiLayers /> Material Logic</h4>
                <div className="flex flex-wrap gap-3">
                  {data.fabrics.map((f, i) => (
                    <span key={i} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs font-black uppercase tracking-widest">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations for Accessories */}
            {(data.recommendations || []).length > 0 && (
                <div>
                    <h4 className="font-black uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2 opacity-40"><FiShoppingBag /> Sync Recommendations</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {data.recommendations.map((r, i) => (
                            <div key={i} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <span className="text-xs font-bold uppercase">{r}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Personas/Looks */}
            {(data.personas || []).length > 0 && (
              <div className="space-y-8">
                <h4 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 opacity-40"><FiUser /> Curated Personas</h4>
                {data.personas.map((p, i) => (
                  <div key={i} className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10">
                    <h5 className="text-xl font-black uppercase mb-4 text-primary">{p.title}</h5>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl mb-6 shadow-sm">
                      <p className="text-lg font-bold uppercase tracking-tight">{p.look}</p>
                    </div>
                    <p className="text-gray-500 italic font-medium leading-relaxed font-serif">"{p.advice}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden pt-20 pb-10 bg-background dark:bg-darkBackground text-text dark:text-darkText font-sans">
      <div className="max-w-6xl w-full min-w-0 mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-[1.75rem] sm:rounded-[2.5rem] bg-black text-white p-5 sm:p-8 md:p-10 mb-6 sm:mb-8 shadow-2xl overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-black shadow-xl overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                ) : userInitial}
              </div>
              <button 
                onClick={() => {
                  const url = prompt('Enter Image URL for profile picture:', user.avatar_url || '');
                  if (url !== null) {
                    userService.updateProfile({ avatar_url: url }).then(fetchDashboardData);
                  }
                }}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiRefreshCw size={14} />
              </button>
            </div>
            <div className="text-center md:text-left flex-1 min-w-0 w-full">
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start mb-2">
                <h1 
                  className="text-3xl font-black uppercase tracking-tighter cursor-pointer hover:text-primary transition-colors"
                  onClick={() => {
                    const name = prompt('Update your display name:', userName);
                    if (name) {
                      userService.updateProfile({ name }).then(fetchDashboardData);
                    }
                  }}
                >
                  {userName}
                </h1>
                <span className="bg-white/10 text-primary text-[8px] font-black uppercase px-2 py-1 rounded-md border border-white/5 tracking-widest">PRO Member</span>
              </div>
              <p className="text-white/30 font-bold text-xs tracking-widest uppercase mb-6 [overflow-wrap:anywhere]">{user.email} • {user.gender}</p>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-8 justify-center md:justify-start">
                <div className="min-w-0 text-center">
                  <span className="text-[8px] font-black uppercase text-white/20 tracking-widest block">Wardrobe</span>
                  <p className="text-lg font-black">{stats.total_liked}</p>
                </div>
                <div className="min-w-0 text-center">
                  <span className="text-[8px] font-black uppercase text-white/20 tracking-widest block">Guides</span>
                  <p className="text-lg font-black">{stats.total_saved}</p>
                </div>
                <div className="min-w-0 text-center">
                  <span className="text-[8px] font-black uppercase text-white/20 tracking-widest block">Focus</span>
                  <p className="text-base sm:text-lg font-black break-words">{stats.top_occasion}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3 min-w-0 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 md:p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col pb-2 lg:pb-0">
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className={`min-w-0 justify-center lg:justify-start flex items-center gap-2 sm:gap-3 px-2 sm:px-5 py-3 sm:py-4 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-primary text-white shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-gray-800 opacity-40'}`}>
                    <t.icon size={14} /> {t.name}
                  </button>
                ))}
              </div>
              <div className="h-[1px] bg-gray-100 dark:bg-gray-800 my-6 hidden lg:block" />
              <div className="flex lg:flex-col gap-2">
                <button onClick={handleRefresh} className="flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary/20 transition-all"><FiRefreshCw size={14} /> Sync</button>
                <button onClick={logout} className="flex-1 flex items-center justify-center gap-3 px-5 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 transition-all"><FiLogOut size={14} /> Exit</button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-9 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="group bg-gradient-to-br from-primary to-secondary p-8 rounded-[2.5rem] text-white flex flex-col justify-between h-56 relative overflow-hidden shadow-2xl cursor-pointer" onClick={() => navigate('/recommendations')}>
                      <FiTrendingUp size={32} />
                      <h3 className="text-xl font-black uppercase tracking-tighter">AI Guide</h3>
                      <div className="flex items-center gap-2 text-sm font-bold opacity-80 group-hover:translate-x-2 transition-all">Analyze Now <FiArrowRight /></div>
                    </div>
                    <div className="group bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between h-56 relative overflow-hidden shadow-2xl cursor-pointer" onClick={() => navigate('/skin-tone')}>
                      <FiDroplet size={32} />
                      <h3 className="text-xl font-black uppercase tracking-tighter">Skin Lab</h3>
                      <div className="flex items-center gap-2 text-sm font-bold opacity-80 group-hover:translate-x-2 transition-all">Scan Tone <FiArrowRight /></div>
                    </div>
                    <div className="group bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between h-56 relative overflow-hidden shadow-2xl cursor-pointer" onClick={() => navigate('/accessory-match')}>
                      <FiShoppingBag size={32} />
                      <h3 className="text-xl font-black uppercase tracking-tighter">Accessory Match</h3>
                      <div className="flex items-center gap-2 text-sm font-bold opacity-80 group-hover:translate-x-2 transition-all">Sync Accessories <FiArrowRight /></div>
                    </div>
                  </div>
                  
                  {/* Advanced Analytics Section */}
                  <div className="bg-white dark:bg-gray-900 rounded-[1.75rem] sm:rounded-[2.5rem] p-5 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                      <FiActivity className="text-primary" /> Visual Insights Matrix
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
                      <div>
                        <span className="text-[10px] font-black uppercase opacity-40 block mb-2">Primary Style</span>
                        <p className="text-xl sm:text-2xl font-black text-secondary uppercase tracking-tighter break-words">{stats.top_occasion}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase opacity-40 block mb-2">Vault Size</span>
                        <p className="text-xl sm:text-2xl font-black text-primary uppercase tracking-tighter">{stats.total_liked}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase opacity-40 block mb-2">Neural Reports</span>
                        <p className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{stats.total_saved}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase opacity-40 block mb-2">Member Since</span>
                        <p className="text-xl sm:text-2xl font-black uppercase tracking-tighter">{user.member_since?.split(' ')[1] || '2026'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'reports' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {saved_recommendations.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <FiFileText className="mx-auto text-6xl text-gray-200 mb-6" />
                      <p className="font-black uppercase text-xs tracking-widest text-gray-400">No reports generated yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {saved_recommendations.map((rec, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h4 className="text-xl font-black uppercase tracking-tighter">{rec.rec_type?.replace('_', ' ')} Report</h4>
                              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{new Date(rec.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{rec.rec_data.occasion || rec.rec_data.detected_style || 'General'}</span>
                          </div>
                          
                          {(rec.rec_data.recommended_colors || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                              {rec.rec_data.recommended_colors.slice(0, 10).map((c, idx) => (
                                <div key={idx} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: getColorHex(c) }} title={c} />
                              ))}
                            </div>
                          )}
                          
                          <div 
                            onClick={() => setSelectedReport(rec)}
                            className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest group cursor-pointer"
                          >
                            View Full Analysis <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'favorites' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {liked_outfits.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <FiHeart className="mx-auto text-6xl text-gray-200 mb-6" />
                      <p className="font-black uppercase text-xs tracking-widest text-gray-400">Vault empty</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {liked_outfits.map((outfit, i) => (
                        <div key={i} className="group relative aspect-square rounded-[2rem] overflow-hidden shadow-xl">
                        <SmartImage
                          src={outfit.image}
                          outfit={outfit}
                          alt={outfit.name}
                          imgClassName="object-cover group-hover:scale-110 transition-transform duration-700"
                          wrapperClassName="w-full h-full"
                        />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                            <p className="text-white font-black uppercase text-xs tracking-widest mb-2">{outfit.name}</p>
                            <button onClick={() => navigate(`/outfit/${outfit.id}`)} className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Explore</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'accessories' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
                  <FiShoppingBag className="text-6xl text-gray-200 dark:text-gray-700 mb-6" />
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Neural Accessory Link</h3>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest max-w-xs">Integrating visual matching algorithms. Feature coming in next update.</p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
