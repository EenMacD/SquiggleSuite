<template>
  <div class="sequence-popup-container">
    <!-- Popup Button -->
    <button
      data-cy="sequence-manager-trigger"
      class="popup-trigger-button"
      @click="togglePopup"
      :class="{ 'active': isPopupOpen }"
    >
      <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
      </svg>
      <span>Sequence Manager</span>
      <svg class="chevron" :class="{ 'open': isPopupOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <!-- Popup Menu - Teleported to body for proper positioning -->
    <Teleport to="body">
      <Transition name="popup">
        <div v-if="isPopupOpen" class="popup-menu">
          <div class="popup-content">
            <!-- Phase Section -->
            <div class="popup-section phase-section">
              <h3 class="section-title">Phases</h3>
            <div class="section-content">
              <PhaseManager
                :phases="phases"
                :current-phase="currentPhase"
                :is-sequence-mode="isSequenceMode"
                @phase-select="$emit('phase-select', $event)"
                @phase-add="$emit('phase-add')"
                @phase-remove="$emit('phase-remove', $event)"
                @phase-anchor-change="phaseAnchorX = $event"
              />
            </div>
          </div>

          <!-- Divider -->
          <div class="section-divider"></div>

          <!-- Sequence Section -->
          <div class="popup-section sequence-section">
            <h3 class="section-title">Sequences</h3>
            <div class="section-content">
              <SequenceManager
                :current-sequence="currentSequence"
                :available-sequences="availableSequences"
                :players-with-paths="playersWithPaths"
                :current-sequence-data="currentSequenceData"
                :anchor-x="phaseAnchorX"
                @select-sequence="$emit('select-sequence', $event)"
                @add-sequence="$emit('add-sequence')"
                @remove-sequence="$emit('remove-sequence', $event)"
              />

              <!-- Player Controls -->
              <PlayerManager
                :players="players"
                :available-sequences="availableSequences"
                :current-sequence-data="currentSequenceData"
                @toggle-player-loop="$emit('toggle-player-loop', $event)"
                @select-all-players="$emit('select-all-players')"
                @deselect-all-players="$emit('deselect-all-players')"
              />
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
import PhaseManager from './PhaseManager.vue'
import SequenceManager from './SequenceManager.vue'
import PlayerManager from './PlayerManager.vue'
import type { Player, Sequence, Phase } from '../types/game'

interface Props {
  phases: Phase[]
  currentPhase: number
  isSequenceMode: boolean
  currentSequence: number
  availableSequences: Sequence[]
  playersWithPaths: Player[]
  currentSequenceData: Sequence | null
  players: Player[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'phase-select', phaseId: number): void
  (e: 'phase-add'): void
  (e: 'phase-remove', phaseId: number): void
  (e: 'select-sequence', sequenceId: number): void
  (e: 'add-sequence'): void
  (e: 'remove-sequence', sequenceId: number): void
  (e: 'toggle-player-loop', player: Player): void
  (e: 'select-all-players'): void
  (e: 'deselect-all-players'): void
}>()

const isPopupOpen = ref(false)
const phaseAnchorX = ref<number | null>(null)

const togglePopup = () => {
  isPopupOpen.value = !isPopupOpen.value
}


const closePopup = () => {
  isPopupOpen.value = false
}
</script>

<style scoped>
.sequence-popup-container {
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
  width: 680px;
  max-width: min(90vw, 680px);
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

/* Help Button */
.help-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.1rem;
  width: 100%;
  min-height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: .01em;
  transition: background-color .2s var(--ease), border-color .2s var(--ease), box-shadow .2s var(--ease), color .2s var(--ease);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.help-btn:hover {
  background: var(--btn-hover-bg);
  border-color: var(--border-strong);
}

.help-btn .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Sections */
.popup-section {
  margin-bottom: 1.5rem;
}

.popup-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.section-content {
  /* Content styling handled by child components */
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

/* Scrollbar styling */
.popup-content::-webkit-scrollbar {
  width: 8px;
}

.popup-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.popup-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.popup-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
  .popup-menu {
    min-width: 90vw;
  }

  .popup-content {
    padding: 1rem;
  }
}
</style>
