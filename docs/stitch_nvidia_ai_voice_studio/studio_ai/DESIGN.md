---
name: Studio AI
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c1cab1'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c947d'
  outline-variant: '#424936'
  surface-tint: '#94da32'
  primary: '#94da32'
  on-primary: '#203700'
  primary-container: '#76b900'
  on-primary-container: '#284400'
  inverse-primary: '#416900'
  secondary: '#bdf4ff'
  on-secondary: '#00363d'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#c0c1ff'
  on-tertiary: '#1000a9'
  tertiary-container: '#9b9eff'
  on-tertiary-container: '#221eb5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#aff74e'
  primary-fixed-dim: '#94da32'
  on-primary-fixed: '#102000'
  on-primary-fixed-variant: '#304f00'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
  panel-padding: 20px
---

## Brand & Style
The design system is engineered for a high-performance AI audio environment, blending the precision of a professional Digital Audio Workstation (DAW) with the clean aesthetics of modern AI development platforms. The brand personality is technical, authoritative, and focused.

The visual style leverages **Glassmorphism** and **Corporate Modern** influences. It utilizes a "Dark Studio" aesthetic where the UI recedes into the background to prioritize audio waveforms and data visualization. Elements are defined by crisp, low-opacity borders and subtle luminescent glows that suggest active intelligence and high-fidelity processing.

## Colors
This design system utilizes a high-contrast dark theme designed for long-duration studio sessions.

- **Primary (Nvidia Green):** Reserved for destructive actions, primary "Process" buttons, and active AI status indicators.
- **Secondary (Electric Blue):** Dedicated to signal processing, waveform visualization, and frequency data.
- **Tertiary (Deep Indigo):** Used for auxiliary tools, secondary navigation, and grouping of metadata.
- **Neutral/Background:** A foundation of Deep Navy (#0F172A) and Obsidian (#020617). Surface colors use subtle transparency (60-80% opacity) to create a layered, "glass console" effect.

## Typography
The typography system prioritizes legibility in low-light environments. 

**Inter** is the primary workhorse for the interface, providing a neutral and modern sans-serif feel. **JetBrains Mono** is employed for all timecodes, decibel readings, sample rates, and technical metadata to ensure character alignment and a "pro-tool" developer aesthetic. All labels use uppercase styling with slight letter spacing to mimic hardware rack gear.

## Layout & Spacing
The design system follows a **Fixed Grid** philosophy for the main workspace panels to mimic a physical console, while sidebars use a fluid model. 

- **Grid:** 12-column layout for dashboard views; 4-column layout for mobile.
- **Rhythm:** A 4px baseline grid ensures tight, technical alignment. 
- **Panels:** The UI is divided into functional "Zones" (Transport, Editor, Inspector). These zones are separated by 1px borders rather than wide gutters to maximize screen real estate for waveform data.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Backdrop Blurs** rather than traditional drop shadows.

- **Surface Levels:** The background is the lowest level. Active panels use a slightly lighter charcoal with a 12px backdrop blur.
- **Glows:** Instead of shadows, active elements (like a "Recording" state) use a 4px outer glow in the primary color (#76B900) with 30% opacity.
- **Borders:** All containers use a 1px solid border at 10% white opacity to define edges against the dark background.

## Shapes
The shape language is "Soft-Technical." Elements use a consistent 4px (0.25rem) corner radius. This creates a precision-milled look that feels modern without becoming too organic or "friendly." 

- **Buttons:** 4px radius.
- **Waveform Containers:** Sharp 0px radius at the bottom to sit flush against the timeline, 4px at the top.
- **Input Fields:** 4px radius with inset "pressed" visual state.

## Components
- **Buttons:** Primary buttons use a solid fill of #76B900 with black text for maximum contrast. Secondary buttons are "Ghost" style with a 1px border and 5% white hover fill.
- **Waveform Displays:** Use a gradient fill of Electric Blue. Backgrounds of waveform displays should be 50% darker than the panel surface.
- **Input Fields:** Darker than the surface color (#020617) with a 1px border. Focus state changes the border color to Electric Blue with a subtle inner glow.
- **Chips/Tags:** Use JetBrains Mono for text. Backgrounds are semi-transparent indigo or charcoal to signify metadata without drawing attention from the primary actions.
- **Knobs & Sliders:** Use custom-drawn circular "Knob" components for audio parameters (Gain, Pan) with an arc-track in Electric Blue to show value levels.
- **Cards:** Semi-transparent (80% opacity) with a 1px "highlight" border on the top and left edges to simulate light hitting a physical edge.