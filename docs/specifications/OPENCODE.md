# OpenCode implementation directives — Pursuit

You are building the Pursuit career agent product. Read `README.md`, `PRD.md`, `BRAND_AND_LANDING.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `SECURITY_AND_POLICY.md`, and `DELIVERY_PLAN.md` before editing code.

## Workflow

1. Inspect repository state; do not overwrite existing user code without consent.
2. Create an implementation plan for the current phase, list files, APIs, migrations and tests.
3. Implement only the selected vertical slice; no fake integrations or unimplemented 'success' UI.
4. Write tests for critical logic and permission boundaries; run lint/typecheck/test/build.
5. Report what works, what is mocked, what is blocked, and how to run it.
6. Never mark a feature complete until acceptance tests in DELIVERY_PLAN.md pass.

## Strict constraints

- OpenCode is the agent runtime; use adapter with pinned, verified SDK/server APIs, not undocumented assumptions.
- Never expose unrestricted coding-agent shell, filesystem or secrets to web/mobile requests.
- Use Zod contracts and centralized authorization for every tool.
- Approval required for exact final application submission and message sending.
- Never fabricate credentials or claim submission without confirmation.
- Keep browser and Gmail actions idempotent and auditable.
- Keep the white/black original Pursuit design, not a clone of usejobmate.com.
- Keep open decisions open; propose options instead of choosing silently.

## First assignment

Scaffold monorepo, local dev infrastructure, shared design tokens, responsive original landing page, Next.js authenticated shell, Expo app shell, NestJS API with health endpoint, shared Zod package, database migrations for tenant/user/profile/job, and CI. Add README setup instructions and a smoke test showing shared backend state on web/mobile. Do not connect real Gmail or send applications in this first slice.
