import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS } from "../../config";
import type { RaceContext } from "../../core";
import { createTrackLayout } from "../../core";

const SIDEBAR_PAD = 6;
const MAX_ITEM_H = 40;
const MIN_ITEM_H = 30;
/** Landscape uses a single grass unit top and bottom to maximize lane space. */
const LANDSCAPE_GRASS_UNITS = 1;

export class MobileHorizontalRaceScene extends BaseRaceScene {
  private lbTop: number = SIDEBAR_PAD;

  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = false;
    this.screenW = width;
    this.screenH = height;

    // ── Sidebar dimensions (right side of screen) ──
    // Reserve ~30% of screen width for sidebar, rest for the track
    const sidebarW = Math.floor(width * 0.3);

    this.gameViewW = width - sidebarW;
    this.gameViewH = height;

    this.worldMask
      .clear()
      .rect(0, 0, this.gameViewW, this.gameViewH)
      .fill({ color: COLORS.MASK_FILL });

    const sidebarBg = this.uiManager.getSidebarBg();
    sidebarBg
      .clear()
      .rect(this.gameViewW, 0, sidebarW, height)
      .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.95 });

    // The grass strips are too thin for the distance counter here, so it heads the sidebar
    const distanceFont = Math.min(28, height * 0.08);
    this.placeDistanceText(this.gameViewW + sidebarW / 2, SIDEBAR_PAD, distanceFont);
    this.lbTop = SIDEBAR_PAD + distanceFont * 1.3 + SIDEBAR_PAD;

    const lbContainer = this.uiManager.getLeaderboardContainer();
    lbContainer.x = this.gameViewW + SIDEBAR_PAD;
    lbContainer.y = this.lbTop;

    const title = lbContainer.getChildByLabel("leaderboard-title");
    if (title) {
      title.visible = false;
    }

    const layout = createTrackLayout(
      this.gameViewW,
      this.gameViewH,
      this.racers.length,
      this.distance,
      LANDSCAPE_GRASS_UNITS,
    );
    this.setupTracks(layout);
    this.fitRacersToLanes(layout, false, 0.6);
    this.updateLeaderboard(60);

    const countdown = this.uiManager.getCountdownText();
    if (countdown) {
      countdown.x = this.gameViewW / 2;
      countdown.y = height / 2;
    }
  }

  protected updateLeaderboard(delta: number) {
    // Actual available pixel width for the leaderboard
    const usableW = this.screenW - this.gameViewW - SIDEBAR_PAD * 2;
    const gap = 3;
    const availableSpace = this.screenH - this.lbTop - SIDEBAR_PAD;
    // Shrink cards a little to keep a single column; only very short screens fall back to two
    const fitH = Math.floor((availableSpace + gap) / Math.max(1, this.racers.length) - gap);
    const itemH = Math.max(MIN_ITEM_H, Math.min(MAX_ITEM_H, fitH));

    this.uiManager.updateLeaderboard(
      this.getLeaderboardOrder(),
      {
        direction: "vertical",
        itemWidth: usableW,
        itemHeight: itemH,
        gap,
        availableSpace,
        iconScale: 0.55,
        textX: 35,
        textAnchorX: 0,
        fontSize: 10,
        textFormat: (racer, index) => `${index + 1}: ${racer.racerName.split(" ").pop()}`,
      },
      delta,
    );
  }
}
