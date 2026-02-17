# Choice Race

A dynamic, fully responsive web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. Players choose a racer count and distance, then watch animal characters race with randomized stats, stamina management, and a competitive "Comeback Engine" that keeps every race exciting until the finish line.

The game features a **Responsive Architecture** that seamlessly adapts gameplay and UI across Desktop, Mobile Portrait, and Mobile Landscape modes.

For a detailed technical breakdown of the balancing logic and architecture, see the [Design Spec](documents/spec.md) and the [Development & Design Guide](documents/DEVELOPMENT.md).

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
```

## How It Works

1. **Menu** — pick 2–8 racers and a distance (50 m, 100 m, 200 m, or 400 m).
2. **Character Selection** — pick the specific racers you want for the lineup.
3. **Race** — a 3-second countdown starts the race. Racers sprint, cruise, stumble, and recover based on their randomly-assigned stats and stamina strategy.
4. **Results** — a farming-themed leaderboard shows final rankings with animated animal icons.

## Project Structure

```
src/
├── main.ts                 Entry point — creates the Pixi Application
├── config.ts               All tuning constants (canvas, gameplay, visuals, colours)
│
├── core/
│   ├── Game.ts             Scene lifecycle, asset loading, resize handling
│   ├── Scene.ts            Scene interface (update / resize)
│   └── types.ts            Shared types (RacerAnimations, TileTextures)
│
├── entities/
│   └── Racer.ts            Racer entity — physics, stamina, animation, rendering
│
├── strategies/
│   └── StrategyBehavior.ts Strategy Pattern — defines racer AI behaviours
│
├── factories/
│   └── RacerFactory.ts     Factory Pattern — creates racers with random stats
│
├── scenes/                 Responsive Controller Pattern
│   ├── CharacterSelectionScene.ts  (Controller)
│   ├── MenuScene.ts                (Controller)
│   ├── RaceScene.ts                (Controller)
│   ├── ResultScene.ts              (Controller)
│   │
│   ├── menu/               Menu Layouts
│   │   ├── BaseMenuScene.ts
│   │   ├── DesktopMenuScene.ts
│   │   ├── MobileHorizontalMenuScene.ts
│   │   └── MobileVerticalMenuScene.ts
│   │
│   ├── race/               Race Layouts & State
│   │   ├── BaseRaceScene.ts
│   │   ├── DesktopRaceScene.ts
│   │   ├── MobileHorizontalRaceScene.ts
│   │   └── MobileVerticalRaceScene.ts
│   │
│   ├── result/             Result Layouts
│   │   ├── BaseResultScene.ts
│   │   ├── DesktopResultScene.ts
│   │   ├── MobileHorizontalResultScene.ts
│   │   └── MobileVerticalResultScene.ts
│   │
│   └── selection/          Selection Layouts
│       ├── BaseCharacterSelectionScene.ts
│       ├── DesktopSelectionScene.ts
│       ├── MobileHorizontalSelectionScene.ts
│       └── MobileVerticalSelectionScene.ts
│
├── ui/
│   ├── WoodenButton.ts     Reusable wooden-textured button component
│   └── LeaderboardSidebar.ts Farm-themed leaderboard panel
│
└── ...
public/
└── assets/                 Static assets (characters, items, sounds)
```

## Architecture & Design Patterns

### Responsive Controller Pattern

To support Desktop, Mobile Portrait, and Mobile Landscape seamlessly, each main scene (e.g., `RaceScene`) acts as a **Controller**. It detects the screen dimensions and orientation, then instantiates the appropriate **Layout Subclass** (e.g., `DesktopRaceScene`, `MobileVerticalRaceScene`).

- **Base Classes** (`BaseRaceScene`) contain the core logic, state, and asset references.
- **Layout Classes** (`MobileVerticalRaceScene`) handle specific positioning, scaling, and UI arrangements.
- **State Preservation**: When switching layouts (e.g., rotating a phone), the Controller extracts the state (racer positions, time, etc.) from the old layout and injects it into the new one, ensuring the game continues uninterrupted.

### Strategy Pattern — `strategies/StrategyBehavior.ts`

Each racer is assigned one of four **stamina strategies** that determine its racing personality:

| Strategy         | Behaviour                                    | Stat Bias                       |
| ---------------- | -------------------------------------------- | ------------------------------- |
| **Aggressive**   | Sprint hard, crash fast, recover, repeat     | +10 % speed, −25 % endurance    |
| **Pacer**        | Rhythmic push-rest cycles above 50 % stamina | Balanced stats, +10 % endurance |
| **Conservative** | Cruise most of the race, push in final 35 %  | −8 % speed, +25 % endurance     |
| **Closer**       | Save everything for the climax phase         | +15 % accel, +5 % endurance     |

### Factory Pattern — `factories/RacerFactory.ts`

The `createRacers()` factory encapsulates character shuffling, random stat generation, and strategy assignment.

### Scene Lifecycle — `core/Game.ts`

`Game` acts as a **scene manager** using a simple `setScene()` method that handles cleanup, stage mounting, and resizing triggers.

## Gameplay Systems

### The Comeback Engine (Dynamic Balancing)

Prevents the leader from pulling away unchallenged:

- **Slingshot** — trailing racers gain up to +56 % acceleration
- **Slipstream** — chasers get a higher max-speed ceiling (up to 1.25×)
- **Respite** — trailing racers recover stamina up to 2.5× faster
- **Rubber-band** — speed boost proportional to distance behind the leader
- **Second Wind** — deeply trailing racers get a burst after sustained poor rank

### Drama Mechanics

- **Climax Phase** — Final 20% of the track triggers double recovery and sprint bonuses.
- **Pace Wave** — sinusoidal speed oscillation unique to each racer.
- **Stumble** — random momentary slowdowns (leaders stumble more often).

## Configuration

All tuning knobs live in `src/config.ts` under clearly named constant groups like `CANVAS`, `GAMEPLAY`, `VISUALS`, and `COLORS`.

## Tech Stack

- **Pixi.js v8** — 2D rendering (WebGL / WebGPU)
- **TypeScript** — strict typing
- **Vite** — dev server + production bundler
