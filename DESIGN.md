---
name: Pursuit
description: Forward motion — true black, ivory, acid yellow and ice blue for the landing and desktop renderer; retained light web dashboard separately scoped.
colors:
  landing-canvas: '#000000'
  landing-surface: '#0a0a0a'
  landing-surface-soft: '#171717'
  landing-ink: '#f5f5ef'
  landing-ink-soft: '#d5d5cf'
  landing-muted: '#a3a39d'
  landing-line: '#262626'
  landing-line-strong: '#41413c'
  landing-signal: '#d5f578'
  landing-signal-hover: '#e3ffa0'
  landing-ice: '#7bc8f6'
  desktop-canvas: '#000000'
  desktop-surface: '#101010'
  desktop-sidebar: '#0a0a0a'
  desktop-ink: '#eeeeee'
  desktop-muted: '#a5a5a5'
  desktop-line: '#2c2c2c'
  desktop-signal: '#d5f578'
  desktop-signal-hover: '#e3ffa0'
  desktop-selected: '#252c17'
  desktop-focus: '#d5f578'
  workspace-canvas: '#080808'
  workspace-line: '#282a25'
  workspace-ink: '#eeeee7'
  workspace-muted: '#999e90'
typography:
  display:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(55px, 6.5vw, 92px)'
    fontWeight: 470
    lineHeight: 1.04
    letterSpacing: '-0.04em'
  headline:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(34px, 4vw, 50px)'
    fontWeight: 470
    lineHeight: 1.13
    letterSpacing: '-0.04em'
  desktop-body:
    fontFamily: 'Geist, Inter, system-ui, sans-serif'
    fontSize: '14px'
  resume-paper:
    fontFamily: 'Arial, sans-serif'
  letter-paper:
    fontFamily: 'Georgia, serif'
rounded:
  landing-control: '5px'
  landing-panel: '10px'
  desktop-control: '6px'
  desktop-card: '9px'
components:
  landing-primary:
    backgroundColor: '{colors.landing-signal}'
    textColor: '#11150a'
    rounded: '{rounded.landing-control}'
    padding: '0 18px'
  desktop-primary:
    backgroundColor: '{colors.desktop-signal}'
    textColor: '#151515'
    rounded: '{rounded.desktop-control}'
    padding: '12px 18px'
---

# Design System: Pursuit

## Overview

**Creative North Star: “Forward motion.”** True black, ivory, acid yellow and ice blue pair a cinematic career promise with a familiar conversational workspace. Preserve the accepted centered hero, decorative WebGL trajectory and original north-east trajectory mark. The compact floating navigation dock and fuller product journey extend that world. Self-hosted Geist remains the brand face; Arial resumes and Georgia letters are intentional document typography.

The built landing lives in `apps/web/app/page.tsx`, `landing-dark.css`, `career-story.css`, and `_components/career-journey.tsx`. The shared `packages/ui/src/CareerWorkspace.tsx` and `career-workspace.css` power the desktop and browser product tour. The public harness image shows that actual interface in explicit fictional sample mode. The retained `/app` dashboard keeps its separately scoped light system below. This document records implementation, not a new visual direction or a claim that the intended complete career workflow is already connected.

## Colors

Black is the canvas, ivory the main text, acid the action/control signal, and ice blue the preparation/connection signal. Supporting neutral ramps and low-intensity green/blue tints belong to these roles. Broad lime companion and closing bands deliberately provide contrast against the black story; they use dark green text and controls. White documents remain readable paper within dark tool frames.

The frontmatter separates landing literals, legacy desktop settings literals, and the shared career workspace's current custom-property values. The shared workspace uses `--cw-bg`, `--cw-panel`, `--cw-line`, `--cw-text`, `--cw-muted`, and `--cw-lime` in `career-workspace.css`. Lavender remains confined to the retained web dashboard. Do not extend its palette to the landing or desktop.

## Typography

Use self-hosted Geist for the brand and interface. The hero keeps its two-line “Your career. / In forward motion.” display: `clamp(55px, 6.5vw, 92px)`, weight 470, line height 1.04, tracking -0.04em. Existing hero type rules at 800px and 600px retain 68px and `clamp(43px, 10.7vw, 62px)` respectively. Main section headings use the headline role. Narrative copy remains compact and generously led; interface metadata is smaller and denser than marketing prose.

Resume papers use Arial, sans-serif; cover-letter papers use Georgia, serif. These faces communicate real document formats and do not replace Geist elsewhere. Full original and tailored papers keep actual paragraphs, work history, skills and education rather than decorative line fragments. At 500px comparison papers stack and regain readable single-column sizing. The closing heading uses `clamp(40px, 4.7vw, 64px)`, weight 470, 1.08 line height. The oversized footer wordmark retains its acid lettering and ice terminal dot.

## Layout

The landing retains the 1240px content token and `.dark-frame` width `min(1180px, calc(100% - 80px))`. Hero composition is unchanged; the new floating dock requires 170px hero top padding, becoming 130px at 500px. The fixed dock sits 15px from the top with a 1180px maximum width, 66px minimum height and 14px corners; at 500px it sits 10px from the top with 12px outside gutters.

After the hero, the built sequence is career journey/sample run, actual conversational harness capture, document workshop, lime companion, background work, outreach/Gmail paths, model freedom, Career Identity context, source download, FAQ, lime closing prompt, and full directory footer. The former scroll-selected CareerFlow and disconnected empty-renderer showcase no longer describe this surface. The journey has three narrative sources beside a timed sample run; it does not use a persistent scroll-selected stage panel.

At 800px the journey, background, outreach, companion, letter/video workshops, Gmail connection story and closing invitation collapse to one column. Journey sources briefly form three columns, then become a vertical list at 500px. Resume comparison becomes one column at 500px. The companion's desktop note moves beneath its phone at that width so both remain visible. The footer preserves brand, Product, Resources and Build with us groups, with existing 800px and 600px column reductions.

The shared career workspace starts with `222px minmax(440px, 1fr) 360px`: sidebar, conversation, role/document inspector. At 1240px it becomes `194px minmax(410px, 1fr) 320px`; at 1000px it becomes `190px minmax(0, 1fr)` with the inspector beneath the conversation. At 650px it uses a block layout, hides the sidebar and exposes a toggleable two-column mobile navigation; body gutters are 18px. Identity, Models and Agent settings open within the desktop dialog and retain their existing form layouts. Renderer responsiveness alone is not packaged native verification.

## Elevation & Depth

Black space, hairline borders, restrained green/blue tints and the luminous trajectory create depth. The floating dock uses `0 12px 45px #0005`, near-opaque `#0b0e08f5` and 16px backdrop blur. Product disclosure uses `0 20px 70px #0009`. Paper and device silhouettes provide physical contrast without turning every interface region into a floating card. Shared workspace regions remain primarily border-separated.

The decorative WebGL field pauses offscreen and when hidden, has a static reduced-motion state and CSS failure fallback, and releases its GPU resources. Side-entry reveals use IntersectionObserver and settle once visible. Companion notes, the closing paper/ping, source connectors and footer dot animate only when motion is allowed; reduced motion removes their animation and reveal transforms. The footer dot has a two-second repeating hop with a one-second initial delay. Explicit sample-run playback changes content on timers; its progress is an illustration, not real background execution.

## Shapes

Preserve the rounded trajectory tile and its arrow geometry. Landing controls retain 5px corners, the dock uses 14px, and its disclosure 12px. Shared workspace controls generally use 6–7px corners; resumes are rectangular papers with 2px corners. The phone is a distinct device silhouette with notch and home indicator. Lime closing art pairs a tilted paper, orbit and notification. Workbench, sample policy and phone primary actions have 44px minimum height; mobile dock acquisition/menu controls also reach 44px.

## Components

- **Navigation dock:** Product is a native disclosure with links to workspace, documents, outreach and background sections. Escape closes it and returns focus. The mobile menu retains expanded state, focus handling and Escape dismissal. GitHub stars are fetched from `/api/github`; only a valid nonnegative integer becomes a count. Pending/failure displays “GitHub” with an unavailable accessible label, never a fabricated count. Primary acquisition is acid. Preserve the existing visible focus treatments.
- **Opportunity field:** decorative and `aria-hidden`, with procedural acid/ice trajectory threads and particles. It never depicts live submissions.
- **ProductJourney:** three narrative sources accompany a fictional Alex/Northstar sample run. Review/auto controls change the illustrated policy; explicit playback advances research, materials and notification content. Sample disclosures remain adjacent to the run. There is no live search, submission or approval grant.
- **HarnessFeature:** `/product/harness-dark.png` is an actual shared-workspace capture populated with a fictional sample career. Image and text open `/product-tour`; the current surface uses links, not the old enlarge dialog. Caption and alternative text identify sample provenance. The tour shares components with the desktop, not its native storage or execution connection.
- **DocumentWorkshop:** tab-like pressed-state buttons switch Resume, Cover letter and Video intro content. Original/tailored resume comparison reuses `ResumeDocument`; a tailoring switch changes the illustrated paper. The letter uses full copy; the video view provides timed script and local checklist controls. These are sample documents and preparation guidance, not a packet exporter, generated output or video recorder.
- **Companion:** lime band with interactive match, role review, approval and completion stages. Explicit step controls and phone actions move through the fictional scenario; replay returns to the start. Approval and completion disclosures state that no real submission occurs. The phone is a product preview, not a connected relay.
- **Background work:** sample run rows, preparation statuses and notification illustrate the intended rhythm. Counts, confirmations and “Complete” labels belong to the fictional scenario. They do not prove closed-laptop execution or live notifications.
- **Outreach/Gmail:** company-to-contact sourcing includes fictional provenance and context, followed by a readable email draft. Review toggles a status explicitly saying no email was sent. Direct Google OAuth and Composio controls switch consent-path explanations; they do not authorize an inbox. Gmail brand artwork is used in the story; shared workspace mail actions use the consistent DeskIcon mail SVG. Retained web Gmail workflows remain a separate implemented surface.
- **Shared career workspace:** navigation selects career records, applications, documents and conversation context; the inspector keeps selected role and materials beside the thread. Native personal records persist through SQLite v4. Local application-count questions read records without a model request. Explicit model questions use the managed OpenCode session and selected provider; confirmed-fact inclusion starts off. Loading, failures, cancellation and unresolved sessions remain visible; users inspect unresolved work before resending. Settings retain Career Identity review/provenance, model connections and managed Agent controls.
- **Sample isolation:** desktop sample mode is opt-in, visibly labeled and in memory; exiting returns to personal records. Sample conversations, approval/completion states and tour interactions cannot execute external actions. Browser personal preview cannot invoke native storage or generation. Do not confuse a sample notification or count with a real application receipt.
- **Acquisition, FAQ and closing:** platform selection qualifies source/build availability; public signed installers remain unpublished. FAQ explicitly separates current desktop records, model/identity/conversation features from pending desktop discovery, Gmail execution, packets, submission and companion. The lime closing prompt submits a request parameter to `/product-tour`, requires no account and starts no model or external application action. Full resource navigation and Back to top remain in the footer.

Current visual evidence is under `.impeccable/review/career-experience`; earlier dark-landing evidence documents the retained hero direction. Fixture or renderer captures do not establish native packaging, real-provider quality or a complete accessibility audit.

## Do's and Don'ts

- **Do** preserve the approved WebGL hero, Geist voice, trajectory geometry and black/ivory/acid/ice world.
- **Do** use Arial and Georgia specifically for realistic document papers.
- **Do** keep sample provenance, consent boundaries, unavailable/error states and reduced-motion treatment visible.
- **Do** preserve full story content and resource navigation across narrow layouts.
- **Do** keep retained web dashboard styles scoped to `/app`.
- **Don't** restore the superseded lavender marketing/desktop world or old empty-renderer/scroll-stage guidance.
- **Don't** present sample counts, contacts, approval states or completions as real execution evidence.
- **Don't** infer live desktop submission, Gmail, companion connectivity or signed installers from product-story UI.

### Retained web dashboard reference

### Direction and scope

The user selected a conventional dashboard inspired by Neatlogs public previews:
quiet navigation, compact cards, readable records, and restrained lavender accents.
The authenticated Neatlogs app and private frontend kit were unavailable, so this
is an original implementation informed by public previews, not an exact kit match.

The dashboard system covers `/app` and its child routes, excluding `/app/login`.
`AppShell` in `apps/web/app/app/_components/shell.tsx` owns the navigation and
imports `workspace.css`. Workspace overrides use `.workspace` and dedicated
workspace/overview classes. This light system remains scoped to the retained web dashboard; it does not govern the current landing page or desktop renderer.

### Tokens and typography

| Role                                | Value                          |
| ----------------------------------- | ------------------------------ |
| Main ink                            | `#222329`                      |
| Muted / muted foreground            | `#71717a` / `#64646f`          |
| Border and line                     | `#e6e6ec`                      |
| Surface / raised paper              | `#fff`                         |
| Workspace background                | `#fafafb`                      |
| Sidebar                             | `#f5f5f8`                      |
| Hover token                         | `#f2f2f7`                      |
| Signal                              | `#5445db`                      |
| Active navigation background / text | `#e9e6fa` / `#5140c1`          |
| Primary button                      | `#5746d8`                      |
| Focus outline                       | `#7462de`, 2px with 3px offset |

Use self-hosted Geist Sans. Workspace metadata inherits the sans face rather
than adopting a terminal treatment. Base workspace text is 13px; page titles are
27px, weight 600; panel titles are 14px. Supporting text generally uses 10–12px.
Cards have 8–9px corners, fine borders, and minimal shadow. Buttons and inputs
have 6px corners and compact 36px/38px minimum heights respectively.

### Layout and interaction

- Desktop sidebar: 228px, sticky, full viewport height, independently scrollable.
- At widths up to 1050px: sidebar becomes 200px; overview panels and shortcuts
  become a single column.
- At widths up to 767px: sidebar is hidden. A navigation toggle exposes a
  two-column mobile menu, declares its expanded state, and closes on route change.
- Topbar: 65px desktop, 60px mobile, with breadcrumb and account actions.
- Content: maximum 1536px; default padding 32px 36px 60px; mobile padding
  24px 18px 40px. At 1600px and above, padding is 40px 56px.
- Overview uses compact cards for actual workspace data, pipeline stages,
  recent records, and shortcuts. Empty and unavailable states remain explicit.
- Active desktop navigation uses `aria-current`; visible keyboard focus uses
  the lavender outline. Mobile navigation links have a 44px minimum height.
