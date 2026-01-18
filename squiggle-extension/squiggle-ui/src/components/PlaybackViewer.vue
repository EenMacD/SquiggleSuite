<template>
  <div class="playback-viewer" :class="{ 'fullscreen': isFullscreen }">
    <div class="playback-controls">
      <div class="control-group">
        <button @click="toggleFullscreen" class="pb-btn ghost minimize" :class="{ 'fullscreen-btn': isFullscreen }">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path v-if="!isFullscreen" d="M9 3H3v6M15 3h6v6M9 21H3v-6M21 15v6h-6" stroke="currentColor" stroke-linecap="round"/>
          </svg>
          {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
        </button>
        <button @click="runSequence" class="pb-btn primary run-sequence" :disabled="isRunning || props.playbackData.length === 0">
          <svg v-if="!isRunning" class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor"/>
          </svg>
          {{ isRunning ? 'Running...' : 'Run Sequence' }}
        </button>
        <button @click="downloadVideo" class="pb-btn primary">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Download
        </button>
      </div>
    </div>
    <div class="pb-timeline" v-if="props.playbackData.length > 0">
      <div class="pb-timeline__track">
        <div class="pb-timeline__progress" :style="{ width: progressPct + '%' }"></div>
      </div>
      <div class="pb-timeline__labels">
        <span>0s</span>
        <span>{{ totalDurationLabel }}</span>
      </div>
    </div>
    <div class="canvas-container">
      <canvas
        ref="pitchCanvas"
        :width="canvasWidth"
        :height="canvasHeight"
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { CANVAS_CONFIG, calculateFieldDimensions } from '../types/game'
import type { PlayerState } from '../types/play'
import type { BallPassEvent, BallEventEasing } from '../types/game'

interface Player {
  x: number
  y: number
  type: 'attacking' | 'defensive'
  id: number
}

interface Ball {
  x: number
  y: number
  attachedTo: { type: 'attacking' | 'defensive', id: number } | null
}

interface Props {
  playbackData: PlayerState[]
  ballEvents?: BallPassEvent[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'sequenceComplete'): void
}>()

const pitchCanvas = ref<HTMLCanvasElement | null>(null)
const canvasWidth = ref(800)
const canvasHeight = ref(600)
const isFullscreen = ref(false)
const players = ref<Player[]>([])
const trails = ref(new Map<string, Array<{ x: number; y: number }>>())
const MAX_TRAIL_POINTS = 10
const ball = ref<Ball>({
  x: 0,
  y: 0,
  attachedTo: null
})
let ballEventsQueue: BallPassEvent[] = []
let nextBallEventIdx = 0
let activeBallEvent: BallPassEvent | null = null
let activeBallEventEnd = 0
const rafId = ref<number | null>(null)
const currentPlaybackIndex = ref(0)
const isRunning = ref(false)

const applyEventEasing = (progress: number, easing: BallEventEasing = 'easeOutCubic') => {
  switch (easing) {
    case 'linear':
      return progress
    case 'easeOutCubic':
    default:
      return 1 - Math.pow(1 - progress, 3)
  }
}

const prepareBallEvents = () => {
  ballEventsQueue = [...(props.ballEvents ?? [])].sort((a, b) => a.startTimestamp - b.startTimestamp)
  nextBallEventIdx = 0
  activeBallEvent = null
  activeBallEventEnd = 0
}

const resolveBallPosition = (
  timelineTime: number, 
  fallback: { x: number, y: number },
  fallbackAttachment: { type: 'attacking' | 'defensive', id: number } | null
): { x: number, y: number, attachedTo: { type: 'attacking' | 'defensive', id: number } | null } => {
  const dims = calculateFieldDimensions(canvasWidth.value, canvasHeight.value)
  
  while (!activeBallEvent && nextBallEventIdx < ballEventsQueue.length && ballEventsQueue[nextBallEventIdx].startTimestamp <= timelineTime) {
    activeBallEvent = ballEventsQueue[nextBallEventIdx++]
    activeBallEventEnd = activeBallEvent.startTimestamp + activeBallEvent.durationMs
  }

  if (activeBallEvent) {
    if (timelineTime >= activeBallEventEnd) {
      // Pass complete - attach to target player
      const finalPos = {
        x: dims.toAbsoluteX(activeBallEvent.endPosition.x),
        y: dims.toAbsoluteY(activeBallEvent.endPosition.y)
      }
      const attachment = activeBallEvent.toPlayerId !== null && activeBallEvent.toPlayerType !== null
        ? { type: activeBallEvent.toPlayerType, id: activeBallEvent.toPlayerId }
        : null
      activeBallEvent = null
      activeBallEventEnd = 0
      return resolveBallPosition(timelineTime, finalPos, attachment)
    }

    if (timelineTime >= activeBallEvent.startTimestamp) {
      // Ball is being passed - detach it so it appears to fly through the air
      const progress = Math.max(0, Math.min(1, (timelineTime - activeBallEvent.startTimestamp) / activeBallEvent.durationMs))
      const eased = applyEventEasing(progress, activeBallEvent.easing)
      
      // Convert relative positions to absolute coordinates for interpolation
      const startX = dims.toAbsoluteX(activeBallEvent.startPosition.x)
      const startY = dims.toAbsoluteY(activeBallEvent.startPosition.y)
      const endX = dims.toAbsoluteX(activeBallEvent.endPosition.x)
      const endY = dims.toAbsoluteY(activeBallEvent.endPosition.y)
      
      return {
        x: startX + (endX - startX) * eased,
        y: startY + (endY - startY) * eased,
        attachedTo: null // Detached during pass animation
      }
    }
  }

  return { ...fallback, attachedTo: fallbackAttachment }
}

// Progress and duration labels
const progressPct = computed(() => {
  const total = props.playbackData.length || 1
  return Math.min(100, Math.max(0, (currentPlaybackIndex.value / total) * 100))
})
const totalDurationLabel = computed(() => {
  if (props.playbackData.length === 0) return '0s'
  const start = props.playbackData[0].timestamp
  const end = props.playbackData[props.playbackData.length - 1].timestamp
  const seconds = Math.max(0, Math.round((end - start) / 1000))
  return `${seconds}s`
})

// Video recording (WebM)
const isRecordingVideo = ref(false)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])

const calculateFullscreenDimensions = () => {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const fieldRatio = CANVAS_CONFIG.FIELD_RATIO // Standard rugby field ratio (width/height)

  // Use 90% of the window height for the field (rounded to whole px)
  const targetFieldHeight = Math.round(windowHeight * 0.9)
  const targetFieldWidth = Math.round(targetFieldHeight * fieldRatio)

  // Add extra width for substitutes (20% on each side)
  const totalWidth = Math.round(targetFieldWidth * 1.4) // 40% extra width total

  // If the total width is too wide for the window, scale down
  if (totalWidth > Math.round(windowWidth * 0.9)) {
    const scaledWidth = Math.round(windowWidth * 0.9)
    // Derive field width from scaled canvas width and add vertical letterbox
    const scaledFieldWidth = Math.round(scaledWidth / 1.4)
    const scaledFieldHeight = Math.round(scaledFieldWidth / fieldRatio)
    const verticalBufferPerSide = Math.round(scaledFieldWidth * 0.2)
    const verticalBufferTotal = verticalBufferPerSide * 2
    return {
      width: scaledWidth,
      height: scaledFieldHeight + verticalBufferTotal
    }
  }

  const verticalBufferPerSide = Math.round(targetFieldWidth * 0.2)
  const verticalBufferTotal = verticalBufferPerSide * 2
  return {
    width: totalWidth,
    // Add vertical letterboxing to center field with even top/bottom buffer
    height: targetFieldHeight + verticalBufferTotal
  }
}

const updateCanvasSize = () => {
  if (isFullscreen.value) {
    const dimensions = calculateFullscreenDimensions()
    canvasWidth.value = Math.round(dimensions.width)
    canvasHeight.value = Math.round(dimensions.height)
  } else {
    // Use the same ratio for regular mode
    const fieldRatio = CANVAS_CONFIG.FIELD_RATIO
    // Target 96vw up to 1400px, and compute field area
    const viewportW = Math.round(Math.min(window.innerWidth * 0.96, 1400))
    const baseWidth = Math.round(viewportW / 1.4) // field content width
    canvasWidth.value = viewportW // total canvas width with letterbox
    // Add vertical letterboxing so the field is centered with even buffer
    const verticalBufferPerSide = Math.round(baseWidth * 0.2) // 20% per side of field width
    const baseFieldHeight = Math.round(baseWidth / fieldRatio)
    canvasHeight.value = baseFieldHeight + (verticalBufferPerSide * 2)
  }
  requestAnimationFrame(drawPitch)
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  updateCanvasSize()
}

const handleResize = () => {
  if (isFullscreen.value) {
    updateCanvasSize()
  }
}

const drawPitch = () => {
  if (!pitchCanvas.value) return
  const ctx = pitchCanvas.value.getContext('2d')
  if (!ctx) return

  // HiDPI backing store for crisp rendering
  const dpr = window.devicePixelRatio || 1
  if (pitchCanvas.value.width !== Math.floor(canvasWidth.value * dpr) || pitchCanvas.value.height !== Math.floor(canvasHeight.value * dpr)) {
    pitchCanvas.value.width = Math.floor(canvasWidth.value * dpr)
    pitchCanvas.value.height = Math.floor(canvasHeight.value * dpr)
    // Use whole CSS pixels to avoid fractional rounding artifacts
    pitchCanvas.value.style.width = `${Math.round(canvasWidth.value)}px`
    pitchCanvas.value.style.height = `${Math.round(canvasHeight.value)}px`
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  // Calculate field dimensions and position using the same utility as RugbyCanvas
  const dims = calculateFieldDimensions(canvasWidth.value, canvasHeight.value)
  const fieldX = dims.fieldX
  const fieldY = dims.fieldY
  const actualFieldWidth = dims.actualFieldWidth
  const actualFieldHeight = dims.actualFieldHeight
  const gridSpacingX = dims.squareSize
  const gridSpacingY = dims.squareSize

  // Outside area: black
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)

  // Improve rendering quality for shapes/text
  ctx.imageSmoothingEnabled = true
  ;(ctx as any).imageSmoothingQuality = 'high'

  // Field fill: white with subtle tint
  const fieldFill = ctx.createLinearGradient(0, fieldY, 0, fieldY + actualFieldHeight)
  fieldFill.addColorStop(0, '#FFFFFF')
  fieldFill.addColorStop(1, '#F5F7FA')
  ctx.fillStyle = fieldFill
  ctx.fillRect(fieldX, fieldY, actualFieldWidth, actualFieldHeight)

  // Hairline inner frame on field
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
  ctx.lineWidth = 2
  ctx.strokeRect(fieldX + 6, fieldY + 6, actualFieldWidth - 12, actualFieldHeight - 12)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Markings (on white)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.lineWidth = 1.5

  // Draw center line with premium dash
  ctx.beginPath()
  ctx.setLineDash([20, 14])
  ctx.moveTo(fieldX, fieldY + actualFieldHeight / 2)
  ctx.lineTo(fieldX + actualFieldWidth, fieldY + actualFieldHeight / 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Draw 22-meter lines with premium style
  const twentyTwoMeterLine = actualFieldHeight * 0.22
  ctx.beginPath()
  ctx.setLineDash([20, 14])
  ctx.moveTo(fieldX, fieldY + twentyTwoMeterLine)
  ctx.lineTo(fieldX + actualFieldWidth, fieldY + twentyTwoMeterLine)
  ctx.moveTo(fieldX, fieldY + actualFieldHeight - twentyTwoMeterLine)
  ctx.lineTo(fieldX + actualFieldWidth, fieldY + actualFieldHeight - twentyTwoMeterLine)
  ctx.stroke()
  ctx.setLineDash([])

  // Draw try lines with premium weight
  ctx.beginPath()
  ctx.lineWidth = 2
  ctx.moveTo(fieldX, fieldY)
  ctx.lineTo(fieldX, fieldY + actualFieldHeight)
  ctx.moveTo(fieldX + actualFieldWidth, fieldY)
  ctx.lineTo(fieldX + actualFieldWidth, fieldY + actualFieldHeight)
  ctx.stroke()

  // Subtle grid
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.lineWidth = 1

  // Vertical grid lines (70 meters)
  for (let x = fieldX; x <= fieldX + actualFieldWidth; x += gridSpacingX) {
    ctx.beginPath()
    ctx.moveTo(x, fieldY)
    ctx.lineTo(x, fieldY + actualFieldHeight)
    ctx.stroke()
  }

  // Horizontal grid lines (100 meters)
  for (let y = fieldY; y <= fieldY + actualFieldHeight; y += gridSpacingY) {
    ctx.beginPath()
    ctx.moveTo(fieldX, y)
    ctx.lineTo(fieldX + actualFieldWidth, y)
    ctx.stroke()
  }

  // Draw trails behind players (fading)
  players.value.forEach(p => {
    const key = `${p.type}-${p.id}`
    const t = trails.value.get(key) || []
    for (let i = 1; i < t.length; i++) {
      const a = t[i-1], b = t[i]
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      const base = p.type === 'attacking' ? '#D84B4B' : '#3A57A5'
      ctx.strokeStyle = base
      ctx.globalAlpha = (i / t.length) * 0.35
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  })

  // Draw premium players
  const playerRadius = Math.min(actualFieldWidth, actualFieldHeight) * 0.02
  players.value.forEach(player => {
    // Draw player at its exact position (matching RugbyPitch.vue)
    const adjustedX = player.x
    const adjustedY = player.y
    
    // Draw premium player shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.shadowBlur = 12
    ctx.shadowOffsetY = 4
    ctx.beginPath()
    ctx.arc(adjustedX, adjustedY + 2, playerRadius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
    ctx.fill()

    // Draw premium player circle with sophisticated gradient
    const playerGradient = ctx.createRadialGradient(
      adjustedX - playerRadius/2, adjustedY - playerRadius/2, 0,
      adjustedX, adjustedY, playerRadius
    )
    if (player.type === 'attacking') {
      playerGradient.addColorStop(0, '#F28C8C')
      playerGradient.addColorStop(0.5, '#E46363')
      playerGradient.addColorStop(1, '#D84B4B')
    } else {
      playerGradient.addColorStop(0, '#6E86C9')
      playerGradient.addColorStop(0.5, '#4867B5')
      playerGradient.addColorStop(1, '#3A57A5')
    }
    
    ctx.shadowColor = 'transparent'
    ctx.beginPath()
    ctx.arc(adjustedX, adjustedY, playerRadius, 0, Math.PI * 2)
    ctx.fillStyle = playerGradient
    ctx.fill()

    // Draw premium player border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.98)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Draw premium player number with improved rendering
    ctx.textRendering = 'geometricPrecision'
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'
    const fontSize = Math.max(playerRadius * 0.8, 12) // Ensure minimum font size
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add subtle text shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetY = 1
    ctx.fillText(player.id.toString(), adjustedX, adjustedY)
    
    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Ball carrier highlight ring
    if (ball.value.attachedTo && ball.value.attachedTo.type === player.type && ball.value.attachedTo.id === player.id) {
      const ringColor = player.type === 'attacking' ? 'rgba(216,75,75,0.9)' : 'rgba(58,87,165,0.9)'
      ctx.shadowColor = ringColor
      ctx.shadowBlur = 14
      ctx.beginPath()
      ctx.arc(adjustedX, adjustedY, playerRadius * 1.35, 0, Math.PI * 2)
      ctx.strokeStyle = ringColor
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  })

  // Draw the ball
  const ballRadius = playerRadius * 0.75 // Slightly smaller than player radius
  
  // Draw ball shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4
  ctx.beginPath()
  ctx.arc(ball.value.x, ball.value.y + 2, ballRadius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
  ctx.fill()

  // Minimal ball fill + highlight
  ctx.shadowColor = 'transparent'
  ctx.beginPath()
  ctx.arc(ball.value.x, ball.value.y, ballRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#FFB300'
  ctx.fill()
  // Small highlight
  ctx.beginPath()
  ctx.arc(ball.value.x - ballRadius * 0.35, ball.value.y - ballRadius * 0.35, ballRadius * 0.2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fill()

  // Draw ball border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.98)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

const runSequence = () => {
  if (props.playbackData.length === 0 || isRunning.value) return

  isRunning.value = true

  // Reset players array and ball
  players.value = []
  trails.value.clear()

  // Use unified field dimensions and center the ball on field
  const dims = calculateFieldDimensions(canvasWidth.value, canvasHeight.value)
  ball.value = {
    x: dims.fieldX + dims.actualFieldWidth * 0.5,
    y: dims.fieldY + dims.actualFieldHeight * 0.5,
    attachedTo: null
  }

  // Get unique player IDs from all states, excluding the ball
  const uniquePlayerIds = new Set(
    props.playbackData
      .filter(state => state.playerId !== 'ball')
      .map(state => state.playerId)
  )

  // Initialize players from the first state
  uniquePlayerIds.forEach(playerId => {
    const [type, id] = playerId.split('-')
    const firstState = props.playbackData.find(state => state.playerId === playerId)
    if (firstState) {
      const x = firstState.relativePosition ? (dims.fieldX + firstState.relativePosition.x * dims.actualFieldWidth) : firstState.position.x
      const y = firstState.relativePosition ? (dims.fieldY + firstState.relativePosition.y * dims.actualFieldHeight) : firstState.position.y
      players.value.push({
        x,
        y,
        type: type as 'attacking' | 'defensive',
        id: parseInt(id)
      })
    }
  })

  prepareBallEvents()

  // Smooth playback between frames using requestAnimationFrame
  const timestamps = Array.from(new Set(props.playbackData.map(s => s.timestamp))).sort((a, b) => a - b)
  let frameIdx = 0

  const toMap = (states: PlayerState[]) => {
    const map = new Map<string, { rx: number; ry: number; hasRel: boolean; px: number; py: number }>()
    states.forEach(s => {
      if (s.playerId === 'ball') return
      const rx = s.relativePosition ? s.relativePosition.x : (s.position.x - dims.fieldX) / dims.actualFieldWidth
      const ry = s.relativePosition ? s.relativePosition.y : (s.position.y - dims.fieldY) / dims.actualFieldHeight
      map.set(s.playerId, { rx, ry, hasRel: !!s.relativePosition, px: s.position.x, py: s.position.y })
    })
    return map
  }

  const ballFrom = (s: PlayerState | undefined) => {
    if (!s) return { rx: 0.5, ry: 0.5, hasRel: false, px: ball.value.x, py: ball.value.y }
    const rx = s.relativePosition ? s.relativePosition.x : (s.position.x - dims.fieldX) / dims.actualFieldWidth
    const ry = s.relativePosition ? s.relativePosition.y : (s.position.y - dims.fieldY) / dims.actualFieldHeight
    return { rx, ry, hasRel: !!s.relativePosition, px: s.position.x, py: s.position.y }
  }

  const animateBetween = (idx: number) => {
    if (idx >= timestamps.length - 1) {
      stopSequence()
      emit('sequenceComplete')
      return
    }
    const t0 = timestamps[idx]
    const t1 = timestamps[idx + 1]
    const s0 = props.playbackData.filter(s => s.timestamp === t0)
    const s1 = props.playbackData.filter(s => s.timestamp === t1)
    const m0 = toMap(s0)
    const m1 = toMap(s1)
    const b0 = ballFrom(s0.find(s => s.playerId === 'ball'))
    const b1 = ballFrom(s1.find(s => s.playerId === 'ball'))

    const start = performance.now()
    const duration = Math.max(1, t1 - t0)

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      // Interpolate players
      players.value.forEach(ply => {
        const id = `${ply.type}-${ply.id}`
        const a = m0.get(id)
        const b = m1.get(id)
        if (a && b) {
          const rx = a.rx + (b.rx - a.rx) * p
          const ry = a.ry + (b.ry - a.ry) * p
          ply.x = dims.fieldX + rx * dims.actualFieldWidth
          ply.y = dims.fieldY + ry * dims.actualFieldHeight
          const key = `${ply.type}-${ply.id}`
          const arr = trails.value.get(key) || []
          arr.push({ x: ply.x, y: ply.y })
          if (arr.length > MAX_TRAIL_POINTS) arr.shift()
          trails.value.set(key, arr)
        }
      })

      // Interpolate ball as fallback
      const brx = b0.rx + (b1.rx - b0.rx) * p
      const bry = b0.ry + (b1.ry - b0.ry) * p
      const defaultBallPosition = {
        x: dims.fieldX + brx * dims.actualFieldWidth,
        y: dims.fieldY + bry * dims.actualFieldHeight
      }
      const timelineTime = t0 + (t1 - t0) * p
      const resolvedBall = resolveBallPosition(timelineTime, defaultBallPosition, ball.value.attachedTo)
      ball.value.x = resolvedBall.x
      ball.value.y = resolvedBall.y
      ball.value.attachedTo = resolvedBall.attachedTo

      requestAnimationFrame(drawPitch)

      if (p < 1 && isRunning.value) {
        rafId.value = requestAnimationFrame(tick)
      } else {
        currentPlaybackIndex.value = props.playbackData.findIndex(s => s.timestamp === t1)
        frameIdx = idx + 1
        animateBetween(frameIdx)
      }
    }

    rafId.value = requestAnimationFrame(tick)
  }

  animateBetween(0)
}

const stopSequence = () => {
  if (rafId.value) { cancelAnimationFrame(rafId.value); rafId.value = null }
  isRunning.value = false
  currentPlaybackIndex.value = 0
  ballEventsQueue = []
  nextBallEventIdx = 0
  activeBallEvent = null
  activeBallEventEnd = 0
  // Auto-stop recording if active
  if (isRecordingVideo.value) stopRecordingVideo()
}
// Single action: start recording and run sequence, auto-download on finish
const downloadVideo = async () => {
  if (isRecordingVideo.value) return
  const preferPortrait = window.innerHeight >= window.innerWidth
  await startRecordingVideo({ orientation: preferPortrait ? 'portrait' : 'landscape' })
  if (!isRunning.value) runSequence()
}

const startRecordingVideo = async (opts?: { orientation?: 'portrait' | 'landscape', width?: number, height?: number }) => {
  if (!pitchCanvas.value) return
  // Snapshot current layout
  const prev = { w: canvasWidth.value, h: canvasHeight.value, fs: isFullscreen.value }

  // If portrait export requested: set a portrait resolution
  if (opts?.orientation === 'portrait') {
    isFullscreen.value = false
    const targetW = opts.width ?? 1080
    const targetH = opts.height ?? 1920
    canvasWidth.value = targetW
    canvasHeight.value = targetH
    await new Promise(r => requestAnimationFrame(() => { drawPitch(); r(null) }))
  }

  const stream = (pitchCanvas.value as any).captureStream ? (pitchCanvas.value as HTMLCanvasElement).captureStream(60) : null
  if (!stream) {
    alert('Recording not supported in this browser')
    return
  }
  let mimeType = 'video/webm;codecs=vp9'
  if (!(window as any).MediaRecorder || !MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' : 'video/webm'
  }
  recordedChunks.value = []
  mediaRecorder.value = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
  mediaRecorder.value.ondataavailable = (e: any) => {
    if (e.data && e.data.size > 0) recordedChunks.value.push(e.data)
  }
  mediaRecorder.value.onstop = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fname = `squiggle-playback-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.webm`
    const blob = new Blob(recordedChunks.value, { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fname
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    isRecordingVideo.value = false

    // Restore layout
    isFullscreen.value = prev.fs
    canvasWidth.value = prev.w
    canvasHeight.value = prev.h
    requestAnimationFrame(drawPitch)
  }
  mediaRecorder.value.start(100)
  isRecordingVideo.value = true
}

const stopRecordingVideo = () => {
  mediaRecorder.value?.stop()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  // Size canvas responsively on initial load
  updateCanvasSize()
  
  // Initialize ball position in center of field
  const dims = calculateFieldDimensions(canvasWidth.value, canvasHeight.value)
  ball.value = {
    x: dims.fieldX + dims.actualFieldWidth * 0.5,
    y: dims.fieldY + dims.actualFieldHeight * 0.5,
    attachedTo: null
  }
  
  drawPitch()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopSequence()
})

watch(players, () => {
  requestAnimationFrame(drawPitch)
}, { deep: true })
</script>

<style scoped>
.playback-viewer {
  position: relative;
  width: min(1400px, 96vw);
  max-width: none;
  margin: 0 auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-2);
  padding: 1.25rem;
}

.playback-viewer.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  margin: 0;
  padding: 0;
  border-radius: 0;
  z-index: 9999;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: none;
}

.playback-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.control-group {
  position: relative;
  display: flex;
  gap: 1rem;
}

.pb-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.1rem;
  min-height: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--btn-border);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: .01em;
  transition: background-color .2s var(--ease), border-color .2s var(--ease), box-shadow .2s var(--ease), color .2s var(--ease);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.pb-btn:focus-visible { outline: none; box-shadow: 0 0 0 4px var(--focus); }
.pb-btn::after { content: ""; position: absolute; inset: 0; background: currentColor; opacity: 0; border-radius: inherit; transform: scale(0); transition: transform .28s var(--ease), opacity .4s var(--ease); }
.pb-btn:active::after { opacity: .12; transform: scale(1); }
.pb-btn:hover { background: var(--btn-hover-bg); border-color: var(--border-strong); }
.pb-btn.primary { background: var(--btn-primary-bg); color: var(--btn-primary-text); border-color: transparent; }
.pb-btn.primary:hover { background: var(--btn-primary-hover-bg); }
.pb-btn.primary:active { background: var(--btn-primary-active-bg); }
.pb-btn.ghost { background: transparent; }
.pb-btn:disabled { opacity: var(--btn-disabled-opacity); cursor: not-allowed; }

.pb-btn .icon {
  font-size: 1.3rem;
  line-height: 1;
}

.pb-btn.record.on { background: #b91c1c; border-color: transparent; color: #fff; }
.pb-btn.record.on:hover { background: #991b1b; }

.pb-btn.minimize.fullscreen-btn {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  background: var(--surface);
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  box-shadow: var(--shadow-2);
  border: 1px solid var(--border);
}

.pb-btn.minimize.fullscreen-btn:hover { background: var(--surface-2); }

.pb-timeline { margin: 0 0 1rem 0; }
.pb-timeline__track { height: 6px; background: var(--border); border-radius: 999px; overflow: hidden; }
.pb-timeline__progress { height: 100%; width: 0%; background: var(--btn-primary-bg); box-shadow: 0 0 12px rgba(13,59,102,.35) inset; transition: width .1s linear; }
.pb-timeline__labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 6px; }

.canvas-container {
  position: relative;
  width: 100%;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-1);
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.fullscreen .canvas-container {
  border-radius: 0;
  height: auto;
  width: auto;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: none;
  margin: 5vh auto;
}

canvas {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius);
}

.fullscreen canvas {
  border-radius: 0;
  height: auto;
  width: auto;
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}

@media (max-width: 768px) {
  .playback-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-group {
    flex-direction: column;
  }

  .control-btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 
