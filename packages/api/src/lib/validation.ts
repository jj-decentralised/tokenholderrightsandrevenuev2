import { z } from "zod";

export const timeRangeSchema = z.enum(["1d", "7d", "30d", "90d", "1y", "all"]).default("30d");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

export const sortSchema = z.object({
  sort_by: z.string().optional(),
  sort_dir: z.enum(["asc", "desc"]).default("desc"),
});

export const dashboardQuerySchema = z.object({
  range: timeRangeSchema,
});

export const revenueAtlasSchema = z.object({
  range: timeRangeSchema,
  category: z.string().optional(),
  chain: z.string().optional(),
  tokenized: z.coerce.boolean().optional(),
  min_revenue: z.coerce.number().optional(),
}).merge(paginationSchema).merge(sortSchema);

export const protocolQuerySchema = z.object({
  range: timeRangeSchema,
});

export const holderQuerySchema = z.object({
  range: timeRangeSchema,
});

export const screenerSchema = z.object({
  category: z.string().transform((s) => s.split(",")).optional(),
  chain: z.string().transform((s) => s.split(",")).optional(),
  has_token: z.coerce.boolean().optional(),
  has_revenue_rights: z.coerce.boolean().optional(),
  min_revenue_24h: z.coerce.number().optional(),
  max_revenue_24h: z.coerce.number().optional(),
  min_real_pe: z.coerce.number().optional(),
  max_real_pe: z.coerce.number().optional(),
  min_holders: z.coerce.number().optional(),
  max_holders: z.coerce.number().optional(),
  min_holder_growth_30d: z.coerce.number().optional(),
  max_holder_growth_30d: z.coerce.number().optional(),
  min_market_cap: z.coerce.number().optional(),
  max_market_cap: z.coerce.number().optional(),
  min_productive_score: z.coerce.number().optional(),
  max_productive_score: z.coerce.number().optional(),
}).merge(paginationSchema).merge(sortSchema);

export const restatementQuerySchema = z.object({
  since: z.string().optional(),
}).merge(paginationSchema);
