<template>
  <!-- No visible UI; this component only manages the Shepherd tour -->
  <div aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { useShepherd } from 'vue-shepherd/dist/vue-shepherd.esm.js'

const createTour = () => {
  const tour = useShepherd({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: {
        enabled: true,
      },
      scrollTo: {
        behavior: 'smooth',
        block: 'center',
      },
      highlightClass: 'tour-highlight',
    },
  })

  tour.addStep({
    id: 'add-red-players',
    title: 'Click “Add Red”',
    attachTo: {
      element: '.add-red',
      on: 'right',
    },
    text: 'Click the Add Red button to start adding attacking players. This opens the player setup dialog for your red (attacking) team.',
    advanceOn: {
      selector: '.add-red',
      event: 'click',
    },
    buttons: [
      {
        text: 'Exit',
        action: tour.cancel,
      },
    ],
  })

  tour.addStep({
    id: 'set-attacking-and-count',
    title: 'Set to attacking and add 4',
    attachTo: {
      element: '.dialog-actions',
      on: 'top',
    },
    text: 'In the player dialog, make sure you are adding Red (attacking) players, then use the number field to set it to 4 and click “Add 4 Players” to place them on the pitch.',
    advanceOn: {
      selector: '.dialog-actions .dialog-btn.confirm',
      event: 'click',
    },
    buttons: [
      {
        text: 'Exit',
        action: tour.cancel,
      },
    ],
  })

  tour.addStep({
    id: 'draw-paths',
    title: 'Draw running lines',
    attachTo: {
      element: '.rugby-pitch-container',
      on: 'top',
    },
    text: 'Triple-click a player to open their options, switch them to path mode, then drag on the pitch to sketch their running route.',
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Next',
        action: tour.next,
      },
      {
        text: 'Exit',
        action: tour.cancel,
      },
    ],
  })

  tour.addStep({
    id: 'record-play',
    title: 'Record the full play',
    attachTo: {
      element: '.play-actions-container',
      on: 'bottom',
    },
    text: 'Open the Play Actions menu to run your phases. When you are ready, use “Record Full Play” to capture the entire movement as a recording.',
    buttons: [
      {
        text: 'Exit',
        action: tour.cancel,
      },
    ],
    advanceOn: {
      selector: '.action-btn.record',
      event: 'click',
    },
  })

  tour.addStep({
    id: 'save-play',
    title: 'Save and replay',
    text: 'After recording finishes, give your play a name in the save dialog. You can then find it in Saved Plays and replay it any time.',
    buttons: [
      {
        text: 'Back',
        action: tour.back,
      },
      {
        text: 'Finish',
        action: tour.complete,
      },
    ],
  })

  return tour
}

const startTour = () => {
  const tour = createTour()
  tour.start()
}

defineExpose({
  startTour,
})
</script>
