'use client';

import { useNeuralGaze } from '@/hooks/useNeuralGaze';
import { SignalSdfOverlay } from '@/components/SignalSdfOverlay';

/** Client-only hooks wired to the global renderer */
export function SignalEngineHost() {
  useNeuralGaze();
  return <SignalSdfOverlay />;
}
