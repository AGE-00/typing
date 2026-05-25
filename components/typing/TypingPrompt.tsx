export function TypingPrompt({
  text,
  reading,
  focusMode,
  hasRecentMistake = false,
}: {
  text?: string;
  reading: string;
  focusMode: boolean;
  hasRecentMistake?: boolean;
}) {
  return <section className={`kinetic-surface kinetic-rise rounded-lg border px-5 py-10 text-center transition md:px-8 md:py-14 ${focusMode ? 'border-slate-300 bg-white' : 'border-slate-200 bg-white'} ${hasRecentMistake ? 'border-red-300 bg-red-50/60' : ''}`} aria-label="表示文">
    <div className="font-readable-jp mx-auto mt-4 max-w-4xl text-balance text-3xl font-black leading-normal tracking-normal text-slate-950 md:text-5xl">{text}</div>
    <div className="font-readable-jp mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-500 md:text-xl">{reading}</div>
  </section>;
}
