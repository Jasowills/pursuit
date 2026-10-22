# Contributing to Pursuit

Thanks for helping build an open source career assistant. Report bugs, suggest improvements, improve documentation, or send a pull request at [Jasowills/pursuit](https://github.com/Jasowills/pursuit).

## Get running

Use Node.js 22+ and the pnpm version declared in `package.json`.

```sh
pnpm install
cp .env.example .env
pnpm db:up
pnpm --filter @pursuit/database build
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Read [README.md](README.md) for local ports and setup, [connection setup](docs/CONNECTION_SETUP.md) for BYOM and Gmail, and [implementation status](docs/WORKFLOW_IMPLEMENTATION_STATUS.md) for current limits. Use fictional seed data for development. The passwordless development login must remain unavailable in production.

## Find your way around

- `apps/web`: Next.js dashboard and landing page.
- `apps/api`: NestJS endpoints and persistent background processing.
- `apps/mobile`: Expo client.
- `packages/shared`: contracts, eligibility, and state transitions.
- `packages/database`: Prisma schema, migrations, and fixtures.
- `packages/agent-core`: agent adapters and execution policy.
- `docs`: product specifications and implementation notes.

## Changes and pull requests

Open an issue before a large feature or architecture change so maintainers can agree on scope. Keep each PR focused. Explain the user problem, what changes, verification performed, and remaining limitations. Include before/after captures for UI work and migration/deployment notes for schema changes. Disclose material AI assistance and review generated code yourself.

Before submitting:

```sh
pnpm typecheck
pnpm test
pnpm build
```

Run focused checks during development. Add meaningful tests for behavior changes, especially tenant/user isolation, retry handling, scheduler concurrency, pause controls, approval consumption, and submission receipts. Format changed files with Prettier. Do not bundle unrelated refactors or generated build output.

## Career autopilot

Autopilot is an explicit opt-in product direction: research, qualify, prepare, and eventually apply within the user's configured scope while they are away. See [the autopilot implementation notes](docs/AUTOPILOT.md). A setting must describe the capabilities that actually exist. Research and draft preparation must never be reported as completed applications.

An application executor must retain a verifiable provider confirmation before marking an application submitted. Stop when questions need facts that the profile does not contain. Never invent credentials, employment history, authorization, answers, contact details, or delivery receipts. Respect exclusions, limits, pause/revoke controls, source access constraints, and duplicate protection. Changes to execution policy need corresponding tests and documentation.

## Protect people and credentials

Never commit `.env`, API keys, OAuth tokens, real resumes, browser sessions, or private applicant data. Do not send real applications or messages as part of automated tests. Use isolated test accounts and explicit human authorization for any live integration test.

Report security vulnerabilities privately through GitHub's **Report a vulnerability** option if available; otherwise contact the repository maintainer privately. Do not publish exploit details or secrets in an issue.

Be respectful in issues, reviews, and discussions. Critique the work, explain your reasoning, and make room for contributors with different levels of experience.
