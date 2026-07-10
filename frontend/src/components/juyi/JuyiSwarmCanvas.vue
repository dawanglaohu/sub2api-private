<template>
  <canvas ref="canvasRef" class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
// 聚蚁签名动效:蚁群粒子沿隐形"信息素路径"结队行进,中央巢房六边形轻呼吸。
// 克制原则:低密度、低透明度、纯氛围;标签页隐藏自动暂停;
// prefers-reduced-motion 时只渲染一帧静态画面。颜色跟随当前主题主色(CSS 变量)。
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 蚂蚁数量基准(实际按画布面积缩放) */
    density?: number
    /** 是否绘制中央呼吸六边形 */
    showHex?: boolean
    /** 整体不透明度系数 0-1 */
    intensity?: number
  }>(),
  { density: 46, showHex: true, intensity: 1 }
)

interface PathDef {
  x0: number; y0: number; x1: number; y1: number
  x2: number; y2: number; x3: number; y3: number
}
interface Ant {
  path: number
  t: number
  speed: number
  size: number
  teal: boolean
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let running = false
let W = 0
let H = 0
let dpr = 1
let paths: PathDef[] = []
let ants: Ant[] = []
let lastTs = 0
let dashOffset = 0

// 主色(琥珀)与辅色(信息素青),初始值为默认主题,运行时从 CSS 变量刷新
let rgbPrimary = '237, 158, 19'
let rgbTeal = '44, 177, 166'
let isDark = document.documentElement.classList.contains('dark')

let themeObserver: MutationObserver | null = null
let mediaReduced: MediaQueryList | null = null
let resizeHandler: (() => void) | null = null
let visHandler: (() => void) | null = null

function refreshThemeColors() {
  isDark = document.documentElement.classList.contains('dark')
  const style = getComputedStyle(document.documentElement)
  const p = style.getPropertyValue('--jy-p-500').trim()
  if (p) rgbPrimary = p.split(/\s+/).join(', ')
}

function bezier(p: PathDef, t: number): { x: number; y: number } {
  const u = 1 - t
  const x = u * u * u * p.x0 + 3 * u * u * t * p.x1 + 3 * u * t * t * p.x2 + t * t * t * p.x3
  const y = u * u * u * p.y0 + 3 * u * u * t * p.y1 + 3 * u * t * t * p.y2 + t * t * t * p.y3
  return { x, y }
}

function buildScene() {
  const count = Math.max(3, Math.round(4 * Math.min(1.6, (W * H) / (1280 * 800))))
  paths = []
  for (let i = 0; i < count; i++) {
    // 路径从左/下边缘流向右/上,轻微弧度,像蚁道
    const fromLeft = Math.random() > 0.35
    const y0 = H * (0.15 + Math.random() * 0.7)
    const y3 = H * (0.15 + Math.random() * 0.7)
    paths.push({
      x0: fromLeft ? -30 : W * Math.random() * 0.25,
      y0,
      x1: W * (0.25 + Math.random() * 0.2),
      y1: y0 + (Math.random() - 0.5) * H * 0.5,
      x2: W * (0.55 + Math.random() * 0.2),
      y2: y3 + (Math.random() - 0.5) * H * 0.5,
      x3: W + 30,
      y3
    })
  }
  const antTotal = Math.round(props.density * Math.min(1.5, (W * H) / (1280 * 800)))
  ants = []
  for (let i = 0; i < antTotal; i++) {
    ants.push({
      path: i % paths.length,
      t: Math.random(),
      speed: 0.012 + Math.random() * 0.02,
      size: 1.1 + Math.random() * 1.2,
      teal: Math.random() < 0.18
    })
  }
}

function drawFrame(dt: number) {
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)
  const alphaBase = (isDark ? 1 : 0.75) * props.intensity

  // 信息素路径:极淡虚线,缓慢流动
  dashOffset -= dt * 6
  ctx.save()
  ctx.setLineDash([2, 7])
  ctx.lineDashOffset = dashOffset
  ctx.lineWidth = 1
  ctx.strokeStyle = `rgba(${rgbPrimary}, ${0.07 * alphaBase})`
  for (const p of paths) {
    ctx.beginPath()
    ctx.moveTo(p.x0, p.y0)
    ctx.bezierCurveTo(p.x1, p.y1, p.x2, p.y2, p.x3, p.y3)
    ctx.stroke()
  }
  ctx.restore()

  // 中央巢房六边形:呼吸
  if (props.showHex) {
    const cx = W * 0.5
    const cy = H * 0.42
    const r = Math.min(W, H) * 0.22
    const breath = 0.05 + 0.035 * (0.5 + 0.5 * Math.sin(lastTs / 2400))
    ctx.save()
    ctx.strokeStyle = `rgba(${rgbPrimary}, ${breath * alphaBase})`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i * Math.PI) / 3
      const x = cx + r * Math.cos(a)
      const y = cy + r * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }

  // 蚁群
  for (const ant of ants) {
    ant.t += ant.speed * dt
    if (ant.t > 1) {
      ant.t = 0
      ant.path = Math.floor(Math.random() * paths.length)
    }
    const p = paths[ant.path]
    const pos = bezier(p, ant.t)
    const tail = bezier(p, Math.max(0, ant.t - 0.012))
    const rgb = ant.teal ? rgbTeal : rgbPrimary
    // 淡尾迹
    ctx.strokeStyle = `rgba(${rgb}, ${0.18 * alphaBase})`
    ctx.lineWidth = ant.size * 0.9
    ctx.beginPath()
    ctx.moveTo(tail.x, tail.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    // 身体
    ctx.fillStyle = `rgba(${rgb}, ${0.5 * alphaBase})`
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, ant.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function loop(ts: number) {
  if (!running) return
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016)
  lastTs = ts
  drawFrame(dt)
  rafId = requestAnimationFrame(loop)
}

function start() {
  if (running || !ctx) return
  if (mediaReduced?.matches) {
    // 降级:静态一帧
    lastTs = performance.now()
    drawFrame(0)
    return
  }
  running = true
  lastTs = performance.now()
  rafId = requestAnimationFrame(loop)
}

function stop() {
  running = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

function resize() {
  const canvas = canvasRef.value
  if (!canvas || !canvas.parentElement) return
  const rect = canvas.parentElement.getBoundingClientRect()
  dpr = Math.min(2, window.devicePixelRatio || 1)
  W = Math.max(1, Math.round(rect.width))
  H = Math.max(1, Math.round(rect.height))
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  buildScene()
  if (!running) drawFrame(0)
}

onMounted(() => {
  refreshThemeColors()
  resize()

  resizeHandler = () => resize()
  window.addEventListener('resize', resizeHandler)

  visHandler = () => {
    if (document.hidden) stop()
    else start()
  }
  document.addEventListener('visibilitychange', visHandler)

  themeObserver = new MutationObserver(() => refreshThemeColors())
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-jy-theme']
  })

  mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  start()
})

onUnmounted(() => {
  stop()
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  if (visHandler) document.removeEventListener('visibilitychange', visHandler)
  themeObserver?.disconnect()
  themeObserver = null
})
</script>
