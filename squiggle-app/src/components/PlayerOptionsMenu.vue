<template>
  <div class="player-options-container">
    <!-- Popup Button -->
    <button
      data-cy="player-options-trigger"
      class="popup-trigger-button"
      @click="togglePopup"
      :class="{ 'active': isPopupOpen, 'disabled': !selectedPlayer }"
      :disabled="!selectedPlayer"
    >
      <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6M1 12h6m6 0h6"></path>
      </svg>
      <span>{{ selectedPlayer ? `Player ${selectedPlayer.id}` : 'Player Options' }}</span>
      <svg class="chevron" :class="{ 'open': isPopupOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <!-- Popup Menu - Teleported to body for proper positioning -->
    <Teleport to="body">
      <Transition name="popup">
        <div v-if="isPopupOpen && selectedPlayer" class="popup-menu" data-cy="player-options-menu">
          <div class="popup-content">
            <h3 class="menu-title">Player {{ selectedPlayer.id }} Options</h3>

          <!-- Mode Selection -->
          <div class="option-section">
            <h4 class="section-title">Mode</h4>
            <div class="mode-buttons">
              <button
                @click="handleSetPlayerMode('drag')"
                class="mode-btn"
                :class="{ 'active': selectedPlayer.mode === 'drag' }"
              >
                <svg class="icon" viewBox="0 0 24 24">
                  <path d="M12 3l3 3m-3-3l-3 3M12 3v6M12 21l3-3m-3 3l-3-3M12 15v6M3 12l3-3m-3 3l3 3M9 12H3M21 12l-3-3m3 3l-3 3M15 12h6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
                <span>Drag Player</span>
              </button>

              <button
                data-cy="path-mode-btn"
                @click="handleSetPlayerMode('path')"
                class="mode-btn"
                :class="{ 'active': selectedPlayer.mode === 'path' }"
              >
                <svg class="icon" viewBox="0 0 24 24">
                  <path d="M4 20c4-8 12-8 16-16" stroke="currentColor" stroke-linecap="round" fill="none"/>
                  <path d="M14 4h6v6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
                <span>Draw Path</span>
              </button>
            </div>
          </div>

          <!-- Path Visibility -->
          <div class="option-section">
            <button
              @click="handleTogglePathVisibility"
              class="option-btn"
            >
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              <span>{{ selectedPlayer.pathVisible !== false ? 'Hide Path' : 'Show Path' }}</span>
            </button>
          </div>

          <!-- Timed Pass -->
          <div class="option-section">
            <button
              data-cy="timed-pass-btn"
              @click="handleSetTimedPass"
              class="option-btn"
              :class="{ 'active': selectedPlayer.timedPass }"
              :disabled="!selectedPlayer.path || selectedPlayer.path.length === 0"
            >
              <svg class="icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
              </svg>
              <span>{{ selectedPlayer.timedPass ? 'Edit Timed Pass' : 'Set Timed Pass' }}</span>
            </button>
          </div>

          <div class="option-section" v-if="selectedPlayer.timedPass">
            <button
              @click="handleClearTimedPass"
              class="option-btn danger"
            >
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
              </svg>
              <span>Clear Timed Pass</span>
            </button>
          </div>

          <div class="section-divider"></div>

          <!-- Speed Control -->
          <div class="option-section">
            <h4 class="section-title">Speed: {{ selectedPlayer.speed }}%</h4>
            <input
              type="range"
              min="25"
              max="200"
              step="25"
              :value="selectedPlayer.speed"
              @input="handleUpdatePlayerSpeed"
              class="speed-slider"
            >
            <div class="speed-marks">
              <span>25%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
          </div>

          <!-- Delay Control -->
          <div class="option-section">
            <h4 class="section-title">Delay: {{ selectedPlayer.sequenceDelay || 0 }}ms</h4>
            <div class="delay-buttons">
              <button @click="handleAdjustPlayerDelay(10)" class="delay-btn">+10ms</button>
              <button @click="handleAdjustPlayerDelay(50)" class="delay-btn">+50ms</button>
              <button @click="handleAdjustPlayerDelay(100)" class="delay-btn">+100ms</button>
              <button @click="handleResetPlayerDelay" class="delay-btn reset">Reset</button>
            </div>
          </div>

          <div class="section-divider"></div>

          <!-- Clear Path -->
          <div class="option-section">
            <button
              @click="handleClearPlayerPath"
              class="option-btn danger"
              :disabled="!selectedPlayer.path || selectedPlayer.path.length === 0"
            >
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M9 3h6M4 7h16M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
              <span>Clear Path</span>
            </button>
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
import type { Player } from '../types/game'

interface Props {
  selectedPlayer: Player | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'set-player-mode', mode: 'drag' | 'path'): void
  (e: 'toggle-path-visibility'): void
  (e: 'update-player-speed', speed: number): void
  (e: 'adjust-player-delay', amount: number): void
  (e: 'reset-player-delay'): void
  (e: 'clear-player-path'): void
  (e: 'set-timed-pass'): void
  (e: 'clear-timed-pass'): void
}>()

const isPopupOpen = ref(false)

const togglePopup = () => {
  if (props.selectedPlayer) {
    isPopupOpen.value = !isPopupOpen.value
  }
}

const openPopup = () => {
  if (props.selectedPlayer) {
    isPopupOpen.value = true
  }
}

const closePopup = () => {
  isPopupOpen.value = false
}

// Expose openPopup method to parent component
defineExpose({
  openPopup
})

const handleSetPlayerMode = (mode: 'drag' | 'path') => {
  emit('set-player-mode', mode)
  closePopup()
}

const handleTogglePathVisibility = () => {
  emit('toggle-path-visibility')
}

const handleUpdatePlayerSpeed = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update-player-speed', parseInt(target.value))
}

const handleAdjustPlayerDelay = (amount: number) => {
  emit('adjust-player-delay', amount)
}

const handleResetPlayerDelay = () => {
  emit('reset-player-delay')
}

const handleClearPlayerPath = () => {
  emit('clear-player-path')
  closePopup()
}

const handleSetTimedPass = () => {
  emit('set-timed-pass')
  closePopup()
}

const handleClearTimedPass = () => {
  emit('clear-timed-pass')
}
</script>

<style scoped>
.player-options-container {
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

.popup-trigger-button.disabled {
  opacity: var(--btn-disabled-opacity);
  cursor: not-allowed;
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

.popup-trigger-button:hover:not(.disabled) {
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

.popup-trigger-button:hover:not(.disabled)::before {
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

.menu-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1.75rem;
  text-align: center;
  letter-spacing: -0.01em;
}

/* Option Sections */
.option-section {
  margin-bottom: 1.5rem;
}

.option-section:last-child {
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

/* Mode Buttons - Premium Design */
.mode-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.mode-btn {
  -webkit-font-smoothing: antialiased;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 1.125rem 1rem;
  border-radius: 12px;
  border: 1.5px solid transparent;
  background: rgba(255, 255, 255, 0.04);
  color: var(--btn-text);
  font-weight: 500;
  font-size: 0.875rem;
  letter-spacing: 0.01em;
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.mode-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 127, 249, 0.4);
}

.mode-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity .25s ease;
}

.mode-btn:hover::before {
  opacity: 1;
}

.mode-btn:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.mode-btn.active {
  background: linear-gradient(135deg, #2D7FF9 0%, #1F6FE6 100%);
  color: #fff;
  border-color: transparent;
  box-shadow:
    0 2px 8px rgba(45, 127, 249, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.mode-btn.active:hover {
  background: linear-gradient(135deg, #3D8FFF 0%, #2D7FF9 100%);
  box-shadow:
    0 6px 16px rgba(45, 127, 249, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.mode-btn .icon {
  width: 26px;
  height: 26px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* Option Button - Premium Design */
.option-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  min-height: 52px;
  border-radius: 12px;
  border: 1.5px solid transparent;
  background: rgba(255, 255, 255, 0.04);
  color: var(--btn-text);
  font-weight: 500;
  font-size: 0.9375rem;
  letter-spacing: 0.01em;
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.option-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 127, 249, 0.4);
}

.option-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity .25s ease;
}

.option-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.option-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.option-btn.danger {
  background: rgba(220, 53, 69, 0.12);
  border-color: rgba(220, 53, 69, 0.2);
}

.option-btn.danger:hover:not(:disabled) {
  background: rgba(220, 53, 69, 0.18);
  border-color: rgba(220, 53, 69, 0.35);
  box-shadow:
    0 4px 12px rgba(220, 53, 69, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.option-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.option-btn .icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* Speed Control */
.speed-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  transition: background .2s ease;
}

.speed-slider:hover {
  background: rgba(255, 255, 255, 0.12);
}

.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3D8FFF 0%, #2D7FF9 100%);
  cursor: pointer;
  box-shadow:
    0 2px 8px rgba(45, 127, 249, 0.4),
    0 0 0 3px rgba(45, 127, 249, 0.15);
  transition: all .2s ease;
}

.speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow:
    0 4px 12px rgba(45, 127, 249, 0.5),
    0 0 0 4px rgba(45, 127, 249, 0.2);
}

.speed-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3D8FFF 0%, #2D7FF9 100%);
  border: none;
  cursor: pointer;
  box-shadow:
    0 2px 8px rgba(45, 127, 249, 0.4),
    0 0 0 3px rgba(45, 127, 249, 0.15);
  transition: all .2s ease;
}

.speed-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow:
    0 4px 12px rgba(45, 127, 249, 0.5),
    0 0 0 4px rgba(45, 127, 249, 0.2);
}

.speed-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

/* Delay Buttons - Premium Design */
.delay-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.625rem;
}

.delay-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 0.5rem;
  min-height: 44px;
  border-radius: 10px;
  border: 1.5px solid transparent;
  background: rgba(255, 255, 255, 0.04);
  color: var(--btn-text);
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: .01em;
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.delay-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 127, 249, 0.4);
}

.delay-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity .25s ease;
}

.delay-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.delay-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.delay-btn:active:not(:disabled) {
  transform: translateY(0);
  transition-duration: .1s;
}

.delay-btn.reset {
  color: #fff;
  background: rgba(220, 38, 38, 0.12);
  border-color: rgba(220, 38, 38, 0.2);
}

.delay-btn.reset::before {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, transparent 50%);
}

.delay-btn.reset:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.18);
  border-color: rgba(220, 38, 38, 0.35);
  box-shadow:
    0 4px 12px rgba(220, 38, 38, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
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

  .mode-buttons {
    grid-template-columns: 1fr;
  }

  .delay-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
