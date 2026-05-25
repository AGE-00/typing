'use client';

import { useEffect } from 'react';
import { getSettings } from '@/lib/db';
import { applyDocumentMotionLevel, MOTION_PREFERENCE_EVENT } from '@/lib/motion';
import type { AnimationPreference } from '@/lib/types';

function applyMotionLevel(preference: AnimationPreference, prefersReducedMotion: boolean) {
  applyDocumentMotionLevel(preference, { matches: prefersReducedMotion });
}

export function MotionProvider() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let preference: AnimationPreference = 'minimal';

    const sync = () => applyMotionLevel(preference, media.matches);

    sync();
    void getSettings().then((settings) => {
      preference = settings.animationPreference;
      sync();
    });

    media.addEventListener('change', sync);
    const handlePreferenceChange = (event: Event) => {
      preference = (event as CustomEvent<AnimationPreference>).detail;
      sync();
    };
    window.addEventListener(MOTION_PREFERENCE_EVENT, handlePreferenceChange);
    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener(MOTION_PREFERENCE_EVENT, handlePreferenceChange);
    };
  }, []);

  return null;
}
