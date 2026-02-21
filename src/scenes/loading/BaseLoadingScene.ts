import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { COLORS, PALETTE } from "../../config";

export abstract class BaseLoadingScene extends Container {
  protected bg: Graphics;
  protected progressBar: Graphics;
  protected progressBg: Graphics;
  protected loadingText: Text;
  protected percentageText: Text;
  protected progress: number = 0;
  protected barWidth: number = 400;
  protected barHeight: number = 30;

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

  protected updateBar() {
    const padding = 4;
    const innerWidth = (this.barWidth - padding * 2) * this.progress;

    this.progressBar.clear();
    this.progressBar
      .roundRect(
        -this.barWidth / 2 + padding,
        -this.barHeight / 2 + padding,
        innerWidth,
        this.barHeight - padding * 2,
        4,
      )
      .fill({ color: COLORS.STAMINA_GOOD });

    this.percentageText.text = `${Math.round(this.progress * 100)}%`;
  }

  public abstract resize(width: number, height: number): void;

  public update(_delta: number): void {
    // Pulsing effect for loading text
    const scale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
    this.loadingText.scale.set(scale);
  }
}
