import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const STATUS_LABEL = { FEASIBLE: 'Feasible', CONDITIONAL: 'Conditional', BLOCKED: 'Blocked' } as const;

export const StatusBadge = ({ status, children, className }: { status: 'FEASIBLE' | 'CONDITIONAL' | 'BLOCKED'; children?: ReactNode; className?: string }) => <span data-status={status} className={cn('inline-flex rounded-full border px-3 py-1.5 text-xs font-bold tracking-wide', status === 'FEASIBLE' ? 'border-[var(--status-feasible-text)]/25 bg-[var(--status-feasible-bg)] text-[var(--status-feasible-text)]' : status === 'BLOCKED' ? 'border-[var(--status-blocked-text)]/20 bg-[var(--status-blocked-bg)] text-[var(--status-blocked-text)]' : 'border-[var(--status-conditional-text)]/25 bg-[var(--status-conditional-bg)] text-[var(--status-conditional-text)]', className)}>{children ?? STATUS_LABEL[status]}</span>;
