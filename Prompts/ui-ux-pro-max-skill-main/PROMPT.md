---
name: ui-ux-pro-max
description: "Comprehensive design guide for web applications. Contains 67 styles, 161 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types. Adapted for the vales-y-prestamos project: React 18 + Vite + Tailwind CSS + Supabase."
---

# ui-ux-pro-max — vales-y-prestamos

Comprehensive design guide for web applications. Contains 67 styles, 161 color palettes, 57 font pairings, 99 UX guidelines, and 25 chart types. Searchable database with priority-based recommendations.

---

## Project Context

**App:** Sistema de Vales y Préstamos (internal management tool)
**Type:** Productivity / Tool — financial management dashboard
**Target audience:** Internal staff managing loans, vouchers, bank accounts, and personal services
**Style keywords:** professional, minimal, clean, data-dense, functional
**Primary colors:** `primary: #1f2937` (dark gray), `secondary: #3b82f6` (blue)

### Tech Stack (Fixed)
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS 3 (with custom `primary` and `secondary` tokens)
- **Icons:** lucide-react
- **Backend:** Supabase (PostgreSQL + Auth)
- **Testing:** Vitest

### Pages & Components
- `ValesPage` — voucher management
- `BancoPage` — bank/loan management
- `PersonalPage` — personal services
- `ConfiguracionPage` — settings
- Shared: `Sidebar`, `ClientForm`, `LoanForm`, `LoansTable`, `ConfirmModal`, `ClientEditModal`

---

## Prerequisites

Check if Python is installed:

```bash
python3 --version || python --version
```

---

## How to Use This Workflow

Reference this prompt (`#ui-ux-pro-max`) in Copilot Chat when working on any UI task:

| Scenario | Trigger Examples | Start From |
|----------|-----------------|------------|
| **New page / view** | "Build a dashboard for loans" | Step 1 → Step 2 |
| **New component** | "Create a payment card" | Step 3 (domain: style, ux) |
| **Choose style / color** | "What palette fits a finance tool?" | Step 2 (design system) |
| **Review existing UI** | "Review LoanForm for UX issues" | Quick Reference checklist |
| **Fix a UI bug** | "Table overflows on mobile" | Quick Reference → layout |
| **Improve / optimize** | "Make this form cleaner" | Step 3 (domain: ux) |
| **Add charts / data viz** | "Add a loans overview chart" | Step 3 (domain: chart) |
| **Stack best practices** | "React performance tips for tables" | Step 4 (stack search) |

---

## Step 1: Analyze Requirements

Extract key information from the request:
- **Product type:** Productivity / Tool (financial management)
- **Style keywords:** professional, minimal, data-dense, functional
- **Stack:** React + Tailwind CSS (this project's fixed stack)
- **Existing tokens:** `bg-primary` (`#1f2937`), `bg-secondary` / `text-secondary` (`#3b82f6`), `bg-gray-100` (page background), `bg-white` (cards/panels)

---

## Step 2: Generate Design System (REQUIRED)

Run this in your terminal and paste the output into Copilot Chat:

```bash
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "financial tool productivity management minimal professional" \
  --design-system -p "Vales y Préstamos"
```

To persist the design system for later sessions:

```bash
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "financial tool productivity management minimal professional" \
  --design-system --persist -p "Vales y Préstamos"
```

This creates `design-system/MASTER.md`. For page-specific rules:

```bash
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "loan table data-dense management" \
  --design-system --persist -p "Vales y Préstamos" --page "vales"
```

**Context-aware retrieval prompt for Copilot:**
```
I am building the [Page Name] page. Read design-system/MASTER.md.
Check if design-system/pages/[page-name].md exists.
If the page file exists, prioritize its rules. Otherwise use MASTER only.
```

---

## Step 3: Supplement with Detailed Searches

After getting the design system, use domain searches for more detail:

```bash
# UI styles that fit this app
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "minimalism professional financial" --domain style

# Color palettes for productivity tools
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "productivity saas tool neutral blue" --domain color

# Typography for data-dense interfaces
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "professional readable data-dense" --domain typography

# Chart recommendations for financial data
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "loans financial summary trend comparison" --domain chart

# UX best practices for forms and tables
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "form validation table accessibility loading" --domain ux

# Landing/layout structure
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "dashboard sidebar navigation admin" --domain landing
```

---

## Step 4: Stack Guidelines (React + Tailwind)

Get React implementation-specific best practices:

```bash
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "table list performance memo rerender" --stack react

python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "form accessibility keyboard validation" --stack html-tailwind

python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "components theming tokens" --stack shadcn
```

---

## Tailwind Conventions for This Project

Always follow these project-specific rules when generating code:

```jsx
// ✅ Use project tokens
<div className="bg-primary text-white">       // dark header/sidebar
<button className="bg-secondary text-white">  // primary actions (blue)
<div className="bg-gray-100">                 // page background
<div className="bg-white rounded-lg shadow">  // card/panel

// ✅ Standard spacing rhythm (4/8px system)
className="p-4 gap-4"     // 16px
className="p-6 gap-6"     // 24px
className="mb-8"          // section spacing

// ✅ Table pattern used in this project
<table className="w-full table-striped">
<thead className="bg-gray-50 text-left text-sm text-gray-600">
<tbody className="divide-y divide-gray-200">

// ✅ Modal/overlay
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">

// ❌ Never hardcode hex values — use Tailwind classes or CSS vars
```

---

## Search Reference

| Domain | Use For |
|--------|---------|
| `product` | Product type patterns (tool, SaaS, productivity) |
| `style` | UI styles (minimalism, flat, professional) |
| `typography` | Font pairings, size scales |
| `color` | Color palettes by product type |
| `landing` | Page layout, navigation patterns |
| `chart` | Chart types for financial data |
| `ux` | Best practices, accessibility, forms |
| `prompt` | AI prompts and CSS keyword hints |

| Stack | Focus |
|-------|-------|
| `react` | Components, hooks, performance |
| `html-tailwind` | Utility-first patterns, forms |
| `shadcn` | Component library best practices |

---

## Pre-Delivery Checklist (Web / Desktop)

Before delivering any UI code for this project:

### Visual Quality
- [ ] Colors only from Tailwind classes (no raw hex in JSX)
- [ ] Uses `primary` / `secondary` tokens for brand colors
- [ ] Icons from `lucide-react` only (no emojis as icons)
- [ ] Consistent icon sizes (`size={16}`, `size={20}`, `size={24}`)
- [ ] Cards use `bg-white rounded-lg shadow` pattern

### Interaction
- [ ] Buttons have `hover:` and `focus:` states
- [ ] Loading states on async operations (disable + spinner)
- [ ] Form errors shown inline near the field
- [ ] Modals closeable via Escape key and backdrop click

### Accessibility
- [ ] Form inputs have visible `<label>` elements
- [ ] Interactive elements keyboard-navigable
- [ ] Color not the only indicator (add icons or text for status)
- [ ] WCAG contrast 4.5:1 for body text

### Layout
- [ ] Responsive: works at `md:` (768px) and below
- [ ] Tables scroll horizontally on mobile (`overflow-x-auto`)
- [ ] Sidebar collapses on mobile (already implemented in `App.jsx`)
- [ ] No horizontal scrollbar on main content

---

## Example Workflow

**Request:** "Add a summary card showing total loans and monthly payments to ValesPage."

### Step 1: Analyze
- Product: financial productivity tool
- Component: summary stat card (data visualization)
- Stack: React + Tailwind

### Step 2: Generate Design System
```bash
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "financial dashboard stat card summary" --design-system -p "Vales y Préstamos"
```

### Step 3: Supplement
```bash
# Chart recommendations for summary stats
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "kpi stat card trend" --domain chart

# UX for data cards
python3 .github/prompts/ui-ux-pro-max/scripts/search.py \
  "data-dense card layout hierarchy" --domain ux
```

### Step 4: Implement
Paste the output into Copilot Chat and ask it to generate the component following the design system recommendations and the Tailwind conventions above.

---

## Tips for Better Results

- Use **multi-dimensional keywords**: `"financial tool minimal data-dense"` not just `"app"`
- Always run `--design-system` first for full recommendations
- For implementation, add `--stack react` or `--stack html-tailwind`
- For dark mode support, search: `--domain style "dark mode professional"`

| Problem | What to Do |
|---------|------------|
| Can't decide on layout | Run `--design-system` with product + style keywords |
| Form UX is poor | `--domain ux "inline-validation error-clarity focus-management"` |
| Table feels cluttered | `--domain ux "data-dense table spacing hierarchy"` |
| Colors feel off | `--domain color "productivity neutral blue"` |
| Need chart recommendations | `--domain chart "financial comparison summary"` |
