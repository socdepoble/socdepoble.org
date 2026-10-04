/**
 * P7-A · Onada 4, setena passada · El registre de les utilitats (plugins):
 * una sola taula. Els ids en l'ordre del Mestre, cada il·lustració existix a
 * public/, i cada «Obrir» que no és null porta a una ruta de veres: una ruta
 * estàtica d'App (també les d'ActorRoutes, sota "/*"), una pàgina de la
 * Consola o una app de la plataforma amb l'entrada que diu. Cap ruta
 * inventada.
 * W4-08 (261004) · Dotze: MarIA hi ha afegit el Panell de Disseny
 * («disseny», després del Cervell), que obri /disseny (DesignSection).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import fontApp from '../../app/App.jsx?raw';
import { MANIFESTS_INTERNS, analitzaRuta } from '../../apps/plataforma/registreApps.js';
import { RUTA_CONSOLA, segmentPagina } from '../consola/consolaPagines.js';
import {
  IDS_PLUGINS, IMATGES_PLUGINS, PLUGINS, appDelPlugin, clauPortadaDelPlugin, pluginPerId, rutaDelPlugin
} from './registrePlugins.js';

const ORDRE = ['mapa', 'vehicle', 'animalets', 'gestoria', 'rebost', 'salut', 'consola', 'cervell', 'disseny', 'rss', 'tpv', 'bascula'];

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
  test('dotze ids, en l’ordre del Mestre, sense repetits', () => {
    expect(IDS_PLUGINS).toEqual(ORDRE);
    expect(PLUGINS.map((p) => p.id)).toEqual(ORDRE);
    expect(new Set(IDS_PLUGINS).size).toBe(12);
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
      gestoria: null,
      rebost: '/app/nevera/casa',
      salut: '/app/salut',
      consola: '/consola',
      cervell: '/consola/explorador',
      disseny: '/disseny',
      rss: '/app/lector',
      tpv: '/app/bar',
      bascula: null
    });
  });

  test('la Consola i el Cervell porten a la ruta de la Consola (RUTA_CONSOLA), no a una còpia que divergisca', () => {
    expect(pluginPerId('consola').obrir).toBe(RUTA_CONSOLA);
    expect(pluginPerId('cervell').obrir).toBe(`${RUTA_CONSOLA}/explorador`);
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

  test('la Consola i el Cervell només s’obrin en desenvolupament (les dades de /consola són del middleware de dev)', () => {
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, p.entorn]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: null,
      rebost: null, salut: null, consola: 'desenvolupament', cervell: 'desenvolupament', disseny: null, rss: null, tpv: null, bascula: null
    });
    // Cap entradilla promet un accés en producció que no existix.
    expect(pluginPerId('consola').entradilla).not.toMatch(/superadministraci/);
    expect(pluginPerId('consola').entradilla).toMatch(/desenvolupament/);
  });

  test('appDelPlugin diu de quina app de la plataforma és l’«Obrir» (per als interruptors), o null', () => {
    expect(Object.fromEntries(PLUGINS.map((p) => [p.id, appDelPlugin(p)]))).toEqual({
      mapa: null, vehicle: null, animalets: null, gestoria: null,
      rebost: 'nevera', salut: 'salut', consola: null, cervell: null, disseny: null, rss: 'lector', tpv: 'bar', bascula: null
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
