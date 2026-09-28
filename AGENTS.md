# AGENTS.md

Rules for all Cursor agents working in this repository.

## Verify-before-building gate (HARD RULE)

- After every non-trivial change, verify with **runtime evidence** (automated tests and/or manual UI/API checks) **before** starting the next feature or change.
- Do **not** stack new work on unverified or broken foundations.
- If verification fails, **fix first** — then re-verify.
- Prefer an honest partial/failed status over claiming success.
- Applies to **all** Cursor agents in this repo.

## Product context

- Brand: **SteadyStream** (premium IPTV player).
- Design: black + metallic gold palette (`#000000` / `#D4AF37`); Outfit + Sora; cinematic dark media UI is intentional.
- Logo assets: `public/brand/` (sourced from SteadyStream TV marketing app).
