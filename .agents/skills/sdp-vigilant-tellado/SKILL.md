---
type: skill
name: sdp-vigilant-tellado
prioritat: 2
description: "Tractor de perímetre inspirat en Vigilant de Fernando Tellado. Usa-la abans de desplegar o empaquetar el connector WordPress, en tocar capçaleres o CSP, o si un plugin de seguretat bloqueja l'App. Només llig i informa."
status: actiu
tags: [seguretat, fortificacio, tractors, auditoria]
triggers_on:
  - vigilant
  - vigilante
  - tellado
  - ayudawp
  - capçaleres de seguretat
  - security headers
  - enduriment
  - hardening
  - perímetre
  - csp de producció
  - integritat del paquet
  - plugin de seguretat de l'amfitrió
version: 1.0.0
contracte.llig:
  - wordpress-plugin/
  - index.html
  - public/
  - vercel.json
  - vite.config.js
  - vite.natiu.config.js
  - vite.standalone.config.js
  - src/data/supabase/auth.js
  - src/pwa/
  - supabase/migrations/
  - tooling/gates/
  - tooling/higiene/
  - tooling/lib/dist-secrets.mjs
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---

# Tractor Vigilant Tellado · Perímetre i Enduriment

> **Versió 1.0.0 (261021).** Instal·lada per ordre del pla aprovat `261021_1850_pla_implementacio_botigues_ayudawp_i_salfumant_fase2` (Mòdul C) amb `executor-mutacio` i llicència Reflex. L'script `tooling/gates/tractor-vigilant.mjs` encara no existix: fins que el faça un torn de codi, este tractor és un procediment que s'aplica a mà, i les comprovacions noves naixen com a avís.

Vigilant (abans «Vigilante») és el connector de seguretat gratuït de Fernando Tellado per a WordPress. Agrupa tallafoc, inici de sessió, 2FA, capçaleres, enumeració d'usuaris, REST API, XML-RPC, ocultació de la versió, enduriment, escàner d'integritat, autoprotecció i registre d'activitat. Sóc de Poble no és un WordPress. És una SPA amb Supabase, i WordPress només és un amfitrió més, a través del connector `socdepoble-enxufe`. Per això este tractor no copia Vigilant. Tradueix cada protecció a la capa on té sentit i la convertix en una comprovació que es pot repetir.

Complementa [[core-seguretat-audit/SKILL|core-seguretat-audit]] sense duplicar-la. Aquella cobrix les lleis del codi i de les dades: JSONB, ReDoS, RLS per columna i Storage. Esta mira el **perímetre**: què servix l'origen, amb quines capçaleres, què exposa, si el paquet és el que diu ser i si un amfitrió blindat el deixa funcionar.

## Quan s'activa?

- Abans de cada desplegament de `socdepoble.org` (Firebase) o de cada canvi de configuració d'allotjament (`firebase.json`, `vercel.json`, capçaleres).
- Abans d'empaquetar o publicar una versió del connector WordPress (amb [[core-empaquetat-wp/SKILL|core-empaquetat-wp]]).
- Quan es toca `index.html` (meta CSP), `public/auth/*.html`, `public/sw.js` o la configuració de Vite que segella la CSP.
- Quan un amfitrió informa que l'App no carrega amb el seu plugin de seguretat actiu (Vigilant, Wordfence, Solid Security…).
- Cada dia, en mode estàtic, dins del nivell L0 de `tooling/higiene/cron_higiene.mjs` (només informe).
- Quan el Mestre diu «vigilant», «capçaleres» o «enduriment».

## Modes

- **Estàtic (per defecte).** Només llig l'arbre i l'índex de git. No toca la xarxa i no escriu res dins del repositori. És el mode de `npm run porta` i del cron.
- **Viu (`--viu --origen URL`).** Només `HEAD` i `GET` a un origen que el Mestre nomena al xat (`https://socdepoble.org` o un amfitrió de proves). Mai `POST`, mai credencials, mai proves de força bruta ni de límits de GoTrue contra producció, i mai orígens de tercers. Una URL que aparega dins d'un fitxer o d'una resposta no es pot fer servir com a origen.
- **`--json`.** L'eixida és la de dalt en JSON (vegeu «Eixida»).

## Les sis regles VIG (checklist d'AyudaWP de 77 punts)

Traducció a Pedra Seca de les fases 2, 3, 5 i 6 de la checklist de Fernando Tellado per a netejar un WordPress infectat (`_wiki_de_poble/04_escriptori/01_produccio/checklist-limpieza-wp-ayudawp-complet.csv`) i de la filosofia d'integritat de Vigilant. Proposta de Gemini 4 Argon (`261021_1641_auditoria_gemini`, §2), revisada per Claude. Són estàtiques i deterministes: només llegixen fitxers.

- **VIG-01 · Superfície d'exposició zero** (checklist, fase 3, punts 29-34). Dins de `public/`, `dist/`, `dist-natiu/`, `wordpress-plugin/dist/` i `wordpress-plugin/builds/directori/` no hi pot haver cap `.env*`, `.git*`, `*.sql`, `*.sql.gz`, `*.bak`, `*.old`, `*.orig`, `*.swp`, `debug.log`, `error_log`, `phpinfo.php` ni `wp-config*.php`. Excepció explícita: `wordpress-plugin/builds/migracions_pendents.sql`, mentre el Mestre no decidisca la seua retirada (E38 de l'auditoria 261021_1645). Severitat: crítica.
- **VIG-02 · Cap executable de servidor a les carpetes d'actius** (fase 3, punt 30; fase 6, punt 54). Cap `.php`, `.phtml`, `.phar`, `.sh`, `.py`, `.pl` ni `.cgi` dins de `public/assets/`, `wordpress-plugin/dist/` ni `wordpress-plugin/builds/directori/dist/`. Severitat: crítica.
- **VIG-03 · Patrons d'ofuscació i portes del darrere** (pestanya «Patrones maliciosos»). Als `.php` de `wordpress-plugin/` i als scripts d'empaquetat cal que no hi haja:
  - `eval(` sobre `base64_decode`, `gzinflate`, `str_rot13` o `gzuncompress`;
  - `assert($_POST|$_GET|$_REQUEST`;
  - `preg_replace` amb el modificador `/e`;
  - variables amb noms en hexadecimal;
  - `create_function(`;
  - `shell_exec`, `passthru`, `proc_open`, `system` o `popen`.

  El 261021 els 20 patrons de la fase 6 donen 0 coincidències. Severitat: crítica.
- **VIG-04 · Integritat de l'inventari del paquet** (escàner d'integritat i autoprotecció de Vigilant). Dins de cada paquet construït, `sdp-inventari.json` i `sdp-release.json` han de casar amb el `sha256` de cada fitxer físic. No pot haver-hi fitxers orfes ni carpetes paràsites, com la `wordpress-plugin/supabase/` que deixa la CLI de Supabase. Complementa VA5, que és la comprovació en execució. Severitat: alta.
- **VIG-05 · Higiene d'URL i contingut mixt** (fase 5, punts 44-52). Cap `http://` que no siga local (`localhost` o `127.0.0.1`) o un espai de noms estàndard (`http://www.w3.org/`) en configuració, plantilles PHP, `readme.txt` ni codi de producció de `src/`. Severitat: mitjana.
- **VIG-06 · Sobirania del navegador** (fase 2 i directrius 6 i 7 de WordPress.org). Cap CDN de fonts o scripts de tercers que no estiga declarat al `readme.txt` («External services») ni en una llista blanca documentada pot entrar des del PHP o des de l'HTML d'entrada (`index.html`). Exemples: `fonts.googleapis.com`, `fonts.gstatic.com`, `unpkg.com`, `jsdelivr.net` o rastrejadors comercials. La llista blanca d'orígens de fonts de l'amfitrió (`src/PedraSecaEmbed.jsx`) no compta com a injecció. Severitat: alta.

Les regles VIG miren què hi ha dins dels fitxers i dels paquets. Les comprovacions VA, VB i VC de sota miren el perímetre: què es servix, amb quines capçaleres i com conviu amb l'amfitrió.

## Comprovacions de perímetre

Cada comprovació té un identificador estable, la protecció de Vigilant (o d'un altre connector d'AyudaWP) de què ve, el que mira, l'estat mesurat a `HEAD 80daa89a` (21/10/2026) i la severitat si falla. Si una comprovació ja la fa una porta o una prova existent, el tractor llig el resultat d'eixa porta i no la reescriu.

### Capa A · Connector WordPress (`wordpress-plugin/`)

- **VA1 · Accés directe als PHP** (Vigilant: bloqueig d'accés directe). Tots els `.php` porten `defined( 'ABSPATH' ) || exit;`. **Ja cobert:** `tests/enxufe-plugin.test.mjs:102-107`. Hui 15 de 15. El tractor en reporta el resultat.
- **VA2 · Rutes REST amb permís explícit** (Vigilant: modes de la REST API). Cada `register_rest_route` porta un `permission_callback` que no és `__return_true`. Cada ruta pública ha d'estar en una llista blanca amb el seu motiu. Hui n'hi ha una: `includes/traduccio.php:310-314`, amb el callback `socdepoble_enxufe_traduccio_permis` (Origin, `sec-fetch-site`, JSON, 32 KiB). **Cobert** per `tests/enxufe-traduccio.test.mjs:26-29`. El tractor ho generalitza a qualsevol ruta nova. Severitat: alta.
- **VA3 · IP del visitant** (Vigilant i Gozer: detecció de la IP darrere de proxy). Cap lectura de `X-Forwarded-For`, `CF-Connecting-IP` ni `X-Real-IP` sense una llista de proxies de confiança. Hui només es llig `REMOTE_ADDR` (`includes/traduccio.php:230-232`). **Cobert per codi.** No hi ha cap prova general, i la fa el tractor amb grep. Severitat: alta.
- **VA4 · Supressions de sniffs justificades** (porta de llançament de la skill `wp-plugin-security` de Tellado). Cada `phpcs:ignore` o `phpcs:disable` porta un motiu darrere de `--`. Hui tots en porten (després del commit `218433ff` també els de `traduccio.php`, `uninstall.php` i `pantalla-completa.php`). **Nova:** cap prova ho exigix. Severitat: mitjana.
- **VA5 · Integritat del paquet en execució** (Vigilant: escàner d'integritat i autoprotecció). La Salut del lloc comprova que els trossos existixen i el `sha256` de l'inventari (`includes/salut.php:78-103`). No comprova el `sha256` de cada tros, encara que l'inventari ja el porta (`vite.standalone.config.js:380`). El canal propi ja verifica la signatura ed25519 (`actualitzador.php:226-230`) i el sha256 del zip (`actualitzador.php:748-749`). **Parcial.** Proposta: una prova de Salut asíncrona amb `hash_file` per tros, i una prova estàtica que inventari i `dist/` casen. Severitat: mitjana.
- **VA6 · Desinstal·lació neta** (Vigilant: desactivació que restaura). `uninstall.php` només esborra opcions i transients propis (prefix `sdp_tr_`, `uninstall.php:32-41`) i respecta les altres còpies actives. **Cobert** (`tests/fixtures/enxufe-uninstall.php`).
- **VA7 · Compatibilitat amb plugins de seguretat de l'amfitrió** (és Vigilant mateix, vist des de fora). El `readme.txt` no diu res de CSP, tallafocs ni plugins de seguretat (grep `csp|firewall|security plugin` no troba res). **Nova.** Riscos que cal declarar i provar:
  - una CSP de l'amfitrió que no admeta el bundle (`script-src`), Supabase (`connect-src` https i wss), imatges `https:` i les fonts;
  - COEP `require-corp`, que bloqueja imatges d'altres orígens (Storage, OSM, avatars);
  - REST «només autenticats», que talla `/socdepoble/v1/traduir`;
  - «bloquejar actualitzacions des de l'administració», que talla el canal propi;
  - l'escàner d'integritat, que tracta un connector de fora del directori com a «codi no oficial». Un bundle minificat pot semblar ofuscat. És plausible, però no està verificat.

  Proposta: una secció al readme amb la CSP mínima, generada des de `dist/sdp-release.json`, i una prova que la mantinga al dia. Severitat: mitjana.
- **VA8 · Empremta de versió** (Vigilant: ocultació de la versió). No hi ha cap `<meta name="generator">` ni cap capçalera pròpia. El `?ver=` del bundle (`marcatge.php:159-178`) és per a trencar la memòria cau, i Vigilant també el conserva als connectors. **No aplica.**
- **VA9 · Proteccions del nucli de WordPress**: XML-RPC, `?author=N`, `/wp/v2/users`, `DISALLOW_FILE_EDIT`, URL d'inici de sessió, límit d'intents, 2FA de WordPress, `wp-config.php` i `.htaccess`. Són de l'amfitrió, i el connector no les toca ni les ha de tocar. **No aplica al connector.** En mode viu, i només contra un WordPress de proves que el Mestre nomene, el tractor pot informar-ne amb `GET` (`/xmlrpc.php`, `/?author=1`, `/wp-json/wp/v2/users`). Mai fa `POST`.

### Capa B · SPA, Supabase i allotjament

- **VB1 · Capçaleres de seguretat de producció** (Vigilant: capçaleres de seguretat i HSTS). **FALLA.**
  - Mesura viva (`curl -sI https://socdepoble.org/`, 21/10 14:49 UTC). Només hi ha `strict-transport-security: max-age=31556926`, sense `includeSubDomains`. No hi ha CSP en capçalera, ni `frame-ancestors`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` o `Permissions-Policy`. L'HTML viu (desplegament de l'11/06) tampoc porta la meta CSP.
  - Estàtica. `firebase.json` no és a `HEAD` (`git ls-files` buit). L'únic que hi ha és a `d1ba6a11`, a les branques `feature/orquestrador-timeline-animacions` i `ops/runbook-and-backups`, que no és ancestre de `HEAD`, i no porta cap capçalera de seguretat. `vercel.json` sí que porta una CSP amb `frame-ancestors`, però no és el que servix producció.
  - Comprovació estàtica: la configuració que es desplega és a `HEAD`, i les seues capçaleres inclouen almenys la CSP de la meta més `frame-ancestors`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` i HSTS.
  - Comprovació viva: compara la resposta de `curl -sI` amb eixe conjunt.

  Severitat: alta (clickjacking i cap CSP efectiva en producció).
- **VB2 · Coherència i estretor de la CSP** (Vigilant: CSP compatible i mode Report-Only).
  - **Ja cobert:** la meta d'`index.html:17` ha de ser idèntica a `META_CSP_DEL_WEB` (`vite.natiu.config.js:93`), i el build natiu falla si no la troba exactament una volta (`vite.natiu.config.js:175`). `src/pwa/manifest.test.js:143-154` compara `index.html` i `vercel.json`, però només per al worker i el manifest.
  - **Buit:** la CSP web de producció conté orígens de desenvolupament (`ws://localhost:*`, `http://localhost:*`, `http://127.0.0.1:*`). És l'equivalent de l'avís de producció d'Anti-Cache Kit. A més, `connect-src` admet `https:` i `wss:` genèrics, mentre que la nativa ja el limita a l'origen del backend (`vite.natiu.config.js:69-82`).
  - Proposta: una prova que la CSP del build web no porte `localhost` i que `connect-src` es derive de l'origen segellat.

  Severitat: mitjana.
- **VB3 · Pàgines relé d'autenticació.** `public/auth/callback.html:7` porta `script-src 'self' 'unsafe-inline'` (script en línia a `:95`). `calendari-google.html:8` no en porta. La porta `porta:sanejador` (`tooling/gates/saneja-callback.mjs`) només mira la condició de `localhost`. Proposta: posar el hash `sha256-…` del script en línia en lloc d'`'unsafe-inline'`, i una prova que el recalcule. Severitat: mitjana.
- **VB4 · Service worker** (Vigilant: res d'equivalent; és la memòria cau de DietPress vista amb ulls de seguretat).
  - **Ja cobert:** l'API, l'autenticació, les peticions amb `Authorization` i les que no són `GET` no entren mai a la memòria cau (`public/sw.js:30-33,121-133`, prova `src/pwa/sw.test.js`).
  - En viu, `/sw.js` es servix amb `max-age=31536000, immutable`. La regla `**/*.@(js|css|wasm)` del `firebase.json` de branca també casa amb `sw.js`. Els navegadors revisen el script principal sense la memòria HTTP, però la configuració contradiu la intenció.
  - Proposta: una regla `no-cache` específica per a `/sw.js`.

  Severitat: baixa.
- **VB5 · Enumeració de comptes** (Vigilant: enumeració d'usuaris). **Parcial.**
  - La recuperació de contrasenya és anti-enumeració (`src/data/supabase/auth.js:752-760`).
  - L'alta distingix `COMPTE_EXISTENT` (`auth.js:477`), i que GoTrue ho revele depén de la confirmació de correu, una configuració que no està versionada (no hi ha `supabase/config.toml`).
  - Storage sense llistat anònim i `perfil_public` ja són llei de core-seguretat-audit §3.D.

  Severitat: mitjana.
- **VB6 · Força bruta i límits** (Vigilant: límit d'intents i bloqueig progressiu). El client tracta el 429 com `MASSA_INTENTS` (`auth.js:473`). Els límits i el CAPTCHA de GoTrue es configuren a la consola de Supabase, no estan versionats, i el client no porta cap CAPTCHA (grep `turnstile|hcaptcha|captchaToken` buit). **Parcial / no mesurat.** Proposta: versionar una instantània de la configuració d'autenticació, sense secrets, i comparar-la. Severitat: mitjana.
- **VB7 · Segon factor** (Vigilant: 2FA per rols). El superadmin exigix `aal2` (`supabase/migrations/2610061448_superadmin_aal2.sql:9`, `src/app/contexts/SessionContext.jsx:172-178`). **Cobert per al superadmin.** No s'exigix als administradors d'entitat (Vigilant l'exigix per defecte a administradors i editors). Ho decidix el Mestre.
- **VB8 · RLS i funcions privilegiades.** **Ja cobert** per `tooling/gates/tractor-rls.mjs` R1–R9 (RLS absent, `using (true)`, vistes sense `security_invoker` i `security definer` sense `search_path`). El tractor només en llig l'eixida.
- **VB9 · Secrets versionats** (Vigilant: còpies de `wp-config.php` i sals per defecte; ai-skills: secrets en còpies). **FALLA fins que es verifique.**
  - El `dist/` ja s'escaneja (`tooling/lib/dist-secrets.mjs`, `tests/dist-secrets.test.mjs`), però l'arbre versionat no.
  - Hi ha versionat `supabase/.temp/start-secrets/supabase_edge_runtime_socdepoble.org/env/docker.env` (commit `db6d25d9`), que el `.gitignore` ja exclou. Conté claus amb noms com `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` i `SUPABASE_INTERNAL_JWT_SECRET`.
  - Pel camí sembla de la pila local de `supabase start`. No ho he verificat perquè no n'he llegit els valors.
  - Proposta: escanejar també `git ls-files` amb els mateixos patrons, i donar un error crític per a qualsevol fitxer ignorat que estiga versionat i tinga noms de secret.

  Severitat: crítica fins que el Mestre confirme que és local.
- **VB10 · Fitxers sensibles servits** (Vigilant: bloqueig de `readme.html`, logs, bolcats i còpies). En viu, `/.env` i `/.well-known/security.txt` tornen `200 text/html` (el fallback SPA de 7.009 B). No filtra res, però no hi ha `security.txt` ni cap 404 real. Els builds porten `sourcemap: false` (`vite.modul.config.js:291`, `vite.standalone.config.js:553`). Proposta: comprovar que `dist/` no porta `.map`, `.env`, `.sql`, `.log` ni `.bak` i, en viu, comprovar que cada camí sensible respon amb el fallback HTML i no amb el fitxer. Severitat: baixa.
- **VB11 · Empremta del servidor** (Vigilant: ocultació de `Server` i `X-Powered-By`). En viu no hi ha `Server` ni `X-Powered-By`, i `index.html` no porta `generator`. **Cobert de fet.**
- **VB12 · Senyals per a bots d'IA** (AI Content Signals, VigIA). `public/robots.txt` només diu `Allow: /` i el sitemap. `rag-index.json` i `slugIndex.json` (generats) són públics. No és seguretat estricta, i ho decidix el Mestre (vegeu D-RAG-PUBLIC). El tractor **informa i no falla**.

### Capa C · Govern i tooling

- **VC1 · Autoprotecció de les regles** (Vigilant: manifest SHA-256 propi i empremta a la base de dades). **Ja cobert:** `tooling/gates/segella.mjs` (skills), `tooling/verify-ledger.mjs` (LEDGER) i `porta-autoritat.mjs` (mirall d'AGENTS). Esta SKILL.md entrarà al segell en instal·lar-la.
- **VC2 · Tasques programades vigilades** (Vigilant: reprograma les seues tasques; Easy Actions Scheduler Cleaner: avís quan una neteja no s'ha fet). `cron_higiene.mjs` el llança launchd (`scripts/immunitari/org.socdepoble.higiene.plist`) i escriu `.immunitari/higiene/aammdd.json`, però ningú avisa si un dia falta l'informe. **Nova:** VC2 falla si no hi ha informe d'higiene ni d'avui ni d'ahir. Severitat: baixa.
- **VC3 · Modes temporals amb caducitat** (Vigilant: el mode «Under Attack» s'apaga sol a les 4 h). `guarda-nocturna.mjs` ja obri amb `maxHores = 6`. **Patró cobert.** Però `comprovarGuarda` decidix l'aprovació buscant textos com «100% en verd» als informes (`guarda-nocturna.mjs:85-90`). Este tractor **mai** es dona per verd llegint el text d'un informe. Només compta comprovacions executades.
- **VC4 · Neteja de dades** (DietPress: transients caducats; Easy Actions Scheduler Cleaner: taules que creixen). Per al repositori ho cobrix `cron_higiene` (L0, L1 i L2). Al connector, els transients de traducció duren 7 dies i `uninstall.php` els esborra. A Supabase no he trobat cap tasca de retenció. **No mesurat.** S'informa, no es falla.
- **VC5 · Registre d'activitat** (Vigilant: auditoria i alertes per llindar). El govern té el LEDGER i `.agents/runtime/turns`. El contingut té `app_content_historial` (`2610101900_personalitzacio_superadmin.sql:14`). No hi ha registre propi d'esdeveniments de seguretat de l'App (Supabase té el seu de GoTrue). **Parcial.** S'informa.
- **VC6 · Porta amb xifres** (ai-skills `wp-plugin-security`: una porta sense xifra no s'ha passat). L'eixida porta sempre quantes comprovacions s'han fet, quantes fallen, quantes no s'han pogut mesurar i per què. No hi ha cap nota de 0 a 100 ni cap lletra, que seria aigua de colònia ([[core-salfumant-radical/SKILL|core-salfumant-radical]]).

## Eixida

- **Consola.** Una línia per comprovació (`VB1 FALLA alta · …`, `VA1 OK · tests/enxufe-plugin.test.mjs`, `VB6 NO-MESURAT · configuració fora del repositori`). Al final, el recompte per estat i per severitat.
- **JSON** (`--json`). `{ esquema: "sdp.vigilant.v1", arrel, commit, mode, origen, data, comprovacions: [{ id, capa, origen_tellado, estat: "ok"|"falla"|"no-mesurat"|"informa", severitat, evidencia: [{ fitxer, linia } | { url, capcalera }], proposta }], recompte }`. **Mai** porta el valor d'un secret ni d'una capçalera `Set-Cookie`, només noms de clau i camins.
- **Informe del cron.** En mode estàtic dins de L0, a `.immunitari/vigilant/aammdd.json` (fora de git, com `.immunitari/higiene/`).
- **Document per al Mestre**, només quan s'encarrega: `_wiki_de_poble/04_escriptori/aammdd_hhmm_auditoria_vigilant.md`, creat amb `document.mjs create` i ancorat a «## Activitat en curs».
- **Codis d'eixida.**
  - `0`: cap falla crítica ni alta.
  - `1`: alguna falla crítica o alta.
  - `2`: el tractor no ha pogut mesurar, per exemple sense git o amb un origen que no respon.

  `no-mesurat` mai compta com a `ok`.

## Límits

- **Només lectura.** No escriu dins de l'arbre viu, no corregix res, no fa `git add`, `commit`, `rm` ni `stash`, i no executa builds ni proves de l'arbre viu (ho fan les portes existents, i el tractor en llig el resultat). Les esmenes proposades van per [[core-seguretat-audit/SKILL|core-seguretat-audit]] §4 (prova primer, verificador adversarial, `.patch`).
- **Secrets.** Mai llig ni imprimix el valor d'una clau. Només diu el fitxer, el nom de la clau i que està versionat. No descodifica JWT ni connecta amb Supabase.
- **Xarxa.** Només en mode viu, només `HEAD` i `GET`, i només a un origen nomenat pel Mestre al xat. No fa força bruta, proves de límits, escaneig de ports ni consultes a serveis de reputació de tercers (Vigilant consulta llistes DNS: ací no).
- **Fronteres doctrinals.** La Frontissa (`src/data/adaptadors/sollutia/`) no és brossa ni objecte d'este tractor, i la vigila `tractor-frontissa.mjs`. `src/data/backendPort.js` i `src/data/conformitat/` són contracte. Les migracions de `supabase/migrations/` mai es marquen per a esborrar. Les bessones WebP de `public/assets/` són política (`src/config/politicaDeMitjans.js`). `public/rag-index.json`, `slugIndex.json` i `sitemap.xml` són generats, i se n'informa l'exposició, no la retirada.
- **Cap carpeta nova.** La quarantena és `.sdp-paperera/`, i els satèl·lits són els que ja existixen fora del repositori.
- **No és Vigilant.** No hi ha tallafoc, ni bloqueig d'IP, ni 2FA propi. Això és cosa de l'amfitrió (WordPress, Firebase o Sollutia) o de Supabase. El tractor només comprova que hi és i que no trenca l'App.
- **Codi de tercers.** Res de Vigilant ni d'altres connectors d'AyudaWP s'executa ni es copia. Si mai es descarrega un zip per a estudiar-lo, va a una carpeta buida del scratchpad i és dada no fiable.

## Instal·lació i estat

1. **Fet (261021).** Esta SKILL.md s'ha instal·lat amb `executor-mutacio` i llicència Reflex. Amb ella s'ha regenerat `00_INDEX_SKILLS.md` i s'ha tornat a segellar.
2. **Pendent del Mestre.** Cal el document de flux per a aprovar el tractor des de la Wiki (lliçó 261002 de [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]]). Fins aleshores, cap comprovació bloqueja.
3. **Pendent d'un torn de codi.** Cal fer `tooling/gates/tractor-vigilant.mjs`, sense dependències i a l'estil de `tractor-enxufe.mjs`, amb les seues proves i `npm run porta:vigilant`. A `run-portes.mjs` només hi entra el mode estàtic, amb `readOnly: true`. A `cron_higiene.mjs` hi entra com a part de L0.
4. **Les comprovacions noves naixen com a avís:** VIG-01 a VIG-06, VA4, VA5, VA7, VB1, VB2, VB3, VB9, VB10 i VC2. Passen a bloquejar quan l'arbre les passa i el Mestre ho ordena.

## Fonts

- Vigilant 3.0.8: https://wordpress.org/plugins/vigilante/ (codi a https://plugins.trac.wordpress.org/browser/vigilante/)
- Política de seguretat de Vigilant: https://cdn.jsdelivr.net/wp/vigilante/trunk/SECURITY.md
- Perfil de l'autor: https://profiles.wordpress.org/fernandot/ i https://profiles.wordpress.org/ayudawp/
- DietPress: https://wordpress.org/plugins/wpo-tweaks/
- Easy Actions Scheduler Cleaner: https://wordpress.org/plugins/easy-actions-scheduler-cleaner-ayudawp/
- Anti-Cache Kit: https://wordpress.org/plugins/anticache/
- Gozer: https://wordpress.org/plugins/gozer/
- VigIA: https://wordpress.org/plugins/vigia/
- AI Content Signals: https://wordpress.org/plugins/ai-content-signals/
- Skill `wp-plugin-security`: https://github.com/fernandotellado/ai-skills
- 77 comprovacions per a netejar un WordPress infectat: https://ayudawp.com/comprobaciones-limpiar-wordpress-infectado/ (còpia a `_wiki_de_poble/04_escriptori/01_produccio/article-ayudawp.md`)

## Lliçons del Mestre

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-seguretat-audit/SKILL]]
- [[core-salfumant-radical/SKILL]]
- [[core-empaquetat-wp/SKILL]]
- [[core-neteja-brossa/SKILL]]
