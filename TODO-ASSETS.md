# Assets to replace before the final demo

The 8 catalogue images in `public/products/*.svg` are simple generated placeholders. They are rasterised to PNG
server-side before being sent to YouCam, so try-ons work, but real photos will give far better previews.

Replace each with a **single earring, front view, plain light background, at least 1024 px** (JPG or PNG):

| File to replace | Product | Notes |
| --- | --- | --- |
| `lune-pearl-stud` | Lune Pearl Stud | one pearl stud, front view |
| `solenne-gold-huggie` | Solenne Huggie | one small gold huggie hoop |
| `aurelia-chandelier` | Aurelia Chandelier | one long chandelier, 8.5 cm |
| `oriel-thread-drop` | Oriel Thread Drop | one tassel/thread drop, 6 cm |
| `calla-flat-disc` | Calla Disc | one flat disc on a post |
| `marais-hoop-large` | Marais Large Hoop | one 5 cm hoop |
| `ember-clip-bar` | Ember Clip Bar | one clip-on bar |
| `sora-crystal-screwback` | Sora Crystal Studs | one crystal stud |

How: put the file in `public/products/` (e.g. `lune-pearl-stud.png`), then update `imageUrl` for that slug in
`scripts/seed.ts` (the seed writes the SVG placeholders; remove that line for slugs you replace) and run `npm run db:seed`.

Use only royalty-free sources (Unsplash / Pexels) and record each licence in the README credits.
Keep each product's `referenceScaleCm` equal to the real declared size, since it drives the try-on scale.

Also worth replacing before submission:

- `public/examples/pre-generated-*.jpg`: currently a Pexels portrait run through the real YouCam API. Replace with your own
  before/after if you prefer a different face (or keep and credit).
