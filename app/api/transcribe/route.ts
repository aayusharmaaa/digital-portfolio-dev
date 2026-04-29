import { NextRequest, NextResponse } from 'next/server';

/**
 * Speech-to-text for Human Mode on browsers without Web Speech API (e.g. iPhone Chrome).
 * Uses the same GOOGLE_GEMINI_API_KEY as /api/chat — no OpenAI required.
 */
const GEMINI_TIMEOUT_MS = 12000;

function isQuotaStatus(status: number, body: string): boolean {
  return status === 429 || /quota|resource_exhausted|rate limit|too many requests/i.test(body);
}

async function transcribeWithKey(apiKey: string, mimeType: string, base64: string) {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: base64 } },
              {
                text: 'Transcribe the speech in this audio. Output only the spoken words, no labels, quotes, or commentary.',
              },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Gemini transcription timed out after ${GEMINI_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(req: NextRequest) {
  const primaryKey = process.env.GOOGLE_GEMINI_API_KEY;
  const fallbackKey = process.env.GOOGLE_GEMINI_API_KEY_FALLBACK;
  if (!primaryKey) {
    return NextResponse.json(
      { error: 'GOOGLE_GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 200) {
    return NextResponse.json({ text: '' });
  }

  const rawType = (file.type || '').toLowerCase();
  let mimeType = rawType;
  if (rawType.includes('mp4') || rawType.includes('m4a') || rawType === 'video/mp4') {
    mimeType = 'audio/mp4';
  } else if (!rawType || rawType === 'application/octet-stream') {
    // iOS often omits type; MP4 brand at offset 4
    mimeType =
      buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp' ? 'audio/mp4' : 'audio/webm';
  }
  const base64 = buf.toString('base64');
  let res: Response;
  try {
    res = await transcribeWithKey(primaryKey, mimeType, base64);
  } catch (err) {
    if (!fallbackKey) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (!/quota|resource_exhausted|rate limit|too many requests|timed out|timeout|aborted/i.test(msg)) throw err;
    console.warn('[transcribe] primary Gemini key failed, retrying with fallback key');
    res = await transcribeWithKey(fallbackKey, mimeType, base64);
  }

  if (!res.ok) {
    const err = await res.text();
    if (fallbackKey && isQuotaStatus(res.status, err)) {
      console.warn('[transcribe] primary Gemini key exhausted, retrying with fallback key');
      res = await transcribeWithKey(fallbackKey, mimeType, base64);
    } else {
      console.error('[transcribe]', res.status, err);
      return NextResponse.json({ error: 'Transcription failed' }, { status: res.status });
    }
  }

  if (!res.ok) {
    const err = await res.text();
    console.error('[transcribe:fallback]', res.status, err);
    return NextResponse.json({ error: 'Transcription failed' }, { status: res.status });
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('')?.trim() ?? '';

  return NextResponse.json({ text });
}
