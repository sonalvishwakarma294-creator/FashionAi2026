import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageCircle, FiX, FiSend, FiGlobe, FiTrash2, FiMaximize2, FiMinimize2, FiSmile, FiPlus, FiCpu, FiZap } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/api';

const Chatbot = () => {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        type: 'bot',
        text: "Namaste! I am **StyleSync Pro**, your elite AI Fashion Consultant. I'm here to help you redefine your style logic with expert precision! 👗👔",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 2,
        type: 'bot',
        text: "How can I elevate your look today? I specialize in:\n- **Wedding & Occasion Logic** 💍\n- **Color Theory & Skin Tones** 🎨\n- **Corporate Power Dressing** 👔\n- **Streetwear & Urban Trends** 👟",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const messagesEndRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages, isMinimized]);

  const clearChat = () => {
    const initialMessages = [
      {
        id: Date.now(),
        type: 'bot',
        text: "Chat history cleared. How can I help you start fresh? ✨",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(initialMessages);
    localStorage.removeItem('chat_messages');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || typing) return;

    const userMessage = { 
      id: Date.now(), 
      type: 'user', 
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
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
        text: response.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = { 
        id: Date.now() + 1, 
        type: 'bot', 
        text: "Oops! My fashion sensors are a bit hazy. Please check your connection! 🌐",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    }
    setTyping(false);
  };

  const handleQuickAsk = (text) => {
    setInputMessage(text);
  };

  const quickSuggestions = [
    { label: '💍 Wedding', text: 'Suggest me a wedding outfit for a close friend\'s marriage' },
    { label: '💼 Office', text: 'Professional office wear ideas for a big presentation' },
    { label: '👗 Skin Tone', text: 'Which colors suit my skin tone best?' },
    { label: '👟 Casual', text: 'Casual street style outfit ideas for the weekend' }
  ];

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-black text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-2xl flex items-center justify-center overflow-hidden border border-white/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent" />
            <FiCpu className="w-7 h-7 relative z-10" />
            <motion.div 
              animate={{ opacity: [0, 1, 0] }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1"
            >
              <FiZap className="w-4 h-4 text-accent" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, height: isMinimized ? '72px' : '600px' }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[9999] w-[calc(100vw-3rem)] sm:w-[400px] bg-white dark:bg-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col transition-all duration-500 ease-in-out`}
          >
            {/* Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between shrink-0 h-[72px]">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <FiCpu className="w-6 h-6" />
                  </div>
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
                <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="p-2 hover:bg-white/10 rounded-xl transition-all" title="Toggle Language">
                  <FiGlobe className={`w-4 h-4 text-gray-400 hover:text-white transition-colors ${language === 'hi' ? 'text-primary' : ''}`} />
                </button>
                <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-red-400" title="Clear Chat">
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400">
                  {isMinimized ? <FiMaximize2 size={16} /> : <FiMinimize2 size={16} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white">
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          msg.type === 'user' 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                        }`}>
                          {msg.type === 'bot' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-700 prose-strong:text-primary dark:prose-strong:text-primary-light">
                              <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          )}
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 uppercase mt-1.5 px-1 tracking-widest">{msg.time}</span>
                      </div>
                    </motion.div>
                  ))}
                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex space-x-1.5">
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                  {/* Quick Suggestions */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                    {quickSuggestions.map((s) => (
                      <button 
                        key={s.label}
                        onClick={() => handleQuickAsk(s.text)}
                        className="whitespace-nowrap px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white text-gray-600 dark:text-gray-400 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border border-transparent hover:border-primary/20"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  
                  <form onSubmit={handleSend} className="relative flex items-center">
                    <button type="button" className="absolute left-3 text-gray-400 hover:text-primary transition-colors">
                      <FiPlus size={18} />
                    </button>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask about style..."
                      className="w-full pl-10 pr-14 py-4 rounded-2xl border-2 border-gray-50 dark:border-gray-800 focus:border-primary focus:outline-none bg-gray-50 dark:bg-gray-800/50 transition-all text-sm font-medium placeholder-gray-400"
                      autoComplete="off"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!inputMessage.trim() || typing}
                      className="absolute right-2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:grayscale transition-all"
                    >
                      <FiSend className="w-4 h-4" />
                    </motion.button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default Chatbot;
