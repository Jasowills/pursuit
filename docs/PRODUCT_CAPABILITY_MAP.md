# Product story and implementation checklist

Updated 2026-10-23. [Executed sourcing checks](qa/DISCOVERY_REPORT.md) and [engine boundaries](DISCOVERY_ENGINE.md). Landing visibility is separate from shipping a capability. See [pipeline decisions](CAREER_PIPELINE_DECISIONS.md) and [workspace boundaries](CAREER_WORKSPACE.md).

| Capability                                       | Landing surface                       | Current implementation                                                                                                           |
| ------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Broad job discovery and qualification            | Post-hero scroll walkthrough          | Headless engine, retained importer and native bounded search with evidence-backed shortlist                                      |
| Company watchers and role alerts                 | Dedicated Company watchers section    | Native on-request source polling; standalone read-only CLI watcher. No desktop service or retained watcher executor              |
| Career facts, preferences and context            | Career Identity section               | Native confirmed facts/provenance; richer search plan proposed                                                                   |
| Natural-language career assistant                | Actual harness capture and tour       | Native managed model conversations and model-free local counts                                                                   |
| Job intake                                       | Harness/tour                          | Native local persistent posting records                                                                                          |
| Grounded resume tailoring and version comparison | Full document workshop + scroll story | Reviewed source import, selection, PDF storage/export; current native packet only, full history outstanding                      |
| Cover letters                                    | Document workshop                     | Grounded letters in three tones with user motivation; deeper prose rewriting outstanding                                         |
| Video requirements and preparation               | Document workshop, background task    | Sample script/checklist; automatic requirement detection proposed                                                                |
| Bounded automatic applications                   | Scroll journey and background work    | Gated Ashby API/worker and native review/submit controls; fixture-qualified, live forms outstanding                              |
| Background work and notifications                | Background work                       | Retained research/drafts and exact-plan Ashby worker; native worker/push outstanding                                             |
| Cold outreach and contact evidence               | Outreach pipeline/draft               | Published company evidence, native manual contact drafts; approved web Gmail sending; native sending outstanding                 |
| Direct Gmail and Composio                        | Gmail connection selector             | Retained web implementations; native migration outstanding                                                                       |
| BYOM, OpenCode and Ollama                        | Provider row and model section        | Native settings/runtime; provider-specific live qualification still required                                                     |
| Phone review/approve/completion                  | Hidden; deferred to V2                | Expo shell exists; pairing/relay/production companion not implemented                                                            |
| Cross-platform desktop acquisition               | OS-aware hero and download chooser    | Source download and unsigned four-target installer CI; build-specific evidence in desktop build status; no signed public release |
| Open source contribution                         | Navbar stars and footer               | Public repository and contribution guide                                                                                         |

Sample counts, companies, documents and confirmations do not assert real sourcing or submission. Current alpha scope remains findable in the FAQ and download section.

## Landing verification

The 2026-10-22 refinement passed production build, TypeScript and formatting checks; browser checks cover 1440/973/390/320 widths, scroll-driven chapter progression, manual/reduced-motion controls, watcher alert/reset, menu Escape, OS selection and mobile/iPad detection safeguards. The fresh design review identified one mini-resume contrast fix and scored its correction resolved (`ship` at that fix scope). Tests simulate browser OS metadata, not real job data or submissions.

## Executed functional audit

See [the 2026-10-22 audit](qa/REPORT.md) for verified versus missing capabilities. Real Ollama wiring and retained Greenhouse sourcing/research were exercised; native unattended applications and companion transport remain absent. The product-level verdict is NOT_READY.

## Sourcing and status annotation follow-up

The landing walkthrough now has six chapters, shared green/amber/red status labels, four example watcher companies and an original SVG pen-writing footer. The product tour and desktop renderer share sourcing indicators: sample mode labels the search as simulated; the personal alpha reports that sourcing is not connected. Updated harness imagery comes from the actual renderer, without native IPC mocks. Browser checks cover five widths (1440/1263/973/390/320), all six manual and scroll-driven steps, responsive navigation, approval simulation, pen/reduced-motion behavior and 44px chapter controls. Production web and desktop renderer builds pass. This UI work does not change the functional audit verdict above.

## Tailoring and application verification — 2026-10-23

The source-backed tailoring workflow imports reviewed documents and saves real PDFs. A synthetic local Qwen selection and intercepted Ashby browser fixture pass. See [the executed report](qa/TAILORING_APPLICATION_REPORT.md) for scope. Live submissions, native execution controls, Drive OAuth and email attachment sending remain unqualified or incomplete. This does not change the product-level NOT_READY verdict.

## Native workflow integration — 2026-10-23

The desktop now connects public-source discovery, evidence review, selected-role tailoring, saved PDF, explicit answers, exact approval and recorded hosted outcomes through a local coordinator. It requires installed Node/browser runtimes and remains foreground-only. See [setup](NATIVE_JOB_WORKFLOW.md) and [scoped verification](qa/NATIVE_WORKFLOW_REPORT.md). No real employer submission is claimed.
