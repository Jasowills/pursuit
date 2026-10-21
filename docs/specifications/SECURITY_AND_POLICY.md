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
