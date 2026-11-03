---
type: informe
status: esborrany
description: "Onada 6: WordPress 1.1.12 en cinc idiomes, quatre skills restaurades i kit CAS legal/documental; històric preservat i límits de tancament declarats."
tags:
  - auditoria
visibility: private
reflex: sdp:torn_099a70a6-eb5d-4606-8d22-319bc215821b:1ecbd94f-506a-4f89-86ed-914b75ecfa16
---
# Auditoria Codex — Onada 6, editorial, WordPress i tancament CAS

Informe viu del carril Codex. Distingix els canvis aplicats al viu dels kits pendents d’integració de Claude; cap certificació 10/10 sense evidència de les quatre IAs.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_099a70a6-eb5d-4606-8d22-319bc215821b:1ecbd94f-506a-4f89-86ed-914b75ecfa16 |
| Versió del document | 1.5.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T15:40:42.387Z |
| Modificació | 2026-11-03T04:30:43+01:00 |
| Propietari | Codex |
| Aprovació humana | Ordres directes del Mestre; últim carril T3 d’Onada 6 al xat del 261103, amb prompt i Bloc T6 vinculats |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Codex, agent basat en GPT-6; identificador exacte del backend no exposat per les eines |
| Tokens consumits | No disponibles en la telemetria d’este torn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-11-02 16:43 CET: entrada completada, carrils delegats i heartbeat de 30 minuts activat. Tall documental inicial basat en acta; HEAD real verificat després: 4ee8d78c40b85cb3c6ce6914feb0b04557c3a50c. Canvis previs aliens preservats.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

<!-- O6:CODEX:INICI -->
### Onada 6 · CARRIL 2 · T3 — lliurament construït i verificat

Llegits íntegrament el prompt canònic inicial (218 línies), l’ampliació fins a 258 línies i el Bloc T6 amb el seu delta. Tall final del prompt: SHA-256 `9199757d7ea23534eb672e8c84739bf86a9f9d39fe99b72b0b06388f9a913f56`; pla: `f290258294181300446c01360581798bd13d6c6831b397589e479df02c60da9a`. S’han incorporat la revisió MD, el DAFO de 15 dimensions, l’Oblit Saludable i la migració legal 2.4 de l’encàrrec ampliat. Torn `torn_73df43cb-e9c8-47f3-8c99-857669036387`; rebut de la plantilla viva `sdp:torn_73df43cb-e9c8-47f3-8c99-857669036387:54cf5cbb-7d47-4edb-99ff-70b005ac9494`. El rebut original de l’informe i els blocs anteriors es preserven.

L’àmbit del torn, obert inicialment com a documental per error, s’ha corregit a codi mitjançant l’API canònica de mutació de torns. Es conserven l’inventari inicial, el pla, els rebuts i la traça explícita de reconciliació; no s’ha reconstruït una baseline per absorbir canvis aliens. Les còpies de treball es troben sota `/private/tmp/sdp-codex-o6-{wp,skills,md,legal}/`.

#### WordPress 1.1.12 i cinc idiomes — aplicat al viu

Deu fitxers materialitzats després de comprovar totes les preimatges CAS; staging per fitxer, rename i comprovació de les deu postimatges. `ajustos.php` incorpora 39 claus completes per idioma, les pestanyes **Valencià · VA, Castellano · ES, English · EN, Euskara · EU i Galego · GL**, canvi immediat i selecció inicial pel locale d’usuari de WordPress, amb el del lloc com a reserva. `ca`/`ca_valencia` es resolen a `va`; es respecten els prefixos `es`, `en`, `eu`, `gl` i el fallback és `va`. Els textos no necessiten paquets `.mo`.

| Idioma | Marca i lema exactes |
| --- | --- |
| VA i ES | Sóc de Poble. Portal de Pobles Connectats |
| EN | Sóc de Poble. Portal of Connected Villages |
| EU | Sóc de Poble. Konektatutako Herrien Ataria |
| GL | Sóc de Poble. Portal de Pobos Conectados |

El `.po` castellà conserva la marca i el mateix lema que el valencià. Cos de **17 px**, interlineat **1,65**, targetes espaioses i negretes als tres passos, identitat, traducció i diagnosi. Hi ha un únic formulari: canviar d’idioma conserva valors sense guardar, selecció, nonce i els dos noms de camp. Les pestanyes tenen ARIA, focus i navegació amb fletxes/Home/End; no envien peticions ni activen el guardat. Es mantenen `manage_options`, `options.php`, el Model B i el port de dades.

S’ha corregit també un avís heretat de conversió d’array a text quan una opció malformada no era escalar. El text ric passa pel sanejador de WordPress; el JSON usa els quatre flags HEX, i els scripts passen per `wp_print_inline_script_tag` amb suport del seu hook de nonce. La interfície tradueix la diagnosi sense alterar el contracte públic preexistent de diagnòstic. Versió 1.1.12 coherent a capçalera, constant i `Stable tag`, amb l’historial 1.1.11/1.1.10 preservat.

**Proves:** 187/187 Node en les set suites dirigides de WordPress, sense omissions ni TODO. La nova bateria PHP real + JSDOM aporta 16/16 i entra a la cadena primària existent mitjançant el test del connector. La repetició dirigida al viu dona 43/43, incloent les 27 de Fronteres. L’execució més àmplia del lint d’Enxufe acaba amb codi 0 però conserva **195 passades, dues omissions i un TODO** de classes preexistents; no es presenta com 198 proves verdes. ESLint dels fitxers afectats: 0.

**Inspecció visual:** PHP sobre dobles de l’amfitrió i Chromium/CDP, amb 390 px reals en les cinc llengües, amplària de document igual al viewport i cap element fora de pantalla. Pestanyes de 46 px; captures VA a 1440 i ES a 390. El primer intent CLI havia fixat una finestra de 390 però el navegador mesurava 500: s’ha descartat eixa suposició i repetit amb mètriques CDP. La reproducció portable inclosa supera sis casos, sense errors JavaScript ni HTTP del target; Chrome, port, perfil i cau queden tancats. Açò acredita el render local, no una instal·lació WP Admin real, CSP de producció ni revisió amb lectors de pantalla.

#### Quatre skills — memòria literal restaurada i segell verificat

Restaurats **14 blocs històrics i 36 línies que faltaven** a `core-context-panic`, `core-secretaria-auditoria`, `core-higiene-escriptori` i `core-comprensio-reflexiva`, contrastant les fonts anteriors a l’Onada 4 i HEAD. La prova d’alteració d’un byte detecta els 14 blocs. Els contractes operatius i les metadades es conserven; l’explicació de la vigència es deixa fora de les seccions literals.

La regla d’**Oblit Saludable** de captures del xat documenta identificació del lot, assimilació, dependències, ordre humana que cobrisca els fitxers, retirada/desancoratge conjunts i verificació. No s’ha executat cap esborrat de captures ni editat l’índex del carril MarIA. S’ha usat la skill de suport `skill-creator`; el seu validador genèric no reconeix el contracte propi del repositori i no s’ha usat per eliminar-ne camps.

`node tooling/brain/fronteres-skills.mjs`: **0**, 42 skills vàlides, sense violacions, deute ni avisos; regressions **27/27**. Índex/catalogació regenerats sense delta. Segell reconciliat explícitament només amb les quatre skills autoritzades: `262585b736d4c8c12abdb98d2fec16705baab93d968f5205699584b3f98100b2`. La verificació del segell acaba a 0; no s’ha acceptat un canvi d’un altre carril.

#### Markdown públic, correccions científiques i compilador

Inventari i anàlisi mecànica dels **82 Markdown públics** (553.780 bytes), amb lectura íntegra de deu documents de context i revisió específica de les troballes. No s’afirma una lectura manual íntegra dels 82. Les carpetes reals són `01_ser`, `02_saber` i `03_actuar`; no s’han creat equivalents inexistents dels noms antics del prompt.

Quatre fonts corregides al viu per CAS, més el seu derivat obligatori:

- `03_actuar/plantilles/skill.md`: versió 2.1, ruta real i estat acreditat de Model B, Supabase/Sollutia GET, IndexedDB/PWA i federació estàtica/interactiva.
- `02_saber/03_consola_termodinamica/00_portada.md`: diferencia mapa local i projecció web sanejada de quatre fonts, excepcions de persistència local i ritus no demostrats.
- `02_saber/codex_huma/arquitectura_sistema_nervios.md`: separa retirada de Dexie i implementació parcial posterior d’IndexedDB/PWA; cap CRDT, sincronització completa ni ADR proposta convertida en norma.
- `02_saber/03_consola_termodinamica/05_actors_i_salut.md`: rutes reals i Frontissa instrumentada, sense atribuir-li 16/16 actuals, torns vigents ni llançadors que no s’han observat.
- `.agents/protocolledge.json`: només la versió de la plantilla `skill` de 2.0.0 a 2.1.0, mantenint la versió global 4.0.0.

Les cinc postimatges s’han verificat; metadades públiques 82/82, plantilles 12/12 i graf físic sense enllaços trencats en la còpia dirigida. Les dotze lliçons de memòria s’han conservat. Les llistes CommonMark vàlides no s’han renumerat per dissimular errors del render.

El **corrector del compilador queda al kit**, amb tres fixtures: reutilitza la màscara Markdown existent per no convertir WikiLinks en codi, comentaris o escapaments, i permet importar el mòdul des de stdin sense intentar resoldre el fitxer `-`. Proves dirigides **55/55**, consumidors compartits **42/42** i ESLint 0. Revisió independent repetida 55/55; s’ha mantingut la frontera de documents privats.

Quatre reproductors de `parseMarkdown.js` mostren reinici de llistes vàlides separades per línia buida, pèrdua del començament en 4, continuacions imbricades separades i les dotze entrades de memòria dividides en dotze `<ol>` amb text fora de llista. Es facilita prova sobre el parser i sanejador reals; la reparació correspon a C1. No hi ha una certificació visual del renderer Wiki.

#### Kit CAS legal 2.4, ARB-XAT-01 i G-D-01 — dipositat

[Kit complet i instruccions d’integració](02_investigacio_ia/261103_kit_codex_onada6_legal_i_tancament/README.md), amb manifest complet, preimatges, payload, aplicador sec per defecte, motor canònic fixat i inventari exacte. **19 payloads i 15 precondicions**; les cinc fonts MD/protocol ja aplicades van com a pins i instantànies de context B, sense duplicar-les al payload. Les evidències WP i skills també queden separades del payload. El tall B és la base immutable inicial més eixes cinc fonts revisades; no equival a tot l’arbre viu posterior.

Manifest SHA-256: `8d26f5090523dc5946d9ea1011306dd079cd39e0b07fb719926dfee5f067f2b7`. Inventari SHA-256: `0e3b2e8c0f4a90b20fa97a92ca693ea2a90c215c3a1110101510df47d2ed2e8b`. Artefactes inventariats: **112**. L’aplicador comprova inventari exacte, àlies, modes, pins, preimatges i Frontissa de confiança abans del staging. No hi ha `--force`. Atomicitat per fitxer i rollback d’errors capturables; no es promet transacció davant tall de corrent o SIGKILL.

**Legal:** 72 paràgrafs totals. Els 29 inicialment sense `<strong>` reben 6–8 negretes cadascun; els altres 43 es preserven literalment. Cos substantiu, enllaços i dades intactes, amb el canvi explícit de versió/data a **2.4, 3 de novembre de 2026**. HTML SHA-256 `2956bc30112b2e8d097815d502f9cd711e9ee0c213c5c73634340d9657343ff3`. La migració històrica 2.3 no s’edita i continua com a precondició. La nova `2611030330_politica_privacitat_2_4.sql` és append-only: INSERT idempotent i comprovació transaccional que rebutja una 2.4 existent amb URL, empremta, data o text nul divergents. No hi ha UPDATE/DELETE ni SQL remot executat. Primer cal publicar web/connector amb el text exacte, verificar l’empremta i després aplicar SQL; la nova fila implica reacceptació.

**ARB-XAT-01:** `politicaPrivacitat23.migracio.test.js` conserva la coherència històrica; una bateria separada comprova 2.4, conflictes i mutants. Les 24 proves IAIA de proveïdor/ruta/conversa usen un remot sintètic. L’apartat 14 encara requerix aclarir ajuda local i grup públic: no s’han inventat obligacions substantives ni presentat la guarda de migracions com una certificació de tot el xat.

**G-D-01:** regles exactes d’`activitystreams.json` a Firebase, Vercel i `public/_headers`, després de la regla JSON genèrica, amb `application/activity+json`. Prova HTTP local GET/HEAD de bytes, MIME i CORS: sis casos i 18 peticions. No s’ha verificat el desplegament real dels proveïdors.

**Validació conjunta en còpia nova B:** **427/427 Vitest, 55/55 Node del compilador, 6/6 HTTP, Frontissa 16/16, 9/9 controls de l’aplicador, motor canònic 29/29 i lint 0**. Catàleg de 72 migracions: zero errors i 14 avisos preexistents. No s’ha aplicat al viu cap dels 19 payloads ni la migració 2.4. La revisió independent del paquet publicat confirma 112/112 artefactes, els dos SHA anteriors, dry-run sobre la còpia completa B amb Frontissa 16/16 i 9/9 proves CAS. Per repetir estes proves des del viu, cal fixar `SDP_KIT_TEST_SOURCE=/private/tmp/sdp-codex-o6-legal/fresh-b/socdepoble.org`: usar per defecte les fonts vives concurrents produïx 7/9 perquè les dues proves positives es tanquen davant les 14 empremtes divergents. No s’ha modificat cap guarda per evitar eixe rebuig.

#### Tancament observat, propietaris i límits

Olivera de primer nivell: **0**. Check del document d’auditoria: **0**. El check global del torn passa huit portes —Olivera, plantilles, autoritat, ledger, segell, skills, Wiki i proves documentals— però **SCC/tancament estricte continuen rojos**. Falta el relleu d’este torn a ESTAT/LEDGER i l’ancoratge directe del laboratori per part de MarIA. El check també tracta Markdown literal intern del kit com a nous documents que necessiten rebut: és un conflicte de classificació artefacte/document que es declara, sense alterar preimatges ni fabricar rebuts. Les instantànies de context usen extensió `.snapshot` per no crear títols Wiki duplicats. L’auditoria enllaça el README; això no substituïx l’àncora directa exigida per SCC. L’últim SCC observa 118 errors: 116 artefactes sense àncora directa i dos documents orfes; zero enllaços ambigus després de passar les quatre còpies a `.snapshot`.

Al tall final observat, la Frontissa **viva dona 2/16**, amb 14 empremtes divergents dels canvis editorials concurrents de C1. El kit passa 16/16 en la seua còpia. No s’ha resegellat ni sobreescrit el registre compartit per forçar-ne l’aplicació. Claude ha de reconciliar eixes empremtes i qualsevol pin divergent abans d’integrar, executar les regressions del conjunt i seguir l’ordre de desplegament legal.

La projecció sanejada del diagnòstic local de mapa (2026-11-03T03:02:32.997Z) registra 403 nodes, 560 arestes, 13 tasques declarades i 22 avisos: 19 alts, dos mitjans i un baix. Inclou 14 de Frontissa, dos de porta documental, dos de tasca morta i quatre altres. És un tall de fonts, no una acreditació de runtime de torns o launchd ni una comprovació nova del nombre històric de torns caducats. El mapa cru privat no s’incorpora al kit.

**Relleu concret per a MarIA:** registrar el torn `torn_73df43cb-e9c8-47f3-8c99-857669036387` a ESTAT i LEDGER amb el lliurament T3, el manifest anterior i les limitacions de tancament; incorporar les línies d’[ANCORA_PER_MARIA.md](02_investigacio_ia/261103_kit_codex_onada6_legal_i_tancament/ANCORA_PER_MARIA.md) a l’índex. L’exclusivitat d’escriptura d’eixos fitxers es respecta. Cap fals consens de les quatre IAs ni 10/10 global.

**Desconvocatòria:** cap temporitzador, heartbeat ni automatització creats per este carril. Les sis automatitzacions Codex consultades consten PAUSED i la guarda nocturna està inactiva. Els servidors, navegadors, ports, perfils i caus propis de les proves finites han acabat o s’han eliminat. No s’han fet commits, desplegaments, consultes de comptes, signatures, pujades a botigues ni execucions SQL remotes.


#### DAFO a 15 dimensions i límit de la certificació

S’adopten els identificadors de la matriu compartida de Gemini, documentada a `dafo-dimensions-source.json`. Les fortaleses següents es limiten a les proves i fonts citades; els resultats d’Onades 3–5 no es presenten com una nova execució global d’Onada 6. No s’ha fet una inspecció de producció, de comptes reals ni de tots els dispositius.

| Dimensió | Fortalesa acreditada | Debilitat o límit | Oportunitat | Amenaça concreta |
| --- | --- | --- | --- | --- |
| D01 · Arquitectura i Enxufabilitat | WordPress conserva el Model B, el port de dades i dos camps públics; regressions d’amfitrió incloses en les 187 proves. | Els endpoints reals de Sollutia continuen requerint captures i fixtures pròpies. | Incorporar cada recurs GET amb el contracte de conformitat existent. | Confondre amfitrió amb backend i acceptar claus d’autoritat des de la interfície. |
| D02 · Pedra Seca i Disseny Atòmic | Les proves O5 de BlocAmbit/subtargetes i el nou disseny WP acrediten comportament i estructura delimitats. | El render de WP s’ha inspeccionat amb un host doble; no amb tots els temes i extensions. | Reutilitzar els controls accessibles i el formulari únic. | Donar per bona una captura retallada: el primer intent CLI de 390px tenia un viewport real de 500px; CDP ho ha corregit i mesurat. |
| D03 · Xat i IAIA Local | Les 24 proves del proveïdor/ruta/conversa IAIA passen en remot sintètic i separen ajuda local del port. | L’apartat 14 legal encara no explica amb precisió la separació entre ajuda local i grup públic. | Reconciliar eixa explicació en un canvi substantiu de privacitat amb prova del flux. | Presentar una comprovació de migració com una certificació del comportament complet o de sessions reals. |
| D04 · Notes i Flux Universal | BlocAmbit valida els valors abans de normalitzar-los; les regressions O5 inclouen l’editor compartit. | No s’ha reexecutat ací una sessió real de publicació i canvi d’identitat. | Mantindre un únic contracte de cinc àmbits i provar-ne els consumidors. | Normalitzar silenciosament valors invàlids i publicar al destí equivocat. |
| D05 · Cinc Idiomes i Llei del Lema | Cinc catàlegs WP incorporats, lemes exactes, 16 proves PHP/DOM i locale d’usuari/lloc; el castellà conserva el lema valencià. | La qualitat lingüística d’euskara i gallec necessita lectura de persones parlants. | Revisar el text sobre el mateix formulari, sense perdre dades ni demanar paquets `.mo`. | Una actualització que torne a dependre d’un catàleg absent o traduïsca la marca. |
| D06 · Seguretat, RLS i Privacitat | O5 aporta reproductors RLS de noms quoted i esquemes; WP conserva capacitat, nonce, sanejador i escapament. | L’anàlisi SQL és estàtica i no acredita RLS efectiva d’una base remota. | Executar les migracions en un PostgreSQL de prova amb el mateix esquema abans de desplegar-les. | Un conflicte de versió legal silenciós; la nova 2.4 el rebutja transaccionalment. |
| D07 · Recuperació Social i E2EE | Les evidències F7 de l’Onada 3 continuen disponibles; este carril no ha activat E2EE ni ha afegit booleans de confiança. | No és una nova auditoria criptogràfica; hi ha comprovacions externes històriques omeses. | Revisió independent del protocol i dels límits del consumidor abans d’activar-lo. | Confondre una biblioteca provada amb un protocol desplegat o amb confiança aportada per la UI. |
| D08 · Navegació Mòbil | O5 prova router encastat, clics modificats i lectura sense proveïdor; WP manté els inputs entre canvis d’idioma. | No s’ha certificat el botó físic d’Android en dispositiu real durant T3. | Reproduir els casos de retorn i focus en dispositius després de la integració. | Un fallback que canvie la base de l’amfitrió o substituïsca el formulari amb dades pendents. |
| D09 · Botigues i Jarvis | La font del connector marca 1.1.12; el prompt T6 declara Apple i Google en revisió. | No s’han consultat comptes de botigues, signat binaris ni comprovat l’arxiu iOS pujat. | Preparar una release reproduïble després d’integrar el kit i validar el paquet. | Confondre la versió del repositori amb una actualització ja publicada. |
| D10 · OpenData i Fediversity | El corrector MIME està provat amb GET/HEAD local; el compilador respecta la política d’exportació pública. | Les capçaleres del kit encara requerixen integració i desplegament. | Servir ActivityStreams amb el tipus correcte i conservar la separació entre projecció estàtica i federació interactiva. | Un HTTP200 amb HTML de fallback o un MIME JSON genèric que es presente com ActivityPub verificat. |
| D11 · Rendiment i HMR | El canvi WP queda en l’administració del connector; les captures mesuren el viewport real. | No s’ha repetit tot el pressupost del bundle SPA ni tota la suite HMR amb els canvis concurrents de C1. | Mantindre les portes de pes i els informes de build com a evidència de la release final. | Donar vigència a xifres antigues de rendiment després de canviar l’entrada o el contingut. |
| D12 · Accessibilitat i Llegibilitat | Cos WP de 17px/1.65, pestanyes de 46px, teclat circular i ARIA; cinc viewports reals de 390px sense desbordament. | No s’ha fet VoiceOver/TalkBack ni validació amb persones lectores. | Revisió diagonal humana i prova del WP Admin real amb la configuració del portal. | Convertir la quota de negretes en una mètrica automàtica de comprensió o retallar text per encaixar-lo. |
| D13 · Govern Documental | 19 lliçons O5 i 14 blocs O6 restaurats literalment; quatre skills resegellades, Fronteres 0 i Olivera 0. | El canònic canvia durant la construcció; hi ha ancoratges de laboratori i relleus reservats a MarIA. | Congelar el SHA de cada encàrrec i publicar deltes amb responsable i ordre d’integració. | Resumir memòria històrica, promoure una ADR sense signatura o amagar rojos de tancament. |
| D14 · Proves i CI | WP 187/187, dirigida viva 43/43, kit legal i compilador amb regressions i controls negatius. | No s’ha repetit tota la suite global; el diagnòstic ampli de classes conserva un TODO i dues omissions. | Un únic assaig de la release integrada amb els mateixos hashes i precondicions. | Transformar un TODO, una omissió o un error d’entorn en «100% verd» sense explicar-ne l’abast. |
| D15 · Coordinació Multiagent | Carrils aïllats, revisió independent, CAS i fonts directes limitades per preimatge. | El registre de Frontissa de Claude continua evolucionant durant el muntatge del kit. | Separar fonts ja aplicades, payload pendent i pins de context, amb un tall B explícit. | Forçar un kit antic damunt del registre nou i perdre contingut d’un altre carril. |

#### Matriu d’importància i urgència

| Quadrant | Acció concreta | Responsable i condició de tancament |
| --- | --- | --- |
| Q1 · Important i immediat | Integrar el kit legal/compilador sobre un tall estable, revisar el CAS compartit i restaurar Frontissa 16/16 abans d’aplicar. | Claude, amb preimatges actuals revisades i regressions del conjunt integrat. |
| Q1 · Important i immediat | Reparar el render de llistes Markdown vàlides i paràgrafs en `src/sections/wiki-de-poble/`, amb els reproductors aportats. | C1, amb prova sobre el parser/sanejador real; no renumerar la font per amagar el defecte. |
| Q1 · Important i immediat | Aplicar la política 2.4 només després de publicar el text exacte i verificar-ne l’empremta; confirmar la reacceptació prevista. | Responsable de desplegament/Mestre. Este carril no executa SQL remot. |
| Q2 · Important i planificat | Completar ancoratges del laboratori, relleus ESTAT/LEDGER, vigència de les mètriques i explicació legal de l’ajuda IAIA. | MarIA i responsables de cada superfície, amb proves i tall datat; sense inventar activitat de llançadors. |
| Q2 · Important i planificat | Validar WP Admin real, CSP efectiva, paquets signats i lectura assistida. | Responsable de release i persones lectores; els dobles locals no acrediten estos entorns. |
| Q3 · Tàctic | Polir euskara/gallec amb parlants i mantindre coherents readme, capçaleres i catàlegs en cada release. | Carril d’internacionalització/release, amb la marca i el lema com a invariants. |
| Q4 · Soroll a evitar | Nous crons sense necessitat, segells forçats, reanomenats massius i xifres globals sense font. | Cap automatització nova. Corregir només defectes reproduïts dins del carril. |

La visió de futur és mantindre **fonts úniques**, **contractes explícits**, **proves reproduïbles**, **integració amb CAS**, **revisió humana** i **mesures honestes**. Un 10/10 requerix la release integrada i les comprovacions que encara falten; no deriva de sumar proves de talls diferents.

#### Proposta d’Automillora

«Si m’hagueres demanat això d’aquesta altra forma, hauria sigut més eficient»: fixar el SHA del canònic, separar des del principi l’èmfasi visual del versionat legal, i anomenar els fitxers reals de proves i les carpetes vigents. La migració 2.4 va entrar en una ampliació posterior; un addendum datat hauria evitat construir primer una projecció que preservava la 2.3.

No hi ha una nova capacitat de backend acreditada en este torn. El flux que ha ajudat és la delegació en còpies amb propietat de fitxers, un àrbitre independent, PHP/DOM per als ajustos i CDP per contrastar captures amb dimensions reals. Propose conservar eixe circuit i un únic tall de verificació final, amb relleus de cada propietari i sense processos periòdics quan s’acaba l’onada.
<!-- O6:CODEX:FI -->

<!-- O5:CODEX:INICI -->
### Onada 5 · CARRIL2 · kit CAS dipositat, congelat contra el tall T5

Kit complet a `../_investigacio_ia_de_poble/261103_kit_codex_onada5_reconciliacio_llicons_i_apple_audit/`:23payloads,154precondicions i inventari exacte de120artefactes. Manifest SHA-256 `03b412a9c8a53fcfa90cf6651b9e2a503b4b293ed1692c134237c22396c58e70`; inventari `fcdbc3e3248cb0c5f7ad62a20e04f8d499cf8b453ec06d09e1d4763889b322d6`. Publicat amb rename atòmic, aplicador sec per defecte i bloqueig CAS estricte. Es rebutja l’arbre O6, que ja ha evolucionat; el kit no s’hi força ni s’hi aplica automàticament.

Reconciliats el certificador (Wiki, rutes de targetes, atributs sense cometes, entitatsHTML5 i separadorsASCII), el lector complet sense Router, quatre grups relacionats amb9destins preservats i16empremtes; recuperades literalment19lliçons (6+13). Dos bypassos nous de RLS sobre noms amb punt entre cometes i reanomenat d’esquemes tenen reproductor i corrector. El kit de Gemini té integritat de payload, però el seu aplicador falla l’atomicitat davant EIO i el seu testFirebase descartava garanties vives; el lliurament usa el motor canònic i conserva eixes garanties.

Aplicació nova en còpia independent:633/633Vitest i107/107Node, Frontissa16/16, Fronteres42 vàlida, segell intacte i ESLint0. Controls negatius: reaplicació, drift, payload alterat, fitxer extra i motor divergent, tots rebutjats. Les proves globals de producció i els serveis reals no formen part d’este resultat.

L’auditoria iOS del tall T5 verificà1.0.0Build2 i trobà UserDefaults al SDKCapgo8.5.12 sense manifest propi; hi ha reproductor i hashes. No s’ha auditat l’arxiu binari de la pujada posterior: el prompt T6 declara Apple«Waiting for Review», que és una afirmació de la convocatòria, no una consulta nostra a App Store Connect. Cap signatura, clauer, compte, credencial o pujada utilitzats.
<!-- O5:CODEX:FI -->

<!-- O4:CODEX:INICI -->
### Onada 4 Nocturna · CARRIL2 · kit CAS dipositat i verificat

**Lliurament complet del constructor:** `../_investigacio_ia_de_poble/261102_kit_codex_onada4_skills_tractors_i_destrossa/`.70 rutes de payload,10 precondicions,65 preimatges i inventari complet de388 fitxers. Manifest canònic amb `target_path`, `preimage_sha256` i `sha256`, wrapper sec per defecte i aplicació amb `--write` explícit. Dipòsit amb rename atòmic; no s’ha aplicat codi del producte al viu. Manifest SHA256 `d80e9d2baa6eca58fffd9b57f609231e9f72a18b738275d793fc8ed91651156b`; inventari SHA256 `1ad58a5646a98bf402a790fd6977acc4bf4915acd2b3d73de0d5d7927bb4c64e`.

Prompt 2138 íntegre i Bloc T4 llegits. El canònic s’ha ampliat de 214 a 240 línies durant el torn (IDEA-63 i BOTIGUES); el delta també s’ha llegit i executat. Torn `torn_b208c6a3-28e3-484d-a788-d8cdeba7fe15`, plantilla viva rebuda i pla original vinculat. Baseline immutable del HEAD `cc3e443dc973ad286b8faf0a5c3379d7e6ae9fff` amb els canvis previs preservats, sota `/private/tmp/sdp-codex-o4-p9vxg3u7/`. Els informes congelats dels auditors i les preimatges originals no s’han reescrit.

**O4-CODEX-1:** revisades una per una les 42 skills físiques (9 core+33 plugins), no 33 en total:41 millorades i1 conservada. `evidencia/auditoria-42-skills.json` documenta per a cadascuna propòsit, contradicció, corrector, hashes, fonts amb línia, regla mecànica i criteri manual/absent. Corregides regles de congelació d’edició per qualsevol auditoria, autoritat ja concedida, buildWP, quotes/models fixos, PDF, taxonomia i descripcions de tractors que afirmaven controls inexistents. S’han preservat els camps del contracte propi de les skills; el validador genèric de skill-creator no reconeix eixe esquema i no s’ha usat per esborrar metadades.

Els cinc documents d’exemplars incorporen targetes internes reals de Legal, `PublicacioUniversal` de cinc àmbits, doble comprovació d’enllaços, edició avançada Hero→Avatar→àmbit→classificació i calaix compartit. Una instantània complementària del carril Claude, separada de la baseline, passa140/140 proves en7 suites amb15 hashes de context. La geometria sota barra negra correspon a la SPA; l’encastat manté la capa modal. No es confon DOM/CSS amb viewport real. `/page/privadesa` era absent: mentre es construïa el corrector, Claude ha integrat els àlies privadesa+privacitat→`/legal`; navigation queda com a precondició, fora del payload, preservant el seu canvi i la política existent.

| Família | Corrector i evidència |
| --- | --- |
| Fronteres | Motors com a fitxers regulars dins de l’arbre; rebutja traversal/directoris/symlinks.27/27 proves. Cens42, zero violacions, deute i avisos. |
| Enllaços | Router JSX i resolutors reals; comodins/dades pendents sense fals404 ni fals verd; URL, controls, rutes relatives, fitxers públics, MIME/JSON, NotFound200 i límits.22 roges sobre preimatge;26/26després amb HTTP local i fuzz2000. |
| Dades/ZIP | UTF16 escalar, claus reservades, ID malformat i coherència local/central/descriptors ZIP; reproductors i controls de compatibilitat. No s’afirma explotació remota. |
| RLS | Estat DDL per fitxer i entre migracions; DISABLE, recreació, ALTER amb llistes/asterisc, UNLOGGED i dollar-quote.32/32amb Realtime i74 SQL analitzats, sense executar migracions. |
| PDF/telemetria/segell | Perfil/cau del navegador aïllats i netejats; unitats reals dels avisos; API de segell importable des de stdin. Reproductors rojos/verds i límits declarats. |
| SCC | Exclou només `dist-natiu` generat de l’arrel; l’homònim dins de la Wiki continua auditat.9 verdes+1roja abans,10/10després. |
| Botigues | Enllaç APK amb text neutre i atributs adjacents: proves DOM amb sanejador real, controls de web/enllaços legítims; SDK mínim 36 i resolució conservadora de Gradle, expressions no acreditades→avís.99 verdes+2 omissions de guardes; contrast independent9 casos SDK. |

Catàleg i índex regenerats. Segell final reconciliat explícitament contra l’original: `c82137841dda7ede692a9716b64104a6596780d66446e588e2eb4cbbab0f60da`. La revisió independent local tanca sense bloquejants els defectes reportats; no substituïx el consens de Claude/Gemini/MarIA.

**Prova final de lliurament:** el wrapper verifica inventari i àlies; tres controls negatius (target divergent, payload alterat i àlies incoherent) rebutgen sense modificar el target. Aplicació real dels 70 fitxers en una segona còpia: hashes i modes concordants, Frontissa16/16, cap lock/staging residual i reaplicació rebutjada per CAS. Després d’aplicar: **119 Node verdes+1 omesa i207 Vitest verdes+5 omeses**,0 fallades. Design Guard:3032 fitxers,0 crítics i0 avisos. Quatre fonts oficials de botigues passen arbre+HTTP. Les dues entrades literals `[text](adreça/ruta)` de la skill Markdown són exemples de sintaxi, no URLs clicables; el scanner conservador les registra i la classificació manual consta al kit.

**Límit de les suites àmplies:** la primera suite Vitest dóna 30.826 verdes,14 roges,176 omeses,16 fitxers fallits i1error de listen del sandbox. Node primari: 2120 verdes,19 roges,12 omeses i2 TODO. No es presenten com a verd global. El triatge Node separa17 precondicions excloses i2tests del Mapa ja corregits per Claude; Vitest identifica resolució de React des del cau Lucide, fonts natives exclosos, harness d’originals humans i assertions antigues de Firebase/IAIA. La reexecució de 14 fitxers amb context adequat dóna 477 verdes,2 roges IAIA antigues del carril Claude i4 omeses. El harness d’al·lèrgens està corregit al kit; els correctors simultanis de Claude no es dupliquen.

**Integració pendent de Claude:** la comprovació seca sobre el viu s’atura a Frontissa13/16 perquè descarregues/fediversity/projecte han canviat durant la construcció i encara tenen l’empremta anterior. No es força ni es reaprova contingut d’un altre carril; cal completar eixa validació i revisar/rebasar qualsevol pin divergent abans d’aplicar. El kit és verd en la còpia de referència. El check global observat passa7 portes i SCC queda roig pels 2Markdown generats en dist-natiu; el seu corrector és al kit. El check estricte del torn també registra pla ampliat, codi/captures concurrents i relleu ESTAT/LEDGER pendent. `RELLEU_DOCUMENTAL.md` prepara eixes anotacions respectant l’exclusivitat d’escriptura. No s’ha fabricat un tancament ni un10/10 global.

No s’ha fet cap operació real de compte, Supabase, signatura, pujada o publicació a botigues. Font nativa1.0.0/2 coherent amb el pipeline; preparar Build3 és el pas de release de Claude. Les proves de baixa/Apple són amb mocks, SQL és estàtic i PDF usa navegador simulat. Cap comprovació local garantix aprovació de botiga.

**Desconvocatòria:** cap temporitzador ni automatització creats;6 automatitzacions Codex observades PAUSED, guarda nocturna inactiva i processos propis finits acabats. Informe i kit lliurats; queda el relleu d’integració, no una tasca de fons.
<!-- O4:CODEX:FI -->

<!-- O3:CODEX:INICI -->
### Onada 3 · Teler Invertit · tres kits CAS dipositats i verificats

Ordre canònica 261102_1918 llegida íntegrament i Acta Marmota 261102_1929 contrastada amb ESTAT_ACTUAL. Torn documental `torn_858b8642-1deb-48dd-a79e-da025c5d6abe`, plantilla d’auditoria viva rebuda i pla aprovat 1532 vinculat. Es reutilitza l’informe ja creat amb el seu rebut original, sense reescriure l’historial. Acta de lliurament: [[261102_2015_acta_marmota_lliurament_codex_onada3_teler_invertit]].

| Carril | Kit a `../_investigacio_ia_de_poble/` | Payload | Evidència definitiva |
| --- | --- | --- | --- |
| O3-CODEX-1 | `261102_kit_codex_kit_carril` | 3 fitxers | 29 proves pròpies +9 de política Node; 29/29 repetides per àrbitre independent |
| O3-CODEX-2 | `261102_kit_codex_recuperacio_consumidor_ui` | 4 fitxers, 46 precondicions | 24 proves noves; F7 483 passades +1 omesa històrica; àrbitre independent 7/7 |
| O3-CODEX-3 | `261102_kit_codex_build_net_dsstore` | 4 fitxers, 6 precondicions | 8 proves noves amb Vite real; regressions 84 passades +5 omissions històriques |

**Verificació independent del lliurament empaquetat:** aplicació CAS en una còpia nova, Frontissa 16/16 quan correspon; **540 Vitest passades +1 omesa en 24 fitxers** (F7, cinc suites exigides d’Onada 2 i E2EE apagat en producció); **46/46 Node**, ESLint net i Design Guard **3.055 fitxers, 0 crítics, 0 avisos**. Les omissions són prèvies: la porta externa Shamir continua saltada a posta; no es transforma en verda ni es presenta com revisió criptogràfica completa.

Cada kit conté `manifest.json`, `manifest.sha256`, `preimages/`, `payload/`, `canvis.patch`, `LLEGEIX_ME.md`, `lliurament.json`, proves d’aplicació/revisió i `SHA256SUMS`. Les sumes del dipòsit s’han revalidat després de copiar-lo. Els tres pegats passen `git apply --check` sobre la seua base exacta. Una re-aplicació dels tres kits falla per CAS sense canvis persistents ni lock orfe; no hi ha `--force`.

**Manifest SHA-256 dels kits:**
- Kit Carril: `6ab725923f02a34550437ff713d823a9a01a1b597bc6e961f7cfe8aca84761aa`.
- Consumidor: `50a3ec1a9a171e6874e4036920882b4e3a725eace8662ba47c7b5b9c54ad80c3`.
- Build net: `3315d67e29d141d5e956d4a08dd3523046cc09c3722fc7409ab1610cd09aaef1`.

**Kit Carril:** CAS estricte de contingut i permisos, inclosa absència; precondicions també contrastades amb el candidat provat, staging complet i rollback davant errors capturables, preservant edicions alienes. La Frontissa de confiança del destí s’executa sobre candidat, sense aprovar empremtes. El registre real conté claus PAGE_COPY i el detector sobreaproxima src/ i suport de la porta. Suite registrada a la ruta real `tooling/tests/node-suite-manifest.json`; no es crea el manifest duplicat de `tests/` citat abreujadament al prompt. S’han reproduït i corregit errors del lock/EIO, neteja i precondicions finals, CLI silenciosa per l’àlies `/tmp` i divergència base-candidat.

**Consumidor F7:** API només `llegix(pid,{signal})` i `tanca()`, metadades immutables, cap acció ni booleà d’autoritat de UI. SAS només amb registre local i transcript lligat; SDPN amb firma real i claus/material locals verificats. Revalidació de sessió/capacitat/material, caducitat després dels awaits, memòria de 32 peticions sense expulsió silenciosa i invalidació de snapshots locals. El doble parell reproduí i tancà revocació des d’una altra pestanya durant lectura, petició cancel·lada encara comptant SAS i instal·lació d’una revisió durant lectura: ara les lectures amb i sense material fan zero escriptures de registres. També es prova disputa local després del snapshot. No hi ha permisos, fragments, claus, signatures ni DTOs remots en la resposta pública. `E2EE_ACTIU_PER_DEFECTE = false` i capacitat apagada per defecte es conserven.

**Build net:** exclusió de `.DS_Store`, `.DS-Store` i `._*` abans d’emetre public/ a dist/, mantenint public/ intacte, `.well-known` i prioritat dels generadors. Neteja incremental de l’eixida sense seguir symlinks; WP/natiu conserven el filtre existent i el modular no copia public/. Build web complet en còpia exclusiva: **893 fitxers, 0 Finder, entrada 235.375 B gzip davant sostre 250.000 B**. Configuració pública sintètica i mode local; l’avís de chunks grans de Vite continua visible. La primera eixida temporal fou buidada per un segon build concurrent dins d’una mateixa còpia: es repetí en una còpia exclusiva i només esta última és evidència de l’artefacte.

**Ordre de materialització per a Claude:** Kit Carril primer; build net després, perquè amplia el seu manifest Node. Per al consumidor, aplicar els kits F7 en l’ordre provat `idea48 → restauracio → diposit → rpc → observacio → cancel → material`, i aleshores el consumidor. Cancel s’ha inclòs en la verificació i no és cridat per este lector. Material ha d’anar després d’observacio/cancel pels hashes antics compartits. Si el carril Open Data de Gemini ja ha canviat el manifest Node, cal rebase explícit conservant totes les suites; CAS rebutja la divergència. No s’han reempaquetat les dependències F7 com si foren noves.

**Abast i límits:** construcció en còpies separades sota `/private/tmp/sdp-codex-o3-0uxn6c6i/`, de l’arbre brut inicial `4ee8d78c40b85cb3c6ce6914feb0b04557c3a50c`. Els hashes de totes les rutes dels tres carrils al viu continuen iguals als de l’entrada: cap font del producte materialitzada per Codex, cap secret llegit, dependència nova, commit, desplegament o SQL remot. Atomicitat per fitxer amb rollback capturable, sense transacció global davant SIGKILL/tall de corrent ni exclusió d’editors aliens al lock cooperatiu. F7 usa WebCrypto real, transport simulat i doble IndexedDB; el resultat és un snapshot entre bases separades, sense certificar frescor posterior a l’última lectura, persistència física ni recuperació de producció. La UI visual és del carril Gemini/Claude. La quarantena dels residus versionats del viu i la revisió criptogràfica externa continuen pendents dels seus responsables. Actualització creuada al tancament: Claude confirma en T-08 la materialització d’AUD-O2-T4-01 i d’AUD-01 amb el corrector de Codex, més l’expectativa de PerfilPublicSection. Root ha copiat només estos cinc canvis concurrents a una còpia aïllada i ha repetit les cinc suites exigides: **62/62 verdes**. Açò complementa les 540 proves de la instantània empaquetada, sense atribuir-les al tall posterior del viu.

**Context i tancament:** equip constructor ha llegit íntegrament els documents vius de primer nivell, inclòs Llibre Mestre/índex (lectura distribuïda declarada). Auditoria, Llibre Mestre, ESTAT i LEDGER actualitzats; actes/prompts vigents conservats i ancorats per a Claude, sense trasllats. Cap temporitzador, heartbeat, polling ni automatització creats; les sis automatitzacions Codex existents consten `PAUSED`, i l’antic heartbeat d’esta feina ja havia sigut eliminat. El bucle de 30 minuts dels documents anteriors és històric. El rebut del torn registra el resultat formal de `tancament.mjs --check/--close`; no s’inferix publicació ni consens 10/10.


**Tancament observat (20:22 CET):** `tancament.mjs --check` global retorna **valid:true, 8/8 portes, zero errors** després d’ancorar la captura humana nova de les20:17, sense tocar-ne els bytes. La comprovació estricta `--turn-id torn_858b8642-1deb-48dd-a79e-da025c5d6abe` continua rebutjant el segell perquè, després de l’obertura, Claude ha escrit cinc fonts/proves del seu carril i s’han incorporat quatre captures humanes. Es conserva la vigilància i l’inventari inicial: no s’ha canviat l’abast, absorbit codi alié ni reescrit la baseline per fabricar un tancament. El torn queda documentalment planificat amb eixa concurrència registrada; no hi ha cap execució ni tasca recurrent pendent. La construcció i el dipòsit dels tres kits sí estan completats.
<!-- O3:CODEX:FI -->

- **Rutes i llengües divergents (T5):** el pla cita src/locales/{va,es,en,fr,eu}.json; l’arbre real usa src/config/idiomes/{ca,es,en,eu,gl}.js. No es crea una segona arquitectura de traducció. El cens ha trobat 102 fitxers conformes i 23 reserves divergents (les 22 del pla i VistaEnConstruccio), amb claus existents.
- **IAIA dependent de xarxa (T6):** amb sessió, Conversa espera l’enviament Supabase abans de respondre localment i el fil de la IAIA correspon al grup públic. El kit separarà explícitament l’ajuda local sense falsejar entregues humanes ni persistència.
- **Banners dins del ZIP (IDEA-62):** wordpress-plugin/eines/empaqueta.mjs inclou els dos banners en ADAPTADOR.fitxers. Kit de sanejament i guarda en construcció.
- **IDEA-48 incompleta:** les primitives Shamir i les taules existixen; falten RPC F7 i la integració del flux. E2EE_ACTIU_PER_DEFECTE és false. No es presentarà un recompte de contactes com una recuperació funcional.

### Rèplica a Claude · 17:02 CET

Llegit íntegrament [[261102_1640_auditoria_claude]]. Confirmem T-00 i la separació dels carrils. Els canvis T2/T3 ja són visibles a l’arbre; el resultat del tall inicial d’higiene que els deia absents queda superat per esta entrega en curs.

- **Kit T5 disponible:** `../_investigacio_ia_de_poble/261102_kit_codex_i18n/`. 29 fitxers: 13 propis ja aplicats, 16 fora de carril només en payload; 1.146/1.146 proves dirigides, 105 fonts en guarda, 38 claus als cinc idiomes reals. Les 23 divergències són 21 crides t i 2 parells; no una migració de llengües. No integra encara Xat local.
- **Kit IDEA-62 disponible:** `../_investigacio_ia_de_poble/261102_kit_codex_higiene_idea62/`. Sis fitxers, 52 Node + 69 Vitest; exclou banners del ZIP i guarda set superfícies. Dos .DS_Store es poden moure a quarantena preservada. Els aplicadors fan staging abans d’escriure, preflight global i CAS.
- **Ordre per a Claude:** T5 → kit Xat (en congelació de preimatges) → higiene. El kit Xat es basarà en els dos fitxers XatSection de T5 per evitar trepitjar-los. La guarda d’higiene de Claude pot coexistir, però convé revisar si duplica la política de tooling/lib/higiene-paquets.mjs.
- **Fediversity verificat:** les rutes estàtiques reals de WebFinger/actor són correctes; dos /opendata/* del pla donen HTML SPA, no JSON. No afirmar set fitxers públics sense validar contingut i tipus.
- **IDEA-48:** 35 proves noves del model d’estats, 114 passades + una omesa de les primitives existents. R48-01/02 corregides i rebatudes per un àrbitre Codex independent. Controlador SAS real en construcció; RPC, UI i activació continuen pendents. La prova omesa d’abans és la revisió externa del protocol, no es convertirà artificialment en verda.

### Rèplica a Claude · lectura 17:15 CET

Llegit el relleu 2 de Claude, etiquetat 17:32 al seu informe; el rellotge de lectura és 17:15 CET, així que eixa etiqueta no s’usa com a prova temporal. Els kits sí existixen al satèl·lit germà del repositori, autoritzat pel Mestre: `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261102_kit_codex_i18n/`, `261102_kit_codex_xat_iaia/` i `261102_kit_codex_higiene_idea62/`. No es troben amb una cerca limitada a `socdepoble.org`. Els sis fitxers d’higiene ja coincidixen byte a byte amb el resultat del kit a l’arbre viu; això acredita integració local, no desplegament.

El primer staging conjunt ha detectat les cinc claus T1b afegides als cinc diccionaris i s’ha aturat abans de tocar res. Rebase controlat en curs, conservant estes insercions també a la base. El bloc T0 encara en construcció requerirà el mateix rebase si arriba després. No s’afluixen els hashes ni es reescriuen els diccionaris vius.

El Xat ja ha passat 2.824 proves en 155 fitxers en cadena T5→Xat, 11 proves adversarials d’aplicador i ESLint. La revisió independent ha reproduït i corregit una salutació que no pintava al primer render. L’UUID remot de Javi i la prova amb sessió real continuen pendents; no es dona per provada l’entrega a una persona real.

### Integració independent · 17:27 CET

Rebase T1b complet: les insercions de Claude s’han conservat en base i payload, amb registre `rebase_t1b_261102.json`. La cadena en `/tmp/sdp-codex-integracio-261102` passa T5 (1.146/1.146) i Xat (2.824/2.824 en 155 fitxers); higiene ja present coincideix amb els sis hashes i passa 52/52 Node. Build web estàndard verd amb configuració sintètica explícita i mode local; entrada 230.494 bytes gzip sota el sostre de 250.000. La configuració runner de Vite no serveix per als imports dinàmics del plugin de consola en generateBundle; s’ha usat el build estàndard amb caches pròpies a la còpia. Açò no prova credencials ni desplegament de producció.

Navegador real, preview local 3391: consulta «Com puc publicar un anunci al Mercat?» → resposta útil visible amb dades a preparar i enllaç a la secció. Cap error ni avís de consola. Captura i logs en `261102_kit_codex_xat_iaia/evidencia/`.

**Continuació del Llibre Mestre (P2-12 / P1-10):** kit nou `../_investigacio_ia_de_poble/261102_kit_codex_documents/`, dos fitxers. Corregix la mutilació de blocs normatius: preserva codi i rutes, detecta alteracions dins de spans i conserva la semàntica dels snapshots històrics. 64 proves Node, ESLint net, cinc proves adversarials de l’aplicador. DOC-AUD01 (bloc normatiu duplicat que amagava una alteració) corregida i verificada per àrbitre independent. Aplicació en còpia completada; no aplicat a l’arbre viu.

IDEA-48: controlador SAS i magatzem IndexedDB en revisió. L’àrbitre ha reproduït tres falles (ACK perdut, cancel·lació durant transport i revocació de pin durant WebCrypto); s’han corregit i reproduït els casos de no enviament i registre conservador. El kit no es declara recuperació activa: falta RPC, reconstrucció, UI i prova externa del protocol.

### Rèplica a la integració de Claude · 17:46 CET

T5 ja integrat a l’arbre viu. Revisades i acceptades les correccions de Claude: les 38 claus s’escriuen amb cometes simples segons `i18n.idiomes`, i les tres proves que comproven llengües diferides carreguen `tests/helpers/diccionaris.js`. Esta suite no era al primer lot del kit; els seus 1.146 verds no acreditaven eixa forma ni eixa càrrega. S’incorpora ara al verificador T5 i al Xat. Es conserven també la neteja de whitespace de Pobles i el hook T2b d’Arrere en XatSection, en les dues cares dels pegats. El rebase no ha escrit cap font principal.

El retoc editorial final del Xat conserva les dades explícites de la persona sense inventar camps. Nova passada: 2.826/2.826 abans d’afegir la suite d’idiomes; el navegador anònim en mode remot respon encara que el catàleg remot falte, i mostra la bicicleta i els 60 euros aportats en la consulta. Captura `xat_anonym_redaccio_final.jpg`. La consulta autenticada de Supabase continua coberta per proves de component, no per una sessió real.

El kit IDEA-48 de sis fitxers ja té aplicador: 170 passades + una omesa històrica, onze proves adversarials, aplicació independent i segona execució amb zero escriptures. Continuació en curs amb tres peces separades: SQL F7 verificat amb PGlite, adaptador Supabase amb guardes abans de cada RPC i reconstrucció sobre les primitives existents. Encara no estan lliurades; no s’activa E2EE ni es declara recuperació completa.

### Tancament de guards i continuació F7 · 18:00 CET

Lot definitiu després de les troballes K-01/K-02 de Claude: **T5 1.205/1.205 en 28 fitxers**, 32 entrades del kit ja coincidents amb l’arbre viu. Inclou les tres correccions de proves sobre traduccions de Notes/Mercat/FullAjustos. **Xat 2.886/2.886 en 163 fitxers**, en staging nou de l’arbre viu; 17 canvis pendents i un fitxer ja coincident. El rebase conserva també el hook d’Arrere de Conversa. Evidència `evidencia/claude_guards_final.log` en cada kit; estos resultats substituïxen els recomptes anteriors com a última passada, sense alterar-ne l’historial.

K-05/K-07: kit nou `../_investigacio_ia_de_poble/261102_kit_codex_manifest_node/`, un fitxer, classifica les tres proves noves d’higiene i blocs documentals com a primàries i requerides. No recategoritza proves anteriors. Aplicació independent en còpia amb **9/9** de política Node; ordre necessari: guarda de Claude + higiene + documents → manifest. No escrit al manifest principal.

F7 encara en revisió: SQL amb 21 proves Postgres/PGlite reals, transport Supabase i consumidor que reconstruïx després de tres cerimònies SAS. La revisió ha corregit cinc fronteres de quota, caducitat després de panys, rebuig, null i divergència de SDPN. PGlite no acredita concurrència de dos servidors. Es conserva l’excepció normativa de rebuig automàtic a D després de quatre errors de tornada; el rebuig manual és d’A. Encara no es declara flux d’usuari complet ni es publica cap migració remota.

### Rèplica T-05 i integració F7 · 18:09 CET

La troballa HMR de Claude s’ha reproduït independentment en una còpia: dues versions de `WorkspaceContext.jsx` (query distinta) provoquen exactament «useWorkspace ha de viure dins de WorkspaceProvider». Kit `261102_kit_codex_hmr_workspace`, tres fitxers: separa només la identitat del context en un mòdul estable, manté el contracte d’importació i afig la prova que fallava. **480/480** de workspace i ESLint net. Navegador real en banc mínim Vite aïllat: una edició v1→v2 del proveïdor conserva el text i la carpeta triada, zero errors/avisos. No és una mesura de totes les closques S2.B ni resol la decisió ARB-T3-01. Revisió independent sense troballes bloquejants i verificador del kit 480/480; pendent integració de Claude, sense tocar el seu fitxer viu.

Nou kit `261102_kit_codex_recuperacio_restauracio`: Alta + consumidor + prova. Aplicació independent de tres fitxers en còpia, **231 passades + una omesa històrica**. Tres cerimònies SAS reals desemboquen en reconstrucció, obertura de còpia i identitat; el consumidor separa commit durable i ACK perdut. El dipòsit real guardat i el port de finalització encara són peces pendents; no s’activa el flux.

Amb T0 nou a l’arbre, els hashes dels diccionaris tornen a divergir; el preflight Xat es bloqueja abans d’escriure, tal com toca. Claude ja ha incorporat els 18 fitxers del Xat excepte la seua ampliació independent de l’atles a `iaiaLocal.js`, que cal preservar en el pròxim rebase. No s’interpreta el preflight bloquejat com una regressió funcional ni s’afluixa.

### Matriu D01–D15 · tall de verificació 18:15 CET

Identificadors contrastats per lectura puntual de la taula del pla 261101_1246, enllaçat al Llibre Mestre. No s’ha recorregut ni incorporat l’arxiu històric a RAG. Les notes numèriques antigues no es reciclen com a qualificació actual. Cap fila té encara certificació unànime de les quatre IAs.

| Dimensió | Evidència actual d’este torn | Condició que queda per certificar |
| --- | --- | --- |
| D01 · Port neutral | Transport F7 provat contra runtime/auth i SQL local | Conformitat completa de tots els adaptadors després d’integrar T0/F7 |
| D02 · Pedra Seca | Geometria de tres closques informada per Claude; HMR aïllat verificat per Codex | Passada final del codi conjunt i dispositius |
| D03 · Accessibilitat | T5 i proves de components; manteniment del contracte de context | VoiceOver/TalkBack i recorregut complet de focus |
| D04 · Sobirania/Open Data | Auditoria distingeix ZIP generat i endpoints HTML | Col·leccions reals i restauració remota; no inferir-les de 200 HTML |
| D05 · Federació | WebFinger/NodeInfo/actor estàtics verificats | Bústia dinàmica desplegada i interoperabilitat real |
| D06 · WordPress | Banners fora dels dos ZIP, 52 proves de paquet | Versió distribuïda contrastada amb el paquet final |
| D07 · Nodes germans | Generador i prova històrics identificats al Mestre | Nova execució completa cronometrada sobre l’arbre integrat |
| D08 · Privacitat/E2EE | F7: controlador, IndexedDB, SQL, transport i reconstrucció en kits | Dipòsit/lector/UI, sessió real i revisió externa del protocol; bandera apagada |
| D09 · Notes/OKF | Canvis T0/T3 de Claude en curs | ARB-T3-01 i regressió final de publicació/selecció |
| D10 · Memòria/multimèdia | Restaurador d’identitat no equival a restaurar la llibreta | Pipeline d’àudio/fitxa/exportació/restauració complet |
| D11 · Xat rural | IAIA local útil i redactora, anònima i en proves amb sessió; adjunts provats | UUID real de servei tècnic i prova remota entre comptes/dispositius |
| D12 · Idiomes | 105 fonts guardades i 1.205 proves T5 abans del bloc T0 nou | Revisió nadiua eu/gl i passada final amb T0 |
| D13 · Botigues/PWA | MarIA informa build2 publicat; Claude prova ranures de descàrrega | Verificació independent de l’artefacte i instal·lació real |
| D14 · Governança | Blocs normatius 64 proves; manifest Node 9; heartbeat actiu | Integració de governança per executor, ledger/estat i revisió externa |
| D15 · Rendiment | Build en còpia: entrada 230.494 B gzip, sota 250.000 | Build final després de T0 i mesura en condicions rurals |

### Revisió creuada · 18:23 CET

Rebase T0 del kit Xat completat: els cinc diccionaris només hi afegixen el bloc contigu d’IDEA-61, i les tres càpsules noves de l’atles es conserven en base i payload amb merge de tres vies. **18/18 payloads ja integrats**; staging nou del viu: **2.888/2.888 en 163 fitxers**. Evidència `rebase_t0.json` i `post_t0_2888.log`. No s’ha escrit cap font principal. T5 ja integrat es conserva com a kit del seu tall, sense absorbir a posteriori els canvis dependents de T6.

Acceptat ARB-XAT-01 de Claude: els dos paràgrafs legals nous descriuen el comportament verificat de la IAIA local. El registre de frontissa de contingut no s’ha alterat ni s’ha simulat una lectura/aprovació humana. El text i el diff estan preparats i revisables; la integració funcional en verd no equival a pre-commit de governança ni a publicació aprovats.

Kit RPC F7 aplicat independentment a la còpia conjunta: **21 Vitest + 22 Postgres/PGlite**. Kit core actualitzat amb el rebuig manual restringit a A: **172 passades + una omesa**; el rebase de dos fitxers conserva les preimatges i no modifica el kit de restauració. Cap migració remota aplicada.

Continuació de Xat: ARB-T2C-01/02 reproduïts en cinc casos. Pegat en còpia per eliminar capes de menú invisibles i recuperar el focus del botó amb Escape/Arrere; també cobrix bloqueig, missatge de sistema i mode de selecció. La bateria de renders ha detectat un repintat redundant del primer corrector; s’ha eliminat evitant un setState innecessari quan el menú ja és tancat. Verificació ampliada en curs; revisió independent de fonts sense altra troballa bloquejant.

### Kits de continuació lliurats · 18:27 CET

- `261102_kit_codex_xat_menus`: quatre fitxers sobre T2c, **927/927 en 82 fitxers**, ESLint net, revisor independent sense altra troballa. ARB-T2C-01/02 corregits; no s’ha tocat el Xat viu. Inclou prova de rendiment que detectà el primer corrector redundant, focus de teclat i desaparició del menú per esborrat, bloqueig, sistema o selecció.
- `261102_kit_codex_hmr_workspace`: tres fitxers, **480/480**, prova roja abans, navegador real i revisió independent. Integrar com a correcció delimitada de T-05; no equival a S2.B completa.
- `261102_kit_codex_higiene_residus`: cinc fitxers després d’higiene base, **53/53 Node**, ESLint net, anada/tornada idempotent de **140 metadades** provada en còpia temporal. La guarda ampliada continua roja sobre el viu: **141 incidències** (140 Finder i un SQL); el kit no les amaga. Quarantena de codi principal/índex git i trasllats no executats. Cinc tombstones intencionats es conserven; candidat de secret versionat inventariat només pel nom, sense llegir cap valor. Detall per a MarIA en `coordinacio_maria.json`.

### Dipòsit i continuació F7 · 18:35 CET

`261102_kit_codex_recuperacio_diposit`: tres fitxers, **318 passades + una omesa històrica** en deu fitxers, aplicació independent en còpia. La identitat restaurada i el comprovant s’escriuen atòmicament en IndexedDB; abort després del commit conserva la veritat durable i no inventa rollback. Àrbitre: tres casos independents (abort postcommit, commit refusat, dos kids concurrents), tots reproduïts. No és una certificació física de tots els navegadors.

`261102_kit_codex_recuperacio_observacio`: sis fitxers, **46 Vitest + una frontera Postgres/PGlite**, onze proves de l’aplicador. Lectura estricta, observador passiu acotat i finalitzador que rellegix el comprovant local; cap booleà de confiança vingut de UI. Aplicació independent completada en còpia conjunta: 46/46 i frontera SQL verda (`evidencia/aplicacio_independent_root.log`). Continuen cancel·lació/SDPN i integració del consumidor; E2EE continua apagat.

Claude confirma la integració d’HMR a les 18:22 amb 480/480. Única diferència respecte al payload: comentari explicatiu, conservat sense canviar codi executable. T-06 nou: sessió penjada per HMR de Notes i pèrdua de `?ambit=` abans d’identificar-se; diagnòstic en còpia en curs.

La comprovació de tancament específica del torn documental no acredita el tancament global: detecta codi concurrent, relleus ESTAT/LEDGER pendents i una captura humana incorporada durant el torn. Les quatre àncores que faltaven al dipòsit de Claude ja s’han afegit; **SCC valid=true, zero errors**. No es desfa cap canvi concurrent ni es tanca el torn mentre continua la feina.

### Revisió a quatre bandes · 18:54 CET

Ja llegits els informes nous de Gemini (`261102_1832_auditoria_gemini`) i MarIA (`261102_1836_auditoria_maria`), a més de l'actualització de Claude de les 18:42. Hi ha revisió externa via fitxer; continua sense autenticació el nostre CLI Gemini, però això no invalida el treball independent de Gemini a l'altra sessió.

- **T-06 sessió HMR:** kit `261102_kit_codex_hmr_sessio`, tres fonts, **121/121**, ESLint net, aplicació independent en còpia conjunta. CUA amb SessionProvider i graf Notes reals: canvi Notes 2→3 conserva estat `fora` i text escrit, zero avisos/errors. La primera repetició fou contaminada per un canvi al mòdul intern i no compta com a prova de preservació. Captura i delimitació al kit.
- **T-06 àmbit anònim:** kit `261102_kit_codex_notes_ambit`, dos fitxers sobre T0, **372/372** en 25 suites, quatre regressions roges abans, onze proves de l'aplicador, revisió independent i aplicació en còpia. Conservar `?ambit=` fins al consum de l'editor evita perdre la intenció en remuntar després de login. Port de dades sintètic; no s'afirma login real.
- **Integracions confirmades:** `xat_menus` coincidix 4/4 amb main a les 18:51. El kit afegix correccions de capes invisibles i focus sobre T2c: no era redundant només perquè ja existia `useCapaEnrere`. MarIA informa aplicació de documents i manifest Node; el contrast de hashes es registra al relleu.
- **G-CAS-01 (P1, reproduït):** ambdós `verifica_i_aplica.py` de Gemini mostren avís de base divergent i igualment fan `copy2`, eixida 0. Reproducció sense dades reals a `261102_kit_codex_aplicadors_gemini/evidencia/divergencia_reproduida.json`. No s'executen sobre main. Corrector en curs amb preflight global, CAS, rollback i proves abans d'escriure.
- **G-HIG-01:** Gemini Kit2 ja coincidix amb main, però la guarda antiga declara 0 incidències on la reforçada de Codex en detecta **141**: 69 `.DS-Store` de public, 69 de dist, dos Finder de builds i un SQL de 153.315 B al canal de releases. No s'ha fet la quarantena. El residual es rebasa conservant les correccions de Gemini i el recompte segur per metadades.
- **G-DICT-01:** la matriu 10/10 de Gemini no acredita consens. D07 encara no té UI/consumidor complet ni activació, i la prova externa històrica continua omesa. El protocol vigent requerix tres fragments; l'esborrany de MarIA diu 2-de-3. Tampoc una guarda de mida de botó acredita WCAG AAA completa ni les proves de claus acrediten qualitat lingüística total. S'està preparant una redacció tècnica ajustada a evidències; no s'envia cap correu.
- **ARB-XAT-01 ampliat:** Claude reproduïx una guarda de política 2.3 roja: el text local nou necessita nova versió i migració segellada append-only. Kit tècnic 2.4 en preparació per revisió; no s'aprova la frontissa en nom de Javi ni s'aplica SQL remot.

### Onada 2 · ordre del Mestre 18:55, aplicació 19:00 CET

Nou torn de codi `torn_ceeded34-e395-4eb3-8add-2e3e8c8e24d5`, pla 1532 vinculat. Llegits prompt 1852, relleu final de Claude (T-07/Relleu5), dipòsit 00_LLEGIM i informes de Gemini/MarIA. Carril exclusiu Codex: O2-T1/T3/T5; diccionaris i paginació queden a Gemini.

- **O2-T1 integrat:** dos fitxers de `notes_ambit`, preflight global i 372/372 sobre còpia del main actual abans del CAS. Navegador :3340 anònim, després de la reconciliació: `/notes?ambit=vehicle&carpeta=f-mur`, «Connecta per veure les teues notes», zero avisos/errors. Captura `notes_ambit/evidencia/notes_ambit_main.jpg`. El primer tab s'havia carregat abans d'acabar l'aplicació i no es compta com a verificació del nou codi.
- **O2-T3 integrat:** tres fonts de `hmr_sessio`, 121/121 sobre el main actual abans del CAS. NotesContext i SessionContext ja importaven contextos estables: la causa reproduïda era recrear fase/promesa d'arrencada en reavaluar host.js. S'ha mogut eixe estat a `hostEstatIntern.js`; no es duplica una separació ja existent ni es resol una renovació de JWT prematurament. Prova dedicada `tests/host.hmr.test.js` i CUA 2→3 en laboratori net.
- **O2-T5 en curs:** NotesSection i regla `primerElementTriable` del workspace han d'anar juntes per resoldre la prova ARB-T3-01, preservant nota preparada explícita, carpetes buides, ordre de nom/data i càrrega parcial. Construcció en còpia, després arbitratge independent i integració delimitada.

El Mestre confirma la restauració de legal 2.3, rotació d'ESTAT i aplicació dels lots de MarIA: es preserven. La proposta tècnica 2.4 es prepara només al satèl·lit i no forma part d'Onada2 ni toca la frontissa viva. La cancel·lació F7 ja té aplicació independent: 26 Vitest + frontera SQL, quatre casos adversarials externs i onze de l'aplicador; encara sense consumidor d'amics SDPN/alarma i sense activació.

### Contrast independent d’Onada 2 i continuació · 19:17 CET

O2-T1 també contrastat en navegador amb el diàleg real, no només amb una sonda Vitest: la porta anònima conserva `/notes?ambit=vehicle&carpeta=f-mur` i l’inclou en `?tornar=` d’entrada. La sessió pilot local aterra al perfil per l’ordre explícita de 261002 implementada en `rutaEntrada.js`; no s’ha alterat eixa regla ni s’afirma retorn automàtic després de login. Obrint la mateixa URL amb el pilot, el diàleg «On es publica?» té «Compartir cotxe» triat i només aleshores desapareix `ambit`. Captura `261102_kit_codex_notes_ambit/evidencia/notes_ambit_dialog_pilot.jpg`; cancel·lat sense desar ni publicar. Sessió sintètica local, no autenticació Supabase real.

Les vistes Viatges, Treball i Habitatge han carregat els seus estats buits; Xat anònim ha respost amb una guia útil a «Com publique un viatge per compartir cotxe?». Zero avisos/errors de consola en eixe recorregut. La guarda de disseny posterior a T1/T3: **3.028 fitxers, zero crítics i zero avisos**. O2-T5 encara en arbitratge abans de la seua integració.

**G-CAS-01:** wrapper segur lliurat a `261102_kit_codex_aplicadors_gemini`, revisat per root i **20 proves adversarials repetides independentment**. Conserva els dos originals i fixa manifest, hashes i abast; divergència fatal abans de tocar fonts, proves obligatòries en còpia, CAS i rollback que respecta canvis aliens. El perfil d’higiene és només lectura i remet al residual rebasat. La integritat del wrapper no aprova el payload UX antic: la seua verificació en staging detecta cinc fallades de claus davant les claus noves d’O2-T2, i la preimatge viva d’IAIA també divergeix per L3-A5. No s’ha reexecutat el kit antic sobre main ni s’han substituït diccionaris de Gemini.

**F7 material:** `261102_kit_codex_recuperacio_material`, quatre fitxers, **345 passades + una omesa històrica**, 27 casos nous i onze proves de l’aplicador. Aplicació independent de root completada en còpia conjunta (`evidencia/aplicacio_independent_root.log`). Pins verificats, material xifrat durable, versions monòtones, tombstones i relectura posterior a criptografia contra revocació concurrent; la notificació després del commit conserva la veritat durable. No acredita frescor inicial del servidor ni atomicitat entre servidor i IndexedDB. Ports de cercle/aprovacions i consumidor UI continuen pendents; E2EE apagat.

### Revisió creuada del lot Gemini O2 · 19:20 CET

Llegida l’ampliació de Gemini de les 19:12: accepta la correcció dels menús, el llindar F7 de tres fragments i la distinció entre proves locals i desplegament. La matriu torna a numerar les dimensions amb significats diferents del pla canònic; no és una certificació comparable de D01–D15 ni consens de quatre bandes. Es conserva la correspondència del nostre quadre, sense transformar pendents en una nota màxima.

**AUD-O2-T4-01 (P2, reproduït):** el nou `SeccioVertical` atura la cerca quan no canvia la longitud/primer/últim ID de `sortedFeedPosts`. Però `MurContext` filtra persones bloquejades abans de lliurar eixa llista: una pàgina vàlida pot avançar cursor sense afegir cap element visible. Prova independent en còpia: **22 verdes de Gemini + una roja nova**; la fitxa de la pàgina següent no arriba i es mostra un buit fals mentre `hiHaMes` és cert. Reproducció a `261102_kit_codex_revisio_gemini_onada2/evidencia/`; cap font de Gemini modificada per root.

**G-CAS-01, correcció parcial:** el nou aplicador Gemini bloqueja divergències de base abans de `--apply` sense `--force`. Encara escriu tots els fitxers amb `copy2`, sense CAS immediat per fitxer ni rollback, i `--check` divergent no retorna error. Els originals han canviat des del wrapper fixat: el wrapper anterior els rebutja correctament per hash, no cal relaxar-lo. No s’acredita encara l’aplicador nou com equivalent al CAS provat de Codex.

**O2-T5-AUD-01:** la revisió independent ha detectat cerca inicial sense coincidències → netejar cerca → llista sense selecció. Corregit en còpia preservant nul explícit i modes sense autotria. Mentrestant un executor extern ha integrat el tall anterior de 873 proves al viu; root i constructor no han fet eixa escriptura. Es prepara un corrector incremental contra els hashes intermedis exactes, amb validació renovada abans del CAS. Encara no es declara O2-T5 tancat.

### Millores Proactives Reversibles Aplicades

Heartbeat `p1-22-xat-iaia-idea-62-revisi-30m` **eliminat per ordre explícita final del Mestre**, amb confirmació `deleteStatus: deleted`. Subagents interromputs i cap cicle nou iniciat. El Mestre confirma la integració d’Onada 2 per MarIA i trasllada la continuació al xat del Teler Invertit (Onada 3). Queden traspassades les troballes O2-T5-AUD-01 i AUD-O2-T4-01 anteriors: corrector incremental de la primera a `261102_kit_codex_notes_tria_aud01`, encara sense aplicació de root ni verificació final acreditada al moment de l’aturada; reproducció de la segona a `261102_kit_codex_revisio_gemini_onada2`. La confirmació del tall 873/873 no inclou aquestes dues proves noves.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- 17:03 CET: revisió creuada dels canvis nous T2/T3 de Claude: `pilaEnrere.test.js` i `workspaceState.test.js`, **33/33**. El filtre WorkspaceContext.test.jsx no existix en eixa ruta i no s’inclou en el recompte. Vite emet tres avisos d’anàlisi estàtica d’importacions dinàmiques dels plugins; no són errors de la suite ni equivalen a una comprovació de consola del navegador.
- 17:07 CET: hashes dels 29 payloads T5 i 6 IDEA-62 revalidats independentment. Aplicadors reforçats per a verificar en còpia abans de qualsevol aplicació.

- Porta Olivera inicial: codi 0; safata buida i documents vius ancorats. Cap trasllat ni esborrat.
- Tres carrils Codex en execució: i18n, Xat/IAIA i higiene/Fediversity. Proves provisionals: T5 607/607; IAIA local 6/6; higiene 52/52. Validació final i kit encara en curs.
- IDEA-48: primer mòdul pur de transicions en còpia aïllada, 35/35 proves de caducitat, SAS, gestos, disputa i errors. És una peça del flux, no recuperació activa.
- Producció Fediversity: host-meta, WebFinger estàtic, nodeinfo i actor real verifiquen 200 i tipus correctes. /opendata/municipi.jsonld i /opendata/manifest.json tornen 200 amb HTML SPA; /ap/actor i WebFinger dinàmic són 404. Evidència del carril higiene al kit.
- Automatització creada amb estat ACTIVE, cadència 30 minuts.
- Fonts llegides: AGENTS.md; ESTAT_ACTUAL; acta 261102_1456; pla i prompt 261102_1532 íntegres. Llibre Mestre: context i files rellevants; les files llargues restants encara no s’han llegit íntegrament. No s’infereix consens d’una lectura parcial.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

**Deute del generador documental:** correcció preparada i verificada en `261102_kit_codex_documents` (64 proves); MarIA confirma la integració principal a les 18:55. En el prompt Gemini nou els blocs s’han restaurat directament de la plantilla viva, conservant les seccions.

Al tall inicial no hi havia informes nous. A les 17:02 CET s’ha llegit íntegrament 261102_1640_auditoria_claude.md; confirma rutes obsoletes i banners. Gemini encara sense informe nou. La revisió de Claude via fitxer sí està disponible encara que el CLI independent no tinga autenticació. Gemini CLI 0.66.0 descarregat a /tmp/sdp-codex-gemini-cache (sense instal·lació global). Invocació real amb model sol·licitat gemini-4: eixida 41, no hi ha mètode d’autenticació configurat. Claude Code 2.1.296: auth status loggedIn=false. Cap dels dos CLI nostres no ha executat revisió remota. Els informes independents de Gemini i MarIA han arribat després (18:32/18:36) i ja es contrasten en esta auditoria. El model gemini-4 tampoc s’ha pogut validar perquè falla abans en autenticació. La revisió externa via fitxer sí consta des del tall de les 18:54; les seues conclusions no es donen per correctes sense contrast. Tampoc es pot modificar ni acreditar la quota/model d’una sessió amb les eines disponibles.

Javi remot requerix l’UUID verificat de servei tècnic; el nom visible no identifica un compte de manera segura. Producció, dispositius reals, integració de kits i les dimensions D01–D15 no estan certificats en este tall. `requires_human_decision: false` per al treball local autoritzat; cap petició de confirmació intermèdia.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
