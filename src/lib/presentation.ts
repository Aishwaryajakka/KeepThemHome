import type { ApiBarrier } from '@/lib/case-api';

export const FACTOR_LABELS: Record<ApiBarrier, string> = {
  housing: 'Housing',
  behavior: 'Behavior',
  cost: 'Cost',
  medical: 'Veterinary',
  temporary_crisis: 'Temporary crisis',
  time_capacity: 'Time & capacity',
  circumstances: 'Family or life change',
};

export const factorLabel = (value: string) => FACTOR_LABELS[value as ApiBarrier] ?? 'Other challenge';

export const urgencyLabel = (value?: string | null) => {
  if (!value) return undefined;
  if (value === 'This week') return 'Urgent: 7 days';
  if (value === 'Today or within 48 hours') return 'Urgent: within 48 hours';
  if (value === 'Within a month') return 'Within a month';
  if (value === 'I’m planning ahead') return 'Planning ahead';
  return undefined;
};
