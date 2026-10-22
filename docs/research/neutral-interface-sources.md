# Neutral interface reference and asset record

2026-10-22. The user rejected olive/blue-tinted backgrounds and borders across the landing and harness. Black/neutral surfaces now carry the product; primary lime remains for important actions and the Pursuit mark. This supersedes earlier tinted-panel and lime-band guidance for these surfaces. Main product behavior is unchanged.

## UI and motion

- [shadcn/ui Table](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/table.tsx): the actual component structure is vendored in `apps/web/app/_components/ui/table.tsx`, adapting utility classes to scoped CSS and a local class joiner. MIT copyright/license is retained alongside it in `LICENSE-shadcn.txt`. The activity ledger uses these semantic table components, with real local filtering and detail disclosure. No new package/runtime dependency was added.
- [T3 Code](https://t3.codes/): familiar neutral conversation/list/detail materials inform the harness refinement; no artwork or source was copied.
- [Bitnob](https://bitnob.com/en-US/): inspected public footer in Chromium. Its large brand treatment is a runtime SVG animation inside a 450px wrapper. Pursuit uses original per-letter CSS spring/fade motion, triggered on viewport entry and replayed on pointer entry, with static reduced-motion rendering. No Bitnob animation asset or code was copied.

## First-party brand assets

Retrieved from the companies' own public websites on 2026-10-22, used to identify example watched companies or integration choices, without endorsement:

- Gmail: https://www.gstatic.com/images/branding/productlogos/gmail_2026/v2/web/192px.svg, referenced by [Google Workspace Gmail](https://workspace.google.com/products/gmail/).
- Composio: https://composio.dev/logos/composio-white.svg, referenced by [Composio](https://composio.dev/).
- PostHog: https://brand.posthog.com/logo/posthog-logomark-white.svg; [official asset guide](https://brand.posthog.com/llms.txt).
- Stripe: https://images.stripeassets.com/fzn2n1nzq965/1hgcBNd12BfT9VLgbId7By/01d91920114b124fb4cf6d448f9f06eb/favicon.svg, published by [Stripe](https://stripe.com/).
- Linear: https://linear.app/static/favicon.svg?v=2, published by [Linear](https://linear.app/).

These brand marks are not subject to the UI grayscale conversion. The watcher list is illustrative; displayed roles/alerts are not live vacancies from these companies. The fictional Northstar/Morrow career stays separate from real-company identification.

## Pexels photography

Downloaded stock images are used as illustration, not testimonials, real contacts, candidate identity verification or recordings:

- Contact illustration: Antoni Shkraba, [Portrait Shot of an Employee Using a Laptop](https://www.pexels.com/photo/portrait-shot-of-an-employee-using-a-laptop-7163383/), image 7163383, served at 200px width. The corresponding outreach contact is explicitly fictional.
- Recording illustration (replacement): Kampus Production, [Portrait of Smiling Woman in an Office](https://www.pexels.com/photo/portrait-of-smiling-woman-in-an-office-8463168/), image 8463168, served at 1200px width in `recording-professional.jpg`. This is a stock portrait, not a Pursuit user or a recording of Alex. It replaces image 6077067 at the user’s request.
- [Pexels license](https://www.pexels.com/license/). Local files live in `apps/web/public/photos/`.

First-party website requests and public assets only; no authenticated application or social messaging was used.

## Semantic status and annotation follow-up

- T3 Code navigation inspected on 2026-10-22: its GitHub count uses a small, low-contrast outlined pill (14px horizontal padding, full radius). Pursuit adapts that restrained treatment with its own repository link and live count; no source or metrics were copied.
- Cloudflare: `https://www.cloudflare.com/favicon.ico`, served by Cloudflare as a 99×96 PNG, saved as `cloudflare.png`. This identifies the fourth example watcher; it is not a claim of endorsement or live polling.
- Footer: original SVG pen trajectories replace the spring/fade letters. The paths trace each glyph rather than revealing typed text. Reduced motion renders the completed mark.
- Green, amber and red identify readiness/completion, review/unknown information and exclusion. They are confined to labeled status badges; neutral black surfaces remain the visual foundation.
