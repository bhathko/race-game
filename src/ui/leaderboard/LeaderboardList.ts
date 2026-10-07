import { Container, Graphics, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { PALETTE } from "../../config";
import type { RacerAnimations } from "../../core";
import type { RankEntry } from "./types";

export const LIST_CARD_H = 36;
export const LIST_GAP = 6;
export const LIST_COLUMN_GAP = 8;
/** Horizontal padding the list keeps inside its panel (18px each side). */
export const LIST_SIDE_PADDING = 36;

export class LeaderboardList extends Container {
  constructor(
    entries: RankEntry[],
    width: number,
    animations: Map<string, RacerAnimations> | null,
    columns: number = 1,
  ) {
    super();
    const rest = entries.slice(3);
    const cardW = (width - LIST_SIDE_PADDING - LIST_COLUMN_GAP * (columns - 1)) / columns;
    const cardH = LIST_CARD_H;
    const rows = Math.ceil(rest.length / columns);

    rest.forEach((entry, idx) => {
      // Column-major so places read top-to-bottom, then continue in the next column
      const col = Math.floor(idx / rows);
      const row = idx % rows;
      const card = new Container();
      card.x = col * (cardW + LIST_COLUMN_GAP);
      card.y = row * (cardH + LIST_GAP);
      this.addChild(card);

      const body = new Graphics()
        .roundRect(0, 0, cardW, cardH, 8)
        .fill({ color: 0xffffff, alpha: 0.95 })
        .stroke({ color: PALETTE.STR_BLACK, width: 3, join: "round" })
        .roundRect(1, -1, cardW - 2, cardH + 1, 8)
        .stroke({ color: PALETTE.STR_BLACK, width: 1.5, alpha: 0.5, join: "round" });
      card.addChild(body);

      const icon = this.createIcon(entry.character, animations);
      icon.scale.set(0.6);
      icon.x = 20;
      icon.y = cardH / 2;
      card.addChild(icon);

      const suffix =
        entry.rank === 1 ? "st" : entry.rank === 2 ? "nd" : entry.rank === 3 ? "rd" : "th";
      const text = new Text({
        text: `${entry.rank}${suffix}: ${entry.name}`,
        style: new TextStyle({
          fill: PALETTE.STR_BLACK,
          fontSize: 14,
          fontWeight: "900",
        }),
      });
      text.anchor.set(0, 0.5);
      text.x = 45;
      text.y = cardH / 2;
      card.addChild(text);
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
