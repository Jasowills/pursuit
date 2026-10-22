# Pursuit — Security, privacy, autonomy policy

## Trust boundaries

Websites, job posts, social posts, emails, attachments, resumes from unknown sources, and browser DOM are untrusted. Treat all as data, not instructions. OpenCode must only receive scoped tools via policy gateway. Isolate tenant data, browser sessions and agent workspaces.

## Approval policy (LOCKED)

Research, scoring, draft creation, resume tailoring, watcher setup, inbox classification and form prefill can execute automatically within granted scopes. Final external job submission, email sending, and social DM sending require explicit user approval of the exact payload. If a form is altered after approval, approval invalidates. User may revoke consent, pause all workflows, and review audit log. No default opt-in to autonomous sending.

## Privacy and secrets

- OAuth tokens encrypted at rest with envelope encryption; never stored in mobile client or logs.
- Least-privilege Gmail scopes; support disconnect and token revocation; Gmail app verification requirements may apply.
- Private resumes with signed expiring URLs; virus scan uploads; sanitize parsed document content.
- Rate-limit logins, API, email sending, job scraping and agent calls.
- Strict SSRF protection for user-provided URLs: resolve DNS, reject loopback/private/link-local/cloud metadata destinations, revalidate redirects, outbound network policy.
- CSRF/XSS protections, CSP, secure cookies, PKCE, MFA option, audit trails.
- No credential sharing with OpenCode model context; no arbitrary command execution or arbitrary network access from agent.
- Prompt injection tests: malicious job description asking to email secrets, malicious recruiter email instructing tool execution, malicious page hiding instructions, cross-tenant exfiltration attempts.

## Messaging compliance

Use lawful verified contact sourcing, respect opt-outs and platform terms, support do-not-contact, send caps, cooldowns, and local anti-spam requirements. No account takeover or CAPTCHA bypass. LinkedIn/X DMs require authorized integration or manual handoff. A user's request to 'text' does not authorize unsolicited SMS or platform messaging without explicit provider, permission and consent.

## Sensitive decisions

Work authorization, visa status, criminal background, protected-category disclosures, and legal attestations must be user-verified. Do not infer sensitive personal facts. If unknown, stop and request input.

## Auditability

Record approvals, versioned content hashes, tool call metadata, exact final destination, submission evidence, retries and status changes. Logs redact PII and credentials. All external action workers require idempotency controls.

## Threat model and operational requirements

Consider account takeover, malicious browser pages, phishing job links, OAuth scope abuse, duplicate submissions, recruiter spoofing, document leaks, SSRF, model prompt injection, compromised extensions, token theft, and provider outage. Build abuse controls before public signup. Security review and backup restoration test required before beta use with real Gmail.

---

## Explicit autonomy and desktop amendment — 2026-10-22

The user has authorized the product design to offer **bounded automatic applications after explicit setup; outreach remains approval-bound**. This replaces the older locked rule requiring a fresh manual click for every application when a user explicitly chooses the new automatic mode. It is not authorization to bypass current executable safeguards or send live applications during development.

- Default remains manual/Assisted. Automatic application grants must be scoped, versioned, expiring, revocable and budgeted; enforce them in Core and the browser executor, not in model instructions or a frontend switch.
- Create/consume a one-use exact-payload authorization for each application effect, retaining grant revision, job/destination, answers, document hashes, attempt ID and receipt/uncertainty evidence.
- Outreach/email/social sending and follow-ups require exact-message approval; application grants confer no messaging authority.
- Missing facts, sensitive declarations, unsupported widgets, CAPTCHA/MFA, policy changes and uncertain prior submissions stop execution or require the user.
- Desktop renderer, untrusted pages, model runtime, local API/IPC, secret store and remote companion are distinct trust boundaries. Never import arbitrary coding-agent permissions/hooks or expose raw runtime RPC remotely.
- Connect pairing requires explicit device approval, authenticated encrypted transport, replay defense, per-device permissions and revocation. Relay metadata exposure is documented; transport encryption alone is not authenticated pairing.
- Preserve factuality, isolation, suppression lists, redaction and idempotency rules above. See the [execution authority contract](../DESKTOP_IMPLEMENTATION_PLAN.md#bounded-automatic-application-authority).

This amendment records requirements only; automatic application execution remains unimplemented until its acceptance gates pass.
