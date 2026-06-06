# ☪ Kalkulator Faraid

A Malaysian Islamic inheritance (**Faraid**) calculator with a full estate-planning
companion: explainable per-heir shares, an asset & liability inventory, net divisible-estate
computation, a monthly-bill tracker, a financial-health dashboard, an estate-completeness
meter, a **before/after-hibah scenario comparison**, a **printable PDF report**, a
**private mode** for shared devices, and personalised estate-planning suggestions.

It is a **dependency-free, single-file static web app** — all HTML, CSS, and JavaScript
live in [`public/index.html`](public/index.html). No build step, no framework, no backend.
Calculations follow **Shāfiʿī / Malaysian practice** (including *radd*). The UI is in **Malay**.

> **Privacy by design.** Everything runs in your browser. Your estate data is stored only in
> `localStorage` on your own device and is never sent to any server. The only time any summary
> leaves the device is if *you* explicitly tap a "Get a quote" WhatsApp link. A **Private Mode**
> (see below) keeps the estate in memory only — nothing is written to disk — for shared devices.

---

## Features

### 1. Faraid calculator (the trusted core)
- Pick heirs from a grouped grid; multi-count heirs (wives, children, siblings…) use a stepper.
- Exact **rational arithmetic** throughout (shares are computed as `{n, d}` fractions, never
  floats), so every share is precise and always sums to exactly 1.
- Shows each heir's share as a fraction, percentage, *sihm*, and per-head amount, plus a pie chart.
- **Explainable shares ("Sebab").** Every inheriting heir shows *why* they receive their share
  (e.g. *"Ada keturunan → 1/8"*, *"Baki secara asabah (lelaki 2 : perempuan 1)"*), and a
  **"Tidak menerima (terhalang)"** section lists every blocked (*mahjub*) heir with the reason
  they inherit nothing (e.g. *"Terhalang oleh Anak Lelaki"*). This makes the result auditable —
  important in a religious + financial domain.
- Case notes explain estate-wide mechanisms when they apply: *ʿAul*, *Radd*, *Umariyyatān*,
  *Musytarakah*, grandfather *muqāsamah*, and *asabah maʿa-l-ghayr*.
- The result panel is deliberately kept **pure** — fiqh basis and limits are shown with it, and
  any product suggestion is a separate, clearly-optional element below it.

### 2. Asset & liability inventory
- **Aset** — assets, optionally with a secured loan attached (e.g. a mortgaged house).
- **Hutang & Liabiliti** — standalone debts not tied to an asset (personal loans, credit cards,
  funeral costs).
- **Insured vs uninsured debt** is handled correctly: an *insured* loan is settled by insurance,
  so its asset counts in full; an *uninsured* loan's outstanding balance is deducted. An insolvent
  estate clamps to 0. The same rule applies to standalone debts.
- The result is one **net divisible estate** (`netTotal`), to which the faraid percentages apply,
  giving a per-heir RM distribution.

### 3. Monthly bills tracker (Bil Bulanan)
- A per-month checklist. Loan/financing bills appear automatically from their monthly installment;
  you can also add manual bills.
- **Live tie-in:** ticking a loan bill as paid reduces that loan's real outstanding balance
  (reversible by unticking), which flows straight into the net divisible estate.

### 4. Dashboard (Islamic estate health check)
- Net divisible estate up top, with a **financial-health bar** (net vs deductible-debt split and a
  *Sihat / Sederhana / Perlu Perhatian* verdict).
- **"Needs attention" insight chips** derived from the estate (e.g. *"X% berisiko ke Baitulmal"*,
  *"Tanpa anak lelaki — baki ke waris asabah"*, *"Pinjaman rumah belum dilindungi"*).
- An **estate-completeness meter** (*Kelengkapan Maklumat Harta*) — a documentation checklist
  (heirs, cash, KWSP, investments, property, takaful, debts) with a progress bar and clickable
  "missing" chips that jump to the right view. Framed as guidance, not judgement: items that
  don't apply can be ignored.
- The faraid distribution as a donut + legend, a bills summary, then the planning suggestions.

### 5. Estate-planning suggestions (Cadangan Perancangan Harta)
A rule engine ranks complementary Islamic estate-planning products for *this* user's situation and
explains **why each applies** (quoting their own RM figures and heirs). Products covered: **Takaful
Hibah**, **Hibah / Hibah Amanah**, **Wasiat**, and **Al-Wasitah** (estate administration).

> **Framing.** Faraid is *fardhu*; these products are **complements, never replacements** — for
> liquidity, debt settlement, non-heirs, and lawful wishes within the 1/3 / hibah rules. Copy never
> implies faraid is unjust. The suggestions are advisory, and any contact (a prefilled WhatsApp
> message) is only sent when the user explicitly taps it.

### 6. Hibah planning — *Perancangan Hibah* (Sebelum vs Selepas)
A **saved plan** for distributing assets *outside* faraid, on its **own page** with a summary on
the dashboard. Model "what if I gift some assets?" and see the impact **side by side**:
- Assign **each asset to any recipient** — any selected heir (including a *mahjub* one) or a
  non-heir. Different assets can go to different people. The plan **persists** (in `state.hibah`).
- A live **before/after table** per person with a Δ column. Hibah moves an asset out of the
  divisible estate (the faraid *fractions* stay the same — only the RM total shrinks) and credits
  the recipient the asset's **net** value, so totals are conserved. It honestly shows the *net*
  effect (e.g. gifting the house lifts the spouse but also shrinks her faraid share).
- **Each category shows how to execute the hibah:** ASNB can be done yourself via *myASNB*;
  **KWSP cannot be hibah'd** (its nominee is only an administrator — the balance still follows
  faraid, so it stays in the estate); Takaful Hibah is set on the certificate; and other assets
  (property, cash, etc.) go through **Wasiyyah Shoppe** products.

### 7. Printable report (PDF) — *Cetak / PDF*
A one-tap **🖨 PDF** button builds a clean, professional report and opens the browser's print
dialog (choose a printer or "Save as PDF") — dependency-free, via a print-only stylesheet and
`window.print()`. The report covers the estate summary, the faraid distribution table (with the
per-heir *Sebab*), blocked heirs, "needs attention" points, an advisory suggestion, and the
disclaimer. The browser's native Ctrl/Cmd+P works too.

### 8. Private mode — *Mod Privasi*
A 🔓/🔒 toggle for shared devices and roadshows. When on, the estate is kept **in memory only** —
any previously saved estate on the device is wiped and nothing new is written, so it disappears
when the browser closes. The preference itself persists (so an agent's device stays private), and
a **"Kosongkan sekarang"** action clears everything between sessions.

---

## Domain notes

The engine implements: the fixed shares (*furūd*), residuary distribution (*ʿasabah*, 2:1),
*ʿaul*, *radd*, blocking (*hijab*), *Umariyyatān*, *asabah maʿa-l-ghayr* (sister with daughters),
*Musytarakah*, and grandfather *muqāsamah* with siblings (Shāfiʿī, not Ḥanafī blocking).

**Intentionally not handled** (rare cases — the UI tells users to consult an expert): *Akdariyyah*,
*muʿāddah* (mixed full/consanguine siblings with a grandfather), and *dhawu-l-arham*.

This is a tool for **estimation and education — not final financial or sharia advice**. For an
official distribution, consult the Syariah Court / Amanah Raya / a certified faraid expert.

---

## Run locally

Open `public/index.html` directly in a browser, or serve it:

```bash
cd public && python3 -m http.server 8000   # http://localhost:8000
```

## Tests

A dependency-free test suite checks the faraid engine, the per-heir "Sebab" reasons, the asset
net-total math, and the recommendation rule engine:

```bash
node test.mjs
```

Each faraid case asserts the exact fraction per heir *and* that all shares sum to exactly 1
(or sum + Baitulmal = 1).
