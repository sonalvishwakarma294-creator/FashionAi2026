import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiUpload, FiCalendar, FiUser, FiStar, FiHeart, FiEye, FiTrendingUp } from 'react-icons/fi';
import { BsLightningChargeFill } from 'react-icons/bs';
import WeatherRecommendation from '../components/WeatherRecommendation';

const Home = () => {
  const features = [
    {
      icon: FiUser,
      title: 'Body Type Analysis',
      description: 'Get personalized recommendations based on your unique body shape',
      color: 'bg-purple-500',
      path: '/body-type'
    },
    {
      icon: FiStar,
      title: 'Skin Tone Matching',
      description: 'Discover colors that complement your natural skin tone perfectly',
      color: 'bg-rose-500',
      path: '/skin-tone'
    },
    {
      icon: FiCalendar,
      title: 'Occasion Based',
      description: 'Find the perfect outfit for any event or special occasion',
      color: 'bg-orange-500',
      path: '/occasion'
    },
    {
      icon: FiUpload,
      title: 'Image Upload',
      description: 'Upload your favorite clothing and get similar style recommendations',
      color: 'bg-blue-500',
      path: '/image-upload'
    },
    {
      icon: FiTrendingUp,
      title: 'Color Harmony',
      description: 'Professional color matching using AI and color theory principles',
      color: 'bg-emerald-500',
      path: '/color-match'
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-gray-900"
          style={{
            backgroundImage: 'url(/images/img.jpg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/40 to-gray-900/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
              >
                <BsLightningChargeFill className="text-accent" />
                <span className="text-white text-sm font-medium">AI-Powered Fashion</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              >
                Find Your Perfect
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                  Outfit with AI
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg text-gray-300 mb-8 max-w-xl"
              >
                Discover outfits tailored to your body type, skin tone, and occasion 
                using artificial intelligence. Your personal fashion stylist is just a click away.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <Link
                  to="/recommendations"
                  className="inline-flex items-center justify-center space-x-2 bg-primary text-white px-8 py-4 rounded-full font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg hover:shadow-primary/30"
                >
                  <span>Get Recommendations</span>
                  <FiArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/gallery"
                  className="inline-flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all"
                >
                  <span>Explore Outfits</span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Content - Weather Recommendation */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <WeatherRecommendation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.number}</div>
                <div className="text-white/70 text-[10px] uppercase font-bold tracking-widest">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background dark:bg-darkBackground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Link to={feature.path} className="block h-full bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-transparent hover:border-primary/20">
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">{feature.description}</p>
                  <div className="flex items-center text-primary font-bold text-xs uppercase tracking-widest">
                    <span>Try Now</span>
                    <FiArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Outfits Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-between items-end mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trending <span className="text-secondary">Outfits</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Discover the most popular styles from our community
              </p>
            </div>
            <Link
              to="/gallery"
              className="hidden md:flex items-center space-x-2 text-primary font-medium hover:underline"
            >
              <span>View All</span>
              <FiArrowRight />
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingOutfits.map((outfit, index) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <Link to="/gallery">
                  <div className="relative overflow-hidden rounded-2xl mb-4">
                    <img
                      src={outfit.image}
                      alt={outfit.name}
                      className="w-full h-80 object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-semibold mb-1">{outfit.name}</h3>
                  <div className="flex items-center space-x-1 text-gray-500 text-sm">
                    <FiHeart />
                    <span>{outfit.likes} likes</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background dark:bg-darkBackground relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Find Your Perfect Style?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Join thousands of users who have discovered their ideal look with our AI-powered fashion assistant
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/recommendations"
                className="inline-flex items-center justify-center space-x-2 bg-primary text-white px-8 py-4 rounded-full font-semibold hover:bg-opacity-90 transition-all hover:shadow-lg hover:shadow-primary/30"
              >
                <span>Start Your Style Quiz</span>
                <FiArrowRight />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
