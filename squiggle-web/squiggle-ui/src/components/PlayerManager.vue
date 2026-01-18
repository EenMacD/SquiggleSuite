<template>
  <div class="player-controls" v-if="availableSequences.length > 0">
    <h4 class="section-title">Players Selected for Current Sequence</h4>
    <div class="player-list">
      <div 
        v-for="player in players" 
        :key="`${player.type}-${player.id}`"
        @click="togglePlayerLoop(player)"
        class="player-control-btn" 
        :class="{ 
          'active': player.isLooping, 
          'no-path': !canActivatePlayer(player),
          [player.type]: true 
        }"
        :disabled="!canActivatePlayer(player)"
      >
        <span class="player-icon">{{ player.type === 'attacking' ? 'R' : 'B' }}{{ player.id }}</span>
        <span class="player-status">
          {{ canActivatePlayer(player) ? 'READY' : 'NEEDS PATH' }}
          <span v-if="canActivatePlayer(player) && player.sequenceDelay !== undefined && player.sequenceDelay > 0" class="player-delay">
            {{ player.sequenceDelay }}ms
          </span>
        </span>
      </div>
    </div>
    
    <div class="player-actions">
      <button 
        data-cy="select-all-players-btn"
        @click="selectAllPlayers" 
        class="control-btn select-all"
        :disabled="!hasPlayersWithPaths"
      >
        <span class="icon">✓</span>
        Select All
      </button>
      
      <button 
        @click="deselectAllPlayers" 
        class="control-btn deselect-all"
        :disabled="!hasSelectedPlayers"
      >
        <span class="icon">✗</span>
        Deselect All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player, Sequence } from '../types/game'

interface Props {
  players: Player[]
  availableSequences: Sequence[]
  currentSequenceData: Sequence | null
}

interface Emits {
  (e: 'toggle-player-loop', player: Player): void
  (e: 'select-all-players'): void
  (e: 'deselect-all-players'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const canActivatePlayer = (player: Player) => {
  return player.path && player.path.length > 0
}

const hasPlayersWithPaths = computed(() => {
  return props.players.some(player => canActivatePlayer(player))
})

const hasSelectedPlayers = computed(() => {
  return props.players.some(player => player.isLooping)
})

const togglePlayerLoop = (player: Player) => {
  if (!canActivatePlayer(player)) return
  emit('toggle-player-loop', player)
}

const selectAllPlayers = () => {
  emit('select-all-players')
}

const deselectAllPlayers = () => {
  emit('deselect-all-players')
}
</script>

<style scoped>
.player-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem 0;
}

.player-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.player-control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.875rem;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 90px;
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.player-control-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
  opacity: 0;
  transition: opacity .25s ease;
}

.player-control-btn:hover:not(.no-path) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(45, 127, 249, 0.3);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.player-control-btn:hover:not(.no-path)::before {
  opacity: 1;
}

.player-control-btn:active:not(.no-path) {
  transform: translateY(0);
  transition-duration: .1s;
}

.player-control-btn.active {
  border: 1.5px solid rgba(45, 127, 249, 0.8);
  background: rgba(45, 127, 249, 0.12);
  box-shadow:
    0 2px 8px rgba(45, 127, 249, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.player-control-btn.active::before {
  background: linear-gradient(135deg, rgba(45, 127, 249, 0.15) 0%, transparent 50%);
  opacity: 1;
}

.player-control-btn.no-path {
  opacity: 0.35;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.05);
  color: var(--muted);
  transform: none;
}

.player-icon {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.player-status {
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.player-delay {
  display: block;
  font-size: 0.6rem;
  color: var(--muted);
  margin-top: 0.2rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
}

.player-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.control-btn {
  -webkit-font-smoothing: antialiased;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  min-height: 44px;
  border: 1.5px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: .01em;
  transition: all .25s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.04);
  color: var(--btn-text);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.control-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 127, 249, 0.4);
}

.control-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0;
  transition: opacity .25s ease;
}

.control-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
  transition-duration: .1s;
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.control-btn.select-all {
  background: linear-gradient(135deg, #2D7FF9 0%, #1F6FE6 100%);
  color: #fff;
  border-color: transparent;
  box-shadow:
    0 2px 8px rgba(45, 127, 249, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.control-btn.select-all::before {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
}

.control-btn.select-all:hover:not(:disabled) {
  background: linear-gradient(135deg, #3D8FFF 0%, #2D7FF9 100%);
  box-shadow:
    0 6px 16px rgba(45, 127, 249, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.control-btn.deselect-all {
  background: rgba(255, 255, 255, 0.04);
  color: var(--btn-text);
}

.control-btn .icon {
  font-size: 1rem;
  line-height: 1;
}

/* Removed pulsating animations for cleaner, consistent UI */
</style> 
