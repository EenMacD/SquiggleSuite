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

.input-section {
  margin-bottom: 2rem;
}

.input-label {
  display: block;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.play-name-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-size: 1rem;
  transition: border-color .2s var(--ease), box-shadow .2s var(--ease), background-color .2s var(--ease);
  box-sizing: border-box;
}

.play-name-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--focus);
  background: var(--surface-2);
}

.play-name-input::placeholder {
  color: var(--muted);
}

.input-hint {
  color: var(--muted);
  font-size: 0.8rem;
  margin-top: 0.5rem;
  text-align: right;
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

.dialog-btn.cancel {
  background: transparent;
}

.dialog-btn.cancel:hover { background: var(--btn-hover-bg); border-color: var(--border-strong); }

.dialog-btn.save {
  background: var(--btn-primary-bg);
  border-color: transparent;
  color: var(--btn-primary-text);
}
.dialog-btn.save:hover:not(:disabled) { background: var(--btn-primary-hover-bg); }
.dialog-btn.save:active:not(:disabled) { background: var(--btn-primary-active-bg); }

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
