# Swar Voice - Production Ready

A lightning-fast voice-to-voice interaction app using **Groq (Whisper)** for STT and **Edge TTS** for premium speech generation.

## 🚀 Deployment Guide

### 1. Backend (Render)
1. **Repository**: Push this code to GitHub.
2. **Create Web Service**: Connect your repo to Render.
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `gunicorn app:app`
5. **Environment Variables**:
   - `GROQ_API_KEY`: Your Groq API key.
   - `PORT`: 8000 (Render handles this automatically).

### 2. Frontend (Vercel)
1. **API URL**: In `static/scripts.js`, update the `API_BASE_URL` to your Render app URL:
   ```javascript
   const API_BASE_URL = 'https://your-backend.onrender.com';
   ```
2. **Deploy**: Push to GitHub and connect to Vercel. It will automatically serve the `index.html`.

## 🛠️ Tech Stack
- **STT**: Groq Cloud (Whisper-large-v3)
- **TTS**: Edge-TTS (Microsoft Neural)
- **Backend**: Flask + Gunicorn
- **Frontend**: Vanilla JS + Tailwind Design

---
Built with ❤️ by Antigravity
