import { ref, watchEffect } from 'vue'

const STORAGE_KEY = 'mathco-theme'

// Light theme ist fest als Standard gesetzt (Toggle im UI entfernt)
const isLight = ref(true)

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
