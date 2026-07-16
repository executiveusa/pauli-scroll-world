# Market: TBD Slot 1 (reserved)

Placeholder for market 6. Candidate shortlist (from lead data — revisit monthly): Brazil (pt-BR), UAE (en/ar-AE), Colombia (es-CO).

```yaml
market_id: tbd-slot-1
language: TBD
locale: TBD
currency: TBD
pricing:
  starter: 0          # set on activation; anchor to local competitor gap, not US prices
  growth: 0
  flagship: 0
  payment_plan_months: 3
  down_payment_pct: 0.33
wealthy_targets: []
ugc_character_defaults:
  voice_model: TBD    # must exist in ElevenLabs voice library before activation
  appearance_prompt: TBD
  setting_prompt: TBD
ad_platforms: [Meta, Instagram, TikTok, YouTube]
affiliate_compute: https://runpod.io/?ref=kupuri
local_competitor_gap: TBD
hook_line: TBD
activation_checklist:
  - [ ] Locale + currency + pricing set (validate against local competitor quotes)
  - [ ] UGC character voice + appearance approved by Bambu
  - [ ] Hook line written natively (never machine-translate the hero)
  - [ ] landing/locales/{lang}.json added and toggle wired
  - [ ] Ad strategy section added to docs/agent-system/ad-strategy.md
```
