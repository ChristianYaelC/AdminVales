---
name: ui-ux-pro-max
description: "Design guide for the current vales-y-prestamos app: React 18 + Vite + Tailwind CSS + Supabase. Use this prompt for UI updates, responsive fixes, and page-level layout decisions."
---

# ui-ux-pro-max — vales-y-prestamos

Use this prompt when working on the current internal management app.

## Project Context

**App:** Sistema de Vales y Préstamos
**Type:** Productivity tool / financial management dashboard
**Audience:** Internal staff managing loans, vouchers, bank accounts, personal services, and recipes
**Style keywords:** professional, minimal, clean, data-dense, functional
**Primary colors:** dark gray for surfaces and blue for actions

### Tech Stack

- React 18 + Vite
- Tailwind CSS 3
- lucide-react
- Supabase (PostgreSQL + Auth)
- Vitest

### Pages

- `ValesPage` for voucher management
- `BancoPage` for bank and monthly product management
- `PersonalPage` for recurring personal services
- `RecetasPage` for printable recipes and exports
- `ConfiguracionPage` for operational settings

### Shared Components

- `Sidebar`
- `ClientForm`
- `LoanForm`
- `LoansTable`
- `ConfirmModal`
- `ClientEditModal`
- `BancoClientForm`
- `BancoLoanForm`
- `BancoInsuranceForm`
- `BancoInsuranceTable`
- `PersonalServiceForm`
- `PersonalServiceTable`
- `recipeExport`

## Current UI Rules

- Keep page headers compact.
- Use a small section label above the main `h1`.
- Keep the `h1` visually dominant, but do not let it float alone without nearby context.
- If a page feels empty, place a count badge inline with the title instead of a detached card.
- `RecetasPage` should keep the recipe count close to the title.
- `PersonalPage` should keep only the service count near the title.
- Avoid extra KPI cards when they make the page feel disconnected.
- Keep cards white, bordered, and lightly shadowed.
- Keep action buttons blue for primary actions and neutral for secondary actions.
- Keep typography consistent across all pages: same compact label, same `h1` scale, same card radius, same spacing rhythm.
- `RecetasPage` may feel a little more editorial because of ingredients and steps, but it must still look like part of the same app shell.
- Do not give `RecetasPage` a completely different visual language, font family, or decorative cookbook style.
- `RecetasPage` should feel fresh through structure and hierarchy, not through a new theme.
- `BancoPage` and its modals should stay stable on laptop sizes; avoid fixed blocks that crop when the content changes.
- In `BancoClientForm`, the existing-client search should stay empty until the user types, then show matches with a fixed-height results area.

## Responsive Modals and Forms

- Modal content must stay usable on laptop screens.
- Prefer scrollable modal bodies over fixed-height layouts that crop content.
- Use `max-h` plus `overflow-y-auto` for long forms.
- Avoid helper callouts that add visual noise if the layout already feels dense.
- In Banco, the "Usar cliente existente" flow should not open with a full client list.
- Show matches only after the user types a name or phone number.
- Keep the search results area at a stable height to avoid layout jumps while typing.

## Tailwind Conventions

```jsx
<div className="bg-primary text-white">       // dark header or sidebar
<button className="bg-secondary text-white">  // primary blue action
<div className="bg-gray-100">                 // page background
<div className="bg-white rounded-lg shadow">  // card or panel
```

```jsx
// Standard spacing rhythm
className="p-4 gap-4"
className="p-6 gap-6"
className="mb-8"
```

```jsx
// Modal pattern for this app
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 z-50">
<div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
```

## Pre-Delivery Checklist

- Colors come from Tailwind classes.
- Buttons have hover and focus states.
- Inputs have visible labels.
- Errors appear inline near the field.
- Modals can be closed with the backdrop or Escape when supported.
- Layout works at `md:` and below.
- Tables scroll horizontally on small screens.
- No horizontal scrollbar on the main content.
- Search result panels keep stable height while typing.
- Modal content never gets cropped on laptop screens.

## Practical Notes

- `BancoPage` uses monthly products and a compact, responsive client selector.
- `RecetasPage` exports recipes to PDF and Word, and the demo recipe is intentionally long enough to test pagination.
- `PersonalPage` is simplified: one count badge near the title and no extra KPI cards.
- `RecetasPage` now uses the same title rhythm as the rest of the app, with the count badge inline so it does not feel isolated.
- Keep the recipe form and export UI clean, readable, and slightly more expressive than the rest, but still grounded in the same design system.
- Keep the design language consistent with the app current state, not the older version.

## When in Doubt

- Favor compact headers.
- Favor stable layouts over decorative blocks.
- Favor responsive scrollable panels over fixed sizes.
- Favor clarity over extra text.
