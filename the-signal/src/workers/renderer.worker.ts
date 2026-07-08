/**
 * THE SIGNAL — OffscreenCanvas Renderer Worker
 * Blueprint §1.1, §1.3, §2.1, §5
 *
 * Owns the single OffscreenCanvas for the entire session.
 * Raw WebGL2 (GLSL) with WebGPU upgrade path.
 * Single-pass Uber-Shader: chromatic aberration + vignette + film grain + bloom.
 * Max 3 draw calls per frame. LUT texture for vector field math.
 */

import type { WorkerInboundMessage, WorkerOutboundMessage, HardwareTier, LabShaderVariant } from '../lib/types';
import { DIMENSIONS, TRANSITION, particleCountForTier } from '../lib/constants';
import { hexToRgb, lerpRgb, archiveFluctuatingColor } from '../lib/color-utils';
import type { DimensionId } from '../lib/constants';
import type { RGB } from '../lib/color-utils';
import { PERF } from '../lib/performance';
import { createPhysicsEngine, type PhysicsAdapter } from './wasm-physics';

// ── State ────────────────────────────────────────────────────────────────────
let gl: WebGL2RenderingContext | null = null;
let canvas: OffscreenCanvas | null = null;
let tier: HardwareTier = 3;
let startTime = 0;

const state = {
  currentDimension: 'boot' as DimensionId,
  targetDimension: null as DimensionId | null,
  transitionProgress: 0,
  isTransitioning: false,
  accentColor: hexToRgb('#059669') as RGB,
  targetAccentColor: hexToRgb('#059669') as RGB,
  particleCount: 5000,
  fps: 0,
  frameCount: 0,
};

const fpsWindow: number[] = [];
let lastFrameTime = 0;

// ── Programs ─────────────────────────────────────────────────────────────────
let particleProgram: WebGLProgram | null = null;
let uberProgram: WebGLProgram | null = null;
let particleBuffer: WebGLBuffer | null = null;
let sceneFbo: WebGLFramebuffer | null = null;
let sceneTexture: WebGLTexture | null = null;
let quadBuffer: WebGLBuffer | null = null;
let lutTexture: WebGLTexture | null = null;
let particleData: Float32Array = new Float32Array(0);
let attractor: [number, number, number] = [0, 0, 0];
let attractorStrength = 0.25;
let paused = false;
let frameBudgetMs = 1000 / PERF.TARGET_FPS;
let nextFrameAt = 0;
let labVariant: LabShaderVariant = 'default';
let labMorph = 0;
let signalSdfActive = false;
let pointerNorm: [number, number] = [0.5, 0.5];
let loopFn: ((t: number) => void) | null = null;
let rafId = 0;
let lastRafTime = 0;
let physicsEngine: PhysicsAdapter | null = null;
let currentFriction = 0;

// ── Shader Sources ────────────────────────────────────────────────────────────
const PARTICLE_VS = `#version 300 es
precision mediump float;
in vec3 a_position;
in float a_life;
uniform mat4 u_mvp;
uniform float u_time;
uniform vec3 u_accent;
uniform float u_pointSize;
out vec4 v_color;
void main() {
  vec3 pos = a_position;
  pos.x += sin(u_time * 0.45 + pos.z * 0.02) * 2.0;
  pos.y += cos(u_time * 0.38 + pos.x * 0.02) * 2.0;
  gl_Position = u_mvp * vec4(pos, 1.0);
  gl_PointSize = u_pointSize * a_life * (1.0 / max(gl_Position.w, 0.1));
  float pulse = 0.6 + 0.4 * sin(u_time * 1.8 + a_position.x * 0.05);
  v_color = vec4(u_accent * pulse, a_life * 0.85);
}`;

const PARTICLE_FS = `#version 300 es
precision mediump float;
in vec4 v_color;
uniform float u_time;
uniform float u_labVariant;
uniform float u_morph;
uniform vec2 u_pointer;
uniform float u_signalWave;
out vec4 fragColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float alpha = v_color.a * smoothstep(0.5, 0.1, d);
  vec3 col = v_color.rgb;
  if (u_labVariant > 0.5 && u_labVariant < 1.5 && u_morph > 0.01) {
    float n = hash(gl_FragCoord.xy + u_time) * u_morph;
    col *= 1.0 - n * 0.85;
    float mask = smoothstep(0.2, 0.0, length(u_pointer - gl_PointCoord));
    col += v_color.rgb * mask * (1.0 - u_morph);
  } else if (u_labVariant > 1.5 && u_morph > 0.01) {
    float ripple = sin(d * 30.0 - u_time * 4.0) * 0.15 * u_morph;
    col += vec3(0.0, ripple, ripple * 1.2);
  }
  if (u_signalWave > 0.0) {
    col += vec3(0.1, 0.2, 0.5) * sin(u_time * 6.0 + gl_FragCoord.x * 0.02) * u_signalWave * 0.15;
  }
  fragColor = vec4(col, alpha);
}`;

const UBER_VS = `#version 300 es
precision highp float;
in vec2 a_pos;
out vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const UBER_FS = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_scene;
uniform sampler2D u_lut;
uniform float u_time;
uniform vec2 u_res;
uniform vec3 u_accent;
uniform float u_vignette;
uniform float u_grain;
uniform float u_chroma;
uniform float u_bloom;
uniform int u_tier;

float rand(vec2 co) { return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }

vec3 sampleChroma(sampler2D tex, vec2 uv, float str) {
  vec2 off = (uv - 0.5) * str * 0.015;
  return vec3(texture(tex, uv + off).r, texture(tex, uv).g, texture(tex, uv - off).b);
}

void main() {
  vec3 col;
  if (u_tier >= 2) {
    col = sampleChroma(u_scene, v_uv, u_chroma);
    if (u_bloom > 0.0) {
      vec2 px = 1.0 / u_res;
      col += texture(u_scene, v_uv + px).rgb * u_bloom * 0.35;
      col += texture(u_scene, v_uv - px).rgb * u_bloom * 0.35;
    }
  } else {
    col = texture(u_scene, v_uv).rgb;
  }
  vec2 d = v_uv - 0.5;
  col *= 1.0 - dot(d,d) * u_vignette * 3.5;
  col += (rand(v_uv + fract(u_time * 0.01)) - 0.5) * u_grain;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

// ── GL Helpers ────────────────────────────────────────────────────────────────
function compileShader(type: number, src: string): WebGLShader | null {
  const s = gl!.createShader(type);
  if (!s) return null;
  gl!.shaderSource(s, src); gl!.compileShader(s);
  if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) { gl!.deleteShader(s); return null; }
  return s;
}

function createProgram(vs: string, fs: string): WebGLProgram | null {
  const v = compileShader(gl!.VERTEX_SHADER, vs);
  const f = compileShader(gl!.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl!.createProgram()!;
  gl!.attachShader(p, v); gl!.attachShader(p, f); gl!.linkProgram(p);
  if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) return null;
  gl!.deleteShader(v); gl!.deleteShader(f);
  return p;
}

// ── LUT Texture (pre-baked 32x32 vector field) ────────────────────────────────
function buildLUT(): WebGLTexture | null {
  const SIZE = 32;
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE, v = y / SIZE;
      const angle = Math.sin(u * Math.PI * 4) * Math.cos(v * Math.PI * 4) * Math.PI;
      const i = (y * SIZE + x) * 4;
      data[i]   = Math.floor((Math.cos(angle) * 0.5 + 0.5) * 255);
      data[i+1] = Math.floor((Math.sin(angle) * 0.5 + 0.5) * 255);
      data[i+2] = Math.floor(Math.abs(Math.sin(u * v * Math.PI * 8)) * 255);
      data[i+3] = 255;
    }
  }
  const tex = gl!.createTexture();
  gl!.bindTexture(gl!.TEXTURE_2D, tex);
  gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, SIZE, SIZE, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, data);
  gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
  gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
  gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.REPEAT);
  gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.REPEAT);
  return tex;
}

// ── Init ──────────────────────────────────────────────────────────────────────
function initGL(offscreen: OffscreenCanvas): boolean {
  const ctx = offscreen.getContext('webgl2');
  if (!ctx) return false;
  gl = ctx;
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  return true;
}

function initPipeline(w: number, h: number): void {
  if (!gl) return;
  particleProgram = createProgram(PARTICLE_VS, PARTICLE_FS);
  uberProgram = createProgram(UBER_VS, UBER_FS);
  lutTexture = buildLUT();

  particleBuffer = gl.createBuffer();
  const quad = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
  quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

  sceneFbo = gl.createFramebuffer();
  sceneTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  cacheUniforms();
}

function resetParticles(count: number): void {
  state.particleCount = count;
  particleData = new Float32Array(count * 4);
  if (gl && particleBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleData.byteLength, gl.DYNAMIC_DRAW);
  }
}

type ParticleUniforms = {
  mvp: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  accent: WebGLUniformLocation | null;
  pointSize: WebGLUniformLocation | null;
  attractor: WebGLUniformLocation | null;
  attractorStrength: WebGLUniformLocation | null;
  labVariant: WebGLUniformLocation | null;
  morph: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  signalWave: WebGLUniformLocation | null;
};

type UberUniforms = {
  scene: WebGLUniformLocation | null;
  lut: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  res: WebGLUniformLocation | null;
  accent: WebGLUniformLocation | null;
  vignette: WebGLUniformLocation | null;
  grain: WebGLUniformLocation | null;
  chroma: WebGLUniformLocation | null;
  bloom: WebGLUniformLocation | null;
  tier: WebGLUniformLocation | null;
};

let particleUniforms: ParticleUniforms | null = null;
let uberUniforms: UberUniforms | null = null;
const mvpScratch = new Float32Array(16);

let particlePosLoc = -1;
let particleLifeLoc = -1;
let uberPosLoc = -1;

function cacheUniforms(): void {
  if (!particleProgram || !uberProgram) return;
  particleUniforms = {
    mvp: gl!.getUniformLocation(particleProgram, 'u_mvp'),
    time: gl!.getUniformLocation(particleProgram, 'u_time'),
    accent: gl!.getUniformLocation(particleProgram, 'u_accent'),
    pointSize: gl!.getUniformLocation(particleProgram, 'u_pointSize'),
    attractor: null,
    attractorStrength: null,
    labVariant: gl!.getUniformLocation(particleProgram, 'u_labVariant'),
    morph: gl!.getUniformLocation(particleProgram, 'u_morph'),
    pointer: gl!.getUniformLocation(particleProgram, 'u_pointer'),
    signalWave: gl!.getUniformLocation(particleProgram, 'u_signalWave'),
  };
  uberUniforms = {
    scene: gl!.getUniformLocation(uberProgram, 'u_scene'),
    lut: gl!.getUniformLocation(uberProgram, 'u_lut'),
    time: gl!.getUniformLocation(uberProgram, 'u_time'),
    res: gl!.getUniformLocation(uberProgram, 'u_res'),
    accent: gl!.getUniformLocation(uberProgram, 'u_accent'),
    vignette: gl!.getUniformLocation(uberProgram, 'u_vignette'),
    grain: gl!.getUniformLocation(uberProgram, 'u_grain'),
    chroma: gl!.getUniformLocation(uberProgram, 'u_chroma'),
    bloom: gl!.getUniformLocation(uberProgram, 'u_bloom'),
    tier: gl!.getUniformLocation(uberProgram, 'u_tier'),
  };
  particlePosLoc = gl!.getAttribLocation(particleProgram, 'a_position');
  particleLifeLoc = gl!.getAttribLocation(particleProgram, 'a_life');
  uberPosLoc = gl!.getAttribLocation(uberProgram, 'a_pos');
}

// ── MVP Matrix ────────────────────────────────────────────────────────────────
function buildMVP(w: number, h: number, t: number, out: Float32Array): void {
  const aspect = w / h;
  const fov = Math.PI / 4;
  const near = 0.1, far = 1000;
  const f = 1 / Math.tan(fov / 2);
  const angle = t * 0.08;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const proj = [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)/(near-far),-1, 0,0,(2*far*near)/(near-far),0];
  const view = [cos,0,sin,0, 0,1,0,0, -sin,0,cos,0, 0,0,-280,1];
  for (let i=0;i<4;i++) for (let j=0;j<4;j++) {
    let s=0; for (let k=0;k<4;k++) s+=proj[i+k*4]*view[k+j*4];
    out[i+j*4]=s;
  }
}

// ── Render Frame ──────────────────────────────────────────────────────────────
function renderFrame(time: number): void {
  if (!canvas || paused) return;

  const w = canvas.width, h = canvas.height;
  const t = (time - startTime) / 1000;

  // Transition update
  if (state.isTransitioning && state.targetDimension) {
    state.transitionProgress = Math.min(1, state.transitionProgress + (1000/60) / TRANSITION.DURATION_MS);
    state.accentColor = lerpRgb(state.accentColor, state.targetAccentColor, state.transitionProgress * 0.05);
    if (state.transitionProgress >= 1) {
      state.currentDimension = state.targetDimension!;
      state.targetDimension = null;
      state.isTransitioning = false;
      state.transitionProgress = 0;
    }
  }
  if (state.currentDimension === 'archive') {
    state.accentColor = archiveFluctuatingColor(t);
  }

  if (!gl) return;

  if (physicsEngine && particleBuffer) {
    const newData = physicsEngine.step();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, newData);
  }

  // Pass 1: particles → FBO (Draw Call #1)
  gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (particleProgram && particleBuffer && particleUniforms) {
    gl.useProgram(particleProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    const stride = 16;
    if (particlePosLoc !== -1) {
      gl.enableVertexAttribArray(particlePosLoc);
      gl.vertexAttribPointer(particlePosLoc, 3, gl.FLOAT, false, stride, 0);
    }
    if (particleLifeLoc !== -1) {
      gl.enableVertexAttribArray(particleLifeLoc);
      gl.vertexAttribPointer(particleLifeLoc, 1, gl.FLOAT, false, stride, 12);
    }
    buildMVP(w, h, t, mvpScratch);
    gl.uniformMatrix4fv(particleUniforms.mvp, false, mvpScratch);
    gl.uniform1f(particleUniforms.time, t);
    gl.uniform3fv(particleUniforms.accent, state.accentColor);
    gl.uniform1f(particleUniforms.pointSize, tier === 1 ? 5.5 : 4.0);
    gl.uniform1f(particleUniforms.labVariant, labVariant === 'noisy-waveform' ? 1 : labVariant === 'graph-network' ? 2 : 0);
    gl.uniform1f(particleUniforms.morph, labMorph);
    gl.uniform2f(particleUniforms.pointer, pointerNorm[0], pointerNorm[1]);
    gl.uniform1f(particleUniforms.signalWave, signalSdfActive ? 1 : 0);
    gl.drawArrays(gl.POINTS, 0, state.particleCount);
  }

  // Pass 2: uber-shader → screen (Draw Call #2)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (uberProgram && quadBuffer && sceneTexture && uberUniforms) {
    gl.useProgram(uberProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.uniform1i(uberUniforms.scene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, lutTexture);
    gl.uniform1i(uberUniforms.lut, 1);
    gl.uniform1f(uberUniforms.time, t);
    gl.uniform2f(uberUniforms.res, w, h);
    gl.uniform3fv(uberUniforms.accent, state.accentColor);
    gl.uniform1f(uberUniforms.vignette, 0.65);
    gl.uniform1f(uberUniforms.grain, (tier >= 2 ? 0.02 : 0.01) + (currentFriction * 0.15));
    gl.uniform1f(uberUniforms.chroma, (tier >= 2 ? 0.45 : 0.0) + (currentFriction * 3.5));
    gl.uniform1f(uberUniforms.bloom, tier >= 3 ? 0.1 : 0.0);
    gl.uniform1i(uberUniforms.tier, tier);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    if (uberPosLoc !== -1) {
      gl.enableVertexAttribArray(uberPosLoc);
      gl.vertexAttribPointer(uberPosLoc, 2, gl.FLOAT, false, 0, 0);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Draw Call #2
  }

  // FPS tracking
  if (lastFrameTime > 0) {
    const delta = time - lastFrameTime;
    if (delta > 0) {
      const currentFps = 1000 / delta;
      state.fps = state.fps * 0.9 + currentFps * 0.1;
    }
  }
  lastFrameTime = time;
  state.frameCount++;
}

// ── Message Handler ───────────────────────────────────────────────────────────
self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data;
  switch (msg.type) {
    case 'INIT': {
      void (async () => {
        canvas = msg.canvas;
        tier = msg.tier;
        canvas.width = msg.width;
        canvas.height = msg.height;
        startTime = performance.now();
        const bootCfg = DIMENSIONS.boot;
        state.particleCount = particleCountForTier(tier, bootCfg.particleCount);
        state.accentColor = hexToRgb(bootCfg.accentColor);

        frameBudgetMs = tier === 1 ? 1000 / 30 : 1000 / PERF.TARGET_FPS;

        if (!initGL(canvas)) {
          self.postMessage({ type: 'ERROR', message: 'WebGL2 init failed on OffscreenCanvas' } as WorkerOutboundMessage);
          return;
        }
        initPipeline(msg.width, msg.height);
        
        try {
          physicsEngine = await createPhysicsEngine(state.particleCount);
        } catch (e) {
          console.error('Failed to create physics engine', e);
        }
        
        resetParticles(state.particleCount);

        loopFn = (t: number) => {
          if (!paused) {
            if (t - lastRafTime >= frameBudgetMs - 2) {
              renderFrame(t);
              lastRafTime = t;
            }
            rafId = requestAnimationFrame(loopFn!);
          }
        };
        rafId = requestAnimationFrame(loopFn);
        self.postMessage({ type: 'READY' } as WorkerOutboundMessage);
      })();
      break;
    }
    case 'RESIZE': {
      if (!canvas || !gl) return;
      canvas.width = Math.floor(msg.width * msg.dpr);
      canvas.height = Math.floor(msg.height * msg.dpr);
      if (sceneTexture) {
        gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
      break;
    }
    case 'ROUTE_CHANGE': {
      if (state.isTransitioning) {
        state.currentDimension = state.targetDimension ?? state.currentDimension;
        state.isTransitioning = false;
        state.transitionProgress = 0;
      }
      const cfg = DIMENSIONS[msg.to];
      state.targetDimension = msg.to;
      state.targetAccentColor = hexToRgb(cfg.accentColor);
      state.isTransitioning = true;
      state.transitionProgress = 0;
      if (physicsEngine) {
        physicsEngine.setDimension(msg.to);
      }
      // Adjust particle count for new dimension
      signalSdfActive = msg.to === 'signal';
      const newCount = particleCountForTier(tier, cfg.particleCount);
      if (newCount !== state.particleCount) {
        if (physicsEngine) {
          physicsEngine.resize(newCount).then(engine => physicsEngine = engine);
        }
        resetParticles(newCount);
      }
      break;
    }
    case 'SET_LAB_VARIANT': {
      labVariant = msg.variant;
      labMorph = msg.morph;
      break;
    }
    case 'SET_SIGNAL_SDF': {
      signalSdfActive = msg.active;
      pointerNorm = [msg.pointerX, msg.pointerY];
      break;
    }
    case 'POINTER_MOVE': {
      pointerNorm = [msg.normalizedX, msg.normalizedY];
      if (physicsEngine) {
        physicsEngine.updatePointer(msg.normalizedX * 240 - 120, -(msg.normalizedY * 240 - 120), 0);
      }
      break;
    }
    case 'GAZE_UPDATE': {
      if (physicsEngine) {
        physicsEngine.updateGaze(msg.x, msg.y, msg.z, msg.strength);
      }
      break;
    }
    case 'SET_PAUSED': {
      const wasPaused = paused;
      paused = msg.paused;
      if (wasPaused && !paused && loopFn) {
        lastFrameTime = performance.now();
        lastRafTime = lastFrameTime;
        rafId = requestAnimationFrame(loopFn);
      }
      break;
    }
    case 'SET_OBSERVED': {
      if (physicsEngine) {
        physicsEngine.setObserved(msg.observed);
      }
      break;
    }
    case 'SET_FRICTION': {
      currentFriction = msg.friction;
      break;
    }
    case 'SET_TIER': {
      tier = msg.tier;
      frameBudgetMs = tier === 1 ? 1000 / 30 : 1000 / PERF.TARGET_FPS;
      break;
    }
  }
};
