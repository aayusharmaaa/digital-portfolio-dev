import type { MutableRefObject } from 'react';
import { decodeAudioBlob } from '@/lib/useAudioAmplitude';

/** Prefer decoded buffer duration (matches what Web Audio plays); fallback to <audio> metadata. */
export async function measurePlaybackDurationMs(blob: Blob): Promise<number> {
  try {
    const buf = await decodeAudioBlob(blob);
    if (buf && buf.duration > 0 && Number.isFinite(buf.duration)) {
      return Math.round(buf.duration * 1000);
    }
  } catch {
    /* fall through */
  }
  return metadataDurationMs(blob);
}

function metadataDurationMs(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const d = audio.duration;
      const ms = Number.isFinite(d) && d > 0 && d < 1e6 ? d * 1000 : 0;
      URL.revokeObjectURL(url);
      resolve(ms);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
  });
}

/**
 * Reveal characters over `audioDurationMs` when known so typing tracks TTS.
 * Uses ceil on index so the last chunk appears as audio finishes.
 */
export function runRevealWithDuration(
  fullText: string,
  audioDurationMs: number,
  setContent: (s: string) => void,
  animFrameRef: MutableRefObject<number>,
): Promise<void> {
  return new Promise((resolve) => {
    cancelAnimationFrame(animFrameRef.current);
    const n = fullText.length;
    const duration =
      audioDurationMs > 80
        ? Math.max(380, Math.min(audioDurationMs, 120_000))
        : Math.max(550, Math.min(n * 18, 10_000));
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const count = Math.min(n, Math.ceil(n * p));
      setContent(fullText.slice(0, count));
      if (p < 1) animFrameRef.current = requestAnimationFrame(tick);
      else resolve();
    };
    animFrameRef.current = requestAnimationFrame(tick);
  });
}
