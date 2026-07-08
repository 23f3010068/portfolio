'use client';

/**
 * DIMENSION 05 — THE EYE (Photography Museum)
 * Route: /eye
 * Accent: Muted Crimson #DC2626 / Amber #D97706
 */

import { useState } from 'react';
import { DimensionLink } from '@/components/DimensionLink';
import { DepthParallaxPhoto } from '@/components/DepthParallaxPhoto';
import { EYE_ARCHIVE } from '@/lib/eye-archive';

const ACCENT = '#DC2626';
const ACCENT_ALT = '#D97706';

export default function EyePage() {
  const [active, setActive] = useState(0);
  const arch = EYE_ARCHIVE[active];

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 10 }} role="main" aria-label="The Eye — Photography Archive">
      <div className="px-8 md:px-16 pt-16 pb-8 shrink-0">
        <p className="text-label mb-2" style={{ color: ACCENT }}>DIMENSION_05 // THE EYE</p>
        <h1 className="text-signal-xl" style={{ color: '#ffffff', fontSize: 'clamp(2rem, 6vw, 4rem)' }}>
          THE <span style={{ color: ACCENT }}>EYE</span>
        </h1>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <nav
          className="flex flex-row md:flex-col gap-0 md:w-72 shrink-0 border-b md:border-b-0 md:border-r overflow-x-auto md:overflow-x-visible"
          style={{ borderColor: `${ACCENT}22` }}
          aria-label="Photography categories"
        >
          {EYE_ARCHIVE.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(i)}
              className="text-left px-6 py-5 transition-all duration-300 shrink-0"
              style={{
                border: 'none',
                borderLeft: `2px solid ${i === active ? ACCENT : 'transparent'}`,
                background: i === active ? `${ACCENT}08` : 'transparent',
                color: i === active ? '#ffffff' : 'rgba(255,255,255,0.35)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
              aria-current={i === active ? 'true' : undefined}
            >
              <p style={{ color: i === active ? ACCENT : 'rgba(255,255,255,0.2)', fontSize: '0.55rem', marginBottom: '4px' }}>
                {item.node}
              </p>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-16 overflow-y-auto" aria-live="polite" aria-atomic="true">
          <div className="w-full max-w-4xl">
            <p className="text-meta mb-4" style={{ color: ACCENT }}>{arch.node}</p>
            <h2 className="text-signal mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#ffffff', letterSpacing: '0.2em' }}>
              {arch.label}
            </h2>
            <p className="text-label mb-6" style={{ color: ACCENT_ALT }}>{arch.sub}</p>

            <DepthParallaxPhoto
              key={arch.id}
              colorSrc={arch.colorSrc}
              depthSrc={arch.depthSrc}
              alt={`Photography: ${arch.label}`}
            />
            <p className="text-meta mt-3 text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
              MOVE CURSOR TO EXPLORE DEPTH — REPLACE IMAGES IN public/assets/eye/
            </p>

            {arch.epigraph && (
              <p className="text-label italic mt-8 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                &ldquo;{arch.epigraph}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-8 px-8 md:px-16 py-6 shrink-0" style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>
        <DimensionLink to="signal">← THE SIGNAL</DimensionLink>
        <DimensionLink to="vision">THE VISION →</DimensionLink>
      </div>
    </div>
  );
}
