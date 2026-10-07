import { Container, Graphics, Text } from "pixi.js";
import { UI } from "../../config";
import { textStyle } from "../../ui";

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

    this.loadingText = new Text({ text: "Loading…", style: textStyle("heading", 32) });
    this.loadingText.anchor.set(0.5);
    this.addChild(this.loadingText);

    this.percentageText = new Text({ text: "0%", style: textStyle("label", 22) });
    this.percentageText.anchor.set(0.5);
    this.addChild(this.percentageText);
  }

  public setProgress(value: number) {
    this.progress = Math.min(1, Math.max(0, value));
    this.updateBar();
  }

  protected updateBar() {
    const padding = 4;
    const innerH = this.barHeight - padding * 2;
    // Keep the fill at least as wide as it is tall so the pill ends stay round
    const innerWidth = Math.max(innerH, (this.barWidth - padding * 2) * this.progress);

    this.progressBar.clear();
    this.progressBar
      .roundRect(-this.barWidth / 2 + padding, -innerH / 2, innerWidth, innerH, innerH / 2)
      .fill({ color: UI.BLUE });

    this.percentageText.text = `${Math.round(this.progress * 100)}%`;
  }

  public abstract resize(width: number, height: number): void;

  public update(_delta: number): void {
    // Pulsing effect for loading text
    const scale = 1 + Math.sin(Date.now() * 0.005) * 0.05;
    this.loadingText.scale.set(scale);
  }
}
