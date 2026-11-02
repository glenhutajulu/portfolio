import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    order: z.number(),
    group: z.enum(['selected', 'more']).default('selected'),
    hasPage: z.boolean().default(true),
    domain: z.string(),
    problem: z.string(),
    role: z.string(),
    team: z.string().optional(),
    timeline: z.string(),
    outcome: z.string(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    coverWidth: z.number().optional(),
    coverHeight: z.number().optional(),
    demo: z.boolean().default(false),
    gallery: z
      .array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }))
      .default([]),
  }),
});

export const collections = { work };
