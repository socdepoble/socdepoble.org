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
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import fontApp from '../../app/App.jsx?raw';
import { MANIFESTS_INTERNS, analitzaRuta } from '../../apps/plataforma/registreApps.js';
import { rutaDeApp } from '../../apps/plataforma/manifestApp.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { PRESSUPOST_PUJADA } from '../../utils/pujadaImatge.js';
import { segmentPagina } from '../consola/consolaPagines.js';
import {
  ESPAIS_PLUGINS, IDS_PLUGINS, IMATGES_PLUGINS, PLUGINS, appDelPlugin, clauPortadaDelPlugin, pluginPerId, pluginsDeLEspai,
  rutaDelPlugin
} from './registrePlugins.js';

const ORDRE = ['mapa', 'vehicle', 'animalets', 'gestoria', 'rebost', 'salut', 'rss', 'tpv'];
/* Onada 10 (decisió M4 del Mestre, 261010) · Els que tenen targeta de plugin
   al Panell, i per tant data i etiquetes. Mapa, Vehicle Compartit i Animalets
   no: la seua targeta del Panell és la de dalt, la de publicació (W4-08). */
const AMB_TARGETA_DE_PLUGIN = ['gestoria', 'rebost', 'salut', 'rss', 'tpv'];
const SENSE_TARGETA_DE_PLUGIN = ['mapa', 'vehicle', 'animalets'];
/* L'hora del document de l'ordre (prompt 261004_0015), el criteri de les
   targetes de dalt (destinsControl.test.js). Pendent del Mestre: confirmar-la. */
const DATA_DE_L_ORDRE = '2026-10-04T00:15:00+02:00';

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
  test('huit ids, en l’ordre del Mestre, sense repetits', () => {
    expect(IDS_PLUGINS).toEqual(ORDRE);
    expect(PLUGINS.map((p) => p.id)).toEqual(ORDRE);
    expect(new Set(IDS_PLUGINS).size).toBe(8);
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
  const EN_WEBP = new Set(['mapa', 'vehicle', 'animalets', 'rebost', 'salut', 'tpv']);
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
      mapa: null,
      vehicle: null,
      animalets: null,
      /* Ordre del Mestre, 261004 («contaminació crítica de rutes/estats
         entre Gestoria i Wiki») · la seua app, només en desenvolupament
         (vegeu la prova d'entorn). Ja no és cap ítem de la Wiki. */
      gestoria: '/app/gestoria',
      rebost: '/app/nevera/casa',
      salut: '/app/salut',
      rss: '/app/lector',
      tpv: '/app/bar'
    });
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
    const manifest = MANIFESTS_INTERNS.find((m) => m.id === 'gestoria');
    expect(manifest).toMatchObject({ entorn: 'desenvolupament', actiuPerDefecte: false });
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
    expect(esRutaDeVeres('/app/nevera/rebost')).toBe(false);
    expect(esRutaDeVeres('/consola/cervell')).toBe(false);
    // Ni una d'ActorRoutes que només redirigix, ni un tram de més.
    expect(esRutaDeVeres('/skills')).toBe(false);
    expect(esRutaDeVeres('/disseny/fonaments')).toBe(false);
  });

  /* Onada 2 de la Gestoria (261004) · I la Gestoria: la seua app només
     s'obri en desenvolupament (ordre del Mestre, 261004).
     Onada 8 (261009) · La Consola i el Cervell, que també hi eren, ja no són
     del registre: hui només la Gestoria porta entorn. */
  test('la Gestoria només s’obri en desenvolupament', () => {
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, p.entorn]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: 'desenvolupament',
      rebost: null, salut: null, rss: null, tpv: null
    });
    // La Gestoria diu, honestament, que està en obres i on s'obri (ja no «dins de la Wiki»).
    expect(pluginPerId('gestoria').entradilla).toMatch(/en obres/);
    expect(pluginPerId('gestoria').entradilla).toMatch(/desenvolupament/);
    expect(pluginPerId('gestoria').entradilla).not.toMatch(/Wiki/);
  });

  /* Onada 2 de la Gestoria (MAPA_EMPRESA_GESTORIA.txt §2.2; decisió A11 del
     Mestre, 261004: només les targetes que ja funcionen) · Els dos espais del
     Panell i qui viu en cada un. Un sol valor per plugin: cap targeta en dos
     espais, i la llar mai es barreja amb l'empresa (R3). */
  test('espais del Panell: «L’empresa» i «La llar», separats, i cada plugin en un com a molt', () => {
    expect(ESPAIS_PLUGINS.map((e) => [e.id, e.titol])).toEqual([['empresa', 'L’empresa'], ['llar', 'La llar']]);
    expect(Object.isFrozen(ESPAIS_PLUGINS)).toBe(true);
    for (const espai of ESPAIS_PLUGINS) {
      expect([espai.id, Object.isFrozen(espai), espai.entradeta.trim().length > 0]).toEqual([espai.id, true, true]);
    }
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, p.espai]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: 'empresa',
      rebost: 'llar', salut: 'llar', rss: null, tpv: null
    });
    expect(pluginsDeLEspai('empresa').map((p) => p.id)).toEqual(['gestoria']);
    expect(pluginsDeLEspai('llar').map((p) => p.id)).toEqual(['rebost', 'salut']);
    // Cap id compartit entre els dos espais.
    const empresa = new Set(pluginsDeLEspai('empresa').map((p) => p.id));
    expect(pluginsDeLEspai('llar').filter((p) => empresa.has(p.id))).toEqual([]);
    // Només espais propis.
    for (const res of [null, undefined, '', 'Empresa', 'constructor', '__proto__', 'utilitats']) {
      expect([String(res), pluginsDeLEspai(res)]).toEqual([String(res), []]);
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
    expect(pluginsDeLEspai('llar').map((p) => /\d/.test(p.data))).toEqual([true, true]);
  });

  /* Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4:
     «totes les targetes de plugin del Panell passen a targeta canònica») ·
     Els dos camps nous. Existixen a TOTS els plugins (qui els llig no ha de
     preguntar si hi són), i només els porten plens els que tenen targeta de
     plugin al Panell. */
  test('Onada 10 · tots els plugins porten `data` i `etiquetes`; plens, només els cinc amb targeta de plugin al Panell', () => {
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
    // Cap altre camp nou: el text llarg de la pàgina viu a presentacioPlugins.js.
    for (const plugin of PLUGINS) {
      expect([plugin.id, Object.keys(plugin)]).toEqual([plugin.id, [
        'id', 'titol', 'subtitol', 'entradilla', 'imatge', 'imatgeAlt', 'obrir', 'entorn', 'espai', 'etiquetaObrir', 'data', 'etiquetes'
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
  test('Onada 10 · la data és un ISO amb desplaçament, la de l’ordre del 261004, i dataHoraDeBarra en trau hora i dia', () => {
    for (const id of AMB_TARGETA_DE_PLUGIN) {
      const { data } = pluginPerId(id);
      expect([id, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(data)]).toEqual([id, true]);
      expect([id, Number.isNaN(Date.parse(data))]).toEqual([id, false]);
      expect([id, dataHoraDeBarra({ creat: data })]).toEqual([id, { time: '00:15', date: '04/10/26', dateTime: DATA_DE_L_ORDRE }]);
    }
    expect(Object.fromEntries(AMB_TARGETA_DE_PLUGIN.map((id) => [id, pluginPerId(id).data])))
      .toEqual(Object.fromEntries(AMB_TARGETA_DE_PLUGIN.map((id) => [id, DATA_DE_L_ORDRE])));
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
      rebost: 'nevera', salut: 'salut', rss: 'lector', tpv: 'bar'
    });
    expect(appDelPlugin(null)).toBeNull();
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
