import { Container } from "pixi.js";
import type { Scene } from "../core/Scene";
import type { RacerAnimations, ResultContext } from "../core/types";
import { Racer } from "../entities";
import {
  BaseResultScene,
  DesktopResultScene,
  MobileVerticalResultScene,
  MobileHorizontalResultScene,
} from "./result";

type LayoutMode = "desktop" | "mobile-vertical" | "mobile-horizontal";

export class ResultScene extends Container implements Scene {
  private context: ResultContext;
  private currentLayout: BaseResultScene | null = null;
  private currentMode: LayoutMode | null = null;

  constructor(
    finishedRacers: Racer[],
    onRestart: () => void,
    characterAnimations: Map<string, RacerAnimations>,
  ) {
    super();
    this.context = {
      finishedRacers,
      onRestart,
      characterAnimations,
    };
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
    if (this.currentLayout) {
      this.removeChild(this.currentLayout);
      this.currentLayout.destroy({ children: true });
    }

    this.currentMode = mode;

    switch (mode) {
      case "desktop":
        this.currentLayout = new DesktopResultScene(this.context);
        break;
      case "mobile-vertical":
        this.currentLayout = new MobileVerticalResultScene(this.context);
        break;
      case "mobile-horizontal":
        this.currentLayout = new MobileHorizontalResultScene(this.context);
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
