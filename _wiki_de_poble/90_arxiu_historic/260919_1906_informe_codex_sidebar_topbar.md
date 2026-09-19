---
type: informe
status: esborrany
description: Auditoria local de Sidebar i TopBar, amb contracte CSS i JSX, selector IA i migració de la ruta IAIA.
tags:
  - disseny
  - arquitectura
---

# Auditoria Codex — Sidebar i TopBar atòmics

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-260919-SIDEBAR-TOPBAR |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 19:06 |
| Modificació | 26-09-19 19:13 |
| Agent redactor | Codex |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Encàrrec | SDP-PROMPT-260919, versió 1.0.0 |
| Referència Git | `214f5c7c65bdc011c2d7e2f93f73d50438f9fa21`, amb canvis locals previs |

## Vincles

- [[00_index_escriptori]]
- [[260919_1858_PROMPT_sidebar_topbar]]

## Abast i veredicte

**La correcció ha d'unificar el propietari de l'estructura i de l'estat.** Propose un `AppShell` explícit, amb Sidebar i `main` germans en escriptori, un calaix controlat en pantalles estretes i una TopBar amb cinc controls estables. `AppGridShell` ha de continuar dins del contingut de `main`.

Auditoria del directori `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`. Les cites `ruta:línies` són relatives a esta arrel i corresponen al contingut local llegit. Les propostes següents **no estan implementades**: els blocs CSS/JSX són especificació per a IAIA MarIA. Pedra Seca significa exclusivament el sistema de disseny.

No s'ha modificat codi, configuració ni skills. Només es genera este informe i el seu enllaç documental a l'índex. No s'ha consultat informació externa ni s'ha executat l'aplicació al navegador. Per tant, **no s'ha reproduït visualment l'encavalcament descrit al prompt**; sí que s'han identificat defectes verificables que impedixen un comportament coherent.

## 1. Defectes i evidència

### F1 · P1 — El toggle d'escriptori falla en el muntatge web normal

Els dos botons alteren `sidebar-open` sobre el `nav` i `sidebar-closed` sobre el Shadow host o `document.body`. El CSS que amaga la Sidebar en escriptori només reconeix `:host(.sidebar-closed)`. En el muntatge normal no hi ha un Shadow host al qual aplicar eixe selector. Evidència: `src/app/App.jsx:242-251,342-350`; `src/css/layout.css:564-584`.

El punt d'entrada web munta `PedraSecaEmbed` com a component React sobre `#root`; este component retorna proveïdors i `App`, sense crear un ShadowRoot en eixe recorregut. Evidència: `src/main.jsx:22-34`; `src/PedraSecaEmbed.jsx:44-69`.

**Conseqüència deduïda del codi:** canviar la classe de `body` no activa el tancament d'escriptori previst. Afegir un segon selector per a `body` repararia este cas, però conservaria l'estat repartit entre classes globals i manipulacions imperatives. La proposta elimina eixa dependència.

### F2 · P1 — L'estat del calaix i el seu vel no tenen un únic propietari

El vel espera `has-sidebar-open`, mentre que els manejadors escriuen `sidebar-closed`. El vel és un pseudo-element de `:host`; els manejadors mostrats no connecten cap tancament al clic sobre ell. Evidència: `src/css/layout.css:342-356`; `src/app/App.jsx:243-250,342-349`.

El botó lateral declara inicialment `aria-expanded="true"`, però calcula `willClose` a partir de `sidebar-open`, que el `nav` inicial no porta. Els botons actualitzen només el seu propi atribut, de manera que no compartixen un valor declaratiu. Evidència: `src/app/App.jsx:242-250,342-350`.

**Correcció requerida:** estat React local a la instància; visibilitat, botons i accessibilitat derivats d'eixe estat. Tancar el calaix en navegar, tornar a escriptori o prémer Escape. Un calaix ocult no pot retindre focus.

### F3 · P2 — La regla nova `.app-shell` no està connectada al JSX

`layout.css` definix `.app-shell`, però `AppShell` retorna un fragment amb `nav`, `main` i navegació mòbil. El fragment no genera una caixa flex. Evidència: `src/css/layout.css:14-22`; `src/app/App.jsx:239-242,298-322`.

**Matís decisiu:** això no demostra, per si sol, la causa de l'encavalcament. El reset ja dona `display:flex` a `#root`, `.sdp-root` i `:host`, i la Sidebar d'escriptori ja declara `position:relative` i `flex:0 0 var(--sdp-col-sidebar)`. Evidència: `src/css/base.css:41-49`; `src/css/layout.css:52-66`.

El `position:fixed` observat per a `nav.app-sidebar` està dins de `@media (max-width:1100px)`. Una pantalla física d'escriptori pot tindre un viewport CSS dins d'eixe interval, per exemple amb la finestra estreta o amb zoom. És una **hipòtesi de reproducció**, no un fet observat en esta sessió. Evidència de la condició: `src/css/layout.css:320-339`.

Cal mesurar viewport CSS, amplària de la instància, `display` del pare, `position` computada i rectangles del `nav`/`main` abans de declarar resolta la captura original. Baixar el `z-index` no reserva espai horitzontal.

### F4 · P1 — El segon control navega i `/iaia` té un significat incompatible amb l'encàrrec

La TopBar ja conté cinc botons en l'ordre demanat; el segon navega a `/ia`. Les rutes globals fan `/ia → /jo/ia`, `/anima → /jo/ia`, però `/iaia → /jo/xat/iaia-maria`. La pàgina documental es renderitza en la ruta relativa `ia` amb `pageKey="anima"`. Evidència: `src/app/App.jsx:354-389,547-549,590`.

No basta substituir una cadena al botó: cal separar **seleccionar interacció**, **visitar la pàgina de la IAIA** i **obrir un xat**.

### F5 · P2 — La TopBar estreta acumula mides i marges incompatibles

Cada `.icon` rep un marge esquerre de `0.5rem`. En mòbil es lleva el `gap`, però no eixe marge; també es fixa el contenidor del logo a 135px i cada control a 44px. Evidència: `src/css/layout.css:169-175,453-462`.

Amb `1rem=16px`, els cinc controls consumixen `5 × (44 + 8) = 260px`. Sumats al logo declarat són 395px abans de completar els paddings. És una estimació dels valors declarats: Flexbox pot comprimir el logo, però esta no és una regla explícita que garantisca cinc controls accessibles. A més, el logo conserva un `padding-left:28px !important`. Evidència: `src/css/layout.css:359,456-460`.

La solució ha de reservar l'espai dels controls i definir un disparador esquerre compacte. L'objectiu tàctil vigent és 44px; l'alçada negra és 64px, diferent dels 58px de la barra d'accions. Evidència: `src/css/tokens.css:161-173`.

### F6 · P2 — La llum de la IAIA representa una animació permanent

`.iaia-icon` té una animació infinita sense condició d'interacció. `IaiaIcon` inclou també dos atributs `style`. Evidència: `src/css/layout.css:177-186`; `src/components/PedraSeca/atoms/icones.jsx:5-18`.

La selecció «No vull res» necessita un indicador apagat i una etiqueta accessible equivalent. Cal traslladar els estils SVG a CSS o a atributs SVG de presentació i no mantindre una animació ornamental permanent. Les regles de moviment reduït ja existixen: `src/css/base.css:330-339`.

### F7 · P2 — Les portes actuals no proven la geometria de la closca

S'han executat les dos comprovacions següents, després de llegir-ne el codi:

| Comprovació | Resultat observat | Què permet concloure |
| --- | --- | --- |
| `node tooling/gates/tractor-graella.mjs` | PASS | El seu contracte textual de graella passa. |
| `node tooling/gates/tractor-crom.mjs` | FAIL, tres K4 | El botó lateral contradiu les regles que imposa esta porta. |

La porta de graella compara props, punts de tall, presència d'`inert` i tokens; no mesura rectangles del navegador. Evidència: `tooling/gates/tractor-graella.mjs:65-82,110-125`.

Les tres K4 afecten `width:100%`, `border-radius:0` i l'absència del radi de pastilla a `.sidebar-control-btn`. Hi ha una contradicció local: el comentari del CSS atribueix el bloc rectangular a una petició del Mestre, mentre que la porta l'impedix. Evidència: `src/css/layout.css:86-113`; `tooling/gates/tractor-crom.mjs:179-204`. Esta auditoria no convertix automàticament el botó en una pastilla: IAIA MarIA ha de reconciliar el contracte amb la decisió de producte vigent, sense amagar el resultat fallit.

## 2. Contracte estructural proposat

### Jerarquia i responsabilitats

```text
arrel de muntatge, amb alçada definida
└── AppShell → div.app-shell
    ├── nav.app-sidebar                 escriptori: participa en Flexbox
    ├── main.app-main                   ocupa l'amplària restant
    │   ├── TopBar                      alçada fixa de 64px
    │   └── div.app-main__content        conté les rutes
    │       └── UniversalWorkspace → AppGridShell, quan corresponga
    └── MobileNav                       només en mode compacte
```

**«Al mateix nivell» s'ha de concretar com Sidebar i `main` germans.** Fer `AppGridShell` un tercer germà convertiria la graella de la pàgina en una tercera regió global. Actualment el contingut passa per `main`, i `UniversalWorkspace` compon la graella amb categories, llista i detall. Evidència: `src/app/App.jsx:300-318`; `src/components/universal/workspace/UniversalWorkspace.jsx:75-113`.

`AppGridShell` té posicionament absolut, però el contingut de `main` ja és un contenidor posicionat. L'absolut és, per tant, una decisió interna que pot conservar-se si es verifica que el seu rectangle queda dins del visor. Evidència: `src/components/layout/AppGridShell.css:6-13`; `src/css/layout.css:39-49`.

### Amplària i estat

Proposta: `AppShell` mesura **la seua pròpia amplària disponible** amb `ResizeObserver` i publica `data-shell-layout="wide|compact"`. Tall inicial: `W > 1100` és escriptori; `W <= 1100` és compacte. És una adaptació deliberada del tall actual al contenidor, útil també per a un embed estret dins d'una finestra ampla. Un únic predicat JS controla el mode; el CSS llig l'atribut, sense un segon llindar independent.

La graella interior conserva el seu propi observador: actualment calcula `estret` per davall de 720px i `ample` a partir del màxim entre 1090px i les amplàries necessàries. No cal forçar-la a coincidir amb la closca. Evidència: `src/components/layout/AppGridShell.jsx:71-99`. Exemple deduït: amb una instància de 1280px i Sidebar de 260px, la graella rep aproximadament 1020px i pot estar en `mitja`; això és compatible amb una Sidebar global visible.

| Mode | Estat inicial | En clicar el control | Efecte sobre `main` |
| --- | --- | --- | --- |
| Wide | Sidebar visible | Oculta o mostra la Sidebar | Recupera o cedix exactament l'amplària de la Sidebar. |
| Compact | Calaix tancat | Obri un calaix de navegació | Manté tota l'amplària. |
| Compact → wide | Calaix tancat en la transició | Recupera la preferència d'escriptori | Recalcula Flexbox. |
| Wide → compact | Calaix tancat | Requerix una obertura explícita | Ocupa tota l'amplària. |

Estats independents: `desktopSidebarOpen` i `drawerOpen`. Inicialització proposta: `true` i `false`; no persistir-los en esta primera correcció. Evitar un booleà que herete una obertura d'escriptori i òbriga inesperadament el calaix en redimensionar. L'observador mesura l'arrel estable, no `main`, per evitar que ocultar la Sidebar altere el mateix criteri que decidix ocultar-la.

### Calaix compacte accessible

Proposta: reutilitzar `Dialeg` amb `costat="esquerra"` per a la navegació compacta. En este mode, el mateix component `Sidebar` passa dins del diàleg; **no es mantenen dos menús simultanis ni dos IDs idèntics**. En escriptori, `nav.app-sidebar` torna a ser fill directe de `.app-shell`.

Esta excepció de DOM correspon al canvi de funció: el calaix compacte és modal; la Sidebar d'escriptori ocupa una columna. El component existent té `showModal()`, gestió de `cancel`, tancament i retorn de focus. Evidència: `src/components/PedraSeca/organismes/Dialeg.jsx:21-76`. No s'ha d'intentar posar `aria-modal` sobre un `nav` ordinari.

Cal mantindre el diàleg muntat mentre es tanca amb `obert={false}`, perquè el retorn de focus existent es fa en eixa transició. En canviar de mode o de ruta, el successor del focus s'ha de decidir explícitament: botó de menú si encara existix, altrament marca lateral o `main`. No restaurar-lo a un disparador desmuntat. Evidència de la implementació actual que cal integrar: `src/components/PedraSeca/organismes/Dialeg.jsx:31-42`; focus de ruta actual en `src/app/App.jsx:91-96`.

L'ús de `showModal()` té abast de document, també dins d'un embed. No s'ha de presentar com un bloqueig exclusiu de la instància. Si l'amfitrió exigix modalitat local, això requerix un altre contracte. El fallback actual que només posa `open` tampoc equival a modalitat completa: `src/components/PedraSeca/organismes/Dialeg.jsx:37`.

## 3. CSS proposat per a IAIA MarIA

Este és el nucli estructural proposat, sense estils inline. S'ha d'integrar **substituint les regles equivalents**, no afegint un altre bloc corrector al final. `layout.css` continua sent-ne el propietari. La cascada vigent és `reset, sdp, legacy, components, utilities`: `src/css/index.css:45-68`.

```css
@layer components {
  .app-shell {
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: row;
    flex: 1 1 0;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: none;
  }

  nav.app-sidebar,
  header.bar-black {
    background: var(--sdp-crom-fons);
    color: var(--sdp-crom-text);
    color-scheme: dark;
  }

  nav.app-sidebar {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .app-shell > nav.app-sidebar {
    position: relative;
    flex: 0 0 var(--sdp-col-sidebar);
    width: var(--sdp-col-sidebar);
    height: 100%;
  }

  .app-shell > nav.app-sidebar[hidden] { display: none; }

  .app-sidebar > .brand,
  .app-sidebar > .sidebar-control-btn { flex: none; }

  .app-sidebar > .app-sidebar-nav {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--sdp-crom-scroll) transparent;
  }

  .app-shell > main.app-main {
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
  }

  .app-main > .app-main__content {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
  }

  .app-sidebar-drawer .sdp-dialeg__cos {
    display: flex;
    flex: 1 1 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .app-sidebar-drawer nav.app-sidebar {
    position: static;
    flex: 1 1 0;
    width: 100%;
    height: auto;
  }

  header.app-topbar {
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 0 var(--sdp-alt-negra);
    height: var(--sdp-alt-negra);
    min-width: 0;
    gap: var(--sdp-space-2);
    padding-inline: var(--sdp-space-2);
    border-bottom: 1px solid var(--sdp-crom-vora);
  }

  .app-topbar__actions {
    display: flex;
    align-items: center;
    flex: none;
    flex-wrap: nowrap;
    gap: 0;
    margin-inline-start: auto;
  }

  .app-shell[data-shell-layout="wide"] .app-topbar__actions {
    gap: var(--sdp-space-2);
  }

  .app-topbar__button {
    position: relative;
    display: grid;
    place-items: center;
    flex: 0 0 var(--sdp-touch);
    width: var(--sdp-touch);
    height: var(--sdp-touch);
    min-width: var(--sdp-touch);
    min-height: var(--sdp-touch);
    padding: 0;
    margin: 0;
    border: 0;
    background: transparent;
    color: inherit;
    border-radius: var(--sdp-radi-m);
    cursor: pointer;
  }

  .app-topbar__button:hover { background: var(--sdp-crom-hover); }
  .app-topbar__button:focus-visible {
    outline: 2px solid var(--sdp-crom-focus);
    outline-offset: -2px;
  }
  .app-topbar__button > svg,
  .app-topbar__button > img { width: 24px; height: 24px; }
  .app-topbar__button > img { object-fit: cover; border-radius: 50%; }
  .app-topbar__button > .iaia-icon {
    fill: currentColor;
    stroke: none;
    animation: none;
  }
  .app-topbar__button[data-ai-enabled="true"] {
    color: var(--sdp-crom-actiu-fons);
  }
  .app-topbar__button[data-ai-enabled]::after {
    content: "";
    position: absolute;
    inset-inline-end: var(--sdp-space-1);
    inset-block-end: var(--sdp-space-1);
    width: var(--sdp-space-1);
    height: var(--sdp-space-1);
    border-radius: 50%;
    background: var(--sdp-crom-text-suau);
  }
  .app-topbar__button[data-ai-enabled="true"]::after {
    background: var(--sdp-crom-actiu-fons);
  }
}
```

La llumeta és fixa: indica **selecció**, no connexió al servidor ni inferència activa. El text accessible explicita el mateix estat. No cal afegir animació per a complir l'encàrrec.

Integracions obligatòries del bloc:

1. Retirar les regles antigues de `sidebar-open`, `:host(.sidebar-closed)` i el vel `:host::after`, inclòs el `position:fixed` del `nav` compacte. Amb `Dialeg`, eixe posicionament pertany al diàleg. Origen: `src/css/layout.css:320-356,564-584`.
2. Retirar de la TopBar la classe genèrica `.icon` dels botons i substituir `right-icons` per `app-topbar__actions`. Eliminar els seus marges antics i els `padding-left:0 !important`/paddings mòbils sobre la barra negra. Origen: `src/css/layout.css:153-175,228-233,432,453-462`.
3. El control esquerre ha de ser compacte, amb nom accessible «Obrir navegació principal». El logo rectangular pot continuar a la Sidebar; no s'ha de reservar una amplària fixa de 135/180px en la TopBar estreta. Amb sis objectius de 44px, gap de 8px i paddings de 16px, el total proposat és 288px; amb objectius de 48px, 312px. Els cinc controls de la dreta continuen junts.
4. Fer que la visibilitat de `MobileNav` i la reserva inferior de `main` depenguen també de `data-shell-layout`. Migrar els valors visuals vigents del bloc mòbil, sense duplicar la condició `@media`. Origen de la reserva i la barra: `src/css/layout.css:361-427`. Si la barra es posiciona respecte de la instància, usar `.app-shell` com a contenidor, i no el viewport extern.
5. `base.css` conserva el reset i la cadena d'alçades; no ha de decidir obertura, amplària de Sidebar o marges compensatoris de `main`. L'amfitrió de l'embed ha de proporcionar una alçada resoluble. Referència actual: `src/css/base.css:10-49`.
6. Migrar els estils SVG inline d'`IaiaIcon` a declaracions de classe o atributs SVG. No confondre esta neteja amb una garantia global de «zero inline»: `AppGridShell` encara injecta amplàries amb `style.setProperty`, i el pull-to-refresh modifica `style.transform/transition`. Evidència: `src/components/layout/AppGridShell.jsx:106-118`; `src/app/App.jsx:170-175,191-196,219-224`. Són deute adjacent que IAIA MarIA ha de delimitar si amplia l'abast.

## 4. JSX i estat proposats

### AppShell

Esquema d'integració, no substitució íntegra del fitxer. `Sidebar` és l'extracció proposada del menú actual; `shellLayout`, els estats i els manejadors són nous. Les tasques d'autenticació, tema i càrrega que ja fa `AppShell` no s'han d'eliminar en aplicar-lo.

```jsx
<div ref={shellRef} className="app-shell" data-shell-layout={shellLayout}>
  {shellLayout === 'wide' ? (
    <Sidebar
      id={sidebarId}
      hidden={!desktopSidebarOpen}
      onClose={closeDesktopSidebar}
      onNavigate={handleSidebarNavigation}
    />
  ) : (
    <Dialeg
      obert={drawerOpen}
      onTanca={closeDrawer}
      titol="Navegació principal"
      costat="esquerra"
      className="app-sidebar-drawer"
    >
      <Sidebar id={sidebarId} onClose={closeDrawer}
        onNavigate={handleSidebarNavigation} />
    </Dialeg>
  )}

  <main id={mainId} ref={mainRef} tabIndex={-1} className="app-main">
    <TopBar sidebarId={sidebarId} sidebarOpen={sidebarVisible}
      showSidebarTrigger={!sidebarVisible || shellLayout === 'compact'}
      onToggleSidebar={toggleSidebar} />
    <div ref={contentRef} className="app-main__content">{children}</div>
  </main>
  {mobileNav}
</div>
```

`Sidebar` ha de traslladar `id` i `hidden` al `nav` real. Els IDs de Sidebar, `main`, salt al contingut i selector es generen amb `useId` i passen per props. Conservar `aria-busy`, el salt al contingut i l'indicador de recàrrega del JSX actual en integrar l'esquema: `src/app/App.jsx:241,300-318`. No usar `querySelector` global ni `classList.toggle` per controlar una altra instància.

### TopBar: cinc controls, en ordre estable

| Posició dreta | Icona | Acció proposada |
| --- | --- | --- |
| 1 | `Globe` | Obrir `/traduccions`, amb etiqueta «Idioma del sistema». |
| 2 | `IaiaIcon` + llumeta | Obrir el selector; no navegar. |
| 3 | `Search` | Obrir `/cerca`. |
| 4 | `Sun` / `MoonStar` | Canviar tema; etiqueta que descriga el tema de destí. |
| 5 | Avatar / `UserRound` | Perfil o registre, segons la sessió. |

`Globe` ja existix a `src/icons.jsx:21-27`. No cal una dependència nova. La pantalla de llengües ja modifica l'idioma amb `setLanguage`: `src/sections/translations/TranslationsSection.jsx:7-9,22-57`. El canvi demanat és la icona del sistema; no s'ha de substituir indiscriminadament `TranslateIcon` en les accions de traducció de contingut.

Proposta per al control IA, dins de la fila de cinc botons:

```jsx
<button type="button" className="app-topbar__button"
  data-ai-enabled={interactionTarget !== 'none'}
  aria-haspopup="dialog" aria-expanded={interactionOpen}
  aria-label={interactionTarget === 'none'
    ? 'Interacció IA: desactivada. Obrir selector'
    : 'Interacció IA: IAIA MarIA seleccionada. Obrir selector'}
  onClick={() => setInteractionOpen(true)}>
  <IaiaIcon className="iaia-icon" />
</button>
```

No posar `aria-controls` amb un ID inventat: `Dialeg` encara no exposa un ID de diàleg com a prop. Si es vol eixa relació, afegir `id` a la seua API i passar-lo al `<dialog>`. Evidència: `src/components/PedraSeca/organismes/Dialeg.jsx:21-24,62-64`.

La fila és un grup de controls normals, no necessita `role="toolbar"` ni navegació artificial amb fletxes. El diàleg es renderitza fora de la fila perquè obrir-lo no altere el recompte dels cinc controls. En l'avatar, mantindre el nom accessible al botó i usar `alt=""` per a la imatge decorativa.

### Selector atòmic d'interacció

La cerca local i en l'historial accessible amb les cadenes `No vull res`, `No quiero nada`, `interactionMode`, `showIaSelector` i `showAgentSelector` no ha localitzat un selector reutilitzable. Això no demostra que no haja existit amb altres noms. En la revisió històrica `ccfc9ab0`, la TopBar usava `Globe` i el control IA navegava a `/realitat`: `ccfc9ab0:src/app/App.jsx:361-366`.

Sí que es pot reutilitzar el `Dialeg` actual, exportat per la façana pública i present al catàleg: `src/components/PedraSeca/index.js:28-31`; `src/sections/disseny/cataleg/detalls/EspecimenDialeg.jsx:14-25`.

**Model proposat:** `interactionTarget = 'none' | 'iaia'`, inicialment `none`, en un estat compartit per instància. `interactionOpen` és estat efímer de la TopBar. `UIContext` és un possible propietari de la preferència; ara mateix exposa idioma, tema i estat global, però no una preferència d'interacció: `src/app/contexts/UIContext.jsx:78-104`.

La primera versió selecciona una preferència de UI. No inicia xats, no executa agents i no fa crides al backend. «No vull res» ha d'apagar l'indicador i excloure interaccions automàtiques dels consumidors que s'hi connecten en el futur; no s'ha d'afirmar que desactiva tot el motor IA mentre els consumidors no respecten el contracte. L'enllaç a la pàgina completa és una acció separada.

Especificació JSX del cos del selector, amb textos a traslladar a `t(...)` en la implementació:

```jsx
<Dialeg obert={interactionOpen} onTanca={closeInteraction}
  titol="Interacció amb la IA" mida="s">
  <fieldset className="ia-interaction-options">
    <legend>Amb qui vols interactuar?</legend>
    <label className="ia-interaction-option">
      <input type="radio" name={interactionGroupId} value="none"
        checked={interactionTarget === 'none'}
        onChange={() => setInteractionTarget('none')} />
      <span>No vull res</span>
    </label>
    <label className="ia-interaction-option">
      <input type="radio" name={interactionGroupId} value="iaia"
        checked={interactionTarget === 'iaia'}
        onChange={() => setInteractionTarget('iaia')} />
      <span>IAIA MarIA</span>
    </label>
  </fieldset>
  <p>15 agents més, pròximament.</p>
  <Link to="/iaia" onClick={closeInteraction}>L'ànima de la IAIA</Link>
</Dialeg>
```

Les opcions s'apliquen immediatament; el diàleg queda obert fins a tancar-lo. Això permet usar les fletxes natives dels ràdios sense desmuntar el control a la primera selecció. Estils proposats, en la mateixa capa de components:

```css
.ia-interaction-options {
  display: grid;
  gap: var(--sdp-space-2);
  min-width: 0;
  padding: 0;
  border: 0;
}
.ia-interaction-option {
  display: flex;
  align-items: center;
  gap: var(--sdp-space-2);
  min-height: var(--sdp-touch);
  padding: var(--sdp-space-2);
  color: var(--sdp-text-cos);
  cursor: pointer;
}
```

Els 15 agents futurs procedixen del requisit de producte, no d'un cens verificat en esta auditoria. Quan hi haja catàleg aprovat, renderitzar cada opció amb ID estable, etiqueta i `disabled`; mai fer-la seleccionable amb un manejador buit. No assumir que el conjunt `agents` de contingut és el catàleg d'assistents disponibles. La IAIA del seed, per exemple, té un UUID de perfil diferent del slug de xat i del valor de preferència proposat: `src/sections/profile/agentsSeed.js:40-49`.

## 5. Migració oficial de la URL

**Proposta canònica: `/iaia` renderitza directament `TextRoute pageKey="anima"`.** La URL visible ha de quedar en `/iaia`; no ha d'acabar en `/jo/ia` ni en un fil de xat.

```jsx
// AppRoutes: substituir les definicions antigues, no duplicar-les.
<Route path="/iaia" element={<TextRoute pageKey="anima" />} />
<Route path="/ia" element={<Navigate to="/iaia" replace />} />
<Route path="/anima" element={<Navigate to="/iaia" replace />} />

// ActorRoutes: compatibilitat per a /jo i /e/:slug.
<Route path="ia" element={<Navigate to="/iaia" replace />} />
<Route path="iaia" element={<Navigate to="/iaia" replace />} />
```

El router és propi i tria el primer `Route` que concorda; no es pot deixar la definició antiga de `/iaia` per davant de la nova. Evidència: `src/app/contexts/RouterContext.jsx:222-242`.

Coordinació imprescindible:

| Punt actual | Canvi proposat |
| --- | --- |
| `src/app/App.jsx:547-549,590` | Aplicar la taula anterior. |
| `src/config/sections.js:23` | `path:'/iaia'`; conservar `id:'ia'` i `pageKey:'anima'` per no mesclar URL amb identitat interna. |
| `src/config/navigation.js:19-31` | `anima`, `ia` i el nou àlies `iaia` resolen a `/iaia`. |
| `src/app/App.jsx:77-83,273` | Respectar l'abast global de la secció IAIA; no prefixar `/jo` o `/e/...` a un enllaç que ha de ser canònic global. |
| `src/app/contexts/RouterContext.jsx:155-167` | Provar que l'enllaç lateral continua actiu després de navegar a la URL global. |

Per a este últim punt, afegir una propietat explícita de secció, per exemple `routeScope:'global'`, i usar un resolutor de rutes comú. No inferir l'abast de totes les seccions a partir de `kind:'text'`. El canvi pot introduir-se només per a IAIA i ampliar-se posteriorment amb una auditoria pròpia.

El xat continua sent una ruta d'acció específica (`/jo/xat/:threadId` o la variant d'entitat), independent del document. No donar per provat que `iaia-maria` és un `threadId` vàlid: l'auditoria només verifica que la redirecció antiga usava eixa cadena. Evidència: `src/app/App.jsx:549,565-567`.

## 6. Contracte per al manual i les skills

Les fonts operatives consultades són `.agents/skills/app-grid-shell/SKILL.md:13-39` i `.agents/skills/pedra-seca/SKILL.md:25-29,65-79`. IAIA MarIA ha d'actualitzar estes fonts canòniques i el catàleg abans de connectar la nova lògica. No s'ha editat cap mirror en esta auditoria.

Regles proposades per a fixar-hi:

1. `AppShell` governa la closca; `AppGridShell` governa únicament l'espai de treball interior.
2. En escriptori, Sidebar visible i `main` compartixen un pare flex explícit. Sense `fixed`, `absolute`, transformacions de desplaçament ni marges compensatoris per a la Sidebar d'escriptori.
3. Un estat React per instància governa el mode i la visibilitat. Cap classe de `body`, consulta global o pseudoelement fa de controlador de navegació.
4. En compacte, una sola instància del menú dins d'un calaix accessible; els controls ocults no participen en el focus.
5. TopBar: cinc controls de dreta, ordre fix, objectiu tàctil mínim del token, colors `--sdp-crom-*`, indicador IA amb significat accessible.
6. El botó IA obri el selector. `/iaia` és la pàgina completa. El xat és una acció diferent.
7. Cap estil inline nou. Les classes de la closca tenen un únic propietari CSS i no depenen de `:has()`.
8. Cap nova invariant es dona per blindada només amb una cerca textual: cal una prova de comportament i, per a geometria, navegador real.

## 7. Proves d'acceptació que ha d'executar la implementació

Esta és la bateria proposada; **no s'ha executat en esta auditoria**.

| Àrea | Casos | Condició de pas |
| --- | --- | --- |
| Sidebar en flux | 1101, 1280, 1440 i 1920px d'instància | `sidebar.right <= main.left + 1px`; `main.width + sidebar.width ≈ shell.width`; sense scroll horitzontal. |
| Toggle d'escriptori | Obrir/tancar repetidament | `main` recupera l'amplària exacta; l'estat accessible concorda en tots els disparadors. |
| Frontera responsive | 1100, 1101 i amplàries fraccionàries al voltant del tall | Una sola condició de mode, sense interval mort ni bucle de ResizeObserver. |
| Compacte | 320, 360, 375, 480, 720 i 1100px | Calaix inicialment tancat; cinc controls drets visibles, sense encavalcament ni reducció de l'objectiu tàctil. |
| Contenidor | Finestra de 1440px amb instància de 800px | La closca entra en compacte per l'amplària disponible. |
| Graella interior | Notes o altre workspace, Sidebar visible i oculta | La graella es recalcula i queda dins de `main`; els seus panells no es confonen amb el menú global. |
| Teclat | Tab, Shift+Tab, Escape, selecció de ruta | Cap focus en elements ocults; retorn o successor de focus vàlid; cap doble diàleg obert. |
| Selector IA | Obertura, `none`, `iaia`, tancament | Obrir/seleccionar no canvia la ruta; ràdios i llum concorden; cap petició IA causada per seleccionar. |
| Rutes | `/iaia`, `/ia`, `/anima`, `/jo/ia`, `/jo/iaia`, variants d'entitat | URL final `/iaia`, pàgina `anima`, sense bucles; enrere no queda atrapat en àlies. |
| Llengua i sessió | Idiomes suportats, convidat i usuari amb/sense avatar | Les cinc posicions continuen estables i amb noms accessibles. |
| Tema i moviment | Clar, fosc i moviment reduït | Closca sempre fosca, focus visible i indicador comprensible sense animació. |
| Muntatge | Web normal i ShadowRoot; dos embeds amb router en memòria | Toggling en una instància no modifica les classes ni l'estat de l'altra. Validar explícitament l'abast documental dels modals. |

Les proves d'estat/rutes poden ser de component. Les de rectangles i CSS computat han de ser de navegador: ni JSDOM ni la porta textual de graella certifiquen l'absència d'encavalcament. Comprovar també focus i scroll després de navegar des d'un diàleg, perquè el focus de ruta i el retorn del modal tenen propietaris diferents.

## 8. Ordre d'aplicació i límits del lliurament

1. Documentar i mostrar al catàleg els estats de closca i selector.
2. Fer explícit `AppShell`, extraure `Sidebar` i substituir els toggles imperatius per estat local; integrar el calaix i el seu focus.
3. Consolidar les regles CSS de la closca i la navegació compacta; retirar les regles incompatibles, inclosos els `!important` antics.
4. Fixar la fila de cinc controls i connectar el selector al seu estat compartit.
5. Migrar conjuntament rutes, catàleg de seccions i resolució d'enllaços a `/iaia`.
6. Executar les proves anteriors, reconciliar les tres K4 i actualitzar les skills canòniques.

No s'ha executat `npm run build`: el seu encadenament genera tokens, índexs i altres resultats, cosa innecessària en una auditoria sense implementació. Evidència: `package.json:62-70`. Tampoc s'ha executat `tancament.mjs`, perquè invoca la sincronització de skills abans d'auditar; este encàrrec reserva eixes actualitzacions a IAIA MarIA. Evidència: `tooling/gates/tancament.mjs:18-29`. No s'ha actualitzat `.agents/ESTAT.md` per mantindre l'abast documental de l'informe.

La proposta és concreta per a implementar, però no es presenta com a codi provat ni com a garantia d'immutabilitat futura. La incidència visual original queda pendent de reproducció amb les mides i els estils computats del cas real.

Verificació del lliurament: 58 cites de ruta amb fitxer i interval de línies existents; metadades de l'informe comprovades contra `tooling/wiki/schema.json`, sense errors en els camps utilitzats; 16 fitxers de referència de codi, CSS, configuració i skills amb el mateix SHA-256 abans i després de redactar. Esta comprovació de metadades és específica de l'informe i no equival a declarar neta tota la Wiki.
