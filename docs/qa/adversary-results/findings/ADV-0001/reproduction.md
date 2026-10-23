# ADV-0001

Local synthetic SQLite queue and fake clock; no employer requests.

Run `pnpm --filter @pursuit/application test`. The regression named “does not submit when authorization expires while filling the form” authorizes at 10:00, starts preparation at 10:29 and advances time to 10:31 while filling. Before the fix it called submit once. After the fix the queue checks `approval_until` atomically with its final transition and returns NEEDS_USER without calling submit.
