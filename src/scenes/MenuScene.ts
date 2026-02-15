import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GAMEPLAY, COLORS } from "../config";
import { createWoodenButton } from "../ui/WoodenButton";
import { drawHillBackground } from "../ui/HillBackground";

export class MenuScene extends Container {
  private onStartRace: (playerCount: number, distance: number) => void;
  private selectedCount = 2;
  private selectedDistance = 50;

  private bg: Graphics;
  private hills: Graphics;
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

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.hills = new Graphics();
    this.addChild(this.hills);

    const titleStyle = new TextStyle({
      fill: "#ffffff",
      fontSize: 64,
      fontWeight: "900",
      stroke: { color: "#4e342e", width: 8 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        color: "#000000",
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

  public resize(width: number, height: number) {
    const centerX = width / 2;

    drawHillBackground(this.bg, this.hills, width, height);

    this.title.x = centerX;
    this.title.y = height * 0.15;
    this.title.style.fontSize = width < 600 ? 40 : 64;

    const labelY1 = height * 0.32;
    const valueY1 = height * 0.42;
    this.countLabel.x = centerX;
    this.countLabel.y = labelY1;
    this.countValue.x = centerX;
    this.countValue.y = valueY1;
    this.countStepper.x = centerX;
    this.countStepper.y = valueY1;

    const labelY2 = height * 0.57;
    const valueY2 = height * 0.67;
    this.distLabel.x = centerX;
    this.distLabel.y = labelY2;
    this.distValue.x = centerX;
    this.distValue.y = valueY2;
    this.distStepper.x = centerX;
    this.distStepper.y = valueY2;

    this.startBtn.x = centerX;
    this.startBtn.y = height * 0.85;
  }

  private createLabel(text: string) {
    const style = new TextStyle({
      fill: "#ffffff",
      fontSize: 28,
      fontWeight: "900",
      stroke: { color: "#000000", width: 4 },
    });
    const label = new Text({ text, style });
    label.anchor.set(0.5);
    this.addChild(label);
    return label;
  }

  private createValueText(text: string) {
    const style = new TextStyle({
      fill: "#ffffff",
      fontSize: 64,
      fontWeight: "900",
      stroke: { color: "#4e342e", width: 6 },
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
