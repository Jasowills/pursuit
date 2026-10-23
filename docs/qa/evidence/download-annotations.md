# Landing annotation pass, 2026-10-23

The four requested changes are implemented:

- Removed the entire Career Identity context promotion and its orphaned styles. Career Identity in the harness is unaffected.
- Replaced the tall platform cards and stacked download buttons with compact OS choices, one selected-platform panel, an explicit Mac processor select, one source ZIP action and a quieter unsigned-build link. Native setup disclosure holds the build guide and prerequisites.
- Muted the decorative footer wordmark to grey with a restrained edge and depth shadow. The Geist letterforms, pen reveal and reduced-motion behavior remain.
- Removed the hero's source-alpha caption. The hero still links to download options. Source code versus unsigned installer availability remains visible in the panel, with fuller setup details behind a keyboard-accessible disclosure.

The download panel reads in order: platform, architecture, availability, action, optional setup. On narrow screens the processor label and select wrap naturally and actions stack. Desktop, tablet and mobile screenshots were inspected together at 1440, 768, 390 and 320 pixels. No horizontal overflow was found; the tested controls are at least 44 pixels tall. The muted footer is decorative and hidden from assistive technology; its intentionally low contrast does not carry required information.

The web production build passes. Six grouped browser checks pass, covering platform changes, both Mac choices, source/build link destinations, keyboard setup disclosure, prerequisites, responsive controls, removed content, reduced motion and uncaught errors. The existing 12 landing/crash-recovery scenarios also pass; their expected architecture wording was updated to the intentional labels. Native IPC in that recovery suite is simulated. No download, external submission, email or paid inference was performed.

Reproduce with the built web server on port 3008:

```sh
python scripts/qa/download-annotations.py
```

[Browser evidence](download-annotations.json). This is a scoped landing-page pass, not the full-product production verdict.
