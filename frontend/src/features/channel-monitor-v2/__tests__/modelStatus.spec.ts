import { describe, expect, it } from 'vitest'
import type {
  MonitorCoverage,
  MonitorHealth,
  MonitorMatrixBucket,
  MonitorMatrixRow,
} from '@/api/channelMonitorV2'
import {
  alignMonitorBuckets,
  countAttentionBuckets,
  downsampleMonitorSlots,
  latestMonitorBucket,
  monitorHealthSeverity,
  monitorHealthState,
  monitorRowHasTraffic,
  monitorRowState,
  type MonitorBucketSlot,
} from '../modelStatus'

function health(overrides: Partial<MonitorHealth> = {}): MonitorHealth {
  return {
    overall: 'healthy',
    error_rate: 'healthy',
    ttft: 'healthy',
    cache: 'healthy',
    score: 90,
    minimum_sample: 20,
    ...overrides,
  }
}

function bucket(start: string, score: number | null, overall: MonitorHealth['overall']): MonitorMatrixBucket {
  return {
    bucket_start: start,
    metrics: {
      success_requests: 5,
      error_requests: 0,
      request_count: 5,
      token_count: 100,
      rpm: 1,
      tpm: 10,
      error_rate: 0,
      cache_rate: 0.5,
      cache_rate_numerator: 1,
      cache_rate_denominator: 2,
      ttft: { sample_count: 5, p50_ms: 100, p95_ms: 200, avg_ms: 120 },
      duration: { sample_count: 5, p50_ms: 400, p95_ms: 800, avg_ms: 500 },
    },
    health: health({ score, overall }),
  }
}

function row(overrides: Partial<MonitorMatrixRow> = {}): MonitorMatrixRow {
  return {
    platform: 'openai',
    model: 'gpt-5',
    metrics: bucket('2026-08-01T00:00:00Z', 90, 'healthy').metrics,
    health: health(),
    buckets: [],
    ...overrides,
  }
}

const coverage: MonitorCoverage = {
  requested_start: '2026-08-01T00:00:00Z',
  requested_end: '2026-08-02T00:00:00Z',
  coverage_start: '2026-08-01T00:00:00Z',
  data_through: '2026-08-01T12:00:00Z',
  computed_at: '2026-08-01T12:00:00Z',
  aggregation_lag_seconds: 0,
  coverage_complete: true,
  bucket_seconds: 300,
}

describe('monitorRowHasTraffic', () => {
  it('is false for seeded zero-traffic rows and true once buckets exist', () => {
    expect(monitorRowHasTraffic(row())).toBe(false)
    expect(monitorRowHasTraffic(row({ buckets: [bucket('2026-08-01T05:00:00Z', 90, 'healthy')] }))).toBe(true)
  })
})

describe('alignMonitorBuckets', () => {
  it('expands the requested 24h window into 288 five-minute slots (production shape)', () => {
    const buckets = [
      bucket('2026-08-01T00:30:00Z', 95, 'healthy'),
      bucket('2026-08-01T01:00:00Z', 40, 'critical'),
    ]
    const slots = alignMonitorBuckets(row({ buckets }), coverage)
    expect(slots).toHaveLength(288)
    expect(slots[0].bucket).toBeUndefined()
    expect(slots[6].bucket?.health.score).toBe(95)
    expect(slots[12].bucket?.health.score).toBe(40)
    expect(slots[7].bucket).toBeUndefined()
  })

  it('still supports hourly coverage payloads (24 slots)', () => {
    const slots = alignMonitorBuckets(row(), { ...coverage, bucket_seconds: 3600 })
    expect(slots).toHaveLength(24)
  })

  it('falls back to raw sorted buckets when the coverage window is unusable', () => {
    const buckets = [
      bucket('2026-08-01T03:00:00Z', 95, 'healthy'),
      bucket('2026-08-01T01:00:00Z', 95, 'healthy'),
    ]
    const slots = alignMonitorBuckets(row({ buckets }), {
      ...coverage,
      requested_start: '2026-08-02T00:00:00Z',
      requested_end: '2026-08-01T00:00:00Z',
    })
    expect(slots).toHaveLength(2)
    expect(slots[0].start).toBe('2026-08-01T01:00:00.000Z')
    expect(slots[1].start).toBe('2026-08-01T03:00:00.000Z')
  })
})

describe('monitorHealthState / severity', () => {
  it('derives state from score bands before coarse state', () => {
    expect(monitorHealthState(health({ score: 85 }))).toBe('healthy')
    expect(monitorHealthState(health({ score: 60 }))).toBe('warning')
    expect(monitorHealthState(health({ score: 30 }))).toBe('critical')
    // Redacted user payloads may lack score: fall back to coarse state.
    expect(monitorHealthState(health({ score: null, overall: 'warning' }))).toBe('warning')
    expect(monitorHealthState(health({ score: null, overall: 'unknown' }))).toBe('unknown')
    expect(monitorHealthState(undefined)).toBe('unknown')
  })

  it('orders critical before warning before healthy before unknown', () => {
    expect(monitorHealthSeverity('critical')).toBeLessThan(monitorHealthSeverity('warning'))
    expect(monitorHealthSeverity('warning')).toBeLessThan(monitorHealthSeverity('healthy'))
    expect(monitorHealthSeverity('healthy')).toBeLessThan(monitorHealthSeverity('unknown'))
  })

  it('monitorRowState mirrors monitorHealthState on the row', () => {
    expect(monitorRowState(row({ health: health({ score: 30 }) }))).toBe('critical')
  })
})

describe('countAttentionBuckets / latestMonitorBucket', () => {
  it('counts warning + critical buckets only', () => {
    const buckets = [
      bucket('2026-08-01T01:00:00Z', 95, 'healthy'),
      bucket('2026-08-01T02:00:00Z', 60, 'warning'),
      bucket('2026-08-01T03:00:00Z', 30, 'critical'),
    ]
    expect(countAttentionBuckets(row({ buckets }))).toBe(2)
    expect(countAttentionBuckets(row())).toBe(0)
  })

  it('returns the newest bucket', () => {
    const buckets = [
      bucket('2026-08-01T01:00:00Z', 95, 'healthy'),
      bucket('2026-08-01T05:00:00Z', 95, 'healthy'),
      bucket('2026-08-01T03:00:00Z', 95, 'healthy'),
    ]
    expect(latestMonitorBucket(row({ buckets }))?.bucket_start).toBe('2026-08-01T05:00:00Z')
    expect(latestMonitorBucket(row())).toBeUndefined()
  })
})

describe('downsampleMonitorSlots', () => {
  const bucketSeconds = 300
  const slotStart = (i: number) =>
    new Date(Date.parse('2026-08-01T00:00:00Z') + i * 300_000).toISOString()

  function slotList(
    n: number,
    bucketAt?: (i: number) => MonitorMatrixBucket | undefined,
  ): MonitorBucketSlot[] {
    return Array.from({ length: n }, (_, i) => ({
      start: slotStart(i),
      bucket: bucketAt?.(i),
    }))
  }

  it('passes slots through unchanged when the window already fits the target', () => {
    const slots = slotList(24)
    const out = downsampleMonitorSlots(slots, 60, bucketSeconds)
    expect(out).toHaveLength(24)
    expect(out[0].start).toBe(slots[0].start)
    expect(out[0].endMs).toBe(Date.parse(slots[0].start) + 300_000)
    expect(out[3].bucket).toBeUndefined()
  })

  it('merges 288 five-minute slots into 60 uniform blocks covering the full window', () => {
    const slots = slotList(288, (i) => bucket(slotStart(i), 95, 'healthy'))
    const out = downsampleMonitorSlots(slots, 60, bucketSeconds)
    expect(out).toHaveLength(60)
    expect(out[0].start).toBe(slots[0].start)
    expect(out[59].endMs).toBe(Date.parse(slots[287].start) + 300_000)
    // Every underlying interval is accounted for: request_count sums to 288 × 5
    const total = out.reduce((sum, block) => sum + (block.bucket?.metrics.request_count || 0), 0)
    expect(total).toBe(288 * 5)
    // Uniform time coverage: group sizes differ by at most one slot
    const sizes = out.map((block) => (block.bucket?.metrics.request_count || 0) / 5)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  })

  it('propagates the worst health of a merged group (short spikes stay visible)', () => {
    const slots = slotList(288, (i) =>
      bucket(slotStart(i), i === 276 ? 30 : 95, i === 276 ? 'critical' : 'healthy'),
    )
    const out = downsampleMonitorSlots(slots, 60, bucketSeconds)
    const critical = out.filter(
      (block) => block.bucket && monitorHealthState(block.bucket.health) === 'critical',
    )
    expect(critical).toHaveLength(1)
    // And it is the block containing slot 276 (the 23:00 spike):
    // proportional split → block 57 covers slots [273, 278)
    expect(critical[0].start).toBe(slotStart(273))
  })

  it('marks groups without any data as empty', () => {
    const sparse = slotList(288, (i) => (i < 30 ? bucket(slotStart(i), 95, 'healthy') : undefined))
    const out = downsampleMonitorSlots(sparse, 60, bucketSeconds)
    expect(out[0].bucket).toBeDefined()
    expect(out[30].bucket).toBeUndefined()
    // Unknown (no-traffic) buckets never paint health green over data groups
    const mixed = slotList(4, (i) =>
      i === 0 ? undefined : bucket(slotStart(i), 95, 'healthy'),
    )
    const merged = downsampleMonitorSlots(mixed, 2, bucketSeconds)
    expect(merged[0].bucket?.health.overall).toBe('healthy')
  })

  it('falls back to equal-weight rate averages when counts are redacted to zero', () => {
    const slots = slotList(4, (i) => {
      const b = bucket(slotStart(i), 90, 'healthy')
      b.metrics = {
        ...b.metrics,
        request_count: 0,
        success_requests: 0,
        error_requests: 0,
        error_rate: i % 2 === 0 ? 0.1 : 0.3,
      }
      return b
    })
    const out = downsampleMonitorSlots(slots, 2, bucketSeconds)
    expect(out[0].bucket?.metrics.error_rate).toBeCloseTo(0.2, 5)
    expect(out[1].bucket?.metrics.error_rate).toBeCloseTo(0.2, 5)
  })

  it('weights rates by request counts when absolute counts are available (admin)', () => {
    const slots = slotList(4, (i) => {
      const b = bucket(slotStart(i), 90, 'healthy')
      b.metrics = { ...b.metrics, request_count: i % 2 === 0 ? 5 : 15, error_rate: i % 2 === 0 ? 0.1 : 0.3 }
      return b
    })
    const out = downsampleMonitorSlots(slots, 2, bucketSeconds)
    // (5×0.1 + 15×0.3) / 20 = 0.25
    expect(out[0].bucket?.metrics.error_rate).toBeCloseTo(0.25, 5)
    expect(out[1].bucket?.metrics.error_rate).toBeCloseTo(0.25, 5)
  })
})
