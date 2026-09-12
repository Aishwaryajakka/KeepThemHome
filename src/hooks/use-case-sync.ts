import { useEffect, useRef } from 'react';
import { caseApi, type ApiCaseStatus, type ApiOutcomeStatus, type FactorInput } from '@/lib/case-api';
import type { AssessmentCaseState } from '@/lib/assessment-session';
import { BEHAVIOR_CONCERN_OPTIONS, type BarrierType } from '@/types/assessment';

const factorKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const contributingFactorType = (barrier: BarrierType) => barrier === 'behavior'
  ? 'behavior_contributor'
  : `contributing_${barrier}`;

const outcomeStatus = (outcome: AssessmentCaseState['outcome']): ApiOutcomeStatus | undefined => {
  if (outcome === 'keeping') return 'keeping';
  if (outcome === 'stillTrying') return 'still_trying';
  if (outcome === 'rehomingHelp') return 'rehoming_help';
};

export const structuredFactors = (caseState: AssessmentCaseState): FactorInput[] => {
  const factors: FactorInput[] = [];
  const behaviorActive = caseState.selectedFactors.includes('behavior');
  const costActive = caseState.selectedFactors.includes('cost');
  if (caseState.rootCause) factors.push({
    factorType: 'primary_barrier', factorValue: caseState.rootCause, role: 'primary', source: 'structured',
  });
  for (const barrier of ['housing', 'behavior', 'cost', 'medical', 'temporary_crisis', 'time_capacity', 'circumstances'] as BarrierType[]) {
    factors.push({
      factorType: contributingFactorType(barrier),
      factorValue: barrier !== caseState.rootCause && caseState.contributingBarriers.includes(barrier) ? barrier : null,
      role: 'contributing', source: 'structured',
    });
  }
  if (caseState.rootCause === 'housing') {
    if (caseState.housing.situation) factors.push({
      factorType: 'housing_situation', factorValue: caseState.housing.situation, role: 'contributing', source: 'structured',
    });
    if (caseState.housing.urgency) factors.push({
      factorType: 'urgency', factorValue: caseState.housing.urgency, role: 'constraint', source: 'structured',
    });
    if (caseState.housing.goal) factors.push({
      factorType: 'goal', factorValue: caseState.housing.goal, role: 'contributing', source: 'structured',
    });
  }
  for (const concern of BEHAVIOR_CONCERN_OPTIONS) factors.push({
    factorType: `behavior_concern_${factorKey(concern)}`,
    factorValue: behaviorActive && caseState.behavior.concerns.includes(concern) ? concern : null,
    role: 'contributing', source: 'structured',
  });
  factors.push({
    factorType: 'behavior_seriousness', factorValue: behaviorActive ? caseState.behavior.seriousness || null : null,
    role: 'constraint', source: 'structured',
  });
  factors.push({
    factorType: 'behavior_already_tried', factorValue: behaviorActive ? caseState.behavior.alreadyTried || null : null,
    role: 'contributing', source: 'structured',
  });
  factors.push({
    factorType: 'behavior_help_barrier', factorValue: behaviorActive ? caseState.behavior.helpBarrier || null : null,
    role: 'constraint', source: 'structured',
  });
  factors.push({
    factorType: 'cost_constraint',
    factorValue: costActive ? caseState.costConstraint || 'Explicitly identified' : null,
    role: 'constraint', source: 'structured',
  });
  for (const [factorType, factorValue] of [
    ['primary_support_possible', caseState.domain.primarySupportPossible],
    ['bridge_available', caseState.domain.bridgeAvailable],
    ['alternative_available', caseState.domain.alternativeAvailable],
    ['safety_manageable', caseState.rootCause === 'behavior' && caseState.behavior.seriousness ? (caseState.behavior.seriousness === 'There’s an immediate safety concern' ? 'no' : 'yes') : ''],
  ] as const) factors.push({ factorType, factorValue: factorValue || null, role: 'constraint', source: 'structured' });
  if (caseState.rootCause !== 'housing' && caseState.domain.urgency) factors.push({
    factorType: 'urgency', factorValue: caseState.domain.urgency, role: 'constraint', source: 'structured',
  });
  return factors;
};

export const useCaseSync = (
  caseState: AssessmentCaseState,
) => {
  const updateFingerprint = useRef<string | undefined>(undefined);
  const factorFingerprint = useRef<string | undefined>(undefined);
  const outcomeFingerprint = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!caseState.backendCaseId) return;
    const status = (outcomeStatus(caseState.outcome) ?? 'active') as ApiCaseStatus;
    const payload = {
      primaryBarrier: caseState.rootCause || null,
      urgency: (caseState.rootCause === 'housing' ? caseState.housing.urgency : caseState.domain.urgency) || null,
      goal: caseState.housing.goal || null,
      currentStatus: status,
    };
    const fingerprint = JSON.stringify(payload);
    if (updateFingerprint.current === fingerprint) return;
    updateFingerprint.current = fingerprint;
    void caseApi.updateCase(caseState.backendCaseId, payload).catch(() => undefined);
  }, [caseState]);

  useEffect(() => {
    if (!caseState.backendCaseId || !caseState.rootCause) return;
    const factors = structuredFactors(caseState);
    if (factors.length === 0) return;
    const fingerprint = JSON.stringify(factors);
    if (factorFingerprint.current === fingerprint) return;
    factorFingerprint.current = fingerprint;
    void caseApi.recordFactors(caseState.backendCaseId, factors).catch(() => undefined);
  }, [caseState]);

  useEffect(() => {
    if (!caseState.backendCaseId) return;
    const status = outcomeStatus(caseState.outcome);
    if (!status || outcomeFingerprint.current === status) return;
    outcomeFingerprint.current = status;
    void caseApi.recordOutcome(caseState.backendCaseId, status).catch(() => undefined);
  }, [caseState.backendCaseId, caseState.outcome]);
};
