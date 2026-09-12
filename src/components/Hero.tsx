import React from 'react';
import { ArrowRight, GitBranch, Heart, Leaf, LockKeyhole, PawPrint, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { Reveal } from '@/components/landing/Reveal';

interface HeroProps { onStart: () => void; }
const paths = [
  ['1', 'Stay in current housing', 'With support and behavior solutions', 'CONDITIONAL', 'conditional'],
  ['2', 'Temporary-care bridge', 'Short-term support while you stabilize', 'CONDITIONAL', 'conditional'],
  ['3', 'Move with your pet', 'Explore pet-friendly housing options', 'BLOCKED', 'blocked'],
] as const;
const traits = [[Heart, 'SUPPORTIVE'], [Leaf, 'HOPEFUL'], [ShieldCheck, 'TRUSTWORTHY'], [UsersRound, 'COMPASSIONATE']] as const;

export const Hero: React.FC<HeroProps> = ({ onStart }) => (
  <section className="overflow-hidden border-b border-[var(--border-warm)]/70 bg-[var(--cream)]"><div className="mx-auto grid max-w-[1380px] lg:grid-cols-[51%_49%]">
    <div className="relative z-10 px-5 pb-14 pt-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-12 lg:pt-16 xl:px-16">
      <Reveal><div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--forest)]"><span>Support before surrender</span><span className="h-px w-16 bg-[var(--warm-sand)]" aria-hidden="true" /></div></Reveal>
      <Reveal delay={0.07}><h1 aria-label="Before you give them up, let’s see what’s possible." className="mt-6 max-w-[620px] text-balance font-serif text-[clamp(3rem,5vw,4.25rem)] font-semibold leading-[1.01] tracking-[-0.035em] text-[#18382c]">Before you give them up,<br />let’s see what’s possible.</h1></Reveal>
      <Reveal delay={0.14}><p className="mt-5 max-w-[600px] text-[17px] leading-[1.55] text-[var(--charcoal)]/88 sm:text-lg">Tell us what’s making it hard to keep your pet. We’ll help you understand the realistic paths forward, what’s blocking each one, and what could change to make staying together possible.</p></Reveal>
      <Reveal delay={0.21}><div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><button type="button" onClick={onStart} className="landing-cta group brand-focus inline-flex min-h-[52px] items-center rounded-full bg-[var(--forest)] px-7 text-base font-semibold text-[var(--cream)] shadow-[0_10px_24px_rgba(46,84,64,.18)] hover:bg-[var(--forest-deep)]">Find options for my pet <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-[3px]" aria-hidden="true" /></button><span className="flex items-center gap-2 text-sm text-[var(--charcoal)]/70"><Leaf className="h-4 w-4 text-[var(--forest)]" aria-hidden="true" />No judgment. No account required.</span></div></Reveal>
      <Reveal delay={0.28}><ul className="mt-11 grid max-w-[600px] grid-cols-2 gap-6 sm:grid-cols-4">{traits.map(([Icon, label], index) => <li key={label} className="text-xs font-medium tracking-[0.05em] text-[var(--charcoal)]/75"><Icon className={`mb-3 h-7 w-7 ${index % 2 === 0 ? 'text-[var(--warm-sand)]' : 'text-[var(--forest)]'}`} strokeWidth={1.8} aria-hidden="true" />{label}</li>)}</ul></Reveal>
    </div>
    <Reveal direction="right" delay={0.1} className="relative min-h-[590px] lg:min-h-[600px]">
      <img src="/images/pets-resting-hero.png" alt="A golden retriever and tabby cat resting together" className="landing-hero-photo absolute inset-0 h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--cream)]/55 via-transparent to-transparent lg:from-[var(--cream)]/28" aria-hidden="true" />
      <div className="brand-script pointer-events-none absolute left-6 top-12 -rotate-3 text-center text-[30px] text-[#B97859]/90 sm:left-10 sm:text-[36px]"><span>People and pets<br />belong together.</span><Heart className="mx-auto mt-1 h-7 w-7" strokeWidth={1.25} aria-hidden="true" /></div>
      <div className="brand-script pointer-events-none absolute bottom-20 right-5 hidden rotate-3 text-center text-[27px] text-[#B97859]/80 sm:block"><span>Real solutions.<br />Brighter<br />tomorrows.</span><PawPrint className="mx-auto mt-1 h-5 w-5 text-[#B97859]/55" strokeWidth={1.5} aria-hidden="true" /></div>
      <div aria-label="Example of Keep Them Home path results" className="absolute bottom-6 left-1/2 w-[min(430px,calc(100%-3rem))] -translate-x-1/2 rounded-[22px] bg-white/95 p-5 shadow-[0_22px_55px_rgba(45,45,45,.22)] backdrop-blur-sm lg:bottom-6 lg:left-4 lg:translate-x-0 xl:left-9">
        <div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium">A preview of what you’ll see</span><span className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--charcoal)]/70">Example</span></div>
        <h2 className="mt-3 flex items-center gap-2 font-serif text-xl font-semibold text-[#18382c]"><GitBranch className="h-5 w-5 text-[var(--forest)]" aria-hidden="true" />3 possible paths</h2>
        <ol className="mt-3 space-y-2">{paths.map(([number, title, copy, status, tone], index) => <Reveal key={number} delay={0.34 + index * 0.06}><li className="grid grid-cols-[30px_1fr_auto] items-center gap-3 rounded-xl bg-[var(--surface-soft)]/75 px-3 py-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${tone === 'blocked' ? 'bg-[var(--status-blocked-bg)] text-[var(--status-blocked-text)]' : 'bg-[#dcebd8] text-[var(--forest)]'}`}>{number}</span><span><strong className="block text-xs text-[var(--charcoal)] sm:text-[13px]">{title}</strong><span className="block text-[10px] leading-tight text-[var(--text-muted)] sm:text-[11px]">{copy}</span></span><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${tone === 'blocked' ? 'bg-[var(--status-blocked-bg)] text-[var(--status-blocked-text)]' : 'bg-[#fae5ad] text-[#785515]'}`}>{status}</span></li></Reveal>)}</ol>
        <div className="mt-3 flex items-center rounded-xl bg-[var(--sage)]/25 px-4 py-3 text-xs font-semibold text-[var(--forest)]"><LockKeyhole className="mr-2 h-4 w-4" aria-hidden="true" />What could unlock a blocked path?<ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" /></div>
      </div>
    </Reveal>
  </div></section>
);
export default Hero;
