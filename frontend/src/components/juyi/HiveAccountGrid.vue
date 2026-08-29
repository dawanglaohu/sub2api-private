<template>
  <div class="card juyi-hex-pattern relative overflow-hidden p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
          {{ t('juyi.hive.title') }}
        </h2>
        <p class="text-xs text-gray-500 dark:text-dark-400">{{ t('juyi.hive.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- 图例 + 计数 -->
        <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-dark-400">
          <span class="inline-flex items-center gap-1.5">
            <span class="hex-cell inline-block h-3 w-3 bg-primary-500"></span>
            {{ counts.active }} {{ t('juyi.hive.active') }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="hex-cell inline-block h-3 w-3 bg-red-500"></span>
            {{ counts.error }} {{ t('juyi.hive.error') }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="hex-cell inline-block h-3 w-3 bg-gray-300 dark:bg-dark-600"></span>
            {{ counts.inactive }} {{ t('juyi.hive.inactive') }}
          </span>
        </div>
        <router-link
          to="/admin/accounts"
          class="inline-flex items-center gap-1 text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {{ t('juyi.hive.manage') }}
          <Icon name="chevronRight" size="xs" />
        </router-link>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <LoadingSpinner size="md" />
    </div>

    <template v-else>
      <div v-if="accounts.length === 0" class="py-6 text-center text-sm text-gray-500 dark:text-dark-400">
        {{ t('juyi.hive.empty') }}
      </div>

      <!-- 蜂窝格:每格一个服务账号,颜色即健康度;错落浮现 -->
      <div v-else class="flex flex-wrap gap-1.5">
        <button
          v-for="(acc, i) in visibleAccounts"
          :key="acc.id"
          type="button"
          class="hex-cell jy-hex-in h-8 w-7 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="cellClass(acc)"
          :style="{ animationDelay: (i % 24) * 22 + 'ms' }"
          :title="cellTitle(acc)"
          @click="goAccounts"
        ></button>
        <router-link
          v-if="total > visibleAccounts.length"
          to="/admin/accounts"
          class="hex-cell jy-hex-in flex h-8 items-center justify-center bg-gray-200 px-2 font-mono text-[10px] font-semibold text-gray-600 transition-colors hover:bg-gray-300 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
          :style="{ animationDelay: (visibleAccounts.length % 24) * 22 + 'ms' }"
          :title="t('juyi.hive.more', { n: total - visibleAccounts.length })"
        >
          +{{ total - visibleAccounts.length }}
        </router-link>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { adminAPI } from '@/api/admin'
import type { Account } from '@/types'
import Icon from '@/components/icons/Icon.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const MAX_CELLS = 96

const { t } = useI18n()
const router = useRouter()

const accounts = ref<Account[]>([])
const total = ref(0)
const loading = ref(false)

const visibleAccounts = computed(() => accounts.value.slice(0, MAX_CELLS))

const counts = computed(() => {
  let active = 0
  let error = 0
  let inactive = 0
  for (const a of accounts.value) {
    if (a.status === 'error') error++
    else if (a.status === 'active') active++
    else inactive++
  }
  return { active, error, inactive }
})

function cellClass(acc: Account): string {
  if (acc.status === 'error') return 'animate-pulse bg-red-500'
  if (acc.status === 'active') return 'bg-primary-500 hover:bg-primary-400'
  return 'bg-gray-300 dark:bg-dark-600'
}

function cellTitle(acc: Account): string {
  const status = t(`juyi.hive.${acc.status === 'active' ? 'active' : acc.status === 'error' ? 'error' : 'inactive'}`)
  const base = `${acc.name} · ${acc.platform} · ${status}`
  return acc.status === 'error' && acc.error_message ? `${base}: ${acc.error_message}` : base
}

function goAccounts() {
  void router.push('/admin/accounts')
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await adminAPI.accounts.list(1, MAX_CELLS, { lite: 'true' })
    accounts.value = res.items || []
    total.value = res.total || accounts.value.length
  } catch (error) {
    console.error('Failed to load account hive:', error)
    accounts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
})
</script>
