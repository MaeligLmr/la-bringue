// Regenerates the CSS custom-property files under src/styles/tokens/ from a
// raw Figma Variables export (W3C Design Tokens format).
//
// To update the design system after a change in Figma:
//   1. In Figma, open the Variables panel and export/download each
//      collection (Primitive Colors, Sizes, Typography, Design tokens) as
//      W3C token JSON — e.g. via the "Variables Import & Export" plugin —
//      into a `Collections/` folder at the project root, matching this
//      layout:
//        Collections/Primitive Colors/Mode 1.tokens.json
//        Collections/Sizes/Mode 1.tokens.json
//        Collections/Typography/Desktop.tokens.json
//        Collections/Typography/Phone.tokens.json
//        Collections/Design tokens/Clair.tokens.json   (light)
//        Collections/Design tokens/Sombre.tokens.json  (dark)
//   2. Run `npm run tokens:generate` from the project root.
//   3. Delete the `Collections/` folder again once you've checked the
//      diff in src/styles/tokens/ — it's a one-time input, not something
//      the app needs at runtime or that should stay committed.
"use strict";
const fs = require("fs");
const path = require("path");

const PROJECT = process.cwd();

const COLLECTIONS = path.join(PROJECT, "Collections");
const OUT_DIR = path.join(PROJECT, "src", "styles", "tokens");

if (!fs.existsSync(COLLECTIONS)) {
  console.error(
    `No Collections/ folder found at ${COLLECTIONS}.\n` +
      "Export the four Figma Variables collections there first — see the comment at the top of this script."
  );
  process.exit(1);
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// ---- naming -------------------------------------------------------------

function slugSegment(seg) {
  return seg
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[•]/g, "")
    .replace(/^\$/, "") // "$root" -> "root"
    .replace(/'/g, "")
    .replace(/,/g, "-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function varName(pathSegs) {
  return "--" + pathSegs.map(slugSegment).join("-");
}

// ---- flattening -----------------------------------------------------------

// Walks a W3C-token tree. Calls onLeaf(pathSegs, node) for every {$type,$value} leaf.
function walk(node, pathSegs, onLeaf) {
  if (node == null || typeof node !== "object") return;
  if ("$value" in node) {
    onLeaf(pathSegs, node);
    return;
  }
  for (const key of Object.keys(node)) {
    // Skip node metadata ($type/$value/$extensions), but NOT a literal
    // token named "$root" (Figma's own generated name for a group's
    // default variant, e.g. Font family.Headings.$root).
    if (key.startsWith("$") && key !== "$root") continue;
    walk(node[key], [...pathSegs, key], onLeaf);
  }
}

function hexToRgb(hex) {
  const m = hex.replace("#", "");
  return [
    parseInt(m.slice(0, 2), 16),
    parseInt(m.slice(2, 4), 16),
    parseInt(m.slice(4, 6), 16),
  ];
}

function cssColor(value) {
  const { hex, alpha } = value;
  if (alpha === undefined || alpha >= 0.999) return hex;
  const [r, g, b] = hexToRgb(hex);
  const a = Math.round(alpha * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// resolves a raw unresolved Figma alias literal like "{Radius.Medium}"
const ALIAS_RE = /^\{(.+)\}$/;
function resolveAliasVar(raw) {
  const m = ALIAS_RE.exec(raw);
  if (!m) return null;
  const segs = m[1].split(".");
  return `var(${varName(segs)})`;
}

function cssValueFor(node) {
  if (node.$type === "color") return cssColor(node.$value);
  if (node.$type === "number") {
    if (typeof node.$value === "string") {
      const resolved = resolveAliasVar(node.$value);
      if (resolved) return resolved;
      return node.$value; // unknown alias, leave as-is (shouldn't happen)
    }
    return node.$value;
  }
  if (node.$type === "string") return `"${node.$value}"`;
  return JSON.stringify(node.$value);
}

// Every number leaf in this export is a px value from Figma (size,
// radius, spacing, font metrics) — converted to rem (best practice: rem
// scales with the user's font-size/zoom preferences, px doesn't).
// Authoring conversion uses the standard 16px = 1rem baseline, regardless
// of this app's own root font-size (that's the point of rem: the actual
// rendered size still follows whatever the root computes to).
const REM_BASE_PX = 16;
function pxToRem(px) {
  if (px === 0) return "0rem";
  const rem = px / REM_BASE_PX;
  const str = rem.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return `${str}rem`;
}

function emitLeaf(lines, pathSegs, node, opts = {}) {
  const name = varName(pathSegs);
  let value = cssValueFor(node);
  if (node.$type === "number" && typeof node.$value === "number" && !opts.noUnit) {
    value = pxToRem(node.$value);
  }
  lines.push(`  ${name}: ${value};`);
}

// ---- 1. Primitive Colors -------------------------------------------------

function buildPrimitives() {
  const data = readJSON(path.join(COLLECTIONS, "Primitive Colors", "Mode 1.tokens.json"));
  const lines = [];
  walk(data, ["color"], (segs, node) => emitLeaf(lines, segs, node));
  return `/* AUTO-GENERATED from Collections/Primitive Colors/Mode 1.tokens.json — do not edit by hand. */
/* Raw color scales exported from Figma. Prefer the semantic tokens in
   theme.css for actual UI colors; use these only when adding a new
   semantic token or a one-off that has no semantic equivalent yet. */
:root {
${lines.join("\n")}
}
`;
}

// ---- 2. Sizes (spacing scale) -------------------------------------------

function buildSizes() {
  const data = readJSON(path.join(COLLECTIONS, "Sizes", "Mode 1.tokens.json"));
  const lines = [];
  walk(data, ["space"], (segs, node) => emitLeaf(lines, segs, node));
  return `/* AUTO-GENERATED from Collections/Sizes/Mode 1.tokens.json — do not edit by hand. */
:root {
${lines.join("\n")}
}
`;
}

// ---- 3. Typography (Desktop default, Phone override) --------------------

const TYPOGRAPHY_SKIP_TOP_LEVEL = new Set(["Large 2", "Medium 2", "Small 2", "Label 2"]);
// These four duplicate Font size.Large/Medium/Small/Label with identical
// values and are leftover renamed variables in the Figma file — skipped.

const FONT_WEIGHT_MAP = {
  regular: 400,
  medium: 500,
  "semi-bold": 600,
  "black-italic": 900, // also implies font-style: italic
};

// Only the "Desktop" mode is used — no separate "Phone" scale. Figma's
// Phone values aren't a uniform scale-down of Desktop (e.g. Hero goes
// 150->85, a 43% cut, while Medium only goes 16->12, a 25% cut), so they
// can't be derived from a single ratio either. Now that these are rem,
// they already shrink on narrow screens for free via the root font-size
// media query in style.css (18px -> 16px) — one scale, not two to
// maintain, at the cost of not reproducing Figma's exact per-breakpoint
// proportions.
function buildTypography() {
  const desktop = readJSON(path.join(COLLECTIONS, "Typography", "Desktop.tokens.json"));

  const lines = [];
  for (const topKey of Object.keys(desktop)) {
    if (topKey.startsWith("$")) continue;
    if (TYPOGRAPHY_SKIP_TOP_LEVEL.has(topKey)) continue;
    // "Font weight" holds Figma style names ("Regular", "Semi Bold"...),
    // not CSS-usable values — replaced below by FONT_WEIGHT_MAP instead.
    if (topKey === "Font weight") continue;
    walk(desktop[topKey], [topKey], (segs, node) => {
      if (segs[0] === "Letter spacing") {
        // Figma letter-spacing tokens here are percentages of font size;
        // convert to an em fraction so the var is directly usable.
        const name = varName(segs);
        lines.push(`  ${name}: ${node.$value / 100}em;`);
        return;
      }
      emitLeaf(lines, segs, node);
    });
  }

  const weightLines = Object.entries(FONT_WEIGHT_MAP).map(
    ([slug, num]) => `  --font-weight-${slug}: ${num};`
  );

  return `/* AUTO-GENERATED from Collections/Typography/Desktop.tokens.json — do not edit by hand. */
:root {
${lines.join("\n")}

  /* Numeric CSS font-weight equivalents of the Figma style names above.
     --font-weight-black-italic also requires font-style: italic. */
${weightLines.join("\n")}
}
`;
}

// ---- 4. Semantic theme tokens (Design tokens: Clair = light, Sombre = dark) --

// Fix a couple of typos present in the source Figma variable names.
function renamePath(segs) {
  return segs.map((s) =>
    s.replace(/heigth/i, "height").replace(/radiux/i, "radius")
  );
}

function buildTheme(collectionFile) {
  const data = readJSON(path.join(COLLECTIONS, "Design tokens", collectionFile));
  const lines = [];
  for (const topKey of Object.keys(data)) {
    if (topKey.startsWith("$") || topKey === "Mode") continue;
    walk(data[topKey], [topKey], (segs, node) => {
      emitLeaf(lines, renamePath(segs), node);
    });
  }
  return lines;
}

function buildThemeFile() {
  const lightLines = buildTheme("Clair.tokens.json");
  const darkLines = buildTheme("Sombre.tokens.json");

  const withDanger = [
    ...insertDangerTokens(lightLines),
    ...SELECT_TOKEN_LINES.light,
    ...ALERT_TOKEN_LINES.light,
  ];
  const darkWithDanger = [
    ...insertDangerTokens(darkLines),
    ...SELECT_TOKEN_LINES.dark,
    ...ALERT_TOKEN_LINES.dark,
  ];

  return `/* Semantic, component-level tokens (buttons, cards, tags, hero section...).
   Light values are the default; dark values apply automatically by OS
   preference, or by setting data-theme="dark" on <html> (and vice versa
   for a forced light theme on a dark OS).

   Most of this file is AUTO-GENERATED from
   Collections/Design tokens/{Clair,Sombre}.tokens.json by
   scripts/generate-design-tokens.cjs — do not hand-edit those parts.
   --button-danger-*, --select-* and --alert-danger-* are the exceptions:
   they're hand-authored (see the comment above each block) and re-added
   by that same script on every regeneration, so they survive it. */

:root {
${withDanger.join("\n")}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${darkWithDanger.map((l) => "  " + l).join("\n")}
  }
}

:root[data-theme="dark"] {
${darkWithDanger.join("\n")}
}
`;
}

// --button-danger-* has no Button.Danger group in the Figma export at
// all (only Primary, Secondary, Info do). Built from the real "red"
// primitive scale using the exact same idle/hover/disabled formula as
// the real --button-info-* tokens above it, so it's a drop-in
// replacement if Figma ever publishes real Danger tokens. On request,
// this lives inline in theme.css (not a separate file) but still needs
// re-adding on every regeneration since the rest of this file is
// rebuilt from scratch each time.
const DANGER_TOKEN_LINES = [
  "/* --button-danger-* is hand-authored (no Button.Danger group in the",
  '   Figma export) — built from the real "red" primitive scale using',
  "   the same idle/hover/disabled formula as --button-info-* above. */",
  "--button-danger-full-idle-background: var(--color-red-500);",
  "--button-danger-full-idle-text: var(--color-red-50);",
  "--button-danger-full-idle-border: var(--color-red-500);",
  "--button-danger-full-hover-background: var(--color-red-700);",
  "--button-danger-full-hover-text: var(--color-red-50);",
  "--button-danger-full-hover-border: var(--color-red-700);",
  "--button-danger-full-disabled-background: var(--color-red-200);",
  "--button-danger-full-disabled-text: var(--color-red-50);",
  "--button-danger-full-disabled-border: var(--color-red-200);",
  "--button-danger-outlined-idle-background: rgba(253, 236, 242, 0);",
  "--button-danger-outlined-idle-text: var(--color-red-600);",
  "--button-danger-outlined-idle-border: var(--color-red-500);",
  "--button-danger-outlined-hover-background: rgba(251, 196, 216, 0.5);",
  "--button-danger-outlined-hover-text: var(--color-red-600);",
  "--button-danger-outlined-hover-border: var(--color-red-500);",
  "--button-danger-outlined-disabled-background: rgba(253, 236, 242, 0);",
  "--button-danger-outlined-disabled-text: var(--color-red-300);",
  "--button-danger-outlined-disabled-border: var(--color-red-100);",
  "--button-danger-ghost-idle-background: rgba(253, 236, 242, 0);",
  "--button-danger-ghost-idle-text: var(--color-red-600);",
  "--button-danger-ghost-idle-border: rgba(248, 27, 108, 0);",
  "--button-danger-ghost-hover-background: rgba(251, 196, 216, 0.5);",
  "--button-danger-ghost-hover-text: var(--color-red-600);",
  "--button-danger-ghost-hover-border: rgba(248, 27, 108, 0);",
  "--button-danger-ghost-disabled-background: rgba(253, 236, 242, 0);",
  "--button-danger-ghost-disabled-text: var(--color-red-300);",
  "--button-danger-ghost-disabled-border: rgba(251, 196, 216, 0);",
];

// Inserts the danger block right after the (real) --button-info-* lines,
// falling back to the end of the list if that anchor ever moves.
function insertDangerTokens(lines) {
  const anchor = lines.findIndex((l) => l.startsWith("--button-medium-"));
  const at = anchor === -1 ? lines.length : anchor;
  return [...lines.slice(0, at), ...DANGER_TOKEN_LINES, ...lines.slice(at)];
}

// No Figma "Select" component was ever exported (only Button and Icon
// were) — these are hand-authored directly from the real primitive color
// scales, not from another component's tokens. The trigger deliberately
// looks like Button's "primary outlined" variant (transparent
// background, pink-bright border/text), rebuilt from the pink-bright
// primitive scale rather than pointed at --button-primary-outlined-*.
// The listbox background is deliberately lighter than the page's own
// dark background in dark mode (an overlay needs to read as elevated,
// not blend into or go even darker than the page).
const SELECT_TOKEN_LINES = {
  light: [
    '/* --select-* is hand-authored (no Figma "Select" component was ever',
    "   exported) — built from the real primitive color scales, not from",
    "   another component's tokens. The trigger deliberately looks like",
    '   Button\'s "primary outlined" variant (transparent background,',
    "   pink-bright border/text), rebuilt from the pink-bright primitive",
    "   scale rather than pointed at --button-primary-outlined-*. The",
    "   listbox background is deliberately lighter than the page's own dark",
    "   background in dark mode (an overlay needs to read as elevated). */",
    "--select-trigger-background: transparent;",
    "--select-trigger-hover-background: color-mix(in srgb, var(--color-pink-bright-100) 50%, transparent);",
    "--select-trigger-text: var(--color-pink-bright-600);",
    "--select-trigger-border: var(--color-pink-bright-500);",
    "--select-trigger-focus-ring: color-mix(in srgb, var(--select-trigger-border) 20%, transparent);",
    "--select-listbox-background: var(--color-violet-50);",
    "--select-listbox-border: var(--color-violet-200);",
    "--select-option-text: var(--color-violet-900);",
    "--select-option-hover-background: color-mix(in srgb, var(--color-pink-bright-500) 12%, transparent);",
    "--select-option-selected-text: var(--color-pink-bright-600);",
  ],
  dark: [
    '/* --select-* is hand-authored — see the light block above. */',
    "--select-trigger-hover-background: color-mix(in srgb, var(--color-pink-bright-700) 50%, transparent);",
    "--select-trigger-text: var(--color-pink-bright-100);",
    "--select-trigger-border: var(--color-pink-bright-100);",
    "--select-listbox-background: var(--color-violet-700);",
    "--select-listbox-border: var(--color-violet-500);",
    "--select-option-text: var(--color-violet-50);",
    "--select-option-selected-text: var(--color-pink-bright-200);",
  ],
};

// No Figma "Alert"/error-message component was ever exported either —
// hand-authored from the real "red" primitive scale. Used for form error
// messages (see LoginForm.vue, SignUpForm.vue).
const ALERT_TOKEN_LINES = {
  light: [
    '/* --alert-danger-* is hand-authored (no Figma "Alert" component was',
    '   ever exported) — built from the real "red" primitive scale. */',
    "--alert-danger-background: var(--color-red-50);",
    "--alert-danger-border: var(--color-red-500);",
    "--alert-danger-text: var(--color-red-700);",
  ],
  dark: [
    "/* --alert-danger-* is hand-authored — see the light block above. */",
    "--alert-danger-background: var(--color-red-900);",
    "--alert-danger-border: var(--color-red-400);",
    "--alert-danger-text: var(--color-red-100);",
  ],
};

// ---- write ----------------------------------------------------------------

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = {
  "primitives.css": buildPrimitives(),
  "sizes.css": buildSizes(),
  "typography.css": buildTypography(),
  "theme.css": buildThemeFile(),
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT_DIR, name), content, "utf8");
  console.log("wrote", path.join(OUT_DIR, name));
}

fs.writeFileSync(
  path.join(OUT_DIR, "index.css"),
  `/* Entry point — imports all design-token layers in order. primitives.css,
   sizes.css and typography.css are AUTO-GENERATED by
   scripts/generate-design-tokens.cjs. theme.css is mostly generated too,
   except its --button-danger-*, --select-* and --alert-danger-* blocks,
   which are hand-authored (see the comments at their top) and re-added
   by that same script on every regeneration. */
@import "./primitives.css";
@import "./sizes.css";
@import "./typography.css";
@import "./theme.css";
`,
  "utf8"
);
console.log("wrote", path.join(OUT_DIR, "index.css"));
