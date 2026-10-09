import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/* Neteja 261007 (prompt 261007_1628, peça D: Consola, només canvis píxel
   idèntics) · Al DOM:
    · PaginaXifra rep la xifra que ConsolaSection ja ha buscat per al SEO i el
      peu, i no la torna a buscar (abans, tres voltes per pintada).
    · Els tons de les insígnies tenen una sola font (grafMapa.js): la taula
      de Salut i el detall d'una xifra pinten les mateixes classes i els
      mateixos textos que abans, i el N/A d'una mètrica continua neutre. */
const espia = vi.hoisted(() => ({ xifraDelMas: null, detallXifra: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* Esmena del revisor adversarial (peça D) · detallXifra també s'espia: el seu
   valor per defecte crida el xifraDelMas del mòdul original (vinculació
   interna), que l'espia de xifraDelMas no veu. Que PaginaXifra li passe la
   xifra és el que fa que el detall no la torne a buscar. */
vi.mock('./xifresMas.js', async (importOriginal) => {
  const original = await importOriginal();
  espia.xifraDelMas = vi.fn(original.xifraDelMas);
  espia.detallXifra = vi.fn(original.detallXifra);
  return { ...original, xifraDelMas: espia.xifraDelMas, detallXifra: espia.detallXifra };
});
import { RouterProvider } from '../../app/contexts/RouterContext';
import { PaginaXifra } from './XifresMas.jsx';
import { MapaConsola } from './mapa/MapaConsola.jsx';

const metrica = (nom, extra) => ({ metrica: nom, unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: 'p', ...extra });
const tasca = (id, estat) => ({ id, estat, llancador: { tipus: 'launchd', etiqueta: id }, cadencia: { cada_segons: 3600 }, script: `tooling/${id}.mjs`, font: null });
const ESTATS = ['viu', 'mort', 'declarat-sense-llancador', 'llancador-sense-declaracio', 'desconegut'];
const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'skill:a', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:b', tipus: 'skill', font: null, atributs: {} }
  ],
  arestes: [
    { de: 'skill:a', a: 'skill:b', tipus: 'crida', confianca: 'declarat', evidencia: null },
    { de: 'skill:b', a: 'skill:a', tipus: 'llig', confianca: 'derivat', evidencia: null },
    { de: 'skill:a', a: 'skill:a', tipus: 'crida', confianca: 'inferit', evidencia: null }
  ],
  tasques: ESTATS.map((e) => tasca(`t-${e}`, e)),
  avisos: [
    { node: 'skill:a', codi: 'orfe', severitat: 'alta', evidencia: null },
    { node: 'skill:b', codi: 'pes', severitat: 'mitjana', evidencia: null },
    { node: 'skill:a', codi: 'fora-index', severitat: 'baixa', evidencia: null }
  ],
  salut: [metrica('ledger-fossils', { valor: 8, unitat: 'segells fòssils' }), metrica('vigilants-vius', { valor: 'N/A', prova: null })]
};
const FONTS = Object.freeze({
  mapa: { mapa: MAPA, estat: 'ready', error: null },
  consola: { dades: null, estat: 'absent', error: null }
});

/* El que es pinta. Onada 6 (requisit 8, semàfor; semafor.js) · Canvi
   intencionat: sense llançador i desconegut passen a taronja, la confiança
   declarada a neutre i la severitat baixa a taronja (cap blau). Els textos no
   canvien. Derogat per l'Onada 6: les classes d'abans (neutre, neutre, info, info). */
const ABANS = Object.freeze({
  estat: {
    viu: ['exit', 'viu'], mort: ['error', 'mort'], 'declarat-sense-llancador': ['avis', 'sense llançador'],
    'llancador-sense-declaracio': ['avis', 'sense declaració'], desconegut: ['avis', 'desconegut']
  },
  confianca: { declarat: 'neutre', derivat: 'neutre', inferit: 'avis' },
  severitat: { alta: 'error', mitjana: 'avis', baixa: 'avis' }
});

/* Les insígnies d'una taula (Taula és una regió amb el seu títol), com
   [classe, text]. Les de la Salut són dins de desplegables tancats. */
const insignies = (titol) => {
  const taula = screen.getByRole('region', { name: titol, hidden: true });
  return [...taula.querySelectorAll('.sdp-insignia')].map((el) => [el.className, el.textContent]);
};
const classe = (to) => `sdp-insignia sdp-insignia--${to}`;

let errors;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  espia.xifraDelMas.mockClear();
  espia.detallXifra.mockClear();
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  localStorage.clear();
});

const pinta = (props) => render(
  <RouterProvider>
    <PaginaXifra fonts={FONTS} creat="2026-09-24" locale="ca-ES" {...props} />
  </RouterProvider>
);

describe('PaginaXifra rep la xifra ja buscada', () => {
  test('amb la xifra donada no la torna a buscar, ni per a la pàgina ni per al detall', async () => {
    const original = await vi.importActual('./xifresMas.js');
    const xifra = original.xifraDelMas('metriques-amb-mesura', MAPA);
    pinta({ slug: 'metriques-amb-mesura', xifra });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(xifra.titol);
    expect(espia.xifraDelMas).not.toHaveBeenCalled();
    // El detall rep la mateixa xifra i no entra al seu valor per defecte.
    expect(espia.detallXifra).toHaveBeenCalledWith('metriques-amb-mesura', MAPA, null, 'ca-ES', xifra);
  });

  test('sense la prop, la busca ella (qui la munta sense ConsolaSection)', () => {
    pinta({ slug: 'metriques-amb-mesura' });
    expect(espia.xifraDelMas).toHaveBeenCalledWith('metriques-amb-mesura', MAPA, null, 'ca-ES');
    // I la que ha trobat és la que passa al detall.
    const trobada = espia.xifraDelMas.mock.results[0].value;
    expect(espia.detallXifra).toHaveBeenCalledWith('metriques-amb-mesura', MAPA, null, 'ca-ES', trobada);
  });

  test('null és «no existix»: la pàgina ho diu sense buscar-la', () => {
    pinta({ slug: 'metriques-amb-mesura', xifra: null });
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Xifra no trobada');
    expect(espia.xifraDelMas).not.toHaveBeenCalled();
    expect(espia.detallXifra).not.toHaveBeenCalled();
  });
});

describe('els tons de les insígnies, píxel idèntics', () => {
  test('el detall d’una mètrica sense mesura continua dient N/A en una insígnia neutra', () => {
    pinta({ slug: 'metriques-amb-mesura' });
    expect(insignies('Funció de salut')).toEqual([[classe('neutre'), 'N/A']]);
  });

  test('el detall de les tasques pinta l’estat amb el to i el text d’abans', () => {
    pinta({ slug: 'coses-que-corren-soles' });
    const vistes = insignies('Tasques que llança launchd');
    expect(vistes.length).toBeGreaterThan(0);
    for (const [classeVista, text] of vistes) {
      const [to] = Object.values(ABANS.estat).find(([, t]) => t === text);
      expect(classeVista, text).toBe(classe(to));
    }
  });

  test('Avisos i salut: estat, confiança i severitat amb les classes d’abans', () => {
    render(<RouterProvider><MapaConsola locale="ca-ES" font={FONTS.mapa} /></RouterProvider>);
    expect(insignies('Tasques i llançadors')).toEqual(ESTATS.map((e) => [classe(ABANS.estat[e][0]), ABANS.estat[e][1]]));
    expect(insignies('Arestes del mapa')).toEqual(MAPA.arestes.map((a) => [classe(ABANS.confianca[a.confianca]), a.confianca]));
    const severitats = insignies('Avisos del mapa');
    expect(severitats.map(([, s]) => s).sort()).toEqual(['alta', 'baixa', 'mitjana']);
    for (const [classeVista, s] of severitats) expect(classeVista, s).toBe(classe(ABANS.severitat[s]));
    // La taula de Salut pinta el seu N/A sense passar per l'estat.
    expect(insignies('Funció de salut')).toEqual([[classe('neutre'), 'N/A']]);
  });
});
