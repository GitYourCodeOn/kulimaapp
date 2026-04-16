# Design System Document: The Verdant Grid

## 1. Overview & Creative North Star: "The Digital Agronomist"
This design system moves beyond the utility of a standard SaaS to create a high-end, editorial experience. Our Creative North Star is **"The Digital Agronomist"**—a philosophy that balances the raw, organic nature of agriculture with the sharp, mathematical precision of modern data science.

We reject the "boxed-in" look of traditional software. Instead of rigid grids and heavy borders, we use **intentional asymmetry** and **tonal layering**. This system creates an environment that feels as vast as a field yet as organized as a laboratory. We achieve "Stripe-level" density not through clutter, but through masterful typography and the ruthless elimination of visual noise.

---

## 2. Colors & Surface Philosophy
Our palette is rooted in the earth but refined by technology. We use a sophisticated range of greens and off-whites to create a "living" interface.

### The Palette (Material Design Tokens)
*   **Primary (The Forest):** `#004c22` (Core actions and brand presence)
*   **Primary Container (The Canopy):** `#166534` (Deep branding and high-emphasis surfaces)
*   **Surface / Background:** `#f8faf8` (The canvas; a breathable, organic off-white)
*   **Surface Container Tiers:**
    *   `Lowest (#ffffff)`: Floating cards and high-priority data points.
    *   `Low (#f2f4f2)`: Standard sectioning.
    *   `Highest (#e1e3e1)`: Deeply recessed areas like sidebars or footers.

### The "No-Line" Rule
Standard 1px borders are prohibited for sectioning content. Boundaries must be defined through **background color shifts**. To separate a data table from a sidebar, use a transition from `surface` to `surface-container-low`. We define space through mass, not outlines.

### Signature Textures & Glassmorphism
To capture the "Apple-level" premium feel, use `surface-container-lowest` with a 80% opacity and a `20px` backdrop-blur for floating navigation or hovering modals. This creates a "frosted glass" effect that maintains the organic flow of the background colors while providing clear functional elevation.

---

## 3. Typography: The Editorial Edge
We use **Inter** exclusively. The power of this system lies in the dramatic contrast between massive Display styles and hyper-legible Body text.

*   **Display (The Horizon):** `display-lg` (3.5rem) / -0.02em tracking. Used for high-impact landing moments.
*   **Headline (The Field):** `headline-sm` (1.5rem) / Semibold. Used for primary module titles.
*   **Title (The Crop):** `title-sm` (1rem) / Medium. Used for card headers.
*   **Body (The Soil):** `body-md` (0.875rem) / Regular. The workhorse for all data and descriptions.
*   **Label (The Tag):** `label-sm` (0.6875rem) / Bold / Uppercase / +0.05em tracking. Used for status badges and metadata.

**Hierarchy Note:** Lean on the `on-surface-variant` (#404940) for secondary labels to create a "soft-focus" effect around primary data points.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, depth is biological, not mechanical. We avoid harsh dropshadows in favor of **Tonal Stacking**.

*   **The Layering Principle:** To create a "card," place a `surface-container-lowest` (#ffffff) object onto a `surface-container-low` (#f2f4f2) background. The 2% shift in brightness provides all the separation the human eye needs.
*   **Ambient Shadows (Hover Only):** Only apply shadows during active states (e.g., hovering over a field map card). Use a hyper-diffused shadow: `0 20px 40px rgba(15, 31, 15, 0.05)`. The shadow color is a tinted "Near-Black," never pure grey.
*   **The Ghost Border:** For high-density data inputs where separation is legally or functionally required, use the `outline-variant` token at **15% opacity**. It should feel like a suggestion of a line, not a wall.

---

## 5. Component Guidelines

### Buttons: The Tactile Seed
*   **Primary:** `primary` background with `on-primary` text. No border. `md` (0.375rem) corner radius.
*   **Secondary:** `surface-container-highest` background. Blends into the layout until needed.
*   **Tertiary:** Ghost style. No background; text-only using `primary` color. High-density environments only.

### Cards & Lists: The Open Acre
*   **Forbid Dividers:** Use the Spacing Scale (24px or 32px gaps) to separate list items. 
*   **Density:** For Stripe-level data density, use `body-sm` for table rows with a `surface-container-low` background on every second row (zebra striping) rather than using horizontal lines.

### Input Fields: The Structured Data
*   **Style:** Minimalist. No background fill. Only a `bottom-border` using the Ghost Border rule (15% `outline-variant`). On focus, the border transitions to `primary` at 2px thickness.

### Signature Component: The "Growth Micro-Chart"
*   In every data card, include a sparkline using a subtle gradient fill from `primary` to `transparent`. This provides the only "visual soul" allowed in the data-heavy views.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace the Void:** Use 48px+ padding for page margins. Space is a luxury; use it.
*   **Nesting over Bordering:** Nest a `surface-container-lowest` card inside a `surface-container-low` section to show hierarchy.
*   **Align to the Type:** Use the baseline of your typography to align adjacent icons and buttons.

### Don’t:
*   **Don't use 100% Black:** Never use #000000. Use `on-surface` (#191c1b) for text to maintain the organic, soft-black feel.
*   **Don't Box Everything:** Avoid "card-itis." If data can live directly on the background without a container, let it breathe.
*   **Don't use Heavy Shadows:** If the shadow looks like a shadow, it’s too dark. It should look like "ambient occlusion."