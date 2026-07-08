/**
 * Particle physics (Rust/WASM-compatible API).
 * Used when WASM pkg is unavailable; swap via wasm-physics.ts when built.
 */

const VELOCITY_WINDOW = 8;

class PointerTracker {
  private positions: [number, number][] = Array.from({ length: VELOCITY_WINDOW }, () => [0, 0]);
  private head = 0;
  private count = 0;

  push(x: number, y: number): void {
    this.positions[this.head] = [x, y];
    this.head = (this.head + 1) % VELOCITY_WINDOW;
    if (this.count < VELOCITY_WINDOW) this.count++;
  }

  velocityMagnitude(): number {
    if (this.count < 2) return 0;
    let total = 0;
    for (let i = 1; i < this.count; i++) {
      const a = this.positions[(this.head + VELOCITY_WINDOW - i - 1) % VELOCITY_WINDOW];
      const b = this.positions[(this.head + VELOCITY_WINDOW - i) % VELOCITY_WINDOW];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      total += Math.hypot(dx, dy);
    }
    return Math.min(total / (this.count - 1) / 50, 1);
  }
}

export class PhysicsEngine {
  private output: Float32Array;
  private pointer = new PointerTracker();
  private attractor = { x: 0, y: 0, z: 0 };
  private attractorStrength = 0.5;
  private damping = 0.98;
  private dt = 1 / 60;
  private positions: Float32Array;
  private velocities: Float32Array;
  private restPositions: Float32Array;
  private targetRestPositions: Float32Array;
  private isObserved = true;
  private entropy = 0;
  private morphProgress = 1;
  readonly count: number;

  constructor(count: number) {
    this.count = count;
    this.output = new Float32Array(count * 4);
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const phi = t * Math.PI * 2 * 137.508;
      const r = Math.acos(Math.max(-1, Math.min(1, t * 2 - 1)));
      const base = i * 3;
      this.positions[base] = Math.sin(r) * Math.cos(phi) * 120;
      this.positions[base + 1] = Math.sin(r) * Math.sin(phi) * 120;
      this.positions[base + 2] = Math.cos(r) * 120;
      this.velocities[base] = Math.sin(i * 0.1) * 0.5;
      this.velocities[base + 1] = Math.cos(i * 0.13) * 0.5;
      this.velocities[base + 2] = Math.sin(i * 0.07) * 0.5;
      this.output[i * 4 + 3] = 0.6 + Math.random() * 0.4;
    }
    
    this.restPositions = new Float32Array(this.positions);
    this.targetRestPositions = new Float32Array(this.positions);
  }

  setObserved(observed: boolean): void {
    this.isObserved = observed;
  }

  setDimension(dimension: string): void {
    this.morphProgress = 0;
    for (let i = 0; i < this.count; i++) {
      const b = i * 3;
      const t = i / this.count;
      
      let x = 0, y = 0, z = 0;
      
      if (dimension === 'lab') {
        // Grid
        const size = Math.cbrt(this.count);
        const ix = i % size;
        const iy = Math.floor(i / size) % size;
        const iz = Math.floor(i / (size * size));
        x = (ix - size/2) * 15;
        y = (iy - size/2) * 15;
        z = (iz - size/2) * 15;
      } else if (dimension === 'vision') {
        // Double Helix
        const angle = t * Math.PI * 40;
        const radius = 60;
        const offset = (i % 2 === 0) ? 0 : Math.PI;
        x = Math.cos(angle + offset) * radius;
        y = (t - 0.5) * 300;
        z = Math.sin(angle + offset) * radius;
      } else if (dimension === 'core') {
        // Torus
        const u = t * Math.PI * 2;
        const v = (i % 100) / 100 * Math.PI * 2;
        const R = 80;
        const r = 30;
        x = (R + r * Math.cos(v)) * Math.cos(u);
        y = (R + r * Math.cos(v)) * Math.sin(u);
        z = r * Math.sin(v);
      } else {
        // Sphere (Default)
        const phi = t * Math.PI * 2 * 137.508;
        const r = Math.acos(Math.max(-1, Math.min(1, t * 2 - 1)));
        x = Math.sin(r) * Math.cos(phi) * 120;
        y = Math.sin(r) * Math.sin(phi) * 120;
        z = Math.cos(r) * 120;
      }
      
      this.targetRestPositions[b] = x;
      this.targetRestPositions[b+1] = y;
      this.targetRestPositions[b+2] = z;
    }
  }

  updatePointer(x: number, y: number, z: number): void {
    this.pointer.push(x, y);
    this.attractor = { x, y, z };
    this.attractorStrength = this.pointer.velocityMagnitude();
  }

  updateGaze(x: number, y: number, z: number, strength: number): void {
    this.attractor = { x, y, z };
    this.attractorStrength = Math.max(0, Math.min(1, strength));
  }

  step(): Float32Array {
    const { x: ax, y: ay, z: az } = this.attractor;
    const strength = this.attractorStrength;
    const dt = this.dt;
    const damp = this.damping;

    if (this.isObserved) {
      this.entropy = Math.max(0, this.entropy - dt * 2.0);
    } else {
      this.entropy = Math.min(1, this.entropy + dt * 0.5);
    }

    if (this.morphProgress < 1) {
      this.morphProgress = Math.min(1, this.morphProgress + dt * 0.5);
    }

    for (let i = 0; i < this.count; i++) {
      const b = i * 3;
      const o = i * 4;
      
      // Interpolate rest positions (Latent Space Navigation)
      if (this.morphProgress < 1) {
        const ease = this.morphProgress < 0.5 ? 4 * this.morphProgress * this.morphProgress * this.morphProgress : 1 - Math.pow(-2 * this.morphProgress + 2, 3) / 2;
        this.restPositions[b] += (this.targetRestPositions[b] - this.restPositions[b]) * ease * 0.1;
        this.restPositions[b+1] += (this.targetRestPositions[b+1] - this.restPositions[b+1]) * ease * 0.1;
        this.restPositions[b+2] += (this.targetRestPositions[b+2] - this.restPositions[b+2]) * ease * 0.1;
      }

      let px = this.positions[b];
      let py = this.positions[b + 1];
      let pz = this.positions[b + 2];
      let vx = this.velocities[b];
      let vy = this.velocities[b + 1];
      let vz = this.velocities[b + 2];

      const dx = ax - px;
      const dy = ay - py;
      const dz = az - pz;
      const distSq = Math.max(dx * dx + dy * dy + dz * dz, 1);
      const invLen = 1 / Math.sqrt(distSq);
      
      // Attractor force
      const f = (strength * 500) / distSq;
      vx += dx * invLen * f * dt;
      vy += dy * invLen * f * dt;
      vz += dz * invLen * f * dt;

      // Restoring force to topological shape
      const rx = this.restPositions[b] - px;
      const ry = this.restPositions[b+1] - py;
      const rz = this.restPositions[b+2] - pz;
      vx += rx * 2.0 * dt;
      vy += ry * 2.0 * dt;
      vz += rz * 2.0 * dt;

      // Quantum Observer Entropy
      if (this.entropy > 0) {
        vx += (Math.random() - 0.5) * this.entropy * 400 * dt;
        vy += (Math.random() - 0.5) * this.entropy * 400 * dt;
        vz += (Math.random() - 0.5) * this.entropy * 400 * dt;
      }

      vx *= damp;
      vy *= damp;
      vz *= damp;
      px += vx * dt;
      py += vy * dt;
      pz += vz * dt;

      if (Math.abs(px) > 250) px *= -0.95;
      if (Math.abs(py) > 250) py *= -0.95;
      if (Math.abs(pz) > 250) pz *= -0.95;

      this.positions[b] = px;
      this.positions[b + 1] = py;
      this.positions[b + 2] = pz;
      this.velocities[b] = vx;
      this.velocities[b + 1] = vy;
      this.velocities[b + 2] = vz;

      this.output[o] = px;
      this.output[o + 1] = py;
      this.output[o + 2] = pz;
    }
    return this.output;
  }

  resize(count: number): PhysicsEngine {
    return new PhysicsEngine(count);
  }
}
