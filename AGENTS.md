# AGENTS.md

Rules for all Cursor agents working in this repository.

## Verify-before-building gate (HARD RULE)

- After every non-trivial change, verify with **runtime evidence** (automated tests and/or manual UI/API checks) **before** starting the next feature or change.
- Do **not** stack new work on unverified or broken foundations.
- If verification fails, **fix first** — then re-verify.
- Prefer an honest partial/failed status over claiming success.
- Applies to **all** Cursor agents in this repo.

## Product context

- Brand: **Aether** (premium IPTV player).
- Design: ink/sand/ember palette; Bricolage Grotesque + Sora; cinematic dark media UI is intentional.
