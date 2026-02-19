import { Container, Graphics, TilingSprite, AnimatedSprite, Text, Texture } from "pixi.js";
import { ITEMS, TRACK, TRACK_COLORS, CANVAS } from "../../config";
import type { GroundTextures, GrassTextures } from "../../core";

export class TrackManager extends Container {
  private trackGraphics: Graphics;
  private groundContainer: Container;
  private grassContainer: Container;

  private topGrassMiddle: TilingSprite;
  private topGrassEdge: TilingSprite;
  private bottomGrassMiddle: TilingSprite;
  private bottomGrassEdge: TilingSprite;

  private middleGround: TilingSprite;
  private topEdge: TilingSprite;
  private bottomEdge: TilingSprite;

  private treeAnimation: Texture[];
  private grassTextures: GrassTextures;
  private groundTextures: GroundTextures;

  constructor(
    grassTextures: GrassTextures,
    groundTextures: GroundTextures,
    treeAnimation: Texture[],
  ) {
    super();
    this.grassTextures = grassTextures;
    this.groundTextures = groundTextures;
    this.treeAnimation = treeAnimation;

    this.grassContainer = new Container();
    this.addChild(this.grassContainer);
    this.topGrassMiddle = new TilingSprite({ texture: this.grassTextures.middle });
    this.topGrassEdge = new TilingSprite({ texture: this.grassTextures.bottom });
    this.bottomGrassMiddle = new TilingSprite({ texture: this.grassTextures.middle });
    this.bottomGrassEdge = new TilingSprite({ texture: this.grassTextures.top });
    this.grassContainer.addChild(
      this.topGrassMiddle,
      this.topGrassEdge,
      this.bottomGrassMiddle,
      this.bottomGrassEdge,
    );

    this.groundContainer = new Container();
    this.addChild(this.groundContainer);
    this.middleGround = new TilingSprite({ texture: this.groundTextures.middle });
    this.topEdge = new TilingSprite({
      texture: this.groundTextures.top,
      height: ITEMS.ground.unit,
    });
    this.bottomEdge = new TilingSprite({
      texture: this.groundTextures.bottom,
      height: ITEMS.ground.unit,
    });
    this.groundContainer.addChild(this.middleGround, this.topEdge, this.bottomEdge);

    this.trackGraphics = new Graphics();
    this.addChild(this.trackGraphics);
  }

  public setup(
    trackWidth: number,
    gameViewW: number,
    gameViewH: number,
    finishLineX: number,
    racerCount: number,
    distance: number,
  ) {
    const unit = ITEMS.ground.unit;
    const grassStripH = unit * 4;
    const dirtH = gameViewH - grassStripH * 2;
    const trackHeight = dirtH / racerCount;

    // Grass
    this.topGrassMiddle.width = trackWidth;
    this.topGrassMiddle.height = grassStripH - unit;
    this.topGrassMiddle.y = 0;
    this.topGrassEdge.width = trackWidth;
    this.topGrassEdge.height = unit;
    this.topGrassEdge.y = grassStripH - unit;
    this.bottomGrassEdge.width = trackWidth;
    this.bottomGrassEdge.height = unit;
    this.bottomGrassEdge.y = gameViewH - grassStripH;
    this.bottomGrassMiddle.width = trackWidth;
    this.bottomGrassMiddle.height = grassStripH - unit;
    this.bottomGrassMiddle.y = gameViewH - grassStripH + unit;

    // Dirt
    this.topEdge.width = trackWidth;
    this.topEdge.y = grassStripH;
    this.bottomEdge.width = trackWidth;
    this.bottomEdge.y = gameViewH - grassStripH - unit;
    this.middleGround.width = trackWidth;
    this.middleGround.height = dirtH - unit * 2;
    this.middleGround.y = grassStripH + unit;

    this.trackGraphics.clear();
    const { CREAM: colorLight, DARK_BROWN: colorDark, WARM_RED: colorRed } = TRACK_COLORS;

    // Dividers
    const dividerSize = 8;
    const dividerGap = 16;
    for (let i = 1; i < racerCount; i++) {
      const y = Math.floor(grassStripH + i * trackHeight - dividerSize / 2);
      for (let x = 0; x < trackWidth; x += dividerSize + dividerGap) {
        this.trackGraphics
          .roundRect(x, y, dividerSize, dividerSize, 2)
          .fill({ color: colorDark, alpha: 0.3 });
      }
    }

    // Start Line
    const startBlockSize = 16;
    for (let y = grassStripH; y <= gameViewH - grassStripH - startBlockSize; y += startBlockSize) {
      this.trackGraphics
        .roundRect(TRACK.START_LINE_X - startBlockSize, y, startBlockSize, startBlockSize, 4)
        .fill({ color: colorLight })
        .roundRect(TRACK.START_LINE_X, y, startBlockSize, startBlockSize, 4)
        .fill({ color: colorRed });
    }

    // Finish Line
    const finishBlockSize = 16;
    for (let col = 0; col < 2; col++) {
      const x = finishLineX + col * finishBlockSize;
      for (let row = 0; row * finishBlockSize <= dirtH - finishBlockSize; row++) {
        const y = grassStripH + row * finishBlockSize;
        const color = (row + col) % 2 === 0 ? colorLight : colorDark;
        this.trackGraphics.roundRect(x, y, finishBlockSize, finishBlockSize, 4).fill({ color });
      }
    }

    // Cleanup trees/markers
    this.children
      .filter(
        (c) =>
          (c instanceof Text && c.text.includes("m")) ||
          (c instanceof AnimatedSprite && c.label === "distance-tree"),
      )
      .forEach((c) => this.removeChild(c));

    // Markers & Trees
    const unitWidth = Math.max(gameViewW, CANVAS.MIN_UNIT_WIDTH);
    for (let m = 10; m <= distance; m += 10) {
      const x = TRACK.START_LINE_X + (m / 50) * unitWidth;
      [0, 1].forEach((top) => {
        const tree = new AnimatedSprite(this.treeAnimation);
        tree.label = "distance-tree";
        tree.anchor.set(0.5, top);
        tree.width = tree.height = ITEMS.tree.width;
        tree.x = x;
        tree.y = top
          ? (grassStripH - ITEMS.tree.height) / 2
          : gameViewH - (grassStripH - ITEMS.tree.height) / 2;
        tree.animationSpeed = 0.1;
        tree.play();
        this.addChild(tree);
      });
    }
  }

  public getTrackGraphics(): Graphics {
    return this.trackGraphics;
  }

  public getLaneRacerY(laneIndex: number, gameViewH: number, racerCount: number): number {
    const grassStripH = ITEMS.ground.unit * 4;
    const trackHeight = (gameViewH - grassStripH * 2) / racerCount;
    return grassStripH + (laneIndex + 0.5) * trackHeight;
  }

  public repositionRacers(racers: any[], gameViewH: number) {
    racers.forEach((r) => (r.y = this.getLaneRacerY(r.laneIndex, gameViewH, racers.length)));
  }
}
