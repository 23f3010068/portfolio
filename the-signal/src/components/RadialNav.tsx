'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DIMENSIONS } from '@/lib/constants';

export function RadialNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dimensions = [
    { id: 'core', label: 'CORE', angle: -90 },
    { id: 'memory', label: 'MEMORY', angle: -30 },
    { id: 'lab', label: 'LAB', angle: 30 },
    { id: 'signal', label: 'SIGNAL', angle: 90 },
    { id: 'eye', label: 'THE EYE', angle: 150 },
    { id: 'vision', label: 'VISION', angle: 210 },
  ];

  const toggle = () => setOpen(!open);

  const navigate = (id: string) => {
    setOpen(false);
    router.push(`/${id}`);
  };

  return (
    <div 
      ref={navRef}
      className="fixed bottom-12 right-12 z-[100]"
      style={{ pointerEvents: 'auto' }}
      aria-label="Radial Navigation"
    >
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Arc Reactor Core Button */}
        <button
          onClick={toggle}
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500"
          style={{
            background: 'rgba(0,0,0,0.8)',
            border: `2px solid ${open ? '#059669' : 'rgba(255,255,255,0.2)'}`,
            boxShadow: open ? '0 0 20px rgba(5,150,105,0.5), inset 0 0 15px rgba(5,150,105,0.5)' : 'none',
          }}
        >
          <div className="w-8 h-8 rounded-full border border-white opacity-50 flex items-center justify-center">
            <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${open ? 'scale-150' : 'scale-100'}`} style={{ boxShadow: open ? '0 0 10px white' : 'none' }} />
          </div>
        </button>

        {/* Orbiting Nodes */}
        {dimensions.map((dim, i) => {
          const radius = 120;
          const rad = (dim.angle * Math.PI) / 180;
          const x = open ? Math.cos(rad) * radius : 0;
          const y = open ? Math.sin(rad) * radius : 0;
          const cfg = DIMENSIONS[dim.id as keyof typeof DIMENSIONS];
          const color = cfg?.accentColor || '#059669';

          return (
            <button
              key={dim.id}
              onClick={() => navigate(dim.id)}
              className="absolute w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{
                transform: `translate(${x}px, ${y}px) scale(${open ? 1 : 0})`,
                opacity: open ? 1 : 0,
                transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.05}s`,
                background: 'rgba(0,0,0,0.9)',
                border: `1px solid ${color}`,
                color: '#fff',
                textShadow: `0 0 5px ${color}`,
                boxShadow: `0 0 10px ${color}33`,
                fontFamily: 'var(--font-mono)'
              }}
            >
              <span className="absolute -top-6 whitespace-nowrap opacity-60 uppercase tracking-widest">{dim.label}</span>
              {String(i + 1).padStart(2, '0')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
