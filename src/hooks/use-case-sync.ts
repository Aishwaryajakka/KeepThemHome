import { useEffect, useRef } from 'react';
import { caseApi, type ApiCaseStatus, type ApiOutcomeStatus, type FactorInput } from '@/lib/case-api';
import type { AssessmentCaseState } from '@/lib/assessment-session';

const outcomeStatus = (outcome: AssessmentCaseState['outcome']): ApiOutcomeStatus | undefined => {
  if (outcome === 'keeping') return 'keeping';
  if (outcome === 'stillTrying') return 'still_trying';
  if (outcome === 'rehomingHelp') return 'rehoming_help';
};

const structuredFactors = (caseState: AssessmentCaseState): FactorInput[] => {
  const factors: FactorInput[] = [];
  if (caseState.rootCause) factors.push({
    factorType: 'primary_barrier', factorValue: caseState.rootCause, role: 'primary', source: 'structured',
  });
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
  if (caseState.rootCause === 'behavior') {
    if (caseState.behavior.concern) factors.push({
      factorType: 'behavior_concern', factorValue: caseState.behavior.concern, role: 'contributing', source: 'structured',
    });
    if (caseState.behavior.seriousness) factors.push({
      factorType: 'behavior_seriousness', factorValue: caseState.behavior.seriousness, role: 'constraint', source: 'structured',
    });
    if (caseState.behavior.alreadyTried) factors.push({
      factorType: 'behavior_already_tried', factorValue: caseState.behavior.alreadyTried, role: 'contributing', source: 'structured',
    });
    if (caseState.behavior.helpBarrier) factors.push({
      factorType: 'behavior_help_barrier', factorValue: caseState.behavior.helpBarrier, role: 'constraint', source: 'structured',
    });
  }
  return factors;
};

export const useCaseSync = (
  caseState: AssessmentCaseState,
  retainBackendCaseId: (id: string) => void,
) => {
  const createAttemptKey = useRef<string | undefined>(undefined);
  const updateFingerprint = useRef<string | undefined>(undefined);
  const factorFingerprint = useRef<string | undefined>(undefined);
  const outcomeFingerprint = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (caseState.backendCaseId || !caseState.petName.trim() || !caseState.petType) return;
    const key = `${caseState.petName.trim()}\u0000${caseState.petType}`;
    if (createAttemptKey.current === key) return;
    createAttemptKey.current = key;
    void caseApi.createCase({
      petName: caseState.petName.trim(),
      petType: caseState.petType,
      primaryBarrier: caseState.rootCause || null,
      currentStatus: 'active',
    }).then(({ id }) => retainBackendCaseId(id)).catch(() => undefined);
  }, [caseState.backendCaseId, caseState.petName, caseState.petType, caseState.rootCause, retainBackendCaseId]);

  useEffect(() => {
    if (!caseState.backendCaseId) return;
    const status = (outcomeStatus(caseState.outcome) ?? 'active') as ApiCaseStatus;
    const payload = {
      petName: caseState.petName.trim(),
      petType: caseState.petType || undefined,
      primaryBarrier: caseState.rootCause || null,
      urgency: caseState.housing.urgency || null,
      goal: caseState.housing.goal || null,
      currentStatus: status,
    };
    const fingerprint = JSON.stringify(payload);
    if (updateFingerprint.current === fingerprint) return;
    updateFingerprint.current = fingerprint;
    void caseApi.updateCase(caseState.backendCaseId, payload).catch(() => undefined);
  }, [caseState]);

  useEffect(() => {
    if (!caseState.backendCaseId) return;
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
