# design/

Claude Design output goes here; code **reads from here, never writes here**.

- `export/` — HTML/CSS/JS downloaded via Design → Export → Code (unzipped). Reference only; it is not copied straight into `app/`, it is translated into Next.js components.
- `screens/` — PNG of each screen (`01-landing.png`, `02-generating.png`, `03-deck-result.png`, `04-refine.png`, `05-errors.png`, `06-mobile-*.png`).
- `tokens.md` — color/font/radius/spacing tokens extracted from the prototype (source for the `@theme` block in `src/app/globals.css`). `export/_ds/organic-*` is Design's default skeleton and is not used.
- `screens.md` — screen → route → component mapping.

If the design changes: re-download the export, update `tokens.md`, write the diff into `CHANGELOG.md`.
