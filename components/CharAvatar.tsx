'use client';

import { useEffect, useRef } from 'react';

interface CharAvatarProps {
  amplitude: number; // 0–1 real-time audio amplitude from analyser
  photoUrl?: string;
}

const DENSE_CHARS = 'AAYUSHXOVMNWB80DQ@%#';
const SPARSE_CHARS = 'xvyuo01ilt;:.  ';
const ALL_CHARS = DENSE_CHARS + SPARSE_CHARS;
const BINARY = '01';

export default function CharAvatar({ amplitude, photoUrl }: CharAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const pixelDataRef = useRef<Float32Array | null>(null);
  const amplitudeRef = useRef(0);

  // Keep amplitude ref in sync without re-running effects
  useEffect(() => {
    amplitudeRef.current = amplitude;
  }, [amplitude]);

  // Sample photo brightness into grid once
  useEffect(() => {
    const COLS = 80, ROWS = 60;

    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = COLS; offscreen.height = ROWS;
        const octx = offscreen.getContext('2d')!;
        octx.drawImage(img, 0, 0, COLS, ROWS);
        const imageData = octx.getImageData(0, 0, COLS, ROWS);
        const brightness = new Float32Array(COLS * ROWS);
        for (let i = 0; i < COLS * ROWS; i++) {
          const r = imageData.data[i * 4];
          const g = imageData.data[i * 4 + 1];
          const b = imageData.data[i * 4 + 2];
          brightness[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        }
        pixelDataRef.current = brightness;
      };
      img.src = photoUrl;
    } else {
      // Geometric fallback silhouette
      const brightness = new Float32Array(COLS * ROWS);
      const cx = COLS / 2, cy = ROWS * 0.36;
      const rx = COLS * 0.20, ry = ROWS * 0.26;
      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const dx = (col - cx) / rx;
          const dy = (row - cy) / ry;
          const d = dx * dx + dy * dy;
          let val = 0;
          if (d < 1.0) {
            val = 0.45 + (1 - d) * 0.5;
            if (dy < -0.4) val = 0.55 + Math.random() * 0.2;
          }
          const neckDx = Math.abs(col - cx) / (COLS * 0.06);
          if (neckDx < 1 && row > ROWS * 0.63 && row < ROWS * 0.76) val = 0.5;
          if (row > ROWS * 0.70) {
            const sd = Math.pow((col - cx) / (COLS * 0.46), 2) + Math.pow((row - ROWS * 0.72) / (ROWS * 0.30), 2);
            if (sd < 1.0) val = Math.max(val, 0.35 + (1 - sd) * 0.3);
          }
          brightness[row * COLS + col] = val * (0.88 + Math.random() * 0.12);
        }
      }
      pixelDataRef.current = brightness;
    }
  }, [photoUrl]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const COLS = 80, ROWS = 60;
    const CW = canvas.width / COLS;
    const CH = canvas.height / ROWS;

    const chars: string[] = Array.from({ length: COLS * ROWS }, () =>
      Math.random() < 0.6
        ? BINARY[Math.floor(Math.random() * 2)]
        : ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)]
    );
    const phases = Float32Array.from({ length: COLS * ROWS }, () => Math.random() * Math.PI * 2);
    let t = 0;

    function draw() {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.018;

      const amp = amplitudeRef.current; // 0–1 real audio amplitude
      const data = pixelDataRef.current;

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const idx = row * COLS + col;
          const brightness = data ? data[idx] : 0;
          if (brightness < 0.08) continue;

          // Mouth zone: lower-center of the face
          const isMouth =
            row > ROWS * 0.50 && row < ROWS * 0.62 &&
            col > COLS * 0.32 && col < COLS * 0.68;

          // Scramble rate: idle ~1% / talking scales with real amplitude
          const scrambleRate = isMouth
            ? 0.01 + amp * 0.7        // mouth scrambles hard with amplitude
            : 0.012;

          if (Math.random() < scrambleRate) {
            const charIdx = Math.floor((1 - brightness) * (ALL_CHARS.length - 1));
            chars[idx] = Math.random() < 0.5
              ? BINARY[Math.floor(Math.random() * 2)]
              : ALL_CHARS[Math.max(0, Math.min(ALL_CHARS.length - 1,
                  charIdx + Math.floor(Math.random() * 4 - 2)))];
          }

          // Alpha: base brightness + idle float
          let alpha = brightness + Math.sin(t * 0.8 + phases[idx]) * 0.04;

          // Mouth alpha pulses with amplitude
          if (isMouth && amp > 0.05) {
            alpha = 0.25 + amp * 0.75 + Math.sin(t * 12 + phases[idx]) * amp * 0.15;
          }

          // Rare full-avatar glitch
          if (Math.random() < 0.0004) alpha = Math.random();

          alpha = Math.max(0, Math.min(1, alpha));
          if (alpha < 0.05) continue;

          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ffffff';
          ctx.font = `${Math.floor(CW * 0.9)}px "Courier New", monospace`;
          ctx.fillText(chars[idx], col * CW, (row + 1) * CH - 2);
        }
      }

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(draw);
    }

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []); // only runs once — amplitude is read via ref each frame

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={420}
      className="w-full h-full object-contain"
    />
  );
}
