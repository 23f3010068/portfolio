/**
 * WebGPU compute + point render path (tier 3 / high-end).
 */

import type { RGB } from '../lib/color-utils';

const COMPUTE_WGSL = /* wgsl */ `
struct Particle { pos: vec4f, vel: vec4f };
struct Params {
  time: f32,
  dt: f32,
  attractor: vec3f,
  strength: f32,
  accent: vec3f,
  count: u32,
};
@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: Params;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let i = gid.x;
  if (i >= params.count) { return; }
  var p = particles[i];
  let toA = params.attractor - p.pos.xyz;
  let distSq = max(dot(toA, toA), 1.0);
  let force = normalize(toA) * (params.strength * 500.0 / distSq);
  p.vel.xyz = (p.vel.xyz + force * params.dt) * 0.98;
  p.pos.xyz = p.pos.xyz + p.vel.xyz * params.dt;
  if (abs(p.pos.x) > 200.0) { p.pos.x *= -0.95; }
  if (abs(p.pos.y) > 200.0) { p.pos.y *= -0.95; }
  if (abs(p.pos.z) > 200.0) { p.pos.z *= -0.95; }
  p.pos.w = 0.6 + 0.4 * sin(params.time * 1.8 + p.pos.x * 0.05);
  particles[i] = p;
}
`;

const RENDER_WGSL = /* wgsl */ `
struct Particle { pos: vec4f, vel: vec4f };
struct Uniforms { mvp: mat4x4f, accent: vec3f, pointSize: f32, time: f32 };
@group(0) @binding(0) var<storage, read> particles: array<Particle>;
@group(0) @binding(1) var<uniform> uni: Uniforms;

struct VSOut { @builtin(position) pos: vec4f, @location(0) color: vec4f, @location(1) @interpolate(flat) life: f32 };

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VSOut {
  let p = particles[vi].pos;
  var out: VSOut;
  out.pos = uni.mvp * vec4f(p.xyz, 1.0);
  let pulse = 0.6 + 0.4 * sin(uni.time * 1.8 + p.x * 0.05 + p.y * 0.03);
  out.color = vec4f(uni.accent * pulse, p.w);
  out.life = p.w;
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  return vec4f(in.color.rgb, in.color.a);
}
`;

export interface WebGPUEngine {
  step(attractor: [number, number, number], strength: number, accent: RGB, time: number): void;
  render(mvp: Float32Array, accent: RGB, time: number, pointSize: number, count: number): void;
  resize(count: number): void;
  destroy(): void;
}

export async function tryCreateWebGPUEngine(
  canvas: OffscreenCanvas,
  particleCount: number
): Promise<WebGPUEngine | null> {
  if (!('gpu' in navigator)) return null;
  try {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return null;
    const device = await adapter.requestDevice();
    const context = canvas.getContext('webgpu') as GPUCanvasContext | null;
    if (!context) return null;

    const format = navigator.gpu.getPreferredCanvasFormat();
    let count = particleCount;
    let particleBuffer = device.createBuffer({
      size: count * 32,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const paramsBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const initData = new Float32Array(count * 8);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const phi = t * Math.PI * 2 * 137.508;
      const r = Math.acos(Math.max(-1, Math.min(1, t * 2 - 1)));
      initData[i * 8] = Math.sin(r) * Math.cos(phi) * 120;
      initData[i * 8 + 1] = Math.sin(r) * Math.sin(phi) * 120;
      initData[i * 8 + 2] = Math.cos(r) * 120;
      initData[i * 8 + 3] = 0.6 + Math.random() * 0.4;
    }
    device.queue.writeBuffer(particleBuffer, 0, initData);

    const computeModule = device.createShaderModule({ code: COMPUTE_WGSL });
    const renderModule = device.createShaderModule({ code: RENDER_WGSL });

    const computeLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
      ],
    });
    const computePipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [computeLayout] }),
      compute: { module: computeModule, entryPoint: 'main' },
    });
    const computeBindGroup = device.createBindGroup({
      layout: computeLayout,
      entries: [
        { binding: 0, resource: { buffer: particleBuffer } },
        { binding: 1, resource: { buffer: paramsBuffer } },
      ],
    });

    const uniformBuffer = device.createBuffer({
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const renderLayout = device.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
        { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      ],
    });
    const renderPipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [renderLayout] }),
      vertex: { module: renderModule, entryPoint: 'vs' },
      fragment: {
        module: renderModule,
        entryPoint: 'fs',
        targets: [{ format, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }],
      },
      primitive: { topology: 'point-list' },
    });
    const renderBindGroup = device.createBindGroup({
      layout: renderLayout,
      entries: [
        { binding: 0, resource: { buffer: particleBuffer } },
        { binding: 1, resource: { buffer: uniformBuffer } },
      ],
    });

    const configure = () => {
      context.configure({ device, format, alphaMode: 'opaque' });
    };
    configure();

    const writeParams = (
      time: number,
      attractor: [number, number, number],
      strength: number,
      accent: RGB
    ) => {
      const p = new Float32Array([
        time, 1 / 60, attractor[0], attractor[1],
        attractor[2], strength, accent[0], accent[1],
        accent[2], count, 0, 0,
      ]);
      device.queue.writeBuffer(paramsBuffer, 0, p);
    };

    return {
      step(attractor, strength, accent, time) {
        writeParams(time, attractor, strength, accent);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginComputePass();
        pass.setPipeline(computePipeline);
        pass.setBindGroup(0, computeBindGroup);
        pass.dispatchWorkgroups(Math.ceil(count / 256));
        pass.end();
        device.queue.submit([encoder.finish()]);
      },
      render(mvp, accent, time, pointSize, drawCount) {
        const u = new Float32Array(20);
        u.set(mvp, 0);
        u.set(accent, 16);
        u[19] = pointSize;
        u[18] = time;
        device.queue.writeBuffer(uniformBuffer, 0, u);
        const encoder = device.createCommandEncoder();
        const view = context.getCurrentTexture().createView();
        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
        });
        pass.setPipeline(renderPipeline);
        pass.setBindGroup(0, renderBindGroup);
        pass.draw(drawCount);
        pass.end();
        device.queue.submit([encoder.finish()]);
      },
      resize(newCount) {
        count = newCount;
        particleBuffer.destroy();
        particleBuffer = device.createBuffer({
          size: count * 32,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
      },
      destroy() {
        particleBuffer.destroy();
        paramsBuffer.destroy();
        uniformBuffer.destroy();
        device.destroy();
      },
    };
  } catch {
    return null;
  }
}
