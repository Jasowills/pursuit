# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The initial operator is one serious job seeker running a high-volume, evidence-sensitive search. They work across a browser, a web dashboard, and an Expo mobile shell, often with many tabs and applications open at once. Public signup, teams, billing, and marketplace are explicitly out of the v1 scope; the tenant model is multi-tenant-safe from day one.

## Product Purpose

Pursuit is a personal, human-supervised career agent. It discovers and qualifies opportunities, keeps a factual career profile, prepares application material, tracks every state change, and keeps a human approval in front of anything that leaves the building. Success is verified qualified opportunities surfaced, confirmed submissions, and reduced review burden — never application volume alone.

## Positioning

Pursuit is moving toward an explicitly opt-in career autopilot: research, qualify, prepare, apply, track, and notify while the user is away. Automatic application execution remains unavailable; scheduled Greenhouse research and BYOM draft preparation are implemented. The current external-action gateway is approval-bound. A policy gateway blocks external actions until the operator approves one exact payload, bound to a hash and consumable once. Every state transition carries evidence; missing evidence and unknown eligibility are explicit states, never silent passes. The durable record is the product.

## Operating Context

The shipped M1 surfaces are a Next.js web app, an Expo mobile shell, a NestJS API, PostgreSQL, and an agent adapter. The current agent runtime is deterministic and model-free (`AGENT_RUNTIME=dev`). Jobs enter through manual intake; watchers store URLs and schedules but do not execute; approvals, notifications, applications, and resume records exist. The design must be usable in a normal browser, keyboard-only, at 390, 768, and 1440 widths, and in the Expo web preview.

## Capabilities and Constraints

Implemented: dev login with 7-day DB sessions; career profile read/update; manual job intake with dedupe and eligibility scoring; application state machine and event timeline; approval records with hash-bound previews; proposal-only agent runtime with tool policy; SSE outbox stream; watcher CRUD and enable/disable; in-app notifications; web dashboard; Expo shell.

The current workflow also supports BYOM model preparation, Greenhouse imports, Gmail connections through Composio or direct Google OAuth, approval-bound plain-text outreach, and opt-in scheduled research/draft preparation with persistent run history and in-app notifications. Not implemented or explicitly unavailable: universal web discovery, generic watcher execution, LinkedIn connections, PDF/DOCX parsing/export, autonomous browser application submissions, offline push/email notification delivery, production identity, billing, and pricing. These must render as visible, honest unavailable states. Never fabricate API responses, applications, submissions, credentials, confirmation refs, or success states. All seeded companies and people are fictional.

## Brand Commitments

Working name **Pursuit**. Tagline: **Your next move, already in motion.** Hero H1: **Your next opportunity doesn't wait. Neither should you.** Primary CTA: **Start your search**; secondary: **See how it works**. Voice is precise, optimistic, calm, capable; no hype, no promised interviews, no claims of auto-submission. The mark is an original north-east trajectory/arrow, not a copied icon. Visual reference: https://usejobmate.com/ for warmth, colour, product-showcase energy, and scroll craft — not for copied assets, layout, copy, or proprietary screenshots. White/off-white canvas, near-black controls, and Geist Sans/Geist Mono are the base; any saturated field colour is an original Pursuit choice.

## Evidence on Hand

- `docs/specifications/PRD.md`, `ARCHITECTURE.md`, `SECURITY_AND_POLICY.md`, `BRAND_AND_LANDING.md`, `DESIGN_SYSTEM.md`.
- Fictional seed records: companies ExampleCorp, GraphiteWorks, TerraVine, DefenseRay; jobs including Senior Software Engineer, Growth; watcher for `jobs.exampleco.example`; one seeded application in DISCOVERED.
- Seeded account: `demo@pursuit.local` / Demo Operator (development only).
- No real testimonials, customers, logos, benchmarks, pricing, press, or production screenshots exist. Do not invent them.

## Product Principles

1. **Truth before polish.** An unavailable capability is a visible state, not a fake button.
2. **Human control is structural.** The agent proposes; the operator approves one exact payload.
3. **Evidence travels with the record.** Every transition, tool call, and approval has a trace.
4. **Momentum without noise.** The interface should make the next move obvious and keep the whole search inspectable.
5. **Calm is a feature.** Generous spacing, readable type, and clear state language beat urgency theatre.

## Accessibility & Inclusion

WCAG 2.2 AA is the floor: 4.5:1 body contrast, 3:1 large text, 44px minimum touch targets, visible focus rings, keyboard-complete flows, reduced-motion fallbacks, no horizontal overflow, and honest loading/error/empty states. Dynamic type and native safe areas apply to the Expo shell.

## Career Autopilot Direction (2026-10-21)

The user can configure and enable background work, pause it, inspect run history, and receive completion notifications. The intended finished product includes automatic applications within an explicit user policy. The current slice supports scheduled public Greenhouse research, user-profile qualification, and optional BYOM draft preparation with in-app completion alerts. Browser/ATS application submission and offline push/email delivery remain outstanding; do not claim they work. See docs/AUTOPILOT.md for implementation boundaries and the remaining executor contract.

Pursuit is an open source project at https://github.com/Jasowills/pursuit. The landing navbar links to the repository, and CONTRIBUTING.md explains how to contribute.

## Desktop-first amendment (2026-10-22)

The approved target is a local-first downloadable desktop career agent harness on macOS, Windows and Linux from the first usable alpha. There is no separate hosted career dashboard or required Pursuit account. Existing web/API code is retained for migration and is the currently implemented delivery, not the target topology. Preserve Pursuit branding and useful components.

OpenCode is the initial runtime and a provider-configuration entry point; separately support qualified OpenCode-hosted inference/Zen and user-owned provider/local model connections. Never describe the runtime as an AI model or assume subscription entitlement.

The user explicitly selected bounded automatic application submission after setup, with exact-message approval for outreach. This supersedes earlier product-only per-application approval requirements for the opted-in mode; implementation must first add scoped/revocable grants, exact-payload action authorization and receipt/uncertainty handling. Current automatic submission is still unavailable.

Connect is an optional authenticated encrypted internet relay connection to a running desktop, with accountless pairing and device revocation. Mobile is a companion, not a hosted dashboard or independent authoritative database. Relay does not provide execution when the desktop is off.

Career Identity provenance, user-confirmed eligibility, writing personalization and a trustworthy first document/application-preparation slice precede broad browser automation and Connect. See docs/DESKTOP_CHANGE_IMPACT.md, docs/DESKTOP_IMPLEMENTATION_PLAN.md and the dated amendment to docs/specifications/PRD.md. These are target decisions, not claims of completed desktop functionality.

## Desktop foundation implementation (2026-10-22)

A Tauri desktop foundation now builds locally for macOS Intel. It has native SQLite task history, Career Identity labeled-text sources and explicit fact review with provenance, and a native Ollama catalog/basic-text-generation test interface. Existing web/API code stays intact. Cross-platform CI is configured but has not been run here; signed release qualification remains outstanding. UI populated-state verification uses synthetic IPC fixtures, database tests exercise real SQLite, and no live model generation has been verified. OpenCode/provider-key connection settings, PDF/DOCX, writing personalization, agent execution, automatic application submission and Connect remain unfinished. See docs/DESKTOP_BUILD_STATUS.md for exact boundaries.

## Desktop provider settings increment (2026-10-22)

Desktop Models settings now have native OS credential-store adapters and catalog/basic-generation connectors for OpenAI, Anthropic, Gemini, OpenRouter/Hermes, Groq and OpenCode-hosted Console inference. Actual provider inference remains unverified; no real credentials or paid inference were used. A separate native macOS Keychain write/read/delete test passed with a temporary non-secret entry, while packaged-app permissions and Windows/Linux store behavior remain unverified. Provider keys stay outside SQLite and are not returned by native commands. OpenCode's installed CLI passed a version-only isolated probe (v2.1.2); managed sessions, streaming, interruption and provider import remain unfinished. These settings do not yet run career preparation tasks. See docs/DESKTOP_MODEL_CONNECTIONS.md.

## Managed desktop Agent increment — 2026-10-22

Implemented private installed OpenCode 2.1.2 sessions, explicit provider/model binding, opt-in confirmed identity facts, real SSE partial text, active interruption and SQLite v3 session snapshots/history. Per-session drafts and identity consent reset prevent accidental sharing across conversations. Normal Stop/Quit cleans up the owned child. No background submissions or outreach are enabled by this increment.

Verification: 10 local-store tests and 9 default native tests passed. Explicit installed-runtime tests passed authenticated queue/restart/cleanup and controlled generation/streaming/interruption without paid inference. Browser renderer checks use synthetic IPC, not native marketing captures. Actual provider compatibility, signed releases and Windows/Linux runtime qualification remain open. See [runtime guide](docs/DESKTOP_AGENT_RUNTIME.md).

## Dark product experience amendment — 2026-10-22

The user selected near-black and lavender for both landing page and desktop harness. This supersedes the prior white-background commitment. Preserve the original mark, self-hosted Geist and precise product voice. Landing acquisition now targets the local-first desktop alpha with source download/build instructions until signed public installers exist. Resume tailoring and bounded automatic applications are prominent, but illustrative previews must never imply that the unfinished desktop packet exporter or ATS executor already works. Pursuit Connect, richer research, writing preferences and social workflows remain clearly planned.

## Forward motion visual replacement — 2026-10-22

The user rejected the lavender landing and asked for true black, a compact three-to-four-color palette, a creative WebGL-capable hero, and public-reference study of T3 Code, Diffusion Studio and Neatlogs. This supersedes the earlier near-black/lavender selection. The current landing and desktop use black, ivory, acid yellow and ice blue; the trajectory mark is recolored rather than replaced. The landing gains a procedural motion field, a post-hero career-brief walkthrough, and a full directory/large-wordmark footer. Product availability and preview disclosures remain unchanged.

## Personal career assistant and complete product journey — 2026-10-22

The user approved the WebGL hero and asked for a fuller, realistic product story and a familiar conversational desktop. Desktop and browser tour now share the same three-column career workspace: sidebar, assistant conversation and role/document inspector. New local career records persist in SQLite v4, local application-count answers do not invoke a model, and explicit model questions route to managed OpenCode with identity sharing off by default. Sample workspace is opt-in, isolated in memory and visibly labeled; its approvals/completions never execute external actions. The public tour is an example career for a product designer, broadening the product beyond developers.

The landing showcases full original/tailored resumes, cover letters, video introduction scripts/checklists, cold outreach sourcing, Gmail direct/Composio connections, background work, notifications and the companion match/review/approve/completion flow. Main copy describes the intended experience directly; current release limitations remain in FAQ/downloads. A floating navigation dock displays real GitHub stars with a safe unavailable state. Lime companion/closing sections and motion extend the approved palette. Real desktop-renderer captures in explicit sample mode replace the empty foundation screenshot. No example count or completion is proof of a real submission.

## Bounded discovery and execution discussion — 2026-10-22

The user selected broad global discovery, a personal ceiling of 100 automatic applications per day with eligibility enforcement, and an optional always-on worker: user-hosted first, managed hosting later. These are target decisions, not implemented executor capabilities. Model-spend budget, first role families and mobile release channel remain undecided; global discovery does not imply work authorization everywhere. Recommended architecture separates token-free structured discovery/watchers and deterministic checks from bounded model evaluation/preparation and a qualified application executor. Main harness changes await pipeline agreement. See docs/CAREER_PIPELINE_DECISIONS.md and docs/research/job-hunting-pipeline.md.

The landing now includes a centered scroll-linked sourcing/preparation/application story, a Company watchers simulation, OS-aware hero acquisition with licensed OS marks, and a neutral glossy floating navigation surface. Source-only download availability and simulated watcher/submission disclosures remain explicit.

## Neutral annotation refinement — 2026-10-22

The user rejected green/blue-tinted product surfaces and colored panel borders. Landing and shared desktop now use neutral black/gray materials, preserving the primary lime action/mark. User-approved hero structure remains; download/watch actions align. The application story removes mode tabs in favor of a progress/approval timeline. Companion has more useful example work and screens, visible-only autoplay and manual/pause/reduced-motion controls. Watchers show real company marks but simulated alerts. Gmail/Composio use first-party marks, Pexels imagery remains illustrative, and the footer uses original per-letter spring/fade motion inspired by the requested Bitnob reference. These are UI refinements, not implementation of the job-hunting pipeline.
