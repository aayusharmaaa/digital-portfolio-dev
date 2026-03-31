'use client';

import { useEffect, useState } from 'react';
import { useSoundEffects } from '@/lib/useSoundEffects';

interface Props {
  show: boolean;
}

export default function GreetingBubbles({ show }: Props) {
  const [bubbles, setBubbles] = useState<{ id: number; text: string; delay: number; top: string; left: string; rotate: string }[]>([]);
  const { playClick } = useSoundEffects();

  useEffect(() => {
    if (show) {
      // Different bubbles appearing at different times during the greeting
      const bubbleItems = [
        { id: 1, text: "HEY, I'M HIS 3D CLONE!", delay: 0.1, style: { top: '15%', left: '0%' }, rotate: '-4deg', tailPos: { bottom: '-8px', right: '25px', transform: 'skewX(20deg) rotate(25deg)', borderRadius: '0', borderBottomRightRadius: '2px' } },
        { id: 2, text: "FEEL FREE TO ASK ME ANYTHING", delay: 1.5, style: { top: '22%', right: '2%' }, rotate: '4deg', tailPos: { bottom: '-8px', left: '25px', transform: 'skewX(-20deg) rotate(-25deg)', borderRadius: '0', borderBottomLeftRadius: '2px' } },
        { id: 3, text: "WANT TO TALK FOR REAL?", delay: 3.0, style: { bottom: '25%', left: '2%' }, rotate: '-3deg', tailPos: { top: '-8px', right: '25px', transform: 'scaleY(-1) skewX(-20deg) rotate(-25deg)', borderRadius: '0', borderBottomLeftRadius: '2px' } },
        { id: 4, text: "TURN ON THE HUMAN MODE!", delay: 4.5, style: { bottom: '15%', right: '2%' }, rotate: '3deg', tailPos: { top: '-8px', left: '25px', transform: 'scaleY(-1) skewX(20deg) rotate(25deg)', borderRadius: '0', borderBottomRightRadius: '2px' } },
      ];
      setBubbles(bubbleItems as any);

      // Play a sound for each bubble as it appears
      bubbleItems.forEach((b) => {
        setTimeout(() => {
          playClick();
        }, b.delay * 1000);
      });

      // Optionally clear them after some time, or let them stay until user interacts
      const t = setTimeout(() => {
        setBubbles([]);
      }, 11000);

      return () => clearTimeout(t);
    } else {
      setBubbles([]);
    }
  }, [show, playClick]);

  if (!show || bubbles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {bubbles.map((b: any) => (
        <div
          key={b.id}
          className="absolute flex flex-col items-center"
          style={{
            ...b.style,
            transform: `rotate(${b.rotate}) scale(0)`,
            animation: `pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <div 
            className="bg-white text-black px-3.5 py-2.5 z-10 relative drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '10px',
              border: '3px solid black',
              borderRadius: '4px',
              boxShadow: 'inset -2px -2px 0px 0px rgba(0,0,0,0.1)'
            }}
          >
            {b.text}
            <div 
              className="absolute w-3 h-3 bg-white border-b-[3px] border-l-[3px] border-black z-0 drop-shadow-[2px_2px_0_rgba(0,0,0,1)]"
              style={b.tailPos}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
