import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "",

  providers: {
    defillama: {
      baseUrl: "https://api.llama.fi",
      proBaseUrl: "https://pro-api.llama.fi",
      apiKey: process.env.DEFILLAMA_API_KEY || "",
      rateLimit: { maxConcurrent: 5, minTime: 100 },
    },
    coingecko: {
      baseUrl: "https://pro-api.coingecko.com/api/v3",
      apiKey: process.env.COINGECKO_API_KEY || "",
      rateLimit: { maxConcurrent: 10, minTime: 150 },
    },
    codex: {
      baseUrl: "https://graph.codex.io/graphql",
      apiKey: process.env.CODEX_API_KEY || "",
      rateLimit: { maxConcurrent: 10, minTime: 50 },
    },
    santiment: {
      baseUrl: "https://api.santiment.net/graphql",
      apiKey: process.env.SANTIMENT_API_KEY || "",
      rateLimit: { maxConcurrent: 5, minTime: 200 },
    },
    allium: {
      baseUrl: "https://api.allium.so",
      apiKey: process.env.ALLIUM_API_KEY || "",
      rateLimit: { maxConcurrent: 1, minTime: 1100 }, // Allium enforces strict 1 req/sec
    },
  },

  ingestion: {
    dailyRunHour: 1,  // 01:00 UTC
    hourlyTokens: 20, // top N tokens for hourly updates
    holderDetailBatchSize: 50,
    backfillChunkDays: 90,
  },
} as const;
