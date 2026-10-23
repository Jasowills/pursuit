# Known advisories in retained Prisma/mobile dependency tree

Expected: Release tree has reviewed and resolved high-severity dependency advisories.

Observed: Production workspace audit reports three high and one moderate advisory. No exploitability claim is made; native desktop dependency reachability differs from the retained Prisma/mobile tree. Major dependency overrides were not forced without compatibility qualification.

Evidence:

- dependency-audit-summary.json
