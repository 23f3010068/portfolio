'use client';

/**
 * DIMENSION 01 — THE SYSTEM CORE
 * Route: /core
 * Accent: Deep Emerald #059669
 *
 * Identity hub. Navigation to all other dimensions.
 */

import { DimensionLink } from '@/components/DimensionLink';
import { GlitchText } from '@/components/GlitchText';

const NAV_ITEMS = [
  { to: 'memory' as const, index: '01', label: 'MEMORY_ARCHIVE' },
  { to: 'lab' as const, index: '02', label: 'THE_LABORATORY' },
  { to: 'signal' as const, index: '03', label: 'THE_SIGNAL' },
  { to: 'eye' as const, index: '04', label: 'THE_EYE' },
  { to: 'vision' as const, index: '05', label: 'THE_VISION' },
];

export default function CorePage() {
  return (
    <div
      className="fixed inset-0 flex flex-col justify-center content-bounds"
      style={{ zIndex: 10 }}
      role="main"
      aria-label="System Core — Portfolio Hub"
    >
      {/* Identity block */}
      <div className="mb-16 max-w-3xl">
        <p className="text-label mb-4 fade-in-1" style={{ color: '#059669' }}>
          <GlitchText text="SYSTEM CORE" /> // ACTIVE
        </p>

        <h1
          className="text-signal-xl mb-6 fade-in-2"
          style={{ color: '#ffffff' }}
          aria-label="Yashovardhan Thopte"
        >
          YASHOVARDHAN
          <br />
          THOPTE
        </h1>

        <p
          className="text-signal-lg fade-in-3"
          style={{ color: '#059669', fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}
        >
          ENGINEERING INTELLIGENCE BEYOND SYSTEMS.
        </p>

        <div className="mt-8 flex flex-col gap-2 fade-in-4">
          <p className="text-label" style={{ color: 'rgba(255,255,255,0.5)' }}>
            IDENTITY: Dual-Degree Scholar specialized in Artificial Intelligence, Deep Learning Frameworks, and Architectural System Optimization.
          </p>
          <p className="text-label" style={{ color: 'rgba(255,255,255,0.4)' }}>
            VECTORS: Computer Engineering (Mumbai University) × Data Science {"&"} Applications (IIT Madras)
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Dimension navigation"
        className="flex flex-col gap-4 fade-in-5"
      >
        {NAV_ITEMS.map((item) => (
          <DimensionLink key={item.to} to={item.to}>
            <span className="flex items-center gap-6">
              <span className="text-meta opacity-40">[{item.index} // {item.label}]</span>
              <span
                className="text-label"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                →
              </span>
            </span>
          </DimensionLink>
        ))}
        <div className="mt-8 pt-4" style={{ borderTop: '1px solid rgba(5,150,105,0.15)' }}>
          <DimensionLink to="terminal">
            <span className="text-meta opacity-40">[08 // COMMUNICATION_CORE]</span>
          </DimensionLink>
        </div>
      </nav>

      {/* Screen-reader accessible content */}
      <div className="sr-only">
        <h2>About Yashovardhan Thopte</h2>
        <p>
          Dual-degree scholar specializing in Artificial Intelligence, Deep Learning Frameworks,
          and Architectural System Optimization. Pursuing B.E. in Computer Engineering at Mumbai
          University and B.S. in Data Science and Applications at IIT Madras.
        </p>
        <nav aria-label="Portfolio sections">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <DimensionLink to={item.to}>{item.label}</DimensionLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
