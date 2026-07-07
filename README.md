# AI Voice Studio

A FastAPI + React app for exploring Nvidia's speech and audio models. Record, transform, generate, and lip-sync voice content with a clean studio-style UI.

## Tech Stack

- **Backend**: FastAPI (Python), async Nvidia NIM API calls, WebSocket for real-time streaming
- **Frontend**: React (Vite), TailwindCSS, Web Audio API, MediaRecorder API
- **Storage**: Local filesystem or S3-compatible for audio/video files

## Nvidia Models Used

| Model | Purpose |
|-------|---------|
| `magpie-tts-zeroshot` | Text-to-speech from a short voice sample (voice cloning) |
| `magpie-tts-multilingual` | TTS in multiple languages with natural expression |
| `chatterbox-multilingual-tts` | Expressive TTS in 23 languages with emotional range |
| `canary-1b-asr` | Speech-to-text recognition and translation |
| `nemotron-asr-streaming` | Real-time streaming speech recognition |
| `bnr` (Background Noise Removal) | Clean up noisy audio recordings |
| `LipSync` | Sync lip movements in video to match generated audio |

## Features

### Voice Cloning
- **Sample upload** -- record or upload a 10-15 second voice sample
- **Zero-shot cloning** -- type any text and hear it spoken in the sampled voice (magpie-zeroshot)
- **Voice library** -- save cloned voices with names, reuse across projects
- **Demo twist** -- clone a celebrity impression, your own voice, or a character

### Studio Recorder
- **Live recording** -- record from browser microphone with waveform visualization
- **Noise removal** -- post-process recordings through BNR to clean background hiss/hum
- **Transcribe** -- send clean audio through canary-1b ASR for text output
- **Translate** -- transcribe in one language and get translated text (canary-1b supports multi-lingual translation)
- **Re-voice** -- take transcribed text and re-generate with a different AI voice

### Multilingual TTS
- **Language picker** -- choose from 23+ languages
- **Voice selector** -- pick male/female/natural voices per language (chatterbox)
- **SSML support** -- control pitch, speed, emphasis for expressive speech
- **Phrase book** -- save commonly used phrases in multiple languages

### Lip-Sync Studio
- **Upload video** -- upload a video with a speaking face (or generate one via FLUX)
- **Generate audio** -- create or select AI-generated dialogue
- **Sync** -- LipSync model adjusts the video to match the new audio
- **Export** -- download synced video as MP4

### Real-time Voice Chat
- **Push-to-talk** -- hold a button, speak, release, hear AI response
- **Streaming pipeline** -- microphone -> streaming ASR -> LLM (any Nvidia LLM) -> streaming TTS -> speakers
- **Voice selection** -- choose the AI's voice, set conversation language
- **Latency display** -- shows real-time per-stage latency breakdown

### UX
- **Waveform editor** -- visualize audio, trim/crop segments
- **Playlist** -- queue up multiple audio generations for sequential playback
- **Dark/light theme**
- **Keyboard shortcuts** -- space to play/pause, R to record, Esc to stop
- **Responsive** -- works on desktop and tablet

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/tts` | Text-to-speech (standard) |
| `POST` | `/api/tts/clone` | TTS with voice sample (zero-shot cloning) |
| `POST` | `/api/tts/multilingual` | TTS in specific language |
| `POST` | `/api/asr` | Speech-to-text transcription |
| `POST` | `/api/asr/translate` | Speech recognition + translation |
| `WS` | `/api/asr/stream` | WebSocket -- real-time streaming ASR |
| `POST` | `/api/clean` | Background noise removal |
| `POST` | `/api/lipsync` | Lip-sync video to audio |
| `POST` | `/api/voice-chat` | Single-turn voice query -> response |
| `WS` | `/api/voice-chat/stream` | WebSocket -- real-time voice conversation |
| `GET` | `/api/voices` | List saved voice samples |
| `POST` | `/api/voices` | Save a voice sample |
| `DELETE` | `/api/voices/:id` | Delete a voice sample |
| `GET` | `/api/clips` | List saved audio clips |
| `DELETE` | `/api/clips/:id` | Delete a clip |
| `GET` | `/api/projects` | List lip-sync projects |
| `GET` | `/api/models` | List available models and their capabilities |

## Project Structure

```
ai-voice-studio/
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── tts.py           # Text-to-speech endpoints
│   │   ├── asr.py           # Speech-to-text endpoints
│   │   ├── cleanup.py       # Noise removal
│   │   ├── lipsync.py       # Lip-sync processing
│   │   └── voicechat.py     # Voice chat (REST + WebSocket)
│   ├── services/
│   │   ├── nvidia_client.py # Nvidia NIM API wrapper
│   │   ├── tts_service.py   # TTS orchestration (clone, multilingual)
│   │   ├── asr_service.py   # ASR + translation
│   │   ├── audio_service.py # Audio processing, BNR pipe
│   │   ├── lipsync_service.py
│   │   └── streaming.py     # WebSocket session management
│   ├── models.py            # Pydantic schemas
│   └── config.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Recorder/    # Microphone recording with waveform
│   │   │   ├── TTSPlayground/ # Text input, voice selector, language picker
│   │   │   ├── VoiceCloner/ # Sample upload, clone & test
│   │   │   ├── LipSync/     # Video upload + audio + sync preview
│   │   │   ├── VoiceChat/   # Push-to-talk real-time chat
│   │   │   ├── Library/     # Saved voices, clips, projects
│   │   │   └── common/
│   │   ├── hooks/
│   │   │   ├── useRecorder.ts
│   │   │   ├── useAudioPlayer.ts
│   │   │   └── useVoiceChat.ts
│   │   ├── lib/
│   │   └── App.tsx
│   └── ...
└── README.md
```

## Setup

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add your NVIDIA_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Fun Demo Ideas

- **"Arnold in Hindi"** -- clone impression + translate + multilingual TTS
- **Self-voiced podcast** -- record yourself, clean, transcribe, edit text, re-generate in your own cloned voice
- **Real-time translator** -- speak English, hear it in French in your own voice
- **Talking portrait** -- generate a FLUX face, use LipSync to make it speak your audio
- **Voiced storybook** -- pair with the Story Illustrator project for narrated illustrated stories
