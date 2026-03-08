import { Container, Graphics } from "pixi.js";

export class Hole extends Container {
  private graphic: Graphics;
  public laneIndex: number = -1;

  constructor(radiusX: number = 30, radiusY: number = 20) {
    super();

    this.graphic = new Graphics();
    // Visual: Dark hole in the ground
    this.graphic.ellipse(0, 0, radiusX, radiusY);
    this.graphic.fill({ color: 0x1a1a1a, alpha: 0.8 }); // Almost black
    this.graphic.stroke({ color: 0x3e2723, width: 2, alpha: 0.5 }); // Dark brown edge

    this.addChild(this.graphic);

    this.label = "hole";
  }
}
