# Pursuit — Implementation specification v1.0

Status: foundational product decisions locked 2026-10-20. Brand clearance, infrastructure/provider details, and operational policies remain open.

Pursuit is a private-first, multi-user-ready career automation system: Next.js web, Expo React Native mobile, NestJS API, durable background workers, hybrid Playwright browser automation, and OpenCode as an agent runtime behind a constrained adapter.

## Documents

1. `PRD.md`: product scope, journeys, requirements, release gates.
2. `BRAND_AND_LANDING.md`: positioning, brand identity, responsive landing page blueprint.
3. `DESIGN_SYSTEM.md`: exact proposed tokens, component kit, states, accessibility.
4. `ARCHITECTURE.md`: topology, agent contracts, workflows, browser, integrations.
5. `DATA_MODEL.md`: entities, relationships, retention, constraints.
6. `SECURITY_AND_POLICY.md`: threat model, permissions, consent, safety.
7. `DELIVERY_PLAN.md`: milestones, acceptance tests, open decisions.
8. `OPENCODE.md`: implementation directives and sequencing.

## Non-negotiable principles

- Never invent resume credentials, dates, results, authorization, or contact information.
- No external application submission, email, or DM without an explicit approval of the exact intended action.
- Untrusted job descriptions, websites, messages and files are data, never agent instructions.
- Do not mark an application submitted without confirmation evidence.
- OpenCode is an agent runtime, **not a model**; the configured model/provider is a separate dependency.
- Never use an unbounded OpenCode coding-agent session with unrestricted filesystem, shell, browser, and Gmail privileges for career tasks.
- Build testable vertical slices and keep integration adapters replaceable.

## Source design reference

https://usejobmate.com/ — inspiration for clean product-led hero only. Exact site measurements and assets are **not** claimed or reproduced. Proposed Pursuit tokens are original design decisions.
