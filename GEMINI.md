# Choice Race — Project Overview

A dynamic web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. The game features randomized racer stats, stamina management, and a competitive "Comeback Engine" that keeps every race exciting until the finish line.

## Project Structure

- `documents/`: Project documentation.
  - `spec.md`: Detailed technical design and balancing specification.
  - `DEVELOPMENT.md`: Development & Design Guide.
- `src/main.ts`: Entry point — creates the Pixi Application and boots the Game.
- `src/config.ts`: Grouped configuration constants (`CANVAS`, `RACER`, `TRACK`, `CHARACTERS`, `ITEMS`, `GAMEPLAY`, `VISUALS`, `COLORS`). All values are `as const`.
- `src/core/`: Core framework.
  - `Game.ts`: Main class managing asset loading, scene lifecycle (`setScene` helper), and window resize events.
  - `Scene.ts`: Shared `Scene` interface (`update`, `resize`) implemented by all scenes.
  - `types.ts`: Centralized type definitions (`RacerAnimations`, `TileTextures`, `GroundTextures`, `GrassTextures`).
- `src/entities/`: Game entities.
  - `Racer.ts`: Racer entity — physics update loop, stamina management, animation, rendering. Delegates sprint/tired decisions to its `StrategyBehavior`.
- `src/strategies/`: Strategy Pattern implementations.
  - `StrategyBehavior.ts`: `StrategyBehavior` interface + four concrete strategies (aggressive, pacer, conservative, closer) + registry/random selection. Centralises all strategy-specific logic (stat multipliers, sprint decisions, tired-state behaviour).
- `src/factories/`: Factory Pattern implementations.
  - `RacerFactory.ts`: `createRacers()` factory — encapsulates random stat generation, character shuffling, colour assignment, and strategy selection. Used by `RaceScene`.
- `src/scenes/`: Responsive Controller Pattern.
  - `MenuScene.ts`, `CharacterSelectionScene.ts`, `RaceScene.ts`, `ResultScene.ts`: Controllers that detect device mode and swap between specialized layout subclasses.
  - `menu/`, `race/`, `result/`, `selection/`: Subdirectories containing `Base` classes and specialized layout subclasses for `Desktop`, `MobileVertical` (Portrait), and `MobileHorizontal` (Landscape).
- `src/ui/`: Reusable UI components.
  - `LeaderboardSidebar.ts`: Farm-themed leaderboard panel with wooden podium for top 3, dynamic visibility for mobile horizontal.
  - `WoodenButton.ts`: Shared wooden-textured button factory (`createWoodenButton`).
- `public/assets/`:
  - `characters/`: Character sprite sheets (idle + walk) for bear, cat, fox, mouse, panda, rabbit, sheep, turtle.
  - `item/`: Environment sprites (trees, ground tiles, grass tiles).
  - `sound/`: Background music and sound effects.

## Design Patterns

### Strategy Pattern (`src/strategies/StrategyBehavior.ts`)

Each racer receives a `StrategyBehavior` object that controls:

- **Stat multipliers** — applied at creation time to bias speed/accel/endurance.
- **Sprint decision** — `shouldSprint(ctx)` determines when the racer pushes vs cruises.
- **Tired behaviour** — `tiredSpeedFactor()` and `tiredExitThreshold()` control recovery pacing.

Four strategies are registered: `aggressive`, `pacer`, `conservative`, `closer`.

### Factory Pattern (`src/factories/RacerFactory.ts`)

`createRacers(names, characterAnimations)` returns an array of fully-configured Racer entities. Encapsulates:

- Fisher-Yates character key shuffling for non-repeating assignment.
- Random stat generation with strategy-specific multipliers.
- Colour palette cycling.

### Responsive Controller Pattern (`src/scenes/`)

Scenes are implemented as controllers that manage specialized layout views:
- **State Preservation**: Controllers extract `RaceState` from active layouts during orientation changes and inject them into new instances.
- **Layout Views**: Specialized subclasses handle unique positioning and scaling for Desktop, Mobile Portrait, and Mobile Landscape.

### Scene Lifecycle (`src/core/Game.ts`)

`Game.setScene(scene)` manages transitions: destroys the previous scene, mounts the new one on the stage, hooks its `update()` into the Pixi ticker, and calls `resize()`.

## Key Features

- **Nature-Themed Aesthetic:** Dirt racetrack with grass edges and animated pixel-art trees.
- **Farming-Sim Leaderboard:** Story of Seasons–inspired result screen with dark oak wood background, gold vine border for 1st place, silver border for 2nd, grass/daisy decorations.
- **Responsive Architecture:** Seamless layout switching between desktop and mobile orientations without losing game progress.
- **Comeback Engine:** Rank-based multipliers (slingshot, slipstream, respite, rubber-band, second wind) keep races competitive through the finish.
- **Climax Phase:** Final 20% of the track triggers enhanced recovery and overdrive mechanics.

## Building and Running

```bash
npm install        # Install dependencies
npm run dev        # Development server (Vite)
npm run build      # Production build (tsc + Vite)
npm run deploy     # Build and deploy to Firebase Hosting
```

## Development Conventions

- **Grouped Config Imports:** Import specific config groups directly (e.g. `import { CANVAS, COLORS } from "../config"`).
- **Strategy via Interface:** All racer strategy differences go through `StrategyBehavior` — no switch-case on strategy names in game logic.
- **Factory for Creation:** Racer instantiation goes through `RacerFactory` — scenes don't generate stats directly.
- **Scene Interface:** All scenes implement `Scene` (`update` + `resize`) for uniform lifecycle management.
