<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-[#FBF9F3] dark:bg-dark-950">
    <!-- 背景:蜂窝纹理 + 蜜琥珀光晕 + SVG 蚁群归巢(视口固定,无画布重绘) -->
    <div class="juyi-hex-pattern pointer-events-none fixed inset-0"></div>
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div class="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary-400/15 blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl"></div>
      <JuyiSwarmField :density="52" :show-hex="false" :intensity="0.9" :hive-x="0.72" :hive-y="0.3" />
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
          <JuyiAppearanceMenu direction="down" />
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
              class="jy-rise jy-d1 mb-6 inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-primary-700 dark:text-primary-300"
            >
              <span class="hex-cell inline-block h-2.5 w-2.5 bg-primary-500"></span>
              {{ t('juyi.home.eyebrow') }}
            </span>
            <h1
              class="jy-rise jy-d2 mb-5 text-[2.6rem] font-extrabold leading-[1.06] tracking-[-0.02em] text-gray-900 dark:text-white md:text-7xl lg:text-[4.5rem]"
            >
              {{ t('juyi.home.heroTitleA') }}<span class="jy-flow-text">{{ t('juyi.home.heroTitleB') }}</span>
            </h1>
            <p class="jy-rise jy-d3 mx-auto mb-8 max-w-xl text-base leading-relaxed text-gray-600 dark:text-dark-300 md:text-lg lg:mx-0">
              {{ siteSubtitle || t('juyi.home.heroDesc') }}
            </p>
            <div class="jy-rise jy-d4 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <router-link
                :to="isAuthenticated ? dashboardPath : '/login'"
                class="btn btn-primary btn-lg shadow-glow jy-sweep animate-pulse-glow"
              >
                {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
                <Icon name="arrowRight" size="md" :stroke-width="2" />
              </router-link>
              <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-lg">
                {{ t('home.viewDocs') }}
              </a>
            </div>
            <!-- 能力标签 -->
            <div class="jy-rise jy-d5 mt-8 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <span
                v-for="tag in heroTags"
                :key="tag"
                class="inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 bg-white/85 px-3.5 py-1.5 text-xs font-medium text-gray-600 dark:border-dark-700/60 dark:bg-dark-800/85 dark:text-dark-300"
              >
                <Icon name="check" size="xs" class="text-primary-500" :stroke-width="2.5" />
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 签名元素:蚁径聚合管线(数据颗粒汇流演示) -->
          <div class="jy-rise jy-d3 flex justify-center lg:justify-end">
            <AntTrailPipeline />
          </div>
        </div>
      </section>

      <!-- 模型跑马灯(全站唯一 marquee,悬停暂停,静态降级为换行) -->
      <section class="px-6 pb-8 pt-2" aria-hidden="true">
        <div
          class="jy-marquee mx-auto max-w-6xl overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]"
        >
          <div class="jy-marquee-track items-center gap-3 pr-3">
            <template v-for="n in 2" :key="n">
              <span
                v-for="m in marqueeModels"
                :key="n + m"
                class="inline-flex flex-shrink-0 items-center gap-2 rounded-lg border border-gray-200/70 bg-white/85 px-3.5 py-1.5 font-mono text-xs text-gray-500 dark:border-dark-700/50 dark:bg-dark-800/85 dark:text-dark-300"
              >
                <span class="hex-cell inline-block h-1.5 w-1.5 bg-primary-500/70"></span>
                {{ m }}
              </span>
            </template>
          </div>
        </div>
      </section>

      <!-- 三步接入(色带分区 + 行军分隔线,真实顺序,编号承载信息) -->
      <section class="jy-band px-6 py-16">
        <svg class="jy-ant-divider" viewBox="0 0 1200 3" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="1.5" x2="1200" y2="1.5" vector-effect="non-scaling-stroke" class="ant-path" />
        </svg>
        <div class="mx-auto max-w-6xl pt-4">
          <div class="mb-10 text-center" data-jy-reveal>
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              {{ t('juyi.home.steps.title') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-dark-400">{{ t('juyi.home.steps.subtitle') }}</p>
          </div>
          <div class="grid gap-6 lg:grid-cols-5">
            <ol class="space-y-5 lg:col-span-2" data-jy-reveal :data-jy-reveal-delay="80">
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
            <div class="lg:col-span-3" data-jy-reveal :data-jy-reveal-delay="160">
              <div class="overflow-hidden rounded-2xl border border-dark-700/60 bg-[#17120C] shadow-glass transition-shadow duration-300 hover:shadow-glow">
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

      <!-- 特性 bento(不对称:两张主演示卡 + 四张常规卡) -->
      <section class="px-6 py-16">
        <div class="mx-auto max-w-6xl">
          <div class="mb-10 text-center" data-jy-reveal>
            <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              {{ t('juyi.home.features.title') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-dark-400">{{ t('juyi.home.features.subtitle') }}</p>
          </div>
          <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="(f, i) in features"
              :key="f.key"
              class="jy-bento-card group relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white/85 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-500/10 dark:border-dark-700/50 dark:bg-dark-800/85"
              :class="f.featured ? 'md:col-span-2' : ''"
              data-jy-reveal
              :data-jy-reveal-delay="(i % 2) * 90"
            >
              <span class="jy-card-accent" aria-hidden="true"></span>
              <span
                class="hex-cell mb-4 flex h-12 w-10 items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              >
                <Icon :name="f.icon" size="md" class="text-white" :stroke-width="2" />
              </span>
              <h3 class="mb-1.5 font-semibold text-gray-900 dark:text-white">
                {{ t(`juyi.home.features.${f.key}`) }}
              </h3>
              <p class="text-sm leading-relaxed text-gray-600 dark:text-dark-400">
                {{ t(`juyi.home.features.${f.key}Desc`) }}
              </p>

              <!-- 微演示:多源归一(SMIL 驱动,帧内零 JS;纯装饰) -->
              <svg
                v-if="f.key === 'gateway'"
                class="mt-5 w-full"
                height="30"
                viewBox="0 0 220 30"
                aria-hidden="true"
              >
                <g fill="rgb(var(--jy-p-400) / 0.85)">
                  <path d="M7 2.7 L10.2 4.5 L10.2 8.2 L7 10 L3.8 8.2 L3.8 4.5 Z" />
                  <path d="M7 11.2 L10.2 13 L10.2 16.7 L7 18.5 L3.8 16.7 L3.8 13 Z" />
                  <path d="M7 19.7 L10.2 21.5 L10.2 25.2 L7 27 L3.8 25.2 L3.8 21.5 Z" />
                </g>
                <line x1="13" y1="15" x2="204" y2="15" stroke="rgb(var(--jy-p-500) / 0.3)" stroke-width="1.2" />
                <circle class="jy-smil-packet" r="2.6" cx="13" cy="15" fill="rgb(var(--jy-p-500))">
                  <animate attributeName="cx" values="13;204" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;0.9;0" keyTimes="0;0.08;0.85;1" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle class="jy-smil-packet" r="2.2" cx="13" cy="15" fill="rgb(var(--jy-p-400))">
                  <animate attributeName="cx" values="13;204" dur="2.4s" begin="-0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;0.9;0" keyTimes="0;0.08;0.85;1" dur="2.4s" begin="-0.8s" repeatCount="indefinite" />
                </circle>
                <circle class="jy-smil-packet" r="2.4" cx="13" cy="15" fill="#2cb1a6">
                  <animate attributeName="cx" values="13;204" dur="2.4s" begin="-1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;0.9;0" keyTimes="0;0.08;0.85;1" dur="2.4s" begin="-1.6s" repeatCount="indefinite" />
                </circle>
                <path
                  d="M212 8.5 L217.3 11.6 L217.3 17.9 L212 21 L206.7 17.9 L206.7 11.6 Z"
                  fill="rgb(var(--jy-p-500))"
                  stroke="rgb(var(--jy-p-600))"
                  stroke-width="1"
                />
                <text x="212" y="17" text-anchor="middle" font-size="7" font-weight="700" fill="#fff">1</text>
              </svg>

              <!-- 微演示:蚁群负载波(纯装饰,aria-hidden) -->
              <div v-else-if="f.key === 'schedule'" class="mt-5 flex items-center gap-1.5" aria-hidden="true">
                <span
                  v-for="ci in 8"
                  :key="ci"
                  class="hex-cell h-5 w-4 jy-wave-cell"
                  :class="ci === 6 ? 'bg-red-400/70' : 'bg-primary-500/70'"
                  :style="{ animationDelay: ci * 0.18 + 's' }"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 品牌宣言(刻意的暗色反转面板,同 curl 窗口色系) -->
      <section class="px-6 py-10">
        <div
          class="jy-manifesto relative mx-auto max-w-6xl overflow-hidden rounded-3xl px-8 py-14 text-center md:py-16"
          data-jy-reveal
        >
          <div class="juyi-hex-pattern pointer-events-none absolute inset-0 opacity-60"></div>
          <div class="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-500/15 blur-3xl"></div>
          <div class="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary-400/10 blur-3xl"></div>
          <p class="relative mb-4 font-mono text-[11px] tracking-[0.28em] text-primary-400/80">JUYI · COLONY</p>
          <h2 class="relative mx-auto max-w-3xl text-[1.85rem] font-extrabold leading-[1.18] text-white [text-wrap:balance] md:text-[2.7rem]">
            {{ t('juyi.home.manifesto.titleA') }}<span class="jy-glow-text-static">{{ t('juyi.home.manifesto.titleB') }}</span>
          </h2>
          <p class="relative mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#C9BFAE] md:text-[15px]">
            {{ t('juyi.home.manifesto.sub') }}
          </p>
          <svg class="relative mx-auto mt-8" width="160" height="4" aria-hidden="true">
            <line x1="0" y1="2" x2="160" y2="2" stroke="#F7B62B" stroke-opacity="0.55" stroke-width="1.6" class="ant-path" />
          </svg>
        </div>
      </section>

      <!-- 支持平台(色带 + 行军分隔线) -->
      <section class="jy-band px-6 py-16">
        <svg class="jy-ant-divider" viewBox="0 0 1200 3" preserveAspectRatio="none" aria-hidden="true">
          <line x1="0" y1="1.5" x2="1200" y2="1.5" vector-effect="non-scaling-stroke" class="ant-path" />
        </svg>
        <div class="mx-auto max-w-6xl pt-4 text-center">
          <h2 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl" data-jy-reveal>
            {{ t('home.providers.title') }}
          </h2>
          <p class="mb-8 text-sm text-gray-500 dark:text-dark-400" data-jy-reveal :data-jy-reveal-delay="60">
            {{ t('home.providers.description') }}
          </p>
          <div class="flex flex-wrap items-center justify-center gap-4" data-jy-reveal :data-jy-reveal-delay="120">
            <div
              v-for="p in providers"
              :key="p.name"
              class="jy-provider flex items-center gap-2.5 rounded-xl border bg-white/90 px-5 py-3 dark:bg-dark-800/90"
              :class="
                p.soon
                  ? 'border-gray-200/60 opacity-60 dark:border-dark-700/50'
                  : 'border-primary-300/50 dark:border-primary-700/40'
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
          <h2 class="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white md:text-3xl" data-jy-reveal>
            {{ t('juyi.home.faq.title') }}
          </h2>
          <div class="space-y-3">
            <details
              v-for="n in 3"
              :key="n"
              class="group rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur-sm transition-colors hover:border-primary-400/40 dark:border-dark-700/50 dark:bg-dark-800/60"
              data-jy-reveal
              :data-jy-reveal-delay="(n - 1) * 70"
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
import JuyiSwarmField from '@/components/juyi/JuyiSwarmField.vue'
import JuyiAppearanceMenu from '@/components/juyi/JuyiAppearanceMenu.vue'
import { useJuyiReveal } from '@/composables/useJuyiReveal'
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
  { key: 'gateway', icon: 'server', featured: true },
  { key: 'schedule', icon: 'swap', featured: true },
  { key: 'billing', icon: 'dollar', featured: false },
  { key: 'stats', icon: 'chart', featured: false },
  { key: 'keys', icon: 'key', featured: false },
  { key: 'redeem', icon: 'gift', featured: false }
] as const

// 跑马灯:站内已接入的热门模型(纯展示,双份内容供无缝滚动)
const marqueeModels = [
  'claude-opus-4-5',
  'claude-sonnet-4-6',
  'claude-haiku-4-5',
  'gpt-5.1-codex-max',
  'gpt-5.1',
  'gemini-3-pro',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'grok-4',
  'grok-code-fast-1'
]

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

// 滚动浮现(data-jy-reveal 元素)
useJuyiReveal()
</script>
