# 🚀 Ultimate Deployment Guide: Swar Voice

This guide provides a step-by-step roadmap to deploy your **Swar Voice** application with a split architecture: **Backend on Render** and **Frontend on Vercel**.

---

## 🏗️ Architecture Overview
*   **Frontend**: Hosted on **Vercel** (Fast global CDN, manages the UI and Audio Recording).
*   **Backend**: Hosted on **Render** (Flask server, manages Groq STT and Edge TTS Generation).
*   **Bridge**: The Frontend talks to the Backend via a secure API URL with CORS enabled.

---

## 🛠️ Step 1: Final Local Prep (DO THIS FIRST)

1.  **Groq API Key**: Ensure you have a valid key from [Groq Cloud](https://console.groq.com/).
2.  **GitHub Repo**: Initialize a git repository in your project folder.
    ```bash
    git init
    git add .
    git commit -m "Ready for production"
    ```
3.  **Create a Remote Repo**: Go to GitHub and create a new **Private** repository, then push your code.

---

## 🌐 Step 2: Deploy Backend (Render.com)

1.  **Login to Render**: Create an account at [render.com](https://render.com/).
2.  **New Web Service**: Click **New +** > **Web Service**.
3.  **Connect Repo**: Connect your GitHub repository.
4.  **Settings**:
    *   **Name**: `swar-backend` (or similar)
    *   **Language**: `Python`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `gunicorn app:app`
5.  **Environment Variables**: Click the **Environment** tab and add:
    *   `GROQ_API_KEY` = `your_actual_key_here`
    *   `PYTHON_VERSION` = `3.10.x` (Recommended)
6.  **Wait for Build**: Render will deploy your app. Once finished, copy the URL (e.g., `https://swar-backend.onrender.com`).

---

## 🎨 Step 3: Configure & Deploy Frontend (Vercel)

### A. Update the Bridge
Before pushing the final frontend, you MUST tell it where the backend is.
1.  Open `static/scripts.js`.
2.  Find line 17: `const API_BASE_URL = '';`
3.  Change it to your Render URL:
    ```javascript
    const API_BASE_URL = 'https://swar-backend.onrender.com';
    ```
4.  Commit and Push this change to GitHub.

### B. Deploy on Vercel
1.  Login to [vercel.com](https://vercel.com/).
2.  **Add New**: Start a new project and import the same GitHub repo.
3.  **Settings**: Vercel will automatically detect the static files. No special settings needed.
4.  **Deploy**: Click Deploy!

---

## 🚫 What NOT to Do (Common Mistakes)

*   **❌ DON'T push `.env`**: Your secret keys should only be in Render's "Environment Variables" tab. The `.gitignore` I added handles this.
*   **❌ DON'T use `app.run()` on Render**: Render requires a production server like **Gunicorn**. Ensure your `Procfile` is pushed.
*   **❌ DON'T forget CORS**: If the frontend on Vercel can't talk to Render, it's usually because `CORS(app)` is missing in `app.py`. (I have already included this in your code).
*   **❌ DON'T push Large Files**: Do not push the `models/` folder (legacy Vosk) or large audio samples. Keep the repo light.

---

## ✅ Final Testing Checklist

1.  **Check Health**: Visit `https://your-backend.onrender.com/health`. You should see `{"status": "healthy"}`.
2.  **Check Mic Permissions**: When visiting your Vercel URL, ensure you click "Allow" for the microphone.
3.  **Check Groq Speed**: Click the mic, speak, and verify that transcription appears in < 1 second.
4.  **Check Edge TTS**: Ensure the AI voice speaks back to you automatically.

---
**Congratulations!** You now have a high-performance, AI-powered voice application running in the cloud. 🚀🎙️
