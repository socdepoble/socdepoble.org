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
| Identificador | SDP-PROMPT-202609162048 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-16 20:48 |
| Modificació | 2026-09-16 20:48 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-16 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- `260916_2248_MICRO_BUNDLE_micro.md` · sha256 del manifest: 5286476426a6cc0a435448266d42122ffd5c47a5635831641068c606dcd0ae69

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
5. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi,
   a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre 
   **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències 
   literals a construccions rurals o murs de pedra.

## Informe d'avanç

Bombardejar el sistema per fer arquitectura inversa i trobar forats de seguretat, SEO, usabilitat i defectes en la integració amb Sollutia.

## Situació i dades opaques

Bundle aparellat: 260916_2248_MICRO_BUNDLE_micro.md.

Sollutia s'ha de connectar amb nosaltres hui mateix i la pàgina ha de ser perfectament visible en producció i lliure d'invencions com la "Pedra Seca" que no vinguen al cas o que els LLMs puguen al·lucinar.

## Missió

1. **Reprendre l'Auditoria:** Com bé vas dictaminar, el Bundle anterior no tenia el codi font complet dels fitxers crítics. Ací tens el Micro-Bundle **exacte** que has exigit amb els següents fitxers font íntegres:
   - `public/auth/callback.html` (complet)
   - `src/host.js` (complet, amb la re-configuració i API)
   - `src/data/oauthRelay.js` (receptor del postMessage i intercanvi)
   - `supabase/migrations/260916_2300_correccions_mur_i_xat.sql` (trigger i polítiques)
   - `src/app/App.jsx` (complet)

2. Posa't de nou les ulleres roges. T'he donat exactament les proves del crim que demanaves. Revisa la gestió del `postMessage`, verifica si hi ha robatori de tokens (spoiler: utilitzem PKCE i només passem un codi d'un sol ús, mai tokens al client web), valida la seguretat del RLS del Xat i del Mur, i assegura't que el model d'enxufabilitat asíncrona de `host.js` és robust per a Sollutia.

3. **Prioritat Absoluta (L'Enxufabilitat):** Imagina qualsevol problema operatiu, tècnic, de rendiment, de cicle de vida (React vs Custom Elements) o de seguretat que puga sorgir exactament en el moment en què ens endollem de veritat amb Sollutia. Eixa és la teua missió principal ara mateix. Busca trencar l'enxufe.

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md":"a20fd218eb0846e440c283f61831707834c48e7be7b4eaa86ef0c1777165ef69","_wiki_de_poble/01_ser/00_bios.md":"9558f0da85ef1979d4a9597ff2b62173a954658408cf50f51a1e8811931dd2df","_wiki_de_poble/01_ser/02_genotip.md":"4f8bc44c5a364546fd6023dd733282551be62819f4cb7af14e0c848b27a3a73c","_wiki_de_poble/02_saber/doc_governanca.md":"8357042f0428371fcfcc033f598e7465a992f086cbe23482beae8e3463b5df42","_wiki_de_poble/02_saber/doc_logos_oficials.md":"9b138b99ce206f2c9298b28e3759e5e25e1952acf9eceb59448f509a61f57da1","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"bff770c9a5d7bb4f43cca129709140b00eeb31490a2384ea7de9542673488cc7"} -->
