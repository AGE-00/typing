'use client';

import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

type KeyboardKey = {
  code: string;
  label: string;
  width?: number;
};

const keyboardRows: KeyboardKey[][] = [
  [
    { code: 'Escape', label: 'Esc', width: 1.15 },
    { code: 'Backquote', label: '`' },
    { code: 'Digit1', label: '1' },
    { code: 'Digit2', label: '2' },
    { code: 'Digit3', label: '3' },
    { code: 'Digit4', label: '4' },
    { code: 'Digit5', label: '5' },
    { code: 'Digit6', label: '6' },
    { code: 'Digit7', label: '7' },
    { code: 'Digit8', label: '8' },
    { code: 'Digit9', label: '9' },
    { code: 'Digit0', label: '0' },
    { code: 'Minus', label: '-' },
    { code: 'Equal', label: '=' },
    { code: 'Backspace', label: 'Backspace', width: 1.85 },
  ],
  [
    { code: 'Tab', label: 'Tab', width: 1.45 },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[' },
    { code: 'BracketRight', label: ']' },
    { code: 'Backslash', label: '\\', width: 2.55 },
  ],
  [
    { code: 'CapsLock', label: 'Caps', width: 1.75 },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';' },
    { code: 'Quote', label: "'" },
    { code: 'Enter', label: 'Enter', width: 3.25 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25 },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',' },
    { code: 'Period', label: '.' },
    { code: 'Slash', label: '/' },
    { code: 'ShiftRight', label: 'Shift', width: 3.75 },
  ],
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.25 },
    { code: 'MetaLeft', label: 'Meta', width: 1.25 },
    { code: 'AltLeft', label: 'Alt', width: 1.25 },
    { code: 'Space', label: 'Space', width: 7 },
    { code: 'AltRight', label: 'Alt', width: 1.25 },
    { code: 'ArrowLeft', label: '←' },
    { code: 'ArrowUp', label: '↑' },
    { code: 'ArrowDown', label: '↓' },
    { code: 'ArrowRight', label: '→' },
  ],
];

type KeyboardHeroBackgroundProps = {
  className?: string;
  keyboardUnit?: string;
  restingOpacity?: number;
};

export function KeyboardHeroBackground({
  className,
  keyboardUnit = 'clamp(1.5rem, 3.7vw, 2.45rem)',
  restingOpacity = 0.72,
}: KeyboardHeroBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    let removeKeyListener = () => {};

    const ctx = gsap.context(() => {
      const keys = gsap.utils.toArray<HTMLElement>('.keyboard-key');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        && document.documentElement.dataset.motion !== 'standard';

      gsap.set(root, {
        autoAlpha: 0,
        y: reduceMotion ? 0 : 30,
        scale: 0.99,
        filter: reduceMotion ? 'none' : 'blur(3px)',
      });
      gsap.set(keys, {
        autoAlpha: 0,
        y: reduceMotion ? 0 : 8,
        scale: 0.98,
        borderColor: 'rgba(96, 165, 250, 0)',
      });

      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .to(root, {
          autoAlpha: restingOpacity,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: reduceMotion ? 0.1 : 0.7,
        })
        .to(keys, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          borderColor: 'var(--keyboard-line)',
          duration: reduceMotion ? 0.1 : 0.95,
          stagger: reduceMotion ? 0 : { each: 0.018, from: 'center' },
        }, reduceMotion ? 0 : '-=0.32');

      if (!reduceMotion) {
        gsap.to(root, {
          scale: 1.005,
          autoAlpha: Math.min(restingOpacity + 0.08, 0.9),
          duration: 4.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1.15,
        });
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.repeat) return;
        const eventTarget = event.target;
        if (eventTarget instanceof HTMLElement) {
          const tagName = eventTarget.tagName.toLowerCase();
          if (eventTarget.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;
        }

        const target = root.querySelector<HTMLElement>(`[data-key-code="${event.code}"]`);
        if (!target) return;
        const targetIndex = Number(target.dataset.keyIndex ?? -1);
        const neighbors = keys.filter((key) => {
          const keyIndex = Number(key.dataset.keyIndex ?? -100);
          return key !== target && Math.abs(keyIndex - targetIndex) <= 2;
        });

        gsap.killTweensOf(target);
        gsap.killTweensOf(neighbors);
        if (neighbors.length) {
          gsap.timeline({ defaults: { ease: 'power2.out' } })
            .to(neighbors, {
              autoAlpha: 0.92,
              borderColor: 'rgba(147, 197, 253, 0.48)',
              backgroundColor: 'rgba(59, 130, 246, 0.06)',
              boxShadow: '0 0 14px rgba(59, 130, 246, 0.18)',
              duration: reduceMotion ? 0.04 : 0.12,
              stagger: reduceMotion ? 0 : { each: 0.016, from: 'center' },
            }, 0)
            .to(neighbors, {
              autoAlpha: 1,
              borderColor: 'var(--keyboard-line)',
              backgroundColor: 'rgba(59, 130, 246, 0)',
              boxShadow: 'inset 0 0 0 1px rgba(96, 165, 250, 0.03)',
              duration: reduceMotion ? 0.08 : 0.28,
              stagger: reduceMotion ? 0 : { each: 0.018, from: 'center' },
            });
        }
        gsap.timeline({ defaults: { ease: 'power2.out' } })
          .to(target, {
            scale: 1.08,
            autoAlpha: 1,
            borderColor: 'rgba(147, 197, 253, 0.95)',
            backgroundColor: 'rgba(59, 130, 246, 0.13)',
            boxShadow: '0 0 22px rgba(59, 130, 246, 0.34), inset 0 0 0 1px rgba(191, 219, 254, 0.22)',
            filter: 'brightness(1.32)',
            duration: reduceMotion ? 0.04 : 0.1,
          })
          .to(target, {
            scale: 1,
            autoAlpha: 1,
            borderColor: 'var(--keyboard-line)',
            backgroundColor: 'rgba(59, 130, 246, 0)',
            boxShadow: 'inset 0 0 0 1px rgba(96, 165, 250, 0.03)',
            filter: 'brightness(1)',
            duration: reduceMotion ? 0.08 : 0.18,
            clearProps: 'transform',
          });
      };

      window.addEventListener('keydown', handleKeyDown);
      removeKeyListener = () => window.removeEventListener('keydown', handleKeyDown);
    }, root);

    return () => {
      removeKeyListener();
      ctx.revert();
    };
  }, [restingOpacity]);

  return <div
    aria-hidden="true"
    className={cn('pointer-events-none absolute left-1/2 top-1/2 z-0 w-max max-w-none -translate-x-1/2 -translate-y-1/2 select-none', className)}
    style={{
      '--keyboard-line': 'rgba(96, 165, 250, 0.24)',
      '--keyboard-unit': keyboardUnit,
      '--keyboard-gap': 'clamp(0.16rem, 0.42vw, 0.32rem)',
    } as CSSProperties & Record<'--keyboard-line' | '--keyboard-unit' | '--keyboard-gap', string>}
  >
    <div
      ref={containerRef}
      className="keyboard-hero-shell inline-block rounded-[1.35rem] border border-blue-400/10 p-1 shadow-[0_0_34px_rgba(59,130,246,0.06),inset_0_0_24px_rgba(59,130,246,0.02)]"
    >
      <div className="keyboard-hero-board inline-flex flex-col items-start" style={{ gap: 'var(--keyboard-gap)' }}>
        {keyboardRows.map((row, rowIndex) => <div key={`row-${rowIndex}`} className="flex justify-start" style={{ gap: 'var(--keyboard-gap)' }}>
          {row.map((key, keyIndex) => <div
            key={`${rowIndex}-${key.code}-${key.label}`}
            data-key-code={key.code}
            data-key-index={rowIndex * 20 + keyIndex}
            className="keyboard-key flex h-[calc(var(--keyboard-unit)*0.78)] shrink-0 items-center justify-center rounded-[0.34rem] border border-blue-400/25 bg-blue-400/0 font-mono text-[clamp(0.42rem,0.9vw,0.58rem)] font-medium uppercase tracking-[0.12em] text-blue-500/42 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.03)]"
            style={{ width: `calc(var(--keyboard-unit) * ${key.width ?? 1})` }}
          >
            {key.label}
          </div>)}
        </div>)}
      </div>
    </div>
  </div>;
}
