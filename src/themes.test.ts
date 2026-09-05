import { describe, it, expect } from 'vitest';
import {
  THEMES,
  THEME_IDS,
  getTheme,
  renderGlobalsCss,
  renderFontBlock,
  type Palette,
} from './themes.js';

const PALETTE_KEYS: (keyof Palette)[] = [
  'background',
  'foreground',
  'card',
  'cardForeground',
  'popover',
  'popoverForeground',
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'muted',
  'mutedForeground',
  'accent',
  'accentForeground',
  'destructive',
  'destructiveForeground',
  'success',
  'warning',
  'border',
  'input',
  'ring',
];

/** `H S% L%` — the channel-triplet form `hsl(var(--token))` expects. */
const HSL_TRIPLET = /^\d{1,3} \d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/;

describe('Theme definitions', () => {
  it('exposes every theme id', () => {
    expect(THEME_IDS).toEqual(['neutral', 'zinc', 'violet', 'rose']);
  });

  it.each(THEME_IDS)('%s defines a complete light and dark palette', (id) => {
    const theme = getTheme(id);

    for (const key of PALETTE_KEYS) {
      expect(theme.light[key], `${id}.light.${key}`).toMatch(HSL_TRIPLET);
      expect(theme.dark[key], `${id}.dark.${key}`).toMatch(HSL_TRIPLET);
    }
  });

  it.each(THEME_IDS)('%s renders globals.css with its own radius and tokens', (id) => {
    const theme = getTheme(id);
    const css = renderGlobalsCss(theme);

    expect(css).toContain(`--radius: ${theme.radius};`);
    expect(css).toContain(`--primary: ${theme.light.primary};`);
    expect(css).toContain(`--success: ${theme.light.success};`);
    expect(css).toContain('.dark {');
    expect(css).toContain(`--primary: ${theme.dark.primary};`);
  });

  it.each(THEME_IDS)('%s renders a font block naming its own families', (id) => {
    const theme = getTheme(id);
    const block = renderFontBlock(theme);

    expect(block).toContain(
      `import { ${theme.fonts.sans.import}, ${theme.fonts.mono.import} } from 'next/font/google';`
    );
    expect(block).toContain(`const sans = ${theme.fonts.sans.import}({`);
    expect(block).toContain(`const mono = ${theme.fonts.mono.import}({`);
    expect(block).toContain("variable: '--font-sans'");
    expect(block).toContain("variable: '--font-mono'");
  });

  /**
   * next/font/google throws at build time for a non-variable family declared
   * without `weight`. Every family without a variable version must carry one.
   */
  it.each(THEME_IDS)('%s declares weights for non-variable families', (id) => {
    const theme = getTheme(id);
    const block = renderFontBlock(theme);

    for (const font of [theme.fonts.sans, theme.fonts.mono]) {
      if (font.weights) {
        expect(block).toContain(`weight: [${font.weights.map((w) => `'${w}'`).join(', ')}],`);
      }
    }
  });

  /**
   * The whole point of the theme flag. Before 1.2.0 it only wrote a
   * `components.json` field nothing reads, so every generated app was identical
   * regardless of the choice. If two themes ever render the same stylesheet
   * again, that regression is back.
   */
  it('gives every theme a visually distinct result', () => {
    const stylesheets = THEME_IDS.map((id) => renderGlobalsCss(getTheme(id)));
    expect(new Set(stylesheets).size).toBe(THEME_IDS.length);

    const primaries = THEME_IDS.map((id) => getTheme(id).light.primary);
    expect(new Set(primaries).size).toBe(THEME_IDS.length);

    const pairings = THEME_IDS.map((id) => {
      const { sans, mono } = getTheme(id).fonts;
      return `${sans.import}/${mono.import}`;
    });
    expect(new Set(pairings).size).toBe(THEME_IDS.length);
  });

  it('keeps prompt labels and hints present for every theme', () => {
    for (const id of THEME_IDS) {
      expect(THEMES[id].label.length).toBeGreaterThan(0);
      expect(THEMES[id].hint.length).toBeGreaterThan(0);
    }
  });
});
