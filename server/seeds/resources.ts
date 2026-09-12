import { seedVerifiedCatalog } from '../services/seed-service.js';

const result = await seedVerifiedCatalog();
if (result.expectedResources !== 8 || result.visibleResources !== 8) {
  throw new Error(`Expected exactly 8 active verified resources; found ${result.visibleResources}`);
}
console.log(`Seed complete: ${result.expectedResources} expected resources and ${result.visibleResources} active verified resources.`);
