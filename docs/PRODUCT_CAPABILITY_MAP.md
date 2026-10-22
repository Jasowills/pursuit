# Product story and implementation checklist

2026-10-22. Landing visibility is separate from shipping a capability. See [pipeline decisions](CAREER_PIPELINE_DECISIONS.md) and [workspace boundaries](CAREER_WORKSPACE.md).

| Capability                                       | Landing surface                       | Current implementation                                                                                |
| ------------------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Broad job discovery and qualification            | Post-hero scroll walkthrough          | Retained web Greenhouse import/rules; broad native discovery proposed                                 |
| Company watchers and role alerts                 | Dedicated Company watchers section    | Retained web watcher CRUD; generic/native polling not implemented; landing alert is a simulation      |
| Career facts, preferences and context            | Career Identity section               | Native confirmed facts/provenance; richer search plan proposed                                        |
| Natural-language career assistant                | Actual harness capture and tour       | Native managed model conversations and model-free local counts                                        |
| Job intake                                       | Harness/tour                          | Native local persistent posting records                                                               |
| Grounded resume tailoring and version comparison | Full document workshop + scroll story | Full sample content; retained web model drafts; native packet generation/export outstanding           |
| Cover letters                                    | Document workshop                     | Sample letter; retained web preparation; native document executor outstanding                         |
| Video requirements and preparation               | Document workshop, background task    | Sample script/checklist; automatic requirement detection proposed                                     |
| Bounded automatic applications                   | Scroll journey and background work    | Preview only; no qualified submission executor                                                        |
| Background work and notifications                | Background and companion              | Retained web scheduled research/drafts + in-app alerts; native worker/push outstanding                |
| Cold outreach and contact evidence               | Outreach pipeline/draft               | Retained web approved Gmail sending; native sourcing/Gmail execution outstanding                      |
| Direct Gmail and Composio                        | Gmail connection selector             | Retained web implementations; native migration outstanding                                            |
| BYOM, OpenCode and Ollama                        | Provider row and model section        | Native settings/runtime; provider-specific live qualification still required                          |
| Phone review/approve/completion                  | Interactive companion preview         | Expo shell exists; pairing/relay/production companion not implemented                                 |
| Cross-platform desktop acquisition               | OS-aware hero and download chooser    | Source download available; local unsigned macOS Intel build verified; public installers not published |
| Open source contribution                         | Navbar stars and footer               | Public repository and contribution guide                                                              |

Sample counts, companies, documents and confirmations do not assert real sourcing or submission. Current alpha scope remains findable in the FAQ and download section.

## Landing verification

The 2026-10-22 refinement passed production build, TypeScript and formatting checks; browser checks cover 1440/973/390/320 widths, scroll-driven chapter progression, manual/reduced-motion controls, watcher alert/reset, menu Escape, OS selection and mobile/iPad detection safeguards. The fresh design review identified one mini-resume contrast fix and scored its correction resolved (`ship` at that fix scope). Tests simulate browser OS metadata, not real job data or submissions.

## Executed functional audit

See [the 2026-10-22 audit](qa/REPORT.md) for verified versus missing capabilities. Real Ollama wiring and retained Greenhouse sourcing/research were exercised; native unattended applications and companion transport remain absent. The product-level verdict is NOT_READY.
