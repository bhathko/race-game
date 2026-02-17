import {
  Container,
  Graphics,
  Text,
  TextStyle,
  AnimatedSprite,
  Sprite,
} from "pixi.js";
import { PALETTE, ITEMS } from "../config";
import type { RacerAnimations } from "../core/types";

/**
 * Farming-simulation leaderboard sidebar.
 *
 * Redesigned with a wooden podium for the top 3 racers and
 * a standard list for the remaining participants.
 */

export interface RankEntry {
  rank: number; // 1-based
  name: string; // e.g. "Farmer 2"
  time?: string; // optional time string
  character?: string; // character key (e.g. "bear", "cat")
}

// ── colour palette ────────────────────────────────────────────────────────────
const COL = {
  // wood background
  OAK_DARK: PALETTE.WOOD_MID,
  OAK_MID: PALETTE.WOOD_PALE,
  OAK_LIGHT: PALETTE.WOOD_EXTRA_PALE,
  OAK_PLANK_LINE: PALETTE.WOOD_DARK,
  OAK_OVERLAY: PALETTE.BLACK,

  // rank colours
  GOLD: PALETTE.GOLD,
  GOLD_GLOW: 0xfff176,
  GOLD_DARK: 0xc6a700,
  SILVER: PALETTE.SILVER,
  SILVER_LIGHT: 0xe0e0e0,
  SILVER_DARK: 0x8a8a8a,
  BRONZE: PALETTE.BRONZE,
  BRONZE_DARK: 0x8d6e63,

  // card body
  CARD_BG: PALETTE.WOOD_LIGHT,
  CARD_BG_ALPHA: 0.72,

  // accents
  GRASS_LIGHT: PALETTE.GRASS_LIGHT,
  GRASS_MID: PALETTE.GRASS_MID,
  GRASS_DARK: PALETTE.GRASS_DARK,
  DAISY_PETAL: PALETTE.WHITE,
  DAISY_CENTER: PALETTE.WARNING,
  VINE_GREEN: 0x558b2f,
  VINE_LEAF: 0x7cb342,

  // text
  TEXT_WHITE: PALETTE.STR_WHITE,
  TEXT_SHADOW: PALETTE.STR_WOOD_MID,
};

// ── helpers ───────────────────────────────────────────────────────────────────

function ordinalSuffix(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

// ── component ─────────────────────────────────────────────────────────────────

export class LeaderboardSidebar extends Container {
  private bg: Graphics;
  private podiumContainer: Container;
  private listContainer: Container;
  private titleContainer: Container;
  private titleText: Text;
  private trophySprite: Sprite;
  private entries: RankEntry[];
  private sidebarW: number;
  private sidebarH: number;
  private elapsed = 0; // animation timer (frames)
  private daisies: { g: Graphics; baseY: number }[] = [];
  private glowGraphics: Graphics[] = [];
  private animations: Map<string, RacerAnimations> | null = null;

  constructor(
    entries: RankEntry[],
    width = 280,
    height = 520,
    animations: Map<string, RacerAnimations> | null = null,
  ) {
    super();
    this.entries = entries;
    this.sidebarW = width;
    this.sidebarH = height;
    this.animations = animations;

    // ── background ──────────────────────────────────────────────────────────
    this.bg = new Graphics();
    this.addChild(this.bg);

    // ── title ───────────────────────────────────────────────────────────────
    this.titleContainer = new Container();
    this.addChild(this.titleContainer);

    this.trophySprite = Sprite.from(ITEMS.trophy.path);
    this.trophySprite.anchor.set(0.5);
    this.trophySprite.scale.set(1.5);
    this.titleContainer.addChild(this.trophySprite);

    const titleStyle = new TextStyle({
      fill: COL.TEXT_WHITE,
      fontSize: 28,
      fontFamily: '"Fredoka One", "Comic Sans MS", "Segoe UI", sans-serif',
      fontWeight: "900",
      letterSpacing: 2,
      stroke: { color: COL.TEXT_SHADOW, width: 5 },
      dropShadow: {
        alpha: 0.45,
        angle: Math.PI / 4,
        blur: 4,
        color: PALETTE.STR_BLACK,
        distance: 4,
      },
    });
    this.titleText = new Text({ text: "Ranking", style: titleStyle });
    this.titleText.anchor.set(0, 0.5);
    this.titleContainer.addChild(this.titleText);

    // ── podium ──────────────────────────────────────────────────────────────
    this.podiumContainer = new Container();
    this.addChild(this.podiumContainer);

    // ── list ────────────────────────────────────────────────────────────────
    this.listContainer = new Container();
    this.addChild(this.listContainer);

    // Build everything
    this.refresh();
  }

  private refresh() {
    this.bg.clear();
    this.podiumContainer.removeChildren();
    this.listContainer.removeChildren();
    this.daisies = [];
    this.glowGraphics = [];

    this.drawBackground();
    this.buildPodium();
    this.buildList();
    this.layout();
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  BACKGROUND
  // ════════════════════════════════════════════════════════════════════════════

  private drawBackground() {
    const g = this.bg;
    const w = this.sidebarW;
    const h = this.sidebarH;
    const r = 18;

    g.clear();
    g.roundRect(4, 6, w, h, r).fill({ color: PALETTE.BLACK, alpha: 0.35 });
    g.roundRect(0, 0, w, h, r).fill({ color: COL.OAK_DARK, alpha: 0.92 });

    const plankHeights = [0, 65, 138, 215, 298, 380, 446];
    for (const py of plankHeights) {
      if (py > 0 && py < h - 10) {
        g.roundRect(10, py, w - 20, 2, 1).fill({
          color: COL.OAK_PLANK_LINE,
          alpha: 0.55,
        });
      }
    }

    g.roundRect(0, 0, w, h, r).stroke({ color: COL.OAK_MID, width: 3.5 });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PODIUM (Top 3)
  // ════════════════════════════════════════════════════════════════════════════

  private buildPodium() {
    const top3 = this.entries.slice(0, 3);
    if (top3.length === 0) return;

    const podiumWidth = this.sidebarW - 40;
    const columnW = podiumWidth / 3;
    const baseY = 160;

    // Pedestal heights
    const heights = { 1: 90, 2: 70, 3: 50 };
    const order = [2, 1, 3]; // Layout order: 2nd, 1st, 3rd

    order.forEach((rankIdx, i) => {
      const entry = top3.find((e) => e.rank === rankIdx);
      if (!entry) return;

      const column = new Container();
      column.x = i * columnW + columnW / 2;
      column.y = baseY;
      this.podiumContainer.addChild(column);

      const h = heights[rankIdx as keyof typeof heights];
      const pedestal = new Graphics();

      let borderColor =
        rankIdx === 1 ? COL.GOLD : rankIdx === 2 ? COL.SILVER : COL.BRONZE;
      let bodyColor =
        rankIdx === 1
          ? PALETTE.WOOD_LIGHT
          : rankIdx === 2
            ? PALETTE.WOOD_MID
            : PALETTE.WOOD_DARK;

      const px = -columnW / 2 + 6;
      const pw = columnW - 12;

      // 1. Draw Pedestal Shadow (Behind)
      pedestal
        .roundRect(px + 4, -h + 4, pw, h, 6)
        .fill({ color: PALETTE.BLACK, alpha: 0.25 });

      // 2. Main Body (Wooden Planks)
      pedestal.roundRect(px, -h, pw, h, 6).fill(bodyColor);

      // Plank lines (Vertical)
      const plankCount = 3;
      const plankW = pw / plankCount;
      for (let p = 1; p < plankCount; p++) {
        pedestal
          .rect(px + p * plankW - 0.5, -h + 2, 1, h - 4)
          .fill({ color: COL.OAK_PLANK_LINE, alpha: 0.3 });
      }

      // 3. Highlight & Depth
      // Left highlight
      pedestal
        .rect(px + 1, -h + 2, 2, h - 4)
        .fill({ color: PALETTE.WHITE, alpha: 0.15 });
      // Right shadow
      pedestal
        .rect(px + pw - 3, -h + 2, 2, h - 4)
        .fill({ color: PALETTE.BLACK, alpha: 0.15 });

      // 4. Substantial Top "Floor" (The Rank Block)
      const capH = 14;
      const capY = -h - 6;
      const capX = px - 4;
      const capW = pw + 8;

      // Bottom shadow of the cap
      pedestal
        .roundRect(capX + 2, capY + 4, capW, capH, 4)
        .fill({ color: PALETTE.BLACK, alpha: 0.3 });

      // Main metallic block
      pedestal
        .roundRect(capX, capY, capW, capH, 4)
        .fill(borderColor)
        .stroke({
          color: rankIdx === 1 ? COL.GOLD_DARK : PALETTE.BLACK,
          width: 1.5,
          alpha: 0.5,
        });

      // Top shine on the metallic block
      pedestal
        .roundRect(capX + 2, capY + 1, capW - 4, 4, 2)
        .fill({ color: PALETTE.WHITE, alpha: 0.4 });

      // 5. Wood Grain (Subtle horizontal scratches)
      for (let s = 0; s < 8; s++) {
        const sx = px + Math.random() * (pw - 12);
        const sy = -h + Math.random() * (h - 5);
        const sw = 4 + Math.random() * 12;
        pedestal
          .rect(sx, sy, sw, 1)
          .fill({ color: PALETTE.BLACK, alpha: 0.08 });
      }

      column.addChild(pedestal);

      // Rank Number on pedestal (Painted white look)
      const rankText = new Text({
        text: rankIdx.toString(),
        style: new TextStyle({
          fill: COL.TEXT_WHITE,
          fontSize: rankIdx === 1 ? 36 : 28,
          fontWeight: "900",
        }),
      });
      rankText.alpha = 0.5;
      rankText.anchor.set(0.5);
      rankText.y = -h / 2;
      column.addChild(rankText);

      // Character Icon - Adjusted to stand ON the new cap
      const icon = this.createIcon(entry.character);
      icon.scale.set(1.2);
      // Character is 80x80 base, scaled to 96. Half height is 48.
      // Top of cap is at capY. So icon center should be capY - 48.
      icon.y = capY - 44; // slight overlap looks better
      column.addChild(icon);

      // Name Text
      const nameStyle = new TextStyle({
        fill: COL.TEXT_WHITE,
        fontSize: 14,
        fontWeight: "900",
        stroke: { color: COL.TEXT_SHADOW, width: 3 },
        align: "center",
      });
      const name = new Text({
        text: entry.name.split(" ")[1] || entry.name,
        style: nameStyle,
      });
      name.anchor.set(0.5, 0);
      name.y = capY - 84;
      column.addChild(name);

      if (rankIdx === 1) {
        // Glow for 1st
        const glow = new Graphics();
        glow
          .circle(0, capY - 44, 45)
          .fill({ color: COL.GOLD_GLOW, alpha: 0.12 });
        column.addChildAt(glow, 0);
        this.glowGraphics.push(glow);
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  LIST (4th+)
  // ════════════════════════════════════════════════════════════════════════════

  private buildList() {
    const rest = this.entries.slice(3);
    const cardW = this.sidebarW - 36;
    const cardH = 36;
    const gap = 6;
    const startY = 0;

    rest.forEach((entry, idx) => {
      const card = new Container();
      card.y = startY + idx * (cardH + gap);
      this.listContainer.addChild(card);

      const body = new Graphics();
      body
        .roundRect(0, 0, cardW, cardH, 6)
        .fill({ color: COL.CARD_BG, alpha: 0.6 })
        .stroke({ color: COL.OAK_LIGHT, width: 1 });
      card.addChild(body);

      const icon = this.createIcon(entry.character);
      icon.scale.set(0.6);
      icon.x = 20;
      icon.y = cardH / 2;
      card.addChild(icon);

      const label = `${entry.rank}${ordinalSuffix(entry.rank)}: ${entry.name}`;
      const text = new Text({
        text: label,
        style: new TextStyle({
          fill: COL.TEXT_WHITE,
          fontSize: 14,
          fontWeight: "700",
          stroke: { color: COL.TEXT_SHADOW, width: 2 },
        }),
      });
      text.anchor.set(0, 0.5);
      text.x = 45;
      text.y = cardH / 2;
      card.addChild(text);
    });
  }

  private createIcon(characterKey?: string): Container {
    if (this.animations && characterKey && this.animations.has(characterKey)) {
      const anims = this.animations.get(characterKey)!;
      const sprite = new AnimatedSprite(anims.idle);
      sprite.anchor.set(0.5);
      sprite.scale.set(1);
      sprite.animationSpeed = 0.1;
      sprite.play(); // Play idle animation
      return sprite;
    }
    const g = new Graphics();
    g.circle(0, 0, 8).fill(PALETTE.WHITE);
    return g;
  }

  private layout() {
    const trophyW = this.trophySprite.width * this.trophySprite.scale.x;
    const gap = 10;
    const totalW = trophyW + gap + this.titleText.width;
    const startX = (this.sidebarW - totalW) / 2;

    this.trophySprite.x = startX + trophyW / 2;
    this.trophySprite.y = 0;

    this.titleText.x = startX + trophyW + gap;
    this.titleText.y = 0;

    this.titleContainer.x = 0;
    this.titleContainer.y = 35;

    this.podiumContainer.x = 20;
    this.podiumContainer.y = 70;

    this.listContainer.x = 18;
    this.listContainer.y = 250;
  }

  update(delta: number) {
    this.elapsed += delta;
    for (const d of this.daisies) {
      d.g.y = d.baseY + Math.sin(this.elapsed * 0.04 + d.baseY) * 1.2;
    }
    const glowAlpha = 0.12 + Math.sin(this.elapsed * 0.06) * 0.06;
    for (const g of this.glowGraphics) {
      g.alpha = glowAlpha / 0.15;
    }
  }

  public resize(width: number, height: number) {
    this.sidebarW = width;
    this.sidebarH = height;
    this.refresh();
  }

  public setEntries(entries: RankEntry[]) {
    this.entries = entries;
    this.refresh();
  }
}
