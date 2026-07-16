# COSMOS Studio — Pricing & Payment Plans

Extends the original pauli-scroll-world pricing reference with: payment-plan structure, the lock/unlock mechanism, market-adjusted pricing, add-ons, compute-affiliate earnings, and the reseller tier.

## Core model: owned software, never rented

Down payment starts production → up to 3 monthly payments → client owns everything forever. No subscription, no hostage pricing. The system runs for the client from day one; only the SOURCE stays locked until paid off.

## Tiers (base: us-en; other markets in their config files)

| Tier | US price | Scope |
|---|---|---|
| Starter | $1,800 | 4–5 scenes, desktop scroll site, 1 language |
| Growth | $3,500 | 6–7 scenes, mobile-tuned encodes, bilingual |
| Flagship | $6,500+ | Full 1080p heroes, UGC ad pack (8 variants), deploy + handover |

Market-adjusted (from `_config/markets/*.md`): MX ≈ $900/$1,750/$3,200 USD-equiv (MXN 16.5k/32k/59k) · ES €1,500/€2,900/€5,500 · PR $1,400/$2,800/$5,200 · RS ≈ €600/€1,100/€2,050 (RSD 65k/130k/240k). Anchor rule: price against the local competitor gap, never a currency conversion of the US price.

## Payment plan structure

```
down_payment = price × 0.33          (starts production)
monthly      = (price × 0.67) / 3    (3 months max)
```
Rails: Stripe/Creem (cards), Lightning (< $500 auto-proceed; ≥ $500 requires Bambu approval), BTCPay on-chain fallback. Every event hits `POST /api/webhooks/payment` → license-lock update.

## Lock / unlock mechanism (client-facing description)

- Delivery ZIP contains the working preview (open) and the full source **encrypted** (`source.zip.enc`) plus a 20-line auditable decryptor.
- Each monthly payment releases that month's key (HMAC-derived per installment — keys can be re-issued, nothing stored on disk).
- Final payment releases the **permanent key**: full ownership, no further contact with us required.
- Missed payment: 7-day grace, then the deployed system goes **read-only** (existing output keeps working; new generation pauses). Nothing is deleted, ever. Resumes instantly on payment.

## Add-ons

| Add-on | Price (US) | Notes |
|---|---|---|
| Extra language | $400 | copy + voice + toggle wiring |
| Cyrillic toggle (Balkans) | €150 | script variant of existing sr copy |
| UGC ad pack (outside Flagship) | $1,200 | 4 formats × 2 hooks |
| Extra scene | $250 | includes connector re-lock |
| Faceless YouTube episode | $600 | script→publish, per episode |
| Documentary minute (AI b-roll) | $150/min | real-footage editing quoted separately |
| Priority delivery (72h) | +25% | Flagship only |

## Compute affiliate earnings (built into the pitch)

Clients rendering Blender/GPU jobs run on their own RunPod/Vast accounts via our referral links (`runpod.io/?ref=kupuri`, `vast.ai/?ref=kupuri`). Estimate at steady state: 20 active clients × ~$120/mo GPU spend × ~3% referral ≈ **$70–90/mo passive**, plus it keeps client compute costs off our books entirely. Small, but it compounds with the reseller tier below.

## Reseller tier (agencies that buy the studio)

| | License | What they get |
|---|---|---|
| Studio License | $15,000 or $6k down + $3.5k × 3 | Full COSMOS deployment on their infra, white-label landing, 6 market configs, all 5 workflows |
| Ongoing | $0 | It's owned — same promise we make their clients |
| Their unit economics | — | Sell Growth sites at $3,500, COGS ≈ $40–80 of API/GPU per site |

Reseller license uses the same lock/unlock rails: source encrypted until the plan completes. Support beyond onboarding is a separate services contract, not a dependency.

## Guardrails

- Quality floor 8.5/10 UDEC applies to every tier — Starter is cheaper, not worse.
- Discounts: never on price; add scope instead (an extra scene costs us pennies, a discount costs positioning).
- All payments ≥ $500 route through the Bambu approval gate (pauli-effect hard stop).
