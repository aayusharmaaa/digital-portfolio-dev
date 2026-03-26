'use client';

import { useCallback, useRef } from 'react';

// A lightweight hook that generates synthesized sounds using the Web Audio API
// so you don't need to load heavy external MP3/WAV files.
export function useSoundEffects() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  };

  const playTone = useCallback((frequency: number, type: OscillatorType, duration: number, vol = 0.1, fadeOut = true) => {
    try {
      const ctx = getContext();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(vol, ctx.currentTime);
      if (fadeOut) {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore if user hasn't interacted with page yet or audio is broken
    }
  }, []);

  const playHover = useCallback(() => {
    // A very tiny, quiet, short click for when mousing over buttons
    playTone(1200, 'sine', 0.05, 0.02);
  }, [playTone]);

  const playClick = useCallback(() => {
    // A crisp robotic click for pressing buttons
    playTone(600, 'square', 0.08, 0.04);
  }, [playTone]);

  const playToggleOn = useCallback(() => {
    // An ascending double beep for turning Human Mode ON
    playTone(400, 'sine', 0.1, 0.05, false);
    setTimeout(() => playTone(600, 'sine', 0.15, 0.05), 100);
  }, [playTone]);

  const playToggleOff = useCallback(() => {
    // A descending double beep for turning Human Mode OFF
    playTone(600, 'sine', 0.1, 0.05, false);
    setTimeout(() => playTone(400, 'sine', 0.15, 0.05), 100);
  }, [playTone]);
  
  const playType = useCallback(() => {
    // A muted key-press sound
    playTone(150 + Math.random() * 50, 'square', 0.03, 0.015);
  }, [playTone]);

  return { playHover, playClick, playToggleOn, playToggleOff, playType };
}
