import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSessionStore = defineStore('session', () => {
  // Initialize last activity from localStorage to persist across reloads/tabs
  const initialLast = typeof window !== 'undefined'
    ? (parseInt(localStorage.getItem('squiggle_lastActivity') || '', 10) || Date.now())
    : Date.now()
  const lastActivity = ref<number>(initialLast)

  // 20 minutes inactivity timeout (hybrid local + sessional)
  const SESSION_TIMEOUT = 20 * 60 * 1000 // 20 minutes

  // Simple activity update
  const updateActivity = () => {
    lastActivity.value = Date.now()
    // Persist for cross-reload and cross-tab validity
    try {
      localStorage.setItem('squiggle_lastActivity', String(lastActivity.value))
    } catch (_) {
      // ignore quota errors
    }
  }

  // Check if session is valid
  const isSessionValid = computed(() => {
    return Date.now() - lastActivity.value < SESSION_TIMEOUT
  })

  // Get remaining time
  const remainingTime = computed(() => {
    const remaining = SESSION_TIMEOUT - (Date.now() - lastActivity.value)
    return Math.max(0, Math.floor(remaining / 1000))
  })

  return {
    updateActivity,
    isSessionValid,
    remainingTime
  }
}) 
