---
name: Studio AI Visual Framework
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#cac4d4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#948e9d'
  outline-variant: '#494552'
  surface-tint: '#cebdff'
  primary: '#cebdff'
  on-primary: '#381385'
  primary-container: '#a78bfa'
  on-primary-container: '#3c1989'
  inverse-primary: '#674bb5'
  secondary: '#becca3'
  on-secondary: '#293417'
  secondary-container: '#414d2e'
  on-secondary-container: '#b0be96'
  tertiary: '#ecbbba'
  on-tertiary: '#472828'
  tertiary-container: '#bf9292'
  on-tertiary-container: '#4c2c2c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e8ddff'
  primary-fixed-dim: '#cebdff'
  on-primary-fixed: '#21005e'
  on-primary-fixed-variant: '#4f319c'
  secondary-fixed: '#dae8be'
  secondary-fixed-dim: '#becca3'
  on-secondary-fixed: '#141f05'
  on-secondary-fixed-variant: '#3f4b2c'
  tertiary-fixed: '#ffdad9'
  tertiary-fixed-dim: '#ecbbba'
  on-tertiary-fixed: '#2f1314'
  on-tertiary-fixed-variant: '#603d3e'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  code-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

This design system is engineered for a sophisticated AI workspace that balances technical precision with a softened, human-centric aesthetic. Moving away from aggressive high-contrast accents, the system embraces a **Modern Tonal** approach. 

The brand personality is authoritative yet approachable—think of a high-end architectural studio mixed with a cutting-edge developer environment. We achieve this through:
- **Minimalist Layouts:** Leveraging generous whitespace (or "negative space" in dark mode) to reduce cognitive load during complex AI workflows.
- **Glassmorphism:** Sublte translucent layers and backdrop blurs are used to indicate depth and context without breaking the flow of the workspace.
- **Technical Sophistication:** A focus on micro-interactions and precise typography that reflects the power of the underlying AI, while the soft color palette ensures a long-duration, low-fatigue user experience.

## Colors

The color strategy shifts from a single high-energy accent to a curated trio of muted, organic tones. This allows for multi-modal information density where color indicates category rather than just attention.

- **Primary (Lavender):** Used for primary actions, active AI states, and core branding elements. It provides a modern, slightly futuristic feel.
- **Secondary (Sage):** Employed for "success" states, stable processes, and secondary navigation elements. It grounds the UI in a natural, calm tone.
- **Tertiary (Dusty Rose):** Utilized for highlights, warnings that require attention without alarm, and decorative accents in data visualization.
- **Neutral:** A range of "Ink" and "Paper" tones. In dark mode, we use deep charcoals with a hint of blue-grey to prevent pure-black eye strain. In light mode, we use soft greys to maintain a "clean room" aesthetic.

**Application:** Use tonal variations (low saturation, high luminance) for backgrounds of chips and alerts to maintain a "sophisticated muted" appearance.

## Typography

This design system utilizes a dual-font pairing to distinguish between "Interface" and "Content."

- **Manrope (Headlines):** A modern, geometric sans-serif that provides a professional yet warm tone for titles and branding.
- **Geist (Body & Mono):** A highly legible, developer-focused typeface used for all UI labels, body text, and code snippets. Its technical precision reinforces the "AI Studio" character.

**Hierarchy Rules:**
- Use `display-lg` sparingly for hero sections or dashboard summaries.
- `label-caps` should be used for section headers in sidebars and metadata labels.
- All body text should maintain a minimum 1.5x line-height to ensure readability in data-dense environments.

## Layout & Spacing

This design system follows a **4px baseline grid** with a fluid-fixed hybrid layout model.

- **Desktop:** A 12-column grid with a fixed maximum width of 1440px for content containers. Sidebars remain at a fixed width (e.g., 280px) while the main canvas fluidly adjusts.
- **Tablet:** Transitions to an 8-column grid with 16px margins. Sidebars typically collapse into a drawer.
- **Mobile:** A 4-column grid with 16px margins. Content stacks vertically, and complex data tables should transition to card-based views.

**Spacing Rhythm:** Use `md` (16px) for standard component padding and `lg` (24px) for logical grouping of elements.

## Elevation & Depth

Depth is communicated through **Tonal Layering** rather than heavy shadows. This maintains a flat, modern aesthetic while clearly defining hierarchy.

- **Level 0 (Base):** The main background color (`bg_dark` or `bg_light`).
- **Level 1 (Surface):** Card backgrounds and secondary panels. Use a slightly lighter (in dark mode) or slightly darker/bordered (in light mode) surface.
- **Level 2 (Floating):** Modals and popovers. These utilize a subtle backdrop blur (12px) and a low-opacity border (10% white or 10% black) to separate them from the content below.
- **Shadows:** When used, shadows must be "Ambient"—low opacity (0.05), large blur (24px+), and tinted with the primary Lavender color to maintain a cohesive glow.

## Shapes

The shape language is defined as **Rounded (0.5rem base)**. This soft geometry offsets the "cold" nature of technical AI tools, making the interface feel more like a productivity partner.

- **Buttons & Inputs:** 0.5rem (8px) corner radius.
- **Cards & Modals:** 1rem (16px) corner radius.
- **Tags & Status Badges:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid Lavender background with white text. No gradient.
- **Secondary:** Ghost style with a 1px border of the accent color and a subtle tonal hover state.
- **Tertiary:** Purely typographic with a subtle underline or background shift on hover.

### Input Fields
- **Default State:** A 1px border using the neutral-muted tone.
- **Focus State:** 1px Lavender border with a soft Lavender outer glow (2px).
- **Technical Style:** Labels are always positioned above the input in `label-caps` typography.

### Cards
- Cards do not use shadows by default. They use a 1px border (`surface-light/dark` + 5% contrast) to define boundaries. In dark mode, a subtle top-light edge highlight (0.5px) can be added for extra refinement.

### Chips & Badges
- Used for AI tags, categories, or status. These should use the muted accent palette (Sage for success, Dusty Rose for alerts) with 10% background opacity and 100% foreground text opacity.

### AI Progress Indicators
- Avoid standard circular loaders. Use a shimmering "tonal pulse" animation using a gradient move between Lavender and Sage across the component surface.