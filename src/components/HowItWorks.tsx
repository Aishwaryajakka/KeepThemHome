import React from 'react';
import { Reveal } from '@/components/landing/Reveal';
const steps = [
  ['01', 'Tell us what’s happening', 'Share the situation in your own words.'],
  ['02', 'We make sense of the situation', 'We identify the pressures making it difficult to keep your pet.'],
  ['03', 'See realistic paths forward', 'Compare ways your pet may be able to stay with you.'],
  ['04', 'See what would need to change', 'Understand what is blocking each path and what could unlock it.'],
  ['05', 'Take the next step', 'Use trusted resources and save your plan.'],
] as const;
export const HowItWorks: React.FC = () => <div id="how-it-works" className="scroll-mt-24"><Reveal><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--forest)]">A clearer way forward</p><h2 className="mt-2 font-serif text-4xl font-semibold leading-none text-[#18382c] sm:text-[48px]">How it works</h2><p className="mt-3 text-base text-[var(--charcoal)]/75">Start with your story. Leave with a clearer view of what could help you stay together.</p></Reveal>
  <ol className="relative mt-6 space-y-2 before:absolute before:bottom-7 before:left-[25px] before:top-7 before:w-px before:bg-[var(--sage)]/65">{steps.map(([number, title, description], index) => <Reveal key={number} delay={index * 0.055}><li className="relative grid grid-cols-[52px_1fr] items-center gap-3"><span className="relative z-10 flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--sage)]/55 bg-[var(--cream)] font-serif text-lg font-semibold text-[var(--forest)] shadow-sm">{number}</span><div className="rounded-xl bg-white/55 px-5 py-3"><h3 className="font-serif text-[17px] font-semibold text-[#18382c]">{title}</h3><p className="mt-0.5 text-[13px] leading-relaxed text-[var(--charcoal)]/72">{description}</p></div></li></Reveal>)}</ol>
</div>;
export default HowItWorks;
