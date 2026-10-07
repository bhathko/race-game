import { Container, Graphics } from "pixi.js";
import { RACER } from "../../config";

/** What the racer is doing this frame — drives which effects are shown. */
export interface RacerFxState {
  speed: number;
  sprinting: boolean;
  tired: boolean;
  drafting: boolean;
  kicking: boolean;
  secondWind: boolean;
  stumbling: boolean;
}

interface Particle {
  g: Graphics;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  gravity: number;
  startScale: number;
  endScale: number;
  startAlpha: number;
}

const FX_COLORS = {
  DUST: 0xc8a97e,
  SWEAT: 0x4fc3f7,
  DRAFT_LINE: 0xffffff,
  KICK_LINE: 0xffa726,
  SECOND_WIND_LINE: 0x80deea,
} as const;

const DUST_POOL = 10;
const SWEAT_POOL = 4;
const SPEED_LINE_COUNT = 3;

/**
 * Lightweight per-racer visual effects, in racer-local coordinates so they scale with the racer:
 * dust puffs while sprinting, speed lines while drafting / kicking / second wind,
 * and sweat drops while tired. Every visible speed change gets a visible cause.
 */
export class RacerEffects {
  /** Layer drawn behind the sprite (dust, speed lines). */
  public readonly back = new Container();
  /** Layer drawn in front of the sprite (sweat). */
  public readonly front = new Container();

  private dust: Particle[] = [];
  private sweat: Particle[] = [];
  private speedLines: Graphics[] = [];
  private dustTimer = 0;
  private sweatTimer = 0;
  private lineClock = 0;
  private wasStumbling = false;

  constructor() {
    for (let i = 0; i < DUST_POOL; i++) {
      const g = new Graphics().circle(0, 0, 5).fill({ color: FX_COLORS.DUST });
      this.dust.push(this.makeParticle(g, this.back));
    }
    for (let i = 0; i < SPEED_LINE_COUNT; i++) {
      const g = new Graphics().roundRect(-12, -1.5, 24, 3, 1.5).fill({ color: 0xffffff });
      g.visible = false;
      this.back.addChild(g);
      this.speedLines.push(g);
    }
    for (let i = 0; i < SWEAT_POOL; i++) {
      const g = new Graphics()
        .ellipse(0, 0, 2.6, 3.6)
        .fill({ color: FX_COLORS.SWEAT })
        .circle(-0.8, -1.2, 0.9)
        .fill({ color: 0xffffff, alpha: 0.8 });
      this.sweat.push(this.makeParticle(g, this.front));
    }
  }

  private makeParticle(g: Graphics, layer: Container): Particle {
    g.visible = false;
    layer.addChild(g);
    return {
      g,
      life: 0,
      maxLife: 1,
      vx: 0,
      vy: 0,
      gravity: 0,
      startScale: 1,
      endScale: 1,
      startAlpha: 1,
    };
  }

  private spawn(pool: Particle[], init: Omit<Particle, "g" | "life"> & { x: number; y: number }) {
    const p = pool.find((q) => q.life <= 0);
    if (!p) return;
    Object.assign(p, init, { life: init.maxLife });
    p.g.x = init.x;
    p.g.y = init.y;
    p.g.scale.set(init.startScale);
    p.g.alpha = init.startAlpha;
    p.g.visible = true;
  }

  private spawnDust() {
    this.spawn(this.dust, {
      x: -12 + Math.random() * 8,
      y: RACER.ART_FEET - 1 - Math.random() * 4,
      vx: -0.5 - Math.random() * 0.6,
      vy: -0.15 - Math.random() * 0.3,
      gravity: 0,
      maxLife: 20 + Math.random() * 8,
      startScale: 0.5,
      endScale: 1.5,
      startAlpha: 0.55,
    });
  }

  public update(delta: number, s: RacerFxState) {
    // ── Dust ──
    const moving = s.speed > 1;
    const dustInterval = s.kicking || s.secondWind ? 2.5 : s.sprinting ? 4.5 : 0;
    if (s.stumbling && !this.wasStumbling) for (let i = 0; i < 3; i++) this.spawnDust();
    this.wasStumbling = s.stumbling;
    if (moving && dustInterval > 0) {
      this.dustTimer -= delta;
      if (this.dustTimer <= 0) {
        this.spawnDust();
        this.dustTimer = dustInterval;
      }
    }

    // ── Sweat ──
    if (s.tired) {
      this.sweatTimer -= delta;
      if (this.sweatTimer <= 0) {
        this.spawn(this.sweat, {
          x: 6 + Math.random() * 10,
          y: RACER.ART_TOP + 4 - Math.random() * 6,
          vx: 0.35 + Math.random() * 0.3,
          vy: -0.9,
          gravity: 0.09,
          maxLife: 26,
          startScale: 1,
          endScale: 1,
          startAlpha: 1,
        });
        this.sweatTimer = 13;
      }
    }

    this.stepParticles(this.dust, delta);
    this.stepParticles(this.sweat, delta);

    // ── Speed lines (priority: kick > second wind > drafting) ──
    const lineColor = s.kicking
      ? FX_COLORS.KICK_LINE
      : s.secondWind
        ? FX_COLORS.SECOND_WIND_LINE
        : s.drafting
          ? FX_COLORS.DRAFT_LINE
          : null;
    this.lineClock += delta;
    this.speedLines.forEach((g, i) => {
      g.visible = lineColor !== null && moving;
      if (!g.visible) return;
      g.tint = lineColor!;
      const cycle = (this.lineClock * 0.09 + i * 0.37) % 1; // 0 → 1 sweep backwards
      g.x = -24 - cycle * 34;
      g.y =
        RACER.ART_TOP + 8 + i * ((RACER.ART_FEET - RACER.ART_TOP - 14) / (SPEED_LINE_COUNT - 1));
      g.alpha = (lineColor === FX_COLORS.DRAFT_LINE ? 0.5 : 0.85) * (1 - cycle);
      g.scale.x = 0.7 + (1 - cycle) * 0.5;
    });
  }

  private stepParticles(pool: Particle[], delta: number) {
    for (const p of pool) {
      if (p.life <= 0) continue;
      p.life -= delta;
      if (p.life <= 0) {
        p.g.visible = false;
        continue;
      }
      p.vy += p.gravity * delta;
      p.g.x += p.vx * delta;
      p.g.y += p.vy * delta;
      const k = 1 - p.life / p.maxLife;
      p.g.scale.set(p.startScale + (p.endScale - p.startScale) * k);
      p.g.alpha = p.startAlpha * (1 - k);
    }
  }

  /** Hide everything (e.g. when the racer finishes or falls into a hole). */
  public clear() {
    for (const p of [...this.dust, ...this.sweat]) {
      p.life = 0;
      p.g.visible = false;
    }
    this.speedLines.forEach((g) => (g.visible = false));
  }
}
