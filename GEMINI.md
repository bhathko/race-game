# Choice Race — Project Overview

A dynamic web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. The game features randomized racer stats, stamina management, and a competitive "Comeback Engine" that keeps every race exciting until the finish line.

## Project Structure

The project utilizes the **Barrel Pattern** (`index.ts` files) to centralize module access and clean up import statements.

- `documents/`: Project documentation (`spec.md`, `DEVELOPMENT.md`).
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

Each racer receives a `StrategyBehavior` object controlling stat multipliers, sprint decisions, and recovery pacing.

### Factory Pattern (`src/factories/`)

`createRacers()` factory encapsulates Gaussian stat generation, character shuffling, and strategy assignment.

## Key Features

- **Nature-Themed Aesthetic:** Dirt racetrack with grass edges and animated pixel-art trees.
- **Hand-Crafted UI:** "Color Pencil Sketch" aesthetic featuring semi-transparent white/gray paper backgrounds, thick jittered (hand-drawn) black outlines, and sketchy drop shadows instead of primitive shapes.
- **Loading Progress:** Real-time visual feedback with specialized responsive layouts for every orientation.
- **Robust Responsiveness:** Seamless layout switching between desktop and mobile orientations (including specialized Landscape split-layouts). Result scenes feature **Dynamic List Hiding** which gracefully hides the 4th+ place ranking list on vertically constrained screens to perfectly center and prioritize the Top 3 Podium.
- **Selection Confirmation Popup:** When all racers are selected, a centered modal overlay appears with START RACE and CANCEL buttons. CANCEL deselects the last character. In landscape mobile, this replaces the inline start button to save space.
- **Landscape Race Optimizations:** Grass strips are reduced to 1 unit in landscape mode to maximize lane space. Racers are dynamically scaled (min 0.6) and precisely centered in their lanes using exact bottom-anchor math. The leaderboard sidebar uses pixel-based width calculation to prevent overflow.
- **Comeback Engine:** Continuous rank-based multipliers keep races competitive through the finish.
- **Funny Mode:** Optional blind trap-placement phase where players place Holes on the track. Racers that hit a Hole are stunned and must re-accelerate.

## Building and Running

```bash
npm install        # Install dependencies
npm run dev        # Development server (Vite)
npm run build      # Production build (tsc + Vite)
npm run deploy     # Deploy to Firebase Hosting
```
