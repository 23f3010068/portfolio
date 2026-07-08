/**
 * THE SIGNAL — Renderer Bridge
 *
 * Main-thread interface to the OffscreenCanvas Worker.
 * Manages worker lifecycle, message passing, and canvas transfer.
 */

import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
  HardwareTier,
  LabShaderVariant,
} from './types';
import type { DimensionId } from './constants';
import { PERF } from './performance';

// ─────────────────────────────────────────────────────────────────────────────
// RENDERER BRIDGE CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class RendererBridge {
  private worker: Worker | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private offscreen: OffscreenCanvas | null = null;
  private initialized = false;
  private hardwareTier: HardwareTier = 2;
  private currentDimension: DimensionId = 'boot';
  private onReadyCallback: (() => void) | null = null;
  private onErrorCallback: ((msg: string) => void) | null = null;
  private pointerRaf = 0;
  private pendingPointer: { x: number; y: number } | null = null;

  /**
   * After transferControlToOffscreen(), HTMLCanvasElement width/height on the
   * main thread stay at defaults and do not reflect the worker's buffer size.
   * Always derive backing-store scale from window.devicePixelRatio (tier-clamped).
   */
  private effectiveDpr(): number {
    return Math.min(
      window.devicePixelRatio,
      this.hardwareTier === 1 ? 1.0 : 2.0
    );
  }

  /**
   * Initialize the renderer bridge with a canvas element.
   * Transfers the canvas to the worker thread.
   */
  async init(
    canvas: HTMLCanvasElement,
    tier: HardwareTier,
    useWebGPU: boolean,
    onReady: () => void,
    onError: (msg: string) => void
  ): Promise<void> {
    if (this.initialized) return;

    this.canvas = canvas;
    this.hardwareTier = tier;
    this.onReadyCallback = onReady;
    this.onErrorCallback = onError;

    // Check OffscreenCanvas support
    if (!('transferControlToOffscreen' in canvas)) {
      onError('OffscreenCanvas not supported');
      return;
    }

    this.offscreen = canvas.transferControlToOffscreen();

    // Create worker
    this.worker = new Worker(
      new URL('../workers/renderer.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const msg = event.data;
      if (msg.type === 'READY') {
        this.initialized = true;
        this.onReadyCallback?.();
      } else if (msg.type === 'ERROR') {
        this.onErrorCallback?.(msg.message);
      }
    };

    this.worker.onerror = (err) => {
      onError(`Worker error: ${err.message}`);
    };

    const dpr = this.effectiveDpr();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const initMsg: WorkerInboundMessage = {
      type: 'INIT',
      canvas: this.offscreen,
      tier,
      width: Math.floor(width * dpr),
      height: Math.floor(height * dpr),
      dpr,
      useWebGPU: PERF.ENABLE_WEBGPU && useWebGPU && tier === 3,
    };

    // Transfer canvas ownership to worker
    this.worker.postMessage(initMsg, [this.offscreen]);
  }

  /**
   * Notify the worker of a route change.
   * The worker will begin the cinematic transition immediately.
   */
  navigateTo(to: DimensionId): void {
    if (!this.worker || !this.initialized) return;
    if (this.currentDimension === to) return;

    const msg: WorkerInboundMessage = {
      type: 'ROUTE_CHANGE',
      from: this.currentDimension,
      to,
      timestamp: performance.now(),
    };

    this.worker.postMessage(msg);
    this.currentDimension = to;
  }

  /** Sync worker uniforms when the route changes outside navigateTo (e.g. browser back). */
  syncDimension(to: DimensionId): void {
    this.navigateTo(to);
  }

  /**
   * Send pointer position to the worker (normalized 0–1).
   */
  updatePointer(x: number, y: number): void {
    if (!this.worker || !this.initialized) return;
    this.pendingPointer = { x, y };
    if (this.pointerRaf) return;
    this.pointerRaf = requestAnimationFrame(() => {
      this.pointerRaf = 0;
      const p = this.pendingPointer;
      if (!p || !this.worker) return;
      this.worker.postMessage({
        type: 'POINTER_MOVE',
        x: p.x,
        y: p.y,
        z: 0,
        normalizedX: p.x / window.innerWidth,
        normalizedY: p.y / window.innerHeight,
      });
    });
  }

  setPaused(paused: boolean): void {
    if (!this.worker || !this.initialized) return;
    this.worker.postMessage({ type: 'SET_PAUSED', paused });
  }

  setObserved(observed: boolean): void {
    if (!this.worker || !this.initialized) return;
    this.worker.postMessage({ type: 'SET_OBSERVED', observed });
  }

  setFriction(friction: number): void {
    if (!this.worker || !this.initialized) return;
    this.worker.postMessage({ type: 'SET_FRICTION', friction });
  }

  setTier(tier: HardwareTier): void {
    if (!this.worker || !this.initialized) return;
    this.hardwareTier = tier;
    this.worker.postMessage({ type: 'SET_TIER', tier });
  }

  /**
   * Send gaze vector from Neural Interface Mode.
   */
  updateGaze(x: number, y: number, z: number, strength: number): void {
    if (!this.worker || !this.initialized) return;

    const msg: WorkerInboundMessage = {
      type: 'GAZE_UPDATE',
      x,
      y,
      z,
      strength,
    };

    this.worker.postMessage(msg);
  }

  /**
   * Handle viewport resize.
   */
  setLabVariant(variant: LabShaderVariant, morph: number): void {
    if (!this.worker || !this.initialized) return;
    this.worker.postMessage({ type: 'SET_LAB_VARIANT', variant, morph });
  }

  setSignalSdf(active: boolean, pointerX: number, pointerY: number): void {
    if (!this.worker || !this.initialized) return;
    this.worker.postMessage({ type: 'SET_SIGNAL_SDF', active, pointerX, pointerY });
  }

  resize(): void {
    if (!this.worker || !this.initialized || !this.canvas) return;

    const dpr = this.effectiveDpr();
    const msg: WorkerInboundMessage = {
      type: 'RESIZE',
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
      dpr,
    };

    this.worker.postMessage(msg);
  }

  /**
   * Destroy the worker and release resources.
   */
  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.initialized = false;
  }

  get isReady(): boolean {
    return this.initialized;
  }
}

// Singleton instance
let bridgeInstance: RendererBridge | null = null;

export function getRendererBridge(): RendererBridge {
  if (!bridgeInstance) {
    bridgeInstance = new RendererBridge();
  }
  return bridgeInstance;
}
