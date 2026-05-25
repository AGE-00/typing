import type { MotionLevel } from '@/lib/motion';

export function RomanizedGuide({
  typed,
  target,
  progress,
  motionLevel,
}: {
  typed: string;
  target: string;
  progress: number;
  motionLevel: MotionLevel;
}) {
  const currentIndex = typed.length;
  const translate = motionLevel === 'off' ? '0ch' : `${Math.max(0, currentIndex - 8) * -1}ch`;

  return <section aria-label="ローマ字ターゲット">
    <div className="mb-3 flex items-center justify-between gap-4 text-sm text-slate-500">
      <span className="font-semibold">ローマ字</span>
      <span className="font-mono font-bold text-slate-700">{progress}%</span>
    </div>
    <div className="kinetic-surface kinetic-rise overflow-hidden rounded-lg border border-slate-200 bg-white p-4 md:p-5">
      <div className="relative min-h-12">
        <div
          className="font-typing whitespace-nowrap text-3xl leading-relaxed text-slate-950 transition-transform ease-out will-change-transform md:text-4xl"
          style={{ transform: `translateX(${translate})`, transitionDuration: motionLevel === 'off' ? '0ms' : '220ms' }}
        >
          <span className="text-slate-950">{typed}</span>
          <span className={`${motionLevel !== 'off' ? 'animate-pulse' : ''} rounded-md bg-slate-900 px-1 text-white shadow-[0_0_24px_rgba(0,0,0,0.24)]`}>{target.slice(currentIndex, currentIndex + 1)}</span>
          <span className="text-slate-500">{target.slice(currentIndex + 1)}</span>
        </div>
      </div>
    </div>
  </section>;
}
