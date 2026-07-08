'use client';

/**
 * HUD — Heads-Up Display
 *
 * Minimal floating controls:
 * - Audio toggle
 * - Neural Interface Mode toggle
 * - Current dimension indicator
 */

import { useSignal } from '@/context/SignalContext';
import { DIMENSIONS } from '@/lib/constants';

export function HUD() {
  const { audio, toggleAudio, neural, toggleNeuralMode, currentDimension, isTransitioning } =
    useSignal();

  const config = DIMENSIONS[currentDimension];

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ inset: 0 }}
      aria-label="System controls"
    >
      {/* Top-left: dimension label */}
      <div
        className="absolute top-6 left-6 pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="text-meta" style={{ color: config?.accentColor ?? '#059669' }}>
          {isTransitioning ? 'TRANSITIONING...' : `[${config?.label ?? 'SIGNAL'}]`}
        </p>
      </div>

      {/* Top-right: controls */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 items-end pointer-events-auto">
        {/* Audio toggle */}
        <button
          onClick={toggleAudio}
          className="nav-link flex items-center gap-2"
          aria-label={audio.enabled ? 'Disable audio' : 'Enable audio'}
          aria-pressed={audio.enabled}
          style={{ color: audio.enabled ? config?.accentColor : 'rgba(255,255,255,0.3)' }}
        >
          <span className="text-meta">
            {audio.enabled ? '◉ AUDIO ON' : '○ AUDIO OFF'}
          </span>
        </button>

        {/* Neural Interface toggle */}
        <button
          onClick={toggleNeuralMode}
          className="nav-link flex items-center gap-2"
          aria-label={
            neural.active
              ? 'Disable Neural Interface Mode'
              : 'Enable Neural Interface Mode (requires camera)'
          }
          aria-pressed={neural.active}
          style={{ color: neural.active ? config?.accentColor : 'rgba(255,255,255,0.3)' }}
        >
          <span className="text-meta">
            {neural.active ? '◉ NEURAL' : '○ QUANTUM'}
          </span>
        </button>

        {/* Camera permission denied notice */}
        {neural.cameraPermission === 'denied' && (
          <p className="text-meta" style={{ color: '#DC2626' }} role="alert">
            CAMERA DENIED — QUANTUM MODE ACTIVE
          </p>
        )}
      </div>

      {/* Bottom-left: metadata stream */}
      <div className="absolute bottom-6 left-6 pointer-events-none" aria-hidden="true">
        <p className="text-meta opacity-20">
          SYS: YASHOVARDHAN THOPTE // SIGNAL v0.1.0
        </p>
      </div>

      {/* Transition overlay */}
      {isTransitioning && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
