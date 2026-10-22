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

**Creative North Star: “Forward motion.”** The current code-led world is true black, ivory, acid yellow and ice blue: spacious, cinematic marketing paired with a precise desktop workspace. The user rejected the earlier lavender page. The latest 2026-10-22 amendment in `PRODUCT.md` and `.impeccable/briefs/landing.md` supersedes its near-black/lavender direction and the older white marketing/desktop theme. Preserve self-hosted Geist and the original trajectory-arrow geometry; its current treatment is a black arrow on acid yellow, carried through the header, favicon and native icons.

The public references are T3 Code, Diffusion Studio and Neatlogs. Their ambition, motion craft, post-hero storytelling and full footer inform an original Pursuit implementation; no proprietary artwork or interface is copied. Current sources are `apps/web/app/landing-dark.css`, `apps/web/app/page.tsx`, `apps/web/app/_components/opportunity-field.tsx`, `apps/web/app/_components/career-showcase.tsx` and `apps/desktop/src/style.css`. The retained `/app` dashboard remains light and separately scoped. This is documentation of built truth, not a new design comp or a claim of user acceptance of the finished implementation.

## Colors

Four core roles govern the landing: true black canvas, ivory text, acid yellow action/control and ice blue preparation/connection. Neutral ramps and low-intensity yellow/blue tints support those roles; they do not introduce a second brand palette. The frontmatter records the actual landing and desktop literals separately: desktop text remains neutral `#eeeeee`, with `#101010` panels. Acid provides primary actions, selected navigation and visible focus in the desktop renderer. The header is solid black, including its scrolled state. Lavender applies only to the retained light web dashboard and historical references below.

## Typography

Use self-hosted Geist. The hero is a centered two-line “Your career. / In forward motion.” with the display role above. At 800px it becomes 68px; at 600px it uses `clamp(43px, 10.7vw, 62px)` and 1.08 line height. Hero supporting copy is 17px/1.85, becoming 14px/1.9 on mobile. Main section headings use the headline role. Story titles are 28px/1.2 at weight 470, becoming 25px on mobile; narrative copy is 14px/1.9, becoming 13px. Footer invitation type is `clamp(36px, 4.5vw, 58px)` at weight 470, with 37px on mobile. The large footer wordmark is `clamp(130px, 23.8vw, 338px)` at weight 600, changing to 23.2vw on mobile. Desktop retains 14px body, 27px/600 page headings, 15px/600 section headings and 11–12px metadata.

## Layout

The landing uses a 1240px maximum content token with 32px gutter; `.dark-frame` retains `min(1180px, calc(100% - 80px))`. The first viewport combines the two-line promise, compact Get Pursuit and See it in motion actions, a procedural trajectory field and provider links. The hero has a 780px minimum height and 100px top padding. The career brief follows directly: three narrative stages alongside a persistent example panel. Its desktop grid is `0.85fr 1.2fr` with a 100px gap; the panel sticks at 175px. Story sections have 335px minimum height. The actual renderer capture follows the story, before the detailed resume, autopilot, identity, models, Gmail, capability, roadmap, privacy, source-download and FAQ sections.

At 1100px navigation becomes a mobile menu and the story gap becomes 45px. At 800px the hero becomes 740px tall with 90px top padding, provider links stack, the story grid narrows and its panel sticks at 120px. At 600px the hero becomes 720px tall with 65px top padding; the field is 650px high. All three narrative articles remain visible in a single column, followed by a non-sticky example with explicit stage buttons. Standard dark sections use 85px vertical padding, becoming 57px on mobile. Existing smaller-screen frame rules retain 20px side gutters.

The footer has a closing invitation, a directory with brand and three resource columns, a large acid wordmark with ice-blue terminal dot and a colophon. The directory shifts from four columns to three at 800px (brand spans all columns) and two at 600px; the invitation stacks. This full ending is part of the current world, rather than a minimal legal strip.

Desktop retains its 220px sidebar, flexible center with 440px minimum, 300px inspector, 66px topbar, 1080px content maximum and 40px/32px content padding. At 1100px the sidebar becomes 190px and the inspector moves below the center. At 700px the renderer becomes a block layout with two-column navigation, wrapping actions, stacked facts and 20px gutters. That renderer fallback does not establish packaged native UI behavior.

## Elevation & Depth

Black space, fine borders, restrained tinted panels and the luminous trajectory field carry depth. The career example uses `0 22px 75px #000`; the harness stage uses `0 28px 85px #0008`. Desktop cards remain flat. The decorative WebGL field blends acid and ice along a moving curve with fine threads and particles. It never represents live applications or submissions. Motion pauses offscreen and while the document is hidden; reduced motion renders a static field and disables decorative transitions. A CSS fallback remains when WebGL is unavailable, shader setup fails or the context is lost. GPU buffers, shaders and the program are released on unmount. Desktop background transitions run for 120ms only when reduced motion is not requested.

## Shapes

Landing buttons and header acquisition controls have 5px corners; story and harness panels use 10px corners. Smaller illustrative documents and company monograms use 5px corners. Thin neutral or tinted borders define panels. Desktop cards retain 9px corners and controls 6px, with 44px minimum action targets. Keep the original north-east trajectory mark, recolored acid yellow and black.

## Components

- **Navigation:** solid black header, recolored trajectory mark, repository link and ivory Get Pursuit button that turns acid on hover. Mobile menu exposes expanded state and supports keyboard and Escape. Landing focus uses an acid 2px outline with 5px offset; desktop uses 2px with 3–4px offset by control.
- **Primary actions:** acid fill, dark text, 5px corners and 18px horizontal padding; hover uses the pale-acid token. Header and source-download primary controls use ivory at rest and acid on hover. Acquisition links lead to qualified source/build information while signed installers remain unpublished.
- **Opportunity field:** locally rendered, decorative and `aria-hidden`; no tracking or network dependency. Its CSS fallback and static reduced-motion rendering preserve the composition without requiring continuous animation.
- **CareerFlow:** Three narrative articles use a small action icon beside each heading and update an illustrative panel through scroll observation. Discover, Prepare and Move forward remain the explicit stage-control names; there are no separate stage labels above the headings. Explicit buttons expose accessible names and `aria-pressed`; changes are announced politely. Mobile retains all narrative and labeled stage controls. Example companies and roles are fictional and disclosed; the policy stage identifies auto-apply as in development and states that no applications are submitted.
- **Harness showcase:** `/product/harness-dark.png` captures the actual desktop renderer in browser preview with native storage disconnected. Caption and alternative text disclose that boundary. Enlarge opens a native HTML dialog; close/backdrop/Escape dismiss it and focus returns to the trigger. This is interface evidence, not proof of native storage or completed applications.
- **Resume study:** role buttons expose `aria-pressed` and switch between grounded illustrative rewrites, with polite announcements. The example is not live AI generation and invents no additional skills or results.
- **Autopilot study:** an explicit preview walks through boundaries, discovery, preparation, policy and evidence. The cap selector locks during playback; completion offers replay and states nothing was submitted. It fetches no jobs and submits no applications.
- **Platform/source download:** platform selection changes qualification copy. Public signed installers are unpublished; the primary link downloads source and the secondary opens build instructions. Intel macOS has an internally verified build; Windows/Linux qualification remains in progress.
- **Capability and roadmap surfaces:** distinguish implemented desktop features, retained web features still migrating and planned functionality. Gmail imagery is illustrative and outreach approval-bound. FAQ uses native disclosures.
- **Footer:** full invitation, Product/Resources/Build with us navigation, oversized wordmark and colophon. Mobile preserves all resource groups and the acquisition action.
- **Desktop forms:** the actual Workspace, Career Identity, Models/providers and Agent renderer uses the black/neutral/acid theme. Preserve busy, empty, error, evidence, consent and explicit-execution behavior in the references below; recoloring does not expand capability.

Browser evidence covers 1440, 973, 390 and 320 widths, interaction checks, shader animation/static/fallback/context-loss behavior and synthetic desktop IPC fixtures. Current visual references include `.impeccable/review/dark-landing/desktop-hero.png`, `mobile-hero.png`, `desktop-footer.png` and `mobile-footer.png`. These checks do not establish a full WCAG audit, real-provider quality or packaged native UI verification. Fresh finishing review is separate from this documentation pass.

## Do's and Don'ts

- **Do** use true black, ivory, acid yellow and ice blue for current landing work, with supporting neutral ramps and restrained tints.
- **Do** preserve Geist, the trajectory geometry, explicit preview labels, visible focus and motion fallbacks.
- **Do** keep the retained web dashboard's light palette scoped to its existing workspace.
- **Do** keep every story stage and footer resource available on mobile and through explicit controls.
- **Don't** restore the rejected lavender landing/desktop world or the older white/indigo marketing stage from historical notes.
- **Don't** present illustrative workflows, fictional roles or synthetic IPC fixtures as live product proof.
- **Don't** imply that signed public installers, automatic submissions or native UI verification exist because a renderer capture is available.

The following references preserve earlier implementation and interaction details. All lavender and light styling in historical marketing/desktop sections is superseded by the current system above. Only the explicitly retained web dashboard keeps its light/lavender styling. Historical review and test statements apply to their original increments.

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
