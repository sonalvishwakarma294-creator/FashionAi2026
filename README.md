# Fashion Pro AI Studio 👗✨

An advanced, intelligent personal fashion styling platform and digital wardrobe manager. **Fashion Pro AI** combines computer vision, perceptual color theory (CIEDE2000), and algorithmic capsule coordination to deliver personalized style advice, seasonal color analysis, and smart outfit recommendations.

---

## 🌟 Key Features

* **🎨 Accurate Skin Tone & Seasonal Color Analysis:**
  * Multi-pass computer vision pipeline (HSV + YCrCb + CIELAB) to accurately detect skin undertones.
  * Provides tailored seasonal palettes (Warm, Cool, Neutral) and flattering outfit color pairings.

* **👗 Digital Closet & Capsule Wardrobe Generator:**
  * Upload your personal garments with automatic K-Means palette extraction.
  * Smart capsule wardrobe generator that creates high-harmony outfit combinations (Tops, Bottoms, Shoes, Outerwear, Accessories).
  * Seamless cloud image persistence via Cloudinary for serverless/ephemeral deployments.

* **🔍 Visual CIEDE2000 & Semantic Outfit Search:**
  * Multi-swatch color extraction matching uploaded outfit photos against the curated fashion dataset.
  * Perceptual color distance matching using standard CIEDE2000 ($\Delta E$) and occasion/silhouette scoring.
  * Natural language semantic search for queries like *"pastel summer brunch"* or *"monochrome office"*.

* **🖼️ Interactive Outfit Gallery & Lookbook:**
  * Extensive catalog of curated styles across Casual, Office, Party, and Traditional occasions.
  * Personalized look saving, like counts, and dashboard analytics.

* **🔐 Enterprise-Grade Security & Authentication:**
  * JWT (Access & Refresh tokens) with secure HTTP headers.
  * Endpoint protection with IP and account-level rate limiting (`Flask-Limiter`).
  * Full password recovery flow with SMTP delivery (Gmail, Resend, cPanel) and fallback developer mode.

---

## 🛠️ Tech Stack

* **Frontend:**
  * React 18, Vite
  * TailwindCSS & Vanilla CSS
  * Framer Motion (Smooth animations & transitions)
  * Axios, React Router v6

* **Backend:**
  * Python 3.11+, Flask
  * Flask-SQLAlchemy (MySQL & SQLite fallback)
  * OpenCV (Headless), Pillow, NumPy, Scikit-learn (K-Means)
  * Flask-JWT-Extended, Flask-Limiter, PyMySQL, Bcrypt
  * Cloudinary SDK, Gunicorn

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
* Node.js (v18+)
* Python (v3.10+)
* MySQL (Optional: uses local SQLite automatically if MySQL is not configured)

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file
cp .env.example .env

# Run database setup & seed gallery (first time)
python setup_mysql.py

# Start the Flask API server
python app.py
```
*Backend runs on: `http://127.0.0.1:5001`*

---

### 3. Frontend Setup

```bash
# In the project root folder
npm install

# Start the Vite development server
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## ⚙️ Environment Configuration

Refer to `backend/.env.example` and `.env.example` for all configurable variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `FLASK_ENV` | Environment mode (`development` / `production`) | `development` |
| `USE_SQLITE` | Set `True` to use SQLite, `False` for MySQL | `False` |
| `DATABASE_URL` | Cloud MySQL connection string (Render/Railway) | None |
| `JWT_SECRET` | Secret key for signing authentication tokens | *Change in prod* |
| `USE_CLOUDINARY` | Set `True` to persist uploaded closet images on Cloudinary | `False` |
| `CLOUDINARY_*` | Cloud Name, API Key, and Secret | None |
| `MAIL_USE_SMTP` | Set `True` to send real password reset emails | `False` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:5173` |

---

## 🚢 Deployment Guide

### Deploying Backend (Render / Railway / VPS)
* **Build Command:** `pip install -r backend/requirements.txt`
* **Start Command:** `cd backend && gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
* **Environment Variables:** Set `FLASK_ENV=production`, `JWT_SECRET`, `CORS_ORIGINS`, and database/Cloudinary keys in your platform dashboard.

### Deploying Frontend (Vercel / Netlify)
* **Root Directory:** `./`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variable:** `VITE_API_BASE_URL=https://your-backend-app.onrender.com`

---

## 🧪 Testing

Run automated tests:
```bash
# Backend pytest suite
.venv\Scripts\python -m pytest backend/tests

# Frontend production build verification
npm run build
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
