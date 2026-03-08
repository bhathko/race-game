import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS } from "../../config";
import type { RaceContext } from "../../core";
import { getStandardGridConfig, createTrackLayout } from "../../core";

export class MobileVerticalRaceScene extends BaseRaceScene {
  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = true;
    const grid = getStandardGridConfig(width);
    const lbH = 120;
    this.gameViewH = height - lbH;
    this.gameViewW = width;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    const sidebarBg = this.uiManager.getSidebarBg();
    sidebarBg
      .clear()
      .rect(0, this.gameViewH, width, lbH)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    const lbContainer = this.uiManager.getLeaderboardContainer();
    lbContainer.x = grid.margin;
    lbContainer.y = this.gameViewH + 10;

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
    this.racers.forEach((r) => r.setMobileMode(true));
    this.trackManager.repositionRacers(this.racers);
    this.updateLeaderboard(60);

    const countdown = this.uiManager.getCountdownText();
    if (countdown) {
      countdown.x = width / 2;
      countdown.y = this.gameViewH / 2;
    }

    const distance = this.uiManager.getRemainingDistanceText();
    if (distance) {
      distance.x = width / 2;
      distance.y = 10;
    }
  }

  protected updateLeaderboard(delta: number) {
    const grid = getStandardGridConfig(this.width);
    const itemW = (this.width - 2 * grid.margin) / this.racers.length;

    this.uiManager.updateLeaderboard(
      this.racers,
      {
        direction: "horizontal",
        itemWidth: itemW,
        itemHeight: 100,
        iconScale: 0.8,
        textX: (itemW - 5) / 2,
        textAnchorX: 0.5,
        fontSize: 12,
        textFormat: (_, index) => (index + 1).toString(),
      },
      delta,
    );
  }
}
