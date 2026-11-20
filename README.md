---
type: "index"
status: "canonic"
description: "README d'enginyeria per a equips tècnics externs: arquitectura modular, port de backend, dades a Supabase, portes automàtiques i canals de distribució."
---
# Sóc de Poble

Sóc de Poble és una **aplicació web cívica per a pobles**, escrita en React i distribuïda com a SPA, Web Component i app nativa. Este README és per a **tècnics externs** (Sollutia, auditories de seguretat o de programari lliure) i descriu el que el codi fa hui; per al detall complet de capes, fronteres del Model B, seguretat RLS i pressupostos d'execució, consulteu també [`ARCHITECTURE.md`](ARCHITECTURE.md). Cada xifra porta el fitxer o l'ordre que la reproduïx.

## Mapa del repositori

Esta taula situa cada peça i el fitxer on es pot verificar.

| Peça | On viu | Paper |
| --- | --- | --- |
| Aplicació React | `src/`, `vite.config.js` | SPA de socdepoble.org |
| Web Component `<soc-de-poble>` | `src/host.js`, `src/embed.jsx`, `vite.standalone.config.js` | Connector WordPress i altres amfitrions |
| App nativa | `capacitor.config.json`, `android/`, `ios/`, `vite.natiu.config.js` | iOS i Android amb Capacitor |
| Esquema de dades | `supabase/migrations/`, `supabase/functions/` | Supabase de Sóc de Poble |
| Node 0 | `tooling/node0/`, `nix/` | Mirall socdepoble.cat i API pròpia |
| Portes | `.husky/`, `tooling/gates/`, `.github/workflows/` | Comprovacions automàtiques |
| Wiki | `_wiki_de_poble/` | Documentació, compilada dins de l'app |

## Arquitectura modular

L'aplicació és un **client pur que parla amb les dades a través d'un port**: cap component d'interfície importa directament un client de base de dades. Les apps opcionals són mòduls que es poden **traure del build** sense tocar el nucli.

### Capes del codi

Cada carpeta de `src/` té una responsabilitat i les portes en vigilen les fronteres.

- **`src/sections/`:** seccions del nucli (Mur, Xat, Notes, Calendari, Mercat, Multimèdia, Pobles, Perfil, Wiki de Poble…), cadascuna amb el seu contingut i, si cal, la seua llavor.
- **`src/apps/<id>/`:** apps opcionals amb manifest `sdp.app.v1` (`src/apps/plataforma/manifestApp.js`). Cada una té una bandera de build, `VITE_SDP_APP_<ID>=0`, que la trau del paquet.
- **`src/data/`:** port de backend, contracte, adaptadors, sessió i xifrat del xat.
- **`src/components/`, `src/styles/`, `src/config/`:** peces d'interfície del sistema Pedra Seca, estils i configuració compartida.
- **`src/host.js` i `src/natiu/`:** arrencada com a Web Component i entrada de l'app nativa.

### Port neutral de backend

`src/data/backendPort.js` accepta **qualsevol adaptador que complisca el contracte** de `src/data/contracte.js` i el segella en arrencar (`freezeImplementation`). El contracte té **32 operacions de nucli** (`CONTRACTE_NUCLI`) i **57 capacitats opcionals** (`CAPACITATS`), 165 mètodes en total.

- **Validació:** una capacitat s'oferix sencera o no s'oferix; un nucli incomplet o una capacitat parcial rebutgen l'adaptador.
- **Lectures principals:** les de contingut, Mur, Multimèdia i Notes porten un temps màxim de 15 s, es poden cancel·lar i es validen per forma abans d'arribar a la interfície.
- **Recompte:** `node -e "import('./src/data/contracte.js').then(m=>console.log(m.CONTRACTE_NUCLI.length,Object.keys(m.CAPACITATS).length,m.CONTRACTE_BACKEND.length))"`.

Estos són els adaptadors reals del port, i no n'hi ha cap altre:

| Adaptador | Fitxer | Quan s'usa |
| --- | --- | --- |
| Supabase | `src/data/supabase/index.js` | Per defecte: `arrenca()` de `src/host.js` l'importa si no s'ha injectat cap altre. Inclou els modes `seed` i `local` per a proves sense xarxa. |
| Node 0 HTTP | `src/data/node0/adaptadorNodeZeroHttp.js` | Només si el build porta `VITE_SDP_NODE0_HTTP=1`. Cap script de `package.json` activa eixa bandera. |
| Local | `src/data/local/adaptadorLocal.js` | Segon adaptador complet, sense xarxa. Cap entrada de producció l'importa: entra per `injectaBackendDelPaquet` en proves. |

El **kit de conformitat** (`src/data/conformitat/kit.js`) el passen l'adaptador Supabase (`src/data/supabase/conformitat.test.js`) i el local (`src/data/local/adaptadorLocal.conformitat.test.js`). Canviar de backend és una decisió amb ADR i este kit.

Hui **no hi ha cap adaptador de backend per a WordPress, Joomla o MediaWiki**: estos sistemes poden ser amfitrions del Web Component, no font de dades. Les carpetes de `src/data/adaptadors/` (`sollutia`, `noticies`, `viquipedia`) són clients de lectura de fonts concretes, no adaptadors del port.

### Model B amb Sollutia

Sollutia és **amfitrió del Web Component i soci d'infraestructura**, no backend de dades (`AGENTS.md`, §8).

- **Dades:** les dades del poble viuen al **Supabase de Sóc de Poble**, única font de veritat. Sollutia no hi injecta cap backend.
- **Sessió:** l'amfitrió pot passar una sessió externa (`adoptaSessioExterna`), validada contra l'emissor i les audiències de la política d'execució (`src/config/runtimePolicy.js`).
- **Frontissa:** l'API de Sollutia es llig **només amb GET** des de `src/data/adaptadors/sollutia/` (`credentials: 'omit'`, `ESCRIPTURES_PERMESES` buit).
- **Estat de la Frontissa:** la configuració versionada no té cap recurs actiu (`apiOrigin: null`, `resources: {}`). Activar-ne un exigix una captura versionada.
- **Portes de frontera:** `tooling/gates/tractor-frontissa.mjs`, `tractor-adaptadors.mjs` (la interfície no importa traductors d'origen ni la Frontissa escriu) i `tractor-enxufe.mjs`.

## Dades, migracions i RLS

Supabase (PostgreSQL, Auth, Storage, Realtime i Edge Functions) és **l'única font de veritat de les dades del poble**. L'esquema i les polítiques RLS viuen al repositori; l'estat de producció de cada migració es registra a `supabase/README.md`.

### Migracions

`supabase/migrations/` té 120 fitxers SQL amb **dos formats de nom**: `aammddhhmm_nom.sql` (històric, deu xifres) i `AAAAMMDDhhmmss_nom.sql` (catorze xifres).

- **No uses l'ordre alfabètic cru:** els noms de catorze xifres (`2026…`) queden davant dels de deu (`26…`), i l'ordre real és per data.
- **Pla d'aplicació:** `npm run migracions:pla` (`scripts/supabase/verifica-migracions.mjs --pla`) compara les dues convencions sobre un mateix rellotge i aplica les restriccions de `supabase/ordre_desplegament.json`.
- **Verificador estàtic:** `npm run migracions:verifica` no es connecta a cap base i comprova noms, dependències, transaccions i consultes de lectura.
- **Registre:** `supabase/README.md` explica cada migració, el seu ordre i si està aplicada o no a producció. No apliques `supabase db push` sobre el catàleg mixt sense revisar abans el pla.
- **Funcions:** `supabase/functions/` conté `ap-inbox-verifica`, `compte-apple`, `iaia`, `noticies`, `notifica-xat`, `notifica-xat-desperta` i `purga-fitxers`.

Per a una base nova:

1. Crea el projecte de Supabase.
2. Genera el pla amb `npm run migracions:pla` i aplica les migracions en l'ordre que proposa.
3. Crea el poble corresponent a `VITE_TENANT_ID`. `supabase/seed.sql` és opcional, per a demostracions.
4. Configura les variables d'entorn sense versionar cap secret ni usar mai `service_role` al client.
5. Comprova permisos i RLS amb rols de prova abans de producció.

### RLS i la seua porta

`tooling/gates/tractor-rls.mjs` (`npm run porta:rls`) fa una **anàlisi estàtica** dels fitxers SQL de `supabase/`.

- **Què comprova:** que les taules creades tinguen RLS, que les exempcions de contingut públic estiguen declarades i que les funcions `SECURITY DEFINER` fixen un `search_path` buit explícit.
- **Què no comprova:** no executa SQL dinàmic ni consulta els permisos reals de producció. Quan troba `EXECUTE` dinàmic ho avisa com a «detection-unknown».
- **Proves SQL reals:** `npm run test:sql` aixeca un PostgreSQL local (binaris del `PATH`, `SDP_POSTGRES_BIN` o el paquet `embedded-postgres`). Algunes proves usen PGlite si es definix `SDP_PGLITE_MODULE`.

### Xat: per què les correccions no són opcionals

`2609080100_xat_v2.sql` crea les quatre taules base del xat, però sense `2609080200_xat_v2_correccions.sql` **cap fil arriba a funcionar**. Les causes completes són a `supabase/README.md`, secció «Per què cal el pegat».

- **Inserció circular:** la política `xat_participants_insercio` consultava `xat_fils` amb RLS, i ningú podia afegir el primer participant. El pegat la trenca amb `private.es_creador_del_fil()`.
- **Noms invisibles:** `profiles read own` només deixa llegir el perfil propi. `xat_fils_meus()` i `xat_missatges_del_fil()` tornen només el nom de qui compartix fil amb tu.
- **Cap porta d'entrada:** `crea_fil_directe()` és l'única manera d'obrir una conversa.
- **Directori del poble:** `membres_del_poble()` (`2609080300_xat_v2_membres.sql`) obri el nom i l'identificador dels membres del teu poble i el fil directe que ja compartiu, sense correu, rol ni dates. És una decisió de govern documentada a `supabase/README.md`, «El directori del poble».

### Comprovació ràpida del xat

Al SQL Editor, amb dues consultes de només lectura:

```sql
-- 1. Les quatre taules base del xat: les quatre columnes han d'eixir true.
select to_regclass('public.xat_fils') is not null as xat_fils,
       to_regclass('public.xat_participants') is not null as xat_participants,
       to_regclass('public.xat_missatges') is not null as xat_missatges,
       to_regclass('public.xat_lectures') is not null as xat_lectures;

-- 2. Els RPC del xat: n'han d'eixir cinc noms.
select distinct proname from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and proname in ('crea_fil_directe', 'xat_fils_meus',
                   'xat_missatges_del_fil', 'xat_marca_llegit',
                   'membres_del_poble');
```

Si PostgREST respon que no troba una taula o una funció (`PGRST202` o `PGRST205`), el client mostra «L’esquema del xat no està aplicat: cal executar la migració 2609270200_xat_f0_fonament.sql.» (`src/data/supabase/xat.js`).

### Sessió al navegador

La sessió s'escriu i s'esborra **només des de `src/data/identitat.js`** (`desaSessio` i `esborraSessio`).

- **JWT i usuari:** viuen a `sessionStorage` i moren amb la pestanya.
- **Refresh token:** amb la política `auth.persistencia: 'local'` (la de `src/main.jsx` i `src/natiu/entrada.jsx`), un registre `{ v, rt, sub, t }` baixa a l'emmagatzematge local perquè no calga tornar a entrar en cada obertura.
- **Pestanya nova:** no es pinta «dins» fins que Auth torna una sessió vàlida amb eixe registre.
- **Amfitrions:** una sessió injectada per l'amfitrió no baixa mai al registre persistent, i la política `'pestanya'` torna al comportament de sessió per pestanya.
- **Risc declarat:** qualsevol script del mateix origen pot llegir el registre. Les mitigacions són la rotació amb detecció de reutilització d'Auth, la revocació en eixir i la política `'pestanya'`.

## Portes automàtiques

Una **porta** és un programa que s'executa sol i bloqueja un commit o una integració. Ací només es llisten les que **s'executen de veritat**, amb el fitxer que les crida.

### En cada commit

`npm ci` activa Husky (`"prepare": "husky"`); `git config core.hooksPath` ha de tornar `.husky/_`. El hook `.husky/pre-commit` executa, en ordre:

1. `tooling/gates/frontissa-contingut.mjs`, `porta-taxonomia.mjs --staged` i `porta-plantilla-viva.mjs --staged`.
2. `tooling/gates/git-staged.mjs`, que materialitza **l'arbre preparat** en un directori temporal i hi executa els passos següents.
3. `porta-documents.mjs --staged` i `tancament.mjs --check`.
4. `run-portes.mjs --nomes-portes`: 61 portes, ESLint inclòs (`npm run lint`, amb `--max-warnings=0`).
5. `teclat-superficies.mjs`, proves de teclat sobre components reals.
6. `npm run test:precommit`: escaneig de secrets literals, una selecció de Vitest i les proves Node de seguretat, migracions i documental.

Els límits de temps per pas són de 120 s, 600 s per a les portes i 300 s per a les proves (`TEMPS_PAS_MS`). **No ometes el hook** per a fer passar un canvi.

### Cadena completa i integració contínua

`tooling/gates/run-portes.mjs` (`npm run porta`) declara **65 passos**: 61 portes i 4 bateries de proves.

- **`--nomes-portes`:** les 61 portes, sense bateries.
- **`--cens`:** 60 portes sense parar a la primera roja; omet la Porta Build perquè pot escriure l'arbre.
- **`--diagnostic`:** 10 portes de només lectura; no autoritza cap commit ni desplegament.
- **`.github/workflows/wiki-integrity.yml`:** en cada push a `main` o `master` i en cada PR, executa `npm run test:ci`, `porta-documents.mjs`, `npm run porta -- --nomes-portes` i `npm run lint`.
- **`.github/workflows/sdp_lock_ci.yml`:** executa `npm run gate`, la cadena completa, en push i PR a `main`.

Este README no acredita el resultat de les últimes execucions de la CI: cal consultar-lo a GitHub.

### Proves

Les suites es compten amb ordres, no amb xifres copiades. Recompte d'este arbre, el 17-11-2026:

| Suite | Ordre | Fitxers |
| --- | --- | --- |
| Node (`node:test`) | `node tooling/tests/run-node-tests.mjs --list` | 381 classificats: `primary` 349, `laboratory` 18, `session` 14 |
| Vitest | `node node_modules/vitest/vitest.mjs list --filesOnly` | 2.391 |

Són **fitxers de prova, no casos**. `npm run test:ci` executa la suite Node `primary` i el Vitest sencer; el manifest de les suites és `tooling/tests/node-suite-manifest.json`.

### El que no és una porta

- **Skills:** `.agents/skills/` conté **procediments escrits per als agents d'IA**. Cap hook els executa. La porta «Segell de skills» (`tooling/gates/segella.mjs`) només comprova la integritat dels fitxers contra `.agents/SKILLS_SEAL.json`.
- **Informes i actes:** els documents de `_wiki_de_poble/` són evidència i context, no comprovacions.

## Canals de distribució

Un sol codi font genera quatre artefactes. Les ordres de build són a `package.json`.

| Canal | Build | Destí |
| --- | --- | --- |
| Web socdepoble.org | `npm run build:web` → `dist/` | Firebase Hosting, lloc `soc-de-poble` (`firebase.json`) |
| Mirall socdepoble.cat | Els mateixos fitxers de `dist/` | Node 0 (Caddy) darrere de Cloudflare |
| Connector WordPress | `npm run build:wp` i `npm run build:wp:directori` | `wordpress-plugin/`, publicat a WordPress.org com a `socdepoble` |
| App nativa | `npm run build:natiu` → `dist-natiu/`, `npx cap sync` | App Store (pública); Google Play encara no és pública |

`npm run build` encadena tokens, índexs, web, WordPress, SEO i prerender social.

### Web i Node 0

- **socdepoble.org:** `firebase.json` servix `dist/` amb reescriptura SPA, capçaleres de seguretat i fitxers estàtics de WebFinger, NodeInfo, ActivityPub i dades obertes.
- **socdepoble.cat:** el Node 0 servix una còpia dels fitxers del build i, a més, una API pròpia a `/api/v1/` i part de la federació (`tooling/node0/Caddy.node0.fragment`).
- **Còpia sense `--delete`:** el que es retira de socdepoble.org no desapareix sol del mirall (`tooling/seo/pla-de-retirada.mjs`).
- **PostgreSQL del Node 0:** hi carrega les migracions canòniques i les dades obertes públiques verificades (`tooling/node0/hidrata-postgres-node0.mjs`). No implementa Auth, Storage ni Realtime.

### Connector WordPress i el seu sostre d'arrencada

El connector (`wordpress-plugin/socdepoble-enxufe.php`, versió 1.1.15 en este arbre, AGPL-3.0-or-later) **no porta lògica de l'app**: traduïx els ajustos de WordPress al marcatge universal `<soc-de-poble>` i carrega `dist/soc-de-poble.standalone.js`.

- **Aïllament:** l'element munta l'app dins d'un Shadow DOM tancat (`attachShadow({ mode: 'closed' })` a `src/PedraSecaEmbed.jsx`).
- **Federació:** instal·lar el connector no convertix el WordPress en un node del Fedivers (`wordpress-plugin/readme.txt`).

El pes d'arrencada té **trinquets que només poden baixar** sense una decisió explícita:

| Mesura | Sostre | Font |
| --- | --- | --- |
| Carregador clàssic | 4.096 B | `LIMIT_DEL_CARREGADOR`, `vite.standalone.config.js` |
| Tros d'entrada | 1.690.000 B | `SOSTRE_DEL_TROS_D_ENTRADA`, `src/apps/plataforma/pesDelNucli.test.js` |
| Arrencada estàtica (entrada i trossos que importa) | 1.737.422 B | `SOSTRE_DE_L_ARRENCADA_ESTATICA`, mateix fitxer |
| Zip per al directori de WordPress.org | 10 MiB | `LIMIT_DIRECTORI`, `wordpress-plugin/eines/empaqueta.mjs` |

`tests/standalone-build.test.mjs` llig estos sostres i els comprova sobre el build real.

### App nativa

- **Identitat:** `org.socdepoble.app`, Capacitor 8.5.3 (`capacitor.config.json`). La versió i el build són a `package.json`, `android/app/build.gradle` i el projecte d'Xcode.
- **Botigues:** els scripts de pujada i preflight són a `scripts/botigues/`. Els canals que la web enllaça es declaren a `src/config/canalsDeBotiga.js`.
- **APK directe:** `scripts/botigues/publica-tot.mjs --publica-apk` copia l'APK signat i el seu `.sha256` a `dist/descarregues/`, després de `npm run build`. **Qui el servix és el Node 0**, no Firebase: `firebase.json` el deixa fora del paquet (`hosting.ignore`: `**/*.apk` i `**/*.apk.sha256`) i redirigix amb un 302 `/descarregues/socdepoble-android-latest.apk` i el seu `.sha256` a la mateixa ruta de `https://socdepoble.cat`. L'APK només arriba al Node 0 amb la còpia de `dist/` al mirall, que s'ha de fer **després** de `--publica-apk`; la recepta d'eixa còpia no és al repositori. L'adreça pública continua sent `https://socdepoble.org/descarregues/socdepoble-android-latest.apk`, i el canal continua tancat a `canalsDeBotiga.js` (`url: null`).
- **Cost de l'APK:** amb la redirecció, cada descàrrega des de socdepoble.org només costa a Firebase la resposta 302, no els 107 MB del fitxer. La tarifa pública de Firebase (consultada el 17-11-2026) dona 360 MB/dia sense cost i, al pla Blaze, factura l'excés per GB. El canvi val quan es desplega este `firebase.json`; fins llavors, Firebase continua servint l'APK. `curl -sI` del 17-11-2026 a socdepoble.cat: `200` amb `content-length: 107283534` per a l'APK i `200` amb `content-length: 96` per al `.sha256`. **Si el Node 0 cau, l'APK no es pot baixar** fins que torne: Cloudflare només ho pot pal·liar si en té una còpia (dues consultes del mateix dia van tornar `cf-cache-status: EXPIRED`).

## Nucli en producció i apps en fase beta

El **nucli** és el que servix socdepoble.org: les seccions de `src/sections/` (llevat de `gestoria`, que és de l'app Gestoria), la sessió, el xat, la federació estàtica i les dades obertes. Les **apps de `src/apps/`** són eines gratuïtes, actives per defecte i declarades en proves al seu manifest o al registre de plugins.

| App | Carpeta | Dades | Límit declarat |
| --- | --- | --- | --- |
| Gestoria de Poble | `src/apps/gestoria`, `src/sections/gestoria` | Al dispositiu | No és un sistema de facturació homologat |
| El Bar (TPV) | `src/apps/bar` | IndexedDB del dispositiu, sense sincronitzar | Cap tiquet és una factura |
| La Nevera de Casa (amb el Rebost) | `src/apps/nevera` | Magatzem local, sense crides de xarxa | Eina domèstica |
| Salut, Lector de notícies, Arbre Genealògic | `src/apps/salut`, `src/apps/lector`, `src/apps/genealogia` | Segons el seu manifest | Beta oberta |

Sobre la **Gestoria i Veri\*Factu**, el codi diu exactament això:

- **Preparació:** hi ha registres encadenats amb empremta, codi QR i un XML amb l'esquema de remissió de l'AEAT (`src/sections/gestoria/facturacio/registre/`).
- **XML de prova:** l'XML es marca `complet: false` i no s'envia enlloc (`xmlAeat.js`).
- **Pendent:** falten la remissió SOAP amb certificat, les respostes de l'AEAT i el bloc `SistemaInformatico`, que depén d'una declaració responsable del productor que encara no existix.
- **Conclusió:** ni la Gestoria ni El Bar són **sistemes informàtics de facturació Veri\*Factu ni TPV fiscals homologats**. Una associació o un negoci que en necessite un ha d'usar una eina certificada.

## Desenvolupament local

Node `^22.20.0 || ^24.12.0 || >=25.0.0` (`package.json`, `engines`; la CI usa la 22.20.0) i **npm**, que respecta `package-lock.json`.

```bash
npm ci
npm run dev
```

`npm run dev` obri Vite a `http://localhost:3340` amb `--strictPort`. La instal·lació només genera derivats ignorats i reproduïbles: no ha de canviar `package.json` ni l'índex de Git.

### Variables d'entorn

Crea un `.env.local` (ignorat per `.gitignore`) a partir de `.env.example`. El mínim per a parlar amb un Supabase:

```env
VITE_SUPABASE_URL=https://el-teu-projecte.supabase.co
VITE_SUPABASE_ANON_KEY=la-clau-publica-anon
VITE_TENANT_ID=uuid-del-poble
VITE_DATA_MODE=remote
```

La clau `anon` és pública i viatja dins del bundle; la protecció de les dades és l'RLS. **Mai** poses `service_role` en cap variable `VITE_`.

### Modes de dades

`VITE_DATA_MODE` (`src/config/dataMode.js`) admet tres valors; qualsevol altre, o cap, val `remote`.

- **`remote`:** mode per defecte. Llig i escriu al backend endollat.
- **`seed`:** pinta dades de llavor del codi, per a demostracions i proves ràpides.
- **`local`:** sense servidor i sense dades de llavor; només les pàgines del sistema.

Des de `seed` o `local`, entrar al compte passa el node a `remote` i recarrega la pàgina (`enterRemoteMode`). En desenvolupament, eixa elecció dura fins al pròxim `npm run dev`.

## Govern del repositori

El repositori el coediten persones i agents d'IA amb un protocol escrit a `AGENTS.md` i `.agents/`. Per a un canvi extern n'hi ha prou amb passar el hook; els documents de la Wiki tenen el seu propi circuit.

- **Torns:** `node tooling/gates/obrir_torn.mjs --actor NOM --scope code --output FITXER` obri un torn **en qualsevol invocació**, també amb `--help`.
- **Tancament:** `node tooling/gates/tancament.mjs --check` és lectura; `--close --turn-id ID` segella el LEDGER només si les portes passen. Este checksum no és una signatura d'identitat.
- **Documents:** `node tooling/wiki/document.mjs` crea i valida documents a partir de les plantilles de `.agents/protocolledge.json`.
- **Frontmatter:** l'esquema és `tooling/wiki/schema.json` (`wiki-frontmatter-v2.1`: tres claus obligatòries, `type`, `status` i `description`) i el vigila `tooling/wiki/tractor-frontmatter.mjs`. Les claus antigues `tipus` i `estat` només es toleren com a deute en fitxers que no es modifiquen.
- **Wiki dins de l'app:** `prebuild` compila `_wiki_de_poble/` a `src/data/wikiManifest.js` amb `tooling/wiki/compile-wiki-to-app.mjs`.
- **Dades privades:** la documentació interna d'una associació o d'un poble no es versiona ací; ha de viure en una carpeta fora del repositori.

## Llicència

El codi és **AGPL-3.0-or-later** (`LICENSE`, `package.json`): qui servisca una versió modificada a través de la xarxa n'ha d'oferir el codi font. El connector de WordPress porta la mateixa llicència, i les fonts Noto Sans que empaqueta van amb la SIL Open Font License 1.1 (`wordpress-plugin/readme.txt`).

## Vincles

- [[00_index]]
