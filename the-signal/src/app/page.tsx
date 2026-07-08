'use client';

/**
 * DIMENSION 00 — INITIALIZATION & CORE BOOT INTERFACE
 * Route: /
 * Accent: Deep Emerald #059669
 *
 * The entry point. Feels like booting into a classified system.
 * Sequential log fades, name reveal, entry prompt.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSignal } from '@/context/SignalContext';

const BOOT_LOGS = [
  { text: 'SYS_STATUS: DORMANT... OK', delay: 500 },
  { text: 'ALLOCATING WASM MEMORY CORES... OK', delay: 1200 },
  { text: 'NATIVE WEBGPU CONTEXT ACQUIRED: INITIALIZING COMPUTE ENGINE...', delay: 2000 },
  { text: 'SIGNAL IDENTIFIED: RECONSTRUCTING COGNITIVE NODE...', delay: 2800 },
];

export default function BootPage() {
  const { navigateTo, tierReady, tier } = useSignal();
  const [visibleLogs, setVisibleLogs] = useState<number[]>([]);
  const [showName, setShowName] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    // Show progress indicator if boot takes too long
    const progressTimer = setTimeout(() => setShowProgress(true), 3000);

    // Stagger log lines
    BOOT_LOGS.forEach((log, i) => {
      setTimeout(() => {
        setVisibleLogs((prev) => [...prev, i]);
      }, log.delay);
    });

    // Show name
    setTimeout(() => setShowName(true), 3800);

    // Show entry prompt
    setTimeout(() => setShowEntry(true), 4800);

    return () => clearTimeout(progressTimer);
  }, []);

  const handleEntry = useCallback(() => {
    navigateTo('core');
  }, [navigateTo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEntry();
      }
    },
    [handleEntry]
  );

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 10, cursor: showEntry ? 'pointer' : 'default' }}
      role="main"
      aria-label="System boot sequence"
      onClick={showEntry ? handleEntry : undefined}
      onKeyDown={showEntry ? handleKeyDown : undefined}
    >
      {/* Boot log stream */}
      <div
        className="absolute top-1/4 left-8 md:left-16 flex flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {BOOT_LOGS.map((log, i) => (
          <p
            key={i}
            className="text-meta transition-opacity duration-500"
            style={{
              opacity: visibleLogs.includes(i) ? 0.6 : 0,
              color: '#059669',
              transform: visibleLogs.includes(i) ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            {log.text}
          </p>
        ))}
      </div>

      {/* Primary name reveal */}
      <div
        className="text-center"
        style={{
          opacity: showName ? 1 : 0,
          transform: showName ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 1.2s ease, transform 1.2s ease',
        }}
      >
        <h1
          className="text-signal-xl glitch"
          data-text="YASHOVARDHAN THOPTE"
          style={{ color: '#ffffff' }}
          aria-label="Yashovardhan Thopte"
        >
          YASHOVARDHAN THOPTE
        </h1>
        <p
          className="text-label mt-4"
          style={{ color: '#059669', opacity: showName ? 0.8 : 0, transition: 'opacity 1s ease 0.5s' }}
        >
          SYSTEMS ENGINEER · AI RESEARCHER · DUAL-DEGREE SCHOLAR
        </p>
      </div>

      {/* Entry prompt */}
      <div
        className="absolute bottom-1/4 flex flex-col items-center gap-4"
        style={{
          opacity: showEntry ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleEntry();
          }}
          className="cursor-blink text-signal"
          style={{
            color: '#059669',
            fontSize: '1.5rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.3em',
          }}
          aria-label="Enter the system — press Enter or click to continue"
        >
          ▶ ENTER SYSTEM
        </button>
        <p className="text-meta" style={{ color: 'rgba(255,255,255,0.3)' }}>
          PRESS ENTER OR CLICK TO INITIALIZE
        </p>
      </div>

      {/* Progress indicator for slow loads */}
      {showProgress && !tierReady && (
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          role="status"
          aria-label="Loading system components"
        >
          <p className="text-meta" style={{ color: '#059669' }}>
            LOADING HARDWARE TIER DETECTION... TIER {tier}
          </p>
        </div>
      )}

      {/* Micro-metadata corners */}
      {showName && (
        <>
          <div
            className="absolute top-4 right-4 text-meta opacity-10"
            aria-hidden="true"
          >
            GPU_ALLOC: 0xC632
          </div>
          <div
            className="absolute bottom-4 right-4 text-meta opacity-10"
            aria-hidden="true"
          >
            PIPELINE_BIND: COMPUTE_SHADER_v2
          </div>
        </>
      )}

      {/* Screen-reader accessible content */}
      <div className="sr-only">
        <p>Welcome to the portfolio of Yashovardhan Thopte — systems engineer and AI researcher.</p>
        <p>Press Enter or click the Enter System button to proceed to the main portfolio.</p>
      </div>
    </div>
  );
}
