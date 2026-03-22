import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiEye, FiHeart } from 'react-icons/fi';

const Blog = () => {
  const posts = [
    {
      title: 'How AI is Revolutionizing Personal Styling',
      excerpt: 'Discover how FashionAI uses advanced ML models to provide personalized outfit recommendations based on your unique style.',
      date: 'Dec 15, 2024',
      readTime: '8 min',
      views: 2456,
      likes: 234
    },
    {
      title: 'Skin Tone Analysis: The Science Behind Perfect Matches',
      excerpt: 'Learn about our proprietary computer vision technology that accurately detects 16+ skin tones for better recommendations.',
      date: 'Dec 10, 2024',
      readTime: '6 min',
      views: 1892,
      likes: 156
    },
    {
      title: 'Body Type Classification: Beyond Size Labels',
      excerpt: 'Our AI understands 12+ body types and provides styling advice that actually works for your shape.',
      date: 'Dec 5, 2024',
      readTime: '5 min',
      views: 1678,
      likes: 198
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto px-4 py-24"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-24"
        >
          <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">
            Fashion AI Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Insights, trends, and behind-the-scenes looks at how AI is transforming fashion.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article
              key={post.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 hover:border-primary/30"
            >
              <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-500"></div>
              <div className="p-8">
                <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                  <div className="flex items-center space-x-1">
                    <FiClock />
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiEye />
                    <span>{post.views.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FiHeart />
                    <span>{post.likes}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 group-hover:text-primary transition-colors line-clamp-2 h-14">
                  {post.title}
                </h3>
                <p className="text-gray-600 leading-relaxed line-clamp-3 h-20 mb-6">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{post.date}</span>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-primary font-bold text-sm uppercase tracking-wider hover:text-secondary transition-colors flex items-center space-x-1 group-hover:translate-x-1"
                  >
                    <span>Read More</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </motion.button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-24 p-12 bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30"
        >
          <h2 className="text-3xl lg:text-4xl font-black mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Stay Updated
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
            Get the latest AI fashion insights delivered to your inbox weekly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="your@email.com"
              className="flex-1 px-6 py-4 bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium"
            />
            <button className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-black uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
};

export default Blog;
