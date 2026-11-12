---
type: document
status: esborrany
description: 'Ordre del Mestre del 09/11 (Pas 6 del pla de l''Onada R13): els 5 punts de l''Onada R15'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_46022a28-c731-4b8b-a2c3-e12b3f8e8988:217902c9-9a0a-41e2-8ccd-d0b408c4a9a1
---
# Pla d'Implementació — Onada R15 diürna: sanejament del kit ec865, Workspace universal (P0-69) i IAIA

**Estat del Pla:** aprovat (ordre directa del Mestre al xat de Claude, 09/11 a les 14:5x)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_46022a28-c731-4b8b-a2c3-e12b3f8e8988:217902c9-9a0a-41e2-8ccd-d0b408c4a9a1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-09T15:23:14.090Z |
| Modificació | 2026-11-09T15:40:00.000Z |
| Propietari | Claude (torn `torn_46022a28`) |
| Aprovació humana | Ordre del Mestre al xat de Claude, 09/11 (Pas 6 del pla de l'Onada R13, arxivat) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, desktop) |
| Tokens consumits | no mesurat |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-11-09T15:23:14.090Z: esborrany creat; contingut i verificació pendents.
2026-11-09T15:40:00Z: pla escrit per Claude a partir de l'ordre del Mestre. Hereta el Pas 6 del pla de l'Onada R13 (arxivat a `90_arxiu_historic/` pel torn `torn_46022a28`).
2026-11-10T01:35:00Z: estat després del COMMIT R15b, del desplegament i del certificat dels canals natius.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context

- **Base:** `backup-notes-publish` = `ec865dcfd` (COMMIT R14), en viu a socdepoble.org (Firebase `d2b5b255cd509d17`) i socdepoble.cat (Node 0, entrada `/assets/index-CNoANKiJ.js`).
- **Kit Unificat de Codex** (`../_investigacio_ia_de_poble/261109_kit_codex_unificat_r13_r55_r14/round3/kit_ec865_unificat_final/`): 714 operacions CAS (191 modificacions i 523 altes). S'aplica net sobre una còpia exacta d'`ec865` i la bateria sencera hi dona 35.624 proves passades i cap fallada.
- **Revisió adversària de l'àrbitre** (5 lents i un escèptic per troballa): el kit, tal com està, **no es pot publicar**. Porta fotos amb GPS i amb drets de tercers, la política 2.6 sense la seua migració, crides a funcions i taules que no existixen, el catàleg de Mercadona dins de la recepta pública i el push natiu sense configuració d'FCM. A més, Codex s'aprova a si mateix quatre claus de la Frontissa.

### 2. Passos de l'ordre

| Pas | Contingut | Estat |
| --- | --- | --- |
| A.a | Kit Unificat `ec865` de Codex, **sanejat** per l'àrbitre: fora les 397 fotos de La Parròquia (només en local, amb `.gitignore` i una guarda de build), política 2.5 fins que s'aplique la migració `2611080440`, capacitats sense servidor (ritme del xat, IAIA amb servidor, despertador) darrere de banderes de build apagades, Mercadona fora de la recepta pública i push natiu apagat sense `google-services.json` | fet: `688f4c2a5` (R15a), en viu des del 09/11 19:02 |
| A.b | `/versions` amb la crònica R13+R14 i les 6 P3 del receptari | fet en còpia, verificat (APTE) |
| A.c | Documentació i governança de l'arbre viu: skills MIT segellades, trasllats de la Porta Olivera, captures ancorades (menys dues amb dades personals), Acta Marmota `261108_1311`, correcció de 6 cites de l'`ESTAT.md` que tomben Doctrina | fet: `9bec76846` i `e0bbb2825` |
| A.d | COMMIT R15a, `git push fork backup-notes-publish`, desplegament a socdepoble.org (Firebase `live`) i socdepoble.cat (Node 0, `rsync` en dues passades i sense `--delete`), sonda de consola | fet: `b1294ecab` en viu (Firebase `e4af4336e8b34ea7`) |
| B | P0-69 / IDEA-200: Herbari, Banc de llavors i Receptes sobre `UniversalWorkspace` + `UniversalCard` (carpetes desplegables, Llista ↔ Rajola, fitxa inline, destins amb `/mur` per defecte); Nevera i Bar amb les mateixes peces dins de la seua closca | fet a R15b (`7bdd232b4`): Herbari, Banc de llavors, Receptes i Fediversity en viu; Nevera i Bar amb les mateixes peces, apagades a producció |
| C.3 | Taula filtrable d'usuaris i dispositius a la 7a card, migració `2611082238` i Nodrir la IAIA amb backend i guarda de rol | parcial a R15b: client del directori emmascarat i migració `2611091500` al repositori, NO aplicada (a producció n'hi ha una altra versió aplicada fora del repositori: decisió del Mestre); Nodrir honest i apagat |
| C.4 | Catàleg assistit dels 14 al·lèrgens UE i escandalls, marcats com a «Proposta assistida · Pendent de validació humana» | fet a R15b: panell públic de la recepta sense falsos negatius sobre les 149 receptes; escandalls només al Bar (apagat) |
| C.5 | Mitjans de receptes sota demanda a l'app nativa i rebuts de Fediversity | passa a l'Onada R16 |
| R15b | Kit fortificat R15.2 de Codex verificat i arreglat en tres rondes; COMMIT R15b en cinc parts (`7bdd232b4` a `01fd75c9c`), pujat i desplegat | fet: Firebase `675bbb7eec945e78` i Node 0, 10/11 02:25 |
| Canals natius (P0-81) | `scripts/botigues/publica-tot.mjs` | certificat: bloquejat per credencials de les botigues, `google-services.json` i `VERSIO_CLIENT_NATIU` (decisió i claus del Mestre) |
| R16 | Arbitratge dels 20 expedients de Gemini (R16-A a R16-T), el super-kit rebasat, el reforç de Codex i el nomenclàtor INE, amb les lleis P0-80 i P0-81 | següent onada |

### [Acció: MODIFY] Kit Unificat de Codex (sanejament)

Banderes de build literals i plegables (`VITE_SDP_XAT_RITME`, `VITE_SDP_IAIA_SERVIDOR`, `VITE_SDP_PUSH_NATIU`, la del Bar i la de la Nevera), apagades a producció. Les migracions del kit entren al repositori **sense aplicar**: les aplica el Mestre, i fins llavors la política continua sent la 2.5.

### [Acció: MODIFY] `.agents/contingut_estructural.json` (Frontissa, per l'executor)

- `legal`: torna a l'empremta de HEAD (2.5).
- `fedivers`, `fediversity` i `node-zero`: nota datada i prudent de Codex sobre l'inventari del codi; s'aproven a nom de l'ordre del Mestre d'aplicar el kit, revisades per Claude i revocables.
- `versions` i `receptes`: noves empremtes de la crònica i de les P3, a nom de l'ordre del Mestre.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Bateria Vitest sencera sobre l'arbre exacte del commit, build de producció amb la configuració real (pressupost d'entrada i cap fitxer `p-<sha>` al `dist`), assaig del hook a un arbre preparat i sonda de consola a la previsualització i als dos llocs en viu.
- `porta-olivera.mjs`, `tractor-cens.mjs` i `tractor-doctrina.mjs` amb eixida 0 al final.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Arbre compartit.** MarIA, Codex i Gemini poden escriure alhora: abans del commit es tornen a comprovar HEAD i els hash de cada camí.
- **Repositori públic.** Cap foto amb GPS o drets de tercers, cap captura amb dades personals i cap dada de sessions entra a l'historial de Git.
- **Pressupost d'entrada.** Amb la configuració real queden uns 3.400 B de marge: el P0-69 va en trossos diferits.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261109_1623_auditoria_claude]]
- [[03_llibre_mestre_tasques_i_idees]]
