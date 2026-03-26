# Aayush's AI Portfolio

Terminal-aesthetic portfolio with two avatar modes:
- **ASCII mode** — photo-to-character avatar (works offline, no API keys)
- **3D mode** — TalkingHead 3D avatar with real lip sync + voice

## Stack
- **Next.js 14** — Framework
- **TalkingHead** (met4citizen/TalkingHead) — 3D avatar + lip sync engine
- **Ready Player Me** — Free 3D avatar (GLB with morph targets)
- **Claude API** — AI brain for chatbot
- **Google Cloud TTS** — Voice (4M free chars/month) — used by TalkingHead
- **Supabase pgvector** — RAG vector store (optional)
- **Framer Motion + Tailwind** — UI

---

## Quick Start

```bash
unzip portfolio.zip && cd portfolio
npm install
cp .env.example .env.local
npm run dev
```

Opens at `localhost:3000`. ASCII avatar + chat work immediately (no keys needed for ASCII mode).

---

## Setup: 3D Talking Avatar

### Step 1 — Your RPM Avatar
1. Go to https://readyplayer.me/avatar
2. Create your avatar (male, looks like you)
3. Copy the avatar ID from the URL (e.g. `64bfa15f0e72c63d7c3934a6`)
4. In `components/TalkingHeadAvatar.tsx`, replace the URL:
```
url: 'https://models.readyplayer.me/YOUR_ID_HERE.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png'
```

### Step 2 — Google Cloud TTS (Free, required for lip sync)
1. Go to https://console.cloud.google.com
2. Create a project → Enable "Cloud Text-to-Speech API"
3. APIs & Services → Credentials → Create API Key
4. In `components/TalkingHeadAvatar.tsx`, replace:
```
ttsEndpoint: "https://eu-texttospeech.googleapis.com/v1beta1/text:synthesize?key=YOUR_KEY"
```
Free tier: **4 million characters/month** — more than enough.

### Step 3 — Your Photo (for ASCII mode)
Drop a portrait photo (head + shoulders, good contrast) at `public/photo.jpg`.
The ASCII avatar will automatically sample your photo's brightness to place characters.

---

## Chatbot Setup

### Step 1 — Anthropic API Key
Add to `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`

The AI clone responds as you, using hardcoded context in `lib/rag.ts`.
**Update `getFallbackContext()` with your actual info.**

### Step 2 — Upgrade to RAG (optional)
1. Create project at https://supabase.com
2. Run `supabase_migration.sql` in SQL editor
3. Add Supabase + OpenAI keys to `.env.local`
4. Hit `POST /api/embed` with `{ "secret": "your-embed-secret" }` to seed

---

## File Structure

```
portfolio/
├── app/
│   ├── page.tsx              # Main page (ASCII/3D toggle, prompt bar)
│   ├── globals.css           # Press Start 2P font, black theme
│   └── api/
│       ├── chat/route.ts     # Claude API + RAG context
│       ├── voice/route.ts    # ElevenLabs (optional backup TTS)
│       └── embed/route.ts    # Supabase vector seeding
├── components/
│   ├── TalkingHeadAvatar.tsx # TalkingHead 3D avatar + lip sync
│   ├── CharAvatar.tsx        # Photo-to-ASCII canvas avatar
│   ├── ChatInterface.tsx     # Chat UI → bridges to TalkingHead
│   ├── ProjectGrid.tsx       # Projects section
│   └── CustomCursor.tsx      # Custom cursor
├── lib/
│   └── rag.ts                # RAG pipeline + your info (edit this!)
├── public/
│   └── photo.jpg             # ← drop your photo here
├── supabase_migration.sql    # pgvector DB setup
└── .env.example
```

---

## Deploy to Vercel

```bash
vercel deploy
```

Add env vars in Vercel → Project Settings → Environment Variables.

**Important**: Move your Google TTS API key to a Next.js API route before deploying publicly, so it's not exposed in the browser bundle.
