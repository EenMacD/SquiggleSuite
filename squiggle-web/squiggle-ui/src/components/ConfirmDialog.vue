<template>
  <!-- Dialog Backdrop -->
  <div v-if="show" class="dialog-backdrop" @click="handleCancel"></div>

  <!-- Confirm Dialog -->
  <div v-if="show" class="dialog" data-cy="confirm-dialog">
    <div class="dialog-content">
      <h3 class="dialog-title">
        {{ title }}
      </h3>
      
      <p class="dialog-description">
        {{ message }}
      </p>
      
      <!-- Dialog Actions -->
      <div class="dialog-actions">
        <button class="dialog-btn cancel" @click="handleCancel">
          Cancel
        </button>
        <button 
          data-cy="confirm-btn"
          class="dialog-btn confirm" 
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

interface Props {
  show: boolean
  title: string
  message: string
  confirmText?: string
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: 'Confirm'
})

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px) saturate(180%);
  -webkit-backdrop-filter: blur(8px) saturate(180%);
  z-index: 2999;
  animation: fadeIn 0.2s ease-out;
}

.dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-content {
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: var(--radius);
  padding: 2rem;
  min-width: 400px;
  max-width: 500px;
  box-shadow: var(--shadow-xl);
  color: var(--text);
}

.dialog-title {
  color: var(--text);
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.dialog-description {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0 0 1.75rem 0;
  text-align: center;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
}

.dialog-btn {
  flex: 1;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-xs);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: -0.006em;
  cursor: pointer;
  transition: all .15s var(--ease-out);
  border: 1px solid rgba(71, 85, 105, 0.3);
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.dialog-btn.cancel:hover {
  background: rgba(71, 85, 105, 0.3);
  border-color: rgba(100, 116, 139, 0.4);
  color: var(--text);
}

.dialog-btn.cancel:active {
  background: rgba(71, 85, 105, 0.4);
  transform: scale(0.98);
}

.dialog-btn.confirm {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
.dialog-btn.confirm:hover:not(:disabled) {
  background: var(--btn-primary-hover-bg);
  border-color: var(--btn-primary-hover-bg);
}
.dialog-btn.confirm:active:not(:disabled) {
  background: var(--btn-primary-active-bg);
  border-color: var(--btn-primary-active-bg);
  transform: scale(0.98);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -48%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
</style> 
