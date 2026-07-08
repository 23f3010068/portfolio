'use client';

/**
 * DIMENSION 07 — CLASSIFIED ARCHIVE (Hidden Easter Egg)
 * Route: /archive
 * Accent: Fluctuating / Variable
 * NOT linked from primary navigation — discoverable only by URL.
 */

import { useEffect, useState, useRef } from 'react';
import { DimensionLink } from '@/components/DimensionLink';

export default function ArchivePage() {
  const [glitchActive, setGlitchActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeTextRef = useRef<HTMLSpanElement>(null);
  const decayTextRef = useRef<HTMLSpanElement>(null);

  // Fluctuating accent color and timer via DOM
  useEffect(() => {
    const start = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const elapsed = Math.floor((now - start) / 1000);
      const decay = Math.min(elapsed / 300, 1);
      
      if (containerRef.current) {
        containerRef.current.style.setProperty('--archive-hue', String(elapsed % 360));
        containerRef.current.style.setProperty('--archive-decay', String(decay));
      }
      if (timeTextRef.current) timeTextRef.current.innerText = String(elapsed);
      if (decayTextRef.current) decayTextRef.current.innerText = String(Math.floor(decay * 100));
      
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Random glitch bursts
  useEffect(() => {
    const trigger = () => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200 + Math.random() * 400);
    };
    const interval = setInterval(trigger, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  const accent = `hsl(var(--archive-hue, 0), 80%, 55%)`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col justify-center px-8 md:px-16"
      style={{
        zIndex: 10,
        filter: glitchActive ? `hue-rotate(${Math.random() * 180}deg) saturate(2)` : 'none',
        transition: glitchActive ? 'none' : 'filter 0.3s ease',
      }}
      role="main"
      aria-label="Classified Archive — Hidden Dimension"
    >
      {/* Discovery acknowledgment */}
      <div className="mb-12">
        <p className="text-meta mb-3" style={{ color: accent }}>
          CLASSIFIED NODE // ACCESS RESTRICTED
        </p>
        <h1
          className="text-signal-xl"
          style={{
            color: '#ffffff',
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            opacity: 'calc(1 - var(--archive-decay, 0) * 0.3)',
          }}
        >
          YOU FOUND
          <br />
          <span style={{ color: accent }}>THE ARCHIVE</span>
        </h1>
        <p className="text-label mt-4" style={{ color: accent }}>
          REWARD CURIOSITY.
        </p>
      </div>

      {/* Archive contents */}
      <div
        className="mb-12 p-6 max-w-2xl"
        style={{
          border: `1px solid ${accent}44`,
          background: `${accent}05`,
          opacity: 'calc(1 - var(--archive-decay, 0) * 0.2)',
        }}
      >
        <p className="text-meta mb-4" style={{ color: accent }}>
          CONTAINS:
        </p>
        {[
          'UNFINISHED SYSTEM PROTOTYPES',
          'DISCARDED WORKFLOW ALGORITHMS',
          'SYSTEM WORKLOGS',
          'INTERACTIVE SANDBOX BUILDS',
        ].map((item) => (
          <p key={item} className="text-label mb-2 flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ color: accent }}>▸</span> {item}
          </p>
        ))}
      </div>

      {/* Decay timer */}
      <div className="mb-8">
        <p className="text-meta" style={{ color: 'rgba(255,255,255,0.2)' }}>
          TEMPORAL DEGRADATION: <span ref={decayTextRef}>0</span>% // TIME IN ARCHIVE: <span ref={timeTextRef}>0</span>s
        </p>
        <div
          className="mt-2 h-px"
          style={{
            width: `calc(var(--archive-decay, 0) * 100%)`,
            background: accent,
            transition: 'width 0.1s linear',
          }}
          role="progressbar"
          aria-label="Archive decay level"
        />
      </div>

      {/* Glitch text */}
      {glitchActive && (
        <div className="mb-8" aria-hidden="true">
          <p className="text-meta" style={{ color: accent, fontFamily: 'monospace' }}>
            {Array.from({ length: 3 }, () =>
              Array.from({ length: 32 }, () =>
                Math.random() > 0.5 ? '1' : '0'
              ).join('')
            ).join('\n')}
          </p>
        </div>
      )}

      <DimensionLink to="core">← RETURN TO SYSTEM CORE</DimensionLink>

      {/* Screen-reader content */}
      <div className="sr-only">
        <p>You have discovered the hidden Classified Archive dimension. This section contains experimental prototypes and sandbox builds.</p>
      </div>
    </div>
  );
}
