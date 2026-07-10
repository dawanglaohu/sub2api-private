<template>
  <span class="inline-flex items-center gap-2.5">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient :id="uid" x1="8" y1="40" x2="40" y2="8" gradientUnits="userSpaceOnUse">
          <stop stop-color="#D17E09" />
          <stop offset="1" stop-color="#F7B62B" />
        </linearGradient>
      </defs>
      <!-- 巢房六边形 -->
      <path
        d="M24 4.5 41 14.25v19.5L24 43.5 7 33.75v-19.5Z"
        :stroke="`url(#${uid})`"
        stroke-width="3.2"
        stroke-linejoin="round"
      />
      <!-- 蚁径三点:自左下向右上渐强,穿巢而过 -->
      <circle cx="15.5" cy="30.5" r="2.3" fill="#ED9E13" />
      <circle cx="24" cy="24" r="3" fill="#2CB1A6" />
      <circle cx="32.5" cy="17.5" r="3.8" fill="#ED9E13" />
    </svg>
    <span
      v-if="wordmark"
      class="text-lg font-bold tracking-wide text-gray-900 dark:text-white"
      >{{ wordmark }}</span
    >
  </span>
</template>

<script setup lang="ts">
let brandMarkSeq = 0

withDefaults(defineProps<{ size?: number; wordmark?: string }>(), {
  size: 32,
  wordmark: ''
})

// 同页多实例时保持渐变 id 唯一
const uid = `jy-mark-${++brandMarkSeq}-${Math.random().toString(36).slice(2, 6)}`
</script>
