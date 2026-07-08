'use client';

/**
 * DIMENSION 06 — FUTURE MANIFESTO
 * Route: /vision
 * Accent: Soft White + Metallic Gold #FBBF24
 */

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { DimensionLink } from '@/components/DimensionLink';
import { GlitchText } from '@/components/GlitchText';

const ACCENT = '#FBBF24';

const PILLARS = [
  {
    index: 'I',
    title: 'CIVILIZATION-SCALE ARCHITECTURE',
    body: 'Moving beyond short-term software updates to construct reliable, scalable infrastructure capable of serving billions of cognitive queries. Systems that outlast their creators.',
  },
  {
    index: 'II',
    title: 'HUMAN-MACHINE COGNITION',
    body: 'Structuring advanced artificial systems not to replace human insight, but to serve as seamless extensions of human intent and philosophical discovery. Intelligence as amplification.',
  },
  {
    index: 'III',
    title: 'INTENTIONAL ENGINEERING',
    body: 'Rejecting basic hype cycles to focus energy on solving deep statistical limits, improving data grounding, and engineering meaningful technological progress. Depth over velocity.',
  },
];

export default function VisionPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const lenis = new Lenis({ wrapper: scrollRef.current, content: scrollRef.current.firstElementChild as HTMLElement, lerp: 0.09, smoothWheel: true });
    let rafId: number;
    const raf = (t: number) => { lenis.raf(t); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); };
  }, []);

  return (
    <div ref={scrollRef} className="dimension-scroll" role="main" aria-label="Future Manifesto" style={{ zIndex: 10 }}>
      <div className="min-h-screen py-24 content-bounds">
        <div className="mb-20">
          <p className="text-label mb-3 fade-in-1" style={{ color: ACCENT }}>DIMENSION_06 // FUTURE MANIFESTO</p>
          <h1 className="text-signal-xl fade-in-2" style={{ color: '#ffffff' }}>
            THE<br /><span style={{ color: ACCENT }}><GlitchText text="VISION" /></span>
          </h1>
          <p className="text-label mt-6 max-w-xl fade-in-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Three strategic pillars. A forward-looking declaration of intent from a systems engineer who builds for civilizational scale.
          </p>
        </div>

        <div className="flex flex-col gap-20 max-w-3xl">
          {PILLARS.map((pillar, i) => (
            <article
              key={pillar.index}
              className="fade-in"
              style={{ animationDelay: `${0.3 + i * 0.3}s` }}
              aria-labelledby={`pillar-${pillar.index}`}
            >
              <div className="flex items-start gap-6 mb-4">
                <span className="text-signal-lg shrink-0" style={{ color: ACCENT, fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1 }}>{pillar.index}</span>
                <h2 id={`pillar-${pillar.index}`} className="text-signal" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', color: '#ffffff', letterSpacing: '0.15em', paddingTop: '0.5rem' }}>
                  {pillar.title}
                </h2>
              </div>
              <p className="text-label leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '60ch', lineHeight: '1.9', paddingLeft: 'calc(clamp(2rem, 5vw, 3.5rem) + 1.5rem)' }}>
                {pillar.body}
              </p>
            </article>
          ))}
        </div>

        <div className="flex gap-8 mt-20 pb-16">
          <DimensionLink to="eye">← THE EYE</DimensionLink>
          <DimensionLink to="terminal">COMM CORE →</DimensionLink>
        </div>
      </div>
    </div>
  );
}
