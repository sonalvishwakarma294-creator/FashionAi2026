import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiMinimize2, FiGlobe } from 'react-icons/fi';
import { BsRobot } from 'react-icons/bs';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/api';

const Chatbot = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        type: 'bot',
        text: "Hello! I am your AI Fashion Stylist and Personal Shopping Assistant. I'm here to help you look your best! 👗👔",
      },
      {
        id: 2,
        type: 'bot',
        text: "How can I help you today? You can ask me about:\n• Outfit ideas for any occasion\n• Color matching suggestions\n• Wardrobe planning\n• Current fashion trends",
      }
    ];
  });
  const messagesEndRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const clearChat = () => {
    const initialMessages = [
      {
        id: 1,
        type: 'bot',
        text: "Hello! I am your AI Fashion Stylist. Chat cleared! How can I help now? 👗",
      }
    ];
    setMessages(initialMessages);
    localStorage.removeItem('chat_messages');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || typing) return;

    const userMessage = { id: Date.now(), type: 'user', text: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    const tempInput = inputMessage;
    setInputMessage('');
    setTyping(true);

    try {
      const response = await chatService.sendMessage(
        tempInput,
        user?.gender || 'female',
        messages.slice(-5)
      );
      const botMsg = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: response.data.reply 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      const errorMsg = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: `Error: ${error.message}. Is the backend running? 😅` 
      };
      setMessages(prev => [...prev, errorMsg]);
    }
    setTyping(false);
  };

  const handleQuickAsk = async (text, fallbackReply) => {
    const quick = { id: Date.now(), type: 'user', text };
    setMessages(m => [...m, quick]);
    setTyping(true);
    try {
      const response = await chatService.sendMessage(text, user?.gender || 'female', []);
      setMessages(m => [...m, { id: Date.now()+1, type: 'bot', text: response.data.reply }]);
    } catch {
      setMessages(m => [...m, { id: Date.now()+1, type: 'bot', text: fallbackReply }]);
    }
    setTyping(false);
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-2xl border-4 border-white/20 rounded-full flex items-center justify-center text-white"
      >
        <FiMessageCircle className="w-7 h-7" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-96 h-[500px] sm:h-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 20 }} className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BsRobot className="w-6 h-6 text-white drop-shadow-lg" />
                </motion.div>
                <div>
                  <h3 className="text-white font-bold text-base drop-shadow-md">AI Stylist</h3>
                  <span className="text-white/90 text-xs font-medium">Online 24/7</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                  <FiGlobe className={`w-5 h-5 text-white ${language === 'hi' ? 'rotate-12' : ''}`} title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'} />
                </button>
                <button onClick={clearChat} className="p-2 hover:bg-white/20 rounded-xl transition-all" title="Clear Chat">
                  <span className="text-white text-xs font-bold">CLR</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                  <FiX className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/50 to-transparent dark:from-gray-900/50">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/80 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-700 shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-2 ml-1">Quick Suggestions</div>
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                <button onClick={() => handleQuickAsk('Office outfit idea', 'Office: Navy blazer + white shirt perfect!')} 
                  className="whitespace-nowrap px-3 py-2 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-100 transition-all">
                  💼 Office Look
                </button>
                <button onClick={() => handleQuickAsk('Summer colors', 'Summer: Peach, Mint Green, Pastel Yellow!')} 
                  className="whitespace-nowrap px-3 py-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl border border-orange-100 transition-all">
                  ☀️ Summer Colors
                </button>
                <button onClick={() => handleQuickAsk('Party wear suggestions', 'Party: LBD or Shimmer Dress!')} 
                  className="whitespace-nowrap px-3 py-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-100 transition-all">
                  🎉 Party Wear
                </button>
                <button onClick={() => handleQuickAsk('Casual daily wear', 'Casual: Jeans + White Tee + Sneakers!')} 
                  className="whitespace-nowrap px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-100 transition-all">
                  👖 Casual
                </button>
              </div>
              
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none bg-white dark:bg-gray-800 transition-all text-sm placeholder-gray-400"
                  autoComplete="off"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!inputMessage.trim() || typing}
                  className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;

