// 聚蚁外观系统:多主题主色 + 字体切换,localStorage 持久化。
// 模块级单例状态,菜单组件与启动初始化共享。
import { ref } from 'vue'

export type JuyiTheme = 'honey' | 'pheromone' | 'nightfall' | 'ember'
export type JuyiFont = 'default' | 'serif' | 'mono'

export const JUYI_THEMES: { key: JuyiTheme; swatch: string }[] = [
  { key: 'honey', swatch: '#ed9e13' },
  { key: 'pheromone', swatch: '#14b8a6' },
  { key: 'nightfall', swatch: '#6366f1' },
  { key: 'ember', swatch: '#f43f5e' }
]

export const JUYI_FONTS: JuyiFont[] = ['default', 'serif', 'mono']

const THEME_KEY = 'jy-theme'
const FONT_KEY = 'jy-font'

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback
  } catch {
    return fallback
  }
}

const theme = ref<JuyiTheme>(readStored(THEME_KEY, ['honey', 'pheromone', 'nightfall', 'ember'], 'honey'))
const font = ref<JuyiFont>(readStored(FONT_KEY, JUYI_FONTS, 'default'))

function applyToDocument() {
  const el = document.documentElement
  if (theme.value === 'honey') delete el.dataset.jyTheme
  else el.dataset.jyTheme = theme.value
  if (font.value === 'default') delete el.dataset.jyFont
  else el.dataset.jyFont = font.value
}

export function useJuyiAppearance() {
  function setTheme(next: JuyiTheme) {
    theme.value = next
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* 忽略隐私模式写入失败 */
    }
    applyToDocument()
  }

  function setFont(next: JuyiFont) {
    font.value = next
    try {
      localStorage.setItem(FONT_KEY, next)
    } catch {
      /* 忽略隐私模式写入失败 */
    }
    applyToDocument()
  }

  return { theme, font, setTheme, setFont }
}

/** 应用启动时调用一次(main.ts),在挂载前套用持久化的外观,避免闪烁 */
export function initJuyiAppearance() {
  applyToDocument()
}
