import { ref, computed, reactive, watch } from 'vue'
import type { 
  Player, 
  Ball, 
  Phase, 
  Sequence, 
  CanvasConfig,
  PlayerState,
  PlayerType
} from '../types/game'
import { CANVAS_CONFIG } from '../types/game'

export function useGameState() {
  const DRAFT_KEY = 'squiggle_draft'
  // Core game state
  const players = ref<Player[]>([])
  const ball = ref<Ball>({
    x: 0,
    y: 0,
    attachedTo: null
  })

  // Which team is considered the attacking side for number-key passes
  const attackingType = ref<PlayerType>((() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('squiggle_attackingType') : null
      return (saved === 'defensive' || saved === 'attacking') ? saved : 'attacking'
    } catch {
      return 'attacking'
    }
  })())
  
  const phases = ref<Phase[]>([{
    id: 1,
    name: 'Phase 1',
    playerStates: [],
    ballState: { x: 0, y: 0, attachedTo: null },
    sequences: [{
      id: 1,
      name: 'Sequence 1',
      activePlayerIds: [],
      ballEvents: [],
      isActive: false,
      playerData: {},
      ballState: { x: 0, y: 0, attachedTo: null },
      finalPlayerPositions: {},
      startingPlayerPositions: {}
    }]
  }])
  
  const currentPhase = ref(1)
  const currentSequence = ref(1)
  const isSequenceMode = ref(true)
  const isRecording = ref(false)
  const isFullscreen = ref(false)
  
  // Canvas configuration
  const canvasConfig = reactive<CanvasConfig>({
    width: CANVAS_CONFIG.BASE_WIDTH * 1.4,
    height: CANVAS_CONFIG.BASE_WIDTH / CANVAS_CONFIG.FIELD_RATIO,
    fieldWidth: CANVAS_CONFIG.BASE_WIDTH,
    fieldHeight: CANVAS_CONFIG.BASE_WIDTH / CANVAS_CONFIG.FIELD_RATIO,
    playerRadius: 0,
    ballRadius: 0
  })
  
  // Computed properties
  const currentPhaseData = computed(() => {
    return phases.value.find(p => p.id === currentPhase.value)
  })
  
  const currentSequenceData = computed(() => {
    const phase = currentPhaseData.value
    if (!phase || !phase.sequences) return null
    return phase.sequences.find(s => s.id === currentSequence.value)
  })
  
  const availableSequences = computed(() => {
    const phase = currentPhaseData.value
    return phase?.sequences || []
  })
  
  const playersWithPaths = computed(() => {
    return players.value.filter(player => player.path && player.path.length > 0)
  })
  
  const hasAnyPaths = computed(() => 
    players.value.some(player => player.path && player.path.length > 0)
  )
  
  const hasAnySequencesInCurrentPhase = computed(() => {
    const phase = currentPhaseData.value
    return phase?.sequences && phase.sequences.length > 0 && 
           phase.sequences.some(seq => seq.activePlayerIds.length > 0)
  })

  // Local draft persistence (preserve current play across refresh)
  const persistDraft = () => {
    try {
      const draft = {
        players: players.value,
        ball: ball.value,
        phases: phases.value,
        currentPhase: currentPhase.value,
        currentSequence: currentSequence.value,
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch (_) {
      // ignore
    }
  }

  const loadDraftIfPresent = () => {
    console.log('[loadDraftIfPresent] CALLED')
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) {
        console.log('[loadDraftIfPresent] No draft found')
        return
      }
      const draft = JSON.parse(raw)
      if (draft && draft.players && draft.phases && draft.ball) {
        console.log('[loadDraftIfPresent] Loading draft', {
          ballFromDraft: draft.ball
        })
        players.value = JSON.parse(JSON.stringify(draft.players))
        ball.value = JSON.parse(JSON.stringify(draft.ball))
        phases.value = JSON.parse(JSON.stringify(draft.phases))
        currentPhase.value = draft.currentPhase || 1
        currentSequence.value = draft.currentSequence || 1
        console.log('[loadDraftIfPresent] Ball after load', {
          x: ball.value.x,
          y: ball.value.y
        })

        // Migration: Ensure all players have path mode as default
        players.value.forEach(player => {
          if (!player.mode || player.mode === 'drag') {
            player.mode = 'path'
          }
        })

        // Migration: Ensure Phase 1 always has at least Sequence 1
        // This handles old saved states that didn't have automatic sequence creation
        const phase1 = phases.value.find(p => p.id === 1)
        if (phase1 && (!phase1.sequences || phase1.sequences.length === 0)) {
          phase1.sequences = [{
            id: 1,
            name: 'Sequence 1',
            activePlayerIds: [],
            ballEvents: [],
            isActive: false,
            playerData: {},
            ballState: JSON.parse(JSON.stringify(ball.value)),
            finalPlayerPositions: {},
            startingPlayerPositions: {}
          }]
        }
      }
    } catch (_) {
      // ignore corrupt draft
    }
  }

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
  }

  // Helpers to manage attacking side
  const setAttackingType = (type: PlayerType) => {
    attackingType.value = type
    try { localStorage.setItem('squiggle_attackingType', type) } catch {}
  }

  const toggleAttackingType = () => {
    setAttackingType(attackingType.value === 'attacking' ? 'defensive' : 'attacking')
  }
  
  // Player management
  const updateSequenceStartingPositionsForPlayer = (player: Player) => {
    const phase = currentPhaseData.value
    if (!phase || !phase.sequences) return

    const playerKey = `${player.type}-${player.id}`
    phase.sequences.forEach(sequence => {
      if (!sequence.startingPlayerPositions) {
        sequence.startingPlayerPositions = {}
      }
      sequence.startingPlayerPositions[playerKey] = { x: player.x, y: player.y }
    })
  }

  const addPlayer = (type: 'attacking' | 'defensive', position: { x: number, y: number }) => {
    const existingPlayersOfType = players.value.filter(p => p.type === type)
    const nextId = existingPlayersOfType.length > 0 ? 
      Math.max(...existingPlayersOfType.map(p => p.id)) + 1 : 1
    
    const assignedNumber = getNextAvailableNumber(type)
    
    const newPlayer: Player = {
      ...position,
      type,
      id: nextId,
      assignedNumber,
      isSelected: false,
      speed: 100,
      mode: 'path',
      sequenceDelay: 0,
      pathVisible: true,
      originalPosition: { x: position.x, y: position.y },
      playStartPosition: { x: position.x, y: position.y } // Set the immutable start position for the play
    }
    
    players.value.push(newPlayer)
    updateSequenceStartingPositionsForPlayer(newPlayer)
    updateCanvasRadii()
  }
  
  const removePlayer = (playerId: number, type: 'attacking' | 'defensive') => {
    const index = players.value.findIndex(p => p.id === playerId && p.type === type)
    if (index !== -1) {
      const phase = currentPhaseData.value
      const playerKey = `${type}-${playerId}`
      if (phase && phase.sequences) {
        phase.sequences.forEach(sequence => {
          if (sequence.startingPlayerPositions) {
            delete sequence.startingPlayerPositions[playerKey]
          }
        })
      }
      players.value.splice(index, 1)
    }
  }

  const capturePlayerStartingPosition = (player: Player) => {
    const snapshot = { x: player.x, y: player.y }
    player.originalPosition = { ...snapshot }
    player.playStartPosition = { ...snapshot }
    updateSequenceStartingPositionsForPlayer(player)
  }
  
  const getNextAvailableNumber = (type: PlayerType): number => {
    // Determine numbering per side, starting from 1 for each team
    const assignedNumbers = players.value
      .filter(p => p.type === type)
      .map(p => p.assignedNumber)
      .filter(n => n !== undefined)
    
    // Try numbers 1-9 first, then 0
    for (let i = 1; i <= 9; i++) {
      if (!assignedNumbers.includes(i)) {
        return i
      }
    }
    
    // If all 1-9 are taken, use 0
    if (!assignedNumbers.includes(0)) {
      return 0
    }
    
    // If all numbers are taken, return undefined
    return undefined as any
  }
  
  // Ball management
  const updateBallPosition = (position: { x: number, y: number }) => {
    ball.value.x = position.x
    ball.value.y = position.y
  }
  
  // UNIFIED: Single function to handle all ball carrier state
  const setBallCarrier = (
    player: Player | null,
    opts: { updateTimedPassSource?: boolean } = {}
  ) => {
    console.log('[setBallCarrier] CALLED', {
      player: player ? `${player.type}-${player.id}` : null,
      playerPos: player ? { x: player.x, y: player.y } : null,
      ballPosBefore: { x: ball.value.x, y: ball.value.y },
      opts
    })

    const shouldUpdateTimedPass = opts.updateTimedPassSource ?? true
    const previousAttachment = ball.value.attachedTo
    const previousCarrier = previousAttachment
      ? players.value.find(p => p.id === previousAttachment.id && p.type === previousAttachment.type) || null
      : null

    // Clear all players' carrying state first
    players.value.forEach(p => {
      p.isCarryingBall = false
    })

    if (player) {
      // Set the new ball carrier
      player.isCarryingBall = true
      ball.value.attachedTo = {
        type: player.type,
        id: player.id
      }

      // Position ball near player
      const playerRadius = canvasConfig.playerRadius
      ball.value.x = player.x + playerRadius * 0.8
      ball.value.y = player.y + playerRadius * 0.4
    } else {
      // Detach but PRESERVE position explicitly
      const preservedX = ball.value.x
      const preservedY = ball.value.y
      ball.value.attachedTo = null
      ball.value.x = preservedX
      ball.value.y = preservedY

      console.log('[setBallCarrier] Ball detached, position preserved:', {
        x: ball.value.x,
        y: ball.value.y
      })
    }

    console.log('[setBallCarrier] AFTER', {
      ballPosAfter: { x: ball.value.x, y: ball.value.y },
      attachedTo: ball.value.attachedTo
    })

    if (
      shouldUpdateTimedPass &&
      previousCarrier &&
      player &&
      (previousCarrier.id !== player.id || previousCarrier.type !== player.type)
    ) {
      players.value.forEach(p => {
        if (!p.timedPass) return
        if (
          p.timedPass.fromPlayerId === previousCarrier.id &&
          p.timedPass.fromPlayerType === previousCarrier.type
        ) {
          p.timedPass.fromPlayerId = player.id
          p.timedPass.fromPlayerType = player.type

          const seq = currentSequenceData.value
          if (seq) {
            const playerKey = `${p.type}-${p.id}`
            const stored = seq.playerData[playerKey]
            if (
              stored?.timedPass &&
              stored.timedPass.fromPlayerId === previousCarrier.id &&
              stored.timedPass.fromPlayerType === previousCarrier.type
            ) {
              stored.timedPass.fromPlayerId = player.id
              stored.timedPass.fromPlayerType = player.type
            }
          }
        }
      })
    }
  }
  
  // Legacy functions for backward compatibility
  const attachBallToPlayer = (player: Player, opts?: { updateTimedPassSource?: boolean }) => {
    setBallCarrier(player, opts)
  }
  
  const detachBall = (opts?: { updateTimedPassSource?: boolean }) => {
    setBallCarrier(null, opts)
  }
  
  // Phase management
  const selectPhase = (phaseId: number) => {
    saveCurrentPhaseState()
    currentPhase.value = phaseId
    loadPhaseState(phaseId)
  }
  
  const addPhase = () => {
    saveCurrentPhaseState()

    const newPhaseId = phases.value.length > 0 ?
      Math.max(...phases.value.map(p => p.id)) + 1 : 1

    phases.value.push({
      id: newPhaseId,
      name: `Phase ${newPhaseId}`,
      playerStates: [],
      ballState: JSON.parse(JSON.stringify(ball.value)),
      sequences: []
    })

    selectPhase(newPhaseId)

    // Automatically create the first sequence for the new phase
    addSequence()
  }
  
  const removePhase = (phaseId: number) => {
    if (phases.value.length <= 1) return false
    
    const indexToRemove = phases.value.findIndex(p => p.id === phaseId)
    if (indexToRemove !== -1) {
      phases.value.splice(indexToRemove, 1)
      
      const newIndex = Math.max(0, indexToRemove - 1)
      if (phases.value.length > 0) {
        selectPhase(phases.value[newIndex].id)
      }
      return true
    }
    return false
  }
  
  const saveCurrentPhaseState = () => {
    const currentPhaseData = phases.value.find(p => p.id === currentPhase.value)
    if (currentPhaseData) {
      currentPhaseData.playerStates = JSON.parse(JSON.stringify(players.value))
      currentPhaseData.ballState = JSON.parse(JSON.stringify(ball.value))
      currentPhaseData.currentSequenceId = currentSequence.value
    }
  }
  
  const loadPhaseState = (phaseId: number) => {
    const phaseData = phases.value.find(p => p.id === phaseId)
    if (phaseData) {
      if (phaseData.currentSequenceId && phaseData.sequences.some(s => s.id === phaseData.currentSequenceId)) {
        currentSequence.value = phaseData.currentSequenceId
      } else {
        currentSequence.value = phaseData.sequences.length > 0 ? phaseData.sequences[0].id : 1
      }
      
      if (phaseData.playerStates.length > 0) {
        players.value = JSON.parse(JSON.stringify(phaseData.playerStates))
        ball.value = JSON.parse(JSON.stringify(phaseData.ballState))
      } else if (phaseId > 1) {
        // Inherit from previous phase
        const previousPhase = phases.value.find(p => p.id === phaseId - 1)
        if (previousPhase && previousPhase.playerStates.length > 0) {
          players.value = JSON.parse(JSON.stringify(previousPhase.playerStates))
          ball.value = JSON.parse(JSON.stringify(previousPhase.ballState))

          // Set the new originalPosition for each player to their current position
          // (which is the final position from the previous phase),
          // and clear the path they just ran to prepare for the new phase.
          players.value.forEach(player => {
            player.originalPosition = { x: player.x, y: player.y }
            player.path = []
            player.mode = 'path'
            player.isSelected = false
            player.timedPass = undefined // Clear old timed pass data
          })
        }
      }
      
      // Restore sequence relationships
      if (phaseData.sequences && phaseData.sequences.length > 0) {
        const currentSequenceData = phaseData.sequences.find(s => s.id === currentSequence.value)
        if (currentSequenceData && currentSequenceData.activePlayerIds) {
          players.value.forEach(player => {
            const playerId = `${player.type}-${player.id}`
            player.isLooping = currentSequenceData.activePlayerIds.includes(playerId)
          })
        }
      }
    }
  }
  
  // Sequence management
  const selectSequence = (sequenceId: number) => {
    currentSequence.value = sequenceId
    
    const seq = currentSequenceData.value
    if (seq) {
      loadPlayerDataFromSequence(seq)
      players.value.forEach(p => {
        const playerId = `${p.type}-${p.id}`
        p.isLooping = seq.activePlayerIds.includes(playerId)
      })
    }
  }
  
  const addSequence = () => {
    const phase = currentPhaseData.value
    if (!phase) return

    const newSequenceId = phase.sequences.length > 0 ?
      Math.max(...phase.sequences.map(s => s.id)) + 1 : 1

    // Capture current ball state with actual position
    const currentBallState = {
      x: ball.value.x,
      y: ball.value.y,
      attachedTo: ball.value.attachedTo ? { ...ball.value.attachedTo } : null
    }

    console.log('[addSequence] Creating new sequence with ball state:', currentBallState)

    const newSequence: Sequence = {
      id: newSequenceId,
      name: `Sequence ${newSequenceId}`,
      activePlayerIds: [],
      ballEvents: [],
      isActive: false,
      playerData: {},
      ballState: currentBallState,
      finalPlayerPositions: {},
      startingPlayerPositions: {}
    }

    // Snapshot current positions
    players.value.forEach(player => {
      const playerId = `${player.type}-${player.id}`
      newSequence.startingPlayerPositions![playerId] = { x: player.x, y: player.y }
    })

    phase.sequences.push(newSequence)
    selectSequence(newSequenceId)
  }
  
  const removeSequence = (sequenceId: number) => {
    const phase = currentPhaseData.value
    if (!phase || phase.sequences.length === 0) return false
    
    const indexToRemove = phase.sequences.findIndex(s => s.id === sequenceId)
    if (indexToRemove !== -1) {
      phase.sequences.splice(indexToRemove, 1)
      
      if (phase.sequences.length > 0) {
        const newIndex = Math.max(0, indexToRemove - 1)
        selectSequence(phase.sequences[newIndex].id)
      } else {
        currentSequence.value = 1
      }
      return true
    }
    return false
  }
  
  const loadPlayerDataFromSequence = (sequence: Sequence) => {
    console.log('[loadPlayerDataFromSequence] CALLED', {
      sequenceName: sequence.name,
      hasBallState: !!sequence.ballState,
      ballStateSaved: sequence.ballState,
      ballPosBefore: { x: ball.value.x, y: ball.value.y }
    })

    if (!sequence.playerData) return

    players.value.forEach(player => {
      const playerId = `${player.type}-${player.id}`
      const savedData = sequence.playerData[playerId]

      if (savedData) {
        player.path = savedData.path ? [...savedData.path] : []
        player.speed = savedData.speed || 100
        player.sequenceDelay = savedData.sequenceDelay || 0
        player.mode = savedData.mode || 'path'
        player.isLooping = sequence.activePlayerIds.includes(playerId)
        player.timedPass = savedData.timedPass ? JSON.parse(JSON.stringify(savedData.timedPass)) : undefined
      } else {
        // Reset to defaults
        player.path = []
        player.originalPosition = { x: player.x, y: player.y }
        player.speed = 100
        player.sequenceDelay = 0
        player.mode = 'path'
        player.isLooping = false
        player.timedPass = undefined
      }
    })

    // Restore ball state
    if (sequence.ballState) {
      console.log('[loadPlayerDataFromSequence] Restoring ball state from sequence', sequence.ballState)
      ball.value.x = sequence.ballState.x
      ball.value.y = sequence.ballState.y
      ball.value.attachedTo = sequence.ballState.attachedTo ?
        { ...sequence.ballState.attachedTo } : null
    }

    console.log('[loadPlayerDataFromSequence] AFTER', {
      ballPosAfter: { x: ball.value.x, y: ball.value.y }
    })
  }
  
  // Canvas management
  const updateCanvasSize = (width: number, height: number) => {
    canvasConfig.width = width
    canvasConfig.height = height
    canvasConfig.fieldWidth = width / 1.4
    canvasConfig.fieldHeight = height
    updateCanvasRadii()

    // Update ball position to center
    ball.value.x = canvasConfig.fieldWidth * 0.5
    ball.value.y = canvasConfig.fieldHeight * 0.5

    // Update all sequence ball states to match the new centered position
    phases.value.forEach(phase => {
      if (phase.sequences) {
        phase.sequences.forEach(sequence => {
          if (sequence.ballState && sequence.ballState.x === 0 && sequence.ballState.y === 0) {
            sequence.ballState.x = ball.value.x
            sequence.ballState.y = ball.value.y
          }
        })
      }
    })
  }
  
  const updateCanvasRadii = () => {
    canvasConfig.playerRadius = Math.min(canvasConfig.width, canvasConfig.height) * 
      CANVAS_CONFIG.PLAYER_RADIUS_RATIO
    canvasConfig.ballRadius = Math.min(canvasConfig.width, canvasConfig.height) * 
      CANVAS_CONFIG.BALL_RADIUS_RATIO
  }
  
  const toggleFullscreen = () => {
    // Store current player positions relative to field dimensions
    const playerPositions = players.value.map(player => ({
      ...player,
      relativeX: player.x / canvasConfig.fieldWidth,
      relativeY: player.y / canvasConfig.fieldHeight
    }))
    
    isFullscreen.value = !isFullscreen.value
    
    // Canvas size will be updated externally
    // Then restore relative positions
    const newFieldWidth = canvasConfig.width / 1.4
    const newFieldHeight = canvasConfig.height
    
    players.value = playerPositions.map(player => ({
      ...player,
      x: player.relativeX * newFieldWidth,
      y: player.relativeY * newFieldHeight
    }))
  }
  
  // Utility functions
  const getPlayerStates = (): PlayerState[] => {
    const timestamp = Date.now()
    const { width, fieldWidth, fieldHeight } = canvasConfig
    const fieldX = (width - fieldWidth) / 2
    const fieldY = (canvasConfig.height - fieldHeight) / 2

    return [
      // Ball state
      {
        playerId: 'ball',
        position: { x: ball.value.x, y: ball.value.y },
        relativePosition: {
          x: (ball.value.x - fieldX) / fieldWidth,
          y: (ball.value.y - fieldY) / fieldHeight,
        },
        timestamp,
        ballState: {
          position: { x: ball.value.x, y: ball.value.y },
          attachedTo: ball.value.attachedTo ? { ...ball.value.attachedTo } : null
        }
      },
      // Player states
      ...players.value.map(player => ({
        playerId: `${player.type}-${player.id}`,
        position: { x: player.x, y: player.y },
        relativePosition: {
          x: (player.x - fieldX) / fieldWidth,
          y: (player.y - fieldY) / fieldHeight,
        },
        timestamp
      }))
    ]
  }
  
  // NEW: Save current game state to backend
  const saveGameState = async (name: string): Promise<boolean> => {
    try {
      // Ensure current phase is saved
      saveCurrentPhaseState()
      
      const gameState = {
        name,
        phases: phases.value,
        players: players.value,
        ball: ball.value,
        currentPhase: currentPhase.value,
        currentSequence: currentSequence.value,
        canvasConfig: { ...canvasConfig }
      }
      
      const response = await fetch('http://localhost:8080/api/plays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          playerStates: getPlayerStates(),
          gameData: gameState
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('Failed to save game state:', error)
      return false
    }
  }

  const resetToDefaults = () => {
    players.value = []
    ball.value = {
      x: canvasConfig.fieldWidth * 0.5,
      y: canvasConfig.fieldHeight * 0.5,
      attachedTo: null
    }
    phases.value = [{
      id: 1,
      name: 'Phase 1',
      playerStates: [],
      ballState: { x: 0, y: 0, attachedTo: null },
      sequences: [{
        id: 1,
        name: 'Sequence 1',
        activePlayerIds: [],
        ballEvents: [],
        isActive: false,
        playerData: {},
        ballState: { x: 0, y: 0, attachedTo: null },
        finalPlayerPositions: {},
        startingPlayerPositions: {}
      }]
    }]
    currentPhase.value = 1
    currentSequence.value = 1
    isSequenceMode.value = true
    isRecording.value = false
    clearDraft()
  }
  
  // Initialize draft and autosave changes
  loadDraftIfPresent()
  watch([players, phases, ball, currentPhase, currentSequence], persistDraft, { deep: true })
  
  return {
    // State
    players,
    ball,
    phases,
    currentPhase,
    currentSequence,
    isSequenceMode,
    isRecording,
    isFullscreen,
    canvasConfig,
    attackingType,
    
    // Computed
    currentPhaseData,
    currentSequenceData,
    availableSequences,
    playersWithPaths,
    hasAnyPaths,
    hasAnySequencesInCurrentPhase,
    
    // Methods
    addPlayer,
    removePlayer,
    updateBallPosition,
    setBallCarrier,
    attachBallToPlayer,
    detachBall,
    selectPhase,
    addPhase,
    removePhase,
    selectSequence,
    addSequence,
    removeSequence,
    updateCanvasSize,
    toggleFullscreen,
    getPlayerStates,
    resetToDefaults,
    capturePlayerStartingPosition,
    saveGameState,
    clearDraft,
    persistDraft,
    setAttackingType,
    toggleAttackingType
  }
} 
