/**
 * Pegat C2 · T10 (Codex al Mapa) i T12 (fonts de vigilància).
 * Pla: _wiki_de_poble/04_escriptori/260930_0040_pla_implementacio_consola.md (part B).
 *
 * Ordre: el mòdul nou abans de la closca que l'importa; les proves, amb el
 * codi. Les dues substitucions fallen tancat si el fitxer actual ja no és el
 * del sha de partida (arbre concurrent: cal refer el pegat, no forçar-lo).
 *
 * Prova de laboratori: node --test tests/governanca-260930-mapa.test.mjs
 */
export const operacions = [
  {
    ruta: 'tooling/brain/fonts-vigilancia.mjs',
    descripcio: 'NOU · T12: resums de només lectura de torns (memòria cau per mtime), Escriptori (àncora i rebut), LEDGER (quatre formes, signatura, fòssils) i ESTAT (data del relleu vigent); null si la font no hi és, mai llança; sense imports relatius.',
    crea: 'nous/tooling/brain/fonts-vigilancia.mjs'
  },
  {
    ruta: 'tooling/brain/mapa-consola.mjs',
    descripcio: 'T10 i T12: recullFonts afig hooksCodex (.codex/hooks.json, obligatòria com .agents/hooks.json), agentsMd, contextArrencada (SOURCES de context-local.mjs) i les fonts torns, escriptori, ledger i estat; capçalera al dia.',
    substituix: 'nous/tooling/brain/mapa-consola.mjs',
    base: '70d7d0fd094471e66627f68cabc838bece706f7a80a64660f83bcf918902a7e8'
  },
  {
    ruta: 'tests/fonts-vigilancia.test.mjs',
    descripcio: 'NOU · proves de fonts-vigilancia.mjs amb fixtures a os.tmpdir(): contracte dels torns i memòria cau, àncores i safata, les quatre formes del LEDGER i la doble signatura, dates d’ESTAT i fail-safe.',
    crea: 'nous/tests/fonts-vigilancia.test.mjs'
  },
  {
    ruta: 'tests/mapa-consola.test.mjs',
    descripcio: 'Amplia la prova de la closca: arnés Codex amb .codex/hooks.json i AGENTS.md (càrrega derivada de les SOURCES reals), font absent sense Codex i forma exacta de les fonts de vigilància.',
    substituix: 'nous/tests/mapa-consola.test.mjs',
    base: '74fe1bcc2f525983751740ad63e22730f510b072502c2b44a0535a6bd59b8a9b'
  }
];
