<template>
  <div
    class="card juyi-hex-pattern relative overflow-hidden bg-gradient-to-r from-primary-50/80 via-white to-white p-5 dark:from-dark-900 dark:via-dark-800/60 dark:to-dark-800/40 md:p-6"
  >
    <!-- 品牌水印 -->
    <div class="pointer-events-none absolute -right-6 -top-8 opacity-[0.08] dark:opacity-[0.12]">
      <BrandMark :size="180" />
    </div>

    <div class="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <!-- 问候 -->
      <div class="jy-rise jy-d1">
        <div class="mb-1.5 flex items-center gap-2.5">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
            {{ greeting }}{{ displayName ? ',' + displayName : '' }}
          </h2>
        </div>
        <span
          class="inline-flex items-center gap-1.5 rounded-full border border-primary-500/25 bg-primary-500/10 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300"
        >
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-60"></span>
            <span class="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
          </span>
          {{ t('juyi.dash.heroTag') }}
        </span>
      </div>

      <!-- 接入端点快速复制 -->
      <div class="jy-rise jy-d2 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div
          class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 py-2 pl-4 pr-2 transition-shadow duration-300 hover:shadow-glow dark:border-dark-600 dark:bg-dark-900/70"
        >
          <div class="min-w-0">
            <p class="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-dark-500">
              {{ t('juyi.dash.endpoint') }}
            </p>
            <p class="truncate font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
              {{ origin }}
            </p>
          </div>
          <button
            @click="copyEndpoint"
            class="ml-1 flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400"
            :title="t('juyi.dash.endpoint')"
          >
            <span :key="copied ? 'y' : 'n'" class="jy-pop">
              <Icon :name="copied ? 'checkCircle' : 'copy'" size="sm" :class="copied ? 'text-primary-500' : ''" />
            </span>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <router-link to="/keys" class="btn btn-primary btn-sm whitespace-nowrap">
            <Icon name="key" size="xs" :stroke-width="2" />
            {{ t('juyi.dash.createKey') }}
          </router-link>
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary btn-sm whitespace-nowrap"
          >
            {{ t('juyi.dash.viewDocs') }}
          </a>
        </div>
      </div>
    </div>

    <!-- 底部行军蚁线:请求在流动 -->
    <svg
      class="pointer-events-none absolute bottom-0 left-0 h-[2.5px] w-full"
      viewBox="0 0 600 3"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="0" y1="1.5" x2="600" y2="1.5" vector-effect="non-scaling-stroke" class="ant-path" opacity="0.55" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import Icon from '@/components/icons/Icon.vue'
import BrandMark from '@/components/brand/BrandMark.vue'
import { useClipboard } from '@/composables/useClipboard'
import { sanitizeUrl } from '@/utils/url'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const { copied, copyToClipboard } = useClipboard()

const displayName = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return u.username?.trim() || u.email?.split('@')[0] || ''
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return t('juyi.dash.greetingMorning')
  if (h < 18) return t('juyi.dash.greetingAfternoon')
  return t('juyi.dash.greetingEvening')
})

const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const origin = computed(() => window.location.origin)

function copyEndpoint() {
  void copyToClipboard(origin.value, t('juyi.dash.copied'))
}
</script>
