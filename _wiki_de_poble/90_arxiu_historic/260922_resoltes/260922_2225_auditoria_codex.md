---
type: informe
status: esborrany
description: Verificació independent de renovació, alta multi-tenant, avisadors, Arrels i taules HTML; sense canvis de codi.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_23ec2699-11c3-47cb-9e19-70bdbe9a7ca5:e4775328-4511-41af-9365-40b6f8453eb0
---
# Auditoria de sessió, encapsulació Sollutia i estabilitat UI

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_23ec2699-11c3-47cb-9e19-70bdbe9a7ca5:e4775328-4511-41af-9365-40b6f8453eb0 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T20:26:19.129Z |
| Modificació | 2026-09-22T20:26:19.129Z |
| Propietari | codex |
| Aprovació humana | Auditoria autoritzada pel prompt SDP-PROMPT-LOCAL-260922-CODEX; implementació bloquejada fins al consens |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 6e8b597112b9b7960b3d5c4750e3fd71716887639bd9fe111ea6b89dfa27c1be. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-22T20:26:19.129Z: obertura documental. Auditoria independent completada sobre arbre de treball; proves aïllades sense backend real ni modificació de codi.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte: NO APTE encara per certificar la integració Sollutia

Hi ha millores reals, però no es poden donar B1–B4 per tancats. El registre envia un tenant invàlid; una renovació antiga encara pot substituir una sessió externa; i persistixen defectes de renovació, renderitzat i contrast. No s'ha demostrat cap evasió de RLS ni compromís remot. Les severitats descriuen impactes reproduïbles o condicions concretes, no una promesa de «seguretat absoluta».

Sóc de Poble és la continuïtat del Rentonar i de més de trenta anys de defensa del patrimoni local. Per protegir eixa continuïtat, el contracte d'identitat amb Sollutia ha de quedar verificat abans de connectar dades reals.

### A1 · Alta · El tenant del registre continua sent invàlid

**Fonts:** `src/sections/onboarding/OnboardingSection.jsx:33`, `src/data/supabase/auth.js:116`, `supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql:42`.

El formulari envia `tenant_id: 'la_torre_de_les_macanes'`. `registerWithPassword` trasllada metadata sense resoldre `config.tenantId`. L'última redefinició local de `handle_new_user` convertix eixe valor a UUID; si falla, posa null i llança `SDP-REG-001`. Per tant, afegir el camp no ha arreglat el contracte: el nom del poble no és el seu UUID.

**Reproducció:** seguir formulari → cos `data` de `/auth/v1/signup` → cast `::uuid` del trigger vigent. La migració de 14/09 ignorava metadata, però la de 15/09 la substituïx: cal llegir l'ordre complet. No he executat altes ni SQL remot; el bloqueig correspon a un backend que tinga les migracions locals aplicades.

**Proposta:** resoldre el UUID des de configuració/selecció autoritzada, validar-lo en l'adaptador i conservar la comprovació servidor de poble existent i obert. Provar UUID vàlid, absent, invàlid i poble tancat. `requires_human_decision: false`.

### A2 · Alta · L'epoch no protegix les entrades OAuth i de l'amfitrió

**Fonts:** `src/data/supabase/auth.js:8–55`, `src/data/oauthRelay.js:89–113`, `src/data/identitat.js` (`adoptaSessioExterna`), `src/host.js:282`.

Password i logout incrementen `sessioEpoch`; OAuth i `adoptaSessioExterna` escriuen via `desaSessio` sense incrementar-lo. La generació de `sessionService` només comprova després del `await`: no pot desfer l'escriptura que `renova` ja ha fet.

**Reproducció aïllada:** iniciar refresh d'A amb resposta ajornada; simular l'adopció de B al mateix magatzem, com fa identitat; alliberar la resposta vàlida d'A. Resultat: `refreshSession === true`, usuari final A. Control positiu: executar logout abans d'alliberar-la retorna false i no escriu res. S'ha executat el cos d'`auth.js` amb imports i fetch simulats; no és una prova E2E del host.

**Proposta:** una única revisió de sessió per a totes les entrades/eixides, també quan entra el mateix usuari amb altres credencials. Comparar revisió, refresh token i context de backend abans de persistir; vincular la promesa en curs a eixe context. Provar A→B, A→logout, OAuth i renovació concurrent. `requires_human_decision: false`.

### A3 · Alta funcional · Un error transitori deixa la renovació sense reintent

**Fonts:** `src/data/sessionService.js:92–134`, `src/data/identitat.js` (`usuariDeSessio`).

El temporitzador es consumix; `renovaAra` captura el rebuig i només escriu un avís. No arma cap reintent ni sincronitza l'estat quan venç el token. Si l'usuari continua en la mateixa pestanya, pot quedar `estat: dins` mentre el lector de la identitat ja retorna null. Online/visibility o una petició posterior poden rescatar-ho, però no hi ha recuperació autònoma garantida.

**Reproducció:** token a 30 segons de caducar, marge de 60 segons, refresh que rebutja amb error sintètic 503: una crida, zero timers pendents, estat dins.

**Proposta:** reintent limitat amb espera progressiva, cancel·lació per revisió i actualització coherent de l'estat de sessió. Provar 503, timeout, reconnexió, caducitat i 400/401 definitius. No crear un reintent immediat recursiu. `requires_human_decision: false`.

### A4 · Mitjana · L'alta interpreta una resposta SDK en una petició REST directa

**Fonts:** `src/data/supabase/auth.js:116–128`, `src/data/supabase/runtime.js` (`request`), `node_modules/@supabase/auth-js/src/lib/fetch.ts:253`.

`request` retorna el JSON cru. `registerWithPassword` només desa `result.session`; el transformador del SDK instal·lat construïx precisament eixa sessió a partir dels camps de primer nivell. En una alta amb autoconfirmació i resposta `{access_token, refresh_token, user, ...}`, el compte es crea però no s'adopta la sessió.

**Reproducció aïllada:** retornar una resposta plana d'alta des del doble de `request`; zero escriptures, usuari null. Amb confirmació de correu exigida, no rebre sessió és normal: no confondre eixos dos casos.

**Proposta:** normalitzar la resposta REST a l'adaptador, validar que `desaSessio` ha tingut èxit i provar alta amb/sense confirmació. `requires_human_decision: false`.

### A5 · Mitjana · L'avisador encara pot llançar durant el render

**Font:** `src/components/universal/AvisadorEfimer.jsx:23`.

`new Error('xarxa')` es representa correctament. Però la branca `missatge.message` no comprova que siga text: `{message: {detail: 'xarxa'}}` es passa directament a React i falla amb «Objects are not valid as a React child». La conversió de null produïx literalment «null».

**Reproducció:** `renderToStaticMarkup` sobre el component real transformat amb esbuild; cas Error passa, cas message-object llança. No afirme que tots els errors del backend tinguen eixa forma: és una entrada que la interfície permissiva de `showToast` admet i no normalitza.

**Proposta:** normalitzador de missatge a string amb fallback segur, sense getters/conversions no controlades; provar Error, DOMException, objecte, message-object i valor buit. `NotificationProvider` ja usa `key={toast.id}`: el remuntatge evita atribuir-li erròniament el problema del timer d'un avisador reutilitzat. `requires_human_decision: false`.

### A6 · Mitjana · Arrels no arriba al contrast mínim

**Font:** `src/app/App.jsx:97`; mesura de CSS computat al navegador, menú compacte a `http://localhost:3340/xat`.

Títol a 10 px, pes 700, color `rgb(173,76,3)`, opacitat 0,6 sobre `rgb(14,13,12)`. Color compost aproximat `(109.4,50.8,6.6)`, contrast **1,97:1**. El text ordinari requerix 4,5:1 segons [WCAG 2.2, 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Ser negreta a 10 px no el convertix en text gran.

**El que sí funciona:** l'arbre accessible mostra Arrels i els enllaços del grup; el menú s'obri, Escape el tanca i el focus torna al botó d'obertura. No s'ha completat una matriu de tots els temes i viewports.

**Proposta:** token de color propi de la barra, opacitat completa i mida llegible; mesurar de nou clar/fosc i ample/compacte. El color del heading està sobreescrivint l'herència blanca del menú. `requires_human_decision: false`.

### A7 · Mitjana · Taules bàsiques segures en les proves, però importació incompleta

**Font:** `src/utils/sanitize.js:71–91`; DOMPurify instal·lat 3.4.14.

Es conserven table/thead/tbody/tr/th/td. El corpus provat elimina onclick, onerror, script, svg, href javascript i SVG en data URI. **No he trobat un bypass XSS provocat per les etiquetes de taula afegides.** Açò és cobertura limitada, no demostració universal d'absència de XSS. La configuració seguix el model de llistes permeses de [DOMPurify](https://github.com/cure53/DOMPurify).

En canvi, es perden `colspan`, `rowspan`, `scope`, `caption` i `tfoot`. Una cel·la combinada es convertix en una cel·la simple; es deteriora la disposició i l'associació accessible de capçaleres. Reproducció amb caption, th scope i td colspan/rowspan: l'eixida conserva el text, però elimina eixos atributs i les etiquetes caption/tfoot.

**Proposta:** especificar el subconjunt documental necessari, afegir només els atributs estructurals segurs i proves de roundtrip amb taules reals de Docs/Markdown. No permetre indiscriminadament style, handlers ni SVG per recuperar fidelitat. `requires_human_decision: false`.

**Integració del sanejador:** els dos punts de render de Wiki ja criden `sanitizeHtml`, millora confirmada. `src/sections/disseny/DesignSection.jsx:31` encara inserix `page.html` directament; actualment és contingut local, no una explotació remota demostrada. La porta innerHTML també assenyala text citat dins de wikiManifest: eixa coincidència textual no és un nou sink executable.

### A8 · Mitjana · SessionProvider sense config conserva un bucle de sincronització

**Fonts:** `src/app/contexts/SessionContext.jsx:14–20`, `src/data/sessionService.js:30–57`.

El valor per defecte `config = {}` crea un objecte nou en cada render. L'efecte depén de config, sincronitza i rep un estat nou; això torna a renderitzar el provider i reinicia el cicle. Pot provocar consultes de rol repetides si hi ha sessió.

**Reproducció aïllada React:** muntar `SessionProvider` sense config, amb un doble de servei que notifica un objecte nou després de cada configuració, igual que sincronitza; tall artificial després de 8 notificacions: 9 crides a `setSessionConfig`. És una prova del feedback del provider. El muntatge principal de `PedraSecaEmbed` passa config explícita: no presente este cas com un bucle observat en la pàgina actual ni com una tempesta de tokens ja mesurada.

**Proposta:** constant immutable per defecte i sincronització idempotent; provar muntatge amb i sense config, StrictMode i desmuntatge. `requires_human_decision: false`.

### Enxufabilitat: límits del contracte que falta validar

`sessionService` manté config/estat/timer globals, `auth.js` una única promesa de refresh i `storage.js` claus fixes per origen. Les instàncies de WebComponent en un mateix document compartixen sessió; no es pot prometre aïllament entre tenants/backends només per tindre Shadow DOM. Cal declarar si el contracte admet únicament una identitat/backend per pàgina i rebutjar configuracions incompatibles, o implementar l'aïllament si és un requisit real. No propose una refactorització global sense eixe contracte.

Iframe requerix verificar origen, CSP efectiva, sandbox, storage i OAuth en l'entorn real de Sollutia. En local no he fet esta prova entre orígens ni he certificat headers de producció. L'emmagatzematge actual ignora errors d'escriptura: una sessió aparentment adoptada en storage bloquejat és un altre cas que la matriu ha d'incloure.

### Reunió a l'Olivera: resposta a MarIA i Claude

He llegit el pla `260922_2104_pla_implementacio_auditoria_extrema.md` i l'auditoria de Claude 2128 de manteniment del cervell. El pla disponible es declara acabat, cobrix ports/dependències/CSS i diu «Cap risc» i «estan a producció». **No és el pla de resolució dels defectes d'esta petorreta i no aporte cap evidència que sostinga eixa declaració de producció.** L'auditoria específica de Claude per al prompt 2215 encara no era a l'Escriptori en l'última consulta.

Acord amb Claude: usar un tall verificable de l'arbre i separar les portes fallides dels defectes reals. Les coincidències d'assignacions globals dins del manifest són text d'una auditoria anterior; no les compte com dos globals de runtime nous. La publicació de documents operatius continua sent un tema a resoldre en el pla de govern, separat d'esta revisió d'auth.

**Esmenes proposades al pla, en ordre:**

1. UUID del tenant i normalització de resposta d'alta, amb proves de contracte servidor.
2. Revisió comuna d'identitat per a password/OAuth/host/logout, promesa de refresh acotada i reintents limitats.
3. Idempotència de SessionProvider i contracte d'instàncies/teardown.
4. Normalització d'avisos, contrast d'Arrels i taules amb semàntica.
5. Canari Sollutia amb dades fictícies: dos usuaris, dos tenants, canvi de sessió durant refresh, errors 401/503, storage bloquejat i OAuth en iframe.

**Consens pendent:** esta és la posició de Codex, no una aprovació atribuïda a MarIA o Claude. Es manté el bloqueig de codi ordenat pel Mestre. Cap missatge extern enviat ni pla alié sobreescrit.

### Millora de prompt_local.md

- Port real 3340, descobert de configuració; el 5173 del prompt no respon i no s'ha iniciat un segon servidor.
- Versió coherent: plantilla viva 2.1.0, títol encara v2.0 i router 2.0.0. Separar versió editorial i versió de contracte si són conceptes distints.
- Identificador de cada bug B1–B4 amb cas de prova i fitxers; no declarar-los resolts només en l'historial.
- Substituir «total seguretat»/«absolutament estable» per matriu observable i limitacions d'abast.
- Incloure hash/tall, ordre de migracions, ruta exacta del pla viu i estats de consens per agent.
- Distingir auth gestionada pel host, Supabase propi, iframe i WebComponent; són contractes diferents.
- Fer explícit que l'auditoria pot escriure informe/índex/estat, mentre el bloqueig afecta implementació. Mantindre `requires_human_decision: false` per a decisions tècniques ordinàries.


<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Comprovacions executades

- `vitest run src/utils/sanitize.test.js src/app/App.test.jsx src/sections/notes/NotesDataContext.test.jsx`: **11/11**, tres fitxers passen. La fallada històrica d'App no es reproduïx en este tall; no es perpetua com a fet actual.
- Laboratori temporal `/tmp/sdp-audit-2225.mjs`: codi dels mòduls llegit directament del disc, imports externs substituïts per dobles; DOMPurify real amb JSDOM i React real amb esbuild. Casos de cursa, alta plana, 503, missatges React, taules/XSS i provider descrits en cada troballa. No s'ha fet cap petició d'auth real. El guió és temporal i les reproduccions del text són l'evidència durable.
- Navegador: menú compacte de 3340, arbres accessibles, CSS computat i captura inspeccionada; Escape i retorn de focus verificats.
- `tractor-innerhtml.mjs`: eixida 1, un sink real en DesignSection i una coincidència en text del manifest.
- `tractor-enxufe.mjs`: E1/E2/E3 passen; E4 falla per dos patrons dins de prosa de wikiManifest. No confondre-ho amb assignacions de runtime.
- HEAD `6423590e`, arbre amb nombrosos canvis previs/concurrents. No s'ha compilat ni regenerat el manifest públic per a esta auditoria.

### Empremtes SHA-256 del tall verificat

```text
ecdf921a7b558021c780df194b652a5317328731015e092f4402f1195c9a0c12  src/app/contexts/SessionContext.jsx
49a4ae91b1cae4617a4211e1ad9126146aeb94b7b914afb8c0b7a5a7e01f4f30  src/data/sessionService.js
541dc42df9fdd668e8107da2d5c01c45065be962af9a427ea3b40ddd58e03e74  src/data/supabase/auth.js
7264d2db0e5c96f9fffc9b16f230f89455fdb63ba11e5a4be99f3ab612c70b89  src/data/oauthRelay.js
5811f85c47c07fd5847c6974576d5bc19c5c0c8a797b4d5e9a634130eee853db  src/data/identitat.js
2deb47b6b7435f40c77f08ecb57137cb8356a67057c60cd3aa5e8ca728e8fa74  src/sections/onboarding/OnboardingSection.jsx
1f5939722fb99ee01ebeb20c61ab71d26eb89b7d246d6e8847fc47434865094d  src/components/universal/AvisadorEfimer.jsx
9a9c7fcd742d7ecca95723b7b20f6aacb6a8a5f57ce1022b223d16fba953aef4  src/app/App.jsx
ee67e453d652c6a848b21374d2c036155ad8a054046ceb874b06bc8b7beb2be3  src/utils/sanitize.js
```

### Tancament documental

`document.mjs check`: **valid: true**. `tancament.mjs --check --turn-id …`: **valid: false**, executat després del lliurament i de l'actualització d'ESTAT.

Passen plantilles, autoritat, verificació de signatura del ledger i catàleg de skills. Fallen segell (754a6ec3 / 6314fc7f), Wiki (enllaços anteriors trencats) i SCC (prompts 2215 sense àncora, acta 2200 orfe i estil inline d'App).

A més, el meu torn no té pla vinculat ni relleu al LEDGER i queda `context_loaded`. No els presente com a deute alié: són requisits documentals no satisfets en este torn d'auditoria. No he fabricat un consens ni he vinculat el pla antic «acabat» per obtindre un verd artificial. L'informe està lliurat i validat individualment; el tancament global no està certificat.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

No s'ha modificat codi de producte, SQL, dependències ni documents de les companyes. Només l'informe, l'ancoratge automàtic, el torn documental i l'estat de relleu. No s'ha llegit .env ni l'arxiu històric.

Les proves d'auth són aïllades amb dobles; no acrediten RLS, configuració efectiva de Supabase, credencials de Sollutia ni OAuth real. Les proves XSS no són un fuzzing exhaustiu. La comprovació visual cobrix el menú compacte observat. No declare producció preparada, consens complet ni repositori globalment verd.

Acta Marmota de final d'esta sessió no generada: queda com a pendent de jornada; esta auditoria no la substituïx.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
