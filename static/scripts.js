document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text');
    const voiceSelect = document.getElementById('voice');
    const generateBtn = document.getElementById('generate');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('spinner');
    const resultDiv = document.getElementById('result');
    const audioPlayer = document.getElementById('audio');
    const downloadLink = document.getElementById('download');
    const micBtn = document.getElementById('mic-btn');
    const pitchInput = document.getElementById('pitch');
    const pitchVal = document.getElementById('pitch-val');
    const rateInput = document.getElementById('rate');
    const rateVal = document.getElementById('rate-val');

    // Configuration for Deployment
    // REPLACEME: When deploying, set this to your Render backend URL (e.g., https://your-backend.onrender.com)
    const API_BASE_URL = 'https://swar-backend-aumm.onrender.com';

    // Language Toggle
    let currentLang = 'hi';

    // Audio Recording State
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // Update slider displays
    pitchInput.addEventListener('input', () => {
        pitchVal.textContent = (pitchInput.value >= 0 ? '+' : '') + pitchInput.value + ' Hz';
    });
    rateInput.addEventListener('input', () => {
        rateVal.textContent = (rateInput.value >= 0 ? '+' : '') + rateInput.value + '%';
    });

    // --- Unified TTS & Action Function ---
    const triggerTTS = async (text) => {
        if (!text) return;

        const voice = voiceSelect.value;
        const pitch = (pitchInput.value >= 0 ? '+' : '') + pitchInput.value + 'Hz';
        const rate = (rateInput.value >= 0 ? '+' : '') + rateInput.value + '%';

        generateBtn.disabled = true;
        spinner.style.display = 'block';
        btnText.textContent = 'तैयार कर रहे हैं... (Processing...)';
        resultDiv.classList.remove('visible');

        try {
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voice, pitch, rate }),
            });

            const data = await response.json();
            if (data.audio_url) {
                const fullAudioUrl = `${API_BASE_URL}${data.audio_url}`;
                audioPlayer.src = fullAudioUrl;
                downloadLink.href = fullAudioUrl;
                resultDiv.classList.add('visible');
                audioPlayer.play();
            } else {
                alert('TTS Error: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('सर्वर एरर');
        } finally {
            generateBtn.disabled = false;
            spinner.style.display = 'none';
            btnText.textContent = 'आवाज़ बनाएं / Generate Speech';
        }
    };

    // --- TTS Logic (Manual Button) ---
    generateBtn.addEventListener('click', () => {
        triggerTTS(textInput.value.trim());
    });

    // --- STT Logic (Groq) ---
    micBtn.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                // Determine MIME type based on browser support
                const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream, { mimeType });
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunks.push(event.data);
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: mimeType });
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');

                    const originalPlaceholder = textInput.placeholder;
                    textInput.placeholder = "सुन रहे हैं... (Processing...)";
                    textInput.value = "";

                    try {
                        const response = await fetch(`${API_BASE_URL}/stt?lang=${currentLang}`, {
                            method: 'POST',
                            body: formData
                        });
                        const data = await response.json();
                        if (data.text) {
                            textInput.value = data.text;
                            // AUTOMATICALLY trigger TTS after transcription
                            triggerTTS(data.text);
                        } else if (data.text === "") {
                            alert("कुछ सुनाई नहीं दिया (No speech detected)");
                        } else {
                            alert('STT Error: ' + (data.error || 'Transcription failed'));
                        }
                    } catch (error) {
                        console.error('STT Error:', error);
                        alert('सर्वर से कनेक्ट नहीं हो सका');
                    } finally {
                        textInput.placeholder = originalPlaceholder;
                    }
                };

                mediaRecorder.start();
                isRecording = true;
                micBtn.classList.add('recording');
            } catch (err) {
                console.error("Mic Error:", err);
                alert("माइक्रोफोन एक्सेस नहीं मिला");
            }
        } else {
            mediaRecorder.stop();
            isRecording = false;
            micBtn.classList.remove('recording');
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    });

    // Ctrl+Enter shortcut
    textInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            generateBtn.click();
        }
    });
});
