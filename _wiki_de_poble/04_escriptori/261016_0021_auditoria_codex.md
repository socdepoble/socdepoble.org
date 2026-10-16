---
type: informe
status: esborrany
description: Auditoria adversarial de concurrència, cicle de vida i suites del Gauntlet nocturn, amb evidència local i límits explícits.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5b62e0c4-ed6d-49f1-8a29-ff692698d9f1:260a9d8f-8cf8-4b9d-b737-bd5c0d2592dc
---
# Auditoria Codex del Gauntlet autònom

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5b62e0c4-ed6d-49f1-8a29-ff692698d9f1:260a9d8f-8cf8-4b9d-b737-bd5c0d2592dc |
| Versió del document | 1.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T22:21:56.332Z |
| Modificació | 2026-10-16T00:40:45.207475+00:00 |
| Propietari | codex |
| Aprovació humana | Encàrrec explícit del Gauntlet i pla aprovat; execució del Bloc 4 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT Codex; tres subagents Codex, sense suplantar Claude ni Gemini |
| Tokens consumits | No disponibles; no estimats |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-16T00:40:45.207475+00:00: comprovació de salut local HTTP 200 i últim pla incorporats; seed d’IAIA present, registre aplicat i clic autenticat no acreditats.

2026-10-15T22:21:56.332Z: esborrany creat; contingut i verificació pendents.

2026-10-16T00:34:41.469994+00:00: balanç final de la ronda Codex, CI completa verda i nous contraexemples lliurats; sense aprovació global ni processos propis pendents.

2026-10-15T23:14:10.528534+00:00: primer relleu de tancament Codex; correccions pròpies verificades i CI completa roja amb reverificació focal verda, sense aprovació global.

2026-10-15T23:25:37.805559+00:00: tercera iteració acabada després del Relleu 4 de Gemini: 134/134, 19/19 i 31/31; dos defectes d’autoria/imatge corregits i residus locals retirats. Cap certificació global.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Balanç de la ronda Codex · 2026-10-16 02:40 · sense aprovació global

**Auditoria executada i relleu lliurat a Claude/MarIA.** Les dues fallades base estan corregides; la quarta CI completa acaba en verd (946 Node i 17.919 Vitest passades, zero fallades; skips/TODO explícits). L’estrés opt-in passa 8/8 fins a 40.000 fluxos virtuals amb transport simulat, sense acreditar capacitat remota. Els cicles instrumentats de Workspace i les proves del port 1.2 passen. No s’ha tocat `backendPort.js`, desplegat cap versió ni aplicat SQL remot.

**No s’aprova el conjunt actual:** després de la captura de CI han arribat canvis nous i continuen oberts EXIF/normalització WebP, coherència d’avatar després de 403, scroll del Lector, poble obligatori i noves rutes/actors. La resposta pública de la imatge OpenGraph és HTML. Cada troballa té reproducció, hash i límit en els relleus següents; les fonts de Claude no s’han sobreescrit. La proposta temporal d’orientació i el SQL amb ROLLBACK estan preparats per integrar i reverificar. Les proves diagnòstiques roges no s’han venut com a resultat verd ni incorporat inadvertidament a la CI.

**Onada 1.2, ampliació nova:** lectura local sense tests addicionals. `xatsPerDefecte.js` definix només les dues ajudes Sóc de Poble/IAIA; Javi no té conversa permanent ni el text automàtic exacte. Gent de la Torre depén del poble declarat; IAIA pot amagar-se per configuració i la fila sintètica de Sóc de Poble es retira a qui gestiona l’entitat. Són regles anteriors que l’executor haurà de reconciliar amb els quatre actors nous, preservant la separació d’identitats i sense inventar una resposta humana. El RAG cultural continua condicional; no s’ha iniciat amb la infraestructura encara oberta.

**Recursos de Codex alliberats:** totes les sessions de CI/focals/Chromium pròpies recollides; tres subagents finalitzats i sense processos pendents; perfils temporals de navegador netejats. Cap cron creat, quatre automatitzacions preexistents PAUSED en la comprovació de les 02:28. Cap procés de Claude/Gemini interromput. Cap reserva efímera de fitxer pendent. La governança segueix no vàlida (455 incidències al tall 02:29); no s’ha falsificat scope, vinculació ni segell. Informe i acta es validen pel comprovador documental.

Els relleus que seguixen són cronològics: un estat anterior «en curs» o «pendent» queda substituït pel resultat posterior indicat, sense esborrar l’evidència de les refutacions.

### Relleu 02:40 · IAIA local: transport refutat i abast de la comprovació

**Supabase local respon HTTP 200.** El primer GET sense credencials a `http://127.0.0.1:54321/auth/v1/health`, executat dins del sandbox, donà curl 7 / HTTP 000. La repetició del mateix GET fora del sandbox, sense proxy, amb límits de connexió de 2 s i total de 4 s, retorna HTTP 200 i exit 0. El primer resultat no demostrava que el servei estiguera caigut. No es publiquen capçalera ni cos i no s'han usat credencials. Procés recollit.

La IAIA figura tant en la llavor JS com en `supabase/seed.sql`, amb UUID `11111111-1a1a-0000-0000-000000000000`. El camí seed/local usa el directe `?amb=<UUID>`; el remot usa `/iaia` i l'anònim `fake-iaia`. `loadFils` propaga l'error i només afegix les ajudes després d'una resposta correcta; `loadCoreContent` no fa substitució automàtica remot→seed, i `exitRemoteMode` és un retorn explícit al mode local. **No s'ha verificat el registre aplicat en la base, la configuració privada efectiva, el clic autenticat que falla ni la paritat amb producció.** Per tant, el servei accessible i el catàleg present no acrediten que el xat funcione ni n'identifiquen encara la causa.

**Últim context llegit íntegrament a les 02:35 i hashes reverificats abans d'emetre este relleu:** pla `255c155609d7a524fa2c648d0c4e89ce78af011137de229216fbeb31367d8813`; prompt `c9d553ad61cd38edb43eed5144b9a1ebb269ec55174f911e6011cbd67760cb95`. L'ampliació explicita el problema d'IAIA a localhost i la comprovació del seed/Supabase 54321. Els informes de Claude i Gemini continuen amb els hashes de la lectura íntegra anterior. No hi ha documents nous o modificats de tercers a l'Escriptori després d'eixa lectura. El nou abast queda lliurat a l'executor; no es reprén el RAG cultural condicional ni s'atribueix una reparació remota inexistent.

### Relleu 02:32 · SEO públic, SQL revisable i noves ampliacions del pla

**SEO públic pendent, amb contraexemple HTTP concret.** Entre les 02:27:57 i 02:30:52, GET públics sense sessió a `https://socdepoble.org/`, `/javillinares`, `/socdepoble` i `/rentonar` retornen el mateix HTML de 7.009 bytes, HTTP 200, sense description/OG/Twitter/canonical. La URL declarada localment `https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png` retorna **eixe mateix HTML, content-type text/html, no PNG**, SHA `6cadbaa5c08a572e35f07e2d29e8f2a1d6cf1d0b4b8c6a698fa518a76a479918`, cache-control max-age=3600. `https://gentdelatorre.net/` i `/?sdp=%2Fjavillinares` retornen títol/OG bàsic, però sense `og:image` ni descripció. Evidència sanejada `/tmp/sdp-seo-public-summary.json`. Són respostes observades en eixe instant, no el resultat de WhatsApp ni una declaració sobre qualsevol capa de cache.

Localment hi ha PNG real 1200×630 i OG base complet a `index.html`; les tres rutes netes encara no estan declarades en `App.jsx`, que acaba en NotFoundPage. Canonical/og:url es creen al client; `vercel.json` mostra fallback a index sense prerender per ruta. L’emissor WordPress té contracte propi (filtres + manifest + `?sdp=`), que no equival a les tres rutes netes. **77/77 proves SEO locals passen** en tres fitxers i 1,50 s, amb fonts/tests estables: no validen el desplegament observat. Log `/tmp/sdp-seo-focal.log`. Cap desplegament fet per Codex. Cal corregir la correspondència de recursos/HTML públic i tornar a comprovar les URLs abans de donar per preparada la targeta social.

**SQL per al 403 ja concret i revisat estàticament:** `/tmp/sdp-profiles-update-repair-proposal.sql`, SHA `a32d4c6295a0715ee1ece303b169537e0b571e36d3fc078ee59f24959cd2f1e7`; fonts a `...sources.json`. Conté UPDATE només dels onze CAMPS_PERFIL actuals, ALTER/CREATE idempotent de la política pròpia existent, comprovacions de RLS/SELECT/restricció de baixa, ACL abans/després, reversió proposada i **ROLLBACK final**. No canvia SELECT públic, dades, esquema ni rols. Es diferencia permission denied d’ACL d’un rebuig WITH CHECK; cap política sola substituïx grants. **No executat ni compilat en PostgreSQL**, ni escrit com a migració compartida mentre el pla evoluciona. És una proposta per a integrar i provar, no una reparació remota acreditada.

**Lector després d’adaptar oracles:** AppLector/integració/frontera passen **48/48**, 6,45 s, log `/tmp/sdp-codex-lector-latest.log`. Dels 50 fitxers vigilats només canvia `privacitat.test.jsx`, que no es va executar; fonts i tres tests executats invariants. El contraexemple separat de scroll continua vigent en el mateix hash de Noticies. No es confon el verd dels oracles adaptats amb la desaparició d’eixa regressió.

**Context final rellegit sencer a les 02:32:** pla SHA `ec011085f22237a3797d191774938e31a5c25eeca56ea42238fa793554fd7bf9` i prompt SHA `3972dc8fd9e0851ed94f60a09d9b6b860a0f7dbe5b67a41847227713c97b9d10`. La nova Onada 1.2 afegix quatre actors permanents al xat i text anònim honest; s’audita com a ampliació nova, sense atribuir-ho a una regressió anterior. El RAG cultural és condicional a infraestructura acabada; els defectes oberts fan que no siga encara el torn d’implementar-lo. Claude/Gemini no han canviat els seus informes des de l’última lectura íntegra.

### Relleu 02:28 · oracles existents d’imatges verds; Onada 1.1 contrastada

**127/127** proves existents passen en sis fitxers (`exifIncrustat`, `pujadaImatge`, `imageUtils`, `useHeroImageHandler`, diàleg senzill i `useImatgeDeFitxa`), 6,02 s, amb 33 hashes invariants. Log `/tmp/sdp-codex-images-wave2.log`, manifests `...before.json` / `...after.json`. No cobreixen els contraexemples nous del relleu següent: eixa és la raó per mantindre’ls oberts encara que les proves existents passen. Cap procés d’esta focal pendent.

**Pla rellegit íntegrament de nou**, SHA `cec98c4128c8841680d989e51e4c8dc7529bc865ae2fcc555b316e5f2652a697`: afig rutes `/javillinares`, `/socdepoble`, `/rentonar` i verificació SEO/WhatsApp. L’apartat de «dos usuaris/autors» conviu amb les tres identitats controlades; es trasllada a MarIA perquè delimite l’autoria seed, sense inferir purgues ni pertinences remotes. Claude/Gemini mantenen els hashes de l’última lectura íntegra.

**P2 · poble encara opcional:** Rentonar té `town_name:''`; l’alta d’organització omet el poble en formulari/domini/adaptador i l’edició el pot convertir a null. Les proves locals encara exigixen eixe comportament anterior. Cal adaptar alta, edició i dades canòniques al mandat nou, sense substituir arbitràriament el poble real d’altres entitats. `identitatsSeed.js` SHA `2796d0f5e9101854c9be3570c5e2ae2ac8eb46a10de0b9d92c41a042d24d8fed`, `PerfilContext.jsx` `fcb55eadda5feeb5bad1ffdaebb0d1c6047e7c714f23b61cc43132bd57bb7047`.

**403: política i permisos són capes diferents.** La política pròpia equivalent ja apareix a la migració 2609110600, i els grants de columna també en eixa migració i en 2610042350. Afegir només CREATE POLICY no prova ni corregix un ACL absent. No reaplicar cegament les migracions completes: la primera inclou lectura pública `USING(true)` i la de convergència inclou DROP d’altres funcions. Codex prepara una proposta SQL acotada i idempotent, sense aplicar-la al backend. Sense comprovació remota no es declara producció reparada ni es confirma l’estat actual de RLS/privilegis.

Les quatre automatitzacions Codex preexistents s’han rellegit: totes PAUSED. Cap cron propi creat; esta comprovació no acredita els schedules d’altres aplicacions.

### Relleu 02:26 · quatre contraexemples nous per a la segona iteració de Claude

**EXIF, prioritat alta: el bloc publicat pot conservar punters i destruir-ne la destinació.** Amb TIFF sintètic vàlid de 450 bytes, II i MM, sense IFD1, `preparaTiff` retorna 434 bytes: manté el MakerNote de 24 bytes i el seu punter 434 però elimina els 16 bytes de destinació; manté SubIFD 0x014a→260 però substituïx el directori per zeros. Mantindre offsets no basta si s’esborren els bytes apuntats. Les variants PNG/WebP reals creades i descodificades amb Pillow reprodueixen l’eixida publicable. No és certificació d’una marca de càmera real: el MakerNote és sintètic, amb punter explícit verificable. El contraexemple SubIFD usa la cadena de directori TIFF. Cal preservar el graf complet admés o rebutjar explícitament eixe cas, sense donar per conservat un bloc corrupte. Evidència `/tmp/sdp-codex-exif-incrustat-adversarial/report.json`, sis fonts estables; `exifIncrustat.js` SHA `b76097aaef3fc79d49efcc63083887b9fd2e2faa2b73999e9cfc5c3906fbf41f`.

El mateix mòdul descarta silenciosament TIFF de 70.462 bytes en PNG/WebP vàlids de menys de 80.000 bytes totals: `extreuTiff` és exacte però `exifPublicable` torna null i `ambExifDeLoriginal` retorna la foto neta. És el sostre JPEG declarat de 65.527 bytes aplicat a qualsevol format; no una evasió del seu límit. Eixa política continua incomplint la preservació general i no arriba a l’avís de pressupost EXIF. Cal distingir absència d’EXIF de lectura/preservació impossible i aplicar límits segons format d’eixida.

**P2 · càmera sense GPS/data perd el consentiment de conservació.** Prova focal de `DialegEnquadrament` amb lector TIFF real: una foto sintètica amb Make/Orientation, però sense GPS ni data, té `exifPublicable.tiff` vàlid; en Guardar, `metadades.exif` queda undefined. Afegint GPS al mateix cas sí retorna `{ conservaExif:true, original }`. Resultat 1/2, 5,63 s, quatre hashes estables; `/tmp/sdp-codex-camera-exif/unit-realpath.log`, font i manifests al mateix directori. Només carregador/raster/exportador són dobles de jsdom; la lectura EXIF i el diàleg són reals. La condició `teUbicacioOData` de `desa` no ha de decidir si es conserva la càmera. Primera temptativa fallida per àlies `/tmp` abans de descobrir proves; no comptada com a fallada de producte.

**P2 · error 403 deixa avatars divergents i tanca el retallador com si haguera desat.** Reproducció amb editor, handler, cua d’autodesament i TargetaViva reals, backend/storage/Canvas simulats: després d’un 403/42501 injectat, editor `/assets/nou.webp`, TargetaViva `/assets/a.webp`, diàleg tancat, cua en error amb `logoImage` nou, un PATCH i cap recàrrega. `saveRemote` resol false; `useImatgeDeFitxa` l’espera però no propaga eixe resultat. No cal esperar producció per refutar l’èxit visual. Cal preservar una font compartida de previsualització i propagar el fracàs a qui tanca el diàleg, sense perdre l’esborrany. Evidència `/tmp/sdp-avatar-focal/evidence.json`, `vitest-result-2.json`, `cohort-final.json`; dotze fonts invariants, prova exit 1 recollida, sense xarxa ni migració remota.

**P2 · el Lector nou no reinicia el scroll quan es canvia de carpeta.** «Hui» a scrollTop 240 → obrir/tancar mateixa notícia conserva 240 (correcte) → tornar a obrir i triar «Esports» conserva el mateix node amb tres files i scrollTop 240 (esperat 0 segons contracte antic i comentari actual). `Noticies.jsx:239–250` només restaura focus. 51 hashes estables, SHA de Noticies `5d915a1a44b9c8c919ea0b2c6b54190d62b4c48caea3aeffb775f00611b68a90`. Prova i log `/tmp/sdp-lector-wave2-probe.test.jsx` i `/tmp/sdp-lector-wave2-probe.log`; fitxer temporal retirat del repo, reserva alliberada. S’ha observat també que cercar una de sis notícies i prémer «Marca-ho tot» en marca sis: ambigüitat de l’abast de l’acció, no P2 declarat sense decisió de contracte. Cap prova mòbil/heap; listeners nous revisats sense fuita identificada.

Totes són verificacions del tall indicat, mentre Claude continua escrivint. No es modifiquen els seus fitxers; els contraexemples queden lliurats ací perquè l’executor aplique la segona iteració. La quarta CI verda anterior no cobrix estos nous oracles.

### Relleu 02:25 · primer EXIF de producte: 10/12 casos reals; WebP orientat continua roig

La nova cadena pura `fotoDinsDelPressupost → compressImage → ambExifDeLoriginal`, ara amb `conservaExif:true` explícit, passa **10/12** casos Chromium/Pillow: JPEG i PNG Orientation 1/6, i WebP Orientation 1, a 1200×1200 i 400×400. Conserven GPS, data/zona, Make i MakerNote de les fixtures simples i respecten dimensions, píxels, MIME, bytes del File i pressupost. **Fallen els dos WebP Orientation 6**: els píxels no giren, mentre la reinserció normalitza Orientation a 1. És el compressor directe; la proposta temporal sobre `carregaImatge` arregla el retallador però no este altre camí. Cal compartir la normalització real o garantir el contracte a cada entrada, sense donar per fet que reinserir EXIF orienta el raster.

Evidència `/tmp/sdp-browser-images-product-exif-optin-first.json` i binaris; execució 02:23:19–02:23:22, set fonts invariants, exit 1 per les dues assercions de píxels; navegador exit 0 i perfil/fixtures netejats. `pujadaImatge.js` SHA `44c8b20e5f8a0617d8a26ffde03196a0439f5b0fc4850bcec88bbb257766a7a1`, `imageUtils.js` `85236d516d72fabbf8f47d1de56adaa04bd4d30cc54562d45cde9d8151b16ca8`, `exifIncrustat.js` `b76097aaef3fc79d49efcc63083887b9fd2e2faa2b73999e9cfc5c3906fbf41f`.

**Límits:** opt-in explícit de funcions pures; no acredita la tria per defecte en UI, el pas de l’original a través dels hooks, persistència ni metadades complexes. No s’han canviat els oracles anteriors per amagar el default false. Les excepcions per a fotos enganxades i la supressió d’IFD1 consten al codi nou però no equivalen a preservació íntegra universal; el mandat explícit continua sent el criteri. S’estan refutant TIFF amb SubIFD/MakerNote i mides grans abans d’aprovar el mòdul nou.

**Reserva efímera Codex:** `tests/gauntlet-codex-lector-wave2-probe.test.jsx`, si és necessari per reproduir interaccions del Lector. Cap edició de les fonts ni dels oracles de Claude. El build real/fronta passen 7/7 i 9/9, i el cas sense port 1/1 en 54 hashes estables; encara no certifiquen cerca/scroll del flux nou.

### Relleu 02:22 · quarta CI verda i proposta d’orientació contrastada en navegador

**Quarta CI acabada amb exit 0, Node=0 i Vitest=0.** Node: 951 totals, 946 passades, zero fallades, 1 skip i 4 TODO. Vitest: 18.008 totals, **17.919 passades, zero fallades**, 89 saltades; 1.045 fitxers verds i 6 saltats. Vitest ha durat 711,01 s des de les 02:08:50. Log `/tmp/sdp-gauntlet-codex-ci-fourth.log`; procés recollit. És una execució completa verda, però no un tall congelat: la comparació feta a les 02:21:40 contra les 2.560 rutes inicials troba huit canvis (set del Lector i `imageUtils.js`) i dos fitxers nous d’EXIF; `.cache-tractor.json` és un tercer fitxer generat d’eines. Manifest `/tmp/sdp-gauntlet-codex-fourth-ci-after.json`. Les captures no determinen l’instant de cada canvi ni acrediten que la suite haja importat el seu estat final. Els canvis del Lector i EXIF de Claude continuen en revisió focal.

**Proposta temporal per al P2 d’orientació: 83/83 unitaris i 6/6 geometria real en Chromium 151.** Només a `/tmp/sdp-codex-orientacio-proposta-261016`: `diff.patch`, `proposal.patch`, `manifest.json` i `unit.log`. SHA del pegat `4a3ead9d8ef8dc6d981c50bf83c7a5e04193cedbd1a56e928c841588b271155c`. Sonda real i memòria separades per format, MIME dels bytes, TIFF en PNG/WebP i lectura per trossos que salta els píxels: prova amb 2 MiB abans d’EXIF. Es mantenen l’API anterior i límits de 64 trossos / 256 KiB d’EXIF; superar-los torna sense dades, per tant no és suport universal de qualsevol contenidor legal. **No aplicat al repositori compartit**, perquè Claude té reservat el front d’imatge; queda concret i revisable per integrar-lo amb el seu pegat.

Els mateixos sis casos JPEG/PNG/WebP × Orientation 1/6 passen ara carregant i retallant els quadrants correctes: `/tmp/sdp-browser-images-crop-geometry-proposal-realpath.json` i artefactes. Set hashes estables, navegador exit 0, perfil/fixtures netejats, xarxa externa bloquejada. La primera execució (`...proposal.json`) fallà al carregador per l’àlies macOS `/tmp`→`/private/tmp`; no és una fallada del producte i es conserva l’evidència. La repetició usa el camí real i els mateixos oracles. Açò valida la proposta de geometria, **no preservació EXIF d’eixida, altres navegadors ni el producte actual**.

**Context nou llegit sencer:** el pla ha canviat a les 02:20:47 (SHA `f0e72505ba258e3ee34077f8d684be85664f6f78647fa9c2e602d5faddb65114`) amb Onada 1.1: tres actors legítims (Javi, Sóc de Poble i El Rentonar), poble d’entitats, 403 de `profiles` i dades compartides de perfil. S’audita localment; cap migració remota executada ni producció acreditada. Els informes Claude/Gemini mantenen els hashes de la lectura anterior.

### Registre històric d’inici de la quarta CI · 02:08:22 · prova integrada de workspace acabada

La regressió permanent `tests/gauntlet-codex-workspace-port.test.jsx` passa **2/2**, ESLint 0; SHA `ab416cd79ee05a260c137e828819c40beafeb6e1d76dd37c05354672ab7639eb`. Compila la fixture real, munta `UniversalWorkspace` amb el nucli de la pàgina, verifica contexts compartits i selecció, i fa 100 cicles StrictMode de selecció/plegat a 1400 px. Cada desmuntatge acaba amb zero observadors, subscripcions instrumentades i RAF pendents, alternant neteja abans del primer/segon frame. No és una mesura de heap, mòbil, SRI ni navegador real; tampoc substituïx la futura integració del Lector. Log `/tmp/sdp-gauntlet-workspace-port-interactive.log`. Reserva alliberada; no s'ha editat la fixture ni el producte de Claude.

**Quarta CI completa iniciada; etapa Node acabada amb 946 passades, zero fallades, 1 skip i 4 TODO (951 totals), 27,94 s. Vitest en curs.** Log `/tmp/sdp-gauntlet-codex-ci-fourth.log`. Captura de 2.560 fonts/configuracions a `/tmp/sdp-gauntlet-codex-fourth-ci-before.json`, inclosos configs de l'arrel, eines de WordPress i recurs TPV. S'executa per detectar regressions creuades del nucli 1.2, pressupost/retall i nova regressió interactiva. No certifica encara EXIF ni el P2 d'orientació WebP, i els futurs canvis de Claude requerixen nova comparació de hashes i proves apropiades.

### Nou P2 per a Claude · 02:04:33 · WebP amb Orientation 6 es retalla sense orientar

**Reproducció real: geometria 5/6, amb una fallada WebP.** La cadena `carregaImatge → exportaRetall → fotoDinsDelPressupost` sobre una foto sintètica 1200×900, amb EXIF Orientation 6, ha de carregar 900×1200 i girar una vegada. JPEG i PNG ho fan; WebP es carrega 1200×900 i exporta els quadrants incorrectes del retall. El resultat continua sent un WebP 1200×1200 de 4.084 bytes, de manera que comprovar només mida/format/pes no detecta la foto mal orientada.

Doble causa localitzada: el lector `exif.js` actual només localitza TIFF dins de JPEG, de manera que cal també lectura multiformat per a l’orientació del WebP. A `imatgeCanvas.js`, `giraSiCal`: `navegadorAplicaOrientacio()` usa la capacitat provada amb JPEG i evita el gir manual per a qualsevol blob. Chromium 151 no aplica en este cas l'orientació EXIF del WebP. Cal decidir l'orientació per format o normalitzar explícitament la descodificació i aplicar la transformació una sola vegada. La reinserció d'EXIF no ha d'ocultar este defecte ni conservar una Orientation activa damunt d'un raster ja girat.

Són mòduls reals, Canvas natiu i oracle Pillow/píxels independents; set fonts estables. `imatgeCanvas.js` SHA `123367f35a24bf61c78aa299698e3c9ed0ea42c37c325724184e260f68390fa5`; `orientacio.js` `6e8a6e91b545d149f4ef7ae60a6bff75376dbb2db609425b6ac469d9de508b59`. Evidència `/tmp/sdp-browser-images-crop-geometry-before.json` i artefactes de cada cas. Els sis controls són **només de geometria**, amb `metadata:'observe'`; no relaxen els oracles separats de preservació EXIF, que continuen rojos. No s'ha injectat cap reinserció de metadades al flux productiu. Browser exit 0, procés recollit, perfil/fixtures netejats i cap xarxa externa. Codex no edita els fitxers d'imatge reservats a Claude. Prepara una proposta en còpia temporal per contrastar la detecció per format i la lectura TIFF multiformat amb els mateixos sis controls; cap pegat de la còpia es presenta com aplicat al repositori.

### Reserva de prova integrada de la porta workspace · relleu viu

Codex reserva exclusivament `tests/gauntlet-codex-workspace-port.test.jsx`, un fitxer nou per a muntar interactivament la branca `UniversalWorkspace` del mòdul compilat amb el nucli real. La bateria de build anterior només executa SSR de `DefaultItemCard`; esta regressió provarà la frontera de context i la neteja sense editar la fixture ni els fitxers de producte de Claude. No es presenta com a validació del Lector, que encara no ha migrat en el tall actual.

### Pressupost i retall del perfil verificats · 02:00 · queda el camí genèric

**109/109 proves passen**, cinc fitxers i dotze hashes invariants abans/després (inici 01:59:34, 14,75 s). Les fronteres són ara estrictes: 80.000 bytes es rebutgen, 79.999 s'accepten; cap upload ni save si cap qualitat complix; la mida no baixa entre intents. `configDeForma` força avatar 400×400 i capçalera 1200×1200, inclosa l'ampliació, i `forma:'avatar'` preval quan el camp és `logoImage`. Log `/tmp/sdp-codex-budget-dimensions-focal.log`, hashes `/tmp/sdp-codex-budget-dimensions-before.sha256`. Estes proves tenen codificador simulat: no acrediten EXIF ni píxels reals.

**Alerta de cobertura per a Claude:** `UniversalEditorShell.jsx:837` encara munta el retallador genèric sense `sortida` exacta; a :764 envia el retall a `processaFitxer` sense forma/mida específica. `compressImage` manté proporció i només limita el costat llarg. Per tant, la correcció del perfil no imposa per si sola capçalera 1200×1200 en Notes i la resta de consumidors genèrics. Cal reconciliar eixe camí amb el mandat, mantenint l'excepció de panoràmica del poble on corresponga. Tampoc el fallback JPEG en navegadors sense encoder WebP acredita el format universal WebP; s'ha de declarar eixa limitació o resoldre-la, sense etiquetar el MIME falsament.

### Prova real de la canonada pura d'imatge · 01:56:46 · reproducció roja abans d'EXIF

**Tres casos reals fallen per pèrdua de metadades** en `fotoDinsDelPressupost`, amb mòduls ESM del producte, Canvas de Chromium 151 i decoder independent Pillow. Les entrades són fotos sintètiques ja quadrades, amb Orientation 6, GPS, data/zona, càmera i MakerNote. Les eixides són WebP vàlids i orientats: capçalera 1200×1200 de 3.336 bytes, avatar 400×400 de 946 bytes i desat local de 3.336 bytes. Els File de pujada són idèntics als bytes del data URL. Però totes tres eixides perden càmera, data, zona, MakerNote i GPS; l'EXIF no es conserva. No hi ha mocks d'encoder ni de decodificació.

Les cinc fonts tenen hash invariant abans/després: `pujadaImatge.js` `571d88ccff373cc2f5025afe520b2a354176b8201af5b7b91784062c640d65aa`, `imageUtils.js` `56b8c5403eca8d884f2682d3885d1d9bbe7eddfddcc073b5b84f3aa6a5f7c0e3`; la resta figura al manifest. Evidència binària i JSON a `/tmp/sdp-browser-images-product-before-exif.json` i `.artifacts/`. Browser exit 0, procés recollit, perfil/fixtures temporals netejats i cap trànsit extern. L'origen loopback és virtual, servit per CDP sense obrir cap port.

Esta reproducció és el tall anterior al pegat EXIF de la segona onada, que Claude continua preparant. **Abast limitat:** acredita les funcions pures configurades; no prova encara el retall React, fotos petites, opt-out, persistència remota ni una sessió completa d'usuari. Es conservarà com a contraexemple per contrastar exactament els mateixos oracles després del pegat.

### Revisió complementària del Bloc 3 · 01:56

Sense regressió nova identificada en la revisió de dotze fitxers estables: «El compte» desa `profiles.copyright` pel port neutral i només actualitza la preferència local després d'èxit; notes noves la consumeixen per actor, sense reescriure notes existents. El poble arriba a la targeta del directori, també amb silueta; ANIMAL→`ia` es centralitza en `tipusDAgent` i conserva id/fitxa. La retirada T50 elimina import, xip i aside duplicat, mantenint el cicle de vida de la targeta viva de la llista. Açò acredita eixa retirada, no una purga global de totes les entrades tècniques de navegació.

L'herència personal continua sent una preferència per dispositiu segons el contracte existent: un dispositiu nou adopta el copyright del servidor quan s'obri Perfil/El compte. No es presenta com una regressió demostrada ni com sincronització automàtica entre dispositius. Revisió estàtica; no es compta com una bateria nova.

### Relleu adversarial de la porta workspace · 01:53

**Actualització després d'acabar els oracles de versió: 74/74**, 6,45 s, exit 0. Set hashes estables; test `ec40428b931d41715e8b35dfe3a206a82d5f5e9b497737ff628e2e7e93ffc386`. Passa la nova fixture de build real amb `SocDePoble.nucli.workspace`, dos noms exactes, absència de backend/interns en el cos, rang `^1.2` i SSR de `DefaultItemCard` amb nucli real. Les nou fallades antigues queden tancades. Log `/tmp/sdp-nucli12-workspace-build-recheck.log`; la branca que munta `UniversalWorkspace` encara no s'executa interactivament en esta fixture: no es presenta com a validació del Lector.

**Build existent del nucli 1.2 verificat posteriorment:** `modulDeBuild` dona 60/69; les nou fallades són literals antics `1.1.0`/`^1.1` davant l'eixida `1.2.0`/`^1.2`. Els builds reals existents i les proves de càrrega amb nucli real passen; no hi ha error de permisos/transport. Hashes dels cinc fitxers vigilats estables, test `40c8e21edef61a62aee4bd120fdbc91de4182d08472a4af1db5a6bec68cfd6dd`. Log `/tmp/sdp-nucli12-build-recheck.log`. Claude té en curs la fixture `modulAmbEspai` i els oracles nous: no s'ha editat el seu front ni es dóna per validada eixa fixture amb les proves antigues.

**Alerta de guarda tancada en el tall verificat:** la sonda real veta els tres interns incrustats i permet la façana externa amb els dos noms autoritzats. **123/123** passen (guardes 24, fronteres 76, nucli/semver 23), exit 0, amb set hashes estables abans/després. Configuració `79f30defae49cb37128569042470338c62f383cf8c9e6f47a5655ecfb14963ff`, contracte `5e00b1180a3a80442d287e97a4eb3a55a82d1d87e00dc11a7e7e51629f140488`, nucli `100263fb3ac12140f865a9e85ccb43989a2d2fed32ea697e4c6e11267b269c18`. Log `/tmp/sdp-workspace-port-recheck.log`; manifestos `/tmp/sdp-workspace-port-hashes-before.txt` i `after.txt`. Sense edicions Codex. No acredita encara el build complet ni el Lector, que continuen en curs.

**Pegat ja observat en la relectura immediata:** `vite.modul.config.js` ara inclou el prefix `src/components/universal/workspace/` i l'error corresponent. S'està reverificant amb la sonda negativa i les proves; la descripció següent documenta la lectura anterior, no afirma que el forat continue després del canvi.

El contracte 1.2 exposa només `UniversalWorkspace` i `DefaultItemCard` en un objecte congelat; la sonda pura real de semver accepta `^1.0`, `^1.1` i `^1.2` en host 1.2, rebutja `^1.3` i rebutja `^1.2` en host 1.1. **Guarda pendent per a Claude:** `vite.modul.config.js`, `infraccionsDelCos`, encara no veta que un mòdul incruste fitxers interns de `components/universal/workspace`. Una sonda amb `chunk.modules` incloent `NavGlyph.jsx` o `UniversalWorkspace.jsx` i imports React vàlids retorna zero infraccions. La frontera de codi font sí rebutja l'import directe, de manera que no es presenta com una evasió completa demostrada del build: falta la defensa que promet el contracte. Afegir el prefix a la guarda i un control negatiu evitarà incorporar contextos/components interns a un mòdul distribuït. `fronteres.test.js` ha canviat durant la inspecció; la bateria integrada s'executarà després del pegat estable. Codex no edita este front de Claude.

### Tercera CI acabada · 01:50 · una fallada MIME i controls reals d'imatge

**Actualització focal posterior:** el pegat `Object.hasOwn(EXTENSIONS, delBlob)` ja és al disc. Els 11 casos MIME passen, inclòs `constructor`; cinc casos fora del filtre. Es manté la prioritat dels bytes. Hashes invariants durant la prova: utilitat `571d88ccff373cc2f5025afe520b2a354176b8201af5b7b91784062c640d65aa`, test `d32550960c5e18c64ad8b229d49e2a73d8c89906ed3ba42fb246d726cae7b2bb`. Cap edició Codex en eixe front. Log `/tmp/sdp-codex-mime-inherited-proof.log`. La fallada històrica de CI ja no es reproduïx, però açò no substituïx una passada completa posterior.

**Tall de fonts després de la CI:** el manifest corregit llig directament totes les rutes de les dues captures i hi afig un inventari nou del codi. En la nova captura, 30 de les 2.552 rutes inicials tenen hash diferent; 29 respecte a la captura 01:30:46. Apareixen tres rutes fora de les captures (dues de `modulAmbEspai` i `EspecimenDretsAutor.test.jsx`). No s'atribuïxen eixos canvis a dins de la CI: la captura és posterior i la segona onada encara s'està escrivint. Manifest `/tmp/sdp-gauntlet-codex-third-ci-after-corrected.json`. Substituïx el càlcul anterior que podia confondre rutes fora de l'inventari reduït amb fitxers canviats.

**CI completa exit 1: Node=0, Vitest=1.** Node: 951 totals, 946 passades, zero fallades, 1 skip i 4 TODO. Vitest: **17.874 passades, 1 fallada i 89 saltades, de 17.964**; 1.042 fitxers verds, 1 roig i 6 saltats, de 1.049. Inici Vitest 01:30:09; durada 1.072,89 s. Log `/tmp/sdp-gauntlet-codex-ci-third.log`. **Alerta a Claude:** `src/utils/pujadaImatge.test.js:58` demostra que `tipusReal(null, {type:'constructor'})` accepta una clau heretada i torna `constructor`, en lloc de `image/webp`. Codex en fa el diagnòstic focal; no edita la canonada reservada a la segona onada. El resultat roig no es reetiqueta com a verd.

**Controls independents amb Chromium real: 3/3 passen**, però `productValidation:false`: no són encara proves del pegat de Claude. Canvas natiu transforma el JPEG sintètic amb Orientation 6 en WebP orientat de 300×600 i elimina EXIF/GPS/data/càmera; un mux controlat amb Orientation 1 conserva els camps sintètics i els píxels, verificats amb Pillow. L'oracle negatiu original esperava un segon gir en Chromium i ha estat refutat: Chrome 151 manté dimensions; Pillow `ImageOps.exif_transpose` sí aplica la vella Orientation 6 i torna a girar el raster. Es conserva tant l'informe d'esta hipòtesi fallida com el control corregit, que registra el navegador sense imposar-li el comportament de Pillow. Evidència `/tmp/sdp-browser-images-control-escalated.json` i `/tmp/sdp-browser-images-control-final.json`. Perfil temporal i fixtures eliminats, navegador exit 0 i procés recollit; només dades sintètiques, CDP per pipe i cap trànsit extern.

**Lectura creuada 01:52:** rellegit íntegrament Claude (mtime 01:41:41, SHA `7d23d753fff3ca9bd12799d82e25889bb6b9692d5c7de1c4d7d7c1c944a1d0c7`). Reconeix la resolució EXIF del pla. La seua excepció proposada per a imatges enganxades encara no té cobertura al mandat «tota foto»: cal conservar per defecte també en eixe camí o oferir-hi el control corresponent. Traure una miniatura de l'original exigeix documentar explícitament què es conserva; no es pot anomenar EXIF íntegre si s'omet informació sense distingir-ho. Es manté la necessitat de verificar tot el flux real, dimensions i pressupost després de reinserir metadades.

### Segona onada de producte assumida per Claude · 01:39

Rellegit íntegrament el Relleu 3 de Claude (mtime 01:39:05, SHA `682245aac5368bed2c081da700c68f57395d80fa0439fb894ed1331ced624d74`). **Claude assumix explícitament les no conformitats:** porta `workspace` del nucli 1.2.0 i muntatge del lector sobre `UniversalWorkspace`; 1200×1200 i 400×400 exactes; pressupost decimal amb error honest; EXIF per defecte amb opt-out i reconciliació de privacitat. Estos punts continuen oberts fins a veure i reverificar el pegat, però ja tenen executor. Codex prepara oracles independents de binari/metadades i cicle de vida, sense duplicar edicions de producte. La tercera CI encara corre sobre l'onada anterior; no certificarà automàticament els futurs canvis.

### Contrast del Relleu 6 de Gemini · 01:36 · no conformitats mantingudes

Llegit íntegrament el nou Relleu 6 (SHA `ed7eaadf0658b4035afcedaa7df81dba13ddf31fe80df27c77fc62a4ca4427f7`). Acredita que ha rebut l'alerta del pressupost i reconeix la migració del lector pendent. **Codex no accepta reclassificar requisits obligatoris com a millores opcionals:** EXIF incrustat per defecte, quadrat exacte i pressupost estricte són al prompt i al pla. Preservar només alguns camps amb `publicar_mapa` actiu no equival a conservar íntegre l'EXIF; el flux del perfil ni tan sols trasllada eixos camps. La incorporació d'`UniversalWorkspace` al lector és un requisit explícit; no s'ha demostrat que depenga de tindre ja un proxy RSS. El verd de proves que esperen el comportament anterior no prova conformitat amb el mandat nou. Els Blocs 0/1 continuen oberts; el pressupost de 126.000 bytes és una reproducció concreta que cal corregir, no només una observació d'unitats.

### Alerta viva a Claude/Gemini · 01:31 · pujada del navegador

**Nou camí de pujada encara contrari al pressupost canònic:** `src/utils/pujadaImatge.js` fixa `PRESSUPOST_PUJADA = 80 * 1024`; `src/hooks/useHeroImageHandler.js` accepta `<=` i `dinsDelPressupost` torna el fitxer més lleuger encara que cap intent arribe al límit, després `onImageUpload` el puja igualment. Les proves de qualitat de compressió no acrediten `<80.000 bytes` si permeten este fallback. Cal pressupost decimal estricte i error honest abans de pujar quan no es pot complir. Codex no reserva estos fitxers de producte, que continua treballant Claude.

**Reproducció executada a les 01:31:49:** el test existent `useHeroImageHandler.test.js`, filtrat per `si cap intent no hi arriba`, passa 1/1 (22 casos fora del filtre) perquè exigix el comportament incorrecte: `true`, una pujada i cap error amb **126.000 bytes**. El simulador produïx 576.000, 540.000, 504.000, 322.560, 206.438 i 126.000 bytes; cap candidat complix ni 81.920 ni 80.000. No és una compressió real de fotografia: prova el control de flux amb encoder simulat i fetch de data URL. Hashes invariants: hook `a4853c99c808beaec209b9cc6ba84c303fb14872216344c460b04d3cd8084cea`, test `13ea425f54358d9e4d88356c255c2c026975827f329607cf39a3e45f822211e4`, utilitat `97c96944d824d2c79e346820b95c9fd5d144c03bc44c78f5f85240b44192e02c`. Log `/tmp/sdp-codex-hero-overbudget-proof.log`. Cal girar este oracle perquè exigisca rebuig sense pujada quan és impossible complir el pressupost.

El registre del TPV **ja integra WebP** en el tall actual; queda superat el pendent històric del JPG. Persistixen capçalera 16:9/1200×675, avatar de costat màxim (no mida exacta) i EXIF eliminat al navegador. **El pla vigent §0.1, llegit íntegrament, supera explícitament la resolució antiga Relleu 3 de Gemini que encara apareix al Relleu 5:** l'ordre és preservar EXIF per defecte i oferir opt-out. No es pot declarar el Bloc 1 globalment resolt amb el tractor de laboratori.

**Precisió del P1 EXIF:** `imageUtils.js:49–59` recodifica sense reinserció. `DialegEnquadrament.jsx:348–369` només llig GPS/data quan s'activa geo; el perfil força `permetGeolocalitzacio=false` (`useEnquadramentImatge.jsx:148`) i ignora el tercer argument de metadades (:154–155). Per tant, tampoc es pot afirmar extracció estructurada universal com a compensació. Els intents de pressupost rebaixen a 960/768/600; `exacta:null` deixa avatars menors de 400. `fitxerDeDataUrl` corregix MIME/extensió real si el canvas torna PNG, però açò no garantix WebP. El JPG personal de Javi està ordenat explícitament al pla i no es denuncia com una regressió independent.

Hashes estables durant esta revisió estàtica: `pujadaImatge.js` `2e09e5733edc73f4af76644fe4f469e1dd2ff93427babed08ef14c53a6690478`; `useHeroImageHandler.js` `a4853c99c808beaec209b9cc6ba84c303fb14872216344c460b04d3cd8084cea`; `useEnquadramentImatge.jsx` `82baf60f5cd2fde5f32b6d8c45755f1ad0abba939298fa4fb211f69e83520b06`; registre `5cdea812435a9a1ec20d899a038631e3d901f9a2f87352ae6b7e16e060654c4b`. Revisió de codi i tests existents, sense afirmar una nova conversió real de fotografia al navegador.

La revisió de recursos no detecta un nou leak de workspace/lector: neteja de keydown, subscripcions, Web Lock i BroadcastChannel present; comptadors sense nous efectes. Però `src/apps/lector` encara munta `ClosaAplicacio` sense import/ús d'`UniversalWorkspace`; Codex no valida la integració arquitectònica com a acabada. Estos límits són del tall inspeccionat i cal reverificar-los quan Claude publique el seu relleu.

### Relleu en curs · 01:28 · tercera CI completa

La revisió final dels avatars ja està resolta: **140/140** als cinc fitxers, ESLint i diff-check verds. Quatre casos rojos abans del pegat ara passen (número, objecte, referència opaca i fotografia personal amb text de marca); dos controls de marca real PNG/SVG passen també. `targetaDeProducte.js` final: `ef0cb4e44bf45a83a5f714fa9e567fd34b84ecd4bafad99526379bd72409a2d5`. S'alliberen les reserves de codi. **Tercera CI completa iniciada a les 01:28:43:** l'etapa Node ja acaba amb 951 totals, 946 passades, 0 fallades, 1 skip i 4 TODO; Vitest continua. Les línies ✖ dels quatre diagnòstics TODO no són quatre fallades noves. Hi ha quatre fonts de pujada/proves canviades entre l'inici global i la captura d'inici Vitest; cap CI estable declarada. Comparació de fonts abans/després a `/tmp/sdp-gauntlet-codex-third-ci-before.json` i log `/tmp/sdp-gauntlet-codex-ci-third.log`. Els resultats dels apartats següents són els talls previs, no el resultat d'esta CI encara en curs.

### Veredicte focal · tercera iteració · 01:25, ampliat a les 01:27

**Els defectes reproduïts en l'abast Codex estan corregits; no s'aprova globalment el Gauntlet.** Les dues fallades base, el focus/RAF i els dos camins del xat ja tenen regressions verdes. L'estrés final passa **8/8 fins a 40.000 fluxos simulats**; l'auditoria independent del tractor WebP, **10/10**. Les xifres, hashes i límits de cada passada es conserven més avall. La CI completa continua registrada com a roja: 4 fallades, amb posterior reverificació dels tres fitxers afectats **56/56**; no s'ha executat una altra CI completa sobre una instantània estable conjunta.

**Tercera iteració, resposta al Relleu 4 de Gemini:** reproduïdes les 15 fallades en un tall estable (116/131). Després del pegat, els cinc fitxers donen **134/134** a les 01:21:12, incloent tres casos nous. Dotze expectatives conservaven el nom curt antic; dues de cerca assumien que el cognom no era públic o que la sessió i el catàleg eren la mateixa identitat. S'han actualitzat segons el nou mandat mantenint IDs, rols, avatars i enllaços exactes. La fallada restant detectava una dada incorrecta: `imageSrc` del Mac Mini queia a l'avatar personal per falta d'`image_url`; ara apunta explícitament a la fotografia existent del producte. Les superfícies que ja prioritzaven `images[0]` estaven protegides: no s'ha demostrat una fotografia errònia visible.

S'ha corregit també el reconeixement per nom introduït en `targetaDeProducte.js`: ara usa `autoriaSeed`, amb id/àlies i prioritat d'entitat. Les regressions exigixen que dos homònims amb un altre ID conserven nom, foto o silueta i perfil propis, i que una entitat signant tinga prioritat sobre la persona autora. No s'ha modificat el port de backend. S'han retirat els tres àlies antics de `PERSONA_PILOT`, actualitzat les dues fixtures de capçalera i netejat el comentari històric de multimèdia. Capçaleres/seedSQL: **19/19**; perfils locals/Mercat del mas: **31/31**. ESLint i diff-check dels fitxers editats, Frontissa i frontera Sollutia passen. Estes bateries se solapen amb les anteriors: no se sumen com un únic total.

Evidència: `/tmp/sdp-codex-autoria-fivefiles-fixed.log`, `/tmp/sdp-identitats-capcalera-recheck.log`, `/tmp/sdp-gauntlet-codex-mas-iteration3.log`. Fonts estables durant la validació focal (mapejador actualitzat després amb la guarda d'avatars, 140/140 a les 01:27):

| Fitxer | SHA-256 |
| --- | --- |
| `identitatsSeed.js` | `2796d0f5e9101854c9be3570c5e2ae2ac8eb46a10de0b9d92c41a042d24d8fed` |
| `marketSeed.js` | `a7d17cf5e86dea000f4d06e61f892a021f1400e4e1c912b534b566f133935973` |
| `targetaDeProducte.js` | `ef0cb4e44bf45a83a5f714fa9e567fd34b84ecd4bafad99526379bd72409a2d5` |
| `agentsSeed.js` (Claude) | `90c4e2c1edcb2ba3efae56f366996760bfcf29e3fd30ccb06a9291426748734b` |

La cerca local d'antics noms/àlies en `src`, `tests`, `supabase`, `scripts`, `wordpress-plugin/includes` i `tooling`, excloent `wikiManifest.js`, no retorna coincidències. No s'ha consultat ni alterat una base de dades remota, i això no acredita erradicació en producció, arxiu històric o bundles generats. **Reserves de Codex alliberades**: Claude pot continuar producte mantenint estos oracles. Els apartats cronològics següents són històrics i no substituïxen este veredicte.

### Reserva històrica de tercera iteració · 01:18 · completada


Codex reproduïx les 15 fallades del Relleu 4 en una bateria estable (116 passen, 15 fallen). **Reserve els cinc fitxers de proves citats per Gemini** (`MercatSection.autoria`, `identitatsSeed.autoria`, `TargetaDelMur.autoria`, `xat.test`, `indexCerca.fundacionals`) per adaptar expectatives al nom canònic, mantenint identitat/rol/autoria. **Reserve també `marketSeed.js` i `targetaDeProducte.js` per a un pegat mínim:** la imatge del Mac Mini cau realment a l'avatar perquè no té `image_url`; el reconeixement de persona per nom pot atribuir la foto de Javi a un homònim. Cal id/àlies explícit, no coincidència de nom. Claude, eviteu reescriure estos fitxers durant esta reparació acotada; el lector i la resta d'imatges continuen al vostre front. No s'ha alterat res encara en publicar esta reserva.

Reserva complementària per acabar els quatre residus enumerats per Gemini: `identitatsSeed.js`, `ItemDetailSection.capcalera.test.jsx`, `PublicacioDetall.capcalera.test.jsx` i el comentari de `seedSql.multimedia.test.js`. S'eliminaran els àlies retirats, conservant els canònics; el mapejador usarà `autoriaSeed`, amb prioritat d'entitat i sense casament per nom. El defecte del Mac és del camp `imageSrc`: les targetes que prioritzen `images[0]` ja es protegixen, i no s'ha demostrat una fotografia visible incorrecta.

### Addenda històrica · 01:16 · resolta en la tercera iteració

Rellegits íntegrament Relleu 4 de Gemini i pla actualitzat: el pla ja explicita EXIF preservat per defecte i opt-out triat per l'usuari, superant la interpretació anterior de Gemini. S'ha verificat també que LEDGER ja inclou el torn Codex. **El tall final de les 01:13 queda ampliat amb una comprovació focal nova:** Gemini reporta 15 fallades en cinc fitxers d'autoria/xat/cerca després del canvi de nom i avatar. Codex els està contrastant ara sobre hashes actuals, sense CI completa nova i sense sobreescriure producte de Claude. No es declara la totalitat de les regressions resolta fins a este contrast.

El darrer `tancament --check` dona 458 incidències: 453 del graf, scope documental amb codi, hash del pla canviat, dos camps pendents del registre del pla (Model IA/Tokens) i escriptura concurrent. La falta de relleu LEDGER ha desaparegut. Set portes passen i SCC falla; evidència `/tmp/sdp-gauntlet-codex-closure-after-plan-change.json`. No es torna a vincular retroactivament el pla per amagar el canvi.

### Veredicte històric de l'auditoria Codex · tall 01:13

**Correccions del Bloc 4 verificades; cap aprovació global del Gauntlet.** Codex ha reparat les dues fallades base, la resolució de portades opaques, el focus/RAF, l'ACK invàlid i la pèrdua de propietari en la baixa del xat; ha refutat el tractor de Gemini i verificat les seues reparacions. Les ampliacions posteriors de Claude tenen les comprovacions focals detallades més avall. Els apartats datats següents són un historial de relleus: les reserves, hashes i estats antics no substituïxen el veredicte actual de les 01:25.

**Segona CI completa acabada, exit 1:** Node=0, Vitest=1. Node: **941 passades, 0 fallades, 1 saltada i 4 TODO, de 946**. Vitest: **17.758 passades, 4 fallades i 89 saltades, de 17.851**; **1.034 fitxers verds, 3 rojos i 6 saltats, de 1.043**. Durada Vitest 1.738,37 s, inici 00:42:41. Les quatre fallades són: lint de `DocumentEditor.jsx` durant retirada de la targeta viva (cinc identificadors intermedis sense declarar); ANIMAL a `indexCerca.test.js`; ANIMAL i àlies a `localPerfils.test.js`. No són les dues fallades base originals, que ja passen.

**Repetició conjunta dels tres fitxers fallits a les 01:12:30: 56/56 passen, exit 0**, després d'ajustar els dos noms antics de perfils locals. Evidència `/tmp/sdp-gauntlet-codex-post-ci-focal.log`. El resum complet de CI queda a `/tmp/sdp-gauntlet-codex-ci-final.log`; no es reetiqueta la CI roja com a verda. Entre la captura inicial i el tall posterior hi ha **42 rutes de les 2.413 vigilades amb hash diferent**. L'inventari complementari conté fitxers fora de la captura inicial, inclosos artefactes generats: això no prova que siguen nous. Durant la comprovació posterior s'ha detectat una altra escriptura a `UniversalWorkspace.jsx` (nou hash `96c7ca8d6afe1c6e200f42edefd6152c2b33e9522fdf7bd3ac25cc6a9621f112`). Per tant, **encara falta una CI conjunta sobre un tall estable de Claude/Gemini/Codex**; les reverificacions focals no certifiquen tota l'última instantània.

**Relleu pendent als Blocs 0–3:** lector i resta de canvis de producte continuen amb Claude. A les 01:12, el registre encara genera `tpv_vinyeta.jpg`; `useEnquadramentImatge` encara declara capçalera 16:9 i mida quadrada 600; `compressImage` recodifica sense EXIF. El tractor WebP correcte no resol per si mateix estes diferències amb el mandat de quadrat 1200, avatar 400 i EXIF íntegre. No es certifica conformitat universal d'imatges ni se substituïx el mandat humà per una decisió d'un agent.

**Tancament de la ronda pròpia:** tots els processos de prova de Codex recollits; subagents sense processos pendents. Cap cron creat; quatre automatitzacions Codex preexistents PAUSED. Cap procés de Claude/Gemini interromput ni cap afirmació sobre crons d'altres aplicacions. Documents i ESTAT actualitzats; el tancament administratiu continua no vàlid pels motius de la secció Verificació. No hi ha commit, release ni desplegament de Codex.

**Lectura històrica de context (01:28), substituïda pels relleus posteriors:** tots els Markdown de primer nivell de l'Escriptori s'han llegit íntegrament; rellegits els que han canviat. El pla actual (mtime 01:18:59, SHA `7690d33da82b80c1c652d651e853fc656bed375aa21faee82efb8b62f4cdf8ff`) ja emplena Model IA/Tokens i imposa EXIF preservat per defecte, amb opt-out explícit. Relleu 4 de Gemini contrastat i resolt en l'abast local indicat. Rellegit íntegrament el Relleu 5 (SHA `e61356a95a468216576ca936298ea5bd32a3370edef972546aa1a1b690417c5b`): reconeix la reparació d'autoria i la vinculació renovada del pla feta per Gemini. Les xifres de les seues bateries són evidència de Gemini; Codex conserva les seues eixides exactes. L'afirmació d'erradicació global no s'estén a DB/producció i la resolució antiga d'EXIF reproduïda al mateix informe queda superada pel pla actual. Claude conserva el Relleu 2 llegit (SHA `2211afe4f23969b04c3f92c3dfac22cb2151220d436178cfc999526999b12eb4`). LEDGER ja inclou el torn Codex. No s'ha verificat una base de dades ni producció.

**Millores tècniques de la plantilla:** obrir el torn amb scope de codi quan s'autoritzen reparacions; acordar un tall de fitxers estable per a la CI d'integració, després de les bateries focals de cada agent; distingir nombre de fluxos, sessions, mida del dataset, procés i transport; declarar qui aplica els reintents i la idempotència; fixar `<80.000 bytes` en lloc d'una unitat KB ambigua; conservar hashes/oracles abans i després; no convertir EXIF verificat al tractor en conformitat de tota la pujada, ni text de fallback en FCP/CLS mesurat; permetre «no observat» per a emocions i «no disponible» per a tokens. Un informe ha de separar la reproducció roja històrica del resultat després del pegat.

### Perfils locals reparats · 01:10

Els dos literals antics s'han adaptat al nom complet de la font única: `localPerfils.test.js` passa ara **27/27**, inclosos ANIMAL i àlies, i ESLint passa. Es mantenen intactes els oracles de propietat, tipus, id i rol. Evidència `/tmp/sdp-gauntlet-codex-localperfils-final.log`. L'adaptador i les llavors continuen sent el treball de Claude; Codex només ha corregit estes dues expectatives i el comentari.

### Reserva curta · 01:09 · prova de perfils locals

La CI ha registrat dos casos nous d'ANIMAL/àlies en `localPerfils.test.js`; en la repetició actual eixos dos **passen**. La bateria focal estable dona 25/27: fallen ara dues expectatives antigues de nom `Javi`, perquè la font única de Claude torna `Javi Llinares` (línies 85 i 269). **Codex reserva només `src/data/localPerfils.test.js` per adaptar estos dos literals**, preservant les exigències d'id, origen i rol; no es modifica el model ni la llavor de Claude. Hash abans del test: `5c3877991721a16a4d55bfbf0c449860d016282b8f68a8be5d43a48b7ced580d`.

### Reverificació de la segona incidència de CI · 01:06

La CI llarga ha registrat també el test nou d'ANIMAL a `indexCerca.test.js`. Una execució focal posterior, sense editar res, dona **25/25**, amb hashes estables de `indexCerca.js` (`92573689b6ecba480f224f1b7a6d7ae0b31a30929322edf1087fc9e8a1016f38`), prova (`996a1d6a4129d7961a6b34fe764cc4cb65fd7b037379eb6beefd0bdf650be7e3`) i `agentsSeed.js` (`90c4e2c1edcb2ba3efae56f366996760bfcf29e3fd30ccb06a9291426748734b`). La traducció central actual tracta ANIMAL/AI com `ia`, incloses minúscules. No es reproduïx una fallada en el tall actual. Els fitxers es van editar a les 00:53:33 / 00:58:49 / 01:00:16, després d'iniciar la CI: és compatible amb mòduls carregats abans del pegat, sense atribuir una causa històrica exacta no observada. El lint del front s'ha reverificat de nou a les 01:03: **4/4**.

### Tall de reverificació · 01:03

**Ampliacions de Claude verificades:** xat 318/318 (204 de xat/context/SDK i 114 de conformitat), més dos probes focalitzats; estrés complet repetit **8/8** amb SHA de l'adaptador estable `5c977cbb81ce3e8f3fca74b759be4bc0838685f98e1fd138925b0f4b1ed85b6e`. El segon intent automàtic és acotat, compartit i no toca canals aliens; si també falla, conserva propietari per al reintent explícit. Açò substituïx la limitació històrica «sense reintent automàtic» del pegat original de Codex. Es prova alliberament local amb SDK real i resposta injectada, no un ACK de baixa del servidor.

**Workspace:** la bateria ampliada va donar 268/274; els 99 casos anteriors passaren. Cinc fallades noves eren noms accessibles concatenats en una versió intermèdia, corregida després per Claude. Reverificació de la nova versió: recompte 15/15 i lifecycle 7/7. La sisena era el selector estàtic obsolet de `NavGlyph.mida.test.js`, adaptat per Codex i verificat **4/4**, ESLint verd. SHA estable del component en la reverificació: `73e9fd1aee8f326a655e0a3aba205423ce0c11ef030a1cdf0d7dccb139765479`; recompte test `2e86a6d59a52ef21ef627cc42935cd567f68239f0b94bb658a756ae4cba89ad2`. Sense nous listeners, efectes o temporitzadors en el recompte. No se sumen estes passades solapades com proves diferents.

Última càrrega completa, amb els set fitxers vigilats estables abans/després:

| Fluxos | Duració ms | p95 ms | p99 ms | Heap després de GC MiB |
| --- | ---: | ---: | ---: | ---: |
| 1.000 | 361,47 | 349,59 | 350,30 | 51,80 |
| 5.000 | 2.187,72 | 2.140,27 | 2.147,05 | 51,90 |
| 10.000 | 3.266,28 | 3.192,24 | 3.199,35 | 51,91 |
| 40.000 | 15.543,37 | 15.425,55 | 15.463,50 | 51,95 |

A 40.000: 400.800 peticions simulades, 400 errors 503 injectats, zero errors finals, zero peticions pendents, pic mostrejat de heap 870,38 MiB i RSS 783,34 MiB. 40.000 subscripcions → zero restants. Zero intents de xarxa. Les passades coexistiren amb altres suites; no s’ha aïllat la causa de la diferència de durada, i no atribuïm una regressió o millora de rendiment al pegat. Evidència completa: `/tmp/sdp-gauntlet-codex-stress-cohort-final.json`, `.log` i `.cohort.json`.

### Regressió de prova · 01:02 · reserva curta de Codex

L'ampliació del comptador canvia el nom accessible del rail de `category.label` a `nom`, mantenint `NavGlyph size={20}`. `NavGlyph.mida.test.js:103` busca l'expressió antiga amb una regex i falla amb `null`; **Codex reserva només esta prova per adaptar el selector**, conservant totes les exigències de mida i tokens. La bateria workspace ha mantingut verds els 99 casos anteriors; els cinc errors de nom concatenat en les proves noves corresponen a una versió que Claude ja ha canviat. S'està reverificant el nou marcatge, sense tocar `UniversalWorkspace.jsx` des de Codex.

### Coordinació · 00:58 · ampliacions de Claude detectades

Claude ha ampliat `UniversalWorkspace.jsx` amb recompte de no llegits i `xat.js` amb un segon intent acotat de baixa. **Els hashes anteriors d'estos dos fitxers ja no són el tall actual.** Codex els està reverificant de només lectura: es conserva el pegat de focus i l'ACK estricte, i es repetix la bateria d'estrés sobre el nou adaptador. La prova `UniversalWorkspace.recompte.test.jsx` encara era una captura provisional amb error deliberat en llegir-la; no es confon amb una regressió de producte ni es modifica treball en curs de Claude. Les reserves històriques següents expliquen qui va aplicar els pegats originals; no bloquegen l'ampliació coordinada del Lector.

### Tall verificat · 00:57 · relleu a Claude i Gemini

**Tractor WebP: 10/10 probes adversarials passen sobre SHA-256 `c7ec0f10f7b2d886c0c7dce7f0d386a65899f593eae46cd32ea2a9aa61c31842`, idèntic abans i després.** El harness permanent ara exigix KB decimals: un WebP vàlid de 80.000 bytes exactes, injectat com a eixida de l'encoder, es rebutja amb límit 79.999 i conserva original/destí. El recurs públic pesa 77.746 bytes. EXIF, dimensions, orientació i atomicitat continuen verds. Evidència: `/tmp/sdp-webp-codex-regressions-post-fix2.json`. Les alertes anteriors de pressupost i pèrdua queden resoltes en els casos auditats. P3 documental per a Gemini: el comentari encara diu `maxKb * 1024` i les dues assercions antigues comparen amb `80*1024`/`40*1024`; el comportament real sí és decimal estricte.

**WordPress: 36/36 Node i 30/30 Vitest passen**, incloent PHP i `wptexturize` reals amb control negatiu, sense omissions. El text exacte `Carregant el mur...` conserva els tres punts ASCII. SHA de `marcatge.php` estable `20ddc9f10b88f1441dd10731dd7cd24d375f6c20bbd05f23303e9d5fba9bc4cc`. P3: el comentari de les línies 289–294 generalitza la substitució del fallback davant errors; després de l'adopció el carregador només informa a consola, i el Shadow DOM tancat oculta el light DOM. No s'han mesurat FCP ni CLS.

Llegit íntegrament el Relleu 3 de Gemini. La seua decisió de limitar EXIF íntegre al tractor i mantindre la recodificació del navegador sense EXIF és una **interpretació de Gemini**, no una excepció aprovada pel Mestre al text «tota foto». Codex certifica la preservació del tractor en els casos indicats, però **no declara conforme tota la canonada de pujada**, ni resolta la norma universal d'avatars/capçaleres. Claude/Gemini han de reconciliar estes diferències amb el mandat humà. El registre del TPV encara requeria integrar el WebP en l'últim tall inspeccionat.

La segona CI completa continua en execució sobre arbre concurrent. Ha registrat una fallada de lint del front durant edicions de `DocumentEditor.jsx`; la repetició posterior del mateix fitxer de proves dona **4/4**, sense tocar la prova. S'espera el resultat final de la CI, sense confondre'l amb eixa reverificació focal.

### Avís històric · 00:44 · substituït pels talls posteriors

**Claude: el vostre Relleu 2 encara assigna E/F als tres P2, però Codex JA ELS HA REPARAT I VERIFICAT. No reescriviu eixos pegats.** La reserva de segona iteració consta més avall (00:39) i els resultats (00:41/00:43). `UniversalWorkspace.jsx` SHA-256 `3530a2e3d355c44a95a9afb6d92a914f1293adf5ec2180622ef2106f9f8ace33`, `xat.js` SHA-256 `6e6ab7de00d72fd4de776fbb648394c773ee8da753c3d7ac707b475371faf007`. Focus 99/99; xat/conformitat/probes 227/227; estrés final 8/8. Podeu auditar-los i continuar el Lector després del pegat F ja present. No hi ha cap procés Codex editant ara src: només CI global en execució.

**Gemini:** l'auditoria adversarial del vostre tractor ha reproduït tres defectes (truncament, pèrdua d'EXIF PNG i pressupost), amb evidència més avall. El nou hash `1b1518b3…` ja està en revisió; no es confon el verd de les dues proves originals amb cobertura dels errors. Inventari Node corregit i verificat. La segona passada Node completa ja dona **941 passades, zero fallades, 1 saltada i 4 TODO (946 totals)**.

La contradicció EXIF detectada per Claude requerix reconciliació entre implementació i text públic: el mandat humà vigent exigix preservació, i les promeses anteriors d'esborrat no poden continuar contradient el comportament. Codex no ha convertit ni publicat cap fotografia real. Esta nota no certifica el tractament ni la publicació d'eixes fotografies.

### Progrés i coordinació · 2026-10-16 00:22 Europe/Madrid

**Auditoria en curs, cap aprovació global emesa.** Codex executa el Bloc 4. El pla canònic està vinculat al torn i l'ordre humana d'este xat preval sobre la casella «pendent» del registre del pla.

**Reserva de treball de Codex:** les proves `src/sections/text/paginaDeText.test.js` i `src/sections/notes/PublicacioDetall.imatgesPropies.test.jsx`; un harness nou `tests/gauntlet-codex*` per a càrrega local; auditoria de només lectura d'AppGridShell, UniversalWorkspace i dependències. Els canvis de producte del lector, imatges, perfil i WordPress continuen al front executor de Claude. Cap commit ni desplegament.

Les dues fallades de Vitest ja s'han reproduït de manera focalitzada. El harness provarà 1.000, 5.000, 10.000 i 40.000 fluxos virtuals del client amb transport simulat, amb oracles d'error i concurrència; no equival a navegadors independents ni certifica capacitat de Supabase/Sollutia.

### Relleu a Claude i Gemini · 2026-10-16 00:24 Europe/Madrid

Llegits íntegrament els dos informes nous `261016_0022_auditoria_claude.md` i `261016_0022_auditoria_gemini4.md`: encara són plantilles, no evidència de resultats. **Codex amplia la reserva a `src/components/universal/PageFrame.jsx`, la seua prova nova de portades i `tests/enxufe-empaqueta.test.mjs` / `tests/standalone-build.test.mjs`.** Eviteu editar estos fitxers simultàniament.

**Defecte funcional confirmat:** PageFrame passa la portada `sdp-media://` al resolutor estàtic i genera `/sdp-media://…`; les proves de regressió fallen abans del pegat. La correcció en curs usa `useResolvedAssetState` i el port neutral existent.

**Node inicial:** 944 proves, 934 passades, 5 fallades, 1 saltada i 4 TODO de diagnòstic. Les cinc fallades són d'empaquetat: fixtures que encara intenten reemplaçar una clau pública buida quan el plugin ja té clau, i expectatives amb els noms antics dels ZIP. Codex adapta únicament estes proves al contracte vigent, conservant verificació criptogràfica, rebuig de claus discordants i verificació dels bytes dels tres paquets. No es modifica l'empaquetador ni es genera cap release real.

### Defecte P2 per a Claude · focus diferit de UniversalWorkspace

**Acció requerida al front executor:** `src/components/universal/workspace/UniversalWorkspace.jsx:350–357`, `focusAfterLayout`, i crida a `chooseItem:1217–1221`. En mòbil, tornar a la llista, seleccionar una nota i donar focus a l'editor abans de completar els dos `requestAnimationFrame` provoca que el focus diferit torne al div de detall i el lleve de l'editor. Els RAF tampoc es cancel·len al desmuntatge. Reproduït amb component real en `tests/gauntlet-codex-lifecycle.test.jsx`; els casos marcats `[DEFECTE]` observen el problema i **no són aprovació de salut**. Proposta mínima: cancel·lar frames pendents i no substituir un focus que ja està dins del detall.

No hi ha evidència de leak indefinit en estos dos RAF: s'esgoten després de dos frames. Sí que passa la refutació de 100 cicles muntatge/desmuntatge en StrictMode, amb zero ResizeObservers residuals; WorkspaceProvider avorta resolucions antigues i ignora resultats tardans. No es certifica encara memòria d'una sessió de navegador prolongada.

**Avanç verificat:** les dues fallades Vitest conegudes i la portada opaca passen 73/73 casos focalitzats. L'empaquetat passa 50/50 casos, inclosos builds reals en directoris temporals. S'inicia comprovació CI completa.

### Defecte P2 per a Claude · confirmació invàlida del xat

**Acció requerida al front executor:** `src/data/supabase/xat.js:372–381`. `enviaMissatge` rebutja només `seq` nul o absent; una confirmació `{ id: 'm-bad', seq: 'invalid' }` torna `seq: NaN`. `XatContext.jsx:1073–1080` tracta la promesa resolta com a èxit i retira el pendent; el DTO ja no té un número de seqüència vàlid. És un defecte de validació davant resposta malformada, no una incidència observada del servidor real. Proposta: exigir seqüència numèrica finita, enter segur i positiva, i fallar amb `SENSE_CONFIRMACIO` reintentable conservant l'id idempotent.

Reproducció roja abans del pegat (ara ha de passar): `node --expose-gc node_modules/vitest/vitest.mjs run --config tests/gauntlet-codex.config.mjs -t 'invalid chat confirmations'`. El harness opt-in complet queda en `tests/gauntlet-codex-concurrency.stress.mjs`; no entra a la CI ordinària.

### Estrés local complet · primera passada

### Defecte P2 per a Claude · baixa fallida del canal perd el propietari

**Acció requerida al front executor:** `src/data/supabase/xat.js:329–338`. L'adaptador lleva `channelOwners` abans de completar `removeChannel` i ignora el seu resultat. Amb el client real instal·lat `@supabase/realtime-js` i una resposta de baixa `'error'` injectada, el canal queda retingut, la primera baixa retorna èxit i la segona ja no té propietari per reintentar. Resultat: 1 intent, 1 canal restant, cap error exposat. El cas `'timed out'` inicial es va refutar perquè Phoenix també tanca el canal; **la troballa és només el camí `'error'` comprovat**. No s'ha obert cap WebSocket.

Reproducció roja abans del pegat (ara ha de passar): `node --expose-gc node_modules/vitest/vitest.mjs run --config tests/gauntlet-codex.config.mjs -t 'does not lose the owner'`. Proposta: conservar el propietari fins a tancament efectiu; comunicar la fallada i assegurar alliberament local acotat en el desmuntatge. No cridar `removeAllChannels` del client compartit, que podria afectar subscripcions alienes. La prova neteja el seu client aïllat en `finally`.

### Resultats de càrrega

**Relleu 00:31 Europe/Madrid:** llegit sencer el nou informe de Gemini (modificació 22:28:30Z). Codex assumix també la refutació i correcció T-G4-05: **reserva ampliada a `UniversalPage.jsx`, `PageFrame.jsx` i proves de portada plegable**. Els P2 de focus, ACK i baixa continuen assignats al front executor de Claude, amb reproduccions disponibles. Node final torna codi 0: 944 proves, 939 passades, zero fallades, 1 saltada i 4 TODO heretats. La CI global encara executa Vitest; no es declara verda.

La baixa amb `'error'` és un assaig de robustesa contractual amb fallada injectada; **no és una fuga que s'haja observat espontàniament en el SDK**. L'oracle de l'ACK ja exigix exactament `{ code: 'SENSE_CONFIRMACIO', retriable: true }`.

Executats 1.000 / 5.000 / 10.000 / 40.000 fluxos virtuals concurrents: cada flux envia i llig xat, pagina sis notes, cerca «muntanya» amb el filtre real i pagina tres publicacions del mur. Adaptadors reals, una sessió fixture compartida i transport simulat. La passada completa amb el cas del SDK real, registrada a `2026-10-15T22:27:24.989Z`, dona:

| Fluxos | Duració ms | p95 ms | p99 ms | Peticions simulades | 503 injectats | Heap després de GC MiB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1.000 | 163,07 | 158,57 | 160,04 | 10.020 | 10 | 51,68 |
| 5.000 | 702,74 | 690,52 | 692,15 | 50.100 | 50 | 51,76 |
| 10.000 | 1.241,80 | 1.226,80 | 1.230,14 | 100.200 | 100 | 51,78 |
| 40.000 | 4.983,75 | 4.923,86 | 4.944,01 | 400.800 | 400 | 51,83 |

Zero errors dels oracles normals i zero peticions pendents al final en els quatre nivells. Els 503 els recupera el reintent **del harness**: no acredita la política de reintents de la UI. La idempotència de l'emmagatzematge és simulada: no acredita constraints ni RLS de la base de dades. Estos temps són del procés local, no latències de xarxa real. A 40.000, el pic de peticions en vol és 158.800 pel fan-out dels adaptadors; el pic mostrat de heap és 850,43 MiB i el RSS, 925,47 MiB.

40.000 subscripcions simulades donades de baixa en el camí normal: zero canals retinguts. Cursors repetits rebutjats en notes i mur; avortament previ no envia RPC; **zero intents de fetch extern**. Bateria opt-in: **6 passen i 2 fallen**, ACK invàlid i baixa `'error'` injectada. El comportament estable després de buidar fixtures i forçar GC no certifica una sessió prolongada de navegador ni 40.000 sessions remotes.

### Relleu 00:34 · portada plegable i governança

T-G4-05 de Gemini confirmada i corregida: `UniversalPage.PortadaPlegable` reutilitza ara `ImatgeDePortada`, exportada de `PageFrame`, sense nou fitxer ni dependència circular. Dues regressions roges abans del pegat i verdes després; plegat conservat. Bateria focal de quatre fitxers: **88/88**, ESLint i `git diff --check` passen. No es modifica el port neutral ni cap adaptador Sollutia.

**Actualització dels oracles de cicle de vida:** les dues reproduccions que observaven el defecte s'han convertit en regressions que exigixen el comportament correcte. `tests/gauntlet-codex-lifecycle.test.jsx` dona ara **2 passades / 2 fallades** (focus preservat i RAF cancel·lats pendents del pegat de Claude). Els altres dos casos continuen verds. AppGridShell real es munta dins de WorkspaceFrame: l'observer comptat en els 100 cicles és el seu, no un mock del component. El silenci llarg de Vitest s'ha explicat amb el reporter `agent` automàtic, que mostra només mòduls fallits; els workers continuen avançant.

La comprovació `tancament --check` inicial és **no vàlida**: 457 incidències (453 del graf, scope documental amb codi, relleus ESTAT/LEDGER pendents i segell divergent). Olivera, plantilles, autoritat, ledger, skills i wiki passen; segell i SCC fallen. **Gemini/MarIA, que ha assumit governança, ha d'incloure el torn `torn_5b62e0c4-ed6d-49f1-8a29-ff692698d9f1` al relleu de LEDGER; Codex afegirà el seu bloc factual a ESTAT.** No es canvia l'abast retroactivament ni es proclama un tancament verd.

### Relleu 00:38 · alerta d'inventari per a Gemini

El tractor i les dues proves de `tests/convertir-a-webp.test.mjs` ja són al disc; la prova focal passa, però el test nou **encara no està classificat a `tooling/tests/node-suite-manifest.json`**. La validació de l'inventari retorna `Proves sense classificar: tests/convertir-a-webp.test.mjs` i una nova entrada a `test:ci` no pot arrancar. Gemini, incloeu-lo en la suite que corresponga abans de declarar verd. La Node verda de Codex és anterior a esta creació. L'auditoria adversarial del tractor continua amb imatges sintètiques; cap original real tocat. ESTAT Codex ja actualitzat i acta `261016_0035_acta_marmota_codex_gauntlet.md` creada i vàlida.

### Reserva de segona iteració · 00:39

**Codex assumix ara els pegats delimitats dels P2 que ha reproduït**, perquè la bateria pròpia no quede roja esperant el relleu. El disc encara no té canvis de Claude en eixos dos fitxers. **Reserve `src/components/universal/workspace/UniversalWorkspace.jsx` i `src/data/supabase/xat.js`, amb les proves corresponents. Claude: deixeu estos dos pegats a Codex i continueu els Blocs 0–3.** Abans d'escriure, es comprovarà que no haja canviat la versió llegida; si apareix treball simultani, es conservarà i s'auditarà. No hi ha ampliació al backendPort ni al transport Sollutia.

La CI llarga ha acabat: Node=1 (fallada intermèdia de la prova amb innerHTML, ja eliminada i Node final verd); Vitest=1, **17.719 passades, 2 fallades i 89 saltades** en 1.043 fitxers, 726,87 s. Les dues fallades globals són les noves regressions de portada plegable, carregades mentre es reproduïa el defecte abans del pegat; el lot focal després del pegat passa 88/88. Esta execució amb escriptures simultànies no certifica una instantània final; la segona iteració verificarà els fitxers canviats i els oracles pendents.

### Alerta adversarial del tractor WebP · 00:39 · per a Gemini

**No considerar el tractor apte per a conversió massiva encara.** Auditoria amb originals exclusivament sintètics, hash `d8714ea655a67e898ea4333daefb851962bb6ee61f6890b0cea8dc93ad161d36` de `tooling/maquinaria/convertir_a_webp.mjs`. Les dues proves existents passen, però s'han reproduït:

1. **P1 · pèrdua de l'original davant error d'escriptura.** Línies 297–298, 310 i 322: l'encoder escriu directament al destí; per una entrada `.webp` sense destí explícit, origen i destí coincidixen. Fallada injectada després d'obrir l'eixida deixa l'original sintètic truncat a 7 bytes. Cal eixida temporal al mateix volum, validar-la sencera i substituir atòmicament només en èxit; conservar destí anterior/original si qualsevol etapa falla.
2. **P1 · EXIF perdut silenciosament en PNG.** PNG sintètic amb 294 bytes EXIF, orientació 6, GPS i data: torna èxit però `exifPreservat:false`, GPS/data nul·les i zero bytes EXIF a l'eixida. L'extractor només suporta JPEG/WebP mentre l'encoder accepta altres formats. També s'observa pèrdua de metadades en TIFF. Cal preservar els formats acceptats o rebutjar explícitament els no suportats abans d'escriure; no declarar conversió correcta amb pèrdua de patrimoni.
3. **P2 · pressupost no imposat.** EXIF de 90 KiB produïx WebP de **93.138 bytes** i torna èxit amb màxim 80 KiB; `maxKb:1` accepta 3.456 bytes. La reserva mínima de 8 KiB i l'absència de comprovació final deixen superar el límit. Si les metadades íntegres ja excedixen el pressupost, cal error explícit i original intacte. El límit exacte de la norma (<80 KB decimal o KiB) ha de ser inequívoc.
4. **Inventari CI:** el test nou continua sense classificació al manifest Node, com s'ha comunicat abans.

Positius verificats: JPEG amb orientació 6 conserva GPS, data, Make i MakerNote byte a byte excepte l'orientació normalitzada a 1; píxels orientats correctament, quadrat 1200×1200, avatar 400×400 i rutes amb espais correctes. Les fixtures s'han netejat. Evidència local: `/tmp/sdp-webp-codex-audit.json`; reproducció sintètica `/tmp/sdp-webp-codex-audit.mjs`. **Gemini conserva la propietat del tractor; Codex no l'ha modificat.**

### Segona iteració · focus reparat i inventari desbloquejat · 00:41

Codex ha corregit `UniversalWorkspace.jsx` amb un únic gestor de focus diferit per workspace: cancel·la RAF pendents en desmuntar o substituir la navegació, conserva el focus real de l'editor (també en Shadow DOM tancat) i manté el trasllat accessible des dels obridors de columna. **99/99 proves en huit fitxers**, incloses set regressions del gauntlet; ESLint verd. La primera versió del pegat impedia una navegació normal des de l'obridor: la prova existent ho va detectar i s'ha corregit abans d'aprovar. Hash del component: `3530a2e3d355c44a95a9afb6d92a914f1293adf5ec2180622ef2106f9f8ace33`.

Gemini ha afegit `tests/convertir-a-webp.test.mjs` a `primary` del manifest: **`run-node-tests.mjs --list` torna 0**. La incidència d'inventari queda resolta; les tres troballes del convertidor continuen pendents de pegat verificat. La dependència `python3` + Pillow amb suport WebP també necessita una provisió reproduïble: verificada localment, no acreditada a CI.

### Segona iteració · xat i estrés verds · 00:43

**Claude/Gemini: els tres P2 propis de Codex ja estan corregits per Codex; no dupliqueu els pegats.** `xat.js` ara accepta només `seq` enter segur positiu (number o text decimal), rebutja coercions de booleans/arrays/objectes i emet `SENSE_CONFIRMACIO` reintentable. Les baixes simultànies compartixen intent, conserven propietari fins a `'ok'` i exposen `CANAL_NO_TANCAT` reintentable amb causa. XatContext captura el rebuig tardà en desmuntar: prova específica verda. **No hi ha reintent automàtic nou a la UI**; el probe verifica que un reintent explícit pot completar la baixa sense perdre propietari.

Validació focal: 160/160 xat + XatContext, 65/65 adaptadors/conformitat i 2/2 probes adversarials. Hash del pegat de les 00:43 de `xat.js`: `6e6ab7de00d72fd4de776fbb648394c773ee8da753c3d7ac707b475371faf007`. Sense canvis al backendPort, al client compartit ni a les polítiques RLS.

**Estrés final complet: 8/8 passa**, després dels pegats, en 6,62 s. Els quatre nivells normals tornen zero errors/pendents; els dos casos abans rojos ara passen. En baixa injectada: 2 intents, zero canals restants, error inicial exposat. Zero xarxa externa.

| Fluxos | Duració ms | p95 ms | p99 ms | Heap després de GC MiB |
| --- | ---: | ---: | ---: | ---: |
| 1.000 | 113,35 | 110,96 | 111,28 | 51,68 |
| 5.000 | 478,09 | 468,41 | 469,90 | 51,77 |
| 10.000 | 1.017,30 | 1.004,25 | 1.006,38 | 51,80 |
| 40.000 | 4.025,80 | 3.983,85 | 3.994,98 | 51,84 |

Pic mostrat de heap 856,14 MiB, RSS 1.059,33 MiB a 40.000; 400.800 peticions simulades. Les diferències de temps entre passades no es presenten com a millora de rendiment: coexistiren amb altres proves, no s’ha aïllat la causa de la diferència i no és un benchmark controlat. Evidència final: `/tmp/sdp-gauntlet-codex-stress-final.json`. S'ha iniciat una **segona CI completa** amb captura prèvia de 2.413 hashes. El veredicte global continua pendent de CI i de les alertes del tractor de Gemini.

### Relleu 00:48 · tractor reparat; límit i integració de la vinyeta encara oberts

**Les tres fallades reproduïdes del tractor queden corregides en els casos auditats.** Harness permanent `node tests/gauntlet-codex-webp.audit.mjs`: **9/9 invariants passen**, SHA abans/després idèntic `9ddbb1e3e01cb2975a7dc9dee81dc0309f1d2eabfbe04a2a235852f2aceec61a`. JPEG/PNG conserven EXIF byte a byte excepte orientació; TIFF conserva GPS, data, Make i MakerNote; error d'encoder no trunca l'original; pressupostos impossibles es rebutgen sense tocar destins i no queden temporals. ESLint del harness passa. Evidència `/tmp/sdp-webp-codex-regressions-post-fix1.json`. El nou flag `--sense-exif-binari` no forma part d'esta certificació: s'ha comprovat la preservació per defecte.

**P2 · unitats i vinyeta:** el tractor imposa `maxKb * 1024`, és a dir **80 KiB**, mentre el prompt diu **<80 KB**. `tpv_vinyeta.webp` pesa **81.590 bytes**: són 79,68 KiB, però 81,59 KB decimals. Per satisfer inequívocament el mandat convé imposar menys de 80.000 bytes (i no descriure 81.590 com «<80 KB»). La verificació 9/9 acredita el pressupost configurat en KiB, no esta frontera decimal. Gemini conserva l'acció de correcció del tractor/recurs.

**Integració encara pendent del Bloc 1:** `src/sections/plugins/registrePlugins.js:143` continua construint `${IMATGES_PLUGINS}/${id}_vinyeta.jpg`, inclòs `id: 'tpv'`; crear el WebP no fa que l'app el carregue. Claude, alineeu el registre i les proves amb el recurs definitiu dins del vostre bloc d'imatges. Inspeccionats visualment JPG i WebP públics: el cambrer principal de la barra és gran, amb cabells blancs laterals, ulleres i nas prominent; no correspon a la descripció «cambrer jove» de l'ESTAT inicial. No es certifica absència de semblança a partir del canvi de hash, ni s'emet una conclusió jurídica.

Tancament posterior al segell de Gemini: set comprovadors passen (inclòs segell), SCC continua roig. **455 incidències: 453 del graf, codi fora de scope documental i relleu LEDGER Codex pendent.** ESTAT i els dos documents propis són presents; cap alteració retroactiva de l'abast.

**Lectura de context:** AGENTS, BOOTSTRAP, genotip, índex mestre, taxonomia, workflow, skill documental, core-direccio-autonoma; íntegres els quatre Markdown de primer nivell de l'Escriptori previs a este informe (índex, estudi de destil·lació, pla i prompt). ESTAT_ACTUAL llegit; l'històric acumulat d'ESTAT no s'ha assimilat íntegrament. No s'ha recorregut l'arxiu històric ni s'han alterat les zones protegides.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Àmbit | Evidència verificada |
| --- | --- |
| Portades opaques i text base | 88/88; regressions reproduïdes roges abans del pegat. |
| Empaquetat | 50/50, signatures i bytes verificats; només fixtures temporals. |
| Quarta CI completa | Exit 0. Node 946 passades, 0 fallades, 1 skip, 4 TODO (951); Vitest 17.919 passades, 0 fallades, 89 skip (18.008). Huit rutes modificades després de la captura inicial; no és un tall congelat. |
| Xat ampliat de Claude | 318/318, més 2 probes, sobre hash estable. |
| Focus i cicle de vida | 99/99 abans de l'ampliació; preservats en bateria ampliada; lifecycle 7/7 després. |
| Recompte de workspace | 15/15 en hash estable; mida de glifs 4/4 després d'adaptar selector. |
| Porta workspace del nucli 1.2 | Guardes/fronteres/semver 123/123; build real 74/74; muntatge interactiu del mòdul 2/2 amb 100 cicles. Lector encara pendent. |
| Imatges | Perfil/pressupost 109/109; segona onada existent 127/127. Controls Chromium 3/3, producte abans del pegat EXIF 0/3; amb opt-in nou 10/12 per WebP girat malament. Proposta temporal de retall 83/83 i 6/6 navegador, no aplicada. EXIF complex/gran i càmera sense GPS/data refutats. |
| Noves regressions d’interacció | Avatar divergent després de 403 i scroll del Lector reproduïts; diagnòstics fora del repo. No són proves verdes. |
| Estrés opt-in final | 8/8; quatre nivells de càrrega i quatre probes; zero xarxa externa. |
| Conversor WebP | 10/10 probes independents; Node conversor/inventari 13/13. |
| WordPress fallback | 36/36 Node amb PHP/wptexturize reals i 30/30 Vitest. |
| Tercera iteració autoria | 140/140 als cinc fitxers, incloses sis regressions/controls d’avatars addicionals; capçaleres 19/19; perfils/mas 31/31. |
| Qualitat | ESLint dels fitxers propis i `git diff --check` passen. Frontissa i frontera Sollutia passen. |
| Documents | Informe i acta vàlids amb `document.mjs check`; Olivera codi 0. |

Les bateries focals se solapen; no s'han sumat com un recompte únic. La comparació de hashes de la CI completa i el seu resultat final consten en el veredicte inicial.

Reproducció des de `socdepoble.org/`:

```sh
npm run test:ci
SDP_GAUNTLET_REPORT=/tmp/sdp-gauntlet-repeat.json node --expose-gc node_modules/vitest/vitest.mjs run --config tests/gauntlet-codex.config.mjs
node node_modules/vitest/vitest.mjs run tests/gauntlet-codex-lifecycle.test.jsx
node tests/gauntlet-codex-webp.audit.mjs
node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261016_0021_auditoria_codex.md
node tooling/gates/tancament.mjs --check --turn-id torn_5b62e0c4-ed6d-49f1-8a29-ff692698d9f1
```

Els informes `/tmp` són evidència local temporal; les xifres, hashes i límits essencials queden incorporats a este document. El harness WebP requerix Python 3 i Pillow amb suport WebP; la disponibilitat local està comprovada, però no s'ha aprovisionat un runner CI extern. No silenciem la dependència amb un skip.

Últim tancament comprovat a les 02:29: `valid:false`, estat `planned`, **455 incidències**: 453 del graf heretat, canvis de codi fora de l’abast documental i pla modificat de nou durant l’ampliació d’Onada 1.1. Set portes verdes (Olivera, plantilles, autoritat, ledger, segell, skills, wiki); SCC roig. Evidència `/tmp/sdp-gauntlet-codex-closure-0229.json`. La vinculació anterior de Gemini havia resolt l’alerta de pla, però el contingut ha tornat a canviar. Codex no canvia retroactivament el scope ni el hash vinculat per simular tancament.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

**Incidència de diagnòstic (01:44):** una lectura de processos amb `ps` va retornar inesperadament arguments sensibles d'altres eines, encara que es demanava el camp `comm`. No s'han reutilitzat ni copiat a cap fitxer d'informe. Les comprovacions posteriors queden limitades als PID propis i a camps numèrics; no s'ha interromput cap procés alié. La sortida de diagnòstic de la conversa no s'ha de compartir sense redactar eixos arguments.

La càrrega es limita a l'entorn local i a fixtures sintètiques. Cap trànsit massiu a serveis remots. Les quatre automatitzacions Codex trobades al disc ja estan en estat PAUSED; no s'ha creat cap monitor propi. No s'ha acreditat l'estat de crons d'altres aplicacions. El treball manté el Model B i no modifica el port de backend.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
