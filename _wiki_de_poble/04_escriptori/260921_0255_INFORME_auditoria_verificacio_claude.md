---
type: informe
status: esborrany
description: Verificació de les 4 remediacions (AppGridShell, ItemMedia, WorkspaceContext, Dialeg sense-marc) després de l'auditoria extrema del Workspace.
tags:
  - arquitectura
  - disseny
  - govern
---

# Informe — Verificació de la Remediació Tècnica (Claude Fable)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260921-B |
| Respon a | SDP-PROMPT-260921 (260921_0245_PROMPT_Auditoria_Extrema_Verificacio) |
| Entorn | entorn-dev-local (branca `backup-notes-publish`, arbre de treball sense commit) |
| Creació | 26-09-21 02:55 |
| Agent auditor | Claude Fable (potència baixa) |
| Edició de codi | cap (auditoria passiva; només s'ha escrit aquest informe) |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260921_0155_pla_implementacio_mestre.md]]
- [[260921_0215_INFORME_auditoria_extrema_claude_fable.md]]
- [[260921_0245_PROMPT_Auditoria_Extrema_Verificacio.md]]

## Veredicte

**No és un 10/10. Nota: 6/10.** Les quatre tasques estan fetes en la direcció correcta, però tres d'elles han introduït una regressió cadascuna, i la reconciliació profunda d'URL (C2 de l'auditoria anterior) no s'ha tocat. Cap dels defectes exigeix un redisseny: són ajustos locals.

Resum per tasca de l'informe d'avanç:

| Tasca | Estat | Defecte que queda |
| --- | --- | --- |
| 1. Neteja CSS i fons `pedra-750` | Neteja completa; fons regressiu | V2: text fosc sobre fons fosc en mode clar fora de `.sdp-bloc` |
| 2. `ItemMedia` + `useResolvedAsset` | Lògica correcta | V1: estil en línia que fa caure dues portes |
| 3. Refs a `WorkspaceContext` | Mitiga C1; no toca C2 | V3: la guarda `status` engoleix clics; V4: C2 obert |
| 4. `Dialeg` `sense-marc` | Funciona | V5: `aria-labelledby` penjat, sense nom accessible |

## Mètode

Lectura íntegra de `src/components/universal/workspace/ItemMedia.jsx`, `WorkspaceContext.jsx`, `workspaceState.js` (reductor `selection/sync`), `UniversalWorkspace.jsx` (diff), `src/components/PedraSeca/organismes/Dialeg.jsx`, `src/components/layout/AppGridShell.css`, `AppGridColumn.jsx` (diff), `src/css/modules.css` (blocs 95–135, 200–300, 3215–3330), `src/css/components.css` (182–225), `src/css/layout.css` (43–60, 335–350), `src/css/tokens.css` (tokens citats), `src/hooks/useResolvedAsset.js`, `src/sections/notes/NotaFitxa.jsx`, `NotesSection.jsx` (50–100), `NotesDataContext.jsx` (estats), `src/sections/disseny/DesignSection.jsx` (35–80) i `src/app/App.jsx` (69–145, 322–360).

Execucions (sense modificar res): `npx vitest run` sobre `src/components/universal`, `src/components/PedraSeca/organismes`, `src/sections/notes` i `src/app` → 5 fitxers, 15 proves, totes verdes. `npx eslint` sobre els fitxers tocats → 0 errors, 9 avisos (2 nous, vegeu V6). `node tooling/gates/tractor-inline-styles.mjs` i `node tooling/gates/tractor-fitxa-gestor.mjs` → les dues **paren** i assenyalen `ItemMedia.jsx:16` (V1).

No s'ha obert cap navegador ni cap recurs extern, per contracte. Les afirmacions visuals (V2) estan derivades de la cascada CSS i marcades on cal.

---

## CRÍTIC

### V1. `ItemMedia` porta un estil en línia que fa caure dues portes del tractor

`src/components/universal/workspace/ItemMedia.jsx:16` pinta `style={{ background: 'var(--sdp-fons-subtil)' }}`. Aquest fons ja el declara `src/css/modules.css:102-113` (`.sdp-gestor-fitxa__media { background: var(--sdp-fons-subtil) }`), així que l'estil en línia és redundant, però a més:

- `tooling/gates/tractor-inline-styles.mjs` el classifica com a `[T2 INLINE-STYLE] Propietat prohibida 'background'` i «para el build».
- `tooling/gates/tractor-fitxa-gestor.mjs` el llista a «F6 · Zero estils en línia al gestor» i tanca amb «Esta llei no admet sostre de deute».

Efecte col·lateral: un estil en línia guanya a qualsevol regla de full, de manera que `.sdp-bloc-list--notes .sdp-gestor-fitxa__media` (`modules.css:3319-3325`) o qualsevol pell futura no podrà recolorir la miniatura. Abans del canvi, `NotaFitxa.jsx` no en duia cap.

**Pedra Seca:** esborrar l'atribut `style` de `ItemMedia.jsx:16`. El CSS de `modules.css:111` ja fa la faena.

### V2. Regressió de contrast en mode clar: la primera columna és fosca però el seu contingut continua pintant-se amb tokens de tema clar

`src/components/layout/AppGridShell.css:19-20` fixa `--app-grid-bg-esquerra: var(--sdp-pedra-750)` (abans, a HEAD, `var(--sdp-fons-subtil)`) i `--app-grid-text-esquerra: var(--sdp-crom-text)`; `:193-196` els aplica a `.app-grid-page .app-grid-column--left`. `tokens.css:49` dóna `--sdp-pedra-750: #302e29` i no canvia amb el tema.

El `color` de la columna només afecta el text que **hereta**. Els elements de navegació del nucli fixen el seu propi color:

- `modules.css:265-280` `.sdp-workspace-nav-item { color: var(--sdp-text-cos) }` → en clar, `tokens.css:102` resol a `--sdp-pedra-700`: text quasi negre sobre `#302e29`.
- `modules.css:281` `:hover { background: var(--sdp-fons-hover-subtil) }` → `tokens.css:278` és un negre al 6%: invisible sobre fosc.
- `modules.css:282-286` `[aria-current="page"] { background: var(--sdp-accent-subtil) }` → `tokens.css:115` `primary-50` (clar) amb el text encara `text-cos`: l'ítem actiu es veu; la resta, no.

Només el Bloc de Notes ho corregeix: `modules.css:3285-3305` (`.sdp-bloc .sdp-workspace-nav-item { color: var(--sdp-bloc-nav-text) }`, hover `--sdp-crom-hover`, actiu amb `--sdp-primary-50` i `--sdp-pedra-900`) i `:3255-3258` (`color-scheme: dark`). Cap regla equivalent existeix per a `.sdp-cataleg` (`DesignSection.jsx:77`), que renderitza exactament els mateixos `sdp-workspace-nav-item` (`UniversalWorkspace.jsx:306-312`).

Conseqüència: `/disseny` en mode clar té la columna ÀREES amb text fosc sobre fons fosc excepte l'àrea activa. En mode fosc no hi ha regressió: `tokens.css:312` fa `--sdp-fons-subtil: var(--sdp-pedra-750)`, és a dir, el mateix color que abans.

[SUPÒSIT, no comprovat en viu] `AdminSection.jsx:14-48` també viu dins d'un `AppGridShell` amb columna esquerra; si el seu contingut usa `--sdp-text-cos`, pateix el mateix.

**Pedra Seca:** o bé (a) la columna esquerra genèrica torna a `--sdp-fons-subtil` i el `pedra-750` es queda com a decisió de pell a `.sdp-bloc` (que ja el té a `modules.css:3223`), o bé (b) es promocionen les regles de `modules.css:3285-3305` i `:3255-3258` del `.sdp-bloc` al nucli (`.app-grid-column--left .sdp-workspace-nav-item`), incloent-hi `.sdp-workspace-search` (`:200-215`, fons `--sdp-fons-subtil` i text `--sdp-text-cos`) i `.sdp-workspace-tags` (`:232-238`, fons `--sdp-fons-app`). L'opció (a) és una línia; la (b) és la que fa cert «un fons bonic en totes les vistes».

### V3. La guarda `status !== 'ready'` engoleix clics reals durant `revalidating` i `error`

`WorkspaceContext.jsx:92,111,118` fan `if (statusRef.current !== 'ready') return;` a `selectCategory`, `selectItem` i `requestItem`. Però `status` no és binari:

- `NotesDataContext.jsx:154` passa a `'revalidating'` mantenint el `payload` (és exactament el que demana el pla mestre B1: no buidar la llista). Durant eixa finestra la llista **es veu** i és clicable, però cap clic despatxa res ni emet `onSelectionChange`. Sense feedback.
- `NotesDataContext.jsx:111,117` posen `'error'`. `NotesSection.jsx:74` pinta igualment `NOTE_FOLDERS_SEED` «perquè la vista siga sempre completa». Amb el backend apagat, l'usuari veu carpetes que no responen al clic.

Abans del canvi, les tres accions funcionaven sempre; l'única guarda de `status` era la de la reconciliació (`:144`), que és la correcta. Cap prova cobreix aquest cas (les 15 passen).

**Pedra Seca:** retirar la guarda de les tres accions. Si es vol bloquejar la interacció mentre carrega, que ho faça la vista (`aria-disabled` o `inert` sobre `.sdp-workspace-categories`), no el context en silenci.

---

## IMPORTANT

### V4. C2 (reconciliació saltada en càrrega profunda d'URL) continua obert; no cal redisseny

Resposta a la missió 2: les refs de `:81-89` resolen C1 (`selectCategory` ja només depèn d'`emitSelection`, `:108`, i `value` `:193-211` deixa de regenerar-se a cada tecla). Però C2 vivia en l'altre parell d'efectes, i aquests no han canviat:

- `:128-139` posa `syncPending.current = selection.itemId !== undefined` i despatxa `selection/sync`.
- `:142-148` ix per `status !== 'ready'` **abans** de consumir la bandera; quan `status` passa a `ready`, la consumeix i retorna sense reconciliar.

Traça amb `/notes?nota=n-esborrada` i backend lent: `loading` → sync (bandera alçada) → `ready` amb dades reals → l'efecte consumeix la bandera i ix → `activeItemId` apunta a un ID inexistent, `activeItem` és `null` (`:67-69`) i el detall queda buit fins al següent clic. `workspaceState.js:100-124` (`selection/sync`) posa `needsInitialSelection = false` quan hi ha `itemId`, així que tampoc es repara per eixa via.

**Pedra Seca (canvi petit):** consumir la bandera només quan `status === 'ready'` és insuficient perquè l'ordre d'efectes és el mateix; el que cal és que la bandera signifique «l'últim `sync` encara no s'ha validat contra dades llestes»: moure-la al reductor (`state.syncSource`) i que `selection/reconcile` la netege, o bé no alçar-la quan `statusRef.current !== 'ready'` en el moment del `sync`. Cap de les dues opcions toca l'esquelet.

### V5. `Dialeg` `sense-marc`: nom accessible trencat i contracte no actualitzat

`Dialeg.jsx:62-68`: la branca `sense-marc` posa `aria-labelledby={titol ? \`${id}-titol\` : undefined}` però **no renderitza** cap element amb eixe `id` (el `<h2 id={\`${id}-titol\`}>` viu només a la branca nativa, `:76`). `App.jsx:330` passa `titol="Menú Sóc de Poble"`, així que el `<dialog>` modal s'anuncia sense nom: un `aria-labelledby` que apunta al buit s'ignora.

Altres punts de la mateixa variant:

- No hi ha botó de tancar (`:77-79` només a la branca nativa). El tancament depèn d'Escape, del vel (`:55-57`) o del botó de marca de `SidebarContent` (`App.jsx:74`, `aria-label="Obrir o tancar menú Sóc de Poble"`), que sí que existeix. Acceptable, però el JSDoc `:8-12` («titol obligatori: dona nom accessible») ja no és cert per a aquesta variant i no documenta `variant`.
- La classe `sdp-dialeg--sense-marc` (`:59`) no té cap regla a `src/css/` (cerca sense resultats). El `<nav>` omple el calaix gràcies a `layout.css:43-48` (`nav.app-sidebar { height: 100% }`) i `:343-350` (`.sdp-dialeg-sidebar nav.app-sidebar { position: relative; width: 100% }`), no gràcies a la variant. És inert, no incorrecte.
- `.sdp-dialeg` (`components.css:182-186`) manté `border: 1px solid var(--sdp-vora)` i `background: var(--sdp-fons-targeta)`; `.sdp-dialeg--esquerra` (`:214`) només treu la vora d'inici. Sobre `nav.app-sidebar` (fons `--sdp-crom-fons`, `layout.css:49`) el marc del `<dialog>` queda tapat pel `nav` a 100 %, així que visualment no es nota. [SUPÒSIT] si algun dia el `nav` no ocupa tota l'alçada, apareixerà una franja clara.

Resposta a la incògnita del prompt: **sí, cal una adaptació**: en `sense-marc`, substituir `aria-labelledby` per `aria-label={titol}` (o renderitzar un `<h2 class="sr-only">`), i documentar `variant` al contracte.

### V6. Import mort a `UniversalWorkspace.jsx:7`

`import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js'` no s'usa enlloc del fitxer (la resolució viu ara dins d'`ItemMedia.jsx:10`). ESLint ho marca (`no-unused-vars`). Amb la cadena de portes ja en roig per deute previ, cada avís nou és soroll que amaga els següents.

---

## MENOR

### V7. Comentari orfe a `modules.css:3229-3231`

«Segona fila de capçalera (Tot/engranatge · lupa/CREAR NOTA): gris fosc i immòbil…» descriu les regles `.sdp-bloc .app-grid-col-header--transparent` que s'han esborrat justament davall. Ara el comentari precedeix una línia buida i després `.sdp-bloc .app-grid-column--middle .app-grid-col-header`, que no és la «segona fila».

### V8. Classes sense CSS

`ItemMedia.jsx:20` afegeix `className="sdp-gestor-fitxa__icona"` i `NotaFitxa.jsx:16` passa `className="sdp-nota-fitxa__media"`; cap de les dues té regla a `src/css/` (ni la tenia a HEAD). No trenquen res; són ganxos buits que convé o omplir o retirar.

### V9. Refs actualitzades en `useEffect`: lectura desfasada dins del mateix tick

`WorkspaceContext.jsx:85-89` sincronitza `stateRef`, `normalizedItemsRef` i `statusRef` **després** del commit. Un gestor que cride `selectCategory(a)` i tot seguit `selectItem(b)` en el mateix esdeveniment llegirà a la segona crida l'`activeCategoryId` anterior (`:114`) i emetrà `{ categoryId: vell, itemId: b }`. [SUPÒSIT: cap consumidor actual ho fa.] Assignar les refs durant el render (`stateRef.current = state;` sense efecte) tanca el forat.

### V10. `useResolvedAsset`: correcte; un detall d'observabilitat

El `setResolvedUrl('')` avançat (`:24`) evita que una imatge anterior es quede pintada mentre es resol la nova referència, i `isMounted` (`:16,31,35,43`) descarta promeses antigues. Bé. Amb el backend de mitjans present però caigut, `:34` escriu un `console.error` per targeta; amb un llistat llarg és una allau. Un sol avís agregat seria més amable.

---

## Verificat i correcte (per tancar sorolls)

- Variant `transparent`: 0 ocurrències a `src/` (JSX, CSS i tests). `AppGridColumn.jsx` ja no la genera. Tancat.
- Cadena de fallback d'`ItemMedia` (`:17-23`): imatge → icona → inicial, amb `aria-hidden` i `loading="lazy"`. Correcta. `NotaFitxa.jsx:16` reutilitza el component en lloc de duplicar-lo (I1 anterior tancat en la part de duplicació).
- `WorkspaceContext.jsx:193-211`: `value` ja no depèn de `state` a través de les accions; només de `state` mateix. La cascada de re-render de C1 queda mitigada.
- Mode fosc, primera columna: `pedra-750` coincideix amb `--sdp-fons-subtil` fosc (`tokens.css:312`), i `--sdp-crom-text` (`pedra-50`, `:241`) dóna contrast alt. Sense canvi visual respecte de HEAD.
- Capçaleres de columna (`AppGridShell.css:241-258`) i acordions del Bloc (`modules.css:3241-3247`) continuen en crom; no hi ha fuga cap al mig.
- 15 proves verdes als quatre directoris afectats.

## Ordre de remei proposat (sense tocar codi)

1. V1 (una línia, desbloqueja dues portes).
2. V3 (retirar tres `return`).
3. V2 (decidir a o b; a és una línia).
4. V5 (`aria-label` en `sense-marc` + JSDoc).
5. V6, V7, V8 (neteja).
6. V4 (bandera al reductor) i V9 (refs en render), que es poden fer junts.

## Incògnites

- V2 i V5 (franja) estan derivats de la cascada, no vistos al navegador (prohibit pel contracte).
- No s'ha auditat `AdminSection.jsx` ni `UniversalToolbar.jsx` més enllà de constatar que usen `AppGridShell`.
- No s'ha comprovat si `tooling/gates/run-portes.mjs` inclou `tractor-fitxa-gestor` en la cadena de commit; si hi és, V1 bloqueja el commit.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar-ne l'estructura.
- [x] He citat ruta i línies del codi de l'arbre de treball actual.
- [x] Cap nom de fitxer, funció o variable inventat.
- [x] Conjectures marcades [SUPÒSIT] o mogudes a Incògnites.
- [x] `tractor-frontmatter.mjs --estricte`: executat; el tractor no assenyala aquest fitxer (el deute que llista és de `00_index_escriptori.md` i `.agents/*`, previ).
