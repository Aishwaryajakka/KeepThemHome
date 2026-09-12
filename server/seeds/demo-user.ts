import { seedDemoUser } from '../services/demo-user-seed-service.js';

const result = await seedDemoUser();
console.log(JSON.stringify({
  status: 'ok',
  internalUserId: result.userId,
  petId: result.petId,
  caseId: result.caseId,
  petCreated: result.petCreated,
  caseCreated: result.caseCreated,
  factorCount: result.factorCount,
}));
