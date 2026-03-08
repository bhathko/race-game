import { BaseRaceScene } from "./BaseRaceScene";
import type { RaceState } from "./BaseRaceScene";
import { COLORS, RACER } from "../../config";
import type { RaceContext } from "../../core";
import { createTrackLayout } from "../../core";

export class MobileHorizontalRaceScene extends BaseRaceScene {
  constructor(ctx: RaceContext, existingState?: RaceState) {
    super(ctx, existingState);
  }

  public resize(width: number, height: number) {
    this.isPortrait = false;

    // ── Sidebar dimensions (right side of screen) ──
    // Reserve ~30% of screen width for sidebar, rest for the track
    const sidebarW = Math.floor(width * 0.3);
    const sidebarPad = 6;

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

    const lbContainer = this.uiManager.getLeaderboardContainer();
    lbContainer.x = this.gameViewW + sidebarPad;
    lbContainer.y = 6;

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

    // Override grass strips for landscape — use minimal grass to maximize lane space
    const minGrass = 16; // 1 unit instead of 4
    if (layout.grassStripHeight > minGrass) {
      const savedSpace = (layout.grassStripHeight - minGrass) * 2;
      layout.grassStripHeight = minGrass;
      layout.dirtHeight += savedSpace;
      layout.laneHeight = layout.dirtHeight / this.racers.length;
    }

    this.setupTracks(layout);
    this.racers.forEach((r) => r.setMobileMode(true));

    // Scale racers to fit lanes, but enforce a minimum so they're always visible
    const targetRacerH = layout.laneHeight * 0.85;
    const minScale = 0.6;
    const idealScale = targetRacerH / RACER.HEIGHT;
    const racerScale = Math.max(minScale, Math.min(1, idealScale));
    this.racers.forEach((r) => r.scale.set(racerScale));

    // Manually center racers in their lanes (replaces repositionRacers)
    // Sprite anchor is (0.5, 1) = bottom-centered.
    // For visual center to align with lane center:
    //   racer.y = laneCenter + (spriteHeight * scale) / 2
    const visibleHalfH = (RACER.HEIGHT * racerScale) / 2;
    this.racers.forEach((r) => {
      const laneCenter = layout.grassStripHeight + (r.laneIndex + 0.5) * layout.laneHeight;
      r.y = laneCenter + visibleHalfH;
    });
    this.updateLeaderboard(60);

    const countdown = this.uiManager.getCountdownText();
    if (countdown) {
      countdown.x = this.gameViewW / 2;
      countdown.y = height / 2;
    }

    const distance = this.uiManager.getRemainingDistanceText();
    if (distance) {
      distance.x = this.gameViewW / 2;
      distance.y = 6;
      distance.style.fontSize = Math.min(36, height * 0.12);
      distance.style.stroke = { color: COLORS.TEXT_MARKER, width: Math.min(4, height * 0.014) };
    }
  }

  protected updateLeaderboard(delta: number) {
    // Actual available pixel width for the leaderboard
    const sidebarPad = 6;
    const usableW = this.width - this.gameViewW - sidebarPad * 2;
    const itemH = 40;

    this.uiManager.updateLeaderboard(
      this.racers,
      {
        direction: "vertical",
        itemWidth: usableW,
        itemHeight: itemH,
        gap: 3,
        availableSpace: this.height - 16,
        usePositionOrder: this.raceStarted,
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
