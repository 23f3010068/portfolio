'use client';

/**
 * DimensionLink — Navigation link between dimensions.
 * Uses the SignalContext navigator for cinematic transitions.
 */

import { useSignal } from '@/context/SignalContext';
import type { DimensionId } from '@/lib/constants';
import { DIMENSIONS } from '@/lib/constants';

interface DimensionLinkProps {
  to: DimensionId;
  index?: string;
  className?: string;
  children?: React.ReactNode;
}

export function DimensionLink({ to, index, className, children }: DimensionLinkProps) {
  const { navigateTo, isTransitioning, currentDimension } = useSignal();
  const config = DIMENSIONS[to];
  const isActive = currentDimension === to;

  const handleClick = () => {
    if (!isTransitioning && !isActive) {
      navigateTo(to);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`nav-link text-left ${className ?? ''}`}
      aria-label={`Navigate to ${config?.label ?? to}`}
      aria-current={isActive ? 'page' : undefined}
      disabled={isTransitioning || isActive}
      style={{
        color: isActive ? config?.accentColor : undefined,
        textShadow: isActive ? `0 0 10px ${config?.accentColor}` : undefined,
      }}
    >
      {children ?? (
        <span>
          {index && <span className="opacity-40 mr-3">[{index}]</span>}
          {config?.label ?? to.toUpperCase()}
        </span>
      )}
    </button>
  );
}
