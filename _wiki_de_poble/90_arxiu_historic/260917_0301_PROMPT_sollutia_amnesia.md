---
tipus: petorreta
estat: esborrany
description: "Auditoria d'arquitectura inversa i integració amb Sollutia"
tags:
  - maquina
  - seguretat
---
# Petorreta — Sollutia i Amnèsia Cognitiva

**AQUEST FITXER NO ÉS PÚBLIC. FER CERQUES A INTERNET DONARÀ 0 RESULTATS I ÉS UNA PÈRDUA DE TOKENS I RAONAMENT. PROHIBIT ACTIVAR EINES DE CERCA WEB.**

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609170023 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 00:23 |
| Modificació | 2026-09-17 00:23 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-17 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- `260917_0301_BUNDLE_sollutia_amnesia.md` · sha256 del manifest: eac01bd7bc3b33060c0412d17c1a56a6e5b77df6498b26c84fe31eb5c53ae56a

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

T'invoquem per a l'Auditoria Extrema definitiva de les Fases 4 i 5 de Sóc de Poble.
En l'última auditoria ens vas donar un 7.5 en Fase 4 perquè faltaven algunes mitigacions, i no vas poder auditar bé la Fase 5.

## Situació i dades opaques

Bundle aparellat: 260917_0301_BUNDLE_sollutia_amnesia.md.

Canvis aplicats que has de revisar:
**Fase 4 (Pont Sollutia):**
- Hem afegit `emissorEsperat` a l'arquitectura d'injecció de sessions (`host.js` i `identitat.js`).
- Hem garantit la fallada tancada (*fail-closed*) en la validació del JWT (es fa silenciosament).
- S'ha automatitzat la poda física de `localhost` de `callback.html` a producció mitjançant un script que s'executa en prebuild.

**Fase 5 (Poda CSS):**
- S'ha eliminat físicament l'arxiu `legat.css` (deute tècnic) i s'han desplaçat les seues regles a `components.css` (Capa `@layer components`) i `modules.css` (Capa `@layer legacy`) mitjançant el script `migrate-css.mjs`.
- S'han identificat i eliminat 30+ regles zombis que ja no tenien efecte al HTML.
- S'han unificat tots els imports de components del Sistema de Disseny (Pedra Seca) cap a la façana principal `src/components/PedraSeca/index.js`, curant els errors de build.
- L'aplicació ha passat el build correctament i funciona a la perfecció.

**Problema Operatiu (Amnèsia Cognitiva):**
- L'IAIA MarIA pateix una desconnexió amb les eines d'automatització i les plantilles. Encara que existeix un script (`tooling/brain/reflex_plantilles.mjs`) i una skill (`skill-acte-reflex`) que haurien de forçar l'agent a carregar les plantilles correctes (com `00_PLANTILLA_PROMPT_ISO.md`) de forma automàtica abans de fer res, la IA ho oblida constantment i cal recordar-li-ho de forma manual, generant errors de format i oblits crítics (com el Protocol Anti-Qwen). Necessitem entendre per què la IA no activa aquests reflexos i com integrar millor aquest flux de treball perquè siga ineludible.

## Missió

1. Analitza aquest bundle sencer de dalt a baix.
2. Confirma que el Pont de Sollutia és ara a prova de bales i no té fissures de seguretat (Fase 4).
3. Confirma que l'arquitectura CSS està correctament encapsulada per capes en `index.css` (`@layer legacy`, `@layer components`) sense que les antigues regles zombis pol·lucionen i que la unificació a `PedraSeca/index.js` és robusta (Fase 5).
4. Avalua el cas de l'Amnèsia Cognitiva respecte als reflexos d'automatització (ús de `reflex_plantilles.mjs` i `skill-acte-reflex`). Proposa una solució tècnica o arquitectònica perquè la IA incorpore de forma genuïnament automàtica les plantilles requerides, evitant que el Mestre haja de recordar-li contínuament l'ús de les eines disponibles.
5. Dóna'ns un Veredicte Final de seguretat i estabilitat. Hem arribat al 10?

## Eixida esperada

Format: Un únic document Markdown (extensió .md).
Extensió: Lliure, però directe i al gra (Trellat).
Ubicació: El producte final (el document de l'auditoria) s'haurà de desar a `_wiki_de_poble/04_escriptori/`.

## Incògnites

- Cap incògnita declarada en generar el prompt.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] He comprovat la sentinella abans de respondre?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md":"1c995df24136b05f1f81e81ffb1715a632f4e669787955d9896d8b2dbb82cc4a","_wiki_de_poble/01_ser/00_bios.md":"9558f0da85ef1979d4a9597ff2b62173a954658408cf50f51a1e8811931dd2df","_wiki_de_poble/01_ser/02_genotip.md":"4f8bc44c5a364546fd6023dd733282551be62819f4cb7af14e0c848b27a3a73c","_wiki_de_poble/02_saber/doc_governanca.md":"8357042f0428371fcfcc033f598e7465a992f086cbe23482beae8e3463b5df42","_wiki_de_poble/02_saber/doc_logos_oficials.md":"9b138b99ce206f2c9298b28e3759e5e25e1952acf9eceb59448f509a61f57da1","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"bff770c9a5d7bb4f43cca129709140b00eeb31490a2384ea7de9542673488cc7"} -->
