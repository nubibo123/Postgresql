---
name: SecureBank
colors:
  surface: '#0c1324'
  surface-dim: '#0c1324'
  surface-bright: '#33394c'
  surface-container-lowest: '#070d1f'
  surface-container-low: '#151b2d'
  surface-container: '#191f31'
  surface-container-high: '#23293c'
  surface-container-highest: '#2e3447'
  on-surface: '#dce1fb'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dce1fb'
  inverse-on-surface: '#2a3043'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#89ceff'
  on-secondary: '#00344d'
  secondary-container: '#00a2e6'
  on-secondary-container: '#00344e'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#a078ff'
  on-tertiary-container: '#340080'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#0c1324'
  on-background: '#dce1fb'
  surface-variant: '#2e3447'
  glass-surface: rgba(15, 23, 42, 0.65)
  glass-border: rgba(255, 255, 255, 0.1)
  success-glow: '#10b981'
  danger-glow: '#ef4444'
  warning-glow: '#f59e0b'
  obsidian-deep: '#020617'
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
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system for this professional banking application is built on the **Dark Glassmorphism** aesthetic, optimized for a high-tech, enterprise-grade financial environment. It balances the cutting-edge feel of a fintech startup with the rigorous stability expected of a traditional institution.

The core visual metaphor is one of "Obsidian Depth"—where the interface feels like a physical pane of dark glass floating over a deep, structural void. This is achieved through:

- **Semi-transparent surfaces:** Using `backdrop-filter: blur(12px)` to create a sense of layering and material honesty.
- **Luminescent Accents:** High-vibrancy blue elements that act as light sources within the dark environment, guiding the user toward primary actions.
- **Precision Engineering:** Sharp, intentional alignment and subtle 1px "glowing" borders that define boundaries without the need for heavy shadows.
- **Trust-Centric Modernity:** Avoiding the clutter of legacy banking apps in favor of expansive whitespace and focused information density.

The target audience consists of tech-savvy individuals and administrators who value security, speed, and a sophisticated aesthetic that mirrors the complex PostgreSQL architecture powering the backend.

## Colors

The palette is rooted in deep obsidian and navy tones to provide a low-strain, high-focus environment. 

- **Primary Blue (#3b82f6):** Reserved for high-priority actions, active states, and brand-critical indicators. It should appear to "emit light" against the dark background.
- **Secondary & Tertiary:** Used for data visualization (charts) and differentiating account types (e.g., Loans vs. Savings).
- **Glass System:** The `glass-surface` and `glass-border` tokens are fundamental. Surfaces must maintain a high enough contrast for legibility while remaining translucent. 
- **Semantic Colors:** Success, Danger, and Warning colors use high-saturation variants to ensure they cut through the dark glass layers clearly.

The default mode is strictly **Dark**. Light mode is not supported in this design system to maintain the glassmorphism integrity and visual security.

## Typography

This design system utilizes **Inter** for all primary interface elements due to its exceptional legibility in digital environments and its systematic, neutral character. 

To reinforce the high-tech, secure nature of the banking system, **JetBrains Mono** is introduced for labels, account numbers, and transaction IDs. This monospaced font provides a distinct "audit log" feel that matches the backend's focus on precision and security.

- **Headlines:** Use tight letter spacing and heavier weights to anchor the layout.
- **Numbers:** Always prioritize tabular figures where possible (built-in to Inter) to ensure currency values align vertically in tables.
- **Labels:** Monospaced labels should be uppercase when used for technical metadata (e.g., UUIDs or Transaction Hashes).

## Layout & Spacing

The layout follows a **Fluid Grid** model with strict horizontal constraints to ensure a premium, centered feel on larger displays.

- **Grid Model:** 12-column system for desktop, 8-column for tablet, and 4-column for mobile.
- **Rhythm:** An 8px base unit (2x the `unit` variable) governs all spacing between elements to maintain a mathematical, engineered feel.
- **Containers:** All dashboard content is housed within glass-morphic cards that utilize `stack-md` (16px) for internal padding.
- **Breakpoints:**
  - **Mobile:** < 640px. Content stacks vertically. Navigation moves to a bottom bar or simplified hamburger menu.
  - **Tablet:** 640px - 1024px. 2-column card layouts permitted.
  - **Desktop:** > 1024px. Sidebar navigation is fixed to the left, with the main content area using the `container-max` width.

## Elevation & Depth

In a glassmorphic system, elevation is conveyed through **Z-axis Layering** and **Transparency Differentials** rather than traditional black shadows.

1.  **Level 0 (Base):** The `obsidian-deep` background. This is the foundation of the app.
2.  **Level 1 (Surface):** Main dashboard cards. Use `glass-surface` with a 1px `glass-border`. The border should have a linear gradient from top-left (more opaque) to bottom-right (less opaque) to simulate a light source.
3.  **Level 2 (Navigation/Overlays):** Sidebars and persistent headers. These have a slightly higher opacity and a stronger backdrop-blur (20px) to distinguish them from the content they float over.
4.  **Level 3 (Popovers/Modals):** These use the highest level of contrast. Add a subtle "glow" shadow using the primary blue color at very low opacity (10-15%) to make the modal appear as though it is energized.

**Interaction States:** When a user hovers over a glass card, the border opacity should increase, and the background blur should subtly intensify, creating a "magnetic" focus effect.

## Shapes

The design system uses a **Rounded (2)** shape language. While the environment is "technical," overly sharp corners feel aggressive and dated. 

- **Cards/Containers:** Use `rounded-lg` (1rem / 16px) for main dashboard elements.
- **Buttons/Inputs:** Use `rounded` (0.5rem / 8px). This provides a professional, stable appearance.
- **Status Indicators/Chips:** Use `rounded-full` (Pill-shaped) to distinguish them from actionable buttons.
- **Glow Borders:** Apply a 1px stroke to all shapes. This "rim lighting" is essential for visibility in dark mode.

## Components

### Buttons
- **Primary:** Solid `#3b82f6` with white text. Apply a subtle outer glow of the same color.
- **Secondary:** Glass background with a 1px primary-colored border.
- **Danger:** Solid `#ef4444` for "Close Account" or "Delete" actions.

### Input Fields
- Background uses a darker, more opaque version of the glass surface to signify "inset" depth.
- Focus state: The 1px border transitions to the primary blue, and a faint blue outer glow appears.
- Labels are always `label-sm` in JetBrains Mono.

### Cards (The "Glass" Container)
- The fundamental unit of the UI.
- Must include `backdrop-filter: blur(12px)`.
- Use for account summaries, recent transactions, and loan applications.

### Lists & Tables
- Transaction rows should have a subtle hover state that slightly brightens the glass background.
- Use JetBrains Mono for all currency amounts and account numbers (`SB-XXXX-XXXX-XX`).
- Status chips (Pending, Completed, Locked) use high-contrast text on a low-opacity background of the same semantic color.

### QR Code Modal
- The QR code itself should be presented on a clean white background (to ensure scannability) but wrapped in a heavy glassmorphic frame.
- Include a "Download as PNG" button using the primary button style.

### Data Visualization
- Recharts should use the `primary`, `secondary`, and `tertiary` color tokens. 
- Line charts should use "natural" curves with a gradient area fill below the line that fades into the glass surface.