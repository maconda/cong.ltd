# Cong.ltd Airbnb-style redesign design

## Summary

Redesign the existing Cong.ltd static website across `index.html`, `tools.html`, and `preowned.html` with an Airbnb-inspired visual system. The work keeps the current URLs, page purposes, contact destinations, QR code generation, finance calculator, local storage behavior, mobile menu, year injection, and reveal animation model.

The redesign changes the presentation and selected HTML structure, not the underlying product scope.

## Design read

This is a static personal studio site for visitors and potential collaborators. The visual language should feel light, calm, consumer-grade, and trustworthy, closer to Airbnb than to the current dark purple technology aesthetic.

Design dials:

- Design variance: 5
- Motion intensity: 3
- Visual density: 3

## Current state

The current site uses a dark theme with purple and blue gradients, glass-like panels, bright glow shadows, and many similar dark cards. That creates visual noise and makes the three pages feel heavier than the content requires.

Current strengths to preserve:

- Clear page split: homepage, tools, preowned items.
- Existing contact paths: email, Telegram, WeChat.
- Working QR generation and finance calculator.
- Responsive navigation and mobile menu.
- Accessibility basics: skip link, semantic main sections, visible labels, reduced-motion handling.

Patterns to retire:

- Purple and blue AI-style glow gradients.
- Large glass panels and repeated dark cards.
- Overly dramatic shadows.
- Generic dark tech mood for a small studio.
- Inconsistent visual hierarchy between homepage, tools, and preowned pages.

## Site architecture

Keep the existing three-page structure.

### `index.html`

The homepage remains the main entry point. It should become a simple studio landing page:

- Light sticky navigation.
- Hero with concise studio positioning, primary contact action, secondary tools action, and one strong image-led visual.
- Three entry cards for tools, preowned items, and contact.
- Short studio statement section focused on reliability, scope, and maintenance.
- Contact section with email and existing contact methods.

### `tools.html`

The tools page remains a utility page:

- Calm page header with a clear title and short explanation.
- QR code tool as a focused panel.
- Finance calculator as a focused panel.
- Same JS IDs and behavior are preserved.
- Forms use light surfaces, clear labels, visible focus states, and readable inline results.

### `preowned.html`

The preowned page becomes the most Airbnb-like page:

- Light page header.
- Product cards with image areas, status, title, description, price, and condition tags.
- Existing sample items can remain, but presentation should feel like curated listings.
- Keep the email contact action and homepage return action.

## Visual system

Theme:

- Whole site uses one light theme.
- Background: warm off-white or neutral white.
- Text: near-black, not pure black.
- Muted text: neutral gray.
- Accent: one coral or rose red used consistently for primary actions and key states.
- No mid-page dark theme flip.

Typography:

- Use the existing system font stack for performance and reliability.
- Improve hierarchy through scale, weight, line-height, and spacing.
- Keep Chinese text comfortable to read.
- Avoid all-caps micro-labels except where already meaningful.

Shape:

- Use one radius system:
  - Buttons: pill radius.
  - Cards and panels: soft 20px to 28px radius.
  - Inputs: 14px to 18px radius.
  - Images: match card radius.

Surfaces:

- Use white and soft gray surfaces.
- Cards use subtle borders and very light shadows.
- Remove glassmorphism and purple glow.
- Use image-led visual blocks instead of decorative gradients.

Images:

- Use stable remote photos or deterministic image URLs where project-owned images do not exist.
- Add meaningful alt text for content images.
- Provide CSS fallback backgrounds so layouts do not collapse if an image fails.

## Component design

### Navigation

The navigation remains sticky. Desktop layout:

- Brand on the left.
- Page links in the middle.
- Contact CTA on the right.

Mobile layout:

- Brand and menu button remain visible.
- Menu expands below the nav with large tap targets.
- `aria-expanded` behavior remains controlled by `script.js`.

### Buttons

Primary buttons use the coral accent with white text. Secondary buttons use white or transparent backgrounds with dark text and a subtle border. Buttons include hover, active, and focus-visible states.

### Cards

Cards are used only where they clarify grouped content:

- Homepage entry cards.
- Tool panels.
- Preowned product cards.

Cards should not be nested inside other cards. Repeated cards share spacing, radius, border, and hover behavior.

### Forms and results

QR and finance tools keep their existing IDs:

- `qr-input`
- `qr-generate`
- `qr-download`
- `qr-output`
- `finance-base`
- `finance-discount`
- `finance-tax`
- `finance-range`
- `finance-note`
- `finance-total`
- `finance-uppercase`
- `finance-budget`
- `finance-detail`
- `finance-save`
- `finance-clear`
- `finance-records`

The visual design changes, but these hooks must remain stable.

### Contact links

Keep the existing email, Telegram, and WeChat destinations. Contact icons may keep their current remote image URLs with fallback text.

## Interactions

Keep the existing JavaScript behavior:

- Mobile menu open and close.
- Navigation active state.
- Current year injection.
- Reveal-on-scroll using `IntersectionObserver`.
- QR code generation and download.
- Finance calculation, local storage records, and clearing.

Motion should be restrained:

- Reveal animation: slight translate and fade.
- Hover: subtle lift or shadow change.
- Active state: slight press feedback.
- Respect `prefers-reduced-motion`.

## Error and empty states

QR tool:

- Empty input shows a direct inline message.
- Missing QR library shows a direct inline message.
- Generation failure shows a direct inline message.
- Download stays disabled until a QR image exists.

Finance tool:

- Empty records state remains visible.
- Invalid numbers clamp to safe values through existing JS.
- Saved records remain limited to five entries.

Images:

- If a remote image fails, the layout still shows a composed fallback surface.

## Implementation constraints

- Keep the site static.
- Do not add a framework or build step.
- Do not change URL structure.
- Do not remove the Cloudflare Pages assumptions in `README.md`.
- Do not break existing JS selectors.
- Do not rename form fields, IDs, or contact links unless required by the confirmed design.
- Keep edits focused on `index.html`, `tools.html`, `preowned.html`, `assets/css/style.css`, and only small JS changes if needed for presentation.

## Verification plan

Run a local static server and check:

- `index.html` desktop and mobile layout.
- `tools.html` desktop and mobile layout.
- `preowned.html` desktop and mobile layout.
- Mobile menu opens, closes, and updates `aria-expanded`.
- Navigation active state still works.
- QR code generates from default and custom input.
- QR download link enables after generation.
- Finance totals update when inputs change.
- Finance record save and clear work with `localStorage`.
- Contact links point to the existing destinations.
- Reduced-motion mode does not leave reveal elements hidden.

Run lightweight code checks:

- Search for accidental em dashes in visible copy.
- Search for broken JS hook IDs.
- Confirm no dark purple tech palette remains as the dominant theme.
- Confirm no button has unreadable contrast.
- Confirm no desktop CTA wraps onto multiple lines.
