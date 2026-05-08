<template>
  <div v-if="showWarning" class="session-warning">
    ⚠️ Session expires in {{ formatTime(remainingTime) }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSessionStore } from '../stores/sessionStore'

const sessionStore = useSessionStore()

const remainingTime = computed(() => sessionStore.remainingTime)
const showWarning = computed(() => remainingTime.value <= 120 && remainingTime.value > 0)

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.session-warning {
  position: fixed;
  top: calc(var(--appbar-h) + 16px);
  right: 20px;
  background: rgba(251, 191, 36, 0.95);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  color: #78350F;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(217, 119, 6, 0.3);
  font-size: 0.875rem;
  z-index: 1000;
  box-shadow: var(--shadow-lg), 0 0 24px rgba(251, 191, 36, 0.3);
  font-weight: 600;
  letter-spacing: -0.01em;
  animation: slideDown 0.3s var(--ease-out);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 