# 🏁 Choice Race — Game Design & Technical Spec

## 1. Overview

**Choice Race** is a dynamic, web-based 8-player racing game built with **Pixi.js v8** and **TypeScript**. The core design philosophy is to eliminate "Early Lead Dominance" through a sophisticated **Comeback Engine** that scales based on player rank, ensuring tight, high-stakes finishes where at least 2–3 players are neck-and-neck at the finish line.

## 2. Technical Architecture

- **Engine:** Pixi.js v8 (WebGPU/WebGL)
- **Framework:** TypeScript + Vite
- **Pattern: Strategy:** AI behavior is encapsulated in `StrategyBehavior` implementations (Aggressive, Pacer, Conservative, Closer), controlling stamina management and sprint triggers.
- **Pattern: Factory:** `RacerFactory` handles randomized stat generation, character assignment, and strategy selection.
- **Scene Lifecycle:** Managed by `Game.ts`, implementing a unified `Scene` interface for Menu, Character Selection, Race, and Results.

## 3. The Core Stat Trifecta

Every racer is defined by three primary variables, generated with random variance and strategy-specific multipliers:

- **Top Speed (`V_max`):** The velocity ceiling.
- **Acceleration (`A`):** How fast the racer reaches target speed.
- **Endurance (`E`):** Affects stamina depletion (1/E) and recovery speed (E).

**Depletion Rule:** When Stamina (`S`) reaches 0, the racer enters **Recovery State** (Speed dropped to ~50% of `V_max`) until a strategy-defined threshold is met.

## 4. The "Comeback Engine" (Dynamic Balancing)

All rank-based multipliers use a continuous normalized rank `t = (rank - 1) / (totalRacers - 1)`, where `t=0` is the leader and `t=1` is the last racer.

### A. The Slingshot (Acceleration Multiplier)
Trailing racers gain higher torque to recover from mistakes or stamina crashes.
- **Formula:** `A_final = A_base × (1 + t × 0.56)`
- **Impact:** The last-place racer has +56% Acceleration compared to the leader.

### B. The Slipstream & Deep-Trailing Boost
Chasers "slice" through resistance, allowing a higher top speed than the leader.
- **Slipstream:** `V_max_base × (1 + t × 0.25)`
- **Deep-Trailing:** If `t > 0.5`, an additional quadratic boost is applied: `(t - 0.5)² × 0.25`.

### C. The Rubber-Band
A distance-proportional speed boost that ensures the pack stays together regardless of rank.
- **Effect:** Scales with `distFromLeader / totalDistance`.

### D. The Respite (Stamina Recovery)
The leader faces standard recovery, while trailing racers recover faster.
- **Formula:** `Recovery_Mult = 1 + t × 1.5`
- **Impact:** The last-place racer recovers stamina 2.5x faster than the leader.

## 5. Drama & Unpredictability

To ensure races aren't purely mathematical, several "Drama" mechanics are injected:

- **Pace-Wave:** Sinusoidal speed oscillations (±18%) unique to each racer to simulate "surges."
- **Stumble:** Random momentary slowdowns. Leaders have a 1.4x higher chance to stumble.
- **Second Wind:** Deeply trailing racers (bottom 25%) gain a massive +45% speed burst for 2.5 seconds after trailing for 6 seconds.

## 6. The Entrance & Climax Phases

### A. Pre-Race Entrance
Racers walk from the left off-screen to the start line before the countdown begins, transitioning from walk to idle animations once in position.

### B. The Climax Phase (Final 20%)
Triggered when any racer enters the final 20% of the track:
- **Enhanced Recovery:** All racers get a 1.5x recovery multiplier.
- **Overdrive:** Top 25% of chasers within a specific range of the leader gain a +4% speed boost.
- **All-In Sprint:** All racers ignore strategy constraints and sprint for the finish line within the final 250px.

## 7. AI Strategies

| Strategy | Speed | Accel | Endurance | Behavior |
| :--- | :---: | :---: | :---: | :--- |
| **Aggressive** | +10% | +5% | -25% | Sprints hard, crashes fast, recovers quickly. |
| **Pacer** | 1.0x | 1.0x | +10% | Rhythmic push-rest cycles. |
| **Conservative**| -8% | -5% | +25% | Cruises most of the race, saves for the last 35%. |
| **Closer** | -2% | +15% | +5% | Cruises until Climax Phase, then surges. |

## 8. Visual Design & UI

- **Theme:** Clean nature-themed racing with solid green backgrounds.
- **Design System:** Utilizes a centralized `PALETTE` token system in `config.ts` to manage all hex values, ensuring project-wide consistency and easy theme swapping.
- **Responsive Layout:** Sidebar leaderboard on desktop, bottom-docked on mobile.
- **HUD:** Large real-time "Remaining Distance" indicator at top center.
- **Aesthetics:** Refreshed lighter oak wood style for better vibrancy, **podium-style leaderboard** for top 3 winners, gold/silver/bronze pedestal borders, unified white racer names with brown strokes, animated pixel-art characters.
