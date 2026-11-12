/**
 * P7-A · Onada 4, setena passada · El registre de les utilitats (plugins):
 * una sola taula. Els ids en l'ordre del Mestre, cada il·lustració existix a
 * public/, i cada «Obrir» que no és null porta a una ruta de veres: una ruta
 * estàtica d'App (també les d'ActorRoutes, sota "/*"), una pàgina de la
 * Consola o una app de la plataforma amb l'entrada que diu. Cap ruta
 * inventada.
 * W4-08 (261004) · Dotze: MarIA hi ha afegit el Panell de Disseny
 * («disseny», després del Cervell), que obri /disseny (DesignSection).
 * Ordre del Mestre (261007) · Bàscula descartada per ara: «Llévala de la
 * interfície actual i descarta la seua implementació». Onze: la Bàscula ja
 * no és del registre, només una llavor del Full de ruta.
 * Onada 8 (261009; requeriments 261009_1300, punt 2) · Huit: la Consola, el
 * Cervell i el Panell de Disseny «són pàgines, no plugins» i ixen del
 * registre, com la Bàscula. Les seues rutes i el seu botó «Obrir…» els prova
 * systemPages.test.js.
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
 * Cada plugin guanya `data` i `etiquetes`, els camps de la targeta canònica
 * del Panell. Els porten plens la Gestoria, el Rebost, Salut, el Lector RSS
 * i el TPV del Bar; Mapa, Vehicle Compartit i Animalets, null i llista
 * buida. La regla R1 («cap xifra») queda derogada en part: la data fixa del
 * registre en queda fora, i la prova ho diu.
 * R18 · T2 (P0-101; prompt 261111_0148) · El registre guanya `estat`, el
 * camp declaratiu de la insígnia «En proves · Beta oberta». Les etiquetes
 * continuen sent EXACTAMENT dues: la insígnia la posa etiquetesAmbEstat
 * (betaOberta.test.jsx en prova la targeta i la pàgina). Correcció de la T2:
 * l'Avisador NO hi entra (la seua il·lustració no és a public/ i cap
 * interruptor declaratiu el desendolla), i continuen sent nou.
 * P0-113 (ordre del Mestre, 261111: «ENCÉN en producció TPV del Bar, Rebost
 * Domèstic, Salut, Lector RSS i Gestoria … i insígnia «En proves · Beta
 * oberta» (`estat: 'proves'` a `registrePlugins.js`)») · Les cinc eines amb
 * app porten `estat` 'proves'; l'Arbre Genealògic continua en obres i sense
 * estat. La prova d'`estat` fixa la implicació de disseny: app oberta en
 * producció amb dades al dispositiu ⇒ 'proves'; app tancada ⇒ null; obrir
 * null ⇒ «Encara està en obres.» i null. Abans: cap plugin en portava.
 * P0-114 (ordre del Mestre, 261111: «RESTITUÏX IMMEDIATAMENT «L'Avisador ·
 * Batec de Vida» A «La llar» DE /control») · Deu: L'Avisador torna al
 * registre, a «La llar», en proves i amb la seua data (Kit R17.2). Les tres
 * condicions de la correcció de la T2 es complixen (vinyeta a public/, variant
 * social i interruptor declaratiu de build), i la prova que deia «l'Avisador
 * no és del registre» evoluciona: ara fixa que hi és i que el literal
 * VITE_SDP_APP_AVISADOR !== '0' el trau del tot només quan val '0'.
 * R19 · T3 (ordre del Mestre, 261111; pla 261111_1720: «encesa de
 * /app/genealogia a registrePlugins.js … perquè totes les eines del Panell de
 * Control funcionen al 100%») · L'Arbre Genealògic s'encén: porta a la seua
 * app (/app/genealogia) i va en proves, amb l'entradilla en present. Cap
 * plugin es queda sense destí, i una prova nova fixa que, amb els interruptors
 * per defecte, cap targeta del Panell ni cap fitxa «connectada» del Perfil
 * porta a un enllaç inert o a una ruta que App no servix.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import fontApp from '../../app/App.jsx?raw';
import fontRegistre from './registrePlugins.js?raw';
import { APPS_INTERNES, MANIFESTS_INTERNS, analitzaRuta } from '../../apps/plataforma/registreApps.js';
import { avaluaApp } from '../../apps/plataforma/interruptors.js';
import { rutaDeApp } from '../../apps/plataforma/manifestApp.js';
import { LIMIT_DESCRIPCIO } from '../../config/metadadesSocials.js';
import { APLICACIONS, aplicacionsValides } from '../profile/aplicacions.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { PRESSUPOST_PUJADA } from '../../utils/pujadaImatge.js';
import { segmentPagina } from '../consola/consolaPagines.js';
import { DESTINS_CONTROL } from '../control/destinsControl.js';
import { FITXA_SNIPPET, rutaDeLaFitxa } from '../control/destiSnippet.js';
import { CAMPS } from '../../utils/publicacioUniversal.js';
import {
  CLASSE_BETA_OBERTA, ESPAIS_PLUGINS, ESTAT_PROVES, IDS_PLUGINS, IMATGES_PLUGINS, PLUGINS, TEXTOS_BETA_OBERTA, TEXTOS_ESPAIS_PLUGINS,
  appDelPlugin, clauPortadaDelPlugin, etiquetesAmbEstat, pluginPerId, pluginsDeLEspai, rutaDelPlugin
} from './registrePlugins.js';

/* P0-114 (ordre del Mestre, 261111) · L'Avisador, darrere de l'Arbre Genealògic (a «La llar»). */
const ORDRE = ['mapa', 'vehicle', 'animalets', 'gestoria', 'tpv', 'rebost', 'salut', 'genealogia', 'avisador', 'rss'];
/* Onada 10 (decisió M4 del Mestre, 261010) · Els que tenen targeta de plugin
   al Panell, i per tant data i etiquetes. Mapa, Vehicle Compartit i Animalets
   no: la seua targeta del Panell és la de dalt, la de publicació (W4-08). */
const AMB_TARGETA_DE_PLUGIN = ['gestoria', 'tpv', 'rebost', 'salut', 'genealogia', 'avisador', 'rss'];
const SENSE_TARGETA_DE_PLUGIN = ['mapa', 'vehicle', 'animalets'];
/* L'hora del document de l'ordre (prompt 261004_0015), el criteri de les
   targetes de dalt (destinsControl.test.js). Pendent del Mestre: confirmar-la. */
const DATA_DE_L_ORDRE = '2026-10-04T00:15:00+02:00';
/* P0-114 (ordre del Mestre, 261111) · L'Avisador no és de l'ordre del 261004: porta la data del Kit
   R17.2 que el va portar (encàrrec P0-114). */
const DATA_DEL_KIT_R17_2 = '2026-11-11T00:30:52+01:00';
const DATES_PROPIES = Object.freeze({ avisador: DATA_DEL_KIT_R17_2 });
/* P0-114 · El literal plegable de l'interruptor de build, el mateix que P0-113 per a les apps. */
const LITERAL_AVISADOR = "import.meta.env.VITE_SDP_APP_AVISADOR !== '0'";
/* R19 · Arbitratge del carril Genealogia + Perfil (P1) · Les tres apps que el paquet de l'amfitrió no porta mai
   (vite.standalone.config.js, DADES_NOMES_AL_DOCUMENT_PROPI): [plugin, variable, app, espai del Panell]. */
const NOMES_A_LA_WEB_PROPIA = Object.freeze([
  ['gestoria', 'GESTORIA', 'gestoria', 'empresa'], ['salut', 'SALUT', 'salut', 'llar'], ['genealogia', 'GENEALOGIA', 'genealogia', 'llar']
]);
/* Les targetes de baix del Panell (ControlSection.jsx): les de plugin d'un espai, la de «Maquinària i Sistema»
   (IDS_MAQUINARIA, el Lector RSS) i el Snippet, que obri la seua fitxa (rutaDeLaFitxa). */
const IDS_MAQUINARIA = Object.freeze(['rss']);
const targetesDelPanell = (plugins) => [
  ...plugins.filter((p) => p.data !== null && (p.espai !== null || IDS_MAQUINARIA.includes(p.id))).map((p) => p.id), FITXA_SNIPPET
];
/* On porta «Obrir…» la targeta d'un id del Panell: la del registre o, per al Snippet, la seua fitxa del Panell. */
const rutaDeLaTargeta = (panell) => (panell === FITXA_SNIPPET ? rutaDeLaFitxa('/control') : pluginPerId(panell)?.obrir);

/* Gauntlet 261016 (Bloc 1) · Les mides d'un WebP pels bytes de la capçalera
   del seu primer tros (VP8X, VP8 o VP8L), o null si no és un WebP que s'entén. */
function midaWebp(b) {
  if (b.length < 30 || b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return null;
  const tros = b.toString('latin1', 12, 16);
  if (tros === 'VP8X') return { amplada: b.readUIntLE(24, 3) + 1, alcada: b.readUIntLE(27, 3) + 1 };
  if (tros === 'VP8 ' && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
    return { amplada: b.readUInt16LE(26) & 0x3fff, alcada: b.readUInt16LE(28) & 0x3fff };
  }
  if (tros === 'VP8L' && b[20] === 0x2f) {
    const bits = b.readUInt32LE(21);
    return { amplada: (bits & 0x3fff) + 1, alcada: ((bits >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

/* Les rutes de la taula d'App (App.jsx), amb el seu element. */
const rutesDApp = () => [...fontApp.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
/* Les rutes d'ActorRoutes: relatives (sense «/»), sense paràmetres ni
   comodins, i que pinten una secció (no un <Navigate> cap a una altra). App
   les munta sota "/*": /disseny és la ruta "disseny" d'eixa taula. */
const rutesDActor = () => [...fontApp.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)/g)]
  .filter(([, ruta, element]) => !ruta.startsWith('/') && !ruta.includes(':') && !ruta.includes('*') && element !== 'Navigate')
  .map(([, ruta]) => ruta);

/** Una ruta que App servix de veres, sense passar per NotFoundPage. */
function esRutaDeVeres(ruta) {
  const cami = ruta.split(/[?#]/)[0];
  const app = analitzaRuta(cami);
  if (app.dins) {
    const manifest = MANIFESTS_INTERNS.find((m) => m.id === app.id);
    if (!manifest || !app.trams) return false;
    return app.trams.length === 0 || manifest.entrades.some((entrada) => entrada.slug === app.trams[0]);
  }
  if (cami === '/consola' || cami.startsWith('/consola/')) {
    return rutesDApp().includes('/consola/*') && segmentPagina(cami.slice('/consola'.length)) !== null;
  }
  if (rutesDApp().includes(cami)) return true;
  return rutesDApp().includes('/*') && rutesDActor().includes(cami.slice(1));
}

describe('registre de plugins', () => {
  /* R18 · T2 (P0-101) · El títol deia «huit» des de l'Onada 8 i en compta nou.
     P0-114 (ordre del Mestre, 261111) · Deu: torna L'Avisador. */
  test('deu ids, en l’ordre del Mestre, sense repetits', () => {
    expect(IDS_PLUGINS).toEqual(ORDRE);
    expect(PLUGINS.map((p) => p.id)).toEqual(ORDRE);
    expect(new Set(IDS_PLUGINS).size).toBe(10);
  });

  /* R18 · T2 (P0-101; correcció de la T2) · L'Avisador no podia ser del
     registre fins que es complisquen les tres condicions: la il·lustració a
     public/ (avisador_vinyeta.webp, Kit R17.3), la seua variant social i un
     interruptor declaratiu que el desendolle. Cap targeta amb la imatge
     trencada al Panell.
     P0-114 (ordre del Mestre, 261111: «RESTITUÏX IMMEDIATAMENT «L'Avisador ·
     Batec de Vida» A «La llar» DE /control») · Les tres ja es complixen, i la
     prova evoluciona conservant-ne la intenció: L'Avisador és del registre
     NOMÉS amb les tres al disc i al codi. DEROGADA «l'Avisador no és del
     registre». */
  test('P0-114 · L’Avisador és del registre perquè té les tres condicions: vinyeta, variant social i interruptor', () => {
    const avisador = pluginPerId('avisador');
    expect(avisador).toMatchObject({
      id: 'avisador', titol: 'L’Avisador', subtitol: 'Batec de Vida', obrir: '/page/avisador', entorn: null, espai: 'llar',
      etiquetaObrir: 'Obrir l’Avisador', imatge: '/assets/ui/plugins/avisador_vinyeta.webp', data: DATA_DEL_KIT_R17_2, estat: ESTAT_PROVES
    });
    expect(avisador.etiquetes.map((etiqueta) => etiqueta.text)).toEqual(['Eina', 'Cures']);
    // 1 · La vinyeta, a public/. 2 · La seua variant social, al costat.
    expect(existsSync(path.join(process.cwd(), 'public/assets/ui/plugins/avisador_vinyeta.webp'))).toBe(true);
    expect(existsSync(path.join(process.cwd(), 'public/assets/ui/plugins/avisador_vinyeta-social-1200x630.jpg'))).toBe(true);
    // 3 · L'interruptor declaratiu de build (la prova de baix en fixa el literal i el comportament).
    expect(fontRegistre).toContain(`const AVISADOR_COMPILAT = ${LITERAL_AVISADOR};`);
    // L'entradilla diu la veritat: qui rep l'avís, la condició, on viuen els ajustos i el que no substituïx.
    expect(avisador.entradilla).toContain('fins a tres persones de confiança');
    expect(avisador.entradilla).toContain('Només amb la sessió oberta, Sóc de Poble en marxa i el Xat disponible.');
    expect(avisador.entradilla).toContain('els ajustos es guarden en este dispositiu');
    expect(avisador.entradilla).toContain('No substituïx el telèfon d’emergències ni la teleassistència.');
    // L'Avisador no és cap app de la plataforma: el seu destí és la seua pàgina d'App.jsx.
    expect(appDelPlugin(avisador)).toBeNull();
    expect(esRutaDeVeres(avisador.obrir)).toBe(true);
  });

  /* P0-114 (ordre del Mestre, 261111: «afegeix l'interruptor declaratiu necessari … perquè no
     desaparega mai del Panell de Control») · El mateix literal plegable de build que les apps de
     P0-113, a cada lloc que munta L'Avisador: al registre (destí, espai i pàgina), a App.jsx (els dos
     trossos diferits, la ruta /page/avisador i el vigilant) i al Perfil (aplicacions.test.js). Per
     defecte hi és sempre; només VITE_SDP_APP_AVISADOR=0 el trau, i del tot. */
  test('P0-114 · el literal de l’interruptor és el mateix a registrePlugins.js i a cada lloc d’App.jsx', () => {
    expect(fontRegistre.split(LITERAL_AVISADOR)).toHaveLength(2);
    expect(fontRegistre).toContain("obrir: AVISADOR_COMPILAT ? '/page/avisador' : null,");
    expect(fontRegistre).toContain("espai: AVISADOR_COMPILAT ? 'llar' : null,");
    expect(fontRegistre).toContain("if (id === 'avisador' && !AVISADOR_COMPILAT) return null;");
    expect(fontApp).toContain(`const AvisadorPage = ${LITERAL_AVISADOR} ? lazyRoute(() => import('../pages/AvisadorPage.jsx')) : null;`);
    expect(fontApp).toContain(`const AvisadorEnSessio = ${LITERAL_AVISADOR} ? lazyRoute(() => import('../components/salut/AvisadorEnSessio.jsx')) : null;`);
    expect(fontApp).toContain(`{${LITERAL_AVISADOR} ? <Route path="/page/avisador" element={<AvisadorPage />} /> : null}`);
    expect(fontApp).toContain(`{${LITERAL_AVISADOR} ? <AvisadorAjornat config={config} targetNode={targetNode} /> : null}`);
    // Cap muntatge fora del literal: una sola ruta, un sol vigilant i quatre usos del literal a App.jsx.
    expect(fontApp.match(/<AvisadorPage \/>/g)).toHaveLength(1);
    expect(fontApp.match(/<AvisadorAjornat /g)).toHaveLength(1);
    expect(fontApp.split(LITERAL_AVISADOR)).toHaveLength(5);
    // La ruta continua abans de /page/:slug, que la recull quan el build no la porta.
    const rutes = rutesDApp();
    expect(rutes.indexOf('/page/avisador')).toBeGreaterThanOrEqual(0);
    expect(rutes.indexOf('/page/avisador')).toBeLessThan(rutes.indexOf('/page/:slug'));
  });

  test('P0-114 · amb VITE_SDP_APP_AVISADOR=0 L’Avisador desapareix del Panell i de /plugin; qualsevol altre valor el deixa', async () => {
    try {
      vi.stubEnv('VITE_SDP_APP_AVISADOR', '0');
      vi.resetModules();
      const apagat = await import('./registrePlugins.js');
      expect(apagat.pluginPerId('avisador')).toBeNull();
      expect(apagat.pluginsDeLEspai('llar').map((p) => p.id)).toEqual(['salut', 'genealogia']);
      const entrada = apagat.PLUGINS.find((p) => p.id === 'avisador');
      expect([entrada.obrir, entrada.espai]).toEqual([null, null]);
      // La resta del registre no canvia.
      expect(apagat.pluginPerId('salut')?.espai).toBe('llar');
      for (const valor of ['1', '', 'no']) {
        vi.stubEnv('VITE_SDP_APP_AVISADOR', valor);
        vi.resetModules();
        const ences = await import('./registrePlugins.js');
        expect([valor, ences.pluginPerId('avisador')?.obrir, ences.pluginsDeLEspai('llar').map((p) => p.id)])
          .toEqual([valor, '/page/avisador', ['salut', 'genealogia', 'avisador']]);
      }
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  /* Onada 8 (261009) · La Consola, el Cervell i el Panell de Disseny ja no
     són plugins: cap id ni cap títol seu al registre (/plugin/<id> és la
     404). Les il·lustracions es conserven al disc (cap esborrat). */
  test('la Consola, el Cervell i el Panell de Disseny ja no són del registre; les il·lustracions continuen al disc', () => {
    for (const id of ['consola', 'cervell', 'disseny']) {
      expect([id, IDS_PLUGINS.includes(id), pluginPerId(id)]).toEqual([id, false, null]);
      expect([id, existsSync(path.join(process.cwd(), 'public', IMATGES_PLUGINS, `${id}_vinyeta.jpg`))]).toEqual([id, true]);
    }
    expect(PLUGINS.filter((p) => /Consola|Cervell|Disseny/.test([p.titol, p.etiquetaObrir].join(' ')))).toEqual([]);
  });

  /* Ordre del Mestre (261007) · Bàscula descartada per ara: cap plugin, cap
     pàgina, cap targeta. La il·lustració es conserva al disc (cap esborrat),
     però cap entrada del registre la fa servir. */
  test('la Bàscula ja no és del registre: ni id, ni títol, ni il·lustració en ús', () => {
    expect(IDS_PLUGINS).not.toContain('bascula');
    expect(pluginPerId('bascula')).toBeNull();
    expect(PLUGINS.filter((p) => /b[aà]scula/i.test([p.titol, p.subtitol, p.entradilla, p.imatgeAlt, p.etiquetaObrir, p.imatge].join(' ')))).toEqual([]);
    expect(existsSync(path.join(process.cwd(), 'public/assets/ui/plugins/bascula_vinyeta.jpg'))).toBe(true);
  });

  test('la taula és immutable', () => {
    expect(Object.isFrozen(PLUGINS)).toBe(true);
    for (const plugin of PLUGINS) expect([plugin.id, Object.isFrozen(plugin)]).toEqual([plugin.id, true]);
  });

  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La del TPV del Bar ja és
     .webp (extensioImatge); la resta continua en .jpg, idèntica. Abans esta
     prova fixava .jpg per a totes: l'ordre ho canvia només per al TPV.
     Expectativa actualitzada a propòsit (ordre del Mestre, 261021, torn fase
     2, Mòdul B, P0-14) · Les del Mapa, Vehicle, Animalets, el Rebost i Salut
     també són .webp: el seu original .jpg ix de public/ (evacuat a
     _multimedia_de_poble/originals_raster_public/) i la bessona, amb les
     mateixes mides, és la il·lustració. La Gestoria i l'RSS continuen en .jpg.
     Abans: només la del TPV era .webp. */
  /* P0-114 (261111) · La de L'Avisador (Kit R17.3) va nàixer només en WebP, com la de l'Arbre. */
  const EN_WEBP = new Set(['mapa', 'vehicle', 'animalets', 'rebost', 'salut', 'genealogia', 'avisador', 'tpv']);
  test('cada il·lustració és /assets/ui/plugins/<id>_vinyeta.jpg (la del TPV i les del Mòdul B, .webp) i existix a public/', () => {
    expect(IMATGES_PLUGINS).toBe('/assets/ui/plugins');
    for (const { id, imatge } of PLUGINS) {
      expect([id, imatge]).toEqual([id, `/assets/ui/plugins/${id}_vinyeta.${EN_WEBP.has(id) ? 'webp' : 'jpg'}`]);
      expect([id, existsSync(path.join(process.cwd(), 'public', imatge))]).toEqual([id, true]);
    }
    // Les del Mòdul B: cap .jpg al costat, cap còpia doble al disc (la del TPV sí: és una altra imatge).
    for (const id of [...EN_WEBP].filter((x) => x !== 'tpv')) {
      expect([id, existsSync(path.join(process.cwd(), 'public', IMATGES_PLUGINS, `${id}_vinyeta.jpg`))]).toEqual([id, false]);
    }
    expect(PLUGINS.filter((p) => !EN_WEBP.has(p.id)).map((p) => p.id)).toEqual(['gestoria', 'rss']);
  });

  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat: capçalera i targeta, la
     mateixa imatge de 1.200 × 1.200 en WebP de menys de 80 KB) · La vinyeta
     del TPV es llig pels bytes: RIFF/WEBP de veres, quadrada de 1.200 i dins
     del pressupost. El .jpg d'abans es conserva al disc (cap esborrat).
     Gauntlet 261016 (MCR, Carril E · E3): el pressupost és el de la casa, PRESSUPOST_PUJADA (80.000 B,
     utils/pujadaImatge.js), i no 80 × 1.024 (81.920 B), que deixava passar 1.920 B de més. */
  test('Llei del Quadrat · la vinyeta del TPV és un WebP de 1.200 × 1.200 de menys de 80 KB, i el .jpg es conserva', () => {
    const bytes = readFileSync(path.join(process.cwd(), 'public', pluginPerId('tpv').imatge));
    expect(PRESSUPOST_PUJADA).toBe(80000);
    expect(bytes.length).toBeLessThan(PRESSUPOST_PUJADA);
    expect([bytes.toString('latin1', 0, 4), bytes.toString('latin1', 8, 12)]).toEqual(['RIFF', 'WEBP']);
    expect(midaWebp(bytes)).toEqual({ amplada: 1200, alcada: 1200 });
    expect(existsSync(path.join(process.cwd(), 'public/assets/ui/plugins/tpv_vinyeta.jpg'))).toBe(true);
    // Contraprova: el lector de mides no s'inventa res d'un fitxer que no és WebP.
    expect(midaWebp(readFileSync(path.join(process.cwd(), 'public/assets/ui/plugins/tpv_vinyeta.jpg')))).toBeNull();
  });

  test('cada plugin porta títol, subtítol, entradilla, alt i l’etiqueta d’Obrir, sense punt final als títols', () => {
    for (const plugin of PLUGINS) {
      for (const camp of ['titol', 'subtitol', 'entradilla', 'imatgeAlt', 'etiquetaObrir']) {
        expect([plugin.id, camp, typeof plugin[camp] === 'string' && plugin[camp].trim().length > 0]).toEqual([plugin.id, camp, true]);
      }
      expect([plugin.id, /[.]$/.test(plugin.titol) || /[.]$/.test(plugin.subtitol)]).toEqual([plugin.id, false]);
      expect([plugin.id, plugin.etiquetaObrir.startsWith('Obrir ')]).toEqual([plugin.id, true]);
    }
  });

  test('on porta cada «Obrir»: l’app o la secció de veres, o null (en obres)', () => {
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, p.obrir]))).toEqual({
      /* Fusió del kit v3.0.0 (AH-04) · El Panell publica al Mapa i a
         Animalets i App.jsx en servix les seccions (SeccioVertical): com
         Vehicle, deixen d'estar en obres. Abans: null. */
      mapa: '/mapa',
      /* llibre-deutes-02 (261104) · IDEA-61 ja servix la secció /vehicle
         (App.jsx, SeccioVertical): Vehicle Compartit deixa d'estar en obres.
         Abans: null. */
      vehicle: '/vehicle',
      animalets: '/animalets',
      /* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats
         entre Gestoria i Wiki») · la seua app. Ja no és cap ítem de la
         Wiki. P0-113 (261111) · Oberta en producció (vegeu la prova
         d'entorn); abans, només en desenvolupament. */
      gestoria: '/app/gestoria',
      rebost: '/app/nevera/casa',
      salut: '/app/salut',
      /* R19 · T3 (261111) · La seua app. Abans: null («en obres»). */
      genealogia: '/app/genealogia',
      /* P0-114 (261111) · La seua pàgina d'App.jsx, no cap app de la plataforma. */
      avisador: '/page/avisador',
      rss: '/app/lector',
      tpv: '/app/bar'
    });
  });

  /* llibre-deutes-02 (261104) · El registre i el Panell no es poden
     contradir. IDEA-61 va obrir les portes de Vehicle Compartit al Panell
     (destinsControl.js: Publicar i secció /vehicle), però el plugin es va
     quedar amb `obrir` null i una entradilla «Eina en obres», i
     /plugin/vehicle (i la seua vista prèvia social) ho continuava dient.
     Guarda: un plugin la porta del qual està oberta al Panell porta a la
     mateixa secció i la seua entradilla no diu que està en obres. */
  test('llibre-deutes-02 · un plugin amb la porta oberta al Panell no està en obres: porta a la seua secció', () => {
    const comuns = DESTINS_CONTROL.filter((desti) => IDS_PLUGINS.includes(desti.id));
    // Sonda: la guarda no és buida (Mapa, Vehicle Compartit i Animalets hi són als dos llocs).
    expect(comuns.map((desti) => desti.id)).toEqual(['mapa', 'vehicle', 'animalets']);
    const oberts = comuns.filter((desti) => desti.publicar !== null);
    /* Fusió del kit v3.0.0 (AH-04) · Gemini va obrir al Panell les portes de
       Mapa i Animalets; la guarda les va trobar «en obres» al registre, i el
       registre ara diu el mateix que el Panell. Abans: ['vehicle']. */
    expect(oberts.map((desti) => desti.id)).toEqual(['mapa', 'vehicle', 'animalets']);
    for (const desti of oberts) {
      const plugin = pluginPerId(desti.id);
      expect([desti.id, plugin.obrir]).toEqual([desti.id, desti.seccio]);
      expect([desti.id, /en obres/i.test(plugin.entradilla)]).toEqual([desti.id, false]);
    }
    // L'avís de privacitat del trajecte no se'n va amb l'«en obres».
    expect(pluginPerId('vehicle').entradilla).toContain('Un trajecte publicat diu a tothom el teu horari i el teu camí; les despeses les acordeu entre vosaltres, fora de l’app.');
    // Els avisos de privacitat del Mapa i d'Animalets tampoc se'n van amb l'«en obres».
    expect(pluginPerId('mapa').entradilla).toContain('Un punt publicat al mapa serà públic i el podrà localitzar qualsevol, també des d’altres pobles.');
    expect(pluginPerId('animalets').entradilla).toContain('El contacte que poses en una fitxa el veurà qualsevol persona, també sense compte, en obrir-la; no ix a la targeta ni a la cerca.');
    // I l'avís d'Animalets diu el que fa el contracte: el contacte és privat (fora de la targeta i de la cerca).
    expect(CAMPS.animalets.filter((campDef) => campDef.privat).map((campDef) => campDef.id)).toEqual(['contacte']);
  });

  /* Onada 8 (261009) · Derogada «la Consola i el Cervell porten a la ruta de
     la Consola (RUTA_CONSOLA)»: ja no són del registre. El seu botó «Obrir…»
     el confronta amb RUTA_CONSOLA systemPages.test.js. */

  /* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats entre
     Gestoria i Wiki») · La Gestoria porta a la seua app, amb la ruta que fa
     la plataforma (rutaDeApp, com rss i tpv), i a cap lloc de la Wiki. Cap
     paràmetre: ni noms, ni imports, ni fitxers (MAPA §2.2, R4). */
  test('la Gestoria porta a la seua app (/app/gestoria), mai a la Wiki ni a /gestoria', () => {
    const gestoria = pluginPerId('gestoria');
    expect(gestoria.obrir).toBe(rutaDeApp('gestoria'));
    expect(appDelPlugin(gestoria)).toBe('gestoria');
    const url = new URL(gestoria.obrir, 'https://poble.invalid');
    expect(url.pathname).toBe('/app/gestoria');
    expect(url.search).toBe('');
    expect(gestoria.obrir).not.toMatch(/wikidepoble|gestoria_|^\/gestoria/);
    /* P0-113 (ordre del Mestre, 261111) · L'app s'obri en producció i continua sent la de les
       dades financeres: només al document propi (amaDelDocument). Abans: entorn
       'desenvolupament' i actiuPerDefecte false. */
    const manifest = MANIFESTS_INTERNS.find((m) => m.id === 'gestoria');
    expect(manifest).toMatchObject({ actiuPerDefecte: true, dadesPersonals: 'financeres' });
    expect(manifest.entorn).not.toBe('desenvolupament');
    // Cap plugin porta a la Wiki de la Gestoria.
    expect(PLUGINS.filter((p) => typeof p.obrir === 'string' && /gestoria_/.test(p.obrir))).toEqual([]);
  });

  test('cada «Obrir» que no és null és una ruta que App servix de veres', () => {
    for (const { id, obrir } of PLUGINS) {
      if (obrir === null) continue;
      expect([id, esRutaDeVeres(obrir)]).toEqual([id, true]);
    }
    // Contraprova: el criteri no deixa passar una ruta que no existix.
    expect(esRutaDeVeres('/gestoria')).toBe(false);
    expect(esRutaDeVeres('/app/nevera/rebost-inexistent')).toBe(false);
    expect(esRutaDeVeres('/consola/cervell')).toBe(false);
    // Ni una d'ActorRoutes que només redirigix, ni un tram de més.
    expect(esRutaDeVeres('/skills')).toBe(false);
    expect(esRutaDeVeres('/disseny/fonaments')).toBe(false);
  });

  /* Onada 2 de la Gestoria (261004) · I la Gestoria: la seua app només
     s'obri en desenvolupament (ordre del Mestre, 261004).
     Onada 8 (261009) · La Consola i el Cervell, que també hi eren, ja no són
     del registre: hui només la Gestoria porta entorn.
     DEROGADA per P0-113 (ordre del Mestre, 261111: «ENCÉN en producció …
     Gestoria (`/app/gestoria`) … amb `entorn: null`») · Cap plugin porta
     entorn, i la Gestoria ja no diu que està en obres ni que només s'obri en
     desenvolupament: diu que està en proves i on es guarden les dades. */
  test('P0-113 · cap plugin porta entorn de desenvolupament; la Gestoria diu que està en proves', () => {
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, p.entorn]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: null,
      rebost: null, salut: null, genealogia: null, avisador: null, rss: null, tpv: null
    });
    const { entradilla } = pluginPerId('gestoria');
    expect(entradilla).toMatch(/en proves/);
    expect(entradilla).toMatch(/en este dispositiu/);
    expect(entradilla).not.toMatch(/en obres|desenvolupament|Wiki/);
  });

  /* P0-113 (ordre del Mestre, 261111: «Res dins de l'app ha de donar a entendre que es cobrarà
     per cap eina») · Cap text del registre ni dels espais parla de pagament, premium ni
     subscripció, i cap eina oberta diu que no està a punt per a tothom. */
  test('P0-113 · cap text del registre parla de pagament ni diu que l’eina no està a punt', () => {
    const textos = [
      ...ESPAIS_PLUGINS.flatMap((e) => [e.titol, e.entradeta]),
      ...Object.values(TEXTOS_ESPAIS_PLUGINS).flatMap((espais) => Object.values(espais).flatMap(({ titol, entradeta }) => [titol, entradeta])),
      ...PLUGINS.flatMap((p) => [p.titol, p.subtitol, p.entradilla, p.imatgeAlt, p.etiquetaObrir, ...p.etiquetes.map((e) => e.text)]),
      ...Object.values(TEXTOS_BETA_OBERTA)
    ];
    const PAGAMENT = /premium|pagament|\bpag(?:ar|a|ues)\b|de pago|subscripci|suscripci|subscription|contracta|tarifa/i;
    expect(textos.filter((text) => PAGAMENT.test(text))).toEqual([]);
    expect(PLUGINS.filter((p) => p.obrir !== null && /a punt per a tothom|en lloc del botó|només s’obri en desenvolupament/i.test(p.entradilla)).map((p) => p.id)).toEqual([]);
  });

  /* Onada 2 de la Gestoria (MAPA_EMPRESA_GESTORIA.txt §2.2; decisió A11 del
     Mestre, 261004: només les targetes que ja funcionen) · Els dos espais del
     Panell i qui viu en cada un. Un sol valor per plugin: cap targeta en dos
     espais, i la llar mai es barreja amb l'empresa (R3). */
  test('espais del Panell: «Economia i Empresa» i «La llar», separats, i cada plugin en un com a molt', () => {
    expect(ESPAIS_PLUGINS.map((e) => [e.id, e.titol])).toEqual([['empresa', 'Economia i Empresa'], ['llar', 'La llar']]);
    expect(Object.isFrozen(ESPAIS_PLUGINS)).toBe(true);
    for (const espai of ESPAIS_PLUGINS) {
      expect([espai.id, Object.isFrozen(espai), espai.entradeta.trim().length > 0]).toEqual([espai.id, true, true]);
    }
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, p.espai]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: 'empresa',
      tpv: 'empresa', rebost: 'empresa', salut: 'llar', genealogia: 'llar', avisador: 'llar', rss: null
    });
    expect(pluginsDeLEspai('empresa').map((p) => p.id)).toEqual(['gestoria', 'tpv', 'rebost']);
    /* P0-114 (ordre del Mestre, 261111) · «La llar»: Salut, Arbre Genealògic i L'Avisador. */
    expect(pluginsDeLEspai('llar').map((p) => p.id)).toEqual(['salut', 'genealogia', 'avisador']);
    // Cap id compartit entre els dos espais.
    const empresa = new Set(pluginsDeLEspai('empresa').map((p) => p.id));
    expect(pluginsDeLEspai('llar').filter((p) => empresa.has(p.id))).toEqual([]);
    // Només espais propis.
    for (const res of [null, undefined, '', 'Empresa', 'constructor', '__proto__', 'utilitats']) {
      expect([String(res), pluginsDeLEspai(res)]).toEqual([String(res), []]);
    }
  });

  /* R16b (C3-12) · Els espais en les cinc llengües de l'App i en cap altra. El valencià és
     ESPAIS_PLUGINS mateix; cada llengua porta els dos espais, congelats, amb títol i entradeta
     propis, i sense cap xifra (R1). */
  test('TEXTOS_ESPAIS_PLUGINS · ca, es, en, eu i gl; el valencià és el d’ESPAIS_PLUGINS', () => {
    expect(Object.keys(TEXTOS_ESPAIS_PLUGINS)).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    expect(Object.isFrozen(TEXTOS_ESPAIS_PLUGINS)).toBe(true);
    expect(TEXTOS_ESPAIS_PLUGINS.ca).toEqual({
      empresa: { titol: 'Economia i Empresa', entradeta: ESPAIS_PLUGINS[0].entradeta },
      llar: { titol: 'La llar', entradeta: ESPAIS_PLUGINS[1].entradeta }
    });
    expect(TEXTOS_ESPAIS_PLUGINS.es.empresa.titol).toBe('Economía y Empresa');
    expect(TEXTOS_ESPAIS_PLUGINS.es.llar.titol).toBe('El hogar');
    for (const [llengua, espais] of Object.entries(TEXTOS_ESPAIS_PLUGINS)) {
      expect([llengua, Object.isFrozen(espais), Object.keys(espais)]).toEqual([llengua, true, ['empresa', 'llar']]);
      for (const [id, { titol, entradeta }] of Object.entries(espais)) {
        expect([llengua, id, Object.isFrozen(espais[id]), titol.trim().length > 0, entradeta.trim().length > 0, /\d/.test(`${titol} ${entradeta}`)])
          .toEqual([llengua, id, true, true, true, false]);
      }
    }
    // Cada llengua diu una cosa pròpia: cap títol ni entradeta copiats del valencià.
    for (const llengua of ['es', 'en', 'eu', 'gl']) {
      for (const espai of ESPAIS_PLUGINS) {
        const textos = TEXTOS_ESPAIS_PLUGINS[llengua][espai.id];
        expect([llengua, espai.id, textos.titol === espai.titol, textos.entradeta === espai.entradeta]).toEqual([llengua, espai.id, false, false]);
      }
    }
  });

  /* R1 · Targetes estàtiques: cap xifra als textos d'un espai (ni a la seua
     entradeta). Les xifres només viuen dins de cada eina.
     Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
     DEROGADA EN PART: la targeta canònica porta la franja taronja amb data i
     hora, i `data` queda explícitament FORA d'esta regla. El motiu: és la
     data fixa del registre, la mateixa per a tothom, i no una dada de la
     persona (no ix de cap apunt, de cap comptador ni de cap eina). La resta
     de R1 continua, i s'estén als textos de les etiquetes noves, de tots els
     plugins: cap xifra. */
  test('R1 · cap xifra en els textos dels espais, de les seues targetes ni de les etiquetes; la data fixa del registre en queda fora', () => {
    const textos = [
      ...ESPAIS_PLUGINS.flatMap((e) => [e.titol, e.entradeta]),
      ...PLUGINS.filter((p) => p.espai).flatMap((p) => [p.titol, p.subtitol, p.entradilla, p.imatgeAlt, p.etiquetaObrir]),
      ...PLUGINS.flatMap((p) => p.etiquetes.map((etiqueta) => etiqueta.text))
    ];
    expect(textos.filter((text) => /\d/.test(text))).toEqual([]);
    // Sonda: la data sí que porta xifres, i per això no és a la llista de dalt.
    expect(pluginsDeLEspai('empresa').map((p) => /\d/.test(p.data))).toEqual([true, true, true]);
    expect(pluginsDeLEspai('llar').map((p) => /\d/.test(p.data))).toEqual([true, true, true]);
  });

  /* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4:
     «totes les targetes de plugin del Panell passen a targeta canònica») ·
     Els dos camps nous. Existixen a TOTS els plugins (qui els llig no ha de
     preguntar si hi són), i només els porten plens els que tenen targeta de
     plugin al Panell. */
  test('Onada 10 · tots els plugins porten `data` i `etiquetes`; plens, només els que tenen targeta de plugin al Panell (AMB_TARGETA_DE_PLUGIN)', () => {
    for (const plugin of PLUGINS) {
      expect([plugin.id, Object.hasOwn(plugin, 'data'), Object.hasOwn(plugin, 'etiquetes')]).toEqual([plugin.id, true, true]);
      expect([plugin.id, plugin.data === null || typeof plugin.data === 'string', Array.isArray(plugin.etiquetes)]).toEqual([plugin.id, true, true]);
    }
    expect(PLUGINS.filter((p) => p.data !== null).map((p) => p.id)).toEqual(AMB_TARGETA_DE_PLUGIN);
    expect(PLUGINS.filter((p) => p.etiquetes.length > 0).map((p) => p.id)).toEqual(AMB_TARGETA_DE_PLUGIN);
    // La resta: null i llista buida, ni un píxel canvia.
    for (const id of SENSE_TARGETA_DE_PLUGIN) {
      expect([id, pluginPerId(id).data, pluginPerId(id).etiquetes]).toEqual([id, null, []]);
    }
    /* Cap altre camp nou: el text llarg de la pàgina viu a presentacioPlugins.js.
       R18 · T2 (P0-101) · Llevat d'`estat`, el camp declaratiu de la insígnia,
       l'únic que s'hi afig (la prova de baix en fixa els valors). */
    for (const plugin of PLUGINS) {
      expect([plugin.id, Object.keys(plugin)]).toEqual([plugin.id, [
        'id', 'titol', 'subtitol', 'entradilla', 'imatge', 'imatgeAlt', 'obrir', 'entorn', 'espai', 'etiquetaObrir', 'data', 'etiquetes', 'estat'
      ]]);
    }
  });

  test('Onada 10 · les llistes d’etiquetes i cada etiqueta estan congelades, també les buides', () => {
    for (const plugin of PLUGINS) {
      expect([plugin.id, Object.isFrozen(plugin.etiquetes)]).toEqual([plugin.id, true]);
      for (const etiqueta of plugin.etiquetes) {
        expect([plugin.id, etiqueta.text, Object.isFrozen(etiqueta)]).toEqual([plugin.id, etiqueta.text, true]);
      }
    }
    // Cap llista compartida entre dos plugins: tocar-ne una no en tocaria cap altra.
    expect(new Set(PLUGINS.map((p) => p.etiquetes)).size).toBe(PLUGINS.length);
  });

  /* La data: cap data inventada (T51 i D6). El criteri és el de les targetes
     de dalt, l'hora del document de l'ordre, i el mateix lector
     (dataHoraDeBarra) en trau l'hora i el dia de la franja taronja. */
  /* P0-114 (ordre del Mestre, 261111) · L'Avisador no és de l'ordre del 261004: porta la data del
     Kit R17.2 (DATES_PROPIES), amb el mateix format i el mateix lector. La resta, la de l'ordre. */
  test('Onada 10 · la data és un ISO amb desplaçament, la de l’ordre del 261004 (o la pròpia documentada), i dataHoraDeBarra en trau hora i dia', () => {
    const esperada = (id) => DATES_PROPIES[id] ?? DATA_DE_L_ORDRE;
    for (const id of AMB_TARGETA_DE_PLUGIN) {
      const { data } = pluginPerId(id);
      expect([id, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(data)]).toEqual([id, true]);
      expect([id, Number.isNaN(Date.parse(data))]).toEqual([id, false]);
      if (!Object.hasOwn(DATES_PROPIES, id)) {
        expect([id, dataHoraDeBarra({ creat: data })]).toEqual([id, { time: '00:15', date: '04/10/26', dateTime: DATA_DE_L_ORDRE }]);
      }
    }
    expect(dataHoraDeBarra({ creat: pluginPerId('avisador').data })).toEqual({ time: '00:30', date: '11/11/26', dateTime: DATA_DEL_KIT_R17_2 });
    expect(Object.fromEntries(AMB_TARGETA_DE_PLUGIN.map((id) => [id, pluginPerId(id).data])))
      .toEqual(Object.fromEntries(AMB_TARGETA_DE_PLUGIN.map((id) => [id, esperada(id)])));
    // Sense data, el lector no en fabrica cap: la pastilla no es pinta.
    expect(dataHoraDeBarra({ creat: pluginPerId('mapa').data })).toEqual({ time: '', date: '', dateTime: '' });
  });

  /* Les etiquetes: una Categoria i una Etiqueta, en l'ordre de la skill
     sdp-universal-page (§4), només amb `text` i `className` (cap `href`: el
     Panell no admet cap altre enllaç, D3). Els valors són un esborrany per al
     Mestre. */
  test('Onada 10 · cada targeta de plugin porta una Categoria i una Etiqueta, sense enllaç', () => {
    for (const id of AMB_TARGETA_DE_PLUGIN) {
      const { etiquetes } = pluginPerId(id);
      expect([id, etiquetes.map((etiqueta) => etiqueta.className)]).toEqual([id, ['sdp-badge-category', 'sdp-badge-tag']]);
      for (const etiqueta of etiquetes) {
        expect([id, Object.keys(etiqueta)]).toEqual([id, ['text', 'className']]);
        expect([id, typeof etiqueta.text === 'string' && etiqueta.text.trim() === etiqueta.text && etiqueta.text.length > 0]).toEqual([id, true]);
      }
    }
    expect(Object.fromEntries(AMB_TARGETA_DE_PLUGIN.map((id) => [id, pluginPerId(id).etiquetes.map((etiqueta) => etiqueta.text)]))).toEqual({
      gestoria: ['Eina', 'Factures'],
      rebost: ['Eina', 'Compra'],
      salut: ['Eina', 'Cures'],
      genealogia: ['Eina', 'Família'],
      /* P0-114 (ordre del Mestre, 261111: «classificacio('Cures') o classificacio('Companyia')») */
      avisador: ['Eina', 'Cures'],
      rss: ['Eina', 'Notícies'],
      tpv: ['Eina', 'Hostaleria']
    });
    // Una píndola no duplica el context: cap text d'etiqueta repetix el títol d'un espai ni el del plugin.
    const titolsDEspai = ESPAIS_PLUGINS.map((e) => e.titol);
    for (const plugin of PLUGINS) {
      for (const etiqueta of plugin.etiquetes) {
        expect([plugin.id, etiqueta.text, titolsDEspai.includes(etiqueta.text) || etiqueta.text === plugin.titol]).toEqual([plugin.id, etiqueta.text, false]);
      }
    }
  });

  test('appDelPlugin diu de quina app de la plataforma és l’«Obrir» (per als interruptors), o null', () => {
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, appDelPlugin(p)]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: 'gestoria',
      rebost: 'nevera', salut: 'salut', genealogia: 'genealogia', avisador: null, rss: 'lector', tpv: 'bar'
    });
    expect(appDelPlugin(null)).toBeNull();
  });

  /* R18 · T2 (P0-101; prompt 261111_0148) · `estat`, el camp declaratiu de la insígnia «En proves ·
     Beta oberta». Tractor-promesa: «oberta» vol dir que la persona la pot obrir ara, en producció.
     La prova fixa la IMPLICACIÓ, no una foto dels manifests.
     P0-113 (ordre del Mestre, 261111: «ENCÉN en producció TPV del Bar, Rebost Domèstic, Salut,
     Lector RSS i Gestoria … amb `actiuPerDefecte: true`, `entorn: null` … i insígnia «En proves ·
     Beta oberta»») · La implicació evoluciona amb l'ordre i conserva la intenció (cap insígnia
     que prometa el que no es pot obrir):
       · app oberta en producció (manifest sense entorn de desenvolupament, encés per defecte i
         compilat) amb dades al dispositiu (cap capacitat del backend) ⇒ 'proves', i l'entradilla
         ho diu: «en proves» i «en este dispositiu»;
       · en proves ⇒ té destí de veres, sense entorn de desenvolupament al registre i, si és
         d'una app, l'app és oberta;
       · app tancada (de desenvolupament o apagada per defecte) ⇒ null;
       · sense destí (obrir null) ⇒ null, i l'entradilla comença dient que està en obres.
     Abans (correcció de la T2): cap plugin la portava, perquè les cinc apps eren de
     desenvolupament i venien apagades. */
  const appTancada = (manifest) => manifest.entorn === 'desenvolupament' || manifest.actiuPerDefecte !== true || typeof manifest.carrega !== 'function';
  const dadesAlDispositiu = (manifest) => Array.isArray(manifest.capacitats) && manifest.capacitats.length === 0;
  test('R18 · T2 i P0-113 · `estat`: app oberta en producció amb dades al dispositiu ⇒ «Beta oberta»; tancada o en obres ⇒ cap', () => {
    expect(ESTAT_PROVES).toBe('proves');
    expect(CLASSE_BETA_OBERTA).toBe('sdp-insignia-beta-oberta');
    for (const plugin of PLUGINS) {
      const manifest = MANIFESTS_INTERNS.find((m) => m.id === appDelPlugin(plugin)) || null;
      const tancada = Boolean(manifest) && appTancada(manifest);
      if (manifest && !tancada && dadesAlDispositiu(manifest)) {
        expect([plugin.id, plugin.estat]).toEqual([plugin.id, ESTAT_PROVES]);
        expect([plugin.id, /en proves/.test(plugin.entradilla), /en este dispositiu/.test(plugin.entradilla)]).toEqual([plugin.id, true, true]);
      }
      if (plugin.estat === ESTAT_PROVES) {
        expect([plugin.id, typeof plugin.obrir, plugin.entorn, tancada]).toEqual([plugin.id, 'string', null, false]);
        expect([plugin.id, esRutaDeVeres(plugin.obrir)]).toEqual([plugin.id, true]);
      }
      if (tancada || plugin.obrir === null) expect([plugin.id, plugin.estat]).toEqual([plugin.id, null]);
      if (plugin.obrir === null) expect([plugin.id, plugin.entradilla.startsWith('Encara està en obres.')]).toEqual([plugin.id, true]);
    }
    // Sonda: la implicació no és buida. Les cinc eines d'app són obertes, amb les dades al dispositiu, i porten la insígnia.
    expect(PLUGINS.filter((p) => appDelPlugin(p)).map((p) => {
      const manifest = MANIFESTS_INTERNS.find((m) => m.id === appDelPlugin(p));
      return [p.id, appTancada(manifest), dadesAlDispositiu(manifest)];
    })).toEqual([
      /* R19 · T3 (261111) · I l'Arbre Genealògic: el seu manifest l'obri en producció i no demana cap capacitat del backend. */
      ['gestoria', false, true], ['tpv', false, true], ['rebost', false, true], ['salut', false, true], ['genealogia', false, true], ['rss', false, true]
    ]);
    /* P0-114 (ordre del Mestre, 261111: «estat: ESTAT_PROVES («En proves · Beta oberta»)») ·
       L'Avisador no és cap app: en proves perquè s'obri ara en producció (la seua pàgina d'App.jsx,
       sense entorn) i els seus ajustos viuen en este dispositiu, i l'entradilla ho diu.
       R19 · T3 (261111) · L'Arbre Genealògic, darrere de Salut. */
    expect(PLUGINS.filter((p) => p.estat === ESTAT_PROVES).map((p) => p.id)).toEqual(['gestoria', 'tpv', 'rebost', 'salut', 'genealogia', 'avisador', 'rss']);
    const avisador = pluginPerId('avisador');
    expect([appDelPlugin(avisador), avisador.entorn, /en proves/.test(avisador.entradilla), /en este dispositiu/.test(avisador.entradilla)])
      .toEqual([null, null, true, true]);
    /* R19 · T3 (261111) · Cap plugin sense destí. DEROGAT «L'Arbre Genealògic, l'únic sense destí,
       continua en obres i sense insígnia» ([['genealogia', null]]). El camí «en obres» de la pàgina
       continua provat amb una eina de prova (PluginPage.test.jsx, EINA_DE_PROVA). */
    expect(PLUGINS.filter((p) => p.obrir === null).map((p) => [p.id, p.estat])).toEqual([]);
    // Contraprova: el criteri de «tancada» no és buit (un manifest de desenvolupament, apagat o desendollat ho és).
    const oberta = MANIFESTS_INTERNS.find((m) => m.id === 'nevera');
    expect([
      appTancada(oberta), appTancada({ ...oberta, entorn: 'desenvolupament' }),
      appTancada({ ...oberta, actiuPerDefecte: false }), appTancada({ ...oberta, carrega: null })
    ]).toEqual([false, true, true, true]);
    expect(dadesAlDispositiu({ ...oberta, capacitats: ['apps'] })).toBe(false);
  });

  /* P0-113 (ordre del Mestre, 261111: «conservant `amaDelDocument` per a Salut/Gestoria») ·
     Obrir-les en producció no canvia la privacitat: les seues apps continuen declarant dades de
     salut i financeres, que la plataforma només obri al document propi. */
  test('P0-113 · Salut i la Gestoria continuen amb dades personals de salut i financeres (només al document propi)', () => {
    expect(['salut', 'gestoria'].map((id) => [id, MANIFESTS_INTERNS.find((m) => m.id === appDelPlugin(pluginPerId(id))).dadesPersonals]))
      .toEqual([['salut', 'salut'], ['gestoria', 'financeres']]);
  });

  /* R19 · T3 (ordre del Mestre, 261111; pla 261111_1720) · L'app existix i s'obri en producció:
     l'entradilla torna al present i cada frase té el seu text a l'app (tractor-promesa: cap present
     que el codi no faça). DEROGADA «R18 · T2 · l'entradilla de l'Arbre Genealògic diu que està en
     obres i parla en futur» (/^Encara està en obres\. Quan estiga a punt, guardarà /). */
  test('R19 · T3 · l’entradilla de l’Arbre Genealògic, en present i amb el que fa l’app', () => {
    const genealogia = pluginPerId('genealogia');
    const { entradilla } = genealogia;
    expect(genealogia).toMatchObject({ obrir: rutaDeApp('genealogia'), entorn: null, espai: 'llar', estat: ESTAT_PROVES });
    expect(appDelPlugin(genealogia)).toBe('genealogia');
    expect(esRutaDeVeres(genealogia.obrir)).toBe(true);
    // Cap futur ni cap obra: l'eina s'obri hui.
    expect(entradilla).not.toMatch(/en obres|Quan estiga a punt|guardarà|serà /);
    // Cada afirmació, contra el codi de l'app.
    const manifest = MANIFESTS_INTERNS.find((m) => m.id === 'genealogia');
    const textos = readFileSync(path.join(process.cwd(), 'src/apps/genealogia/textos.js'), 'utf8');
    const passos = readFileSync(path.join(process.cwd(), 'src/apps/genealogia/nucli/passosEntrevista.js'), 'utf8');
    expect(entradilla).toContain('una entrevista d’una pregunta cada vegada');
    expect(textos).toContain("'entrevista.regla': 'Una sola pregunta cada vegada.");
    expect(entradilla).toContain('des del malnom de la casa i el mas');
    expect(passos.indexOf("id: 'casa'")).toBeLessThan(passos.indexOf("id: 'lloc'"));
    expect(passos.indexOf("id: 'lloc'")).toBeLessThan(passos.indexOf("id: 'g4-jo'"));
    expect(entradilla).toContain('exportar en GEDCOM');
    expect(manifest.entrades.map((entrada) => entrada.slug)).toEqual(expect.arrayContaining(['entrevista', 'arbre', 'intercanvi']));
    expect(textos).toContain("'intercanvi.exporta.sec': 'GEDCOM 7.0, 5.5.1 o còpia JSON'");
    expect(entradilla).toContain('les dades es queden en este dispositiu');
    expect(textos).toContain("'avis.on': 'Les dades es queden en este dispositiu, en este navegador.");
    expect(entradilla).toContain('No cerca als arxius ni envia res.');
    expect(textos).toContain("'avis.noFa': 'L’app no cerca als arxius ni parla amb cap IA");
    expect(textos).toContain('No el puja enlloc');
    // Gratuïta, al dispositiu i sense backend: el manifest ho declara.
    expect(manifest).toMatchObject({ nivell: 'gratuit', capacitats: [], actiuPerDefecte: true, entorn: 'produccio', dadesPersonals: 'salut' });
    // També és la descripció del <head>: dins del límit, sencera.
    expect(entradilla.length).toBeLessThanOrEqual(LIMIT_DESCRIPCIO);
  });

  /* R19 · T3 · Cada entradilla és també la descripció social de la seua pàgina (PluginPage.seo.test.jsx
     la compara literal): cap es talla. */
  test('R19 · T3 · cap entradilla passa de LIMIT_DESCRIPCIO', () => {
    expect(LIMIT_DESCRIPCIO).toBe(300);
    expect(PLUGINS.filter((p) => p.entradilla.length > LIMIT_DESCRIPCIO).map((p) => [p.id, p.entradilla.length])).toEqual([]);
  });

  /* R19 · T3 (ordre del Mestre, 261111; pla 261111_1720: «perquè totes les eines del Panell de Control
     funcionen al 100%») · Zero enllaços inerts. Amb els interruptors per defecte (un build sense cap
     VITE_SDP_APP_*=0, producció i l'App ama del document, sense cap capacitat del backend), cada plugin
     que té targeta al Panell (data i etiquetes, Onada 10) porta a una ruta que App servix i, si és
     d'una app, la plataforma la deixa obrir: la pàgina /plugin/<id> pinta el seu «Obrir…» de veres. */
  const PER_DEFECTE = Object.freeze({ produccio: true, amaDelDocument: true, teCapacitat: () => false });
  /* El manifest VALIDAT del registre de la plataforma (APPS_INTERNES, origen 'interna'): el mateix que
     avalua useDestiDelPlugin. Un manifest invàlid no hi és i l'estat seria 'desconeguda'. */
  const estatPerDefecte = (ruta) => {
    const { dins, id } = analitzaRuta(ruta.split(/[?#]/)[0]);
    if (!dins) return 'seccio';
    const manifest = APPS_INTERNES.find((m) => m.id === id);
    return manifest ? avaluaApp(manifest, PER_DEFECTE).estat : 'desconeguda';
  };
  test('R19 · T3 · amb els interruptors per defecte, cap targeta del Panell es queda sense destí', () => {
    const delPanell = PLUGINS.filter((p) => p.data !== null);
    expect(delPanell.map((p) => p.id)).toEqual(AMB_TARGETA_DE_PLUGIN);
    for (const plugin of delPanell) {
      expect([plugin.id, typeof plugin.obrir, plugin.entorn]).toEqual([plugin.id, 'string', null]);
      expect([plugin.id, esRutaDeVeres(plugin.obrir)]).toEqual([plugin.id, true]);
      expect([plugin.id, estatPerDefecte(plugin.obrir)]).toEqual([plugin.id, appDelPlugin(plugin) ? 'available' : 'seccio']);
    }
    // Contraprova: el criteri veu una app apagada al build, una de desenvolupament i el document d'un altre.
    const arbre = APPS_INTERNES.find((m) => m.id === 'genealogia');
    expect(arbre.origen).toBe('interna');
    expect(avaluaApp({ ...arbre, carrega: null }, PER_DEFECTE)).toEqual({ estat: 'disabled', motiu: 'no-compilada' });
    expect(avaluaApp({ ...arbre, entorn: 'desenvolupament' }, PER_DEFECTE).estat).toBe('disabled');
    expect(avaluaApp(arbre, { ...PER_DEFECTE, amaDelDocument: false })).toEqual({ estat: 'unavailable', motiu: 'document-no-propi' });
  });

  /* R19 · T3 · I el Perfil (profile/aplicacions.js): cada utilitat «connectada» porta a una ruta que
     App i RutaApps resolen, la mateixa de la targeta del Panell que governa (`panell`), i la plataforma
     la deixa obrir per defecte. Cap fitxa del Perfil té un enllaç que el Panell no tinga. */
  /* Arbitratge del carril (P1) · I el Snippet: la seua targeta del Panell obri la seua fitxa
     (/control?fitxa=snippet), i la fitxa del Perfil hi porta. La recíproca compta totes les targetes de baix del
     Panell, no només les del registre (abans, el Snippet en quedava fora i continuava 'pendent'). */
  test('R19 · T3 · cap utilitat «connectada» del Perfil apunta a una ruta que App no servix', () => {
    const connectades = aplicacionsValides(APLICACIONS).filter((aplicacio) => aplicacio.estat === 'connectada');
    expect(connectades.map((aplicacio) => aplicacio.id)).toEqual(['gestoria', 'rebost', 'salut', 'genealogia', 'avisador', 'lector-rss', 'tpv', 'snippet']);
    for (const aplicacio of connectades) {
      expect([aplicacio.id, esRutaDeVeres(aplicacio.ruta)]).toEqual([aplicacio.id, true]);
      expect([aplicacio.id, aplicacio.ruta]).toEqual([aplicacio.id, rutaDeLaTargeta(aplicacio.panell)]);
      expect([aplicacio.id, estatPerDefecte(aplicacio.ruta)]).toEqual([aplicacio.id, appDelPlugin(pluginPerId(aplicacio.panell)) ? 'available' : 'seccio']);
    }
    expect(rutaDeLaTargeta(FITXA_SNIPPET)).toBe('/control?fitxa=snippet');
    // I a l'inrevés: cada targeta de baix del Panell (les del registre i la del Snippet) té la seua fitxa connectada al Perfil.
    expect(targetesDelPanell(PLUGINS).sort()).toEqual(connectades.map((aplicacio) => aplicacio.panell).sort());
  });

  /* R19 · Arbitratge del carril Genealogia + Perfil (P1, tractor-promesa) · El paquet de l'amfitrió fixa a '0' la
     Gestoria, Salut i l'Arbre Genealògic «Sempre … Cap variable de l'entorn ho canvia» (vite.standalone.config.js,
     per les seues dades). Allí la persona no les pot obrir: cap insígnia «Beta oberta», cap targeta al Panell i cap
     fitxa al Perfil, com L'Avisador amb el seu =0. La pàgina /plugin/<id> continua i diu per què no s'obri
     (useDestiDelPlugin). Cada interruptor només trau la seua, i la correspondència Panell ↔ Perfil continua
     sencera. Abans, la targeta, la insígnia i l'entradilla en present no miraven el build. */
  test('arbitratge R19 · amb VITE_SDP_APP_<ID>=0, la Gestoria, Salut i l’Arbre perden la insígnia, la targeta i la fitxa del Perfil', async () => {
    const config = readFileSync(path.join(process.cwd(), 'vite.standalone.config.js'), 'utf8');
    expect(config).toContain("export const DADES_NOMES_AL_DOCUMENT_PROPI = Object.freeze(['salut', 'financeres']);");
    for (const [id, variable, app] of NOMES_A_LA_WEB_PROPIA) {
      const literal = `import.meta.env.VITE_SDP_APP_${variable} !== '0'`;
      // El mateix literal que el `carrega` del manifest, una sola vegada al registre.
      expect([id, fontRegistre.includes(`const ${variable}_COMPILADA = ${literal};`), fontRegistre.split(literal).length - 1]).toEqual([id, true, 1]);
      expect([id, readFileSync(path.join(process.cwd(), `src/apps/${app}/manifest.js`), 'utf8').includes(`carrega: ${literal} ? () => import(`)])
        .toEqual([id, true]);
      // I són de les dades que el paquet de l'amfitrió no porta mai.
      expect([id, ['salut', 'financeres'].includes(MANIFESTS_INTERNS.find((m) => m.id === app).dadesPersonals)]).toEqual([id, true]);
    }
    try {
      for (const [id, variable, , espai] of NOMES_A_LA_WEB_PROPIA) {
        vi.stubEnv(`VITE_SDP_APP_${variable}`, '0');
        vi.resetModules();
        const registre = await import('./registrePlugins.js');
        const perfil = await import('../profile/aplicacions.js');
        const plugin = registre.pluginPerId(id);
        // La pàgina continua, amb el mateix destí, sense insígnia ni targeta.
        expect([id, plugin.obrir, plugin.espai, plugin.estat]).toEqual([id, pluginPerId(id).obrir, null, null]);
        expect([id, registre.etiquetesAmbEstat(plugin, 'ca') === plugin.etiquetes]).toEqual([id, true]);
        expect([id, registre.pluginsDeLEspai(espai).some((p) => p.id === id)]).toEqual([id, false]);
        // Cap fitxa al Perfil: ni connectada ni pendent.
        expect([id, perfil.APLICACIONS.some((aplicacio) => aplicacio.id === id)]).toEqual([id, false]);
        // La resta no canvia.
        for (const [altra, , , espaiAltra] of NOMES_A_LA_WEB_PROPIA.filter(([candidat]) => candidat !== id)) {
          expect([id, altra, registre.pluginPerId(altra).estat, registre.pluginPerId(altra).espai]).toEqual([id, altra, ESTAT_PROVES, espaiAltra]);
          expect([id, altra, perfil.APLICACIONS.find((aplicacio) => aplicacio.id === altra)?.estat]).toEqual([id, altra, 'connectada']);
        }
        // La correspondència Panell ↔ Perfil continua sencera.
        const connectades = perfil.aplicacionsValides(perfil.APLICACIONS).filter((aplicacio) => aplicacio.estat === 'connectada');
        expect([id, targetesDelPanell(registre.PLUGINS).sort()]).toEqual([id, connectades.map((aplicacio) => aplicacio.panell).sort()]);
        vi.unstubAllEnvs();
      }
      // Les tres alhora, com el paquet de l'amfitrió.
      for (const [, variable] of NOMES_A_LA_WEB_PROPIA) vi.stubEnv(`VITE_SDP_APP_${variable}`, '0');
      vi.resetModules();
      const amfitrio = await import('./registrePlugins.js');
      expect(amfitrio.pluginsDeLEspai('empresa').map((p) => p.id)).toEqual(['tpv', 'rebost']);
      expect(amfitrio.pluginsDeLEspai('llar').map((p) => p.id)).toEqual(['avisador']);
      expect(amfitrio.PLUGINS.filter((p) => p.estat === ESTAT_PROVES).map((p) => p.id)).toEqual(['tpv', 'rebost', 'avisador', 'rss']);
      // Qualsevol altre valor la deixa encesa.
      for (const valor of ['1', '', 'no']) {
        vi.unstubAllEnvs();
        vi.stubEnv('VITE_SDP_APP_GENEALOGIA', valor);
        vi.resetModules();
        const ences = await import('./registrePlugins.js');
        expect([valor, ences.pluginPerId('genealogia').estat, ences.pluginsDeLEspai('llar').map((p) => p.id)])
          .toEqual([valor, ESTAT_PROVES, ['salut', 'genealogia', 'avisador']]);
      }
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });

  test('R18 · T2 · TEXTOS_BETA_OBERTA en les cinc llengües, i etiquetesAmbEstat no toca mai les dues del registre', () => {
    expect(TEXTOS_BETA_OBERTA).toEqual({
      ca: 'En proves · Beta oberta', es: 'En pruebas · Beta abierta', en: 'In testing · Open beta',
      gl: 'En probas · Beta aberta', eu: 'Probetan · Beta irekia'
    });
    expect(Object.isFrozen(TEXTOS_BETA_OBERTA)).toBe(true);
    /* Salut, en proves des de P0-113 (ordre del Mestre, 261111): les dues etiquetes del registre
       i `estat`. Abans era una eina de prova feta ací. */
    const salut = pluginPerId('salut');
    const enProves = salut;
    expect(salut.estat).toBe(ESTAT_PROVES);
    for (const [idioma, llengua] of [['ca', 'ca'], ['es-ES', 'es'], ['EN', 'en'], ['gl', 'gl'], ['eu', 'eu'], ['fr', 'ca'], ['__proto__', 'ca'], [undefined, 'ca']]) {
      const pintades = etiquetesAmbEstat(enProves, idioma);
      expect([String(idioma), pintades.slice(0, 2)]).toEqual([String(idioma), [...salut.etiquetes]]);
      expect([String(idioma), pintades[2]]).toEqual([String(idioma), { text: TEXTOS_BETA_OBERTA[llengua], className: CLASSE_BETA_OBERTA }]);
      expect([String(idioma), pintades.length, Object.isFrozen(pintades), Object.isFrozen(pintades[2]), Object.hasOwn(pintades[2], 'href')])
        .toEqual([String(idioma), 3, true, true, false]);
    }
    // El registre no canvia: continua amb exactament dues etiquetes.
    expect(salut.etiquetes).toHaveLength(2);
    // Un valor d'`estat` que no és 'proves' no pinta cap insígnia.
    expect(etiquetesAmbEstat({ ...salut, estat: 'obres' }, 'ca')).toBe(salut.etiquetes);
    // Un plugin estable torna la seua llista del registre, la mateixa referència.
    for (const plugin of PLUGINS.filter((p) => p.estat === null)) {
      expect([plugin.id, etiquetesAmbEstat(plugin, 'es') === plugin.etiquetes]).toEqual([plugin.id, true]);
    }
    // Sense plugin, cap etiqueta.
    expect(etiquetesAmbEstat(null, 'ca')).toEqual([]);
    // Cap xifra a la insígnia (R1).
    expect(Object.values(TEXTOS_BETA_OBERTA).filter((text) => /\d/.test(text))).toEqual([]);
  });

  test('pluginPerId només troba ids propis', () => {
    expect(pluginPerId('gestoria')?.titol).toBe('Gestoria');
    for (const res of ['', 'constructor', '__proto__', 'toString', 'Gestoria', 'gestoria/', null, undefined, 3]) {
      expect([String(res), pluginPerId(res)]).toEqual([String(res), null]);
    }
  });

  test('la ruta de la pàgina i la clau de la portada', () => {
    expect(rutaDelPlugin('gestoria')).toBe('/plugin/gestoria');
    expect(clauPortadaDelPlugin('gestoria')).toBe('plugin:gestoria');
  });

  test('App munta /plugin/:id abans del comodí "/*"', () => {
    const rutes = rutesDApp();
    expect(rutes).toContain('/plugin/:id');
    expect(rutes.indexOf('/plugin/:id')).toBeLessThan(rutes.indexOf('/*'));
  });
});
