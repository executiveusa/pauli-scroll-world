# Stage 06 — Package & Deliver (Layer 2 contract)

## Inputs
- Layer 4 (working): `../05_quality/output/` (must contain a PASS report) · `../01_intake/output/payment-plan.json`
- Layer 3 (reference): `../../_config/markets/{market_id}.md` · `../../shared/payment/*`

## Process
1. Fill the proposal from the market template (`proposal-generator.js`) — proposal language = market language, prices in market currency, hook line from market config.
2. Generate the payment link: Stripe/Creem checkout or Lightning invoice by client location (Lightning ≥ $500 requires prior Bambu approval — `shared/payment/lightning.js` enforces).
3. Create the delivery ZIP (`license-packager.js`): source encrypted with the rotating key for installment 1 (`license-lock.encryptZip`). Preview build stays unencrypted.
4. Write unlock instructions: one key released per monthly payment, final key = permanent ownership. Include the suspension terms verbatim (7-day grace, read-only, nothing deleted).
5. Deploy preview to Vercel/Cloudflare — preview is the unencrypted VISUAL build only; source stays locked.
6. **HALT.** Write the delivery package to `output/`, set state `ready_for_review`, notify Bambu. Nothing goes to the client yet.
7. On `POST /api/approve?type=final_delivery`: send to the client via the configured channel (n8n), state → `delivered`.

## Outputs
- `output/proposal-{lang}.md` → client-facing proposal in market language
- `output/payment-link.txt` → checkout/invoice URL
- `output/delivery-package.zip` → encrypted source + unencrypted preview + unlock instructions
