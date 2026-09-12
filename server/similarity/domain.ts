export const similarityOutcomeCategories = ['KEEPING_PET', 'STILL_TRYING', 'REHOMING_SUPPORT_NEEDED', 'UNKNOWN'] as const;
export type SimilarityOutcomeCategory = typeof similarityOutcomeCategories[number];

export interface StructuredSimilarityInput {
  petType: string;
  primaryFactor: string;
  contributingFactors: string[];
  urgencyBucket: string;
  constraintKeys: string[];
  pathKey: string;
  blockerCategories: string[];
  interventionCategories: string[];
  outcomeCategory: SimilarityOutcomeCategory;
}

export interface SimilarCaseDto {
  id: string;
  provenance: 'synthetic_example' | 'anonymous_shared_case';
  similarityLabel: 'High similarity' | 'Medium similarity' | 'Similar situation';
  petType: string;
  factors: string[];
  pathKey: string;
  actions: string[];
  outcomeCategory: SimilarityOutcomeCategory;
  reasons: string[];
}
