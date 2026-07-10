/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 - 聚蚁蜜琥珀(二开换肤:原 teal 全站替换)
        primary: {
          50: '#fffaeb',
          100: '#fef1c7',
          200: '#fce192',
          300: '#facc4e',
          400: '#f7b62b',
          500: '#ed9e13',
          600: '#d17e09',
          700: '#ae5d0b',
          800: '#8d4810',
          900: '#743a11',
          950: '#422005'
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
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif'
        ],
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
        glow: '0 0 20px rgba(237, 158, 19, 0.25)',
        'glow-lg': '0 0 40px rgba(237, 158, 19, 0.35)',
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #ed9e13 0%, #d17e09 100%)',
        'gradient-dark': 'linear-gradient(135deg, #362e23 0%, #16110b 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'mesh-gradient':
          'radial-gradient(at 40% 20%, rgba(237, 158, 19, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(44, 177, 166, 0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(237, 158, 19, 0.08) 0px, transparent 50%)'
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
          '0%': { boxShadow: '0 0 20px rgba(237, 158, 19, 0.25)' },
          '100%': { boxShadow: '0 0 30px rgba(237, 158, 19, 0.4)' }
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
