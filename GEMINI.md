# Choice Race - Project Overview

A dynamic web-based racing game built with **Pixi.js v8**, **TypeScript**, and **Vite**. The game features randomized racer stats, stamina management, and a competitive "rubber-banding" algorithm to keep races exciting until the finish line.

## Project Structure

- `src/core/`: Contains the main `Game` class, which manages scene transitions and window resize events.
- `src/entities/`: Contains game entities like `Racer`, which handles its own physics, stamina, and strategy (cruising vs. sprinting).
- `src/scenes/`: 
  - `MenuScene.ts`: Entry screen for selecting racer count and track distance.
  - `RaceScene.ts`: The main game loop with a responsive track, dynamic camera, and real-time standings.
  - `ResultScene.ts`: Final leaderboard display with racer times.
- `src/assets/`: 
  - `characters/`: Storage for character sprites and textures.
- `src/config.ts`: Centralized configuration for game balance, dimensions, and visual constants.
- `src/main.ts`: Entry point for Pixi application initialization.

## Key Features

- **Nature-Themed Aesthetic:** High-quality 2D graphics featuring a racetrack with grass and dirt tones, complemented by playful pixel art hills.
- **Modern Game UI:** A clean, playful vector-style UI with semi-transparent dark grey wooden textures and bold cartoon typography.
- **Dynamic Leaderboard:** A vertical ranking system with animated cards. Top ranks feature Gold, Silver, and Bronze borders with cute animal sprite icons.
- **Responsive Design (RWD):** The game adapts to any screen size. On mobile/portrait, the leaderboard moves to the bottom; on desktop, it remains a sidebar.
- **Dynamic AI Strategy:** Racers conserve energy in the mid-game and perform a "final kick" sprint near the finish line.
- **Competitive Balancing:** Includes slipstream and rubber-banding effects to keep the pack close and encourage lead changes.

## Building and Running

- **Development Server:**
  ```bash
  npm run dev
  ```
- **Production Build:**
  ```bash
  npm run build
  ```

## Development Conventions

- **Responsive Positioning:** Use the `resize(width, height)` method in scenes for element placement rather than hardcoded X/Y coordinates.
- **Pixi.js v8 Standards:** Follow modern Pixi.js v8 practices, particularly for `Graphics` and `Application` initialization.
- **Configuration-Driven:** All gameplay parameters (speed, acceleration, stamina rates) and UI colors should be defined in `src/config.ts`.
- **Interpolation:** Use LERP (Linear Interpolation) for camera movements and UI transitions to maintain a polished feel.
