import { Container, Graphics, Text, Sprite } from "pixi.js";
import { ITEMS, UI } from "../config";
import { textStyle } from "./TextStyles";
import type { RacerAnimations } from "../core";
import { LeaderboardList } from "./leaderboard/LeaderboardList";
import type { RankEntry } from "./leaderboard/types";

export type { RankEntry };

/** Height of the header area holding the "Ranking" title (divider line below it). */
const HEADER_H = 58;
const PANEL_RADIUS = 24;

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
  private listColumns = 1;

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
    this.trophySprite.scale.set(1.4);
    this.titleContainer.addChild(this.trophySprite);

    this.titleText = new Text({ text: "Ranking", style: textStyle("heading", 28) });
    this.titleText.anchor.set(0, 0.5);
    this.titleContainer.addChild(this.titleText);

    this.refresh();
  }

  private refresh() {
    this.bg.clear();
    if (this.list) {
      this.list.destroy({ children: true });
      this.list = null;
    }

    this.drawBackground();

    if (this.showList) {
      this.list = new LeaderboardList(
        this.entries,
        this.sidebarW,
        this.animations,
        this.listColumns,
      );
      this.addChild(this.list);
    }
    this.layout();
  }

  private drawBackground() {
    const w = this.sidebarW;
    const h = this.sidebarH;
    // Soft shadow
    for (let i = 4; i >= 1; i--) {
      this.bg
        .roundRect(-i, i * 1.5, w + i * 2, h + i, PANEL_RADIUS + i)
        .fill({ color: UI.SHADOW, alpha: 0.04 });
    }
    this.bg
      .roundRect(0, 0, w, h, PANEL_RADIUS)
      .fill({ color: UI.SURFACE })
      .stroke({ color: UI.LINE, width: 2 })
      // Divider under the header
      .rect(20, HEADER_H, w - 40, 2)
      .fill({ color: UI.LINE });
  }

  private layout() {
    const totalW = this.trophySprite.width * 1.5 + 10 + this.titleText.width;
    const startX = (this.sidebarW - totalW) / 2;
    this.trophySprite.x = startX + (this.trophySprite.width * 1.5) / 2;
    this.titleText.x = startX + this.trophySprite.width * 1.5 + 10;
    this.titleContainer.y = HEADER_H / 2;

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
  public setListColumns(columns: number) {
    this.listColumns = Math.max(1, columns);
    this.refresh();
  }
}
