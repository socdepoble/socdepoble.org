/* IDEA-287 · La pàgina didàctica «Tot el que pots fer a Sóc de Poble, pas a pas» (/page/tot-el-que-pots-fer):
   existix a PAGE_COPY i a la taxonomia, té les cinc llengües, cada pas enllaça a una ruta declarada de l'App
   (App.jsx, PAGE_COPY o el registre de plugins), totes les llengües porten el mateix conjunt d'enllaços i
   TextSection la pinta amb l'H1 i els enllaços a les eines. */
import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ props: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIStateOpcional: () => null,
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (cami) => cami }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    mocks.props = props;
    return React.createElement('div', { 'data-pagina': '' }, React.createElement('h1', null, props.title), children);
  }
}));
import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { CLASSIFICACIO_PAGINES_PUBLIQUES } from '../../data/taxonomia/classificacioPaginesPubliques.js';
import { IDS_PLUGINS } from '../plugins/registrePlugins.js';

const CLAU = 'tot-el-que-pots-fer';
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const EINES_OBLIGADES = ['/mur', '/xat', '/calendari', '/notes', '/page/avisador', '/control'];

/* Les rutes declarades a App.jsx, absolutes ('/control') i relatives del comodí d'ActorRoutes ('mur'). */
const codiApp = readFileSync(path.join(process.cwd(), 'src/app/App.jsx'), 'utf8');
const RUTES_APP = new Set([...codiApp.matchAll(/<Route path="([^"]+)"/g)].map(([, ruta]) => (ruta.startsWith('/') ? ruta : `/${ruta}`)));

const hrefsDe = (html) => [...String(html).matchAll(/href="([^"]+)"/g)].map(([, href]) => href);
const comptaEtiqueta = (html, etiqueta) => (String(html).match(new RegExp(`<${etiqueta}>`, 'g')) || []).length;

/** Un href intern és vàlid si porta a una pàgina de PAGE_COPY, a la fitxa d'un plugin registrat o a una ruta d'App.jsx. */
function esRutaDeclarada(href) {
  const pagina = href.match(/^\/page\/([^/?#]+)$/);
  if (pagina) return Object.hasOwn(PAGE_COPY, pagina[1]) || RUTES_APP.has(href);
  const plugin = href.match(/^\/plugin\/([^/?#]+)$/);
  if (plugin) return RUTES_APP.has('/plugin/:id') && IDS_PLUGINS.includes(plugin[1]);
  return RUTES_APP.has(href);
}

afterEach(cleanup);

describe('IDEA-287 · /page/tot-el-que-pots-fer', () => {
  test('(a) existix a PAGE_COPY i està classificada a la taxonomia pública', () => {
    expect(PAGE_COPY[CLAU]).toBeTruthy();
    expect(Object.hasOwn(CLASSIFICACIO_PAGINES_PUBLIQUES, CLAU)).toBe(true);
    expect(PAGE_COPY[CLAU].labels.some((etiqueta) => etiqueta.className === 'sdp-badge-category')).toBe(true);
  });

  test('(b) les cinc llengües porten títol, entradeta i cos amb almenys huit H3 i huit negretes', () => {
    for (const llengua of LLENGUES) {
      const pagina = localitzaPagina(PAGE_COPY[CLAU], llengua, CLAU);
      expect(pagina.title?.trim(), llengua).toBeTruthy();
      expect(pagina.lead?.trim(), llengua).toBeTruthy();
      expect(pagina.html?.trim(), llengua).toBeTruthy();
      expect(comptaEtiqueta(pagina.html, 'h3'), llengua).toBeGreaterThanOrEqual(8);
      expect(comptaEtiqueta(pagina.html, 'strong'), llengua).toBeGreaterThanOrEqual(8);
    }
    // Cada llengua és una traducció real, no una còpia del valencià.
    const titols = LLENGUES.map((llengua) => localitzaPagina(PAGE_COPY[CLAU], llengua, CLAU).title);
    expect(new Set(titols).size).toBe(LLENGUES.length);
  });

  test('(c) cada pas enllaça a la seua eina, i cada enllaç intern porta a una ruta declarada', () => {
    for (const llengua of LLENGUES) {
      const hrefs = hrefsDe(localitzaPagina(PAGE_COPY[CLAU], llengua, CLAU).html);
      for (const eina of EINES_OBLIGADES) expect(hrefs, `${llengua} ${eina}`).toContain(eina);
      expect(comptaEtiqueta(localitzaPagina(PAGE_COPY[CLAU], llengua, CLAU).html, 'h3'), llengua).toBe(hrefs.length);
      for (const href of hrefs) {
        expect(href.startsWith('/') && !href.startsWith('//'), `${llengua} ${href}`).toBe(true);
        expect(esRutaDeclarada(href), `${llengua} ${href}`).toBe(true);
      }
    }
  });

  test('(d) les cinc llengües porten el mateix conjunt d’enllaços', () => {
    const referencia = hrefsDe(PAGE_COPY[CLAU].html);
    for (const llengua of LLENGUES) {
      expect(hrefsDe(localitzaPagina(PAGE_COPY[CLAU], llengua, CLAU).html), llengua).toEqual(referencia);
    }
  });

  /* Llei 0 · L'Avisador és una eina de seguretat: el seu pas diu, com la fitxa (registrePlugins.js) i la
     pàgina (textosAvisador.js), que només avisa amb la sessió oberta i que amb l'app tancada no avisa. */
  test('(f) el pas de l’Avisador porta la condició de la sessió oberta i de l’app tancada en cada llengua', () => {
    const CONDICIO = {
      ca: ['Només funciona amb la sessió oberta', 'amb l’app tancada no avisa'],
      es: ['Solo funciona con la sesión abierta', 'con la app cerrada no avisa'],
      en: ['It only works with your session open', 'with the app closed it sends no alert'],
      eu: ['Saioa irekita dagoenean bakarrik dabil', 'aplikazioa itxita badago, ez du abisatzen'],
      gl: ['Só funciona coa sesión aberta', 'coa app pechada non avisa']
    };
    for (const llengua of LLENGUES) {
      const paragraf = localitzaPagina(PAGE_COPY[CLAU], llengua, CLAU).html.split('<h3>')
        .find((pas) => pas.includes('href="/page/avisador"'));
      expect(paragraf, llengua).toBeTruthy();
      for (const frase of CONDICIO[llengua]) expect(paragraf, `${llengua} ${frase}`).toContain(frase);
    }
  });

  test('(e) TextSection la pinta amb l’H1 i els enllaços a les eines', () => {
    render(<TextSection page={PAGE_COPY[CLAU]} pageKey={CLAU} />);
    expect(mocks.props?.title).toBe('Tot el que pots fer a Sóc de Poble, pas a pas');
    expect(screen.getByRole('heading', { level: 1, name: 'Tot el que pots fer a Sóc de Poble, pas a pas' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Obri el Mur' }).getAttribute('href')).toBe('/mur');
    expect(screen.getByRole('link', { name: 'Obri el Xat' }).getAttribute('href')).toBe('/xat');
    expect(screen.getByRole('link', { name: 'Obri el Panell de Control' }).getAttribute('href')).toBe('/control');
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(8);
  });
});
