import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { COLORS, PALETTE } from "../config";
import type { Scene } from "../core/Scene";

export class LoadingScene extends Container implements Scene {
  private bg: Graphics;
  private progressBar: Graphics;
  private progressBg: Graphics;
  private loadingText: Text;
  private percentageText: Text;
  private progress: number = 0;

  constructor() {
    super();

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.progressBg = new Graphics();
    this.addChild(this.progressBg);

    this.progressBar = new Graphics();
    this.addChild(this.progressBar);

    const textStyle = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 32,
      fontWeight: "900",
      stroke: { color: COLORS.SIDEBAR_WOOD, width: 6 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        color: PALETTE.STR_BLACK,
        distance: 4,
      },
    });

    this.loadingText = new Text({ text: "LOADING ASSETS...", style: textStyle });
    this.loadingText.anchor.set(0.5);
    this.addChild(this.loadingText);

    this.percentageText = new Text({
      text: "0%",
      style: { ...textStyle, fontSize: 24 },
    });
    this.percentageText.anchor.set(0.5);
    this.addChild(this.percentageText);
  }

  public setProgress(value: number) {
    this.progress = Math.min(1, Math.max(0, value));
    this.updateBar();
  }

  private updateBar() {
    const width = 400;
    const height = 30;
    const padding = 4;
    const barWidth = (width - padding * 2) * this.progress;

    this.progressBar.clear();
    this.progressBar
      .roundRect(-width / 2 + padding, -height / 2 + padding, barWidth, height - padding * 2, 4)
      .fill({ color: COLORS.STAMINA_GOOD });

    this.percentageText.text = `${Math.round(this.progress * 100)}%`;
  }

  public resize(width: number, height: number): void {
    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    const centerX = width / 2;
    const centerY = height / 2;

    this.loadingText.x = centerX;
    this.loadingText.y = centerY - 60;

    const barW = 400;
    const barH = 30;

    this.progressBg.clear();
    this.progressBg
      .roundRect(-barW / 2, -barH / 2, barW, barH, 8)
      .fill({ color: PALETTE.BLACK, alpha: 0.3 })
      .stroke({ color: PALETTE.WHITE, width: 2, alpha: 0.5 });

    this.progressBg.x = centerX;
    this.progressBg.y = centerY;

    this.progressBar.x = centerX;
    this.progressBar.y = centerY;

    this.percentageText.x = centerX;
    this.percentageText.y = centerY + 50;

    this.updateBar();
  }

  update(_delta: number): void {
    // Pulsing effect for loading text
    const scale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
    this.loadingText.scale.set(scale);
  }
}
