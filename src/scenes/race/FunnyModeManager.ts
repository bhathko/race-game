import { Container, Text } from "pixi.js";
import { Hole } from "../../entities";
import { createGameButton, textStyle } from "../../ui";
import { COLORS, TRACK } from "../../config";
import type { TrackLayoutData } from "../../core";
import type { TrackManager } from "./TrackManager";

export interface FunnyModeConfig {
  world: Container;
  ui: Container;
  layout: TrackLayoutData;
  trackManager: TrackManager;
  onSetupFinished: (holes: Hole[]) => void;
  startIndex?: number;
  holes?: Hole[];
}

export class FunnyModeManager {
  private world: Container;
  private ui: Container;
  private layout: TrackLayoutData;
  private trackManager: TrackManager;
  private onSetupFinished: (holes: Hole[]) => void;

  private setupInstructionText: Text | null = null;
  private skipBtn: Container | null = null;
  private startMatchBtn: Container | null = null;
  private scrollLeftBtn: Container | null = null;
  private scrollRightBtn: Container | null = null;
  private previewHole: Hole | null = null;

  private currentSetupPlayerIndex: number = 0;
  private holes: Hole[] = [];
  private setupPhase: boolean = false;

  constructor(config: FunnyModeConfig) {
    this.world = config.world;
    this.ui = config.ui;
    this.layout = config.layout;
    this.trackManager = config.trackManager;
    this.onSetupFinished = config.onSetupFinished;
    if (config.startIndex !== undefined) this.currentSetupPlayerIndex = config.startIndex;
    if (config.holes) this.holes = config.holes;
  }

  /** Traps placed so far and whose turn it is — carried over when the layout is rebuilt. */
  public getProgress(): { holes: Hole[]; playerIndex: number } | null {
    if (!this.setupPhase) return null;
    return { holes: this.holes, playerIndex: this.currentSetupPlayerIndex };
  }

  public resize(layout: TrackLayoutData) {
    this.layout = layout;
    if (!this.setupPhase) return;

    if (this.setupInstructionText) {
      this.setupInstructionText.x = this.layout.viewWidth / 2;
      this.fitInstruction();
    }
    if (this.skipBtn) {
      this.skipBtn.x = this.layout.viewWidth / 2;
    }
    if (this.startMatchBtn) {
      this.startMatchBtn.x = this.layout.viewWidth / 2;
      this.startMatchBtn.y = this.layout.viewHeight / 2;
    }

    if (this.layout.trackWidth > this.layout.viewWidth) {
      if (!this.scrollLeftBtn) {
        this.createScrollButtons();
      }
      if (this.scrollLeftBtn) {
        this.scrollLeftBtn.y = this.layout.viewHeight / 2;
      }
      if (this.scrollRightBtn) {
        this.scrollRightBtn.x = this.layout.viewWidth - 50;
        this.scrollRightBtn.y = this.layout.viewHeight / 2;
      }
    } else {
      if (this.scrollLeftBtn) {
        this.scrollLeftBtn.destroy();
        this.scrollLeftBtn = null;
      }
      if (this.scrollRightBtn) {
        this.scrollRightBtn.destroy();
        this.scrollRightBtn = null;
      }
    }
  }

  private createScrollButtons() {
    this.scrollLeftBtn = createGameButton({
      label: "<",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => this.handleScroll("left"),
      width: 60,
      height: 60,
      fontSize: 32,
    });
    this.scrollLeftBtn.x = 50;
    this.ui.addChild(this.scrollLeftBtn);

    this.scrollRightBtn = createGameButton({
      label: ">",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => this.handleScroll("right"),
      width: 60,
      height: 60,
      fontSize: 32,
    });
    this.ui.addChild(this.scrollRightBtn);
  }

  public startSetup() {
    // Progress (startIndex / holes) comes from the constructor config, so a resumed setup keeps it
    this.setupPhase = true;

    this.setupInstructionText = new Text({ text: "", style: textStyle("overlay", 34) });
    this.setupInstructionText.anchor.set(0.5);
    this.setupInstructionText.x = this.layout.viewWidth / 2;
    this.setupInstructionText.y = 60;
    this.ui.addChild(this.setupInstructionText);

    this.updateInstruction();

    this.world.eventMode = "static";
    this.world.cursor = "crosshair";
    this.world.on("pointerdown", this.handlePointerDown, this);
    this.world.on("pointermove", this.handlePointerMove, this);

    this.skipBtn = createGameButton({
      label: "Skip",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => this.handleSkip(),
      width: 140,
      height: 50,
      fontSize: 20,
    });
    this.skipBtn.x = this.layout.viewWidth / 2;
    this.skipBtn.y = 130;
    this.ui.addChild(this.skipBtn);

    this.startMatchBtn = createGameButton({
      label: "Start match",
      color: COLORS.BUTTON_SUCCESS,
      onClick: () => this.finish(),
      width: 280,
      height: 70,
      fontSize: 28,
    });
    this.startMatchBtn.visible = false;
    this.ui.addChild(this.startMatchBtn);

    const { radiusX, radiusY } = this.getHoleRadii();
    this.previewHole = new Hole(radiusX, radiusY);
    this.previewHole.alpha = 0.5;
    this.previewHole.visible = false;
    this.world.addChild(this.previewHole);

    if (this.layout.trackWidth > this.layout.viewWidth) {
      this.createScrollButtons();
      if (this.scrollLeftBtn) {
        this.scrollLeftBtn.y = this.layout.viewHeight / 2;
      }
      if (this.scrollRightBtn) {
        this.scrollRightBtn.x = this.layout.viewWidth - 50;
        this.scrollRightBtn.y = this.layout.viewHeight / 2;
      }
    }

    // Resuming after an orientation change may already have every trap placed
    this.checkCompletion();
  }

  private updateInstruction() {
    if (!this.setupInstructionText) return;
    if (this.currentSetupPlayerIndex < this.layout.racerCount) {
      this.setupInstructionText.text = `Player ${this.currentSetupPlayerIndex + 1}: place a trap!`;
    } else {
      this.setupInstructionText.text = "All traps placed!";
    }
    this.fitInstruction();
  }

  /** Shrink the instruction banner so it never runs off narrow screens. */
  private fitInstruction() {
    const text = this.setupInstructionText;
    if (!text) return;
    text.scale.set(1);
    const maxW = this.layout.viewWidth - 32;
    if (text.width > maxW) text.scale.set(maxW / text.width);
  }

  private handlePointerDown(e: any) {
    if (!this.setupPhase || this.currentSetupPlayerIndex >= this.layout.racerCount) return;
    const localPos = this.world.toLocal(e.global);
    if (localPos.x < TRACK.START_LINE_X + 100 || localPos.x > this.layout.finishLineX - 50) return;

    const laneIdx = this.trackManager.getNearestLaneIndex(localPos.y);
    if (laneIdx === null) return;

    const { radiusX, radiusY } = this.getHoleRadii();
    const hole = new Hole(radiusX, radiusY);
    hole.x = localPos.x;
    hole.y = this.trackManager.getLaneCenterY(laneIdx);
    hole.laneIndex = laneIdx;
    this.world.addChild(hole);
    this.holes.push(hole);

    this.currentSetupPlayerIndex++;
    this.updateInstruction();
    this.checkCompletion();
  }

  private handlePointerMove(e: any) {
    if (
      !this.setupPhase ||
      !this.previewHole ||
      this.currentSetupPlayerIndex >= this.layout.racerCount
    ) {
      if (this.previewHole) this.previewHole.visible = false;
      return;
    }
    const localPos = this.world.toLocal(e.global);
    const laneIdx = this.trackManager.getNearestLaneIndex(localPos.y);

    if (
      laneIdx !== null &&
      localPos.x >= TRACK.START_LINE_X + 100 &&
      localPos.x <= this.layout.finishLineX - 50
    ) {
      this.previewHole.visible = true;
      this.previewHole.x = localPos.x;
      this.previewHole.y = this.trackManager.getLaneCenterY(laneIdx);
      this.previewHole.laneIndex = laneIdx;
    } else {
      this.previewHole.visible = false;
    }
  }

  private handleSkip() {
    if (!this.setupPhase || this.currentSetupPlayerIndex >= this.layout.racerCount) return;
    this.currentSetupPlayerIndex++;
    this.updateInstruction();
    this.checkCompletion();
  }

  private checkCompletion() {
    if (this.currentSetupPlayerIndex >= this.layout.racerCount) {
      if (this.startMatchBtn) {
        this.startMatchBtn.visible = true;
        this.startMatchBtn.x = this.layout.viewWidth / 2;
        this.startMatchBtn.y = this.layout.viewHeight / 2;
      }
      if (this.skipBtn) this.skipBtn.visible = false;
      if (this.previewHole) this.previewHole.visible = false;
    }
  }

  private handleScroll(direction: "left" | "right") {
    const scrollAmount = 300;
    const targetX = this.world.x + (direction === "left" ? scrollAmount : -scrollAmount);
    const minX = -(this.layout.trackWidth - this.layout.viewWidth);
    this.world.x = Math.max(minX, Math.min(0, targetX));
  }

  private finish() {
    this.setupPhase = false;
    this.world.eventMode = "none";
    this.world.cursor = "default";
    this.cleanupUI();
    this.onSetupFinished(this.holes);
  }

  private cleanupUI() {
    if (this.setupInstructionText) {
      this.setupInstructionText.destroy();
      this.setupInstructionText = null;
    }
    if (this.startMatchBtn) {
      this.startMatchBtn.destroy();
      this.startMatchBtn = null;
    }
    if (this.skipBtn) {
      this.skipBtn.destroy();
      this.skipBtn = null;
    }
    if (this.scrollLeftBtn) {
      this.scrollLeftBtn.destroy();
      this.scrollLeftBtn = null;
    }
    if (this.scrollRightBtn) {
      this.scrollRightBtn.destroy();
      this.scrollRightBtn = null;
    }
    if (this.previewHole) {
      this.previewHole.destroy();
      this.previewHole = null;
    }
    this.world.off("pointerdown", this.handlePointerDown, this);
    this.world.off("pointermove", this.handlePointerMove, this);
  }

  private getHoleRadii(): { radiusX: number; radiusY: number } {
    const laneH = this.trackManager.getLaneHeight();
    const radiusY = Math.min(20, laneH * 0.4);
    const radiusX = Math.min(30, radiusY * 1.5);
    return { radiusX, radiusY };
  }
}
