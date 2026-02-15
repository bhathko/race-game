import { Container, Graphics, Text, TextStyle, AnimatedSprite, Texture, TilingSprite } from "pixi.js";
import { Racer } from "../entities/Racer";
import type { RacerAnimations } from "../entities/Racer";
import { CONFIG } from "../config";
import type { GroundTextures, GrassTextures } from "../core/Game";

export class RaceScene extends Container {
  private world: Container;
  private worldMask: Graphics;
  private ui: Container;
  private racers: Racer[] = [];
  private finishedRacers: Racer[] = [];
  private trackGraphics: Graphics;
  
  private groundContainer: Container;
  private topEdge: TilingSprite;
  private middleGround: TilingSprite;
  private bottomEdge: TilingSprite;

  private grassContainer: Container;
  private topGrassEdge: TilingSprite;
  private topGrassMiddle: TilingSprite;
  private bottomGrassEdge: TilingSprite;
  private bottomGrassMiddle: TilingSprite;

  private leaderboardContainer: Container;
  private sidebarBg: Graphics;
  private leaderboardItems: Map<Racer, Container> = new Map();
  private elapsedTime: number = 0;
  private raceEnded: boolean = false;
  private trackWidth: number = 0;
  private finishLineX: number = 0;
  private onFinished: (results: Racer[]) => void;
  private distance: number;
  private bearAnimations: RacerAnimations;
  private treeAnimation: Texture[];
  private groundTextures: GroundTextures;
  private grassTextures: GrassTextures;

  private gameViewW: number = 0;
  private gameViewH: number = 0;
  private isPortrait: boolean = false;

  private countdownTimer: number = CONFIG.COUNTDOWN_DURATION;
  private countdownText: Text | null = null;
  private raceStarted: boolean = false;

  constructor(
    playerNames: string[],
    distance: number,
    bearAnimations: RacerAnimations,
    treeAnimation: Texture[],
    groundTextures: GroundTextures,
    grassTextures: GrassTextures,
    onFinished: (results: Racer[]) => void
  ) {
    super();
    this.onFinished = onFinished;
    this.distance = distance;
    this.bearAnimations = bearAnimations;
    this.treeAnimation = treeAnimation;
    this.groundTextures = groundTextures;
    this.grassTextures = grassTextures;

    this.worldMask = new Graphics();
    this.addChild(this.worldMask);

    this.world = new Container();
    this.world.mask = this.worldMask;
    this.addChild(this.world);

    this.ui = new Container();
    this.addChild(this.ui);

    this.sidebarBg = new Graphics();
    this.ui.addChild(this.sidebarBg);

    this.leaderboardContainer = new Container();
    this.ui.addChild(this.leaderboardContainer);

    const titleStyle = new TextStyle({
      fill: '#ffffff',
      fontSize: 24,
      fontWeight: '900',
      stroke: { color: '#000000', width: 4 },
      dropShadow: { alpha: 0.5, angle: Math.PI/2, blur: 0, color: '#000000', distance: 4 }
    });
    const title = new Text({ text: "RANKING", style: titleStyle });
    title.name = 'leaderboard-title';
    this.leaderboardContainer.addChild(title);

    // Grass Layers
    this.grassContainer = new Container();
    this.world.addChild(this.grassContainer);

    this.topGrassMiddle = new TilingSprite({ texture: this.grassTextures.middle });
    this.topGrassEdge = new TilingSprite({ texture: this.grassTextures.bottom });
    this.bottomGrassMiddle = new TilingSprite({ texture: this.grassTextures.middle });
    this.bottomGrassEdge = new TilingSprite({ texture: this.grassTextures.top });

    this.grassContainer.addChild(this.topGrassMiddle);
    this.grassContainer.addChild(this.topGrassEdge);
    this.grassContainer.addChild(this.bottomGrassMiddle);
    this.grassContainer.addChild(this.bottomGrassEdge);

    // Ground Layers
    this.groundContainer = new Container();
    this.world.addChild(this.groundContainer);

    this.middleGround = new TilingSprite({
      texture: this.groundTextures.middle,
      width: 0,
      height: 0,
    });
    this.topEdge = new TilingSprite({
      texture: this.groundTextures.top,
      width: 0,
      height: CONFIG.ITEMS.ground.unit,
    });
    this.bottomEdge = new TilingSprite({
      texture: this.groundTextures.bottom,
      width: 0,
      height: CONFIG.ITEMS.ground.unit,
    });

    this.groundContainer.addChild(this.middleGround);
    this.groundContainer.addChild(this.topEdge);
    this.groundContainer.addChild(this.bottomEdge);

    this.trackGraphics = new Graphics();
    this.world.addChild(this.trackGraphics);

    this.createRacers(playerNames);
    this.initLeaderboardUI();

    this.initCountdownUI();
  }

  private initCountdownUI() {
    const style = new TextStyle({
      fill: '#ffeb3b',
      fontSize: 120,
      fontWeight: "900",
      stroke: { color: '#e91e63', width: 12 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 6,
        blur: 0,
        color: "#000000",
        distance: 8,
      },
    });
    this.countdownText = new Text({
      text: Math.ceil(this.countdownTimer).toString(),
      style,
    });
    this.countdownText.anchor.set(0.5);
    this.ui.addChild(this.countdownText);
  }

  public resize(width: number, height: number) {
    this.isPortrait = width < 600;

    const availableH = this.isPortrait ? height * 0.7 : height;
    
    this.gameViewH = availableH;
    const yOffset = 0;

    if (this.isPortrait) {
      this.gameViewW = width;
    } else {
      this.gameViewW = width - CONFIG.UI_WIDTH;
    }

    this.world.y = yOffset;
    this.worldMask
      .clear()
      .rect(0, yOffset, this.gameViewW, this.gameViewH)
      .fill(CONFIG.COLORS.MASK_FILL);

    this.sidebarBg.clear();
    const woodColor = CONFIG.COLORS.SIDEBAR_WOOD;
    const bgColor = CONFIG.COLORS.SIDEBAR_BG;
    
    if (this.isPortrait) {
      this.sidebarBg
        .rect(0, availableH, width, height - availableH).fill(bgColor, 0.95);
      
      // Wooden Texture Lines
      for (let y = availableH + 5; y < height; y += 10) {
        this.sidebarBg.rect(0, y, width, 2).fill(woodColor, 0.3);
      }
      
      this.leaderboardContainer.x = 20;
      this.leaderboardContainer.y = availableH + 15;
    } else {
      this.sidebarBg
        .rect(this.gameViewW, 0, CONFIG.UI_WIDTH, height).fill(bgColor, 0.95);
      
      // Wooden Texture Lines
      for (let x = this.gameViewW + 5; x < width; x += 15) {
        this.sidebarBg.rect(x, 0, 2, height).fill(woodColor, 0.3);
      }
      
      this.leaderboardContainer.x = this.gameViewW + 15;
      this.leaderboardContainer.y = 20;
    }

    const title = this.leaderboardContainer.getChildByName('leaderboard-title');
    if (title) {
      title.x = 0;
      title.y = 0;
    }

    const unitWidth = Math.max(this.gameViewW, CONFIG.MIN_UNIT_WIDTH);
    const racePixels = (this.distance / 50) * unitWidth;
    
    this.finishLineX = CONFIG.START_LINE_X + racePixels;
    this.trackWidth = this.finishLineX + 200;

    this.setupTracks();
    this.repositionRacers();
    this.updateLeaderboard(60); // Snap positions on resize

    if (this.countdownText) {
      this.countdownText.x = this.gameViewW / 2;
      this.countdownText.y = yOffset + this.gameViewH / 2;
    }
  }

  private initLeaderboardUI() {
    this.racers.forEach((racer) => {
      const container = new Container();
      
      const bg = new Graphics();
      bg.name = 'item-bg';
      container.addChild(bg);

      // Animal Icon
      const icon = new AnimatedSprite(this.bearAnimations.idle);
      icon.name = 'item-icon';
      icon.anchor.set(0.5);
      icon.scale.set(0.4);
      icon.x = 25;
      icon.y = 18;
      icon.stop(); // Just show first frame
      container.addChild(icon);

      const style = new TextStyle({
        fill: '#ffffff',
        fontSize: 16,
        fontWeight: '900',
        stroke: { color: '#000000', width: 3 },
      });
      const text = new Text({ text: racer.racerName, style });
      text.name = 'item-text';
      text.x = 50;
      text.y = 18;
      text.anchor.set(0, 0.5);
      container.addChild(text);

      this.leaderboardContainer.addChild(container);
      this.leaderboardItems.set(racer, container);
    });
  }

  private setupTracks() {
    const count = this.racers.length;
    const unit = CONFIG.ITEMS.ground.unit;
    const grassStripH = unit * 4; // 64px grass on top/bottom to accommodate 48px trees
    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / count;

    // Update Grass Tiling Sprites
    this.topGrassMiddle.width = this.trackWidth;
    this.topGrassMiddle.height = grassStripH - unit;
    this.topGrassMiddle.y = 0;

    this.topGrassEdge.width = this.trackWidth;
    this.topGrassEdge.height = unit;
    this.topGrassEdge.y = grassStripH - unit;

    this.bottomGrassEdge.width = this.trackWidth;
    this.bottomGrassEdge.height = unit;
    this.bottomGrassEdge.y = this.gameViewH - grassStripH;

    this.bottomGrassMiddle.width = this.trackWidth;
    this.bottomGrassMiddle.height = grassStripH - unit;
    this.bottomGrassMiddle.y = this.gameViewH - grassStripH + unit;

    // Update ground tiling sprites (Dirt Track)
    this.topEdge.width = this.trackWidth;
    this.topEdge.y = grassStripH;

    this.bottomEdge.width = this.trackWidth;
    this.bottomEdge.y = this.gameViewH - grassStripH - unit;

    this.middleGround.width = this.trackWidth;
    this.middleGround.height = dirtH - unit * 2;
    this.middleGround.y = grassStripH + unit;

    this.trackGraphics.clear();

    const colorLight = 0xfff9c4; // Cream
    const colorDark = 0x3e2723;  // Dark Brown
    const colorRed = 0xff8a65;   // Warm Red

    // Solid Pixel Track Dividers (8x8 blocks)
    const dividerSize = 8;
    const dividerGap = 16;
    const dividerRadius = 2;
    for (let i = 1; i < count; i++) {
      const y = Math.floor(grassStripH + i * trackHeight - dividerSize / 2);
      for (let x = 0; x < this.trackWidth; x += dividerSize + dividerGap) {
        this.trackGraphics
          .roundRect(x, y, dividerSize, dividerSize, dividerRadius)
          .fill({ color: colorDark, alpha: 0.3 });
      }
    }

    // Large Solid Start Line (16x16 blocks) - Only on Dirt
    const startBlockSize = 16;
    const blockRadius = 4;
    for (let y = grassStripH; y <= this.gameViewH - grassStripH - startBlockSize; y += startBlockSize) {
      this.trackGraphics
        .roundRect(CONFIG.START_LINE_X - startBlockSize, y, startBlockSize, startBlockSize, blockRadius)
        .fill(colorLight)
        .roundRect(CONFIG.START_LINE_X, y, startBlockSize, startBlockSize, blockRadius)
        .fill(colorRed);
    }
    
    // Large Solid Finish Line (16x16 checkered blocks) - Only on Dirt
    const finishBlockSize = 16;
    for (let col = 0; col < 2; col++) {
      const x = this.finishLineX + col * finishBlockSize;
      for (let row = 0; row * finishBlockSize <= dirtH - finishBlockSize; row++) {
        const y = grassStripH + row * finishBlockSize;
        const color = (row + col) % 2 === 0 ? colorLight : colorDark;
        this.trackGraphics
          .roundRect(x, y, finishBlockSize, finishBlockSize, blockRadius)
          .fill(color);
      }
    }

    // Clean old markers and trees
    this.world.children
      .filter((c) => 
        (c instanceof Text && (c.text.includes("m") || c.name === 'start-label')) || 
        (c instanceof AnimatedSprite && c.name === 'distance-tree')
      )
      .forEach((c) => this.world.removeChild(c));

    const unitWidth = Math.max(this.gameViewW, CONFIG.MIN_UNIT_WIDTH);
    for (let m = 10; m <= this.distance; m += 10) {
      const x = CONFIG.START_LINE_X + (m / 50) * unitWidth;
      
      // Bottom Tree (On Grass)
      const treeBottom = new AnimatedSprite(this.treeAnimation);
      treeBottom.name = 'distance-tree';
      treeBottom.anchor.set(0.5, 1);
      treeBottom.width = CONFIG.ITEMS.tree.width;
      treeBottom.height = CONFIG.ITEMS.tree.height;
      treeBottom.x = x;
      treeBottom.y = this.gameViewH - (grassStripH - CONFIG.ITEMS.tree.height) / 2; 
      treeBottom.animationSpeed = 0.1;
      treeBottom.play();
      this.world.addChild(treeBottom);

      // Top Tree (On Grass)
      const treeTop = new AnimatedSprite(this.treeAnimation);
      treeTop.name = 'distance-tree';
      treeTop.anchor.set(0.5, 0); 
      treeTop.width = CONFIG.ITEMS.tree.width;
      treeTop.height = CONFIG.ITEMS.tree.height;
      treeTop.x = x;
      treeTop.y = (grassStripH - CONFIG.ITEMS.tree.height) / 2;
      treeTop.animationSpeed = 0.1;
      treeTop.play();
      this.world.addChild(treeTop);

      const marker = new Text({
        text: `${m}m`,
        style: { fill: CONFIG.COLORS.TEXT_MARKER, fontSize: 14 },
      });
      marker.anchor.set(0.5, 0);
      marker.x = x;
      marker.y = this.gameViewH - CONFIG.ITEMS.tree.height - grassStripH - 10;
      this.world.addChild(marker);
    }
  }

  private createRacers(names: string[]) {
    names.forEach((name, i) => {
      const color = CONFIG.COLORS.RACERS[i % CONFIG.COLORS.RACERS.length];
      const stats = {
        accel: CONFIG.ACCEL_BASE + Math.random() * CONFIG.ACCEL_VARIANCE,
        topSpeed: CONFIG.BASE_SPEED + Math.random() * CONFIG.SPEED_VARIANCE,
        endurance:
          CONFIG.ENDURANCE_BASE + Math.random() * CONFIG.ENDURANCE_VARIANCE,
      };
      const racer = new Racer(name, color, 0, stats, this.bearAnimations);
      this.racers.push(racer);
      this.world.addChild(racer);
    });
  }

  private repositionRacers() {
    const unit = CONFIG.ITEMS.ground.unit;
    const grassStripH = unit * 4;
    const dirtH = this.gameViewH - grassStripH * 2;
    const trackHeight = dirtH / this.racers.length;
    
    this.racers.forEach((racer, i) => {
      // Offset by top grass strip height, then center in lane
      racer.y = grassStripH + (i + 0.5) * trackHeight + CONFIG.RACER_HEIGHT / 2;
    });
  }

  update(delta: number) {
    if (this.raceEnded) return;

    if (!this.raceStarted) {
      this.countdownTimer -= delta / 60;
      if (this.countdownTimer <= 0) {
        this.raceStarted = true;
        if (this.countdownText) {
          this.countdownText.text = "GO!";
          setTimeout(() => {
            if (this.countdownText) this.countdownText.visible = false;
          }, 1000);
        }
      } else {
        if (this.countdownText) {
          this.countdownText.text = Math.ceil(this.countdownTimer).toString();
        }
        return;
      }
    }

    this.elapsedTime += delta;
    let allFinished = true;
    let leaderX = 0;
    this.racers.forEach((r) => {
      if (!r.isFinished() && r.x > leaderX) leaderX = r.x;
    });

    this.racers.forEach((racer) => {
      if (!racer.isFinished()) {
        allFinished = false;
        racer.update(delta, this.elapsedTime, leaderX, this.finishLineX);

        if (
          racer.x >=
          this.finishLineX - CONFIG.RACER_WIDTH + CONFIG.RACER_COLLISION_OFFSET
        ) {
          racer.x =
            this.finishLineX - CONFIG.RACER_WIDTH + CONFIG.RACER_COLLISION_OFFSET;
          racer.setFinished(this.elapsedTime);
          this.finishedRacers.push(racer);
        }
      }
    });

    this.updateLeaderboard(delta);

    let activeLeaderX = 0;
    let hasActiveRacers = false;

    this.racers.forEach((r) => {
      if (!r.isFinished()) {
        hasActiveRacers = true;
        if (r.x > activeLeaderX) activeLeaderX = r.x;
      }
    });

    if (!hasActiveRacers) {
      this.racers.forEach((r) => {
        if (r.x > activeLeaderX) activeLeaderX = r.x;
      });
    }

    this.updateCamera(activeLeaderX, delta);
    if (allFinished) this.endRace();
  }

  private updateLeaderboard(delta: number) {
    const sortedRacers = [...this.racers].sort((a, b) => {
      if (a.isFinished() && b.isFinished()) return a.finishTime - b.finishTime;
      if (a.isFinished()) return -1;
      if (b.isFinished()) return 1;
      return b.x - a.x;
    });

    sortedRacers.forEach((racer, index) => {
      const container = this.leaderboardItems.get(racer);
      if (container) {
        let targetY, targetX;
        
        if (this.isPortrait) {
          const count = this.racers.length;
          const totalW = this.gameViewW - 40;
          const w = totalW / count;
          targetX = index * w;
          targetY = 40;
        } else {
          targetX = 0;
          targetY = 40 + index * 42;
        }

        const smoothing = 1 - Math.pow(1 - CONFIG.LEADERBOARD_ANIMATION_SPEED, delta);
        container.x += (targetX - container.x) * smoothing;
        container.y += (targetY - container.y) * smoothing;

        const bg = container.getChildByName('item-bg') as Graphics;
        const text = container.getChildByName('item-text') as Text;

        if (bg) {
          const w = this.isPortrait ? (this.gameViewW - 40) / this.racers.length - 5 : CONFIG.UI_WIDTH - 30;
          const h = 36;
          
          let borderColor = CONFIG.COLORS.RANK_DEFAULT;
          if (index === 0) borderColor = CONFIG.COLORS.RANK_GOLD;
          else if (index === 1) borderColor = CONFIG.COLORS.RANK_SILVER;
          else if (index === 2) borderColor = CONFIG.COLORS.RANK_BRONZE;

          bg.clear();
          // Main card body (semi-transparent dark)
          bg.roundRect(0, 0, w, h, 4).fill(0x000000, 0.5).stroke({ color: borderColor, width: index < 3 ? 3 : 1 });
        }

        if (text) {
          const rank = index + 1;
          const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
          text.text = `${rank}${suffix}: ${racer.racerName.split(' ')[1]}`;
          text.style.fill = '#ffffff';
          text.style.fontWeight = '900';
          if (this.isPortrait) text.style.fontSize = 12;
          else text.style.fontSize = 14;
        }
      }
    });
  }

  private updateCamera(leaderX: number, delta: number) {
    let targetX = leaderX - this.gameViewW / 2;
    const minX = 0;
    const maxX = this.trackWidth - this.gameViewW;
    targetX = Math.max(minX, Math.min(targetX, maxX));
    const smoothing = 1 - Math.pow(1 - CONFIG.CAMERA_SMOOTHING, delta);
    const currentX = -this.world.x;
    const newX = currentX + (targetX - currentX) * smoothing;
    this.world.x = -newX;
  }

  private endRace() {
    this.raceEnded = true;
    setTimeout(() => {
      this.onFinished(this.finishedRacers);
    }, CONFIG.RESULT_DELAY);
  }
}
