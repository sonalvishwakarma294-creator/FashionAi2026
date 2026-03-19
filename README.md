# Fashion Pro AI Studio - Setup

## 🚀 Quick Start

```
Frontend: npm run dev → localhost:5173
Backend: cd backend && python app.py → http://127.0.0.1:5001
```

## ✅ Features Working
- Dashboard reports save ✓
- Skin Lab color analysis ✓
- Gallery + like/save ✓
- Chatbot friendly Hindi/English ✓

## 🎯 ChatGPT-like AI Chatbot

**Step 1:** https://console.groq.com/keys  
- Sign up (GitHub/Google - 30sec)

**Step 2:** Settings → API Keys → "Create API Key" → Copy

**Step 3:** Add to backend/app.py:
```python
GROQ_API_KEY = "gsk_your_key_here"
```

**Step 4:** `cd backend && python app.py` restart

**Now Chatbot = ChatGPT!** Ask "Office outfit" → Real AI response 🔥

## 📱 Test Flow
1. localhost:5173 → Login (abc@gmail.com/abcd)
2. Dashboard → Save report ✓
3. Bottom-right green button → Chat "summer colors" ✓

**Ready for Production!** 🚀

Questions? Ask chatbot itself!

