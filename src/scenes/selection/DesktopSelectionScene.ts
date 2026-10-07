import { BaseCharacterSelectionScene } from "./BaseCharacterSelectionScene";
import { RACER } from "../../config";
import type { SelectionContext } from "../../core";
import { getStandardGridConfig } from "../../core";

const LINEUP_SCALE = 1.5;
const LINEUP_SPACING = 160;
const GRID_COLS = 8;
const GRID_SPACING = 110;
const GRID_CARD = 100;
const BACK_BTN_HALF_W = 60;

export class DesktopSelectionScene extends BaseCharacterSelectionScene {
  constructor(ctx: SelectionContext, initialSelectedKeys: string[] = []) {
    super(ctx, initialSelectedKeys);
  }
  protected getLineupScale(): number {
    return LINEUP_SCALE;
  }

  protected repositionLineup(): void {
    const totalWidth = (this.lineupSprites.length - 1) * LINEUP_SPACING;
    this.lineupSprites.forEach((sprite, i) => {
      sprite.x = i * LINEUP_SPACING - totalWidth / 2;
      sprite.y = 0;
    });
  }

  public resize(width: number, height: number): void {
    const centerX = width / 2;
    const grid = getStandardGridConfig(width);
    const availW = width - 2 * grid.margin;

    this.bg.clear().rect(0, 0, width, height).fill({ color: 0x81c784 }); // Nature green

    // Back button top-left; the title shrinks if it would run into it
    this.backBtn.x = grid.margin + BACK_BTN_HALF_W;
    this.backBtn.y = 40;
    this.backBtn.scale.set(1.0);

    this.title.x = centerX;
    this.title.y = 60;
    this.title.style.fontSize = 48;
    this.title.scale.set(1);
    const titleRoom = width - 2 * (grid.margin + BACK_BTN_HALF_W * 2 + 12);
    if (this.title.width > titleRoom) this.title.scale.set(titleRoom / this.title.width);

    // Lineup: scale down to fit narrow windows
    const lineupW =
      (this.lineupSprites.length - 1) * LINEUP_SPACING + (RACER.WIDTH + 10) * LINEUP_SCALE;
    this.lineupContainer.scale.set(Math.min(1, availW / lineupW));
    this.lineupContainer.x = centerX;
    this.lineupContainer.y = height * 0.35;
    this.repositionLineup();

    this.statusText.x = centerX;
    this.statusText.y = this.lineupContainer.y + 100;
    this.statusText.style.fontSize = 24;

    // Character grid: one row of 8, scaled to fit
    let i = 0;
    const totalItems = this.selectionSprites.size;
    const itemsArray = Array.from(this.selectionSprites.values());

    for (let row = 0; i < totalItems; row++) {
      const itemsInRow = Math.min(GRID_COLS, totalItems - row * GRID_COLS);
      const rowWidth = (itemsInRow - 1) * GRID_SPACING;

      for (let col = 0; col < itemsInRow; col++) {
        const item = itemsArray[i];
        item.x = col * GRID_SPACING - rowWidth / 2;
        item.y = row * GRID_SPACING;
        i++;
      }
    }

    const gridW = (Math.min(GRID_COLS, totalItems) - 1) * GRID_SPACING + GRID_CARD;
    this.gridContainer.x = centerX;
    this.gridContainer.y = this.statusText.y + 80;
    this.gridContainer.scale.set(Math.min(1, availW / gridW));

    this.startBtn.x = centerX;
    this.startBtn.y = height - 60;
    this.startBtn.scale.set(1.0);

    // ─── Popup ───
    this.repositionPopup(width, height);
  }
}
