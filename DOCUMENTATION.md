# AI Fashion Recommendation System - Setup & Documentation

## 🚀 Project Overview
A full-stack AI-driven fashion recommendation engine using React, Flask, and MySQL (with JSON fallback).

## 🛠 Features
- **Secure Auth:** Bcrypt password hashing + JWT token authentication.
- **Smart AI Recs:** Personalized suggestions based on user likes and occasions.
- **Color Matching:** Intelligent color coordination engine.
- **Admin Dashboard:** Real-time stats and dataset management.
- **Resilient Architecture:** Modular backend with database fallback.

## 📦 Setup Instructions

### 1. Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*Environment Variables (.env):*
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET_KEY`

### 2. Frontend (React)
```bash
npm install
npm start
```

## 📜 API Documentation
- `POST /api/users/register`: Create a new account (Secure).
- `POST /api/users/login`: Authenticate and get JWT.
- `GET /api/gallery`: Fetch all outfits.
- `GET /api/recommendations/<user_email>`: Get AI-powered suggestions.
- `GET /api/admin/stats`: Protected admin route.

## 🚀 Deployment
- **Frontend:** Deploy to Vercel/Netlify.
- **Backend:** Deploy to Render/Heroku (Set `PYTHON_VERSION` to 3.11).
- **Database:** Use PlanetScale or Aiven for MySQL.
