# Native security follow-up

2026-10-23. Public-production verdict remains **NOT_READY**. The URL regression is fixed; native dependency findings remain open.

## Native source-link boundary

A pre-fix regression failed because `https://localhost./` passed the public-hostname check. DNS permits trailing-dot absolute names. The native opener now checks the hostname without its trailing dot and rejects localhost subdomains, `.local`, `home.arpa`, single-label hosts and IP literals. Nine additional negative cases cover these variants, uppercase names, IPv6 and numeric IPv4 notation. Public Ashby HTTPS links still pass. The complete native suite passes **19 tests**, with **7 opt-in tests ignored**, not counted as passes.

This command opens a link in the user's browser. It does not fetch page contents itself. The hostname checks do not establish DNS/redirect isolation for that external browser. The discovery fetcher's separate DNS/redirect checks are outside this change. [IANA special-use domain registry](https://www.iana.org/assignments/special-use-domain-names/).

## Dependency scan

Official OSV-Scanner **2.7.0**, Intel Mac binary, was checked against the official release digest and SHA256 manifest before execution. SHA256: `e82c5df7ab0a42dff29a1cd0660711447b56b4c0483ff66ad8634df10fd81a45`. The scan inspected 525 desktop-lockfile packages and 62 local-store-lockfile packages, without compiling dependencies or performing Rust call analysis. Exit status **1** reports findings, not a clean scan. [Scanner release](https://github.com/google/osv-scanner/releases/tag/v2.7.0).

| Package                | Finding                                                            | Triage                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| glib 0.18.5            | RUSTSEC-2024-0429, alias GHSA-wrw7-89jp-8q8g; scanner severity 6.9 | Unsound `VariantStrIter` iterator methods can crash optimized builds. Linux Tauri/GTK chain. Reachability is unproven; it is not dismissed. |
| proc-macro-error 1.0.4 | RUSTSEC-2024-0370                                                  | Unmaintained build-time macro dependency through GTK/GLib macros.                                                                           |
| zvariant 4.2.0         | RUSTSEC-2026-0370                                                  | Unmaintained standalone crate in Linux keyring/Secret Service/zbus chain.                                                                   |
| zbus_names 3.0.0       | RUSTSEC-2026-0371                                                  | Same Linux credential-store chain; maintenance advisory.                                                                                    |
| zvariant_derive 4.2.0  | RUSTSEC-2026-0372                                                  | Same chain; maintenance advisory.                                                                                                           |

GLib's two alias records represent **one** advisory. The other four are maintenance findings, not four demonstrated runtime exploits. No finding was returned for the local-store lockfile. This is an inventory scan, not a penetration test or proof that other vulnerabilities are absent.

The published GLib fix starts at 0.20, beyond the current GTK dependency's 0.18 series. A direct major override is not a qualified repair for the GTK/WebKit dependency graph. Its upstream fix changes the out-pointer mutability. Next work is a compatible upstream update or reviewed backport with Linux release-mode tests, followed by rescanning. Do not suppress the finding based only on the absence of direct application calls. [RustSec advisory](https://rustsec.org/advisories/RUSTSEC-2024-0429.html), [upstream fix](https://github.com/gtk-rs/gtk-rs-core/pull/1343).

The zbus family now consolidates these standalone crates in zbus 6; the current Secret Service dependency must be migrated compatibly, with actual Linux credential-store tests. Merely forcing transitive major versions is insufficient. [zvariant advisory](https://rustsec.org/advisories/RUSTSEC-2026-0370.html), [zbus_names advisory](https://rustsec.org/advisories/RUSTSEC-2026-0371.html), [derive advisory](https://rustsec.org/advisories/RUSTSEC-2026-0372.html), [macro advisory](https://rustsec.org/advisories/RUSTSEC-2024-0370.html).

The separately recorded JavaScript `node-forge` advisory also remains open. No dependency override or suppression was added in this pass. Continuous SCA, broader SAST/DAST and independent security review remain release work.

Reproduce using a checksum-verified scanner:

```sh
osv-scanner scan source \
  --lockfile apps/desktop/src-tauri/Cargo.lock \
  --lockfile packages/local-store/Cargo.lock \
  --no-call-analysis=rust --all-vulns --format=json --output-file native-osv.json
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml --locked
```

[Raw scanner output](native-osv-raw.json) and [deduplicated summary](native-dependency-summary.json) retain the findings.

## Installer checkpoint

Commit `0263011e3f1713e74a090458045f88bb63c58c8b` passes [main CI](https://github.com/Jasowills/pursuit/actions/runs/39976408278) and [all four native installer jobs](https://github.com/Jasowills/pursuit/actions/runs/39976410839). The repaired Linux HTTPS APT step, native tests, architecture/resource checks and isolated worker smoke tests all pass. This qualifies unsigned builds at that commit; it does not qualify the later source-link change, signing or clean-machine installation.
