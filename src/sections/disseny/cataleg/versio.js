/**
 * versio.js — la versió del catàleg Pedra Seca (Disseny), amb data i hora.
 *
 * T51 · Regla del Mestre (260928): cap document existeix sense data; en
 * lectura, la de creació o la de l'última versió (editorial.js ·
 * dataDeDocument). Els espècimens encara no porten data pròpia al manifest,
 * i la data real d'un espècimen és la de la versió del catàleg on viu: la
 * pastilla de la barra taronja de cada espècimen (DesignSection.jsx) pinta
 * esta constant.
 *
 * ⚠ QUI EDITE EL CATÀLEG (manifest.js, registre.js, detailRegistry.jsx,
 * Especimen.jsx, Llinatge.jsx o qualsevol fitxer de detalls/) HA DE POSAR-LA AL DIA en el
 * mateix canvi: la darrera modificació real d'eixos fitxers, en hora de
 * València amb la seua zona (`ls -lT src/sections/disseny/cataleg
 * src/sections/disseny/cataleg/detalls`, sense comptar les proves ni este
 * fitxer). Una versió que no és la darrera és una data falsa a la pastilla.
 *
 * Darrera posada al dia: EspecimenControlsBarra.jsx, 2026-10-20T17:07:16+02:00, Fase D (261020,
 * tasca 2; pla 261020_1300 · App Store 1.2 i Google Play UGC): «Més opcions» (⋮) de la boina,
 * l'organisme nou Moderacio.jsx (BotoModeracio i MenuModeracio, denunciar i bloquejar), registrat a
 * registre.js (17:05:48) i mostrat a EspecimenControlsBarra.jsx (el menú obert i quiet, només
 * denunciar i denunciar i bloquejar, i el ⋮ a la barra taronja, amb les files BotoModeracio,
 * MenuModeracio i BarraTaronja.accioModeracio al contracte), i la fila ambModeracio (boolean, false)
 * al contracte d'EspecimenUniversalCard.jsx (17:05:57). Cap espècimen ni entrada de manifest nous.
 * Versió anterior: EspecimenIdentitat.jsx, 2026-10-17T19:28:57+02:00, Revisió del Gauntlet
 * 261017 (ID4; relleu 3: mai «Foraster» mentre la sessió és vàlida): la fila
 * BotoIdentitatActiva.pendent (bool, false) al contracte de l'espècimen, la prop nova que, sense
 * sessió i mentre la sessió recordada es comprova, pinta només un estat ocupat per al lector de
 * pantalla en lloc d'«Entrar».
 * Versió anterior: EspecimenPublicacionsDeLActor.jsx, 2026-10-17T17:34:22+02:00, Gauntlet
 * 261017 (WP7a, el que els paquets paral·lels no van arribar a tocar): F30 a tota l'app, el
 * DialegEmoticona d'EspecimenClassificacio.jsx i d'EspecimenEmoticonaBarra.jsx porta el catàleg
 * Emojis XL (carregaCatalegEmojis, de notes/canalEmojis.js), amb carregaCataleg a la fila del
 * contracte d'EspecimenClassificacio.jsx (17:31:53); les files de contracte que faltaven, onCarrega
 * a EspecimenVisorImatges.jsx (C05) i onObri i etiquetes.obri a EspecimenCarruselImatges.jsx (C04,
 * 17:33:05); i els textos de F45 (Gauntlet 261016, Bloc 3.9) que encara deien que l'històric de
 * l'actor va davall de l'editor del Bloc: ara, només davall d'una publicació oberta
 * (PublicacioDetall), al lead de publicacions-actor de manifest.js (17:34:01), a la fila
 * peuDePagina d'EspecimenPage.jsx (17:34:09) i a la descripció, la fila exclouId i el «Fes»
 * d'EspecimenPublicacionsDeLActor.jsx (17:34:22).
 * Versió anterior: EspecimenXatRail.jsx, 2026-10-17T16:50:40+02:00, Gauntlet 261017
 * (Bloc 3.1, terminologia neutra de la missatgeria; troballa C12 de l'auditoria de Codex): els
 * textos visibles del catàleg ja no nomenen cap marca aliena ni diuen que el Xat en siga una
 * còpia; parlen del patró estàndard de missatgeria que la gent ja coneix. Toca els leads de
 * manifest.js (16:40:29: la llista, el rail i el full «Ajustos», i el comentari d'este últim), la
 * descripció i les regles d'EspecimenXatAjustos.jsx, i les descripcions d'EspecimenXatCerca.jsx i
 * EspecimenXatLlista.jsx (16:40:56); EspecimenXatRail.jsx (16:50:40: la descripció, el contracte
 * de textosDeVista i «el verd d'una marca aliena»); la taula d'EspecimenGestor.jsx i el paràgraf
 * d'EspecimenControlsBarra.jsx («com a les apps de missatgeria», 16:44:46); i els comentaris
 * d'AssignacioEmoji.jsx (16:44:46), destinsEmoji.js i EspecimenXat.jsx (16:44:55). Arreplega
 * EspecimenVisorImatges.jsx (16-10, 22:04:04), tocat després de la versió anterior sense
 * posar-la al dia.
 * Versió anterior: detailRegistry.jsx, manifest.js i registre.js, 2026-10-16T18:11:39+02:00,
 * Onada 0.3 (Gauntlet 261016, pla 261016_1530: «visor modal / Lightbox natiu a pantalla completa
 * sobre fons fosc»): l'organisme nou VisorImatges, el visor de fotos de l'Arxiu visual
 * (/multimedia), registrat a registre.js, amb l'ítem superposicions/visor-imatges i l'emoji 📸 a
 * manifest.js, el seu carregador a detailRegistry.jsx i l'espècimen nou EspecimenVisorImatges.jsx
 * (18:11:11), que el munta de veres sobre la graella de cel·les-botó de /multimedia. Arreplega els
 * tocats esta vesprada sense posar-la al dia: AssignacioEmoji.jsx i destinsEmoji.js (18:03:31,
 * Gauntlet 261016, Bloc 3.4: el grup de la Wiki i la carpeta `maquinaria`) i EspecimenXatAjustos.jsx
 * (17:43:06).
 * Versió anterior: EspecimenEnquadrament.jsx, 2026-10-16T03:02:33+02:00, Gauntlet nocturn
 * 261016 (pla 261016_0015), Bloc 1 (Llei del Quadrat): la sortida exacta de cada enquadrament
 * (l'avatar, 400 × 400; el logotip, 600 × 600; la capçalera, 1.200 × 1.200 i quadrada, com la
 * targeta) i, Bloc 1.2, la casella ofereixConservarExif amb la seua fila al contracte. Arreplega els
 * tocats esta nit sense posar-la al dia: EspecimenDretsAutor.jsx (01:50:47, Bloc 3.1: l'àmbit
 * «compte» i els textos opcionals de l'ajust de drets d'«El compte»), EspecimenTargetaViva.jsx
 * (00:54:38) i manifest.js (00:54:55), del Bloc 3.4: cap editor munta ja la targeta viva ni el seu
 * xip. I els que quedaven endarrerits: EspecimenUniversalCard.jsx (15-10, 19:50:21, Directiva de
 * Dignitat Humana, pla 261015_1900: la targeta d'una persona no porta drets ni categories),
 * EspecimenPaginaApp.jsx (14-10, 21:40:28, ordre del Mestre del 14-10: l'avatar sdp-media://
 * resolt pel port i accionsInoperatives), EspecimenShell.jsx (14-10, 05:34:08) i
 * EspecimenCalendari.jsx (14-10, 00:34:36). La posa al dia el front F3 del Gauntlet, amb la guarda
 * de versio.test.js, que ara reconeix també les marques «Gauntlet aammdd» i «pla aammdd».
 * Versió anterior: EspecimenCamp.jsx, 2026-10-13T17:17:21+02:00, ordre del Mestre del
 * 13-10-2026 (pla 261013_1405, front D): la fila CampFitxer.nomsVisibles al contracte de l'espècimen,
 * la prop opt-in de la privacitat de formulari.jsx (en fals, la línia d'estat només diu el recompte
 * dels fitxers triats, mai els seus noms). La posa al dia la revisió adversarial 13-10-2026, troballa
 * ORD-2: l'espècimen es va tocar després de la versió del front B i la pastilla deia una data falsa.
 * Versió anterior: EspecimenPaginaApp.jsx i manifest.js, 2026-10-13T15:47:43+02:00, ordre del
 * Mestre del 13-10-2026 (pla 261013_1405, front B: «A la part dreta de la barra taronja, SEMPRE la data
 * i l'hora vives»): l'àtom nou RellotgeViu, registrat a registre.js (15:47:12) i pintat de veres a
 * EspecimenControlsBarra.jsx (15:47:29), amb la seua fila al contracte; les props rellotgeViu i
 * rellotge (i barActions, que hi faltava) al contracte d'EspecimenPaginaApp.jsx; i a manifest.js, el
 * subtítol de controls-barra i les paraules de cerca.
 * Versió anterior: EspecimenTornarADalt.jsx, 2026-10-12T22:08:14+02:00, revisió adversarial
 * (261012) de l'ordre del Mestre del vespre: el botó «Tornar a dalt» no es pinta al final del
 * recorregut (taparia l'última fila) ni amb un peu ancorat a baix («Desar autoria», el compositor del
 * Xat), i EspecimenNavMobil.jsx (22:08:13) diu que amb un peu ancorat la barra inferior es queda.
 * Versió anterior: EspecimenNavMobil.jsx, 2026-10-12T21:11:26+02:00, ordre del Mestre (261012,
 * vespre): les barres acompanyen el scroll en compacte i el botó «Tornar a dalt» damunt de «Pobles»
 * (Pedra Seca §9). L'espècimen nou EspecimenTornarADalt.jsx (21:10:44), amb les entrades noves de
 * manifest.js (navegacio/tornar-dalt, l'emoji 🔝 i el node de l'arbre universal, 21:10:58), de
 * detailRegistry.jsx i registre.js (BotoTornarADalt, 21:11:08); EspecimenNavMobil.jsx deroga el «No
 * facis: amagar-la en fer scroll» i diu com acompanya el scroll.
 * Versió anterior: EspecimenXatLlista.jsx, 2026-10-10T13:05:23+02:00, Onada 10 (261010; revisió
 * de l'Onada): la mostra de la llista que no carrega diu el text nou de SDP-XAT-003 («Mode Foraster»).
 * Arreplega EspecimenUniversalCard.jsx (13:04:54, Onada 10: el contracte d'`accio` diu que la Consola i
 * el Cervell porten «Obrir…» només a la seua pàgina) i els tocats el 261009 després de les 16:43 sense
 * posar-la al dia: AssignacioEmoji.jsx (18:14:40), destinsEmoji.js (18:14:48) i, a les 18:29:55-56,
 * EspecimenArticles.jsx, EspecimenAvatar.jsx, EspecimenCalendari.jsx, EspecimenControlsBarra.jsx,
 * EspecimenEmoticonaBarra.jsx, EspecimenEstatDesament.jsx, EspecimenPaginaApp.jsx, EspecimenRajola.jsx,
 * EspecimenTargetaViva.jsx i EspecimenXat.jsx.
 * Versió anterior: EspecimenTargetaViva.jsx, 2026-10-09T16:43:08+02:00, Onada 8 (front 8A,
 * revisió adversarial): la boina de la targeta viva porta al perfil de qui signa (autor.ruta). Arreplega
 * els espècimens del mateix front tocats sense posar-la al dia: EspecimenPage.jsx (15:25:02),
 * EspecimenPaginaApp.jsx (15:25:07), EspecimenControlsBarra.jsx (15:25:17) i EspecimenUniversalCard.jsx
 * (15:29:42), la boina de Sóc de Poble al seu perfil i el menú «En privat» amb l'autor; i registre.js
 * (06:37:25), tocat el 261009 sense posar-la al dia.
 * Versió anterior: EspecimenXatLlista.jsx, 2026-10-09T04:59:44+02:00, Onada 6 (front «xat»,
 * revisió 261009): el peu «Informa d'un error» de la llista de converses (LlistaConverses `peu` i
 * BotoInformaDUnError), fora de la <ul>, davall de l'avís d'una llista que no carrega i amb la reserva
 * (copiar l'informe o enviar-lo per correu). Arreplega també EspecimenCalendari.jsx (04:44:01, Onada 6,
 * front «calendari»), tocat sense posar-la al dia.
 * Versió anterior: EspecimenAvatar.jsx, 2026-10-09T04:13:12+02:00, Onada 6 (tasca 12): la
 * variant additiva `enquadrament` d'Avatar, amb la cara de la IAIA a «Festa del Poble» (sm, md, lg i xl).
 * Arreplega també EspecimenPestanyes.jsx (04:01:46, Onada 6, front «pobles»: la variant `centrades`
 * de Pestanyes, la de la pàgina d'un poble).
 * Versió anterior: manifest.js, 2026-10-09T01:00:28+02:00, Onada 5 (ordre del Mestre, 261008):
 * la barra inferior mòbil passa a Xat, Mur, el Panell de Control, Mercat i Pobles, en cinc pistes
 * d'ample igual (EspecimenNavMobil.jsx a les 01:00:27 i l'entrada nav-mobil de manifest.js).
 * Arreplega també els tocats el 261008 sense posar-la al dia: manifest.js (14:46:58),
 * EspecimenImpressio.jsx (14:06:17), EspecimenEnquadrament.jsx (14:39:15),
 * EspecimenTargetaViva.jsx (14:46:38), EspecimenDretsAutor.jsx (14:55:34), EspecimenPage.jsx i
 * EspecimenEstatDesament.jsx (15:26:40).
 * Versió anterior: AssignacioEmoji.jsx, 2026-10-08T00:17:37+02:00, el relleu 261007 (Onada 3,
 * peça «netes»): l'espècimen nou EspecimenPublicacionsDeLActor (l'històric de l'actor), amb les
 * entrades noves de registre.js (PublicacionsDeLActor, VistaPublicacionsDeLActor i TargetaDelMercat),
 * manifest.js (fonaments/publicacions-actor) i detailRegistry.jsx; EspecimenPage (la ranura
 * peuDePagina i etiquetaPeuDePagina al contracte); EspecimenUniversalCard (imatgePrivada també a les
 * targetes del Mur i dels actes, Decisió 3 del Mestre); EspecimenCarruselImatges (el munta
 * portadaDElement per a /mercat/:id i el lector del MAS); i AssignacioEmoji (la Wiki compilada va
 * en un tros a demanda del paquet trossejat, Decisió 5 del Mestre). Arreplega també destinsEmoji.js
 * (10:28:53) i guardaEmojisSafari16.js (09:43:20), tocats el 261007 sense posar-la al dia.
 * Versió anterior: EspecimenCarruselImatges.jsx, 2026-10-07T09:37:33+02:00, la marató 261007:
 * l'espècimen del carrusel; EspecimenUniversalCard (drets en una línia i sempre enllaç, l'acció gran,
 * targetes de pàgina de veritat i emojis XL al quadrat), EspecimenControlsBarra (Comentar en
 * privat o en públic), EspecimenEmojisXL (Assignar), EspecimenUniversalWorkspace (la roda dentada),
 * EspecimenOpcions, manifest.js (un emoji propi per espècimen) i registre.js (CarruselImatges,
 * PortaDePagina, BotoComentar i MenuComentar). Arreplega també els tocats el 261007 sense posar-la
 * al dia (detailRegistry.jsx a les 01:42).
 * Versió anterior: EspecimenNavMobil.jsx, 2026-10-06T05:16:25+02:00, retirada de la regla de noFacis sobre Telefonades que no havia dictat el Mestre.
 * Versió anterior: EspecimenNavMobil.jsx i manifest.js, 2026-10-06T04:42:10+02:00, la barra mòbil de cinc caselles: Telefonades n'ix per decisió del Mestre (261006).
 * Versió anterior: EspecimenEmojisXL.jsx, 2026-10-05T01:05:16+02:00, catàleg Unicode 18.0 complet i còpia accessible.
 * Versió anterior: EspecimenEmojisXL.jsx, 2026-10-04T23:38:33+02:00, marató A1 i Emojis XL.
 * Versió anterior: EspecimenPage.jsx, 04-10-2026 15:38:35 (+02:00,
 * hora d'estiu), correcció del verificador del tancament de la nit 261004:
 * la segona mostra de l'avatar s'obri a pantalla completa (PantallaCompleta)
 * per a vore'l a la mida de veres, i el text de les mostres diu que dins de
 * la columna del catàleg s'encongix i quina és la mida de veres.
 * L'anterior, EspecimenPage.jsx, 04-10-2026 15:20:48 (+02:00,
 * hora d'estiu), tancament de la nit 261004 (Pedra Seca §9): el bloc del
 * títol de PageFrame amb tres mostres de veres (l'avatar redó d'una persona
 * o la IA, el mateix amb onCanvia i el logotip de l'entitat que signa) i la
 * prop avatarAutor al contracte. Arreplega també els espècimens tocats entre
 * les 00:43 i les 15:20 sense posar-la al dia (EspecimenCamp.jsx,
 * EspecimenIdentitat.jsx, EspecimenTipografia.jsx i el mateix
 * EspecimenPage.jsx a les 11:50).
 * La d'abans, EspecimenUniversalCard.jsx, 04-10-2026 00:43:56
 * (+02:00, hora d'estiu), Onada 4 · P6 (directriu 261003_2325 del Mestre):
 * les mostres de doble acció porten el peu blau i cap etiqueta, l'autor va al
 * xat corporatiu resolt (xatCorporatiu.js), el preu va al quadrat fosc (amb
 * una mostra de preu llarg) i el contracte documenta `price`. L'anterior,
 * 03-10-2026 23:42:30 (manifest.js i registre.js, ESMENA 261003 22:34:
 * la targeta de doble acció estàndard), i abans 22:37:08 (P5), que ja
 * arreplegava EspecimenEnquadrament.jsx i els espècimens tocats entre el
 * 30-09 i el 03-10.
 * Quan el manifest porte `creat` i `modificat` per espècimen, manaran eixos
 * camps i esta constant només farà de versió del conjunt.
 */
export const VERSIO_CATALEG = '2026-10-20T17:07:16+02:00';
