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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
  min-width: 400px;
  max-width: 500px;
  box-shadow: var(--shadow-2);
  color: var(--text);
}

.dialog-title {
  color: var(--text);
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 0.75rem 0;
  text-align: center;
}

.dialog-description {
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.4;
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.dialog-actions {
  display: flex;
  gap: 1rem;
}

.dialog-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color .2s var(--ease), border-color .2s var(--ease), box-shadow .2s var(--ease), color .2s var(--ease);
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.dialog-btn.cancel { background: transparent; }
.dialog-btn.cancel:hover { background: var(--btn-hover-bg); border-color: var(--border-strong); }

.dialog-btn.confirm {
  background: var(--btn-primary-bg);
  border-color: transparent;
  color: var(--btn-primary-text);
}
.dialog-btn.confirm:hover:not(:disabled) { background: var(--btn-primary-hover-bg); }
.dialog-btn.confirm:active:not(:disabled) { background: var(--btn-primary-active-bg); }

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
