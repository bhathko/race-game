import { BaseCharacterSelectionScene } from "./BaseCharacterSelectionScene";
import { RACER, UI } from "../../config";
import type { SelectionContext } from "../../core";
import { getStandardGridConfig } from "../../core";
import { setFontSize } from "../../ui";

/** Phone width the portrait layout was designed for. */
const DESIGN_WIDTH = 390;
const MAX_UI_SCALE = 1.8;

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

    this.bg.clear().rect(0, 0, width, height).fill({ color: UI.BG });

    // The layout below is designed for a ~390px-wide phone ("design units").
    // Larger portrait screens (e.g. upright tablets) scale it up to fill the space.
    const gridScale = 0.7;
    const cardSize = 100; // cards are roundRect(-50,-50,100,100) → ±50px from origin
    const cardHalf = cardSize / 2;
    const gridGap = 20;
    const spacingX = cardSize + gridGap; // 120 unscaled
    const spacingY = cardSize + gridGap; // 120 unscaled
    const cols = 4;
    const totalItems = this.selectionSprites.size;
    const gridRows = Math.ceil(totalItems / cols);

    const lineupScale = this.getLineupScale();
    const cardVisualW = (RACER.WIDTH + 10) * lineupScale;
    // Lineup cards use roundRect(-45, -85, 90, 95) → extend 85px ABOVE origin, 10px below
    const lineupCardTopExtent = (RACER.HEIGHT + 5) * lineupScale;
    const lineupRows = this.lineupSprites.length > 4 ? 2 : 1;

    // Vertical positions in design units
    const titleY = 80;
    const gridY = 141;
    const gridBottomY = gridY + ((gridRows - 1) * spacingY + cardHalf) * gridScale;
    const statusY = gridBottomY + 20;
    const lineupY = statusY + 18 + lineupCardTopExtent;
    const lineupBottomY = lineupY + (lineupRows - 1) * (cardVisualW + 30) + 10 * lineupScale;
    const START_BTN_SPACE = 90;

    const uiScale = Math.max(
      1,
      Math.min(MAX_UI_SCALE, width / DESIGN_WIDTH, (height - START_BTN_SPACE) / lineupBottomY),
    );

    // Back button top-left
    this.backBtn.scale.set(0.6 * uiScale);
    this.backBtn.x = grid.margin + 35 * uiScale;
    this.backBtn.y = 35 * uiScale;

    // Title below back button
    this.title.x = centerX;
    this.title.y = titleY * uiScale;
    setFontSize(this.title, 22 * uiScale);

    // ─── Character Selection Grid ───
    this.gridContainer.scale.set(gridScale * uiScale);
    let idx = 0;
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
    this.gridContainer.x = centerX;
    this.gridContainer.y = gridY * uiScale;

    // ─── Status Text ───
    this.statusText.x = centerX;
    this.statusText.y = statusY * uiScale;
    setFontSize(this.statusText, 16 * uiScale);

    // ─── Selected Lineup ───
    this.lineupContainer.scale.set(uiScale);
    this.lineupContainer.x = centerX;
    this.lineupContainer.y = lineupY * uiScale;
    this.repositionLineup();

    // ─── Start Button ───
    this.startBtn.scale.set(0.7 * uiScale);
    this.startBtn.x = centerX;
    this.startBtn.y = height - 45 * uiScale;

    // ─── Popup ───
    this.repositionPopup(width, height);
  }
}
