---
type: informe
status: esborrany
description: Auditoria Claude d'AppShell, Sidebar, contextos i les vistes Pobles, Notes i Disseny amb defectes citats i contrast amb Codex
tags:
  - arquitectura
  - disseny
---

# Auditoria Claude — AppShell, Sidebar i vistes trencades

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-ESTUDI-260919-2032 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 20:32 · Europe/Madrid |
| Modificació | 26-09-19 20:32 · Europe/Madrid |
| Agent redactor | Claude (Cowork) |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | sí |
| Tall auditat | HEAD `214f5c7c` + arbre de treball brut (83 entrades a `git status`) |

## Vincles

- [[00_index_escriptori]]
- [[260919_1955_PROMPT_Auditoria_AppShell]]
- [[260919_2024_estudi_codex_appshell]]
- [[260919_1945_ACTA_MARMOTA_Fusion_Sidebar]]

## Contracte complit

Auditoria feta exclusivament amb lectura del codi local. **Cap cerca web, cap navegador, cap servidor de desenvolupament, cap consulta al backend.** **Cap línia de codi modificada, afegida ni esborrada.** «Pedra Seca» s'ha llegit sempre com el Sistema de Disseny. Les cites `ruta:L` corresponen a l'arbre de treball del tall indicat, que en diversos fitxers **no coincidix amb HEAD**; quan la diferència importa, es diu.

Del `.env` només s'han llegit **noms de clau** i el valor no secret `VITE_DATA_MODE`. Cap credencial s'ha imprés ni es reproduïx ací.

---

## Veredicte

He confirmat **18 defectes**. En classifique **4 com a P0** (bloqueig total o carreró sense eixida per a l'usuari), **6 com a P1**, **5 com a P2** i **3 com a P3**.

He **refutat 4 hipòtesis** que semblaven plausibles i que no s'aguanten contra el codi. Van al final, perquè no perdeu temps.

I dic ja el que no puc dir: **no puc certificar 40 ni 50 anys.** Ningú pot. El que sí que puc fer, i faig a la secció final, és assenyalar l'única cosa estructural que hui impedix eixa durabilitat i que es pot arreglar amb un canvi acotat.

### Contrast amb l'informe de Codex (`260919_2024`)

He llegit l'informe de Codex **després** de tancar la meua cacera, per no contaminar-la. El resultat del creuament:

| Troballa de Codex | Veredicte meu |
| --- | --- |
| F01 · `subs.add` de Preact sobre `null` | **CONFIRMADA** amb verificació independent, i **completada**: he trobat el disparador concret (vegeu C01) |
| F02 · el `Dialeg` obri un menú que el CSS amaga | **CONFIRMADA** (C02) |
| F03 · AppShell mesura i modifica el `body` de l'amfitrió | **CONFIRMADA** i **agreujada**: és un carreró sense eixida (C03) |
| F04 · `quanLlest()` pendent per sempre | **CONFIRMADA** (C04) |
| F07 · ordre temporal de Pobles no implementat | **CONFIRMADA** (C11) |
| F08 · Pobles convertix errors en «Cap poble trobat» | **CONFIRMADA** (C10) |
| F10 · `sessionStorage` sense protecció al carregador de Disseny | **CONFIRMADA** (C16) |
| F12 · `ResizeObserver` sense detecció | **CONFIRMADA** (C06) |
| F13 · `SidebarContent` recrea el subarbre; `aria-expanded` fix | **CONFIRMADA** (C05, C13) |
| F01, nota sobre `useRecarregaExterna` | **CONFIRME LA SEUA REFUTACIÓ**: no hi ha acumulació d'oients. Però la rotació per render sí que existix i té cost (C14) |

Vuit troballes meues **no apareixen a l'informe de Codex**: C07, C08, C09, C12, C15, C17, C18 i el diagnòstic de l'entorn local (C19). La C07 és, al meu parer, la més valuosa de totes perquè explica un símptoma de l'editor de Notes que ningú ha sabut reproduir.

---

## P0 · Bloqueig total o carreró sense eixida

### C01 · P0 · El `.add()` sobre `null`: proveïdor mort + ruta diferida

**El que passa de veritat.** El projecte no executa React: `vite.config.js:35-39` reescriu `react`, `react-dom`, `react-dom/client` i els runtimes JSX cap a `preact/compat`. La instal·lació local és **Preact 10.29.8**.

A `node_modules/preact/src/create-context.js`, el proveïdor guarda els subscriptors en un `Set` i **l'anul·la en desmuntar-se**:

```
let subs = new Set();
this.componentWillUnmount = () => { subs = NULL; };
this.sub = c => { subs.add(c); ... };     ← sense guarda
```

I `node_modules/preact/hooks/src/index.js:364-382` fa:

```
const provider = currentComponent.context[context._id];
...
if (state._value == null) { state._value = true; provider.sub(currentComponent); }
```

`provider` ix del **context capturat al vnode**, no d'una consulta viva. Si eixe proveïdor ja s'ha desmuntat, `subs` val `null` i `subs.add(c)` llança exactament `Cannot read properties of null (reading 'add')`, **atribuït al marc que ha cridat `useContext`** — és a dir, `useCoreContent`. Coincidix caràcter per caràcter amb l'error de la consola.

**El disparador, que és el que faltava.** Els cinc proveïdors de dades porten `key` derivada de l'actor (`src/app/App.jsx:469-474`):

```
<CoreContentProvider key={`core-${actorKey}`} ...>
  <MurProvider key={`mur-${actorKey}`} ...>
    <NotesDataProvider key={`notes-${actorKey}`} ...>
```

I `actorKey` **canvia sol, després d'arrencar**: `src/app/contexts/IdentitatContext.jsx:19` fa `currentUser?.id || getSafeDefaultUserId()` i `:36` el compon. La sessió naix en `'comprovant'` amb `usuari: null` (`src/data/sessionService.js:9-14`) i es resol de forma asíncrona. En eixe instant `actorKey` canvia → **canvi de `key` → Preact destruïx els cinc proveïdors i en munta de nous** → els vells es queden amb `subs = null`.

Al mateix temps, Pobles, Notes i Disseny són **rutes diferides** (`src/app/App.jsx:20`, `:23`, `:33`). Si el seu `import()` es resol **travessant** eixa frontera, el component es renderitza amb el context vell capturat, crida `useCoreContent()` → `useContext` → `provider.sub()` → **TypeError**.

Això explica per què peten **precisament** eixes tres vistes i no la ruta per defecte: `/xat` sol resoldre el seu tros abans que la sessió es decidisca.

**La línia 149 no existix.** `src/app/contexts/CoreContentContext.jsx` té **82 línies** ara i **77** a HEAD. La traça de la consola ve d'un artefacte anterior. Hi ha un `dist/` construït hui a les 18:11 i el seu CSS encara **no porta** el `min-width: 0` que sí que teniu a `src/css/layout.css:47`: eixe `dist/` és ranci respecte de l'arbre. Abans de perseguir cap línia, recarregueu net.

**Criteri de correcció.** No toqueu Preact. El problema és el patró: **`key` volàtil en un proveïdor que té fills suspesos**. O l'arrel de dades no es remunta per identitat (i es recarrega per dins), o la frontera de suspensió queda **per damunt** del proveïdor amb `key`, de manera que cap fill diferit puga resoldre's a cavall del canvi.

**Límit honest.** La cadena està derivada del codi, no reproduïda en navegador — l'encàrrec me'l prohibix. Els dos extrems (el `subs = null` de Preact i el canvi de `actorKey`) sí que estan verificats en el codi real.

### C02 · P0 · El menú de mòbil s'obri buit

A mode compacte AppShell munta el `nav` dins del `Dialeg` (`src/app/App.jsx:323-334`). Però a `src/css/layout.css:321-334`, dins de `@media (max-width: 1100px)`:

```
nav.app-sidebar {
  position: fixed; inset: 0 auto 0 0;
  transform: translateX(-102%);
  visibility: hidden;
}
```

L'única regla que ho desfà és `nav.app-sidebar.sidebar-open` (`layout.css:335`) i **`sidebar-open` no l'aplica ningú**: el `grep` de tot `src/` només el troba al mateix CSS. El codi que la posava es va esborrar en el refactor (ho veig al diff de `App.jsx`, on el `onClick` antic feia `sidebar?.classList.toggle('sidebar-open')`). **La classe va morir; les regles van quedar.**

Els estils del diàleg (`src/css/components.css:198-204`) toquen `.sdp-dialeg--calaix` i el seu marc, mai les propietats del `nav` fill. `visibility: hidden` pròpia guanya sempre l'heretada.

**Per què podeu creure que el mòbil funciona.** Dues raons compatibles amb el que veieu:

1. El marc del `<dialog>` sí que apareix: títol «Menú Sóc de Poble» i botó de tancar. El buit és el contingut.
2. **Incrustat**, el mode el decidix l'amplada del `body` de l'amfitrió (vegeu C03) mentre la media query mira el *viewport*. Un bloc de 900 px dins d'una pàgina de 1600 px activa el `Dialeg` **sense** activar la media query: allí el menú es veu. És el mateix defecte des de l'altra cara.

### C03 · P0 · Incrustat, tancar la barra lateral és irreversible

`src/app/App.jsx:92-98` escriu la classe al `body` del document:

```
document.body.classList.add('sidebar-closed');
```

Dins de `<soc-de-poble>`, React viu en un **shadow root tancat** (`src/PedraSecaEmbed.jsx:298`) sobre un `<div class="sdp-root">` (`:323-328`). `document.body` és el `body` **de la pàgina de Sollutia**, fora de l'ombra.

El CSS que ha de tornar a mostrar el botó d'obertura exigix la classe a `:host` o a `.sdp-root` (`src/css/layout.css:574-581`). Cap de les dues la rep. I per defecte eixe botó està amagat: `src/css/layout.css:189` → `.mobile-logo-wrapper { display: none; }`.

La barra sí que desapareix, perquè l'amaga l'estil en línia (`src/app/App.jsx:336`). **Però l'únic control per a recuperar-la es queda invisible.** L'altre botó (`.brand`, `App.jsx:269`) viu dins de la barra que s'acaba d'amagar. La navegació mòbil no en té cap i a escriptori està en `display: none` (`layout.css:318`).

**Resultat: l'usuària tanca el menú i ja no el pot tornar a obrir. Només recarregant.** Per a la gent gran a qui va dirigit açò, això és una porta tancada amb clau.

A més viola la **Llei de l'Enxufabilitat (AGENTS.md §8)**: escrivim una classe al `body` de l'amfitrió i, amb dos blocs a la mateixa pàgina, se la disputen.

### C04 · P0 · Una arrencada fallida penja l'aplicació per sempre, en silenci

`src/host.js:92` crea la promesa amb **només** `resolve`:

```
const promesaLlest = new Promise(resolve => { resolveLlest = resolve; });
```

Es resol a `:200`, dins del `try`. El `catch` de `:202-207` restaura l'estat i rellança, però **no rebutja mai `promesaLlest`**. No hi ha ni temps màxim ni camí d'error.

I hi ha **sis** punts que hi esperen abans de llegir res:

- `src/app/contexts/CoreContentContext.jsx:28-29`
- `src/sections/notes/NotesDataContext.jsx:40`
- `src/sections/mur/MurContext.jsx:25-26`
- `src/sections/multimedia/MultimediaContext.jsx:22-23`
- `src/sections/xat/XatContext.jsx:170-171` i `:202-203`

L'entrada web crida `arrenca()` sense esperar-lo ni capturar-lo (`src/main.jsx:20`). Si `arrenca()` falla — per exemple, si l'`import('./data/supabase/index.js')` de `host.js:181` no arriba per xarxa — **tota l'aplicació es queda carregant indefinidament, sense error, sense avís i sense reintent**. El `AbortController` de cada context no cancel·la aquesta espera, perquè és anterior al `fetch`.

Coincidix amb la F04 de Codex. Ho pose en P0 i no en P1 perquè no hi ha cap camí de recuperació automàtic: és mort silenciosa de tot el producte.

---

## P1 · Bloqueig d'un flux o defecte estructural greu

### C05 · P1 · El menú es reconstrueix sencer a cada render

`src/app/App.jsx:267` declara el component **dins** d'AppShell:

```
const SidebarContent = () => ( ... );
```

i el renderitza com a element a `:332` i `:337`. Cada render d'AppShell crea una **funció nova**, o siga un **tipus de component nou**: Preact desmunta l'arbre anterior i en munta un de zero.

Amb el `ResizeObserver` de `:74-81` actualitzant `containerWidth` **a cada píxel** d'un redimensionament, això és una destrucció i reconstrucció completa del menú per fotograma. Sumeu-hi cada canvi de `useUIState()` i cada avís.

Conseqüències reals, no teòriques: **el focus del teclat es perd** cada vegada (l'usuària que navega amb tabulador acaba al `body`), la posició de desplaçament del menú es reinicia, i és una font contínua de rotació de nodes DOM. És exactament el «fraccionar-se» que temeu en dispositius vells.

### C06 · P1 · `ResizeObserver` sense detecció mata l'aplicació sencera

Tres instanciacions directes, cap guarda en tot `src/`:

- `src/app/App.jsx:74`
- `src/components/layout/AppGridShell.jsx:97`
- `src/components/universal/UniversalToolbar.jsx:13`

La d'`App.jsx` viu dins d'`AppShell`, i **AppShell està per damunt de tots els límits d'error de ruta**: el seu únic límit és l'`ErrorBoundary` global de `src/PedraSecaEmbed.jsx:58`. En un motor sense `ResizeObserver`, l'excepció no deixa una secció trencada: **deixa l'aplicació sencera en la pantalla d'error**.

No fixe ací cap taula de compatibilitat: no l'he consultada i l'encàrrec m'ho prohibix. El que sí que afirme és que el codi **no té cap camí de reserva** i que `vite.config.js:55` declara `target: 'es2020'`, que és una promesa sobre la *sintaxi*, no sobre les *API del navegador*. Són dues coses diferents i ací s'han confós.

### C07 · P1 · Un sol toc a la pantalla trenca el menú de barra de l'editor per sempre

Aquesta no l'ha vista ningú i explica un símptoma de Notes molt difícil de reproduir.

El gest d'estirar per recarregar escriu `transform` sobre `.app-main__content` (`src/app/App.jsx:357` és l'element; `:202-203` i `:249-252` l'escriuen). En acabar el gest:

```
contentEl.style.transform = 'translateY(0px)';
```

**`translateY(0px)` no és `none`.** Un `transform` diferent de `none` convertix l'element en el **bloc contenidor de tots els seus descendents amb `position: fixed`**. I no es neteja mai: no hi ha cap camí que torne a posar `transform: ''`.

Pitjor encara: `onTouchStart` (`:219-228`) s'activa amb **qualsevol** toc si `contentEl.scrollTop === 0`, i `onTouchEnd` (`:240-254`) executa tot el bloc de reinici encara que no s'haja estirat res. **Un simple toc a dalt de qualsevol pàgina instal·la el `transform` permanentment.**

La víctima concreta: `.sdp-slash-menu` és `position: fixed` amb coordenades de viewport (`src/css/modules.css:744`, i `src/components/universal/richText/extensions/slash.js:16` documenta que usa `coordsAtPos`). Viu dins de l'editor de text ric, o siga **dins de `.app-main__content`**. Després del primer toc, el menú de barra apareix **desplaçat**, i només en dispositius tàctils. És el tipus de defecte que fa perdre una setmana.

**Criteri.** El gest no pot deixar residu d'estil. I un menú flotant no s'ha de fixar al viewport dins d'un contenidor que es pot transformar.

### C08 · P1 · La llavor sap llegir però no sap escriure

L'entorn local d'ara mateix: `.env` porta **només** `VITE_TENANT_ID`; `.env.local` porta **només** `VITE_DATA_MODE=seed`. **No hi ha `VITE_SUPABASE_URL` ni `VITE_SUPABASE_ANON_KEY` en cap fitxer d'entorn.** Per tant `hasSupabaseConfig` és fals (`src/data/supabase/runtime.js:32`).

El mode llavor està implementat **només en les lectures**:

- `src/data/supabase/content.js:9` i `:70` → lectures de Core
- `src/data/supabase/notes.js:13` → lectura de Notes

I **en cap escriptura**:

- `src/data/supabase/notes.js:35` → `throw new Error('No es pot crear la nota sense connexió.')`
- `src/data/supabase/notes.js:49` → `throw new Error('ATURADOR CRÍTIC: No es pot actualitzar una nota sense connexió al servidor.')`

Resultat en el vostre entorn actual: **Notes carrega i es veu, però cap desat funciona**. Cada autodesat de l'editor llança i el gestor en segon pla mostra l'error. És, molt probablement, el «Notes està incompleta» que reporteu — i no té res a veure amb l'AppShell.

Codex va deixar açò com a incògnita («Dades remotes»). No calia obrir el servidor: n'hi havia prou amb mirar els noms de clau de l'entorn.

**Criteri.** El contracte `dataMode` ha de ser simètric. O la llavor és de només lectura **i es diu clarament a la interfície**, o també ha d'acceptar escriptures en memòria. El que no pot fer és aparentar que funciona i fallar en desar.

### C09 · P1 · L'enllaç «Salta al contingut» és invisible

`src/app/App.jsx:321`:

```
<a href="#main-content" className="sr-only sr-only-focusable sdp-skip-link">
```

`.sr-only` existix (`src/css/base.css:229-232`) i retalla l'element a 1×1 px amb `clip`. Però **`.sr-only-focusable` i `.sdp-skip-link` no tenen cap regla CSS en tot el projecte**. Ho he comprovat amb `grep` sobre tot `src/`: les úniques aparicions són eixa línia de JSX.

O siga: l'enllaç rep el focus amb el tabulador però **no es fa visible mai**. Qui navega amb teclat i hi veu — la majoria de gent gran amb tremolor o amb ratolí incòmode — rep el focus en un element que no pot localitzar. És un incompliment de WCAG 2.4.7 (focus visible) i buida de sentit el 2.4.1 (saltar blocs).

S'hi suma que `src/app/App.jsx:120-124` enfoca `main` **també en el primer muntatge**, cosa que mou el focus més enllà de l'enllaç abans que ningú el puga usar.

### C10 · P1 · «Cap poble trobat» és la mateixa cara per a cinc situacions diferents

`src/app/contexts/CoreContentContext.jsx:49` retorna `sortedTowns: []` **sempre** que no estiga `ready` — càrrega i error inclosos. I `src/sections/pobles/PoblesSection.jsx:82-85` només mira la longitud:

```
{sortedTowns.length === 0 && ( ... 'Cap poble trobat.' )}
```

L'usuària no pot distingir: està carregant / falten credencials / ha caigut la xarxa / el catàleg és buit / no hi ha pobles de veritat. La vista no té estat de càrrega, ni missatge d'error, ni botó de reintent. `PoblesSection` ni tan sols llig `status` (`:10`).

Coincidix amb la F08 de Codex. Li pose P1 i no P2 perquè, combinat amb C01 i C04, és **el mecanisme que amaga tots els altres errors**: sempre que alguna cosa falla amunt, ací només es veu una frase educada. Aquesta pantalla és la raó per la qual heu estat depurant a cegues.

---

## P2 · Degradació funcional o d'accessibilitat

### C11 · P2 · La regla de disseny de Pobles no està implementada enlloc

`src/sections/pobles/PoblesSection.jsx:18-28` declara en comentari que la pàgina ha d'ordenar-se per l'última publicació al Mur. No existix.

`sortedTowns` ve de `byId` (`src/app/contexts/CoreContentContext.jsx:54`), i `byId` **no ordena res**: és un desduplicador que conserva l'ordre d'entrada (`src/config/contentHelpers.js:19-27`). El nom menteix. El carregador tampoc no calcula activitat: `src/data/supabase/content.js:73` demana les claus `towns` i `agents` i prou.

Coincidix amb la F07 de Codex. Afegisc una conseqüència de nomenclatura que val la pena per a 40 anys: **una variable que es diu `sortedTowns` i no ordena és una trampa per a tot agent futur**. Es diu `dedupedTowns`.

### C12 · P2 · Columnes marcades `aria-hidden` amb botons dins

`src/components/layout/AppGridShell.jsx:215`, `:234` i `:253`:

```
inert={tancada.left ? true : undefined}
aria-hidden={tancada.left ? true : undefined}
```

Amb `inert` suportat, correcte. **Sense `inert`**, la columna queda amagada per al lector de pantalla **però els seus botons continuen sent accessibles amb tabulador**. L'usuària de lector de pantalla tabula cap a controls que el seu lector no li pot anunciar. És WCAG 4.1.2. No hi ha `tabindex="-1"` de reserva ni detecció de suport.

### C13 · P2 · `aria-expanded="false"` escrit a pedra

`src/app/App.jsx:383`:

```
<button ... aria-label="Obrir menú" aria-expanded="false" aria-controls="app-sidebar" ...>
```

És una constant. El menú s'obri i el botó continua dient «tancat» per sempre. El codi antic sí que l'actualitzava (`e.currentTarget.setAttribute('aria-expanded', willOpen)`); el refactor el va deixar fix. El germà de dins de la barra sí que el calcula bé (`:269`).

Coincidix amb la F13 de Codex.

### C14 · P2 · `useRecarregaExterna` es resubscriu a cada render

`src/app/contexts/useRecarregaExterna.jsx:19` té `[onRefresh]` com a dependència, i les dues crides li passen una fletxa nova cada render: `src/app/contexts/CoreContentContext.jsx:68` i `src/sections/notes/NotesDataContext.jsx:150`.

**Confirme la refutació de Codex**: no hi ha acumulació d'oients, perquè `removeEventListener` i `addEventListener` estan aparellats. El que hi ha és **rotació**: dos `addEventListener` i dos `removeEventListener` sobre `window` per cada render de cada proveïdor. No és una fuita; és soroll constant que en maquinari vell es paga.

### C15 · P2 · Un efecte secundari dins d'un actualitzador d'estat pot perdre l'amplada de columna

`src/components/layout/AppGridShell.jsx:123-140`:

```
let nextStateToSave = null;
setColumnWidths((current) => { ...; nextStateToSave = nextState; return nextState; });
if (nextStateToSave) setVal('sdp-grid-widths', nextStateToSave);
```

L'actualitzador **escriu en una variable de fora**: no és pur. L'aplanador pot invocar-lo de forma diferida (i en mode estricte, dues vegades). Quan s'invoca després de la línia 139, `nextStateToSave` encara val `null` i **l'amplada no es guarda**, sense cap error. L'usuària redimensiona, recarrega i es troba la columna com estava.

---

## P3 · Deute que caldrà pagar

### C16 · P3 · El carregador de Disseny pot suïcidar-se amb el seu propi marcador

`src/sections/disseny/cataleg/detailRegistry.jsx:5-7` llig i interpreta `sessionStorage` **abans** del `try`:

```
const pageHasAlreadyBeenForceRefreshed = JSON.parse(
  window.sessionStorage.getItem('sdp-chunk-refreshed') || 'false'
);
```

Un marcador amb JSON invàlid llança `SyntaxError` i **l'importador no s'arriba a cridar**. Un navegador que denega l'accés a l'emmagatzematge (navegació privada) fa el mateix. El mecanisme de reintent impedix la càrrega pel seu propi estat auxiliar. Coincidix amb la F10 de Codex.

A més, `:17` fa `window.location.reload()` i retorna una promesa que no es resol mai. És el **segon** lloc del codi que usa la recàrrega completa com a eina (l'altre és `src/app/App.jsx:243`). Per a un poble amb cobertura roïna, una recàrrega és tornar a baixar-ho tot. **Recarregar no és una estratègia de recuperació; és rendir-se.**

### C17 · P3 · `AppGridShell.css` ha canviat de capa en l'arbre de treball, sense verificació

El diff local llevà el `@layer components { }` que embolcallava el fitxer. Com que `src/css/index.css:64` ja l'importa amb `layer(components)`, abans les seues regles vivien en la subcapa `components.components` i **perdien contra tot el que està sense subcapa dins de `components`** (`components.css`, `modules.css`). Ara competixen d'igual a igual i, per ordre d'importació, **guanyen els empats**.

El canvi **harmonitza** amb `src/sections/profile/PerfilShell.css`, que mai ha portat embolcall intern, i per tant em sembla correcte. El que no és correcte és haver-lo fet **sense comprovació visual**: la capçalera del vostre propi `index.css:10-44` documenta, amb tot detall, un accident de cascada exactament d'aquesta família. Cap porta ho detecta, perquè les portes compten cadenes, no resolen cascades.

### C18 · P3 · El Sistema de Disseny declarat és un fitxer de 29 bytes

`_wiki_de_poble/02_saber/estandard_ui_universal.md:51` diu, com a norma canònica: «Tota regla visual viu exclusivament a `public/assets/pedra-seca.css`».

`public/assets/pedra-seca.css` ocupa **29 bytes** i el seu contingut sencer és `/* Pedra Seca placeholder */`. Les regles de veritat viuen a `src/css/`. I `tooling/brain/crear_bundle.mjs:134` **inclou eixe fitxer buit als bundles** que envieu al Consell.

O siga: cada IA externa a qui demaneu una auditoria del Sistema de Disseny rep un comentari buit i la instrucció que allò és l'única font de veritat. Per a un projecte que vol durar dècades, **una norma escrita que apunta a un fitxer buit és pitjor que no tindre norma**: cada agent futur hi perdrà el mateix temps.

### C19 · P3 · Restes del refactor

- `buildPath` és hui la funció identitat, en dos llocs: `src/app/App.jsx:109-111` i `:614-616`.
- `actorType` i `actorId` es desestructuren i no s'usen: `src/app/App.jsx:107` i `:612`.
- `:host(.has-sidebar-open)::after`, el vel fosc del calaix (`src/css/layout.css:343-356`), és codi mort: ningú posa `has-sidebar-open`, i en l'aplicació autònoma `:host` no existix.
- `nav.app-sidebar.sidebar-open` (`src/css/layout.css:335`): mort, vegeu C02.

---

## Hipòtesis que he refutat

Les pose perquè no les perseguiu.

1. **«Falta el contenidor flex i per això la barra ocupa la pantalla.»** **No al tall actual.** `src/css/base.css:41-49` declara `display: flex` per a `.sdp-root`, `#root` i `:host`; el `nav` té base fixa (`layout.css:44`) i el `main` és flexible (`layout.css:16`). He verificat també que la regla **sobreviu al build**: apareix íntegra a `dist/assets/index-efioT-TX.css`. Cap variable CSS de `layout.css` ni d'`AppGridShell.css` queda òrfena (comprovació mecànica de totes les `var(--…)` contra totes les declaracions). El símptoma que descriviu no té hui suport en el codi. Coincidix amb la primera incògnita de Codex. **Però vegeu la secció següent: el motiu pel qual va passar continua viu.**

2. **«DesignSection li passa un model incompatible a UniversalWorkspace.»** Fals. `src/components/universal/workspace/UniversalWorkspace.jsx:45-47` accepta les dues formes (`navigationGroups` i `categories`) i `:136-138` té reserva explícita.

3. **`import ... from './cataleg/detailRegistry'` sense extensió apuntant a un `.jsx`** (`src/sections/disseny/DesignSection.jsx:7`). Sospitós, i és **l'única importació sense extensió cap a un `.jsx`** de tot `src/`. Però `vite.config.js:32-41` no sobreescriu `resolve.extensions`, i `.jsx` és a la llista per defecte de Vite: resol bé. És fragilitat, no fallada.

4. **«`recullTornadaOAuth` mostrarà un avís d'error en cada càrrega amb un backend de Sollutia.»** Fals: està al `CONTRACTE_NUCLI` (`src/data/contracte.js`), i `host.js:153-156` impedix arrencar amb un backend que no l'implemente.

5. **«Els pobles de la llavor no tenen `id` i per això `byId` els descarta.»** Fals: els nou registres de `src/sections/pobles/townsSeed.js` porten `"id"`.

---

## La resposta a la pregunta dels 40 anys

Em demaneu una estructura immutable per a mig segle. No vos la puc garantir, i qui vos la garantisca vos enganya. El que sí que vos puc dir és **quina és, exactament, la peça que hui ho impedix**, perquè n'hi ha una i és concreta.

**AppShell no té cos.**

`src/app/App.jsx:319-363` retorna un fragment: un enllaç, un `nav`, un `main` i la navegació mòbil, **solts**. El component no posseïx cap element propi. Per tant depén d'una promesa que ningú signa: que **el seu pare, siga qui siga, resulte ser un contenidor flex en fila**.

Eixa promesa la sosté hui una sola regla, `src/css/base.css:41-49`, que:

- viu en **`@layer reset`**, la capa **més feble** de les cinc (`src/css/index.css:45`), de manera que qualsevol regla sense capa de l'amfitrió la guanya — i `index.html:47-53` ja demostra que hi ha estils sense capa tocant `#root`;
- enumera **tres selectors escrits a mà** (`.sdp-root`, `#root`, `:host`);
- i no té cap relació amb el component que en depén. No hi ha cap comentari a `App.jsx` que diga «el meu pare ha de ser flex». Res ho verifica.

I `PedraSecaEmbed` **s'exporta com a component React corrent** (`src/PedraSecaEmbed.jsx:44`). `src/main.jsx:33` el munta dins de `#root` per casualitat afortunada. Qualsevol amfitrió, hui o d'ací a deu anys, el pot muntar dins d'un `<div>` qualsevol — i en eixe moment `flex: 0 0 260px` deixa de significar res, el `nav` passa a ser un bloc de nivell superior amb `display: flex` i **ocupa el 100% de l'amplada i el 100% de l'alçada, empenyent `main` fora de la pantalla**. És, literalment, el símptoma que heu patit.

Que hui no passe no vol dir que estiga resolt. **Vol dir que teniu sort.**

El que vos fa falta, i és un canvi acotat:

1. **AppShell ha de retornar un element propi** amb la seua pròpia disposició. Que la graella siga interna, no heretada. Aleshores l'amfitrió pot ser el que vulga.
2. **Una sola font de veritat per al mode compacte.** Ara en teniu dues que es contradiuen: JavaScript mesura el `body` de l'amfitrió (`App.jsx:74-83`) i el CSS mesura el viewport (`layout.css:321`). Que el component mesure **la seua pròpia caixa** i publique el mode com a atribut de dades; que el CSS només llija eixe atribut. Cap media query global a l'esquelet.
3. **Cap estat visual al document.** Ni classes al `body`, ni `:host(...)` depenent de qui escriu des de fora. L'estat viu a l'arrel de la instància, i amb dues instàncies a la mateixa pàgina han de ser independents.
4. **Una base de navegadors declarada i verificada**, amb comportament de reserva usable per a `ResizeObserver`, `inert`, `<dialog>.showModal()` i les capes en cascada. «Qualsevol dispositiu» no és una especificació; és un desig.
5. **Contractes de recurs explícits**: càrrega, error, buit i reintent com a estats de primera classe. Mentre «Cap poble trobat» siga la cara de cinc situacions diferents, cada error futur costarà el mateix que vos ha costat aquest.

Les quatre P0 d'aquest informe són cadascuna un punt únic de fallada total i silenciosa. **Cap gate actual en detecta cap.** Això, i no el nombre de defectes, és el que hauria de preocupar-vos: no és que hi haja errors, és que el sistema no té manera d'assabentar-se'n. Una arquitectura per a mig segle no és la que no falla mai; és **la que no pot fallar en silenci**.

---

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura. Inclou `node_modules/preact/src/create-context.js` i `node_modules/preact/hooks/src/index.js` per a verificar C01 de forma independent.
- [x] He citat la ruta i les línies del codi original en cada afirmació.
- [x] Cap nom de fitxer, funció o variable inventat. `sortedTowns`, `byId`, `quanLlest`, `subs`, `SidebarContent`, `.sr-only-focusable` i `.sidebar-open` s'han comprovat un per un.
- [x] Tota conjectura marcada. El límit de C01 (cadena derivada del codi, no reproduïda en navegador) està escrit dins de la troballa.
- [x] Cap línia de codi de l'aplicació modificada, afegida ni esborrada. Cap cerca web ni navegador.
- [x] Cinc hipòtesis pròpies refutades i publicades, i la refutació de Codex sobre `useRecarregaExterna` confirmada.
- [x] `tractor-frontmatter.mjs --estricte`: validat en còpia aïllada. 1 document, F1–F8 = 0, eixida 0. Ordre: `node tooling/wiki/tractor-frontmatter.mjs --estricte --arrel=<copia> --arrels=docs --json`. Només s'ha certificat el frontmatter d'aquest informe, no el corpus complet.

## Nota de tancament

No s'ha executat `tooling/gates/tancament.mjs`: escriu a l'arbre (sincronitza els espills de skills) i l'encàrrec exigix contenció absoluta. Queda pendent de decisió del Mestre, igual que l'actualització de `.agents/ESTAT.md`.
