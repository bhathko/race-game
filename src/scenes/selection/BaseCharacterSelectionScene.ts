import { Container, Graphics, Text, AnimatedSprite } from "pixi.js";
import { CHARACTERS, COLORS, RACER, UI } from "../../config";
import { createGameButton, textStyle, setFontSize } from "../../ui";

/** Character tiles are 100×100, centered on their container. */
const TILE = 100;
const TILE_RADIUS = 16;
/** Gap between a selected tile and its selection frame. */
const RING_GAP = 5;
import type { RacerAnimations, SelectionContext } from "../../core/types";
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

  // Confirmation popup
  protected popupOverlay: Container;
  protected popupPanel: Graphics;
  protected popupTitle: Text;
  protected popupStartBtn: Container;
  protected popupCancelBtn: Container;

  protected selectionSprites: Map<string, Container> = new Map();
  private selectionRings: Graphics[] = [];
  private ringClock = 0;
  protected lineupSprites: Container[] = [];

  constructor(ctx: SelectionContext, initialSelectedKeys: string[] = []) {
    super();
    this.playerCount = ctx.playerCount;
    this.distance = ctx.distance;
    this.characterAnimations = ctx.characterAnimations;
    this.onStartRace = ctx.onStartRace;
    this.onBack = ctx.onBack;
    this.selectedKeys = [...initialSelectedKeys];

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.title = new Text({ text: "Choose your racers", style: textStyle("title", 44) });
    this.title.anchor.set(0.5);
    this.addChild(this.title);

    this.statusText = new Text({
      text: `Select ${this.playerCount} racers`,
      style: textStyle("label", 22),
    });
    this.statusText.anchor.set(0.5);
    this.addChild(this.statusText);

    this.gridContainer = new Container();
    this.addChild(this.gridContainer);

    this.lineupContainer = new Container();
    this.addChild(this.lineupContainer);

    this.createCharacterGrid();

    this.startBtn = createGameButton({
      label: "Start race",
      color: COLORS.BUTTON_SUCCESS,
      onClick: () => this.handleStart(),
      width: 240,
    });
    this.startBtn.visible = false;
    this.addChild(this.startBtn);

    this.backBtn = createGameButton({
      label: "Back",
      color: COLORS.BUTTON_DANGER,
      onClick: () => this.onBack(),
      width: 120,
      fontSize: 20,
    });
    this.addChild(this.backBtn);

    // ── Confirmation Popup ──
    this.popupOverlay = new Container();
    this.popupOverlay.visible = false;
    this.popupOverlay.eventMode = "static"; // blocks clicks to elements behind

    const overlayBg = new Graphics();
    overlayBg.rect(0, 0, 2000, 2000).fill({ color: UI.SHADOW, alpha: 0.6 });
    this.popupOverlay.addChild(overlayBg);

    this.popupPanel = new Graphics();
    this.popupOverlay.addChild(this.popupPanel);

    this.popupTitle = new Text({ text: "Ready to race!", style: textStyle("heading", 28) });
    this.popupTitle.anchor.set(0.5);
    this.popupOverlay.addChild(this.popupTitle);

    this.popupStartBtn = createGameButton({
      label: "Start race",
      color: COLORS.BUTTON_SUCCESS,
      onClick: () => this.handleStart(),
      width: 220,
      fontSize: 24,
    });
    this.popupOverlay.addChild(this.popupStartBtn);

    this.popupCancelBtn = createGameButton({
      label: "Cancel",
      color: COLORS.BUTTON_DANGER,
      onClick: () => this.handlePopupCancel(),
      width: 220,
      fontSize: 24,
    });
    this.popupOverlay.addChild(this.popupCancelBtn);

    this.addChild(this.popupOverlay);

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
      item.addChild(bg);

      const sprite = new AnimatedSprite(anims.idle);
      sprite.anchor.set(0.5);
      sprite.width = 70;
      sprite.height = 70;
      sprite.animationSpeed = 0.1;
      sprite.play();
      item.addChild(sprite);

      const nameText = new Text({ text: charData.name, style: textStyle("body", 15) });
      nameText.anchor.set(0.5);
      nameText.y = 38;
      item.addChild(nameText);

      // Green selection frame (pulses in update())
      const half = TILE / 2 + RING_GAP;
      const ring = new Graphics()
        .roundRect(-half, -half, half * 2, half * 2, TILE_RADIUS + RING_GAP)
        .stroke({ color: UI.FRAME, width: 4 });
      ring.visible = false;
      item.addChild(ring);
      this.selectionRings.push(ring);

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
      this.drawTile(bg, isSelected);
      item.children[3].visible = isSelected;

      const sprite = item.children[1] as AnimatedSprite;
      const targetSize = isSelected ? 78 : 70;
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
        this.drawSoftCard(
          card,
          -RACER.WIDTH / 2 - 5,
          -RACER.HEIGHT - 5,
          RACER.WIDTH + 10,
          RACER.HEIGHT + 15,
          14,
        );
        racerContainer.addChild(card);

        const sprite = new AnimatedSprite(anims.idle);
        sprite.anchor.set(0.5, 1);
        sprite.width = RACER.WIDTH;
        sprite.height = RACER.HEIGHT;
        sprite.animationSpeed = 0.1;
        sprite.play();
        racerContainer.addChild(sprite);
      } else {
        const box = new Graphics()
          .roundRect(-RACER.WIDTH / 2, -RACER.HEIGHT, RACER.WIDTH, RACER.HEIGHT, 14)
          .fill({ color: UI.SURFACE, alpha: 0.6 })
          .stroke({ color: UI.LINE, width: 2, alpha: 0.6 });
        racerContainer.addChild(box);

        const posText = new Text({ text: (i + 1).toString(), style: textStyle("label", 28) });
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
      this.popupOverlay.visible = false;
    } else {
      this.statusText.text = `Ready to race!`;
      this.startBtn.visible = true;
      this.popupOverlay.visible = true;
    }

    this.repositionLineup();
  }

  /** Rounded card with a soft shadow and a thin border. */
  private drawSoftCard(g: Graphics, x: number, y: number, w: number, h: number, radius: number) {
    g.clear();
    for (let i = 3; i >= 1; i--) {
      g.roundRect(x - i, y + i * 1.5, w + i * 2, h + i, radius + i).fill({
        color: UI.SHADOW,
        alpha: 0.045,
      });
    }
    g.roundRect(x, y, w, h, radius)
      .fill({ color: UI.SURFACE })
      .stroke({ color: UI.LINE, width: 2 });
  }

  /** Character tile: a dark card; selected tiles get a green tint (the frame is a separate ring). */
  private drawTile(bg: Graphics, selected: boolean) {
    const half = TILE / 2;
    this.drawSoftCard(bg, -half, -half, TILE, TILE, TILE_RADIUS);
    if (selected) {
      bg.roundRect(-half, -half, TILE, TILE, TILE_RADIUS).fill({ color: UI.FRAME_TINT });
    }
  }

  protected abstract getLineupScale(): number;
  protected abstract repositionLineup(): void;
  public abstract resize(width: number, height: number): void;

  protected handleStart() {
    if (this.selectedKeys.length === this.playerCount) {
      this.onStartRace(this.selectedKeys, this.distance);
    }
  }

  private handlePopupCancel() {
    if (this.selectedKeys.length > 0) {
      this.selectedKeys.pop();
      this.updateUI();
    }
  }

  /** Reposition the popup overlay and panel. Call from resize(). */
  protected repositionPopup(width: number, height: number) {
    // Overlay background covers full screen
    const overlayBg = this.popupOverlay.children[0] as Graphics;
    overlayBg.clear().rect(0, 0, width, height).fill({ color: UI.SHADOW, alpha: 0.6 });

    const centerX = width / 2;
    const centerY = height / 2;

    // Panel
    const panelW = Math.min(320, width * 0.8);
    const panelH = Math.min(260, height * 0.8);
    const panelX = centerX - panelW / 2;
    const panelY = centerY - panelH / 2;
    this.drawSoftCard(this.popupPanel, panelX, panelY, panelW, panelH, 24);

    // Title (shrinks to stay inside the panel on narrow phones)
    this.popupTitle.x = centerX;
    this.popupTitle.y = panelY + panelH * 0.19;
    setFontSize(this.popupTitle, Math.min(28, height * 0.09));
    this.popupTitle.scale.set(1);
    const titleRoom = panelW - 28;
    if (this.popupTitle.width > titleRoom)
      this.popupTitle.scale.set(titleRoom / this.popupTitle.width);

    // Buttons
    const btnScale = Math.min(0.8, height / 450, (panelW - 40) / 220);
    this.popupStartBtn.scale.set(btnScale);
    this.popupStartBtn.x = centerX;
    this.popupStartBtn.y = panelY + panelH * 0.49;

    this.popupCancelBtn.scale.set(btnScale);
    this.popupCancelBtn.x = centerX;
    this.popupCancelBtn.y = panelY + panelH * 0.77;
  }

  update(delta: number) {
    // Gentle pulse on the green selection frames
    this.ringClock += delta;
    const alpha = 0.65 + 0.35 * Math.sin(this.ringClock * 0.1);
    for (const ring of this.selectionRings) ring.alpha = alpha;
  }
}
