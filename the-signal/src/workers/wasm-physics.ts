/**
 * Loads signal-wasm when present (npm run build:wasm).
 * Falls back to PhysicsEngine in physics-engine.ts.
 */

import { PhysicsEngine } from './physics-engine';

export interface PhysicsAdapter {
  updatePointer(x: number, y: number, z: number): void;
  updateGaze(x: number, y: number, z: number, strength: number): void;
  step(): Float32Array;
  resize(count: number): Promise<PhysicsAdapter>;
  setObserved(observed: boolean): void;
  setDimension(dimension: string): void;
}

class TsPhysicsAdapter implements PhysicsAdapter {
  constructor(private engine: PhysicsEngine) {}

  updatePointer(x: number, y: number, z: number): void {
    this.engine.updatePointer(x, y, z);
  }

  updateGaze(x: number, y: number, z: number, strength: number): void {
    this.engine.updateGaze(x, y, z, strength);
  }

  step(): Float32Array {
    return this.engine.step();
  }

  setObserved(observed: boolean): void {
    this.engine.setObserved(observed);
  }

  setDimension(dimension: string): void {
    this.engine.setDimension(dimension);
  }

  async resize(count: number): Promise<PhysicsAdapter> {
    return new TsPhysicsAdapter(new PhysicsEngine(count));
  }
}

class WasmPhysicsAdapter implements PhysicsAdapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private engine: any) {}

  updatePointer(x: number, y: number, z: number): void {
    this.engine.update_pointer(x, y, z);
  }

  updateGaze(x: number, y: number, z: number, strength: number): void {
    this.engine.update_gaze(x, y, z, strength);
  }

  step(): Float32Array {
    this.engine.step();
    return this.engine.output_slice() as Float32Array;
  }

  setObserved(observed: boolean): void {
    // Stub for WASM, or invoke if supported
    if (this.engine.set_observed) this.engine.set_observed(observed);
  }

  setDimension(dimension: string): void {
    if (this.engine.set_dimension) this.engine.set_dimension(dimension);
  }

  async resize(count: number): Promise<PhysicsAdapter> {
    this.engine.free?.();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wasm = (this.engine.constructor as any).__wasm;
    return new WasmPhysicsAdapter(new wasm.SignalEngine(count));
  }
}

export async function createPhysicsEngine(count: number): Promise<PhysicsAdapter> {
  try {
    const wasm = await import('../wasm/pkg/signal_wasm.js');
    await wasm.default();
    return new WasmPhysicsAdapter(new wasm.SignalEngine(count));
  } catch {
    return new TsPhysicsAdapter(new PhysicsEngine(count));
  }
}
