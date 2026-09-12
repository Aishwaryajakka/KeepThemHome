import { describe, expect, it } from 'vitest';
import {
  createCaseSchema,
  createFactorsSchema,
  createOutcomeSchema,
  updateCaseSchema,
  uuidSchema,
} from '../validation/case.js';

describe('case API contracts', () => {
  it('accepts valid case, factor, and outcome payloads', () => {
    expect(createCaseSchema.safeParse({ petName: 'Luna', petType: 'dog' }).success).toBe(true);
    expect(updateCaseSchema.safeParse({ primaryBarrier: 'housing', urgency: 'This week' }).success).toBe(true);
    expect(createFactorsSchema.safeParse({ factors: [{
      factorType: 'housing_situation',
      factorValue: 'My landlord or property says pets aren’t allowed',
      role: 'contributing',
      source: 'structured',
    }] }).success).toBe(true);
    expect(createOutcomeSchema.safeParse({ status: 'KEEPING_PET', helpfulFactors: ['HOUSING_RESOLUTION'] }).success).toBe(true);
    expect(createOutcomeSchema.safeParse({ status: 'SUCCESS' }).success).toBe(false);
    expect(createOutcomeSchema.safeParse({ status: 'KEEPING_PET', helpfulFactors: ['free text'] }).success).toBe(false);
  });

  it('rejects malformed and invalid enum-like payloads', () => {
    expect(createCaseSchema.safeParse({ petName: '', petType: 'horse' }).success).toBe(false);
    expect(updateCaseSchema.safeParse({}).success).toBe(false);
    expect(createFactorsSchema.safeParse({ factors: [{
      factorType: 'urgency', role: 'unknown', source: 'structured',
    }] }).success).toBe(false);
    expect(createOutcomeSchema.safeParse({ status: 'guaranteed_success' }).success).toBe(false);
    const repeated = { factorType: 'behavior_concern_barking', factorValue: 'Barking or excessive noise', role: 'contributing', source: 'structured' };
    expect(createFactorsSchema.safeParse({ factors: [repeated, repeated] }).success).toBe(false);
  });

  it('rejects malformed UUIDs', () => {
    expect(uuidSchema.safeParse('not-a-uuid').success).toBe(false);
    expect(uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true);
  });
});
