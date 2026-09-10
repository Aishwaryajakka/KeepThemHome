import { describe, expect, it } from 'vitest';
import { matchHousingResources, supportResources } from '@/data/resources';

describe('housing resource matching', () => {
  it('prioritizes financial support for pet deposit or fee barriers', () => {
    const [first] = matchHousingResources(
      'I can’t afford the pet deposit or fee',
      'This week',
      'Stay where I am',
    );
    expect(first.category).toBe('financial-support');
  });

  it('prioritizes housing search resources when moving', () => {
    const [first] = matchHousingResources(
      'I’m moving and struggling to find pet-friendly housing',
      'Within a month',
      'Move',
    );
    expect(first.category).toBe('housing-search');
  });

  it('prioritizes temporary care when between homes', () => {
    const [first] = matchHousingResources(
      'I’m temporarily between homes',
      'Today or within 48 hours',
      'Either could work',
    );
    expect(first.category).toBe('temporary-care');
  });

  it('contains only real HTTPS URLs and no prototype resource names', () => {
    expect(supportResources).toHaveLength(8);
    for (const resource of supportResources) {
      expect(resource.url).toMatch(/^https:\/\//);
    }
    expect(supportResources.map(({ name }) => name)).not.toEqual(expect.arrayContaining([
      'Pet-Friendly Housing Directory',
      'Pet Deposit Assistance',
      'Temporary Foster Support',
    ]));
  });
});
