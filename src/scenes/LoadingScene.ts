import { Container } from "pixi.js";
import type { Scene } from "../core/Scene";
import { LayoutMode, determineMode } from "../core";
import {
  BaseLoadingScene,
  DesktopLoadingScene,
  MobileVerticalLoadingScene,
  MobileHorizontalLoadingScene,
} from "./loading";

export class LoadingScene extends Container implements Scene {
  private currentLayout: BaseLoadingScene | null = null;
  private currentMode: LayoutMode | null = null;
  private currentProgress: number = 0;

  constructor() {
    super();
  }

  public setProgress(value: number) {
    this.currentProgress = Math.min(1, Math.max(0, value));
    if (this.currentLayout) {
      this.currentLayout.setProgress(this.currentProgress);
    }
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
      this.removeChild(this.currentLayout);
      this.currentLayout.destroy({ children: true });
    }

    this.currentMode = mode;

    switch (mode) {
      case LayoutMode.Desktop:
        this.currentLayout = new DesktopLoadingScene();
        break;
      case LayoutMode.MobileVertical:
        this.currentLayout = new MobileVerticalLoadingScene();
        break;
      case LayoutMode.MobileHorizontal:
        this.currentLayout = new MobileHorizontalLoadingScene();
        break;
    }

    if (this.currentLayout) {
      this.addChild(this.currentLayout);
      this.currentLayout.setProgress(this.currentProgress);
      this.currentLayout.resize(width, height);
    }
  }

  update(delta: number): void {
    if (this.currentLayout) {
      this.currentLayout.update(delta);
    }
  }
}
