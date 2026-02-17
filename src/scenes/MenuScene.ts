import { Container } from "pixi.js";
import type { Scene } from "../core/Scene";
import { BaseMenuScene } from "./menu/BaseMenuScene";
import { DesktopMenuScene } from "./menu/DesktopMenuScene";
import { MobileVerticalMenuScene } from "./menu/MobileVerticalMenuScene";
import { MobileHorizontalMenuScene } from "./menu/MobileHorizontalMenuScene";

type LayoutMode = "desktop" | "mobile-vertical" | "mobile-horizontal";

export class MenuScene extends Container implements Scene {
  private onStartRace: (playerCount: number, distance: number) => void;
  private currentLayout: BaseMenuScene | null = null;
  private currentMode: LayoutMode | null = null;

  // Track state to preserve across layout switches
  private selectedCount: number = 2;
  private selectedDistance: number = 50;

  constructor(onStartRace: (playerCount: number, distance: number) => void) {
    super();
    this.onStartRace = onStartRace;
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
      this.selectedCount = this.currentLayout.selectedCount;
      this.selectedDistance = this.currentLayout.selectedDistance;
      this.removeChild(this.currentLayout);
      this.currentLayout.destroy({ children: true });
    }

    this.currentMode = mode;

    const settings = { count: this.selectedCount, distance: this.selectedDistance };

    switch (mode) {
      case "desktop":
        this.currentLayout = new DesktopMenuScene(this.onStartRace, settings);
        break;
      case "mobile-vertical":
        this.currentLayout = new MobileVerticalMenuScene(this.onStartRace, settings);
        break;
      case "mobile-horizontal":
        this.currentLayout = new MobileHorizontalMenuScene(this.onStartRace, settings);
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
