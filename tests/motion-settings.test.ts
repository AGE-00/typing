import { describe, expect, it } from 'vitest';
import { defaultSettings } from '@/lib/db';
import { getEffectiveMotionLevel, getMotionConfig } from '@/lib/motion';

describe('motion and UI settings', () => {
  it('uses minimal animations and no result celebration by default', () => {
    expect(defaultSettings.animationPreference).toBe('minimal');
    expect(defaultSettings.focusModeDefault).toBe(false);
    expect(defaultSettings.personalizationMode).toBe('balanced');
    expect(defaultSettings.resultCelebrationEnabled).toBe(false);
  });

  it('returns centralized durations by motion level', () => {
    expect(getMotionConfig('off')).toEqual({ enabled: false, duration: 0, cssDuration: '0ms' });
    expect(getMotionConfig('minimal')).toEqual({ enabled: true, duration: 0.12, cssDuration: '120ms' });
    expect(getMotionConfig('standard')).toEqual({ enabled: true, duration: 0.22, cssDuration: '220ms' });
  });

  it('treats reduced motion as off unless standard is explicitly selected', () => {
    expect(getEffectiveMotionLevel('minimal', true)).toBe('off');
    expect(getEffectiveMotionLevel('off', true)).toBe('off');
    expect(getEffectiveMotionLevel('standard', true)).toBe('standard');
    expect(getEffectiveMotionLevel('minimal', false)).toBe('minimal');
  });
});
