import Bottleneck from "bottleneck";

export interface RateLimitConfig {
  maxConcurrent: number;
  minTime: number;
}

const limiters = new Map<string, Bottleneck>();

export function getLimiter(provider: string, config: RateLimitConfig): Bottleneck {
  if (!limiters.has(provider)) {
    limiters.set(
      provider,
      new Bottleneck({
        maxConcurrent: config.maxConcurrent,
        minTime: config.minTime,
        reservoir: 1000,
        reservoirRefreshAmount: 1000,
        reservoirRefreshInterval: 60 * 1000,
      })
    );
  }
  return limiters.get(provider)!;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 4,
  baseDelay = 2000
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`,
          (error as Error).message
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
