# Carrier Benchmarking & Quality Report — User Guide

This report benchmarks health plans and carriers on the **quality and coverage of their negotiated rates** across U.S. statistical areas (MSAs), and rolls those area-level results up to national and state figures. It also compares two versions of the underlying data (**v8_2** and the newer **v9**) so you can see how each carrier's numbers moved between runs.

The report is delivered as **three tabs**:

| Tab | One row is… | Use it to… |
|---|---|---|
| **Carrier Summary** | one carrier × service bucket | Compare each carrier's headline quality, v8_2 vs v9, at a glance |
| **MSA Detail — v9** | one carrier × MSA × state × service bucket | See the area-by-area detail behind the v9 summary |
| **MSA Detail — v8_2** | one carrier × MSA × state × service bucket | Same detail for the older v8_2 version |

Population figures throughout are 2025 U.S. Census Bureau estimates for each statistical area.

---

## Key concepts (read this first)

**Statistical area (MSA).** Results are organized by Core Based Statistical Area (CBSA) — either a **Metropolitan** or a **Micropolitan** Statistical Area, i.e., a population center and the surrounding region tied to it. We refer to these as MSAs throughout. Each has an ID and a name.

**Carrier / plan.** A specific insurer product (for example, a PPO or HMO offering), shown by a standardized plan name. Two consolidation rules are worth knowing: regional Blue Cross Blue Shield PPO variants are combined into a single **"BCBS PPO"** carrier within each MSA, and BCBS "home plan" carriers appear only in their home-state MSAs.

**Service buckets.** Quality is measured separately for different kinds of care:

- **Total** — all services combined
- **IP** — inpatient facility care
- **OP** — outpatient facility care
- **Prof** — professional (clinician) services

In the detail tabs these are shown as two fields, `billing_class` (institutional vs. professional) and `setting_type` (inpatient vs. outpatient); rows marked `TOTAL` are roll-ups across everything.

**The two quality measures** (both expressed as a percent, 0–100; higher is better):

- **% codebasket** — the share of spend tied to the standard benchmark "code basket" that has been carried all the way through processing. It tells you how completely the standard set of benchmarked codes is covered for that carrier.
- **% green/yellow** — the share of total spend built on good-confidence, directly-observed rates rather than estimated fill-ins. It's the overall data-quality score: higher means more of the number rests on real, trustworthy rate data. (The full rating scale is explained under MSA Detail below.)

**Weighting (spend-weighted).** When area results are combined into a national or state number, each MSA is weighted by its **total benchmarked spend** — its population times its spend per member — not by population alone. This makes the combined figure a true **share of dollars**: it answers "of all the spend in this footprint, what share is good-confidence (or in the code basket)," reflecting both how many people an area has and how expensive its care is. The report provides a **national** figure (across every MSA where the carrier appears) and a **state** figure (within each individual state). (The carrier's spend *rank* is the one exception — it stays population-weighted, since a rank isn't a dollar share.)

**Out-of-area flag.** A carrier sometimes shows up in an MSA with only a sliver of activity and poor quality — usually spillover rather than a real local presence. Those appearances are flagged "out of area" and left out of the spend-weighted quality averages so they don't distort the headline numbers. (Specifically: flagged when the carrier's count of good-confidence rates is under 2% of the largest carrier's in that MSA **and** its quality score is under 20%.) A maintained list of national carriers is never flagged.

**Multi-state MSAs.** Some areas span more than one state. In the detail tabs, such an MSA appears **once per state** (weighted by that state's share of the area's population). The national figures count each MSA only once.

---

## Tab 1 — Carrier Summary (v8_2 vs v9)

One row per carrier and service bucket. The percentages here are the **national, spend-weighted** quality figures — the share of the carrier's benchmarked dollars that are good-confidence (% g/y) or in the standard code basket (% codebasket).

| Column | Meaning |
|---|---|
| `carrier_plan_name` | Carrier / plan |
| `pos_bucket` | Service bucket: `Total`, `IP`, `OP`, or `Prof` |
| `pct_codebasket_v8_2` | % codebasket, v8_2 |
| `pct_codebasket_v9` | % codebasket, v9 |
| `pct_codebasket_delta` | Change in % codebasket (v9 − v8_2; positive = higher in v9) |
| `pct_gy_v8_2` | % green/yellow, v8_2 |
| `pct_gy_v9` | % green/yellow, v9 |
| `pct_gy_delta` | Change in % green/yellow (v9 − v8_2; positive = higher in v9) |

A carrier that appears in only one version will have blanks in the other version's columns (and a blank delta).

---

## Tabs 2 & 3 — MSA Detail (v9 and v8_2)

One row per carrier × MSA × state × service bucket. These tabs show the area-level building blocks behind the summary.

### How the rate data is built

The rate figures come from the negotiated prices that carriers and providers publish in machine-readable files (MRFs). Two things help you read the columns:

- **Rate confidence rating.** Every negotiated rate is scored for how trustworthy it is: **green** or **yellow** means a rate was found and is good-confidence; **red** means a rate was found but is low-confidence; **missing** means no rate was found at all. Red and missing rates are replaced with estimated ("imputed") values so that spend can still be totaled. The **% green/yellow** measure is the share of spend resting on the good-confidence (green/yellow) rates rather than on imputed fill-ins.
- **Spend per 1,000 members.** Every dollar figure is **estimated spend per 1,000 members**, which makes spend comparable across areas and across carriers of different sizes. Spend is split into a **carrier** component (from the carrier's MRF), a **provider** component (from a provider MRF or agreement), and an **imputed** component (filled in where no good-confidence rate existed); together these make up the row's total spend.

### Columns

| Column | Meaning |
|---|---|
| `version` | Which dataset version this row belongs to (`v9` or `v8_2`) |
| `msa_id` | MSA ID |
| `msa_cbsa_name` | MSA name |
| `carrier_plan_name` | Carrier / plan |
| `billing_class` | `institutional`, `professional`, or `TOTAL` |
| `setting_type` | `inpatient`, `outpatient`, or `TOTAL` |
| `state` | A state the MSA falls in (multi-state MSAs appear once per state) |
| `seg_pop` | Population of this MSA within this state (2025) |
| `msa_total_pop` | Total population of the MSA (2025) |
| `flag_out_of_area` | `1` = this appearance is treated as out-of-area and excluded from the weighted quality averages; `0` = included |
| `total_carrier_spend` | Spend from the **carrier** component of the rate (per 1,000 members) |
| `total_provider_spend` | Spend from the **provider** component of the rate (per 1,000 members) |
| `imputed_total_spend` | Spend covered by **imputed** (filled-in) rates, where no good-confidence rate was available (per 1,000 members) |
| `total_weighted_rate` | The row's **total** spend across all sources, per 1,000 members. This is the figure the percentages are calculated against |
| `pct_codebasket` | % codebasket for this MSA / bucket |
| `pct_gy` | % green/yellow for this MSA / bucket |
| `n_rates_greenyellow` | Number of good-confidence (green/yellow) rate records behind this row — how much real rate data underlies it, and the basis for the out-of-area test |
| `carrier_rate_rank` | The carrier's spend rank within the MSA, **1 = lowest spend**. Provided on `Total` rows |
| `pop_weighted_rank` | This MSA's population-weighted contribution to the carrier's **national** spend rank (built from the `Total`-row rank; rank stays population-weighted) |
| `weighted_pct_codebasket` | This MSA's spend-weighted contribution to the carrier's **national** % codebasket |
| `weighted_pct_gy` | This MSA's spend-weighted contribution to the carrier's **national** % green/yellow |
| `state_weighted_pct_codebasket` | This row's spend-weighted contribution to the carrier's **state** % codebasket |
| `state_weighted_pct_gy` | This row's spend-weighted contribution to the carrier's **state** % green/yellow |
| `state_weighted_carrier` | The carrier component's share of the carrier's total **state** spend (carrier $ ÷ total $) |
| `state_weighted_provider` | The provider component's share of the carrier's total **state** spend (provider $ ÷ total $) |
| `state_weighted_imputed` | The imputed component's share of the carrier's total **state** spend (imputed $ ÷ total $) |

**How to read the "weighted" columns.** These are **contributions, not finished figures.** Each one is a single MSA's (or state-row's) spend-weighted share of a larger total. To get a headline number, add the contributions up:

- **National** number for a carrier → sum the `weighted_*` column across that carrier's MSAs for the bucket. *(The national columns are the same for every state row of a given MSA, so count each MSA only once when summing.)*
- **State** number → sum the `state_weighted_*` column across the rows for that carrier, bucket, and state.

The Carrier Summary tab is exactly the national sums, pre-computed for you.

A few other things to expect: percentages run 0–100; the rank columns are meaningful on the `Total` bucket; places that aren't part of a defined statistical area (rural/non-CBSA pockets) carry no state and zero population, so they don't affect the weighted figures; and a carrier may appear in one version's detail tab but not the other.

---

## Where the data comes from

- **Quality and spend fields** are produced from carriers' and providers' published negotiated-rate files (MRFs), scored and totaled as described in "How the rate data is built" above.
- **Population** comes from 2025 U.S. Census Bureau estimates for each statistical area.
