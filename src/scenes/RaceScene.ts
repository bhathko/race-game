import { Container } from "pixi.js";
import type { Scene } from "../core/Scene";
import type { RacerAnimations, GroundTextures, GrassTextures } from "../core/types";
import { Racer } from "../entities/Racer";
import { Texture } from "pixi.js";
import { BaseRaceScene } from "./race/BaseRaceScene";
import type { RaceState } from "./race/BaseRaceScene";
import { DesktopRaceScene } from "./race/DesktopRaceScene";
import { MobileVerticalRaceScene } from "./race/MobileVerticalRaceScene";
import { MobileHorizontalRaceScene } from "./race/MobileHorizontalRaceScene";

type LayoutMode = "desktop" | "mobile-vertical" | "mobile-horizontal";

export class RaceScene extends Container implements Scene {
  private playerNames: string[];
  private distance: number;
  private characterAnimations: Map<string, RacerAnimations>;
  private treeAnimation: Texture[];
  private groundTextures: GroundTextures;
  private grassTextures: GrassTextures;
  private onFinished: (results: Racer[]) => void;
  private selectedKeys?: string[];

  private currentLayout: BaseRaceScene | null = null;
  private currentMode: LayoutMode | null = null;

  constructor(
    playerNames: string[],
    distance: number,
    characterAnimations: Map<string, RacerAnimations>,
    treeAnimation: Texture[],
    groundTextures: GroundTextures,
    grassTextures: GrassTextures,
    onFinished: (results: Racer[]) => void,
    selectedKeys?: string[],
  ) {
    super();
    this.playerNames = playerNames;
    this.distance = distance;
    this.characterAnimations = characterAnimations;
    this.treeAnimation = treeAnimation;
    this.groundTextures = groundTextures;
    this.grassTextures = grassTextures;
    this.onFinished = onFinished;
    this.selectedKeys = selectedKeys;
  }

  public resize(width: number, height: number): void {
    const newMode = this.determineMode(width, height);

    if (newMode !== this.currentMode) {
      this.switchLayout(newMode, width, height);
    } else if (this.currentLayout) {
      this.currentLayout.resize(width, height);
    }
  }

  private determineMode(width: number, height: number): LayoutMode {
    const isMobile = width < 600 || height < 500;
    const isPortrait = height > width;

    if (!isMobile) return "desktop";
    return isPortrait ? "mobile-vertical" : "mobile-horizontal";
  }

  private switchLayout(mode: LayoutMode, width: number, height: number): void {
    let existingState: RaceState | undefined;

    if (this.currentLayout) {
      existingState = this.currentLayout.getState();
      this.removeChild(this.currentLayout);
      // We don't destroy children because we want to preserve racers
      this.currentLayout.destroy({ children: false });
    }

    this.currentMode = mode;

    const args: [string[], number, Map<string, RacerAnimations>, Texture[], GroundTextures, GrassTextures, (results: Racer[]) => void, string[] | undefined, RaceState | undefined] = [
      this.playerNames,
      this.distance,
      this.characterAnimations,
      this.treeAnimation,
      this.groundTextures,
      this.grassTextures,
      this.onFinished,
      this.selectedKeys,
      existingState
    ];

    switch (mode) {
      case "desktop":
        this.currentLayout = new DesktopRaceScene(...args);
        break;
      case "mobile-vertical":
        this.currentLayout = new MobileVerticalRaceScene(...args);
        break;
      case "mobile-horizontal":
        this.currentLayout = new MobileHorizontalRaceScene(...args);
        break;
    }

    if (this.currentLayout) {
      this.addChild(this.currentLayout);
      this.currentLayout.resize(width, height);
    }
  }

  update(delta: number): void {
    if (this.currentLayout) {
      this.currentLayout.update(delta);
    }
  }
}
