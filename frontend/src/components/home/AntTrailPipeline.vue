<template>
  <figure class="w-full">
    <svg
      viewBox="0 0 560 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="h-auto w-full max-w-[560px]"
      role="img"
      :aria-label="t('juyi.home.pipelineCaption')"
    >
      <defs>
        <linearGradient id="jy-flow" x1="0" y1="160" x2="560" y2="160" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E8A23B" />
          <stop offset="0.5" stop-color="#ED9E13" />
          <stop offset="1" stop-color="#2CB1A6" />
        </linearGradient>
        <radialGradient id="jy-halo" cx="0.5" cy="0.5" r="0.5">
          <stop stop-color="#F7B62B" stop-opacity="0.4" />
          <stop offset="1" stop-color="#F7B62B" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 蚁径:四条订阅源汇入 -->
      <path d="M124 47 C200 47 224 128 260 151" stroke="url(#jy-flow)" stroke-width="1.8" class="ant-path" />
      <path d="M124 122 C190 122 218 144 258 157" stroke="url(#jy-flow)" stroke-width="1.8" class="ant-path" style="animation-delay: -0.3s" />
      <path d="M124 197 C190 197 218 176 258 163" stroke="url(#jy-flow)" stroke-width="1.8" class="ant-path" style="animation-delay: -0.6s" />
      <path d="M124 272 C200 272 224 192 260 169" stroke="url(#jy-flow)" stroke-width="1.8" class="ant-path" style="animation-delay: -0.9s" />
      <!-- 汇聚后的统一出口:更粗,流速一致 -->
      <path d="M344 160 H448" stroke="url(#jy-flow)" stroke-width="2.6" class="ant-path" style="animation-delay: -0.15s" />

      <!-- 订阅源节点 -->
      <g v-for="(s, i) in sources" :key="s.name">
        <rect
          x="8"
          :y="30 + i * 75"
          width="116"
          height="34"
          rx="17"
          class="fill-white stroke-gray-200 dark:fill-[#221C15] dark:stroke-[#453A2B]"
        />
        <circle cx="28" :cy="47 + i * 75" r="4" class="fill-primary-400" />
        <text
          x="42"
          :y="51.5 + i * 75"
          font-size="12.5"
          font-weight="600"
          class="fill-gray-700 dark:fill-gray-300"
        >
          {{ s.name }}
        </text>
      </g>

      <!-- 聚蚁核心:巢房六边形 -->
      <circle cx="300" cy="160" r="64" fill="url(#jy-halo)" class="ant-glow" />
      <path
        d="M300 112 342 136v48l-42 24-42-24v-48Z"
        fill="#17120C"
        stroke="url(#jy-flow)"
        stroke-width="3"
        stroke-linejoin="round"
      />
      <circle cx="288" cy="172" r="2.6" fill="#ED9E13" />
      <circle cx="300" cy="160" r="3.4" fill="#2CB1A6" />
      <circle cx="313" cy="147" r="4.2" fill="#ED9E13" />

      <!-- 统一 API 出口 -->
      <rect
        x="448"
        y="138"
        width="104"
        height="44"
        rx="22"
        class="fill-white stroke-gray-200 dark:fill-[#221C15] dark:stroke-[#453A2B]"
      />
      <text x="500" y="159" text-anchor="middle" font-size="15" font-weight="700" font-family="'Space Grotesk', sans-serif" class="fill-gray-900 dark:fill-white">
        API
      </text>
      <text x="500" y="174" text-anchor="middle" font-size="9.5" font-family="'IBM Plex Mono', monospace" class="fill-primary-600 dark:fill-primary-400">
        /v1 · unified
      </text>
    </svg>
    <figcaption class="mt-3 text-center text-xs text-gray-500 dark:text-dark-400">
      {{ t('juyi.home.pipelineCaption') }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const sources = [
  { name: 'Claude' },
  { name: 'Codex' },
  { name: 'Gemini' },
  { name: 'Antigravity' }
]
</script>
