---
tipus: petorreta
estat: esborrany
description: "Auditoria d'arquitectura inversa i integració amb Sollutia"
tags:
  - maquina
  - seguretat
---
# Petorreta — Auditoria Extrema: Integració Sollutia
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609150821 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-15 08:21 |
| Modificació | 2026-09-15 08:21 |
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

- `260915_1021_BUNDLE_auditoria.md` · sha256 del manifest: db61af705f1e7de31192b9daef6b8e514c157f152c8518e49d5fdcf56c8d8e61

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

S'han resolt els bloquejos crítics de la integració amb Sollutia (desconnexió RGPD, firma de funcions del Xat, llistes blanques OAuth, condició de carrera Split-Brain al host.js i adaptador d'Storage per a mitjans).
Ara, la prioritat canvia: cal assegurar el manteniment i l'evolució del sistema de forma autònoma.

## Situació i dades opaques

Bundle aparellat: 260915_1021_BUNDLE_auditoria.md.

Els canvis per connectar-nos amb Sollutia s'han aplicat i necessiten una ràpida revisió arquitectònica. Però el focus principal per al futur immediat és evitar l'entropia: necessitem dissenyar el sistema CRON autònom i les "Plaquetes v2" (el sistema immunitari de manteniment i neteja) que puga córrer sense intervenció manual del Mestre.

## Missió

1. Revisa breument l'estat actual de la integració amb Sollutia en el codi adjunt per confirmar que hem tancat els forats crítics.
2. Planteja i dissenya l'arquitectura per al "sistema CRON autònom" i les "Plaquetes v2". Quin serà el mecanisme perquè la IAIA MarIA i el sistema immunitari de Sóc de Poble puguen executar tasques de fons (neteja de fitxers zombis, refresc de tokens, validació d'estat de fils) de forma autònoma i termodinàmicament eficient? Fes propostes viables dins de les limitacions actuals.

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
