# 12 · Privacy, Safety & Ethics

> Impact media is about **people and places that are often vulnerable**. A verification tool can protect communities or harm them. These are the guardrails, which are also strong answers for judges.

---

## 1. Principles
1. **Evidence about work and outcomes, not surveillance of people.** The NMMS critique (The Wire, 2025) is that photo-attendance shifted the burden onto workers without ending fraud. Pramaan verifies **assets and outcomes** (dams, saplings, classrooms, trainings), not individual attendance, and never scores individuals.
2. **Dignity by default** (in the spirit of the Dóchas Code of Conduct on Images and Messages): no degrading imagery, no "poverty porn", people shown as agents, context preserved.
3. **Consent is data, and it's enforced by transformation.** If there's no consent, the public output is automatically redacted.
4. **AI assists; humans decide.** Every flag is explainable and reversible; decisions are logged; affected staff can contest.
5. **Honest AI.** Generative outputs are labeled and never presented as evidence.
6. **Minimize & protect.** Collect only what's needed; coarsen sensitive locations; protect originals.

## 2. DPDP Act 2023 / Rules 2025 alignment (India)

| Obligation (plain language) | Pramaan feature |
|---|---|
| Lawful basis (consent) for identifiable photos | `consent` records linked to evidence; consent capture flow (signed form photo or on-screen consent with timestamp) |
| Specific, informed, affirmative consent | Scope choices: internal-only / public-redacted / public-full; bilingual consent text |
| Verifiable guardian consent for children | `minors_likely` flag (AI Vision) → guardian consent required before any non-redacted use; minors excluded from hero/social by default |
| Right to withdraw & erasure | Withdrawal → unpublish stories, `invalidate: true` derived assets, restrict originals, ledger `withdrawn` (the ledger stores hashes, not faces) |
| Purpose limitation & retention | Retention policy per project; scheduled deletion job; originals of people-heavy media restricted after project close |
| Security safeguards | Signed uploads, server-only secrets, RLS, authenticated originals (P1), audit trail |
| Breach readiness | Access logs; rotation of keys; minimal PII in DB (no names of beneficiaries required) |

(Core DPDP obligations apply from 13 May 2027; building it in now is a selling point for CSR buyers.)

## 3. Redaction policy matrix (enforced by the URL builder)

| Content | Internal (reviewers) | Funder portal | Public |
|---|---|---|---|
| Adults, consent public_full | Original | Original | Original |
| Adults, no/partial consent | Original | `t_public_safe` (faces pixelated) | `t_public_safe` |
| Minors likely, no guardian consent | Original (restricted role) | Pixelated | **Excluded** from public outputs |
| Documents/IDs/phone numbers visible | Original | `t_public_safe_ocr` | `t_public_safe_ocr` |
| Sensitive locations (e.g. shelters, forest patrol routes) | Exact | Village-level | District-level / hidden |

## 4. AI ethics & model use
- **No facial recognition or identity inference** (no People Search, no age/gender attributes add-on). Only presence/count/minor-likelihood for consent routing.
- **No sensitive attribute inference** (caste, religion, health, disability) in prompts or outputs.
- **Bias awareness:** AI Vision may misclassify rural Indian contexts (e.g. check dams vs. walls). Mitigations: org-specific taxonomy with descriptions, claim context in prompts, reviewer overrides, and calibration on local seed data.
- **Transparency to users:** every AI output is labeled "AI-generated analysis" with confidence and a feedback control.
- **Prompt injection:** images/transcripts are untrusted input; Gemini treats them as data; write actions require human confirmation.

## 5. Fraud-detection ethics
- A Trust Score is **not** an accusation. UI language: "Needs review" / "Flagged for review", not "Fake".
- **Contestability:** field staff see why an item was flagged and can respond (re-capture, add context); reviewers record reasons.
- **No automated penalties.** Pramaan never withholds payments or blacklists users; it informs human processes.
- **Aggregate patterns** (e.g. uploader with many flags) are shown only to org admins, with context.

## 6. Security checklist (pre-demo)
- [ ] No secrets in client bundles (`grep -r "API_SECRET" .next/` is empty)
- [ ] Webhook signature verification on; stale timestamps rejected
- [ ] Signed uploads only; unsigned presets disabled
- [ ] RLS on all tables; service role only in server jobs
- [ ] Planner → whitelist compiler (no raw expression passthrough)
- [ ] Rate limiting on public `/verify` and `/api/search`
- [ ] Strict transformations ON for the final demo (after templates are final)
- [ ] Seed data uses team-captured or properly licensed images; **no real beneficiary faces without consent**. Use team members or consenting friends, and credit sources in `CREDITS.md`

## 7. Responsible GenAI in stories
- Allowed: aspect-ratio extension (`b_gen_fill`) on landscapes/objects, illustrative non-evidence art (Image Generation), optional "living photo" (Image-to-Video). Always labeled "AI-assisted".
- Not allowed: generative edits on people, removing/adding objects in evidence (`e_gen_remove`/`e_gen_replace` on evidence), background replacement on field photos, "improving" dead saplings.
- Budget: ≤ 10 generative transformations and ≤ 16 s Image-to-Video for the event (credits + honesty).
