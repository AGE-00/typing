'use client';

import { useEffect, useRef, useState } from 'react';
import { useDocumentMotionLevel } from '@/components/motion/MotionSection';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)] ?? '';
}

function scrambleFrame(text: string, progress: number) {
  const resolvedCount = Math.floor(text.length * progress);
  return text
    .split('')
    .map((char, index) => {
      if (char === ' ') return ' ';
      return index < resolvedCount ? char : randomChar();
    })
    .join('');
}

export function ScrambleText({ text }: { text: string }) {
  const motionLevel = useDocumentMotionLevel();
  const hasPlayed = useRef(false);
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (hasPlayed.current || motionLevel === 'off') {
      setDisplayText(text);
      return;
    }

    hasPlayed.current = true;
    const totalFrames = motionLevel === 'standard' ? 26 : 12;
    const intervalMs = motionLevel === 'standard' ? 28 : 22;
    let frame = 0;

    setDisplayText(scrambleFrame(text, 0));
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;
      if (progress >= 1) {
        window.clearInterval(timer);
        setDisplayText(text);
        return;
      }
      setDisplayText(scrambleFrame(text, progress));
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [motionLevel, text]);

  return <span aria-label={text} className="inline-block min-w-[9ch] tabular-nums">
    <span aria-hidden="true">{displayText}</span>
  </span>;
}
