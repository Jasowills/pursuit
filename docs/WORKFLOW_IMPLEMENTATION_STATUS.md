# Workflow implementation status

## Implemented in this slice

- `/app/autopilot`: opt-in scheduled Greenhouse research and BYOM draft preparation, per-user settings, database leases, pause fencing, usage limits, run history, and persistent in-app completion notifications. Automatic application submission and offline push/email delivery are not implemented. See [AUTOPILOT.md](AUTOPILOT.md).
- Public GitHub navbar link and root [CONTRIBUTING.md](../CONTRIBUTING.md).

- `/app/settings`: per-user BYOM connections, encrypted with AES-256-GCM and bound
  to tenant/user/provider using authenticated additional data. Keys never return in
  connection responses. Fixed provider destinations and no cross-origin redirects.
- Dynamic model catalogs and a real inference test before model selection.
  OpenAI, Claude, Gemini, and Hermes via OpenRouter. No provider credentials were
  used for live verification during this implementation.
- `/app/workflow`: Greenhouse board import (25 roles per request), manual intake,
  tenant-scoped job listing, factual resume input, model-assisted material generation,
  persisted editable materials and plain-text downloads.
- Two Gmail adapters: Composio managed OAuth and direct Google web-server OAuth
  with per-user expiring state and PKCE. Direct OAuth requests identity/email and
  Gmail send scope. Composio deferred identity verification is also implemented.
- Exact-material/recipient/mailbox hash approval, invalidation on edits, 30-minute
  expiry, atomic single-use claim, confirmed message IDs, and ambiguous-delivery lock.
- Persisted agent proposals, visible in run history. Development login disabled
  in production; production identity remains unimplemented.
- Single populated real-workspace hero image, on-demand guided screenshot tour of the redesigned app,
  native playback controls, explicit demo limitations, favicon and
  Apple touch icon. Model and Gmail landing sections describe configuration needs.

## Verification boundary

Workspace typechecking and the production build passed. All 62 automated tests
passed (26 shared, 10 agent-core, 26 API). A parallel Jest teardown warning did not
reproduce in the bounded `--runInBand --detectOpenHandles` check. Browser checks at
1440px and 390px passed chapter selection, video playback, favicon discovery and
overflow checks with no JavaScript errors.

Automated tests use real local PostgreSQL with mocked model and Gmail transports.
The recording uses the real app/API/database with fictional input and no network
mocks. It shows manual intake/dedupe, preparation setup, Gmail setup and application
creation; it does not show model generation, OAuth completion, email delivery or
browser submission. See `apps/web/public/product/capture.json` for media provenance.

## Still required before calling the full launch workflow complete

1. Connect user-owned model credentials and verify inference/material quality.
2. Configure Composio and/or Google OAuth; complete user consent and explicitly
   review a deliberate test message before sending it. Never use a real contact for
   automated QA. Live provider compatibility is not established by mocked tests.
3. Isolated BYOM OpenCode workers. Current material generation calls direct provider
   adapters. The existing OpenCode agent path is not wired to saved BYOM credentials;
   no keys are written into a shared worker. An isolated worker contract probe did
   not establish a usable server handshake, so it is not represented as working.
4. Supervised application-browser execution, pause/resume/cancel and supported ATS
   adapters, including real confirmation evidence. No automated submissions exist.
5. PDF/DOCX resume parsing/export, contact research/verification, response tracking,
   scheduled watchers, production identity and deployment hardening.
6. Replace the setup-state guided tour with successful real model and Gmail
   workflow recordings only after those integrations have passed live verification.

Setup instructions: [CONNECTION_SETUP.md](CONNECTION_SETUP.md).

## Autopilot verification (2026-10-21)

API build and web typecheck pass. All 34 API tests pass, including eight new autopilot integration cases using local Postgres with mocked external providers. Live model generation, automatic ATS submission, and external notifications were not verified.
