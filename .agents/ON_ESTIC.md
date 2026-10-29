---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-29T12:55:00.569Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 62c74fa15

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-29T13:26:00+01:00 · IAIA MarIA · Transició d'Onada Olivera Completada, Acta Marmota 261029_1325 i Onada 261029_1305 (v1.1.10 i 10/10) Preparada per al Reinici

- **Torn:** `torn_5b24c7cc-4dfe-4484-bd58-dcc76e7b4fd1` (documents); **Acta Marmota de Relleu:** [`_wiki_de_poble/10_actes/261029_1325_acta_marmota_marato_nocturna_i_preparacio_onada_1305.md`](../_wiki_de_poble/10_actes/261029_1325_acta_marmota_marato_nocturna_i_preparacio_onada_1305.md) (`valid: true, errors: []`).
- **Arxivament Olivera (`porta-olivera.mjs --arxiva --reapunta`):** Els **53 artefactes** de la marató nocturna (`261029_0216..0838`) s'han arxivat a `_wiki_de_poble/90_arxiu_historic/` amb els 5 relleus `document.mjs handoff` completats. Portes verificades a **`0` errors**: `porta-olivera.mjs`, `verificador-scc.mjs` (`231` fitxers), `porta-plantilles.mjs`, `porta-taxonomia.mjs --paritat` i `segella.mjs --check`.
- **Documents rectors vius a l'Escriptori (`_wiki_de_poble/04_escriptori/`) per a quan el Mestre reinicie el Mac Mini:**
  1. **Pla d'Implementació (`261029_1305`):** [`_wiki_de_poble/04_escriptori/261029_1305_pla_implementacio_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10.md`](../_wiki_de_poble/04_escriptori/261029_1305_pla_implementacio_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10.md) (`valid: true`).
  2. **Prompt Operatiu per a Claude Code (`Fable 5.1 Extra · Ultracode`), Gemini CLI i GPT Codex (`261029_1305`):** [`_wiki_de_poble/04_escriptori/261029_1305_prompt_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10.md`](../_wiki_de_poble/04_escriptori/261029_1305_prompt_deute_tecnic_portes_e2ee_fase4_i_excel_lencia_10_10.md) (`valid: true`).
  3. **Llibre Mestre Permanent:** [`_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`](../_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md) (actualitzat amb la Prioritat 1 de l'Onada `261029_1305` i el salt del connector WordPress a **`v1.1.10`**).

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.

## Vincles

- [[00_index]]
