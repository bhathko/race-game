import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS } from "../../config";
import type { RaceContext } from "../../core";
import { getStandardGridConfig, createTrackLayout } from "../../core";

const LB_PADDING = 8;

export class MobileVerticalRaceScene extends BaseRaceScene {
  private lbH: number = 120;

  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = true;
    this.screenW = width;
    this.screenH = height;
    const grid = getStandardGridConfig(width);

    // Dynamic leaderboard height: use 2-row grid when many racers
    const availableW = width - 2 * grid.margin;
    const desiredCardW = 70;
    const fitsInOneRow = this.racers.length * (desiredCardW + 6) - 6 <= availableW;
    this.lbH = fitsInOneRow ? 120 : 160;

    this.gameViewH = height - this.lbH;
    this.gameViewW = width;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    const sidebarBg = this.uiManager.getSidebarBg();
    sidebarBg
      .clear()
      .rect(0, this.gameViewH, width, this.lbH)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    const lbContainer = this.uiManager.getLeaderboardContainer();
    lbContainer.x = grid.margin;
    lbContainer.y = this.gameViewH + LB_PADDING;

    const title = lbContainer.getChildByLabel("leaderboard-title");
    if (title) {
      title.visible = false;
    }

    const layout = createTrackLayout(
      this.gameViewW,
      this.gameViewH,
      this.racers.length,
      this.distance,
    );
    this.setupTracks(layout);
    this.fitRacersToLanes(layout, false, 0.5);
    this.updateLeaderboard(60);

    const countdown = this.uiManager.getCountdownText();
    if (countdown) {
      countdown.x = width / 2;
      countdown.y = this.gameViewH / 2;
    }

    // Keep the counter inside the top grass strip so it never covers a racer
    this.placeDistanceText(width / 2, 2, Math.min(44, layout.grassStripHeight * 0.72));
  }

  protected updateLeaderboard(delta: number) {
    const grid = getStandardGridConfig(this.screenW);
    const availableW = this.screenW - 2 * grid.margin;

    this.uiManager.updateLeaderboard(
      this.getLeaderboardOrder(),
      {
        direction: "horizontal",
        itemWidth: 70,
        // Cards must fit inside the bottom panel (minus top/bottom padding)
        itemHeight: this.lbH - LB_PADDING * 2,
        gap: 6,
        availableSpace: availableW,
        iconScale: 0.8,
        textX: 35,
        textAnchorX: 0.5,
        fontSize: 12,
        textFormat: (_, index) => (index + 1).toString(),
      },
      delta,
    );
  }
}
