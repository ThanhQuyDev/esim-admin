# Porting the partner design files

The partner portal and the partner application form are ports of two HTML design
files that live next to this repo:

| Design file                                | Scope class | Generated stylesheet             |
| ------------------------------------------ | ----------- | -------------------------------- |
| `cong-doi-tac-phan-phoi-hoan-chinh-v29.html` | `.pp-app`   | `src/styles/partner-portal.css`  |
| `dang-ky-doi-tac-esim.html`                 | `.pr-app`   | `src/styles/partner-register.css` |

Both stylesheets are **generated, not hand-written**. Every selector from the
design file is rewritten to sit under the scope class, so the admin console —
which shares this Next.js build — keeps its own shadcn theme. Bare `body`,
`html` and `:root` rules collapse onto the scope element itself.

Regenerate after editing a design file:

```bash
node scripts/port-mockup-css.js ../cong-doi-tac-phan-phoi-hoan-chinh-v29.html src/styles/partner-portal.css .pp-app
node scripts/port-mockup-css.js ../dang-ky-doi-tac-esim.html src/styles/partner-register.css .pr-app
```

The portal's icon sprite is generated the same way, from the `<defs>` block of
the v29 file:

```bash
node scripts/port-mockup-sprite.js ../cong-doi-tac-phan-phoi-hoan-chinh-v29.html src/features/partner-portal/components/portal-icon-sprite.tsx
```

Both generated stylesheets carry a header comment saying so. Edit the design
file and re-run rather than patching the output, or the two drift apart.

The React views under `src/features/partner-portal/components/` reproduce the
design file's markup and class names by hand; each one names the `#view-…`
section it came from.
