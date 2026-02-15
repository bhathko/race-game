# Choice Race - Project Overview

A dynamic web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. The game features randomized racer stats, stamina management, and a competitive "rubber-banding" algorithm to keep races exciting until the finish line.

## Project Structure

- `src/core/`: Core framework.
  - `Game.ts`: Main class managing asset loading, scene lifecycle (`setScene` helper), and window resize events.
  - `Scene.ts`: Shared `Scene` interface (`update`, `resize`) implemented by all scenes.
  - `types.ts`: Centralized type definitions (`RacerAnimations`, `TileTextures`, `GroundTextures`, `GrassTextures`).
- `src/entities/`: Game entities.
  - `Racer.ts`: Racer entity handling physics, stamina, animation, and AI strategy. Exports `RacerStats` interface.
- `src/scenes/`:
  - `MenuScene.ts`: Entry screen for selecting racer count and track distance.
  - `RaceScene.ts`: Main game loop with responsive track, dynamic camera, countdown, and real-time standings sidebar.
  - `ResultScene.ts`: Post-race results with farming-themed leaderboard sidebar and restart button.
- `src/ui/`: Reusable UI components.
  - `LeaderboardSidebar.ts`: Farm-themed leaderboard panel with wood background, gold/silver rank cards, animal icons, grass & daisy decorations.
  - `WoodenButton.ts`: Shared wooden-textured button factory (`createWoodenButton`).
  - `HillBackground.ts`: Shared grassy hill background renderer (`drawHillBackground`).
- `src/assets/`:
  - `characters/`: Character sprite sheets (bear idle/walk).
  - `item/`: Environment sprites (trees, ground tiles, grass tiles).
- `src/config.ts`: Grouped configuration constants (`CANVAS`, `RACER`, `TRACK`, `CHARACTERS`, `ITEMS`, `GAMEPLAY`, `VISUALS`, `COLORS`). All values are `as const`.
- `src/main.ts`: Entry point for Pixi application initialization.

## Key Features

- **Nature-Themed Aesthetic:** High-quality 2D graphics featuring a racetrack with grass and dirt tones, complemented by playful pixel art hills.
- **Farming-Sim Leaderboard:** Story of Seasons–inspired result screen with dark oak wood background, gold vine border 1st-place card (cow icon), silver watering can border 2nd-place card (sheep icon), and grass/daisy decorations.
- **Modern Game UI:** Clean, playful vector-style UI with semi-transparent dark grey wooden textures and bold cartoon typography.
- **Dynamic Leaderboard:** Vertical ranking system with animated cards. Top ranks feature Gold, Silver, and Bronze borders with cute animal sprite icons. Supports up to 8 racers with dynamic compact mode.
- **Responsive Design (RWD):** Adapts to any screen size. On mobile/portrait, the leaderboard moves to the bottom; on desktop, it remains a sidebar.
- **Dynamic AI Strategy:** Racers conserve energy mid-game and perform a "final kick" sprint near the finish line.
- **Competitive Balancing:** Includes slipstream and rubber-banding effects to keep the pack close and encourage lead changes.

## Building and Running

- **Development Server:**
  ```bash
  npm run dev
  ```
- **Production Build:**
  ```bash
  npm run build
  ```

## Development Conventions

- **Grouped Config Imports:** Import specific config groups directly (e.g. `import { CANVAS, COLORS } from "../config"`). Do not use a flat `CONFIG` object.
- **Shared UI Components:** Use `createWoodenButton` and `drawHillBackground` from `src/ui/` instead of duplicating button/background code in scenes.
- **Scene Interface:** All scenes must implement the `Scene` interface from `src/core/Scene.ts` (`update(delta)`, `resize(width, height)`).
- **Centralized Types:** Shared types live in `src/core/types.ts`. Import from there, not from individual files.
- **Responsive Positioning:** Use the `resize(width, height)` method in scenes for element placement rather than hardcoded X/Y coordinates.
- **Pixi.js v8 Standards:** Follow modern Pixi.js v8 practices, particularly for `Graphics` and `Application` initialization.
- **Configuration-Driven:** All gameplay parameters (speed, acceleration, stamina rates) and UI colors must be defined in `src/config.ts` under the appropriate group.
- **Interpolation:** Use LERP (Linear Interpolation) for camera movements and UI transitions to maintain a polished feel.
