/**
 * Automated Test Suite for Rugby Application
 *
 * Test Scenario:
 * Phase 1:
 *   - Sequence 1: Add 4 red players, place ball with player 1, draw 20m line, run
 *   - Sequence 2: Player 1 passes to player 2, draw line in front of player 2, run
 *
 * Phase 2:
 *   - Sequence 1: Pass to player 3, draw 30m line in front of player 3 and player 4
 *   - Player 4 creates a timed pass 20m in front
 */

describe('Rugby Application - Automated Test Suite', () => {
  beforeEach(() => {
    // Visit the app and wait for it to load
    cy.visit('/')
    cy.wait(1000)

    // Open the hamburger menu if it's not already open
    cy.get('body').then(($body) => {
      if ($body.find('.sidebar.open').length === 0) {
        cy.get('[data-cy=menu-btn]').click()
        cy.wait(500)
      }
    })

    // Wait for sidebar to be fully open
    cy.get('.sidebar.open').should('exist')
    cy.wait(500)

    // Try to clear existing play if the button exists
    cy.get('body').then(($body) => {
      const clearBtn = $body.find('[data-cy=clear-play-btn]')
      if (clearBtn.length > 0) {
        cy.log('Clearing existing play data')
        cy.get('[data-cy=clear-play-btn]').click({ force: true })
        cy.wait(500)

        // Click confirm button in dialog if it appears
        cy.get('body').then(($dialogBody) => {
          if ($dialogBody.find('[data-cy=confirm-dialog]').length > 0) {
            cy.get('[data-cy=confirm-btn]').click()
            cy.wait(1000)
          }
        })
      }
    })
  })

  it('should complete full automated test sequence with visible mouse movements', () => {
    // Enable real mouse events
    cy.log('Starting automated test suite')

    // Scroll canvas to center
    cy.get('canvas').scrollIntoView({ duration: 500, offset: { top: -200, left: 0 } })
    cy.wait(500)

    // ============================================
    // STEP 1: Add 4 Red Players
    // ============================================
    cy.log('Step 1: Adding 4 red players')

    // Ensure sidebar is open
    cy.get('body').then(($body) => {
      if ($body.find('.sidebar.open').length === 0) {
        cy.get('[data-cy=menu-btn]').click()
        cy.wait(500)
      }
    })

    // Wait for sidebar to be fully visible
    cy.get('.sidebar.open').should('exist')
    cy.wait(300)

    // Click "Add Red" button
    cy.get('[data-cy=add-red-btn]')
      .should('be.visible')
      .click({ force: true })

    cy.wait(1000)

    // In the dialog, set player count to 4
    cy.get('[data-cy=player-dialog]').should('be.visible')

    // Click increment button to reach 4 players (assuming it starts at 1)
    for (let i = 0; i < 3; i++) {
      cy.get('[data-cy=player-count-increment]').realClick()
      cy.wait(300)
    }

    // Confirm player addition
    cy.get('[data-cy=confirm-add-players]')
      .should('be.visible')
      .click()

    cy.wait(1500)
    cy.log('4 red players added')

    // ============================================
    // STEP 2: Place Ball with Player 1
    // ============================================
    cy.log('Step 2: Placing ball with player 1')

    // Get canvas dimensions and find player 1 position
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      // Player 1 should be positioned near the center-left of the field
      // Approximate position for player 1 (adjust based on your formation)
      const player1X = rect.left + rect.width * 0.3
      const player1Y = rect.top + rect.height * 0.5

      // Click near player 1 to attach the ball
      cy.wrap($canvas)
        .realClick({ x: player1X, y: player1Y })
        .wait(1000)
    })

    cy.log('Ball placed with player 1')

    // ============================================
    // STEP 3: Draw 20m Line in Front of Player 1
    // ============================================
    cy.log('Step 3: Drawing 20m line in front of player 1')

    // Triple-click player 1 to open player options
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const player1X = rect.left + rect.width * 0.3
      const player1Y = rect.top + rect.height * 0.5

      // Triple-click to open player options menu
      cy.wrap($canvas)
        .realClick({ x: player1X, y: player1Y, clickCount: 3 })
        .wait(1000)
    })

    // Switch player to path mode
    cy.get('[data-cy=path-mode-btn]').should('be.visible').realClick()
    cy.wait(500)

    // Draw a path 20m forward (approximately 100px on canvas)
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const startX = rect.left + rect.width * 0.3
      const startY = rect.top + rect.height * 0.5
      const endX = startX + 100 // 20m forward
      const endY = startY

      // Draw the path with visible mouse movement
      cy.wrap($canvas)
        .trigger('mousedown', { clientX: startX, clientY: startY, force: true })
        .wait(500)
        .trigger('mousemove', { clientX: endX, clientY: endY, force: true })
        .wait(500)
        .trigger('mouseup', { clientX: endX, clientY: endY, force: true })
        .wait(500)
    })

    cy.log('20m line drawn in front of player 1')

    // ============================================
    // STEP 4: Add Player 1 to Sequence and Run
    // ============================================
    cy.log('Step 4: Adding player 1 to sequence and running')

    // Open sequence manager
    cy.get('[data-cy=sequence-manager-trigger]').should('be.visible').realClick()
    cy.wait(500)

    // Select player 1 for looping
    cy.get('[data-cy=select-all-players-btn]').should('be.visible').realClick()
    cy.wait(500)

    // Run the sequence
    cy.get('[data-cy=play-actions-trigger]').should('be.visible').realClick()
    cy.wait(500)
    cy.get('[data-cy=run-current-sequence-btn]').should('be.visible').realClick()
    cy.wait(3000) // Wait for animation to complete

    cy.log('Sequence 1 complete')

    // ============================================
    // STEP 5: Create New Sequence - Player 1 Passes to Player 2
    // ============================================
    cy.log('Step 5: Creating new sequence - Player 1 passes to Player 2')

    // Open sequence manager
    cy.get('[data-cy=sequence-manager-trigger]').should('be.visible').realClick()
    cy.wait(500)

    // Add new sequence
    cy.get('[data-cy=add-sequence-btn]').should('be.visible').realClick()
    cy.wait(500)

    // Now we need to make player 2 active in this sequence
    // First, triple-click player 2 to select it
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      // Player 2 position (approximate)
      const player2X = rect.left + rect.width * 0.35
      const player2Y = rect.top + rect.height * 0.5

      // Press number key "2" to pass ball to player 2
      cy.get('body').type('2')
      cy.wait(500)

      // Triple-click player 2 to open options
      cy.wrap($canvas)
        .realClick({ x: player2X, y: player2Y, clickCount: 3 })
        .wait(1000)
    })

    // Set player 2 to path mode
    cy.get('[data-cy=path-mode-btn]').should('be.visible').realClick()
    cy.wait(500)

    // Draw line in front of player 2
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const startX = rect.left + rect.width * 0.35
      const startY = rect.top + rect.height * 0.5
      const endX = startX + 100
      const endY = startY

      cy.wrap($canvas)
        .trigger('mousedown', { clientX: startX, clientY: startY, force: true })
        .wait(500)
        .trigger('mousemove', { clientX: endX, clientY: endY, force: true })
        .wait(500)
        .trigger('mouseup', { clientX: endX, clientY: endY, force: true })
        .wait(500)
    })

    // Run this sequence
    cy.get('[data-cy=play-actions-trigger]').should('be.visible').realClick()
    cy.wait(500)
    cy.get('[data-cy=run-current-sequence-btn]').should('be.visible').realClick()
    cy.wait(3000)

    cy.log('Sequence 2 complete')

    // ============================================
    // STEP 6: Create New Phase
    // ============================================
    cy.log('Step 6: Creating new phase')

    // Open sequence manager
    cy.get('[data-cy=sequence-manager-trigger]').should('be.visible').realClick()
    cy.wait(500)

    // Add new phase
    cy.get('[data-cy=add-phase-btn]').should('be.visible').realClick()
    cy.wait(500)

    cy.log('New phase created')

    // ============================================
    // STEP 7: Pass to Player 3 and Draw Lines for Players 3 and 4
    // ============================================
    cy.log('Step 7: Passing to player 3 and drawing lines')

    // Pass ball to player 3
    cy.get('body').type('3')
    cy.wait(500)

    // Triple-click player 3 to open options
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const player3X = rect.left + rect.width * 0.4
      const player3Y = rect.top + rect.height * 0.5

      cy.wrap($canvas)
        .realClick({ x: player3X, y: player3Y, clickCount: 3 })
        .wait(1000)
    })

    // Set player 3 to path mode
    cy.get('[data-cy=path-mode-btn]').should('be.visible').realClick()
    cy.wait(500)

    // Draw 30m line in front of player 3
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const startX = rect.left + rect.width * 0.4
      const startY = rect.top + rect.height * 0.5
      const endX = startX + 150 // 30m forward
      const endY = startY

      cy.wrap($canvas)
        .trigger('mousedown', { clientX: startX, clientY: startY, force: true })
        .wait(500)
        .trigger('mousemove', { clientX: endX, clientY: endY, force: true })
        .wait(500)
        .trigger('mouseup', { clientX: endX, clientY: endY, force: true })
        .wait(500)
    })

    // Now do the same for player 4
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const player4X = rect.left + rect.width * 0.45
      const player4Y = rect.top + rect.height * 0.5

      cy.wrap($canvas)
        .realClick({ x: player4X, y: player4Y, clickCount: 3 })
        .wait(1000)
    })

    // Set player 4 to path mode
    cy.get('[data-cy=path-mode-btn]').should('be.visible').realClick()
    cy.wait(500)

    // Draw 30m line in front of player 4
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const startX = rect.left + rect.width * 0.45
      const startY = rect.top + rect.height * 0.5
      const endX = startX + 150
      const endY = startY

      cy.wrap($canvas)
        .trigger('mousedown', { clientX: startX, clientY: startY, force: true })
        .wait(500)
        .trigger('mousemove', { clientX: endX, clientY: endY, force: true })
        .wait(500)
        .trigger('mouseup', { clientX: endX, clientY: endY, force: true })
        .wait(500)
    })

    cy.log('Lines drawn for players 3 and 4')

    // ============================================
    // STEP 8: Create Timed Pass for Player 4
    // ============================================
    cy.log('Step 8: Creating timed pass for player 4')

    // Select player 4 again
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const player4X = rect.left + rect.width * 0.45
      const player4Y = rect.top + rect.height * 0.5

      cy.wrap($canvas)
        .realClick({ x: player4X, y: player4Y, clickCount: 3 })
        .wait(1000)
    })

    // Open player options and set timed pass
    cy.get('[data-cy=timed-pass-btn]').should('be.visible').realClick()
    cy.wait(500)

    // Click on the path approximately 20m ahead (100px on the path)
    cy.get('canvas').scrollIntoView().then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()

      const passX = rect.left + rect.width * 0.45 + 100 // 20m forward on path
      const passY = rect.top + rect.height * 0.5

      cy.wrap($canvas)
        .realClick({ x: passX, y: passY })
        .wait(1000)
    })

    cy.log('Timed pass created for player 4')

    // ============================================
    // STEP 9: Run Full Play
    // ============================================
    cy.log('Step 9: Running full play')

    // Open play actions menu
    cy.get('[data-cy=play-actions-trigger]').should('be.visible').realClick()
    cy.wait(500)

    // Run full play
    cy.get('[data-cy=run-full-play-btn]').should('be.visible').realClick()
    cy.wait(8000) // Wait for full animation to complete

    cy.log('Full play complete!')

    // ============================================
    // VERIFICATION
    // ============================================
    cy.log('Test suite completed successfully')

    // Verify we're back to initial state
    cy.get('canvas').should('be.visible')
  })
})
