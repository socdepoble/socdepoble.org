---
type: informe
status: esborrany
description: Auditoria vespertina T1–T6 en lectura, amb P1 de cobertura social, proves pròpies, DAFO i quinze dimensions provisionals.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_ff3c4daf-d7fa-4faf-88fb-8ab7d3dbfb11:662137b9-5188-4bb1-9d83-2070b4025171
---
# Auditoria vespertina Codex: verificació preproducció T1–T6

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ff3c4daf-d7fa-4faf-88fb-8ab7d3dbfb11:662137b9-5188-4bb1-9d83-2070b4025171 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T20:25:40.857Z |
| Modificació | 2026-10-30T20:41:01.341Z |
| Propietari | codex |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | GPT-6 (Codex); variant Sol/Astra no exposada per l'entorn |
| Tokens consumits | Mètrica no disponible en este entorn |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-30, inici aproximat 21:10 Europe/Madrid: lectura del prompt vespertí i reconeixement.
- 2026-10-30T20:13:52.290Z: torn documental nou; els torns antics havien caducat.
- 2026-10-30T20:25:40.857Z: esborrany creat pel circuit context → create, amb rebut persistent i àncora.
- 2026-10-30T20:36:36.306Z: contrast independent acabat; redacció del resultat, DAFO i matriu vespertina; el pla 261029_1605 queda vinculat sense editar-lo.
- 2026-10-30T20:41:01.341Z: document, Llibre Mestre i índex validats; limitacions de Plantilla Viva i clausura registrades. Pestanya temporal tancada, viewport restablit i verificadors acabats.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte i abast

**BLOQUEJAT PER P1 (llista tancada: QA-VES-01, cobertura social de 18 rutes públiques).** No s'ha confirmat cap P0 nou. El codi de T1–T5 supera les ordres exigides; això no resol l'omissió transversal de T6 ni certifica tots els deutes externs del sistema.

El bloqueig és funcional per a este llançament a xarxes: el requisit T6 exigix portada pròpia també en l'HTML servit sense JavaScript. No és una vulnerabilitat de seguretat ni una predicció sobre una plataforma social concreta. Un segon verificador ha refutat els candidats abans d'acceptar la llista. Es proposen correccions perquè les aplique el carril de codi; esta auditoria no les aplica.

Arrel auditada: `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`. HEAD observat: `d6ab025f41933d3d3b91cbe3c332cb7cecf53172`, amb canvis de treball de Claude. S'audita el contingut a disc, sense atribuir totes les diferències de Git exclusivament a les últimes hores.

### Mètode, fronteres i lectura

S'han aplicat les sis fases del prompt: reconeixement de superfícies; caça per superfície/frontera/classe; validació de principal i resultat; deduplicació; refutació independent; informe amb correcció al punt de decisió. La cerca s'ha tancat abans de completar les lectures finals, el contrast, les portes i el lliurament, reservant-hi el tram final de treball. No s'ha iniciat cap recurrència.

| Superfície | Frontera contrastada | Resultat propi |
| --- | --- | --- |
| Workspace i Notes | amplada CSS/JS, estat inicial i diana del divisor | Mesures DOM a 720, 721, 761, 1023, 1024 i 1440 px; cap desbordament exterior observat. |
| Govern local | petició HTTP, lector de fitxer i procés Git | Allowlist de GET/loopback, fitxer regular, ordres amb arguments; 24 proves Node aprovades, una integració impedida pel sandbox. |
| Visor | recurs públic vs. handle local, URL opaca/signada i portapapers | Guardes i proves en verd; cap URL local elegible per a copiar. |
| Imatges | bytes originals, manifest i mesura de píxels | 55 imatges amb hash correcte i mesures recalculades; una excepció coneguda de marc complet. |
| SEO | portada del client vs. manifest públic vs. HTML servit | Manifest pur de 111 rutes/9 àlies; 18 rutes públiques amb portada absents; portada Wiki genèrica. |
| Governança | regla viva vs. segell i Ledger | Frontissa 16/16, segell i signatura vàlids; discrepàncies documentals identificades. |

Lectura íntegra **distribuïda entre els quatre agents d'este torn**, no una afirmació de lectura personal de cada byte per part del corredor principal: els 18 Markdown inicials de primer nivell de l'Escriptori es repartiren entre els verificadors; el Llibre Mestre es llegí en els trams 1–370, 371–740 i 741–1112. La versió inicial tenia 385.116 bytes i SHA-256 `fbc7870e244e5c20343cf154ec5d5eb7f7fdfd431a39e9f8478c65574c1b8885`. Després de la inserció concurrent de Gemini es rellegiren els trams entrants i el bloc nou; abans d'esta anotació tenia 389.268 bytes, 1127 línies i SHA-256 `ef8218f00b78e40af5f7fffa6315e6c84f2d3cc25ea985e348259c956f81a0fa`. El corredor principal ha llegit íntegrament el nou informe Gemini 2114 (33.139 bytes, SHA-256 `793043e752f8976e80afe1357b54beae7195260e725dee8dad11a377d647bb98`) i ha contrastat les seues conclusions amb el codi.

També s'han llegit AGENTS, Genotip, índex mestre, taxonomia, skill de seguretat i plantilla d'auditoria. El contracte de graella de la zona humana s'ha llegit per l'autorització expressa T1; no s'han obert els altres originals protegits de Producció. No s'ha tractat cap hash com a prova de comprensió.

### Troballes confirmades

#### QA-VES-01 · P1 funcional · Cobertura social pública incompleta

**Principal i resultat:** qui compartix una de les 18 pàgines públiques té una portada pròpia en el client, però el productor vigent no emet el seu head específic per al prerender. La frontera fallida és l'inventari de rutes públiques que passa al generador d'HTML.

**Evidència:** [tooling/seo/build-social-manifest.mjs:274](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/seo/build-social-manifest.mjs>) només construïx candidats de SYSTEM_PAGES i seccions de text; els altres bucles cobrixen llistes, llavors, documents Wiki i snapshot de publicacions. [tooling/seo/prerender-social.mjs:251](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/seo/prerender-social.mjs>) recorre exclusivament les claus i àlies del manifest. L'API pura, amb `estricte:true` i sense escriure cap eixida, ha retornat 111 rutes i 9 àlies, SHA-256 del manifest `53132eb50f211586c970210536a88aa86f9fe43eb895714c07e81618c726d1eb`; cap de les 18 rutes següents hi és, tampoc com a àlies.

| Grup | Rutes afectades, llista tancada | Font que prova portada i accés |
| --- | --- | --- |
| Huit presentacions de plugins | /plugin/mapa; /plugin/vehicle; /plugin/animalets; /plugin/gestoria; /plugin/rebost; /plugin/salut; /plugin/rss; /plugin/tpv | [src/sections/plugins/PluginPage.jsx:218](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/plugins/PluginPage.jsx>) registra imatge; :233 pinta portada; [src/sections/plugins/registrePlugins.js:236](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/plugins/registrePlugins.js>) registra les huit; App.jsx:1068 les munta sense RequireAuth. |
| Huit pàgines informatives | /page/publicar_mur; /page/publicar_mercat; /page/publicar_calendari; /page/publicar_mapa; /page/vehicle_compartit; /page/animalets; /page/treball; /page/habitatge | [src/sections/text/pageContent.js:361](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/text/pageContent.js>) i entrades successives fins :436; [src/sections/detail/PageDetailSection.jsx:106](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/detail/PageDetailSection.jsx>) resol el copy públic. |
| Dues pàgines informatives addicionals | /page/notes; /page/wikidepoble | [src/sections/text/pageContent.js:130](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/text/pageContent.js>) i :191; navigation.js:12 no les redirigix; systemPages.js:125 les deixa visibles en web. |

El navegador ha confirmat portada SEO, títol i canonical propis de /plugin/mapa, /page/publicar_mur, /page/notes i /page/wikidepoble. Estes dues últimes són presentacions públiques; no són les notes privades de /notes ni un duplicat comptat com a àlies.

**Canvi mínim recomanat:** incorporar al productor un inventari explícit de les 18 presentacions públiques, amb les mateixes funcions de metadades i filtres de publicació del client. Afegir una comprovació de cobertura que compare este inventari amb rutes/àlies i valide el head HTML resultant. No exportar dades de les apps privades ni iterar indiscriminadament totes les claus de PAGE_COPY.

**Validació d'acceptació:** les 18 claus o els seus àlies canònics han d'existir; cada HTML ha de tindre imatge pròpia igual en og/twitter, summary_large_image, títol, descripció i canonical correctes. Les exclusions de Notes, Xat i Govern privats han de continuar vigents. `requires_human_decision:false` per a esta correcció de cobertura ja exigida.

#### QA-VES-02 · P2 · La portada de la llista Wiki no arriba al SEO

[src/sections/wiki-de-poble/WikiDePobleSection.jsx:393](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/wiki-de-poble/WikiDePobleSection.jsx>) llig el copy i :401 pinta la portada pròpia. En canvi, [src/sections/wiki-de-poble/seoWiki.js:107](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/wiki-de-poble/seoWiki.js>) retorna la metadada de llista sense image i [tooling/seo/build-social-manifest.mjs:295](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/tooling/seo/build-social-manifest.mjs>) força image:null. El DOM de /wikidepoble i el manifest pur mostren la imatge genèrica, encara que la portada visible és portada_genotip.png.

**Canvi mínim recomanat:** passar eixa portada pel selector social compartit al client i al productor; provar la mateixa URL og/twitter en les dues eixides. Conservar la política específica dels documents ?item= i la decisió vigent de canonical del fitxer HTML compartit entre consultes. `requires_human_decision:false`.

#### QA-VES-03 · P2 documental · El prompt descriu contractes que ja no són els del codi

No s'ha demostrat una regressió de producte per estos desajustos, però impedixen donar per acreditades les mètriques literals exigides:

- [_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md:10](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md>) encara diu 720/1090 en prosa. El JSON canònic i graella.js fixen 720/900/1023, i Workspace amb columnesFixes passa directament a ample per damunt de 720.
- El prompt demana 13 H3/114 H4, però [src/sections/consola/IndexConsola.jsx:117](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/consola/IndexConsola.jsx>) posa els membres de família en LI i :137 només els fills directes en H4. La instantània carregada de .sdp-consola__index ha donat **13 H3, 61 H4, 10 LI i 0 IMG**; una lectura inicial mentre arribaven fonts donava 13/56/0. 114 H4 no és invariant vigent ni prova de cobertura de dades.
- [src/css/modules.css:11825](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/modules.css>) documenta els set blocs reals: pecesApps, catalegColleccio, alergens, tpv, UniversalListCard, AdjuntXat i ConsultaIAIA. Conserven **@layer components**, coherent amb [src/css/index.css:45](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/css/index.css>). El nom del fitxer modules.css no significa que existisca una capa modules; crear-la canviaria la cascada.
- La skill física core-seguretat-audit acaba en §6 i Vincles; la §7 Cloudflare anunciada pel prompt no hi és. Els sis passos sí estan en el mateix prompt i s'han aplicat.
- Els segells reals són .agents/LEDGER.md i .agents/SKILLS_SEAL.json; les rutes .agents/governance/ citades en T4 no existixen.

**Canvi mínim recomanat:** reconciliar les frases del prompt i la prosa del contracte amb les fonts executables, i generar els recomptes de l'índex des de les dades actuals. La incorporació de doctrina a una skill ha d'anar pel seu carril formal i segell; no s'ha tocat eixe carril ací. `requires_human_decision:false` per a corregir citacions; qualsevol canvi del contracte visual requerix valorar-lo com a canvi separat.

### Verificació dels blocs T1–T4

| Bloc | Evidència empírica i conclusió |
| --- | --- |
| T1 · Llindars | Notes amb arrencada nova: a 720, document/content=720 i cap divisor; a 721, columnes 56/300/365 i document/content=721; a 761, 56/300/405 i document/content=761. A 1023, rail esquerre de 56; a 1024, CARPETES oberta (aria-expanded=true); a 1440, 270/300/610 dins de workspace de 1180. Cap desbordament exterior. La ferramenta IAB tenia escala 1,2: es registren amplades CSS efectives, no les dimensions físiques sol·licitades. |
| T1 · Icones i A2 | La icona esquerra crida onReplega; els tests de la suite ho cobrixen i s'ha activat en Notes. Divisor central top=64/bottom=900. Hit testing a y=80,110,150,250,450,850: x−2 retorna el divisor en tota l'alçada. A y=80/110, x+2/+6 retorna bar-blue; a la resta, el divisor. **Accessible en tota l'alçada per l'esquerra; la diana dreta no queda completament lliure de la blava.** No s'eleva a defecte funcional perquè no hi ha cap alçada inaccessible. |
| T2 · Consola | CSS amb sòl de 22,5rem/360 px i min(100%,…), targetes flex amb peu al final, títols sense partició forçada de paraula. Índex sense IMG. El DOM carregat i els tests confirmen estructura; el recompte literal 114 H4 queda reconciliable segons QA-VES-03. No s'extrapola «zero lletres òrfenes» a tots els idiomes/amplades sense mesurar-los. |
| T2 · Govern | GET viu consumit per la pàgina de certificació: 86 files totals, 26 fetes i segellades, 18 parcials, 20 pendents i 22 obsoletes. No són 86 files FET ni 60 tasques acabades sense segell. Les quatre subpàgines compartixen useGovern. Endpoint GET/loopback, fitxer regular, Git amb execFile/arguments, errors sense camins; no entrada HTTP usada com a ruta de fitxer. El control de Host de Vite precedix els hooks. |
| T2 · Portades | Quatre il·lustracions diferents, cada una amb JPEG/WebP, 1024×1024; identitatImatges i les proves passen. El verificador ha contrastat hashes/mides i que no són quatre còpies de la mateixa portada. |
| T3 · Enllaços | enllacPublicDe (panellDeLaFoto.js:155–173) rebutja id local __, referència opaca, blob/data/file, camí de disc, credencials i recurs alié fora de la forma pròpia resolta. Visor només oferix còpia quan hi ha enllac. Proves de seguretat, i18n i compositor del visor en verd; portapapers real/Finder no invocats. |
| T3 · Vores i Gestoria | Hashes de les 55 imatges coincidents. Recalculades amb Pillow les quatre bandes de cadascuna: zero diferències respecte al manifest. Única imatge amb quatre vores/filets: fedivers_vinyeta.webp, excepció explícita a voresImatges.test.js. Gestoria plugin actual és 480×480 i té els mateixos bytes que HEAD; nano actual és 1024×1024 i representa **un dibuix diferent**. No s'ha acreditat una pèrdua nova del 20% per l'esquerra ni autoritzat substituir una il·lustració per l'altra. |
| T4 · CSS i governança | Set fitxers CSS retirats s'han integrat a modules.css dins de components; MapaFotografic conserva el CSS inline per la frontera de Leaflet. Frontissa=16/16, fediversity inclosa; Ledger i segell vàlids. WebFinger/host-meta s'emeten al build, no cal duplicar-los a public/.well-known. Firebase declara rewrites i MIME/CORS; l'efecte desplegat continua pendent d'HTTP real. |

### Observacions opcionals, sense bloqueig

**QA-VES-M01 · Fila d'enllaç als visors compartits.** El comportament està demostrat, però és un compromís editorial, no una fuga: [src/sections/multimedia/VisorDeLArxiu.jsx:221](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/multimedia/VisorDeLArxiu.jsx>) passa origen sempre; filesDelPanell:238–245 crea una fila amb text quan no hi ha URL. [src/sections/profile/DetallMultimedia.jsx:586](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/sections/profile/DetallMultimedia.jsx>) omet només poble/publicat i :1067 reutilitza el visor; VisorDePublicacio.jsx:438 també el compartix. Si es vol reduir soroll en perfil/publicacions, ometre enllac només quan no hi ha URL elegible, mantenint les URL /assets vàlides i el missatge explícit en l'Arxiu. No és cert que tots els visors diguen sempre que no hi ha enllaç.

**QA-VES-M02 · Diana del divisor.** Si el Mestre vol també tota la franja dreta lliure a l'altura blava, reservar una franja exclusiva al seu límit, fora dels botons, i elevar només eixa franja. No elevar tot el pseudoelement sobre els controls; afegir hit testing de divisor i botons. La franja esquerra ja permet arrossegar en tota l'alçada.

### Matriu de SEO i compartició

En el DOM comprovat, og:image i twitter:image coincidixen, twitter:card és summary_large_image i hi ha títol/descripció. En desenvolupament el canonical reflectix localhost; el manifest es calcula amb https://socdepoble.org. No es presenta un canonical de desenvolupament com una URL de producció.

| Família de rutes | Client / DOM | Manifest i prerender | Estat |
| --- | --- | --- | --- |
| /mur, /mercat, /pobles, /calendari, /multimedia, /poblacio | Metadades de secció; targeta genèrica configurada. Les llistes no declaren una portada pròpia de pàgina com les fitxes. | Sis LLISTES, build-social-manifest:59–65/297–299, mateixes claus i reserva. | Coherent per a llistes; no es confon cada imatge de targeta amb una portada global. |
| /events/:id, /mercat/:id, /pobles/:id i /mur/:id públic | Selector social de detall; primera imatge pública elegible. | Llavors o snapshot públic explícit, metadadesDeDetall; no notes privades. | Font contrastada; no s'han triat publicacions privades per omplir snapshots. |
| /fediversity → /page/fediversity | DOM comprovat: fediversity-hero-social-1200x630.jpg; títol/descr./canonical propis. | Entrada pròpia i àlies /fediversity. | Conforme en la prova local. |
| /projecte, /constitucio, /anima, /versions | DOM comprovat: hero_panoramic_rural_view…, nano_mixa_socis…, nano_anima_mas… i forensic_psychiatry_ai…, cadascuna amb variant social pròpia. | Mateix selector de pàgina i variants. | Conforme en font i DOM. |
| /roadmap, /legal, /fedivers | Selector social del TextSection. | Entrades pròpies amb la mateixa política; /fedivers conserva una vora coneguda en l'actiu. | Font contrastada; no es presenta com HTTP de producció verificat. |
| /page/consola, /page/cervell, /page/xat, /page/drets-autor, /page/descarregues | Presentacions informatives amb portada. | Incloses per SYSTEM_PAGES; /descarregues té àlies. | Fonts compartides correctes. |
| Huit /plugin/* de QA-VES-01 | Imatge pròpia; DOM /plugin/mapa comprovat. | Absents. | P1 de cobertura, llista tancada anterior. |
| Deu /page/* de QA-VES-01 | Imatge pròpia; DOM de publicar_mur, notes i wikidepoble comprovat. | Absents, sense àlies. | Mateix P1; no es compta com deu defectes diferents. |
| /wikidepoble, llista | Portada visible pròpia, SEO genèric comprovat. | Image:null. | P2 QA-VES-02. |
| Documents públics de Wiki | seoWiki/SOCIAL_IMAGES segons document públic. | Mateixa funció i forma de camí per compartir ?item=. | Canonical SSR de la llista té excepció expressa per servir consultes; no es declara defecte separat. |
| Perfils públics /gent, /empresa, /grup, /ajuntament i àlies | PerfilPublicSection.jsx:435–443 **sí passa hero/avatar** i index només quan publicat. | No s'ha trobat un productor d'actors públics equivalent al snapshot de publicacions. | needs_validation NV-03, sense severitat: comprovar perfils publicats reals i política de projecció abans de publicar dades. |
| /consola i quatre /consola/govern/* | Subpàgines amb portada; DOM de certificacio comprovat, og/twitter amb govern_certificacio_nano_card.jpg i noindex. Arrel amb reserva genèrica. | Excloses coherentment: App.jsx:1040–1041 exigix superadmin fora de DEV. | No és una omissió de pàgines públiques. /page/consola és la presentació pública separada. |
| /disseny, /skills i altres eines marcades com privades per SEO | Política noindex; Disseny té portada en el catàleg. | Excloses de publicSeoRoute. | NV-04: decidir quina presentació ha de ser compartible abans de llevar l'exclusió. |
| /notes, /xat, perfil propi i eines personals | Noindex, sense canonical públic. | Excloses. | Correcte; no confondre amb /page/notes. |

El render dels camps és a [src/hooks/seoHead.js:141](</Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/src/hooks/seoHead.js>) i el servidor a tooling/seo/social-edge.mjs:100–125. No s'han assumit límits universals de 300 KB ni una prohibició universal de WebP de WhatsApp a partir de l'informe alié; no s'han provat els crawlers externs.

### Contrast amb Gemini 2114 i amb els relleus de Claude

Coincidència en portes, nombre de proves Vitest, contracte 720/721, portades i separació de dades locals. La troballa antiga de traducció de dades de Consola s'ha corregit: les pàgines passen traduccio=false; no es torna a obrir com a incident.

No adopte el 9,89 global ni el veredicte APTE de Gemini perquè el mateix informe declara llacunes en un criteri T6 obligatori i perquè utilitza una altra correspondència D01–D15. El P1 ací queda restringit a les 18 rutes públiques demostrades, sense convertir Govern privat en contingut públic.

Correccions concretes a la lectura de l'informe alié, sense editar-lo:
1. PerfilPublicSection.jsx:435–443 ja passa image:hero/avatar; la proposta de Gemini basada en :36–41 està desfasada.
2. El visor actual té 230 línies; no hi ha el bloc :307–325 ni els helpers esElementLocal/construeixFitxaDeLaFoto citats. Els helpers reals són enllacPublicDe/filesDelPanell.
3. Els set CSS reals i la capa components són els descrits dalt, no la llista de fitxers ni layer(modules) afirmats en l'informe.
4. 86 és el total de files de Govern, no el total de FET; 60 és 18+20+22 amb estats diferents. Segellar-les totes com a acabades seria incorrecte.
5. Gestoria nano i plugin són escenes diferents. No és conservador regenerar una automàticament a partir de l'altra per un percentatge no acreditat.

### Comprovacions pendents: needs_validation, sense severitat

| ID | Límit real | Validació humana o d'entorn exacta |
| --- | --- | --- |
| NV-01 | Una prova Node d'integració amb servidor nou no pot fer listen al sandbox. | Executar node --test tooling/vite/consola-iaia.test.mjs tooling/brain/fonts-govern.test.mjs en l'entorn local amb permís de bind; exigir 25/25. El GET del Vite existent s'ha vist funcionar en la UI, però no substituïx aquella prova. |
| NV-02 | WebFinger/Firebase, ActivityPub, Nix i plataformes mòbils externes. | En un desplegament autoritzat, validar HTTP/MIME/CORS de compte conegut/desconegut i host-meta, descoberta des d'un consumidor federat, build Nix reproduïble i arrencada real. No s'ha desplegat ni fet seguiment/federació real ací. |
| NV-03 | Projecció SEO de perfils públics. | Triar un perfil amb publicat=true, comprovar portada i resposta sense JS amb usuari anònim; definir una projecció només de camps consentits. Mai usar un perfil privat com fixture públic. |
| NV-04 | Política de publicitat de /disseny i qualitat de targetes en serveis socials. | Acordar quina ruta informativa és pública; provar un URL canari en els verificadors/cachés de compartició de cada servei, després de corregir P1, sense deduir suport per mida/format només del codi local. |
| NV-05 | Files històriques, caducitat 24 h i art de Gestoria/Fedivers. | Revisar cada fila pendent/obsoleta amb evidència pròpia; no marcar FET en bloc. El llindar actual és >24 h des del mtime del Llibre (matriuGovern.js:79/222–240), amb marge futur de 5 min; decidir si eixa política és la desitjada. Per al retall 20%, aportar l'original concret autoritzat i aprovar la composició; no substituir dibuixos diferents. |
| NV-06 | Accés real a RLS, revocacions històriques, serveis de traducció, natius i portapapers. | Acreditar en canari/entorn real les polítiques remotes i credencials que el Llibre encara dona pendents; provar oblit/Finder i push/logout quan s'endollen. Les proves locals amb transports falsos no acrediten eixes operacions. |

### DAFO global

| Debilitats | Amenaces |
| --- | --- |
| Inventari social incomplet i portada Wiki perduda. Contractes i mètriques narratius divergents del codi. Deute de vocabulari/disseny tolerat per línia base. Evidència de plataforma real incompleta. | Canvis de proveïdors gratuïts, cachés/crawlers i política de botigues. Evicció/permís d'emmagatzematge al navegador. Arbre de treball mutable i certificacions interpretades amb més abast del que proven. Riscos remots històrics encara sense evidència de tancament en este torn. |

| Fortaleses | Oportunitats |
| --- | --- |
| Port neutral i dades segregades; arquitectura Model B explícita. Proves d'oblit i neteja de buffers; controls de URL local. Graella comprovada als llindars. Govern llegix dades reals i diu quan no pot verificar-les. Portes, Ledger i segell comprovables. | Generar cobertura social des d'un inventari únic i comprovar-la en CI. Reutilitzar la projecció pública per a portabilitat/federació sense dades privades. Convertir el canari Fediversity en demostració de metadades, exportació i instal·lació verificables. Reconciliar el vocabulari de governança amb evidència, no amb una xifra de consens. |

### Les quinze dimensions de l'esquema vespertí

**Escala de judici tècnic provisional, no percentatge de producte acabat ni certificació:** 5–6 indica evidència local parcial; 7, contracte i comprovacions locals amb integració pendent; 8, diverses fronteres i comprovacions independents; 9, recorregut principal verificat amb deute acotat; 10 requeriria també totes les comprovacions integrals/natives/remotes aplicables. Les mitges unitats expressen el judici dins d'esta escala. No es calcula una mitjana global de dimensions heterogènies ni es confonen notes amb mesures de rendiment.

S'usa exactament la correspondència D01–D15 del prompt **1946**, diferent de la matriu antiga d'IDEA-57; no es traslladen notes entre codis amb significats diferents.

| Codi i dimensió | Nota /10 | Evidència pròpia disponible | Deute i acció concreta cap al 10 |
| --- | --- | --- | --- |
| D01 · Arquitectura Pedra Seca / Model B | 8,0 | Port backend neutral, Frontissa 16/16 i tractor de coherència sobre 2964 fitxers; Workspace desacoblat. | Resta la prova amb captures reals Sollutia i canari del port. Executar kit de conformitat amb l'adaptador i fixtures autoritzats, sense injectar backend a l'amfitrió. |
| D02 · Disseny, 3 columnes i WCAG AAA | 8,5 | DOM als sis llindars, proves de Workspace/Notes, icones i divisor operatius. | Mètriques H4 i prosa per reconciliar; diana dreta limitada a la blava. Validar zoom, focus i lector de pantalla real; no s'ha certificat WCAG AAA integral. |
| D03 · Xat i E2EE | 7,5 | Contrast addicional de zeroització/èpoques i oblit de SessionContext aprovat. | No s'ha reexecutat tot el ratchet ni una conversa xifrada entre dos dispositius reals. Provar eixida/retorn/rotació amb adjunts en canari abans d'activar funcionalitats pendents. |
| D04 · Multimèdia i fitxers locals | 9,0 | Suite extensa, guardes d'enllaç/oblit, 55 imatges recalculades i ús de URL resolta en visor. | Selector natiu i permisos persistents no exercitats. Fer la prova humana de carpeta, denegació, desat i logout; decidir la fila opcional compartida. |
| D05 · Gestoria Autònoma | 7,0 | Prova de privacitat inclosa en el contrast addicional; fronteres de dades personals documentades. | No s'ha exercitat tota la gestió fiscal ni cap enviament real. Validar un flux complet amb fixtures de factures fictícies i polítiques d'accés, sense presentar-ho com assessorament fiscal verificat. |
| D06 · Mercat i TPV | 7,0 | Proves locals de tiquet i cobrament aprovades; font de detall públic usa filtre social compartit. | No s'ha comprovat cobrament amb dispositiu/operador real ni tot el catàleg del Mercat. Validar torn, devolució i tancament amb dades de prova i sense transaccions econòmiques reals. |
| D07 · Mur i Mapa Fotogràfic | 7,0 | Projecció només de publicacions públiques, coherència global i excepció CSS Leaflet identificada. | Falta recorregut del mapa en navegador/sensors i publicació remota. Provar geolocalització/EXIF consentida i evitar divulgar dades privades en snapshot. |
| D08 · Pobles, Comunitat i Fedivers | 7,5 | Generador/hosting en codi, prova Firebase WebFinger del contrast aprovada; no hi ha fallback SPA del namespace conegut en la configuració. | HTTP real, descoberta federada i canvi de servidor pendents. Validar NV-02; no confondre actor/outbox de lectura amb federació bidireccional completa. |
| D09 · Wiki, Notes i RSS | 7,0 | Notes responsive i suites en verd, Wiki amb fonts públiques filtrades; P2 de portada demostrat. | QA-VES-02 i canari de RSS/notes amb sessió. Unificar portada SEO de Wiki i validar persistència, oblit i lector extern. |
| D10 · IAIA, Traductor i Bot | 7,5 | Atles local i traductor lliure aprovats en el contrast addicional; Consola exclosa de traducció. | No s'ha contactat proveïdor de traducció ni Telegram real. Validar timeout/cascada amb entorn controlat i bot real sense enviar dades personals. |
| D11 · Consola, Govern i observabilitat | 8,5 | GET consumit en viu, recomptes 26/18/20/22, 24 Node locals aprovats; portades úniques. | NV-01 i política de caducitat/segellat; mètrica 114 H4 desfasada. Repetir integració amb bind permés i reconciliar les afirmacions documentals. |
| D12 · SEO social, PWA, natius i WordPress 1.1.10 | 6,5 | Manifest pur, DOM de deu presentacions públiques i prova de certificació privada; proves PWA/iOS/Android locals del contrast. | P1 de 18 rutes, perfils públics i validació de botigues/WordPress real. Corregir cobertura, fer canari de compartició i executar validacions natives pertinents. |
| D13 · Rendiment, CSS i memòria | 8,0 | Set blocs integrats mantenint components; ESLint i Design Guard verds; llicència d'excepció Leaflet explícita. | 12 avisos de disseny i 31 infraccions de vocabulari tolerades; sense mesures noves de latència o perfil de memòria. Mesurar recorreguts en dispositiu objectiu i atacar un deute identificat cada volta. |
| D14 · Seguretat, RLS i privacitat | 7,0 | URL locals/signades filtrades, controls GET locals, tests d'oblit/buffers i projecció pública. | Auditoria de policies remotes/revocacions històriques no executada. Validar NV-06 en canari; no donar 10 a partir de mocks o de la signatura documental. |
| D15 · Portes, segell i proves | 8,5 | Totes les ordres T5 amb exit 0, 3073 proves; contrast addicional 411; Frontissa/segell/Ledger vàlids. | Integració Node EPERM i omissions/salts declarats; tancament de torn subjecte a carrils documentals. Mantindre recompte per execució i revalidar només el que canvie amb el pegat. |

### Millores del prompt operatiu

1. Substituir la lectura cega de tot l'Escriptori per un manifest de fonts amb consum acreditat i relleus de canvis; mentrestant, declarar la lectura distribuïda i no simular lectura personal íntegra.
2. Generar del codi la llista de CSS, capes, recomptes d'encapçalaments i rutes; una cita de skill o camí inexistent ha de detectar-se abans de convocar.
3. Versionar la correspondència de les quinze dimensions; no reutilitzar D01–D15 amb semàntiques diferents sense etiqueta.
4. Separar «cap P0/P1 nou al lot» de «complix tots els criteris de llançament». Un APTE que deixe un P1 essencial en una nota transversal és ambigu.
5. Declarar l'excepció d'ESTAT/LEDGER per al carril estrictament documental, o donar-li un tancament formal compatible. No demanar alhora zero escriptura .agents i relleus obligatoris fora del torn propi.
6. Mantindre les necessitats externes sense severitat fins a validar-les; no convertir un EPERM del sandbox, una decisió de política o un retall d'art no acreditat en vulnerabilitat.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Les nou ordres següents corresponen als huit grups T5. S'ha afegit `--no-install` a npx per usar només els binaris ja instal·lats. Cada procés té codi d'eixida propi; no s'han sumat execucions solapades.

| Comanda executada | Exit | Resultat |
| --- | --- | --- |
| `npx --no-install eslint src tooling scripts tests bot --max-warnings=0` | 0 | 0 errors i 0 avisos. |
| `node tooling/gates/design_guard.mjs --arrel=src` | 0 | 2733 fitxers, 0 crítics i 12 avisos; línia base no puja. |
| `node tooling/gates/tractor-graella.mjs` | 0 | Contracte executable i codi coherents. |
| `node tooling/gates/tractor-vocabulari.mjs` | 0 | 2198 classes canòniques, 31 infraccions tolerades; cap de nova. |
| `node tooling/gates/tractor-psicopatia.mjs` | 0 | 2964 fitxers vius, 582 històrics ignorats. |
| `node tooling/gates/frontissa-contingut.mjs` | 0 | 16/16 claus amb empremta aprovada. |
| `node tooling/gates/segella.mjs --check` | 0 | Segell intacte, hash 2310ca7a645a6bb510968bd576ff3ca2b8861e26293d076d0ed2941b4e2b98a8. |
| `node tooling/verify-ledger.mjs` | 0 | Signatura criptogràfica vàlida. |
| `npx --no-install vitest run src/components/layout src/components/universal/workspace src/sections/notes src/sections/consola src/sections/multimedia tooling/vite tooling/brain tooling/seo` | 0 | 212 fitxers aprovats, 1 omés; 3073 proves aprovades i 4 omeses; 88,80 s. |

El fitxer omés és src/sections/consola/laboratori261009.test.js:18, amb quatre proves condicionades a un laboratori retirat. No són quatre proves de producte fallides.

**Contrast addicional per a les quinze dimensions:** una passada separada de 15 fitxers de privacitat Gestoria, E2EE/SessionContext, SEO/head, Firebase WebFinger, PWA, projectes iOS/Android, adaptadors Push, tiquet/cobrament, atles IAIA i traductor lliure: **exit 0, 411 aprovades i 2 omeses**. Les dues proves sentinella de «sense projecte» se salten quan existixen els projectes iOS i Android; no s'han compilat les apps natives. L'ordre íntegra queda identificada pels quinze fitxers indicats en este paràgraf i l'execució del torn, amb log SHA-256 `d78305bf6423638dde630e7aec74d978a501353be20dcb8f3a912e36e9e19345`.

**Node addicional, executat pel verificador T2:** `node --test tooling/vite/consola-iaia.test.mjs tooling/brain/fonts-govern.test.mjs`: **exit 1, 25 proves, 24 aprovades, 1 fallida, 0 omeses**. Única fallada: tooling/vite/consola-iaia.test.mjs:218, listen EPERM a 127.0.0.1 en crear el servidor Vite del fixture (:213). És NV-01; no es presenta com a regressió del producte ni s'oculta amb un exit global verd.

Empremtes SHA-256 dels logs T5 abans de netejar el temporal:

| Ordre | SHA-256 |
| --- | --- |
| eslint | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| design_guard | `1c2a35e7dbbac3776d9c4e5209e06c0eb24409855b5b0d643ac15efc99a71fab` |
| tractor-graella | `70761516c41f1822211fe4248eb95b336df32ae831b63d5f27a73efaad2a37d5` |
| tractor-vocabulari | `f1e803518ed441843e8dd665752626583d4ac2cb5392feffe6c14b6f4902195a` |
| tractor-psicopatia | `a869b51112ee6e3f975375a94bf67f2afb6194408919ce902dfb8c17e813fb1e` |
| frontissa-contingut | `8f281765f1f7710d0c40d56e0d7b5420e3de8ee27c4416c6b47f760f1f3d073b` |
| segella | `7db77cfd9ce9f7d71f50f0ef0686e795a85b46d1cb5ddf3af34785480f8c6f3c` |
| verify-ledger | `4e47c156fe5f1e7bcc13bff51ad22fb06fb857dd479077dbc9dceacd0ccaf2ba` |
| vitest | `1ea706b12e070d354b13157aaa5bf45833d36958a35e18a30733b52004f69bd2` |

El manifest social s'ha construït només en memòria, sense cridar les CLI d'escriptura de generadors. Pillow ha llegit i mesurat imatges; no les ha editades.

**Validació canònica del lliurament:** document.mjs check del present informe ha retornat exit 0, valid:true. La porta global porta-plantilla-viva.mjs --escriptori --complet ha retornat **exit 1**: quatre documents del torn antic torn_3e23ae6f tenen «Torn caducat» (pla 1605, prompt 1605, prompt 1852 i prompt 2258). No és un error del rebut d'este informe. Cal que l'orquestradora resolga el cicle dels documents antics; no s'han recreat, resegellat ni renovat registres aliens.

El primer tancament --check ha detectat, a més dels relleus ESTAT/LEDGER prohibits per l'ordre, enllaços de l'informe amb sufix :línia que el resolutor Wiki interpretava com a part del fitxer. S'han corregit els destins, mantenint la línia exacta en l'etiqueta de cada enllaç. Esta correcció és exclusivament documental.

**Revalidació final de clausura:** exit 1 només per falta dels relleus d'este torn a .agents/ESTAT.md i .agents/LEDGER.md, incompatibles amb l'ordre de no escriure'ls. Les huit comprovacions d'entorn (Olivera, plantilles, autoritat, Ledger, segell, catàleg de skills, Wiki --check --strict i SCC) han retornat exit 0; els enllaços propis ja són vàlids. El torn roman planned i no es fabrica un close. El document individual continua valid:true. Inventari des de l'obertura: zero deltes a src/tooling/scripts/tests; les 21 empremtes de superfície recontrastades no han canviat.


<!-- SDP:SECTION auditoria.s6 -->
## Límits

Esta és una auditoria local i documental. No autoritza ni executa commit, desplegament, migració SQL remota, rotació de credencials, instal·lació, publicació externa o canvi de flags. L'absència de P0 nou en l'abast inspeccionat no acredita l'absència de totes les vulnerabilitats ni tanca els P0 històrics del Llibre.

Zero edicions pròpies a src/, tests/, tooling/, scripts/, bot/ o public/. No s'han executat ordres Git destructives. Les úniques escriptures persistents d'este torn són l'informe, l'índex, el Llibre Mestre i la metadata del propi circuit documental. Els logs i la còpia temporal de la vinyeta de HEAD s'han mantingut fora del repositori i s'eliminen en acabar.

S'ha reutilitzat el servidor de desenvolupament existent només en lectura. No s'ha iniciat ni aturat el servidor de Claude. Els tres agents auxiliars han acabat; no hi ha crons ni schedules creats per esta auditoria. La pestanya temporal i l'emulació de viewport es tanquen/restablixen abans de lliurar.

El prompt prohibix escriure .agents fora del torn propi, mentre checkTurn exigix relleu a .agents/ESTAT.md i .agents/LEDGER.md. No s'han fabricat eixos relleus ni executat --close, que escriuria el Ledger. Es registra el resultat de --check amb esta limitació; la validació del document és independent del segell de clausura del torn.

Les puntuacions D01–D15 són provisionals i relatives a l'evidència indicada. No hi ha un 10/10 global, una certificació WCAG AAA, una garantia de reproducció Nix ni un dictamen d'aprovació d'NLnet.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261030_1946_prompt_qa_gemini_codex_tancament_vesperti]]
- [[261030_2114_auditoria_vespertina_gemini]]
- [[261030_1533_informe_matinal_opus]]
- [[261029_1723_auditoria_claude]]
- [[261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa]]
- [[261029_2353_auditoria_codex_nlnet_fediversity]]
