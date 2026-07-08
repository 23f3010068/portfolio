/**
 * THE SIGNAL — Web Audio Engine
 *
 * Manages ambient audio:
 * - 40Hz sub-bass neural hum
 * - High-frequency signal pulses
 * - Panning wind textures
 *
 * All audio is opt-in (disabled by default).
 */

import { AUDIO, TRANSITION } from './constants';
import type { DimensionId } from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO ENGINE CLASS
// ─────────────────────────────────────────────────────────────────────────────

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private subBassOsc: OscillatorNode | null = null;
  private subBassGain: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private pannerOsc: OscillatorNode | null = null; // LFO for panning
  private enabled = false;
  private currentDimension: DimensionId = 'boot';

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = AUDIO.MASTER_GAIN;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;

    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    this.startSubBass();
    this.startPanningWind();
    this.startCinematicDrone();
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;

    // Fade out master gain
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(0, now, AUDIO.FADE_OUT_MS / 1000 / 3);
      setTimeout(() => {
        this.stopAll();
      }, AUDIO.FADE_OUT_MS);
    }
  }

  setSilence(silenced: boolean): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const targetGain = silenced ? 0.0 : AUDIO.MASTER_GAIN;
    this.masterGain.gain.setTargetAtTime(targetGain, now, 0.1);
  }

  private startSubBass(): void {
    if (!this.ctx || !this.masterGain) return;

    this.subBassOsc = this.ctx.createOscillator();
    this.subBassGain = this.ctx.createGain();

    this.subBassOsc.type = 'sine';
    this.subBassOsc.frequency.value = AUDIO.SUB_BASS_HZ;
    this.subBassGain.gain.value = 0.4;

    this.subBassOsc.connect(this.subBassGain);
    this.subBassGain.connect(this.masterGain);
    this.subBassOsc.start();
  }

  private startPanningWind(): void {
    if (!this.ctx || !this.masterGain) return;

    // White noise source
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Low-pass filter for wind texture
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.5;

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.08;

    // Stereo panner with LFO
    this.pannerNode = this.ctx.createStereoPanner();

    // LFO for slow panning
    this.pannerOsc = this.ctx.createOscillator();
    this.pannerOsc.type = 'sine';
    this.pannerOsc.frequency.value = 0.05; // Very slow pan

    const pannerGain = this.ctx.createGain();
    pannerGain.gain.value = 0.8;

    this.pannerOsc.connect(pannerGain);
    pannerGain.connect(this.pannerNode.pan);

    noiseSource.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.pannerNode);
    this.pannerNode.connect(this.masterGain);

    noiseSource.start();
    this.pannerOsc.start();
  }

  private stopAll(): void {
    try {
      this.subBassOsc?.stop();
      this.pannerOsc?.stop();
    } catch {
      // Already stopped
    }
    this.subBassOsc = null;
    this.subBassGain = null;
    this.pannerNode = null;
    this.pannerOsc = null;
  }

  private startCinematicDrone(): void {
    if (!this.ctx || !this.masterGain) return;
    
    // Add a harmonic drone pad
    const chords = [130.81, 164.81, 196.00]; // C3, E3, G3
    chords.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + i * 0.05;
      
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.1;
      
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start();
      lfo.start();
    });
  }

  /**
   * Crossfade audio parameters when dimension changes.
   */
  transitionTo(dimension: DimensionId): void {
    if (!this.enabled || !this.ctx || !this.subBassOsc) return;
    this.currentDimension = dimension;

    const now = this.ctx.currentTime;
    const fadeDuration = TRANSITION.AUDIO_CROSSFADE_MS / 1000;

    // Modulate sub-bass frequency per dimension
    const freqMap: Partial<Record<DimensionId, number>> = {
      boot: 40,
      core: 40,
      memory: 35,
      lab: 45,
      signal: 50,
      eye: 38,
      vision: 42,
      archive: 60,
      terminal: 40,
    };

    const targetFreq = freqMap[dimension] ?? 40;
    this.subBassOsc.frequency.setTargetAtTime(targetFreq, now, fadeDuration / 3);
  }

  /**
   * Trigger a signal pulse sound (on hover/interaction).
   */
  triggerPulse(): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.value = 2400;

    gain.gain.value = 0.02;
    gain.gain.setTargetAtTime(0, this.ctx.currentTime + 0.01, 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  get isEnabled(): boolean {
    return this.enabled;
  }
}

// Singleton
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine();
  }
  return audioEngineInstance;
}
