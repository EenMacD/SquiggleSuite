<template>
  <div class="rugby-pitch-container" :class="{ 'minimized': false }">
    <!-- Dialog Components -->
    <PlayerDialog
      :show-attacking-count="extendedUIState.showPlayerDialog && extendedUIState.playerDialogType === 'attacking'"
      :show-defensive-count="extendedUIState.showPlayerDialog && extendedUIState.playerDialogType === 'defensive'"
      :selected-attacking-count="extendedUIState.playerDialogCount"
      :selected-defensive-count="extendedUIState.playerDialogCount"
      :existing-players="gameState.players.value"
      :canvas-config="gameState.canvasConfig"
      @close-dialog="handlePlayerDialogCancel"
      @confirm-player-count="handlePlayerDialogConfirm"
    />

    <!-- Canvas Container with Zoom Control -->
    <div class="canvas-wrapper">
      <!-- Zoom & Pan Control - Top Left Corner -->
      <div class="zoom-pan-container" ref="zoomPanContainer">
        <button
          class="zoom-pan-trigger"
          :class="{ active: showZoomPanMenu }"
          @click="showZoomPanMenu = !showZoomPanMenu"
          title="Zoom & Pan Controls"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>

        <Transition name="popup">
          <div v-if="showZoomPanMenu" class="zoom-pan-menu" @click.stop>
            <div class="zoom-pan-content">
              <!-- Zoom Controls -->
              <div class="control-section">
                <div class="section-label">Zoom</div>
                <div class="zoom-controls">
                  <button
                    class="control-btn"
                    @click="handleZoomOut"
                    :disabled="props.zoom <= props.zoomMin"
                    title="Zoom Out"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 8H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>

                  <div class="zoom-display">
                    {{ Math.round(props.zoom * 100) }}%
                  </div>

                  <button
                    class="control-btn"
                    @click="handleZoomIn"
                    :disabled="props.zoom >= props.zoomMax"
                    title="Zoom In"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 4V12M4 8H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Pan Mode Toggle -->
              <div class="control-section">
                <div class="section-label">Pan Mode</div>
                <button
                  class="pan-toggle-btn"
                  :class="{ active: props.panMode }"
                  @click="handleTogglePan"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 3L5 7M5 7L9 11M5 7H15M15 21L19 17M19 17L15 13M19 17H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>{{ props.panMode ? 'Pan On' : 'Pan Off' }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Main Canvas -->
      <RugbyCanvas
        ref="rugbyCanvas"
        :players="gameState.players.value"
        :ball="gameState.ball.value"
        :canvas-config="gameState.canvasConfig"
        :ui-state="uiState"
        :is-sequence-mode="gameState.isSequenceMode.value"
        :is-play-running="animationState.isPlayRunning.value"
        :current-path="uiState.currentPath"
        :is-drawing-path="uiState.isDrawingPath"
        :zoom="props.zoom"
        :pan-mode="props.panMode"
        @player-click="handlePlayerClick"
        @player-double-click="handlePlayerDoubleClick"
        @player-long-press="handlePlayerLongPress"
        @ball-click="handleBallClick"
        @canvas-click="handleCanvasClick"
        @player-drag="handlePlayerDrag"
        @ball-drag="handleBallDrag"
        @path-draw="handlePathDraw"
        @attach-ball="handleAttachBall"
      />
    </div>

    <!-- Confirm clear current play -->
    <ConfirmDialog
      :show="showClearPlayConfirm"
      title="Start from scratch"
      message="Are you sure you want to clear the current play? This will remove players, paths, and sequences for the in-progress play."
      confirm-text="Clear Current Play"
      @confirm="confirmClearPlay"
      @cancel="showClearPlayConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import RugbyCanvas from './RugbyCanvas.vue'
import PlayerDialog from './PlayerDialog.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import { useGameState } from '../composables/useGameState'
import { useAnimations } from '../composables/useAnimations'
import type { Player, Ball, PathPoint, Sequence, UIState, RugbyPitchProps, BallPassEvent } from '../types/game'
import { calculateFieldDimensions } from '../types/game'
import type { PlayerState } from '../types/play'
import { playService } from '../services/playService'

interface Props extends RugbyPitchProps {
  zoom?: number
  panMode?: boolean
  zoomMin?: number
  zoomMax?: number
  zoomStep?: number
  isModalActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isRecording: false,
  playbackData: () => [],
  zoom: 1,
  panMode: false,
  zoomMin: 0.5,
  zoomMax: 2,
  zoomStep: 0.1,
  isModalActive: false
})

const emit = defineEmits<{
  (e: 'update:playerStates', states: PlayerState[]): void
  (e: 'update:is-recording', isRecording: boolean): void
  (e: 'update:zoom', zoom: number): void
  (e: 'update:panMode', panMode: boolean): void
  (e: 'record:ball-event', event: BallPassEvent): void
  (e: 'open-player-menu'): void
}>()

// Composables
const gameState = useGameState()
const forwardBallEvent = (event: BallPassEvent) => {
  if (props.isRecording) {
    emit('record:ball-event', event)
  }
}

const animationState = useAnimations(
  gameState.players,
  gameState.ball,
  computed(() => gameState.canvasConfig),
  (event: string, ...args: any[]) => {
    if (event === 'update:playerStates') {
      emit('update:playerStates', args[0])
    } else if (event === 'update:is-recording') {
      emit('update:is-recording', args[0])
    }
  },
  gameState.setBallCarrier,
  forwardBallEvent
)

// UI State management
const uiState = reactive<UIState>({
  showAttackingCount: false,
  showDefensiveCount: false,
  selectedPlayer: null,
  selectedBall: false,
  isDragging: false,
  isDrawingPath: false,
  currentPath: [],
  dragOffset: { x: 0, y: 0 },
  isSettingTimedPass: false
})

// Extended UI state for dialogs
const extendedUIState = reactive({
  showPlayerDialog: false,
  playerDialogType: 'attacking' as 'attacking' | 'defensive',
  playerDialogCount: 1
})

// Component refs
const rugbyCanvas = ref<InstanceType<typeof RugbyCanvas> | null>(null)
// Track which player was last dragged so we only snapshot start positions once per drag
const lastDraggedPlayer = ref<Player | null>(null)
const setAttacking = (type: 'attacking' | 'defensive') => gameState.setAttackingType(type)
const showClearPlayConfirm = ref(false)
const showZoomPanMenu = ref(false)
const zoomPanContainer = ref<HTMLElement | null>(null)

// Computed properties for derived state
const computedGameState = computed(() => ({
  ...gameState,
  isMinimized: false, // You can add this to gameState if needed
  hasAnySequencesInCurrentPhase: gameState.hasAnySequencesInCurrentPhase.value,
  hasAnyPaths: gameState.hasAnyPaths.value,
  availableSequences: gameState.availableSequences.value,
  currentPhaseData: gameState.currentPhaseData.value,
  currentSequenceData: gameState.currentSequenceData.value,
  playersWithPaths: gameState.playersWithPaths.value
}))

// -------------------------------------------------------------
// Helper utilities for Full-Play execution
// -------------------------------------------------------------

/**
 * Build an immutable baseline map of where every player should stand at the
 * very start of a "Run Full Play" action.  We favour the coordinates stored in
 * Phase-1 / Sequence-1 (if they exist) and fall back to a player's own
 * originalPosition or current XY.
 */
const buildBaselinePositions = (): Record<string, { x: number; y: number }> => {
  const baseline: Record<string, { x: number; y: number }> = {};
  gameState.players.value.forEach(player => {
    const id = `${player.type}-${player.id}`;
    // Prioritize the new immutable playStartPosition, but fall back for older data.
    const pos = player.playStartPosition || player.originalPosition;
    if (pos) {
      baseline[id] = { x: pos.x, y: pos.y };
    }
  });
  return baseline;
};

const getHandPosition = (player: Player) => ({
  x: player.x + gameState.canvasConfig.playerRadius * 0.8,
  y: player.y + gameState.canvasConfig.playerRadius * 0.4
})

const generateBallEventId = () => {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `seq_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Reset all players to the correct starting coordinate for the given sequence.
 * Active players get their sequence-specific start point; inactive players fall
 * back to the immutable baseline built once at the beginning of the full play.
 */
const resetPlayersForSequence = (
  sequence: Sequence,
  baseline: Record<string, { x: number; y: number }>
) => {
  gameState.players.value.forEach(player => {
    const id = `${player.type}-${player.id}`;

    if (sequence.startingPlayerPositions?.[id]) {
      const pos = sequence.startingPlayerPositions[id];
      player.x = pos.x;
      player.y = pos.y;
    } else if (baseline[id]) { // Always use the baseline for the full play run
      player.x = baseline[id].x;
      player.y = baseline[id].y;
    }
  });
};

// Helper: reset ball to the state saved for a given sequence
const resetSequenceBallState = (sequence: Sequence) => {
  if (!sequence.ballState) {
    console.log('[resetSequenceBallState] No saved ball state')
    return
  }

  console.log('[resetSequenceBallState] Restoring ball state', sequence.ballState)

  // Restore position
  gameState.ball.value.x = sequence.ballState.x
  gameState.ball.value.y = sequence.ballState.y

  // Restore carrier
  if (sequence.ballState.attachedTo) {
    const carrier = gameState.players.value.find(p =>
      p.type === sequence.ballState.attachedTo?.type &&
      p.id === sequence.ballState.attachedTo?.id
    )
    if (carrier) {
      gameState.setBallCarrier(carrier, { updateTimedPassSource: false })
    } else {
      console.log('[resetSequenceBallState] Carrier not found, ball detached')
      gameState.ball.value.attachedTo = null
    }
  } else {
    // Ball was detached - preserve position (already set above)
    gameState.ball.value.attachedTo = null
  }
}

// Event Handlers - Zoom & Pan Control
const handleZoomIn = () => {
  const newZoom = Math.min(props.zoom + props.zoomStep, props.zoomMax)
  emit('update:zoom', newZoom)
}

const handleZoomOut = () => {
  const newZoom = Math.max(props.zoom - props.zoomStep, props.zoomMin)
  emit('update:zoom', newZoom)
}

const handleTogglePan = () => {
  emit('update:panMode', !props.panMode)
}

// Click-outside handler for zoom/pan menu
const handleClickOutside = (event: MouseEvent) => {
  if (!showZoomPanMenu.value) return
  if (zoomPanContainer.value && !zoomPanContainer.value.contains(event.target as Node)) {
    showZoomPanMenu.value = false
  }
}

// Event Handlers - Control Panel
const handleAddPlayers = (type: 'attacking' | 'defensive') => {
  extendedUIState.showPlayerDialog = true
  extendedUIState.playerDialogType = type
  extendedUIState.playerDialogCount = 1
}

const handleToggleRecording = () => {
  // Check if this is a request to start "Record Play" with a full play
  if (!props.isRecording && gameState.isSequenceMode.value && gameState.availableSequences.value.length > 0) {
    // This will start recording and execute full play automatically
    handleRecordFullPlay()
    return
  }
  
  // Regular manual recording toggle
  const willBeRecording = !props.isRecording
  emit('update:is-recording', willBeRecording)
  
  if (willBeRecording) {
    const states = gameState.getPlayerStates()
    emit('update:playerStates', states)
  }
}

const handleRecordFullPlay = async () => {
  // Don't start if already running
  if (animationState.isRunningFullPlay.value || props.isRecording) {
    return
  }
  
  // Start recording first
  emit('update:is-recording', true)
  
  // Emit initial state
  const initialStates = gameState.getPlayerStates()
  emit('update:playerStates', initialStates)
  
  try {
    // Execute the full play with recording enabled
    await executeFullPlay({ recordStates: true })
  } finally {
    // Stop recording when play is complete
    emit('update:is-recording', false)
  }
}

const executeFullPlay = async ({ recordStates = false }: { recordStates?: boolean } = {}) => {
  const emitRecordedState = () => {
    if (!recordStates) return
    const states = gameState.getPlayerStates()
    emit('update:playerStates', states)
  }

  animationState.stopAllPlayerLoops()

  const phasesWithSequences = [...gameState.phases.value]
    .sort((a, b) => a.id - b.id)
    .filter(phase => phase.sequences && phase.sequences.length > 0)

  const baseline = buildBaselinePositions()

  // Reset ball to center of field at the start
  gameState.ball.value.x = gameState.canvasConfig.fieldWidth * 0.5
  gameState.ball.value.y = gameState.canvasConfig.fieldHeight * 0.5
  gameState.ball.value.attachedTo = null

  // Emit initial state with ball at center
  emitRecordedState()

  let sequenceCount = 0
  let ballPassedToFirstPlayer = false

  for (let phaseIndex = 0; phaseIndex < phasesWithSequences.length; phaseIndex++) {
    const phase = phasesWithSequences[phaseIndex]
    const sortedSequences = [...(phase.sequences || [])].sort((a, b) => a.id - b.id)

    for (const sequence of sortedSequences) {
      sequenceCount++
      resetPlayersForSequence(sequence, baseline)

      // After first reset, animate ball to first player
      if (!ballPassedToFirstPlayer) {
        ballPassedToFirstPlayer = true

        let initialCarrier: Player | undefined

        // Always use the first active player in the first sequence (Phase 1, Sequence 1)
        if (sequence.activePlayerIds && sequence.activePlayerIds.length > 0) {
          const firstPlayerId = sequence.activePlayerIds[0]
          const [type, id] = firstPlayerId.split('-')
          initialCarrier = gameState.players.value.find(p =>
            p.type === type && p.id === parseInt(id)
          )
        }

        // Animate ball from center to the first carrier
        if (initialCarrier) {
          // Update sequence ball state to prevent executeSequence from re-positioning
          sequence.ballState = {
            x: initialCarrier.x + gameState.canvasConfig.playerRadius * 0.8,
            y: initialCarrier.y + gameState.canvasConfig.playerRadius * 0.4,
            attachedTo: { type: initialCarrier.type, id: initialCarrier.id }
          }

          await animationState.animateBallToPlayer(initialCarrier, { recordEvent: recordStates })
          emitRecordedState()
        }
      }

      if (sequence.playerData) {
        Object.entries(sequence.playerData).forEach(([playerId, playerData]) => {
          const [type, id] = playerId.split('-')
          const player = gameState.players.value.find(p =>
            p.type === type && p.id === parseInt(id)
          )
          if (player) {
            player.path = playerData.path ? [...playerData.path] : []
            player.speed = playerData.speed
            player.sequenceDelay = playerData.sequenceDelay
            player.mode = playerData.mode
            player.timedPass = playerData.timedPass
              ? JSON.parse(JSON.stringify(playerData.timedPass))
              : undefined
            player.isLooping = sequence.activePlayerIds.includes(playerId)
          }
        })
      }

      rugbyCanvas.value?.redraw()
      emitRecordedState()

      // Ball state is now handled with animation inside executeSequence
      await animationState.executeSequence(
        sequence,
        gameState.players.value,
        () => rugbyCanvas.value?.redraw(),
        true,
        recordStates
      )

      emitRecordedState()

      await new Promise(resolve => setTimeout(resolve, 800))
      emitRecordedState()
    }

    const isLastPhase = phaseIndex === phasesWithSequences.length - 1
    if (!isLastPhase) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      emitRecordedState()
    }
  }
}

// Sequence mode is now always active - toggle removed

// Clear Paths removed

const handleRunCurrentPhase = async () => {
  // Reset current phase to its starting state, then run all its sequences in order
  const currentPhase = gameState.currentPhaseData.value
  if (!currentPhase || !currentPhase.sequences || currentPhase.sequences.length === 0) return

  // Stop any running animations first
  animationState.stopAllPlayerLoops()

  // Sort sequences and select the first as the starting point
  const sortedSequences = [...currentPhase.sequences].sort((a, b) => a.id - b.id)
  const firstSequence = sortedSequences[0]

  // Ensure UI state reflects starting sequence
  gameState.selectSequence(firstSequence.id)

  // Build baseline positions once for this phase run
  const baseline = buildBaselinePositions()

  let sequenceIndex = 0

  try {
    for (const sequence of sortedSequences) {
      sequenceIndex++
      // Reset players for this sequence (use starting positions when present)
      resetPlayersForSequence(sequence, baseline)

      // Load sequence player data (paths/speeds/delays/mode)
      if (sequence.playerData) {
        Object.entries(sequence.playerData).forEach(([playerId, playerData]) => {
          const [type, id] = playerId.split('-')
          const player = gameState.players.value.find(p => p.type === type && p.id === parseInt(id))
          if (player) {
            player.path = playerData.path ? [...playerData.path] : []
            player.speed = playerData.speed
            player.sequenceDelay = playerData.sequenceDelay
            player.mode = playerData.mode
            player.timedPass = playerData.timedPass
              ? JSON.parse(JSON.stringify(playerData.timedPass))
              : undefined
            // Set isLooping based on whether player is in activePlayerIds
            player.isLooping = sequence.activePlayerIds.includes(playerId)
          }
        })
      }

      // Reset ball state before each sequence
      // REMOVED: resetSequenceBallState(sequence) - this was causing the ball to jump to 0,0

      // Execute the sequence - it will handle ball state restoration internally
      await animationState.executeSequence(
        sequence,
        gameState.players.value,
        () => rugbyCanvas.value?.redraw(),
        true // isMultiSequenceExecution
      )

      // Small pause between sequences for visibility
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  } finally {
    // No-op; animation state handled internally
  }
}

const handleRunFullPlay = async () => {
  await executeFullPlay()
}


const handleSelectAllPlayers = () => {
  const sequence = gameState.currentSequenceData.value
  if (!sequence) return

  gameState.players.value.forEach(player => {
    if (player.path && player.path.length > 0) {
      player.isLooping = true
      const playerId = `${player.type}-${player.id}`
      if (!sequence.activePlayerIds.includes(playerId)) {
        sequence.activePlayerIds.push(playerId)
      }
      // Also update playerData
      sequence.playerData[playerId] = {
        path: player.path ? [...player.path] : [],
        originalPosition: player.originalPosition || { x: player.x, y: player.y },
        speed: player.speed || 100,
        sequenceDelay: player.sequenceDelay || 0,
        mode: player.mode || 'drag',
        position: { x: player.x, y: player.y },
        timedPass: player.timedPass ? JSON.parse(JSON.stringify(player.timedPass)) : undefined
      }
    }
  })
  rugbyCanvas.value?.redraw()
}

const handleDeselectAllPlayers = () => {
  const sequence = gameState.currentSequenceData.value
  if (!sequence) return

  gameState.players.value.forEach(player => {
    player.isLooping = false
    const playerId = `${player.type}-${player.id}`
    const index = sequence.activePlayerIds.indexOf(playerId)
    if (index > -1) {
      sequence.activePlayerIds.splice(index, 1)
    }
    delete sequence.playerData[playerId]
  })
  rugbyCanvas.value?.redraw()
}

// Event Handlers - Phase Management
const handlePhaseSelect = (phaseId: number) => {
  gameState.selectPhase(phaseId)
}

const handlePhaseAdd = () => {
  gameState.addPhase()
}

const handlePhaseRemove = (phaseId: number) => {
  gameState.removePhase(phaseId)
}

// Event Handlers - Sequence Management
const handleSequenceSelect = (sequenceId: number) => {
  gameState.selectSequence(sequenceId)
}

const handleSequenceAdd = () => {
  gameState.addSequence()
}

const handleSequenceRemove = (sequenceId: number) => {
  gameState.removeSequence(sequenceId)
}

const handleSequenceRun = async (sequenceId: number) => {
  const sequence = gameState.availableSequences.value.find(s => s.id === sequenceId)
  if (!sequence) return

  animationState.stopAllPlayerLoops()

  const baseline = buildBaselinePositions()
  resetPlayersForSequence(sequence, baseline)

  if (sequence.playerData) {
    Object.entries(sequence.playerData).forEach(([playerId, playerData]) => {
      const [type, id] = playerId.split('-')
      const player = gameState.players.value.find(p =>
        p.type === type && p.id === parseInt(id)
      )
      if (player) {
        player.path = playerData.path ? [...playerData.path] : []
        player.speed = playerData.speed
        player.sequenceDelay = playerData.sequenceDelay
        player.mode = playerData.mode
        player.timedPass = playerData.timedPass
          ? JSON.parse(JSON.stringify(playerData.timedPass))
          : undefined
        player.isLooping = sequence.activePlayerIds.includes(playerId)
      }
    })
  }

  rugbyCanvas.value?.redraw()
  // For a single sequence run, ALWAYS reset the ball to its saved state for that sequence.
  // REMOVED: resetSequenceBallState(sequence) - this was causing the ball to jump to 0,0

  await animationState.executeSequence(
    sequence, 
    gameState.players.value, 
    () => rugbyCanvas.value?.redraw()
    // No multi-sequence flag - this is single sequence execution
  )
}

const handleSequenceReset = () => {
  animationState.stopAllPlayerLoops()

  // Reset players back to their original positions for this phase
  gameState.players.value.forEach(player => {
    if (player.originalPosition) {
      player.x = player.originalPosition.x
      player.y = player.originalPosition.y
    }
    player.isLooping = false
  })

  // Reset ball to the player / position it started with for this sequence
  const sequence = gameState.currentSequenceData.value
  if (sequence) { resetSequenceBallState(sequence) }

  rugbyCanvas.value?.redraw()
}

const handleClearPlay = () => {
  showClearPlayConfirm.value = true
}

const confirmClearPlay = () => {
  showClearPlayConfirm.value = false
  gameState.resetToDefaults()
  rugbyCanvas.value?.redraw()
}

// Event Handlers - Player Management
const handlePlayerToggleLoop = (player: Player) => {
  if (!player.path || player.path.length === 0) return

  player.isLooping = !player.isLooping

  const sequence = gameState.currentSequenceData.value
  if (sequence) {
    const playerId = `${player.type}-${player.id}`
    if (player.isLooping) {
      if (!sequence.activePlayerIds.includes(playerId)) {
        sequence.activePlayerIds.push(playerId)
      }
      sequence.playerData[playerId] = {
        path: player.path ? [...player.path] : [],
        originalPosition: player.originalPosition || { x: player.x, y: player.y },
        speed: player.speed || 100,
        sequenceDelay: player.sequenceDelay || 0,
        mode: player.mode || 'drag',
        position: { x: player.x, y: player.y },
        timedPass: player.timedPass ? JSON.parse(JSON.stringify(player.timedPass)) : undefined
      }
    } else {
      // Player is being removed from sequence - clear their timed pass
      player.timedPass = undefined

      const index = sequence.activePlayerIds.indexOf(playerId)
      if (index > -1) {
        sequence.activePlayerIds.splice(index, 1)
      }
      delete sequence.playerData[playerId]
    }
  }

  rugbyCanvas.value?.redraw()
}

// Event Handlers - Canvas Interactions
const handlePlayerClick = (player: Player, event: MouseEvent) => {
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const scaleX = gameState.canvasConfig.width / rect.width
  const scaleY = gameState.canvasConfig.height / rect.height
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY

  // Always select the clicked player first
  gameState.players.value.forEach(p => p.isSelected = false)
  uiState.selectedPlayer = player
  player.isSelected = true
  uiState.selectedBall = false

  // Path mode behaviour
  if (player.mode === 'path') {
    // If the player already has a path, just select them and exit.
    // This makes single-click selection work even when a path exists.
    if (player.path && player.path.length > 0) {
      uiState.isDrawingPath = false
      uiState.isDragging = false
      return
    }

    // Start drawing a path (only for players without paths)
    if (!uiState.isDragging) {
      uiState.isDragging = true
      uiState.isDrawingPath = true

      // Initialize path if it doesn't exist
      if (!player.path) {
        player.path = []
      }

      // Always set original position at the start of drawing a new path
      player.originalPosition = { x: player.x, y: player.y }

      // Start current path from player position
      uiState.currentPath = [{ x: player.x, y: player.y }]

      uiState.dragOffset = {
        x: x - player.x,
        y: y - player.y
      }
    }
  } else {
    // Drag mode: select and allow dragging without path drawing
    if (!uiState.isDragging) {
      uiState.isDragging = true
      uiState.isDrawingPath = false

      uiState.dragOffset = {
        x: x - player.x,
        y: y - player.y
      }
    }
  }
}

const openPlayerOptionsMenu = (player: Player) => {
  // Initialize player settings if needed
  if (!player.mode) player.mode = 'path' // Default to path mode
  if (!player.speed) player.speed = 100
  if (player.pathVisible === undefined) player.pathVisible = true
  if (!player.originalPosition) {
    player.originalPosition = { x: player.x, y: player.y }
  }

  // Select the player
  gameState.players.value.forEach(p => p.isSelected = false)
  player.isSelected = true
  uiState.selectedPlayer = player

  // Emit event to open the player options menu
  emit('open-player-menu')
}

const handleAttachBall = (player: Player) => {
  gameState.setBallCarrier(player)
}

const handlePlayerDoubleClick = (player: Player, event: MouseEvent) => {
  openPlayerOptionsMenu(player)
}

const handlePlayerLongPress = (player: Player, event: MouseEvent) => {
  openPlayerOptionsMenu(player)
}

const handleBallClick = (ball: Ball, event: MouseEvent) => {
  uiState.selectedBall = true
  uiState.selectedPlayer = null
  uiState.isDragging = true
  
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const scaleX = gameState.canvasConfig.width / rect.width
  const scaleY = gameState.canvasConfig.height / rect.height
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY
  
  uiState.dragOffset = {
    x: x - ball.x,
    y: y - ball.y
  }
}

const handleCanvasClick = (position: { x: number, y: number }, event: MouseEvent) => {
  // Handle timed pass placement
  if (uiState.isSettingTimedPass && uiState.selectedPlayer && uiState.selectedPlayer.path) {
    // Find the closest point on the player's path
    const path = uiState.selectedPlayer.path
    let closestIndex = 0
    let closestDistance = Infinity

    for (let i = 0; i < path.length; i++) {
      const dx = path[i].x - position.x
      const dy = path[i].y - position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }

    // Only set timed pass if click is reasonably close to the path (within 30 pixels)
    if (closestDistance < 30) {
      const attached = gameState.ball.value.attachedTo
      const source = attached
        ? { id: attached.id, type: attached.type }
        : null

      if (!source) {
        console.warn('Attach the ball to the intended passer before setting a timed pass.')
        return
      }
      const timedPass = {
        pathIndex: closestIndex,
        position: { x: path[closestIndex].x, y: path[closestIndex].y } as { x: number; y: number },
        fromPlayerId: source?.id,
        fromPlayerType: source?.type
      }

      // Persist into the current sequence so it survives reloads
      const seq = gameState.currentSequenceData.value
      if (seq) {
        const playerKey = `${uiState.selectedPlayer.type}-${uiState.selectedPlayer.id}`
        if (!seq.playerData[playerKey]) {
          seq.playerData[playerKey] = {
            path: uiState.selectedPlayer.path ? [...uiState.selectedPlayer.path] : [],
            originalPosition: uiState.selectedPlayer.originalPosition || { x: uiState.selectedPlayer.x, y: uiState.selectedPlayer.y },
            speed: uiState.selectedPlayer.speed || 100,
            sequenceDelay: uiState.selectedPlayer.sequenceDelay || 0,
            mode: uiState.selectedPlayer.mode || 'drag',
            position: { x: uiState.selectedPlayer.x, y: uiState.selectedPlayer.y },
            timedPass: undefined
          }
        }
        seq.playerData[playerKey].timedPass = JSON.parse(JSON.stringify(timedPass))
      }

      // Assign to the selected player
      uiState.selectedPlayer.timedPass = timedPass

      uiState.isSettingTimedPass = false
      rugbyCanvas.value?.redraw()
    }
    return
  }

  // Clear all player selections
  gameState.players.value.forEach(p => p.isSelected = false)
  uiState.selectedPlayer = null
  uiState.selectedBall = false
  uiState.isSettingTimedPass = false
}

const handlePlayerDrag = (player: Player, position: { x: number, y: number }) => {
  if (uiState.isDrawingPath && player.mode === 'path') {
    // Handle path drawing
    const newPoint = {
      // Use world-space coordinates directly so the stored
      // path reflects the actual run, independent of drag offset.
      x: position.x,
      y: position.y
    }
    
    const lastPoint = uiState.currentPath[uiState.currentPath.length - 1]
    if (!lastPoint || Math.sqrt(Math.pow(newPoint.x - lastPoint.x, 2) + Math.pow(newPoint.y - lastPoint.y, 2)) > 15) {
      uiState.currentPath.push(newPoint)
    }
  } else {
    // Handle normal dragging
    player.x = position.x - uiState.dragOffset.x
    player.y = position.y - uiState.dragOffset.y
    lastDraggedPlayer.value = player
    
    // Move ball if player is carrying it
    if (player.isCarryingBall) {
      gameState.setBallCarrier(player, { updateTimedPassSource: !animationState.isPlayRunning.value })
    }
  }
  
  // Emit for recording
  if (props.isRecording) {
    const states = gameState.getPlayerStates()
    emit('update:playerStates', states)
  }
}

const handleBallDrag = (ball: Ball, position: { x: number, y: number }) => {
  gameState.updateBallPosition({
    x: position.x - uiState.dragOffset.x,
    y: position.y - uiState.dragOffset.y
  })
  
  // Check for player attachment
  const attachmentThreshold = gameState.canvasConfig.playerRadius * 1.2
  let closestPlayer: Player | null = null
  let minDistance = Infinity
  
  gameState.players.value.forEach(player => {
    const dx = player.x - ball.x
    const dy = player.y - ball.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < minDistance && distance < attachmentThreshold) {
      minDistance = distance
      closestPlayer = player
    }
  })
  
  if (closestPlayer) {
    gameState.attachBallToPlayer(closestPlayer, { updateTimedPassSource: !animationState.isPlayRunning.value })
  } else {
    gameState.detachBall({ updateTimedPassSource: !animationState.isPlayRunning.value })
  }
  
  if (props.isRecording) {
    const states = gameState.getPlayerStates()
    emit('update:playerStates', states)
  }
}

const handlePathDraw = (player: Player, path: PathPoint[]) => {
  player.path = [...path]
  player.timedPass = undefined // Clear old timed pass when path changes
  // Automatically select player for sequence when they get a path
  if (path.length > 0) {
    player.isLooping = true

    // Also update the sequence's activePlayerIds
    const sequence = gameState.currentSequenceData.value
    if (sequence) {
      const playerId = `${player.type}-${player.id}`
      if (!sequence.activePlayerIds.includes(playerId)) {
        sequence.activePlayerIds.push(playerId)
      }
      // Update playerData
      sequence.playerData[playerId] = {
        path: [...path],
        originalPosition: player.originalPosition || { x: player.x, y: player.y },
        speed: player.speed || 100,
        sequenceDelay: player.sequenceDelay || 0,
        mode: player.mode || 'drag',
        position: { x: player.x, y: player.y },
        timedPass: player.timedPass ? JSON.parse(JSON.stringify(player.timedPass)) : undefined
      }
    }
  }
  uiState.currentPath = []
  uiState.isDrawingPath = false
  uiState.selectedPlayer = null
}

// Event Handlers - Dialog Management
const handlePlayerDialogConfirm = (data: { 
  type: 'attacking' | 'defensive', 
  count: number,
  formation: {
    type: 'default' | 'custom' | 'saved',
    positions: Array<{ x: number, y: number }>
  }
}) => {
  const { type, count, formation } = data
  
  // UNIFIED: Use the same field calculation for proper coordinate conversion
  const fieldDimensions = calculateFieldDimensions(gameState.canvasConfig.width, gameState.canvasConfig.height)
  
  for (let i = 0; i < count; i++) {
    const relativePosition = formation.positions[i]
    
    // Convert relative position (0-1) to absolute field coordinates using unified method
    const position = {
      x: fieldDimensions.toAbsoluteX(relativePosition.x),
      y: fieldDimensions.toAbsoluteY(relativePosition.y)
    }
    
    // Add player with formation position as starting position
    gameState.addPlayer(type, position)
  }
  
  extendedUIState.showPlayerDialog = false
  rugbyCanvas.value?.redraw()
}

const handlePlayerDialogCancel = () => {
  extendedUIState.showPlayerDialog = false
}

// Event Handlers - Player Options Menu
const handlePlayerOptionsMode = (mode: 'drag' | 'path') => {
  if (uiState.selectedPlayer) {
    uiState.selectedPlayer.mode = mode
    if (mode === 'path' && !uiState.selectedPlayer.path) {
      uiState.selectedPlayer.path = []
    }
    rugbyCanvas.value?.redraw()
  }
}

const handlePlayerOptionsSpeed = (speed: number) => {
  if (uiState.selectedPlayer) {
    uiState.selectedPlayer.speed = speed
    rugbyCanvas.value?.redraw()
  }
}

const handlePlayerOptionsDelay = (delay: number) => {
  if (uiState.selectedPlayer) {
    uiState.selectedPlayer.sequenceDelay = delay
    rugbyCanvas.value?.redraw()
  }
}

const handlePlayerOptionsDelayReset = () => {
  if (uiState.selectedPlayer) {
    uiState.selectedPlayer.sequenceDelay = 0
    rugbyCanvas.value?.redraw()
  }
}

const handlePlayerOptionsClearPath = () => {
  if (uiState.selectedPlayer) {
    uiState.selectedPlayer.path = []
    uiState.selectedPlayer.mode = 'drag'
    // Clear timed pass when path is cleared
    uiState.selectedPlayer.timedPass = undefined
    rugbyCanvas.value?.redraw()
  }
}

const handlePlayerOptionsPathVisibility = () => {
  if (uiState.selectedPlayer) {
    uiState.selectedPlayer.pathVisible = uiState.selectedPlayer.pathVisible !== false ? false : true
    rugbyCanvas.value?.redraw()
  }
}

const handleSetTimedPass = () => {
  if (uiState.selectedPlayer && uiState.selectedPlayer.path && uiState.selectedPlayer.path.length > 0) {
    // Check if any other player in the current sequence already has a timed pass
    const playersInSequence = gameState.players.value.filter(p => p.isLooping)
    const existingTimedPass = playersInSequence.find(p =>
      p.timedPass && p.id !== uiState.selectedPlayer?.id && p.type === uiState.selectedPlayer?.type
    )

    if (existingTimedPass) {
      // Alert user that only one timed pass is allowed per sequence
      alert(`Only one timed pass is allowed per sequence. Player ${existingTimedPass.assignedNumber || existingTimedPass.id} already has a timed pass set. Clear it first to set a new one.`)
      return
    }

    uiState.isSettingTimedPass = true
  }
}

const handleClearTimedPass = () => {
  if (uiState.selectedPlayer) {
    uiState.selectedPlayer.timedPass = undefined
    rugbyCanvas.value?.redraw()
  }
}

const handleGlobalMouseUp = () => {
  if (uiState.isDragging) {
    uiState.isDragging = false
    if (!uiState.isDrawingPath && lastDraggedPlayer.value) {
      gameState.capturePlayerStartingPosition(lastDraggedPlayer.value)
    }
    lastDraggedPlayer.value = null
    // Don't clear selectedPlayer here - keep the player selected for PlayerOptionsMenu
    // selectedPlayer will be cleared when clicking canvas or selecting a different player
  }
}

// Keyboard event handling for ball passing
const handleKeyDown = (event: KeyboardEvent) => {
  // Ignore keyboard events when a modal is active (e.g., SavePlayDialog)
  if (props.isModalActive) return
  
  if (!/^[0-9]$/.test(event.key)) return

  const targetNumber = parseInt(event.key)
  const attacking = gameState.attackingType.value
  const candidates = gameState.players.value
    .filter(player => player.assignedNumber === targetNumber && player.type === attacking)
    .sort((a, b) => a.id - b.id)
  const targetPlayer = candidates[0] || gameState.players.value.find(player => player.assignedNumber === targetNumber)

  if (targetPlayer) {
    // Get the current ball carrier before passing
    const currentCarrier = gameState.ball.value.attachedTo
      ? gameState.players.value.find(p =>
          p.type === gameState.ball.value.attachedTo?.type &&
          p.id === gameState.ball.value.attachedTo?.id
        )
      : null

    // Animate ball from the current carrier's hand to the target player
    animationState.animateBallToPlayer(targetPlayer)

    // Record the pass event into the current sequence for playback
    if (currentCarrier && currentCarrier !== targetPlayer) {
      const sequence = gameState.currentSequenceData.value
      if (sequence) {
        if (!sequence.ballEvents) {
          sequence.ballEvents = []
        }

        const startPos = getHandPosition(currentCarrier)
        const endPos = getHandPosition(targetPlayer)
        
        // Convert positions to relative coordinates so they scale properly during playback
        const dims = calculateFieldDimensions(gameState.canvasConfig.width, gameState.canvasConfig.height)

        // Record the ball pass event
        const passEvent = {
          id: generateBallEventId(),
          type: 'pass' as const,
          fromPlayerId: currentCarrier.id,
          fromPlayerType: currentCarrier.type,
          toPlayerId: targetPlayer.id,
          toPlayerType: targetPlayer.type,
          startPosition: {
            x: dims.toRelativeX(startPos.x),
            y: dims.toRelativeY(startPos.y)
          },
          endPosition: {
            x: dims.toRelativeX(endPos.x),
            y: dims.toRelativeY(endPos.y)
          },
          startTimestamp: Date.now(),
          durationMs: 600,
          easing: 'easeOutCubic' as const
        }
        sequence.ballEvents.push(passEvent)

        // Update editing state so future sequences know who has the ball
        gameState.setBallCarrier(targetPlayer)
        sequence.ballState = JSON.parse(JSON.stringify(gameState.ball.value))
      }
    }

    event.preventDefault()
  }
}

// NEW: Save/Load handlers
const handleSavePlay = async () => {
  const playName = prompt('Enter a name for this play:')
  if (!playName) return
  
  const success = await gameState.saveGameState(playName)
  if (success) {
    alert('Play saved successfully!')
  } else {
    alert('Failed to save play. Please try again.')
  }
}

// Load Play removed

// Lifecycle
onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('mouseup', handleGlobalMouseUp)
  document.addEventListener('click', handleClickOutside)

  // Initialize canvas size based on container
  updateCanvasSize()
  // Ensure at least one sequence exists when starting in Sequence Mode
  if (gameState.isSequenceMode.value && gameState.availableSequences.value.length === 0) {
    gameState.addSequence()
  }

  // Watch for playback data changes
  watch(() => props.playbackData, (newValue) => {
    if (newValue.length > 0) {
      startPlayback()
    } else {
      stopPlayback()
    }
  }, { immediate: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
  document.removeEventListener('click', handleClickOutside)
  stopPlayback()
  animationState.stopAllPlayerLoops()
})


const handleResize = () => {
  updateCanvasSize()
}

const updateCanvasSize = () => {
  const container = rugbyCanvas.value?.$el?.parentElement
  if (!container) return
  
  const containerWidth = container.clientWidth
  const fieldRatio = 70/100 // Standard rugby field ratio (width/height)
  
  let newWidth, newHeight
  
  // Fit to container; zoom is applied inside canvas by RugbyCanvas
  const baseWidth = Math.min(containerWidth - 40, 1000) // Account for padding
  // Maintain 40% extra width for substitutes (20% each side)
  newWidth = Math.round(baseWidth * 1.4)
  // Add vertical letterboxing so the field sits perfectly centered with even
  // buffer above and below in the black canvas at 100% view.
  // Match side padding visually: 20% of field width per side.
  const baseFieldHeight = Math.round(baseWidth / fieldRatio)
  const verticalBufferPerSide = Math.round(baseWidth * 0.2)
  newHeight = baseFieldHeight + (verticalBufferPerSide * 2)
  
  // Update canvas configuration
  gameState.updateCanvasSize(newWidth, newHeight)
  
  // Force redraw
  rugbyCanvas.value?.redraw()
}

// No zoom coupling here; RugbyCanvas handles viewport transforms

// Playback functionality (simplified)
let playbackInterval: number | null = null
let currentPlaybackIndex = 0

const startPlayback = () => {
  if (props.playbackData.length === 0) return
  
  // Initialize playback state
  gameState.resetToDefaults()
  currentPlaybackIndex = 0
  
  // Start playback loop
  playbackInterval = window.setInterval(() => {
    if (currentPlaybackIndex >= props.playbackData.length) {
      stopPlayback()
      return
    }
    
    const currentState = props.playbackData[currentPlaybackIndex]
    // Update player positions based on playback data
    // ... playback logic
    
    currentPlaybackIndex++
  }, 100)
}

const stopPlayback = () => {
  if (playbackInterval) {
    clearInterval(playbackInterval)
    playbackInterval = null
  }
  currentPlaybackIndex = 0
}

// Expose minimal API for parent menu controls
const openAddPlayersDialog = (type: 'attacking' | 'defensive') => {
  handleAddPlayers(type)
}

const toggleRecording = () => {
  handleToggleRecording()
}

const saveCurrentPlay = () => {
  handleSavePlay()
}

const openClearPlayConfirm = () => {
  showClearPlayConfirm.value = true
}

defineExpose({
  openAddPlayersDialog,
  setAttacking,
  toggleRecording,
  saveCurrentPlay,
  openClearPlayConfirm,
  // Expose game state for sidebar components
  gameState,
  animationState,
  computedGameState,
  uiState,
  // Expose handlers for sidebar components
  handleRunCurrentPhase,
  handleRunFullPlay,
  handleSequenceRun,
  handleSequenceReset,
  handleRecordFullPlay,
  handlePhaseSelect,
  handlePhaseAdd,
  handlePhaseRemove,
  handleSequenceSelect,
  handleSequenceAdd,
  handleSequenceRemove,
  handlePlayerToggleLoop,
  handleSelectAllPlayers,
  handleDeselectAllPlayers,
  handlePlayerOptionsMode,
  handlePlayerOptionsPathVisibility,
  handlePlayerOptionsSpeed,
  handlePlayerOptionsDelay,
  handlePlayerOptionsDelayReset,
  handlePlayerOptionsClearPath,
  handleSetTimedPass,
  handleClearTimedPass,
})
</script>

<style scoped>
.rugby-pitch-container {
  position: relative;
  width: 100%;
  margin: 0 auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-2);
  padding: 2rem;
}

/* Removed on-canvas attacking toggle; now handled in sidebar */

.rugby-pitch-container.minimized { max-width: none; }

.canvas-wrapper {
  position: relative;
}

/* Zoom & Pan Control - Top Left Corner */
.zoom-pan-container {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
}

.zoom-pan-trigger {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  cursor: pointer;
  transition: background-color .2s var(--ease), border-color .2s var(--ease), box-shadow .2s var(--ease);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-2);
}

.zoom-pan-trigger::after {
  content: "";
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  border-radius: inherit;
  transform: scale(0);
  transition: transform .28s var(--ease), opacity .4s var(--ease);
}

.zoom-pan-trigger:active::after {
  opacity: .12;
  transform: scale(1);
}

.zoom-pan-trigger:hover {
  background: var(--btn-hover-bg);
  border-color: var(--border-strong);
}

.zoom-pan-trigger.active {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: transparent;
}

.zoom-pan-menu {
  position: absolute;
  top: 52px;
  left: 0;
  min-width: 220px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-2);
  z-index: 100;
}

.zoom-pan-content {
  padding: 1rem;
}

.control-section {
  margin-bottom: 1rem;
}

.control-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  cursor: pointer;
  transition: background-color .2s var(--ease), border-color .2s var(--ease), opacity .2s var(--ease);
  position: relative;
  overflow: hidden;
}

.control-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  border-radius: inherit;
  transform: scale(0);
  transition: transform .28s var(--ease), opacity .4s var(--ease);
}

.control-btn:active::after {
  opacity: .12;
  transform: scale(1);
}

.control-btn:hover:not(:disabled) {
  background: var(--btn-hover-bg);
  border-color: var(--border-strong);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.zoom-display {
  flex: 1;
  text-align: center;
  color: var(--btn-text);
  font-size: 0.875rem;
  font-weight: 600;
  user-select: none;
  letter-spacing: 0.01em;
}

.pan-toggle-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  width: 100%;
  min-height: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: .01em;
  transition: background-color .2s var(--ease), border-color .2s var(--ease), box-shadow .2s var(--ease), color .2s var(--ease);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.pan-toggle-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  border-radius: inherit;
  transform: scale(0);
  transition: transform .28s var(--ease), opacity .4s var(--ease);
}

.pan-toggle-btn:active::after {
  opacity: .12;
  transform: scale(1);
}

.pan-toggle-btn:hover {
  background: var(--btn-hover-bg);
  border-color: var(--border-strong);
}

.pan-toggle-btn.active {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: transparent;
}

/* Popup animation */
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.2s var(--ease), transform 0.2s var(--ease);
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .rugby-pitch-container {
    padding: 1rem;
  }

  .zoom-pan-container {
    top: 0.5rem;
    left: 0.5rem;
  }

  .zoom-pan-trigger {
    width: 40px;
    height: 40px;
  }

  .zoom-pan-menu {
    min-width: 200px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
  }
}
</style> 
