---
type: "document"
status: "canonic"
description: "Document d'arquitectura tècnica per a equips d'enginyeria externs, integradors (Sollutia) i auditories de seguretat i accessibilitat."
---
# Arquitectura Tècnica de Sóc de Poble

Aquest document descriu l'arquitectura d'execució, les fronteres de dades, el model d'integració amb sistemes amfitrions, els controls de seguretat i la cadena de verificació automatitzada del repositori `socdepoble.org`. Està adreçat a **equips d'enginyeria externs** (com l'equip tècnic de **Sollutia**), **auditories institucionals** i **revisors de plataformes de distribució**. Tota xifra o garantia ací documentada remet al mòdul executable que l'aplica.

## 1. Visió general del sistema i artefactes de distribució

Una única base de codi escrita en **React 19** i **ES Modules** sense dependències de marc d'estils extern compila quatre artefactes de distribució diferenciats:

### 1.1 Aplicació web principal (`socdepoble.org`)

Compilada amb `npm run build:web` (`vite.config.js`) cap a `dist/` i servida mitjançant **Firebase Hosting** (`firebase.json`) amb reescriptura de ruta única (SPA), capçaleres estrictes de seguretat HTTP, recursos estàtics de descoberta federada (`/.well-known/nodeinfo`, `/.well-known/host-meta`, `/ap/`) i paquets verificats de dades obertes municipals (`/opendata/`).

### 1.2 Component web integrable `<soc-de-poble>` (WordPress, Sollutia i CMS externs)

Compilat amb `npm run build:wp` i `npm run build:wp:directori` (`vite.standalone.config.js`) cap a `wordpress-plugin/`. L'embolcall PHP (`wordpress-plugin/socdepoble-enxufe.php`, llicència `AGPL-3.0-or-later`) no conté lògica de negoci: traduïx atributs de configuració i munta l'aplicació dins d'un **Shadow DOM tancat** (`attachShadow({ mode: 'closed' })` a `src/PedraSecaEmbed.jsx`) per aïllar completament els estils i el DOM respecte de la web amfitriona.

Els pressupostos físics del paquet integrable estan protegits per trinquets automàtics:

- **Carregador inicial (`LIMIT_DEL_CARREGADOR`):** màxim **4.096 B** (`vite.standalone.config.js`).
- **Tros d'entrada (`SOSTRE_DEL_TROS_D_ENTRADA`):** màxim **1.690.000 B** (`src/apps/plataforma/pesDelNucli.test.js`).
- **Arrencada estàtica (`SOSTRE_DE_L_ARRENCADA_ESTATICA`):** màxim **1.660.000 B** per a la suma de l'entrada i tots els seus imports estàtics (`src/apps/plataforma/pesDelNucli.test.js` i `tests/standalone-build.test.mjs`).
- **Arxiu ZIP per al directori oficial de WordPress.org (`LIMIT_DIRECTORI`):** màxim **10 MiB** (`10.485.760 B`, `wordpress-plugin/eines/empaqueta.mjs`).

### 1.3 Aplicació mòbil nativa (iOS i Android)

Compilada amb `npm run build:natiu` (`vite.natiu.config.js`) cap a `dist-natiu/` i empaquetada amb **Capacitor** (`capacitor.config.json`, identificador `org.socdepoble.app`, projectes a `ios/` i `android/`). L'entrada nativa (`src/natiu/entrada.jsx`) aplica les polítiques d'autenticació nativa de cada plataforma sense exposar fluxos OAuth web prohibits en WebViews incrustats.

### 1.4 Node pilot comunitari (`socdepoble.cat` · Node 0)

Servidor auxiliar operat sobre maquinari local darrere de **Caddy** i **Cloudflare** (`tooling/node0/`). Servix una rèplica estàtica verificada, streaming parcial d'arxius multimèdia pesants (`HTTP 206 Partial Content` sota `/media/` amb inventari signat `Ed25519`) i síntesi de veu oberta (`/api/v1/node0/veu`), mentre el nucli de dades d'usuari continua centralitzat al backend principal de Sóc de Poble.

## 2. Separació de capes i port neutral de dades

Cap component visual (`src/components/`, `src/sections/`, `src/pages/` ni `src/apps/`) importa directament l'SDK de base de dades ni clients HTTP específics d'un proveïdor. Tota lectura o escriptura passa per **un únic port d'abstracció**.

### 2.1 Contracte executable (`src/data/contracte.js` i `src/data/backendPort.js`)

El mòdul `src/data/contracte.js` declara de forma explícita:

- **Operacions obligatòries del nucli (`CONTRACTE_NUCLI`):** **32 mètodes** indispensables perquè l'aplicació arrenque.
- **Capacitats opcionals (`CAPACITATS`):** **60 capacitats** agrupades per domini funcional, que sumen **174 mètodes totals** a `CONTRACTE_BACKEND`.
- **Atomicitat i segellat:** en iniciar l'aplicació, `backendPort.js` valida que l'adaptador actiu implemente les 32 operacions de nucli i que cada capacitat opcional declarada estiga implementada al 100 % (cap capacitat parcial s'admet), congelant l'adaptador en memòria amb `freezeImplementation`.

### 2.2 Adaptadors verificats i kit de conformitat

Els adaptadors del port es verifiquen contra la mateixa bateria agnòstica (`src/data/conformitat/kit.js`):

- **Adaptador Supabase (`src/data/supabase/index.js`):** adaptador de producció per defecte, suportant els modes d'execució `remote`, `seed` i `local` (`src/config/dataMode.js`).
- **Adaptador Local (`src/data/local/adaptadorLocal.js`):** implementació completa en memòria i navegador per a assajos deterministes sense xarxa (`src/data/local/adaptadorLocal.conformitat.test.js`).
- **Adaptador HTTP Node 0 (`src/data/node0/adaptadorNodeZeroHttp.js`):** passarel·la opcional controlada per bandera de compilació (`VITE_SDP_NODE0_HTTP=1`), desactivada per defecte en els scripts de producció.

### 2.3 Mòduls d'aplicació opcionals (`src/apps/`)

Les eines especialitzades (`bar`, `nevera`, `salut`, `gestoria`, `genealogia` i `lector`) es declaren amb manifest `sdp.app.v1` (`src/apps/plataforma/manifestApp.js`). Cadascuna s'aïlla en trossos diferits propis (amb **0 bytes** de codi d'aplicació ni de diccionaris en l'arrencada estàtica) i es pot excloure en temps de compilació amb la variable `VITE_SDP_APP_<ID>=0` sense alterar l'estabilitat del nucli. Les eines fiscals i sanitàries (`gestoria`, `bar`, `salut`) emmagatzemen les seues dades de treball al dispositiu de l'usuari i declaren explícitament a la interfície que estan en fase beta oberta i que no constituïxen sistemes fiscals homologats ni dispositius mèdics.

## 3. Model d'integració amb Sollutia i amfitrions externs (Model B)

La relació tècnica entre **Sóc de Poble** i un portal amfitrió com **Sollutia**, **WordPress** o **Joomla** es regeix pel **Model B** (`_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md`):

### 3.1 Responsabilitat de l'amfitrió i font única de veritat

L'amfitrió allotja l'element `<soc-de-poble>` dins de l'estructura web municipal o associativa. Les dades socials, les publicacions, els missatges i els permisos dels veïns viuen exclusivament al **servidor de Sóc de Poble (Supabase)**. El sistema amfitrió no injecta cap adaptador d'escriptura al port de backend ni altera l'esquema intern.

### 3.2 Adopció segura de sessió externa (`adoptaSessioExterna`)

Quan l'amfitrió transferix context d'autenticació a l'element incrustat, la validació aplica un criteri estricte **fail-closed**:

- Es comproven l'emissor (`iss`), les audiències autoritzades (`aud`) i la caducitat temporal segons la política d'execució (`src/config/runtimePolicy.js`).
- Les sessions injectades per un amfitrió viuen exclusivament en memòria de pestanya (`src/data/identitat.js`) i **mai s'escriuen com a token de refresc persistent** en l'emmagatzematge local del navegador.

### 3.3 Frontissa de lectura per a APIs d'amfitrió (`src/data/adaptadors/sollutia/`)

La lectura de recursos externs exposats per Sollutia passa obligatòriament per `creaFrontissa.js` i `recursos.js`:

- **Transport exclusivament `GET`:** la llista de mètodes d'escriptura permesos és buida (`ESCRIPTURES_PERMESES` buit) i cada petició s'emet amb `credentials: 'omit'` per impedir qualsevol filtració de galetes d'autenticació entre dominis.
- **Límits d'entrada i sanejament de sobre:** `MAXIM_BYTES_CATALEG` talla la lectura del flux a **3.145.728 B (3 MiB)** comptats sobre el stream real (no sobre `Content-Length`), i `validaSobre` / `capturaDto` rebutgen profunditats superiors a **32 nivells**, més de **10.000 nodes** o qualsevol clau de prototip (`__proto__`, `constructor`, `prototype`) o propietat amb *getter*.
- **DTO tancat i configuració per defecte:** la configuració versionada manté `apiOrigin: null` i `resources: {}`. Activar un nou recurs de Sollutia requereix una captura real versionada de la resposta HTTP, un traductor síncron que retorne un DTO pla congelat (`Object.freeze`) i la seua prova de conformitat.
- **Portes d'aïllament:** `tooling/gates/tractor-frontissa.mjs`, `tooling/gates/tractor-adaptadors.mjs` i `tooling/gates/tractor-enxufe.mjs` bloquegen qualsevol importació directa de traductors externs des de la capa visual.

## 4. Seguretat de dades, PostgreSQL RLS i resiliència al navegador

### 4.1 Row Level Security (RLS) i funcions `SECURITY DEFINER`

El backend PostgreSQL a `supabase/migrations/` protegeix cada fila mitjançant polítiques **Row Level Security** vinculades a l'identificador d'usuari autenticat (`auth.uid()`), al municipi (`tenant_id`) i al rol verificat dins de cada organització:

- La clau pública `VITE_SUPABASE_ANON_KEY` no atorga per si sola cap privilegi fora de les polítiques RLS; l'ús de claus `service_role` al client està prohibit i vigilat per escàners de secrets literals.
- Tota funció SQL declarada com a `SECURITY DEFINER` fixa obligatòriament un `search_path` buit explícit (`SET search_path = ''`) i qualifica completament els esquemes (`public.`, `private.`, `auth.`) per impedir atacs d'intercepció d'objectes.
- La porta estàtica `tooling/gates/tractor-rls.mjs` (`npm run porta:rls`) i la bateria sobre PostgreSQL real (`npm run test:sql`) verifiquen aquestes invariants abans d'integrar noves migracions, seguint l'ordre cronològic resolt per `npm run migracions:pla` (`supabase/ordre_desplegament.json`).

### 4.2 Arquitectura Online-First i emmagatzematge al navegador (`src/config/storage.js`)

Sóc de Poble opera sota una arquitectura **Online-First**: les dades comunitàries resideixen al servidor de Sóc de Poble, mentre que el navegador gestiona de forma explícita i acotada (`src/config/storage.js`) les preferències d'interfície (llengua, tema, contrast i Mode Sènior), les respostes personals d'assistència al calendari (`rsvp-esdeveniments-v1`), la cua d'operacions quan la connexió mòbil s'interromp temporalment en entorns rurals i les bases IndexedDB pròpies de cada eina personal.

## 5. Arquitectura d'estils Pedra Seca, internacionalització i accessibilitat AAA

### 5.1 Cascada CSS nativa per capes i fulls diferits

El sistema visual **Pedra Seca** utilitza CSS estàndard sense preprocessadors ni biblioteques d'utilitats externes, orquestrat des de `src/css/index.css`:

- **Ordre estricte de cascada:** `@layer reset, sdp, legacy, components, utilities;`.
- **Doble capa de tokens (`src/css/tokens.css`):** els components només consumeixen **tokens semàntics** (`--sdp-fons-targeta`, `--sdp-text-cos`, `--sdp-accio-control`, `--sdp-vora-control`), mai primitius de paleta directa; `tooling/gates/tractor-tokens.mjs` i `tractor-cromatic.mjs` ho fan complir mecànicament.
- **Adopció diferida d'estils (`src/config/fullDiferit.js`):** els estils de seccions específiques (`src/css/diferit-*.css`) s'injecten sota demanda via `adoptedStyleSheets` tant al `document` com al `ShadowRoot` de `<soc-de-poble>`, evitant inflar el paquet d'arrencada.

### 5.2 Cinc llengües sense penalització d'arrencada

La interfície suporta íntegrament **valencià (`ca`), castellà (`es`), anglés (`en`), basc (`eu`) i gallec (`gl`)** (`src/config/i18n.js`). Només l'idioma per defecte (`ca`) viatja en l'arrencada inicial; els diccionaris restants i els diccionaris modulars de cada eina o vista (`i18n*.js`) es carreguen com a trossos asíncrons independents.

### 5.3 Mode Sènior (`data-sdp-senior="true"`), contrast AAA i pantalles estretes

Per garantir l'ús quotidià per part de persones grans i usuaris amb baixa visió en dispositius mòbils:

- Els tres nivells de text semàntic (`títol`, `cos`, `suau`) mantenen un contrast mínim verificat **`>= 7:1` (WCAG 2.2 AAA)** sobre les superfícies declarades (`src/css/tokens.contracte.test.js`).
- El **Mode Sènior / Lectura Gran** (`src/config/theme.js` + `src/css/diferit-mode-senior.css`), activable d'un sol toc al Perfil, al Panell de Control i a L'Avisador, aplica `data-sdp-senior="true"` a l'arrel de presentació (document o host del Web Component), elevant el contrast efectiu a **`>= 10:1` AAA** en tema clar i fosc, ampliant l'escala tipogràfica de **Noto Sans** i garantint dianes d'acció primària de **`>= 56 × 56 px`** (`>= 48 × 48 px` en mode estàndard).
- Totes les vistes públiques i la documentació de la Wiki (`P0-128`, lectura 100 % vertical sense taules amples de tres o més columnes) es verifiquen sense desbordament horitzontal des d'amplàries de **320 px** i **359 px**.

## 6. Verificació contínua i reproducció per a auditors externs

Qualsevol equip tècnic extern pot verificar l'estat complet del repositori en local amb Node `^22.20.0 || ^24.12.0 || >=25.0.0` i `npm ci`:

- **Portes estructurals i d'arquitectura (`61` portes):** `npm run porta -- --nomes-portes` i `npm run lint` (`--max-warnings=0`).
- **Coherència de requisits i vocabulari:** `npm run porta:psicopatia`, `npm run porta:frontissa`, `npm run porta:adaptadors` i `npm run porta:enxufe`.
- **Bateries de proves unitàries i d'integració:** `npm run test:ci` (suites Node de `tooling/tests/node-suite-manifest.json` més el conjunt complet de Vitest).
- **Verificació física del connector WordPress i sostres de pes:** `npm run build:web`, `node tooling/gates/pressupost-paquet.mjs` i `node --test tests/standalone-build.test.mjs`.

## Vincles

- [[00_index]]
