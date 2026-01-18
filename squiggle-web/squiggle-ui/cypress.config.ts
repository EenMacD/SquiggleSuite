import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:4173',
    // Enable video recording to capture mouse movements
    video: true,
    // Slow down command execution to make mouse movements visible
    defaultCommandTimeout: 10000,
    // Enable screenshots on failure
    screenshotOnRunFailure: true,
    // Wait for animations to complete
    waitForAnimations: true,
    animationDistanceThreshold: 5,
    // Viewport settings for better visibility
    viewportWidth: 1920,
    viewportHeight: 1080,
  },
})
