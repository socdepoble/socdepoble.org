// @vitest-environment node
/* Neteja 261007 (prompt 261007_1628, peça D: Consola, només canvis píxel
   idèntics) · Dos canvis de rendiment de xifresMas.js que no han de moure
   cap píxel:
    · detallXifra accepta la xifra que qui crida ja ha buscat (PaginaXifra):
      xifraDelMas recorre totes les vistes de la Consola i es feia tres
      vegades per pintada. Amb la xifra donada, el detall és el mateix.
    · Les mesures de consola.json es guarden per lectura i idioma, com les del
      Mapa: es calculen una sola vegada per lectura i idioma.
   Esmena del revisor adversarial (peça D) · El rellotge no es guarda: cada
   crida porta el seu, com abans de la memòria. Si es guardara, «Últim rebut
   fa N dies» quedaria congelat fins a una lectura nova i la pàgina es
   contradiria amb el tauler i el panell del pols, que en porten un de fresc. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { detallXifra, targetesDeLaConsola, xifraDelMas } from './xifresMas.js';
import { dataLocal } from './consolaContent.js';

const metrica = (nom, extra) => ({ metrica: nom, unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: 'p', ...extra });
const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:core-identitat', tipus: 'skill', font: null, atributs: {} }
  ],
  arestes: [],
  tasques: [
    { id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: 'tooling/x.mjs', font: null },
    { id: 'setmanal', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 's' }, cadencia: { cron: '0 3 * * 1' }, script: null, font: null }
  ],
  avisos: [{ node: 'skill:core-identitat', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' }],
  salut: [metrica('ledger-fossils', { valor: 8, unitat: 'segells fòssils' }), metrica('vigilants-vius', { valor: 'N/A', prova: null })]
};
const REBUT = '2026-09-20T01:03:39.000Z';
const consola = () => ({
  generat: '2026-09-25T13:00:00.000Z',
  consums: [{ agent: 'claude', entrada: 1200, eixida: 300 }],
  skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
  rebuts: [{ t: REBUT, peticio: 'ced19fcaab00ffff', protocols: ['a/b.md'], fonts: [{ ruta: 'x', sha256: 'y' }] }],
  immunitari: { operacions: 3, ultima: { op: 'OP-3', tipus: 'ADOPTA', fitxer: 'x.md', data: '2026-08-03T13:43:04.716Z' } },
  fonts: { diari: { estat: 'ok', 'línies_descartades': 1 }, immunitari: { estat: 'ok', 'línies_descartades': 0 } }
});
const DIA = 24 * 60 * 60 * 1000;

afterEach(() => { vi.useRealTimers(); });

describe('detallXifra amb la xifra ja buscada', () => {
  test.each([
    ['amb les dues fonts', MAPA, consola()],
    ['només amb el Mapa', MAPA, null],
    ['només amb consola.json', null, consola()]
  ])('%s: el detall és el mateix que sense donar-la', (_nom, mapa, dades) => {
    const slugs = [...targetesDeLaConsola(mapa, dades).keys()];
    expect(slugs.length).toBeGreaterThan(5);
    for (const slug of slugs) {
      const xifra = xifraDelMas(slug, mapa, dades);
      expect(detallXifra(slug, mapa, dades, 'ca-ES', xifra), slug).toEqual(detallXifra(slug, mapa, dades));
    }
  });

  test('la xifra donada mana: null és «no existix», encara que el slug en tinga', () => {
    expect(detallXifra('skills', MAPA)).not.toBeNull();
    expect(detallXifra('skills', MAPA, null, 'ca-ES', null)).toBeNull();
  });
});

describe('les mesures de consola.json, una vegada per lectura', () => {
  test('es calculen una sola vegada per lectura i idioma; un altre idioma les torna a calcular', () => {
    // Un getter que compta qui llig el segell: només el llig la mesura `segell`.
    let lectures = 0;
    const lectura = consola();
    Object.defineProperty(lectura, 'segell', {
      enumerable: true,
      get() {
        lectures += 1;
        return { hash: 'abcdef0123456789', filesCount: 30, timestamp: REBUT, manifest: {} };
      }
    });
    const titol = xifraDelMas('segell-de-skills', null, lectura, 'ca-ES').titol;
    expect(titol).toContain('30');
    expect(xifraDelMas('segell-de-skills', null, lectura, 'ca-ES').titol).toBe(titol);
    expect(lectures).toBe(1);
    xifraDelMas('segell-de-skills', null, lectura, 'en-US');
    expect(lectures).toBe(2);
  });

  test('el rellotge no es guarda: la mateixa lectura passa de dia sense Refrescar, com abans de la memòria', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse(REBUT) + 2 * DIA + 60 * 60 * 1000);
    const lectura = consola();
    expect(xifraDelMas('ultim-rebut', null, lectura).titol).toBe('Últim rebut fa 2 dies');
    expect(xifraDelMas('ultim-rebut', null, lectura).etiquetes).toBeNull();
    vi.setSystemTime(Date.parse(REBUT) + 12 * DIA + 60 * 60 * 1000);
    // La mateixa lectura, amb les mesures ja guardades, compta amb el rellotge d'ara.
    expect(xifraDelMas('ultim-rebut', null, lectura).titol).toBe('Últim rebut fa 12 dies');
    // Passat el llindar dels rebuts rancis (7 dies), l'etiqueta també ix sense una lectura nova.
    expect(xifraDelMas('ultim-rebut', null, lectura).etiquetes).not.toBeNull();
    const quan = detallXifra('ultim-rebut', null, lectura).taules[0].files.find((f) => f.clau === 'Quan');
    expect(quan.celes[1]).toEqual({ text: 'fa 12 dies' });
  });

  test('la memòria és per idioma: cada un formata les seues dates', () => {
    const lectura = consola();
    expect(xifraDelMas('ultim-rebut', null, lectura, 'ca-ES').subtitol).toBe(dataLocal(REBUT, 'ca-ES'));
    expect(xifraDelMas('ultim-rebut', null, lectura, 'en-US').subtitol).toBe(dataLocal(REBUT, 'en-US'));
    expect(xifraDelMas('ultim-rebut', null, lectura, 'ca-ES').subtitol).toBe(dataLocal(REBUT, 'ca-ES'));
  });

  test('dues crides amb la mateixa lectura donen les mateixes targetes', () => {
    const lectura = consola();
    const una = [...targetesDeLaConsola(MAPA, lectura).values()].map((x) => [x.slug, x.titol, x.subtitol]);
    const altra = [...targetesDeLaConsola(MAPA, lectura).values()].map((x) => [x.slug, x.titol, x.subtitol]);
    expect(altra).toEqual(una);
  });
});
