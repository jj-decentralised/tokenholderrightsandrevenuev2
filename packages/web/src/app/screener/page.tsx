"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ValuationScatter } from "@/components/charts/ValuationScatter";
import { GrowthYieldScatter } from "@/components/charts/GrowthYieldScatter";
import { ProductiveScore } from "@/components/ui/ProductiveScore";
import { formatUSD, formatNumber, formatRatio } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const CATEGORIES = [
  "All",
  "DEX",
  "Lending",
  "Derivatives",
  "CDP",
  "Yield",
  "Bridge",
] as const;

type Category = (typeof CATEGORIES)[number];

const SORT_OPTIONS = [
  { value: "revenue", label: "Revenue" },
  { value: "fees", label: "Fees" },
  { value: "holder_revenue", label: "Holder Revenue" },
  { value: "market_cap", label: "Market Cap" },
  { value: "real_pe", label: "Real P/E" },
  { value: "yield", label: "Yield" },
  { value: "score", label: "Score" },
  { value: "growth", label: "Growth 30d" },
] as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScreenerRow {
  name: string;
  slug: string;
  primary_category: string;
  token_symbol: string | null;
  fees_24h: number;
  revenue_24h: number;
  holder_revenue_24h: number;
  market_cap_usd: number | null;
  real_pe_ratio: number | null;
  revenue_yield: number | null;
  productive_token_score: number | null;
  holder_growth_30d: number | null;
  total_holders: number | null;
  /* Fields mapped for the scatter chart components */
  period_fees: number;
  period_revenue: number;
  period_holder_revenue: number;
  revenue_yield_pct: number | null;
  holder_count: number | null;
}

/* ------------------------------------------------------------------ */
/*  Mock data (fallback when API is unavailable)                       */
/* ------------------------------------------------------------------ */

const MOCK_DATA: ScreenerRow[] = [
  { name: "Hyperliquid", slug: "hyperliquid", primary_category: "derivatives", token_symbol: "HYPE", fees_24h: 1_460_000, revenue_24h: 730_000, holder_revenue_24h: 377_000, market_cap_usd: 4_500_000_000, real_pe_ratio: 14.5, revenue_yield: 0.068, productive_token_score: 8.2, holder_growth_30d: 12.4, total_holders: 45_000, period_fees: 1_460_000, period_revenue: 730_000, period_holder_revenue: 377_000, revenue_yield_pct: 6.8, holder_count: 45_000 },
  { name: "dYdX", slug: "dydx", primary_category: "derivatives", token_symbol: "DYDX", fees_24h: 890_000, revenue_24h: 890_000, holder_revenue_24h: 890_000, market_cap_usd: 1_200_000_000, real_pe_ratio: 3.7, revenue_yield: 0.271, productive_token_score: 9.1, holder_growth_30d: 8.2, total_holders: 32_000, period_fees: 890_000, period_revenue: 890_000, period_holder_revenue: 890_000, revenue_yield_pct: 27.1, holder_count: 32_000 },
  { name: "GMX", slug: "gmx", primary_category: "derivatives", token_symbol: "GMX", fees_24h: 750_000, revenue_24h: 225_000, holder_revenue_24h: 225_000, market_cap_usd: 800_000_000, real_pe_ratio: 9.7, revenue_yield: 0.103, productive_token_score: 7.8, holder_growth_30d: 5.1, total_holders: 28_000, period_fees: 750_000, period_revenue: 225_000, period_holder_revenue: 225_000, revenue_yield_pct: 10.3, holder_count: 28_000 },
  { name: "Curve", slug: "curve", primary_category: "dex", token_symbol: "CRV", fees_24h: 620_000, revenue_24h: 310_000, holder_revenue_24h: 155_000, market_cap_usd: 600_000_000, real_pe_ratio: 10.6, revenue_yield: 0.094, productive_token_score: 7.2, holder_growth_30d: 2.1, total_holders: 85_000, period_fees: 620_000, period_revenue: 310_000, period_holder_revenue: 155_000, revenue_yield_pct: 9.4, holder_count: 85_000 },
  { name: "Aave", slug: "aave", primary_category: "lending", token_symbol: "AAVE", fees_24h: 1_100_000, revenue_24h: 440_000, holder_revenue_24h: 66_000, market_cap_usd: 3_200_000_000, real_pe_ratio: 133, revenue_yield: 0.0075, productive_token_score: 5.4, holder_growth_30d: 4.2, total_holders: 120_000, period_fees: 1_100_000, period_revenue: 440_000, period_holder_revenue: 66_000, revenue_yield_pct: 0.75, holder_count: 120_000 },
  { name: "Pendle", slug: "pendle", primary_category: "yield", token_symbol: "PENDLE", fees_24h: 480_000, revenue_24h: 192_000, holder_revenue_24h: 153_600, market_cap_usd: 700_000_000, real_pe_ratio: 12.5, revenue_yield: 0.08, productive_token_score: 7.6, holder_growth_30d: 15.2, total_holders: 42_000, period_fees: 480_000, period_revenue: 192_000, period_holder_revenue: 153_600, revenue_yield_pct: 8.0, holder_count: 42_000 },
  { name: "Jupiter", slug: "jupiter", primary_category: "dex", token_symbol: "JUP", fees_24h: 950_000, revenue_24h: 237_500, holder_revenue_24h: 118_750, market_cap_usd: 2_100_000_000, real_pe_ratio: 48.4, revenue_yield: 0.021, productive_token_score: 6.1, holder_growth_30d: 22.1, total_holders: 195_000, period_fees: 950_000, period_revenue: 237_500, period_holder_revenue: 118_750, revenue_yield_pct: 2.1, holder_count: 195_000 },
  { name: "MakerDAO", slug: "makerdao", primary_category: "cdp", token_symbol: "MKR", fees_24h: 820_000, revenue_24h: 328_000, holder_revenue_24h: 262_400, market_cap_usd: 1_800_000_000, real_pe_ratio: 18.8, revenue_yield: 0.053, productive_token_score: 7.4, holder_growth_30d: 1.2, total_holders: 52_000, period_fees: 820_000, period_revenue: 328_000, period_holder_revenue: 262_400, revenue_yield_pct: 5.3, holder_count: 52_000 },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ScreenerPage() {
  const [category, setCategory] = useState<Category>("All");
  const [sortBy, setSortBy] = useState("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [data, setData] = useState<ScreenerRow[]>(MOCK_DATA);

  /* ---- Fetch from API on mount and when category changes ---- */
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const catParam =
          category !== "All" ? `&category=${category.toLowerCase()}` : "";
        const res = await fetch(
          `${API_BASE}/screener?limit=100&sort_by=${sortBy}&sort_dir=${sortDir}${catParam}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = await res.json();
        const rows: ScreenerRow[] = (json.protocols ?? json.data ?? json).map(
          (p: any) => ({
            ...p,
            period_fees: p.fees_24h ?? p.period_fees ?? 0,
            period_revenue: p.revenue_24h ?? p.period_revenue ?? 0,
            period_holder_revenue:
              p.holder_revenue_24h ?? p.period_holder_revenue ?? 0,
            revenue_yield_pct:
              p.revenue_yield != null ? p.revenue_yield * 100 : p.revenue_yield_pct ?? null,
            holder_count: p.total_holders ?? p.holder_count ?? null,
          }),
        );
        setData(rows);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          /* Silently fall back to mock data */
          setData(MOCK_DATA);
        }
      }
    }

    fetchData();
    return () => controller.abort();
  }, [category, sortBy, sortDir]);

  /* ---- Client-side sort + filter ---- */
  const filtered = useMemo(() => {
    let rows = [...data];

    if (category !== "All") {
      rows = rows.filter(
        (r) => r.primary_category.toLowerCase() === category.toLowerCase(),
      );
    }

    const key = sortBy as string;
    rows.sort((a: any, b: any) => {
      const va = a[key] ?? -Infinity;
      const vb = b[key] ?? -Infinity;
      return sortDir === "desc" ? vb - va : va - vb;
    });

    return rows;
  }, [data, category, sortBy, sortDir]);

  /* ---- Toggle sort direction ---- */
  const toggleDir = useCallback(
    () => setSortDir((d) => (d === "desc" ? "asc" : "desc")),
    [],
  );

  return (
    <div>
      {/* ---- Title ---- */}
      <h1 className="text-2xl font-bold">Protocol Screener</h1>
      <hr className="border-t-2 border-[#111] mt-2 mb-6" />

      {/* ---- Filter bar ---- */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-xs text-[#888] uppercase tracking-wide">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="text-sm border border-[#d0d0d0] bg-white px-2 py-1 focus:outline-none focus:border-[#111]"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label className="text-xs text-[#888] uppercase tracking-wide ml-4">
          Sort by
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-sm border border-[#d0d0d0] bg-white px-2 py-1 focus:outline-none focus:border-[#111]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={toggleDir}
          className="text-xs text-[#888] border border-[#d0d0d0] bg-white px-2 py-1 hover:text-[#111] hover:border-[#111] transition-colors"
        >
          {sortDir === "desc" ? "Desc" : "Asc"}
        </button>

        <span className="ml-auto text-xs text-[#888] italic">
          {filtered.length} protocol{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ---- Scatter plots ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div>
          <hr className="border-t border-[#d0d0d0] mb-4" />
          <ValuationScatter protocols={filtered} height={340} />
        </div>
        <div>
          <hr className="border-t border-[#d0d0d0] mb-4" />
          <GrowthYieldScatter protocols={filtered} height={340} />
        </div>
      </div>

      {/* ---- Data table ---- */}
      <hr className="border-t-2 border-[#111] mb-1" />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#111]">
              <Th align="left" w="w-6">#</Th>
              <Th align="left">Protocol</Th>
              <Th align="left">Category</Th>
              <Th>Fees 24h</Th>
              <Th>Revenue</Th>
              <Th>Holder Rev</Th>
              <Th>Mkt Cap</Th>
              <Th>Real P/E</Th>
              <Th>Yield</Th>
              <Th>Growth 30d</Th>
              <Th align="center">Score</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.slug}
                className="border-b border-[#e8e8e8] hover:bg-[#f8f7f4] transition-colors"
              >
                <td className="px-2 py-2 text-sm tabular-nums text-[#888]">
                  {i + 1}
                </td>
                <td className="px-2 py-2">
                  <a
                    href={`/ventures/${p.slug}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {p.name}
                  </a>
                  {p.token_symbol && (
                    <span className="text-xs text-[#888] ml-1.5">
                      {p.token_symbol}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2 text-xs text-[#888] capitalize">
                  {(p.primary_category || "").replace(/_/g, " ")}
                </td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">
                  {formatUSD(p.fees_24h, true)}
                </td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">
                  {formatUSD(p.revenue_24h, true)}
                </td>
                <td className="px-2 py-2 text-sm text-right tabular-nums font-semibold">
                  {formatUSD(p.holder_revenue_24h, true)}
                </td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">
                  {formatUSD(p.market_cap_usd, true)}
                </td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">
                  {formatRatio(p.real_pe_ratio)}
                </td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">
                  {p.revenue_yield != null
                    ? `${(p.revenue_yield * 100).toFixed(1)}%`
                    : "\u2014"}
                </td>
                <td className="px-2 py-2 text-sm text-right tabular-nums">
                  {p.holder_growth_30d != null
                    ? `${p.holder_growth_30d >= 0 ? "+" : ""}${p.holder_growth_30d.toFixed(1)}%`
                    : "\u2014"}
                </td>
                <td className="px-2 py-2 text-center">
                  <ProductiveScore
                    score={p.productive_token_score}
                    size="sm"
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="px-2 py-8 text-center text-sm text-[#888] italic"
                >
                  No protocols match the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table header helper                                                */
/* ------------------------------------------------------------------ */

function Th({
  children,
  align = "right",
  w,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
  w?: string;
}) {
  const alignClass =
    align === "left"
      ? "text-left"
      : align === "center"
        ? "text-center"
        : "text-right";
  return (
    <th
      className={`px-2 py-2 italic font-normal text-xs text-[#888] ${alignClass} ${w || ""}`}
    >
      {children}
    </th>
  );
}
