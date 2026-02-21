import { Container, Texture } from "pixi.js";
import type { Scene } from "../core/Scene";
import {
  type RacerAnimations,
  type GroundTextures,
  type GrassTextures,
  type RaceContext,
  LayoutMode,
  determineMode,
} from "../core";
import { Racer } from "../entities";
import {
  BaseRaceScene,
  DesktopRaceScene,
  MobileVerticalRaceScene,
  MobileHorizontalRaceScene,
} from "./race";
import type { RaceState } from "./race";

export class RaceScene extends Container implements Scene {
  private context: RaceContext;
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
    isFunnyMode?: boolean,
  ) {
    super();
    this.context = {
      playerNames,
      distance,
      characterAnimations,
      treeAnimation,
      groundTextures,
      grassTextures,
      onFinished,
      selectedKeys,
      isFunnyMode,
    };
  }

  public resize(width: number, height: number): void {
    const newMode = determineMode(width, height);

    if (newMode !== this.currentMode) {
      this.switchLayout(newMode, width, height);
    } else if (this.currentLayout) {
      this.currentLayout.resize(width, height);
    }
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

    switch (mode) {
      case LayoutMode.Desktop:
        this.currentLayout = new DesktopRaceScene(this.context, existingState);
        break;
      case LayoutMode.MobileVertical:
        this.currentLayout = new MobileVerticalRaceScene(this.context, existingState);
        break;
      case LayoutMode.MobileHorizontal:
        this.currentLayout = new MobileHorizontalRaceScene(this.context, existingState);
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
