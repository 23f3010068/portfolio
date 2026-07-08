'use client';

import { useState, useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>';

export function GlitchText({ text, delay = 0, duration = 1000 }: { text: string, delay?: number, duration?: number }) {
  const [output, setOutput] = useState(text.split('').map(c => c === ' ' ? ' ' : CHARS[Math.floor(Math.random() * CHARS.length)]).join(''));
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    let startTime: number;

    const tick = () => {
      const now = performance.now();
      const progress = Math.min(1, (now - startTime) / duration);
      
      let next = '';
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          next += ' ';
          continue;
        }
        // reveal character if progress past threshold for this char
        if (progress > i / text.length) {
          next += text[i];
        } else {
          next += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }
      
      setOutput(next);
      
      if (progress === 1) {
        clearInterval(interval);
        setDone(true);
      }
    };

    timeout = setTimeout(() => {
      startTime = performance.now();
      interval = setInterval(tick, 30);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, delay, duration]);

  return <span className={`inline-block ${done ? '' : 'text-emerald-500/80 drop-shadow-[0_0_10px_rgba(5,150,105,0.8)]'}`}>{output}</span>;
}
