'use client';

/**
 * DIMENSION 02 — THE MEMORY ARCHIVE
 * Route: /memory
 * Accent: Adaptive Monochrome + Amber #D97706
 *
 * Education timeline, intellectual obsessions, human inspirations.
 * Parallax depth field of floating text fragments.
 */

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { DimensionLink } from '@/components/DimensionLink';

const ACCENT = '#D97706';

const FRAGMENTS = [
  {
    id: 'origins',
    label: 'FRAGMENT_01 // ORIGINS',
    title: 'MUMBAI CORE',
    body: 'Initializing logical frameworks. B.E. in Computer Engineering at Mumbai University (GPA: 7.4/10). Forging structural foundations in foundational systems, high-level code compilation, and database design.',
    depth: 1,
  },
  {
    id: 'evolution',
    label: 'FRAGMENT_02 // EVOLUTION',
    title: 'IIT MADRAS FIELD',
    body: 'Pursuing B.S. in Data Science and Applications. Academic Standing: GPA 7.75/10. Accelerating at the intersection of statistical learning theory, data models, and enterprise-grade deployment metrics.',
    depth: 2,
  },
  {
    id: 'obsessions',
    label: 'FRAGMENT_03 // MIND OBSESSIONS',
    title: 'INTELLECTUAL VECTORS',
    body: 'Deep learning paradigms. Complex neural frameworks. Generative Adversarial Networks (GANs). Graph structures. Exploring the intricate boundary lines where physical systems convert into mathematical intelligence vectors.',
    depth: 1.5,
  },
  {
    id: 'human',
    label: 'FRAGMENT_04 // HUMAN ELEMENTS',
    title: 'INSPIRATION ARCHIVE',
    body: 'Driven by the emotional weight of modern cinematic storytelling, deep anime visual framing, the stillness of sunsets, and the structural beauty of high-performance racing machines. Seeking convergence of absolute technological power and deep human awareness.',
    depth: 2.5,
  },
];

export default function MemoryPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;

    lenisRef.current = new Lenis({
      wrapper: scrollRef.current,
      content: scrollRef.current.firstElementChild as HTMLElement,
      lerp: 0.09, // deceleration coefficient 0.06–0.12
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenisRef.current?.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="dimension-scroll"
      role="main"
      aria-label="Memory Archive — Education and Inspirations"
    >
      <div className="min-h-screen px-8 md:px-16 lg:px-24 py-24">

        {/* Header */}
        <div className="mb-20">
          <p className="text-label mb-3 fade-in-1" style={{ color: ACCENT }}>
            DIMENSION_02 // MEMORY ARCHIVE
          </p>
          <h1 className="text-signal-xl fade-in-2" style={{ color: '#ffffff' }}>
            MEMORY
            <br />
            <span style={{ color: ACCENT }}>ARCHIVE</span>
          </h1>
          <p className="text-label mt-6 max-w-xl fade-in-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Suspended thought fragments. Shards of origin, evolution, and the forces that shaped the cognitive architecture.
          </p>
        </div>

        {/* Fragment grid */}
        <div className="flex flex-col gap-24 max-w-4xl">
          {FRAGMENTS.map((frag, i) => (
            <article
              key={frag.id}
              className="fade-in"
              style={{
                animationDelay: `${0.3 + i * 0.2}s`,
                paddingLeft: `${(frag.depth - 1) * 2}rem`,
                borderLeft: `1px solid ${ACCENT}22`,
              }}
              aria-labelledby={`frag-title-${frag.id}`}
            >
              <p className="text-meta mb-2" style={{ color: ACCENT }}>
                {frag.label}
              </p>
              <h2
                id={`frag-title-${frag.id}`}
                className="text-signal mb-4"
                style={{ fontSize: 'clamp(1rem, 2vw, 1.4rem)', color: '#ffffff', letterSpacing: '0.15em' }}
              >
                {frag.title}
              </h2>
              <p
                className="text-label leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '60ch', lineHeight: '1.8' }}
              >
                {frag.body}
              </p>
            </article>
          ))}
        </div>

        {/* Education table — accessible structured data */}
        <section className="mt-32 mb-20" aria-labelledby="education-heading">
          <p className="text-label mb-6" style={{ color: ACCENT }}>
            ACADEMIC COORDINATES
          </p>
          <h2 id="education-heading" className="sr-only">Education</h2>
          <table
            className="w-full max-w-3xl"
            style={{ borderCollapse: 'collapse' }}
            aria-label="Academic qualifications"
          >
            <thead>
              <tr>
                {['INSTITUTION', 'DEGREE', 'FIELD', 'GPA'].map((h) => (
                  <th
                    key={h}
                    className="text-meta text-left pb-4 pr-8"
                    style={{ color: 'rgba(255,255,255,0.3)', borderBottom: `1px solid ${ACCENT}33` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { inst: 'Mumbai University', deg: 'B.E.', field: 'Computer Engineering', gpa: '7.4 / 10' },
                { inst: 'IIT Madras', deg: 'B.S.', field: 'Data Science & Applications', gpa: '7.75 / 10' },
              ].map((row, i) => (
                <tr key={i}>
                  {[row.inst, row.deg, row.field, row.gpa].map((cell, j) => (
                    <td
                      key={j}
                      className="text-label py-4 pr-8"
                      style={{ color: j === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)', borderBottom: `1px solid rgba(255,255,255,0.05)` }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Navigation footer */}
        <div className="flex gap-8 mt-16 pb-16">
          <DimensionLink to="core">← SYSTEM CORE</DimensionLink>
          <DimensionLink to="lab">THE LABORATORY →</DimensionLink>
        </div>
      </div>
    </div>
  );
}
