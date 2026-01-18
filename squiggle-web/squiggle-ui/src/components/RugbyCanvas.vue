<template>
  <div class="canvas-container" :class="{ 'panning': spaceDown || props.panMode, 'panning-active': isPanning }">
    <canvas
      ref="canvas"
      :width="canvasConfig.width"
      :height="canvasConfig.height"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import type { 
  Player, 
  Ball, 
  CanvasConfig, 
  UIState, 
  PathPoint,
  CanvasInteractionEvents 
} from '../types/game'
import { COLORS, CANVAS_CONFIG, calculateFieldDimensions } from '../types/game'

interface Props {
  players: Player[]
  ball: Ball
  canvasConfig: CanvasConfig
  uiState: UIState
  isSequenceMode: boolean
  isPlayRunning: boolean
  currentPath: PathPoint[]
  isDrawingPath: boolean
  zoom?: number
  panMode?: boolean
}

interface Emits {
  (e: 'player-click', player: Player, event: MouseEvent): void
  (e: 'player-double-click', player: Player, event: MouseEvent): void
  (e: 'player-long-press', player: Player, event: MouseEvent): void
  (e: 'ball-click', ball: Ball, event: MouseEvent): void
  (e: 'canvas-click', position: { x: number, y: number }, event: MouseEvent): void
  (e: 'player-drag', player: Player, position: { x: number, y: number }): void
  (e: 'ball-drag', ball: Ball, position: { x: number, y: number }): void
  (e: 'path-draw', player: Player, path: PathPoint[]): void
  (e: 'attach-ball', player: Player): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

// Mouse interaction state
const mouseState = ref({
  isDown: false,
  lastPosition: { x: 0, y: 0 },
  lastClient: { x: 0, y: 0 }
})

// Click detection (double-click and long-press)
const clickState = ref({
  count: 0,
  timer: null as number | null,
  lastPlayer: null as Player | null,
  lastClickTime: 0,
  dragStartPosition: null as { x: number, y: number } | null,
  longPressTimer: null as number | null
})

// Click interaction thresholds
const DOUBLE_CLICK_THRESHOLD = 300 // ms - industry standard
const DRAG_THRESHOLD = 5 // pixels - movement before it's considered a drag
const LONG_PRESS_DURATION = 500 // ms

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext('2d')
    drawPitch()
  }
  window.addEventListener('keydown', handleViewportKeyDown)
  window.addEventListener('keyup', handleViewportKeyUp)
})

onUnmounted(() => {
  if (clickState.value.timer) {
    clearTimeout(clickState.value.timer)
  }
  window.removeEventListener('keydown', handleViewportKeyDown)
  window.removeEventListener('keyup', handleViewportKeyUp)
})

// Watch for changes that require redrawing
watch([() => props.players, () => props.ball, () => props.currentPath], () => {
  nextTick(() => drawPitch())
}, { deep: true })

// Respond to zoom changes
watch(() => props.zoom, () => {
  clampPan()
  nextTick(() => drawPitch())
})

// Respond to canvas size changes
watch(() => [props.canvasConfig.width, props.canvasConfig.height], () => {
  clampPan()
  nextTick(() => drawPitch())
})

// Viewport transform state
const pan = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const spaceDown = ref(false)
const allowFreePan = computed(() => spaceDown.value || !!props.panMode)

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const clampPan = () => {
  // When free pan is enabled, do not clamp — let user place the field anywhere
  if (allowFreePan.value) return
  if (!ctx) return
  const viewportW = props.canvasConfig.width
  const viewportH = props.canvasConfig.height
  const z = props.zoom ?? 1
  const dims = calculateFieldDimensions(viewportW, viewportH)
  const fieldW = dims.actualFieldWidth
  const fieldH = dims.actualFieldHeight
  const x0 = dims.fieldX
  const y0 = dims.fieldY

  if (fieldW * z > viewportW) {
    const minPanX = viewportW - (x0 + fieldW) * z
    const maxPanX = -x0 * z
    pan.value.x = clamp(pan.value.x, minPanX, maxPanX)
  }

  if (fieldH * z > viewportH) {
    const minPanY = viewportH - (y0 + fieldH) * z
    const maxPanY = -y0 * z
    pan.value.y = clamp(pan.value.y, minPanY, maxPanY)
  }
}

const handleViewportKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    if (!spaceDown.value) {
      e.preventDefault()
      spaceDown.value = true
    }
  } else if (/^[0-9]$/.test(e.key)) {
    if (props.uiState.selectedPlayer) {
      emit('attach-ball', props.uiState.selectedPlayer)
    }
  }
}

const handleViewportKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault()
    spaceDown.value = false
  }
}

// Canvas drawing functions
const drawPitch = () => {
  if (!canvas.value || !ctx) return

  const { width, height } = props.canvasConfig
  const dpr = window.devicePixelRatio || 1
  // HiDPI backing store for crisp lines/text
  if (canvas.value.width !== Math.floor(width * dpr) || canvas.value.height !== Math.floor(height * dpr)) {
    canvas.value.width = Math.floor(width * dpr)
    canvas.value.height = Math.floor(height * dpr)
    // Use whole CSS pixels to avoid fractional rounding that can make
    // the top/bottom buffer appear uneven visually.
    canvas.value.style.width = `${Math.round(width)}px`
    canvas.value.style.height = `${Math.round(height)}px`
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw background (not transformed) to always fill the viewport
  drawBackground(ctx, width, height)

  // Apply viewport transform for field + entities
  ctx.save()
  const zoom = props.zoom ?? 1
  // Ensure pan stays within bounds for current zoom/viewport
  clampPan()
  ctx.translate(pan.value.x, pan.value.y)
  ctx.scale(zoom, zoom)

  // Calculate field dimensions (in world space)
  const fieldWidth = width / 1.4
  const fieldHeight = height
  const fieldX = (width - fieldWidth) / 2
  const fieldY = (height - fieldHeight) / 2
  
  // Draw field
  drawField(ctx, fieldX, fieldY, fieldWidth, fieldHeight)
  
  // Draw players
  drawPlayers(ctx)
  
  // Draw ball
  drawBall(ctx)
  
  // Draw paths if in sequence mode
  if (props.isSequenceMode) {
    drawPaths(ctx)
  }
  // Restore transform
  ctx.restore()
}

const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Outside the field: deep neutral navy to match Figma Dark theme
  ctx.fillStyle = '#0F172A'
  ctx.fillRect(0, 0, width, height)
}

const drawField = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  // Use unified field calculation for consistency
  const fieldDimensions = calculateFieldDimensions(props.canvasConfig.width, props.canvasConfig.height)
  const { actualFieldWidth, actualFieldHeight, fieldX, fieldY, squareSize } = fieldDimensions

  // Fill field area: clean white with a subtle top-to-bottom tint
  const fieldFill = ctx.createLinearGradient(0, fieldY, 0, fieldY + actualFieldHeight)
  fieldFill.addColorStop(0, '#FFFFFF')
  fieldFill.addColorStop(1, '#F5F7FA')
  ctx.fillStyle = fieldFill
  ctx.fillRect(fieldX, fieldY, actualFieldWidth, actualFieldHeight)

  // Hairline field frame (inside edge)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
  ctx.lineWidth = 2
  ctx.strokeRect(fieldX + 6, fieldY + 6, actualFieldWidth - 12, actualFieldHeight - 12)
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0

  // Field markings (elegant hairlines on white)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.lineWidth = 1.5

  // Center line
  ctx.beginPath()
  ctx.setLineDash([20, 14])
  ctx.moveTo(fieldX, fieldY + actualFieldHeight / 2)
  ctx.lineTo(fieldX + actualFieldWidth, fieldY + actualFieldHeight / 2)
  ctx.stroke()
  ctx.setLineDash([])

  // 22-meter lines
  const twentyTwoMeterLine = actualFieldHeight * 0.22
  ctx.beginPath()
  ctx.setLineDash([20, 14])
  ctx.moveTo(fieldX, fieldY + twentyTwoMeterLine)
  ctx.lineTo(fieldX + actualFieldWidth, fieldY + twentyTwoMeterLine)
  ctx.moveTo(fieldX, fieldY + actualFieldHeight - twentyTwoMeterLine)
  ctx.lineTo(fieldX + actualFieldWidth, fieldY + actualFieldHeight - twentyTwoMeterLine)
  ctx.stroke()
  ctx.setLineDash([])

  // Try lines
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

  // Vertical lines
  for (let gridX = fieldX; gridX <= fieldX + actualFieldWidth; gridX += squareSize) {
    ctx.beginPath()
    ctx.moveTo(gridX, fieldY)
    ctx.lineTo(gridX, fieldY + actualFieldHeight)
    ctx.stroke()
  }

  // Horizontal lines
  for (let gridY = fieldY; gridY <= fieldY + actualFieldHeight; gridY += squareSize) {
    ctx.beginPath()
    ctx.moveTo(fieldX, gridY)
    ctx.lineTo(fieldX + actualFieldWidth, gridY)
    ctx.stroke()
  }
}

const drawPlayers = (ctx: CanvasRenderingContext2D) => {
  const baseRadius = props.canvasConfig.playerRadius
  
  props.players.forEach(player => {
    const radius = player.isAnimating ? baseRadius * 1.15 : baseRadius
    
    // Subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
    ctx.shadowBlur = 6
    ctx.shadowOffsetY = 3
    ctx.beginPath()
    ctx.arc(player.x, player.y + 1.5, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)'
    ctx.fill()

    // Player circle
    const colors = player.type === 'attacking' ? COLORS.ATTACKING : COLORS.DEFENSIVE
    const gradient = ctx.createRadialGradient(
      player.x - radius/2, player.y - radius/2, 0,
      player.x, player.y, radius
    )
    gradient.addColorStop(0, colors.LIGHT)
    gradient.addColorStop(0.5, colors.SECONDARY)
    gradient.addColorStop(1, colors.PRIMARY)
    
    ctx.shadowColor = 'transparent'
    ctx.beginPath()
    ctx.arc(player.x, player.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Border / selection ring
    if (player.isSelected || player === props.uiState.selectedPlayer) {
      ctx.strokeStyle = COLORS.UI.SELECTED
      ctx.lineWidth = 3
      ctx.shadowColor = 'rgba(13, 59, 102, 0.35)'
      ctx.shadowBlur = 6
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)'
      ctx.lineWidth = 1.25
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }
    ctx.stroke()
    
    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Draw player number
    ctx.fillStyle = 'rgba(255, 255, 255, 1)'
    const fontSize = Math.max(radius * 0.8, 12)
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetY = 1
    
    const displayNumber = player.assignedNumber !== undefined ? 
      player.assignedNumber.toString() : player.id.toString()
    ctx.fillText(displayNumber, player.x, player.y)
    
    // Reset shadow
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    
    // Draw sequence inclusion indicator - subtle outline
    if (player.isLooping && props.isSequenceMode) {
      ctx.beginPath()
      ctx.arc(player.x, player.y, radius + 6, 0, Math.PI * 2)
      ctx.strokeStyle = player.type === 'attacking' ?
        'rgba(255, 68, 68, 0.4)' : 'rgba(68, 68, 255, 0.4)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  })
}

const drawBall = (ctx: CanvasRenderingContext2D) => {
  const radius = props.canvasConfig.ballRadius
  
  // Subtle shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3
  ctx.beginPath()
  ctx.arc(props.ball.x, props.ball.y + 1.5, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
  ctx.fill()

  // Minimal fill + highlight
  ctx.shadowColor = 'transparent'
  ctx.beginPath()
  ctx.arc(props.ball.x, props.ball.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = COLORS.BALL.PRIMARY
  ctx.fill()
  // Highlight dot
  ctx.beginPath()
  ctx.arc(props.ball.x - radius * 0.35, props.ball.y - radius * 0.35, radius * 0.2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fill()

  // Border
  ctx.strokeStyle = props.uiState.selectedBall ? 'rgba(13,59,102,1)' : 'rgba(255,255,255,0.92)'
  ctx.lineWidth = props.uiState.selectedBall ? 2 : 1.25
  ctx.stroke()
}

const drawPaths = (ctx: CanvasRenderingContext2D) => {
  if (props.isPlayRunning) return

  // Draw player paths
  props.players.forEach(player => {
    if (player.path && player.path.length > 0 && player.pathVisible !== false) {
      const baseColor = player.type === 'attacking' ? COLORS.ATTACKING.PRIMARY : COLORS.DEFENSIVE.PRIMARY

      // Draw path line
      ctx.beginPath()
      ctx.strokeStyle = baseColor
      ctx.globalAlpha = 0.7
      ctx.lineWidth = 2
      ctx.setLineDash([10, 6])

      // Start from the first recorded path point so the
      // visible path matches exactly what the player runs.
      const firstPoint = player.path[0]
      ctx.moveTo(firstPoint.x, firstPoint.y)
      for (let i = 1; i < player.path.length; i++) {
        const point = player.path[i]
        ctx.lineTo(point.x, point.y)
      }

      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.setLineDash([])

      // Omit persistent point markers for a cleaner look

      // Draw direction arrow
      if (player.path.length > 1) {
        const lastPoint = player.path[player.path.length - 1]
        const secondLastPoint = player.path[player.path.length - 2]

        const dx = lastPoint.x - secondLastPoint.x
        const dy = lastPoint.y - secondLastPoint.y
        const angle = Math.atan2(dy, dx)

        const arrowLength = 15
        const arrowAngle = Math.PI / 6

        ctx.beginPath()
        ctx.moveTo(lastPoint.x, lastPoint.y)
        ctx.lineTo(
          lastPoint.x - arrowLength * Math.cos(angle - arrowAngle),
          lastPoint.y - arrowLength * Math.sin(angle - arrowAngle)
        )
        ctx.moveTo(lastPoint.x, lastPoint.y)
        ctx.lineTo(
          lastPoint.x - arrowLength * Math.cos(angle + arrowAngle),
          lastPoint.y - arrowLength * Math.sin(angle + arrowAngle)
        )
        ctx.strokeStyle = baseColor
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw timed pass marker
      if (player.timedPass && player.timedPass.position) {
        const passPos = player.timedPass.position
        const markerRadius = 8

        // Draw pulsing circle for timed pass marker
        ctx.beginPath()
        ctx.arc(passPos.x, passPos.y, markerRadius, 0, Math.PI * 2)
        ctx.fillStyle = COLORS.BALL.PRIMARY
        ctx.fill()

        // Draw outer ring
        ctx.beginPath()
        ctx.arc(passPos.x, passPos.y, markerRadius + 3, 0, Math.PI * 2)
        ctx.strokeStyle = COLORS.BALL.PRIMARY
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw clock icon
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(passPos.x, passPos.y)
        ctx.lineTo(passPos.x, passPos.y - markerRadius * 0.5)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(passPos.x, passPos.y)
        ctx.lineTo(passPos.x + markerRadius * 0.4, passPos.y - markerRadius * 0.2)
        ctx.stroke()
      }

      // Show speed indicator
      if (player.speed && player.speed !== 100) {
        ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        ctx.fillStyle = baseColor
        ctx.textAlign = 'center'
        const playerRadius = player.isAnimating ? props.canvasConfig.playerRadius * 1.15 : props.canvasConfig.playerRadius
        ctx.fillText(`${player.speed}%`, player.x, player.y - playerRadius - 10)
      }
    }
  })
  
  // Draw current path being drawn
  if (props.isDrawingPath && props.currentPath.length > 1) {
    const player = props.uiState.selectedPlayer
    if (player) {
      const color = player.type === 'attacking' ? COLORS.ATTACKING.PRIMARY : COLORS.DEFENSIVE.PRIMARY
      
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.globalAlpha = 0.9
      ctx.lineWidth = 3
      ctx.setLineDash([8, 6])
      
      ctx.moveTo(props.currentPath[0].x, props.currentPath[0].y)
      
      props.currentPath.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y)
      })
      
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.setLineDash([])
      
      // Minimal current path points
      props.currentPath.forEach((point, index) => {
        if (index > 0) {
          ctx.beginPath()
          ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.fill()
        }
      })
    }
  }
}

// Mouse event handlers
const handleMouseDown = (event: MouseEvent) => {
  if (!canvas.value) return
  
  const position = getMousePosition(event)
  mouseState.value.isDown = true
  mouseState.value.lastPosition = position
  mouseState.value.lastClient = { x: event.clientX, y: event.clientY }
  
  // Start panning if Space is held or Pan mode is active
  if (spaceDown.value || props.panMode) {
    isPanning.value = true
    return
  }
  
  // Check for ball click
  if (isPointInBall(position)) {
    emit('ball-click', props.ball, event)
    return
  }
  
  // Check for existing path point drag
  // NOTE: Path points are not currently draggable; allow clicks to fall
  // through so players remain easy to select even when they have paths.
  
  // Check for player click
  const clickedPlayer = getPlayerAt(position)
  if (clickedPlayer) {
    handlePlayerClick(clickedPlayer, event)
    return
  }
  
  // Empty space click
  emit('canvas-click', position, event)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!canvas.value || !mouseState.value.isDown) return

  const position = getMousePosition(event)

  // Cancel long-press if user starts dragging
  if (clickState.value.longPressTimer && clickState.value.dragStartPosition) {
    const dx = position.x - clickState.value.dragStartPosition.x
    const dy = position.y - clickState.value.dragStartPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > DRAG_THRESHOLD) {
      clearTimeout(clickState.value.longPressTimer)
      clickState.value.longPressTimer = null
    }
  }

  if (isPanning.value) {
    // Use client delta scaled to canvas pixel space to update pan in screen pixels
    const rect = canvas.value.getBoundingClientRect()
    const scaleX = props.canvasConfig.width / rect.width
    const scaleY = props.canvasConfig.height / rect.height
    const dxClient = event.clientX - mouseState.value.lastClient.x
    const dyClient = event.clientY - mouseState.value.lastClient.y
    pan.value.x += dxClient * scaleX
    pan.value.y += dyClient * scaleY
    clampPan()
    requestAnimationFrame(drawPitch)
    mouseState.value.lastPosition = position
    mouseState.value.lastClient = { x: event.clientX, y: event.clientY }
    return
  }

  if (props.uiState.selectedBall) {
    emit('ball-drag', props.ball, position)
  } else if (props.uiState.selectedPlayer) {
    emit('player-drag', props.uiState.selectedPlayer, position)
  }

  mouseState.value.lastPosition = position
}

const handleMouseUp = () => {
  mouseState.value.isDown = false
  isPanning.value = false

  // Clear long-press timer on mouse up
  if (clickState.value.longPressTimer) {
    clearTimeout(clickState.value.longPressTimer)
    clickState.value.longPressTimer = null
  }

  if (props.isDrawingPath && props.uiState.selectedPlayer && props.currentPath.length > 1) {
    emit('path-draw', props.uiState.selectedPlayer, [...props.currentPath])
  }
}

const handlePlayerClick = (player: Player, event: MouseEvent) => {
  const now = Date.now()
  const position = getMousePosition(event)

  // Check if this is a double-click
  if (clickState.value.lastPlayer === player &&
      now - clickState.value.lastClickTime < DOUBLE_CLICK_THRESHOLD) {
    // Double-click detected - open menu
    if (clickState.value.timer) {
      clearTimeout(clickState.value.timer)
    }
    if (clickState.value.longPressTimer) {
      clearTimeout(clickState.value.longPressTimer)
    }
    emit('player-double-click', player, event)
    clickState.value.count = 0
    clickState.value.lastPlayer = null
    return
  }

  // Single click - emit immediately for responsive interaction
  clickState.value.lastPlayer = player
  clickState.value.lastClickTime = now
  clickState.value.dragStartPosition = position

  // Emit click immediately so drag/path drawing works without delay
  emit('player-click', player, event)

  // Start long-press timer
  clickState.value.longPressTimer = window.setTimeout(() => {
    emit('player-long-press', player, event)
  }, LONG_PRESS_DURATION)
}

// Utility functions
const getMousePosition = (event: MouseEvent): { x: number, y: number } => {
  if (!canvas.value) return { x: 0, y: 0 }
  
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = props.canvasConfig.width / rect.width
  const scaleY = props.canvasConfig.height / rect.height
  
  const cx = (event.clientX - rect.left) * scaleX
  const cy = (event.clientY - rect.top) * scaleY
  const zoom = props.zoom ?? 1
  
  return {
    x: (cx - pan.value.x) / zoom,
    y: (cy - pan.value.y) / zoom
  }
}

const isPointInBall = (point: { x: number, y: number }): boolean => {
  const dx = props.ball.x - point.x
  const dy = props.ball.y - point.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance <= props.canvasConfig.ballRadius
}

const getPlayerAt = (point: { x: number, y: number }): Player | null => {
  return props.players.find(player => {
    const dx = player.x - point.x
    const dy = player.y - point.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    return distance <= 20 // Click detection radius
  }) || null
}

const getPathPointAt = (point: { x: number, y: number }): { player: Player, pointIndex: number } | null => {
  for (const player of props.players) {
    if (player.path && player.path.length > 0) {
      for (let i = 0; i < player.path.length; i++) {
        const pathPoint = player.path[i]
        const dx = pathPoint.x - point.x
        const dy = pathPoint.y - point.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance <= 8) {
          return { player, pointIndex: i }
        }
      }
    }
  }
  return null
}

// Public method for external redraws
const redraw = () => {
  drawPitch()
}

defineExpose({
  redraw
})
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-2);
  background: var(--surface);
  border: 1px solid var(--border);
}

canvas {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius);
  cursor: crosshair;
}

.panning canvas { cursor: grab; }
.panning-active canvas { cursor: grabbing; }
</style> 
