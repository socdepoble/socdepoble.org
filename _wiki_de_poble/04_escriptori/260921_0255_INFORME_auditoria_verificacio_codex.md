---
type: informe
status: esborrany
description: Verificació de la remediació del Workspace, miniatures, contrast i accessibilitat del menú mòbil.
tags:
  - arquitectura
  - disseny
---

**Registre:** Codex · 21/09/2026 · entorn local · aprovació humana pendent. Auditoria estàtica amb proves locals en memòria; sense comprovació visual ni lector de pantalla. Pedra Seca s’interpreta exclusivament com el Sistema de Disseny.

**Troballes prioritzades**

1. **P1 — La creació amb resposta diferida encara perd la selecció. [REPRODUÏT]**

   `requestItem` registra un element pendent, però l’eco de la selecció controlada executa `selection/sync`, que elimina `pendingItemId`. La reconciliació posterior substitueix l’element nou si encara no figura en la col·lecció.

   Prova amb una llista que conté `old`: demanar `new` i reflectir la notificació en `selection` acaba en **`old`**, amb notificacions consecutives `new/create` i `old/reconcile`.

   Les refs estabilitzen els callbacks, però no resolen aquest conflicte del reducer. Cal distingir la confirmació de la mateixa selecció d’una navegació externa i conservar l’espera fins a recepció, error o cancel·lació.

   Fonts: WorkspaceContext.jsx, línies 117–147 i 157–186; workspaceState.js, línies 100–128.

2. **P1 — La càrrega inicial profunda continua sense una reconciliació fiable. [REPRODUÏT + ESTÀTIC]**

   He muntat el proveïdor amb `status="loading"` i una selecció controlada amb categoria i element inexistents. Després d’aportar dades i passar a `ready`, **conserva els dos IDs invàlids**: `syncPending` consumeix l’efecte de reconciliació i posar la ref a `false` no provoca una altra execució.

   A més, les consultes continuen limitades a 50 registres. Una col·lecció parcial no permet concloure que un ID absent haja desaparegut. **[SUPÒSIT]** Un enllaç a una nota fora de la pàgina carregada pot quedar sense detall o ser substituït quan una actualització reactive la reconciliació.

   Cal ampliar el contracte de dades: selecció pendent, completitud de la llista i resolució del detall per ID. No cal reescriure tot el Workspace, però modificar closures és insuficient.

   Fonts: WorkspaceContext.jsx, línies 128–191; notes.js, línies 11–29.

3. **P1 — El fons fix trenca el contrast dels botons genèrics en tema clar. [ESTÀTIC + CÀLCUL]**

   El parell `--sdp-crom-text` sobre `--sdp-pedra-750` dona **13,56:1**. Però els botons de categories sobreescriuen el color heretat amb `--sdp-text-cos`: en tema clar és `#3d3b35`, sobre `#302e29`, amb **1,21:1**.

   El Bloc de Notes ho corregeix mitjançant `.sdp-bloc`; Disseny utilitza `.sdp-cataleg` i queda amb la regla genèrica. En tema fosc, el text genèric passa a `#efece7` i el contrast calculat és **11,51:1**.

   Cal definir conjuntament text, fons i estats interactius de la navegació fosca en el component compartit.

   Fonts: AppGridShell.css, línies 193–196; modules.css, línies 267–289 i 3285–3303; tokens.css, línies 39–52, 102, 241 i 317; DesignSection.jsx, línies 67–75.

4. **P1 — `sense-marc` deixa el diàleg sense el nom accessible previst. [REPRODUÏT]**

   La variant genera `aria-labelledby`, però omet l’element amb l’ID corresponent. He verificat que la referència no té destinatari al DOM. `descripcio` presenta el mateix defecte estructural si es proporciona.

   `App.jsx` passa «Menú Sóc de Poble», però aquest text no es renderitza com a etiqueta del diàleg. El nom del `<nav>` interior no etiqueta automàticament el `<dialog>`.

   Cal conservar un títol accessible, encara que siga visualment ocult, o establir un contracte explícit d’etiquetatge. Sí que existeix un botó interior per tancar el menú; no és correcte afirmar que haja desaparegut tota possibilitat de tancament.

   Fonts: Dialeg.jsx, línies 62–81; App.jsx, línies 327–344 i 74–85.

5. **P2 — `ItemMedia` comparteix la presentació, però no recupera imatges trencades. [REPRODUÏT]**

   Després de disparar un esdeveniment `error`, l’`<img>` continua present i no apareix la inicial. El component només comprova si existeix una URL; no gestiona l’error de descàrrega o descodificació.

   Cal registrar l’error de la imatge, mostrar icona o inicial i reiniciar aquest estat quan canvie la referència. Addicionalment, un títol format només per espais produeix una inicial buida perquè el fallback s’aplica abans de `trim()`.

   Font: ItemMedia.jsx, línies 9–22.

6. **P2 — La resolució de recursos millora, però continua incompleta. [ESTÀTIC]**

   Buidar la URL en començar una resolució opaca evita conservar-la durant tota l’espera. Tanmateix, el buidatge ocorre en un efecte: el primer render amb la referència nova encara pot retornar la URL anterior. El guard de cancel·lació sí que impedeix aplicar respostes antigues després de la neteja de l’efecte.

   També persisteixen dos límits: el hook només reacciona a `assetRef`, i el backend retorna la referència opaca quan falla la signatura. Les signatures duren 3.600 segons, sense renovació en aquest hook.

   Cal associar el resultat a la referència resolta i representar explícitament disponibilitat, error i caducitat.

   Fonts: useResolvedAsset.js, línies 13–47; storage.js, línies 130–152.

7. **P2 — Continuen dos defectes estructurals de la graella. [ESTÀTIC]**

   Canviar l’estat de plec actualitza `collapsedRef`, però no força una nova mesura; l’efecte de reavaluació només depén de les amplàries. A més, la persistència continua llegint immediatament una variable assignada dins d’un actualitzador de React, que pot executar-se després.

   Cal recalcular quan canvie el plec i persistir l’estat confirmat. Els canvis de CSS no tanquen aquests dos punts de l’auditoria anterior.

   Font: AppGridShell.jsx, línies 68–106 i 125–142.

**Millores verificades i límits**

La reutilització d’`ItemMedia` en les dues targetes és efectiva: UniversalWorkspace.jsx:503–516 i NotaFitxa.jsx:16–27. `sense-marc` conserva la gestió comuna d’obertura i Escape de Dialeg.jsx:31–53. Això no acredita l’absència de parpellejos ni el comportament real del focus.

La navegació de categories encara declara `menu`/`menuitem` sense implementar navegació específica per teclat en aquest component: UniversalWorkspace.jsx:275–313. També persisteix la forma de pastilla de «Tot», malgrat l’objectiu rectangular del pla: modules.css:3267–3273.

**Validació:** quatre reproduccions locals amb React/jsdom, compilació en memòria i càlcul de contrast. Cap accés de xarxa ni fitxer de prova creat. No he executat la suite completa ni `tractor-frontmatter.mjs --estricte`; el document no s’ha guardat i **no el declare validat per aquesta porta**.
