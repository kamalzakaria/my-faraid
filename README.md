# Kalkulator Faraid — Web (GitLab Pages)

A dependency-free, single-file static port of the `myfaraid2` Flutter app:
a Malaysian Islamic inheritance (Faraid) calculator + asset inventory.

- **No build step, no frameworks.** Everything is in `public/index.html` (HTML + CSS + JS).
- Calculations follow **Shāfiʿī / Malaysian practice** (includes *radd*).
- State persists in the browser via `localStorage` (the web analogue of the app's Hive box).

## UX flow
`Splash → Faraid (pick heirs, see shares + pie) → Aset (list assets + debts, net total, RM distribution)`
— mirrors the original `SplashView → FaraidView → AssetsView → AddAssetView`.

The Aset view has two inventories: **Aset** (assets, optionally with a secured loan attached,
e.g. a mortgaged property) and **Hutang & Liabiliti** (standalone debts not tied to an asset —
personal loans, credit cards, funeral costs). Both feed one **net divisible estate** that the
faraid percentages are then applied to.

## Deploy to GitLab Pages

**Option A — host this as its own project (recommended)**
1. Create a new GitLab project.
2. Copy the **contents of this folder** (`public/` and `.gitlab-ci.yml`) into the repo root.
3. Push to the default branch. The `pages` job publishes `public/`.
4. Find the URL under **Deploy → Pages** (e.g. `https://<user>.gitlab.io/<project>/`).

**Option B — add to an existing repo**
Copy `public/` and merge the `pages` job from `.gitlab-ci.yml` into your root `.gitlab-ci.yml`.

## Run locally
Just open `public/index.html` in a browser, or:
```bash
cd public && python3 -m http.server 8000   # http://localhost:8000
```

## What was fixed vs. the Flutter original
The engine (`solveFaraid` in `index.html`) was rewritten from scratch. Corrected:
mother no longer reduced by a spouse (Umariyyatān handled exactly); mother's "2+ siblings"
rule counts all sibling types (even blocked ones); maternal grandmother not blocked by father;
grandchildren not blocked by father/grandfather; father/grandfather fixed 1/6 triggers on a
grandson too; consanguine sisters get their fixed share; 2+ sisters → 2/3; sister-with-daughters
is residuary (asabah maʿa-l-ghayr), not a fixed 1/3; **radd** applied (surplus to heirs, not
straight to Baitulmal); grandfather uses muqāsamah with siblings (Shāfiʿī), not Ḥanafī blocking;
and the estate total subtracts **outstanding uninsured debts** (an insured loan is settled by
insurance, so its asset counts in full; an uninsured loan's outstanding balance is deducted, and
an insolvent estate clamps to 0). The same insured/uninsured rule applies to **standalone debts**
in the Hutang & Liabiliti list, which are deducted from the net estate before distribution.

**Known unsupported edge cases** (rare — consult an expert): Akdariyyah, muʿāddah
(mixed full/consanguine siblings with grandfather), and dhawu-l-arham.
