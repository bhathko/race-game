import { BaseCharacterSelectionScene } from "./BaseCharacterSelectionScene";
import type { SelectionContext } from "../../core";

export class DesktopSelectionScene extends BaseCharacterSelectionScene {
  constructor(ctx: SelectionContext, initialSelectedKeys: string[] = []) {
    super(ctx, initialSelectedKeys);
  }
  protected getLineupScale(): number {
    return 1.5;
  }

  protected repositionLineup(): void {
    const spacing = 160;
    const totalWidth = (this.lineupSprites.length - 1) * spacing;
    this.lineupSprites.forEach((sprite, i) => {
      sprite.x = i * spacing - totalWidth / 2;
      sprite.y = 0;
    });
  }

  public resize(width: number, height: number): void {
    const centerX = width / 2;

    this.bg.clear().rect(0, 0, width, height).fill({ color: 0x81c784 }); // Nature green

    this.title.x = centerX;
    this.title.y = 60;
    this.title.style.fontSize = 48;

    this.lineupContainer.x = centerX;
    this.lineupContainer.y = height * 0.35;
    this.repositionLineup();

    this.statusText.x = centerX;
    this.statusText.y = this.lineupContainer.y + 100;
    this.statusText.style.fontSize = 24;

    const cols = 8;
    const spacingX = 110;
    const spacingY = 110;
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
    this.gridContainer.y = this.statusText.y + 80;
    this.gridContainer.scale.set(1.0);

    this.startBtn.x = centerX;
    this.startBtn.y = height - 60;
    this.startBtn.scale.set(1.0);

    this.backBtn.x = 80;
    this.backBtn.y = 40;
    this.backBtn.scale.set(1.0);
  }
}
