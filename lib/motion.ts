import type { AnimationPreference } from '@/lib/types';

export type MotionLevel = AnimationPreference;

export type MotionConfig = {
  enabled: boolean;
  duration: number;
  cssDuration: string;
};

export function getMotionConfig(level: MotionLevel): MotionConfig {
  if (level === 'off') return { enabled: false, duration: 0, cssDuration: '0ms' };
  if (level === 'minimal') return { enabled: true, duration: 0.12, cssDuration: '120ms' };
  return { enabled: true, duration: 0.22, cssDuration: '220ms' };
}

export function getEffectiveMotionLevel(level: MotionLevel, prefersReducedMotion: boolean): MotionLevel {
  if (prefersReducedMotion && level !== 'standard') return 'off';
  return level;
}

export const MOTION_PREFERENCE_EVENT = 'jp-typing-motion-preference-change';

export function motionClass(level: MotionLevel, standardClass: string, minimalClass = '') {
  if (level === 'off') return '';
  return level === 'standard' ? standardClass : minimalClass;
}

export function resolveMotionLevel(level: MotionLevel, media?: Pick<MediaQueryList, 'matches'>): MotionLevel {
  return getEffectiveMotionLevel(level, Boolean(media?.matches));
}

export function applyDocumentMotionLevel(level: MotionLevel, media?: Pick<MediaQueryList, 'matches'>) {
  if (typeof document === 'undefined') return resolveMotionLevel(level, media);
  const effectiveLevel = resolveMotionLevel(level, media);
  document.documentElement.dataset.motion = effectiveLevel;
  return effectiveLevel;
}

export function dispatchMotionPreferenceChange(level: MotionLevel) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<MotionLevel>(MOTION_PREFERENCE_EVENT, { detail: level }));
}
