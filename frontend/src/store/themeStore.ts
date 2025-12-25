import { create } from 'zustand'

interface ThemeState {
  isDarkMode: boolean
  toggleDarkMode: () => void
  setDarkMode: (value: boolean) => void
}

export const useThemeStore = create<ThemeState>((set) => {
  // Initialize from localStorage or system preference
  const stored = localStorage.getItem('darkMode')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const initial = stored ? stored === 'true' : prefersDark

  // Apply to document
  if (initial) {
    document.documentElement.classList.add('dark')
  }

  return {
    isDarkMode: initial,
    toggleDarkMode: () =>
      set((state) => {
        const newValue = !state.isDarkMode
        localStorage.setItem('darkMode', String(newValue))
        if (newValue) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
        return { isDarkMode: newValue }
      }),
    setDarkMode: (value) => {
      localStorage.setItem('darkMode', String(value))
      if (value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      set({ isDarkMode: value })
    },
  }
})
