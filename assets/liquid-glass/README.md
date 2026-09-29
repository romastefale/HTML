# Vendored liquid-glass

`liquid-glass.bundle.js` is a single, minified ES module containing:

- `@samasante/liquid-glass` 0.1.1, built from the fork
  [romastefale/liquid-glass](https://github.com/romastefale/liquid-glass)
  at commit `4e7b769` (`pnpm install && pnpm build` → `dist/index.js`) — MIT, see `LICENSE`.
- React 19.2 + ReactDOM 19.2 (the library's only peer deps, production build) — MIT, see `LICENSE-react`.

It is vendored so this GitHub Pages site stays a plain static site (no build step,
no import map, no CDN). Exports: `React`, `createRoot`, `flushSync`, and everything
from `@samasante/liquid-glass` (`Glass`, `glassValue`, …).

Rebuild (from a clone of the fork, after `pnpm build`):

```bash
printf '%s\n' 'export { default as React } from "react";' \
  'export { createRoot } from "react-dom/client";' \
  'export { flushSync } from "react-dom";' \
  'export * from "./dist/index.js";' > entry.js
npx esbuild entry.js --bundle --format=esm --minify --target=es2020 \
  --define:process.env.NODE_ENV='"production"' --legal-comments=eof \
  --outfile=liquid-glass.bundle.js
```
