# Kalkulator Faraid — Web (GitLab Pages)

A dependency-free, single-file static port of the `myfaraid2` Flutter app:
a Malaysian Islamic inheritance (Faraid) calculator + asset inventory.

- **No build step, no frameworks.** Everything is in `public/index.html` (HTML + CSS + JS).
- Calculations follow **Shāfiʿī / Malaysian practice** (includes *radd*).
- State persists in the browser via `localStorage` (the web analogue of the app's Hive box).
- A **Cadangan Perancangan Harta** funnel recommends complementary Islamic estate-planning
  products (Takaful Hibah, Hibah Amanah, Wasiat) based on the faraid result and asset/debt picture.
- A **Bil Bulanan** tracker: a per-month bill checklist (loans auto-appear from their monthly
  installment) where ticking a loan as paid reduces its real balance and updates the divisible estate.

## UX flow
`Splash → Dashboard (net estate + financial-health bar, insight chips, distribution donut, bills
summary, planning recommendations) → Faraid (pick heirs, see shares + pie) → Aset (list assets +
debts, net total, RM distribution) → Bil Bulanan (monthly bill checklist)`. Navigation is contextual —
the assets/faraid/bills actions live in the relevant dashboard section headers.

The Aset view has two inventories: **Aset** (assets, optionally with a secured loan attached,
e.g. a mortgaged property) and **Hutang & Liabiliti** (standalone debts not tied to an asset —
personal loans, credit cards, funeral costs). Both feed one **net divisible estate** that the
faraid percentages are then applied to.

## Estate-planning funnel (Cadangan Perancangan Harta)
After heirs and assets are entered, the Dashboard ranks complementary products and explains
*why each applies to this user* (quoting their own RM figures and heirs). The product lines:

- **Takaful Hibah — Takaful Ikhlas** (e.g. *IKHLAS Dariku* hibah takaful, *Preferred Term* for
  loan protection): instant cash that bypasses the frozen estate — for debt/liquidity.
- **Hibah — Wasiyyah Shoppe** (*HBB* for mortgaged property, *Hibah Hartanah* for owned property,
  *Hibah Mutlak* for cash/ASB, *Hibah Amanah* trust for minors): transfer specific assets outside faraid.
- **Wasiat — Wasiyyah Shoppe**: bequeath ≤1/3 to non-heirs, appoint a guardian/executor.
- **Al-Wasitah — Wasiyyah Shoppe**: estate-administration cover (anti *harta beku*). Recommended
  to **everyone** at medium priority — it never overrides a more urgent debt/property recommendation,
  but surfaces as the default suggestion on an otherwise healthy estate.

The CTA opens a prefilled **WhatsApp** message to the configured agent; the user's estate summary
is only sent on an explicit click. The property reason adapts (HBB when the house is mortgaged,
Hibah Hartanah when it's owned).

> **Framing.** Faraid is *fardhu*; these products are **complements, never replacements**.
> Hibah and Takaful Hibah are recognised in Malaysian fatwa practice. Copy never implies faraid
> is unjust, and the disclaimer notes this is **not final financial/syariah advice**.

The pure rule logic is `recommendProducts(signals)` (unit-tested in `test.mjs`); the only block a
seller edits is the `FUNNEL` config object (WhatsApp number, product names/links/copy).

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
