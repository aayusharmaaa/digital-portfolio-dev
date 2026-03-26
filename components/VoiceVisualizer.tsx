'use client';

import { useEffect, useRef } from 'react';

interface Props {
  amplitude: number;
  isListening?: boolean;
  isSpeaking?: boolean;
}

export default function VoiceVisualizer({ amplitude, isListening, isSpeaking }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const barsRef = useRef<number[]>(new Array(32).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const bars = barsRef.current;
      const barCount = bars.length;
      const gap = 3;
      const barWidth = (w - (barCount - 1) * gap) / barCount;
      const centerY = h / 2;

      for (let i = 0; i < barCount; i++) {
        // Create organic wave pattern from amplitude
        const phase = Date.now() * 0.003 + i * 0.4;
        const wave = Math.sin(phase) * 0.3 + Math.cos(phase * 1.7) * 0.2;
        const target = amplitude * (0.5 + wave + Math.random() * 0.3);
        bars[i] += (target - bars[i]) * 0.15;

        const barHeight = Math.max(2, bars[i] * (h * 0.8));
        const x = i * (barWidth + gap);

        // Color based on state
        let color = 'rgba(255, 255, 255, 0.15)';
        if (isSpeaking) {
          const alpha = 0.3 + bars[i] * 0.7;
          color = `rgba(255, 255, 255, ${alpha})`;
        } else if (isListening) {
          const alpha = 0.2 + bars[i] * 0.6;
          color = `rgba(120, 200, 255, ${alpha})`;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [amplitude, isListening, isSpeaking]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
