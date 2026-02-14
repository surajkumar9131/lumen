# Lumen

AI-powered "Second Brain" for physical book lovers. Transforms book snippets into searchable, AI-synthesized digital assets.

## Project Structure

| Directory        | Description                    |
|------------------|--------------------------------|
| `lumen-backend/` | Express API (Firebase, Gemini, Pinecone, TTS) |
| `mobile/`        | React Native app (Expo)        |

## Quick Start

### 1. Backend

```bash
cd lumen-backend
gcloud auth application-default login
cp .env.example .env   # Edit with your config
npm install && npm run dev
```

Backend runs at `http://localhost:3000`.

### 2. Mobile

```bash
cd mobile
cp .env.example .env   # Add Firebase config + EXPO_PUBLIC_API_URL
npm install && npm start
```

- **iOS Simulator:** Press `i` in terminal  
- **Android Emulator:** Press `a`  
- **Physical device:** Scan QR code with Expo Go

For a physical device, set `EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:3000`.
# lumen
# lumen
