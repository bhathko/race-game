import { Container, Graphics, TilingSprite, AnimatedSprite, Text, Texture } from "pixi.js";
import { ITEMS, TRACK, TRACK_COLORS, CANVAS, RACER } from "../../config";
import type { GroundTextures, GrassTextures, TrackLayoutData } from "../../core";

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
  public layout: TrackLayoutData | null = null;

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

  public setup(layout: TrackLayoutData) {
    this.layout = layout;
    const {
      trackWidth,
      viewWidth,
      viewHeight,
      distance,
      racerCount,
      finishLineX,
      grassStripHeight,
      dirtHeight,
      laneHeight,
    } = layout;
    const unit = ITEMS.ground.unit;

    // Grass
    this.topGrassMiddle.width = trackWidth;
    this.topGrassMiddle.height = grassStripHeight - unit;
    this.topGrassMiddle.y = 0;
    this.topGrassEdge.width = trackWidth;
    this.topGrassEdge.height = unit;
    this.topGrassEdge.y = grassStripHeight - unit;
    this.bottomGrassEdge.width = trackWidth;
    this.bottomGrassEdge.height = unit;
    this.bottomGrassEdge.y = viewHeight - grassStripHeight;
    this.bottomGrassMiddle.width = trackWidth;
    this.bottomGrassMiddle.height = grassStripHeight - unit;
    this.bottomGrassMiddle.y = viewHeight - grassStripHeight + unit;

    // Dirt
    this.topEdge.width = trackWidth;
    this.topEdge.y = grassStripHeight;
    this.bottomEdge.width = trackWidth;
    this.bottomEdge.y = viewHeight - grassStripHeight - unit;
    this.middleGround.width = trackWidth;
    this.middleGround.height = dirtHeight - unit * 2;
    this.middleGround.y = grassStripHeight + unit;

    this.trackGraphics.clear();
    const { CREAM: colorLight, DARK_BROWN: colorDark, WARM_RED: colorRed } = TRACK_COLORS;

    // Dividers
    const dividerSize = 8;
    const dividerGap = 16;
    for (let i = 1; i < racerCount; i++) {
      const y = Math.floor(grassStripHeight + i * laneHeight - dividerSize / 2);
      for (let x = 0; x < trackWidth; x += dividerSize + dividerGap) {
        this.trackGraphics
          .roundRect(x, y, dividerSize, dividerSize, 2)
          .fill({ color: colorDark, alpha: 0.3 });
      }
    }

    // Start Line
    const startBlockSize = 16;
    for (
      let y = grassStripHeight;
      y <= viewHeight - grassStripHeight - startBlockSize;
      y += startBlockSize
    ) {
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
      for (let row = 0; row * finishBlockSize <= dirtHeight - finishBlockSize; row++) {
        const y = grassStripHeight + row * finishBlockSize;
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
    const unitWidth = Math.max(viewWidth, CANVAS.MIN_UNIT_WIDTH);
    const treeSize = Math.min(ITEMS.tree.width, grassStripHeight * 0.85);
    for (let m = 10; m <= distance; m += 10) {
      const x = TRACK.START_LINE_X + (m / 50) * unitWidth;
      [true, false].forEach((isTop) => {
        const tree = new AnimatedSprite(this.treeAnimation);
        tree.label = "distance-tree";
        tree.anchor.set(0.5, 1);
        tree.width = tree.height = treeSize;
        tree.x = x;
        tree.y = isTop ? grassStripHeight : viewHeight - grassStripHeight + treeSize;
        tree.animationSpeed = 0.1;
        tree.play();
        this.addChild(tree);
      });
    }
  }

  public getTrackGraphics(): Graphics {
    return this.trackGraphics;
  }

  public getLaneHeight(): number {
    if (!this.layout) return 0;
    return this.layout.laneHeight;
  }

  /** Visual lane center Y — for centered objects like holes. */
  public getLaneCenterY(laneIndex: number): number {
    if (!this.layout) return 0;
    return this.layout.grassStripHeight + (laneIndex + 0.5) * this.layout.laneHeight;
  }

  /** Racer anchor Y — includes Y_OFFSET for bottom-anchored sprites. */
  public getLaneRacerY(laneIndex: number): number {
    if (!this.layout) return 0;
    const yOffset = Math.min(RACER.Y_OFFSET, this.layout.laneHeight * 0.5);
    return this.layout.grassStripHeight + (laneIndex + 0.5) * this.layout.laneHeight + yOffset;
  }

  public getNearestLaneIndex(localY: number): number | null {
    if (!this.layout) return null;
    if (
      localY < this.layout.grassStripHeight ||
      localY > this.layout.viewHeight - this.layout.grassStripHeight
    )
      return null;
    let minDist = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < this.layout.racerCount; i++) {
      const laneCenterY = this.layout.grassStripHeight + (i + 0.5) * this.layout.laneHeight;
      const dist = Math.abs(localY - laneCenterY);
      if (dist < minDist) {
        minDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  public repositionRacers(racers: { laneIndex: number; y: number }[]) {
    if (!this.layout) return;
    racers.forEach((r) => (r.y = this.getLaneRacerY(r.laneIndex)));
  }
}
