# Long application histories exceeded the native transport limit

Run the `hundred verbose` test in `packages/career-engine/test/engine.test.ts`. Before the fix it fails with6,059,443 characters; after the fix it passes the200,000-character ceiling and verifies stored answers remain unchanged.

No browser or external submission runs in this case. Each run uses temporary SQLite stores.
