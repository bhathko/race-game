import { Container, Graphics, Text, TextStyle, Sprite } from "pixi.js";
import { PALETTE, ITEMS } from "../config";
import type { RacerAnimations } from "../core";
import { LeaderboardPodium } from "./leaderboard/LeaderboardPodium";
import { LeaderboardList } from "./leaderboard/LeaderboardList";
import type { RankEntry } from "./leaderboard/types";

export type { RankEntry };

export class LeaderboardSidebar extends Container {
  private bg: Graphics;
  private podium: LeaderboardPodium | null = null;
  private list: LeaderboardList | null = null;
  private titleContainer: Container;
  private trophySprite: Sprite;
  private titleText: Text;

  private entries: RankEntry[];
  private sidebarW: number;
  private sidebarH: number;
  private animations: Map<string, RacerAnimations> | null;
  private showList = true;
  private elapsed = 0;

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
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: 2,
        stroke: { color: PALETTE.STR_WOOD_MID, width: 5 },
      }),
    });
    this.titleText.anchor.set(0, 0.5);
    this.titleContainer.addChild(this.titleText);

    this.refresh();
  }

  private refresh() {
    this.bg.clear();
    if (this.podium) {
      this.podium.destroy();
      this.podium = null;
    }
    if (this.list) {
      this.list.destroy();
      this.list = null;
    }

    this.drawBackground();
    this.podium = new LeaderboardPodium(this.entries, this.sidebarW, this.animations);
    this.addChild(this.podium);

    if (this.showList) {
      this.list = new LeaderboardList(this.entries, this.sidebarW, this.animations);
      this.addChild(this.list);
    }
    this.layout();
  }

  private drawBackground() {
    this.bg.roundRect(4, 6, this.sidebarW, this.sidebarH, 18).fill({ color: 0, alpha: 0.35 });
    this.bg
      .roundRect(0, 0, this.sidebarW, this.sidebarH, 18)
      .fill({ color: PALETTE.WOOD_MID, alpha: 0.92 });
    [65, 138, 215, 298, 380, 446].forEach((py) => {
      if (py < this.sidebarH - 10)
        this.bg
          .roundRect(10, py, this.sidebarW - 20, 2, 1)
          .fill({ color: PALETTE.WOOD_DARK, alpha: 0.55 });
    });
    this.bg
      .roundRect(0, 0, this.sidebarW, this.sidebarH, 18)
      .stroke({ color: PALETTE.WOOD_PALE, width: 3.5 });
  }

  private layout() {
    const totalW = this.trophySprite.width * 1.5 + 10 + this.titleText.width;
    const startX = (this.sidebarW - totalW) / 2;
    this.trophySprite.x = startX + (this.trophySprite.width * 1.5) / 2;
    this.titleText.x = startX + this.trophySprite.width * 1.5 + 10;
    this.titleContainer.y = 35;

    if (this.podium) {
      this.podium.x = 20;
      this.podium.y = this.showList ? 70 : (this.sidebarH - 70) / 2 + 40;
    }
    if (this.list) {
      this.list.x = 18;
      this.list.y = 250;
    }
  }

  update(delta: number) {
    this.elapsed += delta;
    if (this.podium) {
      const alpha = 0.12 + Math.sin(this.elapsed * 0.06) * 0.06;
      this.podium.glowGraphics.forEach((g) => (g.alpha = alpha / 0.15));
    }
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
