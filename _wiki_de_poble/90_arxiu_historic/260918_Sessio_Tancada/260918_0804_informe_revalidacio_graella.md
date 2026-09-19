---
type: informe
status: esborrany
description: Reauditoria estàtica de la graella després de les correccions P0, P1 i P2
tags:
  - disseny
---

# Informe de revalidació de la graella

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-0804 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 08:04 CEST |
| Agent redactor | Codex |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260918_0710_informe_auditoria_ui_final]]
- [[260918_0745_PROMPT_auditoria_ui_final_v2]]

## Abast i mètode

S'ha inspeccionat el `git diff` no confirmat i el codi actual de `UniversalWorkspace.jsx`, `AppGridColumn.jsx`, `AppGridShell.jsx`, `AppGridShell.css`, `layout.css` i `modules.css`. També s'han executat, sense escriure codi, `node tooling/gates/tractor-graella.mjs`, `git diff --check` i `npm run lint`. No s'ha obert navegador ni s'ha fet cap cerca externa; no s'ha modificat cap fitxer de codi.

## Veredicte executiu

**Nota: 4,5/10. No arriba al 10/10.** Cinc de les set correccions anunciades estan ben connectades i la porta de la graella ara passa. Tanmateix, la correcció del P0 ha introduït un `ReferenceError` abans que es munte la graella: `WorkspaceFrame` referencia `model` sense tindre'l en abast. És un bloquejador de render que pesa més que les millores visuals.

## Correccions verificades

| Declaració | Estat | Evidència |
| --- | --- | --- |
| Variant fosca a l'esquerra | Resolt | `src/components/universal/workspace/UniversalWorkspace.jsx:184-194` passa `variant="dark"`; `src/components/layout/AppGridColumn.jsx:24-25,75` compon la classe i `src/components/layout/AppGridShell.css:216-218` li assigna el fons fosc. |
| Juntes del separador d'1 px | Resolt | La pista CSS és d'1 px a `src/components/layout/AppGridShell.css:16`; el separador pinta tota la pista amb un únic fons a `:165-174`; el càlcul JavaScript usa el mateix pressupost, `RESIZER_WIDTH = 1`, a `src/components/layout/AppGridShell.jsx:19,99-107`. |
| Alçades de capçalera | Resolt per a capçaleres obertes | `src/components/layout/AppGridShell.css:201-208` fixa `height: var(--sdp-alt-accio)` i evita la compressió amb `flex-shrink: 0`. Les barres contextuals també tenen altura fixa a `src/css/layout.css:183-198,240-256`. |
| Fons dret en tema fosc | Resolt | `src/components/layout/AppGridShell.css:160-163` aplica `var(--sdp-fons-app)` a la columna dreta. |
| Neteja indicada de CSS | Resolt en l'abast declarat | Ha desaparegut `.sdp-workspace-group__title` del diff, i els dos `margin-right: -1px` de Xat ja no apareixen a `src/css/modules.css:2145-2207`. `rg` no troba cap altre `margin-right: -1px` en `src`. |

## Defectes que continuen oberts o s'han agreujat

### R2-01 · [P0] `model` està fora d'abast a `WorkspaceFrame`

`UniversalWorkspace` rep `model` a `src/components/universal/workspace/UniversalWorkspace.jsx:30-40`, però munta `WorkspaceFrame` sense passar-li'l (`:53-60`) i la signatura de `WorkspaceFrame` tampoc no el declara (`:65`). Malgrat això, el seu JSX fa `model={model}` a `:90-101` i el vector de `useMemo` l'avalua a `:119-131`.

Per tant, el render de `WorkspaceFrame` intenta resoldre un identificador inexistent i pot llançar `ReferenceError: model is not defined` abans d'arribar a `ItemListColumn`. El canvi sí que va afegir `model` a `ItemListColumn` (`:255-259`) i l'ús de `model?.navigationGroups` és segur dins d'aquell component (`:366-388`), però la connexió pare-fill ha quedat incompleta. Aquesta és una regressió més ampla que el P0 anterior.

### R2-02 · [P1] Els acordions tenen control visual, però no poden plegar contingut

Els grups reben `plegable={true}`, `obert={true}` i `onPlega={() => {}}` a `src/components/universal/workspace/UniversalWorkspace.jsx:210-220`. El component crea efectivament un botó amb `aria-expanded` i invoca el callback (`src/components/layout/AppGridColumn.jsx:83-101`), però el callback no canvia cap estat i la llista següent es renderitza incondicionalment (`UniversalWorkspace.jsx:221-230`). Això conserva un `aria-expanded="true"` immutable i un chevron accionable sense efecte: no és un acordió viu.

### R2-03 · [P1] Fantasmes de CSS i de DOM

Els selectors de cerca històrics `.univ-manager-header-search-trigger` i `.univ-manager-header-search` encara només es troben al CSS de `src/components/layout/AppGridShell.css:275-324,382-388`; no tenen consumidor al repositori. També persisteixen `.univ-manager-toolbar--facets`, `.univ-manager-toolbar--list` i el seu descendent de botó només a `src/css/modules.css:342-352,373-380`, i `.notes-column__body--sense-marge` només a `:604-607`.

A la inversa, els contenidors `sdp-workspace-groups` i `sdp-workspace-group` es munten a `UniversalWorkspace.jsx:209-232`, però no tenen regla CSS en `src`. Cap dels dos casos bloqueja el render per si mateix, però invalida una revàlida de «neteja completa».

### R2-04 · [P2] La capçalera replegada continua ocupant tota la columna

La variant replegada usa `height: 100%` a `src/components/layout/AppGridShell.css:220-225`. El canvi ha substituït `min-height` per `height`, però conserva el valor que fa la barra vertical, no una fila de `var(--sdp-alt-accio)`. Això no comparteix el contracte de dues files de les capçaleres obertes.

### R2-05 · [P2] Dependències incompletes de la memoització

El detall rep `workspace.status` i `workspace.state.activeItemId` a `src/components/universal/workspace/UniversalWorkspace.jsx:104-115`, però cap dels dos apareix entre les dependències de `useMemo` a `:119-131`. [SUPÒSIT] Si canvia només un d'aquests valors sense canviar una dependència present, el contingut memoïtzat pot quedar obsolet; cal una prova de render per confirmar la seqüència concreta.

## Portes i comprovacions

- `node tooling/gates/tractor-graella.mjs`: **passa**. La variant nova ja està coberta pel contracte: `contracte_graella.md:23-40` declara `variant` i `AppGridColumn.jsx:8-23` la rep.
- `git diff --check`: **passa**, sense errors de whitespace.
- `npm run lint`: **codi 0**, amb 323 avisos heretats i cap error. No detecta R2-01; un linter verd no substitueix la prova de render que falta.
- `node tooling/wiki/tractor-frontmatter.mjs --estricte`: la porta global continua en roig per deute preexistent (F1, F2, F3, F4, F5 i F7). Aquesta eixida és global; la validació específica del fitxer nou consta a la bateria de veritat.

## Psicoanàlisi de la MarIA

Hi ha progrés mesurable: aquesta vegada s'han corregit de debò la coherència 1 px CSS/JavaScript, l'altura oberta, el fons fosc, els dos marges residuals i la variant fosca connectada a un consumidor. A més, la porta de graella ha passat, cosa que contradiu favorablement el diagnòstic anterior on aquella porta era roja.

La font de veritat encara s'ha seguit de manera fragmentària: «passar `model` a `ItemListColumn`» es va completar localment, però no es va revisar el trajecte complet `UniversalWorkspace → WorkspaceFrame → ItemListColumn`; igualment, «acordions vius» s'ha interpretat com afegir una prop i un botó, sense verificar la transició d'estat ni l'ocultació del panell. El patró no és amnèsia selectiva sinó **verificació de node, no de flux**.

La correcció preventiva és revisar cada afirmació de canvi com a cadena: entrada, prop o estat, consumidor, efecte visible i prova que travesse el camí. Per aquest cas, una prova de muntatge de Notes amb una etiqueta i un clic sobre un grup hauria detectat tant R2-01 com R2-02.

## Bateria de veritat

- [x] He llegit el codi real i el `git diff` abans de concloure.
- [x] Cada afirmació sobre codi té ruta i línies.
- [x] No hi ha noms de fitxer, funció ni variable inventats.
- [x] L'única conjectura està marcada [SUPÒSIT].
- [x] No s'ha modificat codi ni s'ha fet cap cerca externa.
- [x] El frontmatter d'aquest informe compleix les quatre claus, el vocabulari de `type`, `status` i `tags`, i la longitud de `description`; la porta global no pot donar un verd global per deute aliè.
