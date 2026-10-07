# 🏁 Choice Race — Game Design & Technical Spec

## 1. Overview

**Choice Race** is a dynamic, fully responsive web-based 8-player racing game built with **Pixi.js v8** and **TypeScript**. The core design philosophy is close, readable racing: small catch-up bonuses with visible causes (slipstream, rubber-band) keep the pack together, while each strategy's signature strength drives the lead changes, so the outcome is uncertain until the final line.

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

**Depletion Rule:** When Stamina (`S`) reaches 0, the racer enters a short **Tired State** (72 % speed, faster recovery) until it recovers to a strategy-defined fraction of its tank. Dropping below half stamina also slowly saps top speed (**fatigue**), so endurance matters all race long.

### Fixed World Scale

Race length lives in world space: **1 m = 23 px** (`TRACK.PX_PER_METER`). A race takes the same time on every device (≈ 6.5 s per 50 m), the finish line never moves when the screen is rotated or resized, and small screens simply scroll the camera.

## 4. Catch-Up (Dynamic Balancing)

Every bonus is small and has a visible cause. Rank-based bonuses use `t = (rank - 1) / (totalRacers - 1)` and are multiplied by a **field-size factor** `fs = clamp((racers - 1) / 7, 0.35, 1)`, so 2–4 racer races don't flip-flop on every frame.

- **Slipstream (drafting):** within 15–130 px behind the racer ahead → `+5 % × fs` top speed and 20 % less sprint drain. Shown as white speed lines.
- **Rubber-band:** only when clearly behind the leader (smoothstep up to 12 % of the track) → up to `+9 % × fs` top speed.
- **Slingshot:** `A_final = A_base × (1 + t × 0.3 × fs)`.
- **Respite:** trailing racers recover stamina up to `1 + 0.6 × fs` times faster.

## 5. Drama & Unpredictability

- **Pace-Wave:** gentle ±3 % breathing oscillation unique to each racer.
- **Stumble:** random trip-hop with a forward tilt and a dust burst. Leaders stumble 1.4× more often.
- **Second Wind:** +10 % speed for 2.5 s after trailing in the bottom 25 % for 6 s (cyan speed lines).
- **Visual effects (`RacerEffects`):** dust while sprinting, speed lines while drafting / kicking / second wind, sweat drops when exhausted or sprinting on a nearly empty tank.

## 6. The Entrance & Final Kick

### A. Pre-Race Entrance

Racers walk from off-screen to the start line before the countdown begins.

### B. The Final Kick

Each racer goes all-in once the finish is **within reach of the stamina left in its tank** (`KICK_REACH_MARGIN`), or within 60 px regardless. Racers who saved stamina kick from further out. Once committed, a racer sprints to the line.

### C. Pack Camera

The camera frames the leader and the chasing pack together when they fit; otherwise it keeps the leader near the right edge so the chasers stay in shot.

## 7. AI Strategies

Each strategy is strongest in a different phase of the race, so lead changes happen for visible reasons. Values were tuned by headless simulation (`stepRace` is shared by the game and the simulator): across 2/4/8 racers and 50–200 m, every strategy wins 77–122 % of its fair share.

| Strategy         | Speed | Accel | Endurance | Signature                                                            |
| :--------------- | :---: | :---: | :-------: | :------------------------------------------------------------------- |
| **Aggressive**   | +12 % | +10 % |   −15 %   | Fast start: +8 % top speed for the first 360 px; sprints above 30 %. |
| **Pacer**        | +5 %  | 1.0×  |   +10 %   | Most efficient sprinter (14 % less drain); sprints above 55 %.       |
| **Conservative** | +3 %  | −5 %  |   +25 %   | Stalker: double slipstream bonus; only bursts above 65 % stamina.    |
| **Closer**       | +1 %  | +15 % |   +15 %   | Keeps its tank almost full, then the longest kick with +4.5 % speed. |

## 8. Visual Design & UI

- **Theme:** Natural Earthy Aesthetic with Forest Green backgrounds.
- **Redesign Framework:** "Color Pencil Sketch" aesthetic featuring semi-transparent white/gray paper backgrounds, thick jittered (hand-drawn) black outlines, and sketchy drop shadows. Replaced previous heavy 3D wooden UI elements.
- **Design System:** Centralized `PALETTE` and 12-column grid system.
- **Responsive Layouts:**
  - **Desktop:** Unified centered ranking component (Podium + List).
  - **Mobile Portrait:** Bottom-docked ranking list, hidden racer names/stamina during race.
  - **Mobile Landscape:** Specialized split-screen result view (Winner/Podium on left, List on right).
  - **Adaptive Result List:** The 4th+ ranking list switches to two columns (and the podium shrinks slightly) when space is tight; it is hidden and the Top 3 Podium re-centered only as a last resort.
  - **Upright Tablets:** Portrait screens narrower than 1024 px use the vertical layouts; the portrait selection screen scales up to fill larger screens.
  - **Selection Confirmation Popup:** When all racers are selected, a centered modal overlay with START RACE and CANCEL buttons replaces inline controls. CANCEL deselects the last character.
  - **Lane Fitting:** In every layout racers are scaled so the visible character (plus its name label and stamina bar on desktop) fits its lane, centered on the art bounds (`RACER.ART_TOP` / `ART_FEET`). Landscape uses 1-unit grass strips and puts the distance counter at the top of the sidebar.
  - **Live Leaderboard:** Finishers are listed in crossing order; neck-and-neck racers only swap places once one leads by 12 px, so the cards don't reshuffle on every pixel of jitter.
- **Aesthetics:** **Animated pixel-art characters** with specialized idle and walk states.

## 9. Funny Mode (Trap Mechanic)

Optional mode where players place **Hole** (trap) obstacles.

### A. Setup Phase Flow

1. **Blind Placement:** Players place traps before lanes and racers are revealed.
2. **Scrolling:** Scroll buttons allow placement across tracks up to 200m.
3. **Start Match:** Triggers racer entrance once all players have finished setup.

### B. Hole Mechanics

| Property        | Value                                            |
| :-------------- | :----------------------------------------------- |
| **Alignment**   | Centered in the lane, under the racer's art.     |
| **Trigger**     | Proximity-based detection.                       |
| **Effect**      | Momentary stun; racer must re-accelerate from 0. |
| **Consumption** | Single-use — hole is removed after triggering.   |
