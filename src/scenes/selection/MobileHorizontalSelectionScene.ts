import { BaseCharacterSelectionScene } from "./BaseCharacterSelectionScene";
import { RACER } from "../../config";
import type { SelectionContext } from "../../core";
import { getStandardGridConfig } from "../../core";

export class MobileHorizontalSelectionScene extends BaseCharacterSelectionScene {
  constructor(ctx: SelectionContext, initialSelectedKeys: string[] = []) {
    super(ctx, initialSelectedKeys);
  }
  protected getLineupScale(): number {
    return 0.55;
  }

  protected repositionLineup(): void {
    const count = this.lineupSprites.length;
    const lineupScale = this.getLineupScale();
    const cardVisualW = (RACER.WIDTH + 10) * lineupScale;

    // Ensure at least 8px space between horizontal cards
    const spacing = cardVisualW + 8;
    const totalWidth = (count - 1) * spacing;

    this.lineupSprites.forEach((sprite, i) => {
      sprite.x = i * spacing - totalWidth / 2;
      sprite.y = 0;
    });
  }

  public resize(width: number, height: number): void {
    const centerX = width / 2;
    const grid = getStandardGridConfig(width);

    this.bg.clear().rect(0, 0, width, height).fill({ color: 0x81c784 });

    this.title.x = centerX;
    this.title.y = 25;
    this.title.style.fontSize = 20;

    // Grid Layout (Upper section)
    const gridScale = 0.6;
    this.gridContainer.scale.set(gridScale);
    const cardSize = 100;
    const spacingX = cardSize + 15;
    const spacingY = cardSize + 10;
    const cols = 5;

    let i = 0;
    const totalItems = this.selectionSprites.size;
    const itemsArray = Array.from(this.selectionSprites.values());

    for (let row = 0; i < totalItems; row++) {
      const itemsInRow = Math.min(cols, totalItems - row * cols);
      const rowWidth = (itemsInRow - 1) * spacingX;

      for (let col = 0; col < itemsInRow; col++) {
        const item = itemsArray[i];
        item.x = col * spacingX - rowWidth / 2;
        item.y = row * spacingY;
        i++;
      }
    }

    this.gridContainer.x = centerX;
    this.gridContainer.y = 75; // More breathing room from the title

    // Lineup Layout (Lower section)
    this.lineupContainer.x = centerX;
    // Position lineup relative to the bottom, but above the Start button area
    this.lineupContainer.y = height - 70;
    this.repositionLineup();

    this.statusText.x = centerX;
    this.statusText.y = this.lineupContainer.y - 60;
    this.statusText.style.fontSize = 14;

    // Controls
    this.startBtn.scale.set(0.6);
    this.startBtn.x = width - grid.margin - 50;
    this.startBtn.y = height - 40;

    this.backBtn.scale.set(0.5);
    this.backBtn.x = grid.margin + 30;
    this.backBtn.y = 25;
  }
}
