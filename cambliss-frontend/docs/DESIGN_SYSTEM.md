# Design System

## Typography

**Font Family**: Inter (Google Fonts)

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 12px | 400 | Captions, metadata |
| `text-sm` | 13px | 400/500 | Secondary text, labels |
| `text-base` | 14px | 400 | Body text |
| `text-md` | 16px | 500 | Subheadings, emphasis |
| `text-lg` | 20px | 600 | Section titles |
| `text-xl` | 24px | 600 | Page titles |
| `text-2xl` | 32px | 700 | Hero headings (rare) |

**Line heights**: 1.4 for body, 1.2 for headings.

## Color Palette

### Neutrals
| Token | Hex | Usage |
|-------|-----|-------|
| `--ink` | `#0f1114` | Headings, primary text |
| `--body` | `#3b3f4a` | Body text |
| `--muted` | `#6b7280` | Secondary text, placeholders |
| `--border` | `#e5e7eb` | Borders, dividers |
| `--surface` | `#f9fafb` | Card backgrounds, input fills |
| `--white` | `#ffffff` | Page background |

### Brand
| Token | Hex | Usage |
|-------|-----|-------|
| `--brand-900` | `#1a1a2e` | Dark brand, footer bg |
| `--brand-700` | `#2b365c` | Nav background |
| `--brand-600` | `#404d85` | Primary buttons, links |
| `--brand-400` | `#6678c1` | Hover states, accents |
| `--brand-100` | `#eef0f7` | Brand tint backgrounds |
| `--brand-50` | `#f5f6fa` | Subtle brand surface |

### Commerce
| Token | Hex | Usage |
|-------|-----|-------|
| `--price` | `#059669` | Prices, success states |
| `--sale` | `#dc2626` | Sale badges, errors |
| `--rating` | `#f59e0b` | Star ratings, warnings |

## Spacing

Base unit: 4px. Use multiples:
- `4px` (0.25rem) — tight gaps
- `8px` (0.5rem) — inline spacing
- `12px` (0.75rem) — compact padding
- `16px` (1rem) — default padding
- `20px` (1.25rem) — comfortable padding
- `24px` (1.5rem) — section gaps
- `32px` (2rem) — major section spacing
- `48px` (3rem) — page section spacing

## Border Radius

| Usage | Value |
|-------|-------|
| Inputs, small elements | `6px` |
| Cards, containers | `8px` |
| Buttons | `6px` |
| Pills, tags | `9999px` |
| Avatars | `50%` |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle lift |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Cards |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.06)` | Elevated cards, dropdowns |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.08)` | Modals |

## Components

### Button
- Variants: `primary`, `secondary`, `ghost`, `danger`
- Sizes: `sm`, `md`, `lg`
- Always include focus-visible ring
- Disabled state: 50% opacity, no pointer events

### Input
- Height: 40px (md), 36px (sm)
- Border: 1px solid `--border`
- Focus: 2px ring in `--brand-400` at 20% opacity
- Placeholder color: `--muted`

### Badge
- Variants: `default`, `success`, `warning`, `error`
- Sizes: `sm`, `md`
- Border-radius: `9999px`

### ProductCard
- Image aspect ratio: 1:1 (square)
- Subtle border, no heavy shadow
- Hover: slight shadow increase, no scale transform
- Price prominent in `--price` color
- Seller name as subtle metadata

### Skeleton
- Background: `--surface`
- Animated shimmer from left to right
- Match exact dimensions of target content
