/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'Arial', 'sans-serif'],
        body:    ['Arial', 'Helvetica', 'sans-serif'],
        sans:    ['Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        brand: {
          bg:       '#080A0E',
          surface:  '#0F1117',
          surface2: '#161922',
          surface3: '#1C2030',
          lime:     '#7ABF8E',   // sage green (replaced neon #C8F135)
          income:   '#5AB5A5',   // muted teal (replaced neon #00E5B0)
          expense:  '#E09090',   // soft coral (replaced #FF4D6D)
          text:     '#E8ECF4',
          muted:    '#6B7280',
          dim:      '#9CA3AF',
          border:   '#1F2535',
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':    'fadeIn 0.3s ease both',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { textShadow: '0 0 12px rgba(122, 191, 142, 0.2)' },
          '50%':      { textShadow: '0 0 24px rgba(122, 191, 142, 0.38)' },
        },
      },
      boxShadow: {
        'card':    '0 4px 32px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.3)',
        'lime':    '0 0 32px rgba(122, 191, 142, 0.15)',
        'lime-lg': '0 0 48px rgba(122, 191, 142, 0.28)',
        'income':  '0 0 24px rgba(90, 181, 165, 0.18)',
        'expense': '0 0 24px rgba(224, 144, 144, 0.18)',
      },
      animationDelay: {
        100: '100ms',
        200: '200ms',
        300: '300ms',
        400: '400ms',
        500: '500ms',
      },
    },
  },
  plugins: [],
}
