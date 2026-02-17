# Choice Race — Project Overview

A dynamic web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. The game features randomized racer stats, stamina management, and a competitive "Comeback Engine" that keeps every race exciting until the finish line.

## Project Structure

The project utilizes the **Barrel Pattern** (`index.ts` files) to centralize module access and clean up import statements.

- `documents/`: Project documentation (`spec.md`, `DEVELOPMENT.md`).
- `src/main.ts`: Entry point — creates the Pixi Application and Game controller.
- `src/config.ts`: Grouped configuration constants.
- `src/core/`: Core framework, scene lifecycle, and shared types (includes `index.ts`).
- `src/entities/`: Game entities (includes `index.ts`).
- `src/strategies/`: AI Strategy Pattern implementations (includes `index.ts`).
- `src/factories/`: Factory Pattern implementations (includes `index.ts`).
- `src/scenes/`: Responsive Controller Pattern.
  - Controllers (`MenuScene`, etc.) manage switching between specialized layout subclasses.
  - Subdirectories (`menu/`, `race/`, `result/`, `selection/`) contain `Base` classes and layout views for `Desktop`, `MobileVertical`, and `MobileHorizontal`.
- `src/ui/`: Reusable UI components (includes `index.ts`).
- `public/assets/`: Static assets (characters, items, sound).

## Design Patterns

### Responsive Controller Pattern (`src/scenes/`)

Scenes are implemented as controllers that manage specialized layout views:
- **Dependency Grouping**: Constructors use **Scene Context** objects (e.g., `SelectionContext`) to group dependencies.
- **State Preservation**: Controllers extract and inject state (e.g., `RaceState`) during orientation changes.
- **Orientation Stability**: Managed by the `Game` class using `requestAnimationFrame` to ensure settled dimensions before layout updates.

### Strategy Pattern (`src/strategies/`)

Each racer receives a `StrategyBehavior` object controlling stat multipliers, sprint decisions, and recovery pacing.

### Factory Pattern (`src/factories/`)

`createRacers()` factory encapsulates Gaussian stat generation, character shuffling, and strategy assignment.

### Barrel Pattern (`index.ts`)

Major directories use barrel files to simplify imports (e.g., `import { Racer } from "../entities"`) and define public APIs.

## Key Features

- **Nature-Themed Aesthetic:** Dirt racetrack with grass edges and animated pixel-art trees.
- **Farming-Sim UI:** Story of Seasons–inspired podium leaderboard and wooden buttons.
- **Robust Responsiveness:** Seamless layout switching between desktop and mobile orientations without progress loss.
- **Comeback Engine:** Continuous rank-based multipliers keep races competitive through the finish.

## Building and Running

```bash
npm install        # Install dependencies
npm run dev        # Development server (Vite)
npm run build      # Production build (tsc + Vite)
npm run deploy     # Deploy to Firebase Hosting
```
