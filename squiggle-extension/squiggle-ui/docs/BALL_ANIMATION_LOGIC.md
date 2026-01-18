# Ball Animation Logic Documentation

## Core Principles

1. **Ball Always Has a Carrier**: The ball is always attached to a player, except during pass animations
2. **Ball Follows Carrier**: When attached, ball position is derived from carrier's position
3. **Smooth Pass Animations**: When passing, ball detaches briefly, animates, then reattaches to receiver
4. **No Teleporting**: Ball never jumps to (0,0) or arbitrary positions

## State Management

### Ball State Properties
- `ball.value.x`: X coordinate (derived from carrier if attached)
- `ball.value.y`: Y coordinate (derived from carrier if attached)
- `ball.value.attachedTo`: Reference to carrier `{ type, id }` or `null` during pass

### Sequence Ball State
- `sequence.ballState`: Snapshot of ball state at sequence end
- Used to restore ball at start of next sequence
- Contains: `{ x, y, attachedTo }`

## Execution Flow

### Single Sequence
1. Restore ball to saved carrier (via `resetSequenceBallState`)
2. Carrier runs path with ball attached
3. At trigger point, pass ball to receiver
4. Receiver continues with ball
5. Save final ball state to `sequence.ballState`

### Multi-Sequence (Full Play)
1. **Sequence 1**:
   - `executeSequence` restores ball to saved carrier
   - Run animations
   - Save final ball state (carrier + position)
   - Ball stays attached to final carrier

2. **Sequence 2**:
   - Read saved ball state from Sequence 1
   - If current carrier ≠ saved carrier, animate pass
   - Run animations
   - Save final ball state
   - Ball stays attached to final carrier

3. Continue pattern...

## Pass Types

### Normal Pass
- Triggered at end of player's path
- Ball detaches, animates to receiver, reattaches
- Maximum one per sequence

### Timed Pass
- Triggered at specific path index during run
- Ball detaches, animates to receiver, reattaches
- Maximum one per sequence
- Can combine with normal pass (A→B normal, B→C timed)

## Functions

### `setBallCarrier(player, opts)`
**File**: `useGameState.ts`

- **Purpose**: Attach/detach ball to/from player
- **Behavior**:
  - If `player` provided: attach and position ball at player's hand
  - If `player` is `null`: detach but **preserve current position explicitly**
- **Options**: `{ updateTimedPassSource?: boolean }` - whether to update timed pass references

**Key Implementation Detail**: When detaching, position is explicitly preserved:
```typescript
const preservedX = ball.value.x
const preservedY = ball.value.y
ball.value.attachedTo = null
ball.value.x = preservedX
ball.value.y = preservedY
```

### `animateBallPass(fromPos, toPlayer, opts)`
**File**: `useAnimations.ts`

- **Purpose**: Animate ball flying from one position to a player
- **Behavior**:
  - Detaches ball from current carrier (marks ball as "in flight")
  - Animates ball position frame-by-frame
  - Reattaches to receiver at end
- **Duration**: 600ms with easeOutCubic easing

### `animateBallToPlayer(targetPlayer, opts)`
**File**: `useAnimations.ts`

- **Purpose**: Move ball to a player (used at sequence start)
- **Behavior**: Similar to `animateBallPass` but handles edge cases for sequence initialization
- **Use Case**: When sequence starts and ball needs to move from one carrier to another

### `executeSequence(sequence, players, redraw, isMultiSequenceExecution, isRecording)`
**File**: `useAnimations.ts`

- **Purpose**: Execute full sequence animation
- **Behavior**:
  - Restores ball state if saved carrier differs from current carrier
  - Runs all player path animations
  - Handles timed passes during animations
  - Saves final ball state to `sequence.ballState`
  - Ball stays attached to final carrier (no detachment at end)

**Key Change**: Simplified restoration logic - only animates if carriers are different:
```typescript
if (savedCarrier && savedCarrier !== currentCarrier) {
  await animateBallToPlayer(savedCarrier, { recordEvent: isRecording })
  setBallCarrier(savedCarrier, { updateTimedPassSource: false })
}
```

### `resetSequenceBallState(sequence)`
**File**: `RugbyPitch.vue`

- **Purpose**: Reset ball to saved state for a specific sequence (used in single sequence execution)
- **Behavior**:
  - Restores ball position from `sequence.ballState`
  - Restores ball attachment to saved carrier
  - If carrier not found, detaches but preserves position

## Edge Cases

### Ball at (0,0)
If ball position is (0,0), this indicates a bug. Ball should always have valid coordinates. With the refactored code, this should never happen because:
- Detachment explicitly preserves position
- Ball is only detached during pass animations (briefly)
- Ball always reattaches to a valid carrier after pass

### No Saved Ball State
If `sequence.ballState` is missing:
- `resetSequenceBallState` logs a warning and returns early
- `executeSequence` skips restoration and uses current ball state

### Carrier Not in Sequence
If saved carrier is not in the active players list:
- `resetSequenceBallState` logs a warning and detaches ball (preserving position)
- `executeSequence` logs that ball is already with correct carrier

## Recent Refactoring (2025)

### Problems Fixed
1. **Ball jumping to (0,0)**: Fixed by explicitly preserving position on detach
2. **Unnecessary detach/reattach**: Removed detachment at end of multi-sequence execution
3. **Complex restoration logic**: Simplified to single condition: `savedCarrier !== currentCarrier`
4. **Redundant code paths**: Removed `setRuntimeBallCarrier` wrapper and duplicate reset logic

### Files Modified
1. `useGameState.ts`: Fixed `setBallCarrier` to preserve position
2. `useAnimations.ts`: Removed wrapper, simplified restoration, removed end-of-sequence detachment
3. `RugbyPitch.vue`: Simplified `resetSequenceBallState`, removed redundant reset

### Key Improvements
- Ball never jumps to (0,0)
- Clear, single source of truth for ball position
- Simplified state restoration (one condition vs. three)
- No unnecessary detach/reattach cycles
- ~100 lines of code removed

## Debugging

### Console Logs
Key log points to watch:
- `[setBallCarrier]`: Shows when ball is attached/detached and position changes
- `[executeSequence]`: Shows ball state restoration decisions
- `[animateBallPass]`: Shows pass animation start/end
- `[animateBallToPlayer]`: Shows ball movement to carrier
- `[resetSequenceBallState]`: Shows ball state restoration in single sequence mode

### Common Issues
- **Ball not following player**: Check if `player.isCarryingBall` flag is set correctly
- **Ball teleporting**: Check console for `[setBallCarrier]` logs - position should be preserved on detach
- **Ball not passing**: Check if timed pass `pathIndex` is within valid range
- **Ball stuck at (0,0)**: This should not happen anymore - if it does, check initialization

## Future Enhancements

Potential improvements to consider:
1. Add visual arc to ball pass animations (currently linear)
2. Support multiple passes in a single sequence (currently limited to one)
3. Add ball spin/rotation during flight
4. Optimize ball position updates to reduce redundant calculations
