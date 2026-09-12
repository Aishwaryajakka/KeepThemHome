import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SimilarSituations from '@/components/assessment/SimilarSituations';
import { buildLunaSolverFacts } from '../../server/demo/scenarios';
import { solveRetentionPaths } from '../../server/retention-paths/solver';

describe('Similar situations', () => {
  it('shows clearly labeled synthetic Luna examples without predictive claims', () => {
    const facts = buildLunaSolverFacts('Stay where I am');
    const path = solveRetentionPaths(facts)[0];
    render(<SimilarSituations petType="dog" path={{ ...path, steps: path.steps.map((step) => ({ ...step, resources: [] })) }} facts={facts} />);
    expect(screen.getByRole('heading', { name: 'Similar situations' })).toBeInTheDocument();
    expect(screen.getByText('Similarity describes circumstances, not likelihood of success.')).toBeInTheDocument();
    expect(screen.getAllByText('Synthetic example')).toHaveLength(3);
    expect(screen.getByText(/Pet stayed home/)).toBeInTheDocument();
    expect(screen.queryByText(/%|chance of|success probability/i)).not.toBeInTheDocument();
  });
});
