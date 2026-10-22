# Video-preparation annotation — 2026-10-23

The rejected stock portrait and camera-frame treatment were replaced with an authored employer/request/project brief, a selectable four-part outline, sample script, clipboard action and recording checklist. The unused portrait asset was removed. This is an interactive product scenario, not a video recorder, model-generated script or employer integration.

Validation:
- Next production build and TypeScript passed.
- Playwright checked four script selections, clipboard success and rejected-copy recovery, local checklist state, phone focus/selected-only passage behavior, and no horizontal overflow at 1263, 390 and 320px. No uncaught page errors.
- Desktop and both mobile renders were inspected in one batched pass and one confirmation after readability/mobile-interaction corrections.
- Fresh finish review accepted the visual work and requested a documentation correction: the design record still described the removed portrait. DESIGN.md and its sidecar were updated to reflect the current component and retired asset.
- The detector ran once. Its warnings concerned incumbent document typography and the previously user-requested footer bounce; palette/type/radius advisories do not establish an accessibility failure or certification.

Reproduce: run the web app on port 3001, then `python3 scripts/validation/video-preparation.py` (Python Playwright with Chromium). `SKIP_SCREENSHOTS=1` runs functional checks without updating visual evidence. Captures live under ignored `.impeccable/review/video-preparation/`.
