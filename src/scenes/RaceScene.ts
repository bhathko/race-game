import { Container, Graphics, Text, TextStyle, AnimatedSprite, Texture } from "pixi.js";
import { Racer } from "../entities/Racer";
import type { RacerAnimations } from "../entities/Racer";
import { CONFIG } from "../config";

export class RaceScene extends Container {
  private world: Container;
  private worldMask: Graphics;
  private ui: Container;
  private racers: Racer[] = [];
  private finishedRacers: Racer[] = [];
  private trackGraphics: Graphics;
  private leaderboardContainer: Container;
  private sidebarBg: Graphics;
  private leaderboardItems: Map<Racer, Text> = new Map();
  private elapsedTime: number = 0;
  private raceEnded: boolean = false;
  private trackWidth: number = 0;
  private finishLineX: number = 0;
  private onFinished: (results: Racer[]) => void;
  private distance: number;
  private bearAnimations: RacerAnimations;
  private treeAnimation: Texture[];

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
    onFinished: (results: Racer[]) => void
  ) {
    super();
    this.onFinished = onFinished;
    this.distance = distance;
    this.bearAnimations = bearAnimations;
    this.treeAnimation = treeAnimation;

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
      fill: CONFIG.COLORS.TEXT_TITLE,
      fontSize: 20,
      fontWeight: "bold",
    });
    const title = new Text({ text: "STANDINGS", style: titleStyle });
    this.leaderboardContainer.addChild(title);

    this.trackGraphics = new Graphics();
    this.world.addChild(this.trackGraphics);

    this.createRacers(playerNames);
    this.initLeaderboardUI();

    this.initCountdownUI();
  }

  private initCountdownUI() {
    const style = new TextStyle({
      fill: CONFIG.COLORS.TEXT_TITLE,
      fontSize: 120,
      fontWeight: "bold",
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 6,
        blur: 4,
        color: "#000000",
        distance: 6,
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

    if (this.isPortrait) {
      this.gameViewW = width;
      this.gameViewH = height * 0.7;
    } else {
      this.gameViewW = width - CONFIG.UI_WIDTH;
      this.gameViewH = height;
    }

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill(CONFIG.COLORS.MASK_FILL);

    this.sidebarBg.clear();
    if (this.isPortrait) {
      this.sidebarBg
        .rect(0, this.gameViewH, width, height - this.gameViewH)
        .fill(CONFIG.COLORS.SIDEBAR_BG)
        .stroke({ width: 2, color: CONFIG.COLORS.SIDEBAR_STROKE });
      this.leaderboardContainer.x = 20;
      this.leaderboardContainer.y = this.gameViewH + 10;
    } else {
      this.sidebarBg
        .rect(this.gameViewW, 0, CONFIG.UI_WIDTH, height)
        .fill(CONFIG.COLORS.SIDEBAR_BG)
        .stroke({ width: 2, color: CONFIG.COLORS.SIDEBAR_STROKE });
      this.leaderboardContainer.x = this.gameViewW + 20;
      this.leaderboardContainer.y = 20;
    }

    const unitWidth = Math.max(this.gameViewW, CONFIG.MIN_UNIT_WIDTH);
    const racePixels = (this.distance / 50) * unitWidth;
    
    this.finishLineX = CONFIG.START_LINE_X + racePixels;
    this.trackWidth = this.finishLineX + 200;

    this.setupTracks();
    this.repositionRacers();

    if (this.countdownText) {
      this.countdownText.x = this.gameViewW / 2;
      this.countdownText.y = this.gameViewH / 2;
    }
  }

  private initLeaderboardUI() {
    this.racers.forEach((racer) => {
      const style = new TextStyle({ fill: CONFIG.COLORS.TEXT_MUTED, fontSize: 14 });
      const text = new Text({ text: racer.racerName, style });
      this.leaderboardContainer.addChild(text);
      this.leaderboardItems.set(racer, text);
    });
  }

  private setupTracks() {
    const count = this.racers.length;
    const trackHeight = this.gameViewH / count;
    this.trackGraphics.clear();

    for (let i = 0; i <= count; i++) {
      const y = i * trackHeight;
      this.trackGraphics
        .moveTo(0, y)
        .lineTo(this.trackWidth, y)
        .stroke({ width: 2, color: CONFIG.COLORS.TRACK_LINES });
    }

    this.trackGraphics
      .moveTo(CONFIG.START_LINE_X, 0)
      .lineTo(CONFIG.START_LINE_X, this.gameViewH)
      .stroke({ width: 5, color: CONFIG.COLORS.START_LINE });
    
    this.trackGraphics
      .moveTo(this.finishLineX, 0)
      .lineTo(this.finishLineX, this.gameViewH)
      .stroke({ width: 8, color: CONFIG.COLORS.FINISH_LINE });

    // Clean old markers and trees
    this.world.children
      .filter((c) => (c instanceof Text && c.text.includes("m")) || (c instanceof AnimatedSprite && c.name === 'distance-tree'))
      .forEach((c) => this.world.removeChild(c));

    const unitWidth = Math.max(this.gameViewW, CONFIG.MIN_UNIT_WIDTH);
    for (let m = 10; m <= this.distance; m += 10) {
      const x = CONFIG.START_LINE_X + (m / 50) * unitWidth;
      
      const tree = new AnimatedSprite(this.treeAnimation);
      tree.name = 'distance-tree';
      tree.anchor.set(0.5, 1);
      tree.width = CONFIG.ITEMS.tree.width;
      tree.height = CONFIG.ITEMS.tree.height;
      tree.x = x;
      tree.y = this.gameViewH - 10;
      tree.animationSpeed = 0.1;
      tree.play();
      this.world.addChild(tree);

      const marker = new Text({
        text: `${m}m`,
        style: { fill: CONFIG.COLORS.TEXT_MARKER, fontSize: 14 },
      });
      marker.anchor.set(0.5, 0);
      marker.x = x;
      marker.y = this.gameViewH - CONFIG.ITEMS.tree.height - 30;
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
    const trackHeight = this.gameViewH / this.racers.length;
    this.racers.forEach((racer, i) => {
      racer.y = i * trackHeight + trackHeight / 2 - CONFIG.RACER_HEIGHT / 2;
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
      const uiItem = this.leaderboardItems.get(racer);
      if (uiItem) {
        let targetY = 30 + index * 20;
        const smoothing =
          1 - Math.pow(1 - CONFIG.LEADERBOARD_ANIMATION_SPEED, delta);
        uiItem.y += (targetY - uiItem.y) * smoothing;
        uiItem.text = `${index + 1}. ${racer.racerName}${
          racer.isFinished() ? " (FIN)" : ""
        }`;
        uiItem.style.fill = racer.isFinished()
          ? CONFIG.COLORS.TEXT_HIGHLIGHT
          : CONFIG.COLORS.TEXT_MUTED;
        uiItem.style.fontSize = this.isPortrait ? 12 : 14;
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
