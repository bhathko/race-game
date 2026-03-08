import { Container, Graphics, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { Racer } from "../../entities";
import { PALETTE, COLORS } from "../../config";
import type { RacerAnimations } from "../../core";

export interface LeaderboardLayoutConfig {
  direction: "vertical" | "horizontal";
  itemWidth: number;
  itemHeight: number;
  textFormat: (racer: Racer, index: number) => string;
  iconScale: number;
  textX: number;
  textAnchorX: number;
  fontSize: number;
}

export class RaceUIManager {
  private ui: Container;
  private countdownText: Text | null = null;
  private remainingDistanceText: Text | null = null;
  private leaderboardContainer: Container;
  private sidebarBg: Graphics;
  private leaderboardItems: Map<Racer, Container> = new Map();

  public leaderboardUpdateTimer: number = 0;
  public readonly LEADERBOARD_THROTTLE: number = 30;
  public sortedRacersCache: Racer[] = [];

  constructor(ui: Container) {
    this.ui = ui;
    this.sidebarBg = new Graphics();
    this.ui.addChild(this.sidebarBg);
    this.leaderboardContainer = new Container();
    this.ui.addChild(this.leaderboardContainer);

    const titleStyle = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 24,
      fontWeight: "900",
      stroke: { color: PALETTE.STR_BLACK, width: 4 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 2,
        blur: 0,
        color: PALETTE.STR_BLACK,
        distance: 4,
      },
    });
    const title = new Text({ text: "RANKING", style: titleStyle });
    title.label = "leaderboard-title";
    this.leaderboardContainer.addChild(title);
  }

  public initCountdown() {
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 120,
      fontWeight: "900",
      stroke: { color: COLORS.TEXT_MARKER, width: 12 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 6,
        blur: 0,
        color: PALETTE.STR_BLACK,
        distance: 8,
      },
    });
    this.countdownText = new Text({ text: "", style });
    this.countdownText.anchor.set(0.5);
    this.countdownText.visible = false;
    this.ui.addChild(this.countdownText);
  }

  public initDistance() {
    const style = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 80,
      fontWeight: "900",
      stroke: { color: COLORS.TEXT_MARKER, width: 8 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        color: PALETTE.STR_BLACK,
        distance: 6,
      },
    });
    this.remainingDistanceText = new Text({ text: "", style });
    this.remainingDistanceText.anchor.set(0.5, 0);
    this.ui.addChild(this.remainingDistanceText);
  }

  public initLeaderboard(
    racers: Racer[],
    racerCharacters: Map<Racer, string>,
    animations: Map<string, RacerAnimations>,
  ) {
    racers.forEach((racer) => {
      const container = new Container();
      const bg = new Graphics();
      bg.label = "item-bg";
      container.addChild(bg);
      const charKey = racerCharacters.get(racer) || "bear";
      const anims = animations.get(charKey)!;
      const icon = new AnimatedSprite(anims.idle);
      icon.label = "item-icon";
      icon.anchor.set(0.5);
      icon.animationSpeed = 0.1;
      icon.play();
      container.addChild(icon);
      const text = new Text({
        text: racer.racerName,
        style: new TextStyle({
          fill: PALETTE.STR_WHITE,
          fontSize: 16,
          fontWeight: "900",
          stroke: { color: PALETTE.STR_BLACK, width: 3 },
        }),
      });
      text.label = "item-text";
      container.addChild(text);
      this.leaderboardContainer.addChild(container);
      this.leaderboardItems.set(racer, container);
    });
  }

  public updateCountdown(seconds: number, visible: boolean, textOverride?: string) {
    if (!this.countdownText) return;
    this.countdownText.visible = visible;
    this.countdownText.text = textOverride || Math.ceil(seconds).toString();
  }

  public updateDistance(distanceM: number, visible: boolean) {
    if (!this.remainingDistanceText) return;
    this.remainingDistanceText.visible = visible;
    this.remainingDistanceText.text = `${distanceM}m`;
  }

  public getLeaderboardContainer() {
    return this.leaderboardContainer;
  }
  public getSidebarBg() {
    return this.sidebarBg;
  }
  public getLeaderboardItems() {
    return this.leaderboardItems;
  }
  public getCountdownText() {
    return this.countdownText;
  }
  public getRemainingDistanceText() {
    return this.remainingDistanceText;
  }
  public updateLeaderboard(racers: Racer[], config: LeaderboardLayoutConfig, delta: number) {
    if (this.leaderboardUpdateTimer > 0) {
      this.leaderboardUpdateTimer -= delta;
    } else {
      this.sortedRacersCache = [...racers].sort((a, b) => b.x - a.x);
      this.leaderboardUpdateTimer = this.LEADERBOARD_THROTTLE;
    }

    this.sortedRacersCache.forEach((racer, index) => {
      const itemConfig = this.leaderboardItems.get(racer);
      if (!itemConfig) return;

      const targetX = config.direction === "vertical" ? 0 : index * config.itemWidth;
      const targetY = config.direction === "vertical" ? index * config.itemHeight : 0;

      itemConfig.x += (targetX - itemConfig.x) * 0.1;
      itemConfig.y += (targetY - itemConfig.y) * 0.1;

      const bg = itemConfig.children.find((c) => c.label === "item-bg") as Graphics | undefined;
      if (bg) {
        let color: number = COLORS.RANK_DEFAULT;
        if (index === 0) color = COLORS.RANK_GOLD;
        else if (index === 1) color = COLORS.RANK_SILVER;
        else if (index === 2) color = COLORS.RANK_BRONZE;
        bg.clear()
          .roundRect(0, 0, config.itemWidth - 10, config.itemHeight - 10, 8)
          .fill({ color: PALETTE.BLACK, alpha: 0.5 })
          .stroke({ color, width: index < 3 ? 3 : 1 });
      }

      const icon = itemConfig.children.find((c) => c.label === "item-icon") as
        | AnimatedSprite
        | undefined;
      if (icon) {
        icon.scale.set(config.iconScale);
        icon.x = config.itemHeight / 2 - 5;
        icon.y = config.itemHeight / 2 - 5;
      }

      const text = itemConfig.children.find((c) => c.label === "item-text") as Text | undefined;
      if (text) {
        text.text = config.textFormat(racer, index);
        text.x = config.textX;
        text.y = config.itemHeight / 2;
        text.anchor.set(config.textAnchorX, 0.5);
        if (text.style instanceof TextStyle) {
          text.style.fontSize = config.fontSize;
        }
      }
    });
  }
}
