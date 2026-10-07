import { Container, Graphics, Text } from "pixi.js";
import { GAMEPLAY, COLORS, UI } from "../../config";
import { createGameButton, textStyle, setFontSize } from "../../ui";
import type { GameButton } from "../../ui";
import type { MenuContext } from "../../core";

const STORAGE_KEY = "choice-race-settings";

interface SavedSettings {
  count: number;
  distance: number;
}

/** Where a settings card sits on screen (center + size). */
export interface CardRect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

const STEPPER_BTN = 60;
const STEPPER_SPAN = 140;
const CARD_PAD = 14;
const FUNNY_BTN_W = 160;
const FUNNY_BTN_H = 56;

export abstract class BaseMenuScene extends Container {
  protected onStartRace: (playerCount: number, distance: number, isFunnyMode?: boolean) => void;
  public selectedCount = 2;
  public selectedDistance = 50;
  private funnyMode = false;

  // Version injected by Vite from package.json at build time
  protected version: string = `v${__APP_VERSION__}`;

  protected bg: Graphics;
  /** White settings cards: Racers, Distance, Funny mode. */
  protected cards: Graphics[];
  protected title: Text;
  /** Four dots under the title in the controller's face-button colors. */
  protected titleDots: Graphics;
  protected versionText: Text;
  protected countLabel: Text;
  protected countValue: Text;
  protected countStepper: Container;
  protected distLabel: Text;
  protected distValue: Text;
  protected distStepper: Container;
  protected funnyLabel: Text;
  protected funnyBtn: GameButton;
  protected startBtn: GameButton;

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

    this.cards = [new Graphics(), new Graphics(), new Graphics()];
    this.addChild(...this.cards);

    this.title = new Text({ text: "Choice Race", style: textStyle("title", 64) });
    this.title.anchor.set(0.5);
    this.addChild(this.title);

    this.titleDots = new Graphics();
    this.addChild(this.titleDots);

    this.versionText = new Text({ text: this.version, style: textStyle("label", 14) });
    this.versionText.anchor.set(1, 1); // Bottom-right alignment anchor
    this.addChild(this.versionText);

    // Racer Count
    this.countLabel = this.createLabel("Racers");
    this.countValue = this.createValueText(this.selectedCount.toString());
    this.countStepper = this.createStepper((inc) => {
      if (inc && this.selectedCount < GAMEPLAY.MAX_RACERS) this.selectedCount++;
      else if (!inc && this.selectedCount > 2) this.selectedCount--;
      this.countValue.text = this.selectedCount.toString();
      this.saveSettings();
    });

    // Distance
    this.distLabel = this.createLabel("Distance");
    this.distValue = this.createValueText(`${this.selectedDistance}m`);
    const distances = [50, 100, 150, 200];
    this.distStepper = this.createStepper((inc) => {
      const idx = distances.indexOf(this.selectedDistance);
      if (inc && idx < distances.length - 1) this.selectedDistance = distances[idx + 1];
      else if (!inc && idx > 0) this.selectedDistance = distances[idx - 1];
      this.distValue.text = `${this.selectedDistance}m`;
      this.saveSettings();
    });

    // Funny Mode toggle
    this.funnyLabel = this.createLabel("Funny mode");
    this.funnyBtn = createGameButton({
      label: "Off",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => (this.isFunnyMode = !this.isFunnyMode),
      width: FUNNY_BTN_W,
      height: FUNNY_BTN_H,
      fontSize: 24,
    });
    this.funnyBtn.label = "funny-btn";
    this.addChild(this.funnyBtn);

    this.startBtn = createGameButton({
      label: "Start",
      color: COLORS.BUTTON_PRIMARY,
      onClick: () => this.onStartRace(this.selectedCount, this.selectedDistance, this.isFunnyMode),
      width: 280,
      fontSize: 30,
    });
    this.addChild(this.startBtn);
  }

  /** Setting this (e.g. when the layout is rebuilt on rotation) keeps the toggle button in sync. */
  public get isFunnyMode() {
    return this.funnyMode;
  }
  public set isFunnyMode(on: boolean) {
    this.funnyMode = on;
    this.funnyBtn.setLabel(on ? "On" : "Off");
    this.funnyBtn.updateColor(on ? COLORS.BUTTON_WARN : COLORS.BUTTON_NEUTRAL);
  }

  protected loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const settings = JSON.parse(saved) as SavedSettings;
        if (settings.count >= 2 && settings.count <= GAMEPLAY.MAX_RACERS) {
          this.selectedCount = settings.count;
        }
        if ([50, 100, 150, 200].includes(settings.distance)) {
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
    const label = new Text({ text, style: textStyle("label", 20) });
    label.anchor.set(0.5);
    this.addChild(label);
    return label;
  }

  private createValueText(text: string) {
    const valText = new Text({ text, style: textStyle("heading", 56) });
    valText.anchor.set(0.5);
    this.addChild(valText);
    return valText;
  }

  private createStepper(onChange: (inc: boolean) => void) {
    const stepper = new Container();

    const minusBtn = createGameButton({
      label: "\u2212",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => onChange(false),
      width: STEPPER_BTN,
      height: STEPPER_BTN,
      fontSize: 34,
    });
    minusBtn.x = -STEPPER_SPAN;
    stepper.addChild(minusBtn);

    const plusBtn = createGameButton({
      label: "+",
      color: COLORS.BUTTON_NEUTRAL,
      onClick: () => onChange(true),
      width: STEPPER_BTN,
      height: STEPPER_BTN,
      fontSize: 34,
    });
    plusBtn.x = STEPPER_SPAN;
    stepper.addChild(plusBtn);

    this.addChild(stepper);
    return stepper;
  }

  /** Size and center the title. */
  protected placeTitle(x: number, y: number, size: number, maxWidth: number) {
    setFontSize(this.title, size);
    this.title.scale.set(1);
    if (this.title.width > maxWidth) this.title.scale.set(maxWidth / this.title.width);
    this.title.x = x;
    this.title.y = y;

    const dotR = Math.max(3, size * 0.09);
    const gap = dotR * 3.2;
    const dotsY = y + this.title.height / 2 + dotR * 2;
    this.titleDots.clear();
    [UI.RED, UI.PINK, UI.GREEN, UI.BLUE].forEach((color, i) => {
      this.titleDots.circle(x + (i - 1.5) * gap, dotsY, dotR).fill({ color });
    });
  }

  /** Draw the three white settings cards and lay out each one's caption and controls inside it. */
  protected layoutCards(rects: CardRect[]) {
    const groups = [
      { label: this.countLabel, value: this.countValue, stepper: this.countStepper },
      { label: this.distLabel, value: this.distValue, stepper: this.distStepper },
      { label: this.funnyLabel, value: null, stepper: null },
    ];

    rects.forEach((r, i) => {
      this.drawCard(this.cards[i], r);
      const { label, value, stepper } = groups[i];

      const captionSize = Math.max(13, Math.min(20, r.h * 0.13));
      setFontSize(label, captionSize);
      label.x = r.cx;
      label.y = r.cy - r.h / 2 + CARD_PAD + captionSize * 0.7;
      // Controls are centered in the space below the caption
      const contentTop = label.y + captionSize * 0.7;
      const contentY = (contentTop + r.cy + r.h / 2) / 2;
      const contentH = r.cy + r.h / 2 - contentTop;

      if (value && stepper) {
        const btnScale = Math.min(1, (contentH * 0.62) / STEPPER_BTN);
        stepper.scale.set(btnScale);
        stepper.x = r.cx;
        stepper.y = contentY;
        // Keep the round buttons just inside the card's left and right edges
        const offset = (r.w / 2 - CARD_PAD - (STEPPER_BTN / 2) * btnScale) / btnScale;
        stepper.children[0].x = -offset;
        stepper.children[1].x = offset;

        setFontSize(value, Math.max(24, Math.min(56, contentH * 0.62)));
        value.x = r.cx;
        value.y = contentY;
      } else {
        const btnScale = Math.min(
          1,
          (r.w - CARD_PAD * 2) / FUNNY_BTN_W,
          (contentH * 0.7) / FUNNY_BTN_H,
        );
        this.funnyBtn.scale.set(btnScale);
        this.funnyBtn.x = r.cx;
        this.funnyBtn.y = contentY;
      }
    });
  }

  private drawCard(g: Graphics, r: CardRect) {
    const x = r.cx - r.w / 2;
    const y = r.cy - r.h / 2;
    const radius = Math.min(22, r.h * 0.14);
    g.clear();
    // Soft shadow
    for (let i = 3; i >= 1; i--) {
      g.roundRect(x - i, y + i * 1.5, r.w + i * 2, r.h + i, radius + i).fill({
        color: UI.SHADOW,
        alpha: 0.04,
      });
    }
    g.roundRect(x, y, r.w, r.h, radius)
      .fill({ color: UI.SURFACE })
      .stroke({ color: UI.LINE, width: 2 });
  }

  public abstract resize(width: number, height: number): void;

  update(_delta: number) {}
}
