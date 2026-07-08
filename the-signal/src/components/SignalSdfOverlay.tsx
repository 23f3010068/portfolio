'use client';

/**
 * GPU SDF-style wave distortion for /signal typography region.
 */

import { useEffect } from 'react';
import { useSignal } from '@/context/SignalContext';
import { getRendererBridge } from '@/lib/renderer-bridge';

export function SignalSdfOverlay() {
  const { currentDimension } = useSignal();

  useEffect(() => {
    const active = currentDimension === 'signal';
    getRendererBridge().setSignalSdf(active, 0.5, 0.5);

    if (!active) return;

    const onMove = (e: MouseEvent) => {
      getRendererBridge().setSignalSdf(
        true,
        e.clientX / window.innerWidth,
        e.clientY / window.innerHeight
      );
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      getRendererBridge().setSignalSdf(false, 0.5, 0.5);
    };
  }, [currentDimension]);

  return null;
}
