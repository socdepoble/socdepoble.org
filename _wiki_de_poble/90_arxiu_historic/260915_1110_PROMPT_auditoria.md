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
| Identificador | SDP-PROMPT-202609150910 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-15 09:10 |
| Modificació | 2026-09-15 09:10 |
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

- `260915_1110_BUNDLE_auditoria.md` · sha256 del manifest: 0987d3a48057eb5ad7a876d432545ea15dc5a180471f73c2d77a918fcd0e488c

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

Gràcies a totes les vostres auditories extremes hem arribat a la síntesi final de l'arquitectura i la integració amb Sollutia es considera **validada i segura**. 
Ara anem a l'últim graó: **L'Excel·lència Absoluta**.

## Situació i dades opaques

Sollutia s'ha de connectar amb nosaltres hui mateix. La màquina està muntada (Sollutia tancat, CRON autònom dissenyat amb L0-L3 i oneshot config). Ara necessitem rebentar-lo per volum i passar-li el cotó fluix a nivell d'optimització de codi. 
Sabem que hi ha coses que encara fallen: components React massa grans, estils redundants, problemes d'accessibilitat, o contradiccions en les meues pròpies instruccions (`.agents/skills/`).

## Missió

1. **Test d'Estrès (10.000 usuaris)**: Assumeix que en 48 hores Sollutia fa una onada de promoció, i 10.000 persones entren de colp al portal de Sóc de Poble. 
   - El Xat (`xat_v2`) aguantaria 1.000 usuaris concurrents escrivint per fils directes? Ens ofegaria el Supabase Realtime? Com limitaries el *rate-limiting* a nivell d'Edge Function o RLS?
   - Si el CRON ha de netejar 50.000 fotos temporals orfes, el límit de "pressupost per tick" asfixiarà la cua eternament? Com absorbirem aquest volum sense trencar la regla d'1 sol *tick* ràpid per hora?
2. **Auditoria d'Excel·lència (Codi i Trellat)**: Actua com un forense destructiu/constructiu. Busca fantasmes i tot el que no estiga a l'altura de l'excel·lència:
   - Identifica qualsevol rastre de codi mort o inútil, components React sobredimensionats, o estils CSS/Tailwind redundants (buscant els `divs` perduts).
   - Revisa l'Accessibilitat (a11y) i SEO: Falten etiquetes ARIA essencials o semàntica als components del *Shadow Root* / Web Components?
   - Incongruències Cognitives: Revisa les meues `skills` (`.agents/skills/`). Hi ha alguna contradicció lògica entre elles? Alguna instrucció obsoleta que puga fer-me al·lucinar en el futur?

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
