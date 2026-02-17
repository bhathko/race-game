# Choice Race

A dynamic, fully responsive web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. Players choose a racer count and distance, then watch animal characters race with randomized stats, stamina management, and a competitive "Comeback Engine" that keeps every race exciting until the finish line.

The game features a **Responsive Architecture** that seamlessly adapts gameplay and UI across Desktop, Mobile Portrait, and Mobile Landscape modes with robust state preservation during device rotation.

For a detailed technical breakdown of the balancing logic and architecture, see the [Design Spec](documents/spec.md) and the [Development & Design Guide](documents/DEVELOPMENT.md).

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Deploy to Firebase
npm run deploy
```

## How It Works

1. **Loading** — asset loading progress is displayed to ensure a smooth transition.
2. **Menu** — pick 2–8 racers and a distance (50 m, 100 m, 200 m, or 400 m).
3. **Character Selection** — pick the specific racers you want for the lineup.
4. **Race** — a 3-second countdown starts the race. Racers sprint, cruise, stumble, and recover based on their randomly-assigned stats and stamina strategy.
5. **Results** — a farming-themed leaderboard shows final rankings with animated animal icons and a podium for the winners.

## Project Structure

The project utilizes the **Barrel Pattern** (`index.ts` files) to simplify imports across modules.

```
src/
├── main.ts                 Entry point — creates Pixi App and Game controller
├── config.ts               Central tuning constants (balance, visuals, colors)
│
├── core/                   Core engine components
│   ├── index.ts            Barrel for core
│   ├── Game.ts             Scene lifecycle & orientation handling
│   ├── Scene.ts            Scene interface (update / resize)
│   └── types.ts            Shared types & SceneContext definitions
│
├── entities/               Game entities (Racer)
│   ├── index.ts            Barrel for entities
│   └── Racer.ts            Physics, stamina, and animation logic
│
├── strategies/             AI Strategy Pattern implementations
│   ├── index.ts            Barrel for strategies
│   └── StrategyBehavior.ts Behavior definitions & registry
│
├── factories/              Factory Pattern for racer creation
│   ├── index.ts            Barrel for factories
│   └── RacerFactory.ts     Gaussian stat generation & character assignment
│
├── scenes/                 Responsive Controller Pattern
│   ├── index.ts            Barrel for main scenes
│   ├── LoadingScene.ts     Initial asset loading scene
│   ├── MenuScene.ts        Menu controller
│   ├── CharacterSelectionScene.ts Selection controller
│   ├── RaceScene.ts        Race controller
│   ├── ResultScene.ts      Result controller
│   │
│   ├── menu/               Specialized Menu Layouts
│   ├── race/               Specialized Race Layouts & RaceState
│   ├── result/             Specialized Result Layouts
│   └── selection/          Specialized Selection Layouts
│
├── ui/                     Reusable UI Components
│   ├── index.ts            Barrel for UI
│   ├── WoodenButton.ts     Themed button factory
│   └── LeaderboardSidebar.ts Podium-style leaderboard
│
└── ...
public/
└── assets/                 Optimized static assets (served via root)
```

## Architecture & Design Patterns

### Responsive Controller Pattern

Each main scene acts as a **Controller** that manages specialized layout subclasses for Desktop, Mobile Portrait, and Mobile Landscape.

- **Dependency Grouping**: Uses **Scene Contexts** (e.g., `RaceContext`) to clean up constructors and group related dependencies (animations, textures, callbacks).
- **State Preservation**: Controllers extract state objects (e.g., `RaceState`) from active layouts during orientation changes and inject them into new instances, ensuring zero progress loss.
- **Orientation Stability**: The `Game` class uses `requestAnimationFrame` and listeners for both `resize` and `orientationchange` to ensure Pixi's dimensions are fully settled before rerendering layouts.

### Strategy Pattern

Each racer is assigned one of four **stamina strategies** (Aggressive, Pacer, Conservative, Closer) that determine its racing personality, stat multipliers, and sprint thresholds.

### Factory Pattern

The `RacerFactory` centralizes the complex process of character shuffling, random stat generation using Gaussian distribution, and strategy assignment.

## Gameplay Systems

### The Comeback Engine (Dynamic Balancing)

Prevents the leader from pulling away unchallenged using continuous normalized rank scaling:

- **Slingshot** — Trailing racers gain up to +56 % acceleration.
- **Slipstream** — Chasers gain a higher max-speed ceiling (up to 1.25×).
- **Respite** — Trailing racers recover stamina up to 2.5× faster.
- **Rubber-band** — Speed boost proportional to distance behind the leader.
- **Second Wind** — Massive burst for deeply trailing racers (bottom 25 %).

### Drama Mechanics

- **Climax Phase** — Final 20 % of the track triggers double recovery and sprint bonuses.
- **Pace Wave** — Sinusoidal speed oscillation unique to each racer.
- **Stumble** — Random momentary slowdowns (leaders stumble more often).

## Tech Stack

- **Pixi.js v8** — 2D rendering (WebGL / WebGPU)
- **TypeScript** — strict typing with verbatim module syntax
- **Vite** — development server and production bundler
- **Firebase** — automated hosting and deployment
