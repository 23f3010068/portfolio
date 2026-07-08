'use client';

/**
 * GlobalCanvas — The persistent OffscreenCanvas element.
 * Mounts once, never unmounts. Transfers canvas to renderer worker.
 */

import { useEffect, useRef, useState } from 'react';
import { useSignal } from '@/context/SignalContext';
import { getRendererBridge } from '@/lib/renderer-bridge';

export function GlobalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tier, tierReady, setRendererReady, setRendererError } = useSignal();
  const [initError, setInitError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!tierReady || initialized.current || !canvasRef.current) return;
    initialized.current = true;

    const canvas = canvasRef.current;
    const bridge = getRendererBridge();

    bridge.init(
      canvas,
      tier,
      false,
      () => setRendererReady(true),
      (msg: string) => {
        setInitError(msg);
        setRendererError(msg);
        console.error('[GlobalCanvas] Renderer error:', msg);
      }
    );
    // Intentionally no cleanup — canvas must persist for the session lifetime
  }, [tierReady, tier, setRendererReady, setRendererError]);

  // If renderer failed, return null — static fallback CSS handles the rest
  if (initError) return null;

  return (
    <canvas
      ref={canvasRef}
      id="signal-canvas"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
        background: '#000',
      }}
    />
  );
}
