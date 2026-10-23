# Discovery verification — 2026-10-23

Scope: sourcing, source freshness, deterministic ranking, retained API import and eligibility regressions. The landing page and native harness were not redesigned. This is not a claim that every career feature, source or unattended application path is complete.

**Full-product release verdict: NOT_READY.** The sourcing slice passes the checks below; native integration, broader coverage and existing dependency findings remain.

## Application and requirements

```text
Headless CLI → source adapters / crawler → private SQLite → evidence ranker
Authenticated Nest API → discovery adapter → CareersService → PostgreSQL
Native desktop → existing local records and tool-denied conversation (not wired here)
```

Known requirements: broad discovery; no inferred worldwide work rights; source evidence; bounded background work; safe repeat imports; distinguish hiring signals from vacancies. Assumptions: the initial ranker may be deterministic and headless while native integration follows. Unknowns: production source permissions/quotas, full international payroll eligibility, ranking quality across all occupations and worldwide recall.

| Risk                                                    | Test approach                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| False eligibility feeds inappropriate applications      | Synthetic cross-country, sponsorship, hard-exclusion and missing-evidence regressions |
| Import overwrites or merges the wrong role              | Real PostgreSQL repeat-intake and source-trust tests                                  |
| Source URL accesses local services or leaks credentials | Mock DNS/socket attacks, redirects, mixed-address results, credential boundaries      |
| Failure deletes valid jobs                              | Partial, malformed, repeated-page, network-failure and missing-poll fixtures          |
| Worker duplication or interrupted state                 | Source leases, atomic SQLite commits, disable fences and restart checks               |
| Excess request/token use                                | Request/page limits; deterministic matching; no LLM calls; local performance smoke    |

## Sandbox and executed checks

API integration ran against a new temporary `postgres:16-alpine` container on loopback port 54339, with all four existing migrations. The developer database was not used. Tests booted the real Nest application; provider actions in the API regression suite were mocked. SQLite unit tests used in-memory stores; the live persistence check used a separate temporary file.

Public endpoint contract checks were read-only and separate from adversarial tests. No external website was attacked, no application was submitted and no email was sent. Synthetic candidate data was used throughout.

- Discovery package: **66 tests passed** across nine files.
- Shared package: **32 tests passed** across four files.
- API: **44 tests passed** across nine suites, including seven new PostgreSQL sourcing tests and the existing autopilot regressions.
- Discovery build, API typecheck and all 14 workspace typecheck/build tasks passed.
- Changed files pass formatting checks. The repository-wide format check still reports 14 unchanged files with existing formatting differences; they were left outside this backend change.
- New test fixtures initially failed TypeScript checks after the expanded response contract; the fixtures were corrected before the passing run.

Reproduction commands:

```sh
pnpm --filter @pursuit/discovery build
pnpm --filter @pursuit/discovery test
pnpm --filter @pursuit/shared test
pnpm --filter @pursuit/api exec jest --config jest.config.cjs --runInBand
pnpm typecheck
```

For API tests, explicitly set `DATABASE_URL` to a disposable migrated database and `NODE_ENV=test`. Do not point the suite at developer or production data. `test/live-contract.ts`, `test/live-persistence.ts` and `test/benchmark.ts` are manual checks, not ordinary `.test.ts` cases.

## Reproduced defects and disposition

| ID       | Observed defect                                                                                      | Fix and reproduction coverage                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| DISC-001 | A US-only role accepted verified Nigerian authorization as sufficient                                | Authorization must match explicit job jurisdiction; regression now stays unknown                                        |
| DISC-002 | A US citizen was excluded merely because a listing offered no sponsorship                            | No-sponsorship conflict now requires an actual verified sponsorship need                                                |
| DISC-003 | Sponsorship uncertainty overrode an explicit hard exclusion                                          | Hard exclusions return ineligible first                                                                                 |
| DISC-004 | Specialty punctuation and non-Latin titles collapsed in fingerprints                                 | Preserve C++/C#/Unicode; never use fuzzy company/title fingerprint as requisition identity                              |
| DISC-005 | API intake could merge separate same-title requisitions and leave old snapshots/matches              | Canonical/source identities, trusted refresh, snapshot and match update; PostgreSQL assertions                          |
| DISC-006 | Secondary/manual reintake could replace established source facts                                     | Primary source refresh boundary and compare-and-set claims; manual, unrelated and concurrent source attempts are tested |
| DISC-007 | JSON-LD could claim another origin's canonical identity                                              | Cross-origin posting identity is rejected; same-employer detail URLs remain distinct                                    |
| DISC-008 | Duplicate candidate skills could inflate fit; duplicate source observations could repeat a candidate | Normalized skill uniqueness and canonical-URL result clusters with retained provenance                                  |
| DISC-009 | A returned expiry date could reopen an expired API listing                                           | Expired trusted observations close the role and are excluded from the returned work queue                               |

The [original audit evidence](evidence/discovery-audit.json) is deliberately retained as **before-fix** evidence. The [freshly compiled after-fix probes](evidence/discovery-after-fixes.json) are separate. The remaining legacy matcher is conservative but not a complete international eligibility system.

## Source evidence

The [live endpoint report](evidence/discovery-live-contract.json) observed 446 Cloudflare jobs via Greenhouse, 34 Linear jobs via Ashby, 80 Spotify jobs via Lever and 20 results from one Himalayas page. These are provider-returned records, not independently verified available opportunities.

The [persistence run](evidence/discovery-live-persistence.json) saved 559 observations: 446 Greenhouse records, 20 Himalayas results and 93 WWR feed leads. All 559 survived closing/reopening the local database. One Greenhouse posting was checked through its individual endpoint and returned `observed_open`. Missing geography, payroll and sponsorship stayed unknown. Search/feed runs remained partial rather than falsely claiming closure completeness.

Workable, Hacker News, generic page extraction and Brave search have deterministic contract tests. Workable/Hacker News/page extraction were not live-validated in this run; Brave had no configured live key. No live LinkedIn, X, Indeed, Glassdoor or Reddit access was tested or claimed.

## Performance and security limits

The [local benchmark](evidence/discovery-benchmark.json) imported 5,000 synthetic observations in 1,594 ms and ranked them in 1,532 ms, returning 300 results. Reported process RSS was 403 MiB. This single-process in-memory test is not a production concurrency, reliability or matching-quality benchmark. It prompted caching normalized text within each assessment and limiting database reads before materializing results.

Network tests exercise the actual reader with mocked sockets/DNS: public-address pinning, mixed DNS rejection, metadata redirect blocking, credential isolation, same-host redirect progress, cross-origin page-policy refusal, streaming byte limits and timeout. These are meaningful boundary tests, not a full penetration test.

A production dependency audit found **three high and one moderate workspace advisories**, in existing mobile/transitive dependency paths (`deepmerge-ts`, `node-forge`, `braces`, `uuid`). None of the reported paths included the new discovery package. Those findings still need dependency remediation and are not waived by passing sourcing tests.

Remaining risks: no durable pagination cursor; limited source inventory; a capped initial English role-alias vocabulary; no labelled cross-career ranking evaluation; unknown work rights/payroll/timezones; no native execution integration; no production source quotas/history retention; retained API batch imports can partially persist on database failure. The [engine guide](../DISCOVERY_ENGINE.md) states these limits and the next integration gates.

The [Adversary skill](/Users/jasonamadi/.agents/skills/adversary/SKILL.md) guided the sandboxed failure/security review. No mutation-testing score, full browser audit or production readiness claim is made.
