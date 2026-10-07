# Choice Race — Project Overview

A dynamic web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. The game features randomized racer stats, stamina management, strategy-driven lead changes, and light, visible catch-up mechanics that keep every race close until the finish line.

## Project Structure

The project utilizes the **Barrel Pattern** (`index.ts` files) to centralize module access and clean up import statements.

- `documents/`: Project documentation (`GAME_SPEC.md`, `DEVELOPMENT.md`).
- `src/main.ts`: Entry point — creates the Pixi Application and Game controller.
- `src/config.ts`: Grouped configuration constants.
- `src/core/`: Core engine components and shared types.
  - `utils.ts`: Includes the **12-Column Grid System** for unified layout management.
- `src/entities/`: Game entities (includes `index.ts`).
- `src/strategies/`: AI Strategy Pattern implementations (includes `index.ts`).
- `src/factories/`: Factory Pattern implementations (includes `index.ts`).
- `src/scenes/`: Responsive Controller Pattern.
  - Controllers (`MenuScene`, etc.) manage switching between specialized layout subclasses.
  - Subdirectories (`loading/`, `menu/`, `race/`, `result/`, `selection/`) contain `Base` classes and layout views for `Desktop`, `MobileVertical`, and `MobileHorizontal`.
- `src/ui/`: Reusable UI components (includes `index.ts`).
- `public/assets/`: Static assets (characters, items, sound).

## Design Patterns

### 12-Column Grid Layout (`src/core/utils.ts`)

A centralized utility system that ensures consistent UI alignment, gutters, and margins across all screen sizes. Every scene calculates its layout based on these grid proportions.

### Responsive Controller Pattern (`src/scenes/`)

Scenes are implemented as controllers that manage specialized layout views:

- **Dependency Grouping**: Constructors use **Scene Context** objects (e.g., `SelectionContext`) to group dependencies.
- **State Preservation**: Controllers extract and inject state (e.g., `RaceState`) during orientation changes.
- **Orientation Stability**: Managed by the `Game` class using `requestAnimationFrame` to ensure settled dimensions before layout updates.

### Strategy Pattern (`src/strategies/`)

Each racer receives a `StrategyBehavior` object controlling stat multipliers, sprint decisions, recovery, and a signature trait (early speed, drain efficiency, slipstream, final kick).

### Factory Pattern (`src/factories/`)

`createRacers()` factory encapsulates Gaussian stat generation, character shuffling, and strategy assignment.

## Key Features

- **Nature-Themed Aesthetic:** Dirt racetrack with grass edges and animated pixel-art trees.
- **Hand-Crafted UI:** "Color Pencil Sketch" aesthetic featuring semi-transparent white/gray paper backgrounds, thick jittered (hand-drawn) black outlines, and sketchy drop shadows instead of primitive shapes.
- **Loading Progress:** Real-time visual feedback with specialized responsive layouts for every orientation.
- **Robust Responsiveness:** Seamless layout switching between desktop and mobile orientations (including specialized Landscape split-layouts). Result scenes lay out the 4th+ ranking list in one or two columns (shrinking the podium slightly if needed) and only hide it as a last resort. Upright tablets use the vertical layouts.
- **Selection Confirmation Popup:** When all racers are selected, a centered modal overlay appears with START RACE and CANCEL buttons. CANCEL deselects the last character. In landscape mobile, this replaces the inline start button to save space.
- **Race Layout:** Fixed world scale (`TRACK.PX_PER_METER`) so races take the same time on every screen and survive rotation. Racers are scaled to fit their lanes and centered on their visible art; landscape uses 1-unit grass strips. A pack camera frames the leader and chasers together.
- **Catch-Up & Strategies:** Small, visible catch-up bonuses (slipstream, rubber-band) scaled by field size, plus a reach-based final kick. `stepRace()` (`src/scenes/race/RaceEngine.ts`) is shared by the game and headless balance simulations.
- **Racer Effects:** Dust, speed lines, sweat drops and stumble hops (`src/entities/racer/RacerEffects.ts`).
- **Funny Mode:** Optional blind trap-placement phase where players place Holes on the track. Racers that hit a Hole are stunned and must re-accelerate.

## Building and Running

```bash
npm install        # Install dependencies
npm run dev        # Development server (Vite)
npm run build      # Production build (tsc + Vite)
npm run deploy     # Deploy to Firebase Hosting
```
