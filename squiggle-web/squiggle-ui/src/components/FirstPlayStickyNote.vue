<template>
  <div
    v-if="show"
    ref="stickyNode"
    class="sticky-note"
    :style="style"
  >
    <div ref="dragHandle" class="sticky-note-header">
      <span>Create My First Play</span>
      <button @click="$emit('close')" class="sticky-note-close" aria-label="Close">
        <svg viewBox="0 0 24 24" class="icon" aria-hidden="true" width="16" height="16">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="sticky-note-content">
      <div class="sticky-note-intro">
        Follow this recipe to make your first play:
      </div>
      <ol class="sticky-note-steps">
        <li>Click the <strong>Add blue</strong> button.</li>
        <li>Add <strong>4 players</strong>.</li>
        <li><strong>Custom formation</strong> - adjust so that the 4 players line up next to each other.</li>
        <li>Click the <strong>Add 4 players</strong> button.</li>
        <li>Click the attacking team dropdown and select <strong>blue</strong> - this makes sure that the blue team has the ball passing functionality linked to the keyboard number clicks.</li>
        <li>Click <strong>1</strong> - this passes the ball to player one.</li>
        <li>Click on one and drag your mouse vertically downwards in a straight line to half way.</li>
        <li><strong>Play actions</strong> - run sequence.</li>
        <li><strong>Sequence manager</strong> - click the <strong>+</strong> button for add phase - this adds a phase. Click anywhere outside the dialog box.</li>
        <li>Click the ball to <strong>2</strong> - run 2 vertical downwards as well. Run that sequence as well so the player completes its sequence.</li>
        <li>Do the same for <strong>3</strong> - but this time there's a change. Pass the ball to 3. Drag the mouse vertical.</li>
        <li>But in the same sequence select <strong>4</strong>, drag it downwards too. Before running - <strong>click and hold</strong> on player 4, and select <strong>timed pass</strong>.</li>
        <li>Then click a position on the player 4 line - this will be the point at which the player will call for a timed pass - this is ideal for short lines concurrent with the player running with the ball. Now click <strong>run sequence</strong>.</li>
      </ol>
      <p class="sticky-note-conclusion">
        Congratulations, you have just created your first play.
      </p>
      <p class="sticky-note-conclusion-text">
        Click <strong>play actions - run full play</strong> to check that the play matches your expectations. If that looks all good, then click play actions again, <strong>record full play</strong>. Let the play run, then save as "First-play". Then Save. You can access your plays in saved plays. If you want to download it then you are able to do that. <br/><br/>
        <strong>Good luck and enjoy!</strong>
      </p>
      <p class="sticky-note-footer">
        You can drag me using the header, and resize me by dragging the bottom-right corner.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDraggable } from '@vueuse/core'

const props = defineProps<{
  show: boolean
}>()

defineEmits(['close'])

const stickyNode = ref<HTMLElement | null>(null)
const dragHandle = ref<HTMLElement | null>(null)

// Start roughly center or slightly offset
const initialX = typeof window !== 'undefined' ? Math.max(20, window.innerWidth / 2 - 150) : 20
const initialY = 100

const { style } = useDraggable(stickyNode, {
  initialValue: { x: initialX, y: initialY },
  handle: dragHandle,
})
</script>

<style scoped>
.sticky-note {
  position: fixed;
  background-color: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
  width: 420px;
  min-width: 300px;
  min-height: 350px;
  max-height: 85vh;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  resize: both;
  overflow: hidden;
  color: var(--text);
  /* A slight warm yellow tint commonly associated with sticky notes, but adapted for dark mode */
  background: linear-gradient(145deg, var(--surface) 0%, #2A3125 100%);
}

.sticky-note-header {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  user-select: none;
}

.sticky-note-header:active {
  cursor: grabbing;
}

.sticky-note-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.sticky-note-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text);
}

.sticky-note-content {
  padding: 16px;
  flex-grow: 1;
  overflow-y: auto;
  font-size: 0.95rem;
  line-height: 1.6;
}

.sticky-note-steps {
  padding-left: 20px;
  margin: 0 0 16px 0;
}

.sticky-note-steps li {
  margin-bottom: 12px;
}

.sticky-note-intro {
  margin-bottom: 12px;
  font-weight: 500;
  color: var(--text);
}

.sticky-note-conclusion {
  margin-top: 16px;
  margin-bottom: 16px;
  font-weight: 500;
  color: #60A5FA; /* nice blue accent */
}

.sticky-note-footer {
  font-size: 0.8rem;
  color: var(--muted);
  font-style: italic;
  margin: 0;
  border-top: 1px solid var(--border);
  padding-top: 12px;
  text-align: center;
}
</style>
