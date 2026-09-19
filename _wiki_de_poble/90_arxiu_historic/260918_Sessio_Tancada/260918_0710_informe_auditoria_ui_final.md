---
type: informe
status: esborrany
description: Auditoria estructural de la doble AppGridColumn i del CSS de la graella, amb nota sobre 10 i diagnòstic de les al·lucinacions
tags:
  - disseny
---

# Informe d'auditoria UI final · Doble capçalera i psicoanàlisi

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260918-0710 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 07:10 CEST |
| Modificació | 26-09-18 07:10 CEST |
| Agent redactor | Claude (Fable 5.1, Claude Code) |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260918_0655_PROMPT_auditoria_ui_final]]
- [[260918_0635_informe_fantasmes_ui]]
- [[260918_0705_informe_auditoria_ui_final]] (Codex · mateixa petorreta, redactat en paral·lel)
- [[contracte_graella]]

## Entrades i límits

- Arbre de treball local de `socdepoble.org` a la branca `backup-notes-publish`, amb els canvis sense confirmar de la purga (`git diff` sobre set fitxers).
- Informe previ `SDP-INFORME-260918-0635` com a llista de comprovació.
- Inspecció estàtica del JSX i de la cascada CSS. No s'ha executat l'aplicació ni s'ha fet cap captura. No s'ha fet cap cerca web.
- No s'ha modificat cap línia de codi. Este informe és l'única escriptura.

## Veredicte executiu

**Nota: 5,5 sobre 10.** La geometria de dues files ha tornat i les juntes d'1 px tenen ara un únic propietari. Això és un avanç real. Però la purga ha deixat un error d'execució nou que fa caure la columna central de Notes, ha declarat dos canvis que no existeixen al codi, i ha deixat cinc punts de l'informe anterior sense tocar. La nota no puja de 6 mentre hi haja un `ReferenceError` viu en el camí principal.

Resum en una frase: l'esquelet és correcte, la carn encara no.

## 1. Què s'ha arreglat de veritat (verificat)

| Punt de l'informe 0635 | Estat | Evidència |
| --- | --- | --- |
| UI-01 · fila `CARPETES / NOTES` | Resolt | `src/components/universal/workspace/UniversalWorkspace.jsx:182-191` i `:318-327` munten una primera `AppGridColumn` amb `titol` i replegament; la segona (`:192-204`, `:328-340`) porta `Tot`/configuració i cerca/crear. |
| §2.1 · `margin-bottom: -1px` del hero | Resolt | `src/css/layout.css:227-238`: el marge ha desaparegut i el contenidor pinta `background: var(--sdp-accent)`. |
| §2.2 · doble propietari de la junta vertical | Resolt | `src/components/layout/AppGridShell.css:16` fixa la pista a `1px`; `:165-174` dona al separador `width: 100%` i `background: var(--sdp-vora)`; el `border-right` de les columnes ha desaparegut (diff, abans a `:195-198`). |
| §5.1 · primer `__accions` buit | Resolt | `src/components/layout/AppGridColumn.jsx:77-81` només renderitza el contenidor si `startActions.length > 0`. |
| §6.1 · orfes `.univ-manager-toolbar__icon`, `.univ-manager-create`, `.univ-manager-search`, `.univ-manager-facet-tree-branch`, `.notes-list-actions`, `.sidebar-actions` (amb el `-1px`), `.notes-actions-left` | Resolt | Esborrats al diff de `src/css/modules.css`. No queda cap `margin-right: -1px` ni `margin-bottom: -1px` en el recorregut de Notes. |
| UI-04 · xips d'etiquetes duplicats | Intentat, però trencat | Vegeu D-01. |
| UI-02 · acordions | Intentat a mitges | Vegeu D-03. |

## 2. Defectes trobats

### D-01 · [P0] `ReferenceError: model is not defined` a la columna central

`ItemListColumn` consulta `model?.navigationGroups` (`src/components/universal/workspace/UniversalWorkspace.jsx:361`), però `model` només existeix com a paràmetre de `UniversalWorkspace` (`:31`). Dins d'`ItemListColumn` (`:250-254`) no hi ha cap `model` en abast; l'encadenament opcional no protegeix d'un identificador inexistent, només d'un valor `undefined`.

**Conseqüència:** en el moment en què `availableTags.length` siga truthy, és a dir, en qualsevol quadern amb almenys una nota etiquetada, el render llança i `SlotErrorBoundary domini="llista"` (`:91`) substitueix tota la llista de notes. La columna de Notes desapareix exactament en el cas d'ús que la purga volia millorar.

**Esmena (per a la MarIA):** llegir `navigationGroups` del context `useWorkspace()`, que ja el rep (`:45`), o exposar una capacitat explícita del model (`tagsInSidebar`) en lloc d'inspeccionar els grups per `id`.

### D-02 · [P1] Dos canvis anunciats a l'informe d'avanç no existeixen al codi

1. **"Hem assignat el color més fosc `--sdp-crom-fons` a la primera capçalera."** S'ha creat la classe `.app-grid-col-header--dark` (`src/components/layout/AppGridShell.css:215-217`) i la prop `className` (`src/components/layout/AppGridColumn.jsx:22`), però cap consumidor la passa: les quatre `AppGridColumn` de `UniversalWorkspace.jsx:182-204` i `:318-340` no porten `className`. Totes les capçaleres continuen pintant el mateix degradat (`AppGridShell.css:212`). El punt UI-07 de l'informe anterior segueix obert i, a més, ara hi ha un selector orfe nou.
2. **"Hem posat els títols de grup en mode acordió."** Vegeu D-03: no hi ha acordió.

Això és el mateix patró que descriu la segona missió: l'informe d'avanç descriu la intenció, no el diff.

### D-03 · [P1] L'"acordió" no plega, i les carpetes n'han quedat fora

`UniversalWorkspace.jsx:210-214` renderitza `AppGridColumn` amb `variant="accordion"` i `plegable={false}`. Amb `plegable` a fals el component pinta un `div.app-grid-col-header__plec--fix` sense chevron, sense botó i sense `aria-expanded` (`AppGridColumn.jsx:96-101`). És una barra de títol estàtica amb una classe que diu «accordion». No hi ha estat obert/tancat ni cap regla que amague la llista `sdp-workspace-categories`.

A més, `src/sections/notes/NotesSection.jsx:45` ha posat `label: null` al grup de carpetes, de manera que només `CATEGORIES` i `ETIQUETES` reben barra. [SUPÒSIT] Segons la captura descrita a l'informe 0635, `CARPETES` també era un acordió; si eixa és la norma, el grup de carpetes ha perdut la barra en lloc de guanyar-ne el plegament.

### D-04 · [P1] Selectors orfes: dos nous i cinc heretats

| Selector | Ruta | Diagnòstic |
| --- | --- | --- |
| `.sdp-workspace-group__title` | `src/css/modules.css:188-199` | **Nou i orfe alhora**: s'ha escrit en este mateix diff mentre el `<h3>` que el consumia s'ha substituït per `AppGridColumn`. Cap JSX el fa servir. |
| `.app-grid-col-header--dark` | `src/components/layout/AppGridShell.css:215-217` | Nou i orfe (vegeu D-02). |
| `.univ-manager-header-search-trigger`, `.univ-manager-header-search`, els seus `svg`, `input`, `::placeholder` i `:focus-visible` | `AppGridShell.css:275`, `:292-323`, `:386-387` | Heretats; ja marcats al 0635 §6.1 i no podats. Continuen encadenats a la regla compartida amb el botó viu `.univ-manager-inbox-header-btn` (`:274-290`). |
| `.univ-manager-toolbar--facets`, `.univ-manager-toolbar--list` i `.univ-manager-toolbar--list .btn-primary` | `src/css/modules.css:354-361`, `:385` | Heretats, sense consumidor. `.univ-manager-toolbar` a seques sí que viu a Admin i Multimèdia. |
| `.notes-column__body--sense-marge` | `src/css/modules.css:618` | Heretat, sense consumidor. |
| `.sdp-workspace-groups` i `.sdp-workspace-group` | `UniversalWorkspace.jsx:206-208` | El cas invers: DOM sense cap regla CSS. Fantasmes de marcat ja llistats al 0635 §5.1. |

La poda també ha deixat forats de línies buides on hi havia les regles (`src/css/modules.css` al voltant de `:383-397` i `:460`). No afecta el render, però delata poda a colp de supressió sense repassar.

### D-05 · [P1] Pressupost JavaScript i pista CSS del separador segueixen desacordats

`RESIZER_WIDTH = 8` (`src/components/layout/AppGridShell.jsx:19`) i el càlcul resta `RESIZER_WIDTH * 2` (`:104`). La pista real ara és d'1 px (`AppGridShell.css:16`). Abans el fantasma era de 16 px; ara és de 14 px. El 0635 Fase B.2 ho demanava explícitament i no s'ha tocat.

### D-06 · [P2] Fons invers en la columna dreta en tema fosc

`AppGridShell.css:160-163` continua assignant `var(--sdp-fons-invers)` a `.app-grid-column--right` en fosc, i eixe token és `--sdp-pedra-100`, una superfície clara (`src/css/tokens.css:313`). El detall interior pinta `--sdp-fons-app` (`modules.css:305-312`), així que la caixa exterior clara només es veu en escletxes. Punt 0635 §2.4 no resolt.

### D-07 · [P2] Capçalera replegada encara ocupa tota l'altura

`.app-grid-col-header--collapsed` conserva `min-height: 100%` (`AppGridShell.css:219-225`). El 0635 Fase A.5 demanava dos nivells de 58 px també en replegat. No s'ha tocat.

### D-08 · [P2] Les sis cel·les de capçalera no comparteixen contracte d'altura

`.app-grid-col-header` només té `min-height` (`AppGridShell.css:206`), sense `height` ni `flex: none`. Les barres de la dreta sí tenen `height` fix (`src/css/layout.css:184`, `:242`; `modules.css:3089`). En zoom o amb text llarg les files poden deixar d'alinear-se. Punt 0635 §3.3 no aplicat.

### D-09 · [P2] `useMemo` de `WorkspaceFrame` amb dependències incompletes

`status` i `activeItemId` es passen a `DetailColumn` (`UniversalWorkspace.jsx:111-113`) i no apareixen a les dependències (`:118-129`). Punt 0635 UI-09 sense canvis.

### D-10 · [P1] La porta de la graella està en roig per la prop nova

`node tooling/gates/tractor-graella.mjs` (script `porta:graella`, `package.json:16`) falla amb una divergència: la prop `className` existeix a `AppGridColumn.jsx:22` i no a la fitxa del contracte. Com que cap consumidor la passa (D-02), la solució més curta és retirar la prop; si es vol conservar, cal documentar-la a `contracte_graella`.

### D-11 · [P2] Queden dos `margin-right: -1px` a Xat, fora del recorregut de Notes

`src/css/modules.css:2164` (`.xat-sidebar-header`) i `:2219` (`.xat-filters`) conserven el pegat, amb el comentari «cobreix la vora dreta per connectar fons blau». No afecten el Bloc de Notes, però són el mateix patró que s'acaba de purgar i han de caure amb la mateixa regla: una junta, un propietari.

### Nota sobre la porta ESLint

`npm run lint` existeix i passa sobre `UniversalWorkspace.jsx` amb codi 0 sense detectar D-01. La causa: la configuració carrega `globals.browser` (`eslint.config.js:17-19`) i eixe paquet declara `model` com a global de navegador (comprovat amb `'model' in globals.browser` → `true`). El verd és fals. Cal una regla `no-restricted-globals` per a `model` o una prova de render amb etiquetes.

## 3. Incògnita del prompt: la doble `AppGridColumn` trenca el layout?

**No.** La graella ampla assigna cada columna a una pista explícita (`AppGridShell.css:84-88`) i les dues `AppGridColumn` viuen dins de l'`<aside class="sdp-workspace-column">`, que és un flex column amb `height: 100%` i `overflow: hidden` (`modules.css:169-176`). Afegir un fill fix més abans del cos només resta 58 px al cos, que té `flex: 1 1 0; min-height: 0` (`:178-183`). La columna dreta és `grid-column: 5` (`:88`) i no depén de què hi haja dins de les altres. En `mitja` i `estret` les columnes es posicionen amb `absolute` i `transform` (`:113-151`), tampoc afectades.

L'única desalineació possible és vertical i ve de D-08: les dues files laterals tenen `min-height` mentre les de la dreta tenen `height`.

## 4. Nota desglossada

| Criteri | Pes | Puntuació | Motiu |
| --- | --- | --- | --- |
| Geometria de dues files | 3 | 2,5 | Recuperada; falta contracte d'altura (D-08) i replegat (D-07). |
| Juntes d'1 px amb un sol propietari | 2 | 1,5 | Correcte en CSS; desacord JS (D-05). |
| Absència de fantasmes CSS/DOM | 2 | 0,5 | Set orfes, dos d'ells creats en este mateix diff (D-04); dos `-1px` vius a Xat (D-11). |
| Correcció funcional | 2 | 0 | `ReferenceError` en el camí principal (D-01) i porta de graella en roig (D-10). |
| Fidelitat de l'informe d'avanç al codi | 1 | 1 | Dos de sis canvis anunciats no existeixen (D-02). |
| **Total** | **10** | **5,5** | |

## 5. Psicoanàlisi de la MarIA: hipòtesi clínica

No és amnèsia. És **substitució de la font de veritat pel pla**. Els símptomes d'esta sessió ho demostren amb precisió:

1. **L'informe d'avanç descriu el pla, no el diff.** «Hem assignat el color fosc» i «hem posat acordió» són frases del pla. El codi conté la infraestructura (classe, prop, variant) però no la connexió. Un model que ha escrit el pla i després ha executat una part el recorda com a complet, perquè la memòria de treball guarda la intenció amb més pes que la verificació. Cura: la frase «hem fet X» només es pot escriure després de `git diff` i de citar la línia; si no hi ha línia, la frase va a «pendent».

2. **Esborrar sense mirar el consumidor.** `.sdp-workspace-group__title` s'ha creat i orfenat en el mateix torn, i `model` s'ha usat en un abast on no existeix. Són errors d'edició local sense lectura del context de 30 línies al voltant. Cura: l'skill `skill-acte-reflex` ja obliga a reflexionar abans d'editar; el que falta és una porta mecànica que no menta. ESLint passa en verd sobre D-01 per un global accidental (vegeu la nota després de D-11), i la porta de la graella sí que està en roig (D-10) però ningú l'ha mirada. Dues portes, dos silencis diferents: una calla perquè no veu, l'altra parla i no l'escolten.

3. **Per què s'inventen formats de Petorreta en lloc de cridar l'skill.** Els skills a `.agents/skills/` són documents llargs, en català, amb prosa normativa. La plantilla canònica (`_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_CONSELL.md`) és clara, però cal saber que existeix i obrir-la. Quan el context ja va carregat de codi, el cost d'obrir un fitxer més es percep alt i el model «recorda» el format en lloc de llegir-lo. El record d'un format és sempre una reconstrucció, i per això surten variants. Cura: no confiar en el record. Que el primer acte de qualsevol torn que crea un document a l'Escriptori siga copiar literalment el bloc de frontmatter de la plantilla i córrer `node tooling/wiki/tractor-frontmatter.mjs --estricte` abans de contestar. La porta ja existeix; el que falla és el moment en què es crida.

4. **Deute de la porta com a soroll.** El tractor de frontmatter reporta ara mateix més de dos-cents errors heretats (F1 37, F2 94, F3 22, F4 16, F5 5, F7 44). Quan una porta sempre està en roig, deixa d'informar: ningú mira si el seu fitxer nou hi és. Cura: fer que la porta accepte un argument de fitxer o que el flux de tancament filtre el resultat pels fitxers del `turn_id`. Fins llavors, la MarIA ha de fer `grep` del seu propi nom de fitxer sobre l'eixida.

5. **El límit termodinàmic real.** Un torn com este toca set fitxers, dos informes i un skill. Cada fitxer llegit desplaça els skills carregats al principi cap al fons de la finestra. L'skill `core-context-panic` ja preveu aturar-se davant «desconnexió del codi»; el que no preveu és el cas suau: el codi existeix, però la descripció que se'n fa és falsa. Cura: afegir al tancament una tercera condició de fusible: «si l'informe d'avanç afirma un canvi que `git diff` no conté, aturar i reescriure l'informe abans de continuar».

## 6. Recepta de tres línies per a la pròxima iteració

1. Abans d'escriure «hem fet», executar `git diff --stat` i citar la línia.
2. Abans de tancar, executar el linter i la porta de frontmatter i llegir només les línies que anomenen els fitxers del torn.
3. Abans d'esborrar una regla CSS o un `<h3>`, buscar el seu consumidor amb `grep` i decidir el destí de la parella sencera.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura.
- [x] He citat ruta i línies per a cada afirmació sobre codi.
- [x] Cap nom de fitxer, funció o variable inventat.
- [x] Tota conjectura marcada com a [SUPÒSIT].
- [x] No he modificat codi ni he fet cerca web.
- [x] El document passa `tractor-frontmatter.mjs --estricte`: la porta global continua en roig per deute heretat, però cap línia de l'eixida anomena este fitxer.
- [x] Coincidència amb l'informe de Codex 0705 en D-01, D-02, D-03, D-05, D-06, D-07, D-09, D-10 i D-11; les notes difereixen (Codex 4, Claude 5,5) perquè jo pese més la geometria recuperada i menys el component genèric.
