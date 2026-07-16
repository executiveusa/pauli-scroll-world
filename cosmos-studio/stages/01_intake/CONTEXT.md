# Stage 01 — Intake (Layer 2 contract)

## Inputs
- Layer 4 (working): raw brief — text, API JSON (`POST /api/brief`), or conversational (Hermes)
- Layer 3 (reference): `brief-schema.json` · `prd-template.md` · `../../_config/markets/{market_id}.md`

## Process
1. Extract fields: `brand_name, pitch, industry, audience, tone[], budget_tier, languages[], palette?, scenes?, add_ons[], market_id`.
2. Validate against `brief-schema.json`. Reject invalid briefs with the SPECIFIC missing/invalid field named in the error — never a generic failure.
3. Route to market: detect language (`market_id` field → `Accept-Language` → brief language), load `../../_config/markets/{market_id}.md`. No match → `us-en`, and record the assumption on the job.
4. Generate the PRD from `prd-template.md`. Fill EVERY field — no blanks, no "TBD". Unknowns become explicit stated assumptions the client can correct.
5. Generate the payment plan from the market's tier price:
   `down_payment = price × 0.33` · `monthly = (price × 0.67) / months` · `total_months = 3 max`.
6. **HALT.** Write PRD to `output/prd.md`, set job state `awaiting_prd_approval`, notify Bambu. Stage 02 runs only after `POST /api/approve?type=prd`.

## Outputs
- `output/prd.md` → the approval-gate document (human edit surface)
- `output/payment-plan.json` → `{tier, currency, price, down_payment, monthly, months}`
- `output/brief-validated.json` → normalized brief + market_id + workflow
