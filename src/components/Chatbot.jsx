import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiGlobe, FiTrash2, FiMaximize2, FiMinimize2, FiSmile, FiPlus, FiCpu, FiZap, FiImage } from 'react-icons/fi';

import { useAuth } from '../contexts/AuthContext';
import { chatService, accessoryService } from '../services/api';

import WeatherRecommendation from './WeatherRecommendation';

const Chatbot = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [userGender, setUserGender] = useState(user?.gender || null);
  const [stylePreference, setStylePreference] = useState(null);
  const [skinTone, setSkinTone] = useState(null);
  const [bodyType, setBodyType] = useState(null);
  const [preferredOccasion, setPreferredOccasion] = useState(null);
  const [weather, setWeather] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_messages');
    if (saved) return JSON.parse(saved);
    
    return [
      {
        id: 1,
        type: 'bot',
        text: "Namaste! I am **StyleSync Pro**, your Personal Fashion Advisor. ✨\n\nTo give you the best recommendations, tell me: Are you looking for **Male** or **Female** fashion?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGenderPrompt: true
      }
    ];
  });

  useEffect(() => {
    const savedGender = localStorage.getItem('userGender');
    const savedStyle = localStorage.getItem('stylePreference');
    const savedSkinTone = localStorage.getItem('skinTone');
    const savedBodyType = localStorage.getItem('bodyType');
    const savedOccasion = localStorage.getItem('preferredOccasion');
    const savedWeather = localStorage.getItem('weather');
    if (savedGender) setUserGender(savedGender);
    if (savedStyle) setStylePreference(savedStyle);
    if (savedSkinTone) setSkinTone(savedSkinTone);
    if (savedBodyType) setBodyType(savedBodyType);
    if (savedOccasion) setPreferredOccasion(savedOccasion);
    if (savedWeather) setWeather(savedWeather);
  }, []);

  useEffect(() => {
    const fetchWeatherGreeting = async () => {
      try {
        const saved = localStorage.getItem('chat_messages');
        if (saved) return;
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=bd5e378503939ddaee76f12ad7a97608&units=metric`);
              const data = await res.json();
              const temp = Math.round(data.main.temp);
              const condition = data.weather[0].main.toLowerCase();
              let weatherCondition = "pleasant";
              if (temp > 30) weatherCondition = "hot";
              else if (temp < 15) weatherCondition = "cold";
              else if (condition.includes('rain')) weatherCondition = "rainy";
              setWeather(weatherCondition);
              localStorage.setItem('weather', weatherCondition);
              let rec = temp > 30 ? "Aaj kaafi garmi hai! ☀️ **Lightweight Linen** best rahega." : temp < 15 ? "Thoda thanda mausam hai! ❄️ Ek stylish **Jacket** carry karein." : condition.includes('rain') ? "Baarish ho rahi hai! 🌧️ **Water-resistant** items choose karein." : "Mausam bohot suhana hai! 🌈";
              const weatherMsg = { id: 'weather-greet', type: 'bot', text: `📍 **Live Weather Update:** Currently **${temp}°C** with **${condition}**. \n\n${rec}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
              setMessages(prev => [...prev, weatherMsg]);
            } catch { }
          });
        }
      } catch (err) { }
    };
    if (isOpen) fetchWeatherGreeting();
  }, [isOpen]);

  useEffect(() => {
    if (!isMinimized && isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 0) localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages, isMinimized, isOpen]);

  const clearChat = () => {
    setMessages([{ id: Date.now(), type: 'bot', text: "Chat history cleared. How can I help you start fresh? ✨", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    localStorage.removeItem('chat_messages');
  };

  const handleStyleSelect = (style) => {
    setStylePreference(style);
    localStorage.setItem('stylePreference', style);
    const botMsg = { id: Date.now(), type: 'bot', text: `Awesome! **${style}** vibe is set. \n\nNow, what is your **Body Shape**?`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isBodyTypePrompt: true };
    setMessages(prev => [...prev, botMsg]);
  };

  const handleBodyTypeSelect = (type) => {
    setBodyType(type);
    localStorage.setItem('bodyType', type);
    const botMsg = { id: Date.now(), type: 'bot', text: `Perfect! **${type}** body type analysis active. \n\nAaj aap kya pehenna chahte hain?`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, botMsg]);
  };

  const handleGenderSelect = (gender) => {
    setUserGender(gender);
    localStorage.setItem('userGender', gender);
    const botMsg = { id: Date.now(), type: 'bot', text: `Got it! **${gender}** fashion logic activated. \n\nNow, tell me your **Style Vibe**!`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isStylePrompt: true };
    setMessages(prev => [...prev, botMsg]);
  };

  const handleSkinToneSelect = (tone) => {
    setSkinTone(tone);
    localStorage.setItem('skinTone', tone);
    const botMsg = { id: Date.now(), type: 'bot', text: `Perfect! **${tone}** skin tone noted.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, botMsg]);
  };

  const handleOccasionSelect = (occasion) => {
    setPreferredOccasion(occasion);
    localStorage.setItem('preferredOccasion', occasion);
    const userMsg = { id: Date.now(), type: 'user', text: `I need an outfit for a **${occasion}** occasion`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    processMessage(`Suggest an outfit for ${occasion}`, occasion);
  };

  const processMessage = async (text, overrideOccasion = null) => {
    setTyping(true);
    try {
      const response = await chatService.sendMessage(text, userGender || 'female', messages.slice(-5), language, stylePreference || 'Casual', skinTone, overrideOccasion || preferredOccasion, weather, bodyType);
      const botMsg = { id: Date.now() + 1, type: 'bot', text: response.data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: "Connection error. Please try again! 🌐", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }
    setTyping(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || typing) return;
    const lowerMsg = inputMessage.toLowerCase();
    const occasionWords = ['casual', 'party', 'wedding', 'office', 'college', 'date', 'festival', 'travel'];
    const detectedOcc = occasionWords.find(w => lowerMsg.includes(w));
    if (detectedOcc) {
      setPreferredOccasion(detectedOcc);
      localStorage.setItem('preferredOccasion', detectedOcc);
    }
    const userMessage = { id: Date.now(), type: 'user', text: inputMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMessage]);
    const tempInput = inputMessage;
    setInputMessage('');
    processMessage(tempInput, detectedOcc);
  };

  const resetPreferences = () => {
    localStorage.clear();
    setUserGender(null); setStylePreference(null); setSkinTone(null); setBodyType(null); setPreferredOccasion(null);
    setMessages([{ id: Date.now(), type: 'bot', text: "Preferences reset! Are you looking for **Male** or **Female** fashion?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isGenderPrompt: true }]);
  };

  const renderStructuredMessage = (text) => {
    if (text.includes('✨ Outfit Recommendation:') || text.includes('🎨 Best Colors:') || text.includes('🧵 Fabric') || text.includes('👜 Accessories:')) {
      const lines = text.split('\n');
      return (
        <div className="space-y-4 py-2">
          {lines.map((line, idx) => {
            if (line.includes('✨ Outfit Recommendation:')) return <div key={idx} className="flex items-center gap-2 text-primary font-black uppercase tracking-wider border-b border-primary/10 pb-1 mb-2"><span className="text-lg">✨</span><span>Outfit Recommendation</span></div>;
            if (line.includes('🎨 Best Colors:')) return <div key={idx} className="flex items-center gap-2 text-secondary font-black uppercase tracking-wider border-b border-secondary/10 pb-1 mt-4 mb-2"><span className="text-lg">🎨</span><span>Best Colors</span></div>;
            if (line.includes('🧵 Fabric')) return <div key={idx} className="flex items-center gap-2 text-amber-600 font-black uppercase tracking-wider border-b border-amber-600/10 pb-1 mt-4 mb-2"><span className="text-lg">🧵</span><span>Fabric Suggestion</span></div>;
            if (line.includes('👜 Accessories:')) return <div key={idx} className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-wider border-b border-emerald-500/10 pb-1 mt-4 mb-2"><span className="text-lg">👜</span><span>Accessories</span></div>;
            if (line.startsWith('- ')) {
              const [label, ...rest] = line.replace('- ', '').split(':');
              return (
                <div key={idx} className="flex gap-2 ml-2 mb-1 items-start">
                  {rest.length > 0 ? (
                    <><span className="text-primary font-bold min-w-[90px] text-[11px] uppercase">{label}:</span><span className="text-gray-700 dark:text-gray-300 font-medium text-sm"><ReactMarkdown inline={true}>{rest.join(':').trim()}</ReactMarkdown></span></>
                  ) : <span className="text-gray-700 dark:text-gray-300 font-medium text-sm"><ReactMarkdown inline={true}>{line.replace('- ', '').trim()}</ReactMarkdown></span>}
                </div>
              );
            }
            if (line.startsWith('###')) return <div key={idx} className="text-sm font-black text-gray-800 dark:text-gray-100 mb-2 uppercase tracking-tight mt-4">{line.replace('###', '').trim()}</div>;
            return line.trim() ? <div key={idx} className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed"><ReactMarkdown inline={true}>{line}</ReactMarkdown></div> : null;
          })}
        </div>
      );
    }
    return <ReactMarkdown>{text}</ReactMarkdown>;
  };

  const occasions = [
    { name: 'Casual', icon: '👟' }, { name: 'Party', icon: '🎉' }, { name: 'Wedding', icon: '💍' }, { name: 'Office', icon: '💼' },
    { name: 'College', icon: '🎓' }, { name: 'Date', icon: '❤️' }, { name: 'Festival', icon: '🪔' }, { name: 'Travel', icon: '✈️' }
  ];

  const bodyShapes = [
    { name: 'Rectangle', desc: 'Straight shoulders and hips' }, { name: 'Pear', desc: 'Hips wider than shoulders' },
    { name: 'Apple', desc: 'Broad shoulders and upper body' }, { name: 'Hourglass', desc: 'Balanced with narrow waist' },
    { name: 'Trapezoid', desc: 'Broad shoulders, narrow waist' }
  ];

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 45 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-black text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-2xl flex items-center justify-center overflow-hidden border border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent" />
            <FiCpu className="w-7 h-7 relative z-10" />
            <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 -right-1"><FiZap className="w-4 h-4 text-accent" /></motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1, height: isMinimized ? '72px' : '600px' }} exit={{ opacity: 0, y: 50, scale: 0.95 }} className={`fixed bottom-6 right-6 z-[9999] w-[calc(100vw-3rem)] sm:w-[400px] bg-white dark:bg-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-all duration-500 ease-in-out`}>
            <div className="bg-black text-white p-4 flex items-center justify-between shrink-0 h-[72px]">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center"><FiCpu className="w-6 h-6" /></div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest leading-none">Style AI</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Neural Link Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="p-2 hover:bg-white/10 rounded-xl transition-all"><FiGlobe className={`w-4 h-4 text-gray-400 hover:text-white ${language === 'hi' ? 'text-primary' : ''}`} /></button>
                <button onClick={resetPreferences} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"><FiCpu className="w-4 h-4" /></button>
                <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-red-400"><FiTrash2 className="w-4 h-4" /></button>
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400">{isMinimized ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}</button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"><FiX className="w-5 h-5" /></button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">
                  <div className="mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Select Occasion</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {occasions.map((occ) => (
                        <button key={occ.name} onClick={() => handleOccasionSelect(occ.name)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${preferredOccasion === occ.name ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-primary/50'}`}>
                          <span>{occ.icon}</span><span className="uppercase tracking-widest">{occ.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {messages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border ${msg.type === 'user' ? 'bg-primary text-white rounded-tr-none border-primary' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border-gray-100 dark:border-gray-700'}`}>
                          {msg.type === 'bot' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-700 prose-strong:text-primary dark:prose-strong:text-primary-light">
                              {renderStructuredMessage(msg.text)}
                              {msg.isStylePrompt && <div className="flex flex-wrap gap-2 mt-4">{['Minimalist', 'Ethnic', 'Streetwear', 'Formal', 'Bold'].map((style) => <button key={style} onClick={() => handleStyleSelect(style)} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-primary/20 text-primary dark:text-primary-light rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">{style}</button>)}</div>}
                              {msg.isBodyTypePrompt && <div className="grid grid-cols-1 gap-2 mt-4">{bodyShapes.map((shape) => <button key={shape.name} onClick={() => handleBodyTypeSelect(shape.name)} className="flex flex-col items-start px-4 py-2 bg-white dark:bg-gray-800 border border-primary/20 rounded-xl hover:bg-primary hover:text-white group transition-all"><span className="text-[10px] font-black uppercase tracking-widest">{shape.name}</span><span className="text-[8px] text-gray-400 group-hover:text-white/80">{shape.desc}</span></button>)}</div>}
                              {msg.isGenderPrompt && <div className="flex gap-2 mt-4"><button onClick={() => handleGenderSelect('male')} className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md">Male 👔</button><button onClick={() => handleGenderSelect('female')} className="px-4 py-2 bg-secondary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md">Female 👗</button></div>}
                              {msg.isSkinTonePrompt && <div className="flex flex-wrap gap-2 mt-4">{['Fair', 'Medium', 'Dark'].map((tone) => <button key={tone} onClick={() => handleSkinToneSelect(tone)} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-primary/20 text-primary dark:text-primary-light rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">{tone}</button>)}</div>}
                              {msg.isOccasionPrompt && <div className="flex flex-wrap gap-2 mt-4">{occasions.map((occ) => <button key={occ.name} onClick={() => handleOccasionSelect(occ.name)} className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-primary/20 text-primary dark:text-primary-light rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm">{occ.name} {occ.icon}</button>)}</div>}
                            </div>
                          ) : <p className="whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase mt-1.5 px-1 tracking-widest">{msg.time}</span>
                      </div>
                    </motion.div>
                  ))}
                  {typing && <div className="flex justify-start"><div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm"><div className="flex space-x-1.5"><motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full" /><motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" /><motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" /></div></div></div>}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                    {[{ label: '👗 Outfit Ideas', text: 'Suggest a stylish outfit' }, { label: '🎨 Color Suggestions', text: 'What colors suit my skin tone?' }, { label: '👜 Accessories Match', text: 'Suggest accessories for an outfit' }].map((s) => (
                      <button key={s.label} onClick={() => setInputMessage(s.text)} className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white text-gray-600 dark:text-gray-400 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border border-transparent hover:border-primary/20">{s.label}</button>
                    ))}
                  </div>
                  <form onSubmit={handleSend} className="relative flex items-center">
                    <label htmlFor="imageUpload" className="absolute left-3 text-gray-400 hover:text-primary transition-colors cursor-pointer"><FiImage size={18} /><input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const userMsg = { id: Date.now(), type: 'user', text: `Uploaded image: ${file.name}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                        setMessages(prev => [...prev, userMsg]); setTyping(true);
                        const formData = new FormData(); formData.append('image', file);
                        accessoryService.analyze(formData).then(res => {
                          const analysis = res.data;
                          setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: `📸 **Analysis:** ${analysis.outfit_type || 'Casual'}. \n\n👜 **Accessories:** ${analysis.suggestions || 'Minimal'}.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
                          setTyping(false);
                        }).catch(() => { setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: "Error analyzing image.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]); setTyping(false); });
                      }
                    }} /></label>
                    <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} placeholder="Ask about style..." className="w-full pl-10 pr-14 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 focus:border-primary focus:outline-none bg-gray-50 dark:bg-gray-800/50 transition-all text-sm font-medium" autoComplete="off" />
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={!inputMessage.trim() || typing} className="absolute right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:grayscale transition-all"><FiSend className="w-4 h-4" /></motion.button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx="true">{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; } .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); } .no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </>
  );
};

export default Chatbot;
