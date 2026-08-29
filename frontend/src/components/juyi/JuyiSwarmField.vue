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

      <!-- 蚂蚁本体:朝 +x,原点在躯干中心。地面投影 + 渐隐尾迹 + 六足(交替三角步态) +
           四节躯体(腹/腹柄/胸/头) + 膝状触角。每条腿包一层 <g transform="translate(基节)">,
           内层 path 从 (0,0) 起笔,配 transform-box:fill-box 才能绕基节转(SVG 默认
           transform-origin 参照的是整个 viewBox,不设 fill-box 会绕画面中心甩飞) -->
      <g id="jy-ant-shape">
        <ellipse class="jy-ant-shadow" cx="-0.6" cy="7.2" rx="9.2" ry="1.8" />
        <path class="jy-ant-trail-line" d="M -9.6 0 Q -14.6 -0.6 -19.6 -0.2" />
        <!-- 六足:tripod A = 左前/右中/左后,tripod B = 右前/左中/右后,两组反相半个周期。
             角度刻意不均分 —— 前足朝前、中足侧展、后足朝后,轮廓呈前后拉长的纺锤形;
             六条腿均匀放射会立刻读成蜘蛛。
             足端距基节约 10 单位:腿短了步幅就小,步频被迫拉高,腿就糊成一团抖动 -->
        <g class="jy-ant-legs" style="stroke: var(--jy-ant-leg)" stroke-width="1" fill="none" stroke-linecap="round">
          <g transform="translate(4, -1)"><path class="jy-leg jy-leg--l jy-leg--a" d="M 0 0 L 4.6 -3.4 L 9 -4.4" /></g>
          <g transform="translate(4, 1)"><path class="jy-leg jy-leg--r jy-leg--b" d="M 0 0 L 4.6 3.4 L 9 4.4" /></g>
          <g transform="translate(0.5, -1.4)"><path class="jy-leg jy-leg--l jy-leg--b" d="M 0 0 L 1.6 -4.6 L 1.4 -9" /></g>
          <g transform="translate(0.5, 1.4)"><path class="jy-leg jy-leg--r jy-leg--a" d="M 0 0 L 1.6 4.6 L 1.4 9" /></g>
          <g transform="translate(-3.4, -1.6)"><path class="jy-leg jy-leg--l jy-leg--a" d="M 0 0 L -3.4 -4.6 L -8.6 -6.4" /></g>
          <g transform="translate(-3.4, 1.6)"><path class="jy-leg jy-leg--r jy-leg--b" d="M 0 0 L -3.4 4.6 L -8.6 6.4" /></g>
        </g>
        <!-- 躯体:随步态起伏 + 微幅左右扭动(腿在组外,自己摆) -->
        <g class="jy-ant-body">
          <ellipse cx="-6.6" cy="0" rx="5.2" ry="3.05" fill="url(#jy-ant-abd)" stroke="rgb(var(--jy-p-400) / 0.35)" stroke-width="0.5" />
          <!-- 腹柄结节:蚂蚁区别于其他昆虫的标志性一节 -->
          <ellipse cx="-2.1" cy="0" rx="1.15" ry="0.95" fill="url(#jy-ant-thx)" />
          <ellipse cx="1" cy="0" rx="3" ry="1.95" fill="url(#jy-ant-thx)" />
          <!-- 头略高于宽,接近蚂蚁的心形头 -->
          <ellipse cx="6.2" cy="0" rx="2.45" ry="2.7" fill="url(#jy-ant-head)" />
          <circle cx="7" cy="-0.95" r="0.55" fill="#ffe9c4" opacity="0.8" />
          <!-- 膝状触角:柄节外展 → 折角 → 鞭节前伸,末端棒节;整组低频扫动。
               长度刻意做到超过头+胸 —— 小尺寸下触角是「这是只蚂蚁」的第一识别特征 -->
          <g class="jy-ant-antennae" style="stroke: var(--jy-ant-leg)" fill="none" stroke-linecap="round">
            <path class="jy-ant-mandible" d="M 8.4 -1.2 L 9.9 -2.1 M 8.4 1.2 L 9.9 2.1" />
            <path class="jy-ant-antenna" d="M 7.3 -1.1 L 11.6 -3.8 Q 14 -4.6 16.2 -4.1" />
            <path class="jy-ant-antenna" d="M 7.3 1.1 L 11.6 3.8 Q 14 4.6 16.2 4.1" />
            <circle cx="16.2" cy="-4.1" r="0.55" style="fill: var(--jy-ant-leg)" stroke="none" />
            <circle cx="16.2" cy="4.1" r="0.55" style="fill: var(--jy-ant-leg)" stroke="none" />
          </g>
        </g>
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
      <!-- 驮着的数据颗粒:压在胸背上方(原来画在头前 9,-4.6 更像举着),跟着躯体一起颠。
           光晕半径必须小于蚁体:v4.1 之前是 5.6,随蚁体放大后整个上半身被罩成一团亮斑,
           虫的轮廓全糊了 —— 这是「看着抽象」的主因,不是腿的问题 -->
      <g v-if="a.grain" class="jy-ant-grain">
        <circle cx="0.2" cy="-4.8" r="3.4" fill="url(#jy-grain-glow)" />
        <circle cx="0.2" cy="-4.8" r="0.95" fill="#fff3d6" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
// 聚蚁签名动效 v4:SVG 蚁群。蚂蚁是画出来的虫(四节躯体/腹柄结节/六足/膝状触角/
// 地面投影/渐隐尾迹),多数工蚁背上驮着发光数据颗粒沿贝塞尔信息素路径归巢,入巢时
// 巢房闪光+脉冲光环。
// v4 的重点是「走」而不是「滑」:六足按交替三角步态摆动,步频由 JS 从线速度反推
// (applyGait),腿摆一轮身体正好前进一个步幅;配合躯体颠簸、朝向抖动与走停节奏。
// 性能:~15 只 × 逐帧仅写 style.transform(30fps 节流)+ 每只 9 条 CSS 动画(不受
// 节流限制,跑满帧率;元素极小,重绘面积可忽略),无全屏画布重绘、无 DPR 放大、
// 无 backdrop-filter;标签页隐藏/离屏时 rAF 与 CSS 动画一并暂停(--jy-anim);
// prefers-reduced-motion 输出静态构图。
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 蚂蚁数量基准(实际 = density/4.2,约 10-13 只;v4.1 蚁体放大后同步减量) */
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
  /** 线速度(viewBox 单位/秒)。刻意不是「每秒推进多少 t」:9 条路径长度从 ~550
   *  差到 ~1800,按 t 匀速会让短路上的蚂蚁线速度只有长路的三分之一,步频跟着塌下去
   *  就打滑了。恒定线速度既是物理真实,也让步频天然稳定 */
  linSpeed: number
  scale: number
  planeOpacity: number
  grain: boolean
  /** 步态周期(秒),= 步幅 ÷ 线速度 */
  gaitDur: number
  /** 步态相位偏移(0-1 的周期比例),避免整群同步 */
  gaitOff: number
  /** 朝向抖动 / 走停节奏各自的相位种子 */
  wobblePhase: number
  pacePhase: number
}

const VBW = 1440
const VBH = 900
const PLANES = [
  { scale: 0.82, opacity: 0.55 },
  { scale: 1.15, opacity: 0.78 },
  { scale: 1.55, opacity: 1 }
]
/** 腿摆一个完整周期,身体前进多少 viewBox 单位(scale=1 时)。
 *  与腿几何绑死:足端距基节平均约 9.9 单位、摆幅 ±28° → 行程 ≈ 2×9.9×sin28° ≈ 9.3。
 *  改腿长或摆幅就要一起改这里,否则脚会打滑。 */
const STRIDE_UNITS = 9.3
/** scale=1 时的线速度基准。步频 = STRIDE_UNITS/BASE_LIN_SPEED(与 scale 无关),
 *  这里定在 ~4.2Hz,60fps 下 14 帧一个周期。
 *  v4.1:上一版 8-11Hz 看着就是一团高频抖动,迈步要看清每周期得有十几帧。
 *  但步频压下来必须同步放大步幅(腿加长 + 摆幅 22°→28°)与蚁体 scale,
 *  否则慢步频 × 小步幅 = 线速度掉到 25 单位/秒,蚂蚁看着像钉在原地 */
const BASE_LIN_SPEED = 40
const GAIT_MIN = 0.07
const GAIT_MAX = 0.3

const svgRef = ref<SVGSVGElement | null>(null)
const ringsRef = ref<SVGGElement | null>(null)
const hiveFlash = ref(false)
const pathDs = ref<string[]>([])
const ants = ref<Ant[]>([])
const antEls: (SVGGElement | null)[] = []
const pathSpecs: PathSpec[] = []
const pathLens: number[] = []
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
  // 弧长折线近似:步频要除以线速度,而 t 是等参数推进不是等弧长,只能取全长均值
  pathLens.length = 0
  for (const s of specs) {
    let len = 0
    let prev = cubicAt(s, 0)
    for (let i = 1; i <= 32; i++) {
      const p = cubicAt(s, i / 32)
      len += Math.hypot(p.x - prev.x, p.y - prev.y)
      prev = p
    }
    pathLens.push(len)
  }
}

/** 步频锚定线速度:腿摆一轮 = 身体走一个步幅。线速度恒定,故整只蚁生命周期只需算一次 */
function applyGait(i: number) {
  const el = antEls[i]
  const a = ants.value[i]
  if (!el || !a) return
  const dur = Math.min(GAIT_MAX, Math.max(GAIT_MIN, (STRIDE_UNITS * a.scale) / a.linSpeed))
  a.gaitDur = dur
  el.style.setProperty('--jy-gait-dur', dur.toFixed(3) + 's')
  el.style.setProperty('--jy-gait-off', (-a.gaitOff * dur).toFixed(3) + 's')
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
  // 朝向抖动:真蚂蚁不会精确贴着切线走,±2.6° 的慢摆足够去掉「轨道车」感
  const wob = 2.6 * Math.sin(lastRender / 1000 * 2.3 + a.wobblePhase)
  el.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px) rotate(${(deg + wob).toFixed(1)}deg) scale(${a.scale})`
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
  const total = Math.max(7, Math.min(14, Math.round(props.density / 4.2)))
  const list: Ant[] = []
  for (let i = 0; i < total; i++) {
    const plane = i % 5 === 0 ? 2 : i % 3 === 0 ? 0 : 1
    const P = PLANES[plane]
    list.push({
      path: (i * 2 + plane) % pathSpecs.length,
      t: (i * 0.137) % 1,
      // 线速度按景深缩放(远处的小蚁看着就该慢),±15% 随机避免整群同速。
      // 步频 = 步幅/线速度,两边都含 scale 正好约掉 → 全群步频一致约 8.5Hz,
      // 也符合「同一种蚂蚁」的直觉
      linSpeed: BASE_LIN_SPEED * P.scale * (0.85 + Math.random() * 0.3),
      scale: P.scale,
      planeOpacity: P.opacity,
      grain: i % 5 !== 3, // 大多数蚂蚁都在运粮
      gaitDur: 0.12,
      gaitOff: Math.random(),
      wobblePhase: Math.random() * Math.PI * 2,
      pacePhase: Math.random() * Math.PI * 2
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
    // 走停节奏:±8% 的低频速度调制。步频是常量,幅度再大脚就会打滑;
    // 步频降到 4Hz 后每周期有十几帧,打滑比高频时更容易被看见,故比上一版收窄
    const pace = 1 + 0.08 * Math.sin((ts / 1000) * 1.5 + a.pacePhase)
    // 线速度 → 参数速度:除以当前路径弧长,短路上 t 自然推进得快
    a.t += ((a.linSpeed * pace) / (pathLens[a.path] || 1200)) * dt
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
    // 静态构图:把蚂蚁摆到散布均匀的位置(步态 CSS 已被同名媒体查询关掉)
    for (let i = 0; i < ants.value.length; i++) applyAnt(i)
    return
  }
  running = true
  // 步态是 CSS 动画,不归 rAF 管:离屏/切后台时必须显式恢复,否则 stop 后就再也不动了
  svgRef.value?.style.setProperty('--jy-anim', 'running')
  lastRender = performance.now()
  rafId = requestAnimationFrame(frame)
}

function stop() {
  running = false
  // 同理:光停 rAF 只会冻住位移,六足和触角会继续空转烧 CPU
  svgRef.value?.style.setProperty('--jy-anim', 'paused')
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

// 路径在 setup 期构建,保证模板首渲染就有内容
buildPaths()

onMounted(() => {
  buildAnts()
  // 下一帧预摆一帧,避免首帧闪现在原点;顺带把步频变量写进各自的 <g>
  requestAnimationFrame(() => {
    lastRender = performance.now()
    for (let i = 0; i < ants.value.length; i++) {
      applyGait(i)
      applyAnt(i)
    }
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
  stroke-width: 1;
  fill: none;
  stroke-linecap: round;
}
.jy-ant-mandible {
  stroke-width: 0.7;
  fill: none;
  stroke-linecap: round;
}

/* ---- 步态 ----------------------------------------------------------------
   每只蚂蚁的步频由 JS 按「路径线速度 ÷ 步幅」算出写进 --jy-gait-dur,所以腿摆一次
   身体正好前进一个步幅 —— 这是「走」而不是「滑」的全部关键。--jy-gait-off 给每只
   一个随机相位,免得整群齐步走。变量经 <g class="jy-ant"> 继承穿透 <use> 的 shadow
   tree(CSS 自定义属性是唯一能穿进去的东西,选择器进不去)。
   动画的启停也只能靠变量:animation-play-state 不可继承,故用 --jy-anim 中转。 */
.jy-leg,
.jy-ant-body,
.jy-ant-grain,
.jy-ant-antennae {
  animation-play-state: var(--jy-anim, running);
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}
.jy-leg {
  transform-box: fill-box;
  animation-duration: var(--jy-gait-dur, 0.12s);
}
/* 左右两侧腿绕基节转的方向相反,才能同时「向后蹬」;基节都在 path 起笔处 (0,0),
   对左腿是 bbox 左下角、对右腿是左上角 */
.jy-leg--l {
  transform-origin: 0 100%;
  animation-name: jy-gait-l;
}
.jy-leg--r {
  transform-origin: 0 0;
  animation-name: jy-gait-r;
}
.jy-leg--a {
  animation-delay: var(--jy-gait-off, 0s);
}
.jy-leg--b {
  animation-delay: calc(var(--jy-gait-off, 0s) - var(--jy-gait-dur, 0.12s) * 0.5);
}
/* 一个周期 = 着地推进(0→62%,腿相对身体后移)+ 抬起前摆(62→100%,略缩短模拟离地) */
@keyframes jy-gait-l {
  0% {
    transform: rotate(28deg);
  }
  62% {
    transform: rotate(-28deg) scale(1);
  }
  78% {
    transform: rotate(-9deg) scale(0.86);
  }
  100% {
    transform: rotate(28deg) scale(1);
  }
}
@keyframes jy-gait-r {
  0% {
    transform: rotate(-28deg);
  }
  62% {
    transform: rotate(28deg) scale(1);
  }
  78% {
    transform: rotate(9deg) scale(0.86);
  }
  100% {
    transform: rotate(-28deg) scale(1);
  }
}
/* 躯体:纵向颠簸走两拍(每半步一颠),左右扭动走一拍 */
.jy-ant-body,
.jy-ant-grain {
  transform-box: fill-box;
  transform-origin: 50% 50%;
  animation-name: jy-ant-bob;
  animation-duration: var(--jy-gait-dur, 0.12s);
  animation-delay: var(--jy-gait-off, 0s);
}
@keyframes jy-ant-bob {
  0% {
    transform: translateY(0.3px) rotate(1deg);
  }
  25% {
    transform: translateY(-0.3px) rotate(0deg);
  }
  50% {
    transform: translateY(0.3px) rotate(-1deg);
  }
  75% {
    transform: translateY(-0.3px) rotate(0deg);
  }
  100% {
    transform: translateY(0.3px) rotate(1deg);
  }
}
/* 触角:刻意与步频不同步(固定 0.9s),两者拍频错开才不像上了发条 */
.jy-ant-antennae {
  transform-box: fill-box;
  transform-origin: 0 50%;
  animation-name: jy-antennate;
  animation-duration: 0.9s;
  animation-delay: var(--jy-gait-off, 0s);
  animation-timing-function: ease-in-out;
}
@keyframes jy-antennate {
  0% {
    transform: rotate(-6deg);
  }
  40% {
    transform: rotate(7deg);
  }
  70% {
    transform: rotate(-2deg);
  }
  100% {
    transform: rotate(-6deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .jy-leg,
  .jy-ant-body,
  .jy-ant-grain,
  .jy-ant-antennae {
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
