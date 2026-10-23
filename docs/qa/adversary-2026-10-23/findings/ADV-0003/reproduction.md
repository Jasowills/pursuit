# Mac DMG-only build removed the app bundle before resource verification

Expected: Verifier can inspect the actual packaged worker and browser code.

Observed: Tauri cleaned the intermediate app after producing the DMG. Requesting app,dmg retains it. Apple Silicon replacement build passes resource checks. Intel build is still pending when this report is generated.

Evidence:

- https://github.com/Jasowills/pursuit/actions/runs/39960253355
- .github/workflows/desktop-alpha.yml
