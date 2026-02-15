import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CONFIG } from '../config';

export class MenuScene extends Container {
  private onStartRace: (playerCount: number, distance: number) => void;
  private selectedCount: number = 2;
  private selectedDistance: number = 50;
  
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
      fill: '#ffffff',
      fontSize: 64,
      fontWeight: '900',
      stroke: { color: '#4e342e', width: 8 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        color: '#000000',
        distance: 8,
      },
      letterSpacing: 4
    });
    this.title = new Text({ text: 'CHOICE RACE', style: titleStyle });
    this.title.anchor.set(0.5);
    this.addChild(this.title);

    // Racer Count
    this.countLabel = this.createLabel('RACERS');
    this.countValue = this.createValueText(this.selectedCount.toString());
    this.countStepper = this.createStepper((inc) => {
      if (inc && this.selectedCount < CONFIG.MAX_RACERS) this.selectedCount++;
      else if (!inc && this.selectedCount > 2) this.selectedCount--;
      this.countValue.text = this.selectedCount.toString();
    });

    // Distance
    this.distLabel = this.createLabel('DISTANCE');
    this.distValue = this.createValueText(`${this.selectedDistance}m`);
    const distances = [50, 100, 200, 400];
    this.distStepper = this.createStepper((inc) => {
      const idx = distances.indexOf(this.selectedDistance);
      if (inc && idx < distances.length - 1) this.selectedDistance = distances[idx + 1];
      else if (!inc && idx > 0) this.selectedDistance = distances[idx - 1];
      this.distValue.text = `${this.selectedDistance}m`;
    });

    this.startBtn = this.createWoodenButton('START!', CONFIG.COLORS.BUTTON_SUCCESS, () => {
      this.onStartRace(this.selectedCount, this.selectedDistance);
    }, 280);
    this.addChild(this.startBtn);
  }

  public resize(width: number, height: number) {
    const centerX = width / 2;
    
    // Background: Grass Green
    this.bg.clear().rect(0, 0, width, height).fill(0x81c784);

    // Pixel Hills
    this.hills.clear();
    this.drawPixelHill(width * 0.2, height, 200, 0x66bb6a);
    this.drawPixelHill(width * 0.5, height, 300, 0x4caf50);
    this.drawPixelHill(width * 0.8, height, 150, 0x81c784);

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

  private drawPixelHill(x: number, groundY: number, size: number, color: number) {
    this.hills.beginPath();
    this.hills.moveTo(x - size, groundY);
    this.hills.lineTo(x, groundY - size);
    this.hills.lineTo(x + size, groundY);
    this.hills.fill(color);
    this.hills.stroke({ color: 0x1b5e20, width: 4 });
  }

  private createLabel(text: string) {
    const style = new TextStyle({
      fill: '#ffffff',
      fontSize: 28,
      fontWeight: '900',
      stroke: { color: '#000000', width: 4 },
    });
    const label = new Text({ text, style });
    label.anchor.set(0.5);
    this.addChild(label);
    return label;
  }

  private createValueText(text: string) {
    const style = new TextStyle({
      fill: '#ffffff',
      fontSize: 64,
      fontWeight: '900',
      stroke: { color: '#4e342e', width: 6 },
    });
    const valText = new Text({ text, style });
    valText.anchor.set(0.5);
    this.addChild(valText);
    return valText;
  }

  private createStepper(onChange: (inc: boolean) => void) {
    const stepper = new Container();
    const minusBtn = this.createWoodenButton('-', CONFIG.COLORS.BUTTON_PRIMARY, () => onChange(false), 80);
    minusBtn.x = -140;
    stepper.addChild(minusBtn);

    const plusBtn = this.createWoodenButton('+', CONFIG.COLORS.BUTTON_PRIMARY, () => onChange(true), 80);
    plusBtn.x = 140;
    stepper.addChild(plusBtn);
    
    this.addChild(stepper);
    return stepper;
  }

  private createWoodenButton(label: string, color: number, onClick: () => void, width: number = 60) {
    const btn = new Container();
    const h = 60;
    
    const bg = new Graphics();
    // Shadow
    bg.roundRect(-width / 2, -h / 2 + 6, width, h, 8).fill(0x000000, 0.4);
    // Main body (Dark wooden texture look)
    bg.roundRect(-width / 2, -h / 2, width, h, 8).fill(color).stroke({ color: 0x2e1a1a, width: 4 });
    
    // Wood grain lines
    for (let i = -h/2 + 10; i < h/2; i += 15) {
      bg.rect(-width/2 + 10, i, width - 20, 2).fill(0x000000, 0.1);
    }
    
    btn.addChild(bg);

    const style = new TextStyle({
      fill: '#ffffff',
      fontSize: 32,
      fontWeight: '900',
      stroke: { color: '#000000', width: 4 }
    });
    const text = new Text({ text: label, style });
    text.anchor.set(0.5);
    btn.addChild(text);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      btn.scale.set(0.95);
      onClick();
    });
    btn.on('pointerup', () => btn.scale.set(1.0));
    btn.on('pointerupoutside', () => btn.scale.set(1.0));
    
    return btn;
  }

  update(_delta: number) {}
}
