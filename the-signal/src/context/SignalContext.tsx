'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { HardwareTier, NeuralInterfaceState, AudioState } from '@/lib/types';
import type { DimensionId } from '@/lib/constants';
import { DIMENSIONS } from '@/lib/constants';
import { detectHardwareTier } from '@/lib/hardware-tier';
import { getRendererBridge } from '@/lib/renderer-bridge';
import { getAudioEngine } from '@/lib/audio-engine';

interface SignalContextValue {
  tier: HardwareTier;
  tierReady: boolean;
  currentDimension: DimensionId;
  isTransitioning: boolean;
  navigateTo: (dimension: DimensionId) => void;
  audio: AudioState;
  toggleAudio: () => void;
  neural: NeuralInterfaceState;
  toggleNeuralMode: () => void;
  rendererReady: boolean;
  rendererError: string | null;
  setRendererReady: (v: boolean) => void;
  setRendererError: (v: string | null) => void;
  friction: number;
}

const SignalContext = createContext<SignalContextValue | null>(null);

function routeToDimension(pathname: string): DimensionId {
  const map: Record<string, DimensionId> = {
    '/': 'boot',
    '/core': 'core',
    '/memory': 'memory',
    '/lab': 'lab',
    '/signal': 'signal',
    '/eye': 'eye',
    '/vision': 'vision',
    '/archive': 'archive',
    '/terminal': 'terminal',
  };
  return map[pathname] ?? 'boot';
}

export function SignalProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [tier, setTier] = useState<HardwareTier>(1);
  const [tierReady, setTierReady] = useState(false);
  const [currentDimension, setCurrentDimension] = useState<DimensionId>('boot');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [rendererError, setRendererError] = useState<string | null>(null);
  const [friction, setFriction] = useState(0);
  const [audio, setAudio] = useState<AudioState>({
    enabled: false,
    masterGain: 0.3,
    currentDimension: 'boot',
  });
  const [neural, setNeural] = useState<NeuralInterfaceState>({
    mode: 'quantum',
    active: false,
    cameraPermission: 'unknown',
  });

  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    detectHardwareTier().then((caps) => {
      setTier(caps.tier);
      setTierReady(true);
    });
  }, []);

  useEffect(() => {
    if (rendererReady && tierReady) {
      getRendererBridge().setTier(tier);
    }
  }, [tier, tierReady, rendererReady]);

  useEffect(() => {
    const dim = routeToDimension(pathname);
    setCurrentDimension(dim);
    const cfg = DIMENSIONS[dim];
    if (cfg) {
      document.documentElement.style.setProperty('--accent', cfg.accentColor);
    }
    if (rendererReady) {
      getRendererBridge().syncDimension(dim);
      getAudioEngine().transitionTo(dim);
    }
  }, [pathname, rendererReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bridge = getRendererBridge();
    let lastX = 0, lastY = 0, lastTime = performance.now();
    let currentFriction = 0;
    
    const onMove = (e: MouseEvent) => {
      bridge.updatePointer(e.clientX, e.clientY);
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const velocity = Math.hypot(dx, dy) / dt;
      
      // Adversarial Friction tracking
      if (velocity > 5) {
        currentFriction = Math.min(1, currentFriction + velocity * 0.05);
      }
      
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;
    };
    
    const decay = setInterval(() => {
      if (currentFriction > 0) {
        currentFriction = Math.max(0, currentFriction - 0.02);
        setFriction(currentFriction);
        // Send friction to renderer for aberration
        bridge.setFriction(currentFriction);
        
        // Add CSS class to body
        if (currentFriction > 0.5) document.body.classList.add('blur-friction');
        else document.body.classList.remove('blur-friction');
      }
    }, 50);

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearInterval(decay);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bridge = getRendererBridge();
    const handleObserved = () => bridge.setObserved(!document.hidden && document.hasFocus());
    
    document.addEventListener('visibilitychange', handleObserved);
    window.addEventListener('focus', handleObserved);
    window.addEventListener('blur', handleObserved);
    document.body.addEventListener('mouseleave', () => bridge.setObserved(false));
    document.body.addEventListener('mouseenter', handleObserved);
    
    handleObserved();
    return () => {
      document.removeEventListener('visibilitychange', handleObserved);
      window.removeEventListener('focus', handleObserved);
      window.removeEventListener('blur', handleObserved);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bridge = getRendererBridge();
    const handleResize = () => bridge.resize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigateTo = useCallback(
    (dimension: DimensionId) => {
      if (isTransitioning) return;
      const config = DIMENSIONS[dimension];
      if (!config) return;
      setIsTransitioning(true);
      const overlay = document.getElementById('signal-overlay');
      overlay?.classList.add('dimension-transition');
      getRendererBridge().navigateTo(dimension);
      getAudioEngine().transitionTo(dimension);
      router.push(config.route);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        document.getElementById('signal-overlay')?.classList.remove('dimension-transition');
      }, 1200);
    },
    [isTransitioning, router]
  );

  const toggleAudio = useCallback(() => {
    const engine = getAudioEngine();
    setAudio((prev) => {
      const next = !prev.enabled;
      if (next) engine.enable();
      else engine.disable();
      return { ...prev, enabled: next };
    });
  }, []);

  const toggleNeuralMode = useCallback(async () => {
    if (neural.active) {
      setNeural((prev) => ({ ...prev, active: false, mode: 'quantum' }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setNeural((prev) => ({ ...prev, active: true, mode: 'neural', cameraPermission: 'granted' }));
    } catch {
      setNeural((prev) => ({
        ...prev,
        active: true,
        mode: 'quantum',
        cameraPermission: 'denied',
      }));
    }
  }, [neural.active]);

  return (
    <SignalContext.Provider
      value={{
        tier, tierReady, currentDimension, isTransitioning, navigateTo,
        audio, toggleAudio, neural, toggleNeuralMode,
        rendererReady, rendererError, setRendererReady, setRendererError,
        friction,
      }}
    >
      {children}
    </SignalContext.Provider>
  );
}

export function useSignal(): SignalContextValue {
  const ctx = useContext(SignalContext);
  if (!ctx) throw new Error('useSignal must be used within SignalProvider');
  return ctx;
}
