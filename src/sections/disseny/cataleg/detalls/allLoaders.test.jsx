import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { CATALOG_ITEMS } from '../manifest.js';

/* Un espècimen pot tindre la seua prova al costat (Especimen*.test.jsx): no és un espècimen. */
const SPECIMEN_MODULES = import.meta.glob(['./Especimen*.jsx', '!./Especimen*.test.jsx']);

/* Gauntlet 261030 (cicle 4, C4-V-02) · La migració dels CSS de secció a
   src/css/modules.css va esborrar pecesApps.css i catalegColleccio.css, i
   /disseny encara els anomenava: l'entradilla de la Imatge apaïsada al
   manifest i el rètol de fitxer del seu espècimen. Cap text visible del
   quadern no pot citar un full .css que no existix: amb camí, des de l'arrel
   del repositori; sense camí, un full amb eixe nom en algun lloc de src/. */
const ARREL = process.cwd();
const RE_FULL_CSS = /[A-Za-z0-9_][A-Za-z0-9_./-]*\.css(?![A-Za-z0-9_])/g;
function nomsDeFullsDeSrc(carpeta = 'src', noms = new Set()) {
  for (const entrada of readdirSync(path.join(ARREL, carpeta), { withFileTypes: true })) {
    if (entrada.isDirectory()) nomsDeFullsDeSrc(`${carpeta}/${entrada.name}`, noms);
    else if (entrada.name.endsWith('.css')) noms.add(entrada.name);
  }
  return noms;
}
let nomsDeFulls = null;
function fullsCssInexistents(textos) {
  nomsDeFulls ??= nomsDeFullsDeSrc();
  const citats = new Set(textos.flatMap((text) => (typeof text === 'string' ? text.match(RE_FULL_CSS) || [] : [])));
  return [...citats].filter((full) => (full.includes('/') ? !existsSync(path.join(ARREL, full)) : !nomsDeFulls.has(full)));
}
/** Cada node de text pintat, separat: dos nodes veïns no fan un nom de full fals. */
function textosPintats(arrel) {
  const textos = [];
  const cami = arrel.ownerDocument.createTreeWalker(arrel, arrel.ownerDocument.defaultView.NodeFilter.SHOW_TEXT);
  for (let node = cami.nextNode(); node; node = cami.nextNode()) textos.push(node.data);
  return textos;
}

/* jsdom no porta ResizeObserver; la barra d'eines (T52) i altres peces reals el fan servir. */
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
});
afterAll(() => vi.unstubAllGlobals());
afterEach(cleanup);

/* El primer import en fred paga la transformació del graf compartit (el barril
   de Pedra Seca, que des del TPV del 261006 porta UniversalTPV i els
   al·lèrgens) i passava dels 5 s del cas. S'escalfa ací, amb temps propi:
   cada cas mesura la càrrega i el pintat del seu espècimen. */
beforeAll(async () => {
  const [primer] = Object.values(SPECIMEN_MODULES);
  await primer?.();
}, 60000);

describe('Lazy Loaders del Catàleg', () => {
  /* T52 · paritat: cap ítem del manifest sense carregador, cap carregador orfe. */
  it('el manifest i els carregadors coincidixen', () => {
    const claus = CATALOG_ITEMS.map((item) => item.detailKey);
    expect(new Set(claus).size).toBe(claus.length);
    expect(new Set(CATALOG_ITEMS.map((item) => item.id)).size).toBe(CATALOG_ITEMS.length);
    expect(new Set(claus)).toEqual(new Set(Object.keys(CATALOG_DETAIL_LOADERS)));
  });

  it('el cens de mòduls físics coincidix amb tots els carregadors', () => {
    expect(Object.keys(SPECIMEN_MODULES)).toHaveLength(Object.keys(CATALOG_DETAIL_LOADERS).length);
    expect(Object.keys(CATALOG_DETAIL_LOADERS).length).toBeGreaterThan(20);
  });

  it.each(Object.entries(SPECIMEN_MODULES))('carrega i renderitza %s, sense citar cap full CSS absent', async (ruta, importa) => {
    const modul = await importa();
    const Especimen = modul.default;
    const vista = render(<MemoryRouter><Especimen /></MemoryRouter>);
    await waitFor(() => expect(vista.container.firstElementChild, ruta).not.toBeNull());
    expect(fullsCssInexistents(textosPintats(vista.container)), ruta).toEqual([]);
    vista.unmount();
  });

  /* Gauntlet 261030 (C4-V-02) · Les fitxes del manifest que pinta /disseny: títol, subtítol, entradilla i etiquetes. */
  it('cap fitxa del manifest no cita un full CSS absent', () => {
    const dolentes = CATALOG_ITEMS
      .map((item) => [item.id, fullsCssInexistents([item.title, item.subtitle, item.lead, ...(item.tags || [])])])
      .filter(([, fulls]) => fulls.length);
    expect(dolentes).toEqual([]);
  });

  it('la guarda dels fulls citats coneix els fulls vius i caça els esborrats', () => {
    expect(fullsCssInexistents(['src/css/modules.css (bloc T45)', 'tokens.css', 'Estils a components.css.'])).toEqual([]);
    expect(fullsCssInexistents(['agrupacio.jsx · catalegColleccio.css (.sdp-panoramica)', 'src/components/PedraSeca/pecesApps.css']))
      .toEqual(['catalegColleccio.css', 'src/components/PedraSeca/pecesApps.css']);
  });
});
