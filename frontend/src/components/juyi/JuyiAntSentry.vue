<template>
  <div
    ref="rootRef"
    class="jy-sentry"
    :class="[`jy-sentry--${side}`, `is-${mode}`, { 'is-typing': typing }]"
    aria-hidden="true"
  >
    <svg viewBox="0 0 130 196" fill="none">
      <!-- 地面投影:留在呼吸组外,身体起伏时影子不该跟着飘 -->
      <ellipse class="jy-s-shadow" cx="65" cy="186" rx="34" ry="5" />

      <g class="jy-s-body">
        <!-- 后足:站立的两条,膝盖外折。放在呼吸组内,否则胸口起伏时腿会和身体脱节 -->
        <g class="jy-s-legs" :stroke="STROKE" stroke-width="4.2" stroke-linecap="round" fill="none">
          <path d="M54 116 L40 146 L34 180" />
          <path d="M76 116 L90 146 L96 180" />
        </g>
        <!-- 腹部:水滴形,直立时垂在后下方 -->
        <ellipse
          cx="65" cy="140" rx="27" ry="23"
          :fill="abdId" :stroke="STROKE" stroke-width="2.6"
        />
        <!-- 腹柄结节 -->
        <ellipse cx="65" cy="118" rx="6.5" ry="5" :fill="thxId" :stroke="STROKE" stroke-width="2.2" />
        <!-- 胸 -->
        <ellipse cx="65" cy="101" rx="19" ry="16" :fill="thxId" :stroke="STROKE" stroke-width="2.6" />

        <!-- 中足:一侧叉腰,一侧握矛 -->
        <g :stroke="STROKE" stroke-width="3.6" stroke-linecap="round" fill="none">
          <path d="M48 100 L34 112 L40 124" />
          <path d="M82 100 L104 108" />
        </g>

        <!-- 信息素长矛:握在中足手里,待机轻晃,敬礼时举起。
             杆要够粗够外 —— 细杆贴着身体时读不出「卫兵」,只像根线 -->
        <g class="jy-s-spear">
          <line x1="105" y1="152" x2="105" y2="26" :stroke="STROKE" stroke-width="5.4" stroke-linecap="round" />
          <path
            d="M105 4 L115 26 L105 36 L95 26 Z"
            fill="rgb(var(--jy-p-500))" :stroke="STROKE" stroke-width="2.8" stroke-linejoin="round"
          />
          <circle class="jy-s-spear-glow" cx="105" cy="22" r="3.6" fill="#fff3d6" />
        </g>

        <!-- 头(含头盔/触角/眼),看向输入框时整组轻转 -->
        <g class="jy-s-head">
          <!-- 触角:膝状,末端棒节,待机扫动 -->
          <g class="jy-s-antennae" :stroke="STROKE" stroke-width="3.4" stroke-linecap="round" fill="none">
            <path d="M50 34 L38 16 L28 12" />
            <path d="M80 34 L92 16 L102 12" />
          </g>
          <circle class="jy-s-ant-tip" cx="28" cy="12" r="4" :fill="STROKE" />
          <circle class="jy-s-ant-tip" cx="102" cy="12" r="4" :fill="STROKE" />

          <!-- 头 -->
          <ellipse cx="65" cy="60" rx="32" ry="30" :fill="headId" :stroke="STROKE" stroke-width="2.8" />

          <!-- 六角蜂蜡头盔 + 帽檐 -->
          <path
            d="M65 26 L92 40 L92 54 L65 64 L38 54 L38 40 Z"
            fill="rgb(var(--jy-p-500))" :stroke="STROKE" stroke-width="2.6" stroke-linejoin="round"
          />
          <path d="M36 54 L94 54" :stroke="STROKE" stroke-width="3.4" stroke-linecap="round" />
          <path class="jy-s-helm-shine" d="M52 34 L60 30" stroke="#fff3d6" stroke-width="2.6" stroke-linecap="round" />

          <!-- 眼:大卵形,瞳孔跟随指针,眼睑随机眨 -->
          <g class="jy-s-eyes">
            <ellipse cx="52" cy="68" rx="9.5" ry="11" fill="#fff8ea" :stroke="STROKE" stroke-width="2.2" />
            <ellipse cx="78" cy="68" rx="9.5" ry="11" fill="#fff8ea" :stroke="STROKE" stroke-width="2.2" />
            <g class="jy-s-pupils">
              <circle cx="52" cy="68" r="4.6" fill="#2f1e0a" />
              <circle cx="78" cy="68" r="4.6" fill="#2f1e0a" />
              <circle cx="53.6" cy="66" r="1.6" fill="#fff8ea" />
              <circle cx="79.6" cy="66" r="1.6" fill="#fff8ea" />
            </g>
            <!-- 眼睑:自上而下盖,scaleY 驱动 -->
            <g class="jy-s-lids">
              <ellipse cx="52" cy="68" rx="10.6" ry="11.6" :fill="headId" />
              <ellipse cx="78" cy="68" rx="10.6" ry="11.6" :fill="headId" />
            </g>
          </g>

          <!-- 大颚 -->
          <path
            d="M57 86 L53 92 M73 86 L77 92"
            :stroke="STROKE" stroke-width="2.8" stroke-linecap="round"
          />
        </g>

        <!-- 前足=手,画在最上层:捂眼时要盖住眼睛 -->
        <g class="jy-s-arm jy-s-arm--l" :stroke="STROKE" stroke-width="4" stroke-linecap="round" fill="none">
          <path d="M50 88 L40 104 L38 118" />
          <circle class="jy-s-hand" cx="38" cy="120" r="9.5" :fill="HAND" :stroke="STROKE" stroke-width="2.4" />
        </g>
        <g class="jy-s-arm jy-s-arm--r" :stroke="STROKE" stroke-width="4" stroke-linecap="round" fill="none">
          <path d="M80 88 L90 104 L92 118" />
          <circle class="jy-s-hand" cx="92" cy="120" r="9.5" :fill="HAND" :stroke="STROKE" stroke-width="2.4" />
        </g>
      </g>

      <defs>
        <radialGradient :id="`jy-s-abd-${uid}`" cx="0.35" cy="0.3" r="1">
          <stop offset="0" style="stop-color: var(--jy-ant-a1)" />
          <stop offset="0.6" style="stop-color: var(--jy-ant-a2)" />
          <stop offset="1" style="stop-color: var(--jy-ant-a3)" />
        </radialGradient>
        <radialGradient :id="`jy-s-thx-${uid}`" cx="0.4" cy="0.3" r="1">
          <stop offset="0" style="stop-color: var(--jy-ant-t1)" />
          <stop offset="1" style="stop-color: var(--jy-ant-t2)" />
        </radialGradient>
        <radialGradient :id="`jy-s-head-${uid}`" cx="0.4" cy="0.35" r="1">
          <stop offset="0" style="stop-color: var(--jy-ant-h1)" />
          <stop offset="1" style="stop-color: var(--jy-ant-h2)" />
        </radialGradient>
      </defs>
    </svg>
  </div>
</template>

<script setup lang="ts">
// 聚蚁蚁巢哨兵:登录卡两侧各一只,守着巢门。
// 与 JuyiSwarmField 的蚁群同族(同一套 --jy-ant-* 变量、四节躯体+腹柄+膝状触角),
// 但这只是拟人直立的角色版 —— 前足当手用,才够得到眼睛。
//
// 零侵入:所有交互靠 document 级事件委托嗅探,不改 LoginView/RegisterView
// (两个上游文件共 1800 行,按项目铁律只做小而准的插入,这里干脆一行不碰)。
// 状态机:idle → watch(看输入框) → cover(捂眼) → peek(偷看) → salute(敬礼)。
import { computed, onMounted, onUnmounted, ref } from 'vue'

withDefaults(defineProps<{ side?: 'left' | 'right' }>(), { side: 'left' })

type Mode = 'idle' | 'watch' | 'cover' | 'peek' | 'salute'
const mode = ref<Mode>('idle')
const typing = ref(false)

// 同一页两只哨兵,渐变 id 必须各自唯一,否则第二只引用到第一只的 defs
const uid = Math.random().toString(36).slice(2, 8)
const STROKE = 'var(--jy-ant-stroke)'
const HAND = 'var(--jy-ant-t1)'

const rootRef = ref<HTMLElement | null>(null)
let typingTimer: number | undefined
let saluteTimer: number | undefined
let mo: MutationObserver | null = null
let watchedPwd: HTMLInputElement | null = null
let reduced = false

function isTextField(el: EventTarget | null): el is HTMLInputElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
}

/** 密码框是否处于遮蔽态 —— 用户点了「显示密码」后 type 会变成 text,这时该偷看 */
function modeForField(el: HTMLInputElement | HTMLTextAreaElement): Mode {
  if (el instanceof HTMLInputElement && (el.type === 'password' || watchedPwd === el)) {
    return el.type === 'password' ? 'cover' : 'peek'
  }
  return 'watch'
}

function onFocusIn(e: FocusEvent) {
  const el = e.target
  if (!isTextField(el)) return
  // 记住这个密码框,好在它 type 变化时切 cover/peek
  if (el instanceof HTMLInputElement && el.type === 'password') {
    watchedPwd = el
    mo?.disconnect()
    mo = new MutationObserver(() => {
      if (mode.value === 'cover' || mode.value === 'peek') {
        mode.value = el.type === 'password' ? 'cover' : 'peek'
      }
    })
    mo.observe(el, { attributes: true, attributeFilter: ['type'] })
  }
  mode.value = modeForField(el)
}

function onFocusOut(e: FocusEvent) {
  if (!isTextField(e.target)) return
  // 焦点在表单内部跳转时不要抖回 idle 再进下一个状态
  window.setTimeout(() => {
    const a = document.activeElement
    if (!isTextField(a)) {
      mode.value = 'idle'
      watchedPwd = null
      mo?.disconnect()
      mo = null
    }
  }, 0)
}

function onInput(e: Event) {
  if (!isTextField(e.target)) return
  typing.value = true
  if (typingTimer) window.clearTimeout(typingTimer)
  typingTimer = window.setTimeout(() => (typing.value = false), 420)
}

function onSubmit() {
  mode.value = 'salute'
  if (saluteTimer) window.clearTimeout(saluteTimer)
  saluteTimer = window.setTimeout(() => {
    if (mode.value === 'salute') mode.value = 'idle'
  }, 1400)
}

/** 瞳孔跟随指针:只在精确指针下生效,触屏没有「鼠标在哪」这回事 */
function onPointerMove(e: PointerEvent) {
  const el = rootRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height * 0.34 // 头部大致高度
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  const d = Math.hypot(dx, dy) || 1
  const k = Math.min(1, d / 420) * 3.4 // 最多偏 3.4 个用户单位
  el.style.setProperty('--jy-px', ((dx / d) * k).toFixed(2))
  el.style.setProperty('--jy-py', ((dy / d) * k).toFixed(2))
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.addEventListener('focusin', onFocusIn)
  document.addEventListener('focusout', onFocusOut)
  document.addEventListener('input', onInput)
  document.addEventListener('submit', onSubmit, true)
  if (
    !reduced &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  ) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
  }
})

onUnmounted(() => {
  document.removeEventListener('focusin', onFocusIn)
  document.removeEventListener('focusout', onFocusOut)
  document.removeEventListener('input', onInput)
  document.removeEventListener('submit', onSubmit, true)
  window.removeEventListener('pointermove', onPointerMove)
  if (typingTimer) window.clearTimeout(typingTimer)
  if (saluteTimer) window.clearTimeout(saluteTimer)
  mo?.disconnect()
})

// 模板里 fill 要拿到带 uid 的真实 id
const abdId = computed(() => `url(#jy-s-abd-${uid})`)
const thxId = computed(() => `url(#jy-s-thx-${uid})`)
const headId = computed(() => `url(#jy-s-head-${uid})`)
</script>

<style scoped>
/* finesse · component: ant-sentry · register=brand
 * states: idle · watch · cover · peek · typing · salute · reduced-motion
 * tokens: inherited (--jy-ant-*, --jy-p-*) */
.jy-sentry {
  --jy-px: 0;
  --jy-py: 0;
  width: 138px;
  flex: none;
  user-select: none;
}
@media (min-width: 1100px) {
  .jy-sentry {
    width: 162px;
  }
}
.jy-sentry svg {
  width: 100%;
  height: auto;
  overflow: visible;
}
/* 右侧那只镜像面朝卡片,两只对望着守门 */
.jy-sentry--right svg {
  transform: scaleX(-1);
}
.jy-s-shadow {
  fill: var(--jy-ant-shadow);
}

/* ---- 待机:呼吸 + 触角扫动 + 眨眼 + 矛微晃 ----------------------------- */
.jy-s-body {
  transform-box: view-box;
  transform-origin: 65px 180px;
  animation: jy-s-breathe 3.4s ease-in-out infinite;
}
@keyframes jy-s-breathe {
  0%,
  100% {
    transform: translateY(0) scaleY(1);
  }
  50% {
    transform: translateY(-2.5px) scaleY(1.012);
  }
}
.jy-s-antennae,
.jy-s-ant-tip {
  transform-box: view-box;
  transform-origin: 65px 40px;
  animation: jy-s-antennae 2.9s ease-in-out infinite;
}
@keyframes jy-s-antennae {
  0%,
  100% {
    transform: rotate(-3.5deg);
  }
  50% {
    transform: rotate(3.5deg);
  }
}
/* 打字时触角改成快抖 —— 键敲得越勤它越警觉 */
.is-typing .jy-s-antennae,
.is-typing .jy-s-ant-tip {
  animation-duration: 0.42s;
}
.jy-s-spear {
  transform-box: view-box;
  transform-origin: 105px 152px;
  animation: jy-s-spear 4.6s ease-in-out infinite;
  transition: transform 0.4s cubic-bezier(0.34, 1.4, 0.5, 1);
}
@keyframes jy-s-spear {
  0%,
  100% {
    transform: rotate(-1.6deg);
  }
  50% {
    transform: rotate(1.6deg);
  }
}
.jy-s-lids {
  transform-box: view-box;
  transform-origin: 65px 57px;
  transform: scaleY(0);
  animation: jy-s-blink 6.2s infinite;
}
@keyframes jy-s-blink {
  0%,
  92%,
  100% {
    transform: scaleY(0);
  }
  95%,
  97% {
    transform: scaleY(1);
  }
}
/* 两只哨兵不要同手同脚 —— 右侧那只所有周期动画都错开相位 */
.jy-sentry--right .jy-s-body,
.jy-sentry--right .jy-s-antennae,
.jy-sentry--right .jy-s-ant-tip,
.jy-sentry--right .jy-s-spear,
.jy-sentry--right .jy-s-lids {
  animation-delay: -1.7s;
}
.jy-s-helm-shine {
  opacity: 0.75;
}

/* ---- 看输入框:头低下去转过来,瞳孔跟着移 ------------------------------ */
.jy-s-head {
  transform-box: view-box;
  transform-origin: 65px 92px;
  transition: transform 0.38s cubic-bezier(0.34, 1.25, 0.5, 1);
}
.is-watch .jy-s-head {
  transform: rotate(7deg) translateY(3px);
}
.is-cover .jy-s-head,
.is-peek .jy-s-head {
  transform: rotate(-2deg) translateY(2px);
}

.jy-s-pupils {
  transform: translate(calc(var(--jy-px) * 1px), calc(var(--jy-py) * 1px));
  transition: transform 0.18s ease-out;
}
/* 看输入框时视线固定往下,压过指针跟随 */
.is-watch .jy-s-pupils {
  transform: translate(calc(var(--jy-px) * 0.4px), 3.4px);
}

/* ---- 捂眼 / 偷看:两只前足抬到眼前 ------------------------------------- */
.jy-s-arm {
  transform-box: view-box;
  transition: transform 0.34s cubic-bezier(0.34, 1.3, 0.5, 1);
}
/* 手掌待机时收着,捂眼时摊开 —— 一个尺寸兼顾不了两头:
   够大到盖住眼睛(ry=11),垂在身侧就成了拳击手套 */
.jy-s-hand {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.34s cubic-bezier(0.34, 1.3, 0.5, 1);
}
.is-cover .jy-s-hand,
.is-peek .jy-s-hand {
  transform: scale(1.3);
}
.jy-s-arm--l {
  transform-origin: 50px 88px;
}
.jy-s-arm--r {
  transform-origin: 80px 88px;
}
.is-cover .jy-s-arm--l {
  transform: rotate(-146deg) translate(2px, 0);
}
.is-cover .jy-s-arm--r {
  transform: rotate(146deg) translate(-2px, 0);
}
/* 偷看:右手松开一条缝,露出一只眼 —— 左手仍然捂着 */
.is-peek .jy-s-arm--l {
  transform: rotate(-146deg) translate(2px, 0);
}
.is-peek .jy-s-arm--r {
  transform: rotate(112deg) translate(-4px, 2px);
}
/* 捂眼时触角害羞地垂下来 */
.is-cover .jy-s-antennae,
.is-cover .jy-s-ant-tip,
.is-peek .jy-s-antennae,
.is-peek .jy-s-ant-tip {
  animation: none;
  transform: rotate(0deg) translateY(7px) scaleY(0.82);
  transition: transform 0.34s ease;
}

/* ---- 敬礼:矛竖直,头盔一闪 -------------------------------------------- */
.is-salute .jy-s-spear {
  animation: none;
  transform: rotate(-14deg) translateY(-8px);
}
.is-salute .jy-s-helm-shine {
  animation: jy-s-shine 0.7s ease-out;
}
@keyframes jy-s-shine {
  0% {
    opacity: 0.75;
    stroke-width: 2.6;
  }
  40% {
    opacity: 1;
    stroke-width: 5;
  }
  100% {
    opacity: 0.75;
    stroke-width: 2.6;
  }
}
.is-salute .jy-s-head {
  transform: translateY(-3px);
}

/* ---- 降级:全部定格在站姿,眼睛睁着 ------------------------------------ */
@media (prefers-reduced-motion: reduce) {
  .jy-s-body,
  .jy-s-antennae,
  .jy-s-ant-tip,
  .jy-s-spear,
  .jy-s-lids,
  .jy-s-helm-shine {
    animation: none;
  }
  .jy-s-lids {
    transform: scaleY(0);
  }
  .jy-s-head,
  .jy-s-arm,
  .jy-s-hand,
  .jy-s-pupils,
  .jy-s-spear {
    transition: none;
  }
}
</style>
