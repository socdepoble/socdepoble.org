/* Esquelet comú de catàleg i col·lecció · l'estat de vista a la URL
   (Clàusula dels Slugs): categoria, vista i article obert a la consulta, i
   catàleg o col·lecció al camí, amb push. */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../../app/contexts/RouterContext.jsx';
import { useVistaCataleg, useVistesEsquelet } from './vistes.js';

afterEach(cleanup);

let captura = null;
function Sonda({ primer, tram, vistaPerDefecte }) {
  const { pathname, search } = useLocation();
  captura = { vista: useVistaCataleg(vistaPerDefecte), vistes: useVistesEsquelet({ primer, tram }), navega: useNavigate() };
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const munta = (ruta, props = {}, basename = '') => render(
  <MemoryRouter rutaInicial={ruta} basename={basename}><Sonda {...props} /></MemoryRouter>
);
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

describe('useVistesEsquelet', () => {
  test('catàleg primer: on som i com anar a l’altra banda, conservant filtres i tancant el detall', () => {
    munta('/app/bar/caixa?categoria=cafes&vista=llista&article=tallat');
    expect(captura.vistes.veient).toBe('cataleg');
    expect(captura.vistes.cataleg.cami).toBe('/app/bar/caixa?categoria=cafes&vista=llista');
    expect(captura.vistes.colleccio.cami).toBe('/app/bar/caixa/colleccio?categoria=cafes&vista=llista');
    act(() => captura.vistes.colleccio.vesA());
    expect(ubicacio()).toBe('/app/bar/caixa/colleccio?categoria=cafes&vista=llista');
    expect(captura.vistes.veient).toBe('colleccio');
    act(() => captura.vistes.cataleg.vesA());
    expect(ubicacio()).toBe('/app/bar/caixa?categoria=cafes&vista=llista');
  });

  test('col·lecció primer i tram propi; els href porten la base del router', () => {
    munta('/app/compra/llista/', { primer: 'colleccio', tram: 'botiga' }, '/poble');
    expect(captura.vistes.veient).toBe('colleccio');
    expect(captura.vistes.cataleg.href).toBe('/poble/app/compra/llista/botiga');
    expect(captura.vistes.colleccio.href).toBe('/poble/app/compra/llista');
    act(() => captura.vistes.cataleg.vesA());
    expect(ubicacio()).toBe('/app/compra/llista/botiga');
    expect(captura.vistes.veient).toBe('cataleg');
  });
});

describe('useVistaCataleg', () => {
  test('llig i escriu categoria, vista i article; la vista per defecte no s’escriu', () => {
    munta('/app/bar/caixa');
    expect(captura.vista).toMatchObject({ categoria: null, vista: 'graella', article: null });
    act(() => captura.vista.triaVista('llista'));
    expect(ubicacio()).toBe('/app/bar/caixa?vista=llista');
    act(() => captura.vista.obriArticle('tallat'));
    expect(captura.vista.article).toBe('tallat');
    act(() => captura.vista.triaCategoria('cafes'));
    expect(ubicacio()).toBe('/app/bar/caixa?vista=llista&categoria=cafes');
    act(() => captura.vista.triaVista('graella'));
    act(() => captura.vista.triaCategoria(null));
    expect(ubicacio()).toBe('/app/bar/caixa');
  });

  test('la URL només porta slugs i ids opacs: un valor estrany ni es llig ni s’escriu', () => {
    munta('/app/bar/caixa?categoria=Caf%C3%A8s&vista=mosaic&article=..');
    expect(captura.vista).toMatchObject({ categoria: null, vista: 'graella', article: null });
    act(() => captura.vista.triaCategoria('Begudes fresques'));
    expect(ubicacio()).toBe('/app/bar/caixa?categoria=Caf%C3%A8s&vista=mosaic&article=..');
  });

  /* ESQ-R5 · Clàusula dels Slugs: arrere recorre vistes diferents. Tornar a
     triar el que ja es veu no apila cap entrada idèntica. */
  test('tornar a triar el que ja es veu no navega: el primer arrere torna a la vista d’abans', () => {
    munta('/app/bar/caixa');
    act(() => captura.vista.triaCategoria('cafes'));
    expect(ubicacio()).toBe('/app/bar/caixa?categoria=cafes');
    act(() => captura.vista.triaCategoria('cafes'));
    act(() => captura.vista.triaVista('graella'));
    act(() => captura.vista.tancaArticle());
    act(() => captura.vista.obriArticle('tallat'));
    act(() => captura.vista.obriArticle('tallat'));
    expect(ubicacio()).toBe('/app/bar/caixa?categoria=cafes&article=tallat');
    act(() => captura.navega(-1));
    expect(ubicacio()).toBe('/app/bar/caixa?categoria=cafes');
    act(() => captura.navega(-1));
    expect(ubicacio()).toBe('/app/bar/caixa');
  });

  test('una altra vista per defecte (la llista del TPV mòbil)', () => {
    munta('/app/bar/caixa', { vistaPerDefecte: 'llista' });
    expect(captura.vista.vista).toBe('llista');
    act(() => captura.vista.triaVista('graella'));
    expect(ubicacio()).toBe('/app/bar/caixa?vista=graella');
  });
});
