<template>
  <div class="sequence-management-container">
    <div class="attached-panel" :style="anchorStyle">
      <div class="panel-header">
        <div class="label">Sequences</div>
        <div class="actions">
          <button data-cy="add-sequence-btn" class="chip-btn add-seq" @click="addSequence" aria-label="Add Sequence" title="Add Sequence">+</button>
          <button v-if="availableSequences.length > 0" class="chip-btn remove-seq" @click="showRemoveConfirm = true" aria-label="Remove Current Sequence" title="Remove Current Sequence">-</button>
        </div>
        <div class="pager">
          <button class="pager-btn" :disabled="seqRow === 0" aria-label="Previous sequence row" title="Previous"
                  @click="seqRow = Math.max(0, seqRow - 1)">▲</button>
          <button class="pager-btn" :disabled="seqRow >= totalSeqRows - 1" aria-label="Next sequence row" title="Next"
                  @click="seqRow = Math.min(totalSeqRows - 1, seqRow + 1)">▼</button>
        </div>
      </div>

      <div class="chips" role="tablist" aria-label="Sequences" :title="headerHint">
        <button v-for="sequence in visibleSequences" :key="sequence.id" class="capsule" :class="{ active: currentSequence === sequence.id }" role="tab" :aria-selected="currentSequence === sequence.id ? 'true' : 'false'" @click="selectSequence(sequence.id)" data-cy="sequence-chip">
          Seq {{ sequence.id }}
        </button>
      </div>

      <div class="meta-bar" v-if="currentSequenceData">
        <span class="meta-text">{{ (currentSequenceData.activePlayerIds || []).length }} active players</span>
      </div>
    </div>
    <!-- Confirm Remove Sequence Dialog -->
    <ConfirmDialog
      :show="showRemoveConfirm"
      title="Remove Sequence"
      :message="`Are you sure you want to remove Sequence ${currentSequence}? This action cannot be undone.`"
      confirm-text="Remove Sequence"
      @confirm="handleConfirmRemove"
      @cancel="showRemoveConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { Sequence } from '../types/game'
import ConfirmDialog from './ConfirmDialog.vue'

interface Props {
  currentSequence: number
  availableSequences: Sequence[]
  playersWithPaths: any[]
  currentSequenceData: Sequence | null
  anchorX?: number | null
}

interface Emits {
  (e: 'select-sequence', sequenceId: number): void
  (e: 'add-sequence'): void
  (e: 'remove-sequence', sequenceId: number): void
}

const props = withDefaults(defineProps<Props>(), { anchorX: null })
const emit = defineEmits<Emits>()

const headerHint = computed(() => {
  if (props.availableSequences.length === 0) return 'Create a sequence to start building coordinated player movements'
  return props.playersWithPaths.length > 0
    ? 'Click any player to include/exclude them from the sequence'
    : 'Triple-click players to draw paths first, then click to include in sequence'
})

// Style binding for notch anchor position
const anchorStyle = computed(() => ({ '--anchor-x': props.anchorX != null ? `${props.anchorX}px` : '50%' }))

const selectSequence = (sequenceId: number) => { emit('select-sequence', sequenceId) }
const addSequence = () => { emit('add-sequence') }
const showRemoveConfirm = ref(false)
const handleConfirmRemove = () => {
  if (props.currentSequence) emit('remove-sequence', props.currentSequence)
  showRemoveConfirm.value = false
}

// Rowed chip navigation: 10 per line, one visible line at a time
const SEQS_PER_ROW = 10
const seqRow = ref(0)
const activeSeqIndex = computed(() => props.availableSequences.findIndex(s => s.id === props.currentSequence))
const totalSeqRows = computed(() => Math.max(1, Math.ceil(props.availableSequences.length / SEQS_PER_ROW)))
const visibleSequences = computed(() => {
  const start = seqRow.value * SEQS_PER_ROW
  const end = start + SEQS_PER_ROW
  return props.availableSequences.slice(start, end)
})

onMounted(() => {
  if (activeSeqIndex.value >= 0) seqRow.value = Math.floor(activeSeqIndex.value / SEQS_PER_ROW)
})
watch(() => [props.currentSequence, props.availableSequences.length], () => {
  if (activeSeqIndex.value >= 0) seqRow.value = Math.floor(activeSeqIndex.value / SEQS_PER_ROW)
})
</script>

<style scoped>
.sequence-management-container { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
.panel-header { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 10px; margin-bottom: 10px; }
.label { color: var(--muted); font-weight: 500; font-size: 0.9rem; }
/* Vertical list of sequence chips with max 10 visible before scroll */
.chips { --chip-h: 32px; display: grid; grid-template-columns: repeat(10, max-content); grid-auto-rows: var(--chip-h); gap: 8px; align-content: start; padding: 10px 0; height: calc(var(--chip-h) + 36px); overflow: hidden; }
.capsule { -webkit-font-smoothing: antialiased; display: inline-flex; align-items: center; height: var(--chip-h); padding: 0 12px; border-radius: 999px; border: 1px solid var(--btn-border); background: var(--btn-bg); color: var(--btn-text); font-weight: 500; font-size: 12px; cursor: pointer; transition: background-color .2s var(--ease), border-color .2s var(--ease), color .2s var(--ease); }
.capsule:hover { background: var(--btn-hover-bg); border-color: var(--border-strong); }
.capsule.active { background: var(--btn-primary-bg); color: var(--btn-primary-text); border-color: transparent; }
.actions { display: flex; gap: 8px; }
.pager { display: flex; gap: 6px; }
.pager-btn { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid var(--btn-border); background: var(--btn-bg); color: var(--btn-text); border-radius: 8px; cursor: pointer; }
.pager-btn:hover { background: var(--btn-hover-bg); border-color: var(--border-strong); }
.pager-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.chip-btn { height: var(--chip-h); width: 32px; display: inline-grid; place-items: center; padding: 0; border-radius: 999px; border: 1px solid var(--btn-border); background: var(--btn-bg); color: var(--btn-text); font-weight: 500; cursor: pointer; transition: background-color .2s var(--ease), border-color .2s var(--ease), color .2s var(--ease); }
.chip-btn:hover { background: var(--btn-hover-bg); border-color: var(--border-strong); }
.chip-btn.remove-seq { color: var(--muted); }
.chip-btn.remove-seq:hover { color: var(--text); }
.attached-panel { position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; box-shadow: var(--shadow-2); margin-top: 16px; overflow: visible; z-index: 0; }
/* Elegant notch: rotated square creates a beak pointing to the active phase */
.attached-panel::before { content: ""; position: absolute; top: -7px; left: calc(var(--anchor-x) - 7px); width: 14px; height: 14px; background: var(--surface); transform: rotate(45deg); border-left: 1px solid var(--border); border-top: 1px solid var(--border); }
.meta-bar { display: flex; align-items: center; justify-content: center; margin-top: 12px; padding: 8px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; }
.meta-text { color: var(--muted); font-size: 12px; font-weight: 500; }
</style>
