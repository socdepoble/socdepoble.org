---
type: prompt
status: actiu
description: "Construcció de la Consola Termodinàmica"
tags: [govern, termodinamica]
---
# Prompt d'Auditoria i Execució (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta.
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923-2 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 21:53 |
| Modificació | 26-09-23 21:53 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:260923:2153 |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Context

Com que sou agents locals, heu de llegir els següents documents abans de començar per comprendre la visió:
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `.agents/skills/consola-termodinamica/SKILL.md` (Les 13 Mètriques Sagrades i definició del cor del Mas)

## Instrucció del torn

Hola, Consell (Claude i Codex). El Mestre ens demana que construïm la **Consola Termodinàmica**, un component essencial per a mesurar la saturació de les IAs i monitorar la salut del projecte abans no perdem el control per l'excés de fitxers o complexitat.

**Propostes d'Implementació a executar:**

1. **Integració a la Wiki de Poble:**
   - La Consola Termodinàmica ha de viure com una pestanya o secció dins del model del Workspace de la Wiki de Poble (actualment a `WikiDePobleSection.jsx`). 
   - Ara mateix el menú de la Wiki mostra "Wiki de Poble" i "Explorador del Cervell". Heu d'afegir-hi un tercer apartat interactiu anomenat "Consola Termodinàmica".

2. **Disseny Visual i Tauler de Comandament:**
   - Heu de crear un nou component per a la Consola (`ConsolaTermodinamica.jsx` o similar).
   - El disseny ha de recuperar l'estètica d'aquell "mapa de punts de tensió" de l'històric: visualment impactant, usant els colors del sistema de Sóc de Poble (Crom) i el sistema de disseny Pedra Seca (caixes, taules de mètriques, etc.).
   - Podeu fer estadístiques amb "barres de progrés" per a mostrar saturació, "nodes de tensió", un panell global, etc.

3. **Evolució de l'Editor de Text (Ideació i Arquitectura):**
   - El Mestre ha establert una nova meta a mitjà termini: l'editor de text de la plataforma ha de ser **"hipervitaminat"**.
   - Hem de poder inserir i incrustar `UniversalCards` i altres components directament dins del text (com a enllaços clicables o blocs interactius).
   - Hem de contemplar un mode d'editor "bàsic" i un mode "supereditor" (o barra expandible) amb opcions avançades, inspirant-nos en Notion, Obsidian o Google Docs, i fins i tot amb capacitat d'exportar com a ePub en el futur.
   - **Tasca d'Arquitectura:** En la vostra auditoria, afegiu un apartat d'ideació i disseny tècnic sobre com podríem refactoritzar l'editor actual (basat en TipTap) per suportar nodes personalitzats (`NodeViews` de TipTap per a les UniversalCards).
   - **Tasca de Codi (LLAVOR DIDÀCTICA):** Modifiqueu la funció que crea notes per defecte (ex. a `NotesSection.jsx`) per tal que el contingut HTML base d'una nota nova incloga una guia didàctica d'estils: `<h3>Subtítol opcional (H3)</h3>`, `<p>Text de paràgraf de prova, pots esborrar-lo...</p>`, i així successivament per a l'H4, H5 i H6, per ensenyar a l'usuari l'estructura jeràrquica.

4. **Les 13 Mètriques Sagrades (Mocks inicials):**
   - El tauler ha de contenir seccions clares per als 4 Blocs de les 13 mètriques definides a la seua SKILL (Cognitiu i Simbiosi, Estructural, Rendiment i Dispositiu, Resiliència).
   - Com que encara no tenim el backend connectat per proveir aquestes dades en temps real, genereu un estat `mock` amb dades versemblants (p.ex., Índex de Trellat al 92%, Càrrega de Tombstones al 40%) per a poder veure i validar la interfície i el layout en local (`import.meta.env.DEV`).

4. **Protecció Superadmin:**
   - Aquesta consola ha d'estar reservada només per als usuaris que entren com a "Sóc de Poble" (el superadmin). Feu que només s'hi pugui accedir si l'usuari té permís de superadmin, o simuleu-ho per a desenvolupament amb una simple flag `isSuperAdmin = true` temporal si no tenim backend.

## Tasques

- [ ] Crear el component visual `ConsolaTermodinamica` amb els 4 blocs de mètriques i gràfics.
- [ ] Connectar el component a `WikiDePobleSection.jsx` com a tercera eina principal.
- [ ] Implementar un mock realista de l'estat per poder dissenyar els indicadors de saturació visualment.
- [ ] Assegurar la protecció d'accés (simulada) per a perfils de Superadmin ("Sóc de Poble").
- [ ] Implementar l'HTML de prova de l'editor de text per a les noves notes.
- [ ] Afegir proposta de disseny i viabilitat tècnica (arquitectura TipTap i NodeViews) per al futur "Supereditor Hipervitaminat" amb suport de Cards.

## Protocol de la Reunió a l’Olivera

1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`.
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Mentre vosaltres auditeu i genereu propostes, jo elaboraré el `Pla d'Implementació`. Cap codi es canviarà fins que tots hàgem validat el Pla d'Implementació. Mode AFK actiu en l'etapa d'auditoria.
4. **Millora Contínua:** Opineu si els mocks d'aquesta eina podrien extraure informació real de l'entorn de Node en lloc de dades fictícies (ex. pes de la carpeta src, o els avisos de Linter actuals).

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
