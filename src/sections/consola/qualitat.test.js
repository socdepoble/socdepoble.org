// @vitest-environment node
/* Ordre del Mestre, 261004 (prompt 261004_0515, §6/T8) · Pany propi del
   front de la Consola i del selector de fitxers (CampFitxer): ESLint amb la
   configuració del projecte i zero missatges (avisos inclosos) als fitxers
   tocats en esta passada, i les regles de Pedra Seca al JSX (cap estil en
   línia, className literal amb prefix sdp- o sp-, i cada classe nova amb la
   seua regla a @layer components, només amb tokens). Els patrons vetats es
   componen a trossos perquè les portes que llegixen src/ no els troben ací
   (patró de src/sections/control/qualitat.test.js). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

const CODI = [
  'src/sections/consola/ConsolaSection.jsx',
  'src/sections/consola/peces.jsx',
  'src/sections/consola/consolaPagines.js',
  // Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) · El Mas en xifres.
  'src/sections/consola/XifresMas.jsx',
  'src/sections/consola/xifresMas.js',
  // Ordre del Mestre, 261004 (xat: cap xifra solta) · totes les xifres i les peces, i el pols.
  'src/sections/consola/xifresComu.js',
  'src/sections/consola/xifresVistes.js',
  'src/sections/consola/pecesMapa.js',
  'src/sections/consola/polsConsola.js',
  'src/sections/consola/PolsConsola.jsx',
  'src/sections/consola/mapa/FluxosMapa.jsx',
  'src/sections/consola/mapa/EntradesEixides.jsx',
  'src/sections/consola/mapa/AgentsAtomics.jsx',
  'src/sections/consola/mapa/ActorsMapa.jsx',
  'src/sections/consola/mapa/CalendariMapa.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenUniversalCard.jsx',
  'src/sections/consola/mapa/AvisosMapa.jsx',
  'src/sections/consola/mapa/InventariMapa.jsx',
  'src/sections/consola/mapa/MapaConsola.jsx',
  'src/sections/consola/mapa/actorsMapa.js',
  'src/sections/consola/mapa/construeixMapa.js',
  'src/sections/consola/mapa/grafMapa.js',
  'src/sections/consola/mapa/mapaContent.js',
  // Correcció 261004 (verificador de la segona passada) · la concordança comuna i l'Explorador.
  'src/sections/consola/concordanca.js',
  'src/sections/consola/mapa/ExploradorMapa.jsx',
  // Correcció 261004 (verificador de la tercera passada) · les unitats del contracte del Mapa.
  'src/sections/consola/mapa/contracteMapa.js',
  'src/components/PedraSeca/organismes/formulari.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenCamp.jsx',
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · les il·lustracions
     de les targetes i el Diagnòstic del Mas. IndexConsola.jsx no hi entra: només
     n'ha canviat el comentari, i la seua entradeta porta la classe global
     `lead` de base.css (deute anterior, fora de la regla de prefix). */
  'src/sections/consola/imatgesConsola.js',
  'src/sections/consola/indexConsola.js',
  'src/sections/consola/diagnosiConsola.js',
  'src/sections/consola/DiagnosiConsola.jsx'
];
const PROVES = [
  'src/sections/consola/ConsolaSection.test.jsx',
  'src/sections/consola/ConsolaSection.navegacio.test.jsx',
  'src/sections/consola/ConsolaSection.xifres.test.jsx',
  'src/sections/consola/ConsolaSection.pols.test.jsx',
  'src/sections/consola/xifresMas.test.js',
  'src/sections/consola/consolaPagines.test.js',
  'src/sections/consola/peces.test.jsx',
  'src/sections/consola/qualitat.test.js',
  'src/sections/consola/mapa/construeixMapa.test.js',
  'src/sections/consola/mapa/vistesMapa.test.jsx',
  'src/sections/consola/mapa/grafMapa.test.js',
  'src/sections/consola/ConsolaSection.viceversa.test.jsx',
  // Correcció 261004 (verificador de la tercera passada) · concordança, xifres destacades, mètriques i barres.
  'src/sections/consola/concordanca.test.js',
  'src/sections/consola/xifresDestacades.test.js',
  'src/sections/consola/metriques.capes.test.js',
  'src/sections/consola/mapa/mapaContent.test.js',
  'src/components/PedraSeca/organismes/formulari.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenUniversalCard.consola.test.jsx',
  'src/config/assetResolver.test.js',
  // Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · les proves del front.
  'src/sections/consola/imatgesConsola.test.js',
  'src/sections/consola/indexConsola.test.js',
  'src/sections/consola/diagnosiConsola.test.js',
  'src/sections/consola/ConsolaSection.diagnosi.test.jsx',
  'src/sections/consola/ConsolaSection.index.test.jsx',
  'src/css/diagnosi.capes.test.js'
];
const JSX = CODI.filter((f) => f.endsWith('.jsx'));
const ESTIL_EN_LINIA = new RegExp(['\\ss', 'tyle=[{"]'].join(''));
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = ['components.css', 'modules.css'].map((f) => senseComentaris(llig(`src/css/${f}`))).join('\n');

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, als fitxers tocats', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const tots = [...CODI, ...PROVES];
    const resultats = await eslint.lintFiles(tots.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(tots.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa.
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/sections/consola/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca al JSX tocat', () => {
  /* Deute anterior al torn, ja pagat: el valor d'un ajust de crèdits
     (PanellCredits) feia la classe amb plantilla. Correcció 261004
     (verificador de la segona passada, punt 2) · cada proveïdor de crèdits és
     ara una targeta amb pàgina pròpia, i la fila amb plantilla ja no hi és.
     La guarda no deixa que n'aparega cap. */
  test('cap estil en línia, i cap className nou fet amb plantilla', () => {
    expect(ESTIL_EN_LINIA.test(` s${'tyle'}={{ margin: 0 }}`)).toBe(true);
    const plantilles = JSX.flatMap((f) => [...llig(f).matchAll(/className=\{`([^`]*)`/g)].map((m) => `${f}: ${m[1].split(' ')[0]}`));
    expect(plantilles).toEqual([]);
    for (const f of JSX) expect(ESTIL_EN_LINIA.test(llig(f)), f).toBe(false);
  });

  /* Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb boina i
     pàgina pròpia): sdp-consola__data. La data torna a la pastilla de la
     boina i la classe ja no la pinta ningú, ni té regla al full. */
  test('les classes noves porten prefix i tenen regla al full', () => {
    const NOVES = ['sdp-camp-fitxer', 'sdp-camp-fitxer__boto', 'sdp-camp-fitxer__estat',
      'sdp-consola__avis', 'sdp-consola__evidencies',
      // Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · el Diagnòstic del Mas.
      'sdp-consola__diagnosi', 'sdp-consola__acces', 'sdp-consola__diagnosi-text'];
    for (const classe of NOVES) expect(CSS, classe).toMatch(new RegExp(`\\.${classe}(?![\\w-])`));
    const literals = JSX.flatMap((f) => [...llig(f).matchAll(/className="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)));
    expect(literals.filter((c) => !/^(?:sdp-|sp-)/.test(c))).toEqual([]);
  });

  test('les regles noves són a @layer components, sense :has() ni colors crus', () => {
    for (const selector of ['.sdp-camp-fitxer {', '.sdp-consola__avis {', '.sdp-consola__evidencies {',
      '.sdp-consola__diagnosi {', '.sdp-consola__acces > ul {', '.sdp-consola__diagnosi-text {']) {
      const index = CSS.indexOf(selector);
      expect(index, selector).toBeGreaterThan(-1);
      const obertura = CSS.lastIndexOf('@layer components {', index);
      expect(obertura, selector).toBeGreaterThan(-1);
      const entremig = CSS.slice(obertura, index);
      expect((entremig.match(/\{/g) || []).length - (entremig.match(/\}/g) || []).length, selector).toBe(1);
      const regla = CSS.slice(index, CSS.indexOf('}', index) + 1);
      expect(regla, selector).not.toMatch(new RegExp([':ha', 's\\(|#[0-9a-f]{3,8}\\b|\\brgba?\\('].join(''), 'i'));
    }
  });
});
