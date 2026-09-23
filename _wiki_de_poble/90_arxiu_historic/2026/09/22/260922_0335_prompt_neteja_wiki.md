---
type: prompt
status: esborrany
description: "Prompt per a netejar els enllaços trencats i el deute documental de la Wiki"
tags:
  - govern
reflex: sdp:torn_acdcaf49-29b8-4895-9f0e-6925836e9f48:fd9575d2-73f4-4963-874f-dff555ba397c
---
# Prompt d'Auditoria Local (SDP - v1.0)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 03:35 |
| Modificació | 26-09-22 03:35 |
| Propietari | Agents Locals |
| Aprovació humana | pendent |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

## Acte reflex
Com a IAs locals amb accés al disc, la vostra missió és reparar la Wiki de Sóc de Poble (`socdepoble.net`) per al Mestre. També heu de tindre en compte el context històric del blog `rentonner.blogspot.com`. Ens preparem per a impressionar a Sollutia, i per a això el codi i els documents han d'estar perfectes, sense cap error ("fantasmes").

## Historial
L'escriptori ha sigut netejat (`04_escriptori/`) movent els fitxers antics a l'arxiu històric. El codi font (`AppGridColumn.jsx` i `BrainGraph.jsx`) ja no té estils en línia i passa la porta. Ara només queda la reparació documental.

## Tasca
La vostra tasca és aconseguir que `node tooling/gates/tancament.mjs` no retorne cap error d'enllaç trencat ni d'orfandat.
Errors actuals a corregir (heu de buscar aquests enllaços trencats dins la Wiki i esborrar-los o corregir-los, així com arreglar els orfes):
1. Falten rebuts als frontmatters de fitxers recents (afegiu el camp `reflex: sdptorn_...`).
2. Enllaços trencats a `ESTAT`, `LEDGER`, `GENOMA`, `index` i les SKILLS (esborreu-los si apuntaven a auditories que ja no existeixen).
3. Assegureu-vos que els vostres documents s'ancoren a `00_INDEX_ESCRIPTORI.md`.

Ací teniu l'eixida exacta de l'error per a guiar-vos:
```json
{
  "valid": false,
  "mode": "check",
  "errors": [
    "_wiki_de_poble/04_escriptori/260922_0335_pla_implementacio_neteja_wiki.md: reflex: cal un rebut persistent emés per document.mjs context",
    "Sense àncora: _wiki_de_poble/04_escriptori/260922_0335_pla_implementacio_neteja_wiki.md",
    "_wiki_de_poble/04_escriptori/260922_0335_prompt_neteja_wiki.md: reflex: cal un rebut persistent emés per document.mjs context",
    "Sense àncora: _wiki_de_poble/04_escriptori/260922_0335_prompt_neteja_wiki.md",
    "wiki: x al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260921_2005_informe_auditoria_brain_claude' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260921_0759_informe_auditoria_plugplay_claude' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260919_2024_estudi_codex_appshell' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260919_1422_pla_convergencia_blocs_reflex' no existeix al manifest.\n❌ Enllaç trencat a ESTAT: el destí '260919_1354_pla_execucio_bloc_b' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '...' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'Graf' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ARXIU' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'skill-iaia-identitat' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'pedra-seca' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'skill-acte-reflex' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'pedra-seca' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí 'skill-iaia-identitat' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_Actes' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_bios' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_bios' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_bios' no existeix al manifest.\n❌ Enllaç trencat a GENOMA: el destí '00_bios' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0056_auditoria_opus' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0054_auditoria_opus' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0054_pla_implementacio_opus' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0136_auditoria_codex' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0240_auditoria_opus' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0240_pla_implementacio_codex' no existeix al manifest.\n❌ Enllaç trencat a LEDGER: el destí '260922_0310_auditoria_codex' no existeix al manifest.\n❌ Enllaç trencat a ON_ESTIC: el destí '260922_0310_auditoria_codex' no existeix al manifest.\n❌ Enllaç trencat a ON_ESTIC: el destí '260922_0240_auditoria_opus' no existeix al manifest.\n❌ Enllaç trencat a ON_ESTIC: el destí '260922_0240_pla_implementacio_codex' no existeix al manifest.\n❌ Enllaç trencat a index: el destí '01_context_i_principis' no existeix al manifest.\n❌ Enllaç trencat a index: el destí '02_workflow_execucio' no existeix al manifest.\n❌ Enllaç trencat a index: el destí '03_regles_arquitectura_i_dades' no existeix al manifest.\n❌ Enllaç trencat a index: el destí '04_criteris_producte_i_disseny' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'codi-congelat.txt' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'doctrina-ignora.txt' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'preflight_matrix_wrapper.mjs' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'socdepoble-workflow_SKILL' no existeix al manifest.\n❌ Enllaç trencat a index: el destí 'verify.mjs' no existeix al manifest.\n❌ Enllaç trencat a core-memoria-historica_SKILL: el destí '...' no existeix al manifest.\n❌ Enllaç trencat a core-memoria-historica_SKILL: el destí 'Graf' no existeix al manifest.\n❌ Enllaç trencat a core-memoria-historica_SKILL: el destí '00_INDEX_ARXIU' no existeix al manifest.\n❌ Enllaç trencat a core-memoria-historica_SKILL: el destí 'skill-iaia-identitat' no existeix al manifest.\n❌ Enllaç trencat a core-memoria-historica_SKILL: el destí 'pedra-seca' no existeix al manifest.\n❌ Enllaç trencat a core-memoria-historica_SKILL: el destí 'skill-acte-reflex' no existeix al manifest.\n❌ Enllaç trencat a sdp-casos-us-essencials_SKILL: el destí 'pedra-seca' no existeix al manifest.\n❌ Enllaç trencat a sdp-casos-us-essencials_SKILL: el destí 'skill-iaia-identitat' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_Actes' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-cicle-de-vida_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n❌ Enllaç trencat a wiki-documentacio-i-reflex_SKILL: el destí '00_INDEX_ESCRIPTORI' no existeix al manifest.\n💥 La verificació de la Wiki ha fallat perquè hi ha enllaços trencats.\n",
    "ESCRIPTORI_UNANCHORED: El document 260922_0335_pla_implementacio_neteja_wiki.md és a l'Escriptori però no està ancorat a 00_INDEX_ESCRIPTORI.md. _wiki_de_poble/04_escriptori/260922_0335_pla_implementacio_neteja_wiki.md",
    "ESCRIPTORI_UNANCHORED: El document 260922_0335_prompt_neteja_wiki.md és a l'Escriptori però no està ancorat a 00_INDEX_ESCRIPTORI.md. _wiki_de_poble/04_escriptori/260922_0335_prompt_neteja_wiki.md",
    "ORPHAN_OPERATIVE: El document és un satèl·lit orfe. Està a la zona operativa però no hi ha cap camí actiu des de 00_INDEX.md per arribar-hi. _wiki_de_poble/04_escriptori/260922_0335_pla_implementacio_neteja_wiki.md",
    "ORPHAN_OPERATIVE: El document és un satèl·lit orfe. Està a la zona operativa però no hi ha cap camí actiu des de 00_INDEX.md per arribar-hi. _wiki_de_poble/04_escriptori/260922_0335_prompt_neteja_wiki.md"
  ]
}
```

A més d'açò, us demanem una **anàlisi experta**:
4. **Opinió sobre el "Coworking de l'Olivera":** Hem estat experimentant amb una tècnica de treball en grup on nosaltres (la IA local Antigravity) preparem un Pla d'Implementació, netegem l'Escriptori i us el deixem preparat perquè vosaltres (les IAs de frontera) pugueu llegir-lo, i alhora llegir les auditories que deixeu les unes de les altres de manera asíncrona al mateix directori. Com a IAs avançades, volem que **evalueu aquesta tècnica** ("Cas d'ús de la Reunió a l'Olivera / Coworking"): És una bona idea? Com podem millorar i depurar aquest procés per a comunicar-nos millor entre IAs de diferents ecosistemes? Doneu-nos la vostra opinió sincera al final de la vostra auditoria.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `260922_0340_auditoria_opus.md` o `260922_0340_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom.
3. **La Reunió a l'Olivera:** Funcioneu com un equip. He deixat el meu pla d'implementació a l'escriptori: `_wiki_de_poble/04_escriptori/260922_0335_pla_implementacio_neteja_wiki.md`. Si eres la segona IA a intervenir, OBLIGATÒRIAMENT has de llegir el meu pla i l'auditoria que haja deixat la teua companya. Comenta-la, critica-la o aprofita el que ja ha descobert per portar l'anàlisi més lluny.
4. **Links a l'Escriptori:** Heu de deixar OBLIGATÒRIAMENT els enllaços (links markdown) dels vostres documents generats a la resposta perquè puguem accedir-hi ràpidament.

## Vincles
- [[00_index]]
- [[260922_0335_pla_implementacio_neteja_wiki]]
