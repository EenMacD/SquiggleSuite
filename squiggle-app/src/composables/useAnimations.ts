import { ref, computed, type Ref } from 'vue'
import type {
  Player,
  Ball,
  Sequence,
  PathPoint,
  CanvasConfig,
  BallPassEvent,
  BallEventEasing,
  TimedPass
} from '../types/game'
import type { PlayerState } from '../types/play'
import { ANIMATION_CONFIG } from '../types/game'

export function useAnimations(
  players: Ref<Player[]>,
  ball: Ref<Ball>,
  canvasConfig: Ref<CanvasConfig>,
  emit: (event: string, ...args: any[]) => void,
  setBallCarrier: (player: Player | null, opts?: { updateTimedPassSource?: boolean }) => void,
  recordBallEvent?: (event: BallPassEvent) => void
) {
  // Simplified animation state
  const animationState = ref({
    isRunning: false,
    type: 'none' as 'none' | 'sequence' | 'phase' | 'fullPlay',
    currentStep: 0,
    totalSteps: 0
  })

  // Legacy compatibility (can be removed later)
  const isPlayRunning = computed(() => animationState.value.isRunning)
  const isRunningCurrentPhase = computed(() => animationState.value.type === 'phase')
  const isRunningFullPlay = computed(() => animationState.value.type === 'fullPlay')

  // Path calculation utilities
  const calculatePathLength = (path: PathPoint[]): number => {
    let length = 0
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x
      const dy = path[i].y - path[i - 1].y
      length += Math.sqrt(dx * dx + dy * dy)
    }
    return length
  }

  const createInterpolatedPath = (path: PathPoint[], duration: number): PathPoint[] => {
    const interpolatedPath: PathPoint[] = []
    let accumulatedDistance = 0

    // Add starting point
    interpolatedPath.push({ ...path[0], timestamp: 0 })

    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1]
      const curr = path[i]
      const dx = curr.x - prev.x
      const dy = curr.y - prev.y
      const segmentLength = Math.sqrt(dx * dx + dy * dy)

      accumulatedDistance += segmentLength
      const pathLength = calculatePathLength(path)
      const timestamp = (accumulatedDistance / pathLength) * duration

      interpolatedPath.push({ x: curr.x, y: curr.y, timestamp })
    }

    return interpolatedPath
  }

  const generateBallEventId = () => {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `ball_evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }

  const DEFAULT_EASING: BallEventEasing = 'easeOutCubic'

  interface BallPassAnimationOptions {
    fromPlayer?: Player | null
    toPlayer?: Player | null
    duration?: number
    easing?: BallEventEasing
    recordEvent?: boolean
    eventType?: 'pass' | 'kick'
  }

  const createBallPassEvent = (
    startPosition: { x: number, y: number },
    endPosition: { x: number, y: number },
    options: BallPassAnimationOptions,
    duration: number
  ): BallPassEvent => ({
    id: generateBallEventId(),
    type: options.eventType ?? 'pass',
    fromPlayerId: options.fromPlayer?.id ?? null,
    fromPlayerType: options.fromPlayer?.type ?? null,
    toPlayerId: options.toPlayer?.id ?? null,
    toPlayerType: options.toPlayer?.type ?? null,
    startPosition: { ...startPosition },
    endPosition: { ...endPosition },
    startTimestamp: Date.now(),
    durationMs: duration,
    easing: options.easing ?? DEFAULT_EASING
  })

  const findPlayer = (type: 'attacking' | 'defensive', id: number): Player | null => {
    return players.value.find(p => p.type === type && p.id === id) || null
  }

  const getCurrentBallCarrier = (): Player | null => {
    const attached = ball.value.attachedTo
    if (!attached) {
      return null
    }
    return findPlayer(attached.type, attached.id)
  }

  const getRecordedPasser = (timedPass: TimedPass): Player | null => {
    if (timedPass.fromPlayerId === undefined || timedPass.fromPlayerType === undefined) {
      return null
    }
    return findPlayer(timedPass.fromPlayerType, timedPass.fromPlayerId)
  }

  // Unified player animation function
  const animatePlayerPath = (
    player: Player,
    options: {
      isRecording?: boolean
      isCarryingBall?: boolean
      hasTimedPass?: boolean
    } = {}
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!player.path || player.path.length === 0 || !player.originalPosition || !player.speed) {
        resolve()
        return
      }
      if (options.hasTimedPass && !player.timedPass) {
        resolve(); return
      }

      player.isAnimating = true

      const startTime = Date.now()
      const pathLength = calculatePathLength(player.path)
      const actualSpeed = (ANIMATION_CONFIG.BASE_SPEED * player.speed!) / 100
      const playerDuration = (pathLength / actualSpeed) * 1000

      const interpolatedPath = createInterpolatedPath(player.path, playerDuration)
      let currentSegment = 0
      let lastEmitTime = startTime
      const playerRadius = canvasConfig.value.playerRadius
      let timedPassExecuted = false

      const animate = () => {
        const elapsed = Date.now() - startTime

        if (elapsed >= playerDuration || currentSegment >= interpolatedPath.length - 1) {
          // Animation complete
          player.isAnimating = false
          const lastPoint = interpolatedPath[interpolatedPath.length - 1]
          player.x = lastPoint.x
          player.y = lastPoint.y

          // Ensure ball follows to final position if player is carrying it
          if (player.isCarryingBall) {
            ball.value.x = player.x + playerRadius * 0.8
            ball.value.y = player.y + playerRadius * 0.4
          }

          // Emit final state if recording
          if (options.isRecording) {
            emitPlayerStates(true)
          }

          resolve()
          return
        }

        // Find current segment
        while (currentSegment < interpolatedPath.length - 1 &&
          interpolatedPath[currentSegment + 1].timestamp !== undefined &&
          elapsed >= interpolatedPath[currentSegment + 1].timestamp!) {
          currentSegment++
        }

        // Check for timed pass trigger
        if (options.hasTimedPass && !timedPassExecuted && player.timedPass &&
          currentSegment >= player.timedPass.pathIndex) {
          const recordedPasser = getRecordedPasser(player.timedPass)
          const liveCarrier = getCurrentBallCarrier()

          // Defer pass if the designated passer doesn't have the ball yet
          const canThrow = !recordedPasser || (liveCarrier &&
            liveCarrier.id === recordedPasser.id &&
            liveCarrier.type === recordedPasser.type)

          if (canThrow) {
            timedPassExecuted = true
            const passer = liveCarrier || recordedPasser

            if (passer) {
              passer.isCarryingBall = false
            }

            const passOrigin = passer
              ? getHandPos(passer)
              : { x: ball.value.x, y: ball.value.y }

            // Animate ball pass to this player
            animateBallPass(passOrigin, player, {
              fromPlayer: passer ?? undefined,
              toPlayer: player,
              recordEvent: options.isRecording
            }).then(() => {
              // Ball is now with this player
              player.isCarryingBall = true
            })
          }
        }

        // Interpolate between current and next point
        if (currentSegment < interpolatedPath.length - 1) {
          const current = interpolatedPath[currentSegment]
          const next = interpolatedPath[currentSegment + 1]

          if (current.timestamp !== undefined && next.timestamp !== undefined) {
            const segmentProgress = (elapsed - current.timestamp!) / (next.timestamp! - current.timestamp!)
            const clampedProgress = Math.max(0, Math.min(1, segmentProgress))

            player.x = current.x + (next.x - current.x) * clampedProgress
            player.y = current.y + (next.y - current.y) * clampedProgress

            // Move ball with player if they're carrying it
            if (player.isCarryingBall) {
              const newBallX = player.x + playerRadius * 0.8
              const newBallY = player.y + playerRadius * 0.4

              // Log only on significant changes to avoid console spam
              if (currentSegment === 0 && elapsed < 100) {
                console.log('[animatePlayerPath] Ball following player', {
                  player: `${player.type}-${player.id}`,
                  playerPos: { x: player.x, y: player.y },
                  ballPos: { x: newBallX, y: newBallY }
                })
              }

              ball.value.x = newBallX
              ball.value.y = newBallY
            }
          }
        }

        // Emit states during animation for recording (throttled to every 100ms)
        if (options.isRecording && Date.now() - lastEmitTime > 100) {
          emitPlayerStates(options.isRecording)
          lastEmitTime = Date.now()
        }

        requestAnimationFrame(animate)
      }

      animate()
    })
  }

  const applyEasing = (t: number, easing: BallEventEasing) => {
    switch (easing) {
      case 'linear':
        return t
      case 'easeOutCubic':
      default:
        return 1 - Math.pow(1 - t, 3)
    }
  }

  // Simple ball passing animation - direct line from one player to another
  const animateBallPass = (
    fromPos: { x: number, y: number },
    toPlayer: Player,
    options: BallPassAnimationOptions = {}
  ): Promise<void> => {
    return new Promise((resolve) => {
      console.log('[animateBallPass] START', {
        fromPos,
        toPlayer: `${toPlayer.type}-${toPlayer.id}`,
        toPlayerPos: { x: toPlayer.x, y: toPlayer.y },
        currentBallPos: { x: ball.value.x, y: ball.value.y },
        options
      })

      // Detach the ball immediately so timed-pass logic sees it "in flight"
      setBallCarrier(null, { updateTimedPassSource: false })
      if (options.fromPlayer) {
        options.fromPlayer.isCarryingBall = false
      }

      const startTime = Date.now()
      const duration = options.duration ?? 600
      const easing = options.easing ?? DEFAULT_EASING
      const targetPos = getHandPos(toPlayer)

      console.log('[animateBallPass] Target hand position', targetPos)

      if (options.recordEvent && recordBallEvent) {
        const event = createBallPassEvent(fromPos, targetPos, { ...options, toPlayer }, duration)
        recordBallEvent(event)
      }

      let lastEmitTime = startTime

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        const easeProgress = applyEasing(progress, easing)

        // Direct linear interpolation - no arc
        ball.value.x = fromPos.x + (targetPos.x - fromPos.x) * easeProgress
        ball.value.y = fromPos.y + (targetPos.y - fromPos.y) * easeProgress

        if (progress === 0) {
          console.log('[animateBallPass] First frame', {
            elapsed,
            progress,
            easeProgress,
            ballPos: { x: ball.value.x, y: ball.value.y }
          })
        }

        // Emit recording samples during the pass so playback is smooth
        if (Date.now() - lastEmitTime > 100) {
          emitPlayerStates(true)
          lastEmitTime = Date.now()
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          console.log('[animateBallPass] END', {
            finalBallPos: { x: ball.value.x, y: ball.value.y },
            toPlayer: `${toPlayer.type}-${toPlayer.id}`
          })
          // Use unified ball-carrier system
          setBallCarrier(toPlayer, { updateTimedPassSource: false })
          // Emit final state after attach
          emitPlayerStates(true)
          resolve()
        }
      }

      animate()
    })
  }

  const getHandPos = (player: Player) => ({
    x: player.x + canvasConfig.value.playerRadius * 0.8,
    y: player.y + canvasConfig.value.playerRadius * 0.4
  })

  // Simple ball transition for sequence starts (use same speed as key pass)
  const animateBallToPlayer = async (targetPlayer: Player, options: { recordEvent?: boolean } = {}): Promise<void> => {
    console.log('[animateBallToPlayer] START', {
      targetPlayer: `${targetPlayer.type}-${targetPlayer.id}`,
      targetPlayerPos: { x: targetPlayer.x, y: targetPlayer.y },
      currentBallPos: { x: ball.value.x, y: ball.value.y },
      ballAttachedTo: ball.value.attachedTo
    })

    // If ball already attached to another player, animate real pass between them
    if (ball.value.attachedTo) {
      const fromPlayer = players.value.find(p =>
        p.type === ball.value.attachedTo!.type &&
        p.id === ball.value.attachedTo!.id
      )
      if (fromPlayer && fromPlayer !== targetPlayer) {
        console.log('[animateBallToPlayer] Passing from existing carrier', {
          fromPlayer: `${fromPlayer.type}-${fromPlayer.id}`,
          fromPlayerPos: { x: fromPlayer.x, y: fromPlayer.y }
        })
        await animateBallPass(getHandPos(fromPlayer), targetPlayer, {
          fromPlayer,
          toPlayer: targetPlayer,
          recordEvent: options.recordEvent !== false
        })
        return
      }
    }

    const currentPos = { x: ball.value.x, y: ball.value.y }
    const targetPos = getHandPos(targetPlayer)

    console.log('[animateBallToPlayer] Moving ball', {
      currentPos,
      targetPos
    })

    const distance = Math.hypot(targetPos.x - currentPos.x, targetPos.y - currentPos.y)
    console.log('[animateBallToPlayer] Distance to target', distance)
    if (distance < 5) {
      console.log('[animateBallToPlayer] Distance < 5, setting carrier immediately')
      setBallCarrier(targetPlayer, { updateTimedPassSource: false })
      return
    }

    return new Promise((resolve) => {
      const startTime = Date.now()
      const duration = 600 // same 600ms as animateBallPass
      let lastEmitTime = startTime

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        ball.value.x = currentPos.x + (targetPos.x - currentPos.x) * easeProgress
        ball.value.y = currentPos.y + (targetPos.y - currentPos.y) * easeProgress

        if (progress === 0) {
          console.log('[animateBallToPlayer] First frame', {
            ballPos: { x: ball.value.x, y: ball.value.y }
          })
        }

        if (Date.now() - lastEmitTime > 100) {
          emitPlayerStates(true)
          lastEmitTime = Date.now()
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          console.log('[animateBallToPlayer] END', {
            finalBallPos: { x: ball.value.x, y: ball.value.y }
          })
          setBallCarrier(targetPlayer, { updateTimedPassSource: false })
          emitPlayerStates(true)
          resolve()
        }
      }
      animate()
    })
  }

  const stopAllPlayerLoops = () => {
    players.value.forEach(player => {
      if (player.isLooping) {
        player.isLooping = false
        player.loopStartTime = undefined
        if (player.originalPosition) {
          player.x = player.originalPosition.x
          player.y = player.originalPosition.y
        }
      }
    })
  }

  // Sequence execution with ball transitions and timed passes,
  // keeping ball start behaviour aligned with main
  const executeSequence = async (
    sequence: Sequence,
    playersInSequence: Player[],
    redrawCallback?: () => void,
    isMultiSequenceExecution: boolean = false,
    isRecording: boolean = false
  ): Promise<void> => {
    console.log('[executeSequence] START', {
      sequenceName: sequence.name,
      ballPosAtStart: { x: ball.value.x, y: ball.value.y },
      ballAttachedTo: ball.value.attachedTo,
      activePlayerIds: sequence.activePlayerIds,
      isMultiSequenceExecution,
      isRecording
    })

    // Check if sequence has either active players OR ball events
    const hasActivePlayerMovement = sequence.activePlayerIds.length > 0
    const hasBallEvents = sequence.ballEvents && sequence.ballEvents.length > 0

    if (!hasActivePlayerMovement && !hasBallEvents) {
      console.log('[executeSequence] No active players or ball events, exiting')
      return // Nothing to execute
    }

    animationState.value.isRunning = true

    // Emit initial state if recording
    if (isRecording) {
      emitPlayerStates(true)
    }

    // Handle ball-only sequences (just ball passes, no player movement)
    if (!hasActivePlayerMovement && hasBallEvents) {
      for (const ballEvent of sequence.ballEvents) {
        const fromPlayer = playersInSequence.find(p => p.id === ballEvent.fromPlayerId)
        const toPlayer = playersInSequence.find(p => p.id === ballEvent.toPlayerId)

        if (toPlayer) {
          const fromPos = ballEvent.startPosition || (fromPlayer
            ? { x: fromPlayer.x, y: fromPlayer.y }
            : { x: ball.value.x, y: ball.value.y })

          await animateBallPass(fromPos, toPlayer, {
            recordEvent: false,
            duration: ballEvent.durationMs,
            easing: ballEvent.easing
          })

          // Emit state after ball pass if recording
          if (isRecording) {
            emitPlayerStates(true)
          }

          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }


      animationState.value.isRunning = false
      return
    }

    // Find active players (those with paths in the sequence)
    const activePlayers = playersInSequence.filter(player => {
      const playerId = `${player.type}-${player.id}`
      return sequence.activePlayerIds.includes(playerId) &&
        player.path &&
        player.path.length > 0
    })

    if (activePlayers.length === 0) {
      animationState.value.isRunning = false
      return
    }

    // STEP 1: Clear all carrying flags - we'll set them during animation
    playersInSequence.forEach(p => {
      p.isCarryingBall = false
    })

    // STEP 2: Restore ball to saved carrier
    if (sequence.ballState && sequence.ballState.attachedTo) {
      const savedCarrier = playersInSequence.find(p =>
        p.type === sequence.ballState.attachedTo?.type &&
        p.id === sequence.ballState.attachedTo?.id
      )

      const currentCarrier = ball.value.attachedTo
        ? playersInSequence.find(p =>
          p.type === ball.value.attachedTo?.type &&
          p.id === ball.value.attachedTo?.id
        )
        : null

      console.log('[executeSequence] Ball carrier check', {
        savedCarrier: savedCarrier ? `${savedCarrier.type}-${savedCarrier.id}` : null,
        currentCarrier: currentCarrier ? `${currentCarrier.type}-${currentCarrier.id}` : null,
        needsRestore: savedCarrier !== currentCarrier
      })

      if (savedCarrier && savedCarrier !== currentCarrier) {
        console.log('[executeSequence] Restoring ball to saved carrier')
        if (isMultiSequenceExecution) {
          await animateBallToPlayer(savedCarrier, { recordEvent: isRecording })
          setBallCarrier(savedCarrier, { updateTimedPassSource: false })
          if (isRecording) {
            emitPlayerStates(true)
          }
        } else {
          setBallCarrier(savedCarrier, { updateTimedPassSource: false })
          ball.value.x = savedCarrier.x + canvasConfig.value.playerRadius * 0.8
          ball.value.y = savedCarrier.y + canvasConfig.value.playerRadius * 0.4
        }
      } else {
        console.log('[executeSequence] Ball already with correct carrier, skipping restoration')
      }
    }

    // STEP 3: Track current ball carrier
    const currentBallCarrier = ball.value.attachedTo ?
      playersInSequence.find(p =>
        p.type === ball.value.attachedTo?.type &&
        p.id === ball.value.attachedTo?.id
      ) : null

    if (currentBallCarrier) {
      currentBallCarrier.isCarryingBall = true
    }

    // STEP 4: Execute animations
    const playerAnimations = activePlayers.map(async (player) => {
      const delay = player.sequenceDelay || 0

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const pathLength = calculatePathLength(player.path!)
      const actualSpeed = (ANIMATION_CONFIG.BASE_SPEED * (player.speed || 100)) / 100
      const duration = (pathLength / actualSpeed) * 1000

      // Check if this player has the ball
      const hasBall = ball.value.attachedTo?.type === player.type &&
        ball.value.attachedTo?.id === player.id

      if (player.timedPass) {
        return animatePlayerPath(player, { isRecording, hasTimedPass: true })
      } else if (hasBall) {
        player.isCarryingBall = true // Set flag for animation
        return animatePlayerPath(player, { isRecording, isCarryingBall: true })
      } else {
        return animatePlayerPath(player, { isRecording })
      }
    })

    await Promise.all(playerAnimations)

    if (isRecording) {
      emitPlayerStates(true)
    }

    animationState.value.isRunning = false
  }


  // Emit player states for recording
  // Now includes relativePosition so playback can scale identically
  const emitPlayerStates = (isRecording: boolean) => {
    if (!isRecording) return

    const timestamp = Date.now()

    // Derive field placement from current canvas config
    const width = canvasConfig.value.width
    const height = canvasConfig.value.height
    const fieldWidth = canvasConfig.value.fieldWidth
    const fieldHeight = canvasConfig.value.fieldHeight
    const fieldX = (width - fieldWidth) / 2
    const fieldY = (height - fieldHeight) / 2

    const states: PlayerState[] = [
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

    emit('update:playerStates', states)
  }

  return {
    // State
    animationState,
    isPlayRunning,
    isRunningCurrentPhase,
    isRunningFullPlay,

    // Animation methods
    animatePlayerPath,
    animateBallPass,
    animateBallToPlayer,
    stopAllPlayerLoops,
    executeSequence,

    // Utilities
    calculatePathLength,
    emitPlayerStates
  }
} 
