---
type: informe
status: esborrany
description: Compilació web neta d'HEAD 9027265e1 amb el CSS de T1, auditoria del paquet, desplegament a Firebase Hosting (soc-de-poble) i verificació de socdepoble.org i de /xat.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ccce840f-487f-4195-8855-64f15f1f5d38:3eb8224e-44ea-4095-8995-8db627c38f3d
---
# Auditoria de Claude — Desplegament Firebase i puresa de l'accés al xat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ccce840f-487f-4195-8855-64f15f1f5d38:3eb8224e-44ea-4095-8995-8db627c38f3d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T14:05:49.650Z |
| Modificació | 2026-10-23T14:40:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) amb dos workflows de 6 subagents |
| Tokens consumits | ~0,84 M als subagents, més el context principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-23T14:00Z · Lectura del pla i del prompt 261023_1600. Sondeig de producció.
- 2026-10-23T14:02Z · T1: el CSS ja estava aplicat a l'arbre de treball (sense cometre, 15:51 local). `XatSection.acces.capes.test.js`: 5/5.
- 2026-10-23T14:02Z · Compilació en una exportació neta d'HEAD `9027265e1` més `src/css/modules.css` de l'arbre, a l'scratchpad de la sessió: `dist/` de 172 MB.
- 2026-10-23T14:05Z · Torn `torn_ccce840f-487f-4195-8855-64f15f1f5d38` obert i pla vinculat.
- 2026-10-23T14:03Z → 14:13Z · Auditoria del paquet abans de desplegar, en verd:
  - secrets: només el JWT anònim, cap `.env` ni mapa de fonts;
  - paritat: tot `public/` copiat i les 208 bessones `.webp`;
  - prova local de `/xat` amb el CSP de Firebase: cap 401 i la caixa d'accés centrada i sense vora.
- 2026-10-23T14:07:00Z · Gemini publica a `soc-de-poble` la versió `61f2bb4e2d2d24f5`, compilada a l'arbre viu (`index-D7QSqwpk.js`), amb el mateix `npx firebase-tools deploy`. El meu desplegament queda en suspens per no trepitjar-la.
- 2026-10-23T14:17Z → 14:29Z · Verificació de la producció real:
  - Chrome sense interfície sobre `https://socdepoble.org`;
  - procedència de la publicació per l'API REST de Firebase Hosting;
  - comportament dels clients amb un Service Worker antic.
- 2026-10-23T14:35Z · Esborrades totes les còpies de `.env*` de l'scratchpad. No queda cap procés de Chrome ni cap servidor obert. Informe tancat.
- 2026-10-23T14:36Z → 15:05Z · Per ordre del Mestre al xat, aplicats R1 i R2 a `public/sw.js` i ajustat `src/pwa/sw.test.js` (§7). Verificats amb la reproducció del worker de juny, una revisió adversarial i les proves d'empaquetat. Sense desplegar i sense commit.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Estat de producció i desplegament

**Ara a `https://socdepoble.org`:** la versió `sites/soc-de-poble/versions/61f2bb4e2d2d24f5`, publicada per Gemini a les 14:07:00Z.
- Té 731 fitxers: 729 de `dist/` i 2 reservats de Firebase.
- `index.html` només carrega `/assets/index-D7QSqwpk.js`.
- La versió anterior és `9e121d106c062f37` (22/10, 23:07Z). Entre les dues només canvien `index.html` i 292 fragments JS reanomenats. Els mitjans i `sw.js` són idèntics.

**Abans del desplegament, la producció ja estava sana.** La versió del 22/10:
- ja usava `/xat`;
- portava el tenant 1111… («La Torre de les Maçanes», D1-A);
- tenia la clau anònima de `.env.production.local`, que respon 200.

La «compilació fòssil amb `/chats` i 401» no era a Firebase: era al navegador (§3).

**Per què no he desplegat.** Quan la meua compilació auditada estava a punt, Gemini ja havia publicat. Tornar a desplegar hauria substituït una publicació d'una altra mà feta set minuts abans, i per un paquet que fa el mateix:
- l'única diferència real és el mapa `ALIAS_CANONICS_MITJANS`, que a la web no fa res (§2);
- la meua compilació (HEAD `9027265e1` més T1, `index-BJROaJOg.js`) queda auditada a l'scratchpad, per si el Mestre la vol en producció.

**Credencials.** `firebase-tools` no té cap compte autenticat (`login:list`). El desplegament funciona amb les credencials per defecte de gcloud (ADC) del Mac, del compte `socdepoblecom@…`.

### 2. Procedència: producció executa codi que no és a cap commit

- La versió `61f2bb4e…` es reproduïx byte a byte (729/729 hash gzip-9 iguals) des d'HEAD `9027265e1` més tres fitxers de l'arbre sense cometre:
  - `src/css/modules.css` (T1);
  - `src/config/assetResolver.js` i `src/config/politicaDeMitjans.js`, de Gemini.
- `git log --all -S ALIAS_CANONICS_MITJANS` no troba res.
- La publicació no porta missatge ni commit. La del 21/10 sí que en portava: «web cefc12ab 261021 fase 2».
- **`ALIAS_CANONICS_MITJANS` és codi mort al web.**
  - `politicaActual` (`Gr`) és sempre `null` a `vite.config.js`: no se segella cap `SDP_POLITICA_DE_MITJANS`.
  - L'àlies només es consulta dins de `if (politicaActual)`.
  - S'ha confirmat cridant el `resolveAsset` publicat dins de Chrome: cap de les huit entrades canvia.
  - L'únic efecte és +781 B al fragment principal i 292 fragments reanomenats, que els clients tornen a baixar.
  - El comentari diu «o hi ha base d'amfitrió», però el codi no implementa eixe cas.

### 3. El `/chats`, els 401 i l'avís taronja: el Service Worker de juny

- **Les publicacions de juny duien un altre Service Worker.** Totes, fins a `a9827b6d7c2a0dc3` (11/06), portaven un `/sw.js` de Workbox (vite-plugin-pwa) amb precàrrega.
- **Va estar en producció més de quatre mesos.** No hi va haver cap publicació fins al 21/10.
- **Què servix encara.** Eixe worker precarrega l'`index.html` i els fragments de juny i servix `/` des de la memòria cau.
  - L'app de juny redirigix `/` a `/chats` (`AppLayout.jsx`, commit `f484b6986`) i usa la clau antiga de Supabase, que dona 401.
- **L'avís taronja és de juny.** Ve de `src/components/pwa/PwaUpdater.jsx` (#f97316, «Nova versió disponible!»).
- **El `public/sw.js` actual no cura eixos clients tot sol.** No ha canviat des del 7/10.
  - S'instal·la damunt del de juny (mateixa URL i `no-cache`), però es queda en espera mentre hi haja cap pestanya o app oberta controlada pel vell.
  - El botó «Actualitzar ara» de juny envia `{type:'SKIP_WAITING'}`, i el worker actual l'ignora: el botó es queda en «Actualitzant…» per sempre.
  - Està reproduït amb Chrome sense interfície i els dos workers.
- **En prendre el control, el worker nou neteja a mitges.** Esborra la memòria `workbox-precache-v2-…`, però deixa orfes `static-resources`, `wasm-worker-cache` i `sdp-v1`.

**Què ha de fer ara qui encara veja `/chats`:**
1. Tancar TOTES les pestanyes de socdepoble.org i l'app instal·lada:
   - a Android, traure-la de Recents;
   - a iOS, del selector d'apps.
2. Tornar a obrir `https://socdepoble.org/`.
3. Si encara ix la versió vella, esborrar les dades del lloc (cadenat → Configuració del lloc → Esborra les dades).

No serveix de res pitjar «Actualitzar ara».

### 4. T1 · Puresa de l'accés al xat (verificat en producció)

- **Estils.** En producció, amb el perfil net, a 390×844 i a 1280×800, `.sdp-alerta.sdp-xat-acces` dona:
  - totes les vores a 0 px, el fons transparent, sense `box-shadow`;
  - `text-align: center` i `align-items: center`.
- **Botons.** `.sdp-alerta__accions` té `justify-content: center`, i el centre del grup de botons coincidix amb el de la caixa.
- **Captures revisades.** La frase «Entra per buscar persones i enviar missatges.» i les dues píndoles blaves estan centrades, sense barra lateral ni panell tenyit.
- **Proves.** `XatSection.acces.capes.test.js` dona 6/6; Gemini hi ha afegit una prova de contracte.

### 5. Altres observacions (no bloquegen)

- **Producció en navegador.** Cap error de consola, cap violació de CSP, cap resposta de 400 o més, i Supabase només respon 200.
- **Rutes.**
  - `/chats` mostra el 404 de l'app, amb resposta HTTP 200 per la reescriptura de l'SPA. És un 404 tou.
  - `/` va a `/xat`.
- **Peticions duplicades.** Cada càrrega cancel·la set GET de Supabase duplicats (`app_content` i `section_submissions`) i els repetix. És trànsit malgastat a l'arrancada.
- **`sw.js` i el seu límit.** La memòria del worker té un sostre de 300 entrades i 8 MB, i el build ja té 310 fragments i 5,37 MB de JS: el purgat FIFO rotarà. El comentari de `sw.js:138-140` diu que un fragment absent torna `index.html`; ara torna 404.
- **Pestanyes velles.** Cada publicació esborra els fragments antics. Una pestanya vella que carregue una vista diferida veu «Recarrega l'aplicació», com està dissenyat.
- **CSP de capçalera.** No té `media-src`, així que l'àudio i el vídeo https cauen en `default-src 'self'`. El CSP de la meta sí que l'admet, però s'apliquen tots dos. Ve d'abans.
- **Columna de converses.** A 1280 px es talla «Converses» davall del botó «+».
- **`www.socdepoble.org`.** Resol a Firebase però respon 404, perquè no és un domini connectat.
- **Wiki pública.** `wikiManifest-*.js` publica 80 documents de la Wiki (amb una ruta local absoluta). Ja hi era abans. Si ha de continuar sent pública és decisió del Mestre.

### 6. Propostes, pendents de decisió del Mestre

- **R1 · El worker atén l'ordre de juny.** El worker de `public/sw.js` accepta el missatge heretat `{type:'SKIP_WAITING'}` del mateix origen i crida `self.skipWaiting()`.
  - Així el botó de juny funciona i els clients encallats es curen amb un clic.
  - Cal tocar la prova `sw.test.js:517-521`, que ara prohibix qualsevol `skipWaiting(`.
  - Alternativa més forta: `skipWaiting()` a la instal·lació. Inverteix la política de `sw.js:38`.
- **R2 · Neteja de memòries orfes.** En activar-se, esborrar també `static-resources`, `wasm-worker-cache` i `sdp-v1`.
- **R3 · Fitxers fantasma.** Un `public/service-worker.js` que es desregistre tot sol, per als navegadors de març.
- **Producció igual a un commit.** Cometre T1 (i Gemini, els seus dos fitxers) perquè producció corresponga a un commit, o tornar a publicar des d'una exportació neta d'un commit.
- **A partir d'ara:** `firebase deploy --message "web <commit>"` i compilar sempre des d'una exportació neta, no des de l'arbre compartit.

R1 i R2 ja estan aplicats (§7). Continuen pendents R3 i l'ampliació de R2 (§7, «Queda per decidir»).

### 7. R1 i R2 aplicats a `public/sw.js` (261023, ordre del Mestre)

**Canvis** (sense cometre, sense desplegar):
- **R1 · L'ordre de juny.** El worker accepta, només de l'origen propi, un missatge amb `type` exactament `'SKIP_WAITING'` (`esOrdreLlegadaDeSaltarEspera`, `MISSATGE_LLEGAT_SALTA_ESPERA`). Fa `event.waitUntil(Promise.resolve(self.skipWaiting()).catch(() => {}))` i res més.
  - L'app d'ara no envia mai eixe missatge: les seues actualitzacions continuen esperant que es tanquen les pestanyes.
  - La capçalera del fitxer documenta l'excepció.
- **R2 · Memòries orfes.** En activar-se, el worker també esborra, pel nom exacte, `static-resources` i `wasm-worker-cache` (temps d'execució de juny, `f484b6986`) i `sdp-v1` (el `public/service-worker.js` d'abril, `d9b064012`), dins de `NOMS_LLEGATS`.
  - `sdp-salut`, `sdp-v2` i qualsevol nom semblant es queden.
- **Comentari corregit.** El de `esRespostaGuardable` ara diu que la reescriptura de `firebase.json` deixa fora `/assets/` i torna 404.
- **`src/pwa/sw.test.js`.** La prohibició de `skipWaiting(` passa a «una sola crida». S'han afegit sis proves:
  - la forma del missatge;
  - l'origen propi;
  - un altre origen i formes semblants;
  - un `skipWaiting` que falla;
  - l'activació amb les memòries de juny;
  - els noms exactes de `cachesAEsborrar`.

**Reproducció amb Chrome sense interfície.** Worker de juny que fa de doble, amb la precàrrega `workbox-precache-v2-…`, `static-resources`, `wasm-worker-cache`, `sdp-v1` i `sdp-salut`; després, «desplegament» del `sw.js` nou byte a byte; i el botó emulat com fa workbox-window 7.4.0, amb `postMessage({type:'SKIP_WAITING'}, [port])`.
- **Amb el pegat:**
  - el worker nou s'activa;
  - salta `controllerchange`;
  - la pàgina recarrega i ix el build nou (`docBuild NEW`);
  - les memòries que queden són `sdp-salut` i `sdp-pwa-recursos-v1`.
- **Control amb el `sw.js` d'HEAD:** el botó no fa res (`waiting: installed`, OLD). Tancant totes les pestanyes s'activa, però les memòries de juny i `sdp-v1` es queden.
- **Política:** amb el pegat actiu, una versió nova del `sw.js` continua en espera mentre hi ha pestanyes obertes, i s'activa només en tancar-les.
- **Un altre origen** (lloc diferent i domini diferent) no pot obtindre cap referència al worker (`SecurityError`).

**Revisió adversarial:**
- forma del missatge contrastada amb el codi de workbox-window 7.4.0 i vite-plugin-pwa 1.2.0 del lock de juny;
- `event.origin` provat a Chrome 155 i a Firefox 152;
- script clàssic compatible amb la línia base;
- cap codi del lloc no usa eixes memòries;
- mutacions: llevar R1 fa fallar 3 proves, llevar R2 en fa fallar 2 i acceptar qualsevol missatge en fa fallar 17.

Ha trobat tres inexactituds de comentari, ja corregides: `wasm-worker-cache` era NetworkFirst, `sdp-v1` és d'abril, i la forma accepta claus extres.

**Límits coneguts de R1:**
- **Clic massa prompte.** Si l'usuari clica «Actualitzar ara» durant el segon i mig de després de carregar, el missatge pot arribar encara al worker d'HEAD que ja esperava, i s'ignora. Recarregar i tornar a clicar ho resol.
- **Navegadors no provats:** Safari/WebKit (inclosa la PWA instal·lada d'iOS), per falta d'automatització. El worker de juny feia exactament el mateix `self.skipWaiting()` amb el mateix missatge.

**Queda per decidir (Mestre):**
- Ampliar R2 amb altres memòries llegades possibles: `api-cache`, que pot guardar respostes de l'API indefinidament, `images-cache`, `google-fonts-cache`, `shell-*`, `socdepoble-v1` i `sp-cache-v1.13.0`. No s'ha verificat que cap d'elles haja estat mai a socdepoble.org.
- R3, el `public/service-worker.js` que es desregistra tot sol.
- Posar al dia `FASE0_PWA.txt:136-140` (laboratori 261003), que encara diu «SENSE skipWaiting i sense canal de missatges».
- Desplegar: cal compilar de nou, perquè el `dist/sw.js` de l'arbre encara és el d'HEAD.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| `npx vitest run src/sections/xat/XatSection.acces.capes.test.js` | 6/6 (abans de la prova de Gemini, 5/5) |
| `npm run build:web` (exportació d'HEAD més T1) | correcte en 4,1 s; `dist/` de 172 MB, 729 fitxers publicables |
| Auditoria de secrets | 1 JWT, amb `role=anon` i caducitat el 2036; cap `service_role`, `sb_secret_` ni clau DeepL; cap `.env` ni `.map` |
| Clau anònima contra el projecte | `GET /rest/v1/towns` → 200 |
| Prova local, Chrome sense interfície amb el CSP de `firebase.json` | `/xat` sense errors ni 401; T1 centrat |
| `npx firebase-tools deploy …` | **no l'he executat**: Gemini havia publicat la versió `61f2bb4e…` a les 14:07Z |
| Producció: `curl -sI` | `/`, `/xat`, `/chats` i `/sw.js` → 200, `no-cache` i CSP; el fragment principal té `immutable` i ACAO `*` |
| Producció: Chrome amb perfil net, 390 i 1280 | 0 errors, 0 violacions de CSP, 0 respostes ≥ 400, Supabase 200 |
| Producció: estils i captures de T1 | correctes |
| Procedència | live = `dist/` de l'arbre de Gemini (729/729); reproduïble des d'HEAD més tres fitxers sense cometre |
| `node tooling/gates/porta-olivera.mjs --informe` | eixida 0, amb l'avís CONV-07 previ: l'índex fa 1.004 línies i té 12 seccions buides |
| R1+R2: `npx vitest run src/pwa` | 163/163 (`sw.test.js` 93/93; abans 87) |
| R1+R2: `npx eslint --max-warnings=0 public/sw.js src/pwa/sw.test.js` | net |
| R1+R2: `new vm.Script(sw.js)` | script clàssic vàlid, sense `import` ni `export` |
| R1+R2: `node --test tests/natiu-build.test.mjs tests/standalone-build.test.mjs` | 72/72 (`sw.js` continua fora dels paquets natiu i WordPress) |
| R1+R2: portes que recorren `public/` | `tractor-sollutia` i `tractor-estucat` passen. `tractor-persistencia` ix amb 1 per dos falsos positius previs, que no són a `sw.js`: `useBarresAmbScroll.js:50` i `XatContext.jsx:1236` |
| R1+R2: reproducció del worker de juny amb Chrome | amb el pegat: OLD → NEW i memòries netes. Control amb HEAD: encallat. Política: les actualitzacions normals esperen |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Desplegament.** No he fet cap desplegament, publicació, clonació ni tornada enrere a Firebase. Tot el que he fet a Firebase han sigut lectures (llista de llocs, canals, publicacions i fitxers).
- **Repositori.** Fora d'este informe, només he tocat `public/sw.js` i `src/pwa/sw.test.js` (R1+R2, per ordre del Mestre). No he fet cap commit ni he indexat res, i no he desplegat el `sw.js` nou.
- **Service Worker de juny.** La reproducció s'ha fet en local amb un substitut del worker de juny i el `sw.js` actual byte a byte. No s'ha provat en un navegador real del Mestre.
- **Gemini.** Els seus canvis a `assetResolver.js` i `politicaDeMitjans.js` continuen sense cometre, igual que el CSS de T1. Cometre'ls és decisió del Mestre o de MarIA.
- **`.agents/`.** No he escrit ESTAT ni LEDGER, que són camins de governança.
- **Recursos.** No queda cap procés, servidor ni cron obert per este torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261023_1600_pla_implementacio_desplegament_firebase_i_puresa_xat]]
- [[261023_1600_prompt_claude_gemini_desplegament_firebase_i_puresa_xat]]
- [[261023_1608_auditoria_gemini]]
