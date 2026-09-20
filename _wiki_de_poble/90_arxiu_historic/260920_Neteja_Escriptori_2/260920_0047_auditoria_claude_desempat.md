---
type: informe
status: esborrany
description: Auditoria del desempat normatiu sobre encaminament, mirall de skills, estructura de la Wiki i execucio procedimental.
tags:
  - govern
  - arquitectura
---

# Auditoria — Desempat Normatiu (P1 · P2 · P3 · P4)

| Camp | Valor |
| --- | --- |
| Respon a | SDP-PROMPT-DESEMPAT-260920 |
| Tall verificat | HEAD `b398115f` · branca `backup-notes-publish` · 20-09-2026 00:47 |
| Agent | Claude (Cowork), accés natiu, sense bundle ni cerca web |
| Escriptura | **Cap.** Contracte §5 respectat: no he cridat cap eina d'edició |

---

## §0 · Tres fets nous abans dels veredictes

**a) El reflex mor precisament amb la paraula «auditoria».**
`tooling/brain/classificador_tasques.mjs:13` encamina `auditoria, revisar, auditar` → `auditoria_canonica.md`. Però `tooling/brain/reflex_plantilles.mjs:23` fixa el directori a `_wiki_de_poble/02_saber/07_plantilles/` i `:58` hi resol el nom. **`auditoria_canonica.md` no és allí**: viu a `_wiki_de_poble/02_saber/protocols_tecnics/`. Resultat: `readFileSync` peta → `return 1` → *fail closed*.

**b) Res del món llig `.agents/hooks.json`.**
La cadena sencera està desconnectada perquè el wrapper de `matrix` estava dissenyat per a Claude Code, no per a l'IDE Antigravity. El hook no s'executa mai.

**c) `01_PLANTILLA_PROMPT_INTERN.md` no la nomena cap llei.**
La REGLA 0 i el PROTOCOLLEDGE només nomenen `00_PLANTILLA_PROMPT_CONSELL.md`. MarIA no oblida la plantilla interna; obeïx la REGLA 0 exactament. La llei nomena el fitxer equivocat.

---

## §1 · P1 · PROTOCOLLEDGE → **Codex té raó. Opció B, amb tres esmenes meues.**
**Rectifique la meua posició d'ahir.** El problema són dos resolutors amb semàntiques incompatibles.
**Esmena 1:** L'Opció A no era gratuïta (hauria trencat l'esquema).
**Esmena 2:** El registre ha de modelar el *destinatari* (local vs extern), no només la intenció. Així es resol la plantilla interna.
**Esmena 3:** Conserveu la taula en prosa, però només com a vista generada.

## §2 · P2 · Mirall de skills → **Codex té raó. Retirar les còpies.**
**Rectifique també ací.** El mirall està contaminant l'RAG (20 documents, incloent-hi 4 skills mortes de 3.617 tokens, i cap de les noves).
**Veredicte:** Sincronitzador destructiu que genere un sol `00_index_skills.md` amb enllaços. Buidar carpeta i regenerar índexs RAG.

## §3 · P3 · Distribució de la Wiki
`03_actuar` està buida perquè el contingut se'n va anar i ningú va tancar els anells.
**Nivell barat:** Moure l'arquitectura universal a `02_saber/architecture/`. Buidar l'anell i regenerar índexs.
**Nivell car:** Promoure `07_plantilles/` a `03_actuar/plantilles/` per separar el que instància la màquina del saber pur humà. Primer fer P1, després açò.

## §4 · P4 · La vostra arquitectura cognitiva
**El diagnòstic és fals:** MarIA no "falla estúpidament", està obeint lleis trencades (com la REGLA 0) i instruments que menteixen (com `tractor-frontmatter.mjs` que dona "verd" però llista errors en F1-F7 perquè usa comptadors agregats).
Cal:
1. Activar els hooks amb un adaptador per a Antigravity (per denegar la crida a la ferramenta).
2. Arreglar els scripts de "Tooling" perquè deixen els rebuts correctes que `verify.mjs` exigeix.
3. El deute de frontmatter ha de fallar sempre si es toca el fitxer en el commit actual, independentment de la quota general agregada.

---

## §5 · Ordre d'execució consensuat

0. Fixar el tall.
1. Registre `.agents/protocolledge.json` + resolutor únic.
2. Reapuntar `matrix.mjs` i `tractor-cens.mjs`.
3. Sincronitzador destructiu (buidar mirall, refer índexs RAG).
4. Corregir REGLA 0 i skills perquè derivin del JSON i enceritin el model local.
5. P3 Nivell Barat (eliminar col·lisions `04_`).
6. Deute de frontmatter estricte per fitxers nous/tocats.
7. Cablejar els hooks per al host real d'Antigravity.
8. P3 Nivell Car (moure plantilles a `03_actuar`).
⏸ React/Preact i memoització-optimització (mantenir consens ahir, executar al final).
