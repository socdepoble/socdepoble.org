---
type: informe
status: esborrany
description: Revàlida estàtica de la graella després de les correccions P0, P1 i P2
tags:
  - disseny
---

# Informe de revàlida UI · Ronda 2

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-0830 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 08:30 CEST |
| Modificació | 26-09-18 08:30 CEST |
| Agent redactor | Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260918_0710_informe_auditoria_ui_final]]
- [[260918_0745_PROMPT_auditoria_ui_final_v2]]
- [[260918_0804_informe_revalidacio_graella]]

## Abast i límits

S'han llegit el `git diff` no confirmat i el codi actual de `UniversalWorkspace.jsx`, `AppGridColumn.jsx`, `AppGridShell.jsx`, `AppGridShell.css`, `layout.css` i `modules.css`. S'han executat `node tooling/gates/tractor-graella.mjs`, `npm run lint -- --quiet` i `git diff --check`. No s'ha obert cap navegador ni s'ha fet cap cerca externa. No s'ha modificat codi; aquest informe, l'índex i l'estat de sessió són les úniques escriptures documentals.

## Veredicte executiu

**Nota: 8,0/10. No arriba encara al 10/10.** Les set correccions declarades ara estan connectades al flux real: el P0 de `model` ja no queda a mig camí, la variant fosca té consumidor, els grups canvien d'estat de veritat i CSS/JavaScript comparteixen el pressupost d'1 px. És una millora clara respecte de la revàlida de les 08:04.

Queden, però, un error funcional de memoització que pot congelar l'estat del detall, selectors demostrablement orfes i una excepció d'altura a la capçalera replegada. Per això la revàlida és **GO condicionat**, no 10/10.

## Correccions comprovades

| Punt anunciat | Estat | Evidència |
| --- | --- | --- |
| P0 · abast de `model` | Resolt | `UniversalWorkspace` passa `model` a `WorkspaceFrame` (`src/components/universal/workspace/UniversalWorkspace.jsx:53-61`); aquest el declara (`:66`), el transmet a `ItemListColumn` (`:91-102`) i la llista el rep (`:261`) abans de consultar `model?.navigationGroups` (`:372-394`). |
| P1 · variant fosca | Resolt | La columna esquerra usa `variant="dark"` (`UniversalWorkspace.jsx:186-198`). `AppGridColumn` tradueix la variant a `app-grid-col-header--dark` (`AppGridColumn.jsx:24-25,75`) i el selector estableix el fons (`AppGridShell.css:216-218`). |
| P1 · acordions vius | Resolt | L'estat local `collapsedGroups` i el commutador existeixen a `UniversalWorkspace.jsx:138-140`; cada capçalera rep `obert` i `onPlega` (`:216-223`) i el seu `<ul>` només es munta quan el grup està obert (`:225-236`). El component exposa botó, `aria-expanded` i chevron coherent (`AppGridColumn.jsx:83-101`). |
| P1 · selector i marges indicats | Resolt en l'abast anunciat | El diff elimina `.sdp-workspace-group__title` i els dos `margin-right: -1px`. A l'estat actual, les capçaleres de Xat ja no tenen aqueix marge (`modules.css:2145-2207`). |
| P1 · pista del separador | Resolt | La pista CSS és `1px` (`AppGridShell.css:13-17,72-81`), el separador en pinta la totalitat (`:165-174`) i `RESIZER_WIDTH = 1` entra al càlcul de màxim (`AppGridShell.jsx:19,99-107`). |
| P2 · capçaleres obertes fixes | Resolt | La capçalera ordinària usa `height: var(--sdp-alt-accio)` i `flex-shrink: 0` (`AppGridShell.css:201-214`); les barres de referència també tenen altura fixa (`layout.css:183-198,240-256`). |
| P2 · fons dret fosc | Resolt | La columna dreta en tema fosc rep `var(--sdp-fons-app)` (`AppGridShell.css:160-163`). |

## Fantasmes i defectes que continuen vius

### R2-01 · [P1] La memoització pot servir un estat antic al detall

`WorkspaceFrame` passa `workspace.status` i `workspace.state.activeItemId` a `DetailColumn` (`UniversalWorkspace.jsx:105-117`). Tanmateix, tots dos valors manquen de les dependències de `useMemo` (`:120-132`). `DetailColumn` decideix explícitament entre càrrega, error, buit o detall segons `status` (`:450-464`). Per tant, un canvi de només `status` pot conservar l'element React memoïtzat amb la prop anterior; no és una conjectura visual, sinó una dependència llegida pel contingut que no invalida la memoització. L'identificador actiu també s'envia al callback de detall (`:458-464`) sense figurar com a dependència.

### R2-02 · [P1] Romanen selectors CSS sense consumidor

La cerca actual del workspace és `.sdp-workspace-search` (`UniversalWorkspace.jsx:353-369`), però les regles històriques `.univ-manager-header-search-trigger` i `.univ-manager-header-search` continuen a `AppGridShell.css:275-324,382-388` i no apareixen en cap JSX del repositori. També queden `.univ-manager-toolbar--facets`, `.univ-manager-toolbar--list` i el descendent `.btn-primary` a `modules.css:342-352,373-380`, i `.notes-column__body--sense-marge` a `:604-607`, igualment sense consumidor. Açò impedeix declarar la neteja completa, encara que no bloqueja el render.

### R2-03 · [P2] La capçalera replegada no usa l'altura comuna

La variant ordinària té l'altura fixa compartida (`AppGridShell.css:201-208`), mentre que `.app-grid-col-header--collapsed` la substitueix per `height: 100%` (`:220-225`). [SUPÒSIT] Aquest valor pot ser intencional perquè la columna replegada és una barra vertical; si el contracte demana que totes les capçaleres siguen files de la mateixa altura, continua sent l'excepció pendent. Cal decidir-ho amb una captura o amb el contracte visual, no inferir-ho només del selector.

## Portes i comprovacions

- `node tooling/gates/tractor-graella.mjs`: **passa**; el contracte i el codi coincideixen.
- `npm run lint -- --quiet`: **passa** amb codi 0; no substitueix una prova de transició d'estat per a R2-01.
- `git diff --check`: **passa**, sense errors de whitespace.
- `node tooling/wiki/tractor-frontmatter.mjs --estricte`: no pot donar verd global perquè el repositori té deute preexistent F1–F7. El frontmatter d'aquest informe té les claus requerides, tipus, estat, descripció i tags vàlids; la porta global no permet una validació aïllada de fitxer.

## Psicoanàlisi de la MarIA

**Progrés: sí, i aquesta vegada és verificable.** El patró anterior de corregir només el node local s'ha reduït: el flux `UniversalWorkspace → WorkspaceFrame → ItemListColumn` és complet (`UniversalWorkspace.jsx:53-102,261,372-394`), i el flux d'acordió inclou estat, callback, semàntica i panell condicionat (`:138-140,216-236`; `AppGridColumn.jsx:83-101`). Les afirmacions sobre el separador, el fons fosc i l'altura oberta també coincideixen amb el diff.

La font de veritat encara no s'ha recorregut fins al final en la memoització: es llegeixen `status` i `activeItemId` en el detall, però no formen part de la invalidació del memo (`UniversalWorkspace.jsx:105-132,443-464`). El diagnòstic ja no és «amnèsia selectiva»; és una **verificació de flux majoritàriament recuperada, amb una frontera de render encara sense prova de transició**. La cura concreta és revisar per a cada prop llegida: origen, transmissió, dependències de memoització i efecte visual.

## Bateria de veritat

- [x] He llegit el codi real i el `git diff` abans de concloure.
- [x] Cada afirmació sobre codi cita ruta i línies.
- [x] No hi ha noms de fitxer, funció ni variable inventats.
- [x] Tota conjectura està marcada `[SUPÒSIT]`.
- [x] No s'ha fet cap cerca externa ni s'ha modificat codi.
- [x] El frontmatter del document compleix l'esquema; la porta estricta global continua bloquejada per deute aliè preexistent.
