import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const StatusBadge = ({ status, children, className }: { status: 'FEASIBLE' | 'CONDITIONAL' | 'BLOCKED'; children?: ReactNode; className?: string }) => <span className={cn('inline-flex rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide', status === 'FEASIBLE' ? 'border-[var(--status-feasible-text)]/30 bg-[var(--status-feasible-bg)] text-[var(--status-feasible-text)]' : status === 'BLOCKED' ? 'border-[var(--status-blocked-text)]/30 bg-[var(--status-blocked-bg)] text-[var(--status-blocked-text)]' : 'border-[var(--status-conditional-text)]/30 bg-[var(--status-conditional-bg)] text-[var(--status-conditional-text)]', className)}>{children ?? status}</span>;
