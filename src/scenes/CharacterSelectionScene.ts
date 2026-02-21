import { Container } from "pixi.js";
import type { Scene } from "../core/Scene";
import { type RacerAnimations, type SelectionContext, LayoutMode, determineMode } from "../core";
import {
  BaseCharacterSelectionScene,
  DesktopSelectionScene,
  MobileVerticalSelectionScene,
  MobileHorizontalSelectionScene,
} from "./selection";

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
    const newMode = determineMode(width, height);

    if (newMode !== this.currentMode) {
      this.switchLayout(newMode, width, height);
    } else if (this.currentLayout) {
      this.currentLayout.resize(width, height);
    }
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
      case LayoutMode.Desktop:
        this.currentLayout = new DesktopSelectionScene(this.context, this.selectedKeys);
        break;
      case LayoutMode.MobileVertical:
        this.currentLayout = new MobileVerticalSelectionScene(this.context, this.selectedKeys);
        break;
      case LayoutMode.MobileHorizontal:
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
