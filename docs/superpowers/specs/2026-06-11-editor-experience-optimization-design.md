# PinBean Editor Experience Optimization Design

## Purpose

PinBean should feel like a polished creative workbench, not a loose collection of controls. The next product step is to make the core editor flow feel fast, clear, and professional:

1. Upload an image.
2. Understand the recommended bead size and cost.
3. Generate a bead grid.
4. Edit colors confidently.
5. Export a usable production file.
6. Save or publish when ready.

The target experience is: a new user can create and export a usable bead pattern within one minute, while a returning user still has enough control to refine the result.

## Rollback And Release Safety

Current protected baseline:

- Baseline commit: `ac3934393453c6d168ab2937544e3649428b8d09`
- Backup branch: `backup/before-editor-optimization`

Implementation must be done in small commits. If a change is rejected after it has been pushed, revert the relevant optimization commit instead of rewriting history. Do not use destructive reset commands unless explicitly requested by the user.

Each implementation slice must pass:

```bash
npm run lint
npm run build
```

## Design Direction

The visual direction is "Warm Craft Studio + Precision Tool".

- Professional tool layout: clear sections, stable controls, predictable interactions.
- Handcraft warmth: bead-like color swatches, soft material cues, tasteful motion.
- High design quality without visual clutter: no oversized marketing composition inside the editor.
- First screen remains a usable tool, not a landing page.
- Mobile uses bottom tools and drawers instead of squeezing the desktop sidebar.

The interface should use `lucide-react` icons for tool buttons where suitable, compact controls, stable dimensions, and restrained color accents. UI should look refined and intentional, but editing and exporting must remain the priority.

## Scope

### In Scope

- Upload summary with original image size, recommended grid size, bead count, and aspect ratio.
- Size presets for small, medium, and large projects.
- Aspect-ratio lock while editing width or height.
- Color complexity selector with three practical modes.
- Editor toolbar visual upgrade.
- Current color display with bead id, HEX, and swatch.
- Color statistics items that can set the active brush color.
- Export settings panel for PNG and Excel output.
- Toast feedback for common success and error states.
- Focused utility extraction where it reduces risk and improves testability.

### Out Of Scope

- Rebuilding the community feed.
- Changing Supabase schema.
- Replacing the routing/navigation model.
- Adding a large UI framework.
- Introducing advanced image processing libraries in the first pass.
- Reworking authentication or profile flows beyond feedback messages.

## User Flow

### Upload And Generate

When a user selects an image, show a compact summary:

- Original image dimensions.
- Recommended bead grid.
- Estimated total beads.
- Aspect ratio.
- Current selected preset.

Size presets:

- Small: optimized for charms and small magnets.
- Medium: balanced default.
- Large: better detail, higher bead count.
- Custom: direct width and height input.

The editor should keep a "lock ratio" option enabled by default. If the user changes width, height follows the image ratio; if they disable the lock, both dimensions can be edited independently.

### Color Complexity

Add three modes:

- Simplified: fewer colors for beginner-friendly, cheaper builds.
- Balanced: default mode.
- Detailed: keeps more color variation for high-detail patterns.

First implementation can use a practical post-processing pass: after generating the grid, keep the most common colors up to a mode-specific limit and remap less common colors to their nearest retained color. This avoids adding heavy algorithmic complexity in the first release.

Suggested first limits:

- Simplified: 24 colors.
- Balanced: 48 colors.
- Detailed: 96 colors or no limit if the palette result is already below that threshold.

### Editor Toolbar

Move the most-used editing controls into a stable toolbar near the canvas:

- Undo.
- Redo.
- Zoom out.
- Zoom value.
- Zoom in.
- Fit view.
- Show color code.
- Eyedropper.
- Current brush color.

Toolbar controls should use icons with tooltips where possible. The current color control should show a swatch, bead id, and HEX value.

### Color Statistics As Editing Controls

Color statistics should remain a material planning panel, but each row should also be useful for editing:

- Swatch.
- Bead id.
- HEX value.
- Count.
- Percentage of total beads.
- Set as brush action.
- Replace color action, if it fits the current UI.

Clicking a color row should set it as the active brush color. This is a low-risk improvement with high usability value.

### Export Panel

PNG export should expose settings instead of only fixed buttons:

- Show color codes.
- Show grid lines.
- Background: white, transparent, or custom in a later pass.
- Quality: standard, high, print-friendly.

Excel export should include:

- Project title.
- Grid width and height.
- Total bead count.
- Number of colors.
- Export timestamp.
- Material rows sorted by count descending.

### Feedback

Replace common `alert()` calls with toast feedback:

- Palette import success.
- Palette import failure.
- Palette reset.
- Local save success.
- Cloud save failure after local save succeeds.
- Export success where useful.

Delete confirmation can stay as `confirm()` in the first pass unless a confirmation modal is already being touched for another reason.

## Architecture

Keep the main editor state in `AppShell` for the first pass, but move new presentation and calculation concerns into focused modules.

Proposed new components:

- `GenerationSummary.tsx`: image dimensions, recommended size, bead count, aspect ratio, selected preset.
- `SizePresetControl.tsx`: preset selection, locked ratio controls, custom width and height fields.
- `EditorToolbar.tsx`: canvas editing toolbar.
- `ExportPanel.tsx`: PNG and Excel output settings.
- `Toast.tsx` or `ToastProvider.tsx`: lightweight feedback.

Proposed utility functions:

- `getRecommendedGridSize(imageWidth, imageHeight, preset)`.
- `getEstimatedBeadCount(width, height)`.
- `getAspectLockedSize(width, height, changedSide)`.
- `reduceGridColors(grid, palette, maxColors)`.

Existing modules to extend:

- `src/App.tsx`: wire new state and components.
- `src/lib/imageToBeads.ts`: add optional color reduction or export helper.
- `src/lib/exportPng.ts`: accept additional export options.
- `src/lib/exportExcel.ts`: include richer project metadata and sorting.
- `src/components/ColorStats.tsx`: support active brush selection.
- `src/components/BeadCanvas.tsx` or `CanvasGrid.tsx`: integrate toolbar-related props without moving core rendering.

## Data Flow

1. `handleFileChange` reads the image and stores file metadata.
2. Recommendation utilities compute size presets and bead estimates.
3. User chooses preset, dimensions, and color complexity.
4. `handleGenerate` creates the bead grid.
5. If selected, color reduction remaps the generated grid.
6. Grid state enters `useHistoryState`.
7. Toolbar and color stats update editing state.
8. Export panel passes explicit settings to PNG or Excel export functions.
9. Toasts report success or recoverable failure.

## Error Handling

- Invalid images: show inline message near upload controls.
- Oversized grids: warn about bead count and performance before generation.
- Palette CSV errors: toast with the parser error message.
- Export errors: toast with a short failure message.
- Cloud save failure: keep local save as successful and communicate cloud sync failure.

Do not allow expected user mistakes to fail silently.

## Testing And Verification

Manual verification:

- Upload a landscape image and confirm recommended dimensions keep ratio.
- Upload a portrait image and confirm presets adjust correctly.
- Generate in Simplified, Balanced, and Detailed modes and compare color counts.
- Click a color stat row and paint with that color.
- Export PNG with and without color codes.
- Export Excel and confirm metadata and sorted material rows.
- Save locally and confirm toast feedback.
- Run desktop and mobile viewport checks.

Command verification:

```bash
npm run lint
npm run build
```

If tests are introduced later, add focused tests for recommendation utilities, aspect-ratio locking, color reduction, and export metadata.

## Implementation Slices

1. Safety setup and utility extraction.
2. Upload summary, size presets, and aspect-ratio lock.
3. Color complexity and color reduction.
4. Editor toolbar and active color display.
5. Color statistics interaction.
6. Export panel improvements.
7. Toast feedback replacement.
8. Final polish, responsive checks, lint, and build.

Each slice should be a small commit. If the user dislikes a slice, revert that commit.

## Open Decisions

- Whether Detailed mode should be capped at 96 colors or left uncapped.
- Whether transparent pixels should become a special empty cell in this first pass or later.
- Whether the first implementation needs a custom confirmation modal for delete actions.

Recommended defaults:

- Cap Detailed mode at 96 colors for predictable material planning.
- Defer transparent empty cells to a later pass.
- Keep native delete confirmation for now.
