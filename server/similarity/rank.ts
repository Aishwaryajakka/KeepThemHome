import type { SimilarCaseDto, StructuredSimilarityInput } from './domain.js';

const overlap = (left: string[], right: string[]) => left.filter((value) => right.includes(value));
export const similarityScore = (source: StructuredSimilarityInput, candidate: StructuredSimilarityInput) => {
  let score = source.petType === candidate.petType ? 3 : 0;
  score += source.primaryFactor === candidate.primaryFactor ? 5 : 0;
  score += overlap(source.contributingFactors, candidate.contributingFactors).length * 3;
  score += overlap(source.constraintKeys, candidate.constraintKeys).length * 2;
  score += overlap(source.blockerCategories, candidate.blockerCategories).length * 2;
  score += source.pathKey === candidate.pathKey ? 2 : 0;
  score += overlap(source.interventionCategories, candidate.interventionCategories).length;
  return score;
};

export const qualitativeSimilarity = (score: number): SimilarCaseDto['similarityLabel'] => score >= 13 ? 'High similarity' : score >= 8 ? 'Medium similarity' : 'Similar situation';
export const similarityReasons = (source: StructuredSimilarityInput, candidate: StructuredSimilarityInput) => Array.from(new Set([
  source.primaryFactor === candidate.primaryFactor ? source.primaryFactor : '',
  ...overlap(source.contributingFactors, candidate.contributingFactors),
  ...overlap(source.blockerCategories, candidate.blockerCategories),
].filter(Boolean))).slice(0, 3);
