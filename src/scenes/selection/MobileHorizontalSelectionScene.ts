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

    // ════════════════════════════════════════════════════════════
    // VERTICAL LAYOUT (top to bottom, every pixel accounted for)
    // ════════════════════════════════════════════════════════════
    //
    // Zone 1: BACK button + Title row         [0 → titleBottomY]
    // Zone 2: Character Grid (dynamically scaled) [titleBottomY → statusTopY]
    // Zone 3: Status Text                     [statusTopY → lineupTopY]
    // Zone 4: Lineup cards + START button     [lineupTopY → height]
    //
    // ────────────────────────────────────────────────────────────

    // ── Zone 1: Title + Back Button ──
    const titleFontSize = Math.min(20, height * 0.07);
    this.title.x = centerX;
    this.title.y = height * 0.06;
    this.title.style.fontSize = titleFontSize;

    const titleBottomY = this.title.y + titleFontSize / 2 + 6; // title center + half font + pad

    this.backBtn.scale.set(0.45);
    this.backBtn.x = grid.margin + 25;
    this.backBtn.y = this.title.y;

    // ── Zone 4 (from bottom): Lineup only (START is handled by popup) ──
    // Move startBtn off-screen (updateUI overrides visible=false)
    this.startBtn.x = -9999;
    this.startBtn.y = -9999;

    // Lineup cards draw UPWARD from their y. Each card is RACER.HEIGHT * lineupScale tall.
    const lineupScale = this.getLineupScale();
    const lineupCardH = RACER.HEIGHT * lineupScale;
    const lineupAnchorY = height - 12; // more room since no start button below
    const lineupTopY = lineupAnchorY - lineupCardH - 4;

    this.lineupContainer.x = centerX;
    this.lineupContainer.y = lineupAnchorY;
    this.repositionLineup();

    // ── Zone 3: Status Text ──
    const statusFontSize = Math.min(14, height * 0.05);
    const statusBottomY = lineupTopY - 2;
    const statusTopY = statusBottomY - statusFontSize - 4;

    this.statusText.x = centerX;
    this.statusText.y = statusBottomY - statusFontSize / 2;
    this.statusText.style.fontSize = statusFontSize;

    // ── Zone 2: Character Grid (fills remaining space) ──
    const gridTopPad = 4;
    const gridBotPad = 4;
    const availableGridH = statusTopY - titleBottomY - gridTopPad - gridBotPad;

    const cardHalf = 50;
    const cardSize = 100;
    const spacingX = cardSize + 12;
    const spacingY = cardSize + 8;
    const cols = 5;
    const totalItems = this.selectionSprites.size;
    const rows = Math.ceil(totalItems / cols);

    const rawGridH = (rows - 1) * spacingY + cardSize;

    const maxGridScale = 0.55;
    const fitScale = availableGridH / rawGridH;
    const gridScale = Math.min(maxGridScale, fitScale);
    this.gridContainer.scale.set(gridScale);

    const actualGridH = rawGridH * gridScale;

    const gridCenterY = titleBottomY + gridTopPad + (availableGridH - actualGridH) / 2;
    this.gridContainer.x = centerX;
    this.gridContainer.y = gridCenterY + cardHalf * gridScale;

    let i = 0;
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

    // ── Popup ──
    this.repositionPopup(width, height);
  }
}
