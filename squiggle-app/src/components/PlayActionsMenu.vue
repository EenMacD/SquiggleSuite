<template>
  <div class="play-actions-container">
    <!-- Popup Button -->
    <button
      data-cy="play-actions-trigger"
      class="popup-trigger-button"
      @click="togglePopup"
      :class="{ 'active': isPopupOpen }"
    >
      <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>
      </svg>
      <span>Play Actions</span>
      <svg class="chevron" :class="{ 'open': isPopupOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <!-- Popup Menu - Teleported to body for proper positioning -->
    <Teleport to="body">
      <Transition name="popup">
        <div v-if="isPopupOpen" class="popup-menu">
          <div class="popup-content">
            <!-- Sequence Actions -->
            <div class="action-section">
              <h3 class="section-title">Sequence Actions</h3>
              <div class="action-buttons">
                <button
                  data-cy="run-current-sequence-btn"
                  @click="handleAction('run-current-sequence')"
                  class="action-btn"
                  :disabled="!currentSequenceData || currentSequenceData.activePlayerIds.length === 0"
                >
                  <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                  <span>Run Sequence</span>
                </button>

                <button
                  @click="handleAction('reset-current-sequence')"
                  class="action-btn secondary"
                >
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  </svg>
                  <span>Reset Sequence</span>
                </button>
              </div>
            </div>

          <!-- Divider -->
          <div class="section-divider"></div>

            <!-- Phase Actions -->
            <div class="action-section">
              <h3 class="section-title">Phase Actions</h3>
            <div class="action-buttons">
              <button
                @click="handleAction('run-current-phase')"
                class="action-btn primary"
                :disabled="!hasAnySequencesInCurrentPhase || isRunningCurrentPhase"
              >
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"></path>
                </svg>
                <span>{{ isRunningCurrentPhase ? 'Running Phase...' : 'Run Current Phase' }}</span>
              </button>

              <button
                data-cy="run-full-play-btn"
                v-if="hasMultiplePhases"
                @click="handleAction('run-full-play')"
                class="action-btn primary"
                :disabled="isRunningCurrentPhase || isRunningFullPlay"
              >
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 5v14l7-7z"></path>
                  <path d="M12 5v14l7-7z"></path>
                </svg>
                <span>{{ isRunningFullPlay ? 'Running Full Play...' : 'Run Full Play' }}</span>
              </button>
            </div>
          </div>

          <!-- Divider -->
          <div class="section-divider"></div>

          <!-- Recording -->
          <div class="action-section">
            <h3 class="section-title">Recording</h3>
            <div class="action-buttons">
              <button
                @click="handleAction('record-full-play')"
                class="action-btn record"
                :disabled="isRecording || isRunningCurrentPhase || isRunningFullPlay"
              >
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8"></circle>
                </svg>
                <span>{{ isRecording ? 'Recording...' : 'Record Full Play' }}</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      </Transition>

      <!-- Backdrop -->
      <Transition name="backdrop">
        <div
          v-if="isPopupOpen"
          class="popup-backdrop"
          @click="closePopup"
        ></div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Sequence } from '../types/game'

interface Props {
  isRecording: boolean
  isRunningCurrentPhase: boolean
  isRunningFullPlay: boolean
  hasAnySequencesInCurrentPhase: boolean
  hasMultiplePhases: boolean
  currentSequenceData: Sequence | null
  availableSequences: Sequence[]
  currentSequence: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'run-current-phase'): void
  (e: 'run-full-play'): void
  (e: 'run-current-sequence', sequenceId: number): void
  (e: 'reset-current-sequence'): void
  (e: 'record-full-play'): void
  (e: 'show-tutorial'): void
}>()

const isPopupOpen = ref(false)

const togglePopup = () => {
  isPopupOpen.value = !isPopupOpen.value
}

const closePopup = () => {
  isPopupOpen.value = false
}

const handleAction = (action: string) => {
  switch (action) {
    case 'run-current-phase':
      emit('run-current-phase')
      break
    case 'run-full-play':
      emit('run-full-play')
      break
    case 'run-current-sequence':
      if (props.currentSequence) {
        emit('run-current-sequence', props.currentSequence)
      }
      break
    case 'reset-current-sequence':
      emit('reset-current-sequence')
      break
    case 'record-full-play':
      emit('record-full-play')
      break
    case 'show-tutorial':
      emit('show-tutorial')
      break
  }
  closePopup()
}
</script>

<style scoped>
.play-actions-container {
  position: relative;
  width: 100%;
}

/* Popup Trigger Button - Match saved play button styling */
.popup-trigger-button {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.7rem 1.1rem;
  margin-bottom: 0.5rem;
  min-height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg,
    rgba(45, 60, 82, 0.4) 0%,
    rgba(25, 35, 50, 0.6) 50%,
    rgba(18, 26, 40, 0.7) 100%);
  backdrop-filter: blur(10px);
  color: var(--btn-text);
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: .02em;
  transition: all .35s var(--ease);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15),
              0 1px 3px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.05),
              inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}

.popup-trigger-button::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(96, 165, 250, 0.06) 0%,
    rgba(139, 92, 246, 0.03) 50%,
    rgba(59, 130, 246, 0.04) 100%);
  opacity: 0;
  transition: opacity .35s var(--ease);
  pointer-events: none;
}

.popup-trigger-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px var(--focus),
              0 2px 12px rgba(45, 127, 249, 0.2),
              0 1px 3px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.05),
              inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}

.popup-trigger-button::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(96, 165, 250, 0.04) 40%,
    transparent 70%);
  opacity: 0;
  border-radius: inherit;
  transform: scale(0);
  transition: transform .35s var(--ease), opacity .35s var(--ease);
}

.popup-trigger-button:active::after {
  opacity: 1;
  transform: scale(1);
}

.popup-trigger-button:hover {
  background: linear-gradient(135deg,
    rgba(52, 71, 103, 0.6) 0%,
    rgba(32, 45, 65, 0.75) 50%,
    rgba(22, 32, 50, 0.85) 100%);
  border-color: rgba(96, 165, 250, 0.2);
  box-shadow: 0 5px 18px rgba(0, 0, 0, 0.25),
              0 2px 6px rgba(0, 0, 0, 0.35),
              0 0 25px rgba(96, 165, 250, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.25);
}

.popup-trigger-button:hover::before {
  opacity: 0.5;
}

.popup-trigger-button.active {
  background: linear-gradient(135deg,
    rgba(52, 71, 103, 0.6) 0%,
    rgba(32, 45, 65, 0.75) 50%,
    rgba(22, 32, 50, 0.85) 100%);
  border-color: rgba(96, 165, 250, 0.2);
}

.popup-trigger-button.active::before {
  opacity: 0.5;
}

.popup-trigger-button .icon {
  flex-shrink: 0;
}

.popup-trigger-button .chevron {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.popup-trigger-button .chevron.open {
  transform: rotate(180deg);
}

/* Popup Menu - Elegant centered modal */
.popup-menu {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  max-width: min(90vw, 520px);
  max-height: 85vh;
  background: linear-gradient(180deg, rgba(17, 24, 39, 0.98) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow:
    0 32px 96px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  z-index: 10000;
  overflow: hidden;
  backdrop-filter: blur(32px);
}

.popup-content {
  padding: 2rem;
  max-height: 85vh;
  overflow-y: auto;
}

/* Action Sections */
.action-section {
  margin-bottom: 1.75rem;
}

.action-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

/* Action Buttons - Premium Design */
.action-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 1rem 1.5rem;
  min-height: 56px;
  border-radius: 14px;
  border: 1.5px solid transparent;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: 0.01em;
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.action-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 127, 249, 0.4);
}

.action-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity .25s ease;
}

.action-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.action-btn:active:not(:disabled) {
  transform: translateY(0);
  transition-duration: .1s;
}

.action-btn.primary {
  background: linear-gradient(135deg, #2D7FF9 0%, #1F6FE6 100%);
  color: #fff;
  border-color: transparent;
  box-shadow:
    0 2px 8px rgba(45, 127, 249, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.action-btn.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #3D8FFF 0%, #2D7FF9 100%);
  box-shadow:
    0 6px 16px rgba(45, 127, 249, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

.action-btn.record {
  background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
  border-color: transparent;
  color: #fff;
  box-shadow:
    0 2px 8px rgba(220, 38, 38, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.action-btn.record:hover:not(:disabled) {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  box-shadow:
    0 6px 16px rgba(220, 38, 38, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.action-btn .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.action-btn span {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.12) 50%, transparent 100%);
  margin: 1.5rem 0;
}

/* Backdrop */
.popup-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  backdrop-filter: blur(8px);
}

/* Transitions */
.popup-enter-active,
.popup-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.popup-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

.popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .popup-menu {
    min-width: 90vw;
  }
}
</style>
