import { NextRequest, NextResponse } from 'next/server';

// ElevenLabs REST TTS (returns audio blob for TalkingHead.speakAudio)
// For best lip-sync, use ElevenLabs WebSocket API instead (see README)
// Voice setup: elevenlabs.io → Voice Lab → Instant Voice Clone → upload your audio

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '';

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || !VOICE_ID) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID not set in .env.local' },
      { status: 500 }
    );
  }

  console.log('[Voice] Calling ElevenLabs | Voice:', VOICE_ID, '| Key prefix:', apiKey.slice(0, 6) + '...');

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        // Eleven Flash v2.5 — https://elevenlabs.io/docs/models
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          // Slower speech for clarity (panel shows Speed biased toward "Slower").
          speed: 1,
          // Panel shows Stability biased toward "More variable".
          stability: 0.5,
          // Panel shows Similarity biased toward "High".
          similarity_boost: 0.75,
          // Panel shows Style Exaggeration = None.
          style: 0.2,
          // Panel toggle appears off.
          use_speaker_boost: false,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('[Voice] ElevenLabs error:', res.status, err);
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
  });
}
