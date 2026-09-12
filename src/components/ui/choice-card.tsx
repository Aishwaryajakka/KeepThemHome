import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChoiceCardProps {
  type?: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export const ChoiceCard = ({ type = 'radio', name, checked, onChange, children, description, icon, className }: ChoiceCardProps) => (
  <label className={cn('choice-card brand-focus relative flex min-h-16 w-full cursor-pointer items-center gap-4 rounded-2xl border p-4 text-left sm:min-h-20 sm:p-5', checked ? 'choice-card-selected border-[var(--forest)] bg-[var(--sage)]/16 text-[var(--forest)] shadow-sm' : 'border-[var(--border-warm)] bg-white/80 text-[var(--charcoal)] hover:border-[var(--sage)]', className)}>
    <input type={type} name={name} checked={checked} onChange={onChange} className="h-5 w-5 shrink-0 cursor-pointer accent-[var(--forest)]" />
    {icon ? <span className="pointer-events-none flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--forest)]">{icon}</span> : null}
    <span className="pointer-events-none min-w-0 flex-1"><span className="block text-base font-medium leading-snug sm:text-lg">{children}</span>{description ? <span className="mt-1 block text-sm leading-relaxed text-[var(--text-muted)]">{description}</span> : null}</span>
    <span className={cn('pointer-events-none flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors', checked ? 'border-[var(--forest)] bg-[var(--forest)] text-white' : 'border-[var(--sage)] bg-white')} aria-hidden="true">{checked ? <Check className="h-4 w-4" /> : null}</span>
  </label>
);
