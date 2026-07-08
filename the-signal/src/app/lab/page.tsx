'use client';

/**
 * DIMENSION 03 — THE LABORATORY
 * Route: /lab
 * Accent: Industrial Cold Cyan #06B6D4
 *
 * 5 experiment nodes. Project selector with vertex-morph transitions.
 * Each project has a unique particle shader variant.
 */

import { useState, useCallback, useEffect } from 'react';
import { DimensionLink } from '@/components/DimensionLink';
import { getAudioEngine } from '@/lib/audio-engine';
import { getRendererBridge } from '@/lib/renderer-bridge';
import type { LabShaderVariant } from '@/lib/types';

const ACCENT = '#06B6D4';

const PROJECTS = [
  {
    id: 'pcsa-unet',
    nodeId: 'EXPERIMENT NODE 01',
    title: 'PCSA-UNet',
    classification: 'Physiologically Constrained Attention Model for Fetal ECG Detection',
    domain: 'IIT Mandi Deep Learning Research Lab',
    stack: ['PyTorch', 'MATLAB', 'Custom Loss Design', 'Signal Processing'],
    metrics: '2.48M parameters · 99.91% F1-score on noisy abdominal recordings',
    innovation:
      'Reduced transformer attention complexity to near-logarithmic limits by encoding internal cardiac periodicity. Improving robustness against low SNR signals through domain-informed loss design. Under active revision at IEEE Transactions on Instrumentation and Measurement (TIM).',
    links: [],
    color: '#059669',
    shaderVariant: 'noisy-waveform' as const,
  },
  {
    id: 'valuripple',
    nodeId: 'EXPERIMENT NODE 02',
    title: 'ValuRipple',
    classification: 'Hybrid Temporal-Graph Framework for Profitability-Aware Churn Prediction',
    domain: 'IIM Ranchi Data Science Core',
    stack: ['Python', 'Graph Attention Networks', 'SMOTE', 'scikit-learn', 'XGBoost'],
    metrics: '0.91 F1 minority-class detection · Outperforms industry baselines',
    innovation:
      'Rebuilt churn tracking from accuracy-based targets into profitability-aware metrics by integrating customer lifetime value and retention costs. Implemented graph attention paths alongside generative data augmentation to resolve extreme data asymmetry.',
    links: [],
    color: '#06B6D4',
    shaderVariant: 'graph-network' as const,
  },
  {
    id: 'ai-compliance',
    nodeId: 'EXPERIMENT NODE 03',
    title: 'AI Regulatory Compliance Checker',
    classification: 'Retrieval-Augmented Contract Analysis & Verification Pipeline',
    domain: 'Independent Research',
    stack: ['Python', 'Streamlit', 'LangChain', 'RAG Engine', 'Slack API', 'Google Sheets'],
    metrics: 'Parses 45,000+ character documents in under 5 seconds',
    innovation:
      'Extracts granular clause-level risks and structural audit documentation from unstructured legal text. Automated downstream review loops via Slack arrays and Google Sheets architectures.',
    links: [],
    color: '#2563EB',
    shaderVariant: 'default' as const,
  },
  {
    id: 'krishirakshak',
    nodeId: 'EXPERIMENT NODE 04',
    title: 'KrishiRakshak',
    classification: 'Lightweight Crop Disease Computer Vision Classifier',
    domain: 'Edge AI Research',
    stack: ['EfficientNet-B0', 'TensorFlow', 'Edge-Inference Optimizer', 'Python'],
    metrics: '90%+ accuracy across 28 plant disease categories',
    innovation:
      'Optimized inference weight structures for deployment onto low-resource field hardware. Designed for real-world agricultural deployment with minimal compute requirements.',
    links: [],
    color: '#059669',
    shaderVariant: 'default' as const,
  },
  {
    id: 'career-engine',
    nodeId: 'EXPERIMENT NODE 05',
    title: 'Career Recommendation Engine',
    classification: 'Resume-Job Alignment & Psychometric Signal Modeler',
    domain: 'Azure ML Platform',
    stack: ['Azure Machine Learning', 'Flask', 'TF-IDF', 'KNN', 'Python'],
    metrics: 'Real-time ranked career tracks with skill gap analysis',
    innovation:
      'Models complex resume alignment parameters and behavioral psychometric indicators to serve real-time ranked career tracks. Deployed on Azure ML with Flask API layer.',
    links: [],
    color: '#FBBF24',
    shaderVariant: 'default' as const,
  },
];

export default function LabPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const selectProject = useCallback(
    (index: number) => {
      if (transitioning || index === activeIndex) return;
      setTransitioning(true);
      getAudioEngine().triggerPulse();
      const proj = PROJECTS[index];
      const variant = (proj.shaderVariant ?? 'default') as LabShaderVariant;
      const bridge = getRendererBridge();
      const start = performance.now();
      const morphDuration = 700;

      let last = 0;
      const tick = (now: number) => {
        if (now - last < 32) {
          requestAnimationFrame(tick);
          return;
        }
        last = now;
        const morph = Math.min(1, (now - start) / morphDuration);
        bridge.setLabVariant(variant, morph);
        if (morph < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      setTimeout(() => {
        setActiveIndex(index);
        setTransitioning(false);
        bridge.setLabVariant(variant, 1);
      }, morphDuration);
    },
    [activeIndex, transitioning]
  );

  useEffect(() => {
    const variant = (PROJECTS[activeIndex].shaderVariant ?? 'default') as LabShaderVariant;
    getRendererBridge().setLabVariant(variant, 1);
  }, [activeIndex]);

  const active = PROJECTS[activeIndex];

  return (
    <div
      className="fixed inset-0 flex"
      style={{ zIndex: 10 }}
      role="main"
      aria-label="The Laboratory — Project Experiments"
    >
      {/* Left: project selector */}
      <nav
        className="flex flex-col justify-center gap-1 px-8 md:px-12 py-24 w-64 md:w-80 shrink-0 border-r"
        style={{ borderColor: `${ACCENT}22` }}
        aria-label="Project list"
      >
        <p className="text-label mb-6" style={{ color: ACCENT }}>
          DIMENSION_03 // THE LABORATORY
        </p>
        {PROJECTS.map((proj, i) => (
          <button
            key={proj.id}
            onClick={() => selectProject(i)}
            className="text-left py-3 px-2 transition-all duration-300"
            style={{
              paddingLeft: i === activeIndex ? '1rem' : '0.5rem',
              color: i === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.35)',
              background: 'none',
              border: 'none',
              borderLeft: `2px solid ${i === activeIndex ? ACCENT : 'transparent'}`,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
            aria-current={i === activeIndex ? 'true' : undefined}
            aria-label={`Select project: ${proj.title}`}
          >
            <span style={{ color: ACCENT, opacity: 0.5, marginRight: '0.5rem' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            {proj.title}
          </button>
        ))}

        <div className="mt-auto pt-8">
          <DimensionLink to="memory">← MEMORY</DimensionLink>
          <br />
          <DimensionLink to="signal">SIGNAL →</DimensionLink>
        </div>
      </nav>

      {/* Right: active project detail */}
      <div
        className="flex-1 flex flex-col justify-center px-8 md:px-16 py-24 overflow-y-auto"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.35s ease, transform 0.35s ease',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        <article aria-labelledby={`proj-title-${active.id}`}>
          <p className="text-meta mb-2" style={{ color: active.color }}>
            {active.nodeId}
          </p>

          <h1
            id={`proj-title-${active.id}`}
            className="text-signal-lg mb-2"
            style={{ color: '#ffffff', fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}
          >
            {active.title}
          </h1>

          <p className="text-label mb-6" style={{ color: active.color }}>
            {active.classification}
          </p>

          <p className="text-meta mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
            DOMAIN: {active.domain}
          </p>

          {/* Metrics */}
          <div
            className="mb-8 p-4"
            style={{ border: `1px solid ${active.color}33`, background: `${active.color}08` }}
          >
            <p className="text-meta mb-1" style={{ color: active.color }}>
              ARCHITECTURAL METRICS
            </p>
            <p className="text-label" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {active.metrics}
            </p>
          </div>

          {/* Innovation */}
          <div className="mb-8">
            <p className="text-meta mb-2" style={{ color: active.color }}>
              CORE INNOVATION
            </p>
            <p
              className="text-label leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '65ch', lineHeight: '1.9' }}
            >
              {active.innovation}
            </p>
          </div>

          {/* Stack */}
          <div>
            <p className="text-meta mb-3" style={{ color: active.color }}>
              ARCHITECTURE STACK
            </p>
            <div className="flex flex-wrap gap-2">
              {active.stack.map((tech) => (
                <span
                  key={tech}
                  className="text-meta px-3 py-1"
                  style={{
                    border: `1px solid ${active.color}44`,
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
