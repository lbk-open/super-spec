# Changelog

## 0.2.0 (2026-10-11)


### Features

* harden workflow execution and troubleshooting (7d409c7)
* unify workflow contracts and strengthen validation (#7) (0a65992)

### Distribution repair

- Restore explicit scoped npm/Pi staging for `@lbk-open/super-spec` while keeping
  the source package identity `super-spec`; validate both lock root names and versions.
- Complete the npm bundle's local plugin manifests, Codex icon and security docs;
  check packed Markdown links and distinguish checkout-only tooling.
- Document current Pi package installation/update commands and the historical
  GitHub tag versus repaired source provenance. These changes do not assert that
  npm/Pi version 0.2.0 is already published.

## 0.1.1 (2026-07-11)

### Bug Fixes

- Ship shared templates as the ss-references skill.

## 0.1.0 (2026-07-11)

- Initial toolkit with feature, coding, and troubleshooting workflows, code review,
  living OpenSpec-compatible specs, and engineering guardrails.
- Local installation channels for coding agents.
- Feature workflow complexity triage before proposal generation.
