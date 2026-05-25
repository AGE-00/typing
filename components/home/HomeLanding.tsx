'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { KeyboardHeroBackground } from '@/components/KeyboardHeroBackground';
import { MotionGroup, MotionSection } from '@/components/motion/MotionSection';
import { ScrambleText } from '@/components/motion/ScrambleText';
import { cn } from '@/lib/utils';

const ctaClass = 'group relative inline-flex min-h-14 items-center justify-center overflow-hidden rounded-full border border-blue-300/40 bg-blue-600 px-7 text-sm font-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_34px_rgba(37,99,235,0.26)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200/80 hover:bg-blue-500 hover:shadow-[0_0_0_1px_rgba(191,219,254,0.2),0_18px_54px_rgba(37,99,235,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 sm:min-h-16 sm:px-9 sm:text-base';

export function HomeLanding() {
  return <main className="hero-gradient relative isolate min-h-[calc(100dvh-5rem)] overflow-hidden">
    <MotionGroup
      as="section"
      className="relative mx-auto grid min-h-[calc(100dvh-9rem)] max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[0.82fr_1.18fr] lg:gap-6"
    >
      <MotionSection
        className="relative z-10 flex max-w-xl flex-col items-center text-center lg:items-start lg:text-left"
      >
        <p className="font-mono text-xs font-semibold uppercase text-slate-500">Typing Practice</p>
        <h1 className="hero-wordmark mt-5 pb-2 text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl md:text-7xl">
          <ScrambleText text="JP Typing" />
        </h1>
        <Link
          href="/practice"
          className={cn(ctaClass, 'mt-8')}
          aria-label="Start Typing"
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.28),transparent_42%)]" aria-hidden="true" />
          <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/24 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[420%]" aria-hidden="true" />
          <span className="relative flex items-center justify-center">
            Start Typing
            <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </Link>
      </MotionSection>

      <MotionSection className="relative z-0 min-h-[18rem] overflow-hidden lg:min-h-[24rem] lg:overflow-visible">
        <KeyboardHeroBackground
          className="lg:translate-x-4"
          keyboardUnit="clamp(1.12rem, 2.85vw, 2.05rem)"
          restingOpacity={0.78}
        />
      </MotionSection>
    </MotionGroup>

    <MotionSection as="footer" className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 pb-8 text-xs text-slate-500 sm:flex-row sm:gap-5">
      <span>© 2026 JP Typing. All rights reserved.</span>
      <Link href="/privacy" className="transition hover:text-blue-700">プライバシーポリシー</Link>
    </MotionSection>
  </main>;
}
