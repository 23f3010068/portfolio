/**
 * THE SIGNAL — Shared TypeScript Types
 */

import type { DimensionId } from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// HARDWARE TIER
// ─────────────────────────────────────────────────────────────────────────────

/** Blueprint §1.4 — 3 = high-end, 2 = mid-range, 1 = low-end mobile */
export type HardwareTier = 1 | 2 | 3;

export interface TierCapabilities {
  tier: HardwareTier;
  supportsWebGPU: boolean;
  supportsWebGL2: boolean;
  supportsOffscreenCanvas: boolean;
  supportsComputeShaders: boolean;
  gpuScore: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKER MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkerInitMessage {
  type: 'INIT';
  canvas: OffscreenCanvas;
  tier: HardwareTier;
  width: number;
  height: number;
  dpr: number;
}

export interface WorkerResizeMessage {
  type: 'RESIZE';
  width: number;
  height: number;
  dpr: number;
}

export interface WorkerRouteChangeMessage {
  type: 'ROUTE_CHANGE';
  from: DimensionId;
  to: DimensionId;
  timestamp: number;
}

export interface WorkerPointerMessage {
  type: 'POINTER_MOVE';
  x: number;
  y: number;
  z: number;
  normalizedX: number;
  normalizedY: number;
}

export interface WorkerGazeMessage {
  type: 'GAZE_UPDATE';
  x: number;
  y: number;
  z: number;
  strength: number;
}

export interface WorkerSetTierMessage {
  type: 'SET_TIER';
  tier: HardwareTier;
}

export interface WorkerSetPausedMessage {
  type: 'SET_PAUSED';
  paused: boolean;
}

export interface WorkerInitMessageExtended extends WorkerInitMessage {
  useWebGPU?: boolean;
}

export type LabShaderVariant = 'default' | 'noisy-waveform' | 'graph-network';

export interface WorkerSetLabVariantMessage {
  type: 'SET_LAB_VARIANT';
  variant: LabShaderVariant;
  morph: number;
}

export interface WorkerSetSignalSdfMessage {
  type: 'SET_SIGNAL_SDF';
  active: boolean;
  pointerX: number;
  pointerY: number;
}

export interface WorkerSetObservedMessage {
  type: 'SET_OBSERVED';
  observed: boolean;
}

export interface WorkerSetFrictionMessage {
  type: 'SET_FRICTION';
  friction: number;
}

export type WorkerInboundMessage =
  | WorkerInitMessageExtended
  | WorkerResizeMessage
  | WorkerRouteChangeMessage
  | WorkerPointerMessage
  | WorkerGazeMessage
  | WorkerSetTierMessage
  | WorkerSetPausedMessage
  | WorkerSetLabVariantMessage
  | WorkerSetSignalSdfMessage
  | WorkerSetObservedMessage
  | WorkerSetFrictionMessage;

export interface WorkerReadyMessage {
  type: 'READY';
}

export interface WorkerErrorMessage {
  type: 'ERROR';
  message: string;
}

export type WorkerOutboundMessage = WorkerReadyMessage | WorkerErrorMessage;

// ─────────────────────────────────────────────────────────────────────────────
// RENDERER STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface RendererState {
  currentDimension: DimensionId;
  targetDimension: DimensionId | null;
  transitionProgress: number; // 0.0 → 1.0
  isTransitioning: boolean;
  accentColor: [number, number, number]; // RGB normalized 0–1
  targetAccentColor: [number, number, number];
  particleCount: number;
  targetParticleCount: number;
  fps: number;
  frameCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHADER UNIFORMS
// ─────────────────────────────────────────────────────────────────────────────

export interface UberShaderUniforms {
  accentColor: [number, number, number];
  time: number;
  resolution: [number, number];
  vignetteStrength: number;
  filmGrainStrength: number;
  chromaticAberrationStrength: number;
  bloomStrength: number;
  tier: HardwareTier;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO STATE
// ─────────────────────────────────────────────────────────────────────────────

export interface AudioState {
  enabled: boolean;
  masterGain: number;
  currentDimension: DimensionId;
}

// ─────────────────────────────────────────────────────────────────────────────
// NEURAL INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

export type AttractorMode = 'neural' | 'quantum';

export interface NeuralInterfaceState {
  mode: AttractorMode;
  active: boolean;
  cameraPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTOGRAPHY / EYE DIMENSION
// ─────────────────────────────────────────────────────────────────────────────

export interface PhotoArchiveEntry {
  id: string;
  category: string;
  categoryLabel: string;
  src: string;       // KTX2 texture path
  fallbackSrc: string; // JPEG fallback
  alt: string;
  epigraph?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT DATA (for /lab)
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectData {
  id: string;
  nodeId: string;
  title: string;
  classification: string;
  domain: string;
  metrics: string;
  innovation: string;
  stack: string[];
  links?: { label: string; url: string }[];
  shaderVariant: 'noisy-waveform' | 'graph-network' | 'default';
}
