
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiInstagram, FiTwitter, FiFacebook, FiLinkedin, FiMail, FiMapPin, FiPhone, FiArrowUp, FiSearch, FiBell } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Simulate signup
    console.log('Newsletter signup:', newsletterEmail);
    setNewsletterEmail('');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers' },
      { name: 'Press', path: '/press' },
      { name: 'Blog', path: '/blog' },
    ],
    services: [
      { name: 'Skin Analysis', path: '/skintone' },
      { name: 'Body Type', path: '/bodytype' },
      { name: 'Occasion', path: '/occasion' },
      { name: 'Accessory Match', path: '/accessorymatch' },
      { name: 'Recommendations', path: '/recommendations' },
      { name: 'Gallery', path: '/gallery' }
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: FiInstagram, href: 'https://instagram.com/fashionai', name: 'Instagram' },
    { icon: FiTwitter, href: 'https://twitter.com/fashionai', name: 'Twitter' },
    { icon: FiFacebook, href: 'https://facebook.com/fashionai', name: 'Facebook' },
    { icon: FiLinkedin, href: 'https://linkedin.com/company/fashionai', name: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Footer */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1 xl:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="text-4xl lg:text-5xl font-black mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Fashion</span>
              <span className="block text-2xl lg:text-3xl text-gray-300">AI Studio</span>
            </motion.div>
            <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
              Revolutionizing personal styling with AI. Skin analysis, body type matching, and occasion-perfect recommendations.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4 mb-8">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.2, y: -4, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="group w-14 h-14 rounded-2xl bg-gray-800/50 backdrop-blur-md flex items-center justify-center hover:bg-gradient-to-r hover:from-primary hover:to-secondary border border-gray-700/50 hover:border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <social.icon className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
                </motion.a>
              ))}
            </div>
            {/* App Store Badges */}
            
          </div>

          {/* Company Links */}
          <div className="lg:col-span-1">
            <h4 className="text-xl font-bold mb-6 uppercase tracking-wide text-white">Company</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link, index) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    className="group text-gray-300 hover:text-primary font-medium block py-2 transition-all duration-300 hover:translate-x-2"
                  >
                    {link.name}
                    <motion.span 
                      className="inline-block w-2 h-2 ml-2 bg-primary rounded-full opacity-0 group-hover:opacity-100"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div className="lg:col-span-1">
            <h4 className="text-xl font-bold mb-6 uppercase tracking-wide text-white">Services</h4>
            <ul className="space-y-4">
              {footerLinks.services.map((link, index) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    className="group text-gray-300 hover:text-secondary font-medium block py-2 transition-all duration-300 hover:translate-x-2"
                  >
                    {link.name}
                    <motion.span 
                      className="inline-block w-2 h-2 ml-2 bg-secondary rounded-full opacity-0 group-hover:opacity-100"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:col-span-1">
            <h4 className="text-xl font-bold mb-6 uppercase tracking-wide text-white">Support</h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link, index) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    className="group text-gray-300 hover:text-accent font-medium block py-2 transition-all duration-300 hover:translate-x-2"
                  >
                    {link.name}
                    <motion.span 
                      className="inline-block w-2 h-2 ml-2 bg-accent rounded-full opacity-0 group-hover:opacity-100"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-16 pt-12 border-t border-white/10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h3 className="text-2xl lg:text-3xl font-black mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Stay Updated with Fashion Trends
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
              Get weekly style tips, exclusive offers, and AI fashion insights delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
                required
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 whitespace-nowrap"
              >
                Subscribe Now
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="relative mt-16 pt-12 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-primary/50 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mt-1 flex-shrink-0 shadow-lg">
              <FiMail className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-1">Email Support</p>
              <a href="mailto:support@fashionai.com" className="text-lg font-bold hover:text-primary transition-colors break-all">support@fashionai.com</a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 0 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-secondary/50 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center mt-1 flex-shrink-0 shadow-lg">
              <FiPhone className="w-7 h-7 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-1">24/7 Support</p>
              <a href="tel:+15551234567" className="text-lg font-bold hover:text-secondary transition-colors">+1 (555) 123-4567</a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="flex items-start space-x-4 p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-accent/50 transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mt-1 flex-shrink-0 shadow-lg">
              <FiMapPin className="w-7 h-7 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300 uppercase tracking-wide mb-1">Headquarters</p>
              <p className="text-lg font-bold text-white leading-tight">Bandra West<br/>Mumbai, Maharashtra 400050<br/>India</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 mt-16 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-gray-400 text-sm md:text-base font-medium"
            >
              © {currentYear} FashionAI. All rights reserved. | Powered by AI
            </motion.p>
            <div className="flex flex-wrap gap-6 justify-center lg:justify-end">
              <Link to="/privacy" className="group text-gray-400 hover:text-primary text-sm font-medium uppercase tracking-wide transition-all duration-300 hover:translate-y-[-2px]">
                Privacy Policy
                <motion.span className="inline-block w-full h-0.5 bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 mt-1" />
              </Link>
              <Link to="/terms" className="group text-gray-400 hover:text-secondary text-sm font-medium uppercase tracking-wide transition-all duration-300 hover:translate-y-[-2px]">
                Terms of Service
                <motion.span className="inline-block w-full h-0.5 bg-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 mt-1" />
              </Link>
              <Link to="/cookies" className="group text-gray-400 hover:text-accent text-sm font-medium uppercase tracking-wide transition-all duration-300 hover:translate-y-[-2px]">
                Cookie Policy
                <motion.span className="inline-block w-full h-0.5 bg-accent origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 mt-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-2xl hover:shadow-3xl border-4 border-white/20 hover:border-white/40 flex items-center justify-center z-50 transition-all duration-300 hover:scale-110 active:scale-95"
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        viewport={{ once: false }}
      >
        <FiArrowUp className="w-6 h-6" />
      </motion.button>
    </footer>
  );
};

export default Footer;

