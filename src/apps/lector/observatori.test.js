// @vitest-environment node
/* Notícies del Poble · IDEA-265 (261118) · la carpeta «Observatori I+D · Mestres»: el canal que
   escriu el motor (tooling/brain/observatori-rss-mestres.mjs · generaRssObservatori), passat per
   l'analitzador del Lector (analitzaFeed) i llegit per observatori.js; i l'adaptador remot, que
   només el demana quan qui mira el veu. El canal de prova és el que escriu el motor, byte a byte
   (la prova ho comprova). Les peces són inventades. */
import { describe, expect, test, vi } from 'vitest';
import { DOMINIS_MESTRES_PERMESOS, generaRssObservatori } from '../../../tooling/brain/observatori-rss-mestres.mjs';
import { PECES, RSS_OBSERVATORI } from './__fixtures__/observatori.js';
import { creaAdaptadorRemot } from './fontRemota.js';
import { analitzaFeed } from './nucli/index.js';
import {
  CARPETA_OBSERVATORI, FONT_OBSERVATORI, NOM_OBSERVATORI, VEREDICTES, catalegAmbObservatori, esDeLObservatori,
  estatSenseObservatori, llegixEntradaObservatori, textPromocio
} from './observatori.js';

const articles = () => analitzaFeed(RSS_OBSERVATORI, { fontId: FONT_OBSERVATORI }).articles;
const hostsDe = (text) => [...text.matchAll(/\bhttps?:\/\/([^/\s?#]+)/g)].map((m) => m[1]);

describe('el canal del motor, llegit pel Lector', () => {
  test('el canal de prova és el que escriu el motor, byte a byte, i la llista de veredictes és la seua', () => {
    expect(generaRssObservatori(PECES, { dataGeneracio: new Date('2026-11-18T00:00:00Z') })).toBe(RSS_OBSERVATORI);
    expect(VEREDICTES).toEqual(['DESCARTAR', 'GUARDAR_VIGILANT_WP', 'PROPOSAR_IDEA_SISTEMA']);
  });

  test('els tres veredictes vàlids, el títol sense el prefix i les aplicacions; [ALTRE] és null', () => {
    const entrades = articles().map(llegixEntradaObservatori);
    expect(entrades).toHaveLength(4);
    expect(entrades.filter(Boolean).map((e) => e.veredicte)).toEqual(['PROPOSAR_IDEA_SISTEMA', 'GUARDAR_VIGILANT_WP', 'DESCARTAR']);
    expect(entrades[3]).toBeNull();
    expect(entrades[0]).toEqual({
      veredicte: 'PROPOSAR_IDEA_SISTEMA', titol: 'Memòria cau de fragments & SW', resum: 'Resum curt.', aplicacioSdp: 'Al Lector.',
      aplicacioWp: 'Al connector.', enllac: 'https://web.dev/articles/sw?utm=x#a'
    });
    expect(entrades[1]).toMatchObject({ titol: 'Nova capçalera CSP', resum: 'Vigilar.', aplicacioSdp: '', aplicacioWp: 'Mirar Vigilant.' });
    expect(entrades[2]).toMatchObject({ titol: 'Soroll', resum: 'Res.', aplicacioSdp: '', aplicacioWp: '' });
  });

  test('un article d’una altra font, o sense títol, no és de l’observatori', () => {
    const [primer] = articles();
    expect(llegixEntradaObservatori({ ...primer, fontId: 'veu-placa' })).toBeNull();
    expect(llegixEntradaObservatori({ ...primer, titol: 'Sense veredicte' })).toBeNull();
    expect(llegixEntradaObservatori(null)).toBeNull();
    expect(esDeLObservatori(primer.id)).toBe(true);
    expect(esDeLObservatori('veu-placa-3f9a0c17b2e4d851')).toBe(false);
  });

  test('la fitxa per al Llibre Mestre: el títol, el veredicte, l’origen sense consulta i cap host fora de la llista blanca', () => {
    const entrades = articles().map(llegixEntradaObservatori).filter(Boolean);
    const text = textPromocio(entrades[0]);
    expect(text).toContain('IDEA-265-OBS · Memòria cau de fragments & SW');
    expect(text).toContain('[PROPOSAR_IDEA_SISTEMA]');
    expect(text).toContain(`Origen: ${NOM_OBSERVATORI} · https://web.dev/articles/sw`);
    expect(text).not.toContain('utm=');
    expect(text).toContain('Sóc de Poble: Al Lector.');
    expect(text).toContain('WordPress Mestre: Al connector.');
    for (const entrada of entrades) {
      expect(hostsDe(textPromocio(entrada)).filter((host) => !DOMINIS_MESTRES_PERMESOS.includes(host))).toEqual([]);
    }
    /* Un enllaç que no és https no hi entra. */
    expect(textPromocio({ ...entrades[0], enllac: 'http://web.dev/x' })).not.toMatch(/http:/);
    expect(textPromocio(null)).toBe('');
  });
});

describe('el catàleg i l’adaptador remot: només qui veu l’observatori el demana', () => {
  const CATALEG = Object.freeze({
    categories: [{ id: 'coneixement', nom: 'Coneixement obert', ordre: 0 }],
    fonts: [{ id: 'bloc-pedra', nom: 'El Bloc de la Pedra', categoriaId: 'coneixement' }]
  });
  /* Un servei que ja declara la font de l'observatori (amb la categoria que siga). */
  const DECLARAT = Object.freeze({
    categories: CATALEG.categories,
    fonts: [...CATALEG.fonts, { id: FONT_OBSERVATORI, nom: 'Del servei', categoriaId: 'altra' }]
  });
  const XML_BLOC = `<?xml version="1.0"?><rss version="2.0"><channel><title>Bloc</title><link>https://example.org/</link>
    <item><title>Guia</title><link>https://example.org/guia</link><guid>g1</guid><pubDate>Sat, 03 Oct 2026 08:00:00 GMT</pubDate></item>
  </channel></rss>`;
  function creaServei(cataleg = CATALEG) {
    const peticions = new Map();
    return {
      peticions,
      fonts: vi.fn(async () => cataleg),
      feed: vi.fn(async (id) => {
        peticions.set(id, (peticions.get(id) || 0) + 1);
        return { xml: id === FONT_OBSERVATORI ? RSS_OBSERVATORI : XML_BLOC };
      })
    };
  }

  test('catalegAmbObservatori: amb (i declarada pel servei), la carpeta i la font al final; sense, cap rastre (tampoc si el servei les envia)', () => {
    const amb = catalegAmbObservatori(DECLARAT, true);
    expect(amb.categories.map((c) => c.id)).toEqual(['coneixement', CARPETA_OBSERVATORI]);
    expect(amb.fonts.map((f) => [f.id, f.categoriaId])).toEqual([['bloc-pedra', 'coneixement'], [FONT_OBSERVATORI, CARPETA_OBSERVATORI]]);
    const colat = catalegAmbObservatori({ categories: [...amb.categories], fonts: [...amb.fonts] }, false);
    expect(colat).toEqual({ categories: CATALEG.categories, fonts: CATALEG.fonts });
    /* Un servei que no la declara: el Lector no se la inventa, tampoc per a superadmins. */
    expect(catalegAmbObservatori(CATALEG, true)).toEqual({ categories: CATALEG.categories, fonts: CATALEG.fonts });
  });

  test('estatSenseObservatori: «Per a després» sense els desats de l’observatori; la resta, igual', () => {
    const estat = { llegits: [], despres: [{ id: `${FONT_OBSERVATORI}-b4b02ba4222c2169`, titol: '[DESCARTAR] x' }, { id: 'bloc-pedra-1', titol: 'Guia' }] };
    expect(estatSenseObservatori(estat)).toEqual({ llegits: [], despres: [{ id: 'bloc-pedra-1', titol: 'Guia' }] });
    expect(estat.despres).toHaveLength(2);
    const net = { llegits: [], despres: [{ id: 'bloc-pedra-1' }] };
    expect(estatSenseObservatori(net)).toBe(net);
    expect(estatSenseObservatori(null)).toBeNull();
  });

  test('sense superadmin: cap petició de la font de l’observatori, ni pel seu id ni per un enllaç profund', async () => {
    const servei = creaServei(DECLARAT);
    let veu = true;
    const adaptador = creaAdaptadorRemot({ servei, observatori: () => veu });
    const ambObservatori = await adaptador.llistaArticles();
    expect(servei.peticions.get(FONT_OBSERVATORI)).toBe(1);
    const id = ambObservatori.find((resum) => resum.fontId === FONT_OBSERVATORI).id;
    expect(await adaptador.article(id)).toMatchObject({ id, fontId: FONT_OBSERVATORI });
    veu = false;
    const { categories, fonts } = await adaptador.llistaFonts();
    expect(categories.map((c) => c.id)).toEqual(['coneixement']);
    expect(fonts.map((f) => f.id)).toEqual(['bloc-pedra']);
    expect((await adaptador.llistaArticles()).every((resum) => resum.fontId !== FONT_OBSERVATORI)).toBe(true);
    expect(await adaptador.llistaArticles({ fontId: FONT_OBSERVATORI })).toEqual([]);
    /* Ni de la memòria. */
    expect(await adaptador.article(id)).toBeNull();
    expect(servei.peticions.get(FONT_OBSERVATORI)).toBe(1);
  });

  test('sense `observatori` (o si llança), ningú no la veu', async () => {
    const servei = creaServei();
    await creaAdaptadorRemot({ servei }).llistaArticles();
    await creaAdaptadorRemot({ servei, observatori: () => { throw new Error('x'); } }).llistaArticles();
    expect(servei.peticions.has(FONT_OBSERVATORI)).toBe(false);
    expect(servei.peticions.get('bloc-pedra')).toBe(2);
  });
});
