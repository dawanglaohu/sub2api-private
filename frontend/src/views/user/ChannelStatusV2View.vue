<template>
  <AppLayout>
    <div class="space-y-6 pb-12">
      <!-- Passive monitor header: fixed 24h window, no filter toolbar -->
      <section class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h1 class="page-title flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
            <span
              class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300"
            >
              <Icon name="chart" size="sm" />
            </span>
            {{ t('channelMonitorV2.title') }}
          </h1>
          <div class="page-description mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="badge badge-primary">{{ t(RANGE_LABEL_KEYS[range]) }}</span>
            <span v-if="granularityText">{{ granularityText }}</span>
            <template v-if="platformGroups.length">
              <span aria-hidden="true">·</span>
              <span class="tabular-nums">{{ t('channelMonitorV2.status.platforms', { count: platformGroups.length }) }}</span>
              <span class="tabular-nums">{{ t('channelMonitorV2.status.activeModels', { count: activeRowCount }) }}</span>
            </template>
            <span class="inline-flex items-center gap-1.5">
              <LoadingSpinner v-if="refreshing" size="sm" />
              <span
                v-if="refreshing"
                class="inline-flex items-center gap-1 text-primary-600 dark:text-primary-300"
              >
                {{ t('channelMonitorV2.updating') }}
              </span>
              <span v-else-if="matrix?.coverage.data_through">
                {{ t('channelMonitorV2.updatedTo', { time: formatTime(matrix.coverage.data_through) }) }}
              </span>
              <span v-else class="text-gray-400">{{ t('common.loading') }}</span>
            </span>
            <span
              v-if="matrix && matrix.coverage.coverage_complete === false"
              class="badge badge-warning"
            >
              {{ t('channelMonitorV2.partialCoverage') }}
            </span>
            <span v-if="bootstrapActive" class="badge badge-primary">
              {{ t('channelMonitorV2.bootstrap.progress', { percent: bootstrapPercent }) }}
            </span>
            <span
              v-if="loadError && matrix"
              class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400"
            >
              {{ t('channelMonitorV2.status.stale') }}
            </span>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <div
            class="tabs inline-flex"
            role="group"
            :aria-label="t('channelMonitorV2.timeRange')"
          >
            <button
              v-for="option in rangeOptions"
              :key="option.value"
              type="button"
              class="tab !px-2.5 !py-1 text-xs"
              :class="range === option.value ? 'tab-active' : ''"
              @click="range = option.value"
            >
              {{ option.label }}
            </button>
          </div>
          <button
            class="btn btn-secondary btn-icon flex h-8 w-8 items-center justify-center rounded-lg"
            type="button"
            :title="t('common.refresh')"
            :disabled="loading"
            @click="reload(false)"
          >
            <Icon name="refresh" size="sm" :class="loading ? 'animate-spin' : ''" />
          </button>
        </div>
      </section>

      <!-- Loading skeleton: mirrors platform sections + status cards -->
      <section v-if="loading && !matrix" class="space-y-6" aria-hidden="true">
        <div v-for="i in 2" :key="i" class="space-y-3">
          <div class="h-7 w-44 animate-pulse rounded-lg bg-gray-100 dark:bg-dark-900/40"></div>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div
              v-for="j in 3"
              :key="j"
              class="h-44 animate-pulse rounded-2xl bg-gray-50 ring-1 ring-gray-900/5 dark:bg-dark-900/30 dark:ring-dark-700"
            ></div>
          </div>
        </div>
      </section>

      <!-- First-load failure: explicit error + retry, never rendered as model state -->
      <section
        v-else-if="loadError && !matrix"
        class="card flex flex-col items-center gap-3 rounded-3xl !border-0 p-10 text-center shadow-sm ring-1 ring-gray-900/5 dark:!bg-dark-800 dark:ring-dark-700"
      >
        <p class="text-base font-semibold text-gray-900 dark:text-white">
          {{ t('channelMonitorV2.loadFailed') }}
        </p>
        <p class="max-w-md break-all text-xs text-gray-400 dark:text-gray-500">{{ loadError }}</p>
        <button type="button" class="btn btn-primary btn-sm" @click="reload(false)">
          {{ t('channelMonitorV2.status.retry') }}
        </button>
      </section>

      <!-- No traffic in the whole 24h window -->
      <section
        v-else-if="matrix && !platformGroups.length"
        class="card flex flex-col items-center gap-2 rounded-3xl !border-0 p-12 text-center shadow-sm ring-1 ring-gray-900/5 dark:!bg-dark-800 dark:ring-dark-700"
      >
        <p class="text-base font-semibold text-gray-900 dark:text-white">
          {{ t('channelMonitorV2.status.emptyTitle') }}
        </p>
        <p class="text-sm text-gray-400 dark:text-gray-500">
          {{ t('channelMonitorV2.status.emptyDescription') }}
        </p>
      </section>

      <!-- Platform sections: one diagnostic card per active model -->
      <template v-else-if="matrix">
        <section v-for="group in platformGroups" :key="group.platform" class="space-y-3">
          <header class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                :class="platformBadgeLightClass(group.platform)"
              >
                <PlatformIcon
                  :platform="group.platform as GroupPlatform"
                  size="xs"
                  :class="platformIconClass(group.platform)"
                />
              </span>
              <h2 class="truncate text-sm font-bold text-gray-900 dark:text-white">
                {{ platformLabel(group.platform) }}
              </h2>
            </div>
            <div class="flex shrink-0 items-center gap-2 text-[11px]">
              <span class="tabular-nums text-gray-500 dark:text-gray-400">
                {{ t('channelMonitorV2.status.activeModels', { count: group.rows.length }) }}
              </span>
              <span
                v-if="group.attention > 0"
                class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
                {{ t('channelMonitorV2.status.attentionCount', { count: group.attention }) }}
              </span>
              <span v-else class="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                <span class="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true"></span>
                {{ t('channelMonitorV2.status.allHealthy') }}
              </span>
            </div>
          </header>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ModelStatusCard
              v-for="row in group.rows"
              :key="`${row.platform}:${row.model}`"
              :row="row"
              :coverage="matrix.coverage"
              :show-throughput="showThroughput"
              :is-new="newKeys.has(`${row.platform}:${row.model}`)"
            />
          </div>
        </section>
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import ModelStatusCard from '@/features/channel-monitor-v2/ModelStatusCard.vue'
import { useAuthStore } from '@/stores/auth'
import { extractApiErrorMessage } from '@/utils/apiError'
import { isChannelMonitorThroughputHidden } from '@/utils/featureFlags'
import { platformBadgeLightClass, platformIconClass, platformLabel } from '@/utils/platformColors'
import * as api from '@/api/channelMonitorV2'
import type {
  GroupPlatform,
} from '@/types'
import type {
  MonitorMatrixGroupBy,
  MonitorMatrixResponse,
  MonitorMatrixRow,
  MonitorRange,
} from '@/api/channelMonitorV2'
import {
  monitorHealthSeverity,
  monitorRowHasTraffic,
  monitorRowState,
} from '@/features/channel-monitor-v2/modelStatus'

/** V2 passive monitor base filter: no user-facing dimension filters. */
const BASE_FILTER = { platforms: [], groupIds: [], models: [] }
/** Display windows for the passive monitor strip (bucket sizes live backend-side). */
const RANGE_LABEL_KEYS: Record<string, string> = {
  '24h': 'channelMonitorV2.status.window24h',
  '3d': 'channelMonitorV2.status.window3d',
  '7d': 'channelMonitorV2.status.window7d',
}
const GROUP_BY: MonitorMatrixGroupBy = 'platform_model'
/** Poll cadence floor equals the fastest backend aggregation cadence (60s). */
const REFRESH_MS = 60_000

const authStore = useAuthStore()
const { t, locale } = useI18n()
const isAdmin = computed(() => authStore.isAdmin)
/** Admins always see RPM/TPM; users honor the hide-throughput system setting. */
const showThroughput = computed(() => isAdmin.value || !isChannelMonitorThroughputHidden())

const range = ref<MonitorRange>('24h')
const rangeOptions = computed(() =>
  (['24h', '3d', '7d'] as MonitorRange[]).map((value) => ({
    value,
    label: t(RANGE_LABEL_KEYS[value]),
  })),
)
const granularityText = computed(() => {
  const seconds = matrix.value?.coverage.bucket_seconds
  if (!seconds) return ''
  return seconds < 3600
    ? t('channelMonitorV2.bucket.minutes', { count: seconds / 60 })
    : t('channelMonitorV2.bucket.hours', { count: seconds / 3600 })
})

const matrix = ref<MonitorMatrixResponse | null>(null)
const loadError = ref<string | null>(null)
const loading = ref(false)
const refreshing = ref(false)
const newKeys = ref(new Set<string>())
let controller: AbortController | null = null
let sequence = 0
let refreshTimer: number | null = null
let newKeysTimer: number | null = null
const seenKeys = new Set<string>()

interface PlatformGroup {
  platform: string
  rows: MonitorMatrixRow[]
  attention: number
}

const platformGroups = computed<PlatformGroup[]>(() => {
  const items = (matrix.value?.items || []).filter(monitorRowHasTraffic)
  const byPlatform = new Map<string, MonitorMatrixRow[]>()
  for (const row of items) {
    const bucket = byPlatform.get(row.platform)
    if (bucket) bucket.push(row)
    else byPlatform.set(row.platform, [row])
  }
  const groups = Array.from(byPlatform.entries()).map(([platform, rows]) => ({
    platform,
    rows: rows.slice().sort(compareModelRows),
    attention: rows.filter((row) => {
      const state = monitorRowState(row)
      return state === 'critical' || state === 'warning'
    }).length,
  }))
  groups.sort((a, b) => {
    const diff = platformWeight(a) - platformWeight(b)
    return diff !== 0 ? diff : a.platform.localeCompare(b.platform)
  })
  return groups
})

const activeRowCount = computed(() =>
  platformGroups.value.reduce((sum, group) => sum + group.rows.length, 0),
)

const bootstrapActive = computed(() => Boolean(matrix.value?.coverage?.bootstrap?.active))
const bootstrapPercent = computed(() => {
  const raw = matrix.value?.coverage?.bootstrap?.progress_percent
  if (typeof raw !== 'number' || Number.isNaN(raw)) return 0
  return Math.min(100, Math.max(0, Math.round(raw)))
})

/** Critical-first, then warning, then healthy, unknown last; alphabetical tiebreak. */
function platformWeight(group: PlatformGroup): number {
  return group.rows.reduce(
    (worst, row) => Math.min(worst, monitorHealthSeverity(monitorRowState(row))),
    3,
  )
}
function compareModelRows(a: MonitorMatrixRow, b: MonitorMatrixRow): number {
  const diff = monitorHealthSeverity(monitorRowState(a)) - monitorHealthSeverity(monitorRowState(b))
  if (diff !== 0) return diff
  // Same state: more real traffic buckets first (privacy-safe activity signal).
  return b.buckets.length - a.buckets.length
}

function isCancelledError(error: unknown): boolean {
  const e = error as { name?: string; code?: string }
  return e?.name === 'AbortError' || e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED'
}

async function reload(silent = true) {
  controller?.abort()
  const request = new AbortController()
  controller = request
  const id = ++sequence
  refreshing.value = true
  if (!silent) loading.value = true
  try {
    const data = await api.getMatrix(
      { ...BASE_FILTER, range: range.value },
      GROUP_BY,
      isAdmin.value,
      request.signal,
    )
    if (id !== sequence) return
    matrix.value = data
    loadError.value = null
    markNewKeys(data.items.filter(monitorRowHasTraffic))
  } catch (error) {
    if (isCancelledError(error)) return
    if (id === sequence) {
      loadError.value = extractApiErrorMessage(error, t('channelMonitorV2.loadFailed'))
    }
  } finally {
    if (id === sequence) {
      loading.value = false
      refreshing.value = false
    }
  }
}

/**
 * Models discovered after the first paint get a single soft entrance; the
 * initial load renders everything without per-card animation.
 */
function markNewKeys(rows: MonitorMatrixRow[]) {
  if (seenKeys.size === 0) {
    for (const row of rows) seenKeys.add(rowKey(row))
    return
  }
  const fresh = rows.filter((row) => !seenKeys.has(rowKey(row)))
  if (!fresh.length) return
  for (const row of fresh) seenKeys.add(rowKey(row))
  newKeys.value = new Set(fresh.map(rowKey))
  if (newKeysTimer) window.clearTimeout(newKeysTimer)
  newKeysTimer = window.setTimeout(() => {
    newKeys.value = new Set()
  }, 1800)
}

function rowKey(row: MonitorMatrixRow): string {
  return `${row.platform}:${row.model}`
}

watch(range, () => {
  void reload(true)
})

function startAutoRefresh() {
  if (refreshTimer != null) return
  refreshTimer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return
    if (loading.value || refreshing.value) return
    void reload(true)
  }, REFRESH_MS)
}
function stopAutoRefresh() {
  if (refreshTimer != null) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }
}
function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    stopAutoRefresh()
    return
  }
  void reload(true)
  startAutoRefresh()
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(locale.value || undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  void reload(false)
  startAutoRefresh()
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopAutoRefresh()
  controller?.abort()
  if (newKeysTimer) window.clearTimeout(newKeysTimer)
})
</script>
