<template>
  <div class="phase-tabs" ref="barEl">
    <div class="phase-instructions">
      <p class="instructions-text">Select, add, or remove phases.</p>
    </div>
    <div class="phase-panel">
      <div class="phase-row">
        <div ref="chipsEl" role="tablist" aria-label="Phases">
          <button
            v-for="phase in visiblePhases"
            :key="phase.id"
            class="phase-tab" :class="{ active: currentPhase === phase.id }"
            role="tab"
            :aria-selected="currentPhase === phase.id ? 'true' : 'false'"
            @click="$emit('phase-select', phase.id)"
          >
            Phase {{ phase.id }}
          </button>
        </div>
        <div class="phase-tools">
          <div class="pager">
            <button class="pager-btn" :disabled="phaseRow === 0" aria-label="Previous phase row" title="Previous"
                    @click="phaseRow = Math.max(0, phaseRow - 1); emitAnchor()">▲</button>
            <button class="pager-btn" :disabled="phaseRow >= totalPhaseRows - 1" aria-label="Next phase row" title="Next"
                    @click="phaseRow = Math.min(totalPhaseRows - 1, phaseRow + 1); emitAnchor()">▼</button>
          </div>
          <div class="mutations">
            <button data-cy="add-phase-btn" class="phase-tab add-phase" @click="$emit('phase-add')" aria-label="Add Phase" title="Add Phase">+</button>
            <button v-if="phases.length > 1" class="phase-tab remove-phase" @click="showRemoveConfirm = true" aria-label="Remove Phase" title="Remove Current Phase">-</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm Remove Phase Dialog -->
  <ConfirmDialog
    :show="showRemoveConfirm"
    title="Remove Phase"
    :message="`Are you sure you want to remove ${currentPhaseName}? This action cannot be undone.`"
    confirm-text="Remove Phase"
    @confirm="handleRemovePhase"
    @cancel="showRemoveConfirm = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { Phase } from '../types/game'
import ConfirmDialog from './ConfirmDialog.vue'

interface Props {
  phases: Phase[]
  currentPhase: number
  isSequenceMode: boolean
}


interface Emits {
  (e: 'phase-select', phaseId: number): void
  (e: 'phase-add'): void
  (e: 'phase-remove', phaseId: number): void
  (e: 'phase-anchor-change', x: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showRemoveConfirm = ref(false)
const barEl = ref<HTMLElement | null>(null)
const PHASES_PER_ROW = 10
const phaseRow = ref(0)
const activePhaseIndex = computed(() => props.phases.findIndex(p => p.id === props.currentPhase))
const totalPhaseRows = computed(() => Math.max(1, Math.ceil(props.phases.length / PHASES_PER_ROW)))
const visiblePhases = computed(() => {
  const start = phaseRow.value * PHASES_PER_ROW
  const end = start + PHASES_PER_ROW
  return props.phases.slice(start, end)
})

const currentPhaseName = computed(() => {
  const currentPhaseData = props.phases.find(p => p.id === props.currentPhase)
  return currentPhaseData?.name || `Phase ${props.currentPhase}`
})

const handleRemovePhase = () => {
    emit('phase-remove', props.currentPhase)
  showRemoveConfirm.value = false
}

// Emit the horizontal anchor of the active phase tab so the
// sequences panel can visually attach to it below.
const emitAnchor = () => {
  nextTick(() => {
    const barRect = barEl.value?.getBoundingClientRect()
    const active = barEl.value?.querySelector('.phase-tab.active') as HTMLElement | null
    if (!barRect || !active) { emit('phase-anchor-change', 0); return }
    const chipRect = active.getBoundingClientRect()
    const x = chipRect.left + chipRect.width / 2 - barRect.left
    emit('phase-anchor-change', Math.max(0, x))
  })
}

onMounted(() => {
  if (activePhaseIndex.value >= 0) phaseRow.value = Math.floor(activePhaseIndex.value / PHASES_PER_ROW)
  emitAnchor()
})
watch(() => [props.currentPhase, props.phases.length], () => {
  if (activePhaseIndex.value >= 0) phaseRow.value = Math.floor(activePhaseIndex.value / PHASES_PER_ROW)
  emitAnchor()
})
</script>

<style scoped>
.phase-tabs { display: grid; gap: 0.25rem; }
.phase-instructions { margin-bottom: 0.25rem; }
.instructions-text { margin: 0; color: var(--muted); font-size: 0.9rem; }

/* Phase tab list */
[role="tablist"] {
  --phase-chip-h: 32px;
  display: grid;
  grid-template-columns: repeat(10, max-content);
  grid-auto-rows: var(--phase-chip-h);
  gap: 8px;
  padding: 10px 0; /* allow focus ring/outline to breathe */
  height: calc(var(--phase-chip-h) + 36px); /* one row + ample padding for highlight */
  overflow: hidden; /* paging via buttons only */
}
.phase-tab {
  -webkit-font-smoothing: antialiased;
  height: var(--phase-chip-h);
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-weight: 600;
  letter-spacing: .01em;
  cursor: pointer;
  transition: background-color .2s var(--ease), border-color .2s var(--ease), color .2s var(--ease);
}
.phase-tab:hover { background: var(--btn-hover-bg); border-color: var(--border-strong); }
.phase-tab.active { background: var(--btn-primary-bg); color: var(--btn-primary-text); border-color: transparent; }
.phase-tab.add-phase, .phase-tab.remove-phase { width: 32px; padding: 0; display: inline-grid; place-items: center; }
.phase-tab.remove-phase { color: var(--muted); }
.phase-tab.remove-phase:hover { color: var(--text); }
/* Panel outline to keep the box distinct and unobstructed */
.phase-panel {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  overflow: visible;
  z-index: 1;
  margin-bottom: 16px; /* ensure separation from sequences box and notch */
}
/* Row + tools */
.phase-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; }
.phase-tools { display: flex; align-items: center; gap: 8px; }
.pager { display: flex; gap: 6px; }
.pager-btn { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid var(--btn-border); background: var(--btn-bg); color: var(--btn-text); border-radius: 8px; cursor: pointer; }
.pager-btn:hover { background: var(--btn-hover-bg); border-color: var(--border-strong); }
.pager-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mutations { display: flex; gap: 6px; }
</style>
