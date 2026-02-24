<template>
  <div class="app-shell" :class="{ 'with-sidebar': isDesktop && isMenuOpen }">
    <header class="app-bar" role="banner">
      <button
        data-cy="menu-btn"
        class="icon-btn menu-btn"
        @click="toggleMenu"
        :aria-expanded="isMenuOpen ? 'true' : 'false'"
        aria-label="Toggle navigation menu"
      >
        <svg v-if="!isMenuOpen" class="icon-24" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
        </svg>
        <svg v-else class="icon-24" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
      <div class="app-brand">
        <span class="app-title">Squiggle</span>
      </div>
      <div class="app-spacer"></div>
      <div class="app-actions" role="toolbar" aria-label="App actions"></div>
    </header>
    <SessionStatus />

    <aside class="sidebar" :class="{ open: isMenuOpen, persistent: isDesktop }">
      <div class="sidebar-content">
        <div class="player-controls">
          <!-- Teams Section -->
          <div class="menu-section">
            <div class="section-title">Teams</div>
            <div class="add-row">
              <button data-cy="add-red-btn" class="nav-btn add-red" @click="openAddPlayers('attacking')">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round"/>
                </svg>
                Add Red
              </button>
              <button class="nav-btn add-blue" @click="openAddPlayers('defensive')">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-linecap="round"/>
                </svg>
                Add Blue
              </button>
            </div>
            <div class="dropdown-row">
              <label for="attacking-team-select" class="dropdown-label">Attacking Team</label>
              <select
                id="attacking-team-select"
                class="team-select"
                :value="attackingSide"
                @change="setAttackingMenu(($event.target as HTMLSelectElement).value as 'attacking' | 'defensive')"
              >
                <option value="attacking">Red</option>
                <option value="defensive">Blue</option>
              </select>
            </div>
          </div>

          <!-- Section Divider -->
          <div class="section-divider"></div>

          <!-- Saved Plays Section -->
          <div class="menu-section">
            <button class="nav-btn plays" @click="showPlays = !showPlays">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Saved Plays
            </button>
            <div v-if="showPlays" class="plays-list">
              <div v-if="plays.length === 0" class="no-plays">No saved plays</div>
              <div v-else class="play-items">
                <div v-for="play in plays" :key="play.id" class="play-item">
                  <span class="play-name">{{ play.name }}</span>
                  <div class="play-actions">
                    <button @click="viewPlayback(play)" class="play-action-btn" title="View">
                      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M8 5v14l11-7z" fill="currentColor"/>
                      </svg>
                    </button>
                    <button @click="deletePlay(play.id)" class="play-action-btn" title="Delete">
                      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 3h6M4 7h16M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section Divider -->
          <div class="section-divider"></div>

          <!-- Play Actions Section -->
          <div class="menu-section" v-if="rugbyPitch">
            <PlayActionsMenu
              :is-recording="isRecording"
              :is-running-current-phase="rugbyPitch.animationState?.isRunningCurrentPhase?.value || false"
              :is-running-full-play="rugbyPitch.animationState?.isRunningFullPlay?.value || false"
              :has-any-sequences-in-current-phase="rugbyPitch.computedGameState?.hasAnySequencesInCurrentPhase || false"
              :has-multiple-phases="rugbyPitch.gameState?.phases?.value?.length > 1"
              :current-sequence-data="rugbyPitch.gameState?.currentSequenceData?.value || null"
              :available-sequences="rugbyPitch.gameState?.availableSequences?.value || []"
              :current-sequence="rugbyPitch.gameState?.currentSequence?.value || 0"
              @run-current-phase="rugbyPitch.handleRunCurrentPhase"
              @run-full-play="rugbyPitch.handleRunFullPlay"
              @run-current-sequence="rugbyPitch.handleSequenceRun"
              @reset-current-sequence="rugbyPitch.handleSequenceReset"
              @record-full-play="rugbyPitch.handleRecordFullPlay"
            />
          </div>

          <!-- Section Divider -->
          <div class="section-divider"></div>

          <!-- Sequence Manager Section -->
          <div class="menu-section" v-if="rugbyPitch">
            <SequencePopupMenu
              :phases="rugbyPitch.gameState?.phases?.value || []"
              :current-phase="rugbyPitch.gameState?.currentPhase?.value || 0"
              :is-sequence-mode="rugbyPitch.gameState?.isSequenceMode?.value || false"
              :current-sequence="rugbyPitch.gameState?.currentSequence?.value || 0"
              :available-sequences="rugbyPitch.gameState?.availableSequences?.value || []"
              :players-with-paths="rugbyPitch.gameState?.playersWithPaths?.value || []"
              :current-sequence-data="rugbyPitch.gameState?.currentSequenceData?.value || null"
              :players="rugbyPitch.gameState?.players?.value || []"
              @phase-select="rugbyPitch.handlePhaseSelect"
              @phase-add="rugbyPitch.handlePhaseAdd"
              @phase-remove="rugbyPitch.handlePhaseRemove"
              @select-sequence="rugbyPitch.handleSequenceSelect"
              @add-sequence="rugbyPitch.handleSequenceAdd"
              @remove-sequence="rugbyPitch.handleSequenceRemove"
              @toggle-player-loop="rugbyPitch.handlePlayerToggleLoop"
              @select-all-players="rugbyPitch.handleSelectAllPlayers"
              @deselect-all-players="rugbyPitch.handleDeselectAllPlayers"
            />
          </div>

          <!-- Section Divider -->
          <div class="section-divider"></div>

          <!-- Player Options Section -->
          <div class="menu-section" v-if="rugbyPitch">
            <PlayerOptionsMenu
              ref="playerOptionsMenu"
              :selected-player="rugbyPitch.uiState?.selectedPlayer || null"
              @set-player-mode="rugbyPitch.handlePlayerOptionsMode"
              @toggle-path-visibility="rugbyPitch.handlePlayerOptionsPathVisibility"
              @update-player-speed="rugbyPitch.handlePlayerOptionsSpeed"
              @adjust-player-delay="rugbyPitch.handlePlayerOptionsDelay"
              @reset-player-delay="rugbyPitch.handlePlayerOptionsDelayReset"
              @clear-player-path="rugbyPitch.handlePlayerOptionsClearPath"
              @set-timed-pass="rugbyPitch.handleSetTimedPass"
              @clear-timed-pass="rugbyPitch.handleClearTimedPass"
            />
          </div>

          <!-- Section Divider -->
          <div class="section-divider"></div>

          <!-- Clear Current Play -->
          <div class="menu-section">
            <button data-cy="clear-play-btn" class="nav-btn danger" @click="clearPlayFromMenu">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 3h6M4 7h16M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Clear Current Play
            </button>
          </div>

          <!-- Help & Tips Section -->
          <div class="menu-section">
            <button class="nav-btn help-btn" @click="showHelp = !showHelp">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 15a1.5 1.5 0 1 1 1.5-1.5A1.502 1.502 0 0 1 12 17Zm1.8-6.9-.9.78A1.75 1.75 0 0 0 12 12.75V13h-1.5v-.25a3.25 3.25 0 0 1 1.05-2.4l1.14-.99a1.75 1.75 0 1 0-2.89-1.32H8.3A3.25 3.25 0 1 1 14.2 10.1Z"
                  fill="currentColor"
                />
              </svg>
              Help &amp; Tips
            </button>
            <div v-if="showHelp" class="help-panel">
              <div class="help-accordion">
                <div class="help-accordion-item">
                  <button
                    type="button"
                    class="help-accordion-header"
                    @click="toggleHelpSection('setup')"
                  >
                    <span>Setting up players</span>
                    <span class="help-chevron" :class="{ open: helpSections.setup }">▾</span>
                  </button>
                  <div v-if="helpSections.setup" class="help-accordion-body">
                    <p class="help-text">
                      Use <strong>Add Red</strong> / <strong>Add Blue</strong> to place players, then drag them on the canvas to position them.
                    </p>
                  </div>
                </div>

                <div class="help-accordion-item">
                  <button
                    type="button"
                    class="help-accordion-header"
                    @click="toggleHelpSection('paths')"
                  >
                    <span>Drawing running lines</span>
                    <span class="help-chevron" :class="{ open: helpSections.paths }">▾</span>
                  </button>
                  <div v-if="helpSections.paths" class="help-accordion-body">
                    <p class="help-text">
                      Triple-click a player to open options and switch them to path mode, then drag to sketch their route.
                    </p>
                  </div>
                </div>

                <div class="help-accordion-item">
                  <button
                    type="button"
                    class="help-accordion-header"
                    @click="toggleHelpSection('phases')"
                  >
                    <span>Phases, sequences &amp; actions</span>
                    <span class="help-chevron" :class="{ open: helpSections.phases }">▾</span>
                  </button>
                  <div v-if="helpSections.phases" class="help-accordion-body">
                    <p class="help-text">
                      Build phases and sequences with the top menus, then use <strong>Play Actions</strong> to run the current phase or the full play.
                    </p>
                  </div>
                </div>

                <div class="help-accordion-item">
                  <button
                    type="button"
                    class="help-accordion-header"
                    @click="toggleHelpSection('zoom')"
                  >
                    <span>Zoom &amp; pan</span>
                    <span class="help-chevron" :class="{ open: helpSections.zoom }">▾</span>
                  </button>
                  <div v-if="helpSections.zoom" class="help-accordion-body">
                    <p class="help-text">
                      Use the zoom icon on the canvas to zoom or toggle pan mode when working on large plays.
                    </p>
                  </div>
                </div>

                <div class="help-accordion-item">
                  <button
                    type="button"
                    class="help-accordion-header"
                    @click="toggleHelpSection('tutorial')"
                  >
                    <span>First play tutorial</span>
                    <span class="help-chevron" :class="{ open: helpSections.tutorial }">▾</span>
                  </button>
                  <div v-if="helpSections.tutorial" class="help-accordion-body">
                    <p class="help-text">
                      Walk through creating, recording, and saving your very first play step-by-step.
                    </p>
                    <button class="nav-btn tutorial-btn" @click="launchFirstPlayTour">
                      Start First Play Tutorial
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div v-if="!isDesktop && isMenuOpen" class="backdrop" @click="isMenuOpen = false"></div>

    <main class="main-content">
      <div v-if="currentPlayback" class="playback-screen">
        <div class="playback-header">
          <button @click="closePlayback" class="close-btn">← Back to Match</button>
          <h2 class="playback-title">{{ currentPlayback.name }}</h2>
        </div>
        <PlaybackViewer :playback-data="currentPlayback.playerStates" :ball-events="currentPlayback.ballEvents || []" @sequence-complete="handleSequenceComplete" />
      </div>
      <div v-else class="pitch-container">
        <RugbyPitch
          ref="rugbyPitch"
          :is-recording="isRecording"
          @update:is-recording="handleRecordingChange"
          :playback-data="[]"
          :zoom="zoom"
          :pan-mode="panMode"
          :zoom-min="ZOOM_MIN"
          :zoom-max="ZOOM_MAX"
          :zoom-step="ZOOM_STEP"
          :is-modal-active="showSavePlayDialog"
          @update:zoom="zoom = $event"
          @update:pan-mode="panMode = $event"
          @update:player-states="updatePlayerStates"
          @record:ball-event="handleBallEvent"
          @open-player-menu="handleOpenPlayerMenu"
        />
      </div>
    </main>

    <SavePlayDialog :show="showSavePlayDialog" @save="handleSavePlay" @cancel="handleCancelSave" />

    <ConfirmDialog
      :show="showClearConfirm"
      title="Clear All Plays"
      message="Are you sure you want to clear all plays? This action cannot be undone."
      confirm-text="Clear All Plays"
      @confirm="handleClearAllPlaysConfirm"
      @cancel="showClearConfirm = false"
    />

    <div v-if="showStorageDialog" class="modal-backdrop" @click="showStorageDialog = false"></div>
    <div v-if="showStorageDialog" class="modal storage-quota">
      <h3 class="modal-title">Storage Is Full</h3>
      <p class="modal-message">{{ quotaMessage }}</p>
      <div class="modal-actions">
        <button class="modal-btn primary" @click="openManageSavedPlays">Manage Saved Plays</button>
        <button class="modal-btn" :disabled="!pendingSave" @click="retryPendingSave">Retry Save</button>
        <button class="modal-btn" @click="showStorageDialog = false">Cancel</button>
      </div>
    </div>

    <FirstPlayTour ref="firstPlayTour" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import RugbyPitch from './components/RugbyPitch.vue'
import PlaybackViewer from './components/PlaybackViewer.vue'
import SavePlayDialog from './components/SavePlayDialog.vue'
import SessionStatus from './components/SessionStatus.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import FirstPlayTour from './components/FirstPlayTour.vue'
import PlayActionsMenu from './components/PlayActionsMenu.vue'
import SequencePopupMenu from './components/SequencePopupMenu.vue'
import PlayerOptionsMenu from './components/PlayerOptionsMenu.vue'
import { playService } from './services/playService'
import { usePlaysStore } from './stores/playsStore'
import { useSessionStore } from './stores/sessionStore'
import { useActivityTracker } from './composables/useActivityTracker'
import type { Play, PlayerState } from './types/play'
import type { BallPassEvent } from './types/game'

const isMenuOpen = ref(false)
const isDesktop = ref(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1
const zoom = ref(1)
const panMode = ref(false)
const attackingSide = ref<'attacking' | 'defensive'>('attacking')
const showAttackingCount = ref(false)
const showDefensiveCount = ref(false)
const selectedAttackingCount = ref(0)
const selectedDefensiveCount = ref(0)
const isRecording = ref(false)
const showPlays = ref(false)
const showHelp = ref(false)
type HelpSectionKey = 'setup' | 'paths' | 'phases' | 'zoom' | 'tutorial'

const helpSections = ref<Record<HelpSectionKey, boolean>>({
  setup: true,
  paths: false,
  phases: false,
  zoom: false,
  tutorial: false,
})

const toggleHelpSection = (key: HelpSectionKey) => {
  helpSections.value[key] = !helpSections.value[key]
}

const firstPlayTour = ref<InstanceType<typeof FirstPlayTour> | null>(null)

const launchFirstPlayTour = () => {
  firstPlayTour.value?.startTour()
}
const currentPlayback = ref<Play | null>(null)
const currentPlayerStates = ref<PlayerState[]>([])
const currentBallEvents = ref<BallPassEvent[]>([])
const players = ref<PlayerState[]>([])
const showSavePlayDialog = ref(false)
const showClearConfirm = ref(false)
const showStorageDialog = ref(false)
const pendingSave = ref<{ name: string; playerStates: PlayerState[]; ballEvents: BallPassEvent[] } | null>(null)
const quotaMessage = ref('Storage is full. Please remove some saved plays, then retry saving your play.')

const playsStore = usePlaysStore()
const sessionStore = useSessionStore()
useActivityTracker()

// Use computed to ensure reactivity with the store
const plays = computed(() => playsStore.plays)

// Child ref to control RugbyPitch from the sidebar
const rugbyPitch = ref<InstanceType<typeof RugbyPitch> | null>(null)
const playerOptionsMenu = ref<InstanceType<typeof PlayerOptionsMenu> | null>(null)

onMounted(async () => {
  // Periodically enforce transient clear on inactivity expiry
  const check = () => {
    if (!sessionStore.isSessionValid) {
      if (isRecording.value) isRecording.value = false
      if (currentPlayerStates.value.length > 0) currentPlayerStates.value = []
      if (currentBallEvents.value.length > 0) currentBallEvents.value = []
    }
  }
  ;(window as any).__squiggleExpiryTimer = window.setInterval(check, 30000)

  const onResize = () => {
    isDesktop.value = window.innerWidth >= 1024
    // Default to open on desktop, closed on mobile/tablet
    if (isDesktop.value) {
      isMenuOpen.value = true
    }
  }
  window.addEventListener('resize', onResize)
  // Initial layout
  onResize()
  ;(window as any).__squiggleResizeHandler = onResize
})

// Clear only transient/unsaved data on inactivity expiry; do not touch saved plays
watch(() => sessionStore.isSessionValid, (valid) => {
  if (!valid) {
    isRecording.value = false
    currentPlayerStates.value = []
    currentBallEvents.value = []
  }
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))
const adjustZoom = (delta: number) => {
  zoom.value = clamp(parseFloat((zoom.value + delta).toFixed(2)), ZOOM_MIN, ZOOM_MAX)
}

// Sidebar team controls
const openAddPlayers = (type: 'attacking' | 'defensive') => {
  rugbyPitch.value?.openAddPlayersDialog?.(type)
}

const setAttackingMenu = (type: 'attacking' | 'defensive') => {
  attackingSide.value = type
  rugbyPitch.value?.setAttacking?.(type)
}

// Play actions from menu
const toggleRecordingFromMenu = () => {
  rugbyPitch.value?.toggleRecording?.()
}

const savePlayFromMenu = () => {
  rugbyPitch.value?.saveCurrentPlay?.()
}

const clearPlayFromMenu = () => {
  rugbyPitch.value?.openClearPlayConfirm?.()
}

const showPlayerCount = (type: 'attacking' | 'defensive') => {
  if (type === 'attacking') {
    showAttackingCount.value = !showAttackingCount.value
    showDefensiveCount.value = false
  } else {
    showDefensiveCount.value = !showDefensiveCount.value
    showAttackingCount.value = false
  }
}

const selectPlayerCount = (type: 'attacking' | 'defensive', count: number) => {
  if (type === 'attacking') {
    selectedAttackingCount.value = count
    showAttackingCount.value = false
  } else {
    selectedDefensiveCount.value = count
    showDefensiveCount.value = false
  }
}

const handleRecordingChange = async (newValue: boolean) => {
  if (isRecording.value && !newValue) {
    if (currentPlayerStates.value.length > 0) {
      showSavePlayDialog.value = true
    }
  } else if (!isRecording.value && newValue) {
    currentPlayerStates.value = []
    currentBallEvents.value = []
  }
  isRecording.value = newValue
}

const updatePlayerStates = (states: PlayerState[]) => {
  if (isRecording.value) {
    currentPlayerStates.value = [...currentPlayerStates.value, ...states]
  }
}

const handleBallEvent = (event: BallPassEvent) => {
  if (!isRecording.value) return
  currentBallEvents.value = [...currentBallEvents.value, event]
}

const handleOpenPlayerMenu = () => {
  if (playerOptionsMenu.value) {
    playerOptionsMenu.value.openPopup()
  }
}

const viewPlayback = (play: Play) => {
  currentPlayback.value = play
  showPlays.value = false
}

const closePlayback = () => {
  currentPlayback.value = null
}

const deletePlay = async (id: string) => {
  try {
    await playService.deletePlay(id)
    // plays computed property will automatically update from the store
  } catch (error) {
    console.error('Failed to delete play:', error)
  }
}

const handleSequenceComplete = () => {}

const handleSavePlay = async (playName: string) => {
  try {
    const uniqueStates = currentPlayerStates.value.reduce((acc, state) => {
      const key = `${state.playerId}-${state.timestamp}`
      if (!acc.has(key)) {
        acc.set(key, state)
      }
      return acc
    }, new Map<string, PlayerState>())

    const uniqueEvents = currentBallEvents.value.reduce((acc, event) => {
      if (!acc.has(event.id)) {
        acc.set(event.id, event)
      }
      return acc
    }, new Map<string, BallPassEvent>())

    const request = {
      name: playName,
      playerStates: Array.from(uniqueStates.values()),
      ballEvents: Array.from(uniqueEvents.values()).sort((a, b) => a.startTimestamp - b.startTimestamp)
    }

    await playService.createPlay(request)
    // plays computed property will automatically update from the store
    currentPlayback.value = playsStore.plays[playsStore.plays.length - 1] || null
    showSavePlayDialog.value = false
    pendingSave.value = null
    currentPlayerStates.value = []
    currentBallEvents.value = []
  } catch (error) {
    console.error('Failed to save play:', error)
    const message = error instanceof Error ? error.message : ''
    if (message === 'STORAGE_QUOTA_EXCEEDED') {
      // Preserve the pending save and prompt the user to free space
      pendingSave.value = {
        name: playName,
        playerStates: [...currentPlayerStates.value],
        ballEvents: [...currentBallEvents.value],
      }
      showStorageDialog.value = true
    } else {
      alert('Failed to save play. Please try again.')
    }
  }
}

const handleCancelSave = () => {
  showSavePlayDialog.value = false
  currentPlayerStates.value = []
  currentBallEvents.value = []
}

// Export functionality
const handleExportPlays = async () => {
  try {
    await playService.exportPlays()
    alert('Plays exported successfully!')
  } catch (error) {
    console.error('Failed to export plays:', error)
    alert(`Failed to export plays: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Import functionality removed

const handleClearAllPlays = () => {
  showClearConfirm.value = true
}

const handleClearAllPlaysConfirm = async () => {
  try {
    await playService.clearAllPlays()
    // plays computed property will automatically update from the store
    currentPlayback.value = null
    alert('All plays cleared successfully!')
  } catch (error) {
    console.error('Failed to clear plays:', error)
    alert('Failed to clear plays. Please try again.')
  }
  showClearConfirm.value = false
}

// Cleanup
onUnmounted(() => {
  const id = (window as any).__squiggleExpiryTimer
  if (id) clearInterval(id)
  const rh = (window as any).__squiggleResizeHandler
  if (rh) window.removeEventListener('resize', rh)
})

// Storage quota helpers
const openManageSavedPlays = () => {
  showPlays.value = true
  isMenuOpen.value = true
  // Keep dialog open or close? Close so user can see list
  showStorageDialog.value = false
}

const retryPendingSave = async () => {
  if (!pendingSave.value) return
  try {
    await playService.createPlay(pendingSave.value)
    // plays computed property will automatically update from the store
    currentPlayback.value = playsStore.plays[playsStore.plays.length - 1] || null
    pendingSave.value = null
    showStorageDialog.value = false
    alert('Play saved successfully!')
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'STORAGE_QUOTA_EXCEEDED') {
      // Still full; keep dialog open
      alert('Storage is still full. Please remove more saved plays and try again.')
    } else {
      alert('Failed to save play. Please try again.')
    }
  }
}
</script>

<style>
:root {
  /* Sophisticated Dark Theme - Prefect Inspired */
  --bg: #0F172A;              /* deep neutral navy */
  --surface: #1E293B;         /* elevated surface */
  --surface-2: #334155;       /* more elevated surface */
  --surface-hover: #475569;   /* hover state */
  --text: rgba(248,250,252,0.95);
  --text-secondary: rgba(203,213,225,0.85);
  --muted: rgba(148,163,184,0.75);
  --border: rgba(71,85,105,0.4);
  --border-strong: rgba(100,116,139,0.6);
  --accent: #3B82F6;          /* vibrant blue accent */
  --accent-hover: #2563EB;
  --accent-contrast: #FFFFFF; /* accent foreground */
  --focus: rgba(59, 130, 246, 0.4);
  --radius: 16px;
  --radius-sm: 12px;
  --radius-xs: 8px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-md: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --sidebar-width: 320px;

  /* Button tokens - refined */
  --btn-bg: var(--surface-2);
  --btn-text: var(--text);
  --btn-border: var(--border);
  --btn-hover-bg: var(--surface-hover);
  --btn-active-bg: #1E293B;
  --btn-disabled-opacity: 0.5;

  --btn-primary-bg: var(--accent);
  --btn-primary-text: var(--accent-contrast);
  --btn-primary-hover-bg: var(--accent-hover);
  --btn-primary-active-bg: #1D4ED8;
  --appbar-h: 60px;

  /* Team tokens */
  --team-red: #EF4444;        /* elegant red */
  --team-blue: #3B82F6;       /* elegant blue */

  /* Refined gradients */
  --gradient-primary: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  --gradient-surface: linear-gradient(180deg, rgba(51, 65, 85, 0.8) 0%, rgba(30, 41, 59, 0.95) 100%);
  --gradient-shimmer: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);

  /* Map legacy tokens used in some components */
  --color-text: var(--text);
  --color-background: var(--surface);
  --color-background-soft: var(--surface);
  --color-background-mute: var(--surface-2);
  --color-border: var(--border);
  --color-border-hover: var(--border-strong);
  --color-accent: var(--accent);
}
@media (min-width: 1024px) {
  :root { --appbar-h: 72px; }
}

html, body, #app {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.011em;
}

.app-shell {
  min-height: 100vh;
  background: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-top: var(--appbar-h);
}

/* App Bar - Sophisticated */
.app-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--appbar-h);
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  z-index: 1200;
}
.app-brand { display: flex; align-items: center; gap: 12px; }
.app-title {
  font-weight: 700;
  letter-spacing: -0.025em;
  font-size: 1.25rem;
  color: var(--text);
  background: linear-gradient(135deg, #F8FAFC 0%, #CBD5E1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.app-spacer { flex: 1; }
.app-actions { display: flex; align-items: center; gap: 8px; }

/* Icon button - Refined */
.icon-btn {
  position: relative;
  width: 44px;
  height: 44px;
  display: inline-grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all .2s var(--ease-out);
  overflow: hidden;
}
.icon-24 { width: 22px; height: 22px; }
.menu-btn:hover {
  background: rgba(51, 65, 85, 0.6);
  color: var(--text);
  border-color: rgba(71, 85, 105, 0.4);
}
.icon-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--focus);
  border-color: var(--accent);
}
.icon-btn:active {
  background: rgba(51, 65, 85, 0.8);
  transform: scale(0.96);
}
.icon-btn::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  opacity: 0;
  border-radius: inherit;
  transform: scale(0);
  transition: transform .3s var(--ease-out), opacity .3s var(--ease-out);
}
.icon-btn:active::after { opacity: 1; transform: scale(1); }

.sidebar {
  position: fixed;
  top: var(--appbar-h);
  left: 0;
  height: calc(100vh - var(--appbar-h));
  width: var(--sidebar-width);
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-right: 1px solid rgba(71, 85, 105, 0.3);
  box-shadow: var(--shadow-lg);
  transform: translateX(-100%);
  transition: transform .3s var(--ease-out);
  z-index: 1050;
  display: flex;
  flex-direction: column;
}
.sidebar.open { transform: translateX(0); }
.sidebar .sidebar-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(71, 85, 105, 0.3);
}
.logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}
.sidebar-content {
  padding: 1.5rem 1.25rem 2rem;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Scrollbar styling for sidebar - Elegant */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border-radius: 3px;
  transition: background .2s var(--ease);
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.6);
}

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
}

.main-content {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
.pitch-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.playback-screen { width: 100%; margin: 0 auto; padding: 1rem; }
.playback-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }

/* Button base - Modern Flat Design */
.close-btn,
.zoom-btn,
.toggle-btn,
.modal-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  min-height: 40px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(71, 85, 105, 0.3);
  background: rgba(51, 65, 85, 0.3);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
  letter-spacing: -0.006em;
  transition: all .15s var(--ease-out);
  cursor: pointer;
}

.close-btn:focus-visible,
.zoom-btn:focus-visible,
.toggle-btn:focus-visible,
.modal-btn:focus-visible {
  outline: none;
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--accent);
  color: var(--text);
}

.close-btn {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
}

.close-btn:hover,
.zoom-btn:hover,
.toggle-btn:hover,
.modal-btn:hover {
  background: rgba(71, 85, 105, 0.4);
  border-color: rgba(100, 116, 139, 0.4);
  color: var(--text);
}

.close-btn:active,
.zoom-btn:active,
.toggle-btn:active,
.modal-btn:active {
  background: rgba(71, 85, 105, 0.5);
  transform: scale(0.98);
}

.playback-title {
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

@media (max-width: 768px) {
  .main-content { padding: 0.5rem; gap: 0.5rem; }
  .playback-header { gap: 0.5rem; margin-bottom: 0.5rem; }
  .playback-title { font-size: 1rem; }
}

/* Navigation buttons - Modern & Clean */
.nav-btn {
  -webkit-font-smoothing: antialiased;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  width: 100%;
  padding: 0.625rem 0.875rem;
  margin-bottom: 0.25rem;
  min-height: 40px;
  border-radius: var(--radius-xs);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.4;
  letter-spacing: -0.006em;
  transition: all .15s var(--ease-out);
  cursor: pointer;
  position: relative;
}

.nav-btn:focus-visible {
  outline: none;
  background: rgba(59, 130, 246, 0.1);
  color: var(--text);
}

.nav-btn:hover {
  background: rgba(71, 85, 105, 0.4);
  color: var(--text);
}

.nav-btn:active {
  background: rgba(71, 85, 105, 0.5);
  transform: scale(0.98);
}

.nav-btn.danger {
  color: var(--text-secondary);
}

.nav-btn.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #FCA5A5;
}

.nav-btn.danger:active {
  background: rgba(239, 68, 68, 0.15);
}

.nav-btn .icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  display: block;
  opacity: 0.7;
  transition: opacity .15s var(--ease-out);
}

.nav-btn:hover .icon {
  opacity: 1;
}
/* Icon sizing for inline SVGs */
.icon { display: inline-block; margin-right: 0.6rem; }
svg.icon { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.8; vector-effect: non-scaling-stroke; }
.play-action-btn .icon, .zoom-btn .icon { margin: 0; }
.play-action-btn svg.icon { width: 18px; height: 18px; }

.help-panel {
  margin-top: 0.75rem;
  padding: 1rem;
  border-radius: var(--radius-sm);
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.3);
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-sm);
}

.help-text {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--text-secondary);
}

.help-text:last-child {
  margin-bottom: 0;
}

.help-text strong {
  color: var(--text);
  font-weight: 600;
}

.help-accordion {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.help-accordion-item {
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.help-accordion-header {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: all .2s var(--ease-out);
  position: relative;
}

.help-accordion-header::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 0 2px 2px 0;
  transition: height .25s var(--ease-out);
}

.help-accordion-header:hover {
  color: var(--text);
  background: rgba(59, 130, 246, 0.1);
  padding-left: 1rem;
}

.help-accordion-header:hover::before {
  height: 75%;
}

.help-chevron {
  font-size: 0.8rem;
  transition: transform 0.15s var(--ease);
}

.help-chevron.open {
  transform: rotate(180deg);
}

.help-accordion-body {
  padding: 0.25rem 0 0.5rem 0;
}

.plays-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-plays {
  padding: 2rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.875rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: var(--radius-sm);
  border: 1px dashed rgba(71, 85, 105, 0.4);
  font-style: italic;
  backdrop-filter: blur(4px);
}

.play-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.play-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-xs);
  background: transparent;
  border: 1px solid transparent;
  transition: all .15s var(--ease-out);
  position: relative;
  cursor: pointer;
}

.play-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 100%;
  background: var(--accent);
  opacity: 0;
  transition: opacity .15s var(--ease-out);
  border-radius: 2px 0 0 2px;
}

.play-item:hover {
  background: rgba(71, 85, 105, 0.3);
  border-color: rgba(71, 85, 105, 0.4);
}

.play-item:hover::before {
  opacity: 1;
}

.play-name {
  color: var(--text);
  font-weight: 500;
  font-size: 0.9375rem;
  flex: 1;
  letter-spacing: -0.01em;
}

.play-actions {
  display: flex;
  gap: 0.5rem;
}

.play-action-btn {
  -webkit-font-smoothing: antialiased;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .15s var(--ease-out);
  cursor: pointer;
}

.play-action-btn:focus-visible {
  outline: none;
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--accent);
}

.play-action-btn:hover {
  background: rgba(71, 85, 105, 0.4);
  border-color: rgba(71, 85, 105, 0.4);
  color: var(--text);
}

.play-action-btn:active {
  background: rgba(71, 85, 105, 0.5);
  transform: scale(0.95);
}

/* Zoom controls removed - now in canvas */

/* Menu sections */
.menu-section {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  position: relative;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(71, 85, 105, 0.5) 50%, transparent 100%);
}

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(71, 85, 105, 0.4) 50%, transparent 100%);
  margin: 1.5rem 0;
  position: relative;
}

.dropdown-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dropdown-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.team-select {
  -webkit-font-smoothing: antialiased;
  width: 100%;
  padding: 0 0.875rem;
  height: 40px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(71, 85, 105, 0.3);
  background: rgba(51, 65, 85, 0.3);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 40px;
  letter-spacing: -0.006em;
  transition: all .15s var(--ease-out);
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
}

.team-select:hover {
  background: rgba(71, 85, 105, 0.4);
  border-color: rgba(100, 116, 139, 0.4);
  color: var(--text);
}

.team-select:focus-visible {
  outline: none;
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--accent);
  color: var(--text);
}

.team-select option {
  background: var(--surface);
  color: var(--text);
  padding: 0.75rem;
  font-weight: 500;
}
.seg-row { display: flex; gap: 6px; margin-bottom: 0.5rem; }
.seg-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  min-height: 40px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(71, 85, 105, 0.3);
  background: transparent;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
  letter-spacing: -0.006em;
  transition: all .15s var(--ease-out);
  cursor: pointer;
}
.seg-btn:focus-visible {
  outline: none;
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--accent);
}
.seg-btn:hover {
  background: rgba(71, 85, 105, 0.3);
  border-color: rgba(100, 116, 139, 0.4);
  color: var(--text);
}
.seg-btn.active {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: var(--btn-primary-bg);
}
.seg-btn.active:hover {
  background: var(--btn-primary-hover-bg);
  border-color: var(--btn-primary-hover-bg);
}
.dot { width: 8px; height: 8px; border-radius: 999px; display: inline-block; }
.dot.red { background: var(--team-red); }
.dot.blue { background: var(--team-blue); }
.add-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.nav-btn.add-red,
.nav-btn.add-blue {
  flex: 1;
  justify-content: center;
  font-weight: 600;
  border: 1px solid rgba(71, 85, 105, 0.3);
}

.nav-btn.add-red {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
  color: #FCA5A5;
}

.nav-btn.add-red:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #FCA5A5;
}

.nav-btn.add-red:active {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

.nav-btn.add-blue {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(59, 130, 246, 0.2);
  color: #93C5FD;
}

.nav-btn.add-blue:hover {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #93C5FD;
}

.nav-btn.add-blue:active {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
}

.add-red .icon {
  color: #FCA5A5;
}

.add-blue .icon {
  color: #93C5FD;
}

/* Actions */
.actions-controls { margin: 0.5rem 0 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
.record-btn { width: 100%; margin-bottom: 0.5rem; }

/* Pan */
.pan-controls { margin: 0.75rem 0 0; }
.toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
}
.toggle-btn.active {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
.toggle-btn.active:hover {
  background: var(--btn-primary-hover-bg);
  border-color: var(--btn-primary-hover-bg);
}
.pan-hint { margin-top: 0.25rem; color: var(--muted); font-size: 0.8rem; }

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
}
.modal.storage-quota {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem;
  width: 90%;
  max-width: 420px;
  color: var(--text);
  z-index: 2001;
  box-shadow: var(--shadow-2);
}
.modal-title { margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; }
.modal-message { margin: 0 0 1rem 0; color: var(--muted); }
.modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

.tutorial-btn {
  margin-top: 0.75rem;
}
.modal-btn {
  min-height: 40px;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
}
.modal-btn.primary {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
.modal-btn.primary:hover {
  background: var(--btn-primary-hover-bg);
  border-color: var(--btn-primary-hover-bg);
}
.modal-btn.primary:active {
  background: var(--btn-primary-active-bg);
  border-color: var(--btn-primary-active-bg);
  transform: scale(0.98);
}
.modal-btn:disabled {
  opacity: var(--btn-disabled-opacity);
  cursor: not-allowed;
}

/* Sidebar menu wrapper - no overrides, keep original component styling */
.sidebar-menu-wrapper {
  /* Empty - components use their original styles */
}
</style>
