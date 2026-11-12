---
type: informe
status: esborrany
description: Porta PostgreSQL nativa sense omissions, oblit IAIA, imports transaccionals i lots Vitest en clon aïllat, amb Kit CAS i límits de verificació.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_10f3a7d3-5bcc-4341-aafc-2c89a3073f62:804f0498-8616-41b7-91ac-6f6fb4666da0
---
# Auditoria Codex R20 · SQL AAL2, oblit IAIA, Panell i suite

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_10f3a7d3-5bcc-4341-aafc-2c89a3073f62:804f0498-8616-41b7-91ac-6f6fb4666da0 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T21:21:44.445Z |
| Modificació | 2026-11-11T22:34:08.130480+00:00 |
| Propietari | Codex · Carril 2, clon /tmp/sdp_codex_r20 |
| Aprovació humana | Encàrrec explícit del Mestre, Onada R20 de l’11-11-2026; no substituïx l’arbitratge d’integració |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, agent basat en GPT-6 segons la identitat del sistema; variant de servei Sol/Astra no exposada de manera verificable |
| Tokens consumits | L’entorn no exposa un comptador verificable; no s’inventa una xifra |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T21:21:44.445Z: document creat amb `obrir_torn` → `context` → `plan` → `create`, amb el pla R20 vinculat al torn.
- T1: kit v1, 6 operacions i 5 precondicions; motor PostgreSQL natiu sense omissions, AAL2, concurrència, crítica independent i CAS contrastats.
- T2: kit v2 acumulatiu, 41 operacions i 9 precondicions; oblit individual IAIA i fortificació de dades del Panell. Les objeccions reproduïdes sobre OPML i canvi d’efectiu es corregixen amb proves roges i verdes.
- T3 inicial: kit v3 acumulatiu de 49 operacions. Es conserva la primera global bruta amb els seus errors d’entorn, sense reetiquetar-la. Es reparen la cache privada dels clons enllaçats i l’arnés de càrrega del receptari real de Nevera.
- Refresc: la base del clon passa a `b2bcc0092945c55c606d6aaeb19035c9d8bc9e25`, composició sintètica R19+Claude, amb preimatges conciliades. El delta propi té 50 paths en eixe tall; no es confon amb el manifest v3 anterior.
- T3 següent: les 44 fallades de la global v2 es reproduïxen i es reparen en lots. Es mantenen la frontera de mòduls, les expectatives de les proves i els textos literals atribuïts a les fonts. El conjunt v4 incorpora 72 paths de canvi sobre la base refrescada.
- Tall final: global v3 acabada a les 23:27:31 CET, sobre MAIN congelat, amb Git real, permisos originals, dependències pròpies i configuració per defecte. Resultat brut i integritat: exit 0, sense fallades i amb 120 omissions heretades. Kit v4 publicat i recursos propis tancats; pin i rebuts finals consignats davall.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### MCR · Matriu de conformitat dels requeriments

| Requeriment | Estat acreditat | Evidència i límit |
| --- | --- | --- |
| Aïllament del Carril 2 | Verificat en l’abast Codex | Codi, proves i configuració treballats al clon `/tmp/sdp_codex_r20`. Kit al satèl·lit autoritzat. En el viu només hi ha seguiment documental del circuit: informe, índex/rebuts i bloc delimitat del Llibre. Cap font, test, tooling ni Git vius modificats per este carril. |
| T1 · Porta PostgreSQL sense skip | Fet local | PostgreSQL natiu 18.6, 9 passades, 0 fallides i 0 omissions. La prova entra en `test:sql`, `test:precommit` i la suite Node primària. El motor absent o inoperatiu produïx error explícit. |
| T1 · Foraster, drafts i privats | Matriu local passada; privadesa de producció oberta | La candidata additiva 2149, després de 1735 i 2005, compartix predicat SELECT/RPC i rebutja marcadors privats, drafts, contradiccions i formes malmeses de la fixture. Conserva el llegat sense marcadors. Els escriptors antics i la projecció del payload complet mantenen oberta l’objecció de Claude sobre 2005; no es declara resolta amb dades sintètiques. No s’aplica SQL remot. |
| T1 · AAL2 i concurrència | Fet local | Claims Auth sintètics, AAL2 literal, rol actiu i anti-autoaprovació. Dues connexions amb PIDs diferents, solapament i espera advisory observada: conflicte `40001`, replay idempotent i rollback. No acredita JWT signat, TOTP, GoTrue ni PostgREST. |
| T2 · Oblit individual IAIA | Fet local, amb límits explícits | IDB v2 amb títols i UUIDs, zero cos de missatges persistent. Tombstones individuals i generació de persona invaliden escriptures tardanes. Logout purga tots els actors/backends de la persona. UI REA a 375/768/1440: cancel·lar conserva, confirmar elimina una conversa i preserva l’altra. |
| T2 · Set apps del Panell | Revisades i fortificades en l’abast provat | Bar valida totals, IVA, pagaments i canvi; Nevera admet la còpia plena amb límit de 8 MiB en bytes; Gestoria impedix treball ajornat després de tancar; Lector incorpora OPML estricte i atòmic. Genealogia, Salut i Avisador contrastats sense inventar-los canvis de producció. Quota injectada sobre IDB nativa i Web Locks; no disc físicament ple. |
| T3 · Lots i suite global | exit 0, sense fallades i amb 120 omissions heretades | Global v3: 37.201 passades, 0 fallides i 120 omissions, en 2.180 fitxers; exit 0. 7.914 entrades sense deriva de contingut/modes; HEAD i índex intactes. Les passades anteriors i els lots solapats es conserven separats. |
| Kits després de cada bucle | v1/v2/v3 preservats; resultat v4 explícit | Conjunt v4 de 72 operacions, 13 precondicions i 548 fitxers segellats sobre la base refrescada. Pin SHA-256 de `SHA256SUMS`: `a7ff613a312108ae7922463ddd1c07b4a06d2d21d2f4e47733f6f5aadd54bdd1`. Verificació del CAS final: 11/11 assajos sense fallades, incloent refús de deriva només de mode; aplicació, replay i rollback sobre la base física completa restauren els 7.932 fitxers i modes, amb Git net. Dry-run del kit final extern: preimatges acceptades i postimatges de MAIN ja aplicades, sense escriptura. El manifest fixa preimatges, postimatges, modes i precondicions; no s’aplica sobre una base divergent. Els modes abans provenen de la captura física fixada per SHA: `supabase/migrations/README.md` passa de `0600` a `0644`; Git no conserva el `0600`. Una còpia Git fresca requerix reproduir explícitament eixe mode abans del dry-run, sense normalització automàtica. El rollback restaura `0600`. |
| Refresc sobre el treball de Claude | Completat al clon; viu separat | BASE sintètica `b2bcc009…`, arbre `7a6dd9716daf6867d4d29fa79aae53695c382464`: captura del viu `c07f78b83` → Codex R19 R2 → Claude abans de Carbon → Carbon R19 → pegat creuat → Claude després dels kits. No és un commit fet al viu per Claude ni una integració remota. |
| Exclusivitat Carbon | Respectada | Cap delta propi sobre `NotesSection`, `BarraEinesEditorUniversal` o `pageContent.r10.js`. La composició de base conserva el treball dels altres carrils amb atribució; no és una reautoria de Codex. |
| Carbon R20 Rev 1 | P1 reproduït; `NO_APLICAR` | El pont reconcilia sis derives i passa els assajos mecànics CAS, però una publicació de Xixona absent del feed carregat pot canviar a La Torre en actualitzar sense tria nova. La contraauditoria confirma el mínim. Carbon R20 no entra en el manifest principal; només es conserva evidència marcada NO_APLICAR, sense executables ni deltes del pont en el manifest principal. |
| Build, lint i portes | Verificat en clon | Entrada web de 224.226 B gzip-9 i arrencada completa de 456.943 B gzip-9. ESLint global: 0 errors i 0 avisos. Design Guard: 3.799 fitxers, 0 crítics i 0 avisos. RLS, ordre SQL i secrets del dist contrastats. Estes portes no acrediten desplegament. |
| Gauntlet Node 0 | Quatre escoles entre rondes; sense unanimitat | qwen, phi4 i glm4 responen en la ronda compacta; Gemma completa les quatre lents entre peticions successives. Lock cooperatiu respectat. Timeouts, fragments omesos i hipòtesis refutades es conserven; no són vots favorables ni execució de proves. |
| Tancament net | Resultat explícit | cens de les 23:30:33 CET: cap procés propi resident, cap backend SQL de prova ni grup Vitest viu; serveis dels altres carrils i Node 0 preservats |

### Defectes reproduïts i correccions

1. **Motor SQL i recursos:** el test silenciosament omés passa a executar PostgreSQL natiu per defecte. Es preferixen binaris locals o `SDP_POSTGRES_BIN`; `embedded-postgres@18.6.0-beta.19`, fixat al lockfile, és la reserva de desenvolupament. El clúster és nou i privat, sense URL de base existent. A Darwin, el socket sota un cwd llarg excedia el límit: ara usa un directori curt propi i també es retiren dades i socket si fallen l’arrencada o `spawn`.
2. **Predicat SQL local:** 2005 deixava passar els marcadors de draft/privat reproduïts en la fixture. La candidata 2149 aplica un mateix predicat a lectura i padró públic. La crítica va trobar un camp `payload` absent en la primera candidata; queda corregit i cobert amb notes privades reals de la fixture i un article públic. És una prova de la matriu local, no la resolució general de la política pública de producció.
3. **Gestoria:** cues, obertures i concessions de lock tardanes podien reactivar el port després de `tanca`. Barreres i `AbortSignal` impedixen treball nou o ajornat. Les transaccions que ja estaven actives poden acabar atòmicament.
4. **Bar:** imports amb totals, IVA, pagaments o canvi incoherents eren acceptats. La restauració recalcula i valida abans de tocar el destí. El mínim independent de 130 cèntims totals, 200 lliurats i 99.999 de canvi retorna `COPIA_INVALIDA`, mentre que el canvi correcte de 70 es conserva.
5. **Nevera:** el límit antic impedia reimportar una còpia vàlida plena. El límit de 8 MiB es mesura en bytes UTF-8 i cobrix el model sense acceptar excessos multibyte. A banda, una prova començava el timeout abans de carregar el receptari: l’arnés controla la promesa, comprova l’estat d’obertura i IDB buit, allibera el mòdul real i manté noms, racions, quantitats i persistència. No s’augmenta cap timeout ni es substituïx el receptari per dades falses.
6. **Lector/OPML:** s’incorpora l’exportació/importació de subscripcions, amb validació XML estricta, fusió atòmica i preservació d’articles i lectures. Huit mínims independents de XML/namespace/declaracions malformats es rebutgen i el control vàlid es conserva. Estos mínims no demostren XSS; no s’eleva una hipòtesi genèrica a P0.
7. **IAIA:** s’afegix oblit selectiu al camí de menú i confirmació existent, amb cancel·lació i error de quota accessibles. L’esborrat del títol i el tombstone és transaccional; la generació per persona impedix que una altra pestanya o una resposta tardana el ressuscite després del logout. Els canvis de persona, actor i backend aïllen el proveïdor; els missatges continuen només en memòria en este registre.
8. **Cache de clons enllaçats:** el fallback a `/tmp` deixava el CJS optimitzat fora d’un ancestor amb React i provocava errors de càrrega dels mòduls reals. Amb dependències enllaçades, la cache va dins de l’arrel real a `.sdp-vite-cache/<empremta>`. Es rebutgen symlinks, es separen arrels diferents i no s’escriu a dependències alienes. Els generats s’exclouen de Git, ESLint i Vitest, amb les regles de fonts intactes.
9. **Frontera real del nucli:** un mòdul de funcions pures també importava i exportava un ganxo amb dependència de sessió. El ganxo passa a `src/hooks/usePublicadorsBarraRecurs.js` i els consumidors s’actualitzen; la clausura del nucli deixa d’arrossegar `SessionContext`/`IdentitatContext`. L’oracle de frontera no es relaxa.
10. **Mocks i oracles:** es completen els exports opcionals de `UIContext` en diversos arnesos. Les accions/estat opcionals reutilitzen les mateixes fixtures; sense proveïdor d’estat retornen `null`, com el contracte real. Es mantenen les expectatives de traducció, dates, navegació i àncores. La via `senseLogo` no autoritzada de Natura es retira perquè decidisca `PageFrame`. Es preserven autoria literal, història editorial i variants de Node 0; els oracles s’alineen amb la base atribuïda, sense reescriure originals per fer-los passar.
11. **CSS i catàleg:** l’escàner de classes exclou logs/preimatges de laboratoris que emmascaraven una regla sense consumidor; la regla morta es retira sense ampliar la baseline. Els mosaics usen el token de 4 px. La guarda de contingut generat distingix `content` de `justify-content`. El catàleg SQL documenta 2005/2149 sense una vinyeta duplicada.

### Objeccions que continuen obertes

**Privadesa de producció, 2005/2149.** Claude 2143 assenyala que la política 2005 obri files completes de Mur, Mercat, Agenda i Multimèdia a `anon`, incloent dades d’autoria, contacte i EXIF, i que hi ha contingut creat sota el text «només gent registrada del poble». L’esborrat històric local tampoc acredita esborrat de servidor. La candidata 2149 conserva publicacions llegades sense marcadors; l’app antiga no garantix eixos marcadors. Per això, passar la fixture de drafts no resol el conflicte de política ni prova una projecció pública mínima. La proposta conservadora és arbitrar la frontera pública abans d’aplicar SQL remot: restringir la lectura o definir una projecció pública mínima amb política coherent. No s’ha executat una lectura REST de producció per certificar una fuita real, ni s’ha aplicat 2149 remotament. Les notes de `public.notes` continuen fora de la lectura `anon` en la matriu local.

**Carbon R20, P1 `CARBON-R20-POBLE-01`.** El mínim munta `NotesProvider` i `NotesEditor` reals amb dades i transport sintètics, nota ja publicada a Xixona i feed buit, un estat admés pel port paginat. Sense canviar el selector, «Actualitzar al Mur» envia `poble_id: la-torre-de-les-macanes` i acaba mostrant «Publicat». L’espera de l’ACK està sincronitzada; la fallada és el valor enviat. Cal conservar el destí publicat de manera persistent, recuperar-lo per id o bloquejar una actualització amb destí desconegut fins a una tria explícita i comprensible. El pont mecànic no resol el defecte i resta `NO_APLICAR`. El mínim no acredita una escriptura real en Supabase ni la seua RLS.

### Mètode, lectura i arbitratge

El treball s’ha organitzat en cinc fases MIT: estudiar fonts i invariants, formular mínims, reproduir el roig, corregir amb proves dirigides i sotmetre el resultat a crítica i segell. EGM aplica huit lents a port, permisos, lectura pública, persistència, concurrència, corrupció, recursos i coherència d’oracles. La crítica independent ha canviat el codi en els defectes demostrats. REA ha capturat el procés PostgreSQL i els fluxos d’oblit en navegador real. `craft-anything` s’ha aplicat com estudi, construcció, comprovació i preparació amb tres amplàries; no es presenta com una skill carregada si no consta com a tal.

La lectura documental atribuïx cada tram: Llibre complet col·lectiu de 906 línies en el tall original, deltes posteriors contrastats, índex viu llegit per Panell, auditories R19 i prompts dels altres carrils llegits per l’arrel, i versions actualitzades de Claude/Node 0 rellegides pel carril de revisió. Els rebuts preserven hashes, rangs i límits; no s’atribuïx una lectura personal que no s’ha fet.

Les quatre escoles del Node 0 cobrixen quatre lents entre rondes, amb respostes finals d’almenys 120 caràcters. Les primeres propostes de qwen/phi4 confonien fragments omesos amb codi absent; l’arbitratge conserva el buit de context i contrasta notes privades, autoaprovació, AAL2 i dues connexions amb execució local. Cap model ha executat les proves.

El feed viu de l’Assemblea és una altra font, canviant i consultiva. En el tall rellegit de les 22:57:39 CET, M1 afirma una col·lisió SHA-256 sense mínim reproduïble; M2 no aporta una seqüència fiscal que bifurque; M3 proposa DOMPurify sense un payload executat; M4 declara contrast i geometria sense mesura aportada; M5 necessita contrast dels símbols/esquemes; M6 inclou substitucions idèntiques. La connectivitat d’Ollama i la integritat documental no certifiquen eixes afirmacions. No es proclama unanimitat Claude/Carbon/Node 0 ni 10/10 universal.

### D01–D15 · Estat acreditat, sense puntuacions inventades

| Codi | Dimensió | Evidència i límit |
| --- | --- | --- |
| D01 | Enxufabilitat | Port neutral conservat. El ganxo de publicadors queda fora del mòdul pur consumit pel nucli, amb la prova de frontera intacta. Cap backend nou dins de Sollutia. |
| D02 | Seguretat/RLS | PostgreSQL natiu final 9/9 i matriu crítica local 27/27. Auth sintètica. Objecció de política pública 2005/2149 encara oberta, sense desplegament ni certificació de producció. |
| D03 | Pedra Seca | Design Guard final: 3.799 fitxers, 0 crítics i 0 avisos. Peces existents, espaiat de 4 px i regla sense consumidor retirada. No aprova funcionalment Carbon R20. |
| D04 | Accessibilitat | Menú, botó, confirmació, cancel·lació, focus i quota de l’oblit IAIA provats. No certificació WCAG completa de l’app ni de les set eines. |
| D05 | Rendiment | Entrada final de 224.226 B gzip-9, dins de 250.000 B; arrencada completa de 456.943 B gzip-9 amb sis `modulepreload`. Són pressupostos diferents. |
| D06 | Local-first/privadesa | Títols en IDB, zero cos de missatges en este registre, oblit/logout i invalidació d’escriptures antigues. Fallada conjunta d’IDB i preferències persistents deixa la purga durable pendent. |
| D07 | Cinc llengües | Quatre claus d’oblit IAIA en ca/es/en/eu/gl. El pont separat conserva estes claus i les 17 de Carbon amb contrast semàntic, però no s’integra ni s’aprova tota l’edició de l’altre carril. |
| D08 | Custòdia/autoria | Originals literals, història editorial i atribució dels carrils conservats. Cap imatge sintètica ni nova certificació botànica incorporada en R20 per Codex. |
| D09 | SEO/projecció | F4 i manifest Wiki coherents amb la base corresponent. Cap publicació remota ni nova verificació federada real acreditada. |
| D10 | Dades obertes | Imports validats abans de mutar i rollback en els casos provats. OPML és còpia de subscripcions, no dels articles complets; GEDCOM i dades personals es mantenen dins de l’abast local auditat. |
| D11 | Proves | Global v3: 37.201 passades, 0 fallides i 120 omissions; exit 0. Logs anteriors conservats, omissions comparades i cap suma de bateries solapades. |
| D12 | Multi-dispositiu | Chromium a 375/768/1440 i dues pestanyes amb IDB/Web Locks natives. Fixture de components/CSS reals, sense Supabase autenticat ni dos aparells físics. |
| D13 | Governança | Circuit canònic, preimatges i versions CAS preservats. Pin final `a7ff613a312108ae7922463ddd1c07b4a06d2d21d2f4e47733f6f5aadd54bdd1`. L’historial del Llibre no es reescriu; el seguiment R20 usa un bloc delimitat i reversible. |
| D14 | Plugins/gratuïtat | PostgreSQL només de desenvolupament; dependència beta exacta i reserva local explícites. Cache privada contrastada amb React real, 10/10 Node i 75/75 builds de mòduls, sense escriure dependències alienes. |
| D15 | Orquestració | Carrils, candidates i congelacions separats. Quatre escoles Node 0 entre rondes i lock respectat; Carbon R20 condicionat i cap consens unànime inventat. Tancament de recursos: cens de les 23:30:33 CET: cap procés propi resident, cap backend SQL de prova ni grup Vitest viu; serveis dels altres carrils i Node 0 preservats. |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Evidència detallada al kit del satèl·lit i al clon `.r20/evidencia`. Cada resultat correspon a una base i a una execució; els grups que se solapen no se sumen. Les comprovacions locals no equivalen a desplegament.

| Comprovació | Resultat i abast |
| --- | --- |
| PostgreSQL natiu final | 9 passades, 0 fallides i 0 omissions; PostgreSQL 18.6, dues connexions independents i cleanup del clúster privat. La captura REA prèvia observa dos PIDs diferents. |
| Crítica SQL dirigida | 27/27; camps, ACL, notes reals de fixture, límits de 64/65 capes, socket llarg i arrencada/`spawn` fallits. |
| Manifest de suite Node | Classificacions pendents corregides; política 9/9. La prova SQL no queda fora de les entrades primàries. |
| Bar/Lector/Nevera | Lot de 1.217 passades i 2 omissions heretades per originals humans absents; després OPML 99/99 i Bar 48/48 finals. Es preserven logs i abast de cada passada. |
| Set apps, global final | 238 fitxers: 5.062 passades, 0 fallides i 2 salts heretats; subconjunt de la global, no se suma al total. |
| Gestoria+Lector | 291 passades en el lot anterior a les ampliacions finals d’import; no se sumen al lot anterior. |
| Genealogia/Salut/CSV/Avisador | 159 passades; Avisador 6/6 i zero timers propis al tall provat. |
| IAIA | Lot principal 56/56; `XatSection` 140/140; components/integració 1.077/1.077 en 98 fitxers; producció amb E2EE apagat 3/3; logout 11/11. Grups solapats, sense suma total. |
| IDB/Web Locks en Chromium | Dues pestanyes, quota injectada com `DOMException`, rollback, tombstones, generació antiga invalidada i zero connexions/locks propis finals. |
| UI REA de l’oblit | Cancel·lar conserva; confirmar elimina una conversa i preserva l’altra. PNGs reals de 375×812, 768×1024 i 1440×1000. Fixture sense sessió Supabase. La captura de xarxa declarada incompleta no prova absència de peticions. |
| Cache privada i mòduls | 10/10 proves Node amb `createRequire` sobre React real, dues arrels, symlinks i exclusió de generats. 75/75 builds de mòduls reals al mateix snapshot amb cache corregida, sense modificar `modulDeBuild.test.jsx`. |
| Nevera, càrrega del receptari | Abans: 41 passades i 1 fallida. Després: 54/54 en dos fitxers. Replay del mòdul real amb 1.202 ms de retard: 42/42. Cap timeout augmentat. |
| Frontera/logo/data | 246/246 en deu fitxers; oracle de frontera intacte i revisió independent sense objeccions. Este lot inclou els quatre casos de mock de dates. |
| Altres mocks UIContext | Abans: 31 passades i 26 fallides. Després: 57/57 en set fitxers. AST de totes les crides `test`/`it`/`expect` iguals abans/després, sense canvis de timeouts. Revisió independent sense objeccions. |
| F4, catàleg i CSS | Logs de cada lot preservats. Es mantenen els quatre oracles equivalents de Claude en la base refrescada; el delta propi no els reemplaça per versions més febles. |
| Build web final | Exit 0; entrada de 224.226 B gzip-9 i arrencada completa de 456.943 B gzip-9. Només tres valors públics allowlist en l’entorn; cap `.env` copiat. |
| Secrets del dist | 18/18. |
| ESLint global final | Exit 0, 0 errors i 0 avisos. |
| RLS / ordre de migracions / Design Guard | Portes verificades; Design Guard: 3.799 fitxers, 0 crítics i 0 avisos. |
| Carbon R20 separat | Unió deduplicada de crítica: 33 fitxers i 463 proves úniques, 0 fallides i 0 omissions. Pont CAS: 12 assajos mecànics. Estos verds no tanquen el P1 de poble; mínim contrari i contraauditoria preservats, estat `NO_APLICAR`. |
| CAS v4 | 11/11 assajos sense fallades, incloent refús de deriva només de mode; aplicació, replay i rollback sobre la base física completa restauren els 7.932 fitxers i modes, amb Git net. Dry-run del kit final extern: preimatges acceptades i postimatges de MAIN ja aplicades, sense escriptura. Pin final de `SHA256SUMS`: `a7ff613a312108ae7922463ddd1c07b4a06d2d21d2f4e47733f6f5aadd54bdd1`. |
| Recursos finals | cens de les 23:30:33 CET: cap procés propi resident, cap backend SQL de prova ni grup Vitest viu; serveis dels altres carrils i Node 0 preservats |

| Passada global | Resultat brut i condicions |
| --- | --- |
| v1 · captura immutable inicial | 36.704 passades, 21 fallides, 119 omissions i 12 errors de càrrega. La captura sense Git propi (descobria el Git del pare), permisos 0444 i cache SSR externa introduïa artefactes. El registre brut es conserva; els replays no el convertixen retroactivament en exit 0. |
| v2 · base refrescada i entorn correcte | 37.156 passades, 44 fallides i 120 omissions; 0 errors d’inicialització i 0 deriva en 7.913 entrades. Les causes es reparen per lots abans de la passada següent. |
| v3 · MAIN final congelat | 37.201 passades, 0 fallides i 120 omissions: 37.321 proves en total. 2.180 fitxers: 2.171 passats i 9 totalment omesos; exit 0. 7.914 entrades sense deriva de contingut/modes; HEAD i índex intactes. Els 120 casos omesos són idèntics, un per un, als de v2; els 44 casos fallits de v2 ara passen i no s’ha retirat cap cas. |

Duració de Vitest: 992,16 s. SHA-256 agregat de les entrades: `8be29d9b0fa2c3a3bb27d250967f22fb7c48872aa9a49cdf66c9a77ce5c5f7fc`. La revisió independent recalcula els recomptes i l’agregat, i torna a llegir els bytes i modes de les 7.914 entrades; rebut `.r20/evidencia/global-v3-revisio-iaia.json`. L’únic cas nou respecte de v2 és la regressió de `PerfilShell` que distingix `content` de les propietats d’alineació.

La global v3 conserva configuració per defecte, dependències pròpies, Git del clon i modes originals; els laboratoris i outputs enumerats queden exclosos. El seu resultat final és exit 0, sense fallades i amb 120 omissions heretades. La prova global, el build, les portes i el CAS són evidències separades: cap d’elles substituïx les altres.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- El viu té HEAD `c07f78b83` en el tall de captura. BASE `b2bcc009…` és una composició sintètica del clon. Codex no acredita commit R18+R19, integració R20, push ni desplegament al viu.
- La candidata 2149 no s’ha aplicat remotament. 2005 consta aplicada segons l’encàrrec del Mestre, sense nova verificació REST d’este carril. L’objecció de privadesa sobre la política pública i els escriptors antics continua oberta.
- SQL usa infraestructura Auth i claims sintètics. No acredita JWT signat, TOTP, GoTrue, PostgREST ni tota la RLS del catàleg remot. Els binaris natius s’han executat en macOS arm64; altres plataformes no queden provades.
- El motor de reserva és una dependència beta exacta de desenvolupament, amb binaris de mida considerable; no entra al paquet web. La instal·lació requerix el lockfile i un motor operatiu. No s’amaga la fallada amb un skip.
- Quota IDB injectada sobre APIs natives, no disc físicament ple. Una transacció de Gestoria ja activa pot acabar; es bloqueja el treball nou o ajornat després del tancament.
- Si IDB i totes les preferències persistents estan bloquejades alhora, no es pot confirmar una purga durable. Es declara pendent; el bloqueig en memòria no sobreviu per si sol a una recàrrega.
- Tombstones individuals fins al logout i generació de persona fins a netejar les dades del lloc. No s’ha provat esgotament per milions d’UUIDs. No s’esborren missatges de servidor amb esta funcionalitat.
- UI provada en fixture sintètica amb components, CSS i IDB reals, sense ruta autenticada de Supabase ni dos dispositius físics. E2EE continua apagat per defecte. No es declara certificació WCAG ni 10/10 universal.
- Carbon R20 Rev 1 continua `NO_APLICAR`: el pont de contingut és mecànicament correcte, però conserva el P1 de canvi silenciós de poble. No s’inclouen deltes reservats ni executables del pont dins del manifest principal.
- No hi ha unanimitat acreditada Claude/Carbon/Node 0. Els models locals no certifiquen les execucions i la quantitat de respostes no resol una objecció reproduïble.
- El CAS usa reemplaçament atòmic per fitxer i rollback d’errors capturats; no és una transacció resistent a apagades. Lock cooperatiu i hashes d’integritat no acrediten autoria. Revertir el kit no desfà SQL aplicada expressament en una base real.
- Les guardes de symlink de la cache comproven l’estat en calcular-ne el camí; no s’afirma exclusió d’un canvi maliciós del sistema de fitxers entre eixe càlcul i l’escriptura de Vite.
- Resultat del cens final de recursos: cens de les 23:30:33 CET: cap procés propi resident, cap backend SQL de prova ni grup Vitest viu; serveis dels altres carrils i Node 0 preservats. El seguiment documental no altera els resultats bruts de les proves.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261111_2112_pla_implementacio_onada_r20_zero_deute_commit_unificat_i_fortificacio]]
- [[../90_arxiu_historic/261111_2112_prompt_codex_onada_r20_zero_deute_commit_unificat_i_fortificacio|261111_2112_prompt_codex_onada_r20_zero_deute_commit_unificat_i_fortificacio]]
- [[261111_2143_auditoria_claude]]
- [[261111_2132_auditoria_node0_assemblea_8_escoles_r20]]
- [[../90_arxiu_historic/261111_1822_auditoria_codex|261111_1822_auditoria_codex]]
- [[03_llibre_mestre_tasques_i_idees]]
