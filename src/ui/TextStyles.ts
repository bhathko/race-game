import { TextStyle } from "pixi.js";
import type { Text, TextStyleOptions } from "pixi.js";
import { UI, FONT } from "../config";

/**
 * Clean rounded type, no outlines (light text on the black UI):
 * - title / heading: ExtraBold (screen titles, values, names)
 * - body:            Bold (list rows, labels on cards)
 * - label:           muted grey Bold (captions such as "Racers", status lines)
 * - overlay:         white ExtraBold with a soft shadow, for text over the race track
 * - onAccent:        white ExtraBold, for text on colored buttons
 * - ink:             dark Bold, for light grounds (the dirt track, podium blocks)
 */
export type TextKind = "title" | "heading" | "body" | "label" | "overlay" | "onAccent" | "ink";

interface KindSpec {
  color: number;
  weight: "700" | "800";
  shadow: boolean;
}

const KINDS: Record<TextKind, KindSpec> = {
  title: { color: UI.TEXT, weight: "800", shadow: false },
  heading: { color: UI.TEXT, weight: "800", shadow: false },
  body: { color: UI.TEXT, weight: "700", shadow: false },
  label: { color: UI.TEXT_MUTED, weight: "700", shadow: false },
  overlay: { color: UI.WHITE, weight: "800", shadow: true },
  onAccent: { color: UI.WHITE, weight: "800", shadow: false },
  ink: { color: UI.INK, weight: "700", shadow: false },
};

/** Remembers which kind each style was built as, so it can be resized proportionally. */
const styleKinds = new WeakMap<TextStyle, KindSpec>();

function softShadow(size: number) {
  return {
    color: UI.SHADOW,
    alpha: 0.45,
    angle: Math.PI / 2,
    blur: Math.max(2, size * 0.12),
    distance: Math.max(1, size * 0.05),
  };
}

export function textStyle(
  kind: TextKind,
  size: number,
  overrides: Partial<TextStyleOptions> = {},
): TextStyle {
  const spec = KINDS[kind];
  const style = new TextStyle({
    fontFamily: FONT.STACK,
    fontSize: size,
    fontWeight: spec.weight,
    fill: spec.color,
    dropShadow: spec.shadow ? softShadow(size) : false,
    padding: spec.shadow ? Math.ceil(size * 0.25) : 2,
    ...overrides,
  });
  styleKinds.set(style, spec);
  return style;
}

/** Change a text's size, keeping its shadow in proportion. */
export function setFontSize(text: Text, size: number) {
  const style = text.style;
  style.fontSize = size;
  const spec = styleKinds.get(style);
  if (spec?.shadow) {
    style.dropShadow = softShadow(size);
    style.padding = Math.ceil(size * 0.25);
  }
}
