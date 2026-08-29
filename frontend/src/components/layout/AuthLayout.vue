<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-gray-50 via-primary-50/30 to-gray-100 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950"
    ></div>

    <!-- Decorative Elements:漂移色斑(色彩律动) + 蜂窝纹理 + SVG 蚁群归巢(巢房在卡片正后方) -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="jy-blob jy-blob-a"></div>
      <div class="jy-blob jy-blob-b"></div>
      <div class="juyi-hex-pattern absolute inset-0"></div>
      <JuyiSwarmField :density="44" :show-hex="true" :hive-x="0.5" :hive-y="0.5" />
    </div>

    <!-- Content Container -->
    <div class="relative z-10 w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="mb-8 text-center">
        <!-- Custom Logo or Default Logo -->
        <template v-if="settingsLoaded">
          <div class="relative mb-4 inline-flex">
            <!-- 蜂巢轨道环:缓转的虚线六角,纯装饰 -->
            <svg
              class="jy-orbit pointer-events-none absolute -inset-3 h-[calc(100%+24px)] w-[calc(100%+24px)]"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M50 6 88 28v44L50 94 12 72V28Z"
                stroke="rgb(var(--jy-p-500) / 0.4)"
                stroke-width="1.6"
                stroke-dasharray="4 7"
                stroke-linejoin="round"
              />
            </svg>
            <div
              class="inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-primary-500/30"
            >
              <img :src="siteLogo || '/logo.svg'" alt="Logo" class="h-full w-full object-contain" />
            </div>
          </div>
          <h1 class="text-gradient mb-2 text-3xl font-bold">
            {{ siteName }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-dark-400">
            {{ siteSubtitle }}
          </p>
        </template>
      </div>

      <!-- Card Container v2:实底暖纸 + 顶部琥珀青条 + 升起入场 + 指针微倾斜(去 backdrop-blur,性能优先) -->
      <div
        ref="cardRef"
        class="jy-auth-card rounded-2xl p-8"
        @pointermove="onCardMove"
        @pointerleave="onCardLeave"
      >
        <slot />
      </div>

      <!-- Footer Links -->
      <div class="mt-6 text-center text-sm">
        <slot name="footer" />
      </div>

      <!-- Copyright -->
      <div class="mt-8 text-center text-xs text-gray-400 dark:text-dark-500">
        &copy; {{ currentYear }} {{ siteName }}. All rights reserved.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAppStore } from '@/stores'
import { sanitizeUrl } from '@/utils/url'
import JuyiSwarmField from '@/components/juyi/JuyiSwarmField.vue'

const appStore = useAppStore()

// 指针微倾斜:仅精确指针 + 未开启 reduced-motion 时生效,幅度克制(±2.5°)
const cardRef = ref<HTMLElement | null>(null)
let tiltEnabled = false

function onCardMove(e: PointerEvent) {
  if (!tiltEnabled || !cardRef.value) return
  const rect = cardRef.value.getBoundingClientRect()
  const px = (e.clientX - rect.left) / rect.width - 0.5
  const py = (e.clientY - rect.top) / rect.height - 0.5
  cardRef.value.style.setProperty('--jy-ty', `${(px * 5).toFixed(2)}deg`)
  cardRef.value.style.setProperty('--jy-tx', `${(-py * 5).toFixed(2)}deg`)
}

function onCardLeave() {
  if (!cardRef.value) return
  cardRef.value.style.setProperty('--jy-ty', '0deg')
  cardRef.value.style.setProperty('--jy-tx', '0deg')
}

onMounted(() => {
  tiltEnabled =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  appStore.fetchPublicSettings()
})

const siteName = computed(() => appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'Subscription to API Conversion Platform')
const settingsLoaded = computed(() => appStore.publicSettingsLoaded)

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.text-gradient {
  @apply bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent;
}
</style>
