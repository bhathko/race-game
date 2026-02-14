import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CONFIG } from '../config';

export class MenuScene extends Container {
  private onStartRace: (playerCount: number, distance: number) => void;
  private selectedCount: number = 2;
  private selectedDistance: number = 50;
  
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

    const titleStyle = new TextStyle({ fill: CONFIG.COLORS.TEXT_TITLE, fontSize: 48, fontWeight: 'bold' });
    this.title = new Text({ text: 'CHOICE RACE', style: titleStyle });
    this.title.anchor.set(0.5);
    this.addChild(this.title);

    // Racer Count
    this.countLabel = this.createLabel('Number of Racers:');
    this.countValue = this.createValueText(this.selectedCount.toString());
    this.countStepper = this.createStepper((inc) => {
      if (inc && this.selectedCount < CONFIG.MAX_RACERS) this.selectedCount++;
      else if (!inc && this.selectedCount > 2) this.selectedCount--;
      this.countValue.text = this.selectedCount.toString();
    });

    // Distance
    this.distLabel = this.createLabel('Race Distance:');
    this.distValue = this.createValueText(`${this.selectedDistance}m`);
    const distances = [50, 100, 200, 400];
    this.distStepper = this.createStepper((inc) => {
      const idx = distances.indexOf(this.selectedDistance);
      if (inc && idx < distances.length - 1) this.selectedDistance = distances[idx + 1];
      else if (!inc && idx > 0) this.selectedDistance = distances[idx - 1];
      this.distValue.text = `${this.selectedDistance}m`;
    });

    this.startBtn = this.createSimpleButton('START RACE', CONFIG.COLORS.BUTTON_PRIMARY, () => {
      this.onStartRace(this.selectedCount, this.selectedDistance);
    }, 240);
    this.addChild(this.startBtn);
  }

  public resize(width: number, height: number) {
    const centerX = width / 2;
    
    this.title.x = centerX;
    this.title.y = height * 0.15;

    this.countLabel.x = centerX;
    this.countLabel.y = height * 0.3;
    this.countValue.x = centerX;
    this.countValue.y = height * 0.4;
    this.countStepper.x = centerX;
    this.countStepper.y = height * 0.4;

    this.distLabel.x = centerX;
    this.distLabel.y = height * 0.55;
    this.distValue.x = centerX;
    this.distValue.y = height * 0.65;
    this.distStepper.x = centerX;
    this.distStepper.y = height * 0.65;

    this.startBtn.x = centerX;
    this.startBtn.y = height * 0.85;
  }

  private createLabel(text: string) {
    const style = new TextStyle({ fill: CONFIG.COLORS.TEXT_MUTED, fontSize: 24 });
    const label = new Text({ text, style });
    label.anchor.set(0.5);
    this.addChild(label);
    return label;
  }

  private createValueText(text: string) {
    const style = new TextStyle({ fill: CONFIG.COLORS.TEXT_NORMAL, fontSize: 56, fontWeight: 'bold' });
    const valText = new Text({ text, style });
    valText.anchor.set(0.5);
    this.addChild(valText);
    return valText;
  }

  private createStepper(onChange: (inc: boolean) => void) {
    const stepper = new Container();
    const minusBtn = this.createSimpleButton('-', CONFIG.COLORS.BUTTON_DANGER, () => onChange(false));
    minusBtn.x = -120;
    stepper.addChild(minusBtn);

    const plusBtn = this.createSimpleButton('+', CONFIG.COLORS.BUTTON_SUCCESS, () => onChange(true));
    plusBtn.x = 120;
    stepper.addChild(plusBtn);
    
    this.addChild(stepper);
    return stepper;
  }

  private createSimpleButton(label: string, color: number, onClick: () => void, width: number = 60) {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(-width / 2, -30, width, 60, 15);
    bg.fill(color);
    btn.addChild(bg);

    const style = new TextStyle({ fill: CONFIG.COLORS.BUTTON_TEXT, fontSize: 28, fontWeight: 'bold' });
    const text = new Text({ text: label, style });
    text.anchor.set(0.5);
    btn.addChild(text);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', onClick);
    return btn;
  }

  update(_delta: number) {}
}
