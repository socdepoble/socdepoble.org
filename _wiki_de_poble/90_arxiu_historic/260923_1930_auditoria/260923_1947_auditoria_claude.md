---
type: informe
status: esborrany
description: 'La barra taronja no ha desaparegut: sense sessio l''app pinta EmptyDocumentPage. Quatre peces correctes sense endollar i el guarda que apaga el mode seed.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_a4817d03-08be-4102-b319-f36e4c0f6a77:f1a9888b-4db4-4070-8982-a119f0520d72
---
# Auditoria de la UniversalPage, la roda dentada i l'enxufabilitat amb Sollutia

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a4817d03-08be-4102-b319-f36e4c0f6a77:f1a9888b-4db4-4070-8982-a119f0520d72 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T17:47:35.956Z |
| Modificació | 2026-09-23T17:47:35.956Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5 (claude-opus-5) |
| Tokens consumits | ≈ 255.000 (estimació de la sessió sencera) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-09-23T17:47:35.956Z** · esborrany creat amb `document.mjs create`.
- **2026-09-23 19:47–20:05** · auditoria executada sobre el tall `f03affcb` **més l'arbre de treball brut** (hi ha 5 fitxers de CSS/tokens modificats i sense committejar; dos d'ells són part del cas). Torn `torn_a4817d03-08be-4102-b319-f36e4c0f6a77`, abast `code`, **zero fitxers de codi tocats** (Mode AFK del prompt de les 19:30).
- **Apunt de relleu:** el defecte **B0** de l'ESTAT de les 18:52 (`draft()` paria 8 files de Registre i el contracte n'exigia 10) **ja no es reproduïx**: este document ha nascut amb les 10 files, inclosa `Plantilla`. Algú l'ha reparat entre les 18:52 i ara.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

> **Dictamen en una frase:** la barra taronja **no ha desaparegut mai**. L'aplicació està pintant un component distint (`EmptyDocumentPage`) perquè no hi ha sessió, i no hi ha sessió perquè **no existix cap usuari a cap lloc**. La tasca 1 i la tasca 4 del prompt són el mateix defecte vist per les dos puntes.

### A1 · P0 · La barra taronja està viva, visible i mesurada. El que falla és quin component es pinta

La captura «espatllada» del Mestre i la «bona» no són dos estats del mateix component: **són dos components diferents**.

`DocumentEditor.jsx:144` bifurca:

- `document == null` → `EmptyDocumentPage` (`DocumentEditor.jsx:34-72`): barra taronja **reduïda a posta** — `barActions` és només `<DateTimeControl time={time} />` + `identityActions`. **Sense `date`** (per això es veu `19:36` i no `11:00 25/04/26`) i **sense el control d'estat** (cadenat/globus). A més **no rep `topBar`**, per això falta la fila d'eines `H2 · ≡ · B · I · S · PUBLICAR`.
- `document != null` → `UniversalEditorShell`, que a `UniversalEditorShell.jsx:315-336` sí que monta el `Dropdown` amb `<Lock/>`/`<Globe/>` **i** `<DateTimeControl time date />`.

I la identitat: `NotesEditor.jsx:98` fa `isExampleNote = activeNote?.id === 'n1'`. Sense `activeNote`, la branca és la falsa → `'Foraster'` / `'Identitat Lliure'` / rellotge en directe (`NotesEditor.jsx:107-110`).

**Mesura en viu** (Desktop 1440×900, `http://localhost:3340/notes`, pestanya del navegador integrat):

```
barOrange: { display: "flex", visibility: "visible", opacity: "1",
             position: "sticky", top: "58px", height: "58px", z-index: 99080,
             rect: { x: 832, y: 453, w: 593, h: 58 },
             text: "Foraster | Identitat Lliure | 19:41",
             bar-actions: "19:41" }
firstChildOfShell: "sdp-editor-document"      // no hi ha topBar
gearButtons: []
```

La barra ocupa els 593 px complets de la columna de l'editor i està a la pantalla. **Cap regla de CSS l'amaga.** La meua captura del Desktop reproduïx la del Mestre píxel a píxel.

- **Font de veritat en conflicte:** cap. El codi fa el que diu que fa; el que no es sosté és el diagnòstic de partida.
- **Proposta conservadora:** no tocar ni una línia de CSS per este motiu. Anar a A2.
- `requires_human_decision: false`.

### A2 · P0 · Un guarda escrit per al camí `remote` apaga el mode `seed` sencer

`NotesDataContext.jsx:158-171`:

```js
const userId = getCurrentUser()?.id;
if (!userId) {
  setData(... payload: { notes: [], noteFolders: [], notesComplete: true });
  return;                       // ← loadNotes no es crida MAI
}
```

Però `supabase/notes.js:58-66` diu:

```js
if (runtimeDataMode === 'seed') {
  const seed = await buildSeedAppData(ownerUserId);
  return buildResult(seed.notes || [], seed.noteFolders || [], true);
}
```

El camí `seed` **no mira la sessió, no toca Supabase i no necessita res**. El seu paràmetre per defecte ja és `ownerUserId = getDefaultUserId()` (`notes.js:20`), que `identitat.js:196` resol com la identitat de convidat.

**Provat en execució**, amb `getCurrentUser() === null`:

```
getCurrentUserIsNull: true
defaultUserId:        "f99c3a6f-4f48-4217-a76c-3e25d4fceb07"
loadNotes(undefined, { dataMode: 'seed' }) →
  nNotes: 2, ids: ["n1","n2"], nFolders: 8
  n1: { title: "Bloc de notes", author: "Sóc de Poble",
        location: "La Torre de les Maçanes", isPublished: true }
```

**Això és exactament la captura bona.** El contingut existix, és abastable sense sessió i sense backend encés; l'únic que hi ha entremig és eixe `if`.

La cadena sencera, de la causa a la captura:

1. `getCurrentUser()` → `null` (A7).
2. `NotesDataContext` torna `notes: []` sense consultar el seed.
3. `canCreate: Boolean(currentUser?.id) && …` → `false` (`NotesDataContext.jsx:429`) → «Connecta per veure les teues notes.» (`NotesSection.jsx:150`).
4. L'obertura automàtica de `n1` no dispara mai: `notes.some(n => n.id === 'n1')` és fals (`NotesSection.jsx:120-126`).
5. `activeNote` indefinida → `EmptyDocumentPage` → A1.

- **Font de veritat en conflicte:** `SELF-DESCRIBE.md §1` («Online-First estricte, Terminal Estúpid») justifica el guarda **per al camí `remote`**. El que no justifica és aplicar-lo quan `runtimeDataMode === 'seed'`, que és precisament el mode que el Mestre té posat a `.env.local`.
- **Proposta conservadora:** condicionar el guarda al mode, no llevar-lo. En pseudocodi: si el mode és `seed`, seguir avant amb `getDefaultUserId()`; si és `remote`, el guarda es queda com està.
- **Avís de la Llei del Píxel:** açò **canvia la pantalla molt** — i la canvia cap a la captura bona, que és l'ordre explícita del Mestre. No és una neteja: és el redisseny que ell ha demanat. Queda dit perquè ningú l'execute pensant que és invisible.
- `requires_human_decision: true` — cal que el Mestre confirme que vol que el mode `seed` pinte notes sense sessió (que és el que el mode `seed` significa), o si preferix atacar A7 i entrar de veres.

### A3 · P0 · La roda dentada existix, ningú la crida, i el panell que obria està mort

Tres peces, totes correctes, cap endollada:

1. **El botó.** `UniversalWorkspace.jsx:238-243`: `const settingsActions = onManageCategories ? [{ id:'settings', icona: Settings, … }] : [];` — `onManageCategories` només apareix set voltes al repositori i **totes set són la mateixa prop passant-se avall** dins de `UniversalWorkspace.jsx`. **Cap secció la proveïx**; `NotesSection.jsx:141-158` no la passa. Per tant `settingsActions` val `[]` sempre i **la roda no es pinta enlloc de l'aplicació**. Mesurat en viu: `gearButtons: []`, i els botons de les capçaleres són «Plegar o desplegar CARPETES», «Replegar CARPETES», «Tot», … sense cap engranatge.
2. **El reset de la graella.** `AppGridShell.jsx:163-169` té `applyPreset`, l'exposa al context (`:193`) i `PRESETS.defecte === DEFAULT_COLUMN_WIDTHS` (`:12-16`). **Zero cridants**: el `grep` de tot `src/` només troba la definició i les dos línies que la posen al context.
3. **El panell.** `UniversalSettingsPanel.jsx` va nàixer al commit `4468f33c` («feat(graella): ajustes de graella i panell de configuració», 13-09) amb els botons `Compacta` / `Per defecte` / `Ampla` sobre `applyPreset`, i el seu propi text deia «o **restaurar la mida original**». **El va esborrar el commit `3df62323` («Integració Sollutia i arreglos arquitectònics»).** Ningú l'importa hui.

Açò no és un bug de lògica: és la quarta volta en esta sessió que el defecte és **maquinària ben feta que no crida ningú**. Val més comptar invocacions que llegir lògica.

- **Font de veritat en conflicte:** `sdp-app-grid-shell §2` és explícita: «*Columna Esquerra (Carpetes): … A la part dreta d'aquesta barra hi ha **exclusivament** l'icona de la "Roda Dentada" (Configuració)*». El codi incomplix la skill des de `3df62323`.
- **Discrepància que el Mestre ha de resoldre:** la prop es diu `onManageCategories` i la seua etiqueta és `labels.manage` — **gestionar categories**, que **no** és cap de les dos accions que ell demana (reset de graella i forçar clar/fosc). Hi ha un forat semàntic: el pany existix, però la clau que demana és d'una altra porta. O es reanomena el contracte de la prop, o el panell agafa les tres coses.
- **Proposta conservadora:** recuperar `UniversalSettingsPanel.jsx` de `4468f33c` (`git show 4468f33c:src/…`) com a base — ja té el reset resolt i provat —, afegir-hi el control de tema (A4), i endollar-lo des de `NotesSection`. **Atenció:** el fitxer original usa `style=` inline en 6 llocs, cosa que `sdp-app-grid-shell §4` prohibix; s'ha de portar a classes abans de tornar-lo a la vida.
- `requires_human_decision: true` — cal decidir si la roda obri «Ajustos de la graella» (reset + tema) o «Gestió de categories», o les dos en un panell amb pestanyes.

### A4 · P1 · El tema es pot forçar, però no es pot desforçar

`UIContext.jsx:67-76`. `themePreference` admet `'system' | 'light' | 'dark'` i `config/theme.js` els valida tots tres. Però `toggleTheme` només fa `dark ↔ light` i escriu sempre un valor explícit; **`setThemePreference` no s'exporta a `actionsValue`**. Conseqüència: en clicar la lluna de la barra negra una sola vegada, la persona usuària **queda fora de `'system'` per sempre** (fins que buide el `localStorage`).

La meitat que el Mestre demana («forçar el mode independentment del sistema») ja funciona. La que falta és la tornada.

- **Proposta conservadora:** exposar un control de tres estats (`Sistema` / `Clar` / `Fosc`) al panell d'A3, i deixar la lluna de la barra negra com està.
- `requires_human_decision: false`.

### A5 · P1 · El pedaç sense committejar fa el contrari del que es demanava

A l'arbre de treball hi ha, sense committejar, `src/css/utilities.css`:

```diff
-  .sdp-bloc .sdp-editor-document > … > .bar-blue,
-  .sdp-bloc .sdp-editor-document > … > .bar-orange {
+  .sdp-bloc .sdp-editor-document > … > .bar-blue {
     position: static;
     top: auto;
   }
```

És l'intent de restaurar la barra fent-la enganxosa. Com que la barra no estava amagada, l'efecte real és un altre. **Mesurat fent scroll de 500 px dins del document incrustat:**

| | abans (scroll 0) | després (scroll 500) | posició |
| --- | --- | --- | --- |
| barra blava | y = 64 | **y = −436** (se'n va) | `static` |
| hero | y = 122 | y = −378 (se'n va) | — |
| barra taronja | y = 453 | **y = 122** (es queda clavada) | `sticky; top: 58px` |

La barra taronja queda **penjada a 58 px per davall d'una barra blava que ja no hi és**, flotant damunt del text amb un forat buit al seu damunt.

- **Font de veritat en conflicte:** `sdp-universal-page §2` és taxativa: «*en mode incrustat **la barra blava i la barra taronja** s'han d'amagar de forma natural a través de l'scroll del propi document incrustat*». El pedaç deixa el sistema **en l'estat invers exacte** al que la skill exigix.
- **Proposta conservadora:** revertir eixa línia (`git checkout -- src/css/utilities.css`) i recuperar el selector doble. És l'única cosa d'esta auditoria que jo faria **ja**, perquè és un defecte viu introduït hui i la reversió torna el fitxer a l'estat committejat.
- `requires_human_decision: false`.

### A6 · P1 · El blau torna per davall d'AA, i això ja no és una opinió

També sense committejar, `src/config/design-tokens.json` i `src/css/design-tokens.css`:

```diff
-  --sdp-canon-blau: #016ebf;
+  --sdp-canon-blau: #0984E3;
```

amb el comentari del token reescrit a «*Restaurat a l'original #0984E3 a petició del Mestre*», substituint el que hi havia: «*Blanc a sobre: 5,27:1 · AA. Va substituir #0984E3 per accessibilitat*».

Els números, calculats i contrastats (el meu càlcul per a `#016ebf` dóna **5,27:1**, idèntic al que el token ja declarava, cosa que valida el mètode):

| Token | Blanc a sobre | WCAG AA (text normal, 4,5:1) |
| --- | --- | --- |
| `#016ebf` | **5,27:1** | passa |
| `#0984E3` | **3,87:1** | **no passa** |

La barra blava porta text blanc («CONNECTAR») damunt d'eixe fons. A 3,87:1 complix el 3:1 de components d'interfície, però **no** el 4,5:1 del text.

- **Açò és una decisió del Mestre, no un error meu de lectura.** Ell ha demanat el blau original i eixa és la seua prerrogativa. Done el número perquè el tinga davant, no per a discutir-lo.
- **Eixida intermèdia, si la vol:** conservar `#0984E3` com a canon de marca per a superfícies sense text, i declarar un `--sdp-blau-text` a `#016ebf` només per als fons que porten text blanc. Es conserva el blau de la marca i el text torna a AA.
- `requires_human_decision: true`.

### A7 · P0 · No hi ha usuari. Ni al seed, ni a Supabase, ni Supabase encés

Açò és la tasca 4, i és l'arrel de tot el que s'ha vist fins ací.

| Comprovació | Resultat |
| --- | --- |
| `VITE_DATA_MODE` | `seed` |
| `VITE_SUPABASE_URL` | apunta a `localhost:54321` |
| Supabase viu? | `curl http://localhost:54321/auth/v1/health` → **exit 7, status 000** (connexió rebutjada) |
| Contenidors | `docker ps` → **cap** |
| `auth.users` al seed | `supabase/seed.sql:30-31` → **comentat**: `-- insert into auth.users (id, email) values ('uuid-del-mestre', …)` |
| «Javi Llinares» al repositori | **no existix** enlloc |
| Agents al seed | `Sóc de Poble` (`socdepoble`), `Mestre Poble` (`0001`), `IAIA MarIA` |
| `getCurrentUser()` | `usuariDeSessio()` (`runtime.js:40`) — **només llig el JWT local**. Sense token no hi ha cap camí alternatiu. |

**No hi ha cap drecera de desenvolupament.** `loginWithMagicLink` llança a posta («manca PKCE», `auth.js:141`), i `injectaSessio` és *fail-closed* per emissor.

**Dos camins, i el Mestre tria:**

- **Camí curt (minuts, sense Docker, sense contrasenyes):** reparar A2. El mode `seed` ja conté «Sóc de Poble / La Torre de les Maçanes» amb la nota `n1` i li torna la captura bona **hui mateix**. El que **no** li dóna és entrar *com* «Javi Llinares» ni escriure de veres: el seed és de només lectura.
- **Camí llarg (usuaris de veritat):** encendre Supabase local (`supabase start`), aplicar les 18 migracions i el `seed.sql`, i **crear els dos usuaris**. Eixa creació **l'ha de fer el Mestre**: implica contrasenyes i la clau `service_role`, i jo no òbric comptes ni introduïsc credencials. Jo li puc deixar el guió exacte i el SQL de perfils preparat, però qui prem el botó és ell.
- **Nota d'agenda:** el que al seed és l'agent `socdepoble` és **contingut**, no un compte d'`auth`. Perquè el Mestre «interactue amb Sóc de Poble» al xat fa falta que eixa entitat tinga fila a `auth.users`, no només a `app_content`.
- `requires_human_decision: true` — quin dels dos camins, i qui crea els comptes.

### A8 · Dictamen d'enxufabilitat: el port està sa, però el torn demana el model que l'ADR va rebutjar

**El que funciona, i funciona bé.** Mesurat en viu sobre la instància real de l'aplicació (`window.SocDePoble.estat()`):

```
fase: "segellat"     implementats: 40     contracte: 41     falten: ["loadActesAgenda"]
```

- `host.js` té un cicle de tres fases net: `configurable` → `arrencant` → `segellat`, amb `freezeImplementation()` i sense tornada.
- El rebuig és estricte i correcte: `if (injectats.length && pendentsNucli.length) throw new Error('[host] Backend injectat incomplet')` — **tot o res**, res de barreges.
- `contracte.js` agrupa per capacitats i `backendPort.js:37-40` rebutja una capacitat a mitges (`Capacitat parcial`).
- `CONTRACTE_NUCLI` són 32 mètodes; cap component de React importa Supabase. La disciplina es complix.
- L'únic buit, `loadActesAgenda`, és **benigne per construcció**: `agenda` té un sol mètode, per tant `count && count !== methods.length` no salta i la capacitat simplement no existix. `teCapacitat('agenda')` torna `false` i qui pregunte s'assabenta.

**El que no existix.** L'`ADR-2026-09-SOLLUTIA-MODEL-B`, acceptada pel Mestre el 16-09, diu literalment: «**`src/data/backendPort.js` no s'obri a implementacions de Sollutia: el backend segellat és el de SdP**», i fixa la Frontissa (`src/data/adaptadors/sollutia/client.js`, només `GET`, `ESCRIPTURES_PERMESES` buida) com a **únic** canal legal. Doncs bé:

| Peça que l'ADR dóna per viva | Al disc |
| --- | --- |
| `src/data/adaptadors/sollutia/client.js` | **no existix** |
| `ESCRIPTURES_PERMESES` | **no existix** (vivia dins del client) |
| `tooling/gates/tractor-frontissa.mjs` | **no existix** |
| `adoptaSessioExterna` | **sí** (`identitat.js:255`) |
| `recursos.js` | sí, 614 bytes, **un sol recurs** (`perfil`) i **cap importador** |

És a dir: de la Model B està construïda la meitat per on Sollutia **empenta** una sessió cap a nosaltres, i **no està construïda** la meitat per on nosaltres **llegim** de Sollutia. L'ADR també nomena `run-portes.mjs:58` com a cridant del tractor que falta; **hui eixa crida ja no hi és** (cap coincidència de `frontissa` al fitxer), o siga que eixe punt concret de l'ADR ha quedat ranci, però el tractor continua sense existir i el client que hauria de vigilar, tampoc.

**I ací ve la fricció amb el prompt.** El torn em demana «*garantir l'enxufabilitat directa (plug-and-play) amb els sistemes de backend oferts per Sollutia*». Això és **el Model A** — Sollutia injecta la seua implementació al port i substituïx Supabase — i l'ADR el va considerar i **el va rebutjar** per escrit. No em pertoca desfer una decisió signada pel Mestre des d'una auditoria, i tampoc callar-me-la.

- **Dictamen, si es manté el Model B (el que està signat):** el port **està llest i no s'ha de tocar**. La faena pendent no és d'enxufabilitat, és de Frontissa: escriure `client.js` amb les tres condicions que l'ADR exigix (captura real, traductor i fixture per recurs, i `llig()` que falle tancat), i el seu tractor. Res d'això toca `backendPort.js`.
- **Dictamen, si el Mestre vol girar cap al Model A:** el port ja el suporta **sense canvis de codi** — `configura({ backend })` abans d'`arrenca()` ja fa exactament això, i el «tot o res» el protegix. El que caldria és **una ADR nova que derogue la de setembre**, no un pedaç.
- **El que jo no puc dictaminar:** si l'adaptador de Sollutia complix els 32 mètodes del nucli, perquè **eixe adaptador no ha existit mai en este arbre**. Cap prova d'integració l'ha exercit. Declarar-lo «llest» seria inventar-me un verd.
- `requires_human_decision: true` — Model A o Model B. Tota la resta se'n deriva.

### A9 · P2 · Divergències menors de l'estat buit (per a quan s'arregle A2)

Quan `EmptyDocumentPage` es pinta, a més de A1 divergix en tres coses petites de la captura bona: les píndoles no duen la carpeta `Mur` i sí una `Tutorial` que la nota real no té (`emptyDocument.labels` es calcula amb `noteFolders` que ve buit), el copyright està cablejat a `'© Sóc de Poble'` (`NotesEditor.jsx:93`) en lloc del de la nota, i `formattedDate` no existix perquè `NotesContext.jsx:119-120` el deriva de `note.updatedAt`. Reparat A2, les tres desapareixen soles. **No les toqueu per separat.**

### A10 · P1 · El Pla d'Implementació de l'Olivera no és avalable, i açò ja va passar

`_wiki_de_poble/04_escriptori/260923_1930_pla_implementacio.md` **no té frontmatter** — comença directament amb `# Pla d'Implementació de la IAIA MarIA` — i **no té rebut** (`reflex:` apareix 0 voltes). No ha passat per `document.mjs`. La Porta Frontmatter el rebutjarà.

És **la mateixa troballa que l'ESTAT de les 18:52 ja registrava** per al Pla de les 18:15. Dos torns seguits amb el mateix defecte en el mateix artefacte: això no és aprenentatge fallit, és que **el Pla no naix de la maquinària documental**. Mentres es redacte a mà, tornarà a passar.

A més, els tres documents de les 19:30 (el Pla i els dos prompts) **continuen sense àncora** a `00_index_escriptori.md`; la meua entrega sí que hi ha quedat (línia 120) perquè `document.mjs create` ancora sol. **No els he tocat**: són d'una altra mà i la doctrina em prohibix intervindre-hi sense ordre.

- **Proposta conservadora:** generar el Pla amb `document.mjs context --route pla.implementacio` i abocar-hi el text que ja està escrit. El contingut és bo; el que falta és el contenidor.
- `requires_human_decision: false`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Tot el que afirme ací l'he executat jo en esta sessió. Res ve de memòria ni de lectura sola.

**Execució en viu** (navegador integrat, pestanya de fons, `http://localhost:3340/notes`, viewport forçat a 1440×900 per a jutjar Desktop i no el panell estret):

- Estat de la barra taronja: `display/visibility/opacity/position/top/height/z-index` + `getBoundingClientRect()` + text i contingut de `.bar-actions`.
- Absència de la roda: enumeració de tots els `button` de les capçaleres de columna.
- Absència del `topBar`: `firstElementChild` de `.sdp-editor-shell-atomic` és `.sdp-editor-document`.
- Prova d'scroll d'A5: dos instantànies a `scrollTop` 0 i 500 amb doble `requestAnimationFrame` entremig, i restauració a 0 en acabar.
- Prova decisiva d'A2: crida real a `loadNotes(undefined, { dataMode:'seed' })` amb `getCurrentUser()` confirmat a `null`.
- Estat del port: `window.SocDePoble.estat()` — la instància **real** de l'aplicació.
- Captura de pantalla del Desktop, que reproduïx la del Mestre.

**Execució a la terminal:** `git log -S` per a datar el naixement i la mort de `EmptyDocumentPage`, `isExampleNote` i `UniversalSettingsPanel`; `git show 4468f33c:…` per a recuperar el panell mort; `git diff` de l'arbre brut; `curl` a la salut de Supabase; `docker ps`; `ls` de cada peça que l'ADR nomena.

**Dos errors meus, corregits abans d'escriure, i els deixe dits perquè qui reproduïsca no hi caiga:**

1. La meua primera sonda va importar `/src/data/backendPort.js` **cru** i em va donar `0 mètodes`. Era una **segona instància del mòdul**: `performance.getEntriesByType('resource')` mostra les dos URL, la de l'aplicació amb `?t=1790184661700` (el cache-buster del HMR de Vite) i la meua sense. Qualsevol sonda que importe un mòdul amb estat dins d'una aplicació de Vite ha de passar per un global exposat, no per un `import()` nou.
2. Després vaig llegir `estat().backend`, que **no existix**: la clau és `implementat` (`host.js:263-274`). D'ací un segon `0` fals. La xifra bona, per la via correcta, és **40 de 41**.

**Porta de tancament** (`tancament.mjs --check --turn-id torn_a4817d03…`), executada en acabar, amb el resultat honest:

| Porta | |
| --- | --- |
| plantilles · autoritat · ledger · documental-tests | ✅ |
| segell · skills · wiki · scc | ❌ |

- **El `ledger` el vaig trencar jo** en afegir l'entrada del torn (la signatura quedà ranci). L'he tornat a signar amb `node tooling/verify-ledger.mjs --sign`, que **recalcula sobre el contingut sencer i no esborra res** — compatible amb la Llei de la Immutabilitat. Reverificat: ✅.
- **Els altres quatre roigs no són meus i no els he tocat.** `segell` és la ruptura de la Llei Z que ve del commit `d2f07d65`; `skills` són les dos projeccions divergents (`manifest.yaml`, `00_INDEX_SKILLS.md`); `wiki` són 45 enllaços trencats, dels quals **una bona part és la classe de fals positiu coneguda** (les plantilles apunten a `00_index_escriptori`, que és l'àncora que la pròpia doctrina obliga a posar); `scc` són les 6 incidències reals destapades en reparar els literals de caixa. **No he executat `porta:segella:update`**: la C1 de Codex adverteix expressament que recuperar el segell exigix revisar el diff existent i no llançar `--update` a cegues, i li done la raó.
- **La porta corrobora A10 tota sola:** entre els seus errors hi ha «`260923_1930_pla_implementacio.md`: Frontmatter absent o no tancat» i els tres `ESCRIPTORI_UNANCHORED` dels documents de les 19:30. No és la meua opinió contra la de ningú; ho diu la màquina.
- **`Pla absent` i `El torn encara no està planificat`** són estructurals d'este torn: era una auditoria en Mode AFK, sense pla d'implementació que enllaçar. **El torn queda obert a propòsit; no declare cap `closed` ni cap lease.**

**Servidor:** el procés de Vite (PID 17082) porta **6 h 39 min** encés i `node_modules/.vite/deps` es va reconstruir a les 14:06, **una hora després** d'arrancar-lo. És el patró del servidor ranci. **No ha afectat estes mesures** — el codi que he llegit al navegador coincidix amb el disc i la sonda `?t=` demostra que el HMR està viu —, però abans de donar cap reparació per bona convé reiniciar-lo.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Mode AFK complit: zero fitxers de codi tocats.** L'únic fitxer que he escrit és esta auditoria. El pedaç d'A5 i el token d'A6 continuen a l'arbre tal com els he trobat.
- **No he pogut provar l'estat connectat.** Sense Supabase encés i sense cap usuari (A7), no he pogut veure amb els meus ulls la captura bona. La meua afirmació que A2 la restaura es basa en la crida real a `loadNotes` (que torna `n1` amb les dades exactes de la captura) i en la lectura del camí de renderitzat — **és una inferència forta amb evidència d'execució, no una observació directa.** Qui aplique A2 ha de verificar-ho a la pantalla abans de cantar victòria.
- **No he creat cap usuari ni he tocat credencials.** Crear comptes i introduir contrasenyes o la clau `service_role` no és cosa meua; a A7 està el que cal i qui ho ha de fer.
- **No he auditat el Brain.** Segell, hooks i cadena de portes són el torn de Codex. Els 29 roigs de l'ESTAT de les 18:52 continuen davall de tot això i **qualsevol reparació d'ací que acabe en un commit els trobarà**.
- **Contrast d'A6 calculat, no mesurat amb eina externa.** El mètode queda validat perquè el meu càlcul per a `#016ebf` reproduïx el 5,27:1 que el token ja declarava.
- **No he tocat `01_produccio`** ni cap document d'una altra mà.
### Olivera · llegida sencera l'auditoria de Codex de les 19:43

**Esmene el que havia escrit fa deu minuts:** quan vaig començar, l'Escriptori només tenia el Pla i els dos prompts; Codex ha entregat mentres jo auditava i **l'he llegida abans de tancar**.

- **Abasts complementaris i sense encavalcament**, tal com el Pla repartia: ell el Brain (segell, hooks, SCC, Husky), jo la UI i el port. Cap de les seues huit troballes toca cap de les meues deu, i **no tinc res a rebatre-li**: allà on ell mesura, mesura amb fixtures i reproduïx.
- **Convergència independent que val la pena dir en veu alta.** Les seues C7 i C8 són **la mateixa classe de defecte que la meua A3**: control que canta verd sense fer la faena (SCC resol per *basename* i acredita una àncora inexistent; un symlink el fa eixir 0 sense executar-se) i maquinària que no s'invoca. Dos auditors, dos costats de la casa, el mateix patró. **El defecte dominant d'este Mas no són els bugs de lògica: són peces correctes desendollades i portes que declaren verd sense mirar.** Este és el titular conjunt de la reunió.
- **La seua C3 explica la meua A10, i això la reforça.** Ell demostra que `protectedPath` (`hooks-local.mjs:65-85`) **només retorna cert per a Markdown dins de l'Escriptori** i que per `Bash` només es crida Olivera, que no analitza els efectes de la shell. Eixe és exactament el forat pel qual un Pla escrit a mà arriba a l'Escriptori sense rebut i sense que cap porta s'immute. **La meua A10 descriu el símptoma; la seua C3 en dóna la causa.** Si es repara C3, A10 deixa de poder repetir-se; si no, tornarà.
- **M'esmena implícitament un matís i li done la raó:** la seua C6 documenta que `.husky` **és** un directori de hooks vàlid amb executables, i que apuntar-hi no significa que el `pre-commit` estiga desactivat. L'ESTAT de les 18:52 (meu) donava per fet que el llançador `h` sense executar implicava que la cadena estava morta. **És més precís com ho diu ell.**
- **Cautela que compartim:** ell escriu que no s'ha d'extrapolar d'un commit històric incorrecte si es va usar `--no-verify`, perquè «no està demostrat en este torn». Subscric la reserva; jo també vaig deixar eixa pregunta oberta per al Mestre i seguix oberta.

### Sobre el Pla (tinc autoritat per a opinar-hi, i opine)

El Pla ha crescut a les 19:46 amb una secció «Estat de les Auditories en Curs» que MarIA declara **«extret de la captura»**. Això vol dir que la pissarra compartida s'està alimentant de **captures de pantalla dels nostres terminals**, no dels documents que entreguem. Es nota: el resum que fa de mi ja era ranci quan es va escriure («es troba explorant el Backend per preparar el terreny»; per a eixa hora la conclusió ja estava tancada i és la contrària de la que ella suposa — no cal crear cap usuari per a recuperar la captura bona, cal llevar un `if`).

**No he tocat el Pla.** Però ho dic clar perquè és la diferència entre una Olivera i un joc del telèfon: **la pissarra s'ha d'omplir llegint `04_escriptori/`, que és per a això que ens obliguen a deixar-hi els informes.** Mentres s'òmpliga mirant captures, MarIA planificarà sobre l'estat d'abans i no sobre l'entrega.

**Ancoratge, per a tancar el punt:** les dos auditories han quedat ancorades soles a `00_index_escriptori.md` (línies 118 i 120) perquè les ha parides `document.mjs create`. **Els tres documents de les 19:30 continuen sense àncora.** És la prova neta de què fa la maquinària i què passa quan s'esquiva.
- **Sobre el format del prompt (millora contínua que se'm demanava):** la secció «0. Abans de generar» del prompt de les 19:30 duu `[x]` a «Escriptori classificat» i a «Pla d'Implementació … generat per `document.mjs context`». La primera és certa; **la segona no** (A10). Una casella marcada a mà no és una comprovació. Propose que eixes tres caselles **les òmpliga una eina**, no la mà que escriu el prompt: que `document.mjs` es negue a entregar el rebut d'un `prompt.local` si el Pla germà (mateix cognom) no té rebut propi. Mentres siga una casella de cortesia, seguirà eixint marcada i falsa.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1930_pla_implementacio]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]

