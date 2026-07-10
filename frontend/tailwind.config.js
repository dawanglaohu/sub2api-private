/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - 聚蚁多主题:实际色值由 CSS 变量提供(见 src/styles/juyi.css),
        // 默认蜜琥珀,可切换信息素青/靛夜/炭玫(data-jy-theme)
        primary: {
          50: 'rgb(var(--jy-p-50) / <alpha-value>)',
          100: 'rgb(var(--jy-p-100) / <alpha-value>)',
          200: 'rgb(var(--jy-p-200) / <alpha-value>)',
          300: 'rgb(var(--jy-p-300) / <alpha-value>)',
          400: 'rgb(var(--jy-p-400) / <alpha-value>)',
          500: 'rgb(var(--jy-p-500) / <alpha-value>)',
          600: 'rgb(var(--jy-p-600) / <alpha-value>)',
          700: 'rgb(var(--jy-p-700) / <alpha-value>)',
          800: 'rgb(var(--jy-p-800) / <alpha-value>)',
          900: 'rgb(var(--jy-p-900) / <alpha-value>)',
          950: 'rgb(var(--jy-p-950) / <alpha-value>)'
        },
        // 信息素青:蚁径辅色(延续原 teal 认知)
        pheromone: {
          400: '#3ec8bc',
          500: '#2cb1a6',
          600: '#1f8f86'
        },
        // 辅助色 - 深蓝灰
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        // 深色模式背景 - 蚁巢暖黑(二开换肤:原冷蓝灰 → 暖褐黑)
        dark: {
          50: '#faf9f7',
          100: '#f1efea',
          200: '#e3dfd5',
          300: '#cdc6b6',
          400: '#aba08a',
          500: '#8c8069',
          600: '#6e6350',
          700: '#554a3a',
          800: '#362e23',
          900: '#241e16',
          950: '#16110b'
        }
      },
      fontFamily: {
        sans: 'var(--jy-font-sans)',
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: [
          'Space Grotesk',
          'system-ui',
          '-apple-system',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif'
        ]
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.06)',
        glow: '0 0 20px rgb(var(--jy-p-500) / 0.25)',
        'glow-lg': '0 0 40px rgb(var(--jy-p-500) / 0.35)',
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, rgb(var(--jy-p-500)) 0%, rgb(var(--jy-p-600)) 100%)',
        'gradient-dark': 'linear-gradient(135deg, #362e23 0%, #16110b 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient':
          'radial-gradient(at 40% 20%, rgb(var(--jy-p-500) / 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(44, 177, 166, 0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(var(--jy-p-500) / 0.08) 0px, transparent 50%)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgb(var(--jy-p-500) / 0.25)' },
          '100%': { boxShadow: '0 0 30px rgb(var(--jy-p-500) / 0.4)' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: []
}
