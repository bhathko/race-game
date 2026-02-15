import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Racer } from '../entities/Racer';
import { CONFIG } from '../config';

export class ResultScene extends Container {
  private onRestart: () => void;
  private bg: Graphics;
  private hills: Graphics;
  private winnerText: Text;
  private listContainer: Container;
  private restartBtn: Container;

  constructor(finishedRacers: Racer[], onRestart: () => void) {
    super();
    this.onRestart = onRestart;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.hills = new Graphics();
    this.addChild(this.hills);

    const winner = finishedRacers[0];
    
    const titleStyle = new TextStyle({
      fill: '#ffffff',
      fontSize: 56,
      fontWeight: '900',
      stroke: { color: '#4e342e', width: 8 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        color: '#000000',
        distance: 8,
      },
      align: 'center'
    });

    this.winnerText = new Text({ text: `${winner.racerName}\nWINS!`, style: titleStyle });
    this.winnerText.anchor.set(0.5);
    this.addChild(this.winnerText);

    this.listContainer = new Container();
    this.addChild(this.listContainer);

    const headerStyle = new TextStyle({
      fill: '#ffffff',
      fontSize: 24,
      fontWeight: '900',
      stroke: { color: '#000000', width: 4 },
    });
    const header = new Text({ text: 'STANDINGS', style: headerStyle });
    header.anchor.set(0.5);
    this.listContainer.addChild(header);

    finishedRacers.forEach((racer, index) => {
      const isWinner = index === 0;
      
      const itemContainer = new Container();
      itemContainer.y = 50 + (index * 45);
      this.listContainer.addChild(itemContainer);

      const bg = new Graphics();
      const w = 400;
      const h = 40;
      let borderColor = CONFIG.COLORS.RANK_DEFAULT;
      if (index === 0) borderColor = CONFIG.COLORS.RANK_GOLD;
      else if (index === 1) borderColor = CONFIG.COLORS.RANK_SILVER;
      else if (index === 2) borderColor = CONFIG.COLORS.RANK_BRONZE;

      bg.roundRect(-w/2, -h/2, w, h, 6).fill(0x000000, 0.4).stroke({ color: borderColor, width: index < 3 ? 3 : 1 });
      itemContainer.addChild(bg);

      const itemStyle = new TextStyle({
        fill: '#ffffff',
        fontSize: 20,
        fontWeight: '900',
        stroke: { color: '#000000', width: 2 },
      });
      const timeSecs = (racer.finishTime / 60).toFixed(2);
      const rank = index + 1;
      const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
      const text = new Text({ 
        text: `${rank}${suffix}. ${racer.racerName} - ${timeSecs}s`, 
        style: itemStyle 
      });
      text.anchor.set(0.5);
      itemContainer.addChild(text);
    });

    this.restartBtn = this.createWoodenButton('BACK TO MENU', CONFIG.COLORS.BUTTON_PRIMARY, () => {
      this.onRestart();
    }, 320);
    this.addChild(this.restartBtn);
  }

  private createWoodenButton(label: string, color: number, onClick: () => void, width: number = 60) {
    const btn = new Container();
    const h = 60;
    
    const bg = new Graphics();
    bg.roundRect(-width / 2, -h / 2 + 6, width, h, 8).fill(0x000000, 0.4);
    bg.roundRect(-width / 2, -h / 2, width, h, 8).fill(color).stroke({ color: 0x2e1a1a, width: 4 });
    
    for (let i = -h/2 + 10; i < h/2; i += 15) {
      bg.rect(-width/2 + 10, i, width - 20, 2).fill(0x000000, 0.1);
    }
    
    btn.addChild(bg);

    const style = new TextStyle({
      fill: '#ffffff',
      fontSize: 28,
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

  private drawPixelHill(x: number, groundY: number, size: number, color: number) {
    this.hills.beginPath();
    this.hills.moveTo(x - size, groundY);
    this.hills.lineTo(x, groundY - size);
    this.hills.lineTo(x + size, groundY);
    this.hills.fill(color);
    this.hills.stroke({ color: 0x1b5e20, width: 4 });
  }

  public resize(width: number, height: number) {
    const centerX = width / 2;
    const isSmall = width < 600 || height < 500;

    this.bg.clear().rect(0, 0, width, height).fill(0x81c784);

    this.hills.clear();
    this.drawPixelHill(width * 0.2, height, 200, 0x66bb6a);
    this.drawPixelHill(width * 0.5, height, 300, 0x4caf50);
    this.drawPixelHill(width * 0.8, height, 150, 0x81c784);

    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.18;
    this.winnerText.style.fontSize = isSmall ? 36 : 56;

    const listScale = isSmall ? 0.8 : 1.0;
    this.listContainer.scale.set(listScale);
    this.listContainer.x = centerX;
    this.listContainer.y = height * 0.35;

    this.restartBtn.x = centerX;
    this.restartBtn.y = height * 0.85;
    
    if (height < 450) {
      this.restartBtn.scale.set(0.7);
      this.restartBtn.y = height * 0.92;
    } else {
      this.restartBtn.scale.set(1.0);
    }
  }

  update(_delta: number) {}
}
