/**
 * THE SIGNAL — Global Constants
 *
 * Central source of truth for all dimension configurations,
 * color accents, particle counts, and timing values.
 */

import { clampParticleCount } from './performance';

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type DimensionId =
  | 'boot'
  | 'core'
  | 'memory'
  | 'lab'
  | 'signal'
  | 'eye'
  | 'vision'
  | 'archive'
  | 'terminal';

export interface DimensionConfig {
  id: DimensionId;
  route: string;
  label: string;
  accentColor: string;       // Primary hex color
  accentColorAlt?: string;   // Secondary accent (for /eye)
  particleCount: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  soundProfile: string;
  isHidden?: boolean;        // true for /archive
}

/** Blueprint §1.4: tier1 = low-end (5k), tier2 = mid (25k), tier3 = high-end (50k+) */
/** Old tier<=2 post stack: mid (2) and high (3) get chroma + bloom */
export function tierHasPremiumPost(tier: 1 | 2 | 3): boolean {
  return tier >= 2;
}

export function particleCountForTier(
  tier: 1 | 2 | 3,
  counts: { tier1: number; tier2: number; tier3: number }
): number {
  const raw =
    tier === 3 ? counts.tier3 : tier === 2 ? counts.tier2 : counts.tier1;
  return clampParticleCount(raw);
}

export const DIMENSIONS: Record<DimensionId, DimensionConfig> = {
  boot: {
    id: 'boot',
    route: '/',
    label: 'INIT',
    accentColor: '#059669',
    particleCount: { tier1: 2500, tier2: 6000, tier3: 10000 },
    soundProfile: 'silence-to-hum',
  },
  core: {
    id: 'core',
    route: '/core',
    label: 'SYSTEM CORE',
    accentColor: '#059669',
    particleCount: { tier1: 2500, tier2: 7000, tier3: 12000 },
    soundProfile: 'neural-hum',
  },
  memory: {
    id: 'memory',
    route: '/memory',
    label: 'MEMORY ARCHIVE',
    accentColor: '#D97706',
    particleCount: { tier1: 2500, tier2: 6500, tier3: 11000 },
    soundProfile: 'space-wind',
  },
  lab: {
    id: 'lab',
    route: '/lab',
    label: 'THE LABORATORY',
    accentColor: '#06B6D4',
    particleCount: { tier1: 2500, tier2: 8000, tier3: 12000 },
    soundProfile: 'data-stream',
  },
  signal: {
    id: 'signal',
    route: '/signal',
    label: 'THE SIGNAL',
    accentColor: '#2563EB',
    particleCount: { tier1: 2500, tier2: 7000, tier3: 12000 },
    soundProfile: 'sub-bass-static',
  },
  eye: {
    id: 'eye',
    route: '/eye',
    label: 'THE EYE',
    accentColor: '#DC2626',
    accentColorAlt: '#D97706',
    particleCount: { tier1: 2500, tier2: 5000, tier3: 8000 },
    soundProfile: 'analog-reverb',
  },
  vision: {
    id: 'vision',
    route: '/vision',
    label: 'THE VISION',
    accentColor: '#FBBF24',
    particleCount: { tier1: 2500, tier2: 6500, tier3: 11000 },
    soundProfile: 'ambient-drone',
  },
  archive: {
    id: 'archive',
    route: '/archive',
    label: 'CLASSIFIED',
    accentColor: '#FF0000', // fluctuates at runtime
    particleCount: { tier1: 2500, tier2: 6000, tier3: 10000 },
    soundProfile: 'static-decay',
    isHidden: true,
  },
  terminal: {
    id: 'terminal',
    route: '/terminal',
    label: 'COMMUNICATION CORE',
    accentColor: '#059669',
    particleCount: { tier1: 2500, tier2: 6000, tier3: 10000 },
    soundProfile: 'keyswitch-hum',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HARDWARE TIER THRESHOLDS
// ─────────────────────────────────────────────────────────────────────────────

export const HARDWARE_TIER_BENCHMARK_MS = 400; // Short sample — avoids boot-time GPU peg

/** Blueprint §1.4 — tier3 high-end, tier2 mid, tier1 low-end mobile */
export const HARDWARE_TIER_THRESHOLDS = {
  tier3: {
    minGpuScore: 70,
    requiresWebGPU: true,
    requiresComputeShaders: true,
  },
  tier2: {
    minGpuScore: 30,
    requiresWebGL2: true,
  },
  tier1: {
    minGpuScore: 0,
    requiresWebGL2: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION TIMING
// ─────────────────────────────────────────────────────────────────────────────

export const TRANSITION = {
  DURATION_MS: 1200,          // Max route transition duration
  PARTICLE_SHIFT_MIN_MS: 800, // Min particle density animation duration
  PARTICLE_SHIFT_MAX_MS: 1200,
  AUDIO_CROSSFADE_MS: 800,
  CAMERA_DRIFT_MS: 1200,
  BOOT_TIMEOUT_MS: 3000,      // Show progress indicator after this
  LENIS_DECELERATION: 0.09,   // Smooth scroll deceleration (0.06–0.12)
};

// ─────────────────────────────────────────────────────────────────────────────
// RENDERING CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const RENDER = {
  TARGET_FPS_HIGH: 60,
  TARGET_FPS_LOW: 30,
  FPS_ROLLING_WINDOW: 60,
  MAX_DRAW_CALLS: 3,
  MOBILE_BREAKPOINT_PX: 768,
  MOBILE_PARTICLE_SCALE: 0.5,
  DPR_CAP_TIER3: 2.0,
  LUT_SIZE: 32,               // 32x32 LUT texture
};

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIO = {
  SUB_BASS_HZ: 40,
  MASTER_GAIN: 0.3,
  FADE_OUT_MS: 200,
};

// ─────────────────────────────────────────────────────────────────────────────
// WORKER MESSAGE TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const WORKER_MSG = {
  INIT: 'INIT',
  RESIZE: 'RESIZE',
  ROUTE_CHANGE: 'ROUTE_CHANGE',
  POINTER_MOVE: 'POINTER_MOVE',
  GAZE_UPDATE: 'GAZE_UPDATE',
  SET_TIER: 'SET_TIER',
  FRAME: 'FRAME',
  ERROR: 'ERROR',
  READY: 'READY',
} as const;

export type WorkerMsgType = (typeof WORKER_MSG)[keyof typeof WORKER_MSG];
