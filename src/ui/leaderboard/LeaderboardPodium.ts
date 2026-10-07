import { Container, Graphics, Text, AnimatedSprite } from "pixi.js";
import { PALETTE, UI } from "../../config";
import { textStyle } from "../TextStyles";
import type { RacerAnimations } from "../../core";
import type { RankEntry } from "./types";

const COL = {
  GOLD: UI.GOLD,
  SILVER: UI.SILVER,
  BRONZE: UI.BRONZE,
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
    this.removeChildren().forEach((c) => c.destroy({ children: true }));
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

      // Soft, flat block with rounded corners
      ped
        .roundRect(-colW / 2 + 4, -h + 2, colW - 8, h, 14)
        .fill({ color: UI.SHADOW, alpha: 0.06 })
        .roundRect(-colW / 2 + 4, -h, colW - 8, h, 14)
        .fill(mColor);

      const topY = -h;

      col.addChild(ped);

      const rText = new Text({
        text: rank.toString(),
        style: textStyle("ink", rank === 1 ? 40 : 32, { fontWeight: "800" }),
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
        style: textStyle("body", 17, { align: "center" }),
      });
      name.anchor.set(0.5, 0);
      name.y = topY - 78;
      col.addChild(name);

      if (rank === 1) {
        const glow = new Graphics().circle(0, topY - 38, 45).fill({ color: COL.GOLD });
        col.addChildAt(glow, 0);
        this.glowGraphics.push(glow);
      }
    });
  }

  public update(delta: number) {
    this.elapsed += delta;
    // Pulsing gold halo behind the winner (the fill is opaque; this alpha is the only one applied)
    const alpha = 0.08 + Math.sin(this.elapsed * 0.06) * 0.04;
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
