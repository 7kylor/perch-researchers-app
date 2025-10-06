import { z } from 'zod';

const CrossrefWorkSchema = z.object({
  title: z.array(z.string()).optional(),
  author: z
    .array(z.object({ given: z.string().optional(), family: z.string().optional() }))
    .optional(),
  abstract: z.string().optional(),
  published: z.any().optional(),
  issued: z.object({ 'date-parts': z.array(z.array(z.number())).optional() }).optional(),
  container_title: z.array(z.string()).optional(),
  DOI: z.string().optional(),
});

export type CrossrefWork = z.infer<typeof CrossrefWorkSchema>;

export async function fetchCrossrefByDOI(doi: string): Promise<CrossrefWork | null> {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = (await res.json()) as { message?: unknown };
  const parsed = CrossrefWorkSchema.safeParse(data.message);
  return parsed.success ? parsed.data : null;
}
