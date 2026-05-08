<template>
  <!-- Dialog Backdrop -->
  <div v-if="show" class="dialog-backdrop" @click="closeDialog"></div>

  <!-- Save Play Dialog -->
  <div v-if="show" class="dialog">
    <div class="dialog-content">
      <h3 class="dialog-title">
        Save Recorded Play
      </h3>
      
      <p class="dialog-description">
        Your play has been recorded successfully! Give it a name to save it to your collection.
      </p>
      
      <!-- Play Name Input -->
      <div class="input-section">
        <label class="input-label">Play Name</label>
        <input 
          ref="playNameInput"
          v-model="playName"
          type="text"
          placeholder="Enter a name for this play..."
          class="play-name-input"
          @keyup.enter="handleSave"
          @keyup.escape="closeDialog"
          maxlength="50"
        />
        <div class="input-hint">
          {{ playName.length }}/50 characters
        </div>
      </div>
      
      <!-- Dialog Actions -->
      <div class="dialog-actions">
        <button class="dialog-btn cancel" @click="closeDialog">
          Cancel
        </button>
        <button 
          class="dialog-btn save" 
          @click="handleSave"
          :disabled="!canSave"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Save Play
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface Emits {
  (e: 'save', playName: string): void
  (e: 'cancel'): void
}

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const playName = ref('')
const playNameInput = ref<HTMLInputElement | null>(null)

const canSave = computed(() => {
  return playName.value.trim().length > 0
})

const handleSave = () => {
  if (!canSave.value) return
  
  emit('save', playName.value.trim())
  closeDialog()
}

const closeDialog = () => {
  playName.value = ''
  emit('cancel')
}

// Focus input when dialog opens
watch(() => props.show, (newShow) => {
  if (newShow) {
    nextTick(() => {
      playNameInput.value?.focus()
    })
  }
})
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

.input-section {
  margin-bottom: 2rem;
}

.input-label {
  display: block;
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  letter-spacing: -0.01em;
}

.play-name-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(51, 65, 85, 0.4);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 1rem;
  transition: all .2s var(--ease-out);
  box-sizing: border-box;
}

.play-name-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--focus);
  background: rgba(51, 65, 85, 0.6);
}

.play-name-input::placeholder {
  color: var(--muted);
}

.input-hint {
  color: var(--muted);
  font-size: 0.8125rem;
  margin-top: 0.5rem;
  text-align: right;
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

.dialog-btn.save {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
.dialog-btn.save:hover:not(:disabled) {
  background: var(--btn-primary-hover-bg);
  border-color: var(--btn-primary-hover-bg);
}
.dialog-btn.save:active:not(:disabled) {
  background: var(--btn-primary-active-bg);
  border-color: var(--btn-primary-active-bg);
  transform: scale(0.98);
}

.dialog-btn:disabled {
  opacity: var(--btn-disabled-opacity);
  cursor: not-allowed;
}

.icon {
  width: 18px; height: 18px;
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
