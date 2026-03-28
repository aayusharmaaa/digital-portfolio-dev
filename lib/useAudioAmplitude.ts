import { useRef, useState, useCallback } from 'react';

/** Decode once; play via playBufferWithAmplitude inside a user gesture (required on iOS). */
export async function decodeAudioBlob(blob: Blob): Promise<AudioBuffer | null> {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  try {
    const raw = await blob.arrayBuffer();
    return await ctx.decodeAudioData(raw.slice(0));
  } catch {
    return null;
  } finally {
    await ctx.close().catch(() => {});
  }
}

export function useAudioAmplitude() {
  const [amplitude, setAmplitude] = useState(0);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);

  /**
   * Call synchronously from click/tap handlers **before** any `await` so Safari keeps the
   * AudioContext in "running" state for MediaElementSource → analyser (jaw) on first use.
   */
  const unlockAudioFromUI = useCallback(() => {
    if (typeof window === 'undefined') return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!contextRef.current || contextRef.current.state === 'closed') {
      contextRef.current = new Ctor();
    }
    const ctx = contextRef.current;
    if (ctx.state === 'suspended') void ctx.resume();
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    try {
      bufferSourceRef.current?.stop();
    } catch {
      /* already stopped */
    }
    bufferSourceRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = null;
    setAmplitude(0);
  }, []);

  /** Decoded-buffer path: start(0) runs synchronously — safe to call directly from pointerdown/touchstart on iOS. */
  const playBufferWithAmplitude = useCallback(
    (buffer: AudioBuffer): Promise<void> => {
      stop();

      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!contextRef.current || contextRef.current.state === 'closed') {
        contextRef.current = new Ctor();
      }
      const ctx = contextRef.current;
      if (ctx.state === 'suspended') void ctx.resume();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.55;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      bufferSourceRef.current = source;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      const poll = () => {
        if (!analyserRef.current || !dataRef.current) return;
        analyserRef.current.getByteFrequencyData(dataRef.current);
        const avg = dataRef.current.reduce((a, b) => a + b, 0) / dataRef.current.length;
        setAmplitude(avg / 128);
        rafRef.current = requestAnimationFrame(poll);
      };

      return new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          cancelAnimationFrame(rafRef.current);
          setAmplitude(0);
          bufferSourceRef.current = null;
        };
        source.onended = () => {
          cleanup();
          resolve();
        };
        try {
          source.start(0);
          poll();
        } catch (e) {
          cleanup();
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      });
    },
    [stop],
  );

  // Plays audio blob and pumps amplitude 0–1 each frame.
  const playWithAmplitude = useCallback(async (blob: Blob): Promise<void> => {
    stop();

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    try {
      (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    } catch {
      /* */
    }
    audio.setAttribute('playsinline', '');
    audioRef.current = audio;

    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!contextRef.current || contextRef.current.state === 'closed') {
      contextRef.current = new Ctor();
    }
    const ctx = contextRef.current;
    if (ctx.state === 'suspended') void ctx.resume();

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.55;
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    const poll = () => {
      if (!analyserRef.current || !dataRef.current) return;
      analyserRef.current.getByteFrequencyData(dataRef.current);
      const avg = dataRef.current.reduce((a, b) => a + b, 0) / dataRef.current.length;
      setAmplitude(avg / 128);
      rafRef.current = requestAnimationFrame(poll);
    };

    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        cancelAnimationFrame(rafRef.current);
        setAmplitude(0);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onended = () => {
        cleanup();
        resolve();
      };
      audio.onerror = () => {
        cleanup();
        reject(new Error('Audio playback error'));
      };
      // Start the analyser loop immediately; relying only on `onplay` can miss the first
      // Human Mode entry after `await fetch` (Safari still plays audio but jaw stays flat).
      poll();
      audio.play().catch((e) => {
        cleanup();
        reject(e instanceof Error ? e : new Error(String(e)));
      });
    });
  }, [stop]);

  return { amplitude, playWithAmplitude, playBufferWithAmplitude, stop, unlockAudioFromUI };
}
