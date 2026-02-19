import { Container } from "pixi.js";
import type { Scene } from "../core/Scene";
import type { RacerAnimations, SelectionContext } from "../core/types";
import {
  BaseCharacterSelectionScene,
  DesktopSelectionScene,
  MobileVerticalSelectionScene,
  MobileHorizontalSelectionScene,
} from "./selection";

type LayoutMode = "desktop" | "mobile-vertical" | "mobile-horizontal";

/**
 * Controller scene that manages switching between different device-specific layouts.
 * Preserves the selection state across layout transitions.
 */
export class CharacterSelectionScene extends Container implements Scene {
  private context: SelectionContext;
  private currentLayout: BaseCharacterSelectionScene | null = null;
  private currentMode: LayoutMode | null = null;
  private selectedKeys: string[] = [];

  constructor(
    playerCount: number,
    distance: number,
    characterAnimations: Map<string, RacerAnimations>,
    onStartRace: (characterKeys: string[], distance: number) => void,
    onBack: () => void,
    isFunnyMode?: boolean,
  ) {
    super();
    this.context = {
      playerCount,
      distance,
      characterAnimations,
      onStartRace,
      onBack,
      isFunnyMode,
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
    // Save state from previous layout
    if (this.currentLayout) {
      this.selectedKeys = [...this.currentLayout.selectedKeys];
      this.removeChild(this.currentLayout);
      this.currentLayout.destroy({ children: true });
    }

    this.currentMode = mode;

    // Factory for new layout
    switch (mode) {
      case "desktop":
        this.currentLayout = new DesktopSelectionScene(this.context, this.selectedKeys);
        break;
      case "mobile-vertical":
        this.currentLayout = new MobileVerticalSelectionScene(this.context, this.selectedKeys);
        break;
      case "mobile-horizontal":
        this.currentLayout = new MobileHorizontalSelectionScene(this.context, this.selectedKeys);
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
