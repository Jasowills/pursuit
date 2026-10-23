# Resume tailoring and application execution

Implementation update: 2026-10-23. The native tailoring workflow and retained API now generate and save real PDFs. Ashby hosted-form execution has an API and durable single-host worker, with isolated browser-fixture qualification. It has **not been qualified against a real employer application** and is disabled by default. This is not a production-readiness claim.

## Grounding before writing

The previous workflow relied on a prompt telling the model not to invent experience. That instruction was insufficient as a factual control. The new engine imports source text into immutable, source-referenced blocks. A user reviews extraction before creating a packet. Every exported resume block must match the reviewed source at its recorded offsets.

Tailoring currently means selecting relevant experience and preserving wording and chronology. Employer/title/date context, identity, education and licence sections cannot be removed by a model selection. The baseline uses direct term overlap; optional model assistance selects existing IDs only. It does not write new facts, add metrics, invent employment or stuff unsupported keywords into the resume. Changed text requires a new reviewed source. This is intentionally narrower than an automated prose-rewriting system.

The two templates, Classic and Compact, use a single column, readable text, ordinary section headings and an embedded Noto Sans font. They are informed by documented parsing guidance, **not endorsed or approved by employers**. PDF output is actual text, not a page image. It is limited to four pages and 2.5 MB; overflow and missing glyph coverage are errors, not silent truncation. Noto Sans is not universal Unicode coverage; additional language fonts are still needed. The font's OFL licence is bundled.

See [document and ATS research](research/tailoring-document-contracts.md). No template guarantees a particular ATS score, interview or hiring outcome.

## Native workflow

Open **Resumes & letters**:

1. Import a text-based PDF, DOCX or UTF-8 text file, or paste corrected source text.
2. Review the extracted name, employers, roles, dates, qualifications, numbers and section boundaries. Confirm the review explicitly.
3. Select a saved role. Choose story-led, professional or direct tone, add your own motivation and optionally a writing sample.
4. Prepare without a model, or ask the connected native model to select experience IDs.
5. Inspect kept/omitted blocks and the grounded cover-letter preview. Build and export the PDF.

The local career book retains source text, tone settings and the current packet. PDFs are stored separately in SQLite with SHA-256 integrity checks and survive restart. Export writes the saved PDF to `Documents/Pursuit`. The original selected file is not overwritten. The native screen currently keeps one active packet; a full version-history manager and import of original binary files into the native vault remain work. The retained API has persisted master/version records and original-file retrieval.

Three introductions give users a concrete choice. Personal motivation is used verbatim. Writing samples supply simple, visible style signals (sentence length and contraction preference), not a model-trained voice or an automated grammar assessment. User tone selection takes priority. Deeper reviewed prose rewriting remains separate work.

## Import safety and limits

- PDF/DOCX parsing runs in a terminable worker: 15-second timeout, 8 MB input, maximum 20 PDF pages. API workers have a 192 MB JS-heap limit and at most two simultaneous imports per API process; that is not a complete process/RSS sandbox.
- Blank/scanned PDFs return an OCR-required error. No invisible model OCR or invented text is substituted.
- DOCX extraction streams only `word/document.xml`, checks actual decompressed bytes, and caps XML size/depth/node count. It does not fetch relationships, execute macros or load embedded objects. Headers, footers, comments and other omitted content require user review; contact information should be in the main body.
- Extracted reading order is not assumed correct. Source editing clears the review checkbox. Multi-column PDFs and unusual document layouts require careful correction.
- Google Docs can be downloaded as DOCX and imported through the native workflow. A fixed-endpoint, bounded Drive export helper is implemented and contract-tested, but a dedicated Drive OAuth connection is **not wired into Pursuit yet**. A Gmail-only grant is insufficient; no Google Doc was accessed in testing.

## Small models and token use

Source extraction, hashing, matching baseline, layout, PDF creation, artifact storage, form fingerprinting and queue transitions do not call a model. The optional selection prompt contains at most 20 experience snippets of 200 characters and 2,500 characters of job requirements. Its output is a small list of existing IDs; invalid output cannot become resume prose. There is no automatic repair loop.

The retained API defaults to no inference for packet creation. Repeated identical source/job/voice/template requests return a cached version. The optional selection call caps output at 512 tokens. A live synthetic Qwen 2.5 7B run used **183 input tokens and 24 output tokens**, selected the relevant QA bullet, and preserved all resume text. This is one wiring check, not a universal model-quality benchmark.

Native selection uses the existing managed OpenCode conversation boundary without adding the full identity context. Hosted provider availability depends on the configured runtime/model. The retained gateway supports OpenAI, Claude, Gemini, Hermes models through OpenRouter, and opt-in Ollama on the API host's fixed loopback endpoint. Hermes model support is not an implemented Hermes Agent runtime adapter. Paid providers were not live-tested in this run.

For retained API Ollama, set `ENABLE_LOCAL_MODELS=true`; connect provider `ollama` with an empty key, select an installed model and test it. The host's encrypted connection store must still be configured. No client-selected URL is accepted. Ollama requests use temperature zero, a 4,096-token context and bounded output. Local inference has compute/memory costs even without provider token billing.

The older web workflow still accepts pasted source text. It now replaces model-authored resume, cover letter and outreach text with source-backed material; match notes remain advisory. It uses a bounded model call instead of sending the entire career profile. PDF import/export lives in the new tailoring API and native studio rather than being falsely attached to its older text-download controls.

## Retained API

All routes require authentication and enforce source ownership, including users within a tenant.

| Route                                        | Behavior                                                          |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `POST /api/v1/tailoring/sources`             | Multipart `file` import; review pending                           |
| `GET /api/v1/tailoring/sources/:id`          | Owner's extracted source                                          |
| `GET /api/v1/tailoring/sources/:id/original` | Owner's original imported bytes, integrity checked                |
| `POST /api/v1/tailoring/sources/:id/review`  | `text`, exact `expectedHash`, `confirmed: true`                   |
| `POST /api/v1/tailoring/packets`             | `masterId`, `jobId`, optional `voice`, `template`, `connectionId` |
| `GET /api/v1/tailoring/packets/:id/pdf`      | Saved owner-scoped PDF attachment                                 |

Private files are under `RESUME_STORAGE_DIR` (default `.data/resumes`), grouped by tenant/user/master. Keep that directory on durable protected storage with backups. Data is not encrypted at rest by this module. History/retention and deletion tooling need further work; deleting a profile elsewhere does not currently purge this independent file store. Original-file import and reviewed source are retained separately. Exported packets are drafts, not application authorizations.

## From a link to an application

`POST /api/v1/application-execution/resolve` accepts a job URL. Supported public ATS URLs resolve through their public job data; generic permitted pages use structured JobPosting extraction. Restricted/social-board links return a request for the canonical employer posting or pasted details. Explicit email-application instructions are returned as an email-review route with the published quote and recipient candidate; it does not send. The resolver does not log into LinkedIn/X, invent missing requirements or claim all boards are supported.

Public ATS reads do not authorize employer submission APIs. Greenhouse, Ashby and Lever have employer-authorized write interfaces. Pursuit's first candidate execution adapter therefore uses a bounded Ashby hosted browser form. See [application-provider research](research/application-execution-contracts.md).

The Ashby adapter observes labelled controls, fills only the approved answer map, uploads the exact PDF hash and checks the form again before submit. Unknown/ambiguous controls, additional required files, changed conditional questions and CAPTCHAs stop for user attention. No model receives an unrestricted browser or invents answers about work rights, salary or attestations.

The live launcher pins public DNS and limits network requests to configured Ashby hosts. Third-party assets or unsupported widgets can prevent a real form from working; this is a deliberate failure boundary, not universal form coverage. It uses an isolated browser context and requires a configured browser executable. A successful fixture proves this adapter's supported contract, not every current Ashby form.

Execution setup:

```text
ENABLE_ASHBY_EXECUTION=true
APPLICATION_BROWSER_EXECUTABLE=/path/to/compatible/chromium
APPLICATION_STORAGE_DIR=/durable/private/applications
APPLICATION_WORKER_ENABLED=true  # optional background scanner
```

Do not enable these on a public production service based only on the fixture run. Production authentication, deployment isolation, operational monitoring and real-form qualification remain gates.

| Route                                             | Behavior                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `POST /application-execution/inspect`             | Read a form for an owned `packetVersionId`; return fields/fingerprint     |
| `POST /application-execution/plans`               | Bind packet, form hash, explicit answers and `eligibilityConfirmed: true` |
| `POST /application-execution/plans/:id/revise`    | Replace a draft/needs-user plan; authorization resets                     |
| `POST /application-execution/policy`              | Explicit enable/pause and daily attempt ceiling, maximum 100              |
| `POST /application-execution/plans/:id/authorize` | Exact `payloadHash`, with a 30-minute authorization                       |
| `POST /application-execution/plans/:id/run`       | Execute an authorized plan when operator configuration permits            |
| `GET /application-execution/plans`                | Owner's persisted states and errors                                       |

These paths have `/api/v1` prefix. The retained execution controls remain backend APIs. A separate [native local coordinator](NATIVE_JOB_WORKFLOW.md) now connects desktop setup, sourcing and exact application review without the retained API account. Both reuse the bounded queue/adapter modules; live form qualification is still outstanding. No policy grant currently authorizes generation/submission of arbitrary newly discovered roles. Exact-payload review is required for this initial executor. Email applications remain a separate reviewed path; PDF attachment sending is not implemented in the current Gmail workflow. The resolver must not silently substitute a text-only email for an application requiring attachments.

## Worker invariants

State flow: `DRAFT → AUTHORIZED → PREPARING → SUBMITTING → CONFIRMED`, with `NEEDS_USER` and `UNCERTAIN` outcomes. The SQLite queue persists payload/packet/form hashes, a person/role identity, leases, attempt reservations and receipts. It is a single-host design, not a distributed queue for horizontally scaled API instances.

Attempt capacity is reserved atomically before browser work. Failures count against the daily UTC ceiling. A ceiling of 100 does not promise 100 eligible or successful applications. Pausing revokes pending authorizations. Form/material changes require review. A receipt records the official hosted confirmation observed after an accepted application POST; it is not proof a recruiter read the application.

A crash after entering `SUBMITTING` becomes uncertain once its lease expires. It never becomes a retry automatically. A crash before submission requires renewed review. The background scanner considers persisted authorized plans only; source verification and packet ownership are checked again. Workers stop when no authorized work remains. Browser operations have timeouts; no perpetual model loop runs.

The background scanner is implemented but not production/load-qualified. It operates per API host and uses a shared local filesystem; replicated deployments require a different coordination/storage design. An always-on user-owned host must remain running for unattended work. Native sleep/offline execution and companion relay integration are unchanged.

## Company research and follow-up contacts

`pnpm discovery company https://company.example "Company name"` or authenticated `POST /api/v1/workflow/company-research` reads at most three permitted company pages. It returns source quotes and explicitly published Person records/channels. It never guesses emails or scrapes LinkedIn/X profiles. It can return no people, and does not establish that someone still works there or that an email is deliverable. Richer extraction and entity verification remain work.

The harness's selected-role panel now keeps user-reviewed contact/source links and follow-up drafts. It uses the reviewed resume, preserves a source example, and says “I applied” only when an application confirmation is supplied. LinkedIn/X/email drafts are copyable; copying is not sending. Automatic company-research results are not synchronized into the native contact panel yet. Gmail outreach still requires separate exact-message approval.

## Verification

See [executed tailoring/application QA](qa/TAILORING_APPLICATION_REPORT.md), the [fictional generated PDF](../output/pdf/tailored-resume-example.pdf), and the primary-source research linked above. The UI preview, PDF text round-trip, native SQLite tests, API authorization tests, local Ollama check and intercepted Ashby fixture cover different boundaries; none should be presented as a complete real-world application test.

Native integration follow-up: [workflow and runtime setup](NATIVE_JOB_WORKFLOW.md), [executed verification](qa/NATIVE_WORKFLOW_REPORT.md).
