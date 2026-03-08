import { Container, Graphics, Text, TextStyle, Sprite } from "pixi.js";
import { PALETTE, ITEMS } from "../config";
import type { RacerAnimations } from "../core";
import { LeaderboardList } from "./leaderboard/LeaderboardList";
import type { RankEntry } from "./leaderboard/types";

export type { RankEntry };

export class LeaderboardSidebar extends Container {
  private bg: Graphics;
  private list: LeaderboardList | null = null;
  private titleContainer: Container;
  private trophySprite: Sprite;
  private titleText: Text;

  private entries: RankEntry[];
  private sidebarW: number;
  private sidebarH: number;
  private animations: Map<string, RacerAnimations> | null;
  private showList = true;
  private listOffsetY = 70;

  constructor(
    entries: RankEntry[],
    width = 280,
    height = 520,
    animations: Map<string, RacerAnimations> | null = null,
  ) {
    super();
    this.entries = entries;
    this.sidebarW = width;
    this.sidebarH = height;
    this.animations = animations;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.titleContainer = new Container();
    this.addChild(this.titleContainer);

    this.trophySprite = Sprite.from(ITEMS.trophy.path);
    this.trophySprite.anchor.set(0.5);
    this.trophySprite.scale.set(1.5);
    this.titleContainer.addChild(this.trophySprite);

    this.titleText = new Text({
      text: "Ranking",
      style: new TextStyle({
        fill: PALETTE.STR_WHITE,
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: 2,
        stroke: { color: PALETTE.STR_BLACK, width: 6, join: "round" },
      }),
    });
    this.titleText.anchor.set(0, 0.5);
    this.titleContainer.addChild(this.titleText);

    this.refresh();
  }

  private refresh() {
    this.bg.clear();
    if (this.list) {
      this.list.destroy();
      this.list = null;
    }

    this.drawBackground();

    if (this.showList) {
      this.list = new LeaderboardList(this.entries, this.sidebarW, this.animations);
      this.addChild(this.list);
    }
    this.layout();
  }

  private drawBackground() {
    // Drop shadow
    this.bg
      .roundRect(4, 6, this.sidebarW, this.sidebarH, 16)
      .fill({ color: PALETTE.CHUNKY_SHADOW });
    this.bg
      .roundRect(4, 6, this.sidebarW, this.sidebarH, 16)
      .stroke({ color: PALETTE.STR_BLACK, width: 3, alpha: 0.5 });

    // Main paper-like background
    this.bg
      .roundRect(0, 0, this.sidebarW, this.sidebarH, 16)
      .fill({ color: 0xffffff, alpha: 0.85 });

    // Sketchy outlines
    this.bg
      .roundRect(0, 0, this.sidebarW, this.sidebarH, 16)
      .stroke({ color: PALETTE.STR_BLACK, width: 4, join: "round" });
    this.bg
      .roundRect(-1, 2, this.sidebarW + 2, this.sidebarH - 1, 16)
      .stroke({ color: PALETTE.STR_BLACK, width: 2, alpha: 0.5, join: "round" });
    this.bg
      .roundRect(2, -1, this.sidebarW - 3, this.sidebarH + 2, 16)
      .stroke({ color: PALETTE.STR_BLACK, width: 2, alpha: 0.3, join: "round" });
  }

  private layout() {
    const totalW = this.trophySprite.width * 1.5 + 10 + this.titleText.width;
    const startX = (this.sidebarW - totalW) / 2;
    this.trophySprite.x = startX + (this.trophySprite.width * 1.5) / 2;
    this.titleText.x = startX + this.trophySprite.width * 1.5 + 10;
    this.titleContainer.y = 35;

    if (this.list) {
      this.list.x = 18;
      this.list.y = this.listOffsetY;
    }
  }

  public setListOffsetY(y: number) {
    this.listOffsetY = y;
    this.layout();
  }

  public resize(w: number, h: number) {
    this.sidebarW = w;
    this.sidebarH = h;
    this.refresh();
  }
  public setEntries(e: RankEntry[]) {
    this.entries = e;
    this.refresh();
  }
  public setShowList(v: boolean) {
    this.showList = v;
    this.refresh();
  }
}
