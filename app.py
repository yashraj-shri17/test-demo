import os
import uuid
import asyncio
import edge_tts
from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Critical for Vercel (Frontend) to talk to Render (Backend)

# Configuration
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "static/outputs"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Initialize Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not found in environment variables.")

client = Groq(api_key=GROQ_API_KEY)

# --- Text to Speech (Edge TTS) ---
async def generate_speech_async(text, output_file, voice, pitch="+0Hz", rate="+0%"):
    communicate = edge_tts.Communicate(text, voice, pitch=pitch, rate=rate)
    await communicate.save(output_file)

# --- Speech to Text (Groq) ---
def transcribe_audio(file_path, lang='hi'):
    try:
        with open(file_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(file_path, file.read()),
                model="whisper-large-v3",
                response_format="json",
                language=lang if lang in ['hi', 'en'] else None,
                temperature=0.0
            )
        return transcription.text
    except Exception as e:
        print(f"Groq Transcription Error: {e}")
        return None

# --- Routes ---

@app.route("/")
def index():
    """Serve the index page for local testing/Render dashboard."""
    return render_template("index.html")

@app.route("/stt", methods=["POST"])
def stt():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    lang = request.args.get('lang', 'hi') 
    
    # Save temp file with dynamic extension
    ext = ".webm" if "webm" in audio_file.content_type else ".mp4"
    filename = f"stt_{uuid.uuid4().hex[:8]}{ext}"
    temp_path = os.path.join(UPLOAD_DIR, filename)
    audio_file.save(temp_path)

    try:
        text = transcribe_audio(temp_path, lang=lang)
        return jsonify({"text": text}) if text is not None else (jsonify({"error": "Transcription failed"}), 500)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    text = data.get("text", "").strip()
    voice = data.get("voice", "hi-IN-MadhurNeural")
    pitch = data.get("pitch", "+0Hz")
    rate = data.get("rate", "+0%")

    if not text:
        return jsonify({"error": "Text is required"}), 400

    filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    try:
        asyncio.run(generate_speech_async(text, filepath, voice, pitch, rate))
        return jsonify({
            "audio_url": f"/static/outputs/{filename}",
            "filename": filename
        })
    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

# Health check for Render deployment
@app.route("/health")
def health():
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
