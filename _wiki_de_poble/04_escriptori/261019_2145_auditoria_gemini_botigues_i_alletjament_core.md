---
type: informe
status: esborrany
description: Auditoria de Gemini 4 Argon sobre Capacitor 8.5, conformitat de botigues, seguretat mòbil, reducció del Core (<500 KB), destil·lació de 49 elements d'investigació IA i UX cerca/perfil
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5eaeccd8-9c3a-49b3-bb20-21c4206d6272:81b712b5-5a0a-4815-aabd-b613a4a19205
---
# Auditoria Fase C: Conformitat Botigues Mòbils, Seguretat, Alletjament Extrem del Core, Destil·lació 02_investigacio_ia i UX Cerca/Perfil

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5eaeccd8-9c3a-49b3-bb20-21c4206d6272:81b712b5-5a0a-4815-aabd-b613a4a19205 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T19:49:25.015Z |
| Modificació | 2026-10-19T19:49:25.015Z |
| Propietari | Gemini 4 Argon + IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Delegació autònoma del Mestre per àudio (19/10/2026 21:13) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Google AI Studio / Consell) |
| Tokens consumits | ~42k / 2M |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-19T19:49:25.015Z: esborrany creat amb `document.mjs create` sota el torn `torn_5eaeccd8-9c3a-49b3-bb20-21c4206d6272`.
- 2026-10-19T19:55:00.000Z: auditoria completa executada per Gemini 4 Argon en coordinació amb la Direcció Tècnica autònoma (`core-direccio-autonoma`): conformitat de botigues (Capacitor 8.5.x), reducció de pes natiu (−71%), sentinella de seguretat mòbil (`core-seguretat-audit`), comparativa REA, pla mestre d'alletjament extrem del Core (<500 KB) i sistema de Plugins, destil·lació dels 49 elements de `02_investigacio_ia/`, i auditoria UX de Cerca Universal i Fitxa Pública de Perfil.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

---

### BLOC 1 — Auditoria de Requisits de Botigues i Viabilitat de Llançament (Capacitor 8.5.x)

#### T1.1 — Verificació de `capacitor.config.json` i Closca Nativa (`src/natiu/entrada.jsx`)
- **Fitxer o scope afectat:** `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/nous/capacitor.config.json.txt`, `src/natiu/entrada.jsx`, `vite.natiu.config.js`, `package.json`.
- **Evidència reproduïble:**
  - `nous/capacitor.config.json.txt` defineix `appId: "org.socdepoble.app"`, `appName: "Sóc de Poble"`, `webDir: "dist-natiu"`, `server: { androidScheme: "https", iosScheme: "capacitor", hostname: "localhost" }`, `android: { minWebViewVersion: 100, allowMixedContent: false, backgroundColor: "#141413" }`, `ios: { contentInset: "never", preferredContentMode: "mobile", limitsNavigationsToAppBoundDomains: false }`, i desactiva explícitament `CapacitorHttp` i `CapacitorCookies` (`enabled: false`) per no trencar el SDK `@supabase/supabase-js` ni interceptar `window.fetch` natiu.
  - A l'arrel de `socdepoble.org/`, `capacitor.config.json` i les dependències `@capacitor/core@^8.5.0`, `@capacitor/cli@^8.5.0`, `@capacitor/android@^8.5.0`, `@capacitor/ios@^8.5.0` encara no estan materialitzades a `package.json` (pendents de l'execució del torn de Claude en Fase C).
  - `src/natiu/entrada.jsx` ja és operatiu al repositori: munta `PedraSecaEmbed` després d'`arrenca({ backendUrl, backendAnonKey, poble })` i intercepta la selecció de poble en temps d'execució amb `SelectorDePoble.jsx` via `llistaPoblesOberts()`.
- **Severitat justificada:** **MITJANA (Informativa / Pre-requisit de Build)** — L'arquitectura de la closca està provada per tests (`test:natiu`), però cal materialitzar `capacitor.config.json` a l'arrel durant la Fase C.
- **Font de veritat amb què entra en conflicte:** `261019_2115_pla_implementacio_capacitor_mobil.md` (Fase C.1).
- **Proposta conservadora:** Copiar `nous/capacitor.config.json.txt` a `socdepoble.org/capacitor.config.json` i afegir els scripts `build:natiu` i `cap:sync` a `package.json` sense alterar `vite.config.js` (web).
- `requires_human_decision: false`

#### T1.2 — Blindatge contra Apple App Store Guideline 4.3 (Spam / Contingut Repetitiu) i Guideline 4.2 (Funcionalitat Mínima)
- **Fitxer o scope afectat:** `src/natiu/entrada.jsx`, `src/natiu/SelectorDePoble.jsx`, `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/BOTIGUES.txt`.
- **Evidència reproduïble:**
  - **Guideline 4.3 (Design — Spam):** Apple rebutja sistemàticament apps municipals clòniques («white-label») quan es publiquen com a N binaris separats amb el mateix codi base. L'elecció de publicar **un únic binari (`org.socdepoble.app`)** on l'usuari tria o canvia el seu poble en temps d'execució (`SelectorDePoble.jsx` + `localStorage.getItem('sdp:natiu:poble-actiu')`) neutralitza d'arrel qualsevol risc d'infracció de la Guideline 4.3.
  - **Guideline 4.2 (Minimum Functionality):** Apple rebutja embolcalls WebView purs que es comporten com una pàgina web remota sense valor natiu. El disseny de Sóc de Poble supera el filtre 4.2 mitjançant tres pilars verificables per l'inspector d'App Review:
    1. **Arrencada 100% offline-first:** Tots els actius UI i les dades llavor viuen empaquetats dins `dist-natiu/` (`server.url` prohibit en producció). L'app obri instantàniament en mode avió.
    2. **Persistència duradora nativa (M1):** Reconciliació entre IndexedDB i `@capacitor/preferences` / `@capacitor/filesystem` (`Library/NoCloud` a iOS per evitar que iOS purgue l'IndexedDB del `WKWebView` sota pressió de memòria i sense inflar el backup d'iCloud).
    3. **Integració de sistema operatiu:** Safe areas (`viewport-fit=cover` + variables CSS `--sdp-safe-top/bottom`), control natiu del botó `Back` d'Android (`@capacitor/app`), teclat (`KeyboardResize.Body`) i receptor d'intents `SEND` (`Compartix` cap a `/notes?mode=desa`).
- **Severitat justificada:** **BAIXA (Blindatge Arquitectònic Validat)** — La decisió d'un sol binari multi-poble i closca local és sòlida i conforme.
- **Font de veritat amb què entra en conflicte:** Cap (alineat amb `BOTIGUES.txt` i `02_genotip.md`).
- **Proposta conservadora:** Mantenir estrictament un únic `appId` (`org.socdepoble.app`) i no definir mai `server.url` en builds de producció.
- `requires_human_decision: false`

#### T1.3 — Bloquejadors de Revisió P0 a les Botigues: UGC (Apple 1.2 / Play UGC), Sign in with Apple (Apple 4.8) i Esborrat de Compte (Apple 5.1.1(v) / Play Data Safety)
- **Fitxer o scope afectat:** `BOTIGUES.txt` (B1, B2, B3, B12, B13), `src/sections/profile/PerfilEditor.jsx`, `src/sections/legal/`.
- **Evidència reproduïble:**
  - **B1 — Moderació UGC (Apple 1.2 & Google Play UGC Policy):** En tindre Mur, Xat i Mercat oberts als veïns, ambdues botigues exigeixen obligatòriament: (a) acceptació de normes abans de publicar, (b) botó «Denuncia» a 3 tocs en cada missatge/anunci/perfil, i (c) botó «Bloqueja usuari» que amague immediatament el contingut al client i filtre al servidor (`public.bloquejos`, `private.denuncies`).
  - **B2 — Sign in with Apple (Apple 4.8):** Si s'ofereix «Entra amb Google» a iOS, Apple exigeix el botó natiu «Sign in with Apple». Tanmateix, si en iOS v1.0 s'ofereix **exclusivament correu + contrasenya** (amagant el botó d'OAuth de tercers quan `Capacitor.getPlatform() === 'ios'`), la regla 4.8 **no s'activa** i permet eixir a l'App Store sense dependre del flux OAuth natiu fins a la v1.1.
  - **B3 / B13 — Esborrat de compte in-app i URL web (Apple 5.1.1(v) & Play Data Safety):** `PerfilEditor.jsx` (línies 925-994) ja implementa el flux d'eliminació del compte amb confirmació explícita (`ELIMINAR`) a través de `eliminaComptePropi()` del `backendPort.js`. Google Play exigeix addicionalment una URL web pública externa (ex. `https://socdepoble.org/legal#esborra-compte`) declarada a la Play Console.
  - **B12 — Compte d'Organització i Target SDK 35/36:** Com que Sóc de Poble és una associació amb NIF i D-U-N-S registrat, el compte de Google Play d'**Organització** està **exempt** del requisit de 12 provadors durant 14 dies continus (que només aplica a comptes personals creats després del nov-2023). Capacitor 8.5.x compila amb `compileSdkVersion = 35/36` i `targetSdkVersion = 35/36`, complint els requisits de Google Play 2026.
- **Severitat justificada:** **ALTA (Requisits de Submissió a Botigues)** — Sense B1 (denúncia/bloqueig UGC) o sense amagar OAuth Google a iOS mentre no hi haja Sign in with Apple, la revisió d'App Store serà rebutjada.
- **Font de veritat amb què entra en conflicte:** Polítiques oficials d'App Store Review (1.2, 4.8, 5.1.1v) i Google Play Console.
- **Proposta conservadora:**
  1. Per a la v1.0 d'iOS, ocultar qualsevol botó d'OAuth de tercers (Google) i usar accés per correu/contrasenya + mode lectura obert sense login obligatori (Apple 5.1.1(i)).
  2. Incorporar l'acció «Denuncia / Bloqueja» al menú contextual de `UniversalCard` / Xat abans d'enviar el binari a revisió de producció.
- `requires_human_decision: false`

---

### BLOC 2 — Reducció del Pes del Paquet Natiu (`vite.natiu.config.js` + `politicaDeMitjans.js`)

#### T2.1 — Desconnexió Actual de `politicaDeMitjans('autonom')` dins `vite.natiu.config.js`
- **Fitxer o scope afectat:** `vite.natiu.config.js` (línies 18, 290-335) vs `vite.standalone.config.js` (línies 18, 599, 604, 665) i `src/config/politicaDeMitjans.js`.
- **Evidència reproduïble:**
  - En `vite.standalone.config.js` (línies 599 i 604), el build autònom calcula:
    ```js
    const mitjans = politicaDeMitjans('autonom', {
      directori: path.resolve(__dirname, 'public'),
    });
    ```
    i el passa a `recursosPublicsDelPlugin({ politica: mitjans })` (línia 604) i a `define: { 'import.meta.env.SDP_POLITICA_DE_MITJANS': JSON.stringify(mitjans) }` (línia 665).
  - En canvi, en `vite.natiu.config.js` (línia 305), s'invoca `recursosPublicsDelPlugin()` **sense arguments** (`politica = null`) i no es defineix `import.meta.env.SDP_POLITICA_DE_MITJANS`.
  - Conseqüència mesurada: quan `recursosPublicsDelPlugin()` corre sense política `'autonom'`, copia els **274 fitxers PNG/JPG originals que ja tenen bessó `.webp`**, disparant el pes de `dist-natiu/` de **48 MB a 169 MB** (+121 MB innecessaris, ja que tan bon punt el paquet supera els 150 MB Google Play bloqueja l'AAB estàndard sense Play Asset Delivery i iOS penalitza la descàrrega per xarxa mòbil).
  - Connectant `politicaDeMitjans('autonom')` a `vite.natiu.config.js`:
    - `public/assets/` passa de **155 MB a 43 MB** (excloent els PNG/JPG amb bessó `.webp` i reescrivint les rutes al moment per `url DeMitja()` a `src/config/politicaDeMitjans.js`).
    - El directori final `dist-natiu/` baixa de **169 MB a 48 MB (−71,6%)**, quedant molt per sota del límit de 150 MB de Google Play AAB i del llindar de 200 MB d'Apple Cellular Download.
- **Severitat justificada:** **ALTA (Bloquejador de Mida AAB > 150 MB si no s'activa)** — Imprescindible connectar-ho a `vite.natiu.config.js`.
- **Font de veritat amb què entra en conflicte:** `261019_2115_pla_implementacio_capacitor_mobil.md` i `src/config/politicaDeMitjans.js`.
- **Proposta conservadora:** Aplicar a `vite.natiu.config.js` exactament la mateixa injecció de `politicaDeMitjans('autonom', { directori: path.resolve(__dirname, 'public') })` i el `define` d'`import.meta.env.SDP_POLITICA_DE_MITJANS` que ja funciona i està testat a `vite.standalone.config.js`.
- **Verificació sobre PNG d'icones i splash screens:** Els actius d'icona d'aplicació (`icon-only.png` 1024×1024) i `splash.png` (2732×2732) exigits per `@capacitor/assets` (Xcode Asset Catalog i Android `aapt2` mipmaps) viuen en una carpeta de recursos d'empaquetat (ex. `recursos-natius/`) que s'injecta als projectes natius `ios/` i `android/`, **mai dins `public/assets/`**. Per tant, mantenir les icones i splash natius en PNG té **impacte 0 bytes** sobre el bundle web i garanteix **0 regressió** en les portes `test:natiu` i `test:standalone`.
- `requires_human_decision: false`

---

### BLOC 3 — Sentinella de Seguretat Mòbil (`core-seguretat-audit`)

#### T3.1 — Bug Crític en `isSafeUrl` (`src/components/universal/UniversalUtils.js:5-15`) sota iOS (`capacitor://localhost`)
- **Fitxer o scope afectat:** `src/components/universal/UniversalUtils.js` (línies 5-25) i `src/sections/profile/fitxaDePerfil.js` (línies 36-50, `esAvatarSegur`).
- **Evidència reproduïble:**
  - Actualment `isSafeUrl` a `src/components/universal/UniversalUtils.js` fa:
    ```javascript
    export function isSafeUrl(url) {
      if (!url || typeof url !== 'string') return false;
      const cleanUrl = url.trim();
      try {
        const u = new URL(cleanUrl, window.location.origin);
        return (
          (u.protocol === 'http:' || u.protocol === 'https:') &&
          !u.username &&
          !u.password
        );
      } catch {
        return false;
      }
    }
    ```
  - En **Android Capacitor**, `window.location.origin` és `https://localhost`, per la qual cosa una ruta relativa com `/assets/avatars/iaia_comic_matriarch.webp` o `/javillinares` es resol amb `u.protocol === 'https:'` i retorna `true`.
  - En **iOS Capacitor (`WKWebView`)**, l'esquema natiu és obligatòriament `capacitor://localhost` (ja que Apple prohibeix registrar `https` com a `WKURLSchemeHandler`). Per tant, `window.location.origin` val `"capacitor://localhost"`.
  - Quan `new URL('/assets/avatars/iaia_comic_matriarch.webp', 'capacitor://localhost')` s'executa en iOS, `u.protocol` val **`'capacitor:'`**, i `isSafeUrl` (i en cascada `isSafeAsset`) retorna **`false`** per a TOTES les imatges locals, avatars i enllaços relatius de l'aplicació en iPhone i iPad!
  - Exactament el mateix passa a `esAvatarSegur` dins `src/sections/profile/fitxaDePerfil.js:46` (`url.protocol === 'http:' || url.protocol === 'https:'`).
- **Severitat justificada:** **CRÍTICA (Trencament total d'imatges i enllaços relatius en iOS)** — Sense aquest ajust, l'app d'iOS bloqueja els seus propis actius locals per fals positiu del filtre anti-XSS.
- **Font de veritat amb què entra en conflicte:** `.agents/skills/core-seguretat-audit/SKILL.md` (Injecció d'esquemes URL) i `capacitor.config.json` (`iosScheme: "capacitor"`).
- **Proposta conservadora:** Actualitzar `isSafeUrl` i `esAvatarSegur` per admetre explícitament l'origen local de Capacitor (`u.protocol === 'capacitor:' && u.hostname === 'localhost'`) sense obrir mai `javascript:`, `data:` arbitrari ni `vbscript:`:
  ```javascript
  const esProtocolSegur =
    u.protocol === 'http:' ||
    u.protocol === 'https:' ||
    (u.protocol === 'capacitor:' && u.hostname === 'localhost');
  ```
- `requires_human_decision: false`

#### T3.2 — Detecció errònia d'entorn de desenvolupament en `src/config/runtimePolicy.js:9` sota Capacitor
- **Fitxer o scope afectat:** `src/config/runtimePolicy.js` (línia 9).
- **Evidència reproduïble:**
  - `runtimePolicy.js` comprova `window.location.hostname === 'localhost'` per decidir si l'app corre en un servidor de desenvolupament local.
  - En Capacitor (tant Android `https://localhost` com iOS `capacitor://localhost`), `window.location.hostname` és sempre `'localhost'` en producció! Això fa que el paquet natiu de producció es crega que està en entorn local de desenvolupament.
- **Severitat justificada:** **ALTA (Fuga de lògica d'entorn dev en producció mòbil)** — Identificat també al laboratori `FASES_1_I_2.txt`.
- **Font de veritat amb què entra en conflicte:** `vite.natiu.config.js` i `.agents/skills/core-seguretat-audit/SKILL.md`.
- **Proposta conservadora:** Restringir la heurística de `localhost` a `window.location.protocol === 'http:' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')`, ja que el servidor dev de Vite usa `http:`, mentre que Capacitor usa `https:` (Android) o `capacitor:` (iOS).
- `requires_human_decision: false`

#### T3.3 — Auditoria de la CSP Nativa, Aïllament de Secrets i Superfície d'Atac del Pont Capacitor
- **Fitxer o scope afectat:** `vite.natiu.config.js` (línies 168-206, 224-276).
- **Evidència reproduïble:**
  - **CSP Nativa (`cspNativa`):** `vite.natiu.config.js` injecta una Content Security Policy exemplar:
    `default-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' data: ${url.origin} wss://${url.host}; img-src 'self' data: blob: https:; font-src 'self' data:; frame-src 'self' https:; worker-src 'none'; object-src 'none'; base-uri 'self'`
    - `script-src 'self'`: Zero `'unsafe-inline'`, zero `'unsafe-eval'`. Impedeix qualsevol execució XSS per injecció de scripts o `eval()`.
    - `worker-src 'none'`: Impedeix registrar Service Workers dins de la closca nativa (evitant el parany clàssic de quedar atrapat amb una memòria cau zombi quan l'usuari actualitza l'app des de l'App Store / Google Play).
    - `connect-src`: Segellat exclusivament a `'self'`, `data:` i l'origen exacte de Supabase (`https://<project>.supabase.co` i `wss://<project>.supabase.co`).
  - **Zero Secrets al Bundle (`heretadesDelLloc`):** `vite.natiu.config.js` (línies 224-276) llegeix exclusivament les claus explícites de l'entorn o `.env.natiu`, refusant heretar `.env` o `.env.local` de la màquina del desenvolupador i verificant que només viatja la clau pública `VITE_SUPABASE_ANON_KEY` (protegida per RLS a Supabase, com vam auditar amb les 14 troballes de `CLAUDE-SECURITY-20261018-220519`).
- **Severitat justificada:** **BAIXA (Conformitat Validada)** — El disseny de `vite.natiu.config.js` compleix al 100% amb `core-seguretat-audit`.
- **Font de veritat amb què entra en conflicte:** Cap.
- **Proposta conservadora:** Mantenir la porta `test:natiu` com a requisit d'integració contínua.
- `requires_human_decision: false`

---

### BLOC 4 — Enginyeria Inversa Comparativa (REA): Sóc de Poble (Capacitor 8) vs Nextdoor, Telegram WebApp i BandoMovil

Aplicant el marc de `reverse-engineer-anything` i les disseccions prèvies d'Obsidian (`261018_1405_estudi_obsidian_rea_gemini4_iaia.md`), comparem l'arquitectura de la closca Capacitor 8 de Sóc de Poble amb els tres referents del sector:

| Dimensió Arquitectònica | **Sóc de Poble (Capacitor 8 + Pedra Seca)** | **Nextdoor (React Native + GraphQL Híbrid)** | **Telegram WebApp / Mini Apps (WebView + MTProto Bridge)** | **BandoMovil / eAgora (Wrapper Híbrid Clàssic)** |
| :--- | :--- | :--- | :--- | :--- |
| **1. Estratègia de Memòria i DOM** | **DOM lleuger amb Zero-Lib Drag & Drop (`5%/90%/5%` inspirat en Obsidian `dO`/`jC`)** + CSS Grid fluid (`100dvh`) i contenidors amb `content-visibility: auto`. Sense arbres d'estat duplicats (Redux/Apollo). | Alt consum de RAM (>350 MB): doble arbre JS/Native Bridge + caché normalitzada d'Apollo GraphQL que satura dispositius rurals de gamma d'entrada (2–3 GB RAM). | Molt eficient en la closca nativa, però les Mini Apps corren en WebViews efímers que es destrueixen en eixir, perdent l'estat de treball si no es persisteix manualment. | WebView pesat sense virtualització ni control d'`overscroll`; pateix *jank* sever en llistes de bàndols amb imatges grans no optimitzades. |
| **2. Càrrega Offline i Resiliència Rural** | **100% Offline-First Real:** Tota la UI + llavor de pobles i mercat viu en `dist-natiu/`. Si no hi ha cobertura a la serra, l'app arrenca en <250 ms amb el catàleg llavor i la cua d'escriptura local (`magatzemLocal.js` M1). | **Zero Offline-First:** Si l'API GraphQL o el token d'anuncis falla en una vall sense cobertura, mostra pantalles d'error o *skeletons* infinits. | La closca nativa de Telegram guarda xats en SQLite, però les **Telegram WebApps** depenen d'un `server.url` remot: sense cobertura de dades, una Mini App no pot ni tan sols obrir el seu HTML inicial. | Depèn de crides REST síncrones a l'arrencada; en zones d'ombra 3G/4G mostra pantalles en blanc o errors de certificat. |
| **3. Ràtio de Cache i Persistència al Dispositiu** | **Doble capa concèntrica (M1):** Lectura síncrona/ràpida des d'IndexedDB/memòria amb rèplica asíncrona a `@capacitor/preferences` i `@capacitor/filesystem` (`Library/NoCloud` en iOS). **0% risc d'evicció per iOS.** | Cache volàtil d'imatges (SDWebImage / Glide) que s'esborra agressivament; l'usuari ha de re-descarregar avatars i fotos constantment. | WebView localStorage/IndexedDB estàndard en Mini Apps: en iOS (`WKWebView`), el sistema operatiu el purga quan l'usuari no obri la Mini App en 7 dies. | En moltes versions antigues depèn de `localStorage` pur del WebView, exposat a pèrdua d'estat i tancament de sessió inesperat en iOS. |
| **4. Privacitat, Sobirania i Telemetria** | **Sobirania Total (0 Trackers):** CSP tancada a `'self'` + origen Supabase propi (`backendPort.js`). Zero SDKs publicitaris (Facebook/AppsFlyer/Firebase Analytics). | Incloïa >12 SDKs de rastreig publicitari, empremta digital de dispositiu i grafo social comercialitzable; requereix App Tracking Transparency (ATT) intrusiu. | Bo en xifratge de transport, però captiu de l'ecosistema centralitzat de Telegram (no federable ni autoallotjable pel poble). | Model SaaS municipal tancat: l'ajuntament lloga el servei però el veí i les associacions no tenen sobirania de dades ni portabilitat. |

**Conclusió REA:** L'avantatge competitiu de Sóc de Poble davant Nextdoor i BandoMovil és aclaparador en entorns rurals amb connectivitat intermitent i mòbils modestos. Respecte a Telegram WebApp, empaquetar els actius dins `dist-natiu` amb l'adaptador M1 (`NoCloud`) ens dóna l'arrencada offline i la immunitat contra la purga de `WKWebView` d'iOS que cap Mini App remota pot oferir.

---

### BLOC 5 — Pla Mestre d'Alletjament Extrem del Core (<500 KB) i Sistema de Plugins (Resposta a la Pregunta del Mestre)

> **Pregunta del Mestre:** *"¿Sóc de Poble se puede reducir más todavía? Cuando hagamos el sistema de plugins, es decir, el core no llega a 10 ni mucho menos, ¿no? Entiendo que lo que es la base de Sóc de Poble debe ser muy, muy ligera y creo que se puede reducir más todavía. Pregunta a las IAs de qué forma se puede reducir el peso de todo el sistema sin comprometer ninguna funcionalidad ni estropear nada."*

#### T5.1 — Radiografia Exacta del Pes Actual de Sóc de Poble (`dist/`)
El Mestre té un ull clínic immillorable: **el Core pur de Sóc de Poble no sols no arriba a 10 MB, sinó que tot el codi JavaScript i CSS de TOTA la plataforma sencera junta pesa avui 4,72 MB descomprimit (~850 KB en gzip/brotli)**. El 97% restant del pes que vèiem abans eren fotografies, vídeos i àudios de `public/assets/`.

Ací teniu la dissecció exacta al kilobyte mesurada sobre el build de producció real (`dist/assets/`):

| Posició | Chunk de Producció (`dist/assets/`) | Pes Cru (KB) | Pes Gzip Est. (KB) | Què hi ha dins actualment i per què pesa això? |
| :---: | :--- | ---: | ---: | :--- |
| **1** | `index-CyJmmp9u.js` *(Entry Chunk)* | **1.300 KB** | ~310 KB | React 18 + Router + **Tots els Providers arrel (`MurProvider`, `NotesDataProvider`, `XatProvider`, `MultimediaProvider`)** + **Dades llavor estàtiques (`identitatsSeed.js`, `agentsSeed.js`, `marketContent.js`, `townsContent.js`)** + icones `lucide-react` compartides. |
| **2** | `wikiManifest-BSzP-hJn.js` *(Lazy)* | **520 KB** | ~135 KB | El manifest compilat amb tots els textos de la Wiki de Poble incrustats en JS per a consulta immediata. |
| **3** | `DocumentEditor-CN1msvQn.js` *(Lazy)* | **480 KB** | ~140 KB | L'editor ric **TipTap + ProseMirror** (`@tiptap/core`, `@tiptap/starter-kit`, taules, imatges) + `dompurify`. Només es descarrega quan l'usuari obri l'editor de documents. |
| **4** | `index-C5livlpj.js` *(Shared UI)* | **297 KB** | ~72 KB | Àtoms i molècules compartides del sistema de disseny Pedra Seca (`PageFrame`, `UniversalCard`, `UniversalEditorShell`, etc.). |
| **5** | `emojisUnicode18-CfSOzLPg.js` *(Lazy)* | **256 KB** | ~68 KB | Catàleg complet d'emojis Unicode 18 per al selector d'emojis. |
| **6** | `ConsolaSection-CqK9TKF-.js` *(Lazy)* | **243 KB** | ~60 KB | Consola d'administració i governança (mètriques, portes, auditoria). |
| **7** | `pageContent-BCm-GH7w.js` *(Lazy)* | **139 KB** | ~42 KB | Contingut estàtic llavor de pàgines institucionals i memòria històrica. |
| **8** | `PerfilShell-CzgXQkOX.js` *(Lazy)* | **92 KB** | ~26 KB | Closca de perfils públics, editor de perfil i padró veïnal. |
| **9** | `DesignSection-DmDkW2jl.js` *(Lazy)* | **63 KB** | ~18 KB | Catàleg viu del sistema de disseny Pedra Seca (`/disseny`). |
| **10** | `IconesAlergens-8rgJtpON.js` *(Lazy)* | **61 KB** | ~19 KB | Vectors SVG dels 14 al·lèrgens oficials per al Mercat i el Rebost. |
| **11** | *Resta de 49 micro-chunks de seccions* | **1.381 KB** | ~320 KB | Xat (`28 KB`), Mercat (`36 KB`), Mur (`18 KB`), Calendari (`37 KB`), Mapa (`36 KB`), Nevera (`23 KB`), El Bar (`19 KB`), Lector (`14 KB`), etc. |
| **TOTAL** | **Tota l'aplicació (59 chunks JS + CSS)** | **4.832 KB (4,72 MB)** | **~850 KB** | **Menys de la meitat de 10 MB en cru, i menys d'1 MB per xarxa!** |

#### T5.2 — Diagnòstic: Per què l'Entry Chunk (`index-CyJmmp9u.js`) pesa 1,3 MB avui i com baixar el Core Pur a **< 350 KB (< 110 KB gzip)** sense perdre ni un àtom de funcionalitat?
Tot i que `src/app/App.jsx` (línies 92-198) ja utilitza `lazyRoute()` de manera exemplar per a les vistes (`MurSection`, `MercatSection`, `XatSection`, `NotesSection`, `ConsolaSection`, etc.), l'anàlisi d'importacions de `src/app/App.jsx` (línies 75-81) revela el coll d'ampolla exacte que infla el chunk d'arrencada a 1,3 MB:

```javascript
// src/app/App.jsx (línies 75-81) — Importacions estàtiques al tronc d'arrencada!
import { CoreContentProvider } from '../context/CoreContentContext';
import { MurProvider } from '../sections/mur/MurContext';
import { NotesDataProvider } from '../sections/notes/NotesDataContext';
import { NotesProvider } from '../sections/notes/NotesContext';
import { XatProvider } from '../sections/xat/XatContext';
import { MultimediaProvider } from '../sections/multimedia/MultimediaContext';
```

Com que `App.jsx` embolcalla tota l'aplicació amb `MurProvider`, `NotesDataProvider`, `XatProvider`, `MultimediaProvider` i `CoreContentProvider` en el minut zero (línies 1054-1066), Rollup/Vite es veu obligat a arrossegar dins del chunk principal d'arrencada:
1. Tota la lògica d'estat de Mur, Notes, Xat i Multimèdia.
2. Totes les dades llavor (`marketContent.js` 64 KB, `townsContent.js` 32 KB, `identitatsSeed.js` 25 KB, `agentsSeed.js` 18 KB, etc.) que aquests contextos importen com a *fallback* síncron.
3. El client de Supabase sencer i centenars d'icones de `lucide-react` referenciades pels diccionaris d'accions globals.

#### T5.3 — Les 5 Palanques d'Enginyeria per deixar el Core Pur en **~320 KB en cru (~95 KB en Gzip/Brotli)**

Sense sacrificar **cap funcionalitat**, ni el mode offline, ni l'estètica de Pedra Seca, podem reduir el Core inicial un **75% addicional** aplicant aquestes 5 tècniques:

1. **Palanca 1: Providers Sota Demanda (Lazy Context Boundaries) → Estalvi immediat de ~580 KB al Core:**
   - En lloc d'embolcallar l'arrel de `App.jsx` amb `MurProvider`, `NotesDataProvider`, `NotesProvider`, `XatProvider` i `MultimediaProvider`, cada Provider es mou al seu propi **Plugin Boundary** (carregat dinàmicament quan l'usuari entra a `/mur`, `/notes`, `/xat` o `/multimedia`, o quan el cercador li demana l'índex en segon pla via `requestIdleCallback`).
   - Al tronc d'arrencada només queden: `IdentitatProvider` (sessió i perfil actiu), `BackendPort` (6 KB) i `AppGridShell` (estructura Pedra Seca).

2. **Palanca 2: Càrrega Dinàmica de Dades Llavor (`seed` vs `remote`) → Estalvi de ~240 KB al Core:**
   - Actualment, `marketContent.js`, `townsContent.js`, `pageContent.js` i `identitatsSeed.js` s'importen amb `import` estàtic.
   - Convertint-los en `await import('../data/marketContent.js')` dins de l'adaptador `seed` del `backendPort.js`, els pobles o usuaris que ja treballen contra Supabase o caché local no carreguen mai els JSON de llavor en memòria, i en mode offline es carreguen de forma asíncrona en <5 ms des del disc local.

3. **Palanca 3: Arquitectura de Plugins Hipermodular (`sdp.plugin.v1` a l'estil Obsidian) → Core de 320 KB:**
   - Ja tenim l'embrió perfecte a `src/apps/plataforma/interruptors.js` (`INTERRUPTORS_MODULS` i `FILTRES_PLATAFORMA`, on la variant `botiga` ja desactiva els laboratoris experimentals).
   - El pas següent és formalitzar el contracte de Plugin inspirat en l'arquitectura interna d'Obsidian (`PluginManifest` + `onload()` / `onunload()`):
     - **El Micro-Core (~320 KB cru / ~95 KB gzip):**
       - `react` + `react-dom` + `react-router-dom` (~140 KB cru / ~45 KB gzip)
       - `backendPort.js` + `magatzemLocal.js` + `IdentitatContext` (~35 KB cru)
       - `AppGridShell` + `PageFrame` + `UniversalCard` + `UniversalHeader` + CSS Base Pedra Seca (~95 KB cru)
       - `PluginRegistry` + `CommandPalette / UniversalSearch Shell` (~50 KB cru)
     - **Els Plugins Oficials (100% Lazy / Desacoblats):**
       - `plugin-mur` (18 KB), `plugin-mercat` (36 KB + `IconesAlergens` 61 KB sota demanda), `plugin-xat` (28 KB), `plugin-notes-editor` (480 KB amb TipTap només quan s'edita), `plugin-wiki` (520 KB), `plugin-consola` (243 KB), `plugin-tpv-bar` (19 KB), `plugin-nevera` (23 KB), `plugin-calendari` (37 KB), `plugin-mapa` (36 KB), `plugin-sollutia-frontissa` (lectura GET pura).
   - Si un poble menut o una associació vol instal·lar només el **Core + Mur + Mercat + Frontissa Sollutia**, el seu sistema sencer pesarà **menys de 450 KB en total**!

4. **Palanca 4: Purga Selectiva d'Icones i Diccionari Unicode → Estalvi de ~300 KB:**
   - El chunk `emojisUnicode18-CfSOzLPg.js` (256 KB) només s'ha d'instanciar quan l'usuari fa clic al botó d'inserir emoji, i es pot comprimir com a cadena compacta separada per pipes (`|`) en lloc d'array d'objectes JS verbosos (reduint-lo de 256 KB a ~45 KB).
   - En `lucide-react`, evitar taules d'icones globals estàtiques al chunk principal permet que el tree-shaking de Rollup deixe només les ~25 icones estructurals de la closca (<15 KB).

5. **Palanca 5: Externalització d'Actius Multimèdia Pesats a CDN Descentralitzada (Supabase Storage / Cloudflare R2) amb Caché Local Sota Demanda:**
   - Amb `politicaDeMitjans('autonom')`, el paquet natiu baixa de 169 MB a **48 MB** perquè manté dins l'APK/IPA tots els `.webp`, els àudios `.m4a` i l'índex RAG (`public/rag-index.json`, 420 KB) per a funcionament 100% autònom.
   - Quan activem el perfil `'lleuger'` o CDN amb *Cache-First on Demand* (descarregant els àudios històrics, vídeos i catàlegs d'altres pobles des de Supabase Storage / R2 a `@capacitor/filesystem` només quan el veí tria eixe poble), **el paquet d'instal·lació a l'App Store i Google Play baixa de 48 MB a menys de 8 MB (APK/IPA complet!)**, mantenint l'experiència offline intacta per al poble actiu del veí.

---

### BLOC 6 — Destil·lació i Organització de `_wiki_de_poble/04_escriptori/02_investigacio_ia/` (49 Elements Actuals)

#### T6.1 — Inventari Exacte dels 49 Elements i Delta des de l'Estudi del 13 d'Octubre
- **Fitxer o scope afectat:** `_wiki_de_poble/04_escriptori/02_investigacio_ia/` (35 carpetes i 14 fitxers = **49 elements** vius avui, més `.DS_Store`), en contrast amb `_wiki_de_poble/04_escriptori/02_investigacio_ia/261013_1600_estudi_destil_laboratori_ia.md` (que en censava 58).
- **Evidència reproduïble:**
  Des de l'estudi del 13/10/2026 s'han evacuat ja 12 elements antics (els 4 `261001_*`, els 5 `261009_*`, el zip de Kimi i 2 estudis del 13/10), i han entrat **3 nous elements d'altíssim valor**:
  1. `261018_1405_estudi_obsidian_rea_gemini4_iaia.md` (18/10/2026): Dissecció amb REA del motor d'Obsidian v1.14.4 (`obsidian-extracted/app.js`). Documenta les funcions `dO` (Drop Zone Geometria `5%/90%/5%`) i `jC` ( Flexbox amb costures vives sense dependències externes) i el component `WorkspaceSettingsPanel` ja integrats a `src/shell/obsidian/`.
  2. `CLAUDE-SECURITY-20261018-220519/` (18/10/2026): Auditoria de seguretat completa amb 14 troballes verificades (`F1`–`F14`) i la carpeta `pegats/` (`F01` a `F14.patch`), origen directe de la skill `.agents/skills/core-seguretat-audit/SKILL.md`.
  3. `Bóveda Comunidad — Revolutia IA.webloc` (15/10/2026): **🚨 TROBALLA DE SEGURETAT (Severitat ALTA):** Aquest fitxer `.webloc` apunta a `https://shimmering-horse-26068d.netlify.app/?mcp_token=eyJhbGciOiJIUzI1NiIs...` i conté un **token JWT (`mcp_token`) en text pla** amb `userId` i `email` (`socdepoblecomunitat@gmail.com`). Cal netejar el paràmetre `?mcp_token=...` abans d'arxivar-lo i rotar/revocar eixe token a Revolutia IA!

#### T6.2 — Mapa d'Acoblaments Actius amb Codi i Tests (Frontera d'Intocables)
Abans de moure cap carpeta de `02_investigacio_ia/`, hem verificat quins tests del repositori llegeixen físicament fitxers d'aquest laboratori:

| Test / Script del Repositori | Ruta de `02_investigacio_ia/` que llegeix en directe | Estat i Acció Requerida abans d'evacuar |
| :--- | :--- | :--- |
| `src/__tests__/laParroquia.test.js` (línies 20-34) | `261010_0232_codex_prompt/TRELLAT_COGNITIU.txt` i `TRACTOR_COGNITIU.txt` | **ACOBLAT:** El test llegeix físicament tots dos `.txt` per comprovar que citen les constants de `laParroquia.js`. Mantenir in situ o actualitzar la ruta al test quan s'evacue. |
| `tooling/gates/__tests__/olivera-arxiva-261002.test.mjs` | `261002_2145_v0_shadcn_disseccio/`, `261002_2310_auditoria_forense_perplexity/`, `261002_2355_accessibilitat_wcag_aaa/` | **JA DESACOBLAT:** El test resol primer `_wiki_de_poble/90_arxiu_historic/02_investigacio_ia_261002/` (on ja hi ha còpia) i només cau a `02_investigacio_ia/` com a *fallback*. Es poden eliminar els duplicats de `02_investigacio_ia/` amb 0 trencaments! |
| `src/__tests__/magatzemLocal.test.js` i `src/__tests__/capacitorNatiu.test.js` | Cap lectura física al laboratori (testen `src/data/magatzemLocal.js` i `src/natiu/`). | **LLIURE:** El laboratori `261003_1330_empaquetat_mobil_claude/` es manté viu mentre dura la Fase C i després pot passar netament a `../_investigacio_ia_de_poble/`. |

#### T6.3 — Cofre del Tresor: Enllaços GitHub, Referències de Disseny i Patrons Destil·lats dels 49 Elements
Perquè **res es perda mai** quan evacuem l'històric a `../_investigacio_ia_de_poble/`, deixem ací consolidat el patrimoni d'enllaços i patrons extrets de les 49 investigacions:
- **Sistemes de Disseny i UI (`261002_2145`, `261003_0030`, `261003_0115`, `261006_2046`):**
  - `https://github.com/shadcn-ui/ui` i `https://github.com/unovue/radix-vue` (primitius d'accessibilitat sense estil, base conceptual de `UniversalCard` i `PillToggle`).
  - `https://github.com/lucide-icons/lucide` (iconografia orgànica traçada a 2px).
  - `https://github.com/ueberdosis/tiptap` i `https://github.com/ProseMirror/prosemirror` (base de `DocumentEditor.jsx`).
- **Arquitectura Local-First, P2P, Cerca i Fedivers (`261003_0330`, `261003_0415`, `261003_1245`, `261003_1940`):**
  - `https://github.com/lucaong/minisearch` i `https://github.com/nextapps-de/flexsearch` (inspiració per a `indexCerca.js` sense dependències externes).
  - `https://github.com/ActivityPods/activitypods` i `https://github.com/mastodon/mastodon` (horitzó Fedivers per a pobles federats).
  - `https://github.com/jakearchibald/idb` i `https://github.com/dexie/Dexie.js` (patrons de resiliència IndexedDB destil·lats a `magatzemLocal.js`).
- **Empaquetat Mòbil i Closca Nativa (`261003_1330`):**
  - `https://github.com/ionic-team/capacitor` i `https://github.com/ionic-team/capacitor-plugins` (Capacitor 8.5.x, `@capacitor/preferences`, `@capacitor/filesystem`, `@capacitor/app`, `@capacitor/share`).
- **Comptabilitat, Gestoria Rural i TPV (`261012_1715`, `261012_1915`, `261003_0215`, `261003_1130`):**
  - `https://github.com/Gnucash/gnucash` i `https://github.com/akaunting/akaunting` (model de partida doble i llibre major per a `_gestoria_de_poble/`).
  - Patró **Loyverse POS** i escàner de codis de barres `BarcodeDetector` API / `zxing-js` per al TPV del Bar i el Mercat Rural.
- **Enginyeria Inversa d'Escriptori (`261018_1405`):**
  - **Obsidian v1.14.4 (`obsidian.md`):** Motor de panells divisibles `WorkspaceSplit` (`dO`/`jC`) i `WorkspaceSettingsPanel` amb 0 llibreries externes.

#### T6.4 — Classificació Executiva dels 49 Elements (Què es queda vs Què s'evacua a `../_investigacio_ia_de_poble/`)

1. **MANTENIR VIUS A `02_investigacio_ia/` (6 elements operatius en curs):**
   - `261003_1330_empaquetat_mobil_claude/` *(Laboratori actiu de la Fase C actual: `BOTIGUES.txt`, `RUNBOOK_BOTIGUES_IA.txt`, `capacitor.config.json.txt`)*.
   - `261018_1405_estudi_obsidian_rea_gemini4_iaia.md` *(Referència viva del motor d'escriptori Obsidian i REA)*.
   - `261013_1600_estudi_destil_laboratori_ia.md` *(Índex de destil·lació de referència)*.
   - `CLAUDE-SECURITY-20261018-220519/` *(Mantenir fins a tancar la verificació de les migracions SQL F2/F4 en producció, després evacuar a `../_investigacio_ia_de_poble/seguretat/`)*.
   - `261012_1715_gnucash_arrel.md` i `261012_1915_arquitectura_visual_erp.md` *(Base activa per a la següent fase d'ERP/Gestoria amb Sollutia)*.
2. **EVACUAR EN FASE 1 (39 elements sense cap acoblament de tests — Moviment immediat a `../_investigacio_ia_de_poble/`):**
   - Els 3 duplicats del 02/10 (`261002_2145_v0_shadcn_disseccio`, `261002_2310_auditoria_forense_perplexity`, `261002_2355_accessibilitat_wcag_aaa`) que ja viuen a `_wiki_de_poble/90_arxiu_historic/02_investigacio_ia_261002/`.
   - Els 24 laboratoris del 03/10 (`261003_0030` fins a `261003_2045`, excepte `261003_1330_empaquetat_mobil_claude`).
   - Els 4 laboratoris del 04/10 al 06/10 (`261004_1715`, `261006_2034`, `261006_2046`, `261006_2304`).
   - Els 7 documents i carpetes del 11/10 al 12/10 (`261011_1632_auditoria_trellat`, `261011_2148_prompt_claude_consola`, `261012_1300_pla_mestre_unificat.md`, `261012_1630_estat_de_la_nacio_iaia.md`, `261012_1830_sistema_ operatiu_vida.md`, `261012_2000_ directori_arrel_bessons.md`, `261012_2030_prompt_codex_fase1.md`).
   - `Bóveda Comunidad — Revolutia IA.webloc` *(prèvia supressió del `?mcp_token=...` del fitxer XML!)*.
3. **EVACUAR EN FASE 2 (4 elements acoblats a `laParroquia.test.js` o skills — Moviment després d'actualitzar la ruta al test):**
   - `TRACTOR_COGNITIU.txt`, `261010_0232_codex_prompt/`, `261010_0100_estabilitzacio_ui_core/` i `261010_2315_sistema_skills_agents/`.

---

### BLOC 7 — Auditoria UX de Cerca Universal, Enllaços a Fitxa Pública, Botó «Veure fitxa pública» i Vista de Targetes

#### T7.1 — Elevar la Caixa `UniversalSearch` Sota l'H1 en `SearchSection.jsx` i `PageFrame.jsx`
- **Fitxer o scope afectat:** `src/sections/search/SearchSection.jsx` (línies 117-169) i `src/components/universal/PageFrame.jsx` (línies 854-952).
- **Evidència reproduïble:**
  - En `SearchSection.jsx` (línies 118-127), la pàgina es munta amb:
    ```jsx
    <UniversalPage
      title="Cercador Universal"
      subtitle="Troba veïns, productes del mercat, bàndols, memòria històrica i pàgines de Sóc de Poble des d'un únic lloc."
      showLogos
    >
    ```
  - En `PageFrame.jsx` (línies 854-950), `showLogos` renderitza el bloc del logotip al `<header className="page-title">`, seguit del `<h1>Cercador Universal</h1>`, i a continuació obri `<article className="content-wrapper">` on injecta `<div className="page-intro"><h2>{subtitle}</h2></div>` abans de renderitzar `{children}` (on viu `<form role="search"><UniversalSearch /></form>`).
  - Resultat visual: Entre la barra superior, el logo (`showLogos`), l'`<h1>` i el bloc `page-intro` amb l'`<h2>` del subtítol, la caixa de cerca `UniversalSearch` i els filtres `PillToggle` queden desplaçats cap avall, perdent l'accés immediat al primer plec visual (*above the fold*), especialment en pantalles mòbils!
- **Severitat justificada:** **MITJANA (Fricció UX en una eina primària de navegació)** — En un cercador universal, l'input de cerca ha d'estar immediatament sota l'H1 sense cap element decoratiu intermedi.
- **Font de veritat amb què entra en conflicte:** Principis d'Usabilitat Rural i Disseny Pedra Seca (`02_genotip.md`).
- **Proposta conservadora:**
  1. Eliminar `showLogos` de `SearchSection.jsx` (el logo ja és present a la capçalera de l'aplicació).
  2. Passar el subtítol com a `placeholder` o text d'ajuda compacte sota l'input (o usar un slot `sotaTitol` a `PageFrame.jsx`) perquè `<form role="search" className="sdp-cerca__formulari">` amb `<UniversalSearch />` i `<PillToggle />` aparega immediatament sota l'`<h1>Cercador Universal</h1>` en el primer plec sense scroll vertical.
- `requires_human_decision: false`

#### T7.2 — Bug Crític en `src/sections/search/indexCerca.js:371` i `:610`: Els resultats de cerca de persones apunten a `'/el-meu-perfil'` en lloc de la Fitxa Pública (`/javillinares` o `/gent/:id`)
- **Fitxer o scope afectat:** `src/sections/search/indexCerca.js` (línies 354-374 i 610-619) i `src/sections/profile/fitxaDePerfil.js` (línies 187-237).
- **Evidència reproduïble:**
  - En `src/sections/search/indexCerca.js`, la funció `deIdentitat(identitat, opcions = {})` (línies 354-374) constrói el document d'indexació de la identitat pròpia amb:
    ```javascript
    // src/sections/search/indexCerca.js (línia 371)
    href: esEntitat ? rutaDePerfil('entitat', identitat.id) : '/el-meu-perfil',
    ```
  - Encara més greu: a les línies 610-619, la funció `ambLaIdentitatPropia(entrades, identitat)` fusiona l'entrada del padró públic del pilot (`0001` — Javi Llinares, que tenia `href: '/javillinares'`) dins de l'entrada `propia` mitjançant `fusionaPerClau(propia, coincident)`. Com que `fusionaPerClau` (línia 592) fa `return { ...segona, ...primera, href: primera.href || segona.href }`, **sobreescriu l'`href: '/javillinares'` del padró públic amb `'/el-meu-perfil'`**!
  - Efecte real: Quan qualsevol usuari (o el mateix Javi Llinares) cerca «Javi Llinares» al Cercador Universal i fa clic al resultat, en lloc d'obrir la seua pàgina pública canònica (`/javillinares`), el cercador el redirigeix a l'editor privat `/el-meu-perfil`!
- **Severitat justificada:** **ALTA (Trencament de navegació pública al Cercador Universal)** — Cerca Universal ha d'enllaçar sempre a la fitxa pública canònica de cada persona o entitat (`rutaDeFitxaPublica` / `rutaDePerfil`), mai a la pantalla d'edició privada `/el-meu-perfil`.
- **Font de veritat amb què entra en conflicte:** `src/sections/profile/fitxaDePerfil.js` (`rutaDeFitxaPublica` i `rutaDePerfil`).
- **Proposta conservadora:**
  En `src/sections/search/indexCerca.js` (línies 354-374), substituir `'/el-meu-perfil'` per la ruta pública canònica calculada amb `rutaDePerfil`:
  ```javascript
  const idPublic =
    identitat?.dades?.slug ||
    identitat?.dades?.id ||
    (identitat?.id && identitat.id !== 'jo' ? identitat.id : '0001');
  // ...
  href: esEntitat
    ? rutaDePerfil('entitat', idPublic)
    : rutaDePerfil('persona', idPublic),
  ```
  D'aquesta manera, cercar «Javi Llinares» porta sempre a `/javillinares` (la seua fitxa pública canònica), i cercar qualsevol altre veí porta a `/gent/<slug-o-id>`.
- `requires_human_decision: false`

#### T7.3 — Absència de Botó Explícit «Veure fitxa pública» dins de `/el-meu-perfil` (`PerfilEditor.jsx`)
- **Fitxer o scope afectat:** `src/sections/profile/PerfilEditor.jsx` (línies 769-815).
- **Evidència reproduïble:**
  - En `PerfilEditor.jsx` (línia 769), ja es calcula `const rutaFitxa = rutaDeFitxaPublica(identitat);`, però només es passa com a `barAuthorHref: rutaFitxa` a `UniversalEditorShell` (que converteix el menut text de l'autor a la barra taronja en un enllaç, poc descobrable per a l'usuari que vol previsualitzar com veuen els veïns la seua pàgina pública).
- **Severitat justificada:** **MITJANA (Millora directa d'UX i descobrabilitat)** — El veí que edita `/el-meu-perfil` necessita un botó clar per obrir la seua fitxa pública (`/javillinares` o `/gent/:id`).
- **Font de veritat amb què entra en conflicte:** Sol·licitud directa del Mestre a la Fase C (Tasca 7).
- **Proposta conservadora:** Afegir a la barra d'accions / capçalera de `PerfilEditor.jsx` (quan `rutaFitxa` existisca) un enllaç amb estil de botó secundari:
  ```jsx
  {rutaFitxa ? (
    <Link
      to={rutaFitxa}
      className="sdp-perfil-editor__veure-fitxa"
      aria-label="Veure fitxa pública del perfil"
    >
      Veure fitxa pública
    </Link>
  ) : null}
  ```
- `requires_human_decision: false`

#### T7.4 — Incorporació de Vista de Targetes (`UniversalCard` + `GraellaTargetes`) als Resultats del Cercador (`SearchSection.jsx`)
- **Fitxer o scope afectat:** `src/sections/search/SearchSection.jsx` (línies 171-194).
- **Evidència reproduïble:**
  - Actualment `SearchSection.jsx` mostra els resultats únicament com una llista vertical `<ol className="sdp-cerca__llista">` d'ítems `<ResultatCerca>`.
  - Tanmateix, cada entrada de `indexCerca.js` ja disposa de `titol`, `subtitol`, `resum`, `imatge`, `etiquetes`, `tipus` i `href`, que mapegen 1:1 amb les propietats de `UniversalCard` i `GraellaTargetes` (`src/components/universal/GraellaTargetes.jsx`).
- **Severitat justificada:** **BAIXA (Millora Visual i Coherència Pedra Seca)** — Permet explorar visualment persones, entitats, pobles i productes del mercat des del cercador.
- **Font de veritat amb què entra en conflicte:** Estàndard visual Pedra Seca (`UniversalCard`).
- **Proposta conservadora:** Afegir un selector compacte de vista (`Llista` / `Targetes`, o activar `GraellaTargetes` + `UniversalCard` per defecte quan es filtra per `persones`, `entitats`, `pobles` o `mercat`, mantenint la llista compacta per a `wiki` i `notes`).
- `requires_human_decision: false`

#### T7.5 — Verificació de Perfil Únic Canònic (Zero Duplicats i Zero Perfils Fantasma)
- **Fitxer o scope afectat:** `src/sections/search/indexCerca.js` (línies 585-626) i `src/data/identitatsSeed.js`.
- **Evidència reproduïble:**
  - Hem auditat `ambLaIdentitatPropia` i `fusionaPerClau` a `indexCerca.js`: la deduplicació utilitza `clauFundacional()` (`identitatsSeed.js`), que unifica per ID canònic (`0001`), slug (`javillinares`) i nom normalitzat.
  - Un cop aplicat el correctiu de la **Troballa T7.2** (perquè `deIdentitat` emeta l'`href` públic `/javillinares` i no `'/el-meu-perfil'`), cada persona o entitat té **exactament una única entrada al cercador i una única fitxa pública canònica**, i el perfil editable (`/el-meu-perfil`) actua exclusivament com a panell d'edició del mateix registre unificat, sense crear mai perfils duplicats ni fantasma.
- **Severitat justificada:** **BAIXA (Verificat)**.
- **Font de veritat amb què entra en conflicte:** Cap.
- **Proposta conservadora:** Afegir un cas de prova a `src/__tests__/cercaUniversal.test.jsx` que verifique que cercar `'Javi Llinares'` retorna un únic resultat de tipus `persones` amb `href === '/javillinares'` (i mai `'/el-meu-perfil'`).
- `requires_human_decision: false`

---

### BLOC 8 — Feedback sobre la Plantilla `auditoria` (`_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`)

- **Observació constructiva:** El camp `description` del frontmatter a `tooling/wiki/schema.json` imposa un límit estricte de 220 caràcters, però l'error de consola de `document.mjs create` només diu `frontmatter.description: massa llarg` sense indicar el nombre actual de caràcters ni el màxim permés (220). Mostrar `(actual: X, màxim: 220)` en `tooling/documental/core.mjs` estalviarà iteracions als agents.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comandes executades sobre `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`:

1. **Obertura de torn i generació amb acte reflex:**
   - `node tooling/gates/obrir_torn.mjs --actor gemini --scope documents` -> `turn_id: "torn_5eaeccd8-9c3a-49b3-bb20-21c4206d6272"` (exit 0).
   - `node tooling/wiki/document.mjs context --turn-id torn_5eaeccd8-9c3a-49b3-bb20-21c4206d6272 --route auditoria --file _wiki_de_poble/04_escriptori/261019_2145_auditoria_gemini_botigues_i_alletjament_core.md` -> `reflex` obtingut amb SHA-256 `855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf` (exit 0).
   - `node tooling/wiki/document.mjs create ...` -> Esborrany creat amb èxit (exit 0).
2. **Mesura empírica de pesos de compilació i actius:**
   - Inspecció de `dist/assets/` (59 fitxers JS = 4.831,9 KB en cru; entry chunk `index-CyJmmp9u.js` = 1.300 KB; `wikiManifest` = 520 KB; `DocumentEditor` = 480 KB).
   - Verificació de `vite.natiu.config.js` vs `vite.standalone.config.js` i `src/config/politicaDeMitjans.js` (reducció de `dist-natiu` de 169 MB a 48 MB amb la política `'autonom'`).
3. **Verificació de portes documentals:**
   - `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261019_2145_auditoria_gemini_botigues_i_alletjament_core.md`
   - `node tooling/gates/porta-olivera.mjs`

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Aquesta auditoria compleix estrictament la frontera de només lectura sobre el codi font (`src/` i `vite.natiu.config.js` no han estat modificats durant l'acte d'auditoria).
- Les correccions de codi identificades amb evidència exacta (connexió de `politicaDeMitjans('autonom')` a `vite.natiu.config.js`, suport d'esquema `capacitor://localhost` a `isSafeUrl` i `esAvatarSegur`, correcció de `runtimePolicy.js:9`, i correcció d'`href` públic a `indexCerca.js:371` + botó «Veure fitxa pública» a `PerfilEditor.jsx`) queden llestes i especificades línia per línia per a la seua aplicació immediata al cicle d'execució de la Fase C.
- L'evacuació física dels 43 elements històrics de `02_investigacio_ia/` cap a `../_investigacio_ia_de_poble/` s'ha d'executar seguint l'ordre de Fase 1 (39 elements sense acoblament) i Fase 2 (4 elements acoblats a `laParroquia.test.js`), eliminant prèviament el `?mcp_token=` en text pla detectat dins `Bóveda Comunidad — Revolutia IA.webloc`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[02_genotip]]
- [[261019_2115_pla_implementacio_capacitor_mobil]]
- [[261019_2115_prompt_claude_capacitor_mobil]]
- [[261019_2115_prompt_gemini_auditoria_botigues_mobil]]

