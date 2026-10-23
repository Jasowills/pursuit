# Native sourcing and application review

Updated 2026-10-23. The desktop harness now calls the same discovery, source-backed tailoring and bounded application modules as the headless engine. It does not require the retained web account, Nest API or PostgreSQL. This is a developer-alpha integration, not live Ashby or production qualification.

## Run it

```sh
pnpm install --frozen-lockfile
pnpm dev:desktop
```

The desktop build prepares a bundled Node worker and includes Playwright's library resources. **Node 22.13 or later must be installed on the computer.** Chromium/Chrome must also be installed to inspect or execute application forms; Pursuit does not download a browser at runtime. Open **Opportunities → Engine setup**, confirm the absolute executable paths and save. Enabling execution is a separate, default-off setting. Choose only trusted installed executables.

GUI applications can have a different PATH from a terminal. Pursuit tries common executable locations, but setup may need the absolute path returned by `which node` or your browser installation. A package's existence is not proof its executable is compatible. Only macOS has been checked in this pass; Windows/Linux packaging and native webviews still need qualification.

## Search to shortlist

1. Set target roles, source-backed skills, residence, confirmed work-authorization countries, remote preference, exclusions and optional compensation floor. Each skill includes its evidence. These are user assertions, not independently verified credentials.
2. Optionally add employer ATS board URLs or structured job-detail pages, with an employer name. Public Himalayas queries are also created from the target roles. The native flow does not yet configure the headless engine's optional indexed-search key or arbitrary career-directory crawling.
3. Start a bounded search. Actual source progress, failures, partial runs and observation timestamps are retained. Each run checks at most six due sources, with at most two pages per source. Source intervals still apply; clicking again does not force a fresh poll of every board. The pool returns at most 300 ranked roles.
4. Review matching evidence and eligibility separately. Unknown work rights, payroll support or timezone remain unknown. An experimental fit score is not a hiring probability. Not every matching role is eligible.
5. Save a role into the local shortlist. If an employer changes the posting, use **Refresh saved posting**, then prepare a new packet. Changed role text clears the old active packet while keeping the reviewed original resume. Source URL, observed time and assessment travel with it. Open links in the system browser through a constrained HTTPS command. A manually pasted posting can still be saved and tailored, but cannot bypass source verification to execute an application.

The existing discovery adapters, network restrictions and access policies apply. This is not complete coverage of LinkedIn, Indeed, Glassdoor or the whole web. Public source failures remain visible rather than becoming fabricated roles. See [discovery coverage](DISCOVERY_ENGINE.md).

## Documents to approved application

1. Select a saved role and choose **Prepare resume and PDF**. Import/review the source, prepare a grounded packet and build/save its PDF in **Resumes & letters**. The selected opportunity carries across screens. The inspector shows the saved resume text and letter for that role.
2. Return to **Applications** and inspect the Ashby form. The native command reads the packet and PDF from the local career book/vault; the renderer cannot substitute a different upload through this command. The engine checks source offsets, job identity and PDF hash again, then retains an immutable packet/PDF association.
3. Inspect does **not** upload the resume or submit. The engine re-verifies the posting and determines its application route. Email instructions, other ATS providers, changed/closed roles, ineligible roles and unsupported widgets stop for manual review.
4. Enter required answers yourself and review eligibility and resume claims. Only known form fields are accepted. Required additional attachments are unsupported. Invalid provided optional answers also stop before execution. No answers about sponsorship or legal attestations are guessed.
5. Review the saved destination, original resume text, PDF hash and answer set. The cover letter remains a draft: **this executor uploads the resume only**, and does not silently attach or send the letter.
6. Enable the daily policy, capped at 100 attempts, and approve the exact payload. Approval lasts 30 minutes. A separate **Submit approved application** action, with a renewed explicit confirmation checkbox, starts execution.
7. The engine rechecks the current employer posting, form fingerprint, exact PDF, approval expiry, policy and execution lease before submit. Unsupported changes stop for review. A hosted confirmation following an accepted application POST records `CONFIRMED`; it does not prove a recruiter read the application.

A repeated run of a confirmed or uncertain application cannot submit again. A crash after entering submission becomes uncertain when its lease expires; it never becomes an automatic retry. Keep the app open during an action. Closing Pursuit terminates its owned worker. Application leases can persist for up to 15 minutes after interruption, so a refresh can temporarily show PREPARING or SUBMITTING; it does not authorize a retry. Refresh saved state after an interruption before doing anything else.

## Pause, recovery and history

**Pause pending applications** in the desktop utility bar uses an independent native command, so it can revoke authorization while another form is being prepared. It preserves the daily ceiling. A form that has already sent its request cannot be recalled by pausing. Check the employer and recorded outcome if uncertain.

The normal engine commands are serialized in the desktop host; the application queue additionally fences concurrent workers and reserves attempts before browser work. `Background work` displays source runs, queue states and receipts. On reload, the review screen retrieves the saved plan and its exact packet. A recorded confirmation can repair a missed shortlist update without resubmission.

This native worker runs requested foreground actions only. It does not poll indefinitely, execute new roles automatically, continue after the app closes or provide mobile relay. The separate retained API worker is unchanged. A user-hosted always-on service remains a later integration.

## Storage and process limits

- Existing `workspace.sqlite` retains the career book and generated PDF bytes. The career-book size limit still applies; large shortlists can exceed it and return a save failure. Imported document binaries are not retained by that native vault.
- The app-data `career-engine/` directory holds `runtime.json`, `discovery.sqlite`, `packets.sqlite` and `applications.sqlite`. Original reviewed text, application answers and packet/PDF versions contain personal data. Keep the whole app-data directory in protected backups. At-rest encryption, retention/deletion controls and a full version-history UI remain unfinished.
- On Unix the new directory is mode 0700 and files are mode 0600. This is device protection, not tenant authentication or a sandbox against another process running as the same OS user.
- The process receives an allowlisted environment, not model-provider keys or inherited browser profiles. Commands use a fixed packaged worker and strict action schemas; job content is never shell code. Application network access still uses the Ashby adapter's pinned allowlist.
- A request/response is bounded to 4 MB and a native action to 180 seconds. Timeout cleanup requests browser termination before force-killing the worker; cross-platform resource-exhaustion and crash qualification remain outstanding. An interrupted source claim can remain leased for up to 15 minutes.

## Verification

See [the native integration report](qa/NATIVE_WORKFLOW_REPORT.md). Separate checks exercise the built frontend, Rust-to-packaged-Node transport, local SQLite persistence and the real browser adapter against intercepted pages. They do not collectively prove an actual macOS webview or a real employer form. No real applications, mailbox actions or paid model calls were made in this pass.
