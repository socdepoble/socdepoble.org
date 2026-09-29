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
 * Darrera posada al dia: manifest.js, 28-09-2026 17:56:44 (+02:00, hora
 * d'estiu), en acabar la revisió F3 (textos i mostres alineats amb el codi).
 * Quan el manifest porte `creat` i `modificat` per espècimen, manaran eixos
 * camps i esta constant només farà de versió del conjunt.
 */
export const VERSIO_CATALEG = '2026-09-28T17:56:44+02:00';
