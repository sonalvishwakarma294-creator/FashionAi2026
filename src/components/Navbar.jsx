import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, FiX, FiSearch, FiSun, FiMoon, FiUser, 
  FiHome, FiZap, FiImage, FiDroplet, 
  FiWatch, FiActivity, FiCalendar, FiAperture, FiSettings, FiMessageSquare 
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ scrolled, darkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/', icon: FiHome },
    { name: 'Recommendations', path: '/recommendations', icon: FiZap },
    { name: 'Gallery', path: '/gallery', icon: FiImage },
    { name: 'Skin Tone', path: '/skin-tone', icon: FiDroplet },
    { name: 'Color Harmony', path: '/color-match', icon: FiAperture },
    { name: 'Accessories', path: '/accessory-match', icon: FiWatch },
    { name: 'Body Type', path: '/body-type', icon: FiActivity },
    { name: 'Occasion', path: '/occasion', icon: FiCalendar },
    { name: 'Feedback', path: '/feedback', icon: FiMessageSquare },
  ];

  if (user && (user.role === 'admin' || user.is_admin)) {
    navLinks.push({ name: 'Admin', path: '/admin', icon: FiSettings });
  }

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const getUserName = () => {
    if (!user) return 'Member';
    return user.name?.split(' ')[0] || 'Member';
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-darkBackground/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-xl font-black tracking-tighter"
            >
              <span className="text-primary">FASHION</span>
              <span className="text-secondary">AI</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all duration-300 ${
                  isActive(link.path)
                    ? 'bg-primary text-white shadow-lg'
                    : scrolled
                    ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 180, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="absolute right-10 top-1/2 -translate-y-1/2"
                  >
                    <form onSubmit={handleSearch}>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-4 py-1.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary text-xs"
                        autoFocus
                      />
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 rounded-full transition-colors ${
                  scrolled 
                    ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400' 
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <FiSearch className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${
                scrolled 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400' 
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              {darkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
            </motion.button>

            {/* User Menu */}
            <div className="hidden md:flex items-center">
              {!user ? (
                <Link
                  to="/signup"
                  className="px-4 py-1.5 bg-primary text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:shadow-md transition-all ml-2"
                >
                  Join
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 p-1 pr-3 rounded-full transition-all border ml-2 ${
                    scrolled 
                      ? 'border-gray-200 hover:bg-gray-50' 
                      : 'border-white/10 hover:bg-white/5 text-white'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-black">
                    {getUserName()[0]}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {getUserName()}
                  </span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`xl:hidden p-2 rounded-lg ${scrolled ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' : 'bg-white/10 text-white'}`}
            >
              {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-white dark:bg-darkBackground shadow-lg border-t border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-4 grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive(link.path)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">{link.name}</span>
                </Link>
              ))}
            </div>

            {/* Auth section for mobile */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              {!user ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 text-primary"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-xs">
                      {getUserName()[0]}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest">{getUserName()}</div>
                      <div className="text-[8px] font-bold opacity-60 uppercase">Go to Dashboard</div>
                    </div>
                  </Link>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full py-3 rounded-xl border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;