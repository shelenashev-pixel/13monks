---
name: figma-component-sync
description: Generate Figma icons and multi-variant component sets (e.g. Button) from project SVGs via a self-contained Figma Console script, then migrate draft UI to instances. Use when building or re-syncing a Figma design system from code, or when the Figma MCP cannot edit nodes.
---

# Figma component sync

Output is one paste-ready Plugin API script (`drafts/figma-sync.js` is the reference implementation). It must be idempotent: re-running it leaves the file clean.

## 1. Zero-draft strategy
- Never parse, convert or restyle draft/orphan canvas nodes. Delete known drafts by node ID instead.
- Embed the project SVGs (`images/ui-icons/*.svg`) as strings, with `currentColor` replaced by `#000`.
- Per icon: `figma.createNodeFromSvg(svg)`, `resize(24, 24)`, `clipsContent = false`, `fills = []`.
- Walk vector, line, ellipse and boolean nodes: `strokeWeight = 2`, `strokeCap = 'SQUARE'` (not on ellipses), `strokeJoin = 'MITER'`.
- Bind the stroke with `figma.variables.setBoundVariableForPaint(paint, 'color', variable)`. Use `primary` if it exists, otherwise `color/text/primary`.
- `figma.createComponentFromNode(frame)`, name it kebab-case with no size suffix, and put all icons in ONE section named `Icons`.
- Before creating the section, remove existing sections with that name on every page.

## 2. Component set assembly
- Declare the variant matrix as data (Size x Content x Type x State). Name each variant `Prop=Value, Prop=Value`.
- Create each variant with `figma.createComponent()`. Use auto-layout, a fixed height, and bind fills, strokes, spacing and text colour to variables. Create missing variables in the existing collection first.
- Re-parent every variant into the host before combining: `for (const c of comps) host.appendChild(c)`, then `figma.combineAsVariants(comps, host)`. The host must be on the same page as the variants, or the call throws "Grouped nodes must be in the same page as the parent".
- After combining, add properties on the set (`addComponentProperty`: TEXT `label`, INSTANCE_SWAP `icon`) and wire `componentPropertyReferences` on the child nodes.
- Lay the variants out on a grid and `resizeWithoutConstraints` the set.
- Re-runs: delete loose `COMPONENT` nodes named `Size=...` whose parent is not a `COMPONENT_SET`. Rename any previous set to `<Name> (old)` instead of deleting it, so existing instances don't break.

## 3. Safe layout migration
- Iterate every page except the icons page. Match drafts by type, size and text, or by name regex. For example: a 40px horizontal frame with a single TEXT child matching a known label, or a 40x40 frame named like `close|map|pin`.
- Skip anything inside an instance. Walk `parent` up and check for `INSTANCE`, because moving nodes into or out of instances throws.
- Wrap each swap in `try/catch`. On failure, remove the freshly created instance, `console.warn` the node ID, and continue.
- Create instances with `variant.createInstance()`, then `setProperties` using keys looked up by prefix (keys carry a `#id` suffix). Copy `x`, `y` and FILL sizing from the draft, insert at the same index, then remove the draft.
- Count only successful swaps and report them via `figma.notify`.

## Gotchas
- Call `await figma.loadAllPagesAsync()` before any cross-page `findAll`. Call `loadFontAsync` before setting text.
- Local variables: `getLocalVariablesAsync()`. Filter by `resolvedType`, since names can collide.
- TalkToFigma MCP can only read and export. Node edits need the console script.
- Figma MCP 403 "Invalid token" means a token problem on the user's side, not something to retry.
- Do not run the script blind: report that it is untested if it was not run.
