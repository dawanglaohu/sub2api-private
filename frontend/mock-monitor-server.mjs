/**
 * Local dev mock API for the V2 passive monitor page (渠道状态 /monitor).
 *
 * Purpose: let the frontend dev server (pnpm dev) render the redesigned V2
 * monitor without a real Go backend. The vite dev proxy targets
 * http://localhost:8080 by default (VITE_DEV_PROXY_TARGET), which is where
 * this mock listens.
 *
 * DEV AID ONLY — never ship, never point production at this.
 * Login accepts ANY credentials and returns a mock admin user.
 *
 * Scenarios are time-aware (local timezone) so switching 24h / 3d / 7d shows
 * genuinely different histories:
 *   24h — mostly healthy, opus warning patches, o3 critical right now
 *   3d  — yesterday-afternoon multi-model incident, o3 recovered from an
 *         earlier burst, gpt-4.1-mini recovered this morning, zhipu only had
 *         traffic two days ago (invisible in 24h, visible here)
 *   7d  — shared-upstream outage 3 days ago (whole anthropic+openai wall red),
 *         deepseek error-rate ramping up all week, kimi appeared 2 days ago,
 *         zhipu stopped mid-week, weekend traffic dips
 *
 * Run:  node mock-monitor-server.mjs        (env: MOCK_PORT=8080)
 */
import http from 'node:http'
import { URL } from 'node:url'

const PORT = Number(process.env.MOCK_PORT || 8080)
const HOUR_MS = 3_600_000

// Per-range strip shape (mirrors backend ParseFilter): 24h@5min, 3d@15min, 7d@1h.
const RANGE_CONFIGS = {
  '24h': { stepMs: 300_000, count: 288 },
  '3d': { stepMs: 900_000, count: 288 },
  '7d': { stepMs: 3_600_000, count: 168 },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function send(res, payload, status = 200) {
  const body = JSON.stringify({ code: 0, message: 'ok', data: payload })
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

/** Score from error rate + ttft: err .005→~98, .06→~79, .12→~58, .35→0 */
function scoreOf(errorRate, ttftP50) {
  const ttftPenalty = ttftP50 > 1500 ? (ttftP50 - 1500) / 50 : 0
  return clamp(Math.round(100 - errorRate * 350 - ttftPenalty), 0, 100)
}

function overallOf(score) {
  if (score == null) return 'unknown'
  if (score >= 80) return 'healthy'
  if (score >= 50) return 'warning'
  return 'critical'
}

function healthOf(score, minimumSample = 20) {
  return {
    overall: overallOf(score),
    error_rate: overallOf(score == null ? null : clamp(Math.round(score + 8), 0, 100)),
    ttft: overallOf(score == null ? null : clamp(Math.round(score + 4), 0, 100)),
    cache: 'healthy',
    score,
    error_rate_score: score == null ? null : clamp(Math.round(score + 8), 0, 100),
    ttft_score: score == null ? null : clamp(Math.round(score + 4), 0, 100),
    cache_score: 92,
    minimum_sample: minimumSample,
  }
}

function latency(p50, p90 = null, p95 = null, avg = null) {
  return {
    sample_count: 42,
    p50_ms: p50,
    p90_ms: p90 ?? Math.round(p50 * 1.7),
    p95_ms: p95 ?? Math.round(p50 * 2.1),
    avg_ms: avg ?? Math.round(p50 * 1.15),
  }
}

function metrics({ req = 0, err = 0, tpm = 0, cache = 0.5, ttft = null } = {}) {
  const requests = req
  const errors = Math.min(err, req)
  return {
    success_requests: requests - errors,
    error_requests: errors,
    request_count: requests,
    token_count: Math.round(tpm * 60),
    rpm: requests / 60,
    tpm: tpm,
    error_rate: requests > 0 ? errors / requests : 0,
    cache_rate: cache,
    cache_rate_numerator: Math.round(tpm * 60 * cache),
    cache_rate_denominator: Math.round(tpm * 60),
    ttft: ttft == null ? latency(0) : latency(ttft),
    duration: ttft == null ? latency(0) : latency(ttft * 3),
  }
}

// ---------------------------------------------------------------------------
// Time & traffic shape (local timezone)
// ---------------------------------------------------------------------------

const tsOf = (daysAgo, hoursFloat) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d.getTime() + hoursFloat * HOUR_MS
}

const inWindow = (ts, from, to) => ts >= from && ts < to

/** Diurnal traffic curve: quiet 01:00–07:00, peaks late morning & evening. */
function trafficFactor(ts, weekendScale = 1) {
  const h = new Date(ts).getHours()
  let f
  if (h >= 1 && h < 7) f = 0.12
  else if (h < 9) f = 0.55
  else if (h < 12) f = 1
  else if (h < 14) f = 0.9
  else if (h < 19) f = 1
  else if (h < 23) f = 0.8
  else f = 0.35
  const day = new Date(ts).getDay()
  if (day === 0 || day === 6) f *= weekendScale
  return f
}

// ---------------------------------------------------------------------------
// Bucket synthesis
// ---------------------------------------------------------------------------

function buildRow(spec, requestedStartMs, endMs, stepMs, count) {
  const buckets = []
  const totals = { req: 0, err: 0, tpmSum: 0, cacheNum: 0, cacheDen: 0, ttftSum: 0, ttftCount: 0 }

  for (let i = 0; i < count; i++) {
    const ts = requestedStartMs + i * stepMs
    if (ts >= endMs) break
    let v = null
    if (spec.valueAt) {
      v = spec.valueAt(i, ts) || null
    } else {
      if ((spec.gaps || []).includes(i)) continue
      v = { err: spec.spikes?.[i] ?? spec.baseErr }
    }
    if (!v || v.gap) continue

    const errorRate = v.err ?? spec.baseErr ?? 0
    const req = Math.max(
      errorRate > 0 ? 1 : 0,
      Math.round(
        spec.req *
          trafficFactor(ts, spec.weekendScale ?? 1) *
          (v.scale ?? 1) *
          (0.85 + 0.3 * Math.abs(Math.sin(i * 1.7 + spec.phase))),
      ),
    )
    const err = Math.max(errorRate > 0 ? 1 : 0, Math.round(req * errorRate))
    const score = scoreOf(errorRate, spec.ttft)
    const bucketStart = requestedStartMs + i * stepMs
    buckets.push({
      bucket_start: new Date(bucketStart).toISOString(),
      metrics: metrics({ req, err, tpm: spec.tpm, cache: spec.cache, ttft: spec.ttft }),
      health: healthOf(score),
    })
    totals.req += req
    totals.err += err
    totals.tpmSum += spec.tpm
    totals.cacheNum += Math.round(spec.tpm * 60 * spec.cache)
    totals.cacheDen += Math.round(spec.tpm * 60)
    totals.ttftSum += spec.ttft
    totals.ttftCount++
  }

  const avgErrRate = totals.req > 0 ? totals.err / totals.req : 0
  const avgTpm = buckets.length > 0 ? totals.tpmSum / buckets.length : 0
  const avgCache = totals.cacheDen > 0 ? totals.cacheNum / totals.cacheDen : 0
  const avgTtft = totals.ttftCount > 0 ? Math.round(totals.ttftSum / totals.ttftCount) : null
  const rowScore = spec.rowScore ?? scoreOf(avgErrRate, avgTtft ?? 0)

  return {
    platform: spec.platform,
    model: spec.model,
    metrics: metrics({
      req: totals.req,
      err: totals.err,
      tpm: avgTpm,
      cache: avgCache,
      ttft: avgTtft,
    }),
    health: healthOf(rowScore),
    buckets,
  }
}

// ---------------------------------------------------------------------------
// Scenarios — one story per range
// ---------------------------------------------------------------------------

const SCENARIO_24H = () => [
  {
    platform: 'anthropic', model: 'claude-sonnet-4', phase: 0.4,
    req: 4200, baseErr: 0.004, tpm: 260000, cache: 0.74, ttft: 860,
  },
  {
    platform: 'anthropic', model: 'claude-opus-4', phase: 1.1,
    req: 950, baseErr: 0.012, tpm: 180000, cache: 0.61, ttft: 2350,
    spikes: { 170: 0.38, 185: 0.13 }, gaps: [90, 200], rowScore: 62,
  },
  {
    platform: 'anthropic', model: 'claude-haiku-3-5', phase: 2.3,
    req: 260, baseErr: 0.006, tpm: 40000, cache: 0.83, ttft: 520,
  },
  {
    platform: 'openai', model: 'gpt-5', phase: 0.9,
    req: 5100, baseErr: 0.005, tpm: 410000, cache: 0.66, ttft: 1120,
  },
  {
    platform: 'openai', model: 'gpt-4-1-mini', phase: 1.8,
    req: 1500, baseErr: 0.055, tpm: 90000, cache: 0.44, ttft: 1980, rowScore: 55,
  },
  {
    platform: 'openai', model: 'o3', phase: 2.6,
    req: 620, baseErr: 0.02, tpm: 70000, cache: 0.3, ttft: 3100,
    spikes: { 280: 0.55, 284: 0.48, 286: 0.61 }, rowScore: 24,
  },
  {
    platform: 'openai', model: '__other__', phase: 3.1,
    req: 180, baseErr: 0.008, tpm: 12000, cache: 0.51, ttft: 1400,
  },
  {
    platform: 'gemini', model: 'gemini-2-5-pro', phase: 0.2,
    req: 2300, baseErr: 0.007, tpm: 210000, cache: 0.58, ttft: 1300,
  },
  {
    platform: 'gemini', model: 'gemini-2-5-flash', phase: 1.5,
    req: 3800, baseErr: 0.003, tpm: 300000, cache: 0.91, ttft: 480,
  },
  {
    platform: 'kimi', model: 'kimi-k2', phase: 2.9,
    req: 420, baseErr: 0.01, tpm: 52000, cache: 0.4, ttft: 1500,
  },
  {
    platform: 'grok', model: 'grok-4', phase: 2.1,
    req: 880, baseErr: 0.015, tpm: 96000, cache: 0.22, ttft: 2650, rowScore: 58,
  },
  {
    platform: 'deepseek', model: 'deepseek-v3', phase: 0.7,
    req: 1300, baseErr: 0.009, tpm: 150000, cache: 0.47, ttft: 1650,
  },
  // Zero-traffic seed row: must stay hidden (liveness demo)
  {
    platform: 'zhipu', model: 'glm-4-6', phase: 0,
    req: 0, baseErr: 0, tpm: 0, cache: 0, ttft: null, rowScore: null,
    gaps: [...Array(288).keys()],
  },
]

const SCENARIO_3D = () => {
  const incidentFrom = tsOf(1, 14)
  const incidentTo = tsOf(1, 17)
  const incidentTail = tsOf(1, 19)
  const o3BurstFrom = tsOf(2, 9)
  const o3BurstTo = tsOf(2, 10.5)
  const todayStart = tsOf(0, 0)
  const yesterdayStart = tsOf(1, 0)
  const grokEvening = (ts) => {
    const h = new Date(ts).getHours()
    return h >= 19 && h < 23
  }
  return [
    {
      platform: 'anthropic', model: 'claude-sonnet-4', phase: 0.4,
      req: 4200, baseErr: 0.004, tpm: 260000, cache: 0.74, ttft: 860,
      valueAt: (i, ts) => (inWindow(ts, incidentFrom, incidentTo) ? { err: 0.14 } : null),
    },
    {
      platform: 'anthropic', model: 'claude-opus-4', phase: 1.1,
      req: 950, baseErr: 0.012, tpm: 180000, cache: 0.61, ttft: 2350,
      valueAt: (i, ts) => {
        if (inWindow(ts, incidentFrom, incidentTo)) return { err: 0.5 }
        if (inWindow(ts, incidentTo, incidentTail)) return { err: 0.15 }
        return null
      },
      rowScore: 58,
    },
    {
      platform: 'anthropic', model: 'claude-haiku-3-5', phase: 2.3,
      req: 260, baseErr: 0.006, tpm: 40000, cache: 0.83, ttft: 520,
    },
    {
      platform: 'openai', model: 'gpt-5', phase: 0.9,
      req: 5100, baseErr: 0.005, tpm: 410000, cache: 0.66, ttft: 1120,
      valueAt: (i, ts) => (inWindow(ts, incidentFrom, incidentTo) ? { err: 0.12 } : null),
    },
    {
      platform: 'openai', model: 'gpt-4-1-mini', phase: 1.8,
      req: 1500, baseErr: 0.06, tpm: 90000, cache: 0.44, ttft: 1980,
      valueAt: (i, ts) => ({ err: ts < todayStart ? 0.07 : 0.008 }),
      rowScore: 64,
    },
    {
      platform: 'openai', model: 'o3', phase: 2.6,
      req: 620, baseErr: 0.02, tpm: 70000, cache: 0.3, ttft: 3100,
      valueAt: (i, ts) => (inWindow(ts, o3BurstFrom, o3BurstTo) ? { err: 0.55 } : null),
      rowScore: 46,
    },
    {
      platform: 'openai', model: '__other__', phase: 3.1,
      req: 180, baseErr: 0.008, tpm: 12000, cache: 0.51, ttft: 1400,
    },
    {
      platform: 'gemini', model: 'gemini-2-5-pro', phase: 0.2,
      req: 2300, baseErr: 0.007, tpm: 210000, cache: 0.58, ttft: 1300,
    },
    {
      platform: 'gemini', model: 'gemini-2-5-flash', phase: 1.5,
      req: 3800, baseErr: 0.003, tpm: 300000, cache: 0.91, ttft: 480,
    },
    {
      platform: 'kimi', model: 'kimi-k2', phase: 2.9,
      req: 420, baseErr: 0.01, tpm: 52000, cache: 0.4, ttft: 1500,
    },
    {
      platform: 'grok', model: 'grok-4', phase: 2.1,
      req: 880, baseErr: 0.012, tpm: 96000, cache: 0.22, ttft: 2650,
      // 0.05 keeps evening blocks in the warning band (TTFT 2650ms already
      // costs 23 score points; higher error rates tipped them into critical)
      valueAt: (i, ts) => (grokEvening(ts) ? { err: 0.05 } : null),
      rowScore: 64,
    },
    {
      platform: 'deepseek', model: 'deepseek-v3', phase: 0.7,
      req: 1300, baseErr: 0.009, tpm: 150000, cache: 0.47, ttft: 1650,
    },
    // zhipu only had traffic before yesterday → visible in 3d, hidden in 24h
    {
      platform: 'zhipu', model: 'glm-4-6', phase: 0.5,
      req: 700, baseErr: 0.01, tpm: 60000, cache: 0.35, ttft: 1200,
      valueAt: (i, ts) => (ts < yesterdayStart ? {} : { gap: true }),
    },
  ]
}

const SCENARIO_7D = () => {
  const outageFrom = tsOf(3, 14)
  const outageTo = tsOf(3, 16)
  const sharedOutage = (ts) => inWindow(ts, outageFrom, outageTo)
  const o3Evening = tsOf(2, 20)
  const o3Night = tsOf(2, 23)
  const kimiFrom = tsOf(2, 0)
  const zhipuUntil = tsOf(4, 23)
  const rampSlots = 168
  return [
    {
      platform: 'anthropic', model: 'claude-sonnet-4', phase: 0.4,
      req: 4200, baseErr: 0.004, tpm: 260000, cache: 0.74, ttft: 860, weekendScale: 0.6,
      valueAt: (i, ts) => (sharedOutage(ts) ? { err: 0.55 } : null),
    },
    {
      platform: 'anthropic', model: 'claude-opus-4', phase: 1.1,
      req: 950, baseErr: 0.012, tpm: 180000, cache: 0.61, ttft: 2350, weekendScale: 0.6,
      valueAt: (i, ts) => {
        if (sharedOutage(ts)) return { err: 0.6 }
        if (inWindow(ts, tsOf(5, 20), tsOf(5, 22))) return { err: 0.14 }
        return null
      },
      rowScore: 60,
    },
    {
      platform: 'anthropic', model: 'claude-haiku-3-5', phase: 2.3,
      req: 260, baseErr: 0.006, tpm: 40000, cache: 0.83, ttft: 520, weekendScale: 0.6,
      valueAt: (i, ts) => (sharedOutage(ts) ? { err: 0.3 } : null),
    },
    {
      platform: 'openai', model: 'gpt-5', phase: 0.9,
      req: 5100, baseErr: 0.005, tpm: 410000, cache: 0.66, ttft: 1120, weekendScale: 0.6,
      valueAt: (i, ts) => (sharedOutage(ts) ? { err: 0.5 } : null),
    },
    {
      platform: 'openai', model: 'gpt-4-1-mini', phase: 1.8,
      req: 1500, baseErr: 0.02, tpm: 90000, cache: 0.44, ttft: 1980, weekendScale: 0.6,
      valueAt: (i, ts) => (sharedOutage(ts) ? { err: 0.45 } : null),
    },
    {
      platform: 'openai', model: 'o3', phase: 2.6,
      req: 620, baseErr: 0.02, tpm: 70000, cache: 0.3, ttft: 3100, weekendScale: 0.6,
      valueAt: (i, ts) => {
        if (sharedOutage(ts)) return { err: 0.7 }
        if (inWindow(ts, o3Evening, o3Night)) return { err: 0.3 }
        return null
      },
      rowScore: 40,
    },
    {
      platform: 'openai', model: '__other__', phase: 3.1,
      req: 180, baseErr: 0.008, tpm: 12000, cache: 0.51, ttft: 1400, weekendScale: 0.6,
    },
    {
      platform: 'gemini', model: 'gemini-2-5-pro', phase: 0.2,
      req: 2300, baseErr: 0.007, tpm: 210000, cache: 0.58, ttft: 1300, weekendScale: 0.6,
      valueAt: (i, ts) => (sharedOutage(ts) ? { err: 0.2 } : null),
    },
    {
      platform: 'gemini', model: 'gemini-2-5-flash', phase: 1.5,
      req: 3800, baseErr: 0.003, tpm: 300000, cache: 0.91, ttft: 480, weekendScale: 0.6,
    },
    // New model: only exists since 2 days ago → history gap then solid blocks
    {
      platform: 'kimi', model: 'kimi-k2', phase: 2.9,
      req: 420, baseErr: 0.01, tpm: 52000, cache: 0.4, ttft: 1500,
      valueAt: (i, ts) => (ts >= kimiFrom ? {} : { gap: true }),
    },
    {
      platform: 'grok', model: 'grok-4', phase: 2.1,
      req: 880, baseErr: 0.012, tpm: 96000, cache: 0.22, ttft: 2650, weekendScale: 0.6,
      valueAt: (i, ts) => {
        const h = new Date(ts).getHours()
        // 0.05 keeps evening blocks in the warning band (TTFT 2650ms already
        // costs 23 score points; higher error rates tipped them into critical)
        return h >= 19 && h < 23 ? { err: 0.05 } : null
      },
      rowScore: 64,
    },
    // Error rate ramps up all week: healthy → warning by today (trend story)
    {
      platform: 'deepseek', model: 'deepseek-v3', phase: 0.7,
      req: 1300, baseErr: 0.009, tpm: 150000, cache: 0.47, ttft: 1650,
      valueAt: (i) => ({ err: 0.005 + (0.115 * i) / rampSlots }),
    },
    // zhipu stopped mid-week: blocks on the left, silence after
    {
      platform: 'zhipu', model: 'glm-4-6', phase: 0.5,
      req: 700, baseErr: 0.01, tpm: 60000, cache: 0.35, ttft: 1200,
      valueAt: (i, ts) => (ts <= zhipuUntil ? {} : { gap: true }),
    },
  ]
}

function buildMatrix(rangeKey) {
  const cfg = RANGE_CONFIGS[rangeKey] || RANGE_CONFIGS['24h']
  const now = Date.now()
  const endMs = Math.floor(now / cfg.stepMs) * cfg.stepMs + cfg.stepMs
  const requestedStartMs = endMs - cfg.count * cfg.stepMs

  const specs =
    rangeKey === '3d'
      ? SCENARIO_3D()
      : rangeKey === '7d'
        ? SCENARIO_7D()
        : SCENARIO_24H()

  const items = specs.map((spec) => buildRow(spec, requestedStartMs, endMs, cfg.stepMs, cfg.count))

  return {
    coverage: {
      requested_start: new Date(requestedStartMs).toISOString(),
      requested_end: new Date(endMs).toISOString(),
      coverage_start: new Date(requestedStartMs).toISOString(),
      data_through: new Date(now - 2 * 60_000).toISOString(),
      computed_at: new Date(now - 45_000).toISOString(),
      aggregation_lag_seconds: 45,
      coverage_complete: true,
      bucket_seconds: cfg.stepMs / 1000,
      bootstrap: null,
    },
    group_by: 'platform_model',
    items,
  }
}

// ---------------------------------------------------------------------------
// Users / auth
// ---------------------------------------------------------------------------

const mockAdmin = {
  id: 1,
  username: 'juyi-admin',
  email: 'admin@juyi.dev',
  avatar_url: null,
  role: 'admin',
  balance: 9286.4,
  frozen_balance: 0,
  concurrency: 50,
  status: 'active',
  allowed_groups: null,
  balance_notify_enabled: false,
  balance_notify_threshold: null,
  balance_notify_extra_emails: [],
  email_bound: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
}

const publicSettings = {
  registration_enabled: false,
  email_verify_enabled: false,
  force_email_on_third_party_signup: false,
  registration_email_suffix_whitelist: [],
  promo_code_enabled: false,
  password_reset_enabled: false,
  invitation_code_enabled: false,
  login_agreement_enabled: false,
  turnstile_enabled: false,
  tencent_captcha_enabled: false,
  aliyun_captcha_enabled: false,
  passkey_enabled: false,
  turnstile_site_key: '',
  site_name: '聚蚁',
  site_logo: '/logo.svg',
  site_subtitle: '多订阅聚合为一个 API',
  api_base_url: '',
  contact_info: '',
  doc_url: '',
  home_content: '',
  compact_home_enabled: false,
  hide_ccs_import_button: false,
  payment_enabled: false,
  risk_control_enabled: false,
  table_default_page_size: 20,
  table_page_size_options: [10, 20, 50, 100],
  custom_menu_items: [],
  custom_endpoints: [],
  linuxdo_oauth_enabled: false,
  channel_monitor_enabled: true,
  channel_monitor_mode: 'v2',
  channel_monitor_hide_throughput: false,
  channel_monitor_default_interval_seconds: 60,
  model_plaza_enabled: false,
  version: '0.1.183-dev-mock',
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const path = url.pathname
  const method = (req.method || 'GET').toUpperCase()

  if (path === '/api/v1/settings/public') {
    return send(res, publicSettings)
  }

  if (path === '/api/v1/auth/login' && method === 'POST') {
    await readBody(req)
    return send(res, {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      user: mockAdmin,
    })
  }
  if (path === '/api/v1/auth/me') {
    return send(res, mockAdmin)
  }
  if (path === '/api/v1/auth/logout') {
    return send(res, {})
  }
  if (path === '/api/v1/auth/refresh') {
    return send(res, {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
    })
  }
  if (path === '/api/v1/user/profile') {
    return send(res, mockAdmin)
  }

  if (
    method === 'GET' &&
    (path === '/api/v1/admin/channel-monitor-v2/matrix' ||
      path === '/api/v1/channel-monitor-v2/matrix')
  ) {
    return send(res, buildMatrix(url.searchParams.get('range') || '24h'))
  }
  if (
    method === 'GET' &&
    (path.startsWith('/api/v1/admin/channel-monitor-v2/') ||
      path.startsWith('/api/v1/channel-monitor-v2/'))
  ) {
    return send(res, { coverage: buildMatrix('24h').coverage, items: [] })
  }

  if (path.startsWith('/api/')) {
    if (method === 'GET') {
      return send(res, { items: [], list: [], total: 0 })
    }
    return send(res, {})
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ code: 404, message: 'not found' }))
})

server.listen(PORT, () => {
  // Dual-stack (IPv4 + IPv6): vite proxies to `localhost:8080`, and Node 17+
  // resolves localhost to ::1 first — binding all interfaces covers both.
  console.log(`[mock] channel-monitor mock API on http://127.0.0.1:${PORT} (dev aid)`)
})
