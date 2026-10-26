---
type: informe
status: esborrany
description: 'Auditoria adversarial extrema de Gemini 4 Argon sobre el commit 20d11564e (52 fitxers): xat de veu, P1-15, Storage, Vite, WordPress 5.8 i Android Back'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_4ff4e4ec-e4ea-4519-b971-253fb157c26f:c246fad9-07fe-45a4-a8d5-ded950b0c928
---
# Auditoria Adversarial Extrema (Gauntlet Loop): Dissecció Forense del Commit 20d11564e

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4ff4e4ec-e4ea-4519-b971-253fb157c26f:c246fad9-07fe-45a4-a8d5-ded950b0c928 |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T20:30:21.589Z |
| Modificació | 2026-10-25T23:07:00.000Z |
| Propietari | gemini-4-argon |
| Aprovació humana | certificat 10/10 post-commit cd1bb28a4 (consens Gemini + Codex) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Antigravity 2.0) |
| Tokens consumits | ~84.000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T20:30:21.589Z: esborrany creat sota el torn `torn_4ff4e4ec-e4ea-4519-b971-253fb157c26f`.
- 2026-10-25T20:33:00.000Z: dissecció forense línia a línia dels 52 fitxers del commit `20d11564eb3865291d7c4d5ad03ad6a227dbb49e` (`20d11564e`), verificació empírica de `npm run test:precommit` (3.410 proves verdes: 3.151 Vitest + 259 Node) i emissió del dictamen adversarial de Gemini 4 Argon.
- 2026-10-25T21:12:00.000Z: v1.1.0 — contrast íntegre amb `[[261025_2120_auditoria_codex]]`: validació i incorporació de la regressió `C2120-01` (consentiment `A→B→A` a `GestioMembres.jsx`) i de la cursa `C2120-04` (`AdjuntXat.jsx`), rectificació formal de `G2120-02` (`MAXIM_POSICIONS = 300` ja implementat a `AdjuntXat.jsx:30,48`), i segellat del paquet únic de 4 pegats de consens per al 10/10.
- 2026-10-25T23:07:00.000Z: v1.2.0 — verificació forense i certificació final 10/10 del commit `cd1bb28a4d640d0cfe9aa077c87842c68931cb8f` (`cd1bb28a4`, 6 fitxers, `+324 / -27` línies, 9 proves de regressió noves i `3.419` proves verdes a `test:precommit`).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

##### Dictamen Executiu i Puntuació Real Post-Commit `20d11564e` (Contrastat amb Codex Sol Ultra)

El commit `20d11564e` (52 fitxers modificats, `+2.175 / -131` línies) executa una intervenció d'alta precisió que tanca diversos deutes crítics assenyalats a l'onada `1645`: aïlla per empremta SHA-256 la memòria cau de Vite per a erradicar el crash de doble instància de React a Notes (`P1-25`), blinda les claus d'àmbit a `useTitularDeConnexio.js` i `useFitxaDeConnexio.js` i el pas `A→B` de `TriaTitular` (`P1-15` / `PN-03`), dota de terminis finits totes les operacions de `storage.js` (`PN-04`), incorpora velocitats `1x/1.5x/2x`, exclusivitat d'àudio, memòria de posició (`MAXIM_POSICIONS = 300`) i barra de progrés real d'enviament al xat (`XAT-03/07/08`), habilita el `render_callback` del connector de WordPress des de la versió `5.8` (`P1-09`) i connecta el botó físic Arrere a Android (`P0-24`).

**Dictamen després del contrast adversarial Gemini 4 Argon + Codex Sol Ultra (`[[261025_2120_auditoria_codex]]`):** Abans de certificar el 10/10 i fer `git push`, cal aplicar un **paquet quirúrgic consensuat de 4 pegats (`requires_human_decision: false`)** que resol la regressió nova `C2120-01` (`A→B→A` a `GestioMembres.jsx`), la pausa de veu activa en iniciar gravació (`G2120-01`), la cursa de generació en les promeses de signatura d'àudio (`C2120-04` + `G2120-04`) i la reafirmació de `playbackRate` en carregar la font (`G2120-05`).

| Domini Auditant | Nota Pre-`20d11564e` | Nota Post-`20d11564e` | Estat i Justificació Forense (Consens Gemini + Codex) |
| :--- | :---: | :---: | :--- |
| **1. Xat Multimèdia i Àudio estil WhatsApp** | 9,2 / 10 | **9,5 / 10** | Velocitats `1x/1,5x/2x`, una sola veu activa, `MAXIM_POSICIONS = 300` i progrés XHR operatius. Resten `[G2120-01]`, `[C2120-04 / G2120-04]`, `[G2120-05]` i el compromís de redirecció XHR `[C2120-02 / G2120-03]`. |
| **2. Concurrència a Connectar i Perfil (`P1-15`)** | 9,4 / 10 | **9,2 / 10** | Hooks `useTitularDeConnexio` i `useFitxaDeConnexio` i camí `A→B` blindats, però `TriaTitular` (`GestioMembres.jsx:75-126`) introdueix la regressió **`[C2120-01]`** en la seqüència **`A→B→A`** (el servidor desa A però `!vigent()` descarta la confirmació i deixa la casella d'A desfasada en fals). |
| **3. Resiliència de Storage i Port Neutral (`PN-02`, `PN-04`)** | 9,5 / 10 | **9,6 / 10** | Terminis finits a `storage.js` (`ambTermini`: 12 s curtes i proporcional a pujada/baixada), `ErrorBoundary` sense detall cru en producció, guardes `nomesFitxes`/`nomesElements` i `mergeById` amb `Symbol('sense-id')`. Resta `[C2120-03 / G2120-06]` (cancel·lació del `fetch` subjacent en `upload`/`createSignedUrl`/`remove`). |
| **4. Estabilitat de Notes i Infraestructura Vite (`P1-25`)** | 9,0 / 10 | **10 / 10** | `cacheDirPropi` amb detecció de symlinks cap a `os.tmpdir()`, `dedupe: ['react', 'react-dom']` i pre-empaquetat de `lucide-react` a Vitest. |
| **5. Perímetre: WordPress 5.8–6.4 (`P1-09`) i Android Back (`P0-24`)** | 8,2 / 10 | **9,4 / 10** | `render_callback` + reserva `.l10n.php` amb validació anti-LFI `/^[A-Za-z0-9_-]+$/D` i `ca_valencia`; `OnBackPressedCallback` a `MainActivity.java`. Resten `[C2120-05]` (`switch_to_locale` sobre la closure d'`idioma.php`), `[G2120-07]` i la decisió del Mestre sobre `Requires at least`. |
| **6. Llei de l'Enxufabilitat de Sollutia (Model B)** | 10 / 10 | **10 / 10** | Port 100% cec a la UI; `onProgres` no viatja a les RPC ni trenca `seed`/`local`; portes `tractor-enxufe`, `tractor-frontissa`, `tractor-sollutia` i `tractor-adaptadors` en codi `0`. |

---

##### Tasca 1 · Dissecció Forense del Xat Multimèdia i Àudio (`AdjuntXat.jsx`, `ControlsAdjunt.jsx`, `adjuntLocal.js`, `xatMultimedia.js`, `Bombolla.jsx`)

###### A. Verificació del que funciona amb excel·lència
1. **Coordinació d'una sola veu activa i preempció abans de la xarxa:** A `src/sections/xat/components/AdjuntXat.jsx:29-55`, el coordinador `veus` substitueix l'enfocament d'esdeveniment DOM per una referència síncrona `veus.activa`. Quan l'usuari prem *Reprodueix* a la nota B mentre la nota A sona (o mentre la nota A encara està esperant `urlAdjuntXat`), `prenLaVeu(notaB)` executa `veus.activa.calla()` en el mateix gest d'usuari (`AdjuntXat.jsx:33, 157`). Això posa `volSonar.current = false` en la nota A; quan la promesa tardana de `urlAdjuntXat` de la nota A es resol (`AdjuntXat.jsx:134`), la guarda `if (!viu.current || !volSonar.current || !element) return;` descarta la URL en el cas simple `A → B`.
2. **Aïllament d'usuari en `veus.posicions`, sostre LRU de 300 entrades i oblit en acabar (`onEnded`):** La clau de memòria passada des de `Bombolla.jsx` és `${usuariId ?? ''}:${adjunt.id}`, i `recordaPosicio` (`AdjuntXat.jsx:30, 43-49`) manté un sostre `MAXIM_POSICIONS = 300` amb poda FIFO/LRU automàtica (`veus.posicions.delete(clau)` + inserció al final + poda de `veus.posicions.keys().next().value`). En eixir i tornar a una conversa, `ReproductorActiu` recupera la posició i la restaura a `metadades` (`AdjuntXat.jsx:181-184`).
3. **Alliberament d'`<audio>` en desmuntar i en mode selecció:** L'efecte de neteja d'`AdjuntXat.jsx:112-121` posa `viu.current = false`, crida `deixaLaVeu(nota)`, guarda la posició en `recordaPosicio` i pausa l'element buidant l'atribut `src` seguit d'`element.load()`. *(Nota rectificada després del contrast amb Codex: l'efecte de neteja no avorta un `AbortController` sobre `obteUrl`, la qual cosa fa necessària la generació per càrrega de `[C2120-04 / G2120-04]`).*
4. **Rellotge de gravació i avís d'aturada automàtica (`XAT-07`):** A `src/sections/xat/adjuntLocal.js:189-243`, `gravaVeu` distingeix l'aturada automàtica per sostre de mida (`2_900_000` bytes, `motiuAturada = 'mida'`) i per sostre de temps (`MAX_VEU_MS = 300_000` ms, `motiuAturada = 'temps'`) de l'aturada manual. A `src/sections/xat/components/ControlsAdjunt.jsx:181`, `const { aturada: _aturada, ...entrada } = preparat;` evita que el camp de UI `aturada` viatge al port. El rellotge usa `<span role="timer">` i la regió viva `role="status"` només anuncia els llindars dels `4:00` (240 s) i `4:50` (290 s).

###### B. Troballes Adversarials al Xat Multimèdia

- **`[G2120-01]` (Severitat: P2 · UX/Concurrència d'Àudio) — Iniciar una gravació de veu (`ControlsAdjunt.jsx`) NO pausa la nota de veu que estiga sonant (`AdjuntXat.jsx`):**
  - **Línies exactes:** `src/sections/xat/components/ControlsAdjunt.jsx:154-169` (`grava()`) i `src/sections/xat/components/AdjuntXat.jsx:32-36` (`prenLaVeu`).
  - **Prova forense:** `prenLaVeu` només s'invoca quan un altre `<ReproductorActiu>` prem *Reprodueix*. Quan l'usuari està escoltant una nota de veu rebuda al xat i prem el botó **«Grava un missatge de veu»** (`ControlsAdjunt.jsx:154`) per a contestar, `grava()` crida `iniciaGravacioVeu` sense cridar `veus.activa?.calla()`. La nota de veu del xat continua reproduint-se mentre es grava.
  - **Correcció consensuada (Paquet 10/10):** Exportar `callaVeuActiva()` des de `src/sections/xat/components/AdjuntXat.jsx` (`export function callaVeuActiva() { const anterior = veus.activa; veus.activa = null; anterior?.calla(); }`) i invocar-la a l'inici de `grava()` a `src/sections/xat/components/ControlsAdjunt.jsx:154`.

- **`[G2120-02]` (RECTIFICADA I RETIRADA EN CONSENS AMB CODEX) — `veus.posicions` SÍ que està acotat a 300 entrades amb poda LRU (`AdjuntXat.jsx:30, 43-49`):**
  - **Rectificació:** En la primera lectura vaig afirmar erròniament que `veus.posicions` no tenia límit LRU. Com ha demostrat empíricament Codex Sol Ultra (`[[261025_2120_auditoria_codex]]`, prova de 1.000 posicions → 300 retingudes), `AdjuntXat.jsx:30` defineix `const MAXIM_POSICIONS = 300;` i `recordaPosicio` (`línies 43-49`) reordena la clau i poda `veus.posicions.keys().next().value` quan supera 300, a més d'indexar les posicions per persona (`${usuariId}:${adjunt.id}`). Queda retirada com a troballa.

- **`[G2120-03 / C2120-02]` (Severitat: P2 · Compromís de Transport Documentat) — `ControlsAdjunt.jsx` passa sempre `onProgres`, usant `XMLHttpRequest` (`xatMultimedia.js:48-102`) que segueix redireccions abans de comprovar `responseURL`:**
  - **Línies exactes:** `src/sections/xat/components/ControlsAdjunt.jsx:178` i `src/data/supabase/xatMultimedia.js:41-109`.
  - **Prova forense:** A `xatMultimedia.js:107`, quan hi ha `onProgres` s'usa `XMLHttpRequest` (`enviaAmbProgres`) en lloc de `fetch(..., { redirect: 'error' })`. A diferència de `fetch` amb `redirect: 'error'`, `XMLHttpRequest` segueix redireccions HTTP abans d'invocar `xhr.onload` (`línia 74`), on es comprova `xhr.responseURL !== new URL(url).href`. És un compromís conegut i documentat per al progrés de pujada (`requires_human_decision: true` si es vol canviar la política de transport).

- **`[C2120-04 + G2120-04]` (Severitat: P2 · Cursa de Generació en Signatures d'Àudio) — Un error tardà d'una primera petició de signatura cancel·la el segon intent viu (`C2120-04`) i `fallaCarrega` no comprova `volSonar.current` (`G2120-04`):**
  - **Línies exactes:** `src/sections/xat/components/AdjuntXat.jsx:128-176`.
  - **Prova forense combinada (Codex + Gemini):**
    1. **`C2120-04` (`carrega`):** Si l'usuari prem *Reprodueix* a la nota A (llançant la petició #1 d'`obteUrl`), prem *Pausa* i torna a prémer *Reprodueix* (o fa `A → B → A`) abans que la petició #1 resolga, es llança una petició #2 d'`obteUrl`. Si la petició #1 falla tard, el seu `.catch()` (`línia 144`) executa `volSonar.current = false; setSona(false); setError(...)` i el seu `.finally()` (`línia 149`) posa `setCarregant(false)` **sobre l'intent #2 encara viu**; quan la petició #2 resol amb èxit, el seu `.then()` veu `!volSonar.current` i descarta la URL!
    2. **`G2120-04` (`fallaCarrega`):** A la línia 170, `fallaCarrega` comprova `if (!element?.getAttribute('src') || !viu.current) return;` sense comprovar `!volSonar.current`, podent disparar un `carrega(true)` de renovació per a una nota ja silenciada per una altra.
  - **Correcció consensuada (Paquet 10/10):** Incorporar un comptador de generació d'intent (`intentRef = useRef(0)`) en `ReproductorActiu` que s'incremente en `calla()`, en pausar dins de `commuta()`, en desmuntar i en cada crida a `carrega(renova)` (`const intent = ++intentRef.current; const vigent = () => viu.current && volSonar.current && intentRef.current === intent;`), comprovant `vigent()` en `.then`, `.catch` i `.finally`, i afegint `if (!volSonar.current) return;` a l'inici de `fallaCarrega()`.

- **`[G2120-05]` (Severitat: P3 · Enduriment Preventiu WebKit/iOS) — Reafirmació de `playbackRate` en `onLoadedMetadata` i `onPlay` (`AdjuntXat.jsx:181, 241`):**
  - **Línies exactes:** `src/sections/xat/components/AdjuntXat.jsx:123-126, 135, 181, 241`.
  - **Anàlisi:** Reafirmar `e.currentTarget.defaultPlaybackRate = velocitatVeu(); e.currentTarget.playbackRate = velocitatVeu();` dins de `metadades` (`onLoadedMetadata`) i d'`onPlay` garanteix que en assignar `element.src = url` dinàmicament per primera vegada amb una velocitat prèvia (`1.5×` o `2×`), l'element mantinga sempre la velocitat triada.

---

##### Tasca 2 · Concurrència a Connectar i Perfil (`P1-15`: `useTitularDeConnexio.js`, `useFitxaDeConnexio.js`, `ConnectarSection.jsx`, `GestioMembres.jsx`)

- **Allò que sí queda blindat al commit `20d11564e` (Camí `A → B` i Hooks de Connectar):**
  - Els hooks `useTitularDeConnexio.js` (`línies 52-76`) i `useFitxaDeConnexio.js` (`línies 58-84`) construeixen `clau` amb `JSON.stringify([ambitDelBackend(config), usuariId == null ? null : String(usuariId), ...])` i invaliden l'estat en el mateix frame de render en canviar d'usuari o backend.
  - En `TriaTitular` (`src/sections/profile/GestioMembres.jsx:58-148`), una resposta tardana de l'entitat A ja no sobreescriu mai l'estat ni el missatge de l'entitat B quan l'usuari es queda a B.
- **`[C2120-01]` (Severitat: P2 · REGRESSIÓ NOVA DEMOSTRADA PER CODEX) — Tornar `A → B → A` mentre l'escriptura d'A continua en vol deixa la casella d'A amb el consentiment contrari al servidor:**
  - **Línies exactes:** `src/sections/profile/GestioMembres.jsx:75-126` (`TriaTitular`).
  - **Mecanisme exacte de la fallada (reproduïda amb promeses diferides):**
    1. L'usuari és a l'entitat **A** (`valor: false`) i marca la casella (`nou = true`). `canvia()` incrementa `triaVigent.current` a `1` (`const tria = 1`) i llança `marcaTitularPublic(A, true, {})` al servidor.
    2. Abans que el servidor responga, l'usuari passa a l'entitat **B** (`triaVigent.current` puja a `2`, `setDesant(false)`, `setPendent(null)`) i immediatament torna a l'entitat **A** (`triaVigent.current` puja a `3`).
    3. En tornar a **A**, l'`useEffect` (`línia 86`) llança `estatTitularPublic(A)`. Si aquesta lectura es resol abans que acabe l'escriptura `marcaTitularPublic(A, true)`, llig `titularPublic: false` i deixa la casella d'A en `false` i `desant: false`.
    4. Immediatament després, `marcaTitularPublic(A, true)` culmina amb èxit al servidor (`titularPublic: true`), però a la línia 110 `if (!vigent()) return;` veu que `triaVigent.current` (`3`) $\neq$ `tria` (`1`) i **descarta la confirmació d'A sense disparar cap nova lectura ni actualitzar `estat`**.
    5. **Resultat:** Al servidor l'usuari **sí** que figura com a titular públic d'A (`true`), però la casella d'A a la pantalla mostra **`false`** (o a la inversa en una revocació: el servidor continua en `false`/`true` desfasat mentre l'usuari creu el contrari), i com que `desant` es va posar a `false` en passar per B, es permet disparar una segona escriptura concurrent sobre A sense serialització.
  - **Correcció consensuada (Paquet 10/10):** En `TriaTitular` (`GestioMembres.jsx`), substituir el comptador únic que es trenca en navegar `A → B → A` per un seguiment d'operacions per àmbit d'organització (`clauOrg = ${ambit}:${usuariId}:${orgId}`):
    - Conservar i serialitzar les escriptures en vol per `clauOrg` (de manera que si A té una escriptura pendent quan es torna a A des de B, A mostre `desant = true` i `pendent` amb la darrera intenció).
    - Ignorar qualsevol lectura `estatTitularPublic(A)` iniciada abans que culmine l'escriptura en vol d'A, i quan l'escriptura d'A acabe, si el component continua muntat i mostrant `clauOrg`, aplicar el resultat i/o reconciliar amb `estatTitularPublic(A)`, mantenint intacta la barrera que impedeix que l'operació d'A toque mai l'estat de B.

---

##### Tasca 3 · Resiliència de Storage i del Port Neutral (`PN-02`, `PN-04`: `storage.js`, `ErrorBoundary.jsx`, `CoreContentContext.jsx`, `MurContext.jsx`, `mapejadorSeccions.js`)

- **Verificació forense de `src/data/supabase/storage.js:40-55` (`ambTermini`):**
  - `TEMPS_STORAGE_MS = 12_000` per a operacions curtes (`deleteFile`, `listFiles`, `resolveAsset`, `llistaSencera`, `esborraElMeuMitja`) i `tempsLimitPujada` proporcional per a `uploadFile`, `uploadToStorage` i `downloadFile` (`TEMPS_BAIXADA_MS = tempsLimitPujada(MIDA_MAX_PRIVADA)` = 555 s per a 25 MiB).
  - La promesa es resol amb `Promise.race([Promise.resolve().then(() => feina(controlador.signal)), tallada]).finally(() => clearTimeout(perTermini))`. Cap temporitzador queda penjat quan l'SDK respon a temps.
  - Els errors es tradueixen sempre per `errorDeStorage` i es registren amb `diagnosiDeStorage` (sense filtrar mai rutes, `uid` ni `tenantId` a la consola).
- **`[G2120-06]` (Severitat: P3 · Transport SDK) — `upload`, `createSignedUrl` i `remove` de `@supabase/storage-js` v2.112 no reben l'`AbortSignal` si no s'injecta al `fetch` del client:**
  - **Línies exactes:** `src/data/supabase/storage.js:242, 275, 335, 394, 645`.
  - **Prova forense:** A `downloadFile` (`línia 258`) i `listFiles` (`línia 291, 528`), `ambTermini` passa `(signal) => ...download(..., { signal })` i `list(..., { signal })`, la qual cosa avorta la petició HTTP real quan salta el timeout. En canvi, com que els mètodes `.upload()`, `.createSignedUrl()` i `.remove()` de `@supabase/storage-js` 2.112 no admeten un paràmetre `{ signal }` directe, `ambTermini` destrava la promesa i allibera la interfície als 12 s / `tempsLimitPujada`, però la petició `fetch` interna del SDK continua en segon pla fins al timeout de xarxa del navegador.
- **Verificació de `PN-02` (`ErrorBoundary.jsx`, `CoreContentContext.jsx`, `MurContext.jsx`, `mapejadorSeccions.js`):**
  - `src/components/ErrorBoundary.jsx:23-28`: `const detall = this.props.mostraDetall ?? Boolean(import.meta.env.DEV);` oculta `<pre>{this.state.error?.toString()}</pre>` en producció, igualant el criteri de privacitat de `RouteErrorBoundary`.
  - `src/app/contexts/CoreContentContext.jsx:19-23` (`nomesFitxes`) i `src/sections/mur/MurContext.jsx:59-63` (`nomesElements`): filtren qualsevol element nul, primitiu o array dins de les llistes de l'adaptador abans de `byId` / `sortPinnedContent`, impedint que una fila mal formada d'un adaptador tombe l'arbre per damunt de `RouteErrorBoundary`.
  - `src/data/mapejadorSeccions.js:506-533` (`mergeById`): usa `Symbol('sense-id')` per als objectes sense `id` (text o número), evitant que col·lapsen sota la clau `"undefined"`.

---

##### Tasca 4 · Crash de Notes i Configuració de Vite (`vite.config.js`, `tests/vite-empremta-dev.test.mjs`, `reixetaEspaiat.capes.test.js`)

- **Verificació forense de `vite.config.js:32-42, 116-160`:**
  - `cacheDirPropi(arrel, tmp)` calcula el SHA-256 dels primers 12 caràcters de `fs.realpathSync(arrel)`. Si `node_modules` o `node_modules/.vite` és un symlink cap a un altre arbre (com passa en worktrees o còpies d'agents), desvia la memòria cau a `path.join(fs.realpathSync(tmp), 'sdp-vite-cache', empremta)` perquè cap procés extern no puga reescriure `node_modules/.vite/deps` sota el servidor viu del port `3340`.
  - Conserva `resolve.dedupe: ['react', 'react-dom']` i `optimizeDeps.include: ['react', 'react-dom', '@tiptap/react', '@tiptap/core']` sense usar àlies de ruta absoluta per a `react` o `react-dom` (que saltarien el mapa `exports` del `package.json` de React i farien que `react-dom/server` carregara l'entrada de Node al navegador).
  - Pre-empaqueta `lucide-react` a `test.deps.optimizer` (`client` i `ssr`), accelerant Vitest sense alterar el bundle de producció.
- **Verificació del trinquet `src/css/reixetaEspaiat.capes.test.js`:**
  - Congela amb exactitud el cens de literals fora de la reixeta de `4px` (`AMB_MOTIU` i `DEUTE`), impedint que cap full de `src/` introduïsca un `margin`, `padding` o `gap` nou fora de múltiple de `4px` i obligant a retirar de `DEUTE` cada literal que es corregisca.

---

##### Tasca 5 · Perímetre: WordPress 5.8–6.4 (`render.php`, `idioma.php`, `marcatge.php`) i Android (`MainActivity.java`)

- **WordPress (`wordpress-plugin/includes/bloc/render.php`, `includes/idioma.php`, `includes/marcatge.php`):**
  - `includes/marcatge.php:417-446`: `register_block_type` registra `'render_callback' => 'socdepoble_enxufe_render_bloc'`, que resol el fet que WordPress `5.8–6.0` ignore el camp `"render"` de `block.json` (introduït a WP 6.1). `includes/bloc/render.php:14` crida exactament `socdepoble_enxufe_render_bloc( $attributes ?? array() )`, garantint una única font de veritat.
  - `includes/idioma.php:28-76`: Quan no existeix `WP_Translation_Controller` (WP `< 6.5`) i el domini `'socdepoble'` no s'ha carregat des d'un `.mo` extern, carrega el catàleg `languages/socdepoble-{locale}.l10n.php` i el serveix pels filtres `gettext_socdepoble` i `gettext_with_context_socdepoble` (amb el separador `"\4"` canònic de WordPress).
  - **Seguretat PHP verificada:** Abans d'interpol·lar `$llengua` en la ruta de l'`include`, la línia 40 exigeix `1 === preg_match( '/^[A-Za-z0-9_-]+$/D', $llengua )` amb el modificador `/D` (`PCRE_DOLLAR_ENDONLY`, que impedeix fins i tot un salt de línia final `\n`). Això blinda completament el plugin contra qualsevol intent de *Path Traversal / Local File Inclusion* (incloent-hi instal·lacions antigues de WordPress `< 6.2.1` vulnerables a CVE-2023-2745 en `wp_lang`).
- **Android (`android/app/src/main/java/org/socdepoble/app/MainActivity.java`):**
  - Registra un `OnBackPressedCallback(true)` sobre `getOnBackPressedDispatcher()`, compatible amb `targetSdk 36` (Android 16).
  - **`[G2120-07]` (Severitat: P3 · UX Nativa Android / Modals) — `webView.goBack()` prioritza l'historial de rutes sobre diàlegs modals oberts sense `pushState` i desactiva l'animació prèvia del gest *Predictive Back* a l'arrel:**
    - **Línies exactes:** `android/app/src/main/java/org/socdepoble/app/MainActivity.java:26-42`.
    - **Prova forense:**
      1. Si l'usuari ha navegat de `/mur` a `/mercat` (`webView.canGoBack() == true`) i obri un `<dialog>` modal (p. ex. `Dialeg` de Pedra Seca o el visor d'imatges) que no afig una entrada a `window.history`, prémer el botó físic Arrere a Android executa `webView.goBack()` a `MainActivity.java:34`, tornant a `/mur` en lloc de tancar només el `<dialog>` actiu.
      2. Com documenta honestament el mateix comentari de `MainActivity.java:21-22`, perquè l'`OnBackPressedCallback` està sempre en `enabled = true`, en la pantalla arrel (`canGoBack() == false`) Android 14–16 no mostra l'animació predictiva d'eixida cap al llançador mentre s'arrossega el dit, tot i que en soltar el gest executa `setEnabled(false); getOnBackPressedDispatcher().onBackPressed(); setEnabled(true);` i envia l'app al fons.

---

##### Tasca 6 · Llei de l'Enxufabilitat de Sollutia (Model B) i Puresa de la SPA

- **Cap import directe d'adaptador:** Totes les vistes i hooks nous o modificats (`AdjuntXat.jsx`, `ControlsAdjunt.jsx`, `useTitularDeConnexio.js`, `useFitxaDeConnexio.js`, `GestioMembres.jsx`, `ConnectarSection.jsx`, `CoreContentContext.jsx`, `MurContext.jsx`) parlen exclusivament amb `src/data/backendPort.js` i `src/data/contracte.js`.
- **Neutralitat de `onProgres` (`XAT-03`):** El callback `onProgres` s'extrau a `src/data/supabase/xatMultimedia.js:186` (`const { onProgres, ...config Net } = config;`) abans d'invocar cap RPC (`xat_reserva_adjunt`, `xat_publica_adjunt`, `xat_cancella_reserva`), de manera que mai no contamina les opcions de transport cap al servidor ni altera el comportament dels adaptadors `seed` o `local`.
- **Puresa del Web Component (`<soc-de-poble>`):** Els 4 tractors d'enxufabilitat i frontera (`tractor-enxufe.mjs`, `tractor-frontissa.mjs`, `tractor-sollutia.mjs`, `tractor-adaptadors.mjs`) passen en codi `0` sense cap avís.

---

##### Tasca 7 · Addenda de Contrast amb Codex Sol Ultra (`261025_2120_auditoria_codex`) i Consens Definitiu de Pegats per al 10/10

Després de llegir íntegrament l'informe canònic de Codex Sol Ultra (`[[261025_2120_auditoria_codex]]`), deixe segellades les tres conclusions de convergència del Gauntlet Loop:

###### 1. Validació de la Regressió `A → B → A` a Connectar (`C2120-01`)
- **Valoració:** Totalment certa i reproduïble. En la meua primera passada vaig qualificar `P1-15` de «10/10 absolut» perquè vaig verificar la seqüència unidireccional **`A → B`** (on la resposta tardana d'A ja no embruta B) i l'aïllament per àmbit als hooks `useTitularDeConnexio` i `useFitxaDeConnexio`. Tanmateix, Codex ha demostrat que a `GestioMembres.jsx:80-84`, en incrementar el mateix comptador `triaVigent.current += 1` i buidar `desant`/`pendent` en cada canvi d'`orgId`, la seqüència d'anada i tornada **`A → B → A`** mentre `marcaTitularPublic(A, nou)` continua en vol provoca que:
  1. La lectura en tornar a A (`estatTitularPublic(A)`) puga resoldre amb el valor antic abans que culmine l'escriptura en vol d'A.
  2. Quan `marcaTitularPublic(A, nou)` confirma al servidor, `if (!vigent()) return;` (`línia 110`) descarta la confirmació sense cap lectura de reconciliació, deixant el servidor en el nou estat però la casella d'A en l'estat contrari i sense `aria-busy`.
- **Acció:** S'incorpora obligatòriament al paquet de correcció immediata (`requires_human_decision: false`).

###### 2. Rectificació Formal de la Troballa `G2120-02`
- **Valoració:** Es rectifica i es retira `G2120-02`. Tal com acredita Codex i es verifica a `src/sections/xat/components/AdjuntXat.jsx:30, 43-49`, `MAXIM_POSICIONS = 300` ja està implementat a `recordaPosicio(clau, segons)` amb reordenació i poda automàtica (`if (veus.posicions.size > MAXIM_POSICIONS) veus.posicions.delete(veus.posicions.keys().next().value)`), i les posicions s'indexen per persona (`${usuariId}:${adjunt.id}`). També es rectifica la menció de `controlRef` a la secció 1.A.3: l'efecte de desmuntatge d'`AdjuntXat.jsx:112-121` neteja l'element `<audio>` i posa `viu.current = false`, però no usa `controlRef`, raó per la qual s'inclou el comptador de generació d'intent a `C2120-04 / G2120-04`.

###### 3. Llista Única i Definitiva de Pegats Consensuats (Gemini 4 Argon + Codex Sol Ultra)

Aquesta és la llista tancada i sense ambigüitats de les **4 correccions de codi** (`requires_human_decision: false`, zero canvis de contracte SQL/Auth i zero dependències noves) per a portar el commit `20d11564e` al 10/10 abans de pujar:

| ID Consens | Fitxer i Línies | Descripció Quirúrgica del Pegat | Prova de Regressió Exigida |
| :--- | :--- | :--- | :--- |
| **`1. C2120-01`** | `src/sections/profile/GestioMembres.jsx:75-126` (`TriaTitular`) | Serialitzar i conservar l'estat de les operacions d'escriptura en vol per clau d'organització (`orgId` dins de l'àmbit actual): quan l'usuari fa `A → B → A` mentre `marcaTitularPublic(A, nou)` continua pendent, mantindre `desant`/`pendent` per a A, ignorar lectures d'A anteriors a la fi de l'escriptura i, en resoldre's l'escriptura d'A, aplicar el resultat del servidor (o reconciliar amb lectura) sobre A sense tocar mai B. | Test React/jsdom amb promeses diferides per a `A → B → A` (alta i revocació, i dues intencions consecutives sobre A) + preservació del control `A → B`. |
| **`2. G2120-01`** | `src/sections/xat/components/AdjuntXat.jsx:32-36` i `ControlsAdjunt.jsx:154` | Exportar `callaVeuActiva()` des d'`AdjuntXat.jsx` (`const anterior = veus.activa; veus.activa = null; anterior?.calla();`) i invocar-la a l'inici de `grava()` a `ControlsAdjunt.jsx` abans d'`iniciaGravacioVeu`. | Test en `ControlsAdjunt` / `AdjuntXat`: amb una nota de veu activa sonant, prémer «Grava un missatge de veu» pausa immediatament el reproductor actiu. |
| **`3. C2120-04 + G2120-04`** | `src/sections/xat/components/AdjuntXat.jsx:104-176` (`ReproductorActiu`) | Afegir un comptador de generació per càrrega (`intentRef = useRef(0)`) que s'incremente en `calla()`, en pausar dins de `commuta()`, en desmuntar i en cada `carrega(renova)` (`const intent = ++intentRef.current; const vigent = () => viu.current && volSonar.current && intentRef.current === intent;`). Verificar `vigent()` en `.then`, `.catch` i `.finally` de `carrega`, i afegir `if (!volSonar.current) return;` a l'inici de `fallaCarrega()`. | Test amb dues promeses d'`obteUrl` (`A → pausa → reprén` i `A → B → A`) on la primera rebutja tard i la segona resol amb èxit: l'àudio de la segona es reprodueix sense ser cancel·lat pel `.catch` antic; i si A és silenciada per B, `onError` d'A no dispara `carrega(true)`. |
| **`4. G2120-05`** | `src/sections/xat/components/AdjuntXat.jsx:181-184, 236-243` (`metadades` i `onPlay`) | Reafirmar `e.currentTarget.defaultPlaybackRate = velocitatVeu(); e.currentTarget.playbackRate = velocitatVeu();` en `onLoadedMetadata` (`metadades`) i en `onPlay`. | Test verificant que si `velocitat` és `1.5` o `2` abans d'assignar `src` per primera vegada, en disparar `loadedmetadata` i `play` l'element conserva `playbackRate === 1.5` / `2`. |

---

##### Tasca 8 · Verificació Forense i Certificació Final 10/10 del Commit `cd1bb28a4`

Claude Code ha aplicat i commitejat el paquet únic dels 4 pegats de consens al commit **`cd1bb28a4d640d0cfe9aa077c87842c68931cb8f`** (`cd1bb28a4`, 6 fitxers, `+324 / -27` línies). He verificat línia per línia els 3 fitxers de producció i les 9 proves de regressió noves:

1. **`C2120-01` resolt a `src/sections/profile/GestioMembres.jsx:80-153` (`TriaTitular`):**
   - `orgVisible = useRef(null)`, `enVol = useRef(new Map())` i `confirmades = useRef(new Map())` substitueixen el comptador global únic.
   - Quan l'usuari fa `A → B → A` mentre l'escriptura d'A continua en vol (`enVol.current.get(orgId)`), en tornar a A la casella restaura immediatament `desant = true`, `pendent = enCurs.valor` i `missatge = enCurs.missatge`, impedint una segona escriptura concurrent (`if (desant || enVol.current.has(orgDeLaTria)) return;`).
   - La lectura `estatTitularPublic(orgId)` captura `confirmadesEnLlegir = confirmades.current.get(orgId) ?? 0`. Si l'escriptura en vol confirma abans que acabe la lectura (tant si la lectura resol com si falla), `(confirmades.current.get(orgId) ?? 0) !== confirmadesEnLlegir` preserva el valor confirmat pel servidor i només tanca `carregant: false`. I quan l'escriptura resol mentre l'usuari mira A (`visible()`), reconcilia `estat.valor` sense tocar mai B.
   - **Proves noves verificades (`src/sections/profile/GestioMembres.test.jsx:488-568`):** 3 proves diferencials noves (`A→B→A` amb lectura abans de l'escriptura, `A→B→A` amb lectura vella que arriba després de confirmar la revocació, i lectura vella que falla després de confirmar l'alta).
2. **`G2120-01` resolt a `src/sections/xat/components/AdjuntXat.jsx:40-46` i `ControlsAdjunt.jsx:6, 157`:**
   - `callaVeuActiva()` para qualsevol nota de veu activa i neteja `veus.activa = null`, i s'invoca a la primera línia de `grava()` a `ControlsAdjunt.jsx:157`.
   - **Proves noves verificades:** `AdjuntXat.test.jsx:427` i `ControlsAdjunt.test.jsx:475`.
3. **`C2120-04 + G2120-04` resolts a `src/sections/xat/components/AdjuntXat.jsx:105, 121, 144-193`:**
   - `intent = useRef(0)` puja en `calla()`, en pausar des de `commuta()` i en cada `carrega(renova)` (`const meu = ++intent.current; const vigent = () => intent.current === meu && volSonar.current && viu.current;`).
   - `.then()` i `.catch()` comproven `if (!vigent()) return;`, `.finally()` comprova `if (intent.current !== meu) return;`, i tant `calla()` com la pausa netegen `recarregant.current = false` perquè cap renovació interrompuda no deixe bloquejada una pausa externa posterior.
   - `fallaCarrega()` comprova `if (!volSonar.current) return;` a la primera línia (`línia 193`).
   - **Proves noves verificades (`src/sections/xat/components/AdjuntXat.test.jsx:386-426, 454-508`):** 6 proves noves cobrint errors tardans, èxits tardans d'intents antics, renovacions pausades o callades per una altra nota i absència de renovació en notes pausades.
4. **`G2120-05` resolt a `src/sections/xat/components/AdjuntXat.jsx:208-216, 270`:**
   - `fixaVelocitat(element)` reafirma `defaultPlaybackRate` i `playbackRate` en `metadades` (`onLoadedMetadata`) i en `onPlay`.
   - **Prova nova verificada:** `AdjuntXat.test.jsx:438-450`.

**Veredicte Final sobre `cd1bb28a4`:** **CERTIFICAT 10/10** per als 4 punts del paquet de consens.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les comprovacions s'han executat empíricament sobre l'arbre viu a `socdepoble.org` tant en `20d11564e` com en el commit final de consens **`cd1bb28a4d640d0cfe9aa077c87842c68931cb8f`** (`cd1bb28a4`):

1. **`npm run test:precommit` sobre `cd1bb28a4`:**
   - **Vitest (`vitest.precommit.config.js`):** `165` fitxers passats (`165/165`), **`3.160` proves verdes** (`0` fallades, incloent-hi les 9 proves de regressió noves).
   - **Node (`tests/fortificacio.test.mjs`, `dist-secrets`, `migracio-*`, `tractor-rls-realtime`, `xat_f0_migracio`, `documental`, `porta-reflex`):** **`259` proves verdes** (`0` fallades).
   - **Total `test:precommit`:** **`3.419` proves en verd** (`3.160 + 259`, `0` fallades).
2. **Bateria específica dels 3 fitxers de regressió (`npx vitest run src/sections/profile/GestioMembres.test.jsx src/sections/xat/components/AdjuntXat.test.jsx src/sections/xat/components/ControlsAdjunt.test.jsx`):**
   - **`100/100` proves verdes** (`30` a `GestioMembres.test.jsx` + `36` a `AdjuntXat.test.jsx` + `34` a `ControlsAdjunt.test.jsx`, `0` fallades).
3. **`npm run lint` (`eslint src tooling scripts tests --max-warnings=0`):**
   - Codi d'eixida `0` (**`0` errors, `0` warnings**).
4. **Bateria de perímetre i dades (`node --test tests/enxufe-plugin.test.mjs tests/enxufe-pantalla.test.mjs tests/vite-empremta-dev.test.mjs tests/backend_consolidacio.test.mjs`):**
   - **`60` proves verdes** (`0` fallades).
5. **Portes d'Enxufabilitat, Seguretat i Governança:**
   - `node tooling/gates/tractor-enxufe.mjs` → **Codi `0`** (`E1`, `E2`, `E3`, `E4` verds).
   - `node tooling/gates/tractor-frontissa.mjs` → **Codi `0`**.
   - `npm run porta:frontera` (`tractor-sollutia.mjs`) → **Codi `0`**.
   - `npm run porta:adaptadors` (`tractor-adaptadors.mjs`) → **Codi `0`**.
   - `npm run porta:rls` (`tractor-rls.mjs`) → **Codi `0`**.
   - `node tooling/gates/porta-olivera.mjs` → **Codi `0`**.
   - `node tooling/gates/porta-autoritat.mjs` → **Codi `0`** (`{"valid": true, "errors": []}`).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **No verificat en dispositiu físic Android/iOS real en aquest torn:** El comportament d'`OnBackPressedCallback` a `MainActivity.java` i la reproducció d'àudio amb `playbackRate` s'han auditat sobre el codi font i la bateria de proves en `jsdom`/Node; la prova tàctil del gest *Predictive Back* requereix compilació amb `npm run build:natiu && npx cap sync android` en emulador o dispositiu amb Android 14–16.
- **Sòl declaratiu de WordPress (`Requires at least: 6.5`):** El `render_callback` i la reserva `.l10n.php` estan coberts per 46 proves de perímetre, però les capçaleres de `wordpress-plugin/socdepoble-enxufe.php` i `wordpress-plugin/readme.txt` mantenen `6.5` a l'espera de la decisió del Mestre Javi sobre variant/paquet i correcció de `switch_to_locale` (`C2120-05`).
- **Porta `porta:innerhtml` en tests antics:** L'execució de `npm run porta:innerhtml` reporta 3 ocurrències d'assignació `.innerHTML =` en fitxers de test preexistents (`src/app/App.barresScroll.test.jsx:168`, `src/config/fallbackBessones.test.js:18`, `src/sections/detail/CosAmbVisor.test.jsx:444`), cap d'elles introduïda pel commit `20d11564e` ni present en codi de producció.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261025_1705_auditoria_claude]]
- [[261025_2120_auditoria_codex]]
- [[261025_2120_prompt_codex_gemini_gauntlet_loop_audit_commit_20d11564e]]
