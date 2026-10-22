# Conversational career workspace

The desktop and `/product-tour` now render the same `@pursuit/ui/career-workspace` components. The default desktop starts with the user's own local records; its explicit sample tour is isolated in memory and never writes sample records into the local database. The browser tour uses a fictional product designer's career to show the intended complete experience. Example contacts use reserved example domains. Marketing screenshots are actual desktop-renderer captures in this visible sample mode, not intercepted IPC responses or proof of live submissions. See the [assistant capture](../apps/web/public/product/harness-dark.png) and [outreach capture](../apps/web/public/product/harness-outreach.png).

## Working in the desktop alpha

- Add a role from Opportunities with a company, job title and full posting. Records persist in local SQLite schema v4.
- Ask the assistant how many applications are recorded. This reads local records without calling an AI provider. It does not include the retained web application's records.
- Send other requests through an explicitly configured, running OpenCode connection. The model request is not sent if the runtime is missing or offline. Confirmed Career Identity facts are excluded by default and included only through the checkbox. Provider usage charges may apply.
- Streaming text, saved conversation records, interruption and unresolved-session messages remain visible. Starting a new conversation keeps the existing record; the Recent entry restores it. No request is automatically resent after timeout or interruption.
- Career Identity, Models & connections, and advanced Agent workspace open the existing native settings through a keyboard-accessible modal. Existing provider key, catalog, identity and runtime behavior is retained.
- Existing foundation tasks remain in SQLite and appear as Saved career work in Background work when initializing a new career book.

An Applied record must contain a confirmation field; saving a false submission without one is rejected by the native store. The desktop does not execute applications, discover contacts, send Gmail, generate PDF packets, or run background source watchers through these new screens yet. Those full experiences are demonstrated in the sample mode. Existing web research, preparation, approvals and Gmail services remain separate.

## Showcase and product narrative

The public landing retains the approved WebGL hero and adds a floating navigation dock, actual GitHub stars, morning workflow/notifications, full original and tailored resumes, a cover letter, video script/checklist, the companion approval journey, background activity, cold outreach sourcing and Gmail paths, and a lime closing invitation. Features are described as a product journey; current release qualification is consolidated in the FAQ and downloads rather than scattered negative headings.

The companion is an interactive product preview, not a shipped native phone app or functional encrypted relay. Approve sample application only changes the local tour state. The video scene prepares a script; it does not record, upload or submit a Loom video. Outreach previews never send mail. Model catalog and provider compatibility remain account-specific.

GitHub stars come from the fixed public repository endpoint via `/api/github`, refreshed with a five-minute cache. An unavailable endpoint displays GitHub without inventing a count. No API credential is required or sent to the browser.

## Verification

Local-store migration/restart/integrity tests; native adapter regression; the existing secure settings synthetic IPC checks; a new native UI contract check for saved roles, counts without inference, opt-in sharing and preserved conversations; and browser interaction checks for the unmocked sample renderer and public landing. Native test doubles are not marketing evidence. Live paid-provider inference, OS notification delivery, native phone behavior and Windows/Linux qualification remain unverified.
