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

  constructor(
    entries: RankEntry[],
    width: number,
    animations: Map<string, RacerAnimations> | null,
  ) {
    super();
    const top3 = entries.slice(0, 3);
    if (top3.length === 0) return;

    const colW = (width - 40) / 3;
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
      const bColor =
        rank === 1 ? PALETTE.WOOD_LIGHT : rank === 2 ? PALETTE.WOOD_MID : PALETTE.WOOD_DARK;
      const mColor = rank === 1 ? COL.GOLD : rank === 2 ? COL.SILVER : COL.BRONZE;

      ped.roundRect(-colW / 2 + 10, -h + 4, colW - 12, h, 6).fill({ color: 0, alpha: 0.25 });
      ped.roundRect(-colW / 2 + 6, -h, colW - 12, h, 6).fill(bColor);

      const capY = -h - 6;
      ped.roundRect(-colW / 2 + 4, capY + 4, colW - 4, 14, 4).fill({ color: 0, alpha: 0.3 });
      ped
        .roundRect(-colW / 2 + 2, capY, colW - 4, 14, 4)
        .fill(mColor)
        .stroke({ color: rank === 1 ? COL.GOLD_DARK : 0, width: 1.5, alpha: 0.5 });

      col.addChild(ped);

      const rText = new Text({
        text: rank.toString(),
        style: new TextStyle({
          fill: COL.TEXT_WHITE,
          fontSize: rank === 1 ? 36 : 28,
          fontWeight: "900",
        }),
      });
      rText.alpha = 0.5;
      rText.anchor.set(0.5);
      rText.y = -h / 2;
      col.addChild(rText);

      const icon = this.createIcon(entry.character, animations);
      icon.scale.set(1.2);
      icon.y = capY - 44;
      col.addChild(icon);

      const name = new Text({
        text: entry.name.split(" ")[1] || entry.name,
        style: new TextStyle({
          fill: COL.TEXT_WHITE,
          fontSize: 14,
          fontWeight: "900",
          stroke: { color: COL.TEXT_SHADOW, width: 3 },
          align: "center",
        }),
      });
      name.anchor.set(0.5, 0);
      name.y = capY - 84;
      col.addChild(name);

      if (rank === 1) {
        const glow = new Graphics()
          .circle(0, capY - 44, 45)
          .fill({ color: COL.GOLD_GLOW, alpha: 0.12 });
        col.addChildAt(glow, 0);
        this.glowGraphics.push(glow);
      }
    });
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
