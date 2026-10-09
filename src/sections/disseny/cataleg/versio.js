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
 * Darrera posada al dia: EspecimenXatLlista.jsx, 2026-10-09T04:59:44+02:00, Onada 6 (front «xat»,
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
export const VERSIO_CATALEG = '2026-10-09T04:59:44+02:00';
