# CounterReady: Devpost submission

## Text description

**Tagline:** Choose from what the shop actually sells, not an endless palette of colours.

**Inspiration.** Virtual try-on usually offers every colour imaginable, but a shopper can only buy what is on the shelf, at a price they can afford. CounterReady starts from the shop's real catalogue and the shopper's budget, then uses a preview only to choose between a handful of genuine options.

**What it does.** A shopper picks a product type (lipstick, blush or eyeshadow), a maximum budget, a finish and an optional colour family, and sees matching products immediately (with a clear explanation if a filter excludes everything). They shortlist up to three in-stock products of that type, consent to sending a photo (or use the built-in sample), and generate previews with the **YouCam AI Makeup API**: each shade applied to the same original photo, same crop, original alongside, with independent retries. They choose a favourite, add a note, and export a **purchase card** (shop, product, shade code, price, finish, note, contact, a reminder to confirm availability and physical colour). The face is excluded from the card unless the shopper opts in. A **comparison receipt** records budget, products compared, selected product, shade code, finish, price and note.

**eCommerce value.** The output is not a screenshot of a pretty face. It is a purchase-ready shortlist that names one SKU, its listed price and the shopper's own reason, which a shop assistant or a WhatsApp conversation can act on. Because the catalogue is the starting point, previews never invite a shade the shop does not sell.

**How we use YouCam.** `POST /s2s/v2.0/file` (signed upload, once per photo), `POST /s2s/v2.0/task/makeup-vto` with a `lip_color`, `blush` or `eye_shadow` effect whose colour and texture come from the catalogue (`previewHex`, finish), then polling `GET /s2s/v2.0/task/makeup-vto/{task_id}`. All 17 in-stock shades across the three types were verified live. Results are downloaded, compressed and stored (the provider URL is short-lived).

**Honesty by design.** The shop is a hand-maintained sample catalogue and says so on every card. Preview colours are rendering configuration, not calibrated matches. Product facts, shopper choices and AI imagery stay separate and labelled. No skin analysis, no suitability score, no chatbot, no claim of exact shade matching. We do not promise YouCam deletes photos immediately.

**How we built it.** Next.js 16, TypeScript (strict), Tailwind v4, Zod; Neon Postgres via the serverless driver and Drizzle. A transaction-guarded unit budget (advisory lock on a ledger), an input-hash result cache (the sample photo is pre-warmed, so judges spend no credits), refunds for never-created tasks, rate limits, magic-byte image checks, server-enforced consent, a delete-my-data endpoint, 28 Vitest tests and Playwright end-to-end tests.

**Challenges.** The docs describe image limits inconsistently (long side under 1920 versus height under 1080), so we tested and settled on a 1080 px long side. Keeping a shared demo key alive for judges drove the database-enforced budget and cache. A failing test also showed our "why no matches" message was vague when no single filter was to blame, so we made it explain what does exist.

**What's next.** A real product feed and photography, calibrated shade data from the brand, side-by-side with a real shade chart, and a shop-side view of which shades get shortlisted.

**Built with:** YouCam AI Makeup API, Next.js, React, TypeScript, Tailwind CSS, Neon Postgres, Drizzle ORM, Zod, sharp, html-to-image, Vercel.

## What was built during the submission period

Everything in this repository was created during the hackathon submission period. Third-party content: the Unsplash sample portrait (licence noted in the README), fonts via `next/font`, and open-source libraries.

## Two-minute demo script

- **0:00–0:20** "I'm choosing a lipstick from this shop, and my budget is PKR 2,000." Show the budget slider; drop it to PKR 500 to show the empty state naming the budget as the cause, then back to 2,000.
- **0:20–0:45** Choose a finish, open the shortlist, point out the out-of-stock shade being disabled, and pick three.
- **0:45–1:20** Photo screen: read the consent line aloud, tick it, use an approved photo. Press Generate previews and show a genuine API preview arriving. If you edit out the waiting time, say so on screen. Compare the three shades beside the original.
- **1:20–1:45** Choose a favourite and add the note "I prefer this shade for everyday use."
- **1:45–2:00** Show the receipt and download the purchase card (product-only), then switch the face on to show the opt-in. Close: "CounterReady turns a virtual preview into a purchase-ready shortlist, while keeping product facts and customer preferences separate from AI-generated imagery."

## Rules checklist

- [ ] Public repository with licence (MIT) and README
- [ ] Deployed on Vercel with `YOUCAM_MOCK=0`, strong `ADMIN_TOKEN`, production DB pushed
- [ ] Demo video under the limit, using a photo you have permission to use
- [ ] Sample photo credit and permission confirmed
- [ ] API key and database password rotated after the hackathon
