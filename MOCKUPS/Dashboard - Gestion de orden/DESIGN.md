---
name: Kinetic Kitchen
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  sidebar-width: 320px
---

## Brand & Style
The design system focuses on high-utility SaaS principles tailored for the high-pressure environment of restaurant management. The personality is professional, systematic, and reliable. The emotional response is one of control and clarity—minimizing cognitive load for floor managers and staff through high-contrast affordances and a rigorous hierarchy of information.

The visual style is **Corporate / Modern** with a strong emphasis on functional minimalism. It prioritizes the "glanceability" of data, using a flat design language with crisp borders to define zones of interaction. The UI avoids decorative flourishes in favor of dense, actionable information layouts that feel architectural and robust.

## Colors
The color strategy is state-driven. The **Deep Slate** primary color provides a grounded structural frame for navigation. Functional states are mapped to high-visibility semantic colors:
- **Success (Emerald):** Denotes 'LIBRE' or 'READY' states, signaling that action is complete or the table is available.
- **Warning (Amber):** Used for 'OCUPADA' or 'PREPARING' states to draw attention to active processes without creating alarm.
- **Danger (Soft Red):** Reserved for 'PENDING' orders or critical kitchen errors.
- **Neutral Low Grey:** Specifically utilized for inactive or 'available' structural elements (like empty table rectangles) to recede into the background, allowing active states to pop.

## Typography
Typography is optimized for maximum legibility and structural alignment. **Inter** is the workhorse for the majority of the interface, providing a neutral and modern tone. **JetBrains Mono** is utilized strictly for numeric data, price displays, and Order IDs; its fixed-width character set ensures that columns of prices remain perfectly aligned, facilitating quick mental math for staff.

For mobile views, large display headers are scaled down to `headline-md` sizes to preserve screen real estate for the grid system.

## Layout & Spacing
The system uses a **Fixed Grid** approach for the main dashboard content to ensure consistency across POS terminals. The primary layout consists of a 12-column grid for the main canvas, flanked by a fixed-width (320px) right-side catalog sidebar.

- **Desktop:** 12-column grid, 24px margins, 16px gutters.
- **Tablet:** 8-column grid, 16px margins, 12px gutters. The sidebar becomes a collapsible drawer.
- **Mobile:** 4-column fluid grid. The table layout switches from a multi-column grid to a vertical list of status-coded cards.

Spacing follows a strict 4px baseline rhythm to maintain a compact, "information-dense" environment suitable for pro-user tools.

## Elevation & Depth
In alignment with the "Flat Design" requirement, the design system minimizes the use of shadows. Depth is communicated primarily through **Tonal Layers** and **Low-contrast Outlines**.

- **Level 0 (Background):** The off-white `#F8FAFC` base.
- **Level 1 (Cards/Sidebar):** Pure white background with a 1px solid border (`#E2E8F0`). No shadow.
- **Level 2 (Active/Hover):** A subtle 2px border in the Primary or Secondary color to indicate focus.
- **Modals:** For critical interruptions, a soft, diffused shadow (10% opacity) is permitted to separate the dialog from the dense data background, paired with a subtle backdrop blur.

## Shapes
The shape language is "Soft" yet geometric. A standard `0.25rem` (4px) corner radius is applied to buttons, inputs, and cards. This slight rounding softens the "brutalist" edge of the high-contrast UI while maintaining a professional, structured appearance. Status badges and chips use a `rounded-full` (pill) shape to distinguish them from actionable buttons and interactive cards.

## Components
- **Table Cards:** Rectangular containers with a 1px border. The header of the card uses a background color corresponding to the table status (Success/Warning/Neutral).
- **Status Badges:** Small pill-shaped elements with high-contrast text. Use the semantic palette (e.g., Green background with Dark Green text).
- **Buttons:**
  - *Primary:* Solid Deep Slate with white text.
  - *Secondary:* Ghost style with 1px Slate border.
  - *Action:* Large, tactile touch targets for mobile/tablet POS use.
- **Sidebar Catalog:** Category tabs at the top, followed by a compact vertical list of product cards. Product cards include a small thumbnail, title in `body-md`, and price in `data-mono`.
- **Input Fields:** Squared corners (4px), 1px solid borders, and clear `label-md` headers sitting above the field. Validation states use the Danger or Success colors for the border and helper text.
- **Lists:** Clean, zebra-striped rows for order history, using `data-mono` for all quantity and price columns to ensure alignment.