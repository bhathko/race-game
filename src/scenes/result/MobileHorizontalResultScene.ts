import { BaseResultScene } from "./BaseResultScene";
import { UI } from "../../config";
import type { ResultContext } from "../../core";
import { getGridRect, getStandardGridConfig } from "../../core";

const PANEL_MARGIN = 20;
const LIST_START_Y = 70;

export class MobileHorizontalResultScene extends BaseResultScene {
  constructor(ctx: ResultContext) {
    super(ctx);
  }
  public resize(width: number, height: number) {
    const grid = getStandardGridConfig(width);
    const leftRect = getGridRect(0, 6, grid);
    const rightRect = getGridRect(6, 6, grid);

    this.bg.clear().rect(0, 0, width, height).fill({ color: UI.BG });

    const sidebarH = height - PANEL_MARGIN * 2;

    // Places 4+ go in the right-hand panel: one column, or two if the panel is wide enough
    const availableListH = sidebarH - LIST_START_Y - 10;
    let columns = 0;
    if (this.listEntryCount > 0) {
      for (let cols = 1; cols <= this.maxListColumns(rightRect.width); cols++) {
        if (this.listHeight(cols) <= availableListH) {
          columns = cols;
          break;
        }
      }
    }
    const canFitList = columns > 0;
    this.leaderboardSidebar.visible = canFitList;

    // Split layout: winner + podium on the left, list on the right. Otherwise everything centered.
    const columnX = canFitList ? leftRect.x + leftRect.width / 2 : width / 2;
    const columnW = canFitList ? leftRect.width : width;

    this.layoutWinnerTitle(columnX, 8, Math.min(canFitList ? 32 : 36, height * 0.09));

    const podiumScale = canFitList ? 0.75 : 0.85;
    const podiumW = Math.min(columnW * (canFitList ? 0.9 : 0.7), canFitList ? 280 : 400);
    this.podium.resize(podiumW);
    this.podium.scale.set(podiumScale);
    this.podium.x = columnX - (podiumW * podiumScale) / 2;
    this.podium.y = height * 0.78;

    if (canFitList) {
      this.leaderboardSidebar.resize(rightRect.width, sidebarH);
      this.leaderboardSidebar.x = rightRect.x;
      this.leaderboardSidebar.y = PANEL_MARGIN;
      this.leaderboardSidebar.setListColumns(columns);
      this.leaderboardSidebar.setShowList(true);
      this.leaderboardSidebar.setListOffsetY(LIST_START_Y);
    }

    this.restartBtn.x = columnX;
    this.restartBtn.y = height * 0.9;
    this.restartBtn.scale.set(0.6);
  }
}
