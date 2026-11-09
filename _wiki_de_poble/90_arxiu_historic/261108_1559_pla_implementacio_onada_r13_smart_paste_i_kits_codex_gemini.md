---
type: document
status: esborrany
description: 'Ordre del Mestre posterior al reinici del 08/11: commit i desplegament de R51, sèrie fresca, Smart Paste a /notes i integració per CAS dels kits'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_1029e939-b6d3-4f63-9b4b-77d02bb8076f:1b0cff76-417a-4e00-a707-12717b8bcf4c
---
# Pla d'Implementació — Onada R13 post-reinici: R51 tancada, producció, Smart Paste (P0-58) i kits de Codex i Gemini

**Estat del Pla:** aprovat (ordre directa del Mestre, 08/11 després del reinici de les 15:06)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1029e939-b6d3-4f63-9b4b-77d02bb8076f:1b0cff76-417a-4e00-a707-12717b8bcf4c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-08T15:00:16.426Z |
| Modificació | 2026-11-08T15:05:00.000Z |
| Propietari | Claude (torn `torn_1029e939`) |
| Aprovació humana | Ordre del Mestre al xat de Claude, 08/11 (posterior a les 15:06) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code, desktop) |
| Tokens consumits | no mesurat |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-11-08T15:00:16.426Z: esborrany creat; contingut i verificació pendents.
2026-11-08T15:05:00Z: pla escrit per Claude a partir de l'ordre del Mestre; els passos 1 a 3 ja estan fets i verificats (vegeu l'informe germà).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i troballes

- Base de partida: `backup-notes-publish` = `006b487d5` (COMMIT R53). Producció servia `71e75c518`.
- El reinici del Mac (15:06) va buidar `/private/tmp`. MarIA va salvar el treball de Claude a `_investigacio_ia_de_poble/261108_salvaguarda_pre_reinici_claude_r12g/`.
- El Llibre Mestre registra P0-58 / IDEA-189 (l. 461) amb la captura `01_produccio/261108_1406_captura_notes_enganxar_text_brut_h1_entradilla_cos_netejar_format.jpg`.
- Kits pendents: Codex R54 (segellat), R55 (segellat, CAS atòmic sobre `b41640cbb`), R56 (sense segell en el moment del reinici) a `_investigacio_ia_de_poble/`; Gemini R161–R220 a `02_investigacio_ia/261108_marato_r12_gemini_fediversity_100/`.

### 2. Preguntes obertes (per al Mestre)

- D-R51-8: on es guarda el `translation_mode` quan es republica des d'un altre dispositiu.
- Pressupost d'entrada: després del desplegament de `a948fcb0f` queden 8 B de marge sota el sostre de 250.000 B. Tot codi nou de P0-58 o dels kits ha d'anar en trossos diferits, o cal una decisió sobre el sostre.

### 3. Passos de l'ordre

| Pas | Contingut | Estat |
| --- | --- | --- |
| 1 | Aplicar `r12g` (36 fitxers) sobre `006b487d5`, verificar, commit i push | FET: `a948fcb0f`, pujat |
| 2 | Desplegar fins al nou HEAD a socdepoble.org (Firebase `live`) i socdepoble.cat (Node 0, rsync en dues passades, sense `--delete`), i sonda de consola | FET: Firebase `825f0d4ae5681d10`, Node 0, sonda 0 errors |
| 3 | Actualitzar l'informe final, tancar `torn_9db8dcac`, arxivar la sèrie `261106_0146_*` amb la Porta Olivera, obrir un torn nou d'avui i deixar Olivera, Cens i Doctrina amb eixida 0 | FET (vegeu Verificació) |
| 4a | P0-58 / IDEA-189: Smart Paste Pedra Seca a `/notes` (camps plans de títol, subtítol i entradilla; autodistribució; cos TipTap amb HTML i Markdown) | FET a la còpia candidata R13 (`249.687 B gzip`, 106/106 proves) |
| 4b | Integrar per CAS els kits de R13 (`P0-58..P0-63` + **7a Card `👥 Usuaris, Dispositius i Botigues`**) + commit R13 + deploy a `socdepoble.org` i `socdepoble.cat` | FET: `c074d6abf` desplegat en viu (`23:47 CET`) |
| 5 | **Fase Nocturna R14 (`P0-65` Receptari literal *«Què dinem?»* + Kit Unificat `ec865` de Codex + Auditoria `Lighthouse 100/100`):** **(5a)** `COMMIT R14 ec865dcfd` desplegat en viu per Claude (`02:15 CET`: 149 receptes literals, 148 WebP, 47 vídeos, `249.912 B gzip`); **(5b)** Kit Unificat `ec865 + R54/R55/R56 + Mercadona 592 + La Parròquia 564` segellat per Codex (`05:00 CET`: 714 operacions CAS, `35.624 PASS / 0 FAIL`, entrada a `246.580 B gzip`, `Lighthouse 100/100` a 375/768/1440 px). | FET i segellat (`02:15–05:00 CET`) |
| 6 | **Onada R15 Diürna — Execució dels 5 Punts Aprovats pel Mestre (`09/11 14:26 CET`):** **(6.1)** Aplicar a l'arbre viu sobre `HEAD ec865dcfd` el Kit Unificat `ec865` de Codex (`round3/kit_ec865_unificat_final/`, 714 operacions CAS, `246.580 B gzip`) + pegat de `/versions` (`versions_r13_r14_pendent.patch`), comitar (`COMMIT R15a`) i desplegar en viu a `socdepoble.org` i `socdepoble.cat`; **(6.2)** Culminar `P0-69` (`UniversalWorkspace` + `UniversalCard` per a Llavors, Plantes/Herbari, Rebost, TPV, Receptes i Articles), corregint primer el retall CSS a `375px` de la fitxa d'`HerbariWorkspaceSection` (`sdp_p069_herbari_root_proposal.md`) i integrant el selector desplegable de pàgines de destinació (`P0-59`); **(6.3)** Taula filtrable per usuari/dispositiu a la 7a Card + migració `2611082238` + migracions IAIA/Push (`2611080430..0440`) + backend amb RLS i rol de curadoria per a `/page/nodrir-la-iaia` (`P0-64`); **(6.4)** Catàleg assistit i verificable d'escandalls i dels 14 al·lèrgens UE (`• Ingredient` vs `T Traça`) per a *La Parròquia* i *Què dinem?* marcat com a *«Proposta assistida · Pendent de validació humana»* (zero falsos negatius); **(6.5)** Empaquetat natiu `v1.1.0` (`@capacitor/push-notifications@8.1.3` + login natiu `P0-63` + mitjans de receptes sota demanda sense engreixar `9,7 MB` l'app) i acreditació física final de `Fediversity 100%+` al Node 0 (`Nix`, ActivityPub, WP `1.1.12`). | En execució (`14:27 CET`) |

### [Acció: MODIFY] `src/components/universal/UniversalEditorShell.jsx`

`EditableField`: gestor `onPaste` que neteja l'HTML extern i inserix text net al cursor (títol i subtítol d'una línia; entradilla sense `<code>` ni mides alienes). Autodistribució d'un bloc sencer enganxat sobre el títol d'una nota buida.

### [Acció: MODIFY] `src/components/universal/richText/extensions/index.js` i `useUniversalRichText.js`

Neteja del porta-retalls al cos: fora `style`, `class`, `span`, `font` i embolcalls; `<code>https://…</code>` → enllaç; `<h1>` intern → `<h2>`; conservar `<strong>`, `<em>`, `<h2>`–`<h4>`, llistes, cites i enllaços; Markdown quan el porta-retalls només porta text pla. Es preserva el contracte P1-64 de les imatges.

### [Acció: MODIFY] Kits

Cada kit passa per triatge de només lectura (base, solapaments amb HEAD, banderes roges), després per CAS o fusió a tres bandes en una còpia aïllada, i només entra al viu el que passa la bateria i les portes. Res de migracions remotes ni de canvis a `package.json` sense ordre del Mestre.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Passos 1 i 2: Vitest sencer sobre l'arbre exacte (34.579/0), assaig del hook, build, previsualització, sonda de producció als dos orígens.
- Pas 3: `porta-olivera.mjs`, `tractor-cens.mjs` i `tractor-doctrina.mjs` amb eixida 0 al final.
- Pas 4: proves noves de P0-58, Vitest sencer en còpia congelada, build amb pressupost, cens de portes en arbre preparat i sonda al navegador abans de cap commit.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Marge d'entrada de 8 B: qualsevol import estàtic nou a l'entrada trenca el sostre.
- Els kits es van construir sobre bases anteriors (`b41640cbb`, `881ced87e`): les seues precondicions CAS poden fallar contra `a948fcb0f`.
- Arbre compartit: MarIA, Codex i Gemini poden escriure al mateix temps. Abans de cada commit es comprova HEAD i l'estat dels camins.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261108_1559_auditoria_claude]]
- [[03_llibre_mestre_tasques_i_idees]]
