import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiInstagram, FiTwitter, FiFacebook, FiLinkedin, 
  FiMail, FiMapPin, FiPhone, FiArrowUp, FiCheckCircle, FiSend, FiZap,
  FiArrowUpRight, FiCopy, FiCheck, FiShield, FiExternalLink, FiStar, FiLayers, FiCpu
} from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState(['AI Trends', 'Color Harmonies']);

  const topics = ['AI Trends', 'Color Harmonies', 'Weekly Drops', 'VIP Styling'];

  const toggleTopic = (topic) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setSubscribed(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }, 500);
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Careers', path: '/careers', badge: 'Hiring' },
      { name: 'Press', path: '/press' },
      { name: 'Blog', path: '/blog' },
    ],
    services: [
      { name: 'Skin Analysis', path: '/skintone', badge: 'AI' },
      { name: 'Body Type', path: '/bodytype', badge: 'Match' },
      { name: 'Occasion', path: '/occasion' },
      { name: 'Recommendations', path: '/recommendations', badge: 'Popular' },
      { name: 'Gallery', path: '/gallery' },
      { name: 'Digital Closet', path: '/closet', badge: 'New' },
    ],
    support: [
      { name: 'Help Center', path: '/help' },
      { name: 'Contact Us', path: '/contact' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Terms of Service', path: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: FiInstagram, href: 'https://instagram.com/fashionai', name: 'Instagram', color: 'hover:text-pink-400 hover:border-pink-500/40 hover:bg-pink-500/10' },
    { icon: FiTwitter, href: 'https://twitter.com/fashionai', name: 'Twitter', color: 'hover:text-sky-400 hover:border-sky-500/40 hover:bg-sky-500/10' },
    { icon: FiFacebook, href: 'https://facebook.com/fashionai', name: 'Facebook', color: 'hover:text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10' },
    { icon: FiLinkedin, href: 'https://linkedin.com/company/fashionai', name: 'LinkedIn', color: 'hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/10' },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-950 via-[#070913] to-black text-white relative overflow-hidden border-t border-white/10 select-none">
      
      {/* Dynamic Ambient Background Aura & Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-10 w-[30rem] h-[30rem] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 -left-20 w-[30rem] h-[30rem] bg-secondary/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-[140px]" />
        {/* Subtle grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        
        {/* Top Feature Banner */}
        <div className="mb-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-white/15 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/20 rounded-full blur-2xl" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-lg shadow-primary/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
                  <FiZap className="w-7 h-7 text-primary animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    Unlock Your Perfect Aesthetic Today
                  </h3>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                    Free AI Trial
                  </span>
                </div>
                <p className="text-gray-300 text-xs sm:text-sm mt-0.5">
                  Over 100,000+ custom wardrobe recommendations generated with neural precision.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to="/recommendations"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 text-center"
              >
                <span>Get Instant Style</span>
                <FiArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                to="/skintone"
                className="hidden md:inline-flex px-5 py-3 bg-white/5 hover:bg-white/15 text-gray-200 border border-white/15 font-bold text-xs uppercase tracking-widest rounded-xl transition-all items-center gap-2"
              >
                <span>Skin Analysis</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main 4-Column Navigation & Brand Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-16 border-b border-white/10">
          
          {/* Brand Column (5 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-4"
              >
                <Link to="/" className="inline-block group">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                      Fashion
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-white group-hover:text-gray-200 transition-colors tracking-tight">
                      AI Studio
                    </span>
                  </div>
                </Link>
              </motion.div>

              <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-sm font-medium">
                Revolutionizing personal styling with AI. Skin analysis, body type matching, and occasion-perfect recommendations.
              </p>

              {/* Neural Badges List */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary-light px-3 py-1 rounded-full text-[11px] font-semibold">
                  <FiCpu className="w-3 h-3 text-primary animate-pulse" />
                  Neural Engine v2.4
                </span>
                <span className="inline-flex items-center gap-1.5 bg-secondary/10 border border-secondary/30 text-secondary-light px-3 py-1 rounded-full text-[11px] font-semibold">
                  <FiLayers className="w-3 h-3 text-secondary" />
                  Smart Closet Sync
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold mb-3 flex items-center gap-2">
                <span>Connect With Us</span>
                <span className="w-8 h-px bg-white/20" />
              </p>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-11 h-11 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-md transition-all duration-300 ${social.color}`}
                  >
                    <social.icon className="w-5 h-5 text-gray-300 transition-colors" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          {/* Company Links (2 cols on lg) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <span>Company</span>
              <span className="w-4 h-px bg-primary/40" />
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 hover:translate-x-1.5 inline-flex items-center gap-2 py-1 group"
                  >
                    <span className="group-hover:text-primary transition-colors">{link.name}</span>
                    {link.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-primary/20 text-primary border border-primary/30">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links (3 cols on lg) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-secondary flex items-center gap-2">
              <span>Services</span>
              <span className="w-4 h-px bg-secondary/40" />
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 hover:translate-x-1.5 inline-flex items-center justify-between w-full max-w-[200px] py-0.5 group"
                  >
                    <span className="group-hover:text-secondary transition-colors">{link.name}</span>
                    {link.badge && (
                      <span className={`px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded ${
                        link.badge === 'New' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : link.badge === 'AI' 
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-secondary/20 text-secondary border border-secondary/30'
                      }`}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links (3 cols on lg) */}
          <div className="lg:col-span-3">
            <h4 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-accent flex items-center gap-2">
              <span>Support</span>
              <span className="w-4 h-px bg-accent/40" />
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 hover:translate-x-1.5 inline-block py-1 group"
                  >
                    <span className="group-hover:text-accent transition-colors">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Newsletter Section */}
        <div className="py-16 border-b border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-secondary/20 border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold text-accent mb-4">
              <FiStar className="w-3.5 h-3.5 text-accent" />
              <span>Weekly AI Fashion Dispatch</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-black mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Stay Updated with Fashion Trends
            </h3>
            <p className="text-gray-300 text-sm sm:text-base mb-6 max-w-xl mx-auto font-medium leading-relaxed">
              Get weekly style tips, exclusive offers, and AI fashion insights delivered to your inbox.
            </p>

            {/* Newsletter Topic Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {topics.map((topic) => {
                const active = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      active 
                        ? 'bg-primary/20 text-white border-primary/60 shadow-sm' 
                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/25 hover:text-gray-200'
                    }`}
                  >
                    {topic} {active ? '✓' : '+'}
                  </button>
                );
              })}
            </div>

            {/* Newsletter Input Form */}
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all font-medium"
                  required
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-7 py-3.5 bg-gradient-to-r from-primary via-secondary to-accent text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-primary/30 transition-all whitespace-nowrap flex items-center justify-center gap-2"
              >
                <span>Subscribe Now</span>
                <FiSend className="w-3.5 h-3.5" />
              </motion.button>
            </form>

            <p className="text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1.5">
              <FiShield className="w-3 h-3 text-emerald-400" />
              <span>We value your privacy. No spam, ever. Unsubscribe at any time with 1-click.</span>
            </p>

            <AnimatePresence>
              {subscribed && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mt-5 inline-flex items-center gap-2.5 text-emerald-300 text-xs font-bold bg-emerald-950/80 px-5 py-2.5 rounded-2xl border border-emerald-500/40 shadow-lg"
                >
                  <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Welcome to the VIP Style Club! Check your inbox for your welcome package.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Contact Info Cards (Enhanced 3-Column Glassmorphic Hub) */}
        <div className="py-16 border-b border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Email Support Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col justify-between p-6 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md rounded-3xl border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-xl group"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center shrink-0 transition-colors shadow-inner border border-primary/30">
                  <FiMail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Email Support</p>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      &lt; 2h SLA
                    </span>
                  </div>
                  <a 
                    href="mailto:support@fashionai.com" 
                    className="text-base font-bold text-white hover:text-primary transition-colors block mt-1 truncate"
                  >
                    support@fashionai.com
                  </a>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Direct concierge assistance for style queries & account help.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => copyToClipboard('support@fashionai.com')}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  {copiedEmail ? <FiCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FiCopy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
                </button>
                <a
                  href="mailto:support@fashionai.com"
                  className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Send Message</span>
                  <FiArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>

            {/* 24/7 Support Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col justify-between p-6 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md rounded-3xl border border-white/10 hover:border-secondary/50 transition-all duration-300 shadow-xl group"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 group-hover:bg-secondary/30 flex items-center justify-center shrink-0 transition-colors shadow-inner border border-secondary/30">
                  <FiPhone className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">24/7 Support</p>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Now
                    </span>
                  </div>
                  <a 
                    href="tel:+15551234567" 
                    className="text-base font-bold text-white hover:text-secondary transition-colors block mt-1"
                  >
                    +1 (555) 123-4567
                  </a>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Toll-free styling hotline & instantaneous emergency fashion triage.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-400">Available globally</span>
                <a
                  href="tel:+15551234567"
                  className="text-xs text-secondary font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Call Now</span>
                  <FiArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>

            {/* Headquarters Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col justify-between p-6 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md rounded-3xl border border-white/10 hover:border-accent/50 transition-all duration-300 shadow-xl group"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center shrink-0 transition-colors shadow-inner border border-accent/30">
                  <FiMapPin className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Headquarters</p>
                    <span className="text-[10px] font-bold text-accent bg-accent/20 px-2 py-0.5 rounded-md border border-accent/30">
                      India Hub
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1 leading-snug">
                    Bandra West<br/>
                    Mumbai, Maharashtra 400050<br/>
                    India
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-gray-400">Fashion District</span>
                <a
                  href="https://maps.google.com/?q=Bandra+West+Mumbai+Maharashtra+400050+India"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>View on Maps</span>
                  <FiExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>

          </div>
        </div>

        {/* AI Operational Status & Telemetry Bar */}
        <div className="py-6 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-gray-300 font-semibold">AI Neural Engines:</span>
            <span className="text-emerald-400 font-bold">100% Operational</span>
            <span className="text-gray-500">•</span>
            <span>Avg Latency: <strong className="text-white font-mono">38ms</strong></span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-[10.5px] sm:text-[11px]">
            <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10">BOM-01 Node</span>
            <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10">256-Bit SSL Encrypted</span>
            <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/10">ISO 27001 Certified</span>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Legal & Back to Top */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-400">
          <p className="text-center md:text-left">
            © {currentYear} <strong className="text-white font-bold">FashionAI Studio</strong>. All rights reserved. Revolutionizing fashion logic with artificial intelligence.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center text-[11px] sm:text-xs">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookies" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 hover:text-white transition-colors text-primary font-semibold"
            >
              <span>Back to top</span>
              <FiArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Floating Back to Top FAB Button */}
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-2xl border border-white/20 flex items-center justify-center z-40 transition-all hover:scale-110 active:scale-95 group"
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Scroll to top"
      >
        <FiArrowUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-0.5 transition-transform" />
      </motion.button>
    </footer>
  );
};

export default Footer;
