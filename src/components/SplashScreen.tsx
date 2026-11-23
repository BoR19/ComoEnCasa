import React, { useEffect } from 'react';
import { OfficialLogo } from './BrandAssets';

export const SPLASH_SESSION_KEY = 'como-en-casa-splash-shown';

export function hasSplashPlayedInSession(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.sessionStorage.getItem(SPLASH_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // Ignore storage access errors in private browsing contexts
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const timer = window.setTimeout(
      onComplete,
      prefersReducedMotion ? 16 : 710
    );
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      aria-hidden="true"
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) {
          onComplete();
        }
      }}
      className="splash-backdrop fixed inset-0 z-[100] bg-[var(--bg-canvas)] flex items-center justify-center p-6 pointer-events-none select-none"
    >
      <div className="splash-logo flex flex-col items-center justify-center">
        <OfficialLogo size="md" />
      </div>
    </div>
  );
};
