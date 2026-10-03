/**
 * Integració del torn massiu 261002 (Onada 2) · ESLint en mode lectura sobre
 * els fitxers .js, .jsx i .mjs que han declarat els lots, amb la configuració
 * del repositori (eslint.config.js). Exigix zero errors; els avisos es compten
 * i s'informen (diagnòstic de node:test), no fan fallar.
 *
 * La Gestoria queda fora a propòsit: la seua empremta ja està calculada i
 * cap integració la toca. Una guarda ho comprova.
 *
 * No escriu res. Ús:  node --test tests/lint-torn-261002.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OLIVERA = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261002_1745_olivera_arxiva_claude';

/** Els fitxers de codi declarats pels lots (els .md, .css i .txt no passen per ESLint). */
const DECLARATS = [
  /* Plataforma d'apps. */
  'src/apps/plataforma/ClosaAplicacio.jsx',
  'src/apps/plataforma/AvisApp.jsx',
  'src/apps/plataforma/ClosaAplicacio.test.jsx',
  'src/apps/plataforma/rutesAplicacio.js',
  'src/apps/plataforma/RutaApps.jsx',
  'src/apps/plataforma/BarraApp.jsx',
  'src/apps/plataforma/index.js',
  'src/apps/plataforma/rutesAplicacio.test.jsx',
  'src/apps/plataforma/registreApps.test.js',
  'src/apps/plataforma/RutaApps.test.jsx',
  'src/apps/plataforma/BarraApp.test.jsx',
  'src/apps/plataforma/integracioApp.test.jsx',
  'src/apps/plataforma/qualitat.test.js',
  /* Magatzem local i fulls de càlcul. */
  'src/utils/magatzemLocal.js',
  'src/utils/magatzemLocal.test.js',
  'src/utils/__fixtures__/navegadorFals.js',
  'src/utils/fulls/csv.js',
  'src/utils/fulls/csv.test.js',
  'src/utils/fulls/model.js',
  'src/utils/fulls/model.test.js',
  'src/utils/fulls/xlsx.js',
  'src/utils/fulls/xlsx.test.js',
  'src/utils/fulls/qualitat.test.js',
  /* Teclat numèric. */
  'src/components/PedraSeca/organismes/TeclatNumeric.jsx',
  'src/components/PedraSeca/organismes/TeclatNumeric.test.jsx',
  /* Sentinelles. */
  'src/sections/tractors/PanellSentinelles.jsx',
  'src/sections/tractors/PanellSentinelles.test.jsx',
  'src/sections/tractors/sentinelles/comu.js',
  'src/sections/tractors/sentinelles/comu.test.js',
  'src/sections/tractors/sentinelles/contracte.js',
  'src/sections/tractors/sentinelles/detectiuPoble.js',
  'src/sections/tractors/sentinelles/detectiuPoble.test.js',
  'src/sections/tractors/sentinelles/policiaDisseny.js',
  'src/sections/tractors/sentinelles/policiaDisseny.test.js',
  'src/sections/tractors/sentinelles/trituradorFinancer.js',
  'src/sections/tractors/sentinelles/trituradorFinancer.test.js',
  'src/sections/tractors/sentinelles/estructural.js',
  'src/sections/tractors/sentinelles/estructural.test.js',
  'src/sections/tractors/sentinelles/qualitat.test.js',
  /* Notes, marc de pàgina i classificació. */
  'src/sections/notes/NotesSection.jsx',
  'src/sections/notes/NotesSection.url.test.jsx',
  'src/sections/notes/NotesEditor.test.jsx',
  'src/components/universal/PageFrame.jsx',
  'src/components/universal/PageFrame.seccio.test.jsx',
  'src/components/universal/classificacio/BotoneraClassificacio.jsx',
  'src/components/universal/classificacio/DialegValors.jsx',
  'src/components/universal/classificacio/Classificacio.test.jsx',
  'src/components/universal/classificacio/qualitat.test.js',
  /* Porta Olivera (proposta al laboratori, sense instal·lar). */
  `${OLIVERA}/nous/tooling/documental/turns.mjs`,
  `${OLIVERA}/nous/tooling/documental/core.mjs`,
  `${OLIVERA}/nous/tooling/gates/antigravity-hook.mjs`,
  `${OLIVERA}/nous/tooling/gates/porta-olivera.mjs`,
  `${OLIVERA}/nous/tests/antigravity-hook.test.mjs`,
  `${OLIVERA}/prepara-pla.mjs`,
  'tests/olivera-arxiva-261002.test.mjs',
  /* Dades i proveïdors. */
  'src/data/qualitat.test.js',
  'src/data/sessionService.test.js',
  'src/data/supabase/organizations.test.js',
  'src/app/contexts/scopedProviders.test.jsx',
  /* Organismes de l'esquelet comú (Pedra Seca). */
  'src/components/PedraSeca/organismes/AfegitRapid.jsx',
  'src/components/PedraSeca/organismes/AfegitRapid.test.jsx',
  'src/components/PedraSeca/organismes/DetallArticle.jsx',
  'src/components/PedraSeca/organismes/DetallArticle.test.jsx',
  'src/components/PedraSeca/organismes/articles.js',
  'src/components/PedraSeca/organismes/LiniesColleccio.jsx',
  'src/components/PedraSeca/index.js',
  /* Esquelet comú de catàleg i col·lecció (ordre del Mestre T4/T8). */
  'src/apps/comu/esquelet/vistes.js',
  'src/apps/comu/esquelet/vistes.test.jsx',
  'src/apps/comu/esquelet/rutesCatalegColleccio.js',
  'src/apps/comu/esquelet/rutesCatalegColleccio.test.js',
  'src/apps/comu/esquelet/EsqueletCatalegColleccio.jsx',
  'src/apps/comu/esquelet/EsqueletCatalegColleccio.test.jsx',
  'src/apps/comu/esquelet/ColumnaCataleg.jsx',
  'src/apps/comu/esquelet/ColumnaColleccio.jsx',
  'src/apps/comu/esquelet/columnes.test.jsx',
  'src/apps/comu/esquelet/index.js',
  'src/apps/comu/qualitat.test.js',
  /* Catàleg de disseny. */
  'src/sections/disseny/cataleg/detalls/mostraEsquelet.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenEsqueletBar.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenEsqueletCompra.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenDetallArticle.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimensEsquelet.test.jsx',
  'src/sections/disseny/cataleg/manifest.js',
  /* El Bar (TPV). */
  'src/apps/bar/nucli/tiquet.js',
  'src/apps/bar/nucli/torn.js',
  'src/apps/bar/nucli/fullTancament.js',
  'src/apps/bar/nucli/escandall.js',
  'src/apps/bar/nucli/comanda.js',
  'src/apps/bar/estat/ProveidorBar.jsx',
  'src/apps/bar/vistes/punt.js',
  'src/apps/bar/vistes/Caixa.jsx',
  'src/apps/bar/vistes/Cobrament.jsx',
  'src/apps/bar/vistes/Tancament.jsx',
  'src/apps/bar/vistes/Carta.jsx',
  'src/apps/bar/rutesBar.js',
  'src/apps/bar/AppBar.test.jsx',
  'src/apps/bar/nucli/torn.test.js',
  'src/apps/bar/nucli/tiquet.test.js',
  'src/apps/bar/nucli/escandall.test.js',
  'src/apps/bar/nucli/comanda.test.js',
  /* La Nevera de Casa. */
  'src/apps/nevera/AppNevera.jsx',
  'src/apps/nevera/useNevera.js',
  'src/apps/nevera/rutes.js',
  'src/apps/nevera/nucli/nevera.js',
  'src/apps/nevera/vistes/constants.js',
  'src/apps/nevera/vistes/context.js',
  'src/apps/nevera/vistes/AvisNevera.jsx',
  'src/apps/nevera/vistes/Compra.jsx',
  'src/apps/nevera/vistes/Casa.jsx',
  'src/apps/nevera/vistes/Cataleg.jsx',
  'src/apps/nevera/vistes/Ajustos.jsx',
  'src/apps/nevera/vistes/DialegNovaLlista.jsx',
  'src/apps/nevera/AppNevera.test.jsx',
  'src/apps/nevera/nucli/nevera.test.js',
  'src/apps/nevera/qualitat.test.js',
  /* Salut. */
  'src/apps/salut/nucli/hores.js',
  'src/apps/salut/nucli/hores.test.js',
  'src/apps/salut/nucli/metriques.js',
  'src/apps/salut/nucli/metriques.test.js',
  'src/apps/salut/nucli/full.js',
  'src/apps/salut/nucli/full.test.js',
  'src/apps/salut/nucli/diccionari.js',
  'src/apps/salut/nucli/exportacio.js',
  'src/apps/salut/rutesSalut.js',
  'src/apps/salut/magatzem.js',
  'src/apps/salut/magatzem.test.js',
  'src/apps/salut/useSalut.jsx',
  'src/apps/salut/textos.js',
  'src/apps/salut/vistes/comunes.jsx',
  'src/apps/salut/vistes/Diari.jsx',
  'src/apps/salut/vistes/Resum.jsx',
  'src/apps/salut/vistes/Agitacio.jsx',
  'src/apps/salut/vistes/Ajustos.jsx',
  'src/apps/salut/vistes/Full.jsx',
  'src/apps/salut/vistes/DialegExportacio.jsx',
  'src/apps/salut/AppSalut.test.jsx',
  'src/apps/salut/privacitat.test.js',
  'src/apps/salut/qualitat.test.js',
  /* Contracte amb l'amfitrió (element encastable). */
  'src/PedraSecaEmbed.jsx',
  'src/PedraSecaEmbed.config.test.jsx',
  'src/config/contracteAmfitrio.js',
  'src/config/contracteAmfitrio.test.js',
  'src/config/contracteAmfitrio.paritat.test.js',
  'src/host.js',
  'src/app/contexts/RouterContext.jsx',
  'tests/conformitat-amfitrio.test.mjs',
  'tests/fixtures/amfitrio-sollutia.mjs',
  /* Snippet Curador i contingut extern. */
  'src/sections/notes/PrevisualitzacioExtern.jsx',
  'src/sections/notes/PrevisualitzacioExtern.test.jsx',
  'src/sections/notes/SnippetCurador.jsx',
  'src/sections/notes/NotesSection.desa.test.jsx',
  'src/sections/notes/modeDesa.js',
  'src/sections/notes/modeDesa.test.js',
  'src/sections/notes/qualitat.test.js',
  'src/sections/connectar/contingutExtern.js',
  'src/components/universal/workspace/UniversalWorkspace.jsx',
  'src/components/universal/workspace/UniversalWorkspace.compacte.test.jsx',
  /* Esta mateixa prova. */
  'tests/lint-torn-261002.test.mjs'
];

/**
 * Diagnòstic de la integradora: codi tocat a l'arbre durant el torn (des de
 * les 17:44) que cap lot d'esta llista no ha declarat. src/apps/ no hi és
 * perquè src/apps/plataforma/qualitat.test.js ja hi passa ESLint sencer, amb
 * zero missatges; la Gestoria tampoc (empremta calculada). També exigix
 * zero errors: una porta que només informa no protegix res.
 */
const NO_DECLARATS = [
  'src/app/App.jsx',
  'src/hooks/RouteSEO.jsx',
  'src/components/PedraSeca/atoms/controls.jsx',
  'src/components/PedraSeca/atoms/controls.test.jsx',
  'src/components/PedraSeca/molecules/Rajola.jsx',
  'src/components/PedraSeca/molecules/Rajola.test.jsx',
  'src/components/PedraSeca/organismes/BarraResum.jsx',
  'src/components/PedraSeca/organismes/BarraResum.test.jsx',
  'src/components/PedraSeca/organismes/GraellaArticles.jsx',
  'src/components/PedraSeca/organismes/GraellaArticles.test.jsx',
  'src/components/PedraSeca/organismes/Histograma.jsx',
  'src/components/PedraSeca/organismes/Histograma.test.jsx',
  'src/components/PedraSeca/organismes/LiniaDelTemps.jsx',
  'src/components/PedraSeca/organismes/LiniaDelTemps.test.jsx',
  'src/components/PedraSeca/organismes/LiniesColleccio.test.jsx',
  'src/components/PedraSeca/organismes/LlistaArticles.jsx',
  'src/components/PedraSeca/organismes/LlistaArticles.test.jsx',
  'src/components/PedraSeca/organismes/MarcColumna.jsx',
  'src/components/PedraSeca/organismes/MarcColumna.test.jsx',
  'src/components/PedraSeca/organismes/SeccionsCategoria.jsx',
  'src/components/PedraSeca/organismes/SeccionsCategoria.test.jsx',
  'src/components/PedraSeca/organismes/TargetesColleccions.jsx',
  'src/components/PedraSeca/organismes/TargetesColleccions.test.jsx',
  'src/components/PedraSeca/organismes/agrupacio.jsx',
  'src/components/PedraSeca/organismes/articles.test.js',
  'src/components/PedraSeca/organismes/marca.jsx',
  'src/components/PedraSeca/organismes/pulsacioLlarga.js',
  'src/components/PedraSeca/qualitat.pecesApps.test.js',
  'src/components/layout/AppGridShell.jsx',
  'src/components/layout/graella.js',
  'src/components/layout/graella.test.js',
  'src/components/layout/graella.capes.test.js',
  'src/components/universal/UniversalEditorShell.jsx',
  'src/components/universal/UniversalEditorShell.accions.test.jsx',
  'src/components/universal/UniversalEditorShell.autodesament.test.jsx',
  'src/components/universal/UniversalToolbar.jsx',
  'src/components/universal/barres/BarraBlava.jsx',
  'src/components/universal/barres/BarraBlava.test.jsx',
  'src/components/universal/classificacio/DialegCarpeta.jsx',
  'src/components/universal/workspace/WorkspaceContext.jsx',
  'src/components/universal/workspace/UniversalWorkspace.columnes.test.jsx',
  'src/components/universal/workspace/qualitat.test.js',
  'src/components/universal/workspace/seleccioUrl.js',
  'src/components/universal/workspace/seleccioUrl.test.js',
  'src/components/universal/workspace/workspaceFolderForest.js',
  'src/components/universal/workspace/workspaceFolderForest.test.js',
  'src/components/universal/workspace/workspaceState.js',
  'src/config/origensSollutia.js',
  'src/config/origensSollutia.test.js',
  'src/config/qualitat.amfitrio.test.js',
  'src/sections/disseny/cataleg/detailRegistry.jsx',
  'src/sections/disseny/cataleg/registre.js',
  'src/sections/disseny/cataleg/detalls/allLoaders.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenAfegitRapid.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenArticles.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenColleccio.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenHistograma.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenLiniaDelTemps.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenMarcColumna.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenRajola.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenSeccionsCategoria.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenTeclatNumeric.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimensApps.test.jsx',
  'src/sections/notes/NotesDataContext.amfitrio.test.jsx',
  'src/sections/notes/NotesDataContext.test.jsx',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/notes/NotesSection.test.jsx',
  'src/sections/notes/carpetes.js',
  'src/sections/notes/classificacioBloc.js',
  'src/sections/tractors/PanellTractors.jsx',
  'src/sections/tractors/clausuraSentinelles.test.js',
  'src/sections/tractors/registreSentinelles.js',
  'src/sections/tractors/registreSentinelles.test.js',
  'src/sections/tractors/sentinelles/auditoriaAparador.js',
  'src/sections/tractors/sentinelles/auditoriaAparador.test.js',
  'src/sections/tractors/sentinelles/consolVendes.js',
  'src/sections/tractors/sentinelles/consolVendes.test.js',
  'src/sections/tractors/sentinelles/contracte.test.js',
  'src/sections/tractors/sentinelles/enllacTorn.js',
  'src/sections/tractors/sentinelles/enllacTorn.test.js',
  'src/sections/tractors/sentinelles/estructural.migracions.test.js',
  'src/sections/tractors/sentinelles/executa.js',
  'src/sections/tractors/sentinelles/executa.test.js',
  'src/sections/tractors/sentinelles/formatsBar.js',
  'src/sections/tractors/sentinelles/imatges.js',
  'src/sections/tractors/sentinelles/policiaDisseny.porta.test.js',
  'src/sections/tractors/sentinelles/privacitat.test.js',
  'src/sections/wiki-de-poble/WikiDePobleSection.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.einesLocals.test.jsx',
  'src/sections/wiki-de-poble/WikiDePobleSection.produccio.test.jsx',
  'src/utils/diners.js',
  'src/utils/diners.test.js',
  'src/utils/magatzemLocal.jsdom.test.js',
  'src/utils/fulls/index.js',
  'src/utils/fulls/zip.js',
  'src/utils/fulls/zip.test.js',
  'tests/host.test.js'
];

const existents = DECLARATS.filter((f) => existsSync(path.join(ARREL, f)));
const absents = DECLARATS.filter((f) => !existsSync(path.join(ARREL, f)));

test('la llista no repetix cap fitxer, només porta codi i deixa fora la Gestoria', () => {
  assert.equal(new Set(DECLARATS).size, DECLARATS.length);
  assert.deepEqual(DECLARATS.filter((f) => !/\.(?:js|jsx|mjs)$/.test(f)), []);
  assert.deepEqual(DECLARATS.filter((f) => /gestoria/.test(f)), []);
});

test('la configuració del projecte és activa (sonda)', async () => {
  const eslint = new ESLint({ cwd: ARREL });
  const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sonda-torn-261002.js') });
  assert.deepEqual(sonda.messages.map((m) => m.ruleId).sort(), ['eol-last', 'no-unused-vars']);
});

test('ESLint: zero errors als fitxers declarats pels lots (els avisos es compten)', async (t) => {
  if (absents.length) t.diagnostic(`declarats que no existixen: ${absents.join(', ')}`);
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(existents.map((f) => path.join(ARREL, f)));
  const linia = (r, m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId ?? 'sense-regla'}] ${m.message}`;
  const errors = resultats.flatMap((r) => r.messages.filter((m) => m.severity === 2).map((m) => linia(r, m)));
  const avisos = resultats.flatMap((r) => r.messages.filter((m) => m.severity === 1).map((m) => linia(r, m)));
  t.diagnostic(`fitxers passats: ${resultats.length} de ${existents.length}; errors: ${errors.length}; avisos: ${avisos.length}`);
  for (const avis of avisos) t.diagnostic(`avís: ${avis}`);
  assert.equal(resultats.length, existents.length);
  assert.deepEqual(errors, []);
});

test('ESLint: zero errors també al codi tocat i no declarat (els avisos es compten)', async (t) => {
  assert.deepEqual(NO_DECLARATS.filter((f) => DECLARATS.includes(f)), [], 'un fitxer no pot ser declarat i no declarat');
  assert.deepEqual(NO_DECLARATS.filter((f) => /gestoria|^src\/apps\//.test(f)), []);
  const presents = NO_DECLARATS.filter((f) => existsSync(path.join(ARREL, f)));
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(presents.map((f) => path.join(ARREL, f)));
  assert.equal(resultats.length, presents.length, 'ESLint ha de passar per tots els presents');
  const linia = (r, m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId ?? 'sense-regla'}] ${m.message}`;
  const errors = resultats.flatMap((r) => r.messages.filter((m) => m.severity === 2).map((m) => linia(r, m)));
  const avisos = resultats.flatMap((r) => r.messages.filter((m) => m.severity === 1).map((m) => linia(r, m)));
  t.diagnostic(`no declarats passats: ${resultats.length} de ${NO_DECLARATS.length}; errors: ${errors.length}; avisos: ${avisos.length}`);
  for (const avis of avisos) t.diagnostic(`avís: ${avis}`);
  assert.deepEqual(errors, []);
});
