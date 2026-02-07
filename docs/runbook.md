# Operations Runbook

## Daily Operations

### Ingestion Pipeline

The ingestion pipeline runs automatically via cron in production:

| Job | Schedule | Duration | Provider |
|---|---|---|---|
| Revenue ingestion | 01:00 UTC | ~10-30 min | DefiLlama |
| Market data ingestion | 02:00 UTC | ~5-15 min | CoinGecko |
| Holder snapshot | 03:00 UTC | ~15-45 min | Codex |
| Metrics computation | 04:00 UTC | ~5-10 min | Internal |
| Price updates | Every 15 min | ~1-2 min | CoinGecko |

### Monitoring

Check ingestion status:
```sql
SELECT id, provider, job_type, status, records_processed, records_failed,
       started_at, completed_at
FROM ingestion_run
ORDER BY started_at DESC
LIMIT 20;
```

Check for failed runs:
```sql
SELECT * FROM ingestion_run
WHERE status = 'failed'
AND started_at > NOW() - INTERVAL '24 hours';
```

### Manual Ingestion

Run specific jobs manually:
```bash
npm run ingest -- revenue   # Revenue data from DefiLlama
npm run ingest -- market    # Market data from CoinGecko
npm run ingest -- holders   # Holder snapshots from Codex
npm run ingest -- compute   # Recompute derived metrics
npm run ingest -- all       # Run all jobs sequentially
```

## Restatements

When historical data is revised:

1. The reconciliation process detects changes during daily pulls
2. New fact versions are written to the time-series tables
3. A row is appended to `restatement_log` with old/new values and reason
4. Computed metrics are recomputed for affected dates

Query recent restatements:
```sql
SELECT * FROM restatement_log
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## Backfill Operations

### Adding a New Protocol

1. Add the protocol to the seed data or insert directly:
```sql
INSERT INTO protocol (id, name, slug, defillama_id, coingecko_id, primary_category, tokenization_type)
VALUES (gen_random_uuid(), 'Protocol Name', 'slug', 'defillama-slug', 'coingecko-id', 'dex', 'tokenized');
```

2. Add token and rights data
3. Run ingestion for the new protocol

### Historical Backfill

Check backfill progress:
```sql
SELECT provider, endpoint, entity_id, earliest_date, latest_date, status, total_records
FROM backfill_checkpoint
ORDER BY updated_at DESC;
```

## Troubleshooting

### API Rate Limits

- DefiLlama: 1,000 req/min, 1M/month
- CoinGecko: 500 req/min, 500K/month
- Codex: 300 req/sec, 1M/month

If hitting rate limits, the Bottleneck rate limiter will automatically queue and throttle requests.

### Database Performance

Key indexes are on:
- `revenue_daily(protocol_id, date)`
- `token_market_daily(token_id, date)`
- `holder_snapshot(token_id, snapshot_date)`
- `computed_metrics(protocol_id, date)`

For slow queries, check if LATERAL joins in screener/dashboard need optimization.

### Data Quality Issues

Check for null or spike anomalies:
```sql
-- Revenue spikes (>10x previous day)
SELECT r1.protocol_id, r1.date, r1.daily_revenue_usd as current, r2.daily_revenue_usd as previous
FROM revenue_daily r1
JOIN revenue_daily r2 ON r1.protocol_id = r2.protocol_id AND r2.date = r1.date - 1
WHERE r1.daily_revenue_usd > r2.daily_revenue_usd * 10
AND r2.daily_revenue_usd > 0;
```
