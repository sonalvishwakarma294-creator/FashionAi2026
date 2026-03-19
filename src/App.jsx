import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Auth
import { AuthProvider } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import Recommendations from './pages/Recommendations';
import Gallery from './pages/Gallery';
import SkinTone from './pages/SkinTone';
import BodyType from './pages/BodyType';
import Occasion from './pages/Occasion';
import ImageUpload from './pages/ImageUpload';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import OutfitDetail from './pages/OutfitDetail';
import AccessoryMatch from './pages/AccessoryMatch';
import About from './pages/About';
import Careers from './pages/Careers';
import Press from './pages/Press';
import Blog from './pages/Blog';
import ColorMatch from './pages/ColorMatch';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-background dark:bg-darkBackground text-text dark:text-darkText transition-colors duration-300">
        <Navbar scrolled={scrolled} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/skintone" element={<SkinTone />} />
            <Route path="/skin-tone" element={<SkinTone />} />
            <Route path="/body-type" element={<BodyType />} />
            <Route path="/occasion" element={<Occasion />} />
            <Route path="/image-upload" element={<ImageUpload />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/outfit/:id" element={<OutfitDetail />} />
            <Route path="/accessory-match" element={<AccessoryMatch />} />
            <Route path="/color-match" element={<ColorMatch />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/press" element={<Press />} />
            <Route path="/blog" element={<Blog />} />
          </Routes>
        </AnimatePresence>
        <Footer />
        <Chatbot />
        <ScrollToTop />


      </div>
    </AuthProvider>


  );
}

export default App;

