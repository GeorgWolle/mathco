import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'mathco-theme'

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
const isLight = ref(stored === 'light')

watchEffect(() => {
  const html = document.documentElement
  if (isLight.value) {
    html.classList.add('light-theme')
  } else {
    html.classList.remove('light-theme')
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, isLight.value ? 'light' : 'dark')
  }
})

export function useTheme() {
  const toggle = () => { isLight.value = !isLight.value }
  return { isLight, toggle }
}
