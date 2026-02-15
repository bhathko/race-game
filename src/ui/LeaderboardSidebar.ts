import { Container, Graphics, Text, TextStyle } from "pixi.js";

/**
 * Farming-simulation leaderboard sidebar.
 *
 * Hand-drawn vector-art style inspired by Story of Seasons.
 * Dark oak wooden plank background, gold / silver rank cards,
 * cute animal icons (cow / sheep), grass accents & daisy decorations.
 */

export interface RankEntry {
  rank: number; // 1-based
  name: string; // e.g. "Farmer 2"
  time?: string; // optional time string
}

// ── colour palette ────────────────────────────────────────────────────────────
const COL = {
  // wood background
  OAK_DARK: 0x3e2723,
  OAK_MID: 0x5d4037,
  OAK_LIGHT: 0x6d4c41,
  OAK_PLANK_LINE: 0x2e1b11,
  OAK_OVERLAY: 0x000000,

  // rank colours
  GOLD: 0xffd700,
  GOLD_GLOW: 0xfff176,
  GOLD_DARK: 0xc6a700,
  SILVER: 0xc0c0c0,
  SILVER_LIGHT: 0xe0e0e0,
  SILVER_DARK: 0x8a8a8a,

  // card body
  CARD_BG: 0x4e342e,
  CARD_BG_ALPHA: 0.72,

  // animals
  COW_TAN: 0xf5e6ca,
  COW_SPOT: 0x795548,
  COW_NOSE: 0xffccbc,
  SHEEP_BODY: 0xfaf0e6,
  SHEEP_FACE: 0xd7ccc8,
  SHEEP_DARK: 0x5d4037,

  // accents
  GRASS_LIGHT: 0x81c784,
  GRASS_MID: 0x66bb6a,
  GRASS_DARK: 0x388e3c,
  DAISY_PETAL: 0xffffff,
  DAISY_CENTER: 0xffeb3b,
  VINE_GREEN: 0x558b2f,
  VINE_LEAF: 0x7cb342,

  // text
  TEXT_WHITE: "#FFFFFF",
  TEXT_SHADOW: "#3E2723",
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
  private decorations: Container;
  private cardsContainer: Container;
  private titleText: Text;
  private entries: RankEntry[];
  private sidebarW: number;
  private sidebarH: number;
  private elapsed = 0; // animation timer (frames)
  private daisies: { g: Graphics; baseY: number }[] = [];
  private glowGraphics: Graphics[] = [];

  constructor(entries: RankEntry[], width = 280, height = 520) {
    super();
    this.entries = entries;
    this.sidebarW = width;
    this.sidebarH = height;

    // ── background ──────────────────────────────────────────────────────────
    this.bg = new Graphics();
    this.addChild(this.bg);

    // ── decorations layer (grass, daisies) ──────────────────────────────────
    this.decorations = new Container();
    this.addChild(this.decorations);

    // ── title ───────────────────────────────────────────────────────────────
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
        color: "#000000",
        distance: 4,
      },
    });
    this.titleText = new Text({ text: "🏆 Leaderboard", style: titleStyle });
    this.titleText.anchor.set(0.5, 0);
    this.addChild(this.titleText);

    // ── cards ───────────────────────────────────────────────────────────────
    this.cardsContainer = new Container();
    this.addChild(this.cardsContainer);

    // Build everything
    this.drawBackground();
    this.drawGrassAccents();
    this.drawDaisies();
    this.buildCards();
    this.layout();
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  BACKGROUND — dark oak wooden planks
  // ════════════════════════════════════════════════════════════════════════════

  private drawBackground() {
    const g = this.bg;
    const w = this.sidebarW;
    const h = this.sidebarH;
    const r = 18; // corner radius

    g.clear();

    // Outer shadow
    g.roundRect(4, 6, w, h, r).fill({ color: 0x000000, alpha: 0.35 });

    // Main panel
    g.roundRect(0, 0, w, h, r).fill({ color: COL.OAK_DARK, alpha: 0.92 });

    // Horizontal plank lines (simulate wood grain)
    const plankHeights = [0, 65, 138, 215, 298, 380, 446];
    for (const py of plankHeights) {
      if (py > 0 && py < h - 10) {
        g.roundRect(10, py, w - 20, 2, 1).fill({
          color: COL.OAK_PLANK_LINE,
          alpha: 0.55,
        });
      }
    }

    // Subtle vertical grain streaks
    for (let x = 18; x < w - 10; x += 22) {
      const streakH = 40 + Math.random() * 80;
      const streakY = 20 + Math.random() * (h - 60);
      g.roundRect(x, streakY, 1.5, streakH, 1).fill({
        color: COL.OAK_LIGHT,
        alpha: 0.08,
      });
    }

    // Inner highlight (top-left light source)
    g.roundRect(6, 6, w - 12, h - 12, r - 4).stroke({
      color: COL.OAK_LIGHT,
      width: 1.5,
      alpha: 0.18,
    });

    // Outer border rope-like frame
    g.roundRect(0, 0, w, h, r).stroke({ color: COL.OAK_MID, width: 3.5 });
    g.roundRect(-1, -1, w + 2, h + 2, r + 1).stroke({
      color: COL.OAK_PLANK_LINE,
      width: 1.5,
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  GRASS ACCENTS (bottom)
  // ════════════════════════════════════════════════════════════════════════════

  private drawGrassAccents() {
    const g = new Graphics();
    const w = this.sidebarW;
    const h = this.sidebarH;

    // Soft grass mound along the bottom inside
    const grassY = h - 38;
    g.beginPath();
    g.moveTo(12, h - 12);
    for (let x = 12; x < w - 12; x += 6) {
      const wave = Math.sin(x * 0.08) * 5 + Math.cos(x * 0.14) * 3;
      g.lineTo(x, grassY + wave);
    }
    g.lineTo(w - 12, h - 12);
    g.closePath();
    g.fill({ color: COL.GRASS_MID, alpha: 0.55 });

    // Darker layer behind
    const grass2Y = h - 30;
    g.beginPath();
    g.moveTo(12, h - 12);
    for (let x = 12; x < w - 12; x += 5) {
      const wave = Math.sin(x * 0.12 + 1) * 4 + Math.cos(x * 0.07) * 3;
      g.lineTo(x, grass2Y + wave);
    }
    g.lineTo(w - 12, h - 12);
    g.closePath();
    g.fill({ color: COL.GRASS_DARK, alpha: 0.4 });

    // Individual grass blades along top of mound
    for (let x = 18; x < w - 18; x += 8 + Math.random() * 6) {
      const bladeH = 8 + Math.random() * 10;
      const lean = (Math.random() - 0.5) * 4;
      g.beginPath();
      g.moveTo(x, grassY + Math.sin(x * 0.08) * 5);
      g.quadraticCurveTo(
        x + lean,
        grassY - bladeH + Math.sin(x * 0.08) * 5,
        x + lean * 1.5,
        grassY - bladeH - 2 + Math.sin(x * 0.08) * 5,
      );
      g.stroke({ color: COL.GRASS_LIGHT, width: 1.8, alpha: 0.7 });
    }

    // Small grass tufts at top edge too
    for (let x = 20; x < w - 20; x += 30 + Math.random() * 20) {
      const ty = 10;
      for (let b = -1; b <= 1; b++) {
        g.beginPath();
        g.moveTo(x + b * 3, ty + 4);
        g.quadraticCurveTo(x + b * 5, ty - 4, x + b * 6, ty - 8);
        g.stroke({ color: COL.GRASS_MID, width: 1.5, alpha: 0.4 });
      }
    }

    this.decorations.addChild(g);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DAISY DECORATIONS
  // ════════════════════════════════════════════════════════════════════════════

  private drawDaisies() {
    const positions = [
      { x: 30, y: this.sidebarH - 44, s: 0.7 },
      { x: 70, y: this.sidebarH - 50, s: 0.9 },
      { x: 140, y: this.sidebarH - 46, s: 0.65 },
      { x: 200, y: this.sidebarH - 52, s: 0.8 },
      { x: 248, y: this.sidebarH - 42, s: 0.6 },
      // top corner daisies
      { x: 24, y: 16, s: 0.5 },
      { x: this.sidebarW - 24, y: 16, s: 0.5 },
    ];

    for (const p of positions) {
      const daisy = new Graphics();
      this.drawSingleDaisy(daisy, 0, 0, p.s);
      daisy.x = p.x;
      daisy.y = p.y;
      this.decorations.addChild(daisy);
      this.daisies.push({ g: daisy, baseY: p.y });
    }
  }

  private drawSingleDaisy(g: Graphics, cx: number, cy: number, scale: number) {
    const petalLen = 6 * scale;
    const petals = 6;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const px = cx + Math.cos(angle) * petalLen;
      const py = cy + Math.sin(angle) * petalLen;
      g.circle(px, py, 3.5 * scale).fill({
        color: COL.DAISY_PETAL,
        alpha: 0.92,
      });
    }
    // Stem hint
    g.beginPath();
    g.moveTo(cx, cy + 3 * scale);
    g.lineTo(cx - 1, cy + 10 * scale);
    g.stroke({ color: COL.GRASS_DARK, width: 1.2 * scale, alpha: 0.5 });
    // Center
    g.circle(cx, cy, 2.8 * scale).fill(COL.DAISY_CENTER);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  RANK CARDS
  // ════════════════════════════════════════════════════════════════════════════

  private buildCards() {
    const cardW = this.sidebarW - 36;
    const titleReserved = 55; // space for title at top
    const grassReserved = 40; // space for grass/daisies at bottom
    const availableH = this.sidebarH - titleReserved - grassReserved;
    const count = this.entries.length;

    // Compute card height + gap that fits within available space
    const idealCardH = 72;
    const idealGap = 16;
    const minCardH = 32;
    const minGap = 4;

    let cardH: number;
    let gap: number;

    const totalNeeded = count * idealCardH + (count - 1) * idealGap;
    if (totalNeeded <= availableH) {
      cardH = idealCardH;
      gap = idealGap;
    } else {
      // Shrink gap first, then card height
      gap = Math.max(
        minGap,
        Math.floor((availableH - count * idealCardH) / Math.max(count - 1, 1)),
      );
      if (gap >= minGap) {
        cardH = Math.min(
          idealCardH,
          Math.floor((availableH - (count - 1) * gap) / count),
        );
      } else {
        gap = minGap;
        cardH = Math.max(
          minCardH,
          Math.floor((availableH - (count - 1) * gap) / count),
        );
      }
    }

    const compact = cardH < 52;
    const startY = 0;

    this.entries.forEach((entry, idx) => {
      const card = new Container();
      card.y = startY + idx * (cardH + gap);
      this.cardsContainer.addChild(card);

      if (entry.rank === 1) {
        this.buildGoldCard(card, cardW, cardH, entry, compact);
      } else if (entry.rank === 2) {
        this.buildSilverCard(card, cardW, cardH, entry, compact);
      } else {
        this.buildDefaultCard(card, cardW, cardH, entry, compact);
      }
    });
  }

  // ── 1st place — gold vine border ─────────────────────────────────────────

  private buildGoldCard(
    card: Container,
    w: number,
    h: number,
    entry: RankEntry,
    compact = false,
  ) {
    const r = compact ? 8 : 12;
    const iconScale = compact ? 0.5 : 0.85;
    const fontSize = compact ? 14 : 20;
    const iconX = compact ? 22 : 32;
    const textX = compact ? 40 : 60;

    // Outer glow
    const glow = new Graphics();
    glow
      .roundRect(-4, -4, w + 8, h + 8, r + 4)
      .fill({ color: COL.GOLD_GLOW, alpha: 0.18 });
    glow
      .roundRect(-2, -2, w + 4, h + 4, r + 2)
      .fill({ color: COL.GOLD_GLOW, alpha: 0.12 });
    card.addChild(glow);
    this.glowGraphics.push(glow);

    // Card body
    const body = new Graphics();
    body
      .roundRect(0, 0, w, h, r)
      .fill({ color: COL.CARD_BG, alpha: COL.CARD_BG_ALPHA });
    card.addChild(body);

    // Gold vine border
    const vine = new Graphics();
    this.drawVineBorder(vine, w, h, r, COL.GOLD, COL.GOLD_DARK);
    card.addChild(vine);

    // Tiny vine leaves (skip in compact to avoid clutter)
    if (!compact) {
      const leaves = new Graphics();
      this.drawVineLeaves(leaves, w, h);
      card.addChild(leaves);
    }

    // Cow icon
    const cow = new Graphics();
    this.drawCowIcon(cow, 0, 0);
    cow.x = iconX;
    cow.y = h / 2;
    cow.scale.set(iconScale);
    card.addChild(cow);

    // Text
    const label = `${entry.rank}${ordinalSuffix(entry.rank)}: ${entry.name}`;
    const text = new Text({
      text: label,
      style: new TextStyle({
        fill: COL.TEXT_WHITE,
        fontSize,
        fontFamily: '"Fredoka One", "Comic Sans MS", "Segoe UI", sans-serif',
        fontWeight: "900",
        stroke: { color: COL.TEXT_SHADOW, width: compact ? 3 : 4 },
        dropShadow: compact
          ? undefined
          : {
              alpha: 0.35,
              angle: Math.PI / 4,
              blur: 2,
              color: "#000000",
              distance: 2,
            },
      }),
    });
    text.anchor.set(0, 0.5);
    text.x = textX;
    text.y = h / 2;
    card.addChild(text);

    // Small gold crown above name (only when there's room)
    if (!compact) {
      const crown = new Graphics();
      this.drawCrown(crown, 0, 0, COL.GOLD, COL.GOLD_DARK);
      crown.x = 60;
      crown.y = h / 2 - 22;
      crown.scale.set(0.55);
      card.addChild(crown);
    }
  }

  // ── 2nd place — silver watering can border ───────────────────────────────

  private buildSilverCard(
    card: Container,
    w: number,
    h: number,
    entry: RankEntry,
    compact = false,
  ) {
    const r = compact ? 8 : 12;
    const iconScale = compact ? 0.5 : 0.85;
    const fontSize = compact ? 14 : 20;
    const iconX = compact ? 22 : 32;
    const textX = compact ? 40 : 60;

    // Subtle shine
    const shine = new Graphics();
    shine
      .roundRect(-2, -2, w + 4, h + 4, r + 2)
      .fill({ color: COL.SILVER_LIGHT, alpha: 0.1 });
    card.addChild(shine);

    // Card body
    const body = new Graphics();
    body
      .roundRect(0, 0, w, h, r)
      .fill({ color: COL.CARD_BG, alpha: COL.CARD_BG_ALPHA });
    card.addChild(body);

    // Silver border with subtle watering can motif at corner
    const border = new Graphics();
    border
      .roundRect(0, 0, w, h, r)
      .stroke({ color: COL.SILVER, width: compact ? 2 : 3 });
    // Inner line for polished effect
    if (!compact) {
      border
        .roundRect(3, 3, w - 6, h - 6, r - 2)
        .stroke({ color: COL.SILVER_LIGHT, width: 1, alpha: 0.3 });
    }
    card.addChild(border);

    // Watering can icon in corner (skip in compact)
    if (!compact) {
      const can = new Graphics();
      this.drawWateringCan(can, 0, 0, COL.SILVER, COL.SILVER_DARK);
      can.x = w - 26;
      can.y = 14;
      can.scale.set(0.55);
      card.addChild(can);
    }

    // Sheep icon
    const sheep = new Graphics();
    this.drawSheepIcon(sheep, 0, 0);
    sheep.x = iconX;
    sheep.y = h / 2;
    sheep.scale.set(iconScale);
    card.addChild(sheep);

    // Text
    const label = `${entry.rank}${ordinalSuffix(entry.rank)}: ${entry.name}`;
    const text = new Text({
      text: label,
      style: new TextStyle({
        fill: COL.TEXT_WHITE,
        fontSize,
        fontFamily: '"Fredoka One", "Comic Sans MS", "Segoe UI", sans-serif',
        fontWeight: "900",
        stroke: { color: COL.TEXT_SHADOW, width: compact ? 3 : 4 },
        dropShadow: compact
          ? undefined
          : {
              alpha: 0.35,
              angle: Math.PI / 4,
              blur: 2,
              color: "#000000",
              distance: 2,
            },
      }),
    });
    text.anchor.set(0, 0.5);
    text.x = textX;
    text.y = h / 2;
    card.addChild(text);
  }

  // ── 3rd+ place — default card ─────────────────────────────────────────────

  private buildDefaultCard(
    card: Container,
    w: number,
    h: number,
    entry: RankEntry,
    compact = false,
  ) {
    const r = compact ? 6 : 10;
    const fontSize = compact ? 13 : 18;

    const body = new Graphics();
    body.roundRect(0, 0, w, h, r).fill({ color: COL.CARD_BG, alpha: 0.6 });
    body
      .roundRect(0, 0, w, h, r)
      .stroke({ color: COL.OAK_LIGHT, width: compact ? 1 : 2 });
    card.addChild(body);

    const label = `${entry.rank}${ordinalSuffix(entry.rank)}: ${entry.name}`;
    const text = new Text({
      text: label,
      style: new TextStyle({
        fill: COL.TEXT_WHITE,
        fontSize,
        fontFamily: '"Fredoka One", "Comic Sans MS", "Segoe UI", sans-serif',
        fontWeight: "700",
        stroke: { color: COL.TEXT_SHADOW, width: compact ? 2 : 3 },
      }),
    });
    text.anchor.set(0, 0.5);
    text.x = compact ? 12 : 20;
    text.y = h / 2;
    card.addChild(text);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  VINE BORDER  (gold)
  // ════════════════════════════════════════════════════════════════════════════

  private drawVineBorder(
    g: Graphics,
    w: number,
    h: number,
    r: number,
    color: number,
    darkColor: number,
  ) {
    // Outer gold border
    g.roundRect(0, 0, w, h, r).stroke({ color, width: 3.5 });

    // Vine tendrils along top & bottom edges
    const segments = 8;
    // Top vine
    for (let i = 0; i < segments; i++) {
      const x1 = r + (i / segments) * (w - 2 * r);
      const x2 = r + ((i + 1) / segments) * (w - 2 * r);
      const cx = (x1 + x2) / 2;
      const cy = i % 2 === 0 ? -5 : 5;
      g.beginPath();
      g.moveTo(x1, 0);
      g.quadraticCurveTo(cx, cy, x2, 0);
      g.stroke({ color: darkColor, width: 1.8, alpha: 0.7 });
    }
    // Bottom vine
    for (let i = 0; i < segments; i++) {
      const x1 = r + (i / segments) * (w - 2 * r);
      const x2 = r + ((i + 1) / segments) * (w - 2 * r);
      const cx = (x1 + x2) / 2;
      const cy = h + (i % 2 === 0 ? 5 : -5);
      g.beginPath();
      g.moveTo(x1, h);
      g.quadraticCurveTo(cx, cy, x2, h);
      g.stroke({ color: darkColor, width: 1.8, alpha: 0.7 });
    }
    // Left vine
    for (let i = 0; i < 4; i++) {
      const y1 = r + (i / 4) * (h - 2 * r);
      const y2 = r + ((i + 1) / 4) * (h - 2 * r);
      const cy = (y1 + y2) / 2;
      const cx = i % 2 === 0 ? -4 : 4;
      g.beginPath();
      g.moveTo(0, y1);
      g.quadraticCurveTo(cx, cy, 0, y2);
      g.stroke({ color: darkColor, width: 1.5, alpha: 0.6 });
    }
    // Right vine
    for (let i = 0; i < 4; i++) {
      const y1 = r + (i / 4) * (h - 2 * r);
      const y2 = r + ((i + 1) / 4) * (h - 2 * r);
      const cy = (y1 + y2) / 2;
      const cx = w + (i % 2 === 0 ? 4 : -4);
      g.beginPath();
      g.moveTo(w, y1);
      g.quadraticCurveTo(cx, cy, w, y2);
      g.stroke({ color: darkColor, width: 1.5, alpha: 0.6 });
    }
  }

  private drawVineLeaves(g: Graphics, w: number, h: number) {
    const leafPositions = [
      { x: 14, y: -3, angle: -0.4 },
      { x: w * 0.35, y: -4, angle: 0.3 },
      { x: w * 0.65, y: -3, angle: -0.2 },
      { x: w - 14, y: -2, angle: 0.4 },
      { x: 14, y: h + 3, angle: 0.4 },
      { x: w * 0.5, y: h + 4, angle: -0.3 },
      { x: w - 14, y: h + 2, angle: -0.4 },
      { x: -3, y: h * 0.3, angle: -0.8 },
      { x: w + 3, y: h * 0.7, angle: 0.8 },
    ];

    for (const leaf of leafPositions) {
      g.beginPath();
      const lx = leaf.x;
      const ly = leaf.y;
      const size = 5;
      const dx = Math.cos(leaf.angle) * size;
      const dy = Math.sin(leaf.angle) * size;
      g.moveTo(lx, ly);
      g.quadraticCurveTo(
        lx + dx - dy * 0.4,
        ly + dy + dx * 0.4,
        lx + dx,
        ly + dy,
      );
      g.quadraticCurveTo(lx + dx + dy * 0.4, ly + dy - dx * 0.4, lx, ly);
      g.fill({ color: COL.VINE_LEAF, alpha: 0.75 });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ANIMAL ICONS  (cute, minimal vector art)
  // ════════════════════════════════════════════════════════════════════════════

  /** Cute tan cow – front-facing */
  private drawCowIcon(g: Graphics, cx: number, cy: number) {
    // Body oval
    g.ellipse(cx, cy + 2, 12, 10).fill(COL.COW_TAN);

    // Head circle
    g.circle(cx, cy - 6, 9).fill(COL.COW_TAN);

    // Ears
    g.ellipse(cx - 10, cy - 10, 5, 3).fill(COL.COW_TAN);
    g.ellipse(cx + 10, cy - 10, 5, 3).fill(COL.COW_TAN);
    g.ellipse(cx - 10, cy - 10, 3, 2).fill(COL.COW_NOSE);
    g.ellipse(cx + 10, cy - 10, 3, 2).fill(COL.COW_NOSE);

    // Spots
    g.circle(cx - 4, cy - 8, 3).fill({ color: COL.COW_SPOT, alpha: 0.55 });
    g.circle(cx + 5, cy - 4, 2.5).fill({ color: COL.COW_SPOT, alpha: 0.45 });

    // Muzzle
    g.ellipse(cx, cy - 2, 5, 3.5).fill(COL.COW_NOSE);

    // Nostrils
    g.circle(cx - 2, cy - 1.5, 1).fill({ color: COL.COW_SPOT, alpha: 0.6 });
    g.circle(cx + 2, cy - 1.5, 1).fill({ color: COL.COW_SPOT, alpha: 0.6 });

    // Eyes
    g.circle(cx - 4, cy - 8, 1.8).fill(0x000000);
    g.circle(cx + 4, cy - 8, 1.8).fill(0x000000);
    // Eye shine
    g.circle(cx - 3.3, cy - 8.6, 0.7).fill(0xffffff);
    g.circle(cx + 4.7, cy - 8.6, 0.7).fill(0xffffff);

    // Tiny horns
    g.beginPath();
    g.moveTo(cx - 6, cy - 14);
    g.lineTo(cx - 7, cy - 19);
    g.lineTo(cx - 4, cy - 14);
    g.fill(COL.DAISY_CENTER);
    g.beginPath();
    g.moveTo(cx + 6, cy - 14);
    g.lineTo(cx + 7, cy - 19);
    g.lineTo(cx + 4, cy - 14);
    g.fill(COL.DAISY_CENTER);
  }

  /** Cute tan sheep – front-facing */
  private drawSheepIcon(g: Graphics, cx: number, cy: number) {
    // Woolly body (cluster of circles)
    const woolOffsets = [
      { x: 0, y: 3, r: 8 },
      { x: -6, y: 1, r: 6 },
      { x: 6, y: 1, r: 6 },
      { x: -4, y: 7, r: 5 },
      { x: 4, y: 7, r: 5 },
      { x: 0, y: -2, r: 5 },
    ];
    for (const w of woolOffsets) {
      g.circle(cx + w.x, cy + w.y, w.r).fill(COL.SHEEP_BODY);
    }

    // Head
    g.circle(cx, cy - 6, 7).fill(COL.SHEEP_FACE);

    // Woolly top (fluffy tufts on head)
    g.circle(cx - 3, cy - 12, 3.5).fill(COL.SHEEP_BODY);
    g.circle(cx + 3, cy - 12, 3.5).fill(COL.SHEEP_BODY);
    g.circle(cx, cy - 13, 3).fill(COL.SHEEP_BODY);

    // Ears
    g.ellipse(cx - 9, cy - 7, 4, 2.5).fill(COL.SHEEP_FACE);
    g.ellipse(cx + 9, cy - 7, 4, 2.5).fill(COL.SHEEP_FACE);
    g.ellipse(cx - 9, cy - 7, 2.5, 1.5).fill({
      color: COL.SHEEP_DARK,
      alpha: 0.25,
    });
    g.ellipse(cx + 9, cy - 7, 2.5, 1.5).fill({
      color: COL.SHEEP_DARK,
      alpha: 0.25,
    });

    // Eyes
    g.circle(cx - 3, cy - 7, 1.8).fill(0x000000);
    g.circle(cx + 3, cy - 7, 1.8).fill(0x000000);
    g.circle(cx - 2.3, cy - 7.6, 0.7).fill(0xffffff);
    g.circle(cx + 3.7, cy - 7.6, 0.7).fill(0xffffff);

    // Nose
    g.ellipse(cx, cy - 3, 2, 1.5).fill({ color: COL.SHEEP_DARK, alpha: 0.5 });

    // Tiny legs
    g.roundRect(cx - 5, cy + 10, 3, 6, 1).fill(COL.SHEEP_DARK);
    g.roundRect(cx + 2, cy + 10, 3, 6, 1).fill(COL.SHEEP_DARK);
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DECORATIVE MOTIFS
  // ════════════════════════════════════════════════════════════════════════════

  private drawCrown(
    g: Graphics,
    cx: number,
    cy: number,
    color: number,
    dark: number,
  ) {
    g.beginPath();
    g.moveTo(cx - 12, cy + 5);
    g.lineTo(cx - 12, cy - 3);
    g.lineTo(cx - 7, cy + 1);
    g.lineTo(cx, cy - 7);
    g.lineTo(cx + 7, cy + 1);
    g.lineTo(cx + 12, cy - 3);
    g.lineTo(cx + 12, cy + 5);
    g.closePath();
    g.fill(color);
    g.stroke({ color: dark, width: 1.5 });

    // Jewels
    g.circle(cx, cy - 3, 1.5).fill(0xff5252);
    g.circle(cx - 7, cy + 1, 1.2).fill(0x42a5f5);
    g.circle(cx + 7, cy + 1, 1.2).fill(0x42a5f5);
  }

  private drawWateringCan(
    g: Graphics,
    cx: number,
    cy: number,
    color: number,
    dark: number,
  ) {
    // Body
    g.roundRect(cx - 10, cy, 20, 14, 3).fill(color);
    g.roundRect(cx - 10, cy, 20, 14, 3).stroke({ color: dark, width: 1.2 });

    // Spout
    g.beginPath();
    g.moveTo(cx + 10, cy + 3);
    g.lineTo(cx + 20, cy - 4);
    g.lineTo(cx + 22, cy - 2);
    g.lineTo(cx + 12, cy + 5);
    g.closePath();
    g.fill(color);
    g.stroke({ color: dark, width: 1 });

    // Spout holes (water drops decoration)
    g.circle(cx + 21, cy - 6, 1).fill({ color: 0x90caf9, alpha: 0.7 });
    g.circle(cx + 23, cy - 5, 0.8).fill({ color: 0x90caf9, alpha: 0.5 });
    g.circle(cx + 19, cy - 7, 0.8).fill({ color: 0x90caf9, alpha: 0.5 });

    // Handle
    g.beginPath();
    g.moveTo(cx - 4, cy);
    g.quadraticCurveTo(cx, cy - 10, cx + 6, cy);
    g.stroke({ color: dark, width: 2 });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  LAYOUT
  // ════════════════════════════════════════════════════════════════════════════

  private layout() {
    this.titleText.x = this.sidebarW / 2;
    this.titleText.y = 22;

    this.cardsContainer.x = 18;
    this.cardsContainer.y = 65;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ANIMATION  (call every frame)
  // ════════════════════════════════════════════════════════════════════════════

  update(delta: number) {
    this.elapsed += delta;

    // Gentle daisy bob
    for (const d of this.daisies) {
      d.g.y = d.baseY + Math.sin(this.elapsed * 0.04 + d.baseY) * 1.2;
    }

    // Gold glow pulse
    const glowAlpha = 0.12 + Math.sin(this.elapsed * 0.06) * 0.06;
    for (const g of this.glowGraphics) {
      g.alpha = glowAlpha / 0.18; // normalise against the base fill alpha
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ════════════════════════════════════════════════════════════════════════════

  /** Re-draw with new dimensions (e.g. on window resize) */
  public resize(width: number, height: number) {
    this.sidebarW = width;
    this.sidebarH = height;

    // Rebuild all visuals
    this.bg.clear();
    this.decorations.removeChildren();
    this.cardsContainer.removeChildren();
    this.daisies = [];
    this.glowGraphics = [];

    this.drawBackground();
    this.drawGrassAccents();
    this.drawDaisies();
    this.buildCards();
    this.layout();
  }

  /** Replace entries and rebuild cards */
  public setEntries(entries: RankEntry[]) {
    this.entries = entries;
    this.cardsContainer.removeChildren();
    this.glowGraphics = [];
    this.buildCards();
    this.layout();
  }
}
