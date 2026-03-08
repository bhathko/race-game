import { BaseCharacterSelectionScene } from "./BaseCharacterSelectionScene";
import { RACER } from "../../config";
import type { SelectionContext } from "../../core";
import { getStandardGridConfig } from "../../core";

export class MobileVerticalSelectionScene extends BaseCharacterSelectionScene {
  constructor(ctx: SelectionContext, initialSelectedKeys: string[] = []) {
    super(ctx, initialSelectedKeys);
  }
  protected getLineupScale(): number {
    return 0.7;
  }

  protected repositionLineup(): void {
    const count = this.lineupSprites.length;
    const lineupScale = this.getLineupScale();
    const cardVisualW = (RACER.WIDTH + 10) * lineupScale;
    const spacing = cardVisualW + 10;

    if (count > 4) {
      const row1Count = Math.ceil(count / 2);
      const row2Count = count - row1Count;
      const rowSpacing = cardVisualW + 30;

      const row1Width = (row1Count - 1) * spacing;
      const row2Width = (row2Count - 1) * spacing;

      for (let i = 0; i < count; i++) {
        const sprite = this.lineupSprites[i];
        if (i < row1Count) {
          sprite.x = i * spacing - row1Width / 2;
          sprite.y = 0;
        } else {
          const j = i - row1Count;
          sprite.x = j * spacing - row2Width / 2;
          sprite.y = rowSpacing;
        }
      }
    } else {
      const totalWidth = (count - 1) * spacing;
      this.lineupSprites.forEach((sprite, i) => {
        sprite.x = i * spacing - totalWidth / 2;
        sprite.y = 0;
      });
    }
  }

  public resize(width: number, height: number): void {
    const centerX = width / 2;
    const grid = getStandardGridConfig(width);

    this.bg.clear().rect(0, 0, width, height).fill({ color: 0x81c784 });

    // Back button top-left
    this.backBtn.scale.set(0.6);
    this.backBtn.x = grid.margin + 35;
    this.backBtn.y = 35;

    // Title below back button
    this.title.x = centerX;
    this.title.y = 80;
    this.title.style.fontSize = 22;
    // Title occupies roughly y 49..71 (centered, ~22px tall)

    // ─── Character Selection Grid ───
    const gridScale = 0.7;
    this.gridContainer.scale.set(gridScale);
    const cardSize = 100; // cards are roundRect(-50,-50,100,100) → ±50px from origin
    const cardHalf = cardSize / 2;
    const gridGap = 20;
    const spacingX = cardSize + gridGap; // 120 unscaled
    const spacingY = cardSize + gridGap; // 120 unscaled
    const cols = 4;

    let idx = 0;
    const totalItems = this.selectionSprites.size;
    const itemsArray = Array.from(this.selectionSprites.values());

    for (let row = 0; idx < totalItems; row++) {
      const itemsInRow = Math.min(cols, totalItems - row * cols);
      const rowWidth = (itemsInRow - 1) * spacingX;
      for (let col = 0; col < itemsInRow; col++) {
        const item = itemsArray[idx];
        item.x = col * spacingX - rowWidth / 2;
        item.y = row * spacingY;
        idx++;
      }
    }

    // Grid container position: first card top = containerY - cardHalf*scale
    // We want first card top ≥ title bottom (71) + gap (15) = 86
    // containerY = 86 + cardHalf*scale = 86 + 35 = 121
    this.gridContainer.x = centerX;
    this.gridContainer.y = 141;

    // Grid bottom: last row bottom = containerY + ((gridRows-1)*spacingY + cardHalf) * scale
    const gridRows = Math.ceil(totalItems / cols);
    const gridBottomY = this.gridContainer.y + ((gridRows - 1) * spacingY + cardHalf) * gridScale;
    // = 121 + ((1)*120 + 50)*0.7 = 121 + 119 = 240

    // ─── Status Text ───
    this.statusText.x = centerX;
    this.statusText.y = gridBottomY + 20;
    this.statusText.style.fontSize = 16;
    // statusText at ~260, occupies ~8px each side = 252..268

    // ─── Selected Lineup ───
    // Lineup cards use roundRect(-45, -85, 90, 95) → extend 85px ABOVE origin
    // Scaled by lineupScale(0.7) → 60px above origin
    const lineupScale = this.getLineupScale();
    const lineupCardTopExtent = (RACER.HEIGHT + 5) * lineupScale; // 85*0.7 = ~60px

    // LineupContainer.y must be far enough that card top doesn't overlap status text
    // Card top = lineupY - lineupCardTopExtent
    // Need card top > statusText bottom (≈268 + 10 gap = 278)
    // lineupY = 278 + lineupCardTopExtent = 278 + 60 = 338
    this.lineupContainer.x = centerX;
    this.lineupContainer.y = this.statusText.y + 18 + lineupCardTopExtent;
    this.repositionLineup();

    // ─── Start Button ───
    this.startBtn.scale.set(0.7);
    this.startBtn.x = centerX;
    this.startBtn.y = height - 45;
  }
}
