# 🛠️ Choice Race — Development & Design Guide

This document explains the underlying design philosophy, the software engineering theories applied, and the roadmap for future development of **Choice Race**.

---

## 1. Design Philosophy

The core goal of Choice Race is to create **"Calculated Chaos."** Unlike traditional racing games where the leader often stays ahead, Choice Race is designed to be a "nail-biter" until the very last second.

### A. Dynamic Drama
We utilize a **Negative Feedback Loop** (often called "Rubber-banding"). As a racer gains a lead, the game subtly increases the resistance they face (higher stumble chance, standard recovery) while granting trailing racers "buffs" (Slingshot, Slipstream, Respite). This ensures that the pack stays tight and the outcome remains uncertain.

### B. Strategic Variety
Every racer isn't just a set of stats; they have a **Personality**. By using the Strategy Pattern, we can make racers feel different:
- **Aggressive** racers create early-game tension.
- **Closers** create late-game "come-from-behind" victories.
- This variety ensures that every race tells a different story.

### C. The Minimalist Aesthetic & Design System
We consciously paired a high-performance **WebGPU/Pixi.js** engine with a clean, high-contrast solid green aesthetic. To ensure this remains maintainable as we add features, we implemented a **Design Token System** (`PALETTE` in `src/config.ts`). 

Recently, we refreshed the UI with a **Lighter Wood Style** to increase vibrancy and legibility. By centralizing these values into tokens, we can perform global theme updates without touching individual scene files, maintaining a coherent "farming-sim" look across the entire application.

---

## 2. Theoretical Foundations

### Software Engineering Patterns

#### 1. Strategy Pattern (`src/strategies/`)
The `Racer` class knows *how* to move, but it doesn't know *why* it should sprint or rest. We delegate this decision-making to a `StrategyBehavior` object.
- **Benefit:** We can add "Cowardly," "Random," or "Expert" AI without ever touching the `Racer.ts` file.

#### 2. Factory Pattern (`src/factories/`)
Creating a racer involves generating Gaussian-random stats, assigning characters, and determining strategy. The `RacerFactory` encapsulates this complexity.
- **Benefit:** Scenes stay clean. `RaceScene` simply asks for `createRacers(selectedKeys)` and receives a ready-to-race array.

#### 3. Scene Lifecycle (`src/core/`)
The game follows a strict `Scene` interface (`update`, `resize`, `destroy`). The `Game` class acts as a central orchestrator.
- **Benefit:** Switching between `Menu`, `CharacterSelection`, `Race`, and `Result` scenes is handled uniformly, ensuring efficient memory management and asset loading.

#### 4. Responsive Controller Pattern (`src/scenes/`)
To handle diverse form factors (Mobile Portrait vs. Landscape vs. Desktop) without spaghetti code, we use a **Controller-View** hybrid approach.
- **Controller:** The main scene class (e.g., `RaceScene`) acts as a controller. It detects screen size changes and instantiates the correct layout subclass.
- **Base Class:** A shared abstract base (e.g., `BaseRaceScene`) holds all game logic, state (racer positions, timers), and asset references.
- **Layout Views:** Subclasses (e.g., `MobileVerticalRaceScene`) only implement the `resize()` method and specific UI positioning logic.
- **State Injection:** When the controller swaps layouts (e.g., on device rotation), it extracts the running state from the old layout and injects it into the new one, ensuring a seamless player experience.

### Game Design Theory

#### 1. Negative Feedback Loops
The "Comeback Engine" is a classic implementation of negative feedback. It stabilizes the system (the race) by pushing it back toward a state of equilibrium (all racers together). This is essential for 8-player AI-only races to remain watchable and exciting.

#### 2. Resource Management (Stamina)
Stamina is treated as a **Short-term Resource Loop**. 
- **Burn:** Sprinting converts stamina into distance.
- **Crawl:** Exhaustion (Tired state) is a penalty phase.
- **Recover:** Choosing to cruise allows for future bursts.
The interaction between `Endurance` (efficiency) and `Top Speed` (power) creates the primary balancing act.

---

## 3. Future Development Roadmap

### Phase 1: Interactive Items (Power-ups)
- **Concept:** Add a "Skill" or "Item" slot to racers.
- **Theory:** Use the **Decorator Pattern** or an **Event-based System**. An item like "Carrot" could temporarily wrap the racer's `topSpeed` property or inject a one-time stamina refill.

### Phase 2: Multi-Terrain Tracks
- **Concept:** Tracks with mud (slows down), grass (high stamina drain), or paths (speed boost).
- **Implementation:** Modify `RaceScene` to use a tiled-map approach where `Racer` checks the ground tile type under its `x` coordinate during `update()`.

### Phase 3: Persistent Progression
- **Concept:** A "Stable" or "Farm" where players can spend "Corn" (earned from races) to permanently upgrade character stats.
- **Theory:** Implement a `SaveManager` using `localStorage` and update `RacerFactory` to accept "Upgrade Multipliers."

### Phase 4: Audio & Juice [IN PROGRESS]
- **Concept:** Sound effects for sprinting, panting when tired, and a "cheer" at the finish line.
- **Implementation:** Integrated `@pixi/sound` for background music. Next: Add SFX for racer actions and a `ParticleSystem` for dirt clouds.

---

## 4. How to Contribute

1.  **Adding a Character:**
    - Place spritesheets in `public/assets/characters/[name]/`.
    - Update `CHARACTERS` in `src/config.ts`.
2.  **Adjusting Balance:**
    - Do not hardcode numbers in `Racer.ts`.
    - Always use `src/config.ts` under the `GAMEPLAY.BALANCE` or `GAMEPLAY.PHYSICS` sections.
3.  **Creating a Strategy:**
    - Implement the `StrategyBehavior` interface.
    - Register it in the `STRATEGY_REGISTRY` within `src/strategies/StrategyBehavior.ts`.
