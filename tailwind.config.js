/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'main': '#F97E55',
        'sub' : '#ff6c6f',
        'marker' : '#F55F61',
        'review-key' : '#FFC0C1',
        'login-bg' : '#ffb593',
        'search-bg' : '#ffd9c8',
        'text' : '#E7673C'
      },
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "sans-serif"]
      }
    }
  },
  plugins: [],
}

