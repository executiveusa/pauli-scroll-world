---
name: krug-laws
version: 1.0
type: layer3-constraint
load: on any user-facing output
source: "Don't Make Me Think, Revisited" — Steve Krug, 2014 (compressed for agent enforcement)
---

# Steve Krug Laws — Agent Enforcement Version

Mandatory on ALL visual and copy output (CLAUDE.md law 6). `stages/05_quality/krug-checker.js` automates checks marked ⚙; the rest are review criteria for the quality-gate model pass.

## The ten laws

1. **Don't make me think.** Every choice a user must puzzle over is cognitive load. If an element needs explanation, redesign it. ⚙ (checks: unlabeled icons, ambiguous link text like "click here", forms with >1 optional-vs-required ambiguity)
2. **How we really use the web.** Users scan, they don't read; they satisfice, they don't optimize. Design for the glance, not the study. ⚙ (checks: paragraphs > 60 words in hero/section copy)
3. **Billboard design 101.** Clear visual hierarchy; clickable things must look clickable; cut visual noise. Every screen readable in 3 seconds at scroll speed. ⚙ (checks: heading order, CTA count per view ≤ 2, contrast via UDEC axis)
4. **Animal, vegetable, or mineral?** Choices must be mutually obvious. It's fine to have many options if each is instantly categorizable.
5. **Omit needless words.** Half the words → twice the usability. Happy talk and instructions are the first to cut. ⚙ (checks: hero headline ≤ 9 words, body ≤ 30 words per beat, button label ≤ 3 words)
6. **Street signs and breadcrumbs.** The user always knows: what site, what page, where in the flow, how to get home in one click. ⚙ (checks: persistent brand link, active-state nav)
7. **The big bang theory of web design.** The home/landing page must answer in seconds: What is this? What can I do here? Why here and not elsewhere? First impression = trust.
8. **The farmer and the cowman should be friends.** Stakeholder design debates are resolved with usability evidence, not opinion or seniority. In COSMOS: UDEC scores and krug-checker output are the evidence.
9. **Usability testing on 10 cents a day.** Test early, test often, small rounds with real users beat one big late round. In COSMOS: browser-harness pass on every assembly before the quality stage.
10. **Usability as common courtesy.** Never create obstacles: no forced signups to view, no hidden pricing, no dark patterns. Reservoir of goodwill is finite — each obstacle drains it.

## The three-question gate (applied to every piece of user-facing copy)
1. Would a distracted user understand this in **3 seconds**? No → rewrite.
2. Can you cut **50% of the words** without losing meaning? Yes → cut them.
3. Is every link/button a **verb that says exactly what happens**? No → fix it.

## Failure handling
Any ⚙ check failure → written to the stage's quality report with the exact element and a suggested rewrite → blocks delivery until fixed (UDEC floor still applies on top).
