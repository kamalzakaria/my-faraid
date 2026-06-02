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
- **`recommendProducts(signals)` + `rank` + `FUNNEL_RULES`** — the product-funnel rule engine.
  Lives right after `solveFaraid` so it stays **inside the test engine slice**, and is **pure**
  (operates only on the `signals` arg — no DOM/state). Fires rules R1–R12, returns
  `{ triggers, ranked, primary }`. Four products: `takaful_hibah`, `hibah_amanah`, `wasiat`,
  `al_wasitah`. Severity scale `critical=3 > high=2 > medium=1 > info=0`. Two **always-on**
  baselines: `baseline_wasiat` (info → wasiat) and `baseline_wasitah` (**medium → al_wasitah**,
  by request — Al-Wasitah estate-admin is recommended to everyone). Ranking tiebreak uses `weight`
  (count of sev>0 triggers) so an always-on info baseline can't pad a product into winning a
  critical tie; `al_wasitah` is last in the fixed-order tiebreak so it only becomes `primary`
  when nothing else reaches medium (i.e. a healthy estate).
- **State + persistence** — `state = {sel, assets, loans, bills, billLog}`, persisted to `localStorage`
  under `faraid_web_state` (the web analogue of the Flutter Hive box). `loans`/`bills`/`billLog` are
  later additions, so code guards them as `(state.loans||[])` etc. for backward compatibility.
  `ensureIds()` (run in `load`) gives every asset/loan/bill a stable `id` so monthly bills can link
  to them across reorders/deletes. On **first run** `seedDefaults()` populates a typical Malaysian
  (B40) example estate (assets/loans/bills); the seed isn't saved until the user edits something.
- **Rendering** — `renderFaraid()` (heir grid + pie via CSS `conic-gradient` + legend)
  and `renderAssets()` (asset list + RM distribution). Heirs are shown in UI-only sections via
  `HEIR_GROUPS` (render-only; the engine still keys off canonical `HEIRS` ids). Each heir's
  tap-target is a real `<button class="heir-tap" aria-pressed>` with the stepper as a sibling
  (never nest interactive controls); switches are `role="switch"` (keyboard via `enhanceSwitches`).
  Money is formatted with `RM0` (whole-ringgit `Intl.NumberFormat`); there is no 2-decimal `RM`.
  Modals share `openOverlay`/`closeOverlay` (focus restore) + a global Escape handler.
  First-run example data sets `exampleData=true` (cleared on first `save()`), surfaced by
  `renderSeedBanner()`. The asset net-total logic is:
  `netTotal = max(0, sum(amounts) − sum(uninsured outstanding loans) − sum(uninsured standalone debts))`.
  An **insured** loan is settled by insurance, so its asset counts in full and nothing is deducted;
  an **uninsured** loan's outstanding balance is deducted; an insolvent estate clamps to 0.
  Standalone debts live in `state.loans` (`{label, amount, isInsured}`) — debts not tied to a
  specific asset (personal loans, credit cards, funeral costs) — and follow the same insured rule.
  `renderDashboard()` (landing view) shows the net estate + a financial-health bar (`renderHealth`:
  net vs deductible-debt split + Sihat/Sederhana/Perlu-Perhatian verdict), derived "needs attention"
  insight chips (`renderDashInsight`, replacing vanity counts), the faraid distribution as a donut +
  legend, then the funnel. Navigation is contextual: the assets action lives in the hero header and
  the faraid action in the "Agihan Pusaka" header (both reuse ids `goAssets`/`goFaraid`). Distribution
  renders use `res.rows.length===0` (not `all.length`) for the empty state so an unselected estate
  shows onboarding, not a "Baitulmal 100%" slice. Assets/loans carry optional informational metadata
  in an `extra` object (per-category fields from `ASSET_FIELDS`; `monthly`/`lender` for loans), shown
  via `extraLineFor`; the category is an eyebrow label (not a variable-width pill) so titles align.
  `sortedView(list,mode)` powers the per-section sort selects and preserves each item's original index
  so deletes stay correct; sort state (`assetSort`/`loanSort`) is view-only (not persisted).
- **Monthly bills (`view-bills`, `renderBills`)** — a per-month checklist. `getBills()` derives loan/
  financing bills from any asset/loan with `extra.monthly>0` (linked) plus manual `state.bills`; paid
  status is logged per month in `state.billLog['YYYY-MM'][key]`. **Live tie-in:** `toggleBillPaid`
  deducts the paid amount from a linked loan's outstanding balance (`amount`/`loanAmount`, clamped) and
  records the exact figure so unticking restores it — so paying flows into `netTotal`. The dashboard
  shows a summary (`renderDashBills`); month nav via `ymShift`. Not used by the engine/tests.
- **Funnel rendering** — `buildFunnelSignals()` (state → `signals`), `FUNNEL` (seller config:
  WhatsApp/products/copy), `FUNNEL_COPY` (code+data → Malay sentence), `renderFunnelInto`/
  `renderFunnel` (ranked cards), `openFunnelModal` (product detail + WhatsApp CTA), and
  `renderFaraidNudge` (slim banner on the faraid panel). All of this sits **after `renderAssets`**
  so it stays **outside** the `loanDeduction…renderAssets` asset slice. The WhatsApp deep link is
  built from current state and only sent on an explicit click.
- **Add-asset modal**, **product-detail modal**, and **navigation/boot** wiring round out the file.

## Tests are coupled to the source by string-slicing (important)

`test.mjs` has no import hooks into the app. It reads `public/index.html` as text,
extracts the `<script>` body, then **slices out the engine by literal markers**:

- The engine is everything before the comment banner
  `/* ====... STATE + persistence`.
- The asset block is sliced from `function loanDeduction` to `\nfunction renderAssets`.

It then rebuilds `solveFaraid` / `netTotal` / `recommendProducts` with `new Function(...)`
(the funnel rule engine is extracted the same way, since it lives in the engine slice). Consequences:

- If you rename `loanDeduction`/`renderAssets`, move the asset functions, or change
  that section-banner comment text, **the tests silently extract the wrong slice and break**.
  Keep those names and the banner wording, or update the slice markers in `test.mjs` to match.
- The extracted engine must stay self-contained (no references to DOM/state from
  inside `solveFaraid`, `recommendProducts`, or the asset math functions). `recommendProducts`
  must keep operating only on its `signals` arg; the state→signals adapter `buildFunnelSignals`
  stays in the render region (outside the slice).

Each test asserts exact fractions per heir *and* that all shares sum to exactly 1
(or sum + Baitulmal = 1). When changing the engine, add a case here.

## Domain notes / known limits

`solveFaraid` intentionally does **not** handle: Akdariyyah, muʿāddah (mixed
full/consanguine siblings with a grandfather), and dhawu-l-arham. These are rare;
the UI tells users to consult an expert. The README's "What was fixed vs. the Flutter
original" section documents the specific fiqh corrections baked into the engine —
read it before changing blocking or share rules.

UI text is in **Malay**. Match the existing tone when adding strings.
