<template>
  <div v-if="visible" class="space-y-1">
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        class="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 transition-colors hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-cyan-300 dark:hover:bg-cyan-900/30"
        :disabled="loading"
        :title="t('admin.accounts.usageWindow.grokProbeTooltip')"
        @click="handleProbe"
      >
        <svg
          class="h-2.5 w-2.5"
          :class="{ 'animate-spin': loading }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {{ t('admin.accounts.usageWindow.grokProbe') }}
      </button>

      <button
        type="button"
        class="inline-flex cursor-not-allowed items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-400 opacity-70 dark:text-gray-500"
        disabled
        :title="t('admin.accounts.usageWindow.grokResetUnsupportedTooltip')"
      >
        {{ t('admin.accounts.usageWindow.grokResetUnsupported') }}
      </button>
    </div>

    <div v-if="error" class="truncate text-[10px] text-red-600 dark:text-red-400" :title="error">
      {{ truncatedError }}
    </div>

    <template v-if="data">
      <UsageProgressBar
        v-if="periodQuota"
        :label="t('admin.accounts.usageWindow.grokPeriod')"
        :utilization="periodQuota.utilization"
        :resets-at="periodQuota.resetsAt"
        color="indigo"
      />
      <UsageProgressBar
        v-if="monthlyQuota"
        :label="t('admin.accounts.usageWindow.grokMonthly')"
        :utilization="monthlyQuota.utilization"
        :resets-at="monthlyQuota.resetsAt"
        color="emerald"
      />
      <div v-if="monthlyQuota" class="text-[10px] text-gray-500 dark:text-gray-400">
        {{ t('admin.accounts.usageWindow.grokMonthlyUsage', {
          used: formatAmount(monthlyQuota.used),
          limit: formatAmount(monthlyQuota.limit)
        }) }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { adminAPI } from '@/api/admin'
import type { GrokQuotaProbeResult } from '@/api/admin/grok'
import type { Account } from '@/types'
import UsageProgressBar from './UsageProgressBar.vue'

const props = defineProps<{
  account: Account
  initialData?: GrokQuotaProbeResult | null
}>()
const emit = defineEmits<{
  probed: [result: GrokQuotaProbeResult]
}>()

const { t } = useI18n()

const visible = computed(() => props.account.platform === 'grok' && props.account.type === 'oauth')
const loading = ref(false)
const error = ref<string | null>(null)
const data = ref<GrokQuotaProbeResult | null>(props.initialData || null)

const extractErrorMessage = (e: unknown): string => {
  const err = e as {
    message?: string
    reason?: string
    response?: { data?: { message?: string; error?: string } }
  }
  return (
    err?.message ||
    err?.reason ||
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    t('common.error')
  )
}

const periodQuota = computed(() => {
  const credits = data.value?.credits
  if (credits?.creditUsagePercent == null) return null
  return {
    utilization: credits.creditUsagePercent,
    resetsAt: credits.currentPeriod?.end || null
  }
})

const monthlyQuota = computed(() => {
  const monthly = data.value?.monthly
  const used = monthly?.used?.val
  const limit = monthly?.monthlyLimit?.val
  if (used == null || limit == null || limit <= 0) return null
  return {
    used,
    limit,
    utilization: (used / limit) * 100,
    resetsAt: monthly?.billingPeriodEnd || null
  }
})

const formatAmount = (value: number) => new Intl.NumberFormat().format(value)

const truncatedError = computed(() => {
  if (!error.value) return ''
  return error.value.length > 80 ? `${error.value.slice(0, 80)}...` : error.value
})

const handleProbe = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const result = await adminAPI.grok.queryQuota(props.account.id)
    data.value = result
    emit('probed', result)
  } catch (e) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.account.id,
  () => {
    data.value = null
    error.value = null
    loading.value = false
  }
)

watch(
  () => props.initialData,
  (value) => {
    if (value) data.value = value
  }
)
</script>
