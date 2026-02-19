 e # 🏁 Choice Race — Game Design & Technical Spec

## 1. Overview

**Choice Race** is a dynamic, fully responsive web-based 8-player racing game built with **Pixi.js v8** and **TypeScript**. The core design philosophy is to eliminate "Early Lead Dominance" through a sophisticated **Comeback Engine** that scales based on player rank, ensuring tight finishes where the outcome is uncertain until the final line.

## 2. Technical Architecture

- **Engine:** Pixi.js v8 (WebGPU/WebGL)
- **Framework:** TypeScript + Vite
- **Pattern: Responsive Controller:** Scenes are "Controllers" that manage specialized "Layout" subclasses (Desktop, MobileVertical, MobileHorizontal).
- **Pattern: Dependency Grouping:** Layout constructors utilize **Scene Context** interfaces (e.g., `RaceContext`) to unify dependencies and simplify maintenance.
- **Pattern: Barrel:** Uses `index.ts` files to provide clean, centralized module access.
- **Pattern: Strategy:** AI behavior is encapsulated in `StrategyBehavior` implementations, controlling stamina management and sprint triggers.
- **Pattern: Factory:** `RacerFactory` handles randomized stat generation, character assignment, and strategy selection.
- **Scene Lifecycle:** Managed by `Game.ts`, implementing robust **Orientation Handling** with `requestAnimationFrame` to ensure stable UI rerendering on mobile rotation.

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

- **Theme:** Nature-themed racing with solid green backgrounds and lighter oak wood UI.
- **Design System:** Centralized `PALETTE` token system in `config.ts`.
- **Responsive Layouts:**
  - **Desktop:** Sidebar leaderboard, full race view.
  - **Mobile Portrait:** Bottom-docked leaderboard, vertical lineup.
  - **Mobile Landscape:** Compact sidebar or split-screen result view, optimized for height.
- **Aesthetics:** **Podium-style leaderboard** for top 3 winners, animated pixel-art characters.

## 9. Funny Mode (Trap Mechanic)

An optional game mode toggled from the main menu. When enabled, a **Trap Setup Phase** occurs before the racer entrance and the race countdown.

### A. Setup Phase Flow

1. **Sequential Turns:** Players (1 through 8) take turns placing one **Hole** (trap) on the track, or pressing **SKIP** to pass.
2. **Hidden Assignments:** Characters and their assigned lanes remain hidden and off-screen during setup to ensure trap placement is truly "blind."
3. **Manual Scrolling:** For tracks exceeding the screen width (typically 100m+), wooden scroll buttons (`<` and `>`) allow players to navigate the entire length of the track during setup.
4. **Visual Aids:** 
   - A semi-transparent preview hole follows the cursor, snapping to the center of the nearest lane.
   - The remaining distance label is hidden to focus on trap placement.
   - Instructional text displays which player is currently active (e.g., "Player 1: Place a Trap!").
5. **Start Match:** Once all players have finished, the **START MATCH** button appears.
6. **Transition:** Clicking START MATCH hides the setup UI, resets the camera, and triggers the racer entrance walk. The camera smoothly follows the racers as they move to the start line.

### B. Hole Mechanics

| Property        | Value                                                              |
| :-------------- | :----------------------------------------------------------------- |
| **Alignment**   | Perfectly aligned with the lane center "path" and racer feet.      |
| **Trigger**     | Racer X within 50px AND (`laneIndex` match OR Y within 10px).      |
| **Effect**      | Full stop (`currentSpeed = 0`) + stun for ~1 second.               |
| **Immunity**    | **None.** Racers stop every time they hit a hole (encourages chaos). |
| **Consumption** | Single-use — hole is removed after triggering.                     |

### C. Technical Implementation

- **Lane Locking:** Holes store their `laneIndex` to ensure consistent positioning during window resizes and reliable collision detection regardless of character sprite size.
- **Feet-Based Y:** Both racers and holes use the character's feet position as the Y-axis reference, ensuring perfect visual alignment on the dirt track.
