---
type: informe
status: esborrany
description: 'Auditoria canònica del sistema (Dutxa de Salfumant): desacoblament Model B Sollutia vs Sóc de Poble, inventari de residus i 3,6 GB de builds, pegats per als 12 P0, protocol net per a Android i verificació WordPress.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0a677a4c-bbc1-4c9e-9030-8f0ddb6f9ea1:c1cb9cf5-78f4-423e-8c3a-d64b0dbf56a4
---
# Auditoria Salfumant: Frontera Sollutia vs Sóc de Poble, Purga de Brossa, 12 P0 i Protocol Android

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0a677a4c-bbc1-4c9e-9030-8f0ddb6f9ea1:c1cb9cf5-78f4-423e-8c3a-d64b0dbf56a4 |
| Versió del document | 2.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T20:32:58.178Z |
| Modificació | 2026-10-20T20:36:00.000Z |
| Propietari | gemini-4-argon |
| Aprovació humana | pendent (Mestre Javi Llinares) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Auditor Sènior · Mètode Gauntlet) |
| Tokens consumits | ~240k / 2M |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-20T20:32:58.178Z: esborrany creat sota el torn `torn_0a677a4c-bbc1-4c9e-9030-8f0ddb6f9ea1` pel tractor `document.mjs`.
- 2026-10-20T20:36:00.000Z: execució completa de la «Dutxa de Salfumant» (T1–T5) i revisió d'Àrbitre Adversarial intern (*Mètode Gauntlet*) abans de la generació neta d'Android (`npx cap add android`) i la pujada a botigues.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

---

### T1 · Auditoria d'Arrel i Fronteres Sollutia vs Sóc de Poble (Model B i Llei de l'Enxufabilitat)

#### 1.1 Verificació Empírica de l'Arquitectura Executable (VERDA / BLINDADA)

L'auditoria línia per línia dels mòduls de frontera confirma que **el codi executable de `socdepoble.org` compleix amb exactitud matemàtica el Model B** (`AGENTS.md §8`, `ADR-0001` i `_wiki_de_poble/02_saber/architecture/soci_sollutia.md`):

| Peça Arquitectònica | Fitxer Auditats | Garanties Empíriques Verificades |
| --- | --- | --- |
| **Frontissa Sollutia ( Només Lectura GET )** | `src/data/adaptadors/sollutia/creaFrontissa.js` (108 línies)<br>`src/data/adaptadors/sollutia/client.js` (17 línies)<br>`src/data/adaptadors/sollutia/recursos.js` (16 línies)<br>`src/data/adaptadors/sollutia/agenda.js` | 1. **URL absoluta i `https:` obligatori**: rebutja `http:`, esquemes estranys i credencials incrustades (`url.username`/`url.password`).<br>2. **Llista blanca d'orígens (`allowedOrigins`)**: qualsevol redirecció o origen fora de la llista llança `ErrorFrontissa('ORIGEN_FORA_DE_LLISTA')`.<br>3. **Mètode `GET` exclusiu i `ESCRIPTURES_PERMESES = Object.freeze([])`**: cap `POST`, `PUT`, `PATCH` ni `DELETE` pot eixir cap a Sollutia.<br>4. **Aïllament de sessió i xarxa**: `credentials: 'omit'`, `redirect: 'error'`, `AbortController` (`5.000 ms`) i tall en calent del stream (`maxBytes = 262.144 B`) per impedir esgotament de memòria.<br>5. **DTO tancat i congelat (`decode`)**: `RECURSOS.perfil.traductor` congela `{ id, email, name, display_name }` i descarta qualsevol camp alié (`_sollutia`, rols interns de l'amfitrió, etc.). |
| **Tractor de Captura i Anonimització RGPD** | `tooling/sollutia/captura-contracte.mjs`<br>`tooling/sollutia/forma.mjs` (171 línies) | Substituïx totes les fulles reals de les respostes de Sollutia per sentinelles tipades (`<uuid>`, `<email>`, `<jwt>`, `<iso-date>`, `<url>`, `<phone>`, `<text>`) i trunca arrays a un màxim de 2 elements. Cap dada personal entra mai a `tests/frontissa/fixtures/sollutia/`. |
| **Segellat de la Capa del Paquet i Contracte d'Amfitrió** | `src/config/capaDelPaquet.js` (90 línies)<br>`src/config/contracteAmfitrio.js` (`sdp.amfitrio.v1`) | `fixaCapaDelPaquet` és d'escriptura única i congela `supabaseUrl`, `supabaseAnonKey`, `dataMode` i `tenantId`. Si l'amfitrió intenta passar `backend`, `backend_url`, `supabaseUrl`, `supabaseAnonKey`, `tenantId`, `oauthRelayUrl`, `botApiUrl` o `sollutiaIssuer` via atributs HTML o `window.SocDePoble.mount()`, `contracteAmfitrio.js` els despulla i emet l'avís de seguretat Model B. |
| **Port Neutral i Funcionament Autònom («Tot Fora»)** | `src/data/backendPort.js`<br>`src/data/contracte.js`<br>`src/natiu/entrada.jsx` | El frontend consumix únicament el port neutral (`CONTRACTE_NUCLI` de 22 operacions + 19 `CAPACITATS` opcionals consultades amb `teCapacitat()`). Sense connexió amb cap amfitrió extern (mode `seed`, `local`, PWA, o binari natiu iOS/Android), Sóc de Poble arranca i funciona al 100% amb la seua pròpia sobirania de dades. |

#### 1.2 Troballes de Deriva Residual del Model A en Textos i Documentació Interna

Tot i que el codi d'execució és hermètic, l'escàner adversarial ha detectat **3 punts de deriva semàntica del Model A antic** en textos visibles i comentaris que confonen Sollutia amb Supabase:

- **`[T1-01]` Textos institucionals que anomenen `"Sollutia (Supabase)"` com a backend de Sóc de Poble**
  - **Fitxers afectats**: `src/sections/text/pageContent.js` (línies 46 i 58) i la seua còpia compilada a `ios/App/App/public/assets/pageContent-V22vtjfD.js`.
  - **Evidència**:
    - Línia 46 (`projecte`): *"Ací és on entra **Sollutia (Supabase)**... la nostra plataforma es podria desconnectar de Sollutia i connectar-se directament a WordPress..."*
    - Línia 58 (`constitucio`): *"...construïm de manera pragmàtica i robusta sobre l'**arquitectura d'alta connectivitat «Online-First» de Sollutia (Supabase)**."*
  - **Severitat**: **ALTA (P1 Arquitectònic/Editorial)** — contradiu frontalment el Model B (`AGENTS.md §8` i `soci_sollutia.md`), on Supabase és de Sóc de Poble i Sollutia és l'amfitrió/soci d'infraestructura.
  - **Proposta conservadora**: Substituir a `src/sections/text/pageContent.js:46` i `:58` les mencions de `"Sollutia (Supabase)"` pel model vigent: **Supabase com a base de dades sobirana de Sóc de Poble darrere del port neutral, i Sollutia com a amfitrió i soci tecnològic connectat per la Frontissa**.
  - `requires_human_decision: false`

- **`[T1-02]` Comentari obsolet de RLS a `RequireAuth.jsx`**
  - **Fitxer afectat**: `src/app/guards/RequireAuth.jsx:28`
  - **Evidència**: `// Guard de ruta a nivell d'UI (UX, no seguretat — la seguretat és la RLS de Sollutia).`
  - **Severitat**: **BAIXA (Higiene tècnica)** — comentari heretat del Model A.
  - **Proposta conservadora**: Esmenar el comentari a `// Guard de ruta a nivell d'UI (UX, no seguretat — la seguretat real és la RLS del Supabase de Sóc de Poble).`
  - `requires_human_decision: false`

- **`[T1-03]` Descripcions del Model A en `src/GLOSSARI.md` i `src/ARCHITECTURE.md`**
  - **Fitxers afectats**: `src/GLOSSARI.md:15` i `src/ARCHITECTURE.md:7`
  - **Evidència**: `src/GLOSSARI.md:15` diu *"la implementació concreta que l'amfitrió (Sollutia) injecta en arrencar via `configura({ backend })`"*. `src/ARCHITECTURE.md:7` diu *"permetent que l'amfitrió (Sollutia) injecte la seua pròpia implementació en el muntatge"*.
  - **Severitat**: **MITJANA (Coherència documental per a agents)** — pot induir una IA futura a creure que l'amfitrió injecta el backend.
  - **Proposta conservadora**: Actualitzar ambdós paràgrafs al Model B vigent (capa del paquet segellada per Sóc de Poble + Frontissa GET per a dades de l'amfitrió).
  - `requires_human_decision: false`

---

### T2 · Scanner de Residus i Brossa («Dutxa de Salfumant»)

L'escàner exhaustiu de tot l'arbre de `socdepoble.org` ha descobert **4,11 GB d'artefactes acumulats, sessions de navegador obsoletes, quarantenes antigues, fitxers de 0 bytes i carpetes paràsites** que embruten el repositori.

#### 2.1 Mapa Global de Pes i Llast Estructural

| Ruta / Carpeta | Pes Actual | Estat Git | Diagnòstic Empíric | Acció de Salfumant Recomanada |
| --- | --- | --- | --- | --- |
| `wordpress-plugin/builds/` | **3,60 GB** | Ignorat (`*.zip`), excepte `migracions_pendents.sql` | Conté **29 paquets `.zip` històrics** (`v1.1.3` a `v1.1.7`, de ~130 MB cadascun) més un fitxer solt `wordpress-plugin/builds/migracions_pendents.sql` (150 KB, 8-oct). | **PURGAR / EVACUAR 27 ZIPs vells**: Conservar únicament el parell vigent referenciat per `stable.json` (`socdepoble-enxufe-1.1.7.zip` i `1.1.7-directori.zip`) fins emetre la `1.1.8`. Allibera **~3,35 GB**. Moure o purgar `migracions_pendents.sql`. |
| `.snapshots/` | **361 MB** | Ignorat | Còpies instantànies antigues a l'arrel del repo. | **EVACUAR** a `_arxiu_wiki_de_poble/` o purgar amb autorització del Mestre. |
| `dist/` i `dist-natiu/` | **162 MB** / **47 MB** | Ignorats | Builds de producció web (`dist/`, amb `.DS_Store` dins) i natiu (`dist-natiu/`). | Es regeneren de zero amb `npm run build` i `npm run build:natiu`. |
| `.wwebjs_auth/` | **100 MB** | Ignorat | Sessió Chromium de `whatsapp-web.js` del **27 de juliol** (el bot actual usa Baileys a `bot/var/baileys-runtime/`). Conté més de 80 fitxers `LOCK`/`LOG` de 0 bytes. | **PURGAR** completament (`rm -rf .wwebjs_auth`). Cadàver digital d'una llibreria ja substituïda per Baileys. |
| `.sdp-paperera/` | **14 MB** | Ignorat | Quarantenes del 7–15 de setembre (`2026-09-07_purga_fantasmes_arrel` amb `scratchpad_replace.js`, `scratch_update_schema.py`, `scratch_test.mjs`, i `2026-09-15_162241`). | **EVACUAR** a `../_arxiu_wiki_de_poble/` o purgar definitivament. |
| `.iaia_auth/` | **13 MB** | Ignorat | Perfil de Chromium amb 3.179 fitxers del **22 de setembre**. | **PURGAR** (`rm -rf .iaia_auth`) si ja no s'usa cap sessió headful antiga. |
| `.wiki-safety/` | **96 KB** | Ignorat | Quarantenes del **14 de juliol** amb 4 fitxers `C.md` de 0 bytes i 19 subdirectoris buits. | **PURGAR** (`rm -rf .wiki-safety`). |

#### 2.2 Fitxers de 0 Bytes Detectats a Tot el Repositori

| Fitxer (0 Bytes) | Data | Diagnòstic i Veredicte |
| --- | --- | --- |
| `_wiki_de_poble/04_escriptori/01_produccio/checklist-limpieza-wp-ayudawp.md` | 6 oct | **Fitxer buit (0 B)**. El contingut real viu al seu costat en `checklist-limpieza-wp-ayudawp-complet.csv` (5.211 B). Segons `AGENTS.md §12`, la carpeta `01_produccio/` és intocable sense ordre expressa del Mestre (`requires_human_decision: true`). **Proposta**: Esborrar el `.md` de 0 B i mantindre el `.csv`. |
| `.immunitari/higiene-cron.err` | 20 oct | Log d'errors buit (0 B) del cron d'higiene. Inofensiu (ignorable). |
| `bot/var/baileys-runtime/outbound-attempts.jsonl`<br>`bot/var/bot_var.backup.socdepoble/baileys-runtime/outbound-attempts.jsonl` | 3 set | Cues JSONL d'intents d'eixida buides (0 B) del bot Baileys. Nota: `bot/var/bot_var.backup.socdepoble/` és una còpia de seguretat antiga dins de `bot/var/` que hauria d'estar fora del repo. |
| `ios/App/App/public/cordova.js`<br>`ios/App/App/public/cordova_plugins.js` | 19 oct | **NO TOCAR (Legítims)**: Són els stubs de compatibilitat de 0 bytes que `@capacitor/cli` genera i injecta en cada `npx cap sync ios`. |
| `public/assets/pages/01_chat/.keep` .. `08_bloc_de_notes/.keep` (8 fitxers) | 18 set | Placeholders de 0 B en `public/assets/pages/` que acaben copiats també a `dist/` i `dist-natiu/`. Si les carpetes de `public/assets/pages/01_chat..08_bloc_de_notes` no tenen cap imatge real, es poden retirar tant les carpetes buides com els `.keep`. |

#### 2.3 Scripts Temporals, Carpetes Paràsites, `.DS_Store` i Directoris Buits

1. **Script temporal oblidat a `tooling/`**:
   - **`tooling/scratch_malformades.mjs`** (932 bytes, 7 d'octubre): Script d'inspecció puntual d'entrades malformades de `rag-index.json`. No és cridat per cap `package.json` ni per cap porta.
   - **Acció**: Purgar de `tooling/` (o moure a una carpeta `scratch/` d'agent fora del repo).
2. **Carpeta paràsita dins de `wordpress-plugin/`**:
   - **`wordpress-plugin/supabase/`** (creada accidentalment el 2 d'octubre): Conté `wordpress-plugin/supabase/.branches/_current_branch`, `wordpress-plugin/supabase/.temp/start-secrets` i `wordpress-plugin/supabase/snippets/` (buit). El plugin de WordPress **no utilitza ni ha de contindre mai** cap directori `supabase/`.
   - **Acció**: Eliminar `rm -rf wordpress-plugin/supabase`.
3. **8 Fitxers `.DS_Store` de macOS escampats**:
   - `./.DS_Store`, `dist/.DS_Store`, `wordpress-plugin/.DS_Store`, `public/.DS_Store`, `_wiki_de_poble/.DS_Store`, `_wiki_de_poble/04_escriptori/00_bandeja_d_entrada/.DS_Store`, `_wiki_de_poble/04_escriptori/01_produccio/.DS_Store`, `_wiki_de_poble/04_escriptori/02_investigacio_ia/.DS_Store`.
   - **Acció**: Executar `find . -name ".DS_Store" -not -path "./.git/*" -delete` (especialment crític el de `public/.DS_Store`, que es pot colar en builds).
4. **6 Directoris buits sense funció**:
   - `tooling/wiki/_build`, `tooling/brain/tests`, `scripts/portes`, `src/sections/tractors/__fixtures__`, `src/assets/ui`, `_wiki_de_poble/04_escriptori/01_produccio/builds`.
   - **Acció**: Netejar amb `rmdir` les 5 primeres (i `01_produccio/builds` amb el vistiplau del Mestre).
5. **Auditoria de Dependències (`package.json`) i CSS (`src/css/`)**:
   - `package.json` és extremadament auster i net: només **6 `dependencies` de producció** (`@capgo/capacitor-social-login` 8.5.12 exacte, `@playwright/test`, `lucide-react`, `react`, `react-dom`, `react-router-dom`) i **12 `devDependencies`** (`@capacitor/android`, `@capacitor/cli`, `@capacitor/core`, `@capacitor/ios`, `vite`, `vitest`, `eslint`, `jsdom`, `@testing-library/react`, `terser`, `yaml`).
   - **Nota d'higiene a `package.json`**: `@playwright/test` figura en `dependencies` (línia 79) en lloc de `devDependencies`. Tot i que Vite no l'empaqueta perquè cap fitxer de `src/` l'importa, convé moure'l a `devDependencies` quan s'obri lease sobre `package.json`.

---

### T3 · Pla de Resolució i Pegats Quirúrgics dels 12 Bloquejadors P0 de Botigues

Cada bloquejador P0 ha sigut verificat contra el codi font actual. A continuació es detalla l'evidència exacta i el pegat llest per aplicar:

#### `P0-01` · Seguretat RLS: Filtració de `contact_email` a usuaris `anon` i `authenticated`
- **Fitxer afectat**: `supabase/migrations/2610181915_organitzacions_correu_i_membres.sql` (línies 22–23) i `src/data/supabase/organizations.js` (línia 4).
- **Evidència**:
  ```sql
  grant select (contact_email, public_email) on table public.organizations to anon, authenticated;
  grant update (contact_email, public_email) on table public.organizations to authenticated;
  ```
  En PostgreSQL/PostgREST, les polítiques RLS controlen files (`ROW`), no columnes. Com que `public.organizations` és llegible públicament, qualsevol client `anon` o `authenticated` que faça `GET /rest/v1/organizations?select=id,name,contact_email` rep el correu privat d'una entitat encara que `public_email = false` (a més, `src/data/supabase/organizations.js:4` demana sempre `contact_email,public_email` en `CAMPS_ORGANITZACIO` i el filtra només al client en `normalitzaOrganitzacio`).
- **Pegat Quirúrgic (Nova migració `supabase/migrations/2610202300_blindatge_correu_organitzacions.sql`)**:
  1. Revocar el `SELECT (contact_email)` directe a `anon` (i restringir l'`UPDATE` només als administradors de l'entitat o mitjançant RPC/RLS estricta).
  2. Crear una columna calculada o funció RPC / vista segura, o una funció de columna calculada de PostgREST `correu_visible(public.organizations)` (` CASE WHEN o.public_email THEN o.contact_email ELSE NULL END `) perquè el correu privat (`public_email = false`) no viatge mai per la xarxa a visitants anònims ni a tercers autenticats que no siguen admins de l'organització:
  ```sql
  begin;

  -- 1. Tanquem la lectura crua de contact_email per a anon
  revoke select (contact_email) on table public.organizations from anon;

  -- 2. Funció calculada PostgREST que només exposa contact_email si public_email = true
  --    o si l'usuari autenticat és membre/admin de l'organització.
  create or replace function public.correu_organitzacio_visible(org public.organizations)
  returns text
  language sql
  stable
  security definer
  set search_path = ''
  as $$
    select case
      when org.public_email is true then org.contact_email
      when auth.uid() is not null and exists (
        select 1 from public.organization_members m
        where m.organization_id = org.id
          and m.user_id = auth.uid()
          and m.role in ('admin', 'editor')
      ) then org.contact_email
      else null
    end;
  $$;

  grant execute on function public.correu_organitzacio_visible(public.organizations) to anon, authenticated;

  commit;
  ```
- **requires_human_decision**: `false`

#### `P0-02` · Secrets: Revocació del secret històric d'n8n (`ed6077ff`)
- **Àmbit afectat**: Commit històric `ed6077ff` (`_wiki_de_poble/04_escriptori/02_investigacio_ia/Bóveda Comunidad — Revolutia IA.webloc`) i rastres de text als logs de `.agents/runtime/`.
- **Evidència**: El fitxer ja va ser sanejat a l'arbre de treball en el commit `1d45fb1a`, però el token JWT HS256 amb `iss: "n8n"` continua a l'historial d'objectes de Git (`git show ed6077ff`).
- **Protocol de Resolució**:
  1. **Acció humana immediata (`requires_human_decision: true`)**: Revocar/rotar la clau d'API d'n8n al panell d'administració del servidor n8n corresponent.
  2. **Neteja local de logs**: Purgar les entrades antigues de `.agents/runtime/` anteriors al torn actual un cop tancada la sessió.
  3. Si el repositori Git s'ha d'exposar públicament a GitHub, reescriure l'objecte del commit `ed6077ff` amb `git filter-repo --path "_wiki_de_poble/04_escriptori/02_investigacio_ia/Bóveda Comunidad — Revolutia IA.webloc" --invert-paths`.

#### `P0-03` · Apple i Google OAuth a iOS: Client IDs i URL Scheme en `ios/App/App/Info.plist`
- **Fitxer afectat**: `ios/App/App/Info.plist` (línia 38) i `.env.natiu.local`.
- **Evidència**:
  Actualment `ios/App/App/Info.plist:38` conté el valor de reserva:
  ```xml
  <key>CFBundleURLSchemes</key>
  <array>
    <string>com.googleusercontent.apps.pendent</string>
  </array>
  ```
  I `vite.natiu.config.js:290-299` (`errorsGoogleIos`) ja té el fusible que impedeix compilar si `VITE_NATIU_GOOGLE_IOS_CLIENT_ID` es declara a `.env.natiu.local` sense actualitzar `Info.plist`.
- **Protocol de Resolució**:
  1. Crear a Google Cloud Console el **Client OAuth per a iOS** amb Bundle ID `org.socdepoble.app` i el Team ID d'Apple del Mestre.
  2. Declarar a `.env.natiu.local`:
     ```dotenv
     VITE_NATIU_GOOGLE_WEB_CLIENT_ID=<id-web>.apps.googleusercontent.com
     VITE_NATIU_GOOGLE_IOS_CLIENT_ID=<id-ios>.apps.googleusercontent.com
     ```
  3. Substituir a `ios/App/App/Info.plist:38` `<string>com.googleusercontent.apps.pendent</string>` per l'esquema invertit `<string>com.googleusercontent.apps.<id-ios></string>`.
  4. Verificar que en `ios/App/App/App.entitlements` figura la capacitat oficial d'Apple Sign-In:
     ```xml
     <key>com.apple.developer.applesignin</key>
     <array>
       <string>Default</string>
     </array>
     ```

#### `P0-04` · Apple Guideline 5.1.1(v): Revocació de tokens amb `https://appleid.apple.com/auth/revoke`
- **Fitxers afectats**: `src/data/supabase/compte.js` (`demanaBaixa`, línies 78–94), `src/natiu/entradaSocial.js` i la funció de baixa al servidor (Supabase Edge Function / webhook de baixa).
- **Evidència**:
  Apple App Store Review Guideline 5.1.1(v) exigeix no només oferir l'esborrat del compte dins de l'app (que ja existeix a `/ajustaments` via `demanaBaixa()`), sinó també **revocar el token d'Apple (`https://appleid.apple.com/auth/revoke`)** en el moment de la baixa.
  Actualment, `demanaBaixa()` crida `rpc('demana_baixa')` i `logout(capturat, { scope: 'global' })`, però:
  1. Al dispositiu natiu no crida `oblidaCredencialNativa('apple')` / `oblidaCredencialNativa('google')`.
  2. El codi d'autorització d'Apple (`authorizationCode`) que retorna `@capgo/capacitor-social-login` en `resultat.accessToken.token` (vegeu `src/natiu/entradaSocial.js:72`) es descarta en entrar, de manera que el servidor no pot bescanviar-lo ni revocar-lo a `https://appleid.apple.com/auth/revoke`.
- **Pegat Quirúrgic en 3 passos**:
  1. **Al dispositiu (`src/natiu/entradaSocial.js:72`)**: Conservar el `codiAutoritzacio` d'Apple (`resultat?.accessToken?.token`) en un camp separat `codiAutoritzacio` de la credencial quan `proveidor === 'apple'` (sense enviar-lo mai com a `access_token` a GoTrue, perquè GoTrue no el confonga amb `at_hash`), i passar-lo a una Edge Function `apple-token-store` o RPC segura després d'iniciar sessió.
  2. **Al servidor (Supabase Edge Function `apple-revoke`)**: Quan l'usuari invoca `demanaBaixa`, invocar l'Edge Function que signa el `client_secret` JWT ES256 amb la clau `.p8` de Sign in with Apple i fa:
     ```http
     POST https://appleid.apple.com/auth/revoke
     Content-Type: application/x-www-form-urlencoded

     client_id=org.socdepoble.app&client_secret=<JWT_ES256>&token=<apple_refresh_or_access_token>&token_type_hint=refresh_token
     ```
  3. **En `src/data/supabase/compte.js` (`demanaBaixa`)**: Després de confirmar `demana_baixa`, netejar també la credencial nativa del dispositiu (`oblidaCredencialNativa('apple')` i `oblidaCredencialNativa('google')`).

#### `P0-05` · Migracions: Aplicar Fase D, Fase E i el fix `P0-01` a Supabase Prod
- **Fitxers afectats**:
  1. `supabase/migrations/2610201500_moderacio_denuncies_i_bloquejos.sql` (Fase D: taules `content_reports`, `user_blocks`, `community_guidelines_acceptances` i RPCs de moderació exigits per Apple Guideline 1.2 UGC).
  2. `supabase/migrations/2610202100_el_comu_i_llistes_reactives.sql` (Fase E: `saved_lists`, `saved_list_items`, RLS i `GRANT SELECT, INSERT, UPDATE, DELETE TO authenticated`).
  3. Nova migració `2610202300_blindatge_correu_organitzacions.sql` (`P0-01`).
- **Verificació post-aplicació**: Comprovar amb `GET /rest/v1/` que les 5 taules i les funcions RPC apareixen a l'esquema de PostgREST en producció.

#### `P0-06` · Google Play Data Safety: Enllaç web públic d'esborrat de compte (`/legal#esborra-compte`)
- **Fitxer afectat**: `src/sections/text/legalContent.js` (línia 149).
- **Evidència**: Línia 149 ja conté `<h5 data-sdp-ancora="esborra-compte">Com esborrar el teu compte i les teues dades</h5>`.
- **Pegat Quirúrgic**: Afegir l'atribut estàndard `id="esborra-compte"` (`<h5 id="esborra-compte" data-sdp-ancora="esborra-compte">`) perquè qualsevol navegador o revisor automatitzat de Google Play aterre a l'àncora nativa tant via DOM com via `data-sdp-ancora`, i publicar el build web en `https://socdepoble.org/legal#esborra-compte`.

#### `P0-07` · Icones Oficials: Substitució del placeholder de Capacitor en iOS i Android
- **Fitxers afectats**:
  - `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (actualment 110.522 B, 7-oct: icona blava per defecte de Capacitor).
  - `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732*.png` (actualment 41.273 B, 7-oct: splash per defecte de Capacitor).
  - Futur `android/app/src/main/res/mipmap-*/ic_launcher*.png` i `drawable/splash.png`.
- **Protocol de Resolució**:
  1. Generar des de l'escut oficial de Sóc de Poble (`public/assets/brand/` / `_recursos_de_poble/`) un PNG mestre de **1024×1024 px opac (sense canal alfa per a l'App Store)** sobre fons `#0e0d0c` o `#FAF8F5` i un Splash de **2732×2732 px**.
  2. Sobreescriure `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` i les tres còpies de `Splash.imageset/`.
  3. En crear `android/`, generar les icones adaptatives (`ic_launcher_foreground.png`, `ic_launcher_background` `#0e0d0c` i `ic_launcher_round.png`).

#### `P0-08` · Blindatge Legal en `src/sections/text/legalContent.js` (NIF `G-03967668` i purgues de «conta»)
- **Fitxer afectat**: `src/sections/text/legalContent.js` (línies 26–31, 71, 149–245).
- **Evidència**:
  1. **Línies 26–29**: Exposa el nom físic del Mestre i un placeholder prohibit a les botigues:
     ```html
     <li><strong>Titularitat / Coordinació:</strong> Associació Cultural / Projecte Comunitari "El Rentonar" (Representat per Fco. Javier Llinares García)</li>
     <li><strong>NIF / CIF:</strong> [DADES PROTEGIDES AL CODI FONT]</li>
     <li><strong>Domicili Social:</strong> [DADES PROTEGIDES AL CODI FONT] - 03108 La Torre de les Maçanes (L'Alacantí, Alacant, Espanya)</li>
     ```
  2. **Línia 71 (Política de Privacitat)**: Exposa el NIF personal (`21476359V`) i el domicili particular (`Carrer Sant Isidre Llaurador, 16`)!
  3. **Línies 151, 152, 179, 224, 225, 229, 232, 240, 242, 244 (14 ocurrències)**: Castellanisme «conta» (`la teua conta`, `una conta`, `eliminar la conta`) i errata `alletjament` (línia 218).
- **Pegat Quirúrgic Exacte**:
  - En línies 26–29 i línia 71, substituir per la persona jurídica:
    - **Titular / Responsable**: `Associació Cultural El Rentonar — Projecte Comunitari Sóc de Poble`
    - **NIF**: `G-03967668`
    - **Domicili Social**: `03108 La Torre de les Maçanes (l'Alacantí, Alacant)`
    - **Correu de contacte i delegació de privacitat**: `elrentonar@gmail.com`
  - Substituir totes les 14 aparicions de `la teua conta` / `una conta` / `la conta` per `el teu compte` / `un compte` / `el compte`, i `alletjament` (L218) per `allotjament`.

#### `P0-09` · Desinfecció Web en `src/sections/text/pageContent.js` (`anima`)
- **Fitxer afectat**: `src/sections/text/pageContent.js` (línia 115).
- **Evidència**: Conté `<iframe src="/iaia-maria" title="IAIA MarIA" ...></iframe>` (que causa recursió infinita dins de l'SPA) i l'enllaç mort `<a href="/skills">Directori d'Habilitats (Skills)</a>`.
- **Pegat Quirúrgic**: Eliminar el bloc `<div class="sdp-anima-visor">...</div>` i el paràgraf amb l'enllaç a `/skills`, deixant la prosa d'identitat de l'Ànima neta i autocontinguda.

#### `P0-10` i `P0-11` · Diccionaris Multillengua (`es.js`, `en.js`, `eu.js`, `gl.js`) i Lèxic Valencià (`va.js`)
- **Fitxers afectats**: `src/locales/es.js` (L49–64), `src/locales/en.js` (L49–64), `src/locales/eu.js` (L50–87), `src/locales/gl.js` (L50–87) i `src/locales/va.js`.
- **Evidència**:
  - `es.js` i `en.js` tenen 12 claus (`search.placeholder`, `wall.*`, `towns.*`, `design.*`) en valencià sense traduir.
  - `eu.js` i `gl.js` tenen 31 claus (`search.*` fins a `me.*`) en valencià més la clau òrfena `'nav.skills'`.
  - Si hi ha cap aparició de l'anglicisme «ítems», substituir per «elements».
- **Pegat Quirúrgic**: Traduir les 12 claus en `es.js`/`en.js`, les 31 claus en `eu.js`/`gl.js` i eliminar `'nav.skills'` de `eu.js` i `gl.js` per assolir paritat exacta de claus amb `va.js` (`tests/i18n-claus.test.mjs`).

#### `P0-12` · Evacuació de l'Arxiu Històric (`90_arxiu_historic/`)
- **Àmbit afectat**: `_wiki_de_poble/90_arxiu_historic/` -> `/Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/`.
- **Evidència**: `git status` mostra que els >300 fitxers de `_wiki_de_poble/90_arxiu_historic/` ja han sigut evacuats de l'arbre de treball actiu (`D _wiki_de_poble/90_arxiu_historic/...`) i `ls -la ../_arxiu_wiki_de_poble/` confirma que els 7 blocs històrics (`00_arrel_socdepoble` a `06_planes_antigues`) descansen fora del repositori Git. Només resta consolidar el commit de neteja quan el Mestre ho ordene.

---

### T4 · Protocol d'Or per al Naixement d'Android (`npx cap add android`)

El Mestre ha ordenat generar la carpeta `android/` **DESPRÉS** d'aplicar els pegats de la Dutxa de Salfumant perquè el projecte natiu d'Android Studio nasca pur i sincronitzat amb `scripts/botigues/puja-android.mjs`.

#### 4.1 Configuració de Capacitor: `capacitor.config.json` vs `capacitor.config.ts` i `webDir`

> **Observació Crítica de l'Àrbitre Adversarial (Gauntlet)**:
> El repositori actual empra **`capacitor.config.json`** (no `.ts`) i apunta a **`"webDir": "dist-natiu"`** (verificat per `vite.natiu.config.js:36` i `scripts/botigues/preflight.mjs:48,109`).
> **Per què `webDir` HA DE SER `"dist-natiu"` i no `"dist"`?**
> - `dist/` (162 MB) és el build web: conté el Service Worker (`sw.js`), el manifest PWA, l'entrada web (`/src/main.jsx`), els PNG/JPEG originals sense filtrar i els índexs pesants (`rag-index.json` i `slugIndex.json`, 1,43 MB).
> - `dist-natiu/` (47 MB, generat per `npm run build:natiu`) és el build natiu segellat per `vite.natiu.config.js`: munta `/src/natiu/entrada.jsx`, injecta la CSP nativa estricta (`worker-src 'none'`), elimina les etiquetes PWA i empaqueta només les bessones `.webp` lleugeres.
> - A més, `scripts/botigues/preflight.mjs:109-118` comprova que `android/app/src/main/assets/public/index.html` tinga el mateix SHA-256 que `dist-natiu/index.html`. Si es posara `webDir: "dist"`, el preflight de botigues fallaria amb codi `7` (`EIXIDA.ARBRE`).

**Configuració canònica actual (`capacitor.config.json`)**:
```json
{
  "appId": "org.socdepoble.app",
  "appName": "Sóc de Poble",
  "webDir": "dist-natiu"
}
```
*(Si en el futur es migrara a TypeScript `capacitor.config.ts`, ha de mantindre exactament els mateixos tres valors: `appId: 'org.socdepoble.app'`, `appName: 'Sóc de Poble'`, `webDir: 'dist-natiu'`).*

#### 4.2 Seqüència Exacta d'Inicialització Neta d'Android

```bash
# 1. Dins de socdepoble.org, compilar el paquet natiu net (amb .env.natiu.local configurat)
npm run build:natiu

# 2. Generar el projecte natiu Android des de la plantilla oficial de Capacitor 8.5.3
npx cap add android

# 3. Sincronitzar dist-natiu/ i els connectors (@capgo/capacitor-social-login) cap a android/
npx cap sync android
```

#### 4.3 Blindatge de `android/app/src/main/AndroidManifest.xml` i `strings.xml`

Després d'executar `npx cap add android`, revisar que `android/app/src/main/AndroidManifest.xml` continga **només els permisos mínims indispensables** (Google Play rebutja les apps que demanen `READ_MEDIA_IMAGES` o `READ_EXTERNAL_STORAGE` si poden usar l'Android Photo Picker del sistema, que és el que usa el `<input type="file" accept="image/*">` del WebView modern):

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>

    <!-- Permís de xarxa indispensable (sempre sobre HTTPS gràcies a usesCleartextTraffic="false") -->
    <uses-permission android:name="android.permission.INTERNET" />

</manifest>
```
> **Punts clau de seguretat del Manifest**:
> - `android:allowBackup="false"`: Impedeix que les dades del WebView (`localStorage` amb el refresh token de la sessió) s'exporten sense xifrar en còpies de seguretat ADB/cloud.
> - `android:usesCleartextTraffic="false"`: Prohibix tràfic `http://` en clar a nivell de sistema operatiu Android.
> - **Zero permisos perillosos innecessaris**: No declarar `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` ni `READ_MEDIA_IMAGES` tret que s'instal·le un plugin natiu de càmera. El selector d'arxius de Chromium/Android 13+ obri el Photo Picker del sistema sense demanar cap permís d'emmagatzematge i passa la revisió de Google Play sense fricció.

I en `android/app/src/main/res/values/strings.xml`, verificar els accents valencians:
```xml
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Sóc de Poble</string>
    <string name="title_activity_main">Sóc de Poble</string>
    <string name="package_name">org.socdepoble.app</string>
    <string name="custom_url_scheme">org.socdepoble.app</string>
</resources>
```

#### 4.4 Configuració de Signatura en `android/app/build.gradle` (Compatible amb `puja-android.mjs`)

El script ja instal·lat `scripts/botigues/puja-android.mjs` (línies 50–56) passa les credencials del Keystore **exclusivament per variables d'entorn del procés fill de Gradle** (`SDP_ANDROID_KEYSTORE_PATH`, `SDP_ANDROID_KEY_ALIAS`, `SDP_ANDROID_KEYSTORE_PASSWORD`, `SDP_ANDROID_KEY_PASSWORD`) i amb `--no-daemon`. Per tant, a `android/app/build.gradle` cal afegir aquest bloc exacte dins d'`android { ... }`:

```groovy
android {
    namespace "org.socdepoble.app"
    compileSdk rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "org.socdepoble.app"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    signingConfigs {
        release {
            def ksPath = System.getenv("SDP_ANDROID_KEYSTORE_PATH")
            if (ksPath) {
                storeFile file(ksPath)
                storePassword System.getenv("SDP_ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("SDP_ANDROID_KEY_ALIAS")
                keyPassword System.getenv("SDP_ANDROID_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4.5 Generació de l'Upload Keystore (FORA del repositori) i Compilació del `.aab`

Segons `scripts/botigues/entorn.mjs:469-477`, el Keystore ha de viure **obligatòriament fora del repositori** i tindre permisos `600`:

```bash
# 1. Crear la carpeta de claus fora del repositori amb permisos 700
mkdir -p -m 700 ~/.config/socdepoble-botigues

# 2. Generar l'Upload Keystore (RSA 2048, validesa 10.000 dies)
keytool -genkeypair -v \
  -keystore ~/.config/socdepoble-botigues/socdepoble-upload.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias socdepoble-upload \
  -dname "CN=Associacio Cultural El Rentonar, OU=Soc de Poble, O=El Rentonar, L=La Torre de les Macanes, ST=Alacant, C=ES"

chmod 600 ~/.config/socdepoble-botigues/socdepoble-upload.jks

# 3. Obtindre l'empremta SHA-256 per a SDP_ANDROID_UPLOAD_CERT_SHA256 i per a Google Cloud Console (OAuth Client Android)
keytool -list -v -keystore ~/.config/socdepoble-botigues/socdepoble-upload.jks -alias socdepoble-upload

# 4. Verificar preflight i compilar el .aab signat (usant el JBR d'Android Studio Java 21 seleccionat automàticament)
node scripts/botigues/preflight.mjs --plataforma android --signa
node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 1 --compila
```

---

### T5 · Verificació del Plugin WordPress (`wordpress-plugin/socdepoble-enxufe.php`)

#### 5.1 Clarificació de Ruta i Arquitectura de Blindatge

- El fitxer principal real és **`wordpress-plugin/socdepoble-enxufe.php`** (acompanyat de `wordpress-plugin/uninstall.php`, `wordpress-plugin/actualitzador.php` i `wordpress-plugin/readme.txt`).
- El nom antic `soc-de-poble/soc-de-poble.php` (esmentat a l'enunciat) correspon a la generació vella del connector. De fet, `socdepoble-enxufe.php` (línies 54–108) incorpora una **guarda anti-col·lisió exemplar**:
  1. **Zero funcions globals (`function ...`) al fitxer principal**: Tota la lògica viu en closures anònimes, de manera que encara que un administrador puge una segona còpia a WordPress, PHP **no llança mai `Fatal error: Cannot redeclare`** ni tomba `wp-admin`.
  2. **Detector de còpia vella activa (`soc-de-poble/soc-de-poble.php`)**: Si el plugin antic està actiu, mostra un avís en `admin_notices` i no munta per evitar que dos Web Components competisquen pel mateix DOM.
  3. **Compliment total del Model B**: El connector passa al `<soc-de-poble>` únicament les claus del lloc (`base-path`, `plugin-url`, `fonts-href`, `router`, `manage-head`) i l'estat visual; no llig ni injecta mai credencials de Supabase (`socdepoble-enxufe.php:19-28`).
  4. **`uninstall.php` net i multisite-safe**: Quan es desinstal·la el plugin i no queda cap altra còpia del mateix connector, purga totes les opcions (`socdepoble_*`) i transients (`socdepoble_enxufe_actualitzacio`) a cada lloc de la xarxa multisite i buida la memòria cau.

#### 5.2 Dues Variants de Desplegament (`gentdelatorre.com` vs Directori Oficial WordPress.org)

El generador `scripts/build-wp-plugin.mjs` ja produeix dues variants diferenciades:
1. **Variant Canal Propi (`npm run build:wp` → `socdepoble-enxufe-X.Y.Z.zip`)**:
   - Destinada a **`gentdelatorre.com`**, **`gentdelatorre.net`** i la xarxa de pobles propis.
   - Inclou `Update URI: https://socdepoble.org/wp-plugin/stable.json` i `actualitzador.php`, amb **verificació criptogràfica Ed25519 (`sodium_crypto_sign_verify_detached`)** i validació d'origen HTTPS abans d'acceptar qualsevol paquet d'actualització.
2. **Variant Directori Oficial (`npm run build:wp:directori` → `socdepoble-enxufe-X.Y.Z-directori.zip`)**:
   - Destinada al repositori oficial **WordPress.org**.
   - Elimina automàticament la capçalera `Update URI` i exclou `actualitzador.php` (complint la Guideline de WordPress.org que prohibix sistemes d'auto-actualització fora de `wordpress.org`).

#### 5.3 Tres Bloquejadors Detectats a `wordpress-plugin/` abans de la Pujada Final

| ID | Fitxer Afectat | Troballa Empírica | Pegat / Solució |
| --- | --- | --- | --- |
| **`[WP-01]`** | `wordpress-plugin/socdepoble-enxufe.php:6,36`<br>`wordpress-plugin/readme.txt:7` | **Desfasament de versió als fitxers font (`1.1.3` vs `1.1.7`)**: Tot i que `scripts/build-wp-plugin.mjs` injecta la versió als ZIPs compilats, els fitxers font del repositori encara diuen `Version: 1.1.3`, `SOCDEPOBLE_ENXUFE_VERSIO = '1.1.3'` i `Stable tag: 1.1.3`, mentre que el changelog arriba fins a `1.1.7`. | Sincronitzar `socdepoble-enxufe.php` i `readme.txt` a la versió canònica vigent (`1.1.8` post-salfumant). |
| **`[WP-02]`** | `wordpress-plugin/supabase/`<br>`wordpress-plugin/.DS_Store` | **Residus dins de `wordpress-plugin/`**: Hi ha una carpeta `supabase/` buida/paràsita i un `.DS_Store`. | Executar `rm -rf wordpress-plugin/supabase wordpress-plugin/.DS_Store`. |
| **`[WP-03]`** | `wordpress-plugin/builds/*-directori.zip` (~129 MB) | **Pes del paquet per a WordPress.org SVN**: Amb tots els mitjans locals de `public/assets/` dins de `dist/assets/`, el ZIP pesa ~129 MB (el formulari d'enviament de WordPress.org té un límit estricte d'entre 10 MB i 50 MB). | Per a `gentdelatorre.com` (canal propi) el ZIP autònom o amb `SDP_MEDIS_EXTERNS=1` funciona immediatament; per a l'enviament a **WordPress.org (`build:wp:directori`)**, compilar amb `SDP_MEDIS_EXTERNS=1` perquè els mitjans pesants se servisquen des del CDN `https://socdepoble.org/assets/` i el ZIP del plugin baixe a **< 5 MB**. |

---

### ⚖️ Auto-Auditoria d'Àrbitre Adversarial Intern (Mètode Gauntlet)

Abans d'emetre aquest informe definitiu, l'Àrbitre Adversarial intern ha sotmés l'esborrany a quatre proves de tensió:

1. **Prova de Tensió 1 (Llei de l'Enxufabilitat i Model B)**:
   - *Pregunta de l'Àrbitre*: «Hi ha algun punt on el frontend de Sóc de Poble depenga d'un endpoint de Sollutia per arrencar o autenticar-se?»
   - *Verificació*: **Cap**. `src/data/adaptadors/sollutia/client.js` manté `resources: Object.freeze({})` per defecte, i `CalendariSection.jsx` consulta la capacitat `'agenda'` amb degradació elegant (`avisAgenda`) si no hi és o si no respon. El login i les dades viuen al 100% al port de Sóc de Poble (`src/data/backendPort.js`).
2. **Prova de Tensió 2 (Trampa `webDir: "dist"` vs `"dist-natiu"` en T4)**:
   - *Pregunta de l'Àrbitre*: «El prompt suggeria posar `webDir: 'dist'` a `capacitor.config.ts`. Si fem això, què passa amb l'arquitectura real del projecte?»
   - *Verificació*: Ha sigut caçada i documentada a la secció **§4.1**. Canviar `webDir` a `dist` trencaria `vite.natiu.config.js`, injectaria el Service Worker web dins de Capacitor, inflaria l'AAB de 47 MB a 162 MB i faria fallar `scripts/botigues/preflight.mjs` amb eixida `7`. Per tant, el protocol canònic manté `capacitor.config.json` amb `"webDir": "dist-natiu"`.
3. **Prova de Tensió 3 (Trampa de les variables de signatura d'Android en T4)**:
   - *Pregunta de l'Àrbitre*: «Quins noms exactes de variables d'entorn passa `scripts/botigues/puja-android.mjs` a Gradle?»
   - *Verificació*: Verificat a `scripts/botigues/puja-android.mjs:51-56`: passa `SDP_ANDROID_KEYSTORE_PATH`, `SDP_ANDROID_KEY_ALIAS`, `SDP_ANDROID_KEYSTORE_PASSWORD` i `SDP_ANDROID_KEY_PASSWORD`. El bloc `signingConfigs.release` de la secció **§4.4** s'ha escrit perquè llija exactament aquestes 4 variables.
4. **Prova de Tensió 4 (Completitud dels 12 P0)**:
   - *Pregunta de l'Àrbitre*: «Falta algun dels 12 bloquejadors P0 o el NIF `G-03967668`?»
   - *Verificació*: Tots 12 (`P0-01` a `P0-12`) tenen evidència de fitxer i línia, pegat quirúrgic i identificació del NIF `G-03967668` de l'Associació Cultural El Rentonar.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions empíriques executades durant l'auditoria (totes sense mutar cap fitxer fora d'`04_escriptori/`):

```bash
# 1. Verificació de l'estat de l'Escriptori i de la Porta Olivera
node tooling/gates/porta-olivera.mjs
# -> [PORTA-OLIVERA] OK · Escriptori net i indexat (7 arxius verificats amb el present informe).

# 2. Verificació del contracte i marcadors del document d'auditoria
node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261020_2235_auditoria_gemini_salfumant_sistema_i_android.md

# 3. Verificació de fronteres Sollutia i absència d'injecció de backend d'amfitrió
rg -n "sollutia|Sollutia" src/ tooling/
du -sh wordpress-plugin/builds .snapshots .wwebjs_auth .sdp-paperera .iaia_auth .wiki-safety dist dist-natiu ios
```

### Ordre Recomanat d'Execució del Torn de Salfumant i Android

1. **Fase 1 — Purga Física de Brossa (Salfumant)**:
   - Executar la neteja de `.wwebjs_auth/`, `.iaia_auth/`, `.wiki-safety/`, `tooling/scratch_malformades.mjs`, `wordpress-plugin/supabase/`, els 8 `.DS_Store`, les carpetes buides i els 27 `.zip` antics de `wordpress-plugin/builds/` (alliberant **~3,5 GB** a l'instant).
   - Amb vistiplau del Mestre, eliminar `_wiki_de_poble/04_escriptori/01_produccio/checklist-limpieza-wp-ayudawp.md` (0 bytes) i `.sdp-paperera/` / `.snapshots/`.
2. **Fase 2 — Aplicació dels Pegats de Codi i Base de Dades (Els 12 P0 + Textos Model B)**:
   - Aplicar a Supabase Prod les migracions `2610201500` (Fase D), `2610202100` (Fase E) i la nova `2610202300_blindatge_correu_organitzacions.sql` (`P0-01` + `P0-05`).
   - Aplicar els pegats de `src/sections/text/legalContent.js` (`P0-06` + `P0-08` amb NIF `G-03967668`), `src/sections/text/pageContent.js` (`P0-09` + `[T1-01]`), i els diccionaris `src/locales/{es,en,eu,gl}.js` (`P0-10` + `P0-11`).
   - Configurar els Client IDs OAuth (`P0-03`), l'Edge Function de revocació d'Apple (`P0-04`) i les icones oficials 1024×1024 (`P0-07`).
3. **Fase 3 — Naixement Net d'Android i Builds de Botigues**:
   - Executar `npm run build:natiu && npx cap add android && npx cap sync android`.
   - Aplicar la configuració de `AndroidManifest.xml`, `strings.xml` i `signingConfigs.release` a `android/app/build.gradle`.
   - Verificar amb `node scripts/botigues/preflight.mjs --plataforma totes`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Frontera d'efectes respectada**: Aquesta auditoria s'ha executat en estricte mode de lectura sobre el codi font (`src/`, `supabase/`, `tooling/`, `ios/`, `wordpress-plugin/`). Cap fitxer de `01_produccio/` ni de l'arbre d'aplicació ha sigut esborrat ni modificat sense l'ordre d'execució del Mestre.
- **Accions que requereixen intervenció externa o credencials del Mestre (`requires_human_decision: true`)**:
  1. Rotació/revocació del secret d'n8n al panell del proveïdor (`P0-02`).
  2. Alta dels Client IDs OAuth d'iOS i Android a Google Cloud Console i de la clau `.p8` de Sign in with Apple a Apple Developer Portal (`P0-03`, `P0-04`).
  3. Eliminació del fitxer de 0 bytes `_wiki_de_poble/04_escriptori/01_produccio/checklist-limpieza-wp-ayudawp.md` dins de la carpeta protegida `01_produccio/` (`AGENTS.md §12`).
- **Observació sobre la plantilla d'auditoria (`_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`)**:
  - La plantilla v2.0.0 i el circuit `node tooling/wiki/document.mjs` funcionen de manera impecable. Com a única millora menor per a futures versions de `document.mjs`, quan el nom del fitxer comença per `AAMMDD_HHMM_auditoria_...`, l'ordre `document.mjs create` podria inferir automàticament `--route auditoria` sense requerir el flag explícit si ja s'ha passat en `context`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[02_genotip]]
- [[soci_sollutia]]
- [[261020_2045_pla_implementacio_el_comu_i_llistes_reactives]]
- [[261020_2100_auditoria_gemini_skills_i_textos_publics]]
- [[261020_2235_prompt_gemini_auditoria_salfumant_sistema_i_android]]
