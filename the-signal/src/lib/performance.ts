/**
 * Runtime performance tuning — keeps blueprint tiers while staying playable.
 */

import type { HardwareTier } from './types';

export const PERF = {
  /** Hard cap — blueprint aspirational counts are clamped here */
  MAX_PARTICLES: 12000,
  TARGET_FPS: 60,
  POINTER_THROTTLE_MS: 32,
  BENCHMARK_MS: 400,
  BENCHMARK_MAX_FRAMES: 80,
  /** WebGPU experimental path off by default (saves duplicate GPU context work) */
  ENABLE_WEBGPU: false,
  /** CPU physics is expensive — stride simulates GPU-first design */
  PHYSICS_STRIDE: { 1: 0, 2: 2, 3: 1 } as Record<HardwareTier, number>,
};

export function clampParticleCount(count: number): number {
  return Math.min(Math.max(count, 1500), PERF.MAX_PARTICLES);
}
