import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CONFIG } from '../config';
import { Racer } from '../entities/Racer';

export class ResultScene extends Container {
  private onRestart: () => void;
  private bg: Graphics;
  private winnerText: Text;
  private listContainer: Container;
  private restartBtn: Container;

  constructor(finishedRacers: Racer[], onRestart: () => void) {
    super();
    this.onRestart = onRestart;

    this.bg = new Graphics();
    this.addChild(this.bg);

    const winner = finishedRacers[0];
    
    const titleStyle = new TextStyle({
      fill: CONFIG.COLORS.TEXT_TITLE,
      fontSize: 48,
      fontWeight: 'bold',
      dropShadow: { alpha: 0.5, angle: Math.PI / 6, blur: 4, color: '#000000', distance: 6 }
    });

    this.winnerText = new Text({ text: `WINNER: ${winner.racerName}!`, style: titleStyle });
    this.winnerText.anchor.set(0.5);
    this.addChild(this.winnerText);

    this.listContainer = new Container();
    this.addChild(this.listContainer);

    const headerStyle = new TextStyle({ fill: CONFIG.COLORS.TEXT_SUBTLE, fontSize: 18, fontWeight: 'bold' });
    const header = new Text({ text: 'FINAL STANDINGS', style: headerStyle });
    header.anchor.set(0.5);
    this.listContainer.addChild(header);

    finishedRacers.forEach((racer, index) => {
      const itemStyle = new TextStyle({
        fill: index === 0 ? CONFIG.COLORS.TEXT_HIGHLIGHT : CONFIG.COLORS.TEXT_NORMAL,
        fontSize: 20,
        fontWeight: index === 0 ? 'bold' : 'normal'
      });
      const timeSecs = (racer.finishTime / 60).toFixed(2);
      const text = new Text({ 
        text: `${index + 1}. ${racer.racerName} - ${timeSecs}s`, 
        style: itemStyle 
      });
      text.anchor.set(0.5);
      text.y = 40 + (index * 30);
      this.listContainer.addChild(text);
    });

    this.restartBtn = this.createRestartButton();
    this.addChild(this.restartBtn);
  }

  private createRestartButton() {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(-100, -25, 200, 50, 10);
    bg.fill(CONFIG.COLORS.BUTTON_PRIMARY);
    btn.addChild(bg);

    const style = new TextStyle({ fill: CONFIG.COLORS.BUTTON_TEXT, fontSize: 22, fontWeight: 'bold' });
    const text = new Text({ text: 'BACK TO MENU', style });
    text.anchor.set(0.5);
    btn.addChild(text);

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => this.onRestart());
    return btn;
  }

  public resize(width: number, height: number) {
    const centerX = width / 2;
    const isSmall = width < 600 || height < 500;

    this.bg.clear().rect(0, 0, width, height).fill(CONFIG.COLORS.BACKGROUND);

    // Dynamic Font Scaling
    const winnerFontSize = isSmall ? 32 : 48;
    this.winnerText.style.fontSize = winnerFontSize;
    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.15;

    // Scale list container if it's too tall
    const listScale = isSmall ? 0.8 : 1.0;
    this.listContainer.scale.set(listScale);
    this.listContainer.x = centerX;
    this.listContainer.y = height * 0.3;

    this.restartBtn.x = centerX;
    this.restartBtn.y = height * 0.85;
    
    // Scale button for very small screens
    if (height < 400) {
      this.restartBtn.scale.set(0.7);
      this.restartBtn.y = height * 0.9;
    } else {
      this.restartBtn.scale.set(1.0);
    }
  }

  update(_delta: number) {}
}
