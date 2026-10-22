# Workflow launch

Agreed scope: one Discover → Prepare → Connect → Manage journey. Each user brings
their own model credentials. OpenCode is the primary agent runtime. Gmail connects
through Composio. Landing media must be captured from the real application.

## Delivery order and acceptance

1. **Connections and safety**: encrypted, user-owned provider credentials; live model
   discovery and test; revocation; no credentials in responses, logs, or prompts.
   OpenAI, Anthropic/Claude, Google/Gemini, and Nous/Hermes are integration targets,
   not a claim that every model has passed a real run. No shared provider mutation.
2. **Discover**: Greenhouse public board import plus manual intake. Persist sources,
   dedupe per user, show eligibility reasons and unknowns. Arbitrary page extraction,
   LinkedIn discovery, and scheduled watchers need separate adapters.
3. **Prepare**: factual master resume, user-selected model, persisted tailored
   material, cover letter, editable outreach draft, and downloadable version.
   Model output is an unverified draft until human review.
4. **Connect**: Composio managed Gmail authorization, per-user account verification,
   status and revocation; exact-payload, expiring single-use approval. Ambiguous send
   failures require reconciliation, never blind retry. No live sends during agent QA.
5. **Manage**: application and material history, proposal persistence, errors, evidence.
6. **Browser execution**: isolated browser worker, supported ATS contract, visible
   activity, human intervention, pause/cancel, exact-payload approval and real receipt.
   A controlled ATS fixture proves mechanics; real ATS support requires its own test.
7. **Showcase**: record the verified journey in a labeled sample account; chapters
   for discover, prepare, connect and manage; poster, pause/replay, reduced motion,
   responsive screenshots. Never stage a successful provider run or email delivery.
8. **Landing**: real capture hero, BYOM explanation, Gmail/Composio section, five
   pillars, favicon/touch icons. Available/configuration-required/planned stay distinct.

## Verification

Unit tests: encryption and ownership binding, provider transport, output validation.
Integration: user isolation, connection lifecycle, approval edit invalidation,
concurrent consumption, job dedupe, persisted materials, ambiguous send handling.
Browser: complete workflow, errors, 390/768/1440 layouts, keyboard and media controls.

## External setup

- API operator supplies a 32-byte encryption key outside source control.
- Users connect their own model API keys and choose an available model.
- Operator creates a Composio project and Gmail auth config; each user consents.
- OpenCode worker must isolate config, credentials and filesystem per user/run.
- Never use an operator's existing local model credentials as a user's BYOM key.

## Integration references checked 2026-10-21

- https://developers.openai.com/api/reference/resources/models/methods/list
- https://platform.claude.com/docs/en/api/models/list
- https://ai.google.dev/api/models
- https://hermes-agent.nousresearch.com/docs/integrations/nous-portal
- https://docs.opencode.ai/docs/sdk/
- https://docs.composio.dev/reference/api-reference/connected-accounts
- https://docs.composio.dev/reference/api-reference/connected-accounts/postConnectedAccountsLink

The installed OpenCode v2.1.2 uses a different server ABI from some public SDK
examples. Pin and verify the installed worker contract before sending user secrets.
