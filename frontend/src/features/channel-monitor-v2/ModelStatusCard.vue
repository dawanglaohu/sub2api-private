<template>
  <article
    class="relative flex flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 dark:bg-dark-800 dark:ring-dark-700"
    :class="{ 'model-card--new': isNew }"
  >
    <!-- Severity accent (semantic state color, not brand accent) -->
    <span class="absolute inset-x-0 top-0 h-0.5" :class="STATE_ACCENT[state]" aria-hidden="true"></span>

    <header class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2.5">
        <span
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          :class="platformBadgeLightClass(platform)"
        >
          <PlatformIcon :platform="platform" size="sm" :class="platformIconClass(platform)" />
        </span>
        <div class="min-w-0">
          <h3 class="truncate text-sm font-bold text-gray-900 dark:text-white" :title="modelLabel">
            {{ modelLabel }}
          </h3>
          <p class="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="STATE_DOT[state]" aria-hidden="true"></span>
            <span>{{ t(STATE_LABEL_KEYS[state]) }}</span>
            <span v-if="scoreText !== null" class="tabular-nums text-gray-400 dark:text-gray-500">
              · {{ t('channelMonitorV2.matrix.scoreLine', { score: scoreText }) }}
            </span>
          </p>
        </div>
      </div>
      <div class="shrink-0 text-right">
        <p class="text-xl font-black leading-none tabular-nums" :class="STATE_TEXT[state]">
          {{ successRateText }}
        </p>
        <p class="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
          {{ t('channelMonitorV2.metrics.successRate') }} · {{ windowLabel }}
        </p>
      </div>
    </header>

    <dl class="mt-3.5 grid gap-2" :class="showThroughput ? 'grid-cols-4' : 'grid-cols-3'">
      <div
        v-for="item in metricItems"
        :key="item.label"
        class="metric-chip min-w-0 rounded-xl bg-gray-50 px-2.5 py-2 text-center dark:bg-dark-900/50"
      >
        <dt class="truncate text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500" :title="item.title">
          {{ item.label }}
        </dt>
        <dd class="mt-0.5 truncate text-xs font-semibold tabular-nums text-gray-800 dark:text-gray-100" :title="item.title">
          {{ item.value }}
        </dd>
      </div>
    </dl>

    <div class="mt-3 flex items-center justify-between gap-2 text-[10px] text-gray-400 dark:text-gray-500">
      <span class="tabular-nums">{{ t('channelMonitorV2.status.activeBuckets') }} {{ activeBucketCount }}/{{ slots.length }}</span>
      <span
        class="tabular-nums"
        :class="attentionCount > 0 ? 'font-semibold text-amber-600 dark:text-amber-400' : ''"
      >
        {{ t('channelMonitorV2.status.attentionBuckets') }} {{ attentionCount }}
      </span>
    </div>

    <!-- Availability strip: uniform display blocks produced by downsampling the
         full window (24h/3d/7d) into a fixed block count — fitted to the card,
         no scrolling, full coverage. -->
    <div class="relative mt-1.5">
      <div
        class="status-strip grid w-full min-w-0 select-none"
        :style="{ gridTemplateColumns: `repeat(${displaySlots.length}, minmax(0, 1fr))` }"
        role="img"
        :aria-label="stripAria"
        @mouseleave="activeIndex = null"
      >
        <div
          v-for="(slot, index) in displaySlots"
          :key="slot.start"
          class="strip-cell"
          :class="[
            slot.bucket ? bucketClass(slot.bucket) : 'cell-empty',
            { 'strip-cell--active': activeIndex === index },
          ]"
          :title="slot.bucket ? undefined : emptyCellTitle(slot)"
          @mouseenter="activate(index, $event)"
          @click="activate(index, $event)"
        ></div>
      </div>

      <!-- Detail panel lives on <body>: the card clips its own content
           (overflow-hidden), so an in-card panel gets cut off at the edges. -->
      <Teleport to="body">
        <div
          v-if="activeBucket"
          ref="panelRef"
          class="bucket-detail pointer-events-none fixed z-[70] w-max max-w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm dark:border-dark-600 dark:bg-dark-900/95"
          :style="panelStyle"
          role="tooltip"
        >
          <div class="flex items-center justify-between gap-2 text-[11px] font-semibold text-gray-900 dark:text-white">
            <span class="truncate tabular-nums">{{ activeBucketRange }}</span>
            <span class="shrink-0" :class="STATE_TEXT[activeBucketState]">{{ t(STATE_LABEL_KEYS[activeBucketState]) }}</span>
          </div>
          <ul class="mt-1 space-y-0.5 text-[11px] text-gray-600 dark:text-gray-300">
            <li class="tabular-nums">
              {{ t('channelMonitorV2.metrics.successRateValue', { value: activeSuccessRate }) }}
              ·
              {{ t('channelMonitorV2.metrics.errorRateValue', { value: activeErrorRate }) }}
            </li>
            <li class="tabular-nums">{{ t('channelMonitorV2.metrics.ttftValue', { value: activeLatency }) }}</li>
            <li class="tabular-nums">{{ t('channelMonitorV2.metrics.cacheRateValue', { value: activeCacheRate }) }}</li>
            <li v-if="showThroughput" class="tabular-nums">
              {{ t('channelMonitorV2.metrics.tpsValue', { value: activeTps }) }}
              ·
              {{ t('channelMonitorV2.metrics.rpmValue', { value: activeRpm }) }}
            </li>
          </ul>
        </div>
      </Teleport>
    </div>

    <p class="mt-2 text-[10px] leading-none text-gray-300 dark:text-gray-600">
      {{ t('channelMonitorV2.status.viewHint') }}
    </p>
  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { GroupPlatform } from '@/types'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import type {
  HealthState,
  MonitorCoverage,
  MonitorMatrixBucket,
  MonitorMatrixRow,
} from '@/api/channelMonitorV2'
import {
  formatLatencyPrivacy,
  formatMonitorMs,
  formatMonitorPercent,
  formatMonitorSuccessRateFromError,
  formatMonitorThroughput,
  formatMonitorTokensPerSecond,
  healthModeScore,
  healthScoreClass,
} from '@/features/channel-monitor-v2/monitorFormat'
import {
  alignMonitorBuckets,
  countAttentionBuckets,
  downsampleMonitorSlots,
  monitorHealthState,
  monitorRowState,
} from '@/features/channel-monitor-v2/modelStatus'
import { platformBadgeLightClass, platformIconClass } from '@/utils/platformColors'

const props = withDefaults(
  defineProps<{
    row: MonitorMatrixRow
    coverage: MonitorCoverage
    showThroughput?: boolean
    isNew?: boolean
  }>(),
  { showThroughput: true, isNew: false },
)

const { t, locale } = useI18n()

const STATE_LABEL_KEYS: Record<HealthState, string> = {
  healthy: 'channelMonitorV2.status.stateHealthy',
  warning: 'channelMonitorV2.status.stateWarning',
  critical: 'channelMonitorV2.status.stateCritical',
  unknown: 'channelMonitorV2.status.stateUnknown',
}
const STATE_ACCENT: Record<HealthState, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  unknown: 'bg-gray-300 dark:bg-dark-700',
}
const STATE_DOT: Record<HealthState, string> = {
  healthy: 'bg-green-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  unknown: 'bg-gray-400 dark:bg-gray-500',
}
const STATE_TEXT: Record<HealthState, string> = {
  healthy: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
  unknown: 'text-gray-500 dark:text-gray-400',
}

const platform = computed(() => props.row.platform as GroupPlatform)
const modelLabel = computed(() =>
  props.row.model === '__other__' ? t('channelMonitorV2.otherModels') : props.row.model || '—',
)
const state = computed(() => monitorRowState(props.row))
const scoreText = computed(() => {
  const score = healthModeScore(props.row.health, 'overall')
  return score == null ? null : String(Math.round(score))
})
const successRateText = computed(() =>
  formatMonitorSuccessRateFromError(props.row.metrics.error_rate),
)

const slots = computed(() => alignMonitorBuckets(props.row, props.coverage))
/** Full window downsampled into a fixed block count that fills the card. */
const DISPLAY_BLOCK_LIMIT = 60
const displaySlots = computed(() =>
  downsampleMonitorSlots(slots.value, DISPLAY_BLOCK_LIMIT, props.coverage.bucket_seconds),
)
const activeBucketCount = computed(() => slots.value.filter((slot) => slot.bucket).length)
const attentionCount = computed(() => countAttentionBuckets(props.row))

const windowLabel = computed(() => {
  const hours = Math.round((slots.value.length * Math.max(60, props.coverage.bucket_seconds)) / 3600)
  return hours >= 48 ? `${hours / 24}d` : `${hours}h`
})

const metricItems = computed(() => {
  const metrics = props.row.metrics
  const items = [
    {
      label: t('channelMonitorV2.metrics.ttftP50'),
      value: formatMonitorMs(metrics.ttft.p50_ms),
      title: formatLatencyPrivacy(metrics.ttft.p50_ms, metrics.ttft.p90_ms, metrics.ttft.avg_ms, metrics.ttft.p95_ms),
    },
    {
      label: t('channelMonitorV2.metrics.cacheRate'),
      value: formatMonitorPercent(metrics.cache_rate),
      title: t('channelMonitorV2.metrics.cacheDetail'),
    },
    {
      label: t('channelMonitorV2.metrics.tps'),
      value: formatMonitorTokensPerSecond(metrics.tpm),
      title: t('channelMonitorV2.metrics.tpsDetail'),
    },
  ]
  if (props.showThroughput) {
    items.push({
      label: t('channelMonitorV2.metrics.rpm'),
      value: formatMonitorThroughput(metrics.rpm),
      title: t('channelMonitorV2.metrics.rpmDetail'),
    })
  }
  return items
})

const activeIndex = ref<number | null>(null)
const panelRef = ref<HTMLElement | null>(null)
/** Hovered block geometry in viewport coordinates (the panel is fixed-positioned). */
const anchor = ref<{ x: number; top: number; bottom: number } | null>(null)
const panelSize = ref({ width: 0, height: 0 })
const placement = ref<'top' | 'bottom'>('top')
const VIEWPORT_MARGIN = 8
const ANCHOR_GAP = 8
/** Keep clear of the floating app header (sticky, top-10 h-16) instead of covering it. */
const TOP_SAFE_AREA = 84

/** Content-sized panel anchored near the hovered block, clamped into the viewport. */
function activate(index: number, event?: Event) {
  activeIndex.value = index
  const cell = event?.currentTarget as HTMLElement | null | undefined
  if (!cell || typeof cell.getBoundingClientRect !== 'function') {
    anchor.value = null
    return
  }
  const rect = cell.getBoundingClientRect()
  anchor.value = { x: rect.left + rect.width / 2, top: rect.top, bottom: rect.bottom }
  placement.value = 'top'
  void nextTick(measurePanel)
}

/** Measure once rendered, then flip below the strip when the card sits near the top. */
function measurePanel() {
  const el = panelRef.value
  if (!el) return
  panelSize.value = { width: el.offsetWidth, height: el.offsetHeight }
  const spot = anchor.value
  if (!spot) return
  const viewportHeight = window.innerHeight || 0
  const fitsAbove = spot.top - panelSize.value.height - ANCHOR_GAP >= TOP_SAFE_AREA
  const fitsBelow = spot.bottom + panelSize.value.height + ANCHOR_GAP <= viewportHeight - VIEWPORT_MARGIN
  placement.value = !fitsAbove && fitsBelow ? 'bottom' : 'top'
}

const panelStyle = computed(() => {
  const spot = anchor.value
  if (!spot) {
    return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }
  }
  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth || 0
  const half = panelSize.value.width / 2
  let x = spot.x
  if (half > 0 && viewportWidth > 0) {
    const min = half + VIEWPORT_MARGIN
    const max = viewportWidth - half - VIEWPORT_MARGIN
    x = max < min ? viewportWidth / 2 : Math.min(Math.max(spot.x, min), max)
  }
  const top = placement.value === 'top' ? spot.top - ANCHOR_GAP : spot.bottom + ANCHOR_GAP
  return {
    left: `${x}px`,
    top: `${top}px`,
    transform: placement.value === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
  }
})

/** Fixed positioning is viewport-anchored: scrolling or resizing detaches it. */
function dismiss() {
  activeIndex.value = null
}
onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('scroll', dismiss, true)
  window.removeEventListener('resize', dismiss)
})

const activeSlot = computed(() =>
  activeIndex.value == null ? undefined : displaySlots.value[activeIndex.value],
)
const activeBucket = computed(() => activeSlot.value?.bucket ?? null)
const activeBucketState = computed(() =>
  activeBucket.value ? monitorHealthState(activeBucket.value.health) : 'unknown',
)
const activeSuccessRate = computed(() =>
  activeBucket.value ? formatMonitorSuccessRateFromError(activeBucket.value.metrics.error_rate) : '-',
)
const activeErrorRate = computed(() =>
  activeBucket.value ? formatMonitorPercent(activeBucket.value.metrics.error_rate) : '-',
)
const activeLatency = computed(() => {
  if (!activeBucket.value) return '-'
  const ttft = activeBucket.value.metrics.ttft
  return formatLatencyPrivacy(ttft.p50_ms, ttft.p90_ms, ttft.avg_ms, ttft.p95_ms)
})
const activeCacheRate = computed(() =>
  activeBucket.value ? formatMonitorPercent(activeBucket.value.metrics.cache_rate) : '-',
)
const activeTps = computed(() =>
  activeBucket.value ? formatMonitorTokensPerSecond(activeBucket.value.metrics.tpm) : '-',
)
const activeRpm = computed(() =>
  activeBucket.value ? formatMonitorThroughput(activeBucket.value.metrics.rpm) : '-',
)

watch(activeBucket, (bucket) => {
  if (typeof window === 'undefined') return
  if (bucket) {
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
  } else {
    window.removeEventListener('scroll', dismiss, true)
    window.removeEventListener('resize', dismiss)
  }
})

function formatClock(value: string) {
  return new Intl.DateTimeFormat(locale.value || undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
const activeBucketRange = computed(() => {
  if (!activeSlot.value) return ''
  const start = new Date(activeSlot.value.start)
  const end = new Date(activeSlot.value.endMs)
  return `${formatClock(start.toISOString())} – ${formatClock(end.toISOString())}`
})
function emptyCellTitle(slot: { start: string }) {
  return t('channelMonitorV2.matrix.noTrafficAt', { time: formatClock(slot.start) })
}

function bucketClass(bucket: MonitorMatrixBucket) {
  return healthScoreClass(bucket.health, 'overall', bucket.metrics.request_count)
}

const stripAria = computed(() => {
  const counts = { healthy: 0, warning: 0, critical: 0, unknown: 0, empty: 0 }
  for (const slot of displaySlots.value) {
    if (!slot.bucket) {
      counts.empty++
    } else {
      counts[monitorHealthState(slot.bucket.health)]++
    }
  }
  const parts = [
    `${t('channelMonitorV2.status.stateHealthy')} ${counts.healthy}`,
    `${t('channelMonitorV2.status.stateWarning')} ${counts.warning}`,
    `${t('channelMonitorV2.status.stateCritical')} ${counts.critical}`,
    `${t('channelMonitorV2.status.stateUnknown')} ${counts.unknown}`,
    `${t('channelMonitorV2.matrix.noTraffic')} ${counts.empty}`,
  ]
  return `${modelLabel.value} · ${windowLabel.value} · ${parts.join(' · ')}`
})
</script>

<style scoped>
/* finesse · register=product · shell=platform-section + per-model diagnostic card
 * palette=juyi warm neutrals + dynamic theme primary (semantic state colors preserved)
 * engine=none (feedback-only motion) · SOUL=5 SPECTACLE=2 DENSITY=8 */
.status-strip {
  gap: 2px;
  height: 1.25rem;
}
.strip-cell {
  min-width: 0;
  border-radius: 2px;
  cursor: default;
}
.strip-cell--active {
  outline: 2px solid rgb(var(--jy-p-500, 237 158 19) / 0.8);
  outline-offset: 1px;
  z-index: 1;
}
/* No-traffic / uncovered interval: neutral, never health green.
   Flat fill only — hatching is illegible at dense-strip cell widths. */
.cell-empty {
  background-color: rgb(0 0 0 / 0.07);
}
:global(.dark) .cell-empty {
  background-color: rgb(255 255 255 / 0.1);
}

/* Semantic health palette: green → yellow → red score bands (mirrors matrix) */
.health-score10 { background: #16a34a; }
.health-score9  { background: #22c55e; }
.health-score8  { background: #4ade80; }
.health-score7  { background: #a3e635; }
.health-score6  { background: #facc15; }
.health-score5  { background: #fbbf24; }
.health-score4  { background: #f59e0b; }
.health-score3  { background: #f97316; }
.health-score2  { background: #fb7185; }
.health-score1  { background: #f87171; }
.health-score0  { background: rgb(239, 67, 67); }
.health-healthy  { background: #22c55e; }
.health-warning  { background: #f59e0b; }
.health-critical { background: #ef4444; }
.health-unknown  { background: #9ca3af; }

.bucket-detail {
  animation: detail-in 0.12s ease-out;
}
@keyframes detail-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* New model discovered by auto-refresh: single soft entrance */
@keyframes model-card-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.model-card--new {
  animation: model-card-in 0.45s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .model-card--new {
    animation: none;
  }
  .bucket-detail {
    animation: none;
  }
}
</style>
