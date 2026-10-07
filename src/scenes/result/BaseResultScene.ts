import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { COLORS, PALETTE } from "../../config";
import { LeaderboardSidebar, createColorPencilButton } from "../../ui";
import { LeaderboardPodium } from "../../ui/leaderboard/LeaderboardPodium";
import {
  LIST_CARD_H,
  LIST_GAP,
  LIST_COLUMN_GAP,
  LIST_SIDE_PADDING,
} from "../../ui/leaderboard/LeaderboardList";
import type { RankEntry } from "../../ui";
import type { ResultContext } from "../../core";

/** Podium height above its baseline (pedestal + icon + name label). */
export const PODIUM_EXTENT = 180;
const MIN_PODIUM_SCALE = 0.8;
/** Narrowest list card that still fits "8th: The Turtle". */
const MIN_LIST_CARD_W = 170;
/** "Ranking" title area at the top of the panel. */
const PANEL_TITLE_H = 50;
const PODIUM_LIST_GAP = 15;
const PANEL_BOTTOM_PAD = 10;

export abstract class BaseResultScene extends Container {
  protected ctx: ResultContext;
  protected onRestart: () => void;
  protected bg: Graphics;
  protected winnerText: Text;
  protected podium: LeaderboardPodium;
  protected leaderboardSidebar: LeaderboardSidebar;
  protected restartBtn: Container;

  constructor(ctx: ResultContext) {
    super();
    this.ctx = ctx;
    this.onRestart = ctx.onRestart;

    this.bg = new Graphics();
    this.addChild(this.bg);

    const winner = ctx.finishedRacers[0];

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
    const entries: RankEntry[] = ctx.finishedRacers.map((racer, index) => ({
      rank: index + 1,
      name: racer.racerName,
      time: (racer.finishTime / 60).toFixed(2) + "s",
      character: racer.characterKey,
    }));

    // Create sidebar FIRST so its background renders behind the podium
    this.leaderboardSidebar = new LeaderboardSidebar(entries, 300, 480, ctx.characterAnimations);
    this.addChild(this.leaderboardSidebar);

    // Create podium AFTER sidebar so it renders ON TOP of the sidebar background
    this.podium = new LeaderboardPodium(entries, 400, ctx.characterAnimations);
    this.addChild(this.podium);

    this.restartBtn = createColorPencilButton({
      label: "BACK TO MENU",
      color: COLORS.BUTTON_PRIMARY,
      onClick: () => this.onRestart(),
      width: 320,
    });
    this.addChild(this.restartBtn);
  }

  public abstract resize(width: number, height: number): void;

  /** Number of places shown in the list below the podium (4th onwards). */
  protected get listEntryCount(): number {
    return Math.max(0, this.ctx.finishedRacers.length - 3);
  }

  /** Height of the 4th+ list laid out in the given number of columns. */
  protected listHeight(columns: number): number {
    const rows = Math.ceil(this.listEntryCount / columns);
    return rows * (LIST_CARD_H + LIST_GAP) - LIST_GAP;
  }

  /** Most list columns that fit in a panel of this width. */
  protected maxListColumns(panelW: number): number {
    return panelW - LIST_SIDE_PADDING >= MIN_LIST_CARD_W * 2 + LIST_COLUMN_GAP ? 2 : 1;
  }

  /**
   * Size the two-line "X WINS!" title from its measured height, centered at x,
   * starting at `top`. Returns its bottom edge.
   */
  protected layoutWinnerTitle(x: number, top: number, fontSize: number, strokeWidth: number) {
    this.winnerText.anchor.set(0.5);
    this.winnerText.style.align = "center";
    this.winnerText.style.fontSize = fontSize;
    this.winnerText.style.stroke = { color: 0x5d4037, width: strokeWidth };
    this.winnerText.x = x;
    this.winnerText.y = top + this.winnerText.height / 2;
    return top + this.winnerText.height;
  }

  /**
   * Podium stacked above the 4th+ list inside the ranking panel (desktop and portrait).
   * Tries one column, then two, then a slightly smaller podium; hides the list only as a last resort.
   */
  protected layoutStackedRanking(panelX: number, panelW: number, panelTop: number, panelH: number) {
    this.leaderboardSidebar.resize(panelW, panelH);
    this.leaderboardSidebar.x = panelX;
    this.leaderboardSidebar.y = panelTop;

    let columns = 0;
    let podiumScale = 1;
    if (this.listEntryCount > 0) {
      for (let cols = 1; cols <= this.maxListColumns(panelW); cols++) {
        const podiumRoom =
          panelH - PANEL_TITLE_H - PODIUM_LIST_GAP - this.listHeight(cols) - PANEL_BOTTOM_PAD;
        const scale = Math.min(1, podiumRoom / PODIUM_EXTENT);
        if (scale >= MIN_PODIUM_SCALE) {
          columns = cols;
          podiumScale = scale;
          break;
        }
      }
    }

    let podiumBaseY: number;
    if (columns > 0) {
      podiumBaseY = PANEL_TITLE_H + PODIUM_EXTENT * podiumScale;
      this.leaderboardSidebar.setListColumns(columns);
      this.leaderboardSidebar.setShowList(true);
      this.leaderboardSidebar.setListOffsetY(podiumBaseY + PODIUM_LIST_GAP);
    } else {
      // No room for the list: center the podium in the space below the title
      this.leaderboardSidebar.setShowList(false);
      const room = panelH - PANEL_TITLE_H - PANEL_BOTTOM_PAD;
      podiumScale = Math.max(MIN_PODIUM_SCALE, Math.min(1, room / PODIUM_EXTENT));
      const extent = PODIUM_EXTENT * podiumScale;
      podiumBaseY = PANEL_TITLE_H + Math.max(0, (room - extent) / 2) + extent;
    }

    this.podium.resize(panelW);
    this.podium.scale.set(podiumScale);
    this.podium.x = panelX + (panelW * (1 - podiumScale)) / 2;
    this.podium.y = panelTop + podiumBaseY;
  }

  update(delta: number) {
    if (this.podium) {
      this.podium.update(delta);
    }
  }
}
