'use client';

/**
 * DIMENSION 04 — THE SIGNAL ARCHIVE
 * Route: /signal
 * Accent: Pure Electric Blue #2563EB
 *
 * Research publications, skills matrix, fellowship.
 * SDF-style typography treatment via CSS.
 */

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { DimensionLink } from '@/components/DimensionLink';

const ACCENT = '#2563EB';

const SKILLS = [
  {
    domain: 'CORE ARCHITECTURES',
    items: ['Java', 'Python', 'C++', 'SQL', 'MATLAB', 'GLSL / WGSL'],
  },
  {
    domain: 'MODELING FRAMEWORKS',
    items: ['scikit-learn', 'TensorFlow', 'PyTorch', 'Graph Neural Networks (GNN)', 'Generative Adversarial Networks (GAN)'],
  },
  {
    domain: 'CLOUD & GENAI INFRASTRUCTURE',
    items: ['Azure ML', 'IBM Cloud', 'Docker', 'RAG Pipelines', 'LangChain', 'Flask', 'Streamlit'],
  },
  {
    domain: 'RESEARCH & SIGNAL PROCESSING',
    items: ['ECG Signal Analysis', 'Attention Mechanisms', 'Domain-Informed Loss Design', 'GPGPU Compute', 'WebGPU / WebGL2'],
  },
];

export default function SignalPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const lenis = new Lenis({
      wrapper: scrollRef.current,
      content: scrollRef.current.firstElementChild as HTMLElement,
      lerp: 0.09,
      smoothWheel: true,
    });
    let rafId: number;
    const raf = (t: number) => { lenis.raf(t); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="dimension-scroll"
      role="main"
      aria-label="Signal Archive — Research and Skills"
    >
      <div className="min-h-screen px-8 md:px-16 lg:px-24 py-24">

        {/* Header */}
        <div className="mb-20">
          <p className="text-label mb-3 fade-in-1" style={{ color: ACCENT }}>
            DIMENSION_04 // THE SIGNAL ARCHIVE
          </p>
          <h1
            className="text-signal-xl fade-in-2"
            style={{
              color: '#ffffff',
              /* SDF-style: sharp, high-contrast, no anti-aliasing blur */
              WebkitFontSmoothing: 'none',
              textRendering: 'geometricPrecision',
            }}
          >
            THE
            <br />
            <span style={{ color: ACCENT }}>SIGNAL</span>
          </h1>
        </div>

        {/* Research section */}
        <section className="mb-24" aria-labelledby="research-heading">
          <p className="text-label mb-6" style={{ color: ACCENT }}>
            CURRENT SCHOLARLY DISPATCH
          </p>
          <h2 id="research-heading" className="sr-only">Research Publications</h2>

          <article
            className="p-6 mb-8"
            style={{ border: `1px solid ${ACCENT}33`, background: `${ACCENT}08` }}
            aria-labelledby="pcsa-heading"
          >
            <p className="text-meta mb-2" style={{ color: ACCENT }}>
              MANUSCRIPT // UNDER REVISION
            </p>
            <h3
              id="pcsa-heading"
              className="text-signal mb-3"
              style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: '#ffffff', letterSpacing: '0.1em' }}
            >
              PCSA-UNet: Physiologically Constrained Attention for Fetal ECG Detection
            </h3>
            <p className="text-label mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              IEEE Transactions on Instrumentation and Measurement (TIM) — Active Revision
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { label: 'PARAMETERS', value: '2.48M' },
                { label: 'F1-SCORE', value: '99.91%' },
                { label: 'DOMAIN', value: 'IIT Mandi DL Lab' },
                { label: 'STATUS', value: 'Under Revision' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-meta" style={{ color: ACCENT }}>{stat.label}</p>
                  <p className="text-label mt-1" style={{ color: '#ffffff' }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </article>

          {/* Fellowship */}
          <article
            className="p-6"
            style={{ border: `1px solid ${ACCENT}22` }}
            aria-labelledby="fellowship-heading"
          >
            <p className="text-meta mb-2" style={{ color: ACCENT }}>
              FELLOWSHIP // ACTIVE
            </p>
            <h3
              id="fellowship-heading"
              className="text-signal mb-2"
              style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.2rem)', color: '#ffffff', letterSpacing: '0.1em' }}
            >
              IISPR Data Science Fellowship — Research Intern
            </h3>
            <p className="text-label" style={{ color: 'rgba(255,255,255,0.5)' }}>
              July 2025 – October 2025
            </p>
          </article>
        </section>

        {/* Skills matrix */}
        <section aria-labelledby="skills-heading">
          <p className="text-label mb-6" style={{ color: ACCENT }}>
            SYSTEM SPECIALIZATIONS VECTOR MATRIX
          </p>
          <h2 id="skills-heading" className="sr-only">Technical Skills</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SKILLS.map((group) => (
              <div
                key={group.domain}
                className="p-5"
                style={{ border: `1px solid rgba(255,255,255,0.07)` }}
              >
                <p className="text-meta mb-4" style={{ color: ACCENT }}>
                  {group.domain}
                </p>
                <ul className="flex flex-col gap-2" aria-label={group.domain}>
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="text-label flex items-center gap-3"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      <span style={{ color: ACCENT, opacity: 0.5 }}>▸</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-8 mt-20 pb-16">
          <DimensionLink to="lab">← THE LABORATORY</DimensionLink>
          <DimensionLink to="eye">THE EYE →</DimensionLink>
        </div>
      </div>
    </div>
  );
}
