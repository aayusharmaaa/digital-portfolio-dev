'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    const onMouseMove = (e: MouseEvent) => {
      // Hide cursor if we detect touch or if display is small
      if (window.matchMedia('(pointer: coarse)').matches) {
        if (dotRef.current) dotRef.current.style.display = 'none';
        if (ringRef.current) ringRef.current.style.display = 'none';
        return;
      }
      
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = `${mouseX - 4}px`;
        dotRef.current.style.top = `${mouseY - 4}px`;
      }
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = `${ringX - 16}px`;
        ringRef.current.style.top = `${ringY - 16}px`;
      }
      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    animate();
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
