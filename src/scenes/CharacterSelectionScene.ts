import { Container, Graphics, Text, TextStyle, AnimatedSprite } from "pixi.js";
import { CHARACTERS, COLORS, RACER, PALETTE } from "../config";
import { createWoodenButton } from "../ui/WoodenButton";
import type { RacerAnimations } from "../core/types";
import type { Scene } from "../core/Scene";

export class CharacterSelectionScene extends Container implements Scene {
  private playerCount: number;
  private distance: number;
  private characterAnimations: Map<string, RacerAnimations>;
  private onStartRace: (characterKeys: string[], distance: number) => void;
  private onBack: () => void;

  private selectedKeys: string[] = [];
  
  private bg: Graphics;
  private title: Text;
  private gridContainer: Container;
  private lineupContainer: Container;
  private startBtn: Container;
  private backBtn: Container;
  private statusText: Text;

  private selectionSprites: Map<string, Container> = new Map();
  private lineupSprites: Container[] = [];

  constructor(
    playerCount: number,
    distance: number,
    characterAnimations: Map<string, RacerAnimations>,
    onStartRace: (characterKeys: string[], distance: number) => void,
    onBack: () => void
  ) {
    super();
    this.playerCount = playerCount;
    this.distance = distance;
    this.characterAnimations = characterAnimations;
    this.onStartRace = onStartRace;
    this.onBack = onBack;

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
      bg.roundRect(-50, -50, 100, 100, 10).fill(PALETTE.BLACK, 0.3).stroke({ color: PALETTE.WHITE, width: 2, alpha: 0.5 });
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
        style: new TextStyle({ fill: PALETTE.STR_WHITE, fontSize: 14, fontWeight: "bold" })
      });
      nameText.anchor.set(0.5);
      nameText.y = 40;
      item.addChild(nameText);

      item.on("pointerdown", () => this.toggleSelection(key));
      
      this.gridContainer.addChild(item);
      this.selectionSprites.set(key, item);
    });
  }

  private toggleSelection(key: string) {
    const index = this.selectedKeys.indexOf(key);
    if (index !== -1) {
      // Deselect
      this.selectedKeys.splice(index, 1);
    } else {
      // Select
      if (this.selectedKeys.length < this.playerCount) {
        this.selectedKeys.push(key);
      } else {
        return;
      }
    }
    this.updateUI();
  }

  private updateUI() {
    // Update Grid visuals
    this.selectionSprites.forEach((item, key) => {
      const bg = item.children[0] as Graphics;
      const isSelected = this.selectedKeys.includes(key);
      bg.clear();
      
      const bgColor = isSelected ? PALETTE.WOOD_LIGHT : PALETTE.WOOD_DARK;
      const strokeColor = isSelected ? PALETTE.WHITE : PALETTE.WOOD_PALE;
      const strokeWidth = isSelected ? 4 : 2;

      bg.roundRect(-50, -50, 100, 100, 12)
        .fill(bgColor, 0.9)
        .stroke({ 
          color: strokeColor, 
          width: strokeWidth,
          alpha: isSelected ? 1 : 0.5 
        });
        
      const sprite = item.children[1] as AnimatedSprite;
      const targetSize = isSelected ? 80 : 70;
      sprite.width = targetSize;
      sprite.height = targetSize;
    });

    // Update Lineup
    this.lineupContainer.removeChildren();
    this.lineupSprites = [];

    // Always show playerCount positions
    for (let i = 0; i < this.playerCount; i++) {
      const racerContainer = new Container();
      const key = this.selectedKeys[i];
      
      // Scale lineup items by 1.5x
      racerContainer.scale.set(1.5);

      if (key) {
        // Lineup character interaction
        racerContainer.eventMode = "static";
        racerContainer.cursor = "pointer";
        racerContainer.on("pointerdown", () => this.toggleSelection(key));

        const anims = this.characterAnimations.get(key)!;
        
        // Character background card in lineup
        const card = new Graphics();
        card.roundRect(-RACER.WIDTH / 2 - 5, -RACER.HEIGHT - 5, RACER.WIDTH + 10, RACER.HEIGHT + 15, 8)
          .fill(COLORS.SIDEBAR_BG, 0.9)
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
        // Placeholder "wooden box"
        const box = new Graphics();
        box.roundRect(-RACER.WIDTH / 2, -RACER.HEIGHT, RACER.WIDTH, RACER.HEIGHT, 8)
          .fill(PALETTE.WOOD_DARK, 0.6)
          .stroke({ color: PALETTE.WOOD_PALE, width: 2, alpha: 0.5 });
        racerContainer.addChild(box);
        
        const posText = new Text({
          text: (i + 1).toString(),
          style: new TextStyle({ 
            fill: PALETTE.STR_WHITE, 
            fontSize: 24, 
            fontWeight: "bold",
            alpha: 0.3
          })
        });
        posText.anchor.set(0.5);
        posText.y = -RACER.HEIGHT / 2;
        racerContainer.addChild(posText);
      }

      this.lineupContainer.addChild(racerContainer);
      this.lineupSprites.push(racerContainer);
    }

    const remaining = this.playerCount - this.selectedKeys.length;
    if (remaining > 0) {
      this.statusText.text = `Select ${remaining} more racer${remaining > 1 ? 's' : ''}`;
      this.startBtn.visible = false;
    } else {
      this.statusText.text = `Ready to race!`;
      this.startBtn.visible = true;
    }

    this.repositionLineup();
  }

  private repositionLineup() {
    // Increased spacing to 160 to account for 1.5x scale
    const spacing = 160;
    const totalWidth = (this.lineupSprites.length - 1) * spacing;
    this.lineupSprites.forEach((sprite, i) => {
      sprite.x = i * spacing - totalWidth / 2;
    });
  }

  private handleStart() {
    if (this.selectedKeys.length === this.playerCount) {
      this.onStartRace(this.selectedKeys, this.distance);
    }
  }

  public resize(width: number, height: number) {
    const centerX = width / 2;
    
    // Draw solid background
    this.bg.clear().rect(0, 0, width, height).fill(PALETTE.GRASS_LIGHT);

    this.title.x = centerX;
    this.title.y = height * 0.08;
    this.title.style.fontSize = width < 600 ? 32 : 48;

    // Lineup moved further down (from 240 to ~height * 0.38)
    this.lineupContainer.x = centerX;
    this.lineupContainer.y = height * 0.38;
    this.repositionLineup();

    this.statusText.x = centerX;
    this.statusText.y = this.lineupContainer.y + 100;

    // Grid Layout adjusted relative to lineup
    const cols = width < 600 ? 4 : 8;
    const spacing = 110;
    const gridWidth = (Math.min(cols, this.selectionSprites.size) - 1) * spacing;
    
    let i = 0;
    this.selectionSprites.forEach((item) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      item.x = col * spacing - gridWidth / 2;
      item.y = row * spacing;
      i++;
    });

    this.gridContainer.x = centerX;
    this.gridContainer.y = this.statusText.y + 80;

    this.startBtn.x = centerX;
    this.startBtn.y = height - 60;

    this.backBtn.x = 80;
    this.backBtn.y = 40;
  }

  update(_delta: number) {}
}
