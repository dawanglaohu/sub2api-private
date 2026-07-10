<template>
  <div ref="rootRef" class="relative">
    <button
      @click="open = !open"
      class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
      :class="buttonClass"
      :title="t('juyi.appearance.title')"
    >
      <!-- 调色盘图标(半环色轮) -->
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 3a9 9 0 100 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01a1.5 1.5 0 011.12-2.49H16a5 5 0 005-5c0-4.42-4.03-8-9-8z"
        />
        <circle cx="7.5" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
        <circle cx="10.5" cy="7.5" r="1.15" fill="currentColor" stroke="none" />
        <circle cx="15" cy="7.8" r="1.15" fill="currentColor" stroke="none" />
      </svg>
    </button>

    <transition name="fade">
      <div
        v-if="open"
        class="absolute z-50 w-56 rounded-xl border border-gray-200/70 bg-white p-3 shadow-xl dark:border-dark-700 dark:bg-dark-800"
        :class="direction === 'up' ? 'bottom-full mb-2 left-0' : 'right-0 top-full mt-2'"
      >
        <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-dark-500">
          {{ t('juyi.appearance.theme') }}
        </p>
        <div class="mb-3 flex items-center gap-2.5">
          <button
            v-for="tItem in JUYI_THEMES"
            :key="tItem.key"
            @click="setTheme(tItem.key)"
            class="hex-cell h-8 w-7 transition-transform hover:scale-110 focus:outline-none"
            :style="{ backgroundColor: tItem.swatch }"
            :class="theme === tItem.key ? 'ring-2 ring-gray-900 ring-offset-2 dark:ring-white dark:ring-offset-dark-800' : ''"
            :title="t(`juyi.appearance.themes.${tItem.key}`)"
          ></button>
        </div>

        <p class="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-dark-500">
          {{ t('juyi.appearance.font') }}
        </p>
        <div class="space-y-1">
          <button
            v-for="f in JUYI_FONTS"
            :key="f"
            @click="setFont(f)"
            class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors"
            :class="
              font === f
                ? 'bg-primary-500/10 font-medium text-primary-700 dark:text-primary-300'
                : 'text-gray-600 hover:bg-gray-100 dark:text-dark-300 dark:hover:bg-dark-700'
            "
          >
            <span>{{ t(`juyi.appearance.fonts.${f}`) }}</span>
            <span
              class="text-xs text-gray-400 dark:text-dark-500"
              :style="{ fontFamily: FONT_PREVIEW[f] }"
              >Aa 字</span
            >
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useJuyiAppearance,
  JUYI_THEMES,
  JUYI_FONTS,
  type JuyiFont
} from '@/composables/useJuyiAppearance'

withDefaults(defineProps<{ direction?: 'up' | 'down'; buttonClass?: string }>(), {
  direction: 'down',
  buttonClass: ''
})

const { t } = useI18n()
const { theme, font, setTheme, setFont } = useJuyiAppearance()

const FONT_PREVIEW: Record<JuyiFont, string> = {
  default: 'system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
  serif: 'Georgia, "Songti SC", SimSun, serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace'
}

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function onDocClick(e: MouseEvent) {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
