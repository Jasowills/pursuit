# Review scope and test plan

Known requirements: source evidence and unknown eligibility stay visible; resumes retain reviewed facts; submission requires exact approval; duplicate or uncertain submissions must not be retried; crash feedback must be reviewable and local by default. The user asked for a release verdict and a subjective readiness estimate. A score will be explained as engineering judgment, not a measured probability.

Application map: Tauri/Rust desktop shell owns the SQLite career book, OS credentials and subprocess lifecycle. A packaged Node coordinator owns discovery and application SQLite stores. Discovery adapters fetch public sources through bounded network transports. Source-backed tailoring imports documents and renders PDFs. Ashby browser execution uses explicit inspected fields and a hash-bound queue. The React renderer has no general filesystem or shell plugin. The retained NestJS/PostgreSQL web service has tenant sessions, Gmail OAuth/Composio, calendars and background preparation; it is a separate deployment, not native desktop functionality. The landing page and fictional tour are separate from actual execution.

| Area            | Risk   | Hypothesis / check                                                                                                                      |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Applications    | High   | Changed forms/materials, concurrent workers, timeout and restart must not bypass approval or duplicate a send                           |
| Sourcing        | High   | Redirects, private DNS, metadata targets, oversized/stalled responses and malformed sources must fail without privileged network access |
| Tailoring       | High   | Job/sample instructions must not invent evidence; edited material must fail factual and writing checks                                  |
| Native recovery | High   | Initial load failure must not expose an empty editable book that overwrites existing data                                               |
| Diagnostics     | High   | Errors containing private content must produce allowlisted codes only; sharing stays explicit                                           |
| Web API         | High   | Cross-tenant reads/writes and stale/replayed approvals fail; fixtures replace external Gmail/model calls                                |
| Frontend        | Medium | Keyboard/reduced-motion/mobile CTA works; diagnostic errors recover without clearing data or retrying external work                     |
| Distribution    | High   | Four native runner targets build actual installers and verify architecture, resources and checksums                                     |

Sandbox: temporary SQLite directories and intercepted browser requests; separate built frontend servers; disposable PostgreSQL on loopback port 54339. No real job submissions, messages, credentials or paid model calls. Existing user development servers and database remain untouched. Live-provider quality, actual native OS-webview UI, clean-machine installers and long-duration production load are unknown until separately executed.
