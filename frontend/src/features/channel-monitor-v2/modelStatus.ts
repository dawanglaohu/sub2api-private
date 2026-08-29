import type {
  HealthState,
  LatencyMetric,
  MonitorCoverage,
  MonitorHealth,
  MonitorMatrixBucket,
  MonitorMatrixRow,
  MonitorMetric,
} from '@/api/channelMonitorV2'
import { healthModeScore } from '@/features/channel-monitor-v2/monitorFormat'

export interface MonitorBucketSlot {
  start: string
  bucket?: MonitorMatrixBucket
}

/** Safety cap: 24h@5min = 288, 3d@15min = 288, 7d@1h = 168 — 400 leaves headroom. */
const MAX_RENDERED_BUCKETS = 400

/**
 * A model row is "active" only when the backend produced at least one real
 * traffic bucket. Matrix seeds zero-traffic rows from config (request_count=0,
 * no buckets), and non-admin payloads redact request_count to 0 even when
 * traffic exists — so bucket presence is the only privacy-safe liveness signal.
 */
export function monitorRowHasTraffic(row: MonitorMatrixRow): boolean {
  return Array.isArray(row.buckets) && row.buckets.length > 0
}

/**
 * Expand row buckets into an evenly spaced slot list spanning the requested
 * window (24h → 24 hourly slots). Slots without a backend bucket stay empty
 * so the strip always renders the same fixed width.
 */
export function alignMonitorBuckets(
  row: MonitorMatrixRow,
  coverage: MonitorCoverage,
): MonitorBucketSlot[] {
  const stepMs = Math.max(60, Number(coverage.bucket_seconds) || 0) * 1000
  const startMs = Date.parse(coverage.requested_start)
  const endMs = coverage.requested_end ? Date.parse(coverage.requested_end) : NaN
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
    return (row.buckets || [])
      .slice()
      .sort((a, b) => Date.parse(a.bucket_start) - Date.parse(b.bucket_start))
      .map((bucket) => ({ start: new Date(bucket.bucket_start).toISOString(), bucket }))
  }

  const count = Math.min(MAX_RENDERED_BUCKETS, Math.ceil((endMs - startMs) / stepMs))
  const bucketByStart = new Map<string, MonitorMatrixBucket>()
  for (const bucket of row.buckets || []) {
    const timestamp = Date.parse(bucket.bucket_start)
    if (Number.isFinite(timestamp)) {
      bucketByStart.set(new Date(timestamp).toISOString(), bucket)
    }
  }

  return Array.from({ length: count }, (_, index) => {
    const start = new Date(startMs + index * stepMs).toISOString()
    return { start, bucket: bucketByStart.get(start) }
  })
}

/** Display state for a health payload: score bands first, coarse state as fallback. */
export function monitorHealthState(health: MonitorHealth | undefined): HealthState {
  if (!health) return 'unknown'
  const score = healthModeScore(health, 'overall')
  if (score != null) {
    if (score >= 80) return 'healthy'
    if (score >= 50) return 'warning'
    return 'critical'
  }
  return health.overall || 'unknown'
}

export function monitorRowState(row: MonitorMatrixRow): HealthState {
  return monitorHealthState(row.health)
}

/** Sort weight: critical first, unknown/low-sample last. */
export function monitorHealthSeverity(state: HealthState | undefined): number {
  switch (state) {
    case 'critical':
      return 0
    case 'warning':
      return 1
    case 'healthy':
      return 2
    default:
      return 3
  }
}

/** Buckets that need operator attention (warning + critical). */
export function countAttentionBuckets(row: MonitorMatrixRow): number {
  return (row.buckets || []).filter((bucket) => {
    const state = monitorHealthState(bucket.health)
    return state === 'critical' || state === 'warning'
  }).length
}

export function latestMonitorBucket(row: MonitorMatrixRow): MonitorMatrixBucket | undefined {
  return (row.buckets || []).reduce<MonitorMatrixBucket | undefined>((latest, bucket) => {
    if (!latest) return bucket
    return Date.parse(bucket.bucket_start) > Date.parse(latest.bucket_start) ? bucket : latest
  }, undefined)
}

// ---------------------------------------------------------------------------
// Display downsampling: merge the full window into a fixed number of uniform
// blocks so 24h/3d/7d all fit the card width without scrolling.
// ---------------------------------------------------------------------------

export interface MonitorDisplaySlot {
  start: string
  /** Exclusive end timestamp (ms) — spans every merged underlying interval. */
  endMs: number
  /** Synthesized worst-of bucket when the group contains any data. */
  bucket?: MonitorMatrixBucket
}

const HEALTH_SEVERITY: Record<HealthState, number> = {
  critical: 0,
  warning: 1,
  healthy: 2,
  unknown: 3,
}

/** Split `total` items into `parts` contiguous groups whose sizes differ by ≤1. */
function partitionEven(total: number, parts: number): Array<[number, number]> {
  const groups: Array<[number, number]> = []
  for (let i = 0; i < parts; i += 1) {
    const from = Math.floor((i * total) / parts)
    const to = Math.floor(((i + 1) * total) / parts)
    if (to > from) groups.push([from, to])
  }
  return groups
}

function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Weighted mean; falls back to equal weights when every weight is 0 (redacted payloads). */
function weightedAverage(values: number[], weights: number[]): number {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  if (totalWeight <= 0) return average(values)
  return values.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight
}

function averageLatency(list: LatencyMetric[]): LatencyMetric {
  const pick = (key: 'p50_ms' | 'p90_ms' | 'p95_ms' | 'avg_ms'): number | null => {
    const values = list.map((l) => l[key]).filter((v): v is number => v != null)
    return values.length ? Math.round(average(values)) : null
  }
  return {
    sample_count: list.reduce((sum, l) => sum + (l.sample_count || 0), 0),
    p50_ms: pick('p50_ms'),
    p90_ms: pick('p90_ms'),
    p95_ms: pick('p95_ms'),
    avg_ms: pick('avg_ms'),
  }
}

function mergeGroupMetrics(buckets: MonitorMatrixBucket[]): MonitorMetric {
  const metrics = buckets.map((b) => b.metrics)
  const sum = (key: 'success_requests' | 'error_requests' | 'request_count' | 'token_count' | 'cache_rate_numerator' | 'cache_rate_denominator') =>
    metrics.reduce((acc, m) => acc + (m[key] || 0), 0)
  return {
    success_requests: sum('success_requests'),
    error_requests: sum('error_requests'),
    request_count: sum('request_count'),
    token_count: sum('token_count'),
    // Rates: weighted by their natural denominators; redacted payloads (all
    // counts zeroed) fall back to equal weights so users still see real trends.
    error_rate: weightedAverage(metrics.map((m) => m.error_rate || 0), metrics.map((m) => m.request_count || 0)),
    cache_rate: weightedAverage(metrics.map((m) => m.cache_rate || 0), metrics.map((m) => m.cache_rate_denominator || 0)),
    cache_rate_numerator: sum('cache_rate_numerator'),
    cache_rate_denominator: sum('cache_rate_denominator'),
    rpm: average(metrics.map((m) => m.rpm || 0)),
    tpm: average(metrics.map((m) => m.tpm || 0)),
    ttft: averageLatency(metrics.map((m) => m.ttft)),
    duration: averageLatency(metrics.map((m) => m.duration)),
  }
}

/**
 * Merge aligned slots into ≤`target` uniform display blocks covering the FULL
 * window. Health = worst of the group (a short spike must stay visible);
 * metrics = sums/weighted averages for the tooltip. Groups without any data
 * stay empty. When the window already fits (N ≤ target) blocks pass through 1:1.
 */
export function downsampleMonitorSlots(
  slots: MonitorBucketSlot[],
  target: number,
  bucketSeconds: number,
): MonitorDisplaySlot[] {
  const stepMs = Math.max(60, bucketSeconds) * 1000
  if (slots.length <= target) {
    return slots.map((slot) => ({
      start: slot.start,
      endMs: Date.parse(slot.start) + stepMs,
      bucket: slot.bucket,
    }))
  }
  return partitionEven(slots.length, target).map(([from, to]) => {
    const group = slots.slice(from, to)
    const dataBuckets = group
      .map((slot) => slot.bucket)
      .filter((bucket): bucket is MonitorMatrixBucket => Boolean(bucket))
    const withData = dataBuckets.filter((bucket) => monitorHealthState(bucket.health) !== 'unknown')
    const base: MonitorDisplaySlot = {
      start: group[0].start,
      endMs: Date.parse(group[group.length - 1].start) + stepMs,
    }
    if (!withData.length) return base
    const worst = withData.reduce((worst, bucket) =>
      HEALTH_SEVERITY[monitorHealthState(bucket.health)] <
      HEALTH_SEVERITY[monitorHealthState(worst.health)]
        ? bucket
        : worst,
    )
    return {
      ...base,
      bucket: { ...worst, metrics: mergeGroupMetrics(dataBuckets), health: worst.health },
    }
  })
}
