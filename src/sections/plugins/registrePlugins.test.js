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
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import fontApp from '../../app/App.jsx?raw';
import { MANIFESTS_INTERNS, analitzaRuta } from '../../apps/plataforma/registreApps.js';
import { rutaDeApp } from '../../apps/plataforma/manifestApp.js';
import { RUTA_CONSOLA, segmentPagina } from '../consola/consolaPagines.js';
import {
  ESPAIS_PLUGINS, IDS_PLUGINS, IMATGES_PLUGINS, PLUGINS, appDelPlugin, clauPortadaDelPlugin, pluginPerId, pluginsDeLEspai,
  rutaDelPlugin
} from './registrePlugins.js';

const ORDRE = ['mapa', 'vehicle', 'animalets', 'gestoria', 'rebost', 'salut', 'consola', 'cervell', 'disseny', 'rss', 'tpv'];

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
  test('onze ids, en l’ordre del Mestre, sense repetits', () => {
    expect(IDS_PLUGINS).toEqual(ORDRE);
    expect(PLUGINS.map((p) => p.id)).toEqual(ORDRE);
    expect(new Set(IDS_PLUGINS).size).toBe(11);
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

  test('cada il·lustració és /assets/ui/plugins/<id>_vinyeta.jpg i existix a public/', () => {
    expect(IMATGES_PLUGINS).toBe('/assets/ui/plugins');
    for (const { id, imatge } of PLUGINS) {
      expect(imatge).toBe(`/assets/ui/plugins/${id}_vinyeta.jpg`);
      expect([id, existsSync(path.join(process.cwd(), 'public', imatge))]).toEqual([id, true]);
    }
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
      consola: '/consola',
      cervell: '/consola/explorador',
      disseny: '/disseny',
      rss: '/app/lector',
      tpv: '/app/bar'
    });
  });

  test('la Consola i el Cervell porten a la ruta de la Consola (RUTA_CONSOLA), no a una còpia que divergisca', () => {
    expect(pluginPerId('consola').obrir).toBe(RUTA_CONSOLA);
    expect(pluginPerId('cervell').obrir).toBe(`${RUTA_CONSOLA}/explorador`);
  });

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
     s'obri en desenvolupament (ordre del Mestre, 261004). */
  test('la Consola, el Cervell i la Gestoria només s’obrin en desenvolupament', () => {
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, p.entorn]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: 'desenvolupament',
      rebost: null, salut: null, consola: 'desenvolupament', cervell: 'desenvolupament', disseny: null, rss: null, tpv: null
    });
    // Cap entradilla promet un accés en producció que no existix.
    expect(pluginPerId('consola').entradilla).not.toMatch(/superadministraci/);
    expect(pluginPerId('consola').entradilla).toMatch(/desenvolupament/);
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
      rebost: 'llar', salut: 'llar', consola: null, cervell: null, disseny: null, rss: null, tpv: null
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
     entradeta). Les xifres només viuen dins de cada eina. */
  test('R1 · cap xifra en els textos dels espais ni de les seues targetes', () => {
    const textos = [
      ...ESPAIS_PLUGINS.flatMap((e) => [e.titol, e.entradeta]),
      ...PLUGINS.filter((p) => p.espai).flatMap((p) => [p.titol, p.subtitol, p.entradilla, p.imatgeAlt, p.etiquetaObrir])
    ];
    expect(textos.filter((text) => /\d/.test(text))).toEqual([]);
  });

  test('appDelPlugin diu de quina app de la plataforma és l’«Obrir» (per als interruptors), o null', () => {
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, appDelPlugin(p)]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: 'gestoria',
      rebost: 'nevera', salut: 'salut', consola: null, cervell: null, disseny: null, rss: 'lector', tpv: 'bar'
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
