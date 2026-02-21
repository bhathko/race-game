import { LayoutMode } from "./types";

/**
 * Determines the layout mode based on the screen width and height.
 * @param width Screen width.
 * @param height Screen height.
 * @returns The layout mode.
 */
export function determineMode(width: number, height: number): LayoutMode {
  const isMobile = width < 600 || height < 500;
  const isPortrait = height > width;

  if (!isMobile) return LayoutMode.Desktop;
  return isPortrait ? LayoutMode.MobileVertical : LayoutMode.MobileHorizontal;
}

/**
 * Grid configuration for 12-column layout.
 */
export interface GridConfig {
  columns: number;
  gutter: number;
  margin: number;
  width: number;
}

/**
 * Calculates the X position and width for a span of columns in a 12-grid system.
 * @param startCol Starting column (0-indexed).
 * @param span Number of columns to span.
 * @param config Grid configuration.
 * @returns Object containing x and width.
 */
export function getGridRect(startCol: number, span: number, config: GridConfig) {
  const colWidth = (config.width - 2 * config.margin - (config.columns - 1) * config.gutter) / config.columns;
  const x = config.margin + startCol * (colWidth + config.gutter);
  const width = span * colWidth + (span - 1) * config.gutter;
  return { x, width };
}

/**
 * Convenience function to get grid config for common scenarios.
 */
export function getStandardGridConfig(totalWidth: number): GridConfig {
  return {
    columns: 12,
    gutter: totalWidth > 800 ? 20 : 10,
    margin: totalWidth > 800 ? 40 : 15,
    width: totalWidth,
  };
}
