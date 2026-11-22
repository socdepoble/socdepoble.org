/* v1.2.19 · Gauntlet R1 (L3-01) · FacetaTaxonomia i FacetaEstil en les cinc
   llengües: el text visible de «Llevar», «Restaurar», «Afegir etiqueta» i
   «Cànon» ix del mateix diccionari que l'aria-label, i el nom accessible hi
   comença (WCAG 2.5.3, regla A11Y-1). Les plantilles reben nom i singular ja
   traduïts: res de «Etiquetes añadidas». En valencià, text i aria-label queden
   byte a byte com en la v1.2.18, també les dues excepcions que ja hi havia
   («Cànon» i «Afegir etiqueta»), que es fixen ací amb el literal. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ t: null, core: null, historial: vi.fn(), capacitats: new Set(['personalitzacio']) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.capacitats.has(cap),
  adminDesaPersonalitzacio: vi.fn(),
  adminHistorialPersonalitzacio: (...args) => m.historial(...args),
}));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => m.core }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>,
}));
/* El traductor de l'app, simulat: només respon la clau amb què el diccionari endevina la llengua. */
vi.mock('../../components/PedraSeca/hooks/useTraductorOpcional.js', () => ({
  useTraductorOpcional: () => m.t,
  tradueix: (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva),
}));
import { FacetaEstil } from './FacetaEstil.jsx';
import { FacetaTaxonomia } from './FacetaTaxonomia.jsx';
import { textosAdminA11y } from './i18nAdminA11y.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { PAGE_COPY } from '../text/pageContent.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const MARCA_LLENGUA = Object.freeze({ es: 'Cerrar sesión', en: 'Log out', eu: 'Itxi saioa', gl: 'Pechar sesión' });
const traductorDe = (codi) => (codi === 'ca' ? null : (clau, reserva) => (clau === 'section.xat.ajustos.tancaSessio' ? MARCA_LLENGUA[codi] : reserva));
/* Les dues que en la v1.2.18 ja no començaven pel text visible: en ca es conserven tal qual. */
const EXCEPCIONS_CA_V1218 = new Set(['Cànon', 'Afegir etiqueta']);

const pageCopy = () => Object.fromEntries(SYSTEM_PAGES.map(({ key }) => [key, { ...PAGE_COPY[key], id: key }]));
const ambTaxonomia = () => ({
  status: 'ready', pageCopy: pageCopy(), refresh: vi.fn(),
  personalitzacio: { taxonomia: { payload: { v: 1, pagines: {}, categories: ['Fira'], etiquetes: ['Festa'] }, versio: 3 }, estil: null },
});

/* Tots els botons amb nom propi i text visible: el nom ha de començar pel text. */
function comprovaBotons(codi, contenidor = document.body) {
  const botons = [...contenidor.querySelectorAll('button[aria-label]')]
    .filter((boto) => boto.textContent.trim() && boto.getAttribute('aria-busy') !== 'true');
  expect(botons.length, codi).toBeGreaterThan(0);
  for (const boto of botons) {
    const visible = boto.textContent.trim();
    const nom = boto.getAttribute('aria-label');
    if (codi === 'ca' && EXCEPCIONS_CA_V1218.has(visible)) continue;
    expect(nom.startsWith(visible), `${codi}: «${nom}» no comença per «${visible}»`).toBe(true);
  }
  return botons;
}

beforeEach(() => {
  m.t = null;
  m.capacitats = new Set(['personalitzacio']);
  m.core = ambTaxonomia();
  m.historial.mockReset();
});
afterEach(() => { cleanup(); document.querySelectorAll('style[data-sdp-estil]').forEach((n) => n.remove()); vi.restoreAllMocks(); });

describe('v1.2.19 · Gauntlet R1 (L3-01) · FacetaTaxonomia: el nom accessible comença pel text visible', () => {
  test.each(LLENGUES)('%s: «Llevar», «Afegir etiqueta» i «Restaurar» traduïts, i nom i singular en la mateixa llengua', async (codi) => {
    m.t = traductorDe(codi);
    const tx = textosAdminA11y({ language: codi });
    m.historial.mockResolvedValueOnce([{ versio: 2, payload: { v: 1, pagines: {}, categories: [], etiquetes: [] }, creat: null, autor: null }]);
    render(<FacetaTaxonomia />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Historial' })); });
    const botons = comprovaBotons(codi);
    const textos = new Set(botons.map((boto) => boto.textContent.trim()));
    for (const clau of ['llevar', 'restaurar', 'afegirEtiqueta']) expect(textos.has(tx[clau]), `${codi}.${clau}`).toBe(true);

    const llevaFira = screen.getByRole('button', { name: tx.llevarValorSerieAria(tx.categoriaSingular, 'Fira') });
    expect(llevaFira.textContent).toBe(tx.llevar);
    expect(screen.getByRole('button', { name: tx.llevarValorSerieAria(tx.etiquetaSingular, 'Festa') }).textContent).toBe(tx.llevar);
    expect(screen.getByRole('list', { name: tx.llistaAfegidesAria(tx.categoriesNom) })).toBeTruthy();
    expect(screen.getByRole('list', { name: tx.llistaAfegidesAria(tx.etiquetesNom) })).toBeTruthy();
    expect(screen.getByRole('button', { name: tx.restaurarVersioAria(2) }).textContent.trim()).toBe(tx.restaurar);
    const titol = PAGE_COPY.consola.title;
    expect(screen.getByRole('button', { name: tx.afegirEtiquetaPaginaAria(titol) }).textContent.trim()).toBe(tx.afegirEtiqueta);
    expect(screen.getByRole('button', { name: tx.llevarEtiquetaPaginaAria(1, titol) }).textContent.trim()).toBe(tx.llevar);
    if (codi !== 'ca') {
      /* La forma de la v1.2.19 («Etiquetes añadidas», «Remove categoria Fira»): plantilla traduïda amb el nom en valencià. */
      for (const [nomCa, nomTx] of [['Categories', tx.categoriesNom], ['Etiquetes', tx.etiquetesNom]]) {
        if (nomCa !== nomTx) expect(screen.queryByRole('list', { name: tx.llistaAfegidesAria(nomCa) }), `${codi}: ${nomCa}`).toBeNull();
      }
      for (const [singCa, singTx, valor] of [['categoria', tx.categoriaSingular, 'Fira'], ['etiqueta', tx.etiquetaSingular, 'Festa']]) {
        if (singCa !== singTx) expect(screen.queryByRole('button', { name: tx.llevarValorSerieAria(singCa, valor) }), `${codi}: ${singCa}`).toBeNull();
      }
    }
  });

  test('les plantilles reben noms que sí que canvien de llengua (la prova de barreja té dents)', () => {
    expect(textosAdminA11y({ language: 'es' }).categoriaSingular).toBe('categoría');
    expect(textosAdminA11y({ language: 'en' }).etiquetesNom).toBe('Tags');
    expect(textosAdminA11y({ language: 'eu' }).categoriaSingular).toBe('kategoria');
  });

  test('ca: text visible i aria-label byte a byte com en la v1.2.18', async () => {
    m.historial.mockResolvedValueOnce([{ versio: 2, payload: { v: 1, pagines: {}, categories: [], etiquetes: [] }, creat: null, autor: null }]);
    render(<FacetaTaxonomia />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Historial' })); });
    const titol = PAGE_COPY.consola.title;
    expect(screen.getByRole('list', { name: 'Categories afegides' })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Etiquetes afegides' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Llevar la categoria Fira' }).textContent).toBe('Llevar');
    expect(screen.getByRole('button', { name: 'Llevar la etiqueta Festa' }).textContent).toBe('Llevar');
    expect(screen.getByRole('button', { name: 'Restaurar la versió 2' }).textContent.trim()).toBe('Restaurar');
    expect(screen.getByRole('button', { name: `Llevar l’etiqueta 1 de ${titol}` }).textContent.trim()).toBe('Llevar');
    expect(screen.getByRole('button', { name: `Afegir una etiqueta a ${titol}` }).textContent.trim()).toBe('Afegir etiqueta');
  });
});

describe('v1.2.19 · Gauntlet R1 (L3-01) · FacetaEstil: el nom accessible comença pel text visible', () => {
  const personalitzaUnColor = () => {
    const color = document.querySelector('.sdp-estil input[type="color"]');
    // Un valor qualsevol del selector de color, només per a la prova.
    fireEvent.change(color, { target: { value: /* ALLOW_RAW_COLOR */ '#123456' } });
  };

  test.each(LLENGUES)('%s: «Cànon» i «Restaurar» traduïts', async (codi) => {
    m.t = traductorDe(codi);
    const tx = textosAdminA11y({ language: codi });
    m.historial.mockResolvedValue([{ versio: 2, payload: { v: 1, tokens: {}, crom: null }, creat: null, autor: null }]);
    render(<FacetaEstil />);
    personalitzaUnColor();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Historial' })); });
    await screen.findByRole('list', { name: tx.versionsDesadesAria });
    const botons = comprovaBotons(codi);
    const textos = new Set(botons.map((boto) => boto.textContent.trim()));
    expect(textos.has(tx.canon), `${codi}.canon`).toBe(true);
    expect(textos.has(tx.restaurar), `${codi}.restaurar`).toBe(true);
    expect(screen.getByRole('button', { name: tx.restaurarVersioAria(2) }).textContent).toBe(tx.restaurar);
  });

  test('ca: «Cànon» i «Restaurar» byte a byte com en la v1.2.18', async () => {
    m.historial.mockResolvedValue([{ versio: 2, payload: { v: 1, tokens: {}, crom: null }, creat: null, autor: null }]);
    render(<FacetaEstil />);
    personalitzaUnColor();
    const canon = screen.getByRole('button', { name: /^Tornar .+ al cànon$/ });
    expect(canon.textContent).toBe('Cànon');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Historial' })); });
    expect((await screen.findByRole('button', { name: 'Restaurar la versió 2' })).textContent).toBe('Restaurar');
  });
});
