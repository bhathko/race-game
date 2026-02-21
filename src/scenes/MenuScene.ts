import { Container } from "pixi.js";
import type { Scene } from "../core/Scene";
import { type MenuContext, LayoutMode, determineMode } from "../core";
import {
  BaseMenuScene,
  DesktopMenuScene,
  MobileVerticalMenuScene,
  MobileHorizontalMenuScene,
} from "./menu";

export class MenuScene extends Container implements Scene {
  private context: MenuContext;
  private currentLayout: BaseMenuScene | null = null;
  private currentMode: LayoutMode | null = null;

  // State to preserve when switching layouts
  private selectedCount: number = 2;
  private selectedDistance: number = 50;
  private isFunnyMode: boolean = false;

  constructor(
    onStartRace: (playerCount: number, distance: number, isFunnyMode?: boolean) => void,
    initialSettings?: { count: number; distance: number },
  ) {
    super();
    this.context = { onStartRace, initialSettings };
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
    if (this.currentLayout) {
      this.selectedCount = this.currentLayout.selectedCount;
      this.selectedDistance = this.currentLayout.selectedDistance;
      this.isFunnyMode = this.currentLayout.isFunnyMode;
      this.removeChild(this.currentLayout);
      this.currentLayout.destroy({ children: true });
    }

    this.currentMode = mode;
    this.context.initialSettings = { count: this.selectedCount, distance: this.selectedDistance };
    // We need to pass isFunnyMode to the new layout somehow?
    // BaseMenuScene defaults to false. We might need to set it after creation.

    switch (mode) {
      case LayoutMode.Desktop:
        this.currentLayout = new DesktopMenuScene(this.context);
        break;
      case LayoutMode.MobileVertical:
        this.currentLayout = new MobileVerticalMenuScene(this.context);
        break;
      case LayoutMode.MobileHorizontal:
        this.currentLayout = new MobileHorizontalMenuScene(this.context);
        break;
    }

    if (this.currentLayout) {
      this.currentLayout.selectedCount = this.selectedCount;
      this.currentLayout.selectedDistance = this.selectedDistance;
      this.currentLayout.isFunnyMode = this.isFunnyMode;
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
