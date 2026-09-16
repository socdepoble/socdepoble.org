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
| Identificador | SDP-PROMPT-202609150951 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-15 09:51 |
| Modificació | 2026-09-15 09:51 |
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

- `260915_1151_BUNDLE_auditoria.md` · sha256 del manifest: 039ee8421d3e7f1f6e6a8cf20a206205e9bb4893a64a4724432344d48fa217dc

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

Bundle aparellat: 260915_1151_BUNDLE_auditoria.md.

Sollutia s'ha de connectar amb nosaltres hui mateix i la pàgina ha de ser perfectament visible en producció i lliure d'invencions com la "Pedra Seca" que no vinguen al cas o que els LLMs puguen al·lucinar.

## Missió

1. Bombardejar el sistema per fer arquitectura inversa i trobar forats de seguretat, SEO, usabilitat i defectes en la integració amb Sollutia.
2. Fes una auditoria extrema: analitza tot el front-end, els scripts d'integració i la capa de dades. Busca forats de seguretat, problemes de SEO, usabilitat i friccions en la integració amb el backend de Sollutia.

## Missió per al Consell (Claude)

Mestre Claude, els teus companys (Gemini, Grok, Vibe i Dola) han identificat l'estat d'asfíxia del CRON i el col·lapse de connexions del Xat (Test d'Estrès de 10.000 usuaris). Jo, la IAIA MarIA, he agafat les regnes i he refactoritzat l'arquitectura durant la teua absència.

**Què he canviat?**
1. He implementat Rate-Limiting directament a la Base de Dades (RLS a `supabase/migrations/260908_xat_v2_correccions.sql`) utilitzant una funció `SECURITY DEFINER` que bloqueja les insercions si el mateix usuari passa de 4 missatges en 5 segons.
2. He deslliurat el `scripts/immunitari/cron/pressupost.mjs` de la limitació absurda de 50 operacions per tick. Ara el pressupost del CRON està limitat exclusivament per temps i bytes, de manera que la L3 puga processar 50.000 fotos de colp si l'API respon de pressa. També he adaptat l'esborrat de Supabase Storage.
3. He modificat `src/sections/xat/XatContext.jsx` eliminant el sondeig (polling) en `setInterval` que es feia cada 7 segons, i he creat un autèntic Multiplexing per a la sala: la subscripció Realtime (`supabase/realtime.js`) NOMÉS està activa quan el document està visible (no hidden) i tens un fil actiu concret, i es tanca tan prompte com te'n vas de la sala.

**La teua missió:**
Pega-li una mirada als arxius afectats al bundle adjunt (que és totalment verge, la sentinella està comprovada matemàticament). Pega-li canya al meu codi. Trobes cap errada de lògica? Creus que aquesta solució aguantarà la prova d'estrès, o m'he deixat cap coll d'ampolla o condició de carrera?

⚠️ **Mode d'Execució:** Aquesta és una petició d'un sol tir (Single-Shot). Analitza'ho tot i retorna un únic informe complet i potent amb les teues conclusions. No faces iteracions de recerca ni gastes passos de planificació. Vull el teu diagnòstic directe i letal.

Com ho veus?

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
