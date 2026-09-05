/**
 * Theme definitions for generated applications.
 *
 * Until 1.2.0 the `--theme` prompt only wrote `components.json`'s `baseColor`,
 * a field that nothing reads at runtime — it only affects future
 * `npx shadcn add` runs. `globals.css` shipped byte-identical, so every
 * generated app looked the same regardless of what the user picked.
 *
 * A theme here owns three things that together decide whether two apps read as
 * different products: the colour tokens, the type pairing, and the corner
 * radius. Picking a theme now rewrites `globals.css` and `layout.tsx`.
 *
 * Colours are HSL channel triplets (`H S% L%`) so they drop straight into the
 * `hsl(var(--token))` form the Tailwind config already expects.
 */

export type ThemeId = 'neutral' | 'zinc' | 'violet' | 'rose';

/** A Google font, loaded via `next/font/google` — self-hosted at build time. */
export interface FontChoice {
  /** `next/font/google` export name, e.g. `Plus_Jakarta_Sans`. */
  readonly import: string;
  /** Human-facing name, used in generated comments and docs. */
  readonly name: string;
  /**
   * Explicit weights. Required by `next/font/google` for families that have no
   * variable version (IBM Plex, DM Mono) — omitting it is a build error, not a
   * warning. Leave undefined for variable fonts so the full axis ships.
   */
  readonly weights?: readonly string[];
}

export interface FontPairing {
  readonly sans: FontChoice;
  readonly mono: FontChoice;
}

/**
 * One colour mode. Every field is required: a partial palette is how you end up
 * with an unreadable control in the mode nobody tested.
 */
export interface Palette {
  readonly background: string;
  readonly foreground: string;
  readonly card: string;
  readonly cardForeground: string;
  readonly popover: string;
  readonly popoverForeground: string;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly secondary: string;
  readonly secondaryForeground: string;
  readonly muted: string;
  readonly mutedForeground: string;
  readonly accent: string;
  readonly accentForeground: string;
  readonly destructive: string;
  readonly destructiveForeground: string;
  readonly success: string;
  readonly warning: string;
  readonly border: string;
  readonly input: string;
  readonly ring: string;
}

export interface Theme {
  readonly id: ThemeId;
  readonly label: string;
  readonly hint: string;
  /** shadcn `baseColor`, so `npx shadcn add` stays consistent with the theme. */
  readonly baseColor: 'neutral' | 'zinc' | 'slate' | 'stone';
  readonly radius: string;
  readonly fonts: FontPairing;
  readonly light: Palette;
  readonly dark: Palette;
}

const INTER: FontChoice = { import: 'Inter', name: 'Inter' };
const JETBRAINS_MONO: FontChoice = { import: 'JetBrains_Mono', name: 'JetBrains Mono' };

export const THEMES: Readonly<Record<ThemeId, Theme>> = {
  /**
   * The default. Cool grey with a single blue accent — deliberately quiet, so a
   * team can put their own brand on top without fighting anything.
   */
  neutral: {
    id: 'neutral',
    label: 'Slate & Blue',
    hint: 'Quiet, neutral, easy to rebrand — the safe default',
    baseColor: 'slate',
    radius: '0.5rem',
    fonts: { sans: INTER, mono: JETBRAINS_MONO },
    light: {
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      card: '0 0% 100%',
      cardForeground: '222 47% 11%',
      popover: '0 0% 100%',
      popoverForeground: '222 47% 11%',
      primary: '221 83% 53%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222 47% 11%',
      muted: '210 40% 96%',
      mutedForeground: '215 16% 47%',
      accent: '210 40% 96%',
      accentForeground: '222 47% 11%',
      destructive: '0 72% 51%',
      destructiveForeground: '210 40% 98%',
      success: '142 71% 36%',
      warning: '35 92% 40%',
      border: '214 32% 91%',
      input: '214 32% 91%',
      ring: '221 83% 53%',
    },
    dark: {
      background: '222 47% 7%',
      foreground: '210 40% 98%',
      card: '222 44% 10%',
      cardForeground: '210 40% 98%',
      popover: '222 44% 10%',
      popoverForeground: '210 40% 98%',
      primary: '217 91% 60%',
      primaryForeground: '222 47% 11%',
      secondary: '217 33% 17%',
      secondaryForeground: '210 40% 98%',
      muted: '217 33% 17%',
      mutedForeground: '215 20% 65%',
      accent: '217 33% 17%',
      accentForeground: '210 40% 98%',
      destructive: '0 72% 51%',
      destructiveForeground: '210 40% 98%',
      success: '142 60% 45%',
      warning: '35 90% 55%',
      border: '217 33% 18%',
      input: '217 33% 18%',
      ring: '217 91% 60%',
    },
  },

  /**
   * Near-black neutrals with an emerald accent and a tighter radius. Reads as a
   * developer tool: dense, high contrast, not trying to be friendly.
   */
  zinc: {
    id: 'zinc',
    label: 'Zinc & Emerald',
    hint: 'Dense, high-contrast developer tooling',
    baseColor: 'zinc',
    radius: '0.375rem',
    fonts: {
      // IBM Plex has no variable version — weights must be explicit.
      sans: {
        import: 'IBM_Plex_Sans',
        name: 'IBM Plex Sans',
        weights: ['400', '500', '600', '700'],
      },
      mono: { import: 'IBM_Plex_Mono', name: 'IBM Plex Mono', weights: ['400', '500'] },
    },
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 4%',
      card: '0 0% 100%',
      cardForeground: '240 10% 4%',
      popover: '0 0% 100%',
      popoverForeground: '240 10% 4%',
      primary: '158 64% 30%',
      primaryForeground: '0 0% 98%',
      secondary: '240 5% 96%',
      secondaryForeground: '240 6% 10%',
      muted: '240 5% 96%',
      mutedForeground: '240 4% 46%',
      accent: '240 5% 96%',
      accentForeground: '240 6% 10%',
      destructive: '0 72% 51%',
      destructiveForeground: '0 0% 98%',
      success: '158 64% 30%',
      warning: '35 92% 40%',
      border: '240 6% 90%',
      input: '240 6% 90%',
      ring: '158 64% 30%',
    },
    dark: {
      background: '240 10% 4%',
      foreground: '0 0% 98%',
      card: '240 8% 7%',
      cardForeground: '0 0% 98%',
      popover: '240 8% 7%',
      popoverForeground: '0 0% 98%',
      primary: '158 64% 44%',
      primaryForeground: '240 10% 4%',
      secondary: '240 4% 14%',
      secondaryForeground: '0 0% 98%',
      muted: '240 4% 14%',
      mutedForeground: '240 5% 65%',
      accent: '240 4% 14%',
      accentForeground: '0 0% 98%',
      destructive: '0 72% 51%',
      destructiveForeground: '0 0% 98%',
      success: '158 64% 44%',
      warning: '35 90% 55%',
      border: '240 4% 16%',
      input: '240 4% 16%',
      ring: '158 64% 44%',
    },
  },

  /**
   * Violet primary on cool grey, softer corners, a geometric sans. The modern
   * B2B SaaS look — the one people mean when they say "make it look like Linear".
   */
  violet: {
    id: 'violet',
    label: 'Violet & Indigo',
    hint: 'Modern SaaS product, softer and more branded',
    baseColor: 'zinc',
    radius: '0.75rem',
    fonts: {
      sans: { import: 'Plus_Jakarta_Sans', name: 'Plus Jakarta Sans' },
      mono: JETBRAINS_MONO,
    },
    light: {
      background: '0 0% 100%',
      foreground: '250 24% 9%',
      card: '0 0% 100%',
      cardForeground: '250 24% 9%',
      popover: '0 0% 100%',
      popoverForeground: '250 24% 9%',
      primary: '258 90% 61%',
      primaryForeground: '0 0% 100%',
      secondary: '252 30% 96%',
      secondaryForeground: '250 24% 9%',
      muted: '252 30% 96%',
      mutedForeground: '250 10% 46%',
      accent: '252 30% 96%',
      accentForeground: '250 24% 9%',
      destructive: '0 72% 51%',
      destructiveForeground: '0 0% 100%',
      success: '142 71% 36%',
      warning: '35 92% 40%',
      border: '252 20% 91%',
      input: '252 20% 91%',
      ring: '258 90% 61%',
    },
    dark: {
      background: '250 30% 6%',
      foreground: '250 20% 98%',
      card: '250 26% 9%',
      cardForeground: '250 20% 98%',
      popover: '250 26% 9%',
      popoverForeground: '250 20% 98%',
      primary: '258 90% 68%',
      primaryForeground: '250 30% 6%',
      secondary: '250 20% 16%',
      secondaryForeground: '250 20% 98%',
      muted: '250 20% 16%',
      mutedForeground: '250 12% 66%',
      accent: '250 20% 16%',
      accentForeground: '250 20% 98%',
      destructive: '0 72% 51%',
      destructiveForeground: '0 0% 100%',
      success: '142 60% 45%',
      warning: '35 90% 55%',
      border: '250 20% 18%',
      input: '250 20% 18%',
      ring: '258 90% 68%',
    },
  },

  /**
   * Warm stone with a rose primary and generous corners. Consumer-facing and
   * approachable rather than institutional.
   */
  rose: {
    id: 'rose',
    label: 'Stone & Rose',
    hint: 'Warm and consumer-facing, generous corners',
    baseColor: 'stone',
    radius: '1rem',
    fonts: {
      sans: { import: 'DM_Sans', name: 'DM Sans' },
      // DM Mono has no variable version — weights must be explicit.
      mono: { import: 'DM_Mono', name: 'DM Mono', weights: ['400', '500'] },
    },
    light: {
      background: '0 0% 100%',
      foreground: '20 14% 10%',
      card: '0 0% 100%',
      cardForeground: '20 14% 10%',
      popover: '0 0% 100%',
      popoverForeground: '20 14% 10%',
      primary: '347 77% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '30 20% 96%',
      secondaryForeground: '20 14% 10%',
      muted: '30 20% 96%',
      mutedForeground: '25 6% 45%',
      accent: '30 20% 96%',
      accentForeground: '20 14% 10%',
      destructive: '0 72% 51%',
      destructiveForeground: '0 0% 100%',
      success: '142 71% 36%',
      warning: '35 92% 40%',
      border: '25 15% 91%',
      input: '25 15% 91%',
      ring: '347 77% 50%',
    },
    dark: {
      background: '20 14% 6%',
      foreground: '30 20% 98%',
      card: '20 12% 9%',
      cardForeground: '30 20% 98%',
      popover: '20 12% 9%',
      popoverForeground: '30 20% 98%',
      primary: '347 77% 58%',
      primaryForeground: '0 0% 100%',
      secondary: '20 10% 16%',
      secondaryForeground: '30 20% 98%',
      muted: '20 10% 16%',
      mutedForeground: '25 8% 64%',
      accent: '20 10% 16%',
      accentForeground: '30 20% 98%',
      destructive: '0 72% 51%',
      destructiveForeground: '0 0% 100%',
      success: '142 60% 45%',
      warning: '35 90% 55%',
      border: '20 10% 18%',
      input: '20 10% 18%',
      ring: '347 77% 58%',
    },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export function getTheme(id: ThemeId): Theme {
  return THEMES[id];
}

function renderFontDeclaration(font: FontChoice, varName: 'sans' | 'mono'): string {
  const weight = font.weights ? `\n  weight: [${font.weights.map((w) => `'${w}'`).join(', ')}],` : '';

  return `const ${varName} = ${font.import}({
  subsets: ['latin'],${weight}
  variable: '--font-${varName}',
  display: 'swap',
});`;
}

/**
 * Renders the font import and the two declarations for a theme. The generator
 * splices this between the `FONTS:START` / `FONTS:END` markers in the
 * template's `layout.tsx`, so the whole block is replaced as a unit — the
 * weights array only some families need cannot be patched in by regex.
 */
export function renderFontBlock(theme: Theme): string {
  const { sans, mono } = theme.fonts;

  return [
    `import { ${sans.import}, ${mono.import} } from 'next/font/google';`,
    '',
    renderFontDeclaration(sans, 'sans'),
    '',
    renderFontDeclaration(mono, 'mono'),
  ].join('\n');
}

function paletteToCss(palette: Palette, indent: string): string {
  const lines: [string, string][] = [
    ['background', palette.background],
    ['foreground', palette.foreground],
    ['card', palette.card],
    ['card-foreground', palette.cardForeground],
    ['popover', palette.popover],
    ['popover-foreground', palette.popoverForeground],
    ['primary', palette.primary],
    ['primary-foreground', palette.primaryForeground],
    ['secondary', palette.secondary],
    ['secondary-foreground', palette.secondaryForeground],
    ['muted', palette.muted],
    ['muted-foreground', palette.mutedForeground],
    ['accent', palette.accent],
    ['accent-foreground', palette.accentForeground],
    ['destructive', palette.destructive],
    ['destructive-foreground', palette.destructiveForeground],
    ['border', palette.border],
    ['input', palette.input],
    ['ring', palette.ring],
  ];

  const status: [string, string][] = [
    ['success', palette.success],
    ['warning', palette.warning],
  ];

  const render = (entries: [string, string][]) =>
    entries.map(([name, value]) => `${indent}--${name}: ${value};`).join('\n');

  return [
    render(lines),
    '',
    `${indent}/* Status colours. The only hues that carry meaning on their own —`,
    `${indent}   everything else is theme. A coloured pixel means a system state. */`,
    render(status),
  ].join('\n');
}

/**
 * Renders the complete `globals.css` for a theme. The generator writes this
 * over the template's copy so the selected palette, radius, and type roles are
 * what the app actually boots with.
 */
export function renderGlobalsCss(theme: Theme): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

/*
 * Theme: ${theme.label}
 * Type:  ${theme.fonts.sans.name} (sans) / ${theme.fonts.mono.name} (mono)
 *
 * Every colour in the app comes from a token below. If you are reaching for a
 * literal Tailwind colour (bg-indigo-600, text-emerald-500), add a token here
 * instead — that is what keeps light and dark mode in agreement.
 */

@layer base {
  :root {
${paletteToCss(theme.light, '    ')}

    --radius: ${theme.radius};
  }

  .dark {
${paletteToCss(theme.dark, '    ')}
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'cv11', 'ss01';
  }

  /* Numbers in tables and stat readouts should not reflow as they update. */
  .tabular {
    font-variant-numeric: tabular-nums;
  }
}
`;
}
