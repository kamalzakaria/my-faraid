# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A dependency-free, single-file static web app: a Malaysian Islamic inheritance
(Faraid) calculator plus asset inventory. Everything — HTML, CSS, and JS — lives
in `public/index.html`. There is no build step, no framework, no package.json.
It is a port of the `myfaraid2` Flutter app; heir/asset IDs are preserved from
the original. Calculations follow **Shāfiʿī / Malaysian practice** (includes *radd*).

## Commands

```bash
node test.mjs                              # run the test suite (engine + asset math)
cd public && python3 -m http.server 8000   # serve locally at http://localhost:8000
```

There is no lint or build step. To run a single test, comment out the others in
`test.mjs` (it is a plain script, not a framework — `test(...)` calls run top-to-bottom).

## Architecture

The whole app is `public/index.html`, organized inside one `<script>` block as
labeled sections (search for the `/* ===... */` banners):

- **Fraction helpers** — exact rational arithmetic (`F`, `fa`/`fs`/`fm`/`fd`, etc.).
  All share math is done on `{n, d}` fractions to stay exact; never switch to floats.
- **Heir + asset metadata** — `HEIRS` (ordered list of `{id, label, multi, max}`)
  and `ASSET_TYPES`. The `id` strings are the canonical keys used everywhere
  (state, selection map, results) and match the Flutter original — do not rename them.
- **`solveFaraid(sel)`** — the engine. `sel` is `{ id: count }`; returns
  `{ rows, baitulmal, base, notes, blocked }`. Runs in phases:
  - **Phase A — blocking (hijab):** compute which heirs are blocked (`blocked.*`)
    and the `eff*` flags (effective/inheriting versions). Most correctness bugs
    live here; the ordering of these flags matters because later flags depend on earlier ones.
  - **Special case Umariyyatān** (spouse + mother + father only) returns early
    before Phase C.
  - **Phase B — furud:** assign fixed shares.
  - **Phase C — ʿaul / asabah / radd:** if furud sum > 1, scale down (ʿaul);
    else distribute the residue via `assignAsabah` (residuary order), or apply
    *radd* to non-spouse heirs, or fall back to Baitulmal. Helpers `dist2to1`,
    `distEqual`, `gfSiblings` (grandfather muqāsamah), and `applyMushtaraka` live here.
  - **`finalize()`** computes the common base (LCM of denominators → *asal masalah*),
    per-head shares, percentages, and *siham*.
- **State + persistence** — `state = {sel, assets, loans}`, persisted to `localStorage`
  under `faraid_web_state` (the web analogue of the Flutter Hive box). `loans` is a later
  addition, so net-total math guards it as `(state.loans||[])` for backward compatibility.
  On **first run** (no stored state) `seedDefaults()` populates `state.assets`/`state.loans`
  from `DEFAULT_ASSETS`/`DEFAULT_LOANS` — a typical Malaysian (B40) example estate. The seed is
  not saved until the user edits something, so their first change overwrites it.
- **Rendering** — `renderFaraid()` (heir grid + pie via CSS `conic-gradient` + legend)
  and `renderAssets()` (asset list + RM distribution). The asset net-total logic is:
  `netTotal = max(0, sum(amounts) − sum(uninsured outstanding loans) − sum(uninsured standalone debts))`.
  An **insured** loan is settled by insurance, so its asset counts in full and nothing is deducted;
  an **uninsured** loan's outstanding balance is deducted; an insolvent estate clamps to 0.
  Standalone debts live in `state.loans` (`{label, amount, isInsured}`) — debts not tied to a
  specific asset (personal loans, credit cards, funeral costs) — and follow the same insured rule.
- **Add-asset modal** and **navigation/boot** wiring round out the file.

## Tests are coupled to the source by string-slicing (important)

`test.mjs` has no import hooks into the app. It reads `public/index.html` as text,
extracts the `<script>` body, then **slices out the engine by literal markers**:

- The engine is everything before the comment banner
  `/* ====... STATE + persistence`.
- The asset block is sliced from `function loanDeduction` to `\nfunction renderAssets`.

It then rebuilds `solveFaraid` / `netTotal` with `new Function(...)`. Consequences:

- If you rename `loanDeduction`/`renderAssets`, move the asset functions, or change
  that section-banner comment text, **the tests silently extract the wrong slice and break**.
  Keep those names and the banner wording, or update the slice markers in `test.mjs` to match.
- The extracted engine must stay self-contained (no references to DOM/state from
  inside `solveFaraid` or the asset math functions).

Each test asserts exact fractions per heir *and* that all shares sum to exactly 1
(or sum + Baitulmal = 1). When changing the engine, add a case here.

## Domain notes / known limits

`solveFaraid` intentionally does **not** handle: Akdariyyah, muʿāddah (mixed
full/consanguine siblings with a grandfather), and dhawu-l-arham. These are rare;
the UI tells users to consult an expert. The README's "What was fixed vs. the Flutter
original" section documents the specific fiqh corrections baked into the engine —
read it before changing blocking or share rules.

UI text is in **Malay**. Match the existing tone when adding strings.
