<template>
  <svg
    ref="svgRef"
    class="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <!-- 躯体立体着色:亮色暖褐虫 / 暗色琥珀背光虫(变量在 juyi.css,随主题切换) -->
      <radialGradient id="jy-ant-abd" cx="0.35" cy="0.3" r="1">
        <stop offset="0" style="stop-color: var(--jy-ant-a1)" />
        <stop offset="0.55" style="stop-color: var(--jy-ant-a2)" />
        <stop offset="1" style="stop-color: var(--jy-ant-a3)" />
      </radialGradient>
      <radialGradient id="jy-ant-thx" cx="0.4" cy="0.3" r="1">
        <stop offset="0" style="stop-color: var(--jy-ant-t1)" />
        <stop offset="1" style="stop-color: var(--jy-ant-t2)" />
      </radialGradient>
      <radialGradient id="jy-ant-head" cx="0.4" cy="0.35" r="1">
        <stop offset="0" style="stop-color: var(--jy-ant-h1)" />
        <stop offset="1" style="stop-color: var(--jy-ant-h2)" />
      </radialGradient>
      <!-- 驮着的发光数据颗粒:跟随主题主色 -->
      <radialGradient id="jy-grain-glow">
        <stop offset="0" stop-color="#FFF6DC" stop-opacity="0.95" />
        <stop offset="0.35" stop-color="rgb(var(--jy-p-400))" stop-opacity="0.85" />
        <stop offset="1" stop-color="rgb(var(--jy-p-500))" stop-opacity="0" />
      </radialGradient>
      <!-- 尾迹:从身体向后渐隐 -->
      <linearGradient id="jy-ant-trail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="rgb(var(--jy-p-500))" stop-opacity="0" />
        <stop offset="1" stop-color="rgb(var(--jy-p-500))" stop-opacity="0.5" />
      </linearGradient>

      <!-- 蚂蚁本体:朝 +x,原点在躯干中心;地面投影+渐隐尾迹+六足+三节躯体+触角(伪 3D) -->
      <g id="jy-ant-shape">
        <ellipse class="jy-ant-shadow" cx="0" cy="6.6" rx="8.5" ry="1.7" />
        <path class="jy-ant-trail-line" d="M -9 0 Q -14 -0.6 -19 -0.2" />
        <g class="jy-ant-legs" style="stroke: var(--jy-ant-leg)" stroke-width="1.1" fill="none" stroke-linecap="round">
          <path d="M 4 -1 L 7.2 -4.6 L 9.8 -5.4" />
          <path d="M 4 1 L 7.2 4.6 L 9.8 5.4" />
          <path d="M 0.5 -1.4 L 1.4 -5 L 3.6 -6.2" />
          <path d="M 0.5 1.4 L 1.4 5 L 3.6 6.2" />
          <path d="M -3.4 -1.6 L -4.6 -4.8 L -3.2 -6.6" />
          <path d="M -3.4 1.6 L -4.6 4.8 L -3.2 6.6" />
        </g>
        <path class="jy-ant-antenna" style="stroke: var(--jy-ant-leg)" d="M 7.4 -1.1 C 9 -2.4 10 -2.9 11.4 -3.2 M 7.4 1.1 C 9 2.4 10 2.9 11.4 3.2" />
        <ellipse cx="-5.6" cy="0" rx="5.1" ry="3.3" fill="url(#jy-ant-abd)" stroke="rgb(var(--jy-p-400) / 0.35)" stroke-width="0.5" />
        <ellipse cx="0.6" cy="0" rx="2.9" ry="2.1" fill="url(#jy-ant-thx)" />
        <circle cx="6" cy="0" r="2.5" fill="url(#jy-ant-head)" />
        <circle cx="6.8" cy="-0.9" r="0.55" fill="#ffe9c4" opacity="0.8" />
      </g>
    </defs>

    <!-- 信息素路径:虚线缓行,纯 CSS -->
    <g class="jy-swarm-paths" fill="none">
      <path
        v-for="(p, i) in pathDs"
        :key="'pp' + i"
        :d="p"
        stroke="rgb(var(--jy-p-500) / 0.16)"
        stroke-width="1.1"
        stroke-dasharray="2.5 9"
        class="ant-path"
        :style="{ animationDelay: -0.4 * i + 's' }"
      />
    </g>

    <!-- 巢房(可选):呼吸 + 入巢闪光 -->
    <g v-if="showHex" class="jy-swarm-hive" :class="{ 'jy-hive-flash': hiveFlash }">
      <circle :cx="hivePX" :cy="hivePY" r="52" fill="rgb(var(--jy-p-500) / 0.07)" class="ant-glow" />
      <path
        :d="hexPath(hivePX, hivePY, 46)"
        fill="none"
        stroke="rgb(var(--jy-p-500) / 0.4)"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <path :d="hexPath(hivePX, hivePY, 28)" fill="none" stroke="rgb(var(--jy-p-500) / 0.25)" stroke-width="1.1" />
    </g>

    <!-- 脉冲光环(JS 按 WAAPI 生成,自清理;样式在全局块) -->
    <g ref="ringsRef"></g>

    <!-- 蚁群:挂载后 rAF 只写 transform,Vue 不参与逐帧渲染 -->
    <g
      v-for="(a, i) in ants"
      :key="'ant' + i"
      :ref="(el) => setAntEl(el, i)"
      class="jy-ant"
      :opacity="a.planeOpacity"
    >
      <use href="#jy-ant-shape" />
      <g v-if="a.grain">
        <circle cx="9" cy="-4.6" r="5.6" fill="url(#jy-grain-glow)" />
        <circle cx="9" cy="-4.6" r="1.5" fill="#fff3d6" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
// 聚蚁签名动效 v3:SVG 蚁群。蚂蚁是画出来的虫(三节躯体/六足/触角/地面投影/渐隐尾迹),
// 大尺寸三景深,多数工蚁驮着发光数据颗粒沿贝塞尔信息素路径归巢,入巢时巢房闪光+脉冲光环。
// 性能:~15 只 × 逐帧仅写 style.transform(30fps 节流),无全屏画布重绘、无 DPR 放大、
// 无 backdrop-filter;标签页隐藏/离屏自动暂停;prefers-reduced-motion 输出静态构图。
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 蚂蚁数量基准(实际 = density/3.2,约 12-17 只) */
    density?: number
    /** 是否绘制巢房六边形 */
    showHex?: boolean
    /** 整体不透明度系数 0-1 */
    intensity?: number
    /** 巢房位置(viewBox 比例) */
    hiveX?: number
    hiveY?: number
  }>(),
  { density: 46, showHex: true, intensity: 1, hiveX: 0.5, hiveY: 0.46 }
)

interface Ant {
  path: number
  t: number
  speed: number
  scale: number
  planeOpacity: number
  grain: boolean
}

const VBW = 1440
const VBH = 900
const PLANES = [
  { scale: 0.62, opacity: 0.55, speed: 0.72 },
  { scale: 0.92, opacity: 0.78, speed: 1 },
  { scale: 1.28, opacity: 1, speed: 1.32 }
]

const svgRef = ref<SVGSVGElement | null>(null)
const ringsRef = ref<SVGGElement | null>(null)
const hiveFlash = ref(false)
const pathDs = ref<string[]>([])
const ants = ref<Ant[]>([])
const antEls: (SVGGElement | null)[] = []
const pathSpecs: PathSpec[] = []
let rafId = 0
let running = false
let lastRender = 0
let io: IntersectionObserver | null = null
let visHandler: (() => void) | null = null
let flashTimer: number | undefined

const hivePX = Math.round(VBW * props.hiveX)
const hivePY = Math.round(VBH * props.hiveY)

function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return 'M' + pts.join('L') + 'Z'
}

interface PathSpec {
  x0: number; y0: number; cx1: number; cy1: number; cx2: number; cy2: number; x1: number; y1: number
}

function buildPaths() {
  const hx = hivePX
  const hy = hivePY
  const specs: PathSpec[] = [
    // 归巢五条:从画面外缘弯向巢房
    { x0: -60, y0: VBH * 0.16, cx1: VBW * 0.24, cy1: VBH * 0.1, cx2: hx - 260, cy2: hy - 140, x1: hx, y1: hy },
    { x0: VBW * 0.1, y0: VBH + 60, cx1: VBW * 0.16, cy1: VBH * 0.72, cx2: hx - 200, cy2: hy + 150, x1: hx, y1: hy },
    { x0: VBW + 60, y0: VBH * 0.2, cx1: VBW * 0.8, cy1: VBH * 0.14, cx2: hx + 200, cy2: hy - 130, x1: hx, y1: hy },
    { x0: VBW * 0.92, y0: VBH + 60, cx1: VBW * 0.86, cy1: VBH * 0.7, cx2: hx + 180, cy2: hy + 150, x1: hx, y1: hy },
    { x0: -60, y0: VBH * 0.66, cx1: VBW * 0.2, cy1: VBH * 0.58, cx2: hx - 240, cy2: hy + 90, x1: hx, y1: hy },
    // 横穿四条:氛围
    { x0: -60, y0: VBH * 0.32, cx1: VBW * 0.3, cy1: VBH * 0.2, cx2: VBW * 0.7, cy2: VBH * 0.44, x1: VBW + 60, y1: VBH * 0.4 },
    { x0: -60, y0: VBH * 0.82, cx1: VBW * 0.35, cy1: VBH * 0.94, cx2: VBW * 0.66, cy2: VBH * 0.66, x1: VBW + 60, y1: VBH * 0.78 },
    { x0: VBW + 60, y0: VBH * 0.56, cx1: VBW * 0.7, cy1: VBH * 0.46, cx2: VBW * 0.3, cy2: VBH * 0.62, x1: -60, y1: VBH * 0.52 },
    { x0: VBW * 0.4, y0: -60, cx1: VBW * 0.5, cy1: VBH * 0.18, cx2: VBW * 0.6, cy2: VBH * 0.3, x1: VBW * 0.66, y1: VBH + 60 }
  ]
  pathSpecs.length = 0
  pathDs.value = specs.map(
    (s) => `M ${s.x0} ${s.y0} C ${s.cx1} ${s.cy1}, ${s.cx2} ${s.cy2}, ${s.x1} ${s.y1}`
  )
  pathSpecs.push(...specs)
}

function setAntEl(el: unknown, i: number) {
  antEls[i] = el as SVGGElement | null
}

function cubicAt(s: PathSpec, t: number): { x: number; y: number } {
  const u = 1 - t
  const x = u * u * u * s.x0 + 3 * u * u * t * s.cx1 + 3 * u * t * t * s.cx2 + t * t * t * s.x1
  const y = u * u * u * s.y0 + 3 * u * u * t * s.cy1 + 3 * u * t * t * s.cy2 + t * t * t * s.y1
  return { x, y }
}

function cubicTangent(s: PathSpec, t: number): number {
  const e = 0.01
  const a = cubicAt(s, Math.max(0, t - e))
  const b = cubicAt(s, Math.min(1, t + e))
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

function applyAnt(i: number) {
  const el = antEls[i]
  const a = ants.value[i]
  if (!el || !a) return
  const s = pathSpecs[a.path]
  if (!s) return
  const pos = cubicAt(s, a.t)
  const deg = cubicTangent(s, a.t)
  el.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) rotate(${deg.toFixed(1)}deg) scale(${a.scale})`
}

function spawnRing() {
  const g = ringsRef.value
  if (!g) return
  const NS = 'http://www.w3.org/2000/svg'
  const c = document.createElementNS(NS, 'circle')
  c.setAttribute('cx', String(hivePX))
  c.setAttribute('cy', String(hivePY))
  c.setAttribute('r', '14')
  c.setAttribute('class', 'jy-ring')
  g.appendChild(c)
  const anim = c.animate(
    [
      { transform: 'scale(0.25)', opacity: 0.65 },
      { transform: 'scale(2.1)', opacity: 0 }
    ],
    { duration: 950, easing: 'cubic-bezier(0.2, 0.6, 0.35, 1)' }
  )
  anim.onfinish = () => c.remove()
}

function deliver() {
  spawnRing()
  hiveFlash.value = true
  if (flashTimer) window.clearTimeout(flashTimer)
  flashTimer = window.setTimeout(() => (hiveFlash.value = false), 480)
}

function buildAnts() {
  const total = Math.max(8, Math.min(18, Math.round(props.density / 3.2)))
  const list: Ant[] = []
  for (let i = 0; i < total; i++) {
    const plane = i % 5 === 0 ? 2 : i % 3 === 0 ? 0 : 1
    const P = PLANES[plane]
    list.push({
      path: (i * 2 + plane) % pathSpecs.length,
      t: (i * 0.137) % 1,
      // v3.1:之前 0.016/s 一条路要走 60 秒,肉眼等于静止;提到 0.05-0.09/s(11-20s 走完),并加随机抖动避免同步感
      speed: (0.05 + Math.random() * 0.04) * P.speed,
      scale: P.scale,
      planeOpacity: P.opacity,
      grain: i % 5 !== 3 // 大多数蚂蚁都在运粮
    })
  }
  ants.value = list
}

function frame(ts: number) {
  if (!running) return
  rafId = requestAnimationFrame(frame)
  if (ts - lastRender < 33) return // 30fps 节流:氛围动效足够顺滑,功耗减半
  const dt = Math.min(0.05, (ts - lastRender) / 1000 || 0.033)
  lastRender = ts
  for (let i = 0; i < ants.value.length; i++) {
    const a = ants.value[i]
    a.t += a.speed * dt
    if (a.t >= 1) {
      const spec = pathSpecs[a.path]
      if (spec && spec.x1 === hivePX && spec.y1 === hivePY && a.grain) deliver()
      a.t = 0
      a.path = (a.path + 1 + Math.floor(Math.random() * 3)) % pathSpecs.length
    }
    applyAnt(i)
  }
}

function start() {
  if (running) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // 静态构图:把蚂蚁摆到散布均匀的位置
    for (let i = 0; i < ants.value.length; i++) applyAnt(i)
    return
  }
  running = true
  lastRender = performance.now()
  rafId = requestAnimationFrame(frame)
}

function stop() {
  running = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

// 路径在 setup 期构建,保证模板首渲染就有内容
buildPaths()

onMounted(() => {
  buildAnts()
  // 下一帧预摆一帧,避免首帧闪现在原点
  requestAnimationFrame(() => {
    for (let i = 0; i < ants.value.length; i++) applyAnt(i)
  })
  start()

  visHandler = () => {
    if (document.hidden) stop()
    else start()
  }
  document.addEventListener('visibilitychange', visHandler)

  const svg = svgRef.value
  if (svg && typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          if (!document.hidden) start()
        } else stop()
      },
      { threshold: 0.02 }
    )
    io.observe(svg)
  }
})

onUnmounted(() => {
  stop()
  if (visHandler) document.removeEventListener('visibilitychange', visHandler)
  io?.disconnect()
  io = null
  if (flashTimer) window.clearTimeout(flashTimer)
})
</script>

<!-- 蚁体投影/尾迹/触角在 <use> shadow DOM 内、脉冲环由 JS 动态创建,均拿不到 scoped 标记,统一走全局块(jy- 前缀防撞) -->
<style>
.jy-ant-shadow {
  fill: var(--jy-ant-shadow);
}
.jy-ant-trail-line {
  stroke: url(#jy-ant-trail);
  stroke-width: 1.8;
  stroke-linecap: round;
  fill: none;
}
.jy-ant-antenna {
  stroke-width: 0.9;
  fill: none;
  stroke-linecap: round;
}
/* 爬行颠籸:身体轻微起伏,让虫「活」起来(共用 def,全群同相位,幅度极小) */
.jy-ant-body {
  animation: jy-ant-bob 0.55s ease-in-out infinite alternate;
}
@keyframes jy-ant-bob {
  from {
    transform: translateY(0.35px);
  }
  to {
    transform: translateY(-0.35px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .jy-ant-body {
    animation: none;
  }
}
.jy-ring {
  fill: none;
  stroke: rgb(var(--jy-p-500) / 0.8);
  stroke-width: 1.6;
  transform-box: fill-box;
  transform-origin: center;
}
</style>

<style scoped>
.jy-ant {
  will-change: transform;
}
.jy-swarm-hive path {
  transition:
    stroke 0.35s ease,
    stroke-width 0.35s ease;
}
.jy-hive-flash path {
  stroke: rgb(var(--jy-p-400) / 0.9);
  stroke-width: 2.6;
}
@media (prefers-reduced-motion: reduce) {
  .ant-path,
  .ant-glow {
    animation: none;
  }
}
</style>
