import { Container, Text, TextStyle } from "pixi.js";
import { Hole } from "../../entities";
import { createWoodenButton } from "../../ui";
import { COLORS, PALETTE, TRACK, ITEMS } from "../../config";

export interface FunnyModeConfig {
  world: Container;
  ui: Container;
  gameViewW: number;
  gameViewH: number;
  trackWidth: number;
  finishLineX: number;
  racerCount: number;
  onSetupFinished: (holes: Hole[]) => void;
}

export class FunnyModeManager {
  private world: Container;
  private ui: Container;
  private gameViewW: number;
  private gameViewH: number;
  private trackWidth: number;
  private finishLineX: number;
  private racerCount: number;
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
    this.gameViewW = config.gameViewW;
    this.gameViewH = config.gameViewH;
    this.trackWidth = config.trackWidth;
    this.finishLineX = config.finishLineX;
    this.racerCount = config.racerCount;
    this.onSetupFinished = config.onSetupFinished;
  }

  public startSetup() {
    this.setupPhase = true;
    this.currentSetupPlayerIndex = 0;
    this.holes = [];

    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 36,
      fontWeight: "900",
      stroke: { color: PALETTE.STR_BLACK, width: 6 },
      dropShadow: { alpha: 0.5, blur: 4, distance: 4 },
    });
    this.setupInstructionText = new Text({ text: "", style });
    this.setupInstructionText.anchor.set(0.5);
    this.setupInstructionText.x = this.gameViewW / 2;
    this.setupInstructionText.y = 60;
    this.ui.addChild(this.setupInstructionText);

    this.updateInstruction();

    this.world.eventMode = "static";
    this.world.cursor = "crosshair";
    this.world.on("pointerdown", this.handlePointerDown, this);
    this.world.on("pointermove", this.handlePointerMove, this);

    this.skipBtn = createWoodenButton({
      label: "SKIP",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => this.handleSkip(),
      width: 140,
      height: 50,
      fontSize: 20,
    });
    this.skipBtn.x = this.gameViewW / 2;
    this.skipBtn.y = 130;
    this.ui.addChild(this.skipBtn);

    this.startMatchBtn = createWoodenButton({
      label: "START MATCH",
      color: COLORS.BUTTON_SUCCESS,
      onClick: () => this.finish(),
      width: 280,
      height: 70,
      fontSize: 28,
    });
    this.startMatchBtn.visible = false;
    this.ui.addChild(this.startMatchBtn);

    this.previewHole = new Hole();
    this.previewHole.alpha = 0.5;
    this.previewHole.visible = false;
    this.world.addChild(this.previewHole);

    if (this.trackWidth > this.gameViewW) {
      this.scrollLeftBtn = createWoodenButton({
        label: "<",
        color: COLORS.BUTTON_PRIMARY,
        onClick: () => this.handleScroll("left"),
        width: 60,
        height: 60,
        fontSize: 32,
      });
      this.scrollLeftBtn.x = 50;
      this.scrollLeftBtn.y = this.gameViewH / 2;
      this.ui.addChild(this.scrollLeftBtn);

      this.scrollRightBtn = createWoodenButton({
        label: ">",
        color: COLORS.BUTTON_PRIMARY,
        onClick: () => this.handleScroll("right"),
        width: 60,
        height: 60,
        fontSize: 32,
      });
      this.scrollRightBtn.x = this.gameViewW - 50;
      this.scrollRightBtn.y = this.gameViewH / 2;
      this.ui.addChild(this.scrollRightBtn);
    }
  }

  private updateInstruction() {
    if (!this.setupInstructionText) return;
    if (this.currentSetupPlayerIndex < this.racerCount) {
      this.setupInstructionText.text = `Player ${this.currentSetupPlayerIndex + 1}: Place a Trap!`;
      this.setupInstructionText.style.fill = PALETTE.STR_WHITE;
    } else {
      this.setupInstructionText.text = "All Traps Placed!";
      this.setupInstructionText.style.fill = PALETTE.STR_SUCCESS;
    }
  }

  private handlePointerDown(e: any) {
    if (!this.setupPhase || this.currentSetupPlayerIndex >= this.racerCount) return;
    const localPos = this.world.toLocal(e.global);
    if (localPos.x < TRACK.START_LINE_X + 100 || localPos.x > this.finishLineX - 50) return;

    const laneIdx = this.getNearestLaneIndex(localPos.y);
    if (laneIdx === null) return;

    const hole = new Hole();
    hole.x = localPos.x;
    hole.y = this.getLaneRacerY(laneIdx);
    hole.laneIndex = laneIdx;
    this.world.addChild(hole);
    this.holes.push(hole);

    this.currentSetupPlayerIndex++;
    this.updateInstruction();
    this.checkCompletion();
  }

  private handlePointerMove(e: any) {
    if (!this.setupPhase || !this.previewHole || this.currentSetupPlayerIndex >= this.racerCount) {
      if (this.previewHole) this.previewHole.visible = false;
      return;
    }
    const localPos = this.world.toLocal(e.global);
    const laneIdx = this.getNearestLaneIndex(localPos.y);

    if (
      laneIdx !== null &&
      localPos.x >= TRACK.START_LINE_X + 100 &&
      localPos.x <= this.finishLineX - 50
    ) {
      this.previewHole.visible = true;
      this.previewHole.x = localPos.x;
      this.previewHole.y = this.getLaneRacerY(laneIdx);
      this.previewHole.laneIndex = laneIdx;
    } else {
      this.previewHole.visible = false;
    }
  }

  private handleSkip() {
    if (!this.setupPhase || this.currentSetupPlayerIndex >= this.racerCount) return;
    this.currentSetupPlayerIndex++;
    this.updateInstruction();
    this.checkCompletion();
  }

  private checkCompletion() {
    if (this.currentSetupPlayerIndex >= this.racerCount) {
      if (this.startMatchBtn) {
        this.startMatchBtn.visible = true;
        this.startMatchBtn.x = this.gameViewW / 2;
        this.startMatchBtn.y = this.gameViewH / 2;
      }
      if (this.skipBtn) this.skipBtn.visible = false;
      if (this.previewHole) this.previewHole.visible = false;
    }
  }

  private handleScroll(direction: "left" | "right") {
    const scrollAmount = 300;
    const targetX = this.world.x + (direction === "left" ? scrollAmount : -scrollAmount);
    const minX = -(this.trackWidth - this.gameViewW);
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

  private getNearestLaneIndex(localY: number): number | null {
    const unit = ITEMS.ground.unit;
    const grassStripH = unit * 4;
    if (localY < grassStripH || localY > this.gameViewH - grassStripH) return null;
    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / this.racerCount;
    let minDist = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < this.racerCount; i++) {
      const laneCenterY = grassStripH + (i + 0.5) * trackHeight;
      const dist = Math.abs(localY - laneCenterY);
      if (dist < minDist) {
        minDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  private getLaneRacerY(laneIndex: number): number {
    const unit = ITEMS.ground.unit;
    const grassStripH = unit * 4;
    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / this.racerCount;
    return grassStripH + (laneIndex + 0.5) * trackHeight;
  }
}
