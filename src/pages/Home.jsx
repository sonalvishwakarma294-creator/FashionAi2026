import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { 
  FiArrowRight, FiUpload, FiCalendar, FiUser, FiStar, FiHeart, 
  FiTrendingUp, FiZap, FiImage, FiDroplet, FiAperture, FiHome, FiActivity,
  FiLayers, FiCheckCircle, FiShield, FiAward, FiCamera, FiCoffee, FiFeather, FiGlobe, FiThumbsUp, FiChevronRight, FiMapPin
} from 'react-icons/fi';
import { BsLightningChargeFill, BsStars } from 'react-icons/bs';
import WeatherRecommendation from '../components/WeatherRecommendation';

const AnimatedCounter = ({ target, duration = 1.6, suffix = '' }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const numeric = parseInt(String(target).replace(/\D/g, ''), 10) || 0;
    let start = 0;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(start + (numeric - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  const raw = String(target);
  const trailing = raw.replace(/^\d+/, '');
  return (
    <span ref={ref}>
      {count}
      {trailing || suffix}
    </span>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const mainFeatures = [
    {
      id: 'recs',
      title: 'AI Recommendations',
      icon: FiZap,
      path: '/recommendations',
      color: 'from-indigo-600 via-purple-600 to-pink-600',
      tag: 'Core Intelligence',
      badge: '99.4% Accuracy',
      size: 'lg',
      desc: 'Neural style matrix analyzing biological undertones, silhouette, and occasion.'
    },
    {
      id: 'closet',
      title: 'Digital Closet',
      icon: FiLayers,
      path: '/closet',
      color: 'from-violet-600 to-indigo-800',
      tag: 'Wardrobe Sync',
      badge: 'Smart Organizer',
      size: 'md',
      desc: 'Upload wardrobe pieces, auto-generate daily combinations.'
    },
    {
      id: 'gallery',
      title: 'Style Gallery',
      icon: FiImage,
      path: '/gallery',
      color: 'from-cyan-500 via-blue-600 to-indigo-600',
      tag: 'Lookbook',
      badge: '10,000+ Looks',
      size: 'md',
      desc: 'Curated high-fashion looks with instant like & save.'
    },
    {
      id: 'skintone',
      title: 'Skin Tone Lab',
      icon: FiDroplet,
      path: '/skin-tone',
      color: 'from-rose-500 to-orange-500',
      tag: 'Melanin Science',
      badge: 'Undertone AI',
      size: 'sm',
      desc: 'Precision undertone & melanin spectrum mapping.'
    },
    {
      id: 'color',
      title: 'Color Harmony',
      icon: FiAperture,
      path: '/color-match',
      color: 'from-emerald-500 to-teal-600',
      tag: 'Color Matrix',
      badge: 'Seasonal Palette',
      size: 'sm',
      desc: 'Contrast pairing & seasonal color balance.'
    },
    {
      id: 'bodytype',
      title: 'Body Geometry',
      icon: FiActivity,
      path: '/body-type',
      color: 'from-fuchsia-600 to-pink-600',
      tag: 'Proportions',
      badge: 'Fit Analysis',
      size: 'sm',
      desc: '3D silhouette optimization & tailoring rules.'
    },
    {
      id: 'occasion',
      title: 'Occasion Engine',
      icon: FiCalendar,
      path: '/occasion',
      color: 'from-blue-600 to-indigo-700',
      tag: 'Event Styling',
      badge: 'Context Aware',
      size: 'sm',
      desc: 'Boardroom, gala, resort & streetwear aesthetics.'
    },
    {
      id: 'dashboard',
      title: 'Style Analytics',
      icon: FiTrendingUp,
      path: '/dashboard',
      color: 'from-slate-700 to-gray-900',
      tag: 'Telemetry',
      badge: 'User Metrics',
      size: 'sm',
      desc: 'Saved looks, wardrobe value & style evolution.'
    }
  ];

  const trendingOutfits = [
    { id: 1, name: 'Summer Floral Dress', image: '/images/summer_dress.jpg', likes: 234, category: 'Casual', rating: 4.8, badge: 'Bestseller' },
    { id: 2, name: 'Classic Denim Jacket', image: '/images/classic_denim.jpg', likes: 189, category: 'Streetwear', rating: 4.6, badge: 'Trending' },
    { id: 3, name: 'Elegant Evening Gown', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400', likes: 312, category: 'Party', rating: 4.9, badge: 'Editor Pick' },
    { id: 4, name: 'Casual Streetwear', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', likes: 156, category: 'Everyday', rating: 4.5, badge: 'New' },
  ];

  const stats = [
    { number: '50K+', label: 'Active Users', icon: FiUser, color: 'from-sky-500 to-blue-600' },
    { number: '10K+', label: 'Outfit Recommendations', icon: FiLayers, color: 'from-violet-500 to-purple-600' },
    { number: '95%', label: 'Satisfaction Rate', icon: FiThumbsUp, color: 'from-emerald-500 to-teal-600' },
    { number: '500+', label: 'Fashion Categories', icon: FiGlobe, color: 'from-amber-500 to-orange-600' },
  ];

  const heroPills = [
    { icon: FiCamera, label: 'Skin Tone AI', text: 'Lab-grade undertone mapping' },
    { icon: FiStar, label: 'Weather Sync', text: 'Live outfit intelligence' },
    { icon: FiShield, label: 'Private & Secure', text: 'Your selfies never leave device' },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Upload or Scan',
      desc: 'Snap a quick selfie or upload a clear photo. Our AI extracts your undertone, body geometry & contrast levels in under 3 seconds.',
      icon: FiCamera,
      color: 'from-rose-500 via-pink-500 to-orange-500'
    },
    {
      step: '02',
      title: 'Neural Styling',
      desc: 'We cross-reference your profile against 10,000+ curated looks, seasonal color theory, and live local weather data.',
      icon: FiZap,
      color: 'from-indigo-500 via-violet-500 to-purple-600'
    },
    {
      step: '03',
      title: 'Lookbook Delivered',
      desc: 'Receive a personalized daily outfit queue — with matching accessories, jewelry, fabrics, and even laundry-care tips.',
      icon: FiAward,
      color: 'from-emerald-500 via-teal-500 to-cyan-600'
    }
  ];

  const testimonials = [
    { name: 'Ananya S.', role: 'Mumbai', quote: 'Finally an app that actually understands Indian skin tones. My wardrobe feels elevated overnight.' },
    { name: 'Rohan M.', role: 'Delhi', quote: 'The weather-aware suggestions save me 15 minutes every morning. Zero brainer styling.' },
    { name: 'Priya K.', role: 'Bengaluru', quote: 'Jewelry + metals pairing is scarily accurate. I wear gold now and people notice!' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Full-Bleed Background Image covering the ENTIRE Hero Section */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <img
            src="/images/img.jpg"
            alt="Hero Background"
            className="w-full h-full object-cover object-[center_18%] sm:object-[center_20%] filter brightness-105 contrast-105"
          />
          {/* Subtle gradient overlays: darkens behind text on left, stays clear in center & right */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950/85 via-gray-950/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/40 via-transparent to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 w-full">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Original Clean Starting Layout */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/10 shadow-sm">
                <BsLightningChargeFill className="text-accent" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">AI Fashion Studio</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[0.95] mb-6 uppercase tracking-tighter drop-shadow-md">
                Redefine Your<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                  Style Logic
                </span>
              </h1>

              <p className="text-base text-gray-200 mb-8 max-w-md font-medium leading-relaxed mx-auto lg:mx-0 drop-shadow-sm">
                Our neural engines analyze your biology to curate the perfect wardrobe.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/recommendations"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent text-white font-bold text-xs uppercase tracking-widest hover:opacity-95 shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
                >
                  <span>Get My Style DNA</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/gallery"
                  className="px-6 py-3 rounded-xl bg-black/40 hover:bg-black/60 text-white font-bold text-xs uppercase tracking-widest backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
                >
                  <FiImage className="w-4 h-4" />
                  <span>Browse Gallery</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Compact Weather Card so image is fully visible */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
              <div className="w-full max-w-[360px]">
                <WeatherRecommendation compact={true} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Core Engines Bento Grid */}
      <section className="py-14 sm:py-24 bg-background dark:bg-darkBackground relative overflow-hidden">
        {/* Background Ambient Aura */}
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 gap-4 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/20 text-primary px-3.5 py-1.5 rounded-full mb-3 border border-primary/20">
                <FiZap className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Neural Fashion Architecture
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-text dark:text-darkText">
                Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Core Engines</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium max-w-md">
              9 hyper-specialized AI modules engineered to decode color theory, body geometry, smart closets, and tailored daily aesthetics.
            </p>
          </div>

          {/* Dynamic Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 auto-rows-auto sm:auto-rows-[200px]">
            {mainFeatures.map((f) => (
              <motion.div
                key={f.id}
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ duration: 0.25 }}
                className={`relative group rounded-3xl sm:rounded-[2.2rem] overflow-hidden p-5 sm:p-7 flex flex-col justify-between min-h-[190px] sm:min-h-0 transition-all duration-300 shadow-xl cursor-pointer border border-white/20 dark:border-white/10 hover:shadow-2xl hover:border-white/40
                  ${f.size === 'lg' ? 'sm:col-span-2 sm:row-span-2' : ''}
                  ${f.size === 'md' ? 'sm:col-span-2' : ''}
                  bg-gradient-to-br ${f.color}
                `}
                onClick={() => navigate(f.path)}
              >
                {/* Top Bar: Icon + Badges */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 shadow-inner">
                      <f.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-[0.12em] bg-black/40 backdrop-blur-md px-2.5 py-0.5 sm:py-1 rounded-full text-white border border-white/20 shadow-inner">
                        {f.tag}
                      </span>
                      {f.badge && (
                        <span className="text-[9px] sm:text-[9.5px] font-bold text-white/90 uppercase tracking-[0.12em] hidden sm:inline-block">
                          ✦ {f.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className={`font-black uppercase tracking-tight text-white drop-shadow-sm ${f.size === 'lg' ? 'text-2xl sm:text-4xl mt-1 sm:mt-2' : f.size === 'md' ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
                    {f.title}
                  </h3>
                </div>
                
                {/* Bottom Bar: Description + Animated Arrow */}
                <div className="relative z-10 flex justify-between items-end pt-3 sm:pt-4 border-t border-white/15 mt-3 sm:mt-0">
                  <p className={`font-medium text-white/85 leading-snug ${f.size === 'lg' ? 'text-xs sm:text-sm max-w-sm' : 'text-[11px] sm:text-xs max-w-[200px]'}`}>
                    {f.desc}
                  </p>
                  
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-gray-900 group-hover:scale-110 transition-all duration-300 shadow-md shrink-0 ml-2">
                    <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Decorative Glowing Elements */}
                <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-white/15 rounded-full blur-2xl group-hover:bg-white/25 transition-all duration-500" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — 3 Step Flow */}
      <section className="py-14 sm:py-24 bg-background dark:bg-darkBackground relative overflow-hidden">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[80%] h-0.5 bg-gradient-to-r from-transparent via-primary/15 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/20 text-primary px-3.5 py-1.5 rounded-full mb-3 sm:mb-4 border border-primary/20">
              <FiActivity className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">3-Step Style Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-text dark:text-darkText mb-3 sm:mb-4">
              Your Style <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">In 30 Seconds</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto">
              No confusing quizzes. Just snap, analyze, wear. Our AI does the heavy lifting while you look effortlessly put-together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.12, duration: 0.55 }}
                className="relative group"
              >
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:flex absolute top-14 left-[calc(100%-0px)] w-full h-0.5 items-center z-0 pointer-events-none">
                    <div className="w-full h-0.5 bg-gradient-to-r from-primary/30 via-secondary/30 to-transparent" />
                    <FiArrowRight className="w-4 h-4 text-primary/40 -ml-1 shrink-0" />
                  </div>
                )}
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 border border-gray-100 dark:border-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                  <div className={`absolute -top-14 -right-14 w-40 h-40 bg-gradient-to-br ${step.color} opacity-[0.09] rounded-full blur-2xl group-hover:opacity-[0.16] transition-opacity duration-500`} />
                  <div className="flex items-center justify-between mb-4 sm:mb-5 relative z-10">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <step.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <span className={`text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br ${step.color} opacity-80 tracking-tighter`}>
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight mb-1.5 sm:mb-2 text-text dark:text-darkText relative z-10">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed relative z-10">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Stats with Icons + Glow */}
      <section className="relative py-12 sm:py-20 overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,107,0.14),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.13),transparent_55%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative text-center p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 hover:bg-white/8 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`w-9 h-9 sm:w-11 sm:h-11 mx-auto mb-2 sm:mb-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="text-xl sm:text-3xl font-black mb-0.5 sm:mb-1 tracking-tight text-white">
                  <AnimatedCounter target={s.number} />
                </div>
                <div className="text-[9px] sm:text-[11.5px] font-black uppercase tracking-wider sm:tracking-[0.16em] text-white/70 group-hover:text-white/95 transition-colors leading-tight">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Strip */}
      <section className="py-14 sm:py-20 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute top-0 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3 sm:gap-5">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/20 text-primary px-3.5 py-1.5 rounded-full mb-3 border border-primary/20">
                <FiHeart className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Loved Across India</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-text dark:text-darkText">
                What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Stylers</span> Say
              </h2>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <FiStar key={s} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
              ))}
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-1.5 sm:ml-2">4.9 / 5 from 12,400+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group relative bg-white dark:bg-gray-800/60 rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute -top-6 -right-6 w-28 h-28 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-0.5 mb-3 sm:mb-4">
                  {[1,2,3,4,5].map(s => (
                    <FiStar key={s} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium leading-relaxed mb-4 sm:mb-5 relative z-10">
                  “{t.quote}”
                </p>
                <div className="flex items-center gap-3 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700/70">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-text dark:text-darkText leading-tight">{t.name}</div>
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <FiMapPin className="w-2.5 h-2.5" /> {t.role}
                    </div>
                  </div>
                  <FiCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 ml-auto shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Outfits — Enhanced Cards */}
      <section className="py-14 sm:py-24 bg-background dark:bg-darkBackground relative overflow-hidden">
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-end mb-8 sm:mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-primary/20 text-primary px-3.5 py-1.5 rounded-full mb-3 border border-primary/20">
                <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Curated Weekly</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter text-text dark:text-darkText">
                Trending <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Looks</span>
              </h2>
            </div>
            <Link to="/gallery" className="group inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 hover:bg-primary hover:text-white text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest transition-all border border-primary/20 hover:border-primary shrink-0">
              View All
              <FiArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {trendingOutfits.map((outfit, i) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <Link to="/gallery" className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl sm:rounded-[2rem] overflow-hidden mb-2.5 sm:mb-3.5 shadow-xl bg-white dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-800 group-hover:shadow-2xl transition-all duration-500">
                    <img
                      src={outfit.image}
                      alt={outfit.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[900ms] ease-out"
                    />

                    {/* Top Badge */}
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md text-white border border-white/20 ${
                        outfit.badge === 'Editor Pick' ? 'bg-gradient-to-r from-violet-500 to-purple-600' :
                        outfit.badge === 'Bestseller' ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                        outfit.badge === 'Trending' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
                        'bg-gradient-to-r from-sky-500 to-blue-600'
                      }`}>
                        {outfit.badge}
                      </span>
                    </div>

                    {/* Like + Rating */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-black/50 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-white shadow-lg border border-white/10">
                        <FiStar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-300 fill-yellow-300" />
                        {outfit.rating}
                      </div>
                      <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[9px] sm:text-[10px] font-bold text-rose-600 shadow-lg border border-rose-100 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-400 transition-colors">
                        <FiHeart className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {outfit.likes}
                      </div>
                    </div>

                    {/* Bottom Hover Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 bg-gradient-to-t from-black/90 via-black/65 to-transparent translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 mb-1 sm:mb-2 rounded-full bg-white/20 backdrop-blur-md text-white text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider border border-white/25">
                        {outfit.category}
                      </span>
                      <p className="text-[11px] sm:text-[12.5px] font-black uppercase tracking-wider text-white leading-tight mb-1 sm:mb-1.5 line-clamp-1">
                        {outfit.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] sm:text-[10px] font-bold text-white/85 uppercase tracking-wider">
                          View in Gallery
                        </span>
                        <FiArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;