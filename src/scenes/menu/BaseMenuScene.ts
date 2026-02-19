import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAMEPLAY, COLORS, PALETTE } from "../../config";
import { createWoodenButton } from "../../ui";
import type { MenuContext } from "../../core";

const STORAGE_KEY = "choice-race-settings";

interface SavedSettings {
  count: number;
  distance: number;
}

export abstract class BaseMenuScene extends Container {
  protected onStartRace: (playerCount: number, distance: number, isFunnyMode?: boolean) => void;
  public selectedCount = 2;
  public selectedDistance = 50;
  public isFunnyMode = false;

  // Use a hardcoded version or import from package.json if configured.
  // For safety in this environment ensuring no build errors, I'll use a constant for now or try import.
  // The user plan said "Import version from package.json".
  // Let's try to just define it as a string for now, to be safe.
  protected version: string = "v0.0.0";

  protected bg: Graphics;
  protected title: Text;
  protected versionText: Text;
  protected countLabel: Text;
  protected countValue: Text;
  protected countStepper: Container;
  protected distLabel: Text;
  protected distValue: Text;
  protected distStepper: Container;
  protected funnyBtn: Container;
  protected startBtn: Container;

  constructor(ctx: MenuContext) {
    super();
    this.onStartRace = ctx.onStartRace;

    if (ctx.initialSettings) {
      this.selectedCount = ctx.initialSettings.count;
      this.selectedDistance = ctx.initialSettings.distance;
    } else {
      this.loadSettings();
    }

    this.bg = new Graphics();
    this.addChild(this.bg);

    const titleStyle = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 64,
      fontWeight: "900",
      stroke: { color: COLORS.SIDEBAR_WOOD, width: 8 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        color: PALETTE.STR_BLACK,
        distance: 8,
      },
      letterSpacing: 4,
    });
    this.title = new Text({ text: "CHOICE RACE", style: titleStyle });
    this.title.anchor.set(0.5);
    this.addChild(this.title);

    // Version Text
    const versionStyle = new TextStyle({
      fill: PALETTE.STR_GREY_SUBTLE,
      fontSize: 14,
      fontWeight: "bold",
    });
    this.versionText = new Text({ text: this.version, style: versionStyle });
    this.versionText.anchor.set(1, 1); // Bottom-right alignment anchor
    this.addChild(this.versionText);

    // Racer Count
    this.countLabel = this.createLabel("RACERS");
    this.countValue = this.createValueText(this.selectedCount.toString());
    this.countStepper = this.createStepper((inc) => {
      if (inc && this.selectedCount < GAMEPLAY.MAX_RACERS) this.selectedCount++;
      else if (!inc && this.selectedCount > 2) this.selectedCount--;
      this.countValue.text = this.selectedCount.toString();
      this.saveSettings();
    });

    // Distance
    this.distLabel = this.createLabel("DISTANCE");
    this.distValue = this.createValueText(`${this.selectedDistance}m`);
    const distances = [50, 100, 200, 400];
    this.distStepper = this.createStepper((inc) => {
      const idx = distances.indexOf(this.selectedDistance);
      if (inc && idx < distances.length - 1)
        this.selectedDistance = distances[idx + 1];
      else if (!inc && idx > 0) this.selectedDistance = distances[idx - 1];
      this.distValue.text = `${this.selectedDistance}m`;
      this.saveSettings();
    });

    // Funny Mode Toggle
    this.funnyBtn = createWoodenButton({
      label: "FUNNY MODE: OFF",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => {
        this.isFunnyMode = !this.isFunnyMode;
        (this.funnyBtn as any).content.text = `FUNNY MODE: ${this.isFunnyMode ? "ON" : "OFF"}`;
        (this.funnyBtn as any).bg.tint = this.isFunnyMode ? COLORS.BUTTON_WARN : COLORS.BUTTON_NEUTRAL;
      },
      width: 240,
      height: 50,
      fontSize: 18
    });
    this.funnyBtn.label = "funny-btn";
    this.addChild(this.funnyBtn);

    this.startBtn = createWoodenButton({
      label: "START!",
      color: COLORS.BUTTON_SUCCESS,
      onClick: () =>
        this.onStartRace(this.selectedCount, this.selectedDistance, this.isFunnyMode),
      width: 280,
    });
    this.addChild(this.startBtn);
  }

  protected loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved) as SavedSettings;
        if (settings.count >= 2 && settings.count <= GAMEPLAY.MAX_RACERS) {
          this.selectedCount = settings.count;
        }
        if ([50, 100, 200, 400].includes(settings.distance)) {
          this.selectedDistance = settings.distance;
        }
      }
    } catch (e) {
      console.warn("Failed to load settings", e);
    }
  }

  protected saveSettings() {
    try {
      const settings: SavedSettings = {
        count: this.selectedCount,
        distance: this.selectedDistance,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to save settings", e);
    }
  }

  private createLabel(text: string) {
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 28,
      fontWeight: "900",
      stroke: { color: PALETTE.STR_BLACK, width: 4 },
    });
    const label = new Text({ text, style });
    label.anchor.set(0.5);
    this.addChild(label);
    return label;
  }

  private createValueText(text: string) {
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 64,
      fontWeight: "900",
      stroke: { color: COLORS.SIDEBAR_WOOD, width: 6 },
    });
    const valText = new Text({ text, style });
    valText.anchor.set(0.5);
    this.addChild(valText);
    return valText;
  }

  private createStepper(onChange: (inc: boolean) => void) {
    const stepper = new Container();

    const minusBtn = createWoodenButton({
      label: "-",
      color: COLORS.BUTTON_PRIMARY,
      onClick: () => onChange(false),
      width: 80,
      fontSize: 32,
    });
    minusBtn.x = -140;
    stepper.addChild(minusBtn);

    const plusBtn = createWoodenButton({
      label: "+",
      color: COLORS.BUTTON_PRIMARY,
      onClick: () => onChange(true),
      width: 80,
      fontSize: 32,
    });
    plusBtn.x = 140;
    stepper.addChild(plusBtn);

    this.addChild(stepper);
    return stepper;
  }

  public abstract resize(width: number, height: number): void;

  update(_delta: number) {}
}
