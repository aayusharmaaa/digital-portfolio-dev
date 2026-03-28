/** Drop MP3s here: `public/audio/intro-greeting.mp3` and `public/audio/intro-human-mode.mp3`. If missing, falls back to /api/voice. */
export const INTRO_GREETING_URL = '/audio/intro-greeting.mp3';
export const INTRO_HUMAN_MODE_URL = '/audio/intro-human-mode.mp3';

export async function fetchIntroBlob(
  staticUrl: string,
  ttsFallbackText: string,
): Promise<Blob | null> {
  try {
    const res = await fetch(staticUrl, { cache: 'force-cache' });
    if (res.ok) return await res.blob();
  } catch {
    /* missing or blocked */
  }
  try {
    const res = await fetch('/api/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: ttsFallbackText }),
    });
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}
