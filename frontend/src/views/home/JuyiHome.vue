<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-[#FBF9F3] dark:bg-dark-950">
    <!-- 背景:蜂窝纹理 + 蜜琥珀光晕 -->
    <div class="juyi-hex-pattern pointer-events-none absolute inset-0"></div>
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-400/15 blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl"></div>
    </div>

    <!-- 顶栏 -->
    <header class="relative z-20 px-6 py-4">
      <nav class="mx-auto flex max-w-6xl items-center justify-between">
        <div class="flex items-center gap-2.5">
          <img
            v-if="siteLogo"
            :src="siteLogo"
            alt="Logo"
            class="h-9 w-9 rounded-xl object-contain"
          />
          <BrandMark v-else :size="34" />
          <span class="text-lg font-bold tracking-wide text-gray-900 dark:text-white">
            {{ siteName }}
          </span>
        </div>

        <div class="flex items-center gap-3">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>
          <button
            @click="toggleTheme"
            class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>
          <router-link
            v-if="isAuthenticated"
            :to="dashboardPath"
            class="btn btn-primary btn-sm"
          >
            {{ t('home.goToDashboard') }}
          </router-link>
          <template v-else>
            <router-link to="/login" class="btn btn-ghost btn-sm">
              {{ t('home.login') }}
            </router-link>
            <router-link to="/login" class="btn btn-primary btn-sm">
              {{ t('home.getStarted') }}
            </router-link>
          </template>
        </div>
      </nav>
    </header>

    <main class="relative z-10 flex-1">
      <!-- Hero -->
      <section class="px-6 pb-20 pt-14 md:pt-20">
        <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div class="text-center lg:text-left">
            <span
              class="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary-700 dark:text-primary-300"
            >
              <span class="hex-cell inline-block h-2.5 w-2.5 bg-primary-500"></span>
              {{ t('juyi.home.eyebrow') }}
            </span>
            <h1
              class="mb-5 text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-5xl lg:text-[3.4rem]"
            >
              {{ t('juyi.home.heroTitle') }}
            </h1>
            <p class="mx-auto mb-8 max-w-xl text-base leading-relaxed text-gray-600 dark:text-dark-300 md:text-lg lg:mx-0">
              {{ siteSubtitle || t('juyi.home.heroDesc') }}
            </p>
            <div class="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <router-link
                :to="isAuthenticated ? dashboardPath : '/login'"
                class="btn btn-primary btn-lg shadow-glow"
              >
                {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
                <Icon name="arrowRight" size="md" :stroke-width="2" />
              </router-link>
              <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-lg">
                {{ t('home.viewDocs') }}
              </a>
            </div>
            <!-- 能力标签 -->
            <div class="mt-8 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <span
                v-for="tag in heroTags"
                :key="tag"
                class="inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-gray-600 backdrop-blur-sm dark:border-dark-700/60 dark:bg-dark-800/60 dark:text-dark-300"
              >
                <Icon name="check" size="xs" class="text-primary-500" :stroke-width="2.5" />
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 签名元素:蚁径聚合管线 -->
          <div class="flex justify-center lg:justify-end">
            <AntTrailPipeline />
          </div>
        </div>
      </section>

      <!-- 三步接入(真实顺序,编号承载信息) -->
      <section class="px-6 py-16">
        <div class="mx-auto max-w-6xl">
          <div class="mb-10 text-center">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              {{ t('juyi.home.steps.title') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-dark-400">{{ t('juyi.home.steps.subtitle') }}</p>
          </div>
          <div class="grid gap-6 lg:grid-cols-5">
            <ol class="space-y-5 lg:col-span-2">
              <li v-for="(step, i) in steps" :key="i" class="flex gap-4">
                <span
                  class="hex-cell flex h-11 w-11 flex-shrink-0 items-center justify-center bg-primary-500/15 font-mono text-sm font-semibold text-primary-600 dark:text-primary-400"
                >
                  0{{ i + 1 }}
                </span>
                <div>
                  <h3 class="mb-1 font-semibold text-gray-900 dark:text-white">{{ step.title }}</h3>
                  <p class="text-sm leading-relaxed text-gray-600 dark:text-dark-400">{{ step.desc }}</p>
                </div>
              </li>
            </ol>
            <!-- curl 示例:端点为当前站点真实地址 -->
            <div class="lg:col-span-3">
              <div class="overflow-hidden rounded-2xl border border-dark-700/60 bg-[#17120C] shadow-glass">
                <div class="flex items-center justify-between border-b border-dark-700/60 px-4 py-2.5">
                  <span class="font-mono text-xs text-dark-400">POST {{ origin }}/v1/messages</span>
                  <button
                    @click="copyCurl"
                    class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-dark-300 transition-colors hover:bg-dark-800 hover:text-white"
                  >
                    <Icon :name="copied ? 'checkCircle' : 'copy'" size="xs" :class="copied ? 'text-primary-400' : ''" />
                    {{ copied ? t('juyi.home.steps.copied') : t('juyi.home.steps.copy') }}
                  </button>
                </div>
                <pre class="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-gray-300"><code>{{ curlText }}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 特性 bento -->
      <section class="px-6 py-16">
        <div class="mx-auto max-w-6xl">
          <div class="mb-10 text-center">
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              {{ t('juyi.home.features.title') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-dark-400">{{ t('juyi.home.features.subtitle') }}</p>
          </div>
          <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="f in features"
              :key="f.key"
              class="group rounded-2xl border border-gray-200/60 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-400/40 hover:shadow-xl hover:shadow-primary-500/10 dark:border-dark-700/50 dark:bg-dark-800/60"
            >
              <span
                class="hex-cell mb-4 flex h-11 w-11 items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 transition-transform group-hover:scale-110"
              >
                <Icon :name="f.icon" size="md" class="text-white" :stroke-width="2" />
              </span>
              <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-white">
                {{ t(`juyi.home.features.${f.key}`) }}
              </h3>
              <p class="text-sm leading-relaxed text-gray-600 dark:text-dark-400">
                {{ t(`juyi.home.features.${f.key}Desc`) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 支持平台 -->
      <section class="px-6 py-16">
        <div class="mx-auto max-w-6xl text-center">
          <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            {{ t('home.providers.title') }}
          </h2>
          <p class="mb-8 text-sm text-gray-500 dark:text-dark-400">
            {{ t('home.providers.description') }}
          </p>
          <div class="flex flex-wrap items-center justify-center gap-4">
            <div
              v-for="p in providers"
              :key="p.name"
              class="flex items-center gap-2.5 rounded-xl border px-5 py-3 backdrop-blur-sm"
              :class="
                p.soon
                  ? 'border-gray-200/60 bg-white/40 opacity-60 dark:border-dark-700/50 dark:bg-dark-800/40'
                  : 'border-primary-300/40 bg-white/70 dark:border-primary-700/40 dark:bg-dark-800/60'
              "
            >
              <span
                class="hex-cell flex h-8 w-8 items-center justify-center text-xs font-bold text-white"
                :class="p.soon ? 'bg-gray-400 dark:bg-dark-600' : 'bg-gradient-to-br from-primary-400 to-primary-600'"
              >
                {{ p.letter }}
              </span>
              <span class="text-sm font-medium text-gray-700 dark:text-dark-200">{{ p.name }}</span>
              <span
                class="rounded px-1.5 py-0.5 text-[10px] font-medium"
                :class="
                  p.soon
                    ? 'bg-gray-100 text-gray-500 dark:bg-dark-700 dark:text-dark-400'
                    : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                "
              >
                {{ p.soon ? t('home.providers.soon') : t('home.providers.supported') }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="px-6 py-16">
        <div class="mx-auto max-w-3xl">
          <h2 class="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            {{ t('juyi.home.faq.title') }}
          </h2>
          <div class="space-y-3">
            <details
              v-for="n in 3"
              :key="n"
              class="group rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur-sm dark:border-dark-700/50 dark:bg-dark-800/60"
            >
              <summary
                class="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-medium text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden"
              >
                {{ t(`juyi.home.faq.q${n}`) }}
                <Icon
                  name="chevronDown"
                  size="sm"
                  class="text-gray-400 transition-transform group-open:rotate-180"
                />
              </summary>
              <p class="px-6 pb-5 text-sm leading-relaxed text-gray-600 dark:text-dark-400">
                {{ t(`juyi.home.faq.a${n}`) }}
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="relative z-10 border-t border-gray-200/60 px-6 py-8 dark:border-dark-800/60">
      <div
        class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left"
      >
        <p class="text-sm text-gray-500 dark:text-dark-400">
          &copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}
        </p>
        <div class="flex items-center gap-4">
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-dark-400 dark:hover:text-white"
          >
            {{ t('home.docs') }}
          </a>
          <a
            href="https://github.com/Wei-Shaw/sub2api"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:text-dark-500 dark:hover:text-dark-300"
          >
            {{ t('juyi.home.poweredBy') }}
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import BrandMark from '@/components/brand/BrandMark.vue'
import AntTrailPipeline from '@/components/home/AntTrailPipeline.vue'
import { useClipboard } from '@/composables/useClipboard'
import { sanitizeUrl } from '@/utils/url'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const { copied, copyToClipboard } = useClipboard()

// 站点设置(沿用注入配置,与上游 HomeView 行为一致)
const siteName = computed(
  () => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API'
)
const siteLogo = computed(() =>
  sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', {
    allowRelative: true,
    allowDataUrl: true
  })
)
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || '')
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))

// 登录态
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => (isAdmin.value ? '/admin/dashboard' : '/dashboard'))

// 主题
const isDark = ref(document.documentElement.classList.contains('dark'))
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
}

// 能力标签:复用上游 home.tags.* 文案
const heroTags = computed(() => [
  t('home.tags.subscriptionToApi'),
  t('home.tags.stickySession'),
  t('home.tags.realtimeBilling')
])

const steps = computed(() => [
  { title: t('juyi.home.steps.s1Title'), desc: t('juyi.home.steps.s1Desc') },
  { title: t('juyi.home.steps.s2Title'), desc: t('juyi.home.steps.s2Desc') },
  { title: t('juyi.home.steps.s3Title'), desc: t('juyi.home.steps.s3Desc') }
])

const features = [
  { key: 'gateway', icon: 'server' },
  { key: 'schedule', icon: 'swap' },
  { key: 'billing', icon: 'dollar' },
  { key: 'stats', icon: 'chart' },
  { key: 'keys', icon: 'key' },
  { key: 'redeem', icon: 'gift' }
] as const

const providers = computed(() => [
  { name: t('home.providers.claude'), letter: 'C', soon: false },
  { name: 'GPT / Codex', letter: 'G', soon: false },
  { name: t('home.providers.gemini'), letter: 'G', soon: false },
  { name: t('home.providers.antigravity'), letter: 'A', soon: false },
  { name: t('home.providers.more'), letter: '+', soon: true }
])

// curl 示例:端点为当前站点真实地址
const origin = computed(() =>
  typeof window !== 'undefined' ? window.location.origin : 'https://your-domain'
)
const curlText = computed(
  () => `curl ${origin.value}/v1/messages \\
  -H "x-api-key: $JUYI_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 128,
    "messages": [{"role": "user", "content": "你好，聚蚁"}]
  }'`
)
function copyCurl() {
  void copyToClipboard(curlText.value, t('juyi.home.steps.copied'))
}

const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  initTheme()
  authStore.checkAuth()
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>
