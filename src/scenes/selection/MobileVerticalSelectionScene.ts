import { BaseCharacterSelectionScene } from "./BaseCharacterSelectionScene";
import { RACER } from "../../config";
import type { SelectionContext } from "../../core";

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

    this.bg.clear().rect(0, 0, width, height).fill({ color: 0x81c784 });

    this.title.x = centerX;
    this.title.y = 80;
    this.title.style.fontSize = 22;

    this.lineupContainer.x = centerX;
    this.lineupContainer.y = height * 0.22;
    this.repositionLineup();

    const isTwoRowLineup = this.playerCount > 4;
    const lineupScale = this.getLineupScale();
    const cardVisualH = (RACER.HEIGHT + 15) * lineupScale;

    this.statusText.x = centerX;
    this.statusText.y = this.lineupContainer.y + (isTwoRowLineup ? cardVisualH * 2 + 40 : cardVisualH + 30);
    this.statusText.style.fontSize = 16;

    const gridScale = 0.7;
    this.gridContainer.scale.set(gridScale);
    const cardSize = 100;
    const spacingX = cardSize + 15;
    const spacingY = cardSize + 15;
    const cols = 3;
    const gridWidth = (Math.min(cols, this.selectionSprites.size) - 1) * spacingX;

    let i = 0;
    this.selectionSprites.forEach((item) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      item.x = col * spacingX - gridWidth / 2;
      item.y = row * spacingY;
      i++;
    });

    this.gridContainer.x = centerX;
    this.gridContainer.y = this.statusText.y + 55;

    this.startBtn.scale.set(0.7);
    this.startBtn.x = centerX;
    this.startBtn.y = height - 45;

    this.backBtn.scale.set(0.6);
    this.backBtn.x = 50;
    this.backBtn.y = 35;
  }
}
