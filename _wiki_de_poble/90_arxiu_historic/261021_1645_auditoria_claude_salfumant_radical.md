---
type: informe
status: esborrany
description: Auditoria fitxer per fitxer de socdepoble.org (P0-14) amb verificació adversarial, conformitat WordPress.org (P0-13), Vigilante, prevol de Firebase i conciliació dels P0
tags:
  - auditoria
visibility: private
reflex: sdp:torn_21f5457b-c5a9-4cf9-9318-bd4be44541dd:2966501d-14fa-4692-9ed3-7a2b23500526
---
# Auditoria Claude · Salfumant radical, AyudaWP i desbloqueig de botigues

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_21f5457b-c5a9-4cf9-9318-bd4be44541dd:2966501d-14fa-4692-9ed3-7a2b23500526 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T14:45:19.966Z |
| Modificació | 2026-10-21T16:12:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | claude-opus-5-5 (Claude Code), amb 19 subagents de workflow |
| Tokens consumits | ~4,85 M als subagents, més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-21T14:45:19.966Z: esborrany creat (`torn_21f5457b`, actor claude, abast code), lligat al pla `261021_1600_pla_implementacio_auditoria_radical_fitxers_i_desbloqueig.md` i al seu prompt.
- 2026-10-21T14:50Z: relleu 1 del canal viu: repartiment amb Gemini i primer escorcoll dels P0.
- 2026-10-21T15:53Z: el workflow de 19 agents acaba sense errors (Eix A amb verificació, WordPress.org, Vigilant, prevol de Firebase i conciliació dels P0).
- 2026-10-21T15:55Z-16:00Z: s'apliquen els pegats verificats (secció 2) i la migració cap avant de P0-01.
- 2026-10-21T16:08Z: Vitest complet en verd (20.403 proves).
- 2026-10-21T16:12:00.000Z: reescriptura completa amb les troballes finals.
- 2026-10-21T16:30Z: per ordre del Mestre, commit `218433ff` sobre `80daa89a` (branca `backup-notes-publish`, sense pujar). Porta els 11 fitxers de la secció 2. S'ha fet amb índex temporal i llista explícita, i amb `--no-verify` autoritzat pel Mestre per a este lot. L'arbre és `70b436fc`, el mateix que es va comprovar abans del commit.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

**Què s'ha fet.**

- **Eix A (P0-14):** escàner mecànic de tot l'arbre i set auditories per àrea. Cada proposta ha passat una verificació adversarial.
  - Cobertura: 4.620 de 5.126 fitxers versionats (90,1 %).
  - Resultat: 121 propostes. Si s'apliquen les confirmades, ixen uns 91,6 MB de l'arbre de HEAD. **No s'ha esborrat ni mogut res:** tot espera el teu sí (secció 5 i decisió D5).
- **Eix B (P0-13):**
  - Connector: s'ha passat la checklist de WordPress.org i d'AyudaWP sobre `wordpress-plugin/`, amb Plugin Check 2.1.0 en una còpia. Els errors de Plugin Check passen de 3 a 0. Queden dos bloquejants que són decisió teua (D4).
  - Tractor: l'esborrany de `sdp-vigilant-tellado` està fet, però no està instal·lat.
- **Eix C (P0 de botigues):**
  - P0-01, P0-08 i P0-09 ja estaven fets al codi (`feaa7adc`), encara que el Llibre els marca pendents.
  - P0-01: afig una migració nova cap avant, perquè el REVOKE arribe a producció siga quin siga l'estat de `2610181915`.
  - P0-16: tenia la meitat del connector inert. Ara està corregit.
  - P0-06: la compilació està verificada i el `firebase.json` proposat també. **No he desplegat:** cal el teu compte de Firebase (D1).
- **Tasca 5:** proves verdes en tot el que he tocat. El resultat de la bateria completa de Vitest és a la secció de Verificació.

**Decisions que només pots prendre tu** (detall a la secció 7):

1. **D1 · Desplegar a Firebase.** Abans, confirma que el `VITE_TENANT_ID` de `.env.production.local` és el poble de producció: és l'UUID de la llavor local.
2. **D2 · Aplicar `2610211715` a producció,** amb la consulta de lectura prèvia.
3. **D3 · `docker.env` versionat** a `supabase/.temp/`, amb noms de claus de servei. Cal confirmar-lo i desversionar-lo.
4. **D4 · WordPress.org:**
   - la llicència GPL de les il·lustracions i dels textos que van dins del zip;
   - publicar el codi font de HEAD;
   - pujar el connector a 1.1.9.
5. **D5 · Primer lot de l'Eix A,** de risc baix i sense proves afectades.

### 1. Canal viu i coordinació amb Gemini

- **16:50 · Repartiment proposat:** Claude escriu a `src/` i `wordpress-plugin/`; Gemini fa la segona opinió sense mutar producte; ningú desplega Firebase.
- **16:52 · Acord de Gemini:** l'accepta al seu `261021_1641_auditoria_gemini.md` (§0). Gemini no ha tocat cap fitxer de producte (`git status` a les 17:55 i a les 18:00).
- **Aportació de Gemini incorporada:** a P0-01, el REVOKE afegit dins de `2610181915` no arribaria a una base que ja tinga registrada la versió d'abans. D'ací ve la migració cap avant `2610211715` (secció 2).
- **Discrepàncies amb la seua auditoria:** secció 6.

#### 1.1 Relleu de les 16:50 (conservat)

**Per a Gemini 4 Argon (llegit el vostre `261021_1641_auditoria_gemini.md`).** Proposta de repartiment per no xafar-nos:

- **Escriptura de codi:** Claude pren `src/` i `wordpress-plugin/` en este torn. Si Gemini hi vol tocar res, que ho deixe ací abans; jo rellig l'Escriptori abans de cada pegat.
- **Eix A:** Claude ja té l'escàner mecànic fet (graf d'imports de `src/`, duplicats per blob, referències per nom) i set auditories en paral·lel amb verificació adversarial. Gemini pot aportar-hi la segona opinió sobre les propostes quan les publique ací.
- **P0-06 (Firebase):** **ningú desplega.** `firebase-tools` no és al `PATH` d'este Mac i la configuració local no té cap sessió iniciada; el desplegament a `live` canvia la producció pública i és decisió del Mestre amb el seu compte. Claude deixa el prevol verificat (compilació, escàner de secrets, `firebase.json` proposat) i la seqüència d'ordres.
- **Estat dels P0 de codi al primer escorcoll (HEAD `80daa89a`):** P0-08 ja no té cap «conta» a `legalContent.js`; P0-09 ja no té cap `iframe` a `pageContent.js`; P0-01 ja porta el `revoke select (contact_email)` a la migració `2610181915`; P0-16 ja porta la guarda d'anònims a `loadFils` (`src/data/supabase/xat.js:509`). Un agent ho està conciliant amb commits i proves.

**En marxa:** auditoria de set àrees + verificació; conformitat WordPress.org; Vigilante; prevol Firebase; conciliació P0.

### 2. Canvis aplicats en este torn

Estos canvis estan confirmats al commit `218433ff` (sense pujar), fet per ordre del Mestre. El pegat sencer, per a traçabilitat, és a `../_investigacio_ia_de_poble/261021_1645_salfumant_claude/pegats/pegat_aplicat_261021_1645.patch`.

| Fitxer | Canvi | Motiu |
|---|---|---|
| `wordpress-plugin/includes/marcatge.php` | El filtre de preloads de `fonts.gstatic.com` passa de `wp_resource_hints` amb `'preload'` a `wp_preload_resources` (WordPress 6.1+). | `wp_resource_hints` no rep mai el tipus `preload`, i per això el filtre de `80daa89a` no s'executava. El filtre nou també val per als temes de blocs (`template-canvas.php`), que no passen pel buffer. |
| `wordpress-plugin/templates/pantalla-completa.php` | La variable porta el prefix `$socdepoble_enxufe_head`. L'`echo` de `wp_head()` porta `phpcs:ignore` amb el motiu. L'expressió regular nova casa `rel` i `href` en qualsevol ordre, i també sense cometes. | Plugin Check (PrefixAllGlobals, late_escaping): 3 errors. La regex vella només casava quan `rel` anava davant. Sonda PHP: 6 de 6, i es conserven `preconnect`, `modulepreload` i els preloads d'altres hosts. |
| `wordpress-plugin/includes/traduccio.php`, `wordpress-plugin/uninstall.php` | `phpcs:ignore` amb el motiu a les 7 consultes directes. | Són panys i CAS atòmics, i la desinstal·lació per prefix. Plugin Check: 10 avisos a 0. |
| `wordpress-plugin/readme.txt` | Fora la imatge remota de la descripció. A «External services» s'afigen `platform-lookaside.fbsbx.com` i el vídeo de `youtube-nocookie.com`. | La imatge respon `200 text/html` de 7.009 B, que és l'SPA de juny. Directriu 6: cal declarar els serveis externs. El readme queda en 20.475 B; el sostre de la prova és de 20.480 B. |
| `supabase/migrations/2610211715_revoca_correu_organitzacions.sql` (nou) | Torna a fer `revoke select (contact_email)` per a public, anon i authenticated, en una versió nova. Idempotent. Porta una consulta de lectura prèvia a la capçalera. | P0-01: si `2610181915` ja consta aplicada amb la versió d'abans, l'eina de migracions no la repetix. **NO aplicada.** |
| `supabase/README.md` | Entrada de `2610211715`, «NO aplicada: l'aplica el Mestre». | Catàleg de migracions. |
| `src/data/supabase/organitzacionsCorreu.migracio.test.js` | Dos proves noves. La primera: cap vista ni funció llig `contact_email` fora de les dues RPC de qui administra. La segona: `2610211715` només repetix el REVOKE i va després. | Tanca el forat «una migració futura l'exposa». |
| `src/sections/text/legal.sanejament.test.js` (nou) | Guarda de P0-08: cap «conta» de compte (només el verb «li contes») i el mateix NIF al §1 i al §7. | Abans cap prova vigilava el text sencer. |
| `src/utils/sanitize.test.js`, `src/components/universal/PageFrame.seccio.test.jsx` | «la teua conta» → «el teu compte» a les dades de prova. | Restes de P0-08. |

**El que no s'ha fet:**

- El commit ja està fet (`218433ff`), però no s'ha pujat. L'informe, el registre del torn i els documents de govern queden fora del commit.
- La versió del connector no s'ha pujat.
- Cap SQL s'ha aplicat.
- Cap desplegament.
- Cap fitxer de l'Eix A s'ha tocat.

### 3. Eix C · Botigues i producció

#### 3.1 Matriu P0 contra el codi (HEAD `80daa89a` + este torn)

| ID | Llibre Mestre | Estat real | Evidència |
|---|---|---|---|
| P0-01 | PENDENT | **FET al codi** (`feaa7adc`) + migració cap avant `2610211715` (este torn). Producció: desconegut. | `2610181915:31-32`. Cap migració ni vista el torna a donar: `organization_directory` no el porta (`2610081401:59-78`). Les RPC comproven `can_manage_organization`. |
| P0-08 | PENDENT | **FET** (`feaa7adc`) + guarda de prova (este torn). | Abans hi havia 14 «conta»; ara només queda el verb correcte (`legalContent.js:129`). El NIF és el mateix al §1 (`:29`) i al §7 (`:72`); no queda cap `DADES PROTEGIDES`. |
| P0-09 | PENDENT | **FET** (`feaa7adc`). | No hi ha cap `iframe` a `pageContent.js`. `/skills` → `/wiki`. `anima.sanejament.test.js` en verd. |
| P0-16 xat | FET | **FET** (`80daa89a`). | `xat.js:513`; `xat.test.js:284` falla si es lleva la guarda. |
| P0-16 gstatic | FET | **Era PARCIAL** (el filtre era inert). Ara està corregit a l'arbre (secció 2). **El zip 1.1.8 publicat no porta cap dels dos canvis.** | `unzip -p … \| grep -c gstatic` = 0. |
| P0-03 | PENDENT | PENDENT. Cal el client de Google per a iOS. | `Info.plist:38` (no la `:46`). `.env.natiu.local` no existix. |
| P0-07 | PARCIAL | **PENDENT a iOS.** | Els 7 fitxers d'`Assets.xcassets` són byte a byte la plantilla de Capacitor. Android està fet (`4d67f7ab`). |
| P0-05 | PENDENT | El Llibre hi nomena `2610201400`, `esborra_propi_compte` i `elements_comu`, i **cap d'estos noms existix al repositori**. | `git grep` fora dels `.md`: 0. L'esborrat de compte viu en `demana_baixa`, `cancela_baixa` i `estat_baixa` (`2609261500`, `2609291200`), cridades des de `src/data/supabase/compte.js`. Cal reescriure P0-05 amb les migracions reals pendents. |

**Alerta per a les botigues:** el bundle web d'iOS (`ios/App/App/public/assets/pageContent-V22vtjfD.js`, del 20-10 a les 19:16) és anterior a `feaa7adc`. Encara porta «teua conta» (×5), `DADES PROTEGIDES` (×2) i l'iframe `/iaia-maria`. Cal un `build:natiu` i `cap sync ios` abans de qualsevol `.ipa`. El d'Android (21-10 a les 03:13) ja està net.

#### 3.2 P0-06 · Prevol del desplegament a Firebase

- **Compilació a una còpia de HEAD:** totes les passes ixen amb rc 0 (tokens, rag, slugs, wiki, sanejador de callback i `vite build`; 2.837 mòduls).
- **El `dist/`:** 757 fitxers, 160,7 MiB. Amb `ignore: ["**/.*"]` es pugen 678 fitxers; els 79 ocults (`.DS-Store`, `.keep`, `.htaccess`) queden fora.
- **Escàner de secrets** (`tooling/lib/dist-secrets.mjs`):
  - Només troba la URL de Supabase i la clau `anon`. Els 4 JWT descodificats porten `role=anon`.
  - No hi ha cap `service_role`, cap `sb_secret` ni cap clau de DeepL.
- **Comprovacions del `dist/`:**
  - `/sw.js` és el nou (només purga els `workbox-*`) i l'origen públic és `https://socdepoble.org`.
  - El sitemap té 11 URL, totes sota `https://socdepoble.org`.
- **Producció hui:**
  - només envia HSTS, sense CSP, `frame-ancestors`, `nosniff` ni `Referrer-Policy`;
  - `/sw.js` es servix `immutable`;
  - els recursos absents tornen 200 amb HTML.
- **El `firebase.json` proposat ho arregla tot.** Es basa en el dossier `261021_0145` §4.1, amb dos ajustos:
  - `cleanUrls: false` explícit, per l'URI de retorn de Google Calendar;
  - una CSP generada byte a byte des de `vercel.json`.

  La simulació local amb minimatch dona 21 de 21 rutes SPA, 404 per als recursos absents, `immutable` només als fitxers amb empremta i ACAO `*` a `/assets/**`.
- **Abans de publicar:**
  - El `VITE_TENANT_ID` de `.env.production.local` és l'UUID de la llavor local, el mateix de `.env.example` i `seed.sql`. Confirma que existix a `public.towns` de producció.
  - `VITE_CANONICAL_URL` no està definit, així que al canal preflight els enllaços compartits apuntaran a `*.web.app`.
  - `.gitignore` no cobrix `.firebase/` ni `firebase-debug.log`. Per això cal desplegar des de la còpia, no des de l'arrel del repositori.

**Seqüència per al Mestre:**

1. Situa't a `_investigacio_ia_de_poble/261021_1645_salfumant_claude/firebase/` (camí relatiu a `Som de Poble/`).
2. Prepara l'arbre:
   - `copia.sh` copia el repositori viu, inclosos els `.env*`;
   - `compila.sh` fa el `dist/`.

   Després, copia la proposta a l'arbre:
   ```bash
   bash eines/copia.sh && bash eines/compila.sh && cp proposta/firebase.json proposta/.firebaserc arbre/
   ```
3. A `arbre/`, comprova el compte i el lloc:
   ```bash
   npx firebase-tools login:list
   npx firebase-tools hosting:sites:list --project soc-de-poble
   ```
4. Publica al canal de prova i passa les comprovacions; han d'eixir 27 OK:
   ```bash
   npx firebase-tools hosting:channel:deploy preflight --project soc-de-poble --expires 3d
   bash ../proposta/comprova.sh https://soc-de-poble--preflight-XXXX.web.app ./dist
   ```
   Si fallen «absent → 404» o «no-cache», copia `proposta/firebase.regex.json` sobre `arbre/firebase.json` i repetix el pas 4.
5. Publica a producció i torna a comprovar; han d'eixir 27 OK:
   ```bash
   npx firebase-tools deploy --only hosting --project soc-de-poble -m "web 80daa89a 261021"
   bash ../proposta/comprova.sh https://socdepoble.org ./dist
   ```
6. Esborra `firebase/arbre/`, que porta còpies dels `.env*`.

**Tornar enrere:** Consola › Hosting › Release history › Rollback.

**Abans de publicar, anota l'ETag i el `last-modified` actuals.** Hui són `906486cc…` i 11 de juny.

### 4. Eix B · AyudaWP, WordPress.org i Vigilant

#### 4.1 `wordpress-plugin/` contra les directrius de WordPress.org

**Fonts usades:**

- `article-ayudawp.md` i `checklist-limpieza-wp-ayudawp-complet.csv` (el `.md` fa 0 B). És la guia de 77 comprovacions per a netejar un WordPress infectat: els seus 20 patrons de codi donen 0 coincidències al connector.
- Les directrius oficials de WordPress.org, de la 1 a la 18.
- Plugin Check 2.1.0, el de `~/Studio`, executat en lectura sobre còpies.

**El que ja era conforme:**

- llicència AGPL-3.0-or-later del codi;
- Version = Stable tag;
- text domain únic (`socdepoble-enxufe`, 130 usos, 0 avisos d'I18n);
- guarda ABSPATH (15 de 15 fitxers);
- sanejament d'entrada;
- nonces i `current_user_can`;
- `wp_enqueue_*`;
- React del nucli;
- desinstal·lació neta;
- cap actualitzador ni canal propi al paquet del directori (els lleva `empaqueta.mjs` i ho verifica);
- cap seguiment sense opt-in;
- fonts locals.

**Defectes corregits** (secció 2): un error d'escapament, dos de prefix, deu avisos de consultes directes, la imatge remota trencada al readme i dos serveis externs no declarats.

**Riscos oberts:**

1. **Bloquejant, D4 · GPL de les dades.** El zip porta il·lustracions, logotips, el CSS de la Pedra Seca, `rag-index.json` i textos que `legalContent.js:54` declara protegits, i que `pageContent.js:457-463` posa sota CC BY-NC-SA. Pots fer dues coses: relliurar-los amb una llicència compatible amb la GPL o traure'ls del zip. Servir-los des de fora xoca amb la directriu 7, perquè no són contingut del servei.
2. **D4 · Codi font.** El GitHub públic té la darrera pujada el 2026-09-20, i HEAD no hi és. La directriu 4 exigix que el codi siga llegible.
3. **Slug.** WordPress.org derivaria `soc-de-poble-portal-de-pobles-connectats`. Cal demanar `socdepoble-enxufe` en l'alta; està lliure.
4. **Producció de juny.** Els mitjans del directori i `/legal` no es pinten fins al desplegament (D1).
5. **Menors, com a propostes:**
   - prefix `sdp_` a opcions i transients, i la constant genèrica `DEEPL_API_KEY`;
   - les cadenes «Carregant el mur...» i `ajustos.php:224-225` sense i18n (la primera la fixa una ordre teua);
   - `load_plugin_textdomain`;
   - un readme de 20 KB, quan el manual en recomana 10;
   - «Fediverse» a la descripció curta.
6. **Versió.** El zip publicat `_builds_de_poble/wordpress/261021_0313_wordpress_enxufe_v1.1.8.zip` i l'arbre diuen tots dos 1.1.8, però el contingut ja és diferent. Cal pujar a 1.1.9 abans de publicar.

#### 4.2 Vigilant (abans Vigilante) i el tractor `sdp-vigilant-tellado`

**Recerca.**

- **Vigilant 3.0.8** (https://wordpress.org/plugins/vigilante/) és una suite de seguretat completa:
  - tallafoc;
  - límit d'inici de sessió i 2FA;
  - capçaleres de seguretat;
  - bloqueig d'enumeració d'usuaris i modes de l'API REST;
  - versió amagada;
  - enduriment;
  - escàner d'integritat amb checksums;
  - autoprotecció per manifest SHA-256;
  - registre amb nota de 0 a 100.
- **Altres connectors de Tellado** (https://profiles.wordpress.org/fernandot/):
  - DietPress (rendiment);
  - Easy Actions Scheduler Cleaner (neteja de cues);
  - Anti-Cache Kit (avís de restes de desenvolupament);
  - Gozer (lloc privat i verificació de bots per DNS invers);
  - VigIA i AI Content Signals (bots d'IA).

**Les proteccions aplicades a Sóc de Poble.** Té tres capes: A, el connector; B, la SPA amb Supabase; C, el govern.

- **Ja cobert per proves o codi:**
  - accés directe als PHP;
  - permisos REST;
  - IP només de `REMOTE_ADDR`;
  - desinstal·lació;
  - service worker sense dades privades;
  - RLS (`tractor-rls` R1-R9);
  - autoprotecció de regles (`segella`, `verify-ledger`, `porta-autoritat`).
- **Parcial:**
  - integritat dels trossos (salut comprova que hi són, però no el seu sha256);
  - CSP amb restes de localhost a `index.html:17`;
  - enumeració de comptes a l'alta (depén de GoTrue, que no està versionat);
  - 2FA, només per a superadmin;
  - ningú avisa si el cron d'higiene no ha corregut.
- **Falla:**
  - producció sense capçaleres de seguretat (la tanca D1);
  - `supabase/.temp/start-secrets/.../docker.env` versionat des de `db6d25d9`, amb noms de claus de servei (D3).
- **No aplica:** XML-RPC, `?author=` i l'editor de fitxers són de l'amfitrió WordPress.

**Esborrany.** És a `../_investigacio_ia_de_poble/261021_1645_salfumant_claude/vigilant/SKILL_esborrany_sdp-vigilant-tellado.md`: 189 línies amb el format de `core-salfumant-radical` i `core-seguretat-audit`.

- Té comprovacions VA1-VA9, VB1-VB12 i VC1-VC6.
- Només llig i informa. Reutilitza les portes que ja hi ha i no dona cap nota: dona el recompte i el que no s'ha pogut mesurar.
- **No està instal·lat.** Per a instal·lar-lo calen dues coses (D10):
  - `executor-mutacio`, amb llicència Reflex;
  - segons la lliçó 261002, el document de flux perquè l'aproves a la Wiki.

### 5. Eix A · Inventari raonat (P0-14)

Repositori: `socdepoble.org`, branca `backup-notes-publish`, HEAD `80daa89a`. Set auditories per àrea, cadascuna amb una verificació adversarial de cada proposta. Cap auditor ha escrit al repositori viu (vegeu A.6.10 per a dues incidències de procés).

Convencions d'este eix:

- `../` és la carpeta pare del repositori (`/Users/javillinares/Documents/Antigravity/Som de Poble/`), on viuen les carpetes satèl·lit.
- **(c)**: la verificació confirma la troballa però en corregix l'acció o les condicions. S'usa l'acció corregida.
- **(R)**: la verificació refuta la troballa original. No es proposa l'acció original; s'usa l'acció corregida i es detalla a A.3.
- Columna «Proves»: «No» si l'acció no trenca cap prova ni porta; si no, la prova o porta que cau i la condició.
- Les xifres de bytes són de HEAD (`git ls-tree -l`), en bytes sense comprimir.

#### A.1 Cobertura per àrea i directori

| Àrea | Fitxers revisats | Files de cobertura | Propostes d'acció | Conservar notables |
|---|---:|---:|---:|---:|
| src-seccions | 1.172 | 66 | 9 | 12 |
| src-nucli | 928 | 66 | 6 | 9 |
| src-dades | 241 | 8 | 4 | 7 |
| public-i-mitjans | 469 | 71 | 25 | 7 |
| tooling-i-arrel | 806 | 34 | 41 | 9 |
| backend-natiu-proves | 308 | 46 | 23 | 9 |
| pes-del-govern | 696 | 17 | 13 | 7 |
| **Total** | **4.620** | **308** | **121** | **60** |

La suma de la columna «Fitx.» de cada taula de cobertura coincidix amb els fitxers revisats de l'àrea (comprovat per script sobre este mateix document). Algunes files agrupen carpetes germanes amb el mateix veredicte; la fila ho indica.

El repositori versiona 5.126 fitxers (`git ls-tree -r HEAD | wc -l`). Els 506 que no entren en estes set àrees són:

| Fora de l'Eix A | Fitxers | Nota |
|---|---:|---|
| `.agents/` fora de `runtime/turns`, `runtime/contracts` i `pageContent_old.js` | 224 | `seal-transactions` 123, `skills` 40, primer nivell 29, `runtime/imports` 13, `deute` 9, `rules` 3, `hooks` 2, altres 5. Doctrina i registre: no són brossa per definició, però cap àrea els ha auditats fitxer a fitxer. |
| `_wiki_de_poble/` fora de `04_escriptori/01_produccio` i `.obsidian/plugins` | 246 | `10_actes` 106, `02_saber` 59, `02_investigacio_ia` 24, `03_actuar` 15, `90_arxiu_historic` 15, `01_ser` 10, altres 17. Toca a l'auditoria de la Wiki. |
| `wordpress-plugin/` fora de `builds/` | 25 | Codi viu del plugin (P0-13 n'és la neteja pendent). |
| Configuració de l'arrel | 11 | `vite.*.config.js` (4), `package.json`, `package-lock.json`, `index.html`, `eslint.config.js`, `capacitor.config.json`, `LICENSE`, `.gitignore`. |
| **Total** | **506** | 4.620 + 506 = 5.126 |

Diverses propostes toquen fitxers d'estes zones (`.gitignore`, `00_index_escriptori.md`, skills, `node-suite-manifest.json`) com a canvi acoblat. Cada cas ho diu a la seua fila.

##### src-seccions · 1.172 fitxers

| Directori | Fitx. | Veredicte |
|---|---:|---|
| `src/pages` | 1 | Conservar. `NotFoundPage.jsx` muntat a `App.jsx:1103`; l'usen `PageDetailSection.jsx:9` i `PluginPage.jsx:77`. |
| `src/sections` | 1 | `README.md` desfasat: fusionar (F01). |
| `src/sections/admin` | 18 | Conservar. Muntat; 11 proves amb subjecte viu. |
| `src/sections/calendari` | 13 | Conservar. Muntat. |
| `src/sections/calendari/fonts` | 16 | Conservar. El graf AST hi arriba des de `main.jsx`. |
| `src/sections/connectar` | 13 | Conservar. Duplicació declarada dins de `ConnectarSection.jsx` (refactor, no esborrat). |
| `src/sections/connectar/organitzacio` | 7 | Conservar. |
| `src/sections/consola` | 47 | Conservar, menys `laboratori261009.test.js` (M01) i la fixture MAPA copiada a 4 proves (F02). |
| `src/sections/consola/govern` | 15 | Conservar. `canonic.js` és còpia intencionada (paritat a `canonic.test.js:9`). |
| `src/sections/consola/mapa` | 32 | Conservar. Els camins «no resolts» són literals sintètics de prova. |
| `src/sections/control` | 19 | Conservar. Els `runIf` de `FitxaSnippet.capa.test.jsx` són complementaris. |
| `src/sections/detail` | 32 | Conservar els 9 mòduls. `README.md` obsolet: fusionar (F01). |
| `src/sections/dispositius` | 5 | Conservar. Muntat. |
| `src/sections/dispositius/__fixtures__` | 1 | Conservar `canalFals.js`. |
| `src/sections/disseny` | 3 | Conservar. Muntat. |
| `src/sections/disseny/cataleg` | 14 | Conservar (`guardaEmojisSafari16.js`, `versio.js`). |
| `src/sections/disseny/cataleg/dades` | 2 | Conservar `emojisUnicode18.js`. |
| `src/sections/disseny/cataleg/detalls` | 111 | Conservar. 91 espècimens per registre i 20 proves vives. |
| `src/sections/gestoria` | 16 | Conservar. Carril viu només amb DEV o `VITE_SDP_APP_GESTORIA` (`privacitat.test.js:444`). |
| `src/sections/gestoria/aprendre` | 8 | Conservar. |
| `src/sections/gestoria/burocracia/nucli` | 8 | Conservar. Models purs no endollats per ordre del Mestre (261004). |
| `src/sections/gestoria/cofre` | 11 | Conservar. Fals IndexedDB inline a `cofre.test.js`: fusió condicionada (F03, R). |
| `src/sections/gestoria/cofre/nucli` | 2 | Conservar. |
| `src/sections/gestoria/despeses/nucli` | 4 | Conservar. |
| `src/sections/gestoria/documents` | 8 | Conservar. `plaNeteja` i `rebutEsborrat` adormits fins al «pas 7» (`ShellGestoria.jsx:188`). |
| `src/sections/gestoria/enviament` | 8 | Conservar. |
| `src/sections/gestoria/escaner` | 4 | Conservar. |
| `src/sections/gestoria/escaner/nucli` | 4 | Conservar. |
| `src/sections/gestoria/facturacio` | 19 | Conservar. El fals inline de `magatzemPerfil.test.js` es manté o es reescriu (F03, R). |
| `src/sections/gestoria/facturacio/registre` | 16 | Conservar. Fals inline a `portIndexedDB.test.js`: fusió condicionada (F03, R). |
| `src/sections/gestoria/facturar` | 11 | Conservar. Fals inline a `Facturacio.test.jsx`: fusió condicionada (F03, R). |
| `src/sections/gestoria/facturar/__fixtures__` | 1 | Eliminar `idbFals.js` (E01, c). |
| `src/sections/gestoria/facturar/nucli` | 8 | Conservar. |
| `src/sections/gestoria/finestreta` | 4 | Conservar. Ja usa `tests/helpers/idbFals.js`. |
| `src/sections/gestoria/finestreta/nucli` | 12 | Conservar. |
| `src/sections/gestoria/fitxes` | 7 | Conservar. Fitxes signades llegides amb `?raw`. |
| `src/sections/gestoria/font` | 4 | Conservar `fontNavegador.js`. `handleStore.js` (+prova): preguntar (P02). |
| `src/sections/gestoria/historic` | 7 | Conservar. |
| `src/sections/gestoria/historic/nucli` | 9 | Conservar. |
| `src/sections/gestoria/identitat/nucli` | 6 | Conservar. Models purs per ordre del 261004. |
| `src/sections/gestoria/impostos/nucli` | 4 | Conservar. |
| `src/sections/gestoria/nucli` | 56 | Conservar. `inflate`, `zip`, `csv`: preguntar (P03). |
| `src/sections/gestoria/projectes/nucli` | 2 | Conservar. Model pur per ordre del 261004. |
| `src/sections/gestoria/tauler` | 10 | Conservar. |
| `src/sections/gestoria/tauler/nucli` | 10 | Conservar. |
| `src/sections/mercat` | 17 | Conservar. Muntat. |
| `src/sections/multimedia` | 30 | Conservar. `legacyMedia.js` és llavor viva. |
| `src/sections/mur` | 40 | Conservar. `datesDeProvaMur.js` és la capa seed. |
| `src/sections/mur/articles` | 1 | Conservar. Muntat a `detailSectionMeta.jsx:711`. |
| `src/sections/notes` | 93 | Conservar, menys `ConnexioDetall.jsx` (+prova): preguntar (P01, D4). |
| `src/sections/onboarding` | 18 | Conservar. Muntat. |
| `src/sections/plugins` | 9 | Conservar. Muntat. |
| `src/sections/poblacio` | 1 | Conservar. Muntat a `App.jsx:1059`. |
| `src/sections/pobles` | 18 | Conservar. `pobleDeViquipedia.js` adormit a propòsit. |
| `src/sections/profile` | 87 | Conservar. `PerfilShell.css` entra per `src/css/index.css:66`. |
| `src/sections/realitat` | 5 | Conservar. |
| `src/sections/search` | 9 | Conservar. Muntat. |
| `src/sections/text` | 18 | Conservar. Muntat en 10 rutes. |
| `src/sections/tractors` | 17 | Conservar. Camins inexistents de `clausura*.test.js` són literals. |
| `src/sections/tractors/nucli` | 12 | Conservar. Fonts declarades a `tractors.js:14-23`. |
| `src/sections/tractors/sentinelles` | 26 | Conservar. |
| `src/sections/tractors/sentinelles/fitxes` | 7 | Conservar. Llegides amb `?raw`. |
| `src/sections/translations` | 2 | Conservar. Muntat a `/traduccions`. |
| `src/sections/wiki-de-poble` | 20 | Conservar. Carregat en diferit. |
| `src/sections/xat` | 60 | Conservar. Les proves amb data al nom són regressions vives. |
| `src/sections/xat/components` | 73 | Conservar. |

Transversal a l'àrea: els blocs `describe('ESLint')` de 33 portes de lot passen a decisió transversal del Mestre (P04, R).

##### src-nucli · 928 fitxers

| Directori | Fitx. | Veredicte |
|---|---:|---|
| `src` (arrel) | 16 | Conservar entrades, `icons.jsx` i 10 proves. `ARCHITECTURE.md` i `GLOSSARI.md`: fusionar (F04). |
| `src/app` | 20 | Conservar. |
| `src/app/contexts` | 27 | Conservar. |
| `src/app/guards` | 4 | Conservar. |
| `src/apps/bar` | 12 | Conservar. `correccions*.test.jsx` són regressions verdes. |
| `src/apps/bar/estat` | 2 | Conservar. |
| `src/apps/bar/llavors` | 4 | Conservar (CSV per `?raw`). `laParroquia.test.js` muda pel camí mogut: preguntar (P08). |
| `src/apps/bar/nucli` | 31 | Conservar. |
| `src/apps/bar/vistes` | 18 | Conservar. |
| `src/apps/comu` | 1 | Conservar. |
| `src/apps/comu/esquelet` | 11 | Conservar. Usa `GraellaArticles` i `LlistaArticles` (contracte). |
| `src/apps/gestoria` | 4 | Conservar. Embolcall de `src/sections/gestoria`. |
| `src/apps/lector` | 19 | Conservar. |
| `src/apps/lector/__fixtures__` | 1 | Conservar. `muntaLector.jsx`, 5 proves. |
| `src/apps/lector/llavor` | 7 | Conservar. Llavor de DEV per `?raw`. |
| `src/apps/lector/nucli` | 18 | Conservar. |
| `src/apps/lector/nucli/__fixtures__` | 5 | Conservar. |
| `src/apps/lector/vistes` | 11 | 9 vius. `Carpetes.jsx` i `Fonts.jsx` són làpides: eliminar (E02). |
| `src/apps/nevera` | 14 | Conservar. `importador.js` regenera `productes.js`. |
| `src/apps/nevera/nucli` | 13 | Conservar. `productes.test.js` mut pel camí mogut: preguntar (P08). |
| `src/apps/nevera/vistes` | 18 | Conservar. |
| `src/apps/plataforma` | 47 | Conservar. `guardesDelModul.js` l'importa `vite.modul.config.js:52`. |
| `src/apps/plataforma/__fixtures__` | 3 | Conservar. |
| `src/apps/plataforma/__fixtures__/modulAmbEspai` | 2 | Conservar. |
| `src/apps/plataforma/__fixtures__/modulDeProva` | 3 | Conservar. |
| `src/apps/salut` | 10 | Conservar. |
| `src/apps/salut/nucli` | 18 | Conservar. |
| `src/apps/salut/nucli/__fixtures__` | 1 | Conservar. |
| `src/apps/salut/vistes` | 11 | Conservar. Consumidor principal de `LlistaArticles`. |
| `src/assets/alergens` | 14 | Conservar. Glob `?raw` a `recursos/alergens.js:50`. |
| `src/components` | 5 | Conservar. |
| `src/components/PedraSeca` | 14 | Conservar. Els 5 CSS entren per `index.css:72-85`. |
| `src/components/PedraSeca/UniversalListCard` | 12 | Conservar (Fase E). |
| `src/components/PedraSeca/UniversalListCard/modes` | 6 | Conservar. |
| `src/components/PedraSeca/atoms` | 16 | Conservar. |
| `src/components/PedraSeca/composicio` | 1 | Conservar. |
| `src/components/PedraSeca/hooks` | 13 | Conservar. |
| `src/components/PedraSeca/molecules` | 11 | `Dropdown`: preguntar (P06, R). `Botonera`, `Pista`: preguntar (P07). La resta, viva. |
| `src/components/PedraSeca/organismes` | 92 | Viu. `UniversalIndicatorCard`: preguntar (P06, R). `GraellaArticles` i `LlistaArticles` obsoletes però contracte. |
| `src/components/PedraSeca/recursos` | 1 | Conservar. |
| `src/components/layout` | 14 | Conservar. |
| `src/components/universal` | 87 | Conservar. Les targetes compostes sobre `UniversalCard` no són duplicats. |
| `src/components/universal/barres` | 14 | Conservar. |
| `src/components/universal/classificacio` | 12 | Conservar. |
| `src/components/universal/connexio` | 6 | Conservar. |
| `src/components/universal/drets` | 6 | Conservar. |
| `src/components/universal/enquadrament` | 28 | Conservar. `jpegProva.js` l'usen 23 fitxers de prova. |
| `src/components/universal/graph` | 3 | Conservar. |
| `src/components/universal/identitat` | 10 | Conservar. |
| `src/components/universal/richText` | 7 | Conservar. |
| `src/components/universal/richText/extensions` | 7 | Conservar. |
| `src/components/universal/richText/extensions/targetes` | 13 | Conservar. |
| `src/components/universal/traduccio` | 4 | Conservar. |
| `src/components/universal/workspace` | 38 | Conservar. Porta workspace del nucli 1.2. |
| `src/css` | 37 | Conservar. `design-tokens.css` és generat però contractat. |
| `src/hooks` | 27 | Conservar. |
| `src/natiu` | 8 | Conservar. Entrada de `vite.natiu.config.js:37`. |
| `src/pwa` | 7 | Conservar. |
| `src/pwa/__fixtures__` | 1 | Conservar. |
| `src/utils` | 35 | Viu. `ics.js` i `ics.test.js` sense consumidor: preguntar (P05). |
| `src/utils/__fixtures__` | 1 | Conservar. `navegadorFals` l'usen 17 fitxers. |
| `src/utils/fulls` | 14 | Conservar. |
| `src/utils/fulls/__fixtures__` | 1 | Conservar. |
| `src/utils/productes` | 2 | Conservar. |
| `src/utils/temporada` | 8 | Conservar. `cobertura.test.js` mut pel camí mogut: preguntar (P08). |
| `src/utils/vendes` | 2 | Conservar. |

##### src-dades · 241 fitxers

| Directori | Fitx. | Veredicte |
|---|---:|---|
| `src/config` | 74 | Viu (32 no-proves, 42 proves). `taxonomy-registry.json` orfe: eliminar (E03). |
| `src/config/idiomes` | 5 | Conservar. `i18n.idiomes.test.js:48` en fixa la llista. |
| `src/data` | 76 | Viu. `SELF-DESCRIBE.md`: fusionar (F05, c). `wikiManifest.js`: preguntar (P09). |
| `src/data/adaptadors/sollutia` | 5 | Frontissa: conservar per doctrina (A.6.2). |
| `src/data/adaptadors/viquipedia` | 5 | Conservar. Fase 2 tancada; plantilla de la Frontissa. |
| `src/data/autodesament` | 7 | Conservar. Cua T47. |
| `src/data/conformitat` | 3 | Conservar. Contracte del port. |
| `src/data/supabase` | 66 | Viu. `README.md` obsolet i sense lector: eliminar (E04). |

##### public-i-mitjans · 469 fitxers

| Directori | Fitx. | Veredicte |
|---|---:|---|
| `assets/img` (arrel del repositori) | 15 | Eliminar sencera (E05). |
| `public` | 11 | Conservar PWA, SEO i Apache. Desversionar `rag-index.json` i `slugIndex.json` (D01). |
| `public/assets` | 5 | `soc_de_poble_ibanez.{png,webp}` viu. Eliminar `media_registry.json`, `pedra-seca.css`, `cc-by-nc-sa.svg` (E09-E11). |
| `public/assets/events` | 6 | Conservar. |
| `public/assets/fotos` | 9 | Conservar. Avatars canònics. |
| `public/assets/img` | 11 | Conservar. |
| `public/assets/nano_cards` | 21 | Conservar. |
| `public/assets/notes` | 2 | Conservar. |
| `public/assets/pages` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/pages/{01_chat … 08_bloc_de_notes}` (8 carpetes) | 8 | Eliminar els `.keep` de 0 B (E07). |
| `public/assets/system/ui` | 11 | Conservar. Preguntar per `og-socdepoble-1200x630.jpg` (P22) i `logo-socdepoble-rect.svg` (P23). |
| `public/assets/towns/{alcoleja, benifallim, la-torre-de-les-macanes, orxeta, penaguila, relleu, sella, tibi, xixona}` (9 carpetes) | 28 | Conservar `1.jpg`, `2.jpg` i bessones. Preguntar per `og-la-torre-1200x630.jpg` (P17). |
| `public/assets/ui/plugins` | 30 | Conservar. Preguntar per `tpv_vinyeta.jpg` (P21). |
| `public/assets/uploads` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/ajuntament/la-torre-de-les-macanes/avatar` | 2 | Conservar. |
| `public/assets/uploads/ajuntament/la-torre-de-les-macanes/post` | 2 | Fusionar al cens (F09). |
| `public/assets/uploads/avatars` | 32 | Conservar els canònics. Eliminar 6 còpies (E12, R). Preguntar per 3 (P11, R). |
| `public/assets/uploads/brain` | 56 | Conservar. Preguntar per `cuc-de-pi-poster` (P12, R) i `avatar_ratoli_comic` (P14). |
| `public/assets/uploads/companies/mercat` | 6 | Conservar. `camiseta_portada.png`: fusionar al cens (F09). |
| `public/assets/uploads/empresa` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/empresa/soc-de-poble` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/empresa/soc-de-poble/avatars` | 1 | Preguntar: logo servit en producció (P18). |
| `public/assets/uploads/empresa/soc-de-poble/mercat` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble` | 16 | Conservar. |
| `public/assets/uploads/empresa/soc-de-poble/posts` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/empresa/soc-de-poble/posts/disseny` | 11 | Conservar. Preguntar per `2-sidebar.png` (P20). |
| `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte` | 17 | Conservar 3. Fusionar 4 al cens (F09). Preguntar `antigravity-badge` (P18) i `el-projecte.epub` (P19). |
| `public/assets/uploads/empresa/soc-de-poble/posts/genotip` | 2 | Conservar. |
| `public/assets/uploads/empresa/soc-de-poble/posts/iaies-mundials` | 2 | Conservar. |
| `public/assets/uploads/gent` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/gent/avatars` | 23 | Preguntar amb consulta a la BD (P10, R). |
| `public/assets/uploads/gent/javi-llinares` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/gent/javi-llinares/avatars` | 4 | Conservar 1200 px. Preguntar 1600 px (P15). Eliminar `.DS-Store`. |
| `public/assets/uploads/gent/javi-llinares/posts` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/grup` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/grup/el-rentonar` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/grup/el-rentonar/avatars` | 1 | Preguntar: logo servit en producció (P18). |
| `public/assets/uploads/grup/el-rentonar/posts` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/ia` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/ia/01-iaia-matriarca/avatars` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/ia/02-nano-banana-artiste/avatars` | 2 | Preguntar (P13). |
| `public/assets/uploads/ia/02-nano-banana-artiste/posts` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/ia/03-vicent-ferris-agronom/avatars` | 1 | Preguntar (P13). |
| `public/assets/uploads/ia/04-beatriz-ortega-mestra/avatars` | 1 | Preguntar (P13). |
| `public/assets/uploads/ia/05-carla-soriano-doctora` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/ia/05-carla-soriano-doctora/avatars` | 1 | Preguntar (P13). Sense àlies al cens. |
| `public/assets/uploads/ia/05-carla-soriano-doctora/posts` | 2 | Conservar `post-carla-salut.png`. Eliminar `.DS-Store`. |
| `public/assets/uploads/ia/06-pepica-la-vall-cuinera` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/ia/06-pepica-la-vall-cuinera/avatars` | 1 | Preguntar (P13). |
| `public/assets/uploads/ia/06-pepica-la-vall-cuinera/posts` | 1 | Conservar. |
| `public/assets/uploads/ia/07-andreu-soler-capatas/avatars` | 1 | Preguntar (P13). |
| `public/assets/uploads/ia/08-elena-popova-music/avatars` | 1 | Preguntar (P13). |
| `public/assets/uploads/ia/09-joan-batiste-arxiver/avatars` | 1 | Preguntar (P13). |
| `public/assets/uploads/ia/10-joanet-serra-xiquet/avatars` | 1 | Conservar. Únic camí de Joanet Serra. |
| `public/assets/uploads/ia/11-tio-colau-viajant/avatars` | 2 | Conservar. Únic camí de Tio Colau. |
| `public/assets/uploads/ia/12-el-ratoli-informatic/avatars` | 2 | Preguntar (P13). |
| `public/assets/uploads/ia/13-flash-carter/avatars` | 2 | Preguntar (P13). |
| `public/assets/uploads/ia/14-la-mixa-gestora/avatars` | 2 | Preguntar (P13). |
| `public/assets/uploads/ia/15-marc-el-gall-el-temps` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/ia/15-marc-el-gall-el-temps/avatars` | 2 | Preguntar (P13). |
| `public/assets/uploads/ia/15-marc-el-gall-el-temps/posts` | 1 | Conservar. |
| `public/assets/uploads/poble` | 1 | Eliminar `.DS-Store` (E06). |
| `public/assets/uploads/poble/{ademus, aiora, albocasser, alcoi, alcoleja, banyeres-de-mariola, barcelona, bunyol, castello-de-la-plana, cirat, cocentaina, cullera, denia, enguera, gandia, girona, iatova, lliria, llucena, morella, ontinyent, oriola, paterna, relleu, requena, sagunt, sella, tibi, torrent, valencia, vilareal, vinaros, xabia, xativa, xelva, xixona}` (36 carpetes) | 36 | Només `.DS-Store`: eliminar (E06). Les carpetes desapareixen. |
| `public/assets/uploads/poble/{alacant, alzira, benialfaqui, benidorm, benifallim, elda, elx, sogorb, villena}` (9 carpetes) | 18 | `.DS-Store` (E06) i `summary.txt` sense lector (E08): eliminar. |
| `public/assets/uploads/poble/la-torre` | 1 | Només `summary.txt`: eliminar (E08). |
| `public/assets/uploads/poble/benimassot` | 3 | Conservar `img-benimassot-main`. Eliminar `.DS-Store`. |
| `public/assets/uploads/poble/la-torre-de-les-macanes` | 27 | Conservar fotos DSC, P_2016, topònim i main. Preguntar logos i `og_gentdelatorre_*` (P17, P18). Eliminar `.DS-Store`. |
| `public/assets/uploads/poble/penaguila` | 3 | Fusionar `img-pen-guila-main` al cens (F09). Eliminar `.DS-Store`. |
| `public/auth` | 3 | Conservar `calendari-google.{html,js}`. Preguntar `callback.html` (P16). |
| `public/components` | 1 | Quarantena `sp-identity-components.js` (Q01). |
| `public/fonts` | 2 | Conservar. |

##### tooling-i-arrel · 806 fitxers

| Directori | Fitx. | Veredicte |
|---|---:|---|
| Arrel: `README.md`, `CLAUDE.md`, `AGENTS.md`, `VEINS.md`, `INTEGRACIO.md`, `.env.example`, `.escriptori-arrel`, `vercel.json`, `Dockerfile`, `docker-compose.yml`, `.dockerignore` | 11 | 7 vius (`VEINS.md` desfasat: cita 4 dels 11 satèl·lits). `INTEGRACIO.md`: preguntar (P31, R). Docker: preguntar amb el bot (P32). |
| `.codex` | 1 | Conservar. Llavor crítica del Reflex. |
| `.github/workflows` | 2 | `wiki-integrity.yml` viu. `sdp_lock_ci.yml` redundant: eliminar (E37). |
| `.husky` | 5 | Conservar els 5 (`REQUIRED_HOOKS`). |
| `.immunitari` (arrel) | 5 | Conservar `config.json`, `baseline.json`, `.gitignore`. Desversionar `cron.out` i `cron.err` (D03). |
| `.immunitari/aprovacions` | 4 | Preguntar (P24). |
| `.immunitari/quarantena` | 1 | Eliminar `whatsapp_bot.mjs.old` (E13). |
| `.immunitari/receptes` | 497 | Desversionar el directori sencer (D02). |
| `.vscode` | 1 | Conservar. |
| `_templates/gestoria_base` | 8 | Preguntar (P33). |
| `bot` (amb `bot/memoria`) | 9 | Preguntar (P32). |
| `requirements` | 2 | Conservar. Configuració de `porta:psicopatia`. |
| `scripts` (primer nivell) | 14 | 4 vius. 10 a eliminar (E14, E15, E18, E19). |
| `scripts/botigues` | 4 | Conservar. |
| `scripts/immunitari` | 4 | Conservar. |
| `tooling` (primer nivell) | 5 | Conservar `verify-ledger`, `verify-bios`. Eliminar `preflight`, `scratch_malformades`, `escala_sdp_root` (E18, E20, E21). |
| `tooling/agents` | 2 | Eliminar (E19, c). |
| `tooling/brain` | 20 | 18 vius. `quarantena_espills`: eliminar amb decisió del Mestre (E28, c). `somiador`: preguntar (P28). |
| `tooling/broker` | 3 | Eliminar `security-test.mjs` (E27). Prototip `broker.mjs` + prova: preguntar (P25). |
| `tooling/documental` | 7 | Conservar. |
| `tooling/gates` | 72 | 64 vius. Eliminar `legacy/` (7) i `neteja-enllacos-trencats.mjs` (E16, E17). |
| `tooling/higiene` | 3 | Conservar 2. Eliminar `tractor_cognitiu.mjs` (E23). |
| `tooling/lib` | 8 | Conservar. |
| `tooling/maquinaria` | 5 | Conservar `convertir_a_webp`. Fusionar `rebuild_skills_index` (F08, c). Moure `executar_poda_lots` (M02). Eliminar 2 mutadors (E17). |
| `tooling/media` | 2 | Conservar. |
| `tooling/migrations` | 1 | Preguntar (P26). |
| `tooling/mocks` | 1 | Eliminar (E24). No és Frontissa. |
| `tooling/pdf` | 2 | Conservar `render_pdf.sh`. Moure `extract_pdf.py` (M03). |
| `tooling/scripts` | 9 | 3 vius. Fusionar `ancora.mjs` (F07, c). Eliminar 5 (E18, E25, E26). |
| `tooling/session` | 3 | Conservar `persona_router`. Eliminar `check-close` (E22). Preguntar `saneja_torns_caducats` (P27). |
| `tooling/sollutia` | 2 | Conservar. Complement de la Frontissa. |
| `tooling/tests` | 2 | Conservar. |
| `tooling/vite` | 2 | Conservar. |
| `tooling/wiki` (amb `core/`, `lib/`, `compiler/`, `rules/`) | 89 | 53 vius. 32 a eliminar (E14, E15, E17, E29-E36). Preguntar 3: parell del Clon (P29, R) i `.cache-tractor.json` (P30, R). `sincronitzar_skills`: fusionar (F08, c). |

##### backend-natiu-proves · 308 fitxers

| Directori | Fitx. | Veredicte |
|---|---:|---|
| `android` | 8 | Conservar. |
| `android/app` | 4 | Conservar. |
| `android/app/src/androidTest/java/com/getcapacitor/myapp` | 1 | Eliminar prova de plantilla falsa (E42). |
| `android/app/src/main` | 1 | Conservar `AndroidManifest.xml`. |
| `android/app/src/main/java/org/socdepoble/app` | 1 | Conservar `MainActivity`. |
| `android/app/src/main/res/drawable` | 2 | Conservar `splash.png`. Eliminar `ic_launcher_background.xml` (E43). |
| `android/app/src/main/res/drawable-land-{hdpi,mdpi,xhdpi,xxhdpi,xxxhdpi}` (5 carpetes) | 5 | Conservar. |
| `android/app/src/main/res/drawable-port-{hdpi,mdpi,xhdpi,xxhdpi,xxxhdpi}` (5 carpetes) | 5 | Conservar. |
| `android/app/src/main/res/drawable-v24` | 1 | Eliminar `ic_launcher_foreground.xml` (E43). |
| `android/app/src/main/res/layout` | 1 | Eliminar `activity_main.xml` (E43). |
| `android/app/src/main/res/mipmap-anydpi-v26` | 2 | Conservar. |
| `android/app/src/main/res/mipmap-{hdpi,mdpi,xhdpi,xxhdpi,xxxhdpi}` (5 carpetes) | 15 | Conservar. Icones de marca. |
| `android/app/src/main/res/values` | 3 | Conservar. |
| `android/app/src/main/res/xml` | 2 | Conservar. |
| `android/app/src/test/java/com/getcapacitor/myapp` | 1 | Eliminar `ExampleUnitTest` (E42). |
| `android/gradle/wrapper` | 2 | Conservar. |
| `ios` | 2 | Conservar. |
| `ios/App/App` | 5 | Conservar. |
| `ios/App/App.xcodeproj` | 1 | Conservar. |
| `ios/App/App.xcodeproj/project.xcworkspace/xcshareddata` | 1 | Conservar. |
| `ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm` | 1 | Conservar. |
| `ios/App/App/Assets.xcassets` | 1 | Conservar. |
| `ios/App/App/Assets.xcassets/AppIcon.appiconset` | 2 | Preguntar: placeholder de Capacitor (P37). |
| `ios/App/App/Assets.xcassets/Splash.imageset` | 4 | Fusionar 3 PNG idèntics (F06). Preguntar pel placeholder (P37). |
| `ios/App/App/Base.lproj` | 2 | Conservar. |
| `ios/App/App/{ca,en,es,eu,gl}.lproj` (5 carpetes) | 5 | Conservar. |
| `ios/App/CapApp-SPM` | 3 | Conservar. |
| `ios/App/CapApp-SPM/Sources/CapApp-SPM` | 1 | Conservar. |
| `supabase` | 2 | Conservar `README.md` i `seed.sql`. |
| `supabase/.branches` | 1 | Desversionar (D04). |
| `supabase/.temp` | 1 | Desversionar (D04). |
| `supabase/.temp/start-secrets/supabase_edge_runtime_socdepoble.org/env` | 1 | Desversionar `docker.env` (D04). |
| `supabase/migrations` | 47 | Conservar totes: història. |
| `supabase/snippets` | 2 | Conservar. |
| `tests` | 116 | 91 conservar. 21 moure al satèl·lit (M04-M14). 1 eliminar (E41). 3 preguntar (P34, R; P35; P36). |
| `tests/fixtures` | 5 | Conservar. |
| `tests/fixtures/grups-mare` | 1 | Eliminar `regression.sql` (E40). |
| `tests/fixtures/xat-entitats` | 2 | Conservar. |
| `tests/frontissa/fixtures/sollutia` | 1 | Conservar. Frontissa. |
| `tests/frontissa/fixtures/viquipedia` | 15 | Conservar. |
| `tests/helpers` | 4 | Conservar. |
| `tests/integration` | 1 | Conservar. |
| `tests/manual` | 2 | Conservar. |
| `tests/onboarding` | 2 | Conservar. |
| `tests/ui` | 1 | Conservar. |
| `wordpress-plugin/builds` | 22 | Eliminar 18 (E38, E39). Conservar `stable.json`, `1.1.8.json` i les `.sig`. |

##### pes-del-govern · 696 fitxers

| Directori | Fitx. | Veredicte |
|---|---:|---|
| `.agents` (només `pageContent_old.js`) | 1 | Quarantena via executor-mutacio (Q02, c). |
| `.agents/runtime/contracts` | 77 | Conservar sencer. |
| `.agents/runtime/turns` | 339 | Conservar els 83 oberts o amb reflex. Preguntar l'arxivat dels 256 tancats sense reflex (P38). Mai desversionar en bloc. |
| `_wiki_de_poble/.obsidian/plugins/dataview` | 3 | Conservar la configuració. Connector trencat (sense `main.js`). |
| `_wiki_de_poble/.obsidian/plugins/notebook-navigator` | 4 | Desversionar `main.js` i `styles.css` (D05). |
| `_wiki_de_poble/.obsidian/plugins/obsidian-minimal-settings` | 4 | Desversionar `main.js` i `styles.css` (D05). |
| `_wiki_de_poble/04_escriptori/01_produccio` (arrel) | 18 | Conservar 8. Preguntar 2 avatars (P40). Fusionar 5 (F10, F11). Moure 2 (M15, M17). Quarantena 1 (Q03). |
| `…/01_produccio/Banda La Torre - Gestió` | 7 | Moure a `../_gestoria_de_poble/90_Arxiu_Historic/` (M18). |
| `…/01_produccio/Targetes_Davinci_Llestes` | 18 | Moure a `../_multimedia_de_poble/` (M16). |
| `…/01_produccio/WhatsApp-Clon-01` | 22 | Eliminar: còpia idèntica al satèl·lit (E44). |
| `…/01_produccio/WhatsApp-Clon-02` | 52 | Eliminar: còpia idèntica al satèl·lit (E44). |
| `…/01_produccio/alergens_svg` | 19 | Conservar. |
| `…/01_produccio/captures_claude` | 40 | Moure a `../_multimedia_de_poble/captures_treball/` (M15). |
| `…/01_produccio/loyverse_clon` | 27 | Preguntar (P39, R). |
| `…/01_produccio/loyverse_clon_ipad` | 9 | Moure a `../_multimedia_de_poble/captures_treball/` (M15). |
| `…/01_produccio/loyverse_clon_mobil` | 36 | Preguntar (P39, R). |
| `…/01_produccio/patrimoni_oral_mestre` | 20 | Conservar (IDEA-03). Falta l'àncora. |

#### A.2 Propostes confirmades per acció

Cada fila és una proposta que ha superat la verificació, o l'acció corregida d'una troballa refutada (R). El rebuig de les originals és a A.3.

##### A.2.1 Eliminar

| ID | Camí | Fitx. | Bytes | Risc | Per què | Evidència | Proves |
|---|---|---:|---:|---|---|---|---|
| E01 (c) | `src/sections/gestoria/facturar/__fixtures__/idbFals.js` | 1 | 7.016 | baix | Fixture sense importador; el successor `tests/helpers/idbFals.js` ja existix. Cal el vistiplau del Mestre que demana `tests/helpers/idbFals.js:10-11` i reescriure els comentaris de `cofre.test.js:6` i `tests/helpers/idbFals.js:9-11`. | Graf AST: 0 importadors. Globs `?raw` (`registreTractors.js:24`, `privacitat.test.js:63-64`) exclouen `__fixtures__`. L'acta 261009_0745:129 el té a «Pendents», no esborrat. | No. Coordinar amb el torn de Gemini `torn_f781afe5`, que el té a la instantània. |
| E02 | `src/apps/lector/vistes/{Carpetes,Fonts}.jsx` | 2 | 960 | baix | Làpides que demanen `git rm`. | 0 importadors. `.agents/ESTAT.md:573` ordena el `git rm`. | No. `qualitat.test.js:80` filtra per `existsSync`; després es pot llevar `LAPIDES` (:57-60, :79-86). |
| E03 | `src/config/taxonomy-registry.json` | 1 | 2.033 | baix | Registre «Taxonomia V3» sense cap lector. | `git grep taxonomy-registry` fora de `.agents/runtime`: 0. Un sol commit (5a5d7023). Substitució només parcial per `tooling/wiki/schema.json`. | No |
| E04 | `src/data/supabase/README.md` | 1 | 2.413 | baix | Obsolet: 12 de 18 mòduls; parla de `supabaseBackend.js`, que no existix. | Les 5 proves `*.migracio.test.js` lligen `supabase/README.md` de l'arrel (`ARREL = process.cwd()`). | No |
| E05 | `assets/img/*` (arrel) | 15 | 9.167.264 | baix | Còpia vella que ningú no servix: 14 idèntics a `public/`; el 15é és a l'historial (blob b327053d a d75a852c). | `assetResolver.js:9-12`. `duplicats.json`. | No. Acoblat: llevar `'assets'` de `crear_bundle.mjs:93,102`, que avorta si un directori falta. |
| E06 | `public/**/.DS-Store` | 69 | 438.548 | baix | Metadades del Finder (Bud1) que escapen al `.gitignore`. | `xxd`: 69/69 Bud1. `.gitignore:6-7` només té `.DS_Store`. | No. Acoblat: afegir `.DS-Store` al `.gitignore` en el mateix commit. |
| E07 | `public/assets/pages/*/.keep` | 8 | 0 | baix | Placeholders sense cap ús. | `git grep assets/pages`: només mostres sintètiques a `standalone-build.test.mjs`. | No |
| E08 | `public/assets/uploads/poble/*/summary.txt` | 10 | 2.976 | baix | Resums de la Viquipèdia sense cap lector. | `git log -S summary.txt`: cap lector a cap versió; 0 a les 14 versions de `seed.sql`. | No |
| E09 | `public/assets/media_registry.json` | 1 | 45.407 | baix | Registre de l'app vella; 4 de 137 entrades existixen. Viatja al zip del directori. | Només `sw.test.js:248` com a URL de mostra. | No |
| E10 | `public/assets/pedra-seca.css` | 1 | 29 | baix | Placeholder d'una línia. | Cap `<link>`. Lector opcional `crear_bundle.mjs:134`. | No. Llevar-lo de `FITXERS_OPCIONALS_FIXOS`. |
| E11 | `public/assets/cc-by-nc-sa.svg` | 1 | 22.707 | baix | Les llicències es pinten amb components. | `CopyrightPage.jsx:112`. `sw.test.js` només classifica la URL. | No |
| E12 (R) | `public/assets/uploads/avatars/{el-viatjant,nano_sessio_treball,avatar_samir_comic}.{png,webp}` | 6 | 3.852.273 | baix | Còpies d'originals vius que cap llavor no ha portat mai. | Escaneig de les 14 versions de `seed.sql`: 0. `avatar_samir_comic` només a `XatSection.jsx` fins a ac53dc01. | Sí, si no es lleven d'`EXCLOSES` (`censImatges.js:225, :228, :229`): `censImatges.test.js:85`. |
| E13 | `.immunitari/quarantena/whatsapp_bot.mjs.old` | 1 | 7.397 | baix | Còpia del bot antic (whatsapp-web.js). | Cap referència. `plaquetes.mjs:157` només mira `.mjs`. | No |
| E14 | `scripts/{audit-accessibility,audit-performance,migrate-component,sync_brain_to_wiki}.sh`, `tooling/wiki/{sync_brain,sync_brain_termodinamic}.sh`, `tooling/wiki/update_glossari.cjs` | 7 | 1.883 | baix | Làpides SDP-LOCK (`echo` + `exit 2`) sense cridador. | Cap referència a `package.json`, `.husky`, hooks, launchd ni crontab. | No |
| E15 | `scripts/generate-bundle-v{3,4}.sh`, `tooling/wiki/build_context_pack.py` | 3 | 22.506 | baix | Generadors superats per `crear_bundle.mjs`. | `AGENTS.md` §6. | No |
| E16 | `tooling/gates/legacy/**` | 7 | 42.917 | baix | Portes velles fora de la cadena; dues lligen un log personal de `~/.gemini`. | Fora de `run-portes.mjs:27-87`. `tractor-cadena` passa de 63 a 62 i continua verd. | No |
| E17 | `tooling/maquinaria/{neteja_ancoratges,neteja_punts_cecs}.mjs`, `tooling/gates/neteja-enllacos-trencats.mjs`, `tooling/wiki/codemod_assecar_graf.mjs`, `scripts/teixidor-backlinks.mjs` | 5 | 15.364 | baix | Mutadors del vault sense Reflex ni rollback. | Doctrina a `enllacat-intelligent-wiki.mjs:11`. 0 cridadors. | No. El ràtxet `.rutes-deute.json` només baixa. |
| E18 | `tooling/scripts/{llevar-catch-orfes,llevar-imports-orfes,migrate-css}.mjs`, `scripts/{refactor_router,poda}.mjs`, `tooling/escala_sdp_root.mjs` | 6 | 29.828 | baix | Codemods d'una sola volta, ja aplicats. | `src/css/legat.css` i `react-router-dom` ja no existixen. | No. Es pot llevar també la dependència `css` (`package.json:140`). |
| E19 (c) | `tooling/agents/{autoneteja_safata_produccio,force_read_petorreta_rules}.sh`, `scripts/generate-prompt.sh` | 3 | 2.131 | baix | Scripts d'agent sense cridador. Actualitzar el motiu de `tooling/wiki/nomenclatura.json:21`. | 0 referències. Part de l'evidència original era falsa (APFS resol la ruta en minúscules). | No |
| E20 | `tooling/scratch_malformades.mjs` | 1 | 932 | baix | Script de laboratori. | El verificador real és `verify-ledger.mjs`. | No |
| E21 | `tooling/preflight.mjs` | 1 | 2.848 | baix | «Porta d'Obra» antiga desconnectada. | Només `LEDGER.md:121-123` (història). | No |
| E22 | `tooling/session/check-close.mjs` | 1 | 3.482 | baix | Sense cridador; el canònic és `npm run tancar`. | `package.json:25`. | No |
| E23 | `tooling/higiene/tractor_cognitiu.mjs` | 1 | 4.254 | baix | Tractor interactiu amb `unlinkSync`, sense cridador. | `cron_higiene.mjs:54` importa `neteja_brossa_arrel.mjs`. | No |
| E24 | `tooling/mocks/sollutiaBackend.js` | 1 | 1.194 | baix | Mock desfasat; no és la Frontissa. | `.agents/ESTAT.md:1779` el marca P0. | No |
| E25 | `tooling/scripts/desenterrar.mjs` | 1 | 11.641 | baix | V7 superada per `tooling/brain/desenterrar.mjs` V7.1. | `brain/desenterrar.mjs:5-7`. | No |
| E26 | `tooling/scripts/tractor-lapida.mjs` | 1 | 5.038 | baix | Hook `commit-msg` mai instal·lat. | No hi ha `.husky/commit-msg`. | No |
| E27 | `tooling/broker/security-test.mjs` | 1 | 10.213 | baix | Còpia de `broker.test.mjs` amb títols parafrasejats. | 22 casos 22 a 22. No acaba en `.test.mjs`. | No |
| E28 (c) | `tooling/brain/quarantena_espills.mjs` | 1 | 1.446 | mitja | Script d'una sola volta; el mirall ja no existix. Només amb decisió explícita del Mestre (`policy.health`). | `00_AGENTS_I_SKILLS_MIRROR` no existix. | Sí: `tests/backend_consolidacio.test.mjs:284` (requiredPrimary). Cal llevar el bloc de prova. |
| E29 (R) | `tooling/wiki/{compile-wiki-to-system-prompt,compile-cultura}.mjs` | 2 | 5.630 | baix | Generen `.agents/GENOMA.md` i `CULTURA.md`, purgats o inexistents. Llevar també `CAMINS.genoma` de `tooling/lib/arrel.mjs:83`. | Acta 260922_2200:17. | No |
| E30 | `tooling/wiki/compiler/**`, `tooling/wiki/core/ontology.json` | 5 | 49.638 | baix | Compilador i ontologia sense cridador ni lector. | `schema-cutover.lock.json:12-14` cita `*.cjs` inexistents. | No |
| E31 | `tooling/wiki/{audit_estructura.mjs,validate_taxonomia.mjs,validate_trellat.cjs}` | 3 | 4.792 | baix | Façanes de noms antics sense cridador. | Capçaleres «Façana de compatibilitat». | No |
| E32 | `tooling/wiki/**/*.abans-260830` | 4 | 34.419 | baix | Còpies de seguretat de 4 fitxers vius. | Commit c0e1ad7e. | No |
| E33 | `tooling/wiki/{generar_petorreta_inversa,validar_prompt_sgq}.mjs` | 2 | 9.392 | baix | Eines SGQ sense cridador. `lib/prompt_sgq.mjs` continua viva. | `crear_bundle.mjs:54`. | No |
| E34 | `tooling/wiki/lib/{enllacos,persona_router,resolutor}.mjs` | 3 | 4.567 | baix | Biblioteques sense importadors. | La viva és `tooling/session/persona_router.mjs`. | No |
| E35 | `tooling/wiki/{neteja_brain,sync_sollutia_skills,seo_auditor,gen_targeta_universal,tractor-cervell-ia,teixidora_sinapsis}.mjs`, `tooling/wiki/core/trellat_metrics.mjs` | 7 | 52.455 | baix | Òrfenes: stubs, prototips i inventaris de `~/.gemini`. `sync_sollutia_skills` no és Frontissa. | 0 cridadors. `memoria_aprenentatges.md:63` en guarda la lliçó. | No |
| E36 | `tooling/wiki/Makefile` | 1 | 678 | baix | Targets duplicats o SDP-LOCK. | Cap `make` a hooks, CI ni skills. | No |
| E37 | `.github/workflows/sdp_lock_ci.yml` | 1 | 494 | mitja | Redundant amb `wiki-integrity.yml`; usa Node 20, fora d'`engines`. | `package.json:151-153`. | No. Comprovar abans a GitHub que cap protecció de branca exigix «gate-check». |
| E38 | `wordpress-plugin/builds/migracions_pendents.sql` | 1 | 153.315 | baix | Lot derivat de 16 migracions; aplicar-lo desfaria `2610081400_grups_sense_mare.sql`. | Residu 0 en restar les migracions. | No |
| E39 | `wordpress-plugin/builds/{1.0.5,1.1.0 … 1.1.7}.json(.sig)` | 17 | 28.717 | baix | Ni el canal ni cap prova lligen manifests vells. | `actualitzador.php:50` (només `stable.json`). | No. Cal que el Mestre fixe la política de `{versió}.json`. |
| E40 | `tests/fixtures/grups-mare/regression.sql` | 1 | 3.840 | baix | Afirma la regla que `2610081400` va revertir. | `regression.sql:22-23`. | No |
| E41 | `tests/laboratori-telefonades-261006.test.js` | 1 | 7.941 | baix | Sonda d'un dia; la decisió ja és a `App.test.jsx:736-766`. | Capçalera :21-22. | No |
| E42 | `android/app/src/{test,androidTest}/java/com/getcapacitor/myapp/Example*Test.java` | 2 | 1.176 | baix | Proves de plantilla; la instrumentada afirma un paquet que no és el de l'app. | `ExampleInstrumentedTest.java:25` vs `build.gradle:4,7`. | No |
| E43 | `android/app/src/main/res/{drawable-v24/ic_launcher_foreground.xml,drawable/ic_launcher_background.xml,layout/activity_main.xml}` | 3 | 8.021 | baix | Restes de plantilla sense referència. | `BridgeActivity.java:28` carrega un altre layout. | No. Verificar amb `./gradlew assembleDebug`. |
| E44 | `_wiki_de_poble/04_escriptori/01_produccio/WhatsApp-Clon-0{1,2}/*` | 74 | 32.906.177 | baix | Ja custodiats byte a byte a `../_arxiu_wiki_de_poble/01_Produccio/`. | SHA-1 22/22 i 52/52. | No. Zona humana: ho fa el Mestre. Avisar que la skill `sdp-clon-whatsapp` hi té la referència. |

##### A.2.2 Desversionar

Els fitxers ixen de l'índex (`git rm --cached`) i es queden al disc.

| ID | Camí | Fitx. | Bytes | Risc | Per què | Evidència | Proves |
|---|---|---:|---:|---|---|---|---|
| D01 | `public/{rag-index.json,slugIndex.json}` | 2 | 1.432.575 | mitja | Generats pel build; l'app no els llig. 43 versions de `rag-index` a l'historial (115,9 MB en cru). | `vite.natiu.config.js:337-341`. `natiu-build.test.mjs:653`. | No. Prerequisit: `build:wp` i `build:wp:directori` han de passar per `rag:build` i `slugs:build`. `search_cli.mjs:11` fallarà en un clon net fins al primer `rag:build`. |
| D02 | `.immunitari/receptes/*_RECEPTA.json` | 497 | 7.542.431 | baix | Estat local de Plaquetes; ja ignorat (`.gitignore:66`). | `.gitignore:58-66` mana el `git rm --cached`. | No. Recomanat en un commit propi. |
| D03 | `.immunitari/{cron.out,cron.err}` | 2 | 139.213 | baix | Logs de launchd ignorats però versionats. `cron.out` deixa l'arbre sempre brut i bloqueja `aplica`. | `plaquetes.mjs:74, :329`. | No |
| D04 | `supabase/.temp/**`, `supabase/.branches/_current_branch` | 3 | 1.151 | baix | Estat de la CLI. `docker.env` porta claus per defecte de la pila local. | `.gitignore:51-54` i comentari :48-49. | No |
| D05 | `_wiki_de_poble/.obsidian/plugins/{notebook-navigator,obsidian-minimal-settings}/{main.js,styles.css}` | 4 | 4.834.064 | baix | Codi compilat de tercers; es torna a baixar. Conservar `manifest.json` i `data.json`. | `eslint.config.js:8` ja els ignora. Cap lector. | No. Afegir les regles al `.gitignore`. |

##### A.2.3 Quarantena (`.sdp-paperera/`)

| ID | Camí | Fitx. | Bytes | Risc | Per què | Evidència | Proves |
|---|---|---:|---:|---|---|---|---|
| Q01 | `public/components/sp-identity-components.js` | 1 | 9.820 | baix | Web Component vell que no carrega ningú; codi únic. | Cap ús a `index.html`, `src`, PHP ni natiu. Producció no el servix. | Sí: `src/data/identitatDual.guarda.test.js:142` i `:204-208`. Cal tocar-los en el mateix canvi. |
| Q02 (c) | `.agents/pageContent_old.js` | 1 | 106.299 | baix | Còpia morta de `pageContent.js` (260924); importa un fitxer que no existix. Via executor-mutacio. | `git grep pageContent_old`: 0. Historial a555b1ed. | No |
| Q03 (c) | `_wiki_de_poble/04_escriptori/01_produccio/generador_sitemap.mjs` | 1 | 1.357 | baix | Script trencat (escriuria a `_wiki_de_poble/public/`) i sense executor. Ho fa el Mestre. | `build:seo` governa el sitemap. | No, si es retira alhora l'àncora de `00_index_escriptori.md:579`; si no, cau la Porta Orfandat. |

##### A.2.4 Moure a satèl·lit

Les proves `*.test.mjs` (M04-M09) tenen entrada a `tooling/tests/node-suite-manifest.json`. Cal llevar-la en el mateix canvi: si no, `validateManifest` (`run-node-tests.mjs:46`) avorta `npm run test:node`, `test:ci` i `tests/node-suite-policy.test.mjs`. Cal també esmenar `policy.health` («cap prova ni asserció es retira»). Al satèl·lit quedaran com a document: els camins relatius no carregaran.

| ID | Camí | Fitx. | Bytes | Risc | Destí | Per què | Proves |
|---|---|---:|---:|---|---|---|---|
| M01 | `src/sections/consola/laboratori261009.test.js` | 1 | 5.622 | baix | `../_investigacio_ia_de_poble/261009_0400_consola_claude/` | `skipIf(!HI_ES)`: se salta sempre; el laboratori ja és al satèl·lit. | No |
| M02 | `tooling/maquinaria/executar_poda_lots.mjs` | 1 | 16.701 | baix | `../_arxiu_wiki_de_poble/` (al costat de `00_manifest_arxiu_fred.json`) | Script ja executat (2026-10-18). Hui fa caure `porta:rutes` i `porta:nomenclatura` (N2). | No. Arregla 2 portes. |
| M03 | `tooling/pdf/extract_pdf.py` | 1 | 1.631 | baix | `../_gestoria_de_poble/04_Eines_de_Pedra_Seca/` | Script personal amb rutes absolutes. | No |
| M04 | `tests/{tractor-autosanacio,tractor-sinapsis,porta-olivera-v2}.test.mjs` | 3 | 19.861 | mitja | `../_investigacio_ia_de_poble/260924_1700_tractors_claude/` | `import(undefined)` o API retirades: suite laboratory roja sense provar res. | Manifest (vegeu dalt). |
| M05 | `tests/{porta-receptor,petorreta-generador}.test.mjs` | 2 | 24.170 | mitja | `../_investigacio_ia_de_poble/260927_1310_reflex_maria/` | Peces mai instal·lades; peten en carregar. | Manifest. |
| M06 | `tests/governanca-260930-{lease,mapa,maria,olivera,t1}.test.mjs` | 5 | 101.142 | mitja | `../_investigacio_ia_de_poble/260930_0040_governanca_claude/` | Skip permanent (48 proves saltades). | Manifest. |
| M07 | `tests/governanca-260930b-{portes,torns}.test.mjs` | 2 | 41.258 | mitja | `../_investigacio_ia_de_poble/260930_0400_governanca_claude/` | Skip permanent (21 proves). Corregir el comentari `antigravity-hook.mjs:121-124`. | Manifest. |
| M08 | `tests/olivera-arxiva-261002.test.mjs` | 1 | 66.500 | mitja | `../_investigacio_ia_de_poble/261002_1745_olivera_arxiva_claude/` | 29 saltades i 1 que falla (O13) en un arbre complet. | Manifest. |
| M09 | `tests/anticipacio-261003.test.mjs` | 1 | 85.464 | mitja | `../_investigacio_ia_de_poble/261003_1330_anticipacio_claude/` | Prototip mai instal·lat; 36 saltades. | Manifest. |
| M10 | `tests/laboratori-{higiene,ledger,model-b}-261006.test.js` | 3 | 91.748 | mitja | `../_investigacio_ia_de_poble/261006_0300_ledger_claude/` | Tot el cos dins de `describe.skipIf(!ACTIU)`. Vitest els carrega a cada passada. | No |
| M11 | `tests/laboratori-olivera-261006.test.js` | 1 | 17.382 | mitja | `../_investigacio_ia_de_poble/261006_0055_olivera_ancores_opus/` | Skip permanent. | No |
| M12 | `tests/laboratori-higiene-261009.test.js` | 1 | 87.189 | mitja | `../_investigacio_ia_de_poble/261009_0400_higiene_claude/` | Skip permanent. | No |
| M13 | `tests/laboratori-onada7-261009.test.js` | 1 | 35.425 | mitja | `../_investigacio_ia_de_poble/261009_1245_onada7_claude/` | Skip permanent. | No |
| M14 (c) | `tests/laboratori-logotips-261009.test.js` | 1 | 3.620 | baix | `../_investigacio_ia_de_poble/261009_1330_logotips_png_claude/` | Skip permanent. Llevar `tests/lint-sessio.test.mjs:695` en el mateix canvi. | Sí, si no es lleva la línia: `lint-sessio.test.mjs` (suite session, `NoFilesFoundError`). |
| M15 | `_wiki_de_poble/04_escriptori/01_produccio/{captures_claude/*,loyverse_clon_ipad/*,captura_claude_avatar.png}` | 50 | 14.110.101 | baix | `../_multimedia_de_poble/captures_treball/` | Captures de sessions de Claude; cap pantalla de Loyverse. Sense còpia en cap satèl·lit. | No |
| M16 | `_wiki_de_poble/04_escriptori/01_produccio/Targetes_Davinci_Llestes/*` | 18 | 9.418.785 | baix | `../_multimedia_de_poble/` | Duplicats de les vives de `public/`; el codi diu que no les llig (`indexConsola.js:64-70`). | No, si es retiren les àncores `00_index_escriptori.md:615-632`; si no, cau la Porta Orfandat. |
| M17 | `_wiki_de_poble/04_escriptori/01_produccio/iaia_maria_portada.jpg` | 1 | 1.419.561 | baix | `../_multimedia_de_poble/nano_banana_historic/` | Caricatura purgada de `public/` el 261018; còpia preservada a posta. | No. Retirar l'àncora `00_index_escriptori.md:72`. |
| M18 | `_wiki_de_poble/04_escriptori/01_produccio/Banda La Torre - Gestió/*` | 7 | 2.235.603 | mitja | `../_gestoria_de_poble/90_Arxiu_Historic/` | Llegat 2006-2007 sense consumidor; conté dades personals. El Mestre pot preferir `../_cultura_de_poble/`. | No |

##### A.2.5 Fusionar

| ID | Camí | Fitx. | Bytes | Risc | Proposta | Evidència | Proves |
|---|---|---:|---:|---|---|---|---|
| F01 | `src/sections/{README.md,detail/README.md}` | 2 | 3.056 | baix | Passar les 2 regles certes al destí únic de documentació de `src/` (vegeu A.6.4) i retirar-los. | 11 camins citats no existixen (`git ls-files`). Cap lector. | No |
| F02 | `src/sections/consola/{ConsolaSection.index,ConsolaSection.viceversa}.test.jsx`, `{diagnosiConsola,indexConsola}.test.js` | 4 | 14.465 | baix | Un sol mòdul de dades de prova a `tests/helpers/` (`.js`, no dins de la consola). | Bloc idèntic (shasum 835ecb2e0167) en 3 fitxers; la «variant» només afig un comentari. | No. Si es posara a `src/sections/consola` com a `.jsx`, entraria a la Llei del quadrat (`indexConsola.test.js:280-284`). |
| F03 (R) | `src/sections/gestoria/{cofre/cofre.test.js,facturacio/registre/portIndexedDB.test.js,facturar/Facturacio.test.jsx}` | 3 | 13.855 | mitja | Fusió condicionada, o preguntar al Mestre. Primer afegir a `tests/helpers/idbFals.js` `toca()` i un mode `creaIdbFals({ nomesAfegir: true })` sense `put`, `delete` ni `clear`. `magatzemPerfil.test.js` (3.296 B) conserva el seu fals o es reescriu. | Vegeu A.3. | Sí, si es repunta sense estendre el helper: `cofre.test.js` (`idb.toca`), `magatzemPerfil.test.js:192-193`, i `Facturacio.test.jsx` perd en silenci la guarda «només afegir». |
| F04 | `src/{ARCHITECTURE,GLOSSARI}.md` | 2 | 4.408 | baix | Rescatar Shadow DOM, `queueMicrotask` i filosofia Pedra Seca; retirar el que és fals. Destí: vegeu A.6.4. | Contradiuen `host.js:3-10`, `autodesament/cua.js`. Camí trencat a `.agents/skills/pedra-seca`. | No. Si el destí és la wiki, cal regenerar `src/data/wikiManifest.js`. |
| F05 (c) | `src/data/SELF-DESCRIBE.md` | 1 | 1.892 | baix | Portar §2 (`host.js` congela el contracte, `injectaBackendDelPaquet`) i el detall de §4 (`isConnected`, germans vius). Corregir alhora `ARCHITECTURE.md:8` (Online-First) i `:13` (injecció via `host.js`). | `cua.js:9-10` encua a IndexedDB; `supabaseBackend.js` no existix. | No |
| F06 | `ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-{1,2}.png` | 2 | 82.546 | mitja | Una sola entrada universal d'escala única, quan se substituïsca el placeholder (P37). | 3 PNG amb el mateix SHA-256. | No. Verificar amb un build d'Xcode (`LaunchScreen.storyboard:27`). |
| F07 (c) | `tooling/scripts/ancora.mjs` | 1 | 5.183 | mitja | Portar-ne el cos a `tooling/brain/ancora.mjs` (el que crida la skill amb `--pon`) conservant `--llista` i `--torna` sobre `refs/sdp/ancora/*`. | Existix l'àncora viva `refs/sdp/ancora/260831_014244`. | No |
| F08 (c) | `tooling/maquinaria/rebuild_skills_index.mjs`, `tooling/wiki/sincronitzar_skills.mjs` | 2 | 182 | mitja | Esborrar els dos àlies idèntics de `catalegCLI()`. Amb vistiplau del Mestre per tocar la prova. | `cmp`: idèntics. | Sí: `tests/backend_consolidacio.test.mjs:49` (línies 55-56, requiredPrimary). |
| F09 | 8 parelles idèntiques del cens de l'Arxiu (`uploads/empresa/.../el-projecte/{nano-banana,art-iaia-v4,art-trellat-v3,exemple-de-poble-001}.*`, `ajuntament/.../collita-poma-local.*`, `companies/mercat/camiseta_portada.*`, `poble/penaguila/img-pen-guila-main.*`, `poble/la-torre-de-les-macanes/img-la-torre-de-les-ma-anes-main.jpg`) | 15 | 8.168.336* | baix | Cada còpia passa de `CENS_IMATGES` a `EXCLOSES` («còpia de <original>»). No s'esborra cap fitxer. | `cmp` 8/8. El cens passa de 150 a 142 (mínim 100). | No. Els `?foto=cens-…` de les 8 còpies deixen de resoldre. |
| F10 | `_wiki_de_poble/04_escriptori/01_produccio/{mur_per_a_video,mercat_nou_per_a_video}.jpg` | 2 | 2.563.954 | baix | Triplicats: n'hi ha prou amb la còpia de Targetes (M16) i la de `public/`. | `duplicats.json`. | No, si es retiren les àncores `00_index_escriptori.md:633-634`. |
| F11 | `_wiki_de_poble/04_escriptori/01_produccio/checklist-limpieza-wp-ayudawp.{csv,txt,md}` | 3 | 51.176 | baix | Quedar-se el `.xlsx` i el `-complet.csv`. Reapuntar l'àncora `00_index_escriptori.md:32` al `.xlsx`. | El `.csv` cap dins del `-complet.csv`; el `.md` fa 0 B. | No, si es reapunta l'àncora. |

\* No recuperable: la fusió només canvia el cens.

##### A.2.6 Preguntar al Mestre

| ID | Camí | Fitx. | Bytes | Risc | Decisió que cal | Evidència | Proves |
|---|---|---:|---:|---|---|---|---|
| P01 (c) | `src/sections/notes/ConnexioDetall.jsx` (+prova) | 2 | 43.398 | baix | Retirada D4 pendent. Recomanació: retirar-lo. | `ConnexioDetall.jsx:5-8`. `.agents/ESTAT.md:377`. Únic importador: la seua prova. | Si es retira: 5 llistes de proves (`qualitat.boinaAlPerfil.test.js:70`, `qualitat.comentar.test.js:44`, `lint_enxufe.test.mjs:79`, `lint_logica_usuari.test.mjs:36, :89`, `lint-sessio.test.mjs:285-286`), el `vi.mock` de `NotesDetail.test.jsx:8` i la regla `modules.css:8053-8066`. Deixa exports només amb prova (`connexions.js`, `paginaDeText.js`). |
| P02 (c) | `src/sections/gestoria/font/handleStore.js` (+prova) | 2 | 15.252 | baix | Endollar-lo a `useGestoria` o retirar-lo. Esquiva la llista blanca IndexedDB amb `['indexed','DB'].join('')`. | `handleStore.js:24, :28`. `privacitat.test.js:159-167` no inclou `sdp-gestoria-handles`. | No si es retira amb la prova. Si s'endolla, `privacitat.test.js:160-167` caurà fins a l'aprovació. |
| P03 | `src/sections/gestoria/nucli/{inflate,zip,csv}.js` | 3 | 35.349 | alt | Reaprovar els tractors amb un motor únic o assumir la duplicació amb `src/utils/fulls/`. Les còpies ja han divergit. | `utils/fulls/inflate.js:5-9`. Fonts a `tractors.js:38, :69, :74, :137, :212, :337`. | Tocar els originals reobri les aprovacions. Retirar les còpies trenca `gestoria/privacitat.test.js:231`, `apps/nevera/frontera.test.js:38`, `apps/salut/privacitat.test.js:70` i altres. |
| P04 (R) | Blocs `describe('ESLint')` de 33 portes de `src/sections` (~99 fitxers al repositori) | 33 | 23.630 | mitja | Decisió transversal, no per àrea. Alternativa sense pèrdua: un helper `tests/helpers/portaEslint.js` d'una línia per porta. | Vegeu A.3. | No, però es perden el cens `toHaveLength` i la sonda de configuració. |
| P05 | `src/utils/{ics,ics.test}.js` | 2 | 15.668 | baix | Botó «Afig al meu calendari» al calendari públic, o `.sdp-paperera/`. | `ics.js:5-7`. La Gestoria té veto (`icsTerminis.js:5-7`). | No |
| P06 (R) | `src/components/PedraSeca/{molecules/Dropdown,organismes/UniversalIndicatorCard}.jsx` | 2 | 2.569 | mitja | Retirada amb la llista completa de tocs, o marcar-los `obsolet` al registre. Decidir què es fa amb la maqueta `.stat-card`. | Vegeu A.3. | Sí, si s'esborren parcialment: `allLoaders.test.jsx`, `manifest.icones.test.js`, porta `tractor-cataleg.mjs` (C3). |
| P07 | `src/components/PedraSeca/molecules/{Botonera,Pista}.jsx` | 2 | 2.648 | baix | Adoptar-les on toca o retirar-les amb els espècimens. | Només el catàleg les consumix; no són contracte. | Sí, si es retira `Botonera`: `tests/lint-sessio.test.mjs:643` (suite session). |
| P08 | `src/apps/bar/llavors/laParroquia.test.js`, `src/apps/nevera/nucli/productes.test.js`, `src/utils/temporada/cobertura.test.js` | 3 | 31.443 | baix | Repuntar les constants a `../_arxiu_wiki_de_poble/01_Produccio/` (o `../_menjar_i_beure_de_poble/`), o acceptar l'execució manual. No tocar `PRODUCCIO` (:33, :178). | 7 assercions saltades; amb els originals, verdes (592 de 592). | No. Repuntar activa 7 assercions; en un clon net continuaran saltant-se. |
| P09 (c) | `src/data/wikiManifest.js` | 1 | 551.254 | mitja | Desversionar només amb compilació prèvia a `run-node-tests.mjs`, `test`, `test:unit`, `dev` i `build:wp`, amb la mateixa decisió per a `rag-index` i `slugIndex`. | 36 commits, 73 blobs. CI: `wiki-integrity.yml:45` corre `test:ci` sense compilar. | Si es desversiona sense el pas: ≥7 proves, les que importen `WikiDePobleSection`/`BrainGraph`/`DetallPeca` sense mock, `standalone-build` i `natiu-build`. |
| P10 (R) | `public/assets/uploads/gent/avatars/*` | 23 | 8.299.585 | baix | Consulta a la BD de producció (A.6.5). Sense resultats: eliminar amb `COPIES_DELS_AVATARS`, `censImatges.js:230` i `censImatges.test.js:132`. | `seed.sql` de d75a852c les porta 4 vegades. | Sí: `censImatges.test.js:132` i `:85`. |
| P11 (R) | `public/assets/uploads/avatars/{iaia_comic_matriarch.{png,webp},javi-llinares-foto_perfil-01.jpg}` | 3 | 1.628.154 | baix | Consulta prèvia a `app_content`. | `seed.sql` fins al 24-08; cap migració no els reescriu. | Sí, si no es lleven d'`EXCLOSES`: `censImatges.test.js:85`. |
| P12 (R) | `public/assets/uploads/brain/cuc-de-pi-poster.{png,webp}` | 2 | 1.332.699 | baix | Consulta prèvia. Sense resultats: eliminar i llevar `censImatges.js:235`. | Incrustada en markdown a `seed.sql` de d75a852c. | Sí, si no es lleva l'entrada: `censImatges.test.js:85`. |
| P13 (c) | `public/assets/uploads/ia/{02 … 15}-*/avatars/*` | 17 | 5.293.228 | alt | Consulta ampliada (A.6.5). Si es conserven, corregir el motiu de `05/.../carla-soriano-ibanez.png` (sense àlies). | Producció les servix (200 image/png); no servix `uploads/avatars/`. | Sí, si s'esborren sense `COPIES_IA`: `censImatges.test.js:85`. |
| P14 | `public/assets/uploads/brain/avatar_ratoli_comic_1778960942888.{png,webp}` | 2 | 1.246.067 | mitja | Consulta prèvia. | Avatar de grup del Xat vell (d75a852c). Producció la servix. | Sí, si no es lleva `censImatges.js:234`. |
| P15 | `public/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.{jpg,webp}` | 2 | 645.322 | mitja | Dada personal a més resolució de la necessària. Còpia a `../_multimedia_de_poble/antic_sistema/`. | Cap ús al codi. Producció la servix. | Sí, si no es lleva `censImatges.js:233`. |
| P16 | `public/auth/callback.html` | 1 | 7.997 | alt | Despublicar el relé OAuth retirat. Comprovar les Redirect URLs de Supabase. | `callback.html:12-17` reserva la decisió al Mestre. | Sí: `oauthRelay.test.js:263` i el `prebuild` (`saneja-callback.mjs` avorta). |
| P17 | `public/assets/{uploads/poble/la-torre-de-les-macanes/og_gentdelatorre_*,towns/la-torre-de-les-macanes/og-la-torre-1200x630.jpg}` | 9 | 1.492.506 | mitja | Triar la targeta que usa gentdelatorre.net; la resta a `../_multimedia_de_poble/`. | Cap meta, PHP ni codi les usa. Una és idèntica a una altra. | Sí: `censImatges.test.js:154-155` (exactament 9). |
| P18 (c) | Logos i insígnies: `gentdelatorre-logo-bn-*`, `logo-rentonar-socdepoble-1600-c.jpg`, `antigravity-badge.*`, `empresa/soc-de-poble/avatars/logo-socdepoble-cuadrat-verd.svg` | 10 | 1.911.598 | mitja | Consulta prèvia, afegint `gentdelatorre-logo`. Totes tenen còpia a `../_multimedia_de_poble/antic_sistema/`. | `seed.sql` els va portar fins al 24-08. | Sí, si no es lleven de `censImatges.js:239-243`. |
| P19 | `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/el-projecte.epub` | 1 | 33.947 | mitja | Si cap post no l'enllaça: `../_multimedia_de_poble/documents_i_pdfs/`. | Producció el servix; cap referència. | No |
| P20 | `public/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png` | 1 | 48.414 | baix | Revocar o no l'ordre del 18-10 («es queda a `public/`»). | `censImatges.js:244-248`. | Sí: `censImatges.test.js:151` o `:85`. |
| P21 | `public/assets/ui/plugins/tpv_vinyeta.jpg` | 1 | 1.013.445 | baix | Aixecar o no el «cap esborrat». Còpia a l'Escriptori. | `registrePlugins.test.js:133-147`. | Sí: `registrePlugins.test.js:145, :147`. |
| P22 | `public/assets/system/ui/og-socdepoble-1200x630.jpg` | 1 | 115.929 | baix | Connectar-la com a `og:image` lleugera o eliminar-la. | 0 referències; la va afegir 1e6ffece. | No |
| P23 | `public/assets/system/ui/logo-socdepoble-rect.svg` | 1 | 125.585 | mitja | Mateixa peça que `rect-blanc` (fusionar i corregir 6 plantilles) o logotip «estàndard» perdut. | `cmp`: idèntics. Llavors antigues el van usar. | No |
| P24 | `.immunitari/aprovacions/*.aprovat.json` | 4 | 624 | baix | Si es desversionen, afegir `.immunitari/aprovacions/` al `.gitignore` en el mateix canvi. | Versionades a posta (fa072639, 6442179f). | No. Sense ignorar-les, `aplica` es bloqueja. |
| P25 | `tooling/broker/{broker,broker.test}.mjs` | 2 | 45.482 | mitja | Producte pendent o investigació (`../_investigacio_ia_de_poble/`). | Prototip mai desplegat (75a560c1). | Sí, si s'esborra la prova sense llevar `node-suite-manifest.json:545`. |
| P26 | `tooling/migrations/01_migrar_urls_absolutes.mjs` | 1 | 2.939 | mitja | Si s'ha executat, eliminar. Si no, convertir-la en migració SQL. | Sense constància d'execució. Usa `SUPABASE_SERVICE_ROLE_KEY`. | No |
| P27 | `tooling/session/saneja_torns_caducats.mjs` | 1 | 4.928 | baix | Endollar-lo (npm o `cron_higiene`) o retirar-lo. | Sense llançador; es va executar a mà (acta 261014_1315:73). | No |
| P28 | `tooling/brain/somiador.mjs` | 1 | 3.934 | mitja | Endollar o retirar (solapa amb `olivera:arxiva`). | Sense llançador. | Sí: `tests/fortificacio.test.mjs` (3 proves P-3, requiredPrimary). |
| P29 (R) | `tooling/wiki/{generar_genoma_v2,hidratar_genoma}.mjs` | 2 | 12.503 | baix | Estratègia del «Clon» byte-fidel; l'acta de purga no en parla. | `generar_genoma_v2.mjs:170-171`. `hidratar_genoma.mjs:3-8`. | No |
| P30 (R) | `tooling/wiki/.cache-tractor.json` | 1 | 25.885 | baix | Preguntar, o eliminació coordinada: fitxer + `corpus-scope.mjs:17` + `corpus-scope.test.mjs:76-81` (o exempció a `tractor-arrel.mjs:219`). | Vegeu A.3. | Sí: Porta Arrel (A5) i `tests/corpus-scope.test.mjs` (primary). |
| P31 (R) | `INTEGRACIO.md` | 1 | 2.366 | mitja | Fusionar a `tractor-psicopatia.mjs` llevant-lo de `crear_bundle.mjs:112` i l'enllaç de `00_index.md:88`, o conservar-lo. | Vegeu A.3. | Sí: `crear_bundle.mjs --perfil=sollutia` avorta. |
| P32 | `bot/**`, `Dockerfile`, `docker-compose.yml`, `.dockerignore` | 12 | 111.825 | mitja | Viu (endollar `bot/immunite.mjs`, purga RGPD) o dormit (satèl·lit o retirada). | La imatge no podria arrancar: `cervell.mjs:8` importa fora de `bot/`. | No |
| P33 | `_templates/gestoria_base/**` | 8 | 2.835 | baix | Citar-la al README o moure-la a `../_gestoria_de_poble/`. | Ja instanciada al satèl·lit. | No |
| P34 (R) | `tests/plantilla-viva-installacio.test.mjs` | 1 | 29.215 | mitja | No arxivar. Arreglar `contextResumit` i passar-la a primary, o extraure'n les proves de `plist()` i `--staged`. | Vegeu A.3. | Sí, si s'arxiva sense llevar `node-suite-manifest.json:415`. |
| P35 | `tests/salut-diari-miccional-estructura.test.mjs` | 1 | 54.422 | baix | (a) Repuntar a `../_salut_de_poble/` o (b) retirar-la. La (b) és més prudent: dades de salut nominals. | Se salta sempre (0/0/8). | Si es retira, llevar `node-suite-manifest.json:460`. |
| P36 | `tests/fatiga-261002.test.mjs` | 1 | 54.441 | baix | Passar-la a primary: és l'única cobertura de `fatiga-hook.mjs`. | 18 passen, 0 fallen. | No. Si laboratory quedara buida: «La suite laboratory és buida». |
| P37 | `ios/App/App/Assets.xcassets/{AppIcon.appiconset/AppIcon-512@2x.png,Splash.imageset/splash-2732x2732.png}` | 2 | 151.795 | mitja | Substituir el placeholder de Capacitor per la marca (P0-07 de Gemini). No esborrar. | Inspecció visual: X blava de Capacitor. | No |
| P38 | `.agents/runtime/turns/torn_*.json` (256 tancats sense reflex) | 256 | 62.009.764 | mitja | Arxivar-los via executor-mutacio a `../_arxiu_wiki_de_poble/` amb els 40 contractes exclusius (0,69 MB). No compactar ni desversionar en bloc. | `readTurn` refusa els tancats; cap reflex hi apunta. Decisió de versionar: Mestre, 260923. | No |
| P39 (R) | `_wiki_de_poble/04_escriptori/01_produccio/loyverse_clon{,_mobil}/*` | 63 | 11.390.323 | baix | Eliminar només si es reapunta `sdp-clon-loiverse/SKILL.md:25` a `../_arxiu_wiki_de_poble/01_Produccio/` i es torna a segellar la skill. | Vegeu A.3. | Editar la skill sense segellar posa roja `segella.mjs`. |
| P40 | `_wiki_de_poble/04_escriptori/01_produccio/{iaia_maria_avatar.jpg,iaia_maria_avatar_mobil_261021.png}` | 2 | 1.408.561 | baix | Arxivar a `../_multimedia_de_poble/00_inbox/` (Oblit saludable, §16) o mantindre l'àncora d'ahir. | Duplicats de `public/assets/uploads/brain/`. | No |

#### A.3 Refutades per la verificació

Onze troballes no s'han sostingut tal com es proposaven. Cap d'estes accions originals es proposa. Totes tenen acció corregida, ja inclosa a A.2.

| Camí | Acció original | Motiu de la refutació | Acció corregida |
|---|---|---|---|
| `src/sections/gestoria/{cofre,portIndexedDB,Facturacio,magatzemPerfil}` (proves) | fusionar | `tests/helpers/idbFals.js` no és la unió canònica: no té `toca()` (`cofre.test.js:143-146`, cridat 8 vegades), `magatzemPerfil` usa un model d'un sol store (`:110, :118, :192-193`) i tres falsos no tenen `put`/`delete`/`clear` a propòsit (llibre Veri*Factu de només afegir). | F03: fusió condicionada, o preguntar. |
| Blocs ESLint de 33 portes de `src/sections` | fusionar | Convenció de tot el repositori (73 fitxers a `src`, 26 a `tests` i `tooling`). Motiu documentat: agents engabiats (`lint-sessio.test.mjs:3-5`), `--no-verify` freqüent, CI només en PR o `main`. Cada bloc fa també de cens i de sonda. | P04: preguntar com a decisió transversal. |
| `PedraSeca/{Dropdown,UniversalIndicatorCard}.jsx` | eliminar | Cap ordre del Mestre retira els components (només usos concrets). `registre.js:44-45, :66` els marca `viu` i `tractor-cataleg.mjs` C2 obliga a tindre espècimen. Llista de tocs incompleta (`manifest.js:134, :298`, `ICONES_ESPECIMENS`, maqueta `.stat-card`). | P06: preguntar, o marcar `obsolet`. |
| `public/assets/uploads/gent/avatars/*` | eliminar | Llavors antigues van sembrar `app_content` amb estos camins (`seed.sql` d75a852c, 4 vegades) i el mapejador els pinta tal qual (`mapejadorSeccions.js:92-96`). El cens hi té un àlies a posta. | P10: preguntar amb consulta a la BD. |
| `public/assets/uploads/avatars/` (9 còpies) | eliminar | `iaia_comic_matriarch` i `javi-llinares-foto_perfil-01` van ser a `seed.sql` fins al 24-08 i cap migració no els va reescriure. Els altres tres noms no han estat mai en cap llavor. | E12 (6 fitxers) i P11 (3 fitxers). |
| `public/assets/uploads/brain/cuc-de-pi-poster.{png,webp}` | eliminar | La primera llavor la incrustava en markdown dins d'una publicació del Mur i el backend vell la triava per paraula clau (d75a852c). | P12: preguntar amb consulta. |
| `tooling/wiki/{compile-wiki-to-system-prompt,generar_genoma_v2,hidratar_genoma,compile-cultura}.mjs` | eliminar | Només dos generen `.agents/GENOMA.md`/`CULTURA.md`. `generar_genoma_v2` i `hidratar_genoma` són el parell del Clon byte-fidel, que l'acta 260922_2200 no regula. | E29 (2 fitxers) i P29 (2 fitxers). |
| `tooling/wiki/.cache-tractor.json` | eliminar | Esborrar-lo afig una infracció A5 a la Porta Arrel (`corpus-scope.mjs:17` el cita), i llevar el literal trenca `tests/corpus-scope.test.mjs` (primary). Verificat en còpia. | P30: preguntar o eliminació coordinada. |
| `INTEGRACIO.md` | fusionar | `crear_bundle.mjs:107-113` l'exigix al perfil `sollutia` i avorta si falta (:510-518). Esborrar-lo també trenca l'enllaç de `00_index.md:88` (4 portes). | P31: preguntar. |
| `tests/plantilla-viva-installacio.test.mjs` | moure_satellit | Ja no depén del laboratori: les marques dels pegats són al codi instal·lat i els `.patch.txt` no es lligen. És l'única cobertura de `plist()` i del camí `--staged` que `.husky/pre-commit:8` executa. Les 2 proves roges fallen per deriva de la plantilla Context (`contextResumit:210`). | P34: preguntar; no arxivar. |
| `_wiki_de_poble/.../loyverse_clon{,_mobil}/*` | eliminar | La skill activa `sdp-clon-loiverse` (`SKILL.md:25`) mana estudiar estes captures a `01_produccio`; P1-01 (TPV) està `[PARCIAL]`. | P39: preguntar; eliminar només amb la skill reapuntada i segellada. |

Correccions menors dins de troballes confirmades (marcades «c» a A.2): E01, E19, E28, F05, F07, F08, M14, P01, P02, P09, P13, P18, Q02, Q03. Dues evidències confirmades portaven dades errònies que no canvien l'acció: D04 (`git ls-files -ci` en torna 502, no 3; la pujada al remot `fork` no s'ha pogut confirmar) i M08 (en un arbre complet una prova falla, no totes se salten).

#### A.4 Conservar notables

El que sembla brossa però no ho és.

| Camí | Fitx. | Bytes | Sembla | Per què es conserva |
|---|---:|---:|---|---|
| `src/sections/pobles/pobleDeViquipedia.js` (+prova) | 2 | 36.727 | Només proves | Fase 2 lliurada, fase 3 pendent. `paginaDeText.test.js:13` n'importa `DRETS_*` i :237-246 vigila que ningú no el crida. |
| `src/sections/gestoria/{identitat,burocracia,projectes}/nucli/**` | 16 | 172.465 | Sense consumidor | Models purs per ordre del Mestre del 261004; `fronteraModelsPurs.test.js:2-9` vigila que no s'endollen. |
| `src/sections/gestoria/documents/{plaNeteja,rebutEsborrat}.js` (+proves) | 4 | 52.633 | Adormits | Pla del MAPA §3.1 fins al «pas 7» (`ShellGestoria.jsx:188`). |
| `src/sections/{gestoria/fitxes,tractors/sentinelles/fitxes}/*.md` | 14 | 84.603 | Documentació solta a `src` | Fitxes signades llegides amb `?raw` per a l'empremta que aprova el Mestre. |
| `src/sections/disseny/cataleg/guardaEmojisSafari16.js` | 1 | 2.470 | Només proves | Còpia única de la guarda, compartida per 3 proves. |
| `src/sections/dispositius/__fixtures__/canalFals.js` | 1 | 1.829 | Duplicat de `navegadorFals` | API distinta (`addEventListener`, `InvalidStateError`). |
| `src/sections/disseny/cataleg/dades/emojisUnicode18.js` | 1 | 292.343 | Generat | Dada estàtica d'Unicode amb SHA-256 i llicència; no hi ha generador. Càrrega en diferit. |
| `src/sections/disseny/cataleg/versio.js` | 1 | 15.887 | 16 KB de comentari | Política del Mestre (260928); `versio.test.js:25-40` llig la capçalera. |
| `src/sections/profile/PerfilShell.css` | 1 | 13.764 | No-mòdul sense importador | `src/css/index.css:66` (`@import … layer(components)`). |
| `src/sections/multimedia/legacyMedia.js`, `src/sections/mur/datesDeProvaMur.js` | 2 | 10.462 | Noms de laboratori | Llavor viva (`mediaContent.js:5`) i capa seed (`content.js:10`). |
| Proves `*{revisio,onada6,onada12,…}*` de `src/sections` | 9 | 116.567 | Noms de ronda | Regressions vives; cap `skip`. |
| `src/sections/consola/govern/canonic.js` | 1 | 5.032 | Còpia | Frontera de privacitat; paritat byte a byte a `canonic.test.js`. |
| `src/components/PedraSeca/organismes/{GraellaArticles,LlistaArticles}.jsx` | 2 | 9.196 | `@deprecated` | Contracte publicat del nucli 1.1.0 (`contracteNucli.js:87, :90`); llevar-les és canvi major. |
| `src/apps/nevera/importador.js` | 1 | 14.669 | Només proves | Única manera de regenerar `nucli/productes.js` (77 KB). |
| `src/components/universal/enquadrament/jpegProva.js` | 1 | 5.291 | Només proves | Generador de JPEG sintètics; 23 consumidors. |
| `src/apps/plataforma/guardesDelModul.js` | 1 | 6.494 | Només tooling | Porta de seguretat del build de mòduls (`vite.modul.config.js:52`). |
| `src/components/PedraSeca/{alergens,catalegColleccio,pecesApps,tpv}.css`, `UniversalListCard.css` | 5 | 72.482 | Autoreferència | L'«@import» és un comentari; `index.css:72-85` els importa. |
| `src/css/design-tokens.css` | 1 | 222 | Generat versionat | `tokens.contracte.test.js:117` en vigila la deriva; un clon net el necessita. |
| `src/apps/bar/llavors/la-parroquia-loyverse.csv`, `src/apps/lector/llavor/*.xml` | 6 | 79.672 | Dades soltes | Llavors de DEV per `?raw`; les fronteres les exigixen per nom. |
| `src/**/__fixtures__/**` (nucli) | 18 | 55.997 | Només proves | Convenció; tots amb consumidor. |
| `src/apps/bar/correccions*.test.jsx`, `src/css/*.capes.test.js` i altres | 8 | 113.806 | Noms de laboratori | Regressions verdes de troballes concretes. |
| `src/data/adaptadors/viquipedia/*` | 5 | 61.428 | Sense consumidor d'app | Fase 2 amb 15 captures reals; única composició real de `creaFrontissa`. Si es renuncia a la fase 3, tota la cadena junta a `.sdp-paperera/`. |
| `src/data/adaptadors/sollutia/*` | 5 | 11.282 | Només proves | La Frontissa (doctrina). A.6.2. |
| `src/data/conformitat/*` | 3 | 57.088 | Només proves | Contracte del port (`kit.js:1`). |
| `src/config/politicaDeMitjans.js` | 1 | 5.516 | Només tooling | Política de bessones WebP per al build i l'empaquetador. |
| `src/config/design-tokens.json` | 1 | 856 | Sense consumidor de codi | CAPA 0 de `build:tokens`. |
| `src/data/*Seed.js` | 5 | 78.783 | Dades de prova | Padró de producció. |
| `src/config/{hostAdapter,hostIframeAdapter}.test.js` | 2 | 5.985 | Proves d'un mòdul inexistent | Úniques proves unitàries de `src/host.js`. Com a molt, renomenar. |
| Fotos DSC i P_2016 de La Torre, `IMG_20200904_143451.jpg` (+bessones) | 11 | 19.858.884 | Pesades | Fotos reals úniques; font de les bessones. El remei és estendre la política de bessones al build web. |
| `public/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg` | 1 | 256.046 | Còpia | Una fila remota d'`app_content` porta este camí (`mediaContent.test.js:174-182`). |
| `public/assets/uploads/brain/{nano_astronauta_esmorzar,nano_mercat_llaurador,ibanez_pedra_seca_design}.*` | 6 | 3.891.174 | Duplicats | El codi viu els nomena. |
| `public/sitemap.xml` | 1 | 1.790 | Generat | S'escriu a mà (`navigation.canoniques.test.js:51-52`). |
| `public/auth/calendari-google.{html,js}` | 2 | 3.393 | Relé OAuth | Tornada viva de Google Calendar (`configFonts.js:35`). |
| `public/{sw.js,manifest.webmanifest,icones,favicon.svg,.htaccess,robots.txt}` | 8 | 61.000 | Duplicats amb Android | Cada plataforma necessita les seues. |
| `public/assets/**/*.webp` | 132 | — | Duplicats | Bessones per política (`politicaDeMitjans.js:47-70`). |
| `.husky/*` | 5 | 779 | Hooks trivials | El Reflex els exigix amb contingut exacte. |
| `scripts/enllacat-intelligent-wiki.mjs`, `tooling/wiki/{sdp,contradiction_engine}.mjs`, `package.json`, `schema-cutover.lock.json`, `core/{a11y_seo,lint,runner,search_cli,snapshot_engine,translate,safety}.mjs` | 12 | — | Sense llançador | `CRITICAL_SEED_PATHS` del Reflex o la seua clausura (`reflex_petorreta.mjs:89-136`). |
| `AGENTS.md` | 1 | 12.078 | Duplicat de `.agents/AGENTS.md` | Mirall per disseny (`governanca-260930-lease.test.mjs:55`). |
| `vercel.json` | 1 | 1.046 | Producció és Firebase | Contracte d'allotjament fixat per proves. |
| `.escriptori-arrel` | 1 | 58 | Brossa | Sentinella de `canonada.mjs:9`. |
| `tooling/sollutia/{captura-contracte,forma}.mjs` | 2 | 2.670 | Sense consumidor | Captura del contracte GET de Sollutia. |
| `tooling/verify-bios.mjs`, `tooling/brain/{crear_bundle,farcell,tracker_consum,desenterrar}.mjs`, `tooling/wiki/{codemod_frontmatter.mjs,lib/frontmatter_pla.mjs}` | 7 | — | Fora de `package.json` | Doctrina o remei d'una porta viva. |
| `scripts/fetch_town_media.mjs` | 1 | 7.583 | Sense llançador | Procedència de les fotos dels pobles (`censImatges.js:48`). |
| `.immunitari/{baseline.json,config.json,.gitignore}`, `requirements/**`, `scripts/immunitari/*.plist` | — | — | Al costat de brossa | Lector viu en tots els casos. |
| `supabase/migrations/*.sql` | 47 | — | Revertides o amb nom de laboratori | Història aplicada; mai s'esborren. |
| `supabase/seed.sql` | 1 | — | Generat | El lligen guardes i la CLI. |
| `supabase/snippets/2610181800_*_javi_llinares.sql` | 2 | — | D'un sol ús | `identitatsSeed.pilot.test.js:202` en vigila la paritat. |
| `wordpress-plugin/builds/{stable,1.1.8}.json(.sig)` | 4 | — | Duplicats | Canal i release en curs. |
| `tests/frontissa/fixtures/**` | 16 | — | Sense refsDocs | Fixtures de la Frontissa i de la Viquipèdia. |
| `tests/gauntlet-codex-*` | 5 | — | Laboratori d'IA | Assajos opt-in vius. |
| Suite session (`tests/{cerca,lint,portes,enllacos,frontmatter}-sessio`, `lint-torn-261002`, `governanca-260930-segell`, `gestoria-{3t,c43}-real`) | 9 | — | Noms datats | Eines de lectura per a agents engabiats. |
| `tests/fixtures/xat-entitats/bootstrap.sql` | 1 | — | Sense cita | En depén `regression.sql`. |
| Android `drawable/splash.png`, `ic_launcher_round.xml`, `mipmap-xxxhdpi/ic_launcher.png`, `gradle-wrapper.jar` | 4 | — | Duplicats o binaris | Requisits d'Android i Gradle. |
| `.agents/runtime/turns/torn_*.json` (83 oberts o amb reflex) | 83 | 36.106.582 | Pes mort | El pre-commit els llig de l'índex (`porta-documents.mjs:29-31`). |
| `.agents/runtime/contracts/*.json` | 77 | 1.347.519 | JSON generats | Instantànies del contracte; 77 de 77 referenciades. |
| `_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md` | 1 | 2.136 | Nota vella | Fitxa de la Porta Graella (`tractor-graella.mjs:26`). |
| `_wiki_de_poble/04_escriptori/01_produccio/alergens_svg/*` | 19 | 707.002 | Duplicat del satèl·lit | Originals de la prova de fidelitat (`qualitat.alergens.test.js:56`) i màster `.af`. |
| `_wiki_de_poble/04_escriptori/01_produccio/patrimoni_oral_mestre/*.webm` | 20 | 13.006.741 | Binaris pesats | IDEA-03 [ACTIU]; única còpia fora de la màquina. |
| `_wiki_de_poble/04_escriptori/01_produccio/xat_portada.jpg` | 1 | 1.192.696 | Còpia de `public/` | Màster d'alta qualitat (la de `public/` és una recompressió). |
| `_wiki_de_poble/04_escriptori/01_produccio/{article-ayudawp.md,checklist-…xlsx,…-complet.csv}` | 3 | 517.739 | Bolcat de tercers | Entrada de P0-13 [PENDENT]; no es publica. |

#### A.5 Xifres

Calculades per script sobre les taules d'A.1 i A.2.

**Revisió.** 4.620 fitxers revisats de 5.126 versionats (90,1 %), en 308 files de cobertura. 179 troballes: 119 propostes d'acció verificades i 60 de conservar. La verificació n'ha refutat 11 (9,2 %) i n'ha corregit 14 més. Les 11 refutades donen 13 files d'A.2, perquè dues es dividixen (E12/P11 i E29/P29).

**Per acció.**

| Acció | Propostes | Fitxers | Bytes | Amb proves o portes afectades |
|---|---:|---:|---:|---:|
| Eliminar | 44 | 284 | 46.975.952 | 2 |
| Desversionar | 5 | 508 | 13.949.434 | 0 |
| Quarantena | 3 | 3 | 117.476 | 1 |
| Moure a satèl·lit | 18 | 100 | 27.781.763 | 7 |
| Fusionar | 11 | 37 | 10.909.053 | 2 |
| Preguntar al Mestre | 40 | 483 | 99.227.529 | 23 |
| **Total** | **121** | **1.415** | **198.961.207** | **35** |

Lectura dels bytes:

- **Ixen de l'arbre de HEAD amb el que ja està confirmat** (eliminar, desversionar, quarantena, moure i fusionar sense F09): 91.565.342 B, uns 91,6 MB, al voltant d'un 21-22 % dels 414,1 MB de l'arbre. Són 895 fitxers d'eliminar, desversionar, quarantena i moure, més les fusions.
- **Desversionar** (13,9 MB) trau els fitxers de l'índex però es queden al disc.
- **Fusionar**: 2.740.717 B recuperables. D'ells, 2.697.676 B són fitxers que ixen sencers (F06, F10, F11); els 43.041 B restants són fusions de codi i documentació amb un estalvi net menor. F09 (8.168.336 B) només canvia el cens: 0 B recuperables.
- **Preguntar al Mestre**: 99,2 MB en joc, dels quals 62,0 MB són els 256 torns tancats (P38).
- «Amb proves o portes afectades» compta les propostes que trenquen alguna prova o porta si s'apliquen sense els canvis acoblats indicats a la fila.

**Per àrea i acció** (nombre de propostes).

| Àrea | Eliminar | Desversionar | Quarantena | Moure | Fusionar | Preguntar | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| src-seccions | 1 | 0 | 0 | 1 | 3 | 4 | 9 |
| src-nucli | 1 | 0 | 0 | 0 | 1 | 4 | 6 |
| src-dades | 2 | 0 | 0 | 0 | 1 | 1 | 4 |
| public-i-mitjans | 8 | 1 | 1 | 0 | 1 | 14 | 25 |
| tooling-i-arrel | 25 | 2 | 0 | 2 | 2 | 10 | 41 |
| backend-natiu-proves | 6 | 1 | 0 | 11 | 1 | 4 | 23 |
| pes-del-govern | 1 | 1 | 2 | 4 | 2 | 3 | 13 |
| **Total** | **44** | **5** | **3** | **18** | **11** | **40** | **121** |

**Risc** de les 121 propostes: 83 baix, 35 mitjà, 3 alt (P03, P13, P16).

**Les deu més pesades.**

| ID | Camí | Acció | Bytes |
|---|---|---|---:|
| P38 | 256 torns tancats sense reflex | preguntar | 62.009.764 |
| E44 | `01_produccio/WhatsApp-Clon-0{1,2}` | eliminar | 32.906.177 |
| M15 | `01_produccio/captures_claude` i afins | moure | 14.110.101 |
| P39 | `01_produccio/loyverse_clon{,_mobil}` | preguntar (R) | 11.390.323 |
| M16 | `01_produccio/Targetes_Davinci_Llestes` | moure | 9.418.785 |
| E05 | `assets/img/*` (arrel) | eliminar | 9.167.264 |
| P10 | `public/assets/uploads/gent/avatars/*` | preguntar (R) | 8.299.585 |
| F09 | 8 parelles del cens | fusionar (0 B recuperables) | 8.168.336 |
| D02 | `.immunitari/receptes/*` | desversionar | 7.542.431 |
| P13 | `public/assets/uploads/ia/*/avatars/*` | preguntar | 5.293.228 |

#### A.6 Observacions transversals

##### A.6.1 Escàner mecànic: correccions

- Els globs `?raw` no es distingixen. `registreTractors.js:24-27` porta `gestoria/**/*.{js,jsx,md}` com a text, i 11 mòduls de la Gestoria semblaven vius sense ser-ho.
- Els `refsCodi` de `no_moduls.json` estan inflats per les instantànies de `.agents/runtime/turns`. Exemples: 340-341 per a `ARCHITECTURE.md` i `GLOSSARI.md`, 339 per a `taxonomy-registry.json`, 110 per a `idbFals.js`. Són hashes, no usos.
- Els «imports no resolts» de les àrees revisades són falsos positius: literals dins de proves (`sonda.js`, `./AppX.jsx`, `tooling/x.mjs`), comentaris de capçalera de CSS i noms virtuals per a `lintText`. Cap prova importa un fitxer inexistent.
- En `public/`, l'escàner casa per prefix (`logo-socdepoble-rect` amb `-blanc` i `-negre`). Tot s'ha confirmat amb `git grep -F` i camí exacte.
- Els 502 ignorats-però-versionats són 497 receptes, `cron.out`, `cron.err` i 3 fitxers de `supabase/.temp` i `.branches`. Tots tenen proposta (D02, D03, D04).
- Correcció de la doctrina del torn: `public/sitemap.xml` no és generat (`navigation.canoniques.test.js:51-52`). `rag-index.json` i `slugIndex.json` sí que ho són.

##### A.6.2 Preparació de la Frontissa de Sollutia

La Frontissa (`src/data/adaptadors/sollutia/`) es conserva per doctrina. La mantenen viva `tooling/gates/tractor-frontissa.mjs` (AST de `client.js` i `creaFrontissa.js`, `run-portes.mjs:84`), `tooling/gates/tractor-adaptadors.mjs` F2/F3 (`run-portes.mjs:51`) i `viquipedia/client.js:19`, que importa `creaFrontissa.js`.

Inventari per recurs: només `perfil` (`recursos.js:5`). Té traductor, fixture (`tests/frontissa/fixtures/sollutia/perfil.json`) i proves (porta F3). Captura real: cap. La fixture és sintètica: li falten `ruta` i `capturat`, que `captura-contracte.mjs:30` escriu sempre, i els valors no són els testimonis de `forma.mjs:9-11`. Es va crear el 2026-09-18 (271d4a64).

Hui no es pot enxufar. Sis forats:

1. **Porta.** `tractor-frontissa.mjs:34` exigix un sol import a `client.js` (`./creaFrontissa.js`). Si `client.js` importa `recursos.js` o `origensSollutia.js`, la porta es posa roja. Cal decidir: descriptors inline a `client.js` o ampliar la porta.
2. **Forma.** `RECURSOS.perfil` és `{ traductor }`; `creaFrontissa.js:18-27` vol `{ enabled, captureId, path, params, maxBytes, timeoutMs, decode }`. La plantilla és `viquipedia/client.js:182-196`.
3. **Orígens.** `client.js:5-6`: `apiOrigin` és `null` i `allowedOrigins` és `[]`. `origensSollutia.js` no declara cap origen d'API de lectura. Un recurs actiu sense origen fa `new URL(null)` (`creaFrontissa.js:12`), que llança `TypeError` en lloc d'`ErrorDades`.
4. **Sessió.** El transport posa `credentials: 'omit'` (`creaFrontissa.js:61-62`). Es pot resoldre amb un `fetchImpl` envoltori, com `viquipedia/client.js:168`, sense tocar el port.
5. **Doctrina.** L'únic recurs és `perfil`, l'issuer de sessió, i `client.js:12` diu que un issuer mai és un endpoint de dades. Cal que el Mestre o Sollutia diguen quins GET són dades.
6. **Consumidor.** Ningú de `src/data` crida `llig()`, i la llei F1 prohibix que la UI l'importe. Caldrà un servei a `src/data`, fora d'`adaptadors/`. `backendPort.js` no es toca (ADR Model B).

Ordre que se'n deriva: (1) llista de GET de dades; (2) captures reals amb `tooling/sollutia/captura-contracte.mjs` (conservat); (3) decisió sobre la porta; (4) orígens; (5) `fetchImpl` amb sessió; (6) servei a `src/data`.

Relacionat: `tooling/mocks/sollutiaBackend.js` (E24) no és Frontissa. `INTEGRACIO.md` el necessita el perfil `sollutia` de `crear_bundle.mjs` (P31). La regex F1 de `tractor-adaptadors` (`adaptadors/(sollutia|supabase)`) no cobrix `adaptadors/viquipedia`, i F2 tampoc. `adaptadors/supabase` no existix (l'adaptador viu a `src/data/supabase/`); F1 es complix de fet (0 importadors de `data/supabase/` des de la UI).

##### A.6.3 Proves, manifest i portes

- Conflicte de política: `node-suite-manifest.json` (`policy.health`) diu «cap prova ni asserció es retira». Afecta M04-M09, E28, F08 i P25. Les 21 proves de laboratori que es proposa moure no proven res del producte (peten en carregar, fallen contra API retirades o se salten sempre), però retirar-les exigix esmenar la política. `plantilla-viva-installacio` sí que prova codi instal·lat i es queda fora (P34).
- Cada `*.test.mjs` que isca del repositori ha de deixar el manifest en el mateix canvi. Si no, `validateManifest` (`run-node-tests.mjs:46`) avorta `test:node` i `test:ci`.
- Suite laboratory: si `fatiga-261002` passa a primary (P36) i les altres ixen, queda `plantilla-viva-installacio` (P34). Si també isquera, `npm run test:node:laboratory` falla amb «La suite laboratory és buida» (`run-node-tests.mjs:66-69`).
- ESLint 9 llança `NoFilesFoundError` per un camí explícit absent. Afecta les llistes per nom: `lint-sessio.test.mjs` (`:285-286`, `:643`, `:695`), `lint_enxufe.test.mjs:79`, `lint_logica_usuari.test.mjs:36, :89` i les portes `qualitat.*` de `src`.
- Ràtxet de rutes (`tractor-rutes.mjs:181-188`): esborrar és segur perquè només falla si el deute puja. Moure dins del repositori crea identitats noves i el fa fallar: només s'ha proposat eliminar o moure a satèl·lits exteriors. Després convé `--baseline`.
- Catàleg de Disseny: `CATALOG_ITEMS` té 90 ítems i `manifest.icones.test.js:40` exigix `>= 86`. Si se'n van `Dropdown`, `UniversalIndicatorCard`, `Botonera` i `Pista`, en queden exactament 86.
- Fallades conegudes de les còpies (no del codi): `vercel.json`, `_wiki_de_poble` i `ios/App/App/public` absents. No s'han comprovat a l'arbre viu.

##### A.6.4 Documentació de `src/`: conflicte de destí

Tres propostes apunten a destins incompatibles. F01 i F05 porten contingut a `src/ARCHITECTURE.md`; F04 retira `src/ARCHITECTURE.md` cap a `_wiki_de_poble/02_saber/00_arquitectura_tecnica_unificada.md`. Cal un sol destí:

- Opció A: `src/ARCHITECTURE.md` corregit (absorbix `sections/README.md`, `detail/README.md`, `SELF-DESCRIBE.md` i `GLOSSARI.md`). No toca cap generat.
- Opció B: la wiki unificada. Obliga a regenerar `src/data/wikiManifest.js` (`compile-wiki-to-app.mjs`).

En totes dues cal corregir el mite «estrictament Online-First» (`ARCHITECTURE.md:8`, `GLOSSARI.md:7-8`): hi ha cua d'autodesament a IndexedDB i notes locals.

##### A.6.5 Producció, mitjans i base de dades

- `socdepoble.org` servix el Firebase vell de l'11-06. De 377 camins de `public/`, només 110 hi són de veres; la resta tornen l'`index.html` de 7.009 B. Producció servix `uploads/ia/NN-…/avatars` però no `uploads/avatars/`.
- `og-socdepoble-1200x630.png`, citat a `index.html:29, :46` com a `og:image`, no es servix: les targetes socials estan trencades fins al pròxim desplegament.
- Una sola consulta de només lectura a la BD de producció tanca P10-P14 i P18-P19: buscar `/assets/uploads/ia/`, `/assets/uploads/gent/avatars/`, `/assets/uploads/grup/`, `/assets/uploads/empresa/soc-de-poble/avatars/`, `iaia_comic_matriarch`, `javi-llinares-foto_perfil-01`, `cuc-de-pi-poster`, `gentdelatorre-logo`, `el-projecte.epub` i `perfil-1600px` dins d'`app_content.payload::text`, `notes`, `section_submissions`, `xat_missatges`, `profiles.avatar_url`, `organizations` i `towns` (`logo_url`, `hero_url`).
- Qualsevol esborrat d'`EXCLOSES` obliga a tocar en el mateix commit `censImatges.js:207-256` i `censImatges.test.js:82-89` (cada exclosa ha d'existir), `:131-132` i `:154-155`.
- El zip del directori de WordPress.org (`sdp-inventari.json`) porta sis fitxers sense ús que sumen uns 320 KB sense comprimir, en un zip que només té uns 147 KB de marge. E09, E10, E11 i Q01 n'alliberen 78 KB; P22 i P23, 242 KB més.
- `../_multimedia_de_poble/antic_sistema/` ja guarda la major part dels avatars, logos i il·lustracions d'`uploads/`. Cap eliminació proposada fa perdre una imatge única.
- Duplicats legítims entre plataformes: `wordpress-plugin/assets/icon.svg` i `system/ui/logo-socdepoble-cuadrat-verd.svg`; `android ic_launcher` i `public/icona-app-192.png`.

##### A.6.6 Generats versionats: política conjunta

`src/data/wikiManifest.js` (551 KB, 36 commits), `public/rag-index.json` (43 versions, 115,9 MB en cru) i `public/slugIndex.json` (35) han de seguir la mateixa decisió (D01, P09). Desversionar només després d'afegir la compilació a `run-node-tests.mjs`, `test`, `test:unit`, `dev` i `build:wp`. `src/css/design-tokens.css` i `supabase/seed.sql` també són generats però es conserven: tenen contracte i lectors.

##### A.6.7 Pes del govern i zona humana

- L'àrea són 696 dels 5.126 fitxers (13,6 %), però 195,4 dels 414,1 MB de l'arbre de HEAD (47 %). Els torns pesen 98,12 MB, i el 95,2 % és l'inventari `initial` (3.806 hashes de tot l'arbre, `turns.mjs:80`).
- El cost és a cada commit: `materializePendingTree` (`reflex_petorreta.mjs:1343`) escriu tots els blobs de l'arbre en un temporal i `snapshotPreparedFiles` (`git-staged.mjs:15-21`) els rehasheja dues vegades. A `.git` els 816 blobs històrics de torns només ocupen 8,77 MB.
- Prevenció proposada per al codi futur (via executor-mutacio i amb aprovació): `turns.mjs:80` escriuria l'inventari complet en un germà ignorat (`<id>.initial.json`) i el registre versionat guardaria només `humanBaseline` (uns 44 KB). `readTurn` i `checkTurn` haurien de fallar en tancat si falta el germà. Cal adaptar `tests/anticipacio-261003.test.mjs:536-540`.
- Abans de qualsevol moviment a `01_produccio`: zona humana (AGENTS §12, `mutation-policy.mjs:14`, `antigravity-hook.mjs:495`), només la mà del Mestre i amb zero torns oberts; si no, `checkTurn` dona «Zona humana modificada» (`turns.mjs:257-259`). Hi ha 53 torns oberts ja caducats (25,9 MB): primer `saneja_torns_caducats.mjs --sec` i després sense `--sec`. En queden 9 de vigents, el darrer fins a 2026-10-22T13:42 (`torn_a2bdc047`, MarIA).
- Àncores de `00_index_escriptori.md` per actualitzar en el mateix pas: :31-33, :71-72, :579, :615-634 (HEAD). Ja hi ha una àncora fantasma a :673 (`01_produccio/builds/socdepoble-enxufe-v1.0.0-261001_0320.zip`), que `porta-olivera` no detecta (`porta-olivera.mjs:314-330`).
- Falten àncores (§12) de fitxers que es conserven: `patrimoni_oral_mestre/` (20), `xat_portada.jpg`, `alergens_svg/alergenos_master.af` i `iaia_maria_avatar_mobil_261021.png`.
- Correcció a l'auditoria de Gemini 261021_1641:67: `.agents/runtime/` no està ignorat; `turns/*.json` i `contracts/*.json` es versionen per decisió del Mestre (260923). El comentari de `fonts-vigilancia.mjs:45` («uns 13 MB») ha quedat desfasat (98 MB).

##### A.6.8 Defectes vius detectats (no són brossa)

- `tooling/wiki/package.json`: `nervios` i `nervios:strict` criden `sistema_nervios.mjs`, però el fitxer és `core/sistema_nervios.mjs`. `core/sistema_nervios.mjs:31` llista com a crítica una ruta absent.
- La skill `core-restauracio-segellada` crida `tooling/brain/ancora.mjs --pon`, que no l'implementa (F07).
- `bot/immunite.mjs` (purga RGPD) no l'importa `bot/index.mjs`.
- `tooling/lib/arrel.mjs:83` (`CAMINS.genoma`) apunta a `.agents/GENOMA.md`, purgat. `schema-cutover.lock.json` cita `compiler/*.cjs` i altres fitxers inexistents.
- `VEINS.md` enumera 4 dels 11 satèl·lits. `_wiki_de_poble/01_ser/00_bios.md` es contradiu (`.agents/BIOS.md` al frontmatter, `.agents/AGENTS.md` al cos).
- `scripts/botigues/puja-android.mjs:50` parla d'una `signingConfig` de release que `android/app/build.gradle` no té.
- `public/auth/callback.html:18-20` porta un comentari corromput i una llista blanca dinàmica que admet `sollutia.cat` i `socdepoble.sollutia.com`.
- `.immunitari/cron.out` versionat deixa l'arbre sempre brut i bloqueja `plaquetes aplica` (D03 ho resol).
- Connector `dataview` habilitat però sense `main.js`: el bloc de `doc_taula_mestra.md:16` no es renderitza.
- Deute de refactor sense fitxer a retirar: `ConnectarSection.jsx:676-783` repetix `PrevisualitzacioExtern.jsx` (declarat a :19-21); `src/icons.jsx` exporta `Plus` i `Menu` sense importadors; harnés de proves repetit a `NotesContext.*`, `PerfilEditor.*` i altres.

##### A.6.9 Gestoria i ordres del Mestre

Tota la Gestoria només arriba al paquet en desenvolupament (DEV o `VITE_SDP_APP_GESTORIA === '1'`, `privacitat.test.js:444`). És el doble pany del Mestre; no s'ha de llegir com a «no muntat». Els models purs no endollats ho són per ordre del 261004. Qualsevol toc a fonts de tractors signats reobri les aprovacions per empremta.

##### A.6.10 Coordinació i incidències de procés

- Altres mans a l'arbre durant l'auditoria: `_wiki_de_poble/04_escriptori` (índex i dos informes nous, entre ells `261021_1645_auditoria_claude_salfumant_radical.md`), `.agents/runtime/guarda_nocturna.json`. El torn de Gemini `torn_f781afe5` («planned», abast code) té `idbFals.js` (E01) a la instantània.
- Incidència 1: l'auditor de backend va escriure per error a la carpeta de scratch d'un altre (`scratchpad/auditA/`): `refs.py` (mogut a `eixA_supabase_natiu/`, potser sobreescrit) i un enllaç `node_modules/node_modules`, ja esborrat. El repositori viu no en té rastre.
- Incidència 2: la còpia `scratchpad/auditA` enllaça el `node_modules` del repositori viu, i `node_modules/.vite/vitest/…/results.json` del viu s'ha modificat hui després de les 16:00. No s'ha pogut atribuir.
- `supabase/.temp/.../docker.env` porta claus per defecte de la pila local, no de producció: no cal rotar res. No s'ha pogut confirmar que s'haja pujat al remot `fork`.
- Les desversions grans (D02: 7,7 MB) convé fer-les en un commit propi, per les limitacions conegudes del hook.

### 6. Discrepàncies amb l'auditoria de Gemini (`261021_1641_auditoria_gemini.md`)

| Proposta de Gemini | Valoració de Claude | Evidència |
|---|---|---|
| Revoke de P0-01 afegit dins d'una migració ja aplicada | **D'acord.** Resolt amb `2610211715`. | `supabase/README.md:359` diu «NO aplicada», però l'estat real de producció no consta enlloc versionat. |
| Evacuar els 130 originals raster de `public/` (115 MB) i deixar només les WebP | **En contra, tal com està.** La variant web (Firebase) servix els originals, i les llavors i files antigues de la BD de producció apunten als camins `.png` o `.jpg`. La política de mitjans ja posa les bessones només als paquets de WordPress i natiu. | `censImatges.js:207-256` i les seues proves; `seed.sql` de `d75a852c`; A.6.5. Cal primer la consulta a la BD (D6). |
| `.agents/runtime/` està ignorat | **No.** `turns/*.json` i `contracts/*.json` es versionen per decisió del Mestre (260923). | `.gitignore`; A.6.7. |
| Evacuar `.sdp-reflex/` (26 MB) | **No a cegues.** És el directori de la llicència Reflex que el hook de pre-commit exigix (`active.json`). | `tooling/wiki/reflex_petorreta.mjs`, `.husky/pre-commit`. |
| Purgar `wordpress-plugin/supabase/` | **És estat local:** està ignorat (`.gitignore`), no està versionat i el zip el deixa fora per llista blanca. Conté `start-secrets`. L'esborrat és teu. | `.gitignore` («la còpia de la CLI que ha deixat el plugin de WordPress»). |
| Dockerfile, docker-compose.yml i vercel.json com a configuracions descartades | `vercel.json` es queda: el fixen 4 proves i és la font de la CSP del `firebase.json` proposat. Docker i `bot/` són la decisió P32. | 3.2; A.2.6 P32. |

### 7. Decisions del Mestre

| ID | Decisió | Què cal | Detall |
|---|---|---|---|
| D1 | Desplegar socdepoble.org (P0-06) | Confirmar el `VITE_TENANT_ID` de producció i executar la seqüència de 3.2. | Tanca P0-06, els mitjans del directori, les capçaleres de seguretat i l'`og:image` trencada. |
| D2 | Aplicar `2610211715` (i `2610181915`, si no hi és) | Consulta prèvia `has_column_privilege` → aplicar → torna `false`. | 2, 3.1 |
| D3 | `supabase/.temp/start-secrets/.../docker.env` versionat | Confirmar que són claus de la pila local (segons l'auditor de backend, ho són) i fer `git rm --cached` dels 3 fitxers (D04 de l'Eix A). | Claude no l'ha pogut llegir (lectura denegada). Si hi haguera cap clau remota, cal rotar-la. |
| D4 | WordPress.org | Llicència de les dades del zip, codi font públic de HEAD, slug `socdepoble-enxufe` i versió 1.1.9. | 4.1 |
| D5 | Primer lot de l'Eix A (risc baix, cap prova afectada, fora de la zona humana i de `.agents/`) | Un sí per a: E02, E03, E04, E06 (amb `.DS-Store` al `.gitignore`), E07, E08, E13-E18, E20-E27, E30-E36, E40, E41 i E42; i desversionar D02, D03, D04 i D05. | 5, A.2. Són 156 fitxers esborrats (775.325 B) i 506 de desversionats (12.516.859 B): uns 13,3 MB fora de l'índex. Millor en commits per lots, amb D02 tot sol, pel límit del hook. |
| D6 | Consulta de només lectura a la BD de producció | Per als camins de A.6.5. | Tanca P10-P14 i P18-P19. |
| D7 | Zona humana (`01_produccio`) | E44, M15-M18, F10, F11, Q03, P39 i P40, a mà teua i amb zero torns oberts. | A.6.7. Hi ha 53 torns caducats oberts. |
| D8 | Prova roja que ja existia a HEAD: `tests/migracio-membres-organitzacio.test.mjs` («la taula només la llegixen les RPC noves») | Decidir quina migració és la propietària de `organization_member_organizations`: `2610181915` la torna a definir, i ja la definix `2610081402`. | Secció de Verificació. |
| D9 | iOS | Fer `build:natiu` + `cap sync ios` abans de cap `.ipa`; el client OAuth de Google (P0-03); les icones (P0-07). | 3.1 |
| D10 | Instal·lar `sdp-vigilant-tellado` | `executor-mutacio` amb llicència Reflex i el flux d'aprovació a la Wiki. | 4.2 |
| D11 | Correccions del Llibre Mestre (són de MarIA) | P0-01, P0-08 i P0-09 → FET `feaa7adc`. P0-16 → PARCIAL fins al commit d'este torn. P0-03 → línia 38. P0-05 → reescriure amb les migracions reals. | 3.1 |
| D12 | Les 40 propostes «preguntar» de l'Eix A | Una per una. | A.2.6 |

### 8. Retroalimentació sobre la plantilla `prompt_local`

1. **Els estats dels P0 venien del Llibre Mestre, no del codi.** Tres «pendents» ja estaven fets i un «fet» era a mitges. El generador de prompts hauria de passar cada P0 per `git log -S` i per la seua prova abans de convocar ningú.
2. **El prompt barrejava tasques de l'agent amb accions del Mestre.** El desplegament a producció necessita el compte del Mestre, i la decisió d'aplicar SQL a producció també és seua. Proposta: una secció «Accions reservades al Mestre» separada de «Tasques».
3. **El camp «Model IA» està desfasat** (`claude-3-7-sonnet`). Si l'ha d'omplir l'agent, que el deixe buit.
4. **L'abast de l'Eix A** deixava fora `.agents/runtime/turns` i `01_produccio`, que són el 47 % del pes. El pes hauria de ser un eix de primera.
5. **El canal viu cada 10-15 minuts** xoca amb el cicle de `document.mjs` (una reescriptura). Proposta: una secció «Canal viu» dins del mateix informe, amb hora a cada línia.
6. **La Tasca 5 («>20.300 proves»)** hauria de donar l'ordre exacta i la durada esperada. Vitest sencer tarda de 10 a 12 minuts en este Mac, i les suites de node tenen la laboratory roja per disseny.
7. **El prompt no avisava** que el desplegament fa un `dist/` amb les variables de producció. El `VITE_TENANT_ID` de producció hauria de constar en un lloc verificable.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres s'han executat sobre l'arbre viu a HEAD `80daa89a` amb els canvis de la secció 2. L'excepció és la compilació de Firebase, que s'ha fet en una còpia.

| Comprovació | Resultat |
|---|---|
| `git apply --check` dels 4 pegats (WordPress.org, P0-16, P0-08 i P0-01) | OK. La línia 33 de `pantalla-completa.php`, que tocaven dos pegats, s'ha fusionat a mà. |
| Vitest complet: `node node_modules/vitest/vitest.mjs run` (482 s) | **1.208 fitxers passen, 9 saltats; 20.403 proves passen, 100 saltades, 0 fallen.** rc 0. |
| Vitest dirigit (6 fitxers: migració P0-01, `legal.sanejament`, `sanitize`, `PageFrame.seccio`, `anima.sanejament`, `xat`) | 177 de 177 |
| `node --test`: `enxufe-plugin`, `enxufe-empaqueta`, `enxufe-pantalla` (PHP real), `enxufe-runtime`, `enxufe-traduccio`, `conformitat-amfitrio` i `standalone-build` | 18, 23, 17, 3, 36, 18 i 40: totes passen. El contracte del Web Component està intacte. |
| `node --test tests/migracio-organitzacions-poble.test.mjs` | 10 de 10 |
| `node --test tests/migracio-membres-organitzacio.test.mjs` | **17 de 18.** La que falla («la taula només la llegixen les RPC noves») ja fallava a HEAD: ni `2610181915` ni la prova s'han tocat (`git diff --quiet HEAD`). Decisió D8. |
| `php -l` (PHP 8.4.25 de Studio) dels 4 PHP tocats | Cap error de sintaxi |
| Sonda PHP de l'expressió regular nova | 6 de 6. Lleva els preloads amb `rel` davant, amb `href` davant i sense cometes. Conserva `preconnect`, `modulepreload` i els d'altres hosts. |
| ESLint dels 4 fitxers JS tocats | Net |
| Plugin Check 2.1.0 (sniffs i readme, en còpia) | Abans: 3 errors i 11 avisos. Després: 0 errors i 1 avís (`load_plugin_textdomain`). |
| Compilació de Firebase (còpia de HEAD) | rc 0 a les 6 passes. Escàner de secrets: només la clau `anon`. |
| Escàner mecànic (`escaneja.mjs`, 57 s) | 5.010 fitxers versionats; 85 grups de duplicats; 502 fitxers ignorats però versionats |
| Workflow de l'Eix A | 19 agents, 0 errors. La verificació adversarial ha refutat 11 propostes i n'ha corregit 14. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Res publicat:** els canvis de la secció 2 són al commit `218433ff`, sense pujar. No s'ha desplegat, no s'ha aplicat cap SQL i no s'ha pujat la versió del connector.
- **Eix A, només propostes:** no s'ha esborrat, desversionat ni mogut cap fitxer. La cobertura és del 90,1 %. No s'han auditat fitxer per fitxer 224 fitxers de `.agents`, 246 de la resta de `_wiki_de_poble`, 25 de `wordpress-plugin` (els cobrix l'Eix B) i 11 de configuració de l'arrel.
- **`docker.env`:** l'eina m'ha denegat llegir-lo. La conclusió «claus per defecte de la pila local» és de l'auditor de backend, i no l'he pogut verificar jo.
- **Producció:** l'estat real de les migracions de producció és desconegut (no hi ha accés).
- **PHP:** no s'ha pogut provar PHP 7.4, el mínim declarat; no hi ha sintaxi exclusiva de PHP 8.
- **Suites de node:** no s'ha executat `npm run test:node` sencer. La suite laboratory és roja per disseny (M04-M09 de l'Eix A).
- **Govern:** Claude no pot escriure a `.agents/`, i per això no ha actualitzat ESTAT ni LEDGER. El torn queda en estat `planned`, vinculat al pla 261021_1600 (hash `53db9df4…`), perquè MarIA el registre i el tanque.
- **`tancament.mjs --check`** dona `valid: false`, amb 1.261 errors:
  - 1.257 ja hi eren abans d'este torn i no són d'este torn: 1.000 `LINK_INVALID` i 238 `ESCRIPTORI_UNANCHORED` de l'índex de l'Escriptori, 19 `ORPHAN_OPERATIVE`, la signatura del LEDGER trencada i enllaços trencats a `03_llibre_d_or_memoria_episodica` i `memoria_aprenentatges`;
  - els altres 2 són el relleu d'ESTAT i del LEDGER, que falten.

  La porta Olivera ix amb 0. `document.mjs check` d'este informe dona `valid: true`.
- **Artefactes fora del repositori:** són a `../_investigacio_ia_de_poble/261021_1645_salfumant_claude/` (30 fitxers, 912 KB):
  - l'escàner i la seua eixida;
  - l'inventari de l'Eix A;
  - la proposta de Firebase i les seues eines;
  - l'esborrany del tractor;
  - els pegats i les eixides de Plugin Check.
- **Crons:** cap cron ni tasca programada creada. No en queda cap en segon pla.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261021_1600_pla_implementacio_auditoria_radical_fitxers_i_desbloqueig]]
- [[261021_1641_auditoria_gemini]]
