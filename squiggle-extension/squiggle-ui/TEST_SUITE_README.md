# Rugby Application - Automated Test Suite

This automated test suite demonstrates the complete workflow of creating and running rugby plays with visible mouse movements.

## Test Scenario

The test suite executes the following sequence:

### Phase 1

#### Sequence 1
1. Add 4 red (attacking) players to the field
2. Place the ball with player 1
3. Draw a 20-meter running line in front of player 1
4. Run the sequence

#### Sequence 2
1. Player 1 passes the ball to player 2 (press "2" key)
2. Draw a running line in front of player 2
3. Run the sequence

### Phase 2

#### Sequence 1
1. Pass the ball to player 3 (press "3" key)
2. Draw a 30-meter line in front of player 3
3. Draw a 30-meter line in front of player 4
4. Create a timed pass for player 4, 20 meters ahead on their path
5. Run the full play

## Running the Test Suite

### Quick Start

#### Option 1: Manual Test Runner (Recommended for macOS)

If you're on macOS and encounter code signing issues, use the manual test runner:

```bash
bash runtest-manual.sh
```

This will:
1. Build the application
2. Start the preview server
3. Open Cypress UI
4. You can then click on `automated-test-suite.cy.ts` to run the test with visible mouse movements

#### Option 2: Automated Test Runner

Simply run the provided bash script:

```bash
bash runtest.sh
```

Or make it executable and run directly:

```bash
chmod +x runtest.sh
./runtest.sh
```

**Note:** On macOS, you may encounter code signing issues with Cypress. If this happens, use Option 1 above.

### What the Script Does

The `runtest.sh` script will:
1. Check for required dependencies
2. Install `cypress-real-events` plugin for visible mouse movements
3. Build the application
4. Start the preview server
5. Run the automated test suite in headed mode (visible browser)
6. Display the test results

### Manual Test Execution

If you prefer to run the tests manually:

```bash
# Install dependencies (first time only)
npm install
npm install --save-dev cypress-real-events

# Build the application
npm run build

# Run the test
npm run test:e2e -- --spec "cypress/e2e/automated-test-suite.cy.ts" --headed
```

## Test Features

### Visible Mouse Movements

The test suite uses `cypress-real-events` to provide realistic mouse interactions:
- Click events show actual mouse movements
- Drag-and-drop operations are visually simulated
- All interactions are performed as a real user would

### Video Recording

Tests are automatically recorded. Videos are saved to:
```
cypress/videos/automated-test-suite.cy.ts.mp4
```

### Screenshots

Screenshots are captured on test failures and saved to:
```
cypress/screenshots/
```

## Test Configuration

The test is configured in [cypress.config.ts](./cypress.config.ts) with the following settings:

- **Video Recording**: Enabled to capture mouse movements
- **Viewport**: 1920x1080 for optimal visibility
- **Default Timeout**: 10 seconds to allow for animations
- **Animation Handling**: Waits for animations to complete

## Test File Structure

```
cypress/
├── e2e/
│   └── automated-test-suite.cy.ts    # Main test suite
├── support/
│   ├── e2e.ts                         # Support file with cypress-real-events
│   └── commands.ts                    # Custom Cypress commands
├── videos/                            # Test execution videos
└── screenshots/                       # Failure screenshots
```

## Troubleshooting

### macOS Code Signing Issues

If you see errors like:
```
SecCodeCheckValidity: Error Domain=NSOSStatusErrorDomain Code=-67062
```

**Solution:** Use the manual test runner:
```bash
bash runtest-manual.sh
```

This opens Cypress in interactive mode, which typically doesn't have the same code signing issues.

### Test Fails to Start

If the test fails to start, ensure:
1. Node.js is installed (version 18 or higher)
2. All dependencies are installed: `npm install`
3. The application builds successfully: `npm run build`
4. Cypress is properly installed: `npx cypress install --force`

### Players Not Found

The test uses approximate canvas positions. If your window size is different, you may need to adjust the player positions in the test file:

```typescript
// Example: Adjust player positions
const player1X = rect.left + rect.width * 0.3  // Adjust multiplier
const player1Y = rect.top + rect.height * 0.5  // Adjust multiplier
```

### Cypress Not Opening

If Cypress doesn't open in headed mode:
```bash
# Verify Cypress installation
npx cypress verify

# Open Cypress Test Runner manually
npx cypress open
```

## Customizing the Test

You can modify the test scenario by editing [cypress/e2e/automated-test-suite.cy.ts](./cypress/e2e/automated-test-suite.cy.ts).

### Common Modifications

**Change number of players:**
```typescript
// In the increment loop, adjust the number of iterations
for (let i = 0; i < 5; i++) {  // 6 players instead of 4
  cy.get('.number-btn').contains('+').realClick()
  cy.wait(200)
}
```

**Adjust line lengths:**
```typescript
// Change the endX calculation
const endX = startX + 200  // 40m instead of 20m
```

**Add more passes:**
```typescript
// Press different number keys
cy.get('body').type('5')  // Pass to player 5
```

## Requirements

- Node.js 18+
- npm 9+
- Modern browser (Chrome, Firefox, Edge)
- Cypress 14.2.1+
- cypress-real-events 1.x

## Support

For issues or questions about the test suite, please check:
1. [Cypress Documentation](https://docs.cypress.io/)
2. [cypress-real-events Plugin](https://github.com/dmtrKovalenko/cypress-real-events)
3. Project documentation

## License

This test suite is part of the Rugby Application project.
