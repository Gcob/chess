import { ref, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

const theme = ref<Theme>('light')

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
}

function toggle() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

function init() {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null

  if (stored === 'light' || stored === 'dark') {
    theme.value = stored
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme.value = 'dark'
  }

  applyTheme(theme.value)
}

watch(theme, (t) => {
  localStorage.setItem(STORAGE_KEY, t)
  applyTheme(t)
})

export function useTheme() {
  onMounted(() => {
    init()
  })

  return {
    theme,
    toggle,
  }
}
