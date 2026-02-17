import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { Racer } from "../../entities/Racer";
import { COLORS, PALETTE } from "../../config";
import { LeaderboardSidebar } from "../../ui/LeaderboardSidebar";
import type { RankEntry } from "../../ui/LeaderboardSidebar";
import { createWoodenButton } from "../../ui/WoodenButton";
import type { RacerAnimations } from "../../core/types";

export abstract class BaseResultScene extends Container {
  protected onRestart: () => void;
  protected bg: Graphics;
  protected winnerText: Text;
  protected leaderboardSidebar: LeaderboardSidebar;
  protected restartBtn: Container;

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
      text: `${winner.racerName}
WINS!`,
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

  public abstract resize(width: number, height: number): void;

  update(delta: number) {
    this.leaderboardSidebar.update(delta);
  }
}
