---
type: informe
status: esborrany
description: 'Informe de Claude Code (Fable 5.1) dels carrils E1 i M1 de l''Onada 261029_1305 sobre HEAD 62c74fa15: E2EE Fase 4, actius multimèdia, icones natives, connector 1.1.10, bateria i portes.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5679b065-2443-40d4-acad-c2d17ef8f3e3:67ff0a1b-6441-48bb-bc18-eb7037b02408
---
# Auditoria Claude 261029_1455 · Carrils E1 (E2EE Fase 4) i M1 (OG-02, R-02, D-C2, WP 1.1.10) de l'Onada 261029_1305

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5679b065-2443-40d4-acad-c2d17ef8f3e3:67ff0a1b-6441-48bb-bc18-eb7037b02408 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T13:59:24.744Z |
| Modificació | 2026-10-29T16:15:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1) · Claude Code · Ultracode |
| Tokens consumits | no mesurats amb precisió: reconeixement de 9 agents aturat a les 15:05 (81 % de la quota setmanal) i la resta del torn en fil únic |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-29T13:59:24.744Z: esborrany creat; contingut i verificació pendents.
- 2026-10-29T17:15+01:00 (tancament del torn de Claude): bateria global passada, 2 regressions pròpies corregides, zip 1.1.10 reconstruït des de l'arbre exacte final, informes de Gemini i Codex llegits (§4), estat de les 10 dimensions (§5). Res commitejat: decisió del Mestre.
- 2026-10-29T16:20+01:00 (relleu de progrés): Pas B (E1) executat i verificat al fil principal (Troballes §3c); bateria global en marxa.
- 2026-10-29T15:25+01:00 (relleu de progrés): Pas A (M1) executat i verificat al fil principal (vegeu Troballes §3b i Verificació); comença el Pas B (E1).
- 2026-10-29T14:02+01:00 (relleu de progrés): torn `torn_5679b065` obert (actor claude, scope code) i pla `261029_1305` lligat (hash `671ff917…`). Reconeixement en marxa: 9 agents de només lectura (E1.1 pipeline, E1.2 adjunts, E1.3 oblit, E1.4 precommit, OG-02, R-02, D-C2, WP 1.1.10, portes i col·lisions) més un crític de completesa. Fets ja verificats: `src/services/xat/` no existix (mòduls plans a `src/data/xifratXat*.js`, D-21); l'adaptador Supabase no implementa encara cap transport `clausXat`/`xatMultimediaXifrat`; migració `2610290400_xat_e2ee_claus_i_sobres.sql` present i no aplicada; 83 `.png` amb bytes JPEG (47,6 MB, tots amb bessona WebP); 6 `og:image` de llavor fora de 1200×630 (el cartell de l'Aplec ja té variant); icones natives = verd pla (15,103,47) + logotip blanc, remapa validat en scratch.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

> **Escriptura incremental d'emergència (ordre del Mestre, 15:05 CET, quota setmanal al 81 %):** este informe es bolca a disc ABANS d'executar res més i es va completant pas a pas. El workflow de reconeixement `recon-onada-1305` (9 exploradors de només lectura + 1 crític) s'ha aturat a les 15:05 per ordre del Mestre; 5 dels 9 exploradors (OG-02, WP, precommit/proves, adjunts, D-C2) havien acabat i els seus informes es conserven al scratch de la sessió (`recon/specs/*.md`). A partir d'ací, tot s'executa al fil principal, sense cap subagent.

### 1. Estat de partida verificat (14:41–15:00 CET)

- **Arbre:** HEAD `62c74fa15` (commit documental de MarIA sobre `feaaf0e07`), branca `backup-notes-publish`, 12 camins bruts tots documentals (`.agents/ON_ESTIC.md`, `estrategia_consum.txt`, `protocolledge.json`, torn de MarIA, `cron.out`, plantilla `prompt_local.md`, Llibre Mestre, Pla i Prompt `1305`, acta `1325`, `src/data/wikiManifest.js`) més un contracte de runtime nou. Cap codi brut d'una altra mà en obrir el torn.
- **Torn i circuit:** `torn_5679b065-2443-40d4-acad-c2d17ef8f3e3` (actor claude, scope code, caduca 2026-10-30T13:46Z), pla `261029_1305` lligat (hash `671ff917…`), este informe creat amb `document.mjs context` + `create` (rebut `67ff0a1b…`) i ancorat a l'índex de l'Escriptori. El torn `torn_0c834999` (actor `agent-local`, scope code, 14:42 CET) és d'una altra mà (Gemini o Codex).
- **Les rutes del Pla i del Prompt no coincidixen amb l'arbre (F-1305-01, bloquejant per a qui les seguisca al peu de la lletra):**
  - `src/services/xat/` **no existix** i no es pot crear (prohibició absoluta de carpetes noves del Prompt §Context; decisió D-21 del disseny E2EE: «fitxers plans, sense carpeta nova»). Els mòduls E2EE són `src/data/xifratXat{,Abast,Context,Cripto,Formats,Magatzem,Paraules,Protocol,Recuperacio,Servei}.js`. El mòdul d'adjunts xifrats es crea com a `src/data/xatMultimediaXifrat.js` (mateix nom de fitxer que demana el Prompt, carpeta real).
  - La bandera és `src/config/xifratXat.js:20` (`E2EE_ACTIU_PER_DEFECTE = false`), no `src/services/xat/configXifrat.js`.
  - `clausUsuari.js` / `destruirIdentitatLocal()` no existixen: l'oblit viu a `creaServeiAmbitXat` (`src/data/xifratXat.js:241-255`, només RAM) i al magatzem (`src/data/xifratXatMagatzem.js:84,149,734,1204`, que ja definix l'error `OBLIT_FALLIT` per a IndexedDB).
  - La prova de les icones natives és `src/natiu/projecteIos.test.js:666-698`, no `src/config/projecteIos.test.js`.
  - Els «7 og:image de llavor» són **6**: el cartell de l'Aplec 2023 ja té variant (`public/assets/events/aplec_2023_cartell-social-1200x630.jpg`, afegida a la revisió final de la nit); les «2 vinyetes del Rentonar» són `public/assets/ui/plugins/cervell_vinyeta.jpg` i `consola_vinyeta.jpg` (480×480); les 4 portades són `public/assets/towns/{la-torre-de-les-macanes (600×450), orxeta (1280×817), sella (1280×345), tibi (1280×959)}/1.jpg` (manifest social de l'arbre viu: 26 imatges locals, 6 fora de 1200×630, 0 remotes).
  - El missatge d'emergència del Mestre (15:05) cita `#1A2B23` per a D-C2, `wordpress-plugin/soc-de-poble-connector/` i `public/downloads/soc-de-poble-connector.zip`: cap d'estos tres valors existix a l'arbre ni al Pla. S'aplica el que diuen el Pla, el Prompt i el token `--sdp-verd` (QA-H03): verd AAA **`#0e662e`** (14,102,46), fitxers `wordpress-plugin/socdepoble-enxufe.php` + `readme.txt`, paquet `_builds_de_poble/wordpress/socdepoble.zip` + `261029_HHMM_wordpress_directori_v1.1.10.zip` (`wordpress-plugin/eines/empaqueta.mjs --directori`).

### 2. Carril E1 (P1-12 · E2EE Fase 4): diagnòstic exacte del que hi ha i del que falta

- **Hi ha (feaaf0e07):** primitives (`xifratXatCripto.js`, 863 línies, vectors), formats `SDPH`/`SDPV` (`xifratXatFormats.js`), abast (`xifratXatAbast.js`), protocol complet amb identitat, fixacions, èpoques, `xifraMissatge`/`obriMissatge` i `xifraAdjunt`/`obriAdjunt` (`xifratXatProtocol.js:324-919`), recuperació i Shamir (`xifratXatRecuperacio.js`), llista de paraules, magatzem IndexedDB `sdp_xat_claus_v1` amb `safata` (cua F7: `CADUCITAT_SAFATA_MS`, `MAX_MISSATGES_SAFATA = 200`, `MAX_BYTES_SAFATA = 64 KiB`, `TERMINI_OBRIR_MS = 10 s`, `IDENTITAT_MALMESA`), el contracte del port amb les capacitats opcionals `clausXat` (13 mètodes) i `xatMultimediaXifrat` (2) (`src/data/contracte.js:166-173`), el decorador `ambXifratXat` amb el servei d'àmbit de 4 claus i la migració `supabase/migrations/2610290400_xat_e2ee_claus_i_sobres.sql` (no aplicada).
- **Falta (el que tanca esta onada):**
  - `src/data/xifratXat.js`: `loadMissatges` torna les files tal qual (`:394-400`, cap desxifratge); `enviaMissatge` només xifra si l'entorn injecta `preparaSobreXifrat` o si el cos ja ve xifrat (`:442-482`): `host.js:89-100` no injecta cap preparador, així que amb la bandera a `true` un fil d'abast rebutjaria tot text (`SDP-XAT-031`); `publicaAdjuntXat` rebutja els fils xifrats amb `adjunt-xifrat-pendent` (`:487-507`); `urlAdjuntXat` no es decora; `loadFils` depén d'un `entorn.desxifraResum` que tampoc no s'injecta.
  - **Cap transport al servidor:** `src/data/supabase/{index,xat,xatMultimedia}.js` no implementen cap mètode de `clausXat` ni de `xatMultimediaXifrat` (grep `enviaXifratXat|publicaIdentitatXat|publicaAdjuntXifratXat`: només al contracte i a `backendPort.xifrat.capacitats.test.js`); `src/data/localXat.js` tampoc. El pipeline «extrem a extrem» necessita un transport opac nou (`src/data/supabase/xatXifrat.js`) alineat amb les RPC de la migració `2610290400`.
  - **Cua F7:** el magatzem té la `safata` i les proves `xifratXatProtocol.cuaAmbit` i `xifratXatMagatzem.actorSafata` fixen l'àmbit i l'actor, però cap funció drena la cua en desbloquejar claus ni el decorador encua res.
  - **D-09:** `servei.oblidaClausXat()` buida només la RAM (`xifratXat.js:241-249`); l'esborrat d'IndexedDB amb reintent i `OBLIT_FALLIT` existix al magatzem però no el crida cap flux d'eixida; cap neteja de sessió ni de preferències; cap estat exposat a `XatContext`.
  - **Precommit:** `tests/host.xifrat.apagat.test.js` (Vitest) queda fora del patró `src/**/*.seguretat.test.*` de `vitest.precommit.config.js`; `src/sections/xat/XatContext.xifratApagat.seguretat.test.jsx` sí que hi entra. El trasllat preparat és `src/host.xifratApagat.seguretat.test.js` (contingut ja adaptat per l'explorador, al scratch).

### 3. Carril M1: diagnòstic

- **D-C2:** els actius natius són un verd pla (15,103,47) amb el logotip blanc (rosa dels vents). Inventari amb píxels del verd antic: `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (1024², RGB, 907.298 px), `Splash.imageset/splash-2732x2732{,-1,-2}.png` (3 fitxers idèntics, 7.424.140 px), `android/app/src/main/res/mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher.png` (RGB) i `ic_launcher_round.png` (RGBA), `drawable*/splash.png` (13 densitats), `ic_launcher_foreground.png` sense verd (logotip sobre transparent). Text: `android/app/src/main/res/values/ic_launcher_background.xml` (`#0F672F`), `ios/App/App/Base.lproj/LaunchScreen.storyboard:18` (0.0588/0.4039/0.1843), `capacitor.config.json:31` i les dos còpies de `cap sync` (`iconColor`). Mètode validat en scratch: remapa exacte (15,103,47)→(14,102,46) més les vores d'antialiàsing resoltes per alfa; 0 píxels antics restants, mode i mides intactes (AppIcon 31.376→36.995 B). Les icones PWA (`public/icona-app-{192,512}.png`, `apple-touch-icon.png`) també porten el verd antic: **fora de l'ordre (només natives)**, es deixen intactes i s'anoten com a pendents.
- **R-02:** 83 fitxers `.png` de `public/assets/` amb màgia JPEG (`FF D8 FF`): 76 a `uploads/`, 4 a `fotos/`, 2 a `img/`, 1 a `events/`; 47,6 MB; **tots 83 tenen bessona `.webp`** (política de mitjans: el paquet i el web servixen la bessona). Mesures Pillow: foto 1024² 1,1 MB → PNG 2,0 MB (×1,9); targeta nano 640² 119 KB → 820 KB (×6,9). La recodificació a PNG real conserva camí i píxels però multiplica els bytes del repositori; cap eina sense pèrdua pot evitar-ho (un `.png` ha de portar bytes PNG). Decisió per al Mestre documentada a Límits.
- **OG-02:** convenció dels 18 variants existents verificada (retall de cobertura centrat amb augment quan cal: 723×1024 i 640×640 → 1200×630; JPEG baseline; ≤300.000 B; sense APP1). Les 6 variants noves seguixen la mateixa convenció. `vite.natiu.config.js:351` deriva `RECURSOS_NOMES_DEL_HEAD` de `VARIANTS_SOCIALS` (cap llista manual).
- **WP 1.1.10:** `socdepoble-enxufe.php:6` (`Version: 1.1.9`) i `:129` (`SOCDEPOBLE_ENXUFE_VERSIO = '1.1.9'`), `readme.txt:7` (`Stable tag`), `:133` (changelog) i `:182` (upgrade notice). Les mencions de `1.1.9` a `src/sections/consola/empaquetats.test.js` són fixtures, no lligen el connector. Recepta de paquet: `git archive` de l'arbre exacte + `node_modules` per paquet + `.env.production.local` + `SDP_RELEASE=1 SDP_VERSIO=1.1.10 npm run build:wp` i `build:wp:directori` + `empaqueta.mjs --directori` → `wordpress-plugin/builds/directori/socdepoble.zip` → còpia datada a `_builds_de_poble/wordpress/`.

### 3b. Carril M1 · EXECUTAT (15:05–15:25 CET, fil principal)

- **D-C2 (fet):** 25 PNG natius remapats al verd AAA (14,102,46) amb `remapa_verd.py` (scratch): AppIcon 1024² (907.298 píxels exactes + 5.513 de vora → 907.391 nous, 0 antics), 3 Splash 2732² (idèntics byte a byte), 5 `ic_launcher` + 5 `ic_launcher_round` + 13 `splash` d'Android; `ic_launcher_foreground` ×5 intactes (sense verd). Text: `ic_launcher_background.xml` → `#0e662e`; `LaunchScreen.storyboard:18` → 0.0549/0.4/0.1804; `iconColor` → `#0e662e` als 3 `capacitor.config.json`; comentari de `tokens.css:118-119` actualitzat. **Prova:** `src/natiu/projecteIos.test.js` ara descodifica els PNG sencers (5 filtres) i exigix primer píxel (14,102,46), **0 píxels** del verd antic, ≥80 % de verd nou a la icona i ≥99 % al Splash, igualtat byte a byte de les 3 escales, i el mateix verd al storyboard i a l'XML d'Android: sense cap excepció de retard. `projecteAndroid.test.js:853` (iconColor = ic_launcher_background) continua verd.
- **R-02 (fet):** 83/83 `.png` recodificats a PNG real in situ amb `recodifica_png.py` (Pillow, `optimize`, nivell 9), píxels verificats idèntics a la descodificació del JPEG, mides i mode iguals: **49.935.079 → 106.234.109 B (×2,13; +56,3 MB)**. Reescaneig: 0 `.png` amb màgia JPEG. Guarda nova `src/config/actiusPublics.formatReal.seguretat.test.js` (413 imatges de `public/assets` escanejades per capçalera; dins del precommit).
- **OG-02 (fet):** 6 variants `-social-1200x630.jpg` (cervell 285.123 B, consola 276.309 B, La Torre 190.396 B, Orxeta 276.619 B, Sella 293.692 B q90, Tibi 229.533 B; totes baseline, sense APP1) i 6 entrades noves a `VARIANTS_SOCIALS` (24 en total; mínims de les proves pujats de 17 a 24). Expectatives actualitzades: `ItemDetailSection.imatgeSocial.test.jsx:261-263` (Sella al `<head>` amb la variant) i `imatgeSocial.test.js:948` (el cas «original sense variant» passa a `sella/2.jpg`). La Torre deriva d'`1.jpg` (600×450, ×2): `og-la-torre-1200x630.jpg` és la targeta de la marca «Gent de La Torre», no la mateixa foto. Vinyetes 480² amb retall centrat ×2,5, igual que `nano_mixa_socis` (640² ×1,88): la convenció mana; l'alternativa de fons difuminat queda anotada.
- **WP 1.1.10 (fet al codi):** `socdepoble-enxufe.php:6,129` i `readme.txt:7` a `1.1.10`; changelog `= 1.1.10 =` (6 punts: «Mostra els detalls» des del readme propi, guia de 3 passos, filtre `socdepoble_enxufe_idioma`, WordPress 5.8–6.4, slug/text domain `socdepoble` i llengües del directori, i les millores d'actius d'esta onada) i avís d'actualització (176 B). El readme passa de 20.422 a 21.650 B: sostre local de les proves pujat de 20.480 a 24.576 a `tests/enxufe-plugin.test.mjs:286` i `tests/enxufe-empaqueta.test.mjs:795` (límit anti-desbocament, no de WordPress.org). `node --test tests/enxufe-{plugin,empaqueta,pantalla}.test.mjs`: **84/84**. El canal signat `wordpress-plugin/builds/stable.json` queda a 1.1.9 (clau Ed25519 del Mestre): la Consola marcarà «desfasat» fins que es signe. **El zip** es construïx al final de l'onada, des de l'arbre exacte que es commitejarà (el paquet porta el bundle de `src/`, també els mòduls E2EE).
- **E1.4 (fet):** `git mv tests/host.xifrat.apagat.test.js src/host.xifratApagat.seguretat.test.js` (imports i mocks relatius a `src/`): entra al patró del precommit; passa.
- **Bateria M1:** `npx vitest run` sobre 9 fitxers (projecteIos, projecteAndroid, pes300, imatgeSocial, actiusPublics, ItemDetailSection.imatgeSocial, host.xifratApagat, censImatges, verdDeMarca.contrast): **9/9 fitxers, 222 proves verdes, 2 omeses**; ESLint 0 sobre els 9 fitxers canviats.
- **Pendent anotat:** icones PWA de `public/` al verd antic (fora d'ordre); `src/sections/text/pageContent.js` brut d'una altra mà (NOVA raw-color `#0e662e`, pàgina de versions) fa roig `design_guard` i no és d'este carril; 2 fitxers no versionats d'una altra mà a `public/assets/uploads/brain/nano_versions_ibanez_v1_1_10.{jpg,webp}` que NO entren al meu commit.

### 3c. Carril E1 · EXECUTAT (15:30–16:20 CET, fil principal, sense subagents)

- **E1.1 Pipeline extrem a extrem (fet):** mòdul nou `src/data/xifratXatPipeline.js` (motor: context del fil amb identitat del magatzem + directori de claus públiques via `clausDeXat` + cadena d'èpoques via `epoquesDelFilXat`/`sobresMeusXat` i `aplicaEpoca`; gènesi dins del mateix enviament com a `epocaNova`; `xifraMissatge` → sobre `{ v, epoca, iv, ct, kid, tf }` en base64url amb `text: null`; recepció i historial amb `obriMissatge` i memòria cau per `(fil, id)` sota l'àmbit; resum de la llista; eco IS-19 comprovant el `tf` desat; descart del context si l'enviament que portava la gènesi falla). Cablejat a `src/data/xifratXat.js` (`loadFils`, `loadMissatges`, `enviaMissatge`, `publicaAdjuntXat`, `urlAdjuntXat`; el motor només existix amb WebCrypto + magatzem (o IndexedDB amb `IDBKeyRange` i `CryptoKey` injectats); sense motor, el decorador falla tancat com a la Fase 3). `src/host.js:89-110` injecta tot l'entorn (cap global al decorador). **Transport opac** nou `src/data/supabase/xatXifrat.js` (13 mètodes `clausXat` + 2 `xatMultimediaXifrat`, cada un la seua RPC; les 7 RPC de la migració `2610290400` i les 8 de la fase 1b/1c del disseny §7.4 que encara no són al repositori: una RPC absent ix com a `codi: 'sense-capacitat-e2ee'`, mai com un èxit), registrat a `src/data/supabase/index.js` (`index.test.js` ara exigix les dos capacitats senceres). `transportAdjunts` exportat de `supabase/xatMultimedia.js` per a no duplicar pujada ni traducció d'errors.
- **E1.2 Adjunts xifrats (fet):** `src/data/xatMultimediaXifrat.js` (+ `.seguretat.test.js`, 5 proves): AES-256-GCM via `xifraAdjunt`/`obriAdjunt`, hash SHA-256 verificat **abans** de desxifrar (prova amb espia: `subtle.decrypt` no es crida en un blob manipulat), llista blanca de MIME (els de `MIME_XAT`; mai `text/html` ni `image/svg+xml`), sostres del clar i dels 20.000.000 B del blob Padmé (2.000.000 → 2.031.644 B), MIME real només dins del cos xifrat, bucket real `xat_adjunts` (el Pla deia `xat-adjunts-privats`: no existix). El decorador xifra abans de pujar (`publicaAdjuntXifratXat` amb octet-stream i mida exacta, sense hash al filferro) i servix l'adjunt rebut com a `blob:` desxifrat (`bytesAdjuntXat` → hash → desxifrat → `creaUrl`), amb memòria cau per `(adjunt, SHA-256(FK))` i els ids desconeguts pel camí de sempre.
- **E1.3 D-09 OBLIT_FALLIT (fet):** `servei.oblidaTotXat({ sessionStorage, localStorage, mantenSessio })`: RAM (síncron), IndexedDB via `magatzem.oblidaEnTancar` (reintent del magatzem; si el navegador bloqueja l'esborrat, `OBLIT_FALLIT` amb la causa), claus `sdp_xat_*` de sessió i preferències; torna i conserva un estat explícit `{ estat: 'oblidat' | 'OBLIT_FALLIT', pendents, causes }` (`servei.estatOblit()`), mai un èxit fals. Pendent (anotat): el diàleg que mostra `OBLIT_FALLIT` a la interfície i la crida des de `SessionContext.DESPRES_DE_TANCAR` són del pas 17 del disseny (interfície rere la bandera); el camí de dades queda tancat i provat.
- **Cua F7 (fet):** amb les claus bloquejades (sense identitat a l'aparell o malmesa) `enviaMissatge` encua a la `safata` del magatzem amb el **mateix id** i torna `{ encuat: true, reintentable: true, codi: 'encuat' }`; `servei.drenaSafata()` envia en ordre d'arribada, un a un, s'atura a la primera fallada sense reordenar ni duplicar i és idempotent (prova: dos missatges, fallada de xarxa reintentable al primer intent, tots dos enviats al segon, safata buida, l'altra persona els llig en ordre).
- **E1.4 Precommit (fet):** `src/host.xifratApagat.seguretat.test.js` dins del patró; `npm run test:precommit` verd (vegeu Verificació).
- **Proves noves:** `xifratXat.pipeline.seguretat.test.js` (6 proves: doble de servidor en memòria amb A, B i C; el servidor i la cadena d'èpoques no contenen mai el text en clar; fil amb entitat rebutjat sense sortir en clar; adjunts; cua; oblit; sense motor), `xatMultimediaXifrat.seguretat.test.js` (5), `supabase/xatXifrat.test.js` (7). **Regressió E2EE + port:** 23 fitxers, **586 proves verdes**; `tractor-enxufe` verd (cap import de `src/data/supabase/` als mòduls E2EE); ESLint 0.
- **Límits honestos d'E1 (anotats al Llibre Mestre):** l'alta de la identitat amb la frase (F2a, §5; `publicaIdentitatXat` exigix la còpia) i les pantalles (pas 17) no són d'esta onada: el motor llig la identitat del magatzem i, si no hi és, encua; els fils amb entitat (equip signat §4.8) es rebutgen amb codi; la rotació d'època d'un fil on no sóc membre no s'intenta; les CK no es persistixen a `clausFil` (es refan del servidor per àmbit); els noms de columna de les RPC 1b/1c seguixen el disseny §7.4 i es contrastaran amb la migració quan existisca; el pressupost LRU dels `blob:` (48/100 MB) queda com a deute.

### 4. Lectura creuada dels informes de les companyes (Olivera)

- **Gemini `261029_1514_auditoria_gemini.md` (15:19):** certifica G3 (`design_guard` 0 crítics, `tractor-inline-styles` 0, `tractor-fitxa-gestor` 0 via exempció d'`UniversalWorkspace.jsx` a `lleiF4`), G2 (`tractor-cens` C2=0/C4=0, `tractor-frontmatter` F9 de 140 a 33 —les 33 són de `01_produccio/`—, segell `c9fad3f4…`) i puntua 10,0 a huit dimensions i **9,9 a «Xat E2EE» i a «Actius multimèdia» perquè E1 i M1 estaven «en curs»**: ara estan tancats (§3b, §3c). Confirma que no ha tocat cap fitxer dels meus carrils (coincidix amb la meua llista). Observació: el seu `design_guard` «0 crítics» es mesura amb el baseline `.agents/deute/.design-guard-deute.json` buidat (`{}`): és la liquidació que demanava el Pla.
- **Codex `261029_1447_auditoria_codex.md` (15:07):** G1 aplicat per l'executor (14 camins, 6 suites noves, `100/100`), làpida `SG-02` intacta; el seu diagnòstic d'E1 (`xifratXat.js:394-400`, `:442`, `:480-482`) i d'M1 (83 PNG, les 6 OG, D-C2, WP 1.1.9) coincidix exactament amb el meu §2-§3 i **tot el que hi llista com a pendent queda tancat en este informe**. Dos troballes seues que no són meues i que cal mantindre a la vista: **P2 «Geometria alterada en una neteja»** (`src/css/components.css:254`, Gemini passa 24 px a `--sdp-space-5` = 20 px: canvi visual, Llei del Píxel) i el recompte de G3 després del seu tall. Codex deixa el 10,0/10 global «obert».
- **Regressió d'una altra mà detectada per la meua bateria:** `src/sections/multimedia/motorMultimediaLocal.js` (fitxer nou, no versionat, de l'onada `261029_1605` de MarIA) importa `../gestoria/font/fontNavegador.js` i tomba `src/sections/gestoria/privacitat.test.js` (frontera de la Gestoria). No és dels carrils 1305.

### 5. Estat de les 10 dimensions (certificació de Claude, només del que s'ha executat i mesurat)

| # | Dimensió | Evidència d'este torn | Estat |
| :-: | --- | --- | :-: |
| 1 | Disseny i estètica (Pedra Seca) | `design_guard` 0 crítics amb baseline buit (Gemini); cap píxel meu canvia llevat del verd AAA ordenat; **P2 de Codex** (24→20 px a `components.css:254`) per decidir | 🟡 |
| 2 | Arquitectura i enxufabilitat | port intacte, 2 capacitats E2EE senceres (transport opac), `tractor-enxufe` ✅, cap import de `supabase/` als mòduls E2EE | 🟢 |
| 3 | Xat E2EE i seguretat | pipeline, adjunts (hash abans de desxifrar), cua F7, OBLIT_FALLIT; bandera a `false`; 586 proves; **pendents** pantalles del pas 17 i migracions 1b/1c | 🟡 |
| 4 | Accessibilitat | verd AAA `#0e662e` també als natius; PWA icons pendents | 🟡 |
| 5 | Rendiment i actius | 0 `.png` amb bytes JPEG, 100 % og:image 1200×630 ≤300 KB; **+56 MB** de PNG real (decisió del Mestre) | 🟡 |
| 6 | Cobertura i qualitat de proves | precommit 4.202+262; Vitest sencer 24.491 (3 roges: 2 corregides, 1 d'una altra mà); Node 1.504 | 🟡 |
| 7 | Governança, portes i tractors | plantilles, autoritat, segell, LEDGER ✅; **contracte documental ❌** (torn de MarIA caducat, docs 1605 incomplets); relleu ESTAT/LEDGER pendent | 🔴 |
| 8 | Documentació, cens i memòria | informe, Llibre Mestre i memòria al dia; cens C2/C4 = 0 (Gemini) | 🟢 |
| 9 | Netedat de codi i lint | ESLint global 0 | 🟢 |
| 10 | Fidelitat de domini | textos en valencià, «el Mas electrònic», cap carpeta nova, cap `masia` | 🟢 |

**No es pot certificar el `10,0/10` unànime des d'ací**: ho impedixen, per orde d'importància, el contracte documental (torn de MarIA caducat i documents nous incomplets), la regressió `motorMultimediaLocal.js`, el relleu ESTAT/LEDGER d'este torn (executor), la decisió P2 de Codex, i els pendents declarats d'E1 (interfície i migracions 1b/1c) i d'M1 (icones PWA, pes dels PNG). Tot el que el Pla assignava als carrils E1 i M1 queda executat, verificat i documentat.

### 6. Altres carrils (lectura, sense tocar res)

- **G3 (Gemini):** `design_guard.mjs --arrel=src` continua a **37 crítics** (2561 fitxers): `h1-multiple` NOVA a `components/universal/DocumentEditor.edicioAvancada.test.jsx` i `sections/detail/VisorDePublicacio.diferit.test.jsx`; `raw-color` NOVA `#160`/`#173` a **`src/sections/text/perAppNativa.js`** (no `src/utils/`, com diu el Pla); `h1-outside-header` NOVA a `OnboardingSection.idioma.test.jsx`, `DetallPrivacitat.natiu.test.jsx`, `DetallPrivacitat.sessio.seguretat.test.jsx`, `PerfilPublicSection.gauntlet.test.jsx`. Cap dels fitxers assenyalats és de `src/sections/xat/` ni de `src/data/`: zero col·lisió amb E1.
- **G1 (Codex):** el pegat `261029_0838_solucio_t11_codex.patch` continua sense integrar (12 fitxers de governança); no s'ha verificat ací.
- **Alerta de quota:** 81 % del límit setmanal en obrir l'onada; el reconeixement en paral·lel s'ha aturat per ordre del Mestre i la resta del torn s'executa en fil únic.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Comanda (des de `socdepoble.org/`) | Resultat |
| --- | --- | --- |
| Arbre i HEAD | `git log --oneline -5`; `git status --short` | `62c74fa15` sobre `feaaf0e07`; 12 camins bruts documentals, 1 contracte nou |
| Torn | `node tooling/gates/obrir_torn.mjs --actor claude --scope code` | `torn_5679b065…`, `opened`, caduca 2026-10-30T13:46Z |
| Circuit documental | `document.mjs context` → `create --route auditoria` → `plan` | rebut `67ff0a1b…`; pla lligat `671ff917…`; àncora a `00_index_escriptori.md:17` |
| Mòduls E2EE | `ls src/data/ \| grep xifrat`; `grep -rn E2EE_ACTIU_PER_DEFECTE src/` | 10 mòduls + 17 proves; bandera `false` a `src/config/xifratXat.js:20`; `host.js:91` curtcircuita el decorador |
| Transport al servidor | `grep -rln "enviaXifratXat\|publicaIdentitatXat\|publicaAdjuntXifratXat" src supabase tests` | només `contracte.js`, `backendPort.js` i la prova de capacitats: cap adaptador |
| Migració E2EE | `ls supabase/migrations \| grep -i e2ee` | `2610290400_xat_e2ee_claus_i_sobres.sql` present (no aplicada) |
| OG-02 | `node tooling/seo/build-social-manifest.mjs --root . --origin https://socdepoble.org --out <scratch>/manifest.json` + `sniffImage` | 26 imatges locals, **6** fora de 1200×630, 0 remotes |
| R-02 | escaneig de màgia binària de `public/assets/**/*.png` (node) | 83 fitxers JPEG-en-.png, 49.935.079 B, 83/83 amb bessona `.webp` |
| R-02 mida | Pillow `optimize=True, compress_level=9` sobre 4 mostres | ×1,9 (fotos 1024²), ×6,9–7,5 (targetes 640²) |
| D-C2 inventari | cens Pillow de píxels (15,103,47) a ios/ i android/ | AppIcon 907.298/1.048.576; Splash 7.424.140/7.463.824; ic_launcher 31.528/36.864; splash 480×320 151.102/153.600 |
| D-C2 mètode | `remapa_verd.py` (scratch) sobre AppIcon, Splash, ic_launcher_round, splash | 0 píxels antics restants; nous = exactes + vores absorbides; mode/mides iguals |
| design_guard (G3) | `node tooling/gates/design_guard.mjs --arrel=src` | 37 crítics, 12 avisos (igual que al tancament de la nit) |
| Eines de la màquina | `python3 -c "import PIL"`; `which sips magick optipng` | Pillow 12.2.0 i `sips`; cap ImageMagick/optipng/sharp |

| **M1 · D-C2** | `remapa_verd.py` sobre 29 PNG d'`ios/` i `android/` | 25 remapats, 4 intactes (foreground); 0 píxels (15,103,47) restants |
| **M1 · R-02** | `recodifica_png.py --aplica` + reescaneig de màgia | 83/83 verificats píxel a píxel; 49.935.079 → 106.234.109 B; 0 restants |
| **M1 · OG-02** | `variant_social.py` ×6; `npx vitest run src/config/imatgeSocial*.test.js src/sections/detail/ItemDetailSection.imatgeSocial.test.jsx` | 6 variants ≤300 KB sense APP1; proves verdes |
| **M1 · WP** | `node --test tests/enxufe-{plugin,empaqueta,pantalla}.test.mjs` | 84/84 (readme 21.650 B dins del sostre nou) |
| **M1 + E1.4** | `npx vitest run` (9 fitxers) · `npx eslint --max-warnings=0` (9 fitxers) | 222 passades, 2 omeses, 0 fallades · 0 |

| **E1 · regressió** | `npx vitest run` sobre 23 fitxers (xifratXat*, xatMultimediaXifrat, supabase/xatXifrat, index, backendPort.xifrat, host.xifrat*, XatContext.xifrat*, useXifratXat, conformitat, kit, qualitat, xatMultimedia, xat, contracte) | **23/23, 586 passades, 0 fallades** |
| **E1 · porta** | `node tooling/gates/tractor-enxufe.mjs` | ✅ port abastable, contracte quadra |
| **E1 · ESLint** | 11 fitxers nous/canviats | 0 |

| **Precommit (arbre viu, 16:25)** | `npm run test:precommit` | **209 fitxers, 4.202 passades, 4 omeses, 0 fallades** + Node 262/262 (amb les 3 proves noves d'E1 i la de R-02 dins) |
| **ESLint global** | `npx eslint src tooling scripts tests --max-warnings=0` | **0** |
| Arbre compartit (16:25) | `git status --short` filtrat per carrils | Gemini i Codex ja editen en viu (`src/components/PedraSeca/**`, `src/css/{components,modules}.css`, `src/sections/disseny/**`, `src/sections/multimedia/*.js`; `tooling/{brain,gates,scripts,wiki}/**`, `tooling/tests/node-suite-manifest.json`, `.agents/**`, actes i plantilles): cap d'eixos camins entra a la meua llista (`llista_commit.txt`: els 89 de `public/assets/`, 28 natius, 31 de codi i proves) |

| **Vitest sencer (arbre viu, 16:30–16:40)** | `npx vitest run` (538 s) | 1.420 fitxers: **24.491 passades, 103 omeses, 3 fallades** → 2 meues, corregides i reverificades (`qualitat.amfitrio`: `host.js` no pot nomenar l'emmagatzematge web, els magatzems de l'oblit els injecta la interfície; `ItemDetailSection.imatgesPropies`: Sella al `<head>` amb la variant OG-02) i **1 d'una altra mà** (`src/sections/gestoria/privacitat.test.js`: el fitxer NOU no versionat `src/sections/multimedia/motorMultimediaLocal.js` importa `../gestoria/font/fontNavegador.js`, fora del carril de la Gestoria) |
| **Reverificació (16:50)** | `npx vitest run src/config/qualitat.amfitrio.test.js src/sections/detail/ItemDetailSection.imatgesPropies.test.jsx src/data/xifratXat.pipeline.seguretat.test.js src/host.xifratApagat.seguretat.test.js tests/host.xifrat.test.js` | 5/5 fitxers, 60 proves |
| **Node sencer** | `node tooling/tests/run-node-tests.mjs` | **1.511 proves, 1.504 passades, 0 fallades, 3 omeses** (+ broker 22/22) |
| **Portes** | `node tooling/gates/run-portes.mjs --nomes-portes` | plantilles ✅, autoritat ✅, segell d'skills ✅ (`c9fad3f4…`), LEDGER ✅; **❌ Contracte documental** (vegeu Límits: documents de l'Escriptori d'altres mans) |
| **Paquet WP 1.1.10 (arbre exacte)** | `tanca_onada.sh`: `git write-tree` dels 140 camins → `git archive` → `build:wp` + `build:wp:directori` amb `SDP_RELEASE=1 SDP_VERSIO=1.1.10` → `empaqueta.mjs --directori` → `node --test tests/enxufe-*.test.mjs` a la còpia | enxufe **84/84** a la còpia neta; `sdp-release.json` i el PHP del zip diuen `1.1.10`; 240 mitjans externs, 176 bessones WebP. _(El primer zip, de les 16:04, s'ha construït abans de la correcció de `host.js` i s'ha apartat a `_investigacio_ia_de_poble/261029_1455_onada_1305_claude/builds_obsolets/`.)_ |
| **Zip definitiu 1.1.10** | `NOMES_WP=1 tanca_onada.sh` sobre l'arbre exacte final `1fd85f03…` (140 camins de Claude sobre HEAD `62c74fa15`, índex temporal) | **`_builds_de_poble/wordpress/261029_1606_wordpress_directori_v1.1.10.zip` = `socdepoble.zip`: 3.344.308 B, SHA-256 `8ee706a3…`** + `261029_1606_informe_validacio_directori_v1.1.10.json` (cita l'arbre, no cap commit); enxufe 84/84 a la còpia; `1.1.10` a `sdp-release.json` i al PHP del zip |
| Tancament del torn (lectura) | `node tooling/gates/tancament.mjs --check --turn-id torn_5679b065…` | `valid: false`: el Pla viu ha canviat després del lligam (MarIA/Gemini l'han editat), falten els relleus d'ESTAT i LEDGER d'este torn (executor amb lease: per a MarIA), i el contracte documental marca «Torn caducat» al Pla, al Prompt i a `261029_1514_auditoria_gemini.md` (torn de MarIA `torn_5b24c7cc` caducat a les 14:26) i seccions pendents als documents nous `261029_1605_{pla_implementacio,prompt_opus}_album_multimedia_local_…` de MarIA |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Res commitejat, cap migració aplicada, cap desplegament, cap activació d'E2EE** (`E2EE_ACTIU_PER_DEFECTE = false` es manté). El commit, el `--no-verify`, el pas a `live`, la migració `2610290400` i la pujada de `socdepoble.zip` a WordPress.org són decisions del Mestre.
- **Governança intacta:** no s'ha escrit cap fitxer de `tooling/`, `scripts/`, `package.json` ni `.agents/` (els hooks del repositori no carreguen des de la carpeta mare; la política s'autoaplica).
- **R-02 i el pes del repositori (decisió del Mestre):** recodificar els 83 `.png` a PNG real és l'única manera honesta de mantindre l'extensió; costa entre ×2 i ×7 bytes per fitxer (desenes de MB al repositori i a Firebase Hosting per als clients sense WebP). L'alternativa (reanomenar a `.jpg` i migrar referències) trenca URL públiques citades per publicacions remotes de Supabase i es descarta. Per al camí amb lease del hook (16 MiB de pla), els binaris s'hauran de repartir en commits de ≤13 MB.
- **Icones PWA** (`public/icona-app-{192,512}.png`, `apple-touch-icon.png`, `favicon.*`) continuen al verd antic `#0F672F`: fora de l'ordre D-C2 (només natives); pendent al Llibre Mestre.
- **Discrepàncies del missatge d'emergència** (`#1A2B23`, `soc-de-poble-connector`, `public/downloads/`): no aplicades; s'aplica el Pla aprovat.
- **Reconeixement parcial:** 4 dels 9 exploradors (E1.1 pipeline, E1.3 oblit, R-02, portes i col·lisions) no han tornat cap resultat abans de l'aturada; la seua part s'ha fet amb lectura directa al fil principal.
- **Carrils G1/G2/G3:** no verificats més enllà de la lectura de `design_guard`; el `10,0/10` unànime depén dels informes de Gemini i Codex. A les 16:25 Gemini i Codex ja tenien canvis en viu (components, CSS, `tooling/`, `.agents/`): les portes globals que es passen ací lligen eixe arbre compartit, no només el meu.
- **Índex real:** `git mv tests/host.xifrat.apagat.test.js src/host.xifratApagat.seguretat.test.js` ha quedat preparat a l'índex compartit (dos camins explícits, cap carpeta); la resta dels meus canvis no estan preparats. El paquet WP 1.1.10 s'ha construït des d'un arbre exacte d'índex temporal (`git write-tree` dels 140 camins de Claude sobre HEAD; no és cap commit): el JSON de validació del paquet ho diu. Quan el Mestre decidisca el commit, el `tree` del commit ha de coincidir amb el `arbre_exacte.txt` o cal reconstruir el zip.
- **Comandes del Pla impossibles tal qual:** `npx vitest run src/services/xat/` i `tooling/design/design_guard.mjs` (rutes inexistents): s'han passat els equivalents reals (`npx vitest run src/data/xifratXat* …` i `node tooling/gates/design_guard.mjs --arrel=src`).
- **Interfície de l'E2EE:** cap pantalla nova (pas 17 del disseny): el motor, el transport, la cua, els adjunts i l'oblit queden provats per sota de React; la bandera continua a `false` i `host.js` no activa res.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
