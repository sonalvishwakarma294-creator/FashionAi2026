# Chatbot Fix Progress

## [x] 1. Backend Dependencies
✅ openai installed. Run `cd backend && pip install -r requirements.txt` for google-generativeai etc.

## [ ] 2. API Keys Setup (Manual)
- Copy `backend/.env.example` → `backend/.env`
- Add: GROQ_API_KEY=..., GEMINI_API_KEY=..., OPENAI_API_KEY=... (optional)
- Restart backend: Ctrl+C then `python app.py`

## [x] 3. Backend Running
✅ http://127.0.0.1:5001/ active

## [x] 4. Vite Proxy Config
✅ Already configured in vite.config.js

## [ ] 5. Test Chat Endpoint (Windows PowerShell)
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:5001/api/ai-chat -Method POST -ContentType 'application/json' -Body '{"message":"Office outfit","gender":"female"}'
```

Or CMD: curl --data "{\"message\":\"test\",\"gender\":\"female\"}" http://127.0.0.1:5001/api/ai-chat

## [ ] 6. Frontend Test
- `npm run dev`
- Open localhost:5173 → Test chatbot bottom-right

## [ ] 7. Debug if Fails
- Browser Console/Network tab
- Backend terminal logs (DEBUG: ... failed)

