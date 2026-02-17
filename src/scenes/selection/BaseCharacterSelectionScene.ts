import { Container, Graphics, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { CHARACTERS, COLORS, RACER, PALETTE } from "../../config";
import { createWoodenButton } from "../../ui/WoodenButton";
import type { RacerAnimations } from "../../core/types";
import type { Scene } from "../../core/Scene";

/**
 * Base class for Character Selection scenes.
 * Handles selection state, core interactions, and shared UI components.
 * Subclasses should override resize() to build their unique layout.
 */
export abstract class BaseCharacterSelectionScene extends Container implements Scene {
  protected playerCount: number;
  protected distance: number;
  protected characterAnimations: Map<string, RacerAnimations>;
  protected onStartRace: (characterKeys: string[], distance: number) => void;
  protected onBack: () => void;

  public selectedKeys: string[] = [];

  protected bg: Graphics;
  protected title: Text;
  protected gridContainer: Container;
  protected lineupContainer: Container;
  protected startBtn: Container;
  protected backBtn: Container;
  protected statusText: Text;

  protected selectionSprites: Map<string, Container> = new Map();
  protected lineupSprites: Container[] = [];

  constructor(
    playerCount: number,
    distance: number,
    characterAnimations: Map<string, RacerAnimations>,
    onStartRace: (characterKeys: string[], distance: number) => void,
    onBack: () => void,
    initialSelectedKeys: string[] = []
  ) {
    super();
    this.playerCount = playerCount;
    this.distance = distance;
    this.characterAnimations = characterAnimations;
    this.onStartRace = onStartRace;
    this.onBack = onBack;
    this.selectedKeys = [...initialSelectedKeys];

    this.bg = new Graphics();
    this.addChild(this.bg);

    const titleStyle = new TextStyle({
      fill: PALETTE.STR_WHITE,
      fontSize: 48,
      fontWeight: "900",
      stroke: { color: COLORS.SIDEBAR_WOOD, width: 6 },
      dropShadow: {
        alpha: 0.5,
        angle: Math.PI / 4,
        blur: 4,
        color: PALETTE.STR_BLACK,
        distance: 4,
      },
    });
    this.title = new Text({ text: "CHOOSE YOUR RACERS", style: titleStyle });
    this.title.anchor.set(0.5);
    this.addChild(this.title);

    this.statusText = new Text({
      text: `Select ${this.playerCount} racers`,
      style: new TextStyle({
        fill: PALETTE.STR_WHITE,
        fontSize: 24,
        fontWeight: "bold",
        stroke: { color: PALETTE.STR_BLACK, width: 4 },
      }),
    });
    this.statusText.anchor.set(0.5);
    this.addChild(this.statusText);

    this.gridContainer = new Container();
    this.addChild(this.gridContainer);

    this.lineupContainer = new Container();
    this.addChild(this.lineupContainer);

    this.createCharacterGrid();

    this.startBtn = createWoodenButton({
      label: "START RACE!",
      color: COLORS.BUTTON_SUCCESS,
      onClick: () => this.handleStart(),
      width: 240,
    });
    this.startBtn.visible = false;
    this.addChild(this.startBtn);

    this.backBtn = createWoodenButton({
      label: "BACK",
      color: COLORS.BUTTON_DANGER,
      onClick: () => this.onBack(),
      width: 120,
      fontSize: 20,
    });
    this.addChild(this.backBtn);

    // Initial state refresh
    this.updateUI();
  }

  private createCharacterGrid() {
    const keys = Object.keys(CHARACTERS);
    keys.forEach((key) => {
      const charData = CHARACTERS[key as keyof typeof CHARACTERS];
      const anims = this.characterAnimations.get(key)!;

      const item = new Container();
      item.eventMode = "static";
      item.cursor = "pointer";

      const bg = new Graphics();
      bg.roundRect(-50, -50, 100, 100, 10)
        .fill({ color: PALETTE.BLACK, alpha: 0.3 })
        .stroke({ color: PALETTE.WHITE, width: 2, alpha: 0.5 });
      item.addChild(bg);

      const sprite = new AnimatedSprite(anims.idle);
      sprite.anchor.set(0.5);
      sprite.width = 70;
      sprite.height = 70;
      sprite.animationSpeed = 0.1;
      sprite.play();
      item.addChild(sprite);

      const nameText = new Text({
        text: charData.name,
        style: new TextStyle({
          fill: PALETTE.STR_WHITE,
          fontSize: 14,
          fontWeight: "bold",
        }),
      });
      nameText.anchor.set(0.5);
      nameText.y = 40;
      item.addChild(nameText);

      item.on("pointerdown", () => this.toggleSelection(key));

      this.gridContainer.addChild(item);
      this.selectionSprites.set(key, item);
    });
  }

  protected toggleSelection(key: string) {
    const index = this.selectedKeys.indexOf(key);
    if (index !== -1) {
      this.selectedKeys.splice(index, 1);
    } else {
      if (this.selectedKeys.length < this.playerCount) {
        this.selectedKeys.push(key);
      } else {
        return;
      }
    }
    this.updateUI();
  }

  public updateUI() {
    // Update Grid visuals (Shared logic)
    this.selectionSprites.forEach((item, key) => {
      const bg = item.children[0] as Graphics;
      const isSelected = this.selectedKeys.includes(key);
      bg.clear();

      const bgColor = isSelected ? PALETTE.WOOD_LIGHT : PALETTE.WOOD_DARK;
      const strokeColor = isSelected ? PALETTE.WHITE : PALETTE.WOOD_PALE;
      const strokeWidth = isSelected ? 4 : 2;

      bg.roundRect(-50, -50, 100, 100, 12)
        .fill({ color: bgColor, alpha: 0.9 })
        .stroke({
          color: strokeColor,
          width: strokeWidth,
          alpha: isSelected ? 1 : 0.5,
        });

      const sprite = item.children[1] as AnimatedSprite;
      const targetSize = isSelected ? 80 : 70;
      sprite.width = targetSize;
      sprite.height = targetSize;
    });

    // Update Lineup (Children recreation)
    this.lineupContainer.removeChildren();
    this.lineupSprites = [];

    const lineupScale = this.getLineupScale();

    for (let i = 0; i < this.playerCount; i++) {
      const racerContainer = new Container();
      const key = this.selectedKeys[i];
      racerContainer.scale.set(lineupScale);

      if (key) {
        racerContainer.eventMode = "static";
        racerContainer.cursor = "pointer";
        racerContainer.on("pointerdown", () => this.toggleSelection(key));

        const anims = this.characterAnimations.get(key)!;
        const card = new Graphics();
        card
          .roundRect(-RACER.WIDTH/2-5, -RACER.HEIGHT-5, RACER.WIDTH+10, RACER.HEIGHT+15, 8)
          .fill({ color: COLORS.SIDEBAR_BG, alpha: 0.9 })
          .stroke({ color: PALETTE.WHITE, width: 2, alpha: 0.5 });
        racerContainer.addChild(card);

        const sprite = new AnimatedSprite(anims.idle);
        sprite.anchor.set(0.5, 1);
        sprite.width = RACER.WIDTH;
        sprite.height = RACER.HEIGHT;
        sprite.animationSpeed = 0.1;
        sprite.play();
        racerContainer.addChild(sprite);
      } else {
        const box = new Graphics();
        box
          .roundRect(-RACER.WIDTH/2, -RACER.HEIGHT, RACER.WIDTH, RACER.HEIGHT, 8)
          .fill({ color: PALETTE.WOOD_DARK, alpha: 0.6 })
          .stroke({ color: PALETTE.WOOD_PALE, width: 2, alpha: 0.5 });
        racerContainer.addChild(box);

        const posText = new Text({
          text: (i + 1).toString(),
          style: new TextStyle({ fill: PALETTE.STR_WHITE, fontSize: 24, fontWeight: "bold" }),
        });
        posText.alpha = 0.3;
        posText.anchor.set(0.5);
        posText.y = -RACER.HEIGHT / 2;
        racerContainer.addChild(posText);
      }

      this.lineupContainer.addChild(racerContainer);
      this.lineupSprites.push(racerContainer);
    }

    const remaining = this.playerCount - this.selectedKeys.length;
    if (remaining > 0) {
      this.statusText.text = `Select ${remaining} more racer${remaining > 1 ? "s" : ""}`;
      this.startBtn.visible = false;
    } else {
      this.statusText.text = `Ready to race!`;
      this.startBtn.visible = true;
    }

    this.repositionLineup();
  }

  protected abstract getLineupScale(): number;
  protected abstract repositionLineup(): void;
  public abstract resize(width: number, height: number): void;

  protected handleStart() {
    if (this.selectedKeys.length === this.playerCount) {
      this.onStartRace(this.selectedKeys, this.distance);
    }
  }

  update(_delta: number) {}
}
