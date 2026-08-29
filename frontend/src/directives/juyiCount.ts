// 聚蚁品牌动效:KPI 数字滚动计数(一次性入场动画)
// 约束:纯展示层,不改业务;reduced-motion 直接显示终值;离屏不动画
import type { Directive, DirectiveBinding } from 'vue'

interface CountOptions {
  /** 目标数值 */
  to?: number
  /** 前缀,如 '+' */
  prefix?: string
  /** 后缀 */
  suffix?: string
  /** 小数位 */
  decimals?: number
  /** 动画时长 ms */
  duration?: number
}

interface CountState {
  opts: CountOptions
  shown: number
  raf: number
  io: IntersectionObserver | null
  started: boolean
}

const STATES = new WeakMap<HTMLElement, CountState>()

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function format(v: number, o: CountOptions): string {
  const fixed = v.toFixed(o.decimals ?? 0)
  const [int, dec] = fixed.split('.')
  // 千分位;整数部分才分组,避免小数位被逗号截断观感
  const grouped = Number(int).toLocaleString('en-US')
  return `${o.prefix ?? ''}${grouped}${dec ? '.' + dec : ''}${o.suffix ?? ''}`
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function render(el: HTMLElement, v: number, o: CountOptions) {
  el.textContent = format(v, o)
}

function animate(el: HTMLElement, from: number, to: number, o: CountOptions) {
  const st = STATES.get(el)
  if (!st) return
  if (st.raf) cancelAnimationFrame(st.raf)
  const duration = o.duration ?? 900
  const t0 = performance.now()
  const tick = (ts: number) => {
    const p = Math.min(1, (ts - t0) / duration)
    const v = from + (to - from) * easeOutCubic(p)
    render(el, v, o)
    st.shown = v
    if (p < 1) st.raf = requestAnimationFrame(tick)
    else st.raf = 0
  }
  st.raf = requestAnimationFrame(tick)
}

function start(el: HTMLElement) {
  const st = STATES.get(el)
  if (!st || st.started) return
  st.started = true
  const to = st.opts.to ?? 0
  if (prefersReducedMotion() || !Number.isFinite(to)) {
    render(el, to, st.opts)
    st.shown = to
    return
  }
  animate(el, 0, to, st.opts)
}

export const jyCount: Directive<HTMLElement, CountOptions> = {
  mounted(el, binding: DirectiveBinding<CountOptions>) {
    const st: CountState = { opts: binding.value ?? {}, shown: 0, raf: 0, io: null, started: false }
    STATES.set(el, st)
    // 初始渲染 0,等进入视口再滚动;SSR/无 IO 环境直接开始
    render(el, 0, st.opts)
    if (typeof IntersectionObserver === 'undefined') {
      start(el)
      return
    }
    st.io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start(el)
          st.io?.disconnect()
          st.io = null
        }
      },
      { threshold: 0.4 }
    )
    st.io.observe(el)
  },
  updated(el, binding: DirectiveBinding<CountOptions>) {
    const st = STATES.get(el)
    if (!st) return
    const prev = st.opts.to ?? 0
    st.opts = binding.value ?? {}
    const to = st.opts.to ?? 0
    if (to !== prev) {
      if (prefersReducedMotion() || !st.started) {
        render(el, to, st.opts)
        st.shown = to
        if (st.started) return
      } else {
        animate(el, st.shown, to, st.opts)
      }
    }
  },
  unmounted(el) {
    const st = STATES.get(el)
    if (!st) return
    if (st.raf) cancelAnimationFrame(st.raf)
    st.io?.disconnect()
    STATES.delete(el)
  }
}
