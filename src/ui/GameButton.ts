import { Container, Graphics, Text, Ticker } from "pixi.js";
import type { Ticker as TickerType } from "pixi.js";
import { UI } from "../config";
import { textStyle } from "./TextStyles";

export interface GameButtonOptions {
  label: string;
  color: number;
  onClick: () => void;
  width?: number;
  height?: number;
  fontSize?: number;
}

const PRESS_SCALE = 0.96;
const RING_GAP = 5;
const RING_WIDTH = 4;
const LABEL_SIDE_PAD = 18;

/** WCAG relative luminance (0–1) of a 0xRRGGBB color. */
function luminance(color: number) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * lin((color >> 16) & 0xff) +
    0.7152 * lin((color >> 8) & 0xff) +
    0.0722 * lin(color & 0xff)
  );
}

/** White label when it meets the 3:1 large-text contrast ratio on this fill, dark otherwise. */
function labelColorFor(fill: number) {
  const contrastWhite = 1.05 / (luminance(fill) + 0.05);
  return contrastWhite >= 3 ? UI.WHITE : UI.INK;
}

/**
 * Pill button: a clean rounded pill with a soft shadow.
 * Dark (neutral) buttons get a thin border; colored buttons get a white label when it reads well.
 * Hovering shows the pulsing green selection frame; pressing shrinks the pill slightly.
 *
 * Layouts are free to set `scale` on the button itself — hover / press effects run on inner containers.
 */
export class GameButton extends Container {
  public readonly content: Text;

  private face = new Container(); // pressed scale
  private shadow = new Graphics();
  private body = new Graphics();
  private pressShade = new Graphics();
  private ring = new Graphics();

  private color: number;
  private w: number;
  private h: number;
  private onClickFn: () => void;

  private isDown = false;
  private ringClock = 0;
  private tickFn: ((t: TickerType) => void) | null = null;

  constructor(opts: GameButtonOptions) {
    super();
    const { label, color, onClick, width = 240, height = 68, fontSize = 28 } = opts;
    this.color = color;
    this.w = width;
    this.h = height;
    this.onClickFn = onClick;

    this.content = new Text({ text: label, style: textStyle("heading", fontSize) });
    this.content.anchor.set(0.5);

    this.addChild(this.ring, this.face);
    this.face.addChild(this.shadow, this.body, this.pressShade, this.content);
    this.ring.visible = false;
    this.pressShade.visible = false;
    this.draw();

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", () => {
      this.isDown = true;
      this.face.scale.set(PRESS_SCALE);
      this.pressShade.visible = true;
    });
    this.on("pointerup", () => {
      if (!this.isDown) return;
      this.release();
      this.onClickFn();
    });
    this.on("pointerupoutside", () => this.release());
    this.on("pointerover", () => this.showRing(true));
    this.on("pointerout", () => this.showRing(false));
  }

  /** Change the button color (e.g. for toggle buttons), optionally resizing it. */
  public updateColor(color: number, width: number = this.w, height: number = this.h) {
    this.color = color;
    this.w = width;
    this.h = height;
    this.draw();
  }

  /** Change the label text, shrinking it if it no longer fits. */
  public setLabel(label: string) {
    this.content.text = label;
    this.fitLabel();
  }

  private release() {
    this.isDown = false;
    this.face.scale.set(1);
    this.pressShade.visible = false;
  }

  private draw() {
    const { w, h } = this;
    const r = h / 2;
    const isDark = luminance(this.color) < 0.05;

    // Soft shadow: a few stacked, slightly offset translucent pills
    this.shadow.clear();
    for (let i = 3; i >= 1; i--) {
      this.shadow
        .roundRect(-w / 2 - i, -h / 2 + i * 1.5, w + i * 2, h + i, r + i)
        .fill({ color: UI.SHADOW, alpha: 0.12 });
    }

    this.body
      .clear()
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill(this.color);
    if (isDark) this.body.roundRect(-w / 2, -h / 2, w, h, r).stroke({ color: UI.LINE, width: 2 });

    this.pressShade
      .clear()
      .roundRect(-w / 2, -h / 2, w, h, r)
      .fill({ color: UI.SHADOW, alpha: 0.15 });

    const g = RING_GAP;
    this.ring
      .clear()
      .roundRect(-w / 2 - g, -h / 2 - g, w + g * 2, h + g * 2, r + g)
      .stroke({ color: UI.FRAME, width: RING_WIDTH });

    this.content.style.fill = isDark ? UI.TEXT : labelColorFor(this.color);
    this.content.y = -h * 0.02;
    this.fitLabel();
  }

  private fitLabel() {
    this.content.scale.set(1);
    const maxW = this.w - LABEL_SIDE_PAD * 2;
    if (this.content.width > maxW) this.content.scale.set(maxW / this.content.width);
  }

  /** Pulsing green selection frame while hovered. */
  private showRing(show: boolean) {
    this.ring.visible = show;
    if (show && !this.tickFn) {
      this.ringClock = 0;
      this.tickFn = (t: TickerType) => {
        if (this.destroyed) return;
        this.ringClock += t.deltaTime;
        this.ring.alpha = 0.65 + 0.35 * Math.sin(this.ringClock * 0.1);
      };
      Ticker.shared.add(this.tickFn);
    } else if (!show) {
      this.stopRing();
    }
  }

  private stopRing() {
    if (this.tickFn) Ticker.shared.remove(this.tickFn);
    this.tickFn = null;
  }

  public override destroy(options?: Parameters<Container["destroy"]>[0]) {
    this.stopRing();
    super.destroy(options);
  }
}

/** Utility factory for creating game buttons. */
export function createGameButton(opts: GameButtonOptions): GameButton {
  return new GameButton(opts);
}
