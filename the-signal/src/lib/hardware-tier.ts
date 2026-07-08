/**
 * THE SIGNAL — Hardware Tier Detection
 * Blueprint §1.4: Automated Performance Tiering Engine
 *
 * Tier 3 (High-End):  WebGPU + compute shaders, 50k+ particles, full post-processing
 * Tier 2 (Mid-Range): WebGL2, ~25k particles, vertex interpolations
 * Tier 1 (Low-End):   WebGL2, 5k particles, DPR clamped to 1.0
 */

import type { HardwareTier, TierCapabilities } from './types';
import { HARDWARE_TIER_BENCHMARK_MS, RENDER } from './constants';
import { PERF } from './performance';

function detectWebGPU(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

function detectWebGL2(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2');
    return ctx !== null;
  } catch {
    return false;
  }
}

function detectOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

async function runGpuBenchmark(): Promise<number> {
  if (typeof document === 'undefined') return 0;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const gl = canvas.getContext('webgl2');
  if (!gl) return 0;

  const vsSource = `#version 300 es
    in vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;
  const fsSource = `#version 300 es
    precision highp float;
    out vec4 fragColor;
    uniform float u_time;
    void main() {
      float v = sin(gl_FragCoord.x * 0.1 + u_time) * 0.5 + 0.5;
      fragColor = vec4(v, v * 0.5, 1.0 - v, 1.0);
    }
  `;

  function compileShader(type: number, source: string): WebGLShader | null {
    const shader = gl!.createShader(type);
    if (!shader) return null;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) { gl!.deleteShader(shader); return null; }
    return shader;
  }

  const vs = compileShader(gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return 0;
  const program = gl.createProgram();
  if (!program) return 0;
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return 0;
  gl.useProgram(program);

  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  const timeLoc = gl.getUniformLocation(program, 'u_time');

  let frames = 0;
  const start = performance.now();
  const deadline = start + Math.min(HARDWARE_TIER_BENCHMARK_MS, PERF.BENCHMARK_MS);
  while (performance.now() < deadline && frames < PERF.BENCHMARK_MAX_FRAMES) {
    gl.uniform1f(timeLoc, (performance.now() - start) * 0.001);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    frames++;
  }
  const elapsed = performance.now() - start;
  const fps = (frames / elapsed) * 1000;
  gl.deleteProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  gl.deleteBuffer(buf);
  return Math.min(100, Math.max(0, (fps / 60) * 100));
}

let cachedCapabilities: TierCapabilities | null = null;

export async function detectHardwareTier(): Promise<TierCapabilities> {
  if (cachedCapabilities) return cachedCapabilities;

  const supportsWebGPU = detectWebGPU();
  const supportsWebGL2 = detectWebGL2();
  const supportsOffscreenCanvas = detectOffscreenCanvas();

  let supportsComputeShaders = false;
  if (supportsWebGPU) {
    try {
      // Use unknown cast to avoid missing WebGPU types
      const nav = navigator as unknown as { gpu: { requestAdapter(): Promise<unknown> } };
      const adapter = await nav.gpu.requestAdapter();
      supportsComputeShaders = adapter !== null;
    } catch {
      supportsComputeShaders = false;
    }
  }

  const gpuScore = supportsWebGL2 ? await runGpuBenchmark() : 0;

  let tier: HardwareTier;
  if (supportsWebGPU && supportsComputeShaders && gpuScore >= 85) {
    tier = 3;
  } else if (supportsWebGL2 && gpuScore >= 45) {
    tier = 2;
  } else {
    tier = 1;
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tier = 1;
  }

  // Mobile: downgrade one performance tier (3 → 2 → 1)
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    tier = Math.max(tier - 1, 1) as HardwareTier;
  }

  cachedCapabilities = { tier, supportsWebGPU, supportsWebGL2, supportsOffscreenCanvas, supportsComputeShaders, gpuScore };
  return cachedCapabilities;
}

export function getParticleCount(
  tier: HardwareTier,
  counts: { tier1: number; tier2: number; tier3: number },
  isMobile: boolean
): number {
  const base =
    tier === 3 ? counts.tier3 : tier === 2 ? counts.tier2 : counts.tier1;
  return isMobile ? Math.floor(base * RENDER.MOBILE_PARTICLE_SCALE) : base;
}
