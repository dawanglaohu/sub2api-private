<template>
  <figure class="w-full">
    <svg
      ref="svgRef"
      viewBox="0 0 560 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="jy-pipe h-auto w-full max-w-[620px] drop-shadow-[0_18px_40px_rgb(var(--jy-p-500)_/_0.12)]"
      :class="{ 'jy-drawn': drawn }"
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
        <radialGradient id="jy-packet" cx="0.5" cy="0.5" r="0.5">
          <stop stop-color="#FFE9B8" stop-opacity="0.95" />
          <stop offset="0.4" stop-color="#F7B62B" stop-opacity="0.75" />
          <stop offset="1" stop-color="#F7B62B" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 底层实线:滚动入场时描画 -->
      <g class="jy-under-group">
        <path
          v-for="(d, i) in srcPathDs"
          :key="'u' + i"
          class="jy-under"
          :style="{ '--pd': 0.08 + i * 0.14 + 's' }"
          :d="d"
          pathLength="1"
          stroke="url(#jy-flow)"
          stroke-width="1.4"
          stroke-opacity="0.5"
        />
        <path class="jy-under" style="--pd: 0.75s" d="M344 160 H448" pathLength="1" stroke="url(#jy-flow)" stroke-width="2.2" stroke-opacity="0.55" />
      </g>

      <!-- 蚁径:四条订阅源汇入(行军虚线层) -->
      <g class="jy-overlay-group">
        <path
          v-for="(d, i) in srcPathDs"
          :key="'o' + i"
          class="ant-path jy-src-path"
          :class="{ 'jy-hot': hovered === i }"
          :d="d"
          stroke="url(#jy-flow)"
          stroke-width="1.8"
          :style="{ animationDelay: -0.3 * i + 's' }"
        />
        <!-- 汇聚后的统一出口:更粗,流速一致 -->
        <path d="M344 160 H448" stroke="url(#jy-flow)" stroke-width="2.6" class="ant-path" style="animation-delay: -0.15s" />

        <!-- 数据颗粒:源路径 → 巢房 -->
        <g class="jy-packets">
          <g v-for="(pk, i) in srcPackets" :key="'p' + i" :visibility="pk.on ? 'visible' : 'hidden'">
            <circle :cx="pk.x" :cy="pk.y" r="10" fill="url(#jy-packet)" />
            <circle :cx="pk.x" :cy="pk.y" r="2.8" class="fill-primary-500 dark:fill-primary-400" />
          </g>
          <g v-if="outPacket.on">
            <circle :cx="outPacket.x" :cy="outPacket.y" r="11" fill="url(#jy-packet)" />
            <circle :cx="outPacket.x" :cy="outPacket.y" r="3.2" class="fill-primary-600 dark:fill-primary-300" />
          </g>
        </g>

        <!-- 入巢脉冲光环 -->
        <circle
          v-for="(pu, i) in pulses"
          :key="'pulse' + i"
          :cx="pu.x"
          :cy="pu.y"
          :r="pu.r"
          :stroke-opacity="pu.a"
          stroke="#F7B62B"
          stroke-width="1.8"
        />
      </g>

      <!-- 订阅源节点 -->
      <g
        v-for="(s, i) in sources"
        :key="s.name"
        class="jy-node cursor-default"
        :style="{ '--pd': 0.25 + i * 0.14 + 's' }"
        @mouseenter="hovered = i"
        @mouseleave="hovered = -1"
      >
        <rect
          x="8"
          :y="30 + i * 75"
          width="116"
          height="34"
          rx="17"
          class="jy-node-box fill-white stroke-gray-200 transition-colors duration-200 dark:fill-[#221C15] dark:stroke-[#453A2B]"
          :class="hovered === i ? '!stroke-primary-500/70' : ''"
        />
        <circle cx="28" :cy="47 + i * 75" r="4" class="fill-primary-400" :class="{ 'animate-pulse': hovered === i }" />
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
      <g class="jy-node" :style="{ '--pd': '0.9s' }">
        <circle cx="300" cy="160" r="64" fill="url(#jy-halo)" class="ant-glow" />
        <path
          d="M300 112 342 136v48l-42 24-42-24v-48Z"
          fill="#17120C"
          stroke="url(#jy-flow)"
          stroke-width="3.2"
          stroke-linejoin="round"
        />
        <circle cx="288" cy="172" r="2.8" fill="#ED9E13" />
        <circle cx="300" cy="160" r="3.6" fill="#2CB1A6" />
        <circle cx="313" cy="147" r="4.4" fill="#ED9E13" />
      </g>

      <!-- 统一 API 出口 -->
      <g class="jy-node" :style="{ '--pd': '1.05s' }">
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
      </g>
    </svg>
    <figcaption class="mt-3 text-center text-xs text-gray-500 dark:text-dark-400">
      {{ t('juyi.home.pipelineCaption') }}
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
// 聚蚁签名元素 v2:数据颗粒沿蚁径流向巢房,入巢泛脉冲、出口流出统一响应。
// 动画用 rAF + getPointAtLength 驱动(节点少,开销可忽略);
// reduced-motion 时静态展示;滚出视口自动暂停。
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const sources = [
  { name: 'Claude' },
  { name: 'Codex' },
  { name: 'Gemini' },
  { name: 'Antigravity' }
]

const srcPathDs = [
  'M124 47 C200 47 224 128 260 151',
  'M124 122 C190 122 218 144 258 157',
  'M124 197 C190 197 218 176 258 163',
  'M124 272 C200 272 224 192 260 169'
]

interface Packet {
  on: boolean
  t: number
  speed: number // 归一化进度/秒
  x: number
  y: number
}
interface Pulse {
  x: number
  y: number
  r: number
  a: number
}

const svgRef = ref<SVGSVGElement | null>(null)
const drawn = ref(false)
const hovered = ref(-1)

const srcPackets = reactive<Packet[]>(
  sources.map(() => ({ on: false, t: 0, speed: 0.28, x: 124, y: 0 }))
)
const outPacket = reactive<Packet>({ on: false, t: 0, speed: 0.5, x: 344, y: 160 })
const pulses = reactive<Pulse[]>([])

let rafId = 0
let running = false
let lastTs = 0
let elapsed = 0
const nextSpawn = [0.4, 1.1, 1.8, 2.5] // 各源首个颗粒出发时间(秒)
const respawnGap = [2.4, 3.1, 2.8, 3.5]
let srcEls: SVGPathElement[] = []
let srcLens: number[] = []
let outLen = 104
let outCooldown = 0

function tick(ts: number) {
  if (!running || !svgRef.value) return
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016)
  lastTs = ts
  elapsed += dt
  outCooldown = Math.max(0, outCooldown - dt)

  // 源颗粒(路径元素与长度已在挂载时缓存,帧内零查询)

  // 源颗粒(路径元素与长度已在挂载时缓存,帧内零查询;悬停的源加速 = 响应式反馈)
  srcPackets.forEach((pk, i) => {
    const boost = hovered.value === i ? 1.9 : 1
    if (!pk.on) {
      if (elapsed >= nextSpawn[i]) {
        pk.on = true
        pk.t = 0
        pk.speed = (110 / (srcLens[i] || 140)) * boost
        nextSpawn[i] = elapsed + respawnGap[i] + Math.random() * 1.6
      }
      return
    }
    pk.t += pk.speed * boost * dt
    if (srcEls[i]) {
      const el = srcEls[i]
      const len = srcLens[i] || el.getTotalLength()
      const pt = el.getPointAtLength(Math.max(0, Math.min(1, pk.t)) * len)
      pk.x = pt.x
      pk.y = pt.y
    }
    if (pk.t >= 1) {
      pk.on = false
      // 入巢:泛脉冲 + 安排出厂
      if (pulses.length < 3) pulses.push({ x: pk.x, y: pk.y, r: 4, a: 0.6 })
      if (!outPacket.on && outCooldown <= 0) {
        outPacket.on = true
        outPacket.t = 0
        outCooldown = 0.5
      }
    }
  })

  // 出口颗粒:统一 API 响应
  if (outPacket.on) {
    outPacket.t += outPacket.speed * dt
    outPacket.x = 344 + outLen * Math.min(1, outPacket.t)
    if (outPacket.t >= 1) outPacket.on = false
  }

  // 脉冲衰减
  for (let i = pulses.length - 1; i >= 0; i--) {
    const pu = pulses[i]
    pu.r += dt * 46
    pu.a -= dt * 1.1
    if (pu.a <= 0) pulses.splice(i, 1)
  }

  rafId = requestAnimationFrame(tick)
}

function start() {
  if (running || mediaReduced()) return
  running = true
  lastTs = performance.now()
  rafId = requestAnimationFrame(tick)
}

function stop() {
  running = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

function mediaReduced(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

let io: IntersectionObserver | null = null

onMounted(() => {
  const svg = svgRef.value
  if (!svg) return
  srcEls = Array.from(svg.querySelectorAll<SVGPathElement>('.jy-src-path'))
  srcLens = srcEls.map((el) => el.getTotalLength())
  outLen = 448 - 344

  if (mediaReduced()) {
    drawn.value = true
    return
  }
  // 进入视口:先描线,再放颗粒
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        if (!drawn.value) {
          drawn.value = true
          window.setTimeout(() => start(), 1100)
        } else {
          start()
        }
      } else {
        stop()
      }
    },
    { threshold: 0.25 }
  )
  io.observe(svg)
})

onUnmounted(() => {
  stop()
  io?.disconnect()
  io = null
})
</script>

<style scoped>
/* 底层实线描画入场 */
.jy-under {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: var(--pd, 0s);
}
.jy-drawn .jy-under {
  stroke-dashoffset: 0;
}
/* 行军虚线层与颗粒:描线完成后浮现 */
.jy-overlay-group,
.jy-packets {
  opacity: 0;
  transition: opacity 0.9s ease;
  transition-delay: 0.85s;
}
.jy-drawn .jy-overlay-group {
  opacity: 1;
}
.jy-drawn .jy-packets {
  opacity: 1;
}
/* 节点错落浮现 */
.jy-node {
  opacity: 0;
  transform: translateY(7px);
  transform-box: fill-box;
  transition:
    opacity 0.55s ease,
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: var(--pd, 0s);
}
.jy-drawn .jy-node {
  opacity: 1;
  transform: none;
}
/* 悬停高亮源路径 */
.jy-src-path {
  transition:
    stroke-width 0.2s ease,
    opacity 0.2s ease;
}
.jy-src-path.jy-hot {
  stroke-width: 3;
}
@media (prefers-reduced-motion: reduce) {
  .jy-under {
    stroke-dashoffset: 0;
    transition: none;
  }
  .jy-overlay-group,
  .jy-packets {
    opacity: 1;
    transition: none;
  }
  .jy-node {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
