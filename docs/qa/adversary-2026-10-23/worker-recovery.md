# Worker ownership and recovery review

Date: 2026-10-23. Overall verdict remains **NOT_READY for the complete production product**. This pass fixes durable-state defects before further unattended execution work; it does not introduce or qualify a desktop-managed always-on application service.

## Reproduced defects and fixes

1. **Pausing a source left its run marked running.** The lease was revoked, but run history was not finalized. Source transitions now update configuration, revoke ownership and mark the affected run interrupted in one SQLite transaction. Saving an already-enabled source no longer revokes an active poll.
2. **A source claim could persist without its run record.** Lease acquisition, prior-run recovery and run creation were separate commits. A controlled copy of the original store from `32603a8`, with an SQLite trigger refusing the run insert, reproduced an orphaned lease after failure. The new claim transaction rolls back the lease as well. Failure/backoff and successful completion also update durable run/source state transactionally.
3. **A late application worker could overwrite a corrected draft's status.** Pause or expired-preparation recovery returned the job to a draft but retained the old lease token. After the user revised the draft, the old worker's failure handler could mark it as needing user action again. Pause/recovery now revoke that ownership. The original pre-submit guards already prevented submission in the reproduced pause scenario; this fix protects the later draft state and error record.
4. **The harness could display a stale execution policy.** The coordinator stored a second policy copy in a different database. A separate connection pausing the actual queue was not reflected in the snapshot. Snapshot, lookup and pause now use the queue's policy directly. Policy changes and revocation of pending approvals are atomic. Invalid saved limits fail closed.

No schema migration or automatic submission was added. Existing exact-payload approval, 30-minute approval expiry, daily attempt limits and ambiguous-submission handling remain in force. Paused applications require new approval. A submission already delivered to a provider cannot be recalled by pausing.

## Verification

- **73 discovery tests**, including interrupted history, unchanged enabled settings, expired-lease ownership across independent SQLite connections, and injected write failures during claim, pause and failure recording.
- **17 application tests**, including pause followed by revision, expired preparation followed by revision, rollback of a failed approval revocation, a shared daily-attempt ceiling across independent SQLite connections, and the existing no-retry handling of uncertain submissions.
- **12 coordinator tests**, including an independently paused queue being reflected in the harness snapshot.
- **Two Chromium adapter/coordinator tests** pass with all employer requests intercepted. These exercise real browser filling, exact PDF upload, approval and confirmation handling without contacting an employer.
- All **20 workspace typecheck tasks** pass. Separate native transport/packaging and retained API checks are recorded in the evidence file.

The SQLite tests use actual temporary databases and independent connections, with asynchronous adapter gates for overlap. They do not establish multi-host synchronization or sustained OS-process stress. Fault injection uses triggers in disposable test databases only.

## Actual read-only watcher lifecycle

The existing discovery CLI was run as a real subprocess with an explicit disposable SQLite path and an allowlisted environment. One public Linear Ashby poll completed and stored **34 observed roles**. SIGTERM exited cleanly, another database instance reopened the records, the next poll remained scheduled in the future, and no run remained marked running. The recorded stop/reopen check completed in 859 ms. See [raw lifecycle evidence](../evidence/watcher-lifecycle.json).

This verifies one completed poll and shutdown on one host. It does not verify interruption during an in-flight network request, indefinite uptime, service-manager restart behavior, discovery recall, geographic eligibility, remote worker access or unattended applications. The CLI has no model calls, employer submission tools or Google credentials.

The desktop still runs foreground engine requests. Its source database and the CLI default database are separate unless an operator explicitly chooses the same path on the same host. Copying a database between machines is not synchronization. A future worker needs an authenticated control path, supervised lifecycle, explicit submission intent, budgets, health reporting and operational qualification.

The current UI says **Approve exact application**, then separately **Submit approved application**. A scheduler must preserve that contract or introduce a clear, separately authorized background-submit action. It must not silently consume every authorized plan as permission to submit in the background.

## Reproduce

```sh
pnpm --filter @pursuit/career-engine... build
pnpm --filter @pursuit/discovery --filter @pursuit/application --filter @pursuit/career-engine test
pnpm --filter @pursuit/application test:browser
pnpm --filter @pursuit/career-engine test:browser
pnpm typecheck
# Explicit read-only external source opt-in; uses a disposable database:
PURSUIT_LIVE_SOURCE_CHECK=true node scripts/qa/watcher-lifecycle.mjs
```

The live-source check is intentionally not a deterministic CI gate. Temporary data and its subprocess are cleaned up. No user records, real applications, email or paid model inference were used.
