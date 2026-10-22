---
name: Pursuit
description: Near-black and lavender career workspace, with a retained light web dashboard.
colors:
  landing-canvas: '#0c0c10'
  landing-surface: '#141419'
  landing-surface-soft: '#1c1b24'
  landing-ink: '#f0eef7'
  landing-ink-soft: '#d2cfdd'
  landing-muted: '#aaa6b8'
  landing-line: '#2b2934'
  landing-signal: '#c3afff'
  landing-signal-hover: '#d4c4ff'
  landing-stage: '#342546'
  desktop-canvas: '#101014'
  desktop-surface: '#17171e'
  desktop-sidebar: '#141419'
  desktop-ink: '#eeedf4'
  desktop-muted: '#a5a3b2'
  desktop-line: '#2b2b35'
  desktop-signal: '#c2afff'
  desktop-signal-hover: '#d1c2ff'
  desktop-selected: '#292238'
  desktop-focus: '#c5b0ff'
typography:
  display:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(46px, 5.9vw, 79px)'
    fontWeight: 540
    lineHeight: 1.06
    letterSpacing: '-0.04em'
  headline:
    fontFamily: 'Geist, sans-serif'
    fontSize: 'clamp(34px, 4vw, 51px)'
    fontWeight: 500
    lineHeight: 1.12
  desktop-body:
    fontFamily: 'Geist, Inter, system-ui, sans-serif'
    fontSize: '14px'
rounded:
  landing-control: '7px'
  desktop-control: '6px'
  desktop-card: '9px'
components:
  landing-primary:
    backgroundColor: '{colors.landing-signal}'
    textColor: '#1b1426'
    rounded: '{rounded.landing-control}'
    padding: '0 19px'
    height: '48px'
  desktop-primary:
    backgroundColor: '{colors.desktop-signal}'
    textColor: '#17121f'
    rounded: '{rounded.desktop-control}'
    padding: '12px 18px'
---

# Design System: Pursuit

## Overview

The user-approved direction of 2026-10-22 is near-black and lavender: calm, precise, and product-led. It applies to the landing page and actual desktop renderer. It supersedes the old white marketing canvas, indigo marketing frame, four-tab hero, and light desktop palette. Preserve the original Pursuit mark and self-hosted Geist. The original mark's indigo remains a brand detail, not a directive to restore the old marketing stage.

This is the pinned, code-led direction recorded in `.impeccable/briefs/landing.md` and the dark product experience amendment in `PRODUCT.md`; no design comps were produced. Current sources are `apps/web/app/landing-dark.css`, `apps/web/app/page.tsx`, `apps/web/app/_components/career-showcase.tsx`, and `apps/desktop/src/style.css`. The retained `/app` web dashboard remains light and was not rethemed. Its reference and earlier implementation evidence are preserved below with historical scope explicitly identified.

## Colors

The frontmatter records current dark primitives separately for marketing and desktop because their literal colors differ. Lavender is reserved for action, emphasis, selection, and focus; pale text and muted lavender neutrals carry the hierarchy. The hero uses a muted plum stage. Fine borders separate near-black surfaces. The retained web dashboard's white paper and stronger purple controls apply only to that dashboard.

## Typography

Use self-hosted Geist. Landing display and headline roles are recorded above; body copy is 15–17px with generous 1.8–1.85 line height, while controls are generally 13px. At 800px the hero uses `clamp(42px, 7vw, 60px)`; at 500px it uses `clamp(35px, 9.6vw, 47px)` and 1.1 line height. Desktop retains 14px base text, 27px/600 page headings, 15px/600 section headings, and 11–12px metadata. Keep headings compact and readable rather than introducing a separate display family.

## Layout

Landing frames are `min(1180px, calc(100% - 80px))`; standard sections have 108px vertical padding. A centered two-line promise and primary Get Pursuit action lead into one actual dark renderer capture. The visitor path continues through resume tailoring, bounded autopilot, Career Identity and sessions, model freedom, Gmail, capability availability, Connect roadmap, privacy, platform/source download, and FAQ.

At 1100px, landing navigation becomes the mobile menu and split-layout gaps tighten. At 800px, frame gutters become 20px, section padding becomes 70px, feature/download/FAQ columns stack, and providers become three columns. At 500px, type, stage padding, controls, tables, and illustrations compact further; roadmap and Connect layouts stack. Browser review covered widths 1440, 973, 390, and 320, including sideways-overflow checks.

Desktop retains the Operate structure: 220px sidebar, flexible center with 440px minimum, 300px inspector, 66px topbar, 1080px content maximum, and 40px/32px content padding. At 1100px the sidebar becomes 190px and the inspector moves below the center. At 700px the renderer becomes a block layout with a two-column navigation grid, wrapping form actions, stacked fact rows, and 20px content gutters. This renderer fallback is distinct from native window sizing and does not establish native UI verification.

## Elevation & Depth

Desktop uses tonal layering and fine borders, with flat cards. Marketing reserves dimensional depth for the plum hero stage (`0 28px 80px #0005`) and restrained interaction feedback. The stage settles from a shallow perspective rotation into the page. Motion is progressive enhancement: reduced-motion styles disable animations, transitions, and smooth scrolling while leaving content and controls functional. Desktop background transitions run for 120ms only when reduced motion is not requested.

## Shapes

Landing controls use 7px corners; the hero stage uses 15px, reducing to 10px on small screens, and its capture uses 9px. Illustrative panels use restrained 10–13px corners. Desktop cards use 9px and controls 6px. Preserve thin borders, compact form geometry, and 44px desktop action targets.

## Components

- **Navigation:** restrained dark header, original mark, repository link, and Get Pursuit action. Mobile menu exposes expanded state and supports keyboard and Escape handling. Lavender focus outlines remain visible (landing 2px with 5px offset; desktop 2px with 3–4px offset depending on control).
- **Harness showcase:** `/product/harness-dark.png` captures the actual desktop renderer in browser preview with native storage disconnected. Caption and alternative text disclose that boundary. Enlarge opens a native HTML dialog; close/backdrop/Escape dismiss it, and focus returns to the trigger. This is interface evidence, not proof of native storage or completed applications.
- **Resume study:** role buttons expose `aria-pressed` and switch between two grounded illustrative rewrites. Updated emphasis is announced politely. The example discloses that it is not live AI generation and invents no additional skills or results.
- **Autopilot study:** an explicit preview action steps through boundaries, discovery, preparation, policy-bound application, and evidence. The cap selector locks during playback; completion exposes replay and states that nothing was submitted. No jobs are fetched or submitted; the application executor remains in development. This is a labeled workflow illustration, not an operating executor.
- **Platform/source download:** macOS, Windows, and Linux selection updates qualification copy. Public signed installers are unpublished. The real primary link downloads repository source; the secondary link opens build instructions. macOS copy identifies an internally verified Intel build, while Windows/Linux qualification remains in progress.
- **Capability and roadmap surfaces:** distinguish implemented desktop functionality, retained web functionality still being migrated, and planned Connect/research/document/social functionality. Gmail imagery is illustrative and outreach stays approval-bound. FAQ uses native disclosure elements.
- **Desktop forms:** dark surfaces now apply across Workspace, Career Identity, Models/providers, and Agent. Preserve existing busy, empty, error, evidence, consent, and explicit-execution behavior described in the implementation references below; a theme change does not expand capability.

The finishing evidence is browser-based at the four widths above. It does not establish packaged native UI behavior, real-provider quality, or a full WCAG audit.

## Do's and Don'ts

- **Do** use the dark palette for current landing and desktop work, preserving Geist, the mark, and honest capability disclosures.
- **Do** keep the retained web dashboard's light palette scoped to its existing workspace.
- **Do** maintain keyboard focus, reduced-motion fallbacks, responsive wrapping, and explicit illustration/source-download labels.
- **Don't** present synthetic IPC fixtures, illustrative resumes, or the autopilot walkthrough as live product proof.
- **Don't** restore the superseded white marketing/desktop theme or indigo marketing stage based on the historical notes below.
- **Don't** imply that public installers, automatic submission, or native UI verification exists because a browser renderer capture is available.

The following references preserve earlier implementation and interaction details. Light styling in the historical marketing and desktop sections is superseded by the current dark system above. Historical test and review statements apply to their original increments only.

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

### Historical marketing hero frame — superseded

The `product-film` frame uses solid indigo `#6554dc`, a 1200px maximum width,
24px corners, and responsive 18–52px padding. It holds one product window with
13px corners and a 38px browser chrome strip. The real overview capture at
`/product/hero-workspace.png` is the poster, with fictional demo records disclosed.

Playback is requested through “Watch walkthrough” and opens a dialog containing
`/product/workflow.mp4`: a guided screenshot tour of overview, opportunities,
workflow, and connection settings. It does not demonstrate live AI generation or
email delivery. Closing pauses playback and returns focus to the trigger; a
failed video offers the screenshot. The mobile frame uses 14px padding, 15px
corners, a 4:3 screen crop, and 30px chrome.

### Retained web autopilot and historical marketing repository link

`/app/autopilot` is an Operate settings form inheriting `workspace.css`: bordered
white cards, compact fields, neutral status pills, and explicit notices. Persisted
settings are disabled by default. Research and prepare modes are selectable;
automatic application remains visibly unavailable. Sources are public Greenhouse
board identifiers, with keyword, schedule, minimum-fit, and preparation-attempt
limit controls. Prepare mode discloses saved resume/profile sharing with the
chosen tested BYOM connection and provider charges. Enable/save, pause, and run
controls sit alongside run history and links to drafts and in-app notifications.
A revision conflict offers “Reload saved settings and discard my edits” rather
than silently replacing unsaved work. Push and email alerts remain unavailable.

The marketing navbar links to `https://github.com/Jasowills/pursuit` with “Star
on GitHub” and an icon. At 1200px and below the header link uses its icon with an
accessible label; at 767px and below it is hidden in the header actions. The
mobile menu includes a full-text repository link. Links open in a new tab.

### Historical dashboard review status

Dashboard desktop review resolved three identified fixes; autopilot review
resolved two concurrency fixes. All 34 API tests, API build, and web typecheck
passed. Desktop captures are `.validation/autopilot/settings.png` and
`.validation/autopilot/navbar.png`. Mobile visuals were not verified this
iteration. This was the dashboard review status at that increment. Later amendments in `PRODUCT.md` now record the desktop-first and dark direction.

### Historical desktop foundation — light styling superseded

The native desktop alpha inherits the conventional Geist/lavender dashboard
identity. At that increment its scope was local task capture and persistent history; saving
never starts research, model generation, or an external action.

- **Layout:** the three-region shell uses a 220px sidebar, a flexible center
  (minimum 440px), and a 300px details inspector. The then-white topbar was 66px high;
  content has 40px vertical / 32px horizontal padding and a 1080px maximum width.
  At widths up to 1100px, the sidebar becomes 190px and details move below the
  center content. The native window opens at 1280×850 and has a 900×650 minimum.
- **Tokens:** desktop keeps the ink, muted foreground, workspace, sidebar,
  border, active navigation, primary button, and focus colors recorded above.
  Base text is 14px; page headings are 27px / 600, section headings 15px / 600,
  and metadata 11–12px. White cards use 9px corners and fine borders without
  shadows; controls use 6px corners. Primary controls and navigation targets have
  a 44px minimum height. Desktop focus uses the same 2px lavender outline with
  a 4px offset. Hover/selection on task rows uses `#f0edf9`; button hover uses
  `#4736c6`. Background transitions last 120ms only when reduced motion is not
  requested.
- **Capture and history:** the labeled, vertically resizable task textarea has
  a 120px minimum height and a 2000-character limit. Save is disabled until local
  storage is connected and the input contains non-whitespace text. While saving,
  the textarea and save button are disabled and the button reads “Saving…”. A
  successful save clears the input and selects the new history row. Rows show
  the saved title, local date/time, and a “Saved” tag; selection is exposed with
  `aria-pressed` and the lavender row fill. Details show the selected task and
  storage metadata; an empty history invites the first saved task.
- **Connection states:** browser preview displays an alert explaining that local
  storage requires the desktop app and leaves saving disabled. Native connection
  failures offer “Retry connection”. The topbar reports connection status, and
  the details panel explicitly identifies the SQLite database as native-owned.
  Capability copy identifies task capture/history as available and agent work
  as forthcoming.

Review captures: `.impeccable/review/desktop-foundation/desktop.png` and
`.impeccable/review/desktop-foundation/minimum.png`. Implementation references:
`apps/desktop/src/main.tsx`, `apps/desktop/src/style.css`, and
`apps/desktop/src-tauri/tauri.conf.json`.

### Career Identity and Models increment — 2026-10-22

These desktop screens retain the existing Geist/lavender tokens and three-region
shell. Workspace, Career Identity, and Models navigation selects the rendered
screen and exposes the selection with `aria-current="page"`; the topbar and
inspector copy follow that selection.

- **Layout and tokens:** Career Identity has an 850px maximum width. It stacks
  source entry, confirmed facts, suggestions, saved sources, and conditional
  review history. Sections use 36px top margins, 24px top padding, and fine
  borders; review rows use 24px vertical padding. Confirmed facts use a 145px
  label column with a flexible value column and 16px gap. Inputs retain 44px
  minimum height and 6px corners. Source textareas start at 150px; review answers
  at 88px. Evidence is muted 11px text. Inputs and disclosures use the existing
  lavender focus outline with a 3px offset. Models inherits the content width;
  its selector and result appear beneath the Ollama check. Both screens inherit
  the 1100px shell breakpoint described above; review actions wrap, and evidence
  and source text wrap within their containers.
- **Evidence and decisions:** the source form pairs a name with pasted text and
  a supported-format disclosure. Suggestions show the quoted source excerpt,
  source name, line, and abbreviated hash above an editable answer. Confirmation
  requires a nonblank answer. When a current confirmed value exists, an explicit
  checkbox enables replacement; that checkbox resets when the current fact
  changes. Rejection remains a separate secondary action. Confirmed rows retain
  source attribution, while rejected and superseded values appear in history.
  Saved sources expand to show the full hash and text. Deletion first presents
  an inline consequence prompt with delete and keep actions, including the
  backup caveat.
- **States and boundaries:** importing/reviewing is disabled until identity data
  loads, and mutations lock controls while busy. Empty sections explain their
  state; errors use alerts with a reload action, and saved decisions use status
  text. Browser preview displays the desktop requirement. Models offers an
  explicit local Ollama discovery action, then an installed-model selector and
  explicit text-generation test. Its empty, busy, error, and reply states retain
  the same restrained notice/form language. Copy distinguishes discovery from
  downloads, and a “ready” test from agent tools or application readiness; no
  career data accompanies the test. Future connection options remain explanatory
  text rather than credential-entry controls.

Review evidence: `.impeccable/review/identity/desktop-fixture.png`,
`.impeccable/review/identity/minimum-fixture.png`,
`.impeccable/review/identity/models-fixture.png`, and
`.impeccable/review/identity/preview.png`. The fixture captures use synthetic IPC
data; native UI was not captured. The scoped finishing review found no material
issues and left no visual fix pending. Implementation references:
`apps/desktop/src/identity.tsx`, `apps/desktop/src/models.tsx`,
`apps/desktop/src/main.tsx`, and `apps/desktop/src/style.css`.

### Provider settings increment — 2026-10-22

Models now includes provider connections and an OpenCode runtime check within the
existing Geist/lavender Operate shell. This increment introduces no new visual
identity or design comp. Provider sections use fine dividers and 28px vertical
padding; password entry and its save action sit in a flexible row with a 12px
gap. Fields retain 44px minimum height, 6px corners, and the lavender focus ring.
The inline removal prompt uses the existing sidebar-toned surface and 16px padding.

- **Credentials and feedback:** labeled password fields support key entry or
  replacement, clear when submitted, and disable during work. Saved keys are
  never displayed. “Key saved” reports storage only; catalog retrieval and an
  explicit generation test remain separate actions and states. Removal first
  offers “Remove key from app” and “Keep key”; its completion copy distinguishes
  local removal from provider revocation. Store failures show “Store unavailable”,
  an alert, and “Recheck credential store”. Busy, error, empty-catalog, truncated-
  catalog, status, and wrapped reply states reuse the existing form language.
- **Tests and boundaries:** generation discloses the exact short test prompt and
  possible provider usage charges before the action. A returned reply verifies
  text generation only. OpenCode hosted inference requires an explicit API-family
  choice from the Console before testing; the separate installed-runtime action
  is a version probe, with version and probe-directory output, rather than a
  managed-session readiness check.

Scoped finishing-review disposition: **ship; no visual fixes pending**. Evidence:
`.impeccable/review/identity/providers-desktop-fixture.png` and
`.impeccable/review/identity/providers-minimum-fixture.png`. These are synthetic
IPC captures containing two of the six providers. Native app packaging remains
pending outside this visual review; operating-system credential storage and live
provider calls were not verified. Implementation references:
`apps/desktop/src/providers.tsx`, `apps/desktop/src/models.tsx`,
`apps/desktop/src/style.css`, and `apps/desktop/src/main.tsx`.

Provider increment validation update: the macOS app bundle subsequently built successfully, and the native macOS Keychain backend passed a temporary non-secret write/read/delete check. The UI captures remain synthetic; real provider calls, packaged-app credential prompts, and Windows/Linux credential lifecycle remain unverified.

### Managed Agent workspace increment — 2026-10-22

Agent extends the existing Geist/lavender Operate shell with runtime controls,
session history, and a readable conversation surface. The established Geist
choice remains an intentional brand exception to the design detector's font
finding. This increment introduces no new visual identity.

- **Explicit execution:** users start or stop a private OpenCode runtime and
  create either an offline queue session or a session bound to a selected saved
  provider/model or Ollama model. Connection and usage disclosures accompany
  these choices. Sending and interruption expose busy, queued, running,
  completed, interrupted, and error feedback without implying an application was
  submitted. Session selection locks while a command is pending.
- **Conversation and consent:** partial assistant text carries a streaming label;
  committed messages and queued prompts retain distinct states. Drafts stay
  separate per session. Confirmed-identity sharing resets to unchecked when
  creating or selecting a session, so consent does not silently carry across
  conversations. Stale refresh successes and errors cannot overwrite the newly
  selected session.
- **History bounds:** the transcript displays the latest 100 runtime messages.
  Partial text uses a bounded, volatile event cache; completed runtime history
  reconciles the transcript after reconnects. The interface states this boundary
  rather than promising uninterrupted partial-text recovery.

Scoped finishing-review disposition: **ship after final native packaging;
visual fixes resolved**. Evidence:
`.impeccable/review/identity/agent-desktop-fixture.png`,
`.impeccable/review/identity/agent-minimum-fixture.png`,
`.impeccable/review/identity/agent-stream-desktop-fixture.png`, and
`.impeccable/review/identity/agent-stream-minimum-fixture.png`. These captures use
synthetic IPC and are test evidence only, never marketing proof. Separate native
tests exercised installed OpenCode 2.1.2 against a controlled local provider
fixture, verifying generation, live partial text, and interruption without paid
inference. They do not establish real-provider model quality or packaged native
UI operation. Implementation references: `apps/desktop/src/agent.tsx`,
`apps/desktop/src/main.tsx`, and `apps/desktop/src/style.css`.
