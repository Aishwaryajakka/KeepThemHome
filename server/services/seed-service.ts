import { count, inArray, sql } from 'drizzle-orm';
import { supportResources } from '../../src/data/resources';
import { getDatabase } from '../db';
import { interventionResources, interventions, resources } from '../db/schema';
import { interventionCatalog, interventionResourceSlugs } from '../interventions/catalog';

export const verifiedCatalogManifest = () => {
  const resourceSlugs = supportResources.map(({ id }) => id);
  const interventionKeys = interventionCatalog.map(({ key }) => key);
  if (new Set(resourceSlugs).size !== resourceSlugs.length) throw new Error('Verified resource slugs must be unique');
  if (new Set(interventionKeys).size !== interventionKeys.length) throw new Error('Intervention keys must be unique');
  const unknownLinks = Object.values(interventionResourceSlugs).flat().filter((slug) => !resourceSlugs.includes(slug));
  if (unknownLinks.length > 0) throw new Error(`Interventions reference unknown resources: ${unknownLinks.join(', ')}`);
  return { resourceSlugs, interventionKeys };
};

export const seedVerifiedCatalog = async () => {
  const db = getDatabase();
  verifiedCatalogManifest();

  for (const resource of supportResources) {
    const { id: slug, ...metadata } = resource;
    await db.insert(resources).values({
      slug,
      ...metadata,
      verificationStatus: 'verified',
      active: true,
    }).onConflictDoUpdate({
      target: resources.slug,
      set: {
        name: resource.name,
        category: resource.category,
        description: resource.description,
        geographicScope: resource.geographicScope,
        eligibilitySummary: resource.eligibilitySummary,
        costSummary: resource.costSummary,
        url: resource.url,
        sourceName: resource.sourceName,
        verifiedAt: resource.verifiedAt,
        tags: resource.tags,
        verificationStatus: 'verified',
        active: true,
        updatedAt: new Date(),
      },
    });
  }

  for (const intervention of interventionCatalog) {
    await db.insert(interventions).values({
      ...intervention,
      supportedBarriers: [...intervention.supportedBarriers],
    }).onConflictDoUpdate({
      target: interventions.key,
      set: {
        title: intervention.title,
        description: intervention.description,
        supportedBarriers: [...intervention.supportedBarriers],
        active: true,
        updatedAt: new Date(),
      },
    });
  }

  const resourceRows = await db.select({ id: resources.id, slug: resources.slug }).from(resources)
    .where(inArray(resources.slug, supportResources.map(({ id }) => id)));
  const interventionRows = await db.select({ id: interventions.id, key: interventions.key }).from(interventions);
  for (const [key, slugs] of Object.entries(interventionResourceSlugs)) {
    const intervention = interventionRows.find((item) => item.key === key);
    if (!intervention) continue;
    const values = slugs.flatMap((slug, index) => {
      const resource = resourceRows.find((item) => item.slug === slug);
      return resource ? [{ interventionId: intervention.id, resourceId: resource.id, relevanceWeight: slugs.length - index }] : [];
    });
    if (values.length > 0) await db.insert(interventionResources).values(values).onConflictDoUpdate({
      target: [interventionResources.interventionId, interventionResources.resourceId],
      set: { relevanceWeight: sql`excluded.relevance_weight` },
    });
  }

  const [expected] = await db.select({ value: count() }).from(resources)
    .where(inArray(resources.slug, supportResources.map(({ id }) => id)));
  const [visible] = await db.select({ value: count() }).from(resources)
    .where(sql`${resources.active} = true and ${resources.verificationStatus} = 'verified'`);
  return { expectedResources: expected.value, visibleResources: visible.value };
};
