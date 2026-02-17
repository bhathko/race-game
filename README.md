# Choice Race

A dynamic web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. Players choose a racer count and distance, then watch animal characters race with randomized stats, stamina management, and a competitive "Comeback Engine" that keeps every race exciting until the finish line.
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
├── scenes/
│   ├── MenuScene.ts        Menu screen (racer count / distance selection)
│   ├── CharacterSelectionScene.ts Character picker with animated previews
│   ├── RaceScene.ts        Main racing loop, camera, track, leaderboard
│   └── ResultScene.ts      Post-race results with themed leaderboard
│
├── ui/
│   ├── WoodenButton.ts     Reusable wooden-textured button component
│   └── LeaderboardSidebar.ts Farm-themed leaderboard panel (daisies, vines, oak)
│
└── assets/
    ├── characters/          Sprite sheets per character (bear, cat, fox, …)
    └── item/                Environment sprites (trees, ground, grass tiles)
```

## Architecture & Design Patterns

### Strategy Pattern — `strategies/StrategyBehavior.ts`

Each racer is assigned one of four **stamina strategies** that determine its racing personality:

| Strategy         | Behaviour                                    | Stat Bias                       |
| ---------------- | -------------------------------------------- | ------------------------------- |
| **Aggressive**   | Sprint hard, crash fast, recover, repeat     | +10 % speed, −25 % endurance    |
| **Pacer**        | Rhythmic push-rest cycles above 50 % stamina | Balanced stats, +10 % endurance |
| **Conservative** | Cruise most of the race, push in final 35 %  | −8 % speed, +25 % endurance     |
| **Closer**       | Save everything for the climax phase         | +15 % accel, +5 % endurance     |

Each strategy implements the `StrategyBehavior` interface:

```typescript
interface StrategyBehavior {
  readonly name: RacerStrategy;
  readonly statMultipliers: { speed; accel; endurance };
  shouldSprint(ctx: SprintContext): boolean;
  tiredSpeedFactor(): number;
  tiredExitThreshold(maxStamina: number): number;
}
```

Adding a new strategy requires only implementing this interface and registering it in the `STRATEGY_REGISTRY`.

### Factory Pattern — `factories/RacerFactory.ts`

The `createRacers()` factory encapsulates:

- Shuffled character assignment (no duplicates until pool exhausts)
- Random stat generation with strategy-specific multipliers
- Colour assignment from the palette

Callers (like `RaceScene`) don't need to know the stat generation details.

### Scene Lifecycle — `core/Game.ts`

`Game` acts as a **scene manager** using a simple `setScene()` method that:

1. Removes & destroys the current scene
2. Adds the new scene to the stage
3. Hooks the scene's `update()` into the Pixi ticker
4. Triggers an initial `resize()`

All scenes implement the shared `Scene` interface (`update` + `resize`).

## Gameplay Systems

### The Comeback Engine (Dynamic Balancing)

Prevents the leader from pulling away unchallenged:

- **Slingshot** — trailing racers gain up to +56 % acceleration
- **Slipstream** — chasers get a higher max-speed ceiling (up to 1.25×)
- **Respite** — trailing racers recover stamina up to 2.5× faster
- **Rubber-band** — speed boost proportional to distance behind the leader
- **Second Wind** — deeply trailing racers get a burst after sustained poor rank

### Climax Phase (Final 20 %)

When any racer enters the last 20 % of the track:

- Recovery speed doubles for everyone
- Top-ranked trailing racers within range get an **Overdrive** speed boost
- All strategies eligible for "sprint zone" near the finish

### Drama Mechanics

- **Pace Wave** — sinusoidal speed oscillation unique to each racer
- **Stumble** — random momentary slowdowns (leaders stumble more often)

## Configuration

All tuning knobs live in `src/config.ts` under clearly named constant groups:

| Group        | Purpose                                       |
| ------------ | --------------------------------------------- |
| `CANVAS`     | Viewport dimensions, sidebar width            |
| `RACER`      | Sprite size, collision offset                 |
| `TRACK`      | Start/finish line positions                   |
| `CHARACTERS` | Sprite sheet paths and frame counts           |
| `ITEMS`      | Environment asset paths                       |
| `GAMEPLAY`   | Stats, balance, drama, physics, strategies    |
| `VISUALS`    | Camera smoothing, countdown, animation speeds |
| `COLORS`     | Full colour palette                           |

## Tech Stack

- **Pixi.js v8** — 2D rendering (WebGL / WebGPU)
- **TypeScript** — strict typing
- **Vite** — dev server + production bundler

## Development Conventions

- Import specific config groups: `import { CANVAS, COLORS } from "../config"`
- All config values are `as const` for type narrowing
- Scenes extend `Container` and implement the `Scene` interface
- UI components are standalone functions/classes in `src/ui/`
