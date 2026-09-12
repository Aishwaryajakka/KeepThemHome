import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Rewrite {
  source: string;
  destination: string;
}

const config = JSON.parse(readFileSync(`${process.cwd()}/vercel.json`, 'utf8')) as {
  rewrites: Rewrite[];
};

describe('Vercel routing', () => {
  it('keeps API routing ahead of the SPA routes', () => {
    expect(config.rewrites[0]).toEqual({
      source: '/api/:path*',
      destination: '/api/router?path=:path',
    });
  });

  it('rewrites only known client routes to the SPA document', () => {
    expect(config.rewrites.filter(({ destination }) => destination === '/index.html').map(({ source }) => source)).toEqual([
      '/dashboard',
      '/my-pets',
      '/pets/:petId/cases/:caseId',
    ]);
  });

  it('has no catch-all capable of rewriting development modules or static assets', () => {
    const spaSources = config.rewrites
      .filter(({ destination }) => destination === '/index.html')
      .map(({ source }) => source);

    expect(spaSources).not.toContain('/:path*');
    expect(spaSources).not.toContain('/(.*)');
    expect(spaSources.every((source) => !source.includes('(?!'))).toBe(true);
  });
});
