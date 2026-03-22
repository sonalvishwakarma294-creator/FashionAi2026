import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, FiUpload, FiCalendar, FiUser, FiStar, FiHeart, 
  FiTrendingUp, FiZap, FiImage, FiWatch, FiDroplet, FiAperture, FiHome, FiActivity 
} from 'react-icons/fi';
import { BsLightningChargeFill } from 'react-icons/bs';
import WeatherRecommendation from '../components/WeatherRecommendation';

const Home = () => {
  const navigate = useNavigate();
  const mainFeatures = [
    {
      id: 'recs',
      title: 'AI Recommendations',
      icon: FiZap,
      path: '/recommendations',
      color: 'from-indigo-500 to-purple-600',
      size: 'lg',
      desc: 'Personalized style logic based on your unique profile.'
    },
    {
      id: 'gallery',
      title: 'Style Gallery',
      icon: FiImage,
      path: '/gallery',
      color: 'from-cyan-500 to-blue-600',
      size: 'md',
      desc: 'Explore 10k+ curated looks.'
    },
    {
      id: 'skintone',
      title: 'Skin Tone',
      icon: FiDroplet,
      path: '/skin-tone',
      color: 'from-rose-400 to-orange-500',
      size: 'sm',
      desc: 'Color matching.'
    },
    {
      id: 'color',
      title: 'Color Harmony',
      icon: FiAperture,
      path: '/color-match',
      color: 'from-emerald-400 to-teal-600',
      size: 'sm',
      desc: 'Style balance.'
    },
    {
      id: 'accessories',
      title: 'Accessories',
      icon: FiWatch,
      path: '/accessory-match',
      color: 'from-amber-400 to-orange-600',
      size: 'sm',
      desc: 'Perfect pairs.'
    },
    {
      id: 'bodytype',
      title: 'Body Type',
      icon: FiActivity,
      path: '/body-type',
      color: 'from-fuchsia-500 to-pink-600',
      size: 'sm',
      desc: 'Fit analysis.'
    },
    {
      id: 'occasion',
      title: 'Occasion',
      icon: FiCalendar,
      path: '/occasion',
      color: 'from-blue-500 to-indigo-600',
      size: 'sm',
      desc: 'Event styling.'
    },
    {
      id: 'home',
      title: 'Home',
      icon: FiHome,
      path: '/',
      color: 'from-gray-700 to-gray-900',
      size: 'sm',
      desc: 'Main dashboard.'
    }
  ];

  const trendingOutfits = [
    { id: 1, name: 'Summer Floral Dress', image: '/images/summer_dress.jpg', likes: 234 },
    { id: 2, name: 'Classic Denim Jacket', image: '/images/classic_denim.jpg', likes: 189 },
    { id: 3, name: 'Elegant Evening Gown', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400', likes: 312 },
    { id: 4, name: 'Casual Streetwear', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', likes: 156 },
  ];

  const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '10K+', label: 'Outfit Recommendations' },
    { number: '95%', label: 'Satisfaction Rate' },
    { number: '500+', label: 'Fashion Categories' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-gray-900"
          style={{ backgroundImage: 'url(/images/img.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <BsLightningChargeFill className="text-accent" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">AI Fashion Studio</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-[0.9] mb-6 uppercase tracking-tighter">
                Redefine Your<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                  Style Logic
                </span>
              </h1>
              <p className="text-base text-gray-300 mb-8 max-w-md font-medium">
                Our neural engines analyze your biology to curate the perfect wardrobe.
              </p>
            </motion.div>
            <div className="hidden lg:block">
              <WeatherRecommendation />
            </div>
          </div>
        </div>
      </section>

      {/* The Better List (Bento Grid) */}
      <section className="py-20 bg-background dark:bg-darkBackground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">Style Navigation</h2>
            <p className="text-2xl font-black uppercase tracking-tighter">Explore Our Core Engines</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 auto-rows-[180px]">
            {mainFeatures.map((f) => (
              <motion.div
                key={f.id}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`relative group rounded-[2rem] overflow-hidden p-6 flex flex-col justify-between transition-all shadow-xl cursor-pointer
                  ${f.size === 'lg' ? 'md:col-span-2 md:row-span-2' : ''}
                  ${f.size === 'md' ? 'md:col-span-2' : ''}
                  bg-gradient-to-br ${f.color}
                `}
                onClick={() => navigate(f.path)}
              >
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={`font-black uppercase tracking-tighter text-white ${f.size === 'lg' ? 'text-3xl' : 'text-sm'}`}>
                    {f.title}
                  </h3>
                </div>
                
                <div className="relative z-10 flex justify-between items-end">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 max-w-[120px]">
                    {f.desc}
                  </p>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiArrowRight size={14} />
                  </div>
                </div>

                {/* Decorative element */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black mb-1">{s.number}</div>
                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Outfits */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Trending <span className="text-primary">Logic</span></h2>
            <Link to="/gallery" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">View All <FiArrowRight/></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingOutfits.map((outfit) => (
              <Link key={outfit.id} to="/gallery" className="group">
                <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-4 shadow-xl">
                  <img src={outfit.image} alt={outfit.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end">
                    <div className="text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1">{outfit.name}</p>
                      <div className="flex items-center gap-2 text-[8px] font-bold opacity-60"><FiHeart/> {outfit.likes}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;