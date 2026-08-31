/**
 * Structure contracts: channel-monitor-v2 + studio shells must use project
 * design-system utility classes rather than isolated flat RGB skins.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../../..')

function read(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

describe('channel-monitor-v2 design system structure', () => {
  it('user ChannelStatus V2 passive monitor: no filter toolbar, per-model status cards', () => {
    // Route wrapper may switch V1/V2; design chrome lives on the V2 implementation.
    // V2 was redesigned into a passive monitor: fixed 24h window, no filter
    // toolbar, one status card per model grouped by platform.
    const src = read('views/user/ChannelStatusV2View.vue')
    expect(src).toContain('page-title')
    expect(src).toContain('btn btn-secondary')
    expect(src).toContain('badge badge-warning')
    expect(src).toContain('rounded-3xl')
    // Display windows: 24h / 3d / 7d via the time-range selector, badge follows
    expect(src).toContain("'24h', '3d', '7d'")
    expect(src).toContain('rangeOptions')
    expect(src).toContain('RANGE_LABEL_KEYS[range]')
    // 2 cards per row: fine 5-min blocks need the wider card
    expect(src).toContain('md:grid-cols-2')
    expect(src).not.toContain('2xl:grid-cols-3')
    expect(src).not.toContain('monitor-toolbar')
    expect(src).not.toContain('FilterMultiSelect')
    expect(src).not.toContain('clearFilters')
    expect(src).not.toContain('MonitorTrendChart')
    // Per-model diagnostic cards + lifecycle gates
    expect(src).toContain('ModelStatusCard')
    expect(src).toContain('status.emptyTitle')
    expect(src).toContain('visibilitychange')
  })

  it('ModelStatusCard renders a card-contained dynamic strip with metric chips', () => {
    const src = read('features/channel-monitor-v2/ModelStatusCard.vue')
    expect(src).toContain('status-strip')
    // Full window downsampled into uniform display blocks (288 × 5min → 60),
    // fitted to card width; no scrolling
    expect(src).toContain('downsampleMonitorSlots')
    expect(src).toContain('displaySlots')
    expect(src).toContain('minmax(0, 1fr)')
    expect(src).not.toContain('overflow-x-auto')
    expect(src).not.toContain('visibleSlots')
    // Content-sized hover panel anchored near the block, teleported out of the
    // clipping card so edge blocks still show the full detail.
    expect(src).toContain('w-max')
    expect(src).toContain('panelStyle')
    expect(src).toContain('<Teleport to="body">')
    expect(src).toContain('getBoundingClientRect')
    // One boxed, centered tile per metric
    expect(src).toContain('metric-chip')
    expect(src).toContain('overflow-hidden')
    expect(src).toContain('min-w-0')
    expect(src).not.toMatch(/min-width:\s*980px/)
    expect(src).not.toContain('modal-overlay')
  })

  it('RelayPulseMatrix uses card chrome, matrix scroll, and hover tooltips (no click modal)', () => {
    const src = read('features/channel-monitor-v2/RelayPulseMatrix.vue')
    expect(src).toContain('class="card')
    expect(src).toContain('card-header')
    expect(src).toContain('card-body')
    expect(src).toContain('matrix-scroll')
    expect(src).toMatch(/max-h-\[min\(42vh/)
    expect(src).toContain('overflow-auto')
    expect(src).toContain('pulse-tooltip')
    expect(src).toContain('rounded-3xl')
    expect(src).toContain('ring-1 ring-gray-900/5')
    expect(src).not.toContain('modal-overlay')
    expect(src).not.toContain('modal-content')
  })

  it('MetricCell uses stat-card utility', () => {
    const src = read('features/channel-monitor-v2/MetricCell.vue')
    expect(src).toContain('stat-card')
    expect(src).toContain('stat-label')
    expect(src).toContain('stat-value')
    expect(src).toContain('rounded-3xl')
  })

  it('MonitorTrendChart uses Ops chart shell tokens', () => {
    const src = read('features/channel-monitor-v2/MonitorTrendChart.vue')
    expect(src).toContain('class="card')
    expect(src).toContain('rounded-3xl')
    expect(src).toContain('ring-1 ring-gray-900/5')
    expect(src).toContain('EmptyState')
    expect(src).toContain('min-h-[360px]')
  })

  it('FilterMultiSelect uses rounded-xl input chrome and dropdown utility', () => {
    const src = read('features/channel-monitor-v2/FilterMultiSelect.vue')
    expect(src).toContain('rounded-xl')
    expect(src).toContain('dropdown')
    expect(src).toContain('dropdown-item')
  })

  it('MonitorSettingsPanel uses page-header, card, btn-primary, tabs', () => {
    const src = read('features/channel-monitor-v2/MonitorSettingsPanel.vue')
    expect(src).toContain('page-header')
    expect(src).toContain('btn btn-primary')
    expect(src).toContain('class="card')
    expect(src).toContain('tab-active')
    expect(src).toMatch(/max-h-\[min\(40vh/)
  })

  it('admin ChannelMonitorView V2 tab chrome uses project tabs', () => {
    const src = read('views/admin/ChannelMonitorView.vue')
    expect(src).toContain('page-header')
    expect(src).toContain('page-title')
    expect(src).toContain('class="tabs')
    expect(src).toContain('tab-active')
    expect(src).toContain('MonitorSettingsPanel')
  })
})
