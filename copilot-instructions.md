# Project Interface Standards

Use this file as the shared UI contract for every page in the project. It is intentionally compact so future features can reuse the same patterns without re-reading long prompt files.

## Visual System

- Use a white surface-first layout with subtle borders, soft shadows, and light gray page backgrounds.
- Keep typography consistent with the app base font stack already defined in `src/index.css`.
- Prefer clear hierarchy over decorative color blocks.
- Avoid saturated colors in summary cards unless a state or action needs emphasis.

## Page Structure

- Keep a compact header with title, short description, and clear spacing below.
- Use reusable metric cards at the top of each page when summary data is helpful.
- Keep the content area split into a narrow list pane and a main detail pane when the page manages records.
- Keep forms grouped by meaning: metadata, items, long text, actions.

## Forms

- Labels must stay above the fields and align to the same baseline rhythm.
- Long text fields such as notes, steps, or recommendations should use `textarea`, `resize-y`, and a comfortable minimum height.
- Optional notes belong below the primary row, not inside a crowded horizontal grid.
- Use clear helper text only when it reduces confusion.

## Buttons

- Primary actions use the blue app button style.
- Secondary actions stay neutral white or gray.
- Destructive actions use red with enough contrast.
- Export actions should be visually distinct by format when there is more than one option.

## Cards and Lists

- Keep list items clean, with readable metadata and enough vertical spacing.
- Use rounded white cards with subtle borders for detail blocks.
- Avoid heavy gradients unless they improve scanability.

## Export Rules

- Word exports must use `.docx` naming and MIME type.
- PDF exports must keep red styling when shown as buttons.
- Document export buttons should always explain the target format.

## Reusable Implementation Notes

- When adding a new page, check this file first and then read the page-specific docs.
- When changing an existing page, preserve the same layout language used by Vales, Banco, Personal, and Recetas.
- Prefer small additions over redesigning unrelated pages.