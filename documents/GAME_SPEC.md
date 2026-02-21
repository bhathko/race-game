# 🏁 Choice Race — Game Design & Technical Spec

## 1. Overview

**Choice Race** is a dynamic, fully responsive web-based 8-player racing game built with **Pixi.js v8** and **TypeScript**. The core design philosophy is to eliminate "Early Lead Dominance" through a sophisticated **Comeback Engine** that scales based on player rank, ensuring tight finishes where the outcome is uncertain until the final line.

## 2. Technical Architecture

- **Engine:** Pixi.js v8 (WebGPU/WebGL)
- **Framework:** TypeScript + Vite
- **Pattern: 12-Column Grid:** Every scene utilizes a centralized grid system (`src/core/utils.ts`) for proportional layout and alignment.
- **Pattern: Responsive Controller:** Scenes are "Controllers" that manage specialized "Layout" subclasses (Desktop, MobileVertical, MobileHorizontal).
- **Pattern: Dependency Grouping:** Layout constructors utilize **Scene Context** interfaces (e.g., `RaceContext`) to unify dependencies.
- **Pattern: Barrel:** Uses `index.ts` files to provide clean, centralized module access.
- **Pattern: Strategy:** AI behavior is encapsulated in `StrategyBehavior` implementations.
- **Pattern: Factory:** `RacerFactory` handles randomized stat generation and character assignment.
- **Scene Lifecycle:** Managed by `Game.ts`, implementing robust **Orientation Handling** with state preservation.

## 3. The Core Stat Trifecta

Every racer is defined by three primary variables, generated with random variance and strategy-specific multipliers:

- **Top Speed (`V_max`):** The velocity ceiling.
- **Acceleration (`A`):** How fast the racer reaches target speed.
- **Endurance (`E`):** Affects stamina depletion (1/E) and recovery speed (E).

**Depletion Rule:** When Stamina (`S`) reaches 0, the racer enters **Recovery State** until a strategy-defined threshold is met.

## 4. The "Comeback Engine" (Dynamic Balancing)

All rank-based multipliers use a continuous normalized rank `t = (rank - 1) / (totalRacers - 1)`, where `t=0` is the leader and `t=1` is the last racer.

### A. The Slingshot (Acceleration Multiplier)

Trailing racers gain higher torque to recover from mistakes or stamina crashes.
- **Formula:** `A_final = A_base × (1 + t × 0.56)`

### B. The Slipstream & Deep-Trailing Boost

Chasers "slice" through resistance, allowing a higher top speed than the leader.
- **Slipstream:** `V_max_base × (1 + t × 0.25)`
- **Deep-Trailing:** Quadratic extra speed boost for bottom-half racers.

### C. The Rubber-Band

A distance-proportional speed boost that ensures the pack stays together regardless of rank.

### D. The Respite (Stamina Recovery)

Trailing racers recover stamina up to 2.5× faster than the leader.

## 5. Drama & Unpredictability

- **Pace-Wave:** Sinusoidal speed oscillations (±18 %) unique to each racer.
- **Stumble:** Random momentary slowdowns. Leaders stumble 1.4× more often.
- **Second Wind:** Massive speed burst for racers trailing in the bottom 25 % for over 6 seconds.

## 6. The Entrance & Climax Phases

### A. Pre-Race Entrance

Racers walk from off-screen to the start line before the countdown begins.

### B. The Climax Phase (Final 20 %)

Triggered when any racer enters the final 20 % of the track:
- **Enhanced Recovery:** 1.5× recovery multiplier for all.
- **Overdrive:** Speed boost for the top trailing racers within range of the leader.
- **All-In Sprint:** Strategy constraints are ignored for a final dash.

## 7. AI Strategies

| Strategy         | Speed | Accel | Endurance | Behavior                                      |
| :--------------- | :---: | :---: | :-------: | :-------------------------------------------- |
| **Aggressive**   | +10 % | +5 %  |   −25 %   | Sprints hard, crashes fast, recovers quickly. |
| **Pacer**        | 1.0×  | 1.0×  |   +10 %   | Rhythmic push-rest cycles.                    |
| **Conservative** | −8 %  | −5 %  |   +25 %   | Cruises most of the race, saves for the end.  |
| **Closer**       | −2 %  | +15 % |   +5 %    | Cruises until Climax Phase, then surges.      |

## 8. Visual Design & UI

- **Theme:** Natural Earthy Aesthetic with Forest Green backgrounds.
- **Redesign:** 3D multi-layered wooden buttons with organic grain and tactile click animations.
- **Design System:** Centralized `PALETTE` and 12-column grid system.
- **Responsive Layouts:**
  - **Desktop:** Unified centered ranking component (Podium + List).
  - **Mobile Portrait:** Bottom-docked ranking list, hidden racer names/stamina during race.
  - **Mobile Landscape:** Specialized split-screen result view (Winner/Podium on left, List on right) to optimize for short screen height.
- **Aesthetics:** **Animated pixel-art characters** with specialized idle and walk states.

## 9. Funny Mode (Trap Mechanic)

Optional mode where players place **Hole** (trap) obstacles.

### A. Setup Phase Flow

1. **Blind Placement:** Players place traps before lanes and racers are revealed.
2. **Scrolling:** Scroll buttons allow placement across tracks up to 200m.
3. **Start Match:** Triggers racer entrance once all players have finished setup.

### B. Hole Mechanics

| Property        | Value                                                                |
| :-------------- | :------------------------------------------------------------------- |
| **Alignment**   | Aligned with racer feet using `RACER.Y_OFFSET`.                      |
| **Trigger**     | Proximity-based detection.                                           |
| **Effect**      | Momentary stun; racer must re-accelerate from 0.                     |
| **Consumption** | Single-use — hole is removed after triggering.                       |
