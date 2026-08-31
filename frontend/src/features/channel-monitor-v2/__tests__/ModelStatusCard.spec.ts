import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ModelStatusCard from '../ModelStatusCard.vue'
import type { MonitorCoverage, MonitorHealth, MonitorMatrixBucket, MonitorMatrixRow } from '@/api/channelMonitorV2'

const i18nT = (key: string, params?: Record<string, unknown>) => {
  const map: Record<string, string> = {
    'channelMonitorV2.otherModels': '其他模型',
    'channelMonitorV2.matrix.scoreLine': '健康分 {score}',
    'channelMonitorV2.matrix.noTrafficAt': '{time} · 无流量',
    'channelMonitorV2.matrix.noTraffic': '无流量',
    'channelMonitorV2.metrics.successRate': '成功率',
    'channelMonitorV2.metrics.ttftP50': '首 Token P50',
    'channelMonitorV2.metrics.cacheRate': '缓存率',
    'channelMonitorV2.metrics.tps': '每秒 Token',
    'channelMonitorV2.metrics.rpm': 'RPM',
    'channelMonitorV2.metrics.successRateValue': '成功率 {value}',
    'channelMonitorV2.metrics.errorRateValue': '错误率 {value}',
    'channelMonitorV2.metrics.ttftValue': '首 Token {value}',
    'channelMonitorV2.metrics.cacheRateValue': '缓存率 {value}',
    'channelMonitorV2.metrics.tpsValue': '每秒 Token {value}',
    'channelMonitorV2.metrics.rpmValue': 'RPM {value}',
    'channelMonitorV2.metrics.cacheDetail': '读缓存占比',
    'channelMonitorV2.metrics.tpsDetail': '由 TPM ÷ 60 换算',
    'channelMonitorV2.metrics.rpmDetail': '每分钟请求数',
    'channelMonitorV2.status.stateHealthy': '健康',
    'channelMonitorV2.status.stateWarning': '需关注',
    'channelMonitorV2.status.stateCritical': '异常',
    'channelMonitorV2.status.stateUnknown': '样本不足',
    'channelMonitorV2.status.activeBuckets': '活跃区间',
    'channelMonitorV2.status.attentionBuckets': '需关注区间',
    'channelMonitorV2.status.viewHint': '悬停或点击色块查看该小时明细',
  }
  const template = map[key] || key
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? ''))
}

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: i18nT,
      te: (key: string) => key.startsWith('channelMonitorV2.'),
      locale: { value: 'zh' },
    }),
  }
})

vi.mock('@/components/common/PlatformIcon.vue', () => ({
  default: { name: 'PlatformIcon', template: '<i data-testid="platform-icon"></i>' },
}))

const health: MonitorHealth = {
  overall: 'healthy',
  error_rate: 'healthy',
  ttft: 'healthy',
  cache: 'healthy',
  score: 92,
  error_rate_score: 100,
  ttft_score: 90,
  cache_score: 85,
  minimum_sample: 20,
}

function metrics(requestCount: number) {
  return {
    success_requests: requestCount,
    error_requests: 0,
    request_count: requestCount,
    token_count: 1000,
    rpm: 12,
    tpm: 720,
    error_rate: 0,
    cache_rate: 0.74,
    cache_rate_numerator: 74,
    cache_rate_denominator: 100,
    ttft: { sample_count: requestCount, p50_ms: 820, p90_ms: 1400, p95_ms: 1800, avg_ms: 960 },
    duration: { sample_count: requestCount, p50_ms: 2000, p95_ms: 4000, avg_ms: 2400 },
  }
}

function bucketAt(start: string, score: number | null, overall: MonitorHealth['overall']): MonitorMatrixBucket {
  return {
    bucket_start: start,
    metrics: metrics(10),
    health: { ...health, score, overall },
  }
}

function row(overrides: Partial<MonitorMatrixRow> = {}): MonitorMatrixRow {
  return {
    platform: 'anthropic',
    model: 'claude-sonnet-4',
    metrics: metrics(240),
    health,
    buckets: [],
    ...overrides,
  }
}

const coverage: MonitorCoverage = {
  requested_start: '2026-08-01T00:00:00Z',
  requested_end: '2026-08-02T00:00:00Z',
  coverage_start: '2026-08-01T00:00:00Z',
  data_through: '2026-08-01T06:00:00Z',
  computed_at: '2026-08-01T06:00:00Z',
  aggregation_lag_seconds: 0,
  coverage_complete: true,
  bucket_seconds: 300,
}

function mountCard(props: Record<string, unknown> = {}) {
  return mount(ModelStatusCard, {
    props: {
      row: row(),
      coverage,
      showThroughput: true,
      ...props,
    },
  })
}

describe('ModelStatusCard', () => {
  it('renders 60 uniform display blocks covering the full window, no scroll', () => {
    const wrapper = mountCard({
      row: row({
        buckets: [
          bucketAt('2026-08-01T23:00:00Z', 95, 'healthy'),
          bucketAt('2026-08-01T23:30:00Z', 30, 'critical'),
        ],
      }),
    })
    const cells = wrapper.findAll('.strip-cell')
    // Full 24h window downsampled into a fixed 60 uniform display blocks.
    expect(cells).toHaveLength(60)
    expect(wrapper.find('.status-strip').classes()).not.toContain('overflow-x-auto')
    // Card must clip its strip: color blocks never leave the card area.
    expect(wrapper.find('article').classes()).toContain('overflow-hidden')
    // 23:00 (slot 276) lands in merged block 57; 23:30 (slot 282) in block 58.
    expect(cells[57].classes().some((c) => c.startsWith('health-score'))).toBe(true)
    expect(cells[58].classes().some((c) => c.startsWith('health-score'))).toBe(true)
    expect(cells[49].classes()).toContain('cell-empty')
    // Success-rate sub-label keeps the full data window (24h).
    expect(wrapper.text()).toContain('24h')
  })

  it('shows interval detail on hover with rates, latency and throughput (no absolute counts)', async () => {
    const wrapper = mountCard({
      row: row({
        buckets: [bucketAt('2026-08-01T23:00:00Z', 95, 'healthy')],
      }),
    })
    // Panel is teleported to <body> so the card's overflow-hidden cannot clip it.
    const tooltipEl = () => document.body.querySelector('[role="tooltip"]')
    expect(wrapper.find('[role="tooltip"]').exists()).toBe(false)
    expect(tooltipEl()).toBeNull()
    await wrapper.findAll('.strip-cell')[57].trigger('mouseenter')
    const tooltip = tooltipEl()
    expect(tooltip).not.toBeNull()
    expect(tooltip!.className).toContain('fixed')
    const text = tooltip!.textContent || ''
    expect(text).toContain('成功率')
    expect(text).toContain('错误率')
    expect(text).toContain('首 Token')
    expect(text).toContain('缓存率')
    expect(text).toContain('每秒 Token')
    expect(text).toContain('RPM')
    // Privacy: no absolute request/token volumes in the detail panel.
    expect(text).not.toContain('请求数')
    expect(text).not.toContain('Token 数')
    // Leaving the strip hides the detail again.
    await wrapper.find('.status-strip').trigger('mouseleave')
    expect(tooltipEl()).toBeNull()
  })

  it('labels model state, counts attention buckets and honors throughput privacy', () => {
    const attentionRow = row({
      health: { ...health, score: 55, overall: 'warning' as const },
      buckets: [
        bucketAt('2026-08-01T22:30:00Z', 60, 'warning'),
        bucketAt('2026-08-01T23:00:00Z', 30, 'critical'),
        bucketAt('2026-08-01T23:30:00Z', 95, 'healthy'),
      ],
    })
    const wrapper = mountCard({ row: attentionRow, showThroughput: false })
    const text = wrapper.text()
    expect(text).toContain('需关注')
    expect(text).toContain('健康分 55')
    expect(text).toContain('需关注区间 2')
    // Full-window stat (288 five-minute slots) even though the strip shows recent 60
    expect(text).toContain('活跃区间 3/288')
    // Metric chips: one boxed, centered tile per metric; throughput hidden → no RPM tile.
    expect(wrapper.findAll('.metric-chip')).toHaveLength(3)
    expect(text).not.toContain('RPM')
  })

  it('renders other-model buckets under the localized label', () => {
    const wrapper = mountCard({ row: row({ model: '__other__' }) })
    expect(wrapper.text()).toContain('其他模型')
  })
})
