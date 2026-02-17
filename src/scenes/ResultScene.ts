import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Racer } from "../entities/Racer";
import { COLORS, PALETTE } from "../config";
import { LeaderboardSidebar } from "../ui/LeaderboardSidebar";
import type { RankEntry } from "../ui/LeaderboardSidebar";
import { createWoodenButton } from "../ui/WoodenButton";
import type { RacerAnimations } from "../core/types";

export class ResultScene extends Container {
  private onRestart: () => void;
  private bg: Graphics;
  private winnerText: Text;
  private leaderboardSidebar: LeaderboardSidebar;
  private restartBtn: Container;

  constructor(
    finishedRacers: Racer[],
    onRestart: () => void,
    characterAnimations: Map<string, RacerAnimations>,
  ) {
    super();
    this.onRestart = onRestart;

    this.bg = new Graphics();
    this.addChild(this.bg);

    const winner = finishedRacers[0];

    const titleStyle = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 56,
      fontWeight: "900",
      fontFamily: '"Fredoka One", "Comic Sans MS", "Segoe UI", sans-serif',
      stroke: { color: COLORS.SIDEBAR_WOOD, width: 8 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        color: PALETTE.STR_BLACK,
        distance: 8,
      },
      align: "center",
    });

    this.winnerText = new Text({
      text: `${winner.racerName}\nWINS!`,
      style: titleStyle,
    });
    this.winnerText.anchor.set(0.5);
    this.addChild(this.winnerText);

    // Build entries from finished racers
    const entries: RankEntry[] = finishedRacers.map((racer, index) => ({
      rank: index + 1,
      name: racer.racerName,
      time: (racer.finishTime / 60).toFixed(2) + "s",
      character: racer.characterKey,
    }));

    this.leaderboardSidebar = new LeaderboardSidebar(
      entries,
      300,
      480,
      characterAnimations,
    );
    this.addChild(this.leaderboardSidebar);

    this.restartBtn = createWoodenButton({
      label: "BACK TO MENU",
      color: COLORS.BUTTON_PRIMARY,
      onClick: () => this.onRestart(),
      width: 320,
    });
    this.addChild(this.restartBtn);
  }

  public resize(width: number, height: number) {
    const centerX = width / 2;
    const isSmall = width < 600 || height < 500;

    // Draw solid background
    this.bg.clear().rect(0, 0, width, height).fill({ color: PALETTE.GRASS_LIGHT });

    this.winnerText.x = centerX;
    this.winnerText.y = height * 0.12;
    this.winnerText.style.fontSize = isSmall ? 36 : 56;

    // Position sidebar leaderboard — scale height to fit all entries
    const sidebarW = isSmall ? 240 : 300;
    const btnH = 60;
    const btnPad = 14; // gap between sidebar bottom and button
    const bottomMargin = 12; // gap below button to screen edge
    const topSpace = height * 0.22; // space above sidebar (title area)
    const maxSidebarH = height - topSpace - btnH - btnPad - bottomMargin;
    const sidebarH = Math.max(200, Math.min(maxSidebarH, 700));
    this.leaderboardSidebar.resize(sidebarW, sidebarH);
    this.leaderboardSidebar.x = centerX - sidebarW / 2;
    this.leaderboardSidebar.y = topSpace;

    // Place button just below the sidebar
    this.restartBtn.x = centerX;
    this.restartBtn.y = topSpace + sidebarH + btnPad + btnH / 2;

    if (isSmall) {
      this.restartBtn.scale.set(0.7);
    } else {
      this.restartBtn.scale.set(1.0);
    }
  }

  update(delta: number) {
    this.leaderboardSidebar.update(delta);
  }
}
