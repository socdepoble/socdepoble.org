---
tipus: petorreta
estat: esborrany
description: Auditoria d'arquitectura inversa i integració amb Sollutia
tags:
  - maquina
---
# Petorreta — Auditoria Extrema: Integració Sollutia
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609151028 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-15 10:28 |
| Modificació | 2026-09-15 10:28 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-15 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- `260915_1228_BUNDLE_auditoria.md` · sha256 del manifest: 963662fc89922fc225394768a82bc73ac977ad4dd7a38b6baf7dda451e45e838

## Consell convocat

Z.ai · Qwen · Deepseek · Dola · Kimi · Claude · Perplexity · Mistral Vibe ·
Grok · Gemini · Copilot · ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és el bundle adjunt.
2. Els únics fitxers que existixen són els del manifest, amb ruta i sha256.
   Qualsevol altre nom és ficció i va a §Incògnites.
3. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar,
   no s'afirma.
4. Sense la sentinella `<<<FI_DEL_BUNDLE>>>` al final, el bundle arriba tallat.
   Tot fitxer sense la seua tanca `<<<FI_FITXER>>>` és il·legible. Omplir el
   buit és al·lucinar.

## Informe d'avanç

Bombardejar el sistema per fer arquitectura inversa i trobar forats de seguretat, SEO, usabilitat i defectes en la integració amb Sollutia.

## Situació i dades opaques

Bundle aparellat: 260915_1228_BUNDLE_auditoria.md.

Sollutia s'ha de connectar amb nosaltres hui mateix i la pàgina ha de ser perfectament visible en producció i lliure d'invencions com la "Pedra Seca" que no vinguen al cas o que els LLMs puguen al·lucinar.

## Missió

1. Fes una auditoria extrema d'aquests 4 components que acaben de ser modificats a la Fase 4:
   - **Base de dades**: `supabase/migrations` (Rate-limiting pur amb Triggers i RLS).
   - **Frontend**: `src/sections/xat` (Multiplexing Realtime pur i control de cicle de vida).
   - **Autenticació i OAuth**: `src/data/supabase/auth.js` i `src/data/oauthRelay.js` (Maneig del consentiment RGPD i llista blanca de retorns locals).
   - **Nucli i Integració Sollutia**: `src/host.js` (Patró Fallback Hybrid per evitar el Split-Brain) i `scripts/immunitari/cron` (Pressupostos segurs).
2. Tot i que vull que et focalitzis en aquests fitxers modificats, disposes del **bundle sencer de tota l'aplicació** perquè pugues entendre l'arquitectura completa, verificar dependències, crides transversals, importacions, contractes o usabilitat, de manera que no hages d'imaginar-te res. Analitza si la integració és 100% lliure de friccions amb el backend de Sollutia, sense components morts (com l'antiga `gestoria.js`).

## Eixida esperada

markdown

## Incògnites

- Cap incògnita declarada en generar el prompt.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] He comprovat la sentinella abans de respondre?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md":"a2ed42c0cb4f2af1b2a294be3a3397b0a1cb5ec6549e4a60e9224f0fc92deae2","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"1ddd998512fabed84362b7f93d36d4107c4f1847fda50b589b5d84fb4f9e903c"} -->
