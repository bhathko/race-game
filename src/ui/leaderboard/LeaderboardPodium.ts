import { Container, Graphics, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { PALETTE } from "../../config";
import type { RacerAnimations } from "../../core";
import type { RankEntry } from "./types";

const COL = {
  GOLD: PALETTE.GOLD,
  GOLD_GLOW: 0xfff176,
  GOLD_DARK: 0xc6a700,
  SILVER: PALETTE.SILVER,
  SILVER_DARK: 0x8a8a8a,
  BRONZE: PALETTE.BRONZE,
  BRONZE_DARK: 0x8d6e63,
  OAK_PLANK_LINE: PALETTE.WOOD_DARK,
  TEXT_WHITE: PALETTE.STR_WHITE,
  TEXT_SHADOW: PALETTE.STR_WOOD_MID,
};

export class LeaderboardPodium extends Container {
  public glowGraphics: Graphics[] = [];
  private elapsed = 0;
  private entries: RankEntry[];
  private animations: Map<string, RacerAnimations> | null;
  private podiumWidth: number;

  constructor(
    entries: RankEntry[],
    width: number,
    animations: Map<string, RacerAnimations> | null,
  ) {
    super();
    this.entries = entries;
    this.podiumWidth = width;
    this.animations = animations;
    this.refresh();
  }

  private refresh() {
    this.removeChildren();
    this.glowGraphics = [];

    const top3 = this.entries.slice(0, 3);
    if (top3.length === 0) return;

    // Use full width divided by 3
    const colW = this.podiumWidth / 3;
    const heights = { 1: 90, 2: 70, 3: 50 };
    const order = [2, 1, 3];

    order.forEach((rank, i) => {
      const entry = top3.find((e) => e.rank === rank);
      if (!entry) return;

      const col = new Container();
      col.x = i * colW + colW / 2;
      this.addChild(col);

      const h = heights[rank as keyof typeof heights];
      const ped = new Graphics();
      const mColor = rank === 1 ? COL.GOLD : rank === 2 ? COL.SILVER : COL.BRONZE;

      // Sketchy drop shadow
      ped.roundRect(-colW / 2 + 5, -h + 4, colW - 6, h, 6).fill({ color: PALETTE.CHUNKY_SHADOW });

      // Main flat colored block
      ped.roundRect(-colW / 2 + 2, -h, colW - 4, h, 8).fill(mColor);

      // Sketchy outlines
      ped
        .roundRect(-colW / 2 + 2, -h, colW - 4, h, 8)
        .stroke({ color: PALETTE.STR_BLACK, width: 3.5, join: "round" });
      ped
        .roundRect(-colW / 2 + 1, -h + 1, colW - 2, h - 1, 8)
        .stroke({ color: PALETTE.STR_BLACK, width: 2, alpha: 0.5, join: "round" });
      ped
        .roundRect(-colW / 2 + 3, -h - 1, colW - 6, h + 2, 8)
        .stroke({ color: PALETTE.STR_BLACK, width: 2, alpha: 0.3, join: "round" });

      const topY = -h;

      col.addChild(ped);

      const rText = new Text({
        text: rank.toString(),
        style: new TextStyle({
          fill: COL.TEXT_WHITE,
          fontSize: rank === 1 ? 40 : 32,
          fontWeight: "900",
          stroke: { color: PALETTE.STR_BLACK, width: 4 },
        }),
      });
      rText.anchor.set(0.5);
      rText.y = -h / 2;
      col.addChild(rText);

      const icon = this.createIcon(entry.character, this.animations);
      icon.scale.set(1.2);
      icon.y = topY - 38;
      col.addChild(icon);

      const name = new Text({
        text: entry.name.split(" ")[1] || entry.name,
        style: new TextStyle({
          fill: COL.TEXT_WHITE,
          fontSize: 16,
          fontWeight: "900",
          stroke: { color: PALETTE.STR_BLACK, width: 4 },
          align: "center",
        }),
      });
      name.anchor.set(0.5, 0);
      name.y = topY - 78;
      col.addChild(name);

      if (rank === 1) {
        const glow = new Graphics()
          .circle(0, topY - 38, 45)
          .fill({ color: COL.GOLD_GLOW, alpha: 0.12 });
        col.addChildAt(glow, 0);
        this.glowGraphics.push(glow);
      }
    });
  }

  public update(delta: number) {
    this.elapsed += delta;
    const alpha = 0.12 + Math.sin(this.elapsed * 0.06) * 0.06;
    this.glowGraphics.forEach((g) => (g.alpha = alpha));
  }

  public resize(width: number) {
    this.podiumWidth = width;
    this.refresh();
  }

  private createIcon(key?: string, anims?: Map<string, RacerAnimations> | null): Container {
    if (anims && key && anims.has(key)) {
      const s = new AnimatedSprite(anims.get(key)!.idle);
      s.anchor.set(0.5);
      s.animationSpeed = 0.1;
      s.play();
      return s;
    }
    return new Graphics().circle(0, 0, 8).fill(PALETTE.WHITE);
  }
}
