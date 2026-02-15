import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAMEPLAY, COLORS, PALETTE } from "../config";
import { createWoodenButton } from "../ui/WoodenButton";

const STORAGE_KEY = "choice-race-settings";

interface SavedSettings {
  count: number;
  distance: number;
}

export class MenuScene extends Container {
  private onStartRace: (playerCount: number, distance: number) => void;
  private selectedCount = 2;
  private selectedDistance = 50;

  private bg: Graphics;
  private title: Text;
  private countLabel: Text;
  private countValue: Text;
  private countStepper: Container;
  private distLabel: Text;
  private distValue: Text;
  private distStepper: Container;
  private startBtn: Container;

  constructor(onStartRace: (playerCount: number, distance: number) => void) {
    super();
    this.onStartRace = onStartRace;

    this.loadSettings();

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

    this.startBtn = createWoodenButton({
      label: "START!",
      color: COLORS.BUTTON_SUCCESS,
      onClick: () =>
        this.onStartRace(this.selectedCount, this.selectedDistance),
      width: 280,
    });
    this.addChild(this.startBtn);
  }

  // ── Settings persistence ────────────────────────────────────────────────

  private loadSettings() {
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

  private saveSettings() {
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

  // ── Layout ──────────────────────────────────────────────────────────────

  public resize(width: number, height: number) {
    const centerX = width / 2;

    // Draw solid background
    this.bg.clear().rect(0, 0, width, height).fill(PALETTE.GRASS_LIGHT);

    this.title.x = centerX;
    this.title.y = height * 0.15;
    this.title.style.fontSize = width < 600 ? 40 : 64;

    const labelY1 = height * 0.3;
    const valueY1 = height * 0.42;
    this.countLabel.x = centerX;
    this.countLabel.y = labelY1;
    this.countValue.x = centerX;
    this.countValue.y = valueY1;
    this.countStepper.x = centerX;
    this.countStepper.y = valueY1;

    const labelY2 = height * 0.55;
    const valueY2 = height * 0.67;
    this.distLabel.x = centerX;
    this.distLabel.y = labelY2;
    this.distValue.x = centerX;
    this.distValue.y = valueY2;
    this.distStepper.x = centerX;
    this.distStepper.y = valueY2;

    this.startBtn.x = centerX;
    this.startBtn.y = height * 0.82;
  }

  // ── UI helpers ──────────────────────────────────────────────────────────

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

  update(_delta: number) {}
}
