# Initial workspace read failure could expose an empty editable career book

Expected: Preserve existing data and block editing after failed startup read.

Observed: The new failed-load view blocks editing; no save command is sent in the built UI fault injection.

Evidence:

- browser.json
- apps/desktop/src/main.tsx loadFailed guard
- git diff 1f11e43^..1f11e43 -- apps/desktop/src/main.tsx
