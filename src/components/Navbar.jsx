import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiSearch, FiSun, FiMoon, FiUser, FiShoppingBag, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ scrolled, darkMode, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Recommendations', path: '/recommendations' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Skin Tone', path: '/skin-tone' },
    { name: 'Color Harmony', path: '/color-match' },
    { name: 'Accessories', path: '/accessory-match' },
    { name: 'Body Type', path: '/body-type' },
    { name: 'Occasion', path: '/occasion' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gallery?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const { user, logout } = useAuth();

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
          ? 'bg-white dark:bg-darkBackground shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold"
            >
              <span className="text-primary">Fashion</span>
              <span className="text-secondary">AI</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative font-medium transition-colors duration-300 ${
                  isActive(link.path)
                    ? 'text-primary'
                    : scrolled
                    ? 'text-text dark:text-darkText hover:text-primary'
                    : 'text-white hover:text-primary shadow-sm'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <AnimatePresence>
                {searchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="absolute right-10 top-1/2 -translate-y-1/2"
                  >
                    <form onSubmit={handleSearch}>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="w-full px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-primary text-sm"
                        autoFocus
                      />
                    </form>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className={`p-2 rounded-full transition-colors ${
                  scrolled 
                    ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text dark:text-darkText' 
                    : 'hover:bg-white/10 text-white'
                }`}
              >
                <FiSearch className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${
                scrolled 
                  ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text dark:text-darkText' 
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </motion.button>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-3">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    className={`text-sm font-medium transition-colors ${
                      scrolled 
                        ? 'text-text dark:text-darkText hover:text-primary' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-opacity-90 transition-all shadow-md"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    to="/dashboard"
                    className={`p-2 rounded-full transition-colors flex items-center gap-2 ${
                      scrolled 
                        ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-text dark:text-darkText' 
                        : 'hover:bg-white/10 text-white'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {getUserName()}
                    </span>
                    <FiUser className="w-5 h-5" />
                  </Link>
                  <button 
                    onClick={logout}
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${
                      scrolled 
                        ? 'border-gray-200 text-text hover:bg-red-50 hover:text-red-500' 
                        : 'border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`md:hidden p-2 ${scrolled ? 'text-text dark:text-darkText' : 'text-white'}`}
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
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
            className="md:hidden bg-white dark:bg-darkBackground shadow-lg"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block py-2 px-4 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {user ? (
                  <>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{getUserName()}</span>
                      <FiUser className="text-primary" />
                    </div>
                    <button 
                      onClick={() => { setIsOpen(false); }}
                      className="w-full py-3 flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-lg text-xs font-black uppercase tracking-widest"
                    >
                      <FiRefreshCw size={14} /> Refresh Profile
                    </button>
                    <button 
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="w-full py-3 flex items-center justify-center gap-2 border border-red-200 text-red-500 rounded-lg text-xs font-black uppercase tracking-widest"
                    >
                      Logout (Exit)
                    </button>
                  </>
                ) : (
                  <div className="flex space-x-3">
                    <Link
                      to="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-3 text-center border border-primary text-primary rounded-lg text-xs font-black uppercase tracking-widest"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 py-3 text-center bg-primary text-white rounded-lg text-xs font-black uppercase tracking-widest"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

