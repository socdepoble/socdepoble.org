---
type: informe
status: esborrany
description: Auditoria adversària de Gemini 4 Argon sobre listPublicOrganizations, deOrganitzacio, rànquing multicriteri i resiliència 403 al padró.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_241a9f50-0fae-45e4-b1ce-724b30668c6d:90bd8774-a331-420c-aade-28c40fc43a77
---
# Auditoria Adversària Gemini: Cercador Universal Desacoblat i Resilient

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_241a9f50-0fae-45e4-b1ce-724b30668c6d:90bd8774-a331-420c-aade-28c40fc43a77 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T20:09:11.222Z |
| Modificació | 2026-10-22T23:20:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Auditor Adversari) |
| Tokens consumits | ~54k (local) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-22T20:09:11.222Z: esborrany creat; contingut i verificació pendents.
2026-10-22T20:14:00.000Z: Relleu 1 (Preflight Adversari) completat per Gemini 4 Argon sobre el contracte del port (`SDP-LOCK`), deduplicació d'entitats (`UUID` vs `slug`), resiliència `403` / `SDP-XAT-003` al padró i rànquing multicriteri.
2026-10-22T20:44:00.000Z: Relleu 2 (Auditoria Adversària d'Implementació i Verificació Empírica) completat amb 0 defectes bloquejants en el codi JS, 590 assercions Vitest en verd i ESLint `--max-warnings=0` net.
2026-10-22T23:20:00.000Z: Relleu 3 (Contra-Dictamen Adversarial Extrem) emés per ordre del Mestre Javi Llinares després d'auditar el Relleu 4 i les Decisions D1–D4 de Claude Opus (`261022_2220_auditoria_claude.md`). S'accepten al 100% les 3 objeccions de Claude al bloc SQL del Relleu 2 (que queda retirat) i es destapen 4 mines letals a l'esquema PostgreSQL i Storage (`SDP-SEC-001`, 5 FKs compostes sense `ON UPDATE CASCADE` i rutes `sdp-media://mitjans/11111111-...`) que fan inviable una migració ingènua per l'Opció D1-B, demostrant la superioritat tècnica i quirúrgica de l'Opció D1-A.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Relleu 1 · Preflight Adversari (Directrius Crítiques per a la Implementació T1–T5)

Després d'inspeccionar `src/data/contracte.js`, `src/data/backendPort.js`, `src/data/conformitat/kit.js`, `src/data/supabase/conformitat.test.js`, `src/sections/search/indexCerca.js`, `src/sections/search/useCercaGlobal.js` i totes les bateries de proves de `src/sections/search/` i `src/sections/profile/`, s'emeten les següents **5 alertes adversàries d'obligat compliment** per a l'execució de T1–T5:

1. **`[CRÍTICA · T1 · CAPACITAT DEDICADA A CONTRACTE.JS PER NO TRENCAR EL NUCLI NI ELS MOCKS DE DIRECTORI]`**:
   - **Evidència**:
     - `src/data/contracte.test.js` (línies 98, 230, 255, 277, 335, 394) fixa explícitament `expect(CONTRACTE_NUCLI).toHaveLength(32)`. Afegir `listPublicOrganizations` a `CONTRACTE_NUCLI` trencaria el test del contracte i tots els mocks de `nucli()` del repositori.
     - Al seu torn, `src/sections/profile/PerfilPublicSection.gauntlet.test.jsx:64` i `src/sections/profile/PerfilPublicSection.xarxa.test.jsx:60` injecten `setBackendImplementation({ ...impl, loadPerfilPublic })`. Si `listPublicOrganizations` s'afegira dins de `CAPACITATS.directori` (`['loadPerfilPublic', 'listPublicOrganizations']`), el validador d'`asseguraMetode` / `validaBackendImplementation` llançaria `Error: [backendPort] Capacitat parcial: directori (impl: loadPerfilPublic; falta: listPublicOrganizations)`.
   - **Prescripció Arquitectònica (seguint el patró de `mitjansPropis` a `contracte.js:230`)**:
     - Declarar en `src/data/contracte.js` una capacitat opcional pròpia i congelada:
       ```js
       directoriOrganitzacions: Object.freeze([
         'listPublicOrganizations'
       ]),
       ```
     - Exposar `export const listPublicOrganizations = asseguraMetode('listPublicOrganizations');` a `src/data/backendPort.js`.
     - Implementar `listPublicOrganizations(filtre, config)` a `src/data/supabase/organizations.js` (i reexportar-la a `src/data/supabase/index.js`), delegant a `localPerfils.listPublicOrganizations(filtre)` en modes `seed`/`local` i consultant `/rest/v1/organization_directory?select=*&order=name.asc` en mode `remote` (amb suport d'`AbortSignal` via `config?.signal`).
     - Nota de conformitat: `src/data/supabase/conformitat.test.js:313` **ja té registrat** el mock `'/rest/v1/organization_directory': () => resposta([])`! Afegir el cas corresponent a `src/data/conformitat/kit.js` amb `capacitat: 'directoriOrganitzacions'` farà que tant la passada `seed` com la passada `remote` de conformitat certifiquen el mètode amb 0 omissions.

2. **`[CRÍTICA · T2/T3 · DEDUPLICACIÓ D'ENTITATS (UUID vs SLUG) I PROTECCIÓ DE L'ENCÀRREC C]`**:
   - **Evidència**:
     - Quan l'usuari administra una entitat, `IdentitatContext` i `deIdentitat` (`indexCerca.js:411-435`) construeixen l'entrada amb `id = net(identitat.id)` (que en remot és el `UUID` de l'organització) i `clau = 'entitats:<UUID>'`.
     - Els tests de seguretat (`indexCerca.test.js:258`, `indexCerca.fundacionals.test.js:304, 353`, `SearchSection.test.jsx:524-526`) prohibixen que `deIdentitat` use `identitat.slug` sense verificació del servidor per a rutes fundacionals (`Encàrrec C`). Per tant, **no s'ha de mutar el comportament de `deIdentitat` per als casos aïllats**.
   - **Prescripció per a `deOrganitzacio(org, opcions)` i `fusiona`**:
     - `deOrganitzacio(org, opcions)` rep files de la vista pública verificada `organization_directory` (`{ id, slug, name, kind, headline, bio, avatar_url, town_id, town_name, website_url, created_at, updated_at }`).
     - Si `deOrganitzacio` assigna `id = net(org?.id || org?.slug)` (de manera que `clau` siga `'entitats:<UUID>'` quan ve de Supabase) i calcula l'enllaç públic pel `slug` públic verificat (`const identificadorRuta = net(org?.slug || org?.id); const href = rutaDeLaFitxa(tipusRuta, identificadorRuta, opcions);`, on `tipusRuta` és `'grup'` si `org?.kind === 'group'` o `'entitat'` altrament), llavors:
       1. Per a «La Figuera» (`id: '<uuid>', slug: 'lafiguera', name: 'La Figuera', town_name: 'La Torre de les Maçanes'`), `deOrganitzacio` genera `clau: 'entitats:<uuid>'`, `titol: 'La Figuera'`, `meta: ['La Torre de les Maçanes']`, `href: '/empresa/lafiguera'`.
       2. Si l'usuari a més gestiona «La Figuera» (`deIdentitat` amb `clau: 'entitats:<uuid>'` i `href: '/empresa/<uuid>'`), totes dues entrades comparteixen la mateixa `clau` (`'entitats:<uuid>'`) i `fusionaPerClau` (`indexCerca.js:649`) les fusiona en una sola fitxa!
       3. En `fusiona(primera, altra)` (`indexCerca.js:619`), si `primera` és una entitat amb ruta per `id` UUID (`primera.href === rutaDePerfil('entitat', primera.id)`) i `altra.href` aporta una ruta amb `slug` públic del directori (`/empresa/lafiguera`), preferir `altra.href` garantix que l'administrador també navegue a `/empresa/lafiguera` mantenint `propia: 'entitat'` («La gestiones tu»).
       4. A més, en `useCercaGlobal.js`, quan arriben les files remotes de `listPublicOrganizations`, cridar `registraEntitatDelProjecte({ tipus: 'entitat', id: org.id, slug: org.slug })` per a les organitzacions rebudes permet que l'entitat pilot (`slug: 'socdepoble'`) quede reconeguda automàticament i es deduplique amb el catàleg (`core.agents`).

3. **`[ALTA · T3 · RESILIÈNCIA 403 / SDP-XAT-003 (MODE FORASTER) I CONTRACTE DE SEARCHSECTION.TEST.JSX]`**:
   - **Evidència**:
     - En `src/data/supabase/xat.js:112`, quan la RPC `membres_del_poble` respon amb `42501` (`SDP-XAT-003`), l'adaptador llança un `Error` amb `code: 'SDP-XAT-003'` (o `status: 403` / `code: 'SENSE_PERMIS'`) i el missatge `'Estàs en Mode Foraster: el xat és per a la gent d’este poble...'`.
     - Actualment, `useCercaGlobal.js:125-128` captura qualsevol excepció de `cercaMembres` i posa `padro.status = 'error'`, cosa que mostra el bàner d'alerta «No s'ha pogut buscar en el padró del poble» a qualsevol usuari autenticat que visite un poble on no està empadronat.
     - **Atenció al test existent**: `src/sections/search/SearchSection.test.jsx:261-278` (`test('si el padró rebutja amb SDP-XAT-003 es pinta una Alerta i la resta de resultats continua')`) usava precisament el text `"SDP-XAT-003: no eres membre d'aquest poble"` per provar el bàner d'error i el botó «Torna-ho a provar».
   - **Prescripció**:
     - En `useCercaGlobal.js`, detectar si l'error de `cercaMembres` és un bloqueig de permís de foraster (`err?.code === 'SDP-XAT-003' || err?.code === 'SENSE_PERMIS' || err?.status === 403 || /SDP-XAT-003|Mode Foraster/i.test(String(err?.message ?? ''))`). En eixe cas, resoldre silenciosament amb `status: 'ready', membres: BUIT, error: null` (degradació suau per a forasters), deixant `status: 'error'` només per a errors reals de xarxa o del servidor.
     - En `src/sections/search/SearchSection.test.jsx:261-278`, actualitzar l'error simulat del test de reintent a una fallada de xarxa real (p. ex. `"Error de xarxa en carregar el padró"`) i afegir un test explícit que verifique que `SDP-XAT-003` (Mode Foraster) **no** mostra l'alerta destructiva i manté visibles la resta de resultats.

4. **`[MITJANA · T2 · NORMALITZACIÓ VALENCIANA I RÀNQUING MULTICRITERI SENSE REGRESSIONS]`**:
   - **Evidència**:
     - `plega(valor)` (`indexCerca.js:54-56`) elimina `PUNT_VOLAT` (`/[·•∙⋅]/g`) i delega en `normalizeSearchText` (`contentHelpers.js`), que fa `NFD` + eliminació de diacrítics (`[\u0300-\u006f]`). Si es reforça `plega()` per assegurar dígrafs o apòstrofs tipogràfics, cal mantindre intactes les invariants de `partsRessaltades` (`indexCerca.js:516-556`), que depén que cada caràcter alfanumèric de `plega( Font )` es corresponga posicionalment amb l'original (per tant, no expandir 1 caràcter a 2 dins de `plega` sense ajustar `mapaDePosicions`, ja que `partsRessaltades('Pepa Güell', ['guell'])` a `indexCerca.test.js:281` ho verifica!).
     - En `puntua(entrada, consultaPlegada, llistaFitxes, opcions)` (`indexCerca.js:469-478`), es pot enriquir la puntuació amb un escalat més fi (Coincidència exacta de títol > Prefix de títol > Títol conté totes les fitxes > Coincidència en `meta` / lema / subtítol > Cos) i un **bonus de proximitat pel poble actiu** quan `opcions?.pobleActiu` coincidisca amb el poble de l'entrada (`meta`), preservant l'ordre d'`indexCerca.test.js:39-54` (`['igual', 'prefix', 'cos']` i desempat per data descendent i títol alfabètic).

5. **`[VERIFICADA · T4/T5 · ALINEACIÓ DE TENANT I CONTRACTE SQL D'ORGANIZATION_DIRECTORY]`**:
   - `.env.local` i `.env.production.local` ja apunten a `VITE_TENANT_ID=edd2f840-f4af-414a-821c-ebb8b8b2a80a` (`La Torre de les Maçanes`).
   - La vista `public.organization_directory` al Supabase remot ja ha sigut actualitzada pel Mestre amb `LEFT JOIN public.towns t ON t.id = o.town_id` exposant `town_name` i permisos `SELECT` per a `anon, authenticated` (registrat a l'Acta `261022_2215`). Cal reflectir la definició canònica a la migració SQL del repositori (`supabase/migrations/`) perquè l'esquema versionat quede 100% sincronitzat amb producció.

### Relleu 2 · Auditoria d'Implementació, Seguretat i Proves (`torn_9d450882` auditat per `torn_241a9f50`)

S'ha auditat línia per línia la implementació de Claude Opus (`torn_9d450882`) sobre els 16 fitxers de codi i proves modificats/creats. **Veredicte: APROVAT AMB EXCEL·LÈNCIA ARQUITECTÒNICA (0 defectes bloquejants, 0 regressions).**

1. **`[CONFORME · T1 · PORT NEUTRAL I CAPACITAT DEDICADA 'directoriEntitats']`**:
   - En `src/data/contracte.js` i `src/data/backendPort.js`, s'ha declarat la capacitat opcional `directoriEntitats: Object.freeze(['listPublicOrganizations'])` i `LIMIT_DIRECTORI_ENTITATS = 500`, preservant intactes tant els 32 mètodes de `CONTRACTE_NUCLI` com la capacitat `directori` (`['loadPerfilPublic']`).
   - En `src/data/supabase/organizations.js` (reexportat a `src/data/supabase/index.js`), `listPublicOrganizations(filtre, config)` consulta `/rest/v1/organization_directory` amb les **15 columnes explícites de la migració `2610081401`** (`id,tenant_id,slug,name,kind,parent_organization_id,lema,description,logo_url,hero_url,presentacio_html,copyright,town_name,created_at,updated_at`), sense `select=*` i sense filtre de `tenant_id` (permetent trobar entitats públiques de qualsevol poble i ponderar-les en client).
   - **Seguretat PostgREST verificada**: `filtreDeCercaDirectori(consulta)` aplica `normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}'’-]+/gu, ' ')`, limita a 5 paraules de 40 caràcters i codifica amb `encodeURIComponent` l'expressió `and=(or(name.ilike."*...*",...))`. Cap coma, cometa, parèntesi ni operador reservat pot escapar cap a l'arbre de sintaxi de PostgREST (verificat a `src/data/supabase/organizations.directori.test.js`).
   - **Degradació resilient d'esquema**: Si un servidor antic no disposa d'una columna opcional (p. ex. `town_name` o `copyright`), `columnaAbsentDelSelect(error)` la retira de `columnesDirectoriAbsents` i reintenta transparentment, mantenint protegides les columnes fixes (`id`, `name`, `slug`, `description`).
   - En `src/data/localPerfils.js`, `listPublicOrganizations` retorna còpies immutables amb exactament les mateixes 15 columnes de la vista (`tenant_id: null`), filtrant estrictament `visibility === 'public'`.

2. **`[CONFORME · T2 · ADAPTADOR 'deOrganitzacio', LOGOS OPACS, PLEGAT VALENCIÀ I RÀNQUING IDF]`**:
   - **Protecció Cross-Tenant d'Enllaços (`clauDeRutaDOrganitzacio`)**: En `src/sections/search/indexCerca.js:501-507`, `deOrganitzacio(org, opcions)` enllaça a `/empresa/<slug>` quan `org.tenant_id` coincideix amb `opcions.tenantActiu` (o és `null` en `seed`/`local`), i cau a `/empresa/<id>` si la fila pertany a un altre tenant o el slug no complix `RE_SLUG_DE_RUTA`. Com que `loadPerfilPublic` en remot resol els slugs dins del `tenant_id` actiu (`unique(tenant_id, slug)`), aquesta regla evita al 100% que una entitat d'un altre tenant obri «Perfil no trobat».
   - **Deduplicació Canònica (`UUID` vs `slug`)**: `deOrganitzacio` genera `clau: 'entitats:<id>'`, fusionant-se en `fusionaPerClau` amb `deIdentitat` (`entitats:<id>`) i `deMembre` (`entitats:<id>`). En `fusiona(primera, altra)`, `hrefDeLaFusio(primera, altra)` substitueix la ruta genèrica per `id` (`/empresa/<UUID>`) per la ruta de `slug` (`/empresa/lafiguera`) quan provenen del mateix tenant, conservant `propia: 'entitat'` («La gestiones tu») i l'acció «Escriu-li» del padró.
   - **Resolució Segura d'Avatars Opacs (`sdp-media://mitjans/…`)**: `avatarDeLEntrada` extreu `ref = fotoDelBucketPublic(avatar.src)` exclusivament per al cubell públic `mitjans` (rebutjant `mitjans_privats` i traversal `..`), mentre que `ResultatAmbCara` (`SearchSection.jsx`) i `propsDeTargetaDeResultat` (`targetaDeResultat.js`) el resolen pel port amb `useResolvedAsset`. Mai arriba un esquema `sdp-media:` cru a un atribut `<img src>`.
   - **Plegat Valencià i Ressaltat (`plega` / `mapaPlegat`)**: Suport complet per a totes les variants de la ela geminada (`l·l`, `ŀ` / `Ŀ` via `NFKD`, i punt baix de teclat `l.l` via `PUNT_BAIX_DE_GEMINADA` només entre dues eles), lligadures (`ﬁ`) i caràcters llatins (`œ, æ, ß, ø, ł, đ, ı`), mantenint l'alineació posicional exacta a `partsRessaltades`.
   - **Rànquing Multicriteri amb IDF i Desempat per Poble Actiu (`puntua` / `pesosDeLesFitxes` / `compara`)**: Escalat en 6 graons (`PES_FRASE_IGUAL = 10` > `paraulaTitol = 6` > `prefixTitol = 4` > `dinsDelTitol = 2` > `lema = 1.5` > `cos = 0.5`) ponderats per la IDF de cada paraula a l'índex ($[0.5, 1]$), amb `pobleActiu` com a **primera clau de desempat** a `compara` (evitant qualsevol inversió de graó en consultes multiparaula de baixa IDF, tal com va blindar Claude al Gauntlet #1).

3. **`[CONFORME · T3 · ORQUESTRACIÓ A 'useCercaGlobal.js', MODE FORASTER I TIMEOUT DE 10 S]`**:
   - **Font `directori` desacoblada i memoritzada**: S'executa sense dependre de la sessió ni del xat, amb caché de 5 minuts (`MS_MEMORIA_DIRECTORI`) per `ambitDades`, cerca de desbordament al servidor (`volDirectoriServidor`) si es supera `LIMIT_DIRECTORI_ENTITATS` (500) i cancel·lació neta amb `AbortController` en desmuntar.
   - **Resiliència `403` / `SDP-XAT-003` (`esPadroTancat`)**: Reconeix pels codis estructurats (`SDP-XAT-001`, `SDP-XAT-003`, `SENSE_PERMIS`, `status: 403`, `cause.code: '42501'`) que el padró és tancat per a un foraster i resol en estat `ready` buit sense mostrar cap alerta d'error, mentre que un error real de xarxa continua mostrant l'alerta amb «Torna-ho a provar».
   - **Protecció contra bloqueig etern (`useTerminiVencut`)**: Tota font que romanga en `loading` més de `MS_TERMINI_FONT` (`10000` ms) passa a estat d'avís amb el missatge traduït als 5 idiomes (`section.search.errorTermini`), netejant el `setTimeout` en el cleanup.

4. **`[RETIRAT PER AUDITORIA ADVERSÀRIA — VEGEU RELLEU 3 · T4/T5 · CONSOLIDACIÓ DEL TENANT PARTIT AL SUPABASE REMOT]`**:
   - L'esborrany SQL que figurava en aquest punt al Relleu 2 ha sigut **retirat i invalidat** arran del Relleu 4 de Claude Opus (`261022_2220_auditoria_claude.md`). Vegeu a continuació el **Relleu 3 (Contra-Dictamen Adversarial Extrem)** amb l'anàlisi forense de les 3 objeccions de Claude i les 4 mines d'esquema/Storage descobertes per a la decisió del Mestre.

### Relleu 3 · Contra-Dictamen Adversarial Extrem sobre el Relleu 4 i les Decisions D1–D4 de Claude Opus

Per ordre directa del Mestre Javi Llinares, s'ha sotmés a auditoria adversària extrema tant el Relleu 4 de Claude Opus (`_wiki_de_poble/04_escriptori/261022_2220_auditoria_claude.md`, seccions «Relleu 4 · 22:58», «3. Decisions del Mestre» i «4. SQL per al Mestre») com la totalitat de migracions SQL (`supabase/migrations/`) i l'adaptador de Storage (`src/data/supabase/storage.js`).

#### A. Veredicte sobre les 3 Objeccions de Claude Opus al nostre SQL del §4.4: ACCEPTACIÓ TOTAL (`3/3 Verificades`)

Claude Opus ha actuat com un fre de seguretat impecable. Les seues 3 objeccions contra el bloc SQL del nostre Relleu 2 són **100% certes, empíricament verificables en les migracions i d'impacte crític**:

1. **Objecció 1 (`public.tenant_memberships` no existix; és `public.town_memberships`) — `CONFIRMADA (100% Culpable)`**:
   - **Evidència**: En `supabase/migrations/2609080000_initial_schema.sql:23-29`, la taula canònica és `public.town_memberships (town_id uuid, user_id uuid, role text, created_at timestamptz, primary key (town_id, user_id))`, sense cap columna `status`. El nostre Relleu 2 va arrossegar el nom inexistent `tenant_memberships` del context previ sense contrastar el DDL físic. En estar envoltat per `BEGIN ... COMMIT`, PostgreSQL hauria avortat tota la transacció amb `ERROR: 42P01: relation "public.tenant_memberships" does not exist`.
2. **Objecció 2 (Derivar pertinença des de `profiles.town_name` obri una escalada de privilegis crítica) — `CONFIRMADA (100% Culpable — Forat de Seguretat)`**:
   - **Evidència**: En `supabase/migrations/2609110600_perfil_avatar_i_permisos.sql:17`, el rol `authenticated` té `GRANT UPDATE (full_name, headline, bio, town_name, avatar_url, updated_at) ON public.profiles`. Com que `private.is_town_member(p_tenant_id)` (`2609080000_initial_schema.sql:65-75`) és la clau que obri el padró privat (`membres_del_poble`), els fils de xat del poble (`xat_fils_meus`, `xat_directe`) i l'escriptura al Mur, inserir files a `town_memberships` basant-se en `WHERE p.town_name ILIKE '%Torre de les Maçanes%'` permetria que qualsevol foraster que s'haguera escrit eixe text al seu perfil obtinguera accés complet de veí. **Regla innegociable**: `profiles.town_name` és un camp declaratiu de perfil públic; mai no pot ser font d'autorització per a `town_memberships`.
3. **Objecció 3 (Moure només 2 taules de les 11 que tenen `tenant_id` / `town_id` trenca permisos i claus foranes) — `CONFIRMADA (100% Culpable)`**:
   - **Evidència**: `public.list_my_organizations(p_tenant_id)` (`2610081402_membres_organitzacio.sql:259-292`) fa `JOIN public.organization_memberships m ON m.tenant_id = o.tenant_id AND m.organization_id = o.id WHERE m.user_id = auth.uid() AND m.tenant_id = p_tenant_id`. A més, com demostrem tot seguit a la **Mina 2**, un `UPDATE public.organizations SET tenant_id = ...` aïllat ni tan sols arriba a executar-se si l'entitat té membres o reclamacions, perquè viola la clau forana composta `organization_memberships_tenant_id_organization_id_fkey`!

#### B. Contra-Auditoria Adversària Extrema a l'Opció D1-B de Claude Opus: 4 Mines Letals a l'Esquema i a Storage

En la secció «3. Decisions del Mestre (`D1`)», Claude Opus planteja dues opcions per resoldre el tenant partit entre `11111111-2222-3333-4444-555555555555` (`seed-town`, on viuen totes les dades històriques del projecte) i `edd2f840-f4af-414a-821c-ebb8b8b2a80a` (`La Torre de les Maçanes`, creat posteriorment):
- **Opció D1-A**: Tornar `VITE_TENANT_ID=11111111-2222-3333-4444-555555555555` i anomenar «La Torre de les Maçanes» la fila `11111111-…` de `towns`.
- **Opció D1-B**: Moure totes les files de `1111…` a `edd2f840-…` en les 11 taules amb `tenant_id` / `town_id`.

Una inspecció forense de `supabase/migrations/` i de `src/data/supabase/storage.js` demostra que **l'Opció D1-B conté 4 mines letals no advertides** que trencarien la base de dades i la biblioteca multimèdia si s'intentara una migració d'`UPDATE` sobre les 11 taules:

1. **`[MINA 1 · TRIGGER D'IMMUTABILITAT 'SDP-SEC-001' EN 'section_submissions']`**:
   - En `supabase/migrations/2609080000_initial_schema.sql:173-176` i `2609261500_identitat_perfil_f1.sql:282-285`, el trigger `trg_force_submission_author` executa en cada `BEFORE UPDATE`:
     ```sql
     if TG_OP = 'UPDATE' then
       if new.tenant_id != old.tenant_id then
         raise exception 'SDP-SEC-001: tenant_id is immutable';
       end if;
     ```
   - Qualsevol script d'Opció D1-B que intente fer `UPDATE public.section_submissions SET tenant_id = 'edd2f840-...'` **avortarà immediatament amb `SDP-SEC-001: tenant_id is immutable`** (fins i tot executat com a superusuari `postgres` al SQL Editor), tret que desactive explícitament els triggers d'usuari (`ALTER TABLE public.section_submissions DISABLE TRIGGER trg_force_submission_author`) abans de l'`UPDATE` i els reactive després.

2. **`[MINA 2 · ABRAÇADA MORTAL (DEADLOCK DE CONSTRAINTS) EN 5 CLAUS FORANES COMPOSTES SENSE 'ON UPDATE CASCADE']`**:
   - En l'esquema de PostgreSQL hi ha **5 claus foranes compostes** que inclouen `tenant_id` i que estan declarades amb el comportament per defecte `ON UPDATE NO ACTION` i `NOT DEFERRABLE`:
     1. `organizations (tenant_id, parent_organization_id) REFERENCES public.organizations (tenant_id, id) ON DELETE RESTRICT` (`2609080000_initial_schema.sql:88-89`)
     2. `organization_memberships (tenant_id, organization_id) REFERENCES public.organizations (tenant_id, id) ON DELETE CASCADE` (`2609080000_initial_schema.sql:108-109`)
     3. `organization_claims (tenant_id, organization_id) REFERENCES public.organizations (tenant_id, id) ON DELETE CASCADE` (`2609080000_initial_schema.sql:134-135`)
     4. `organization_member_organizations (tenant_id, organization_id) REFERENCES public.organizations (tenant_id, id) ON DELETE CASCADE` (`2610081402_membres_organitzacio.sql:80-81`)
     5. `organization_member_organizations (tenant_id, member_organization_id) REFERENCES public.organizations (tenant_id, id) ON DELETE CASCADE` (`2610081402_membres_organitzacio.sql:83-84`)
   - Com que cap d'elles té `ON UPDATE CASCADE` ni és `DEFERRABLE`:
     - Si intentes fer `UPDATE public.organizations SET tenant_id = 'edd2f840-...'` primer, PostgreSQL avorta amb `ERROR: 23503: update or delete on table "organizations" violates foreign key constraint "organization_memberships_tenant_id_organization_id_fkey"`.
     - Si intentes fer `UPDATE public.organization_memberships SET tenant_id = 'edd2f840-...'` primer, PostgreSQL avorta igualment amb `ERROR: 23503: insert or update on table "organization_memberships" violates foreign key constraint "organization_memberships_tenant_id_organization_id_fkey"` perquè la fila mare a `organizations` encara té `11111111-...`!
   - Per tant, l'Opció D1-B exigiria redefinir prèviament les 5 constraints amb `ON UPDATE CASCADE` (o `DEFERRABLE INITIALLY DEFERRED`).

3. **`[MINA 3 · TRENCAMENT DE LA BIBLIOTECA MULTIMÈDIA, PERMISOS D'ESBORRAT I STORAGE RLS ('sdp-media://mitjans/11111111-...')]`**:
   - Aquesta és la trampa més greu contra l'Opció D1-B i **no afecta només les 11 taules SQL, sinó `storage.objects` i el client JS**:
   - Totes les imatges pujades fins avui (incloent el logo i portada WebP de «La Figuera»: `sdp-media://mitjans/11111111-2222-3333-4444-555555555555/25218ea4-.../avatars/logo.webp`) estan emmagatzemades físicament als buckets `mitjans` i `mitjans_privats` sota el prefix de carpeta `<poble>/<uid>/<carpeta>/<fitxer>` amb `<poble> = 11111111-2222-3333-4444-555555555555`.
   - En `src/data/supabase/storage.js`:
     - `llistaElsMeusMitjans` (línies 459 i 568) llista exclusivament les rutes sota `${propietari.poble}/${propietari.uid}` on `propietari.poble = getResolvedConfig(config).tenantId`. Si el `VITE_TENANT_ID` es deixa en `edd2f840-f4af-414a-821c-ebb8b8b2a80a`, **tota la biblioteca de fotos pujades sota `11111111-...` desapareix de la pestanya «Multimèdia» del Perfil!**
     - `rutaEsborrable` / `esborraElMeuMitja` (línies 469-475) comprova `if (segPoble !== poble) return null;`. Si `poble` és `edd2f840-...`, **cap imatge existent amb prefix `11111111-...` es podrà esborrar mai més des del Perfil (`Mitja.esborrable = false`)!**
     - A més, al servidor (`supabase/migrations/2609200300_blindatge_storage_i_contingut.sql:10-16`), la funció de seguretat de Storage `private.es_ruta_mitjans_propia(p_name)` exigeix `private.is_town_member(((storage.foldername(p_name))[1])::uuid)`. Si un usuari no és membre del poble `11111111-2222-3333-4444-555555555555` a `public.town_memberships`, perd el permís RLS sobre els seus propis objectes sota el prefix `11111111-...`!

4. **`[MINA 4 · CONCLUSIÓ ARQUITECTÒNICA PER A LA DECISIÓ D1 DEL MESTRE: PER QUÈ L'OPCIÓ D1-A ÉS LA SOLUCIÓ CANÒNICA, SEGURA I IMMEDIATA]`**:
   - El diagnòstic forense de les Mines 1, 2 i 3 dissipa qualsevol dubte sobre **D1**:
     - El tenant `11111111-2222-3333-4444-555555555555` **ja conté** totes les organitzacions (`La Figuera`, `El Rentonar`, `Sóc de Poble`), totes les pertinences d'organització (`organization_memberships`), tot el contingut base (`app_content`), les publicacions del Mur (`section_submissions`), les notes (`notes`) i totes les rutes físiques de `storage.objects` (`sdp-media://mitjans/11111111-...`).
     - L'únic motiu pel qual es va crear la segona fila `edd2f840-f4af-414a-821c-ebb8b8b2a80a` a `public.towns` i s'hi van inserir les pertinences de `public.town_memberships` a la sessió de les 19:00 (`261022_1900_acta_marmota`) va ser perquè la fila `11111111-2222-3333-4444-555555555555` tenia `name = 'Seed Town'` i `slug = 'seed-town'`.
   - **Prescripció d'Execució per a l'Opció D1-A (Zero risc de FKs, zero triggers d'immutabilitat violats, 100% compatibilitat amb Storage i Padró)**:
     1. **En local (`.env.local` i `.env.production.local`)**: Tornar `VITE_TENANT_ID=11111111-2222-3333-4444-555555555555` (alineat amb `.env.example` i amb el fallback de `src/data/supabase/runtime.js`).
     2. **Al SQL Editor de Supabase (amb les comprovacions D2 i D3 de Claude incloses)**:
        ```sql
        BEGIN;

        -- 1. Alliberar el slug 'la-torre-de-les-macanes' si el té la fila secundària edd2f840-...
        UPDATE public.towns
        SET slug = 'la-torre-de-les-macanes-legacy',
            name = 'La Torre de les Maçanes ( duplicat inactiu )'
        WHERE id = 'edd2f840-f4af-414a-821c-ebb8b8b2a80a'
          AND slug = 'la-torre-de-les-macanes';

        -- 2.batejar el tenant històric 11111111-... com a 'La Torre de les Maçanes'
        UPDATE public.towns
        SET name = 'La Torre de les Maçanes',
            slug = 'la-torre-de-les-macanes'
        WHERE id = '11111111-2222-3333-4444-555555555555';

        -- 3. Assignar el nom del poble a les organitzacions del tenant 11111111-... (D3)
        UPDATE public.organizations
        SET town_name = 'La Torre de les Maçanes'
        WHERE tenant_id = '11111111-2222-3333-4444-555555555555'
          AND (town_name IS NULL OR btrim(town_name) = '');

        -- 4. Copiar EXCLUSIVAMENT els membres ja verificats de town_memberships (sense llegir profiles.town_name!)
        INSERT INTO public.town_memberships (town_id, user_id, role, created_at)
        SELECT '11111111-2222-3333-4444-555555555555', tm.user_id, tm.role, tm.created_at
        FROM public.town_memberships tm
        WHERE tm.town_id = 'edd2f840-f4af-414a-821c-ebb8b8b2a80a'
        ON CONFLICT (town_id, user_id) DO NOTHING;

        COMMIT;
        ```
     3. **Resultat immediat amb D1-A**:
        - **Cap clau forana composta ni trigger `SDP-SEC-001` es toca**.
        - **Totes les fotos WebP de `sdp-media://mitjans/11111111-...` continuen sent llistables i esborrables** a la pestanya «Multimèdia» del Perfil i autoritzades per `private.es_ruta_mitjans_propia`.
        - **El Padró (`membres_del_poble`) retorna Carmen, Damián i el Mestre Javi** sota el tenant `11111111-2222-3333-4444-555555555555` sense cap escalada de privilegis per `profiles.town_name`.
        - **`list_my_organizations` retorna les 3 entitats del Mestre** i «La Figuera» navega directament per slug a `/empresa/lafiguera` mostrant `'La Torre de les Maçanes'`.

#### C. Posició sobre les Decisions D2, D3 i D4 de Claude Opus

- **D2 (Alinear `organization_directory` remot amb `2610081401_organitzacions_fitxa_completa.sql`)**: **100% d'acord amb l'opció recomanada per Claude**. Executar el bloc de la migració `2610081401` al SQL Editor de Supabase garantix que `lema`, `hero_url`, `presentacio_html`, `copyright`, `parent_organization_id` i `town_name` estiguen exposats sense necessitat que el client reintente esborrant columnes absents.
- **D3 (Poblar `organizations.town_name = 'La Torre de les Maçanes'`)**: **100% d'acord** (ja integrat al pas 3 del bloc D1-A anterior).
- **D4 (`registraEntitatDelProjecte` per a organitzacions remotes a `useCercaGlobal.js`)**: **100% d'acord amb la decisió de Claude de NO cridar-la en remot**. L'anàlisi de Claude és impecable: en tindre l'entitat remota una clau `entitats:<UUID>` mentre que `core.agents` usa `entitats:socdepoble`, promoure les organitzacions remotes a fundacionals faria que `indexCerca` ocultara totes les entitats llevat de `socdepoble`! Mantindre el comportament actual és la decisió correcta.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves Unitàries, d'Integració i de Conformitat (`Vitest`)**:
  - `npx vitest run src/sections/search/ src/data/contracte.test.js src/data/contracte.directoriEntitats.test.js src/data/localPerfils.test.js src/data/localPerfils.directori.test.js src/data/supabase/organizations.test.js src/data/supabase/organizations.directori.test.js src/data/supabase/conformitat.test.js src/data/conformitat/kit.test.js src/data/supabase/index.test.js` → **16 fitxers passats (16/16), 399 proves en verd (399/399)**.
  - `npx vitest run src/data/qualitat.test.js src/data/conformitat/qualitat.test.js` → **2 fitxers passats (2/2), 4 proves en verd (4/4)**.
- **Qualitat Estàtica (`ESLint`)**:
  - `npx eslint src/data/contracte.js src/data/backendPort.js src/data/localPerfils.js src/data/supabase/organizations.js src/data/supabase/index.js src/sections/search/ src/data/contracte.directoriEntitats.test.js src/data/localPerfils.directori.test.js src/data/supabase/organizations.directori.test.js --max-warnings=0` → **0 errors, 0 avisos**.
- **Portes d'Arquitectura i Escriptori**:
  - `node tooling/gates/01_porta_pedra_seca_58px.mjs` → **✅ Superada**.
  - `node tooling/gates/tractor-enxufe.mjs` → **✅ E2 (Contracte del host sincronitzat amb el port), E3 i E4 superats; 0 infraccions E1 en els fitxers del lot**.
  - `node tooling/gates/porta-olivera.mjs --informe` → **✅ Escriptori indexat i ancorat**.
  - `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261022_2210_auditoria_gemini.md` → **`valid: true, errors: []`**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- La resolució definitiva del tenant partit al Supabase remot depén de la decisió humana **D1** del Mestre Javi Llinares (recomanant-se fermament l'**Opció D1-A** documentada al Relleu 3 per evitar les 4 mines de FKs compostes, triggers `SDP-SEC-001` i rutes físiques de Storage `sdp-media://mitjans/11111111-...`). Mentrestant, el Cercador Universal funciona en tots dos escenaris sense errors 403 visibles i resolent «La Figuera» tant per `UUID` com per `slug`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
