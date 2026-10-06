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
 * Darrera posada al dia: EspecimenNavMobil.jsx, 2026-10-06T05:16:25+02:00, retirada de la regla de noFacis sobre Telefonades que no havia dictat el Mestre.
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
export const VERSIO_CATALEG = '2026-10-06T05:16:25+02:00';
