import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    date: z.string(),
    thumbnail: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    featured: z.boolean().optional().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    author: z.string().optional().default('NaNi'),
    tags: z.array(z.string()).optional().default([]),
    thumbnail: z.string().optional(),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.string().optional().default('お知らせ'),
  }),
});

export const collections = { cases, blog, news };
