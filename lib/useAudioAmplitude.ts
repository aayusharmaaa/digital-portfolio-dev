import { useRef, useState, useCallback } from 'react';

export function useAudioAmplitude() {
  const [amplitude, setAmplitude] = useState(0);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  // Keep explicit ArrayBuffer-backed typed array for TS 5.9+ lib.dom compatibility.
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = null;
    setAmplitude(0);
  }, []);

  // Plays audio blob and pumps amplitude 0–1 each frame.
  // Returns a promise that resolves when playback ENDS (not starts).
  const playWithAmplitude = useCallback(async (blob: Blob): Promise<void> => {
    stop();

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;

    // Audio context
    if (!contextRef.current || contextRef.current.state === 'closed') {
      contextRef.current = new AudioContext();
    }
    const ctx = contextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    // Analyser
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.55;
    analyserRef.current = analyser;
    dataRef.current = new Uint8Array(analyser.frequencyBinCount);

    // Connect: audio element → analyser → speakers
    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);

    // Poll amplitude each frame
    const poll = () => {
      if (!analyserRef.current || !dataRef.current) return;
      analyserRef.current.getByteFrequencyData(dataRef.current);
      const avg = dataRef.current.reduce((a, b) => a + b, 0) / dataRef.current.length;
      setAmplitude(avg / 128); // 0–1
      rafRef.current = requestAnimationFrame(poll);
    };

    // Return a promise that resolves when audio finishes
    return new Promise<void>((resolve) => {
      audio.onplay = () => poll();
      audio.onended = () => {
        cancelAnimationFrame(rafRef.current);
        setAmplitude(0);
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        cancelAnimationFrame(rafRef.current);
        setAmplitude(0);
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        resolve();
      });
    });
  }, [stop]);

  return { amplitude, playWithAmplitude, stop };
}
