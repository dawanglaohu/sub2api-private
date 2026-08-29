// 聚蚁品牌动效:滚动浮现兵装
// 只对带 [data-jy-reveal] 的元素生效;JS 兵装后才隐藏(无 JS / reduced-motion 不隐藏,永不丢内容)
import { nextTick, onMounted, onUnmounted, type Ref } from 'vue'

export function useJuyiReveal(rootRef?: Ref<HTMLElement | null>) {
  let io: IntersectionObserver | null = null

  const reduced = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const arm = async () => {
    await nextTick()
    const root = rootRef?.value ?? document.body
    if (!root || reduced() || typeof IntersectionObserver === 'undefined') return
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-jy-reveal]'))
    if (!els.length) return
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('jy-in')
            io?.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
    )
    for (const el of els) {
      const delay = Number(el.dataset.jyRevealDelay ?? 0)
      if (delay > 0) el.style.transitionDelay = `${delay}ms`
      el.classList.add('jy-reveal')
      io.observe(el)
    }
  }

  onMounted(arm)
  onUnmounted(() => {
    io?.disconnect()
    io = null
  })
}
