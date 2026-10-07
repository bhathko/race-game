import { Container, Graphics, Text, AnimatedSprite } from "pixi.js";
import { Racer } from "../../entities";
import { COLORS, UI } from "../../config";
import { textStyle, setFontSize } from "../../ui";

/** Countdown runs through the four face-button colors: 3 red, 2 pink, 1 green, GO! blue. */
const COUNTDOWN_COLORS: Record<string, number> = {
  "3": UI.RED,
  "2": UI.PINK,
  "1": UI.GREEN,
  "GO!": UI.BLUE,
};
import type { RacerAnimations } from "../../core";

export interface LeaderboardLayoutConfig {
  direction: "vertical" | "horizontal";
  itemWidth: number;
  itemHeight: number;
  gap: number;
  availableSpace: number;
  /** Offset of the first card (e.g. to clear a title above the list). */
  startY?: number;
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
  private hasSnapped: boolean = false;

  public leaderboardUpdateTimer: number = 0;
  public readonly LEADERBOARD_THROTTLE: number = 20;
  public sortedRacersCache: Racer[] = [];

  constructor(ui: Container) {
    this.ui = ui;
    this.sidebarBg = new Graphics();
    this.ui.addChild(this.sidebarBg);
    this.leaderboardContainer = new Container();
    this.ui.addChild(this.leaderboardContainer);

    const title = new Text({ text: "Ranking", style: textStyle("heading", 24) });
    title.label = "leaderboard-title";
    this.leaderboardContainer.addChild(title);
  }

  public initCountdown() {
    this.countdownText = new Text({ text: "", style: textStyle("overlay", 130) });
    this.countdownText.anchor.set(0.5);
    this.countdownText.visible = false;
    this.ui.addChild(this.countdownText);
  }

  public initDistance() {
    this.remainingDistanceText = new Text({ text: "", style: textStyle("overlay", 48) });
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
      const text = new Text({ text: racer.racerName, style: textStyle("body", 16) });
      text.label = "item-text";
      container.addChild(text);
      this.leaderboardContainer.addChild(container);
      this.leaderboardItems.set(racer, container);
    });
  }

  public updateCountdown(seconds: number, visible: boolean, textOverride?: string) {
    if (!this.countdownText) return;
    this.countdownText.visible = visible;
    const label = textOverride || Math.ceil(seconds).toString();
    if (this.countdownText.text !== label) {
      this.countdownText.text = label;
      this.countdownText.style.fill = COUNTDOWN_COLORS[label] ?? UI.WHITE;
    }
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

  /**
   * @param orderedRacers Racers in display order (standings during the race, lanes before it).
   *   Re-read only every LEADERBOARD_THROTTLE frames so cards don't jitter on every overtake.
   */
  public updateLeaderboard(orderedRacers: Racer[], config: LeaderboardLayoutConfig, delta: number) {
    if (this.leaderboardUpdateTimer > 0 && this.sortedRacersCache.length === orderedRacers.length) {
      this.leaderboardUpdateTimer -= delta;
    } else {
      this.sortedRacersCache = orderedRacers;
      this.leaderboardUpdateTimer = this.LEADERBOARD_THROTTLE;
    }

    const isVertical = config.direction === "vertical";
    const startY = config.startY ?? 0;
    const totalRacers = this.sortedRacersCache.length;
    if (totalRacers === 0) return;
    const gap = config.gap;

    let cardW: number, cardH: number;
    let cols: number, rows: number;

    if (isVertical) {
      cardW = config.itemWidth;
      cardH = config.itemHeight;
      const totalNeeded = totalRacers * (cardH + gap) - gap;
      if (totalNeeded > config.availableSpace) {
        rows = Math.max(1, Math.floor((config.availableSpace + gap) / (cardH + gap)));
        cols = Math.ceil(totalRacers / rows);
        cardW = Math.floor((config.itemWidth - gap * (cols - 1)) / cols);
      } else {
        cols = 1;
        rows = totalRacers;
      }
    } else {
      cardW = config.itemWidth;
      cardH = config.itemHeight;

      cols = Math.max(1, Math.floor((config.availableSpace + gap) / (cardW + gap)));

      if (cols >= totalRacers) {
        cols = totalRacers;
        rows = 1;
        cardW = Math.floor((config.availableSpace - gap * Math.max(0, cols - 1)) / cols);
      } else {
        rows = Math.ceil(totalRacers / cols);
        cardW = Math.floor((config.availableSpace - gap * Math.max(0, cols - 1)) / cols);
        cardH = Math.floor((config.itemHeight - gap * (rows - 1)) / rows);
        cardH = Math.max(36, cardH);
      }
    }

    const smallerDim = Math.min(cardW, cardH);
    const effectiveIconScale = Math.min(config.iconScale, (smallerDim - 8) / 32);

    // On the first layout, snap positions instantly (no lerp)
    const snap = !this.hasSnapped;
    if (snap) this.hasSnapped = true;
    const lerpSpeed = snap ? 1.0 : 1 - Math.pow(1 - 0.2, delta);

    this.sortedRacersCache.forEach((racer, index) => {
      const itemConfig = this.leaderboardItems.get(racer);
      if (!itemConfig) return;

      itemConfig.visible = true;

      let targetX: number, targetY: number;

      if (isVertical) {
        const col = Math.floor(index / rows);
        const row = index % rows;
        targetX = col * (cardW + gap);
        targetY = startY + row * (cardH + gap);
      } else {
        const col = index % cols;
        const row = Math.floor(index / cols);
        targetX = col * (cardW + gap);
        targetY = startY + row * (cardH + gap);
      }

      if (snap) {
        itemConfig.x = targetX;
        itemConfig.y = targetY;
      } else {
        itemConfig.x += (targetX - itemConfig.x) * lerpSpeed;
        itemConfig.y += (targetY - itemConfig.y) * lerpSpeed;
      }

      const bg = itemConfig.children.find((c) => c.label === "item-bg") as Graphics | undefined;
      if (bg) {
        // Dark cards; the leader gets the green selection frame, 2nd/3rd a silver/bronze edge
        const w = cardW - 2;
        const h = cardH - 2;
        const r = Math.min(12, h * 0.3);
        bg.clear()
          .roundRect(0, 1.5, w, h, r)
          .fill({ color: UI.SHADOW, alpha: 0.06 })
          .roundRect(0, 0, w, h, r)
          .fill({ color: index === 0 ? UI.FRAME_TINT : UI.SURFACE });
        if (index === 0) bg.roundRect(0, 0, w, h, r).stroke({ color: UI.FRAME, width: 3 });
        else if (index >= 3) bg.roundRect(0, 0, w, h, r).stroke({ color: UI.LINE, width: 1.5 });
        else if (index < 3) {
          bg.roundRect(0, 0, w, h, r).stroke({
            color: index === 1 ? COLORS.RANK_SILVER : COLORS.RANK_BRONZE,
            width: 2,
          });
        }
      }

      const icon = itemConfig.children.find((c) => c.label === "item-icon") as
        | AnimatedSprite
        | undefined;
      if (icon) {
        icon.scale.set(effectiveIconScale);
        if (isVertical) {
          icon.x = cardH / 2 - 2;
          icon.y = cardH / 2 - 2;
        } else {
          icon.x = cardW / 2;
          icon.y = cardH * 0.4;
        }
      }

      const text = itemConfig.children.find((c) => c.label === "item-text") as Text | undefined;
      if (text) {
        text.text = config.textFormat(racer, index);
        if (isVertical) {
          text.x = config.textX;
          text.y = cardH / 2;
          text.anchor.set(config.textAnchorX, 0.5);
        } else {
          text.x = cardW / 2;
          text.y = cardH * 0.82;
          text.anchor.set(0.5, 0.5);
        }
        const size = Math.min(
          config.fontSize,
          isVertical ? cardH * 0.35 : Math.max(9, cardW * 0.2),
        );
        if (text.style.fontSize !== size) setFontSize(text, size);
      }
    });
  }
}
