/* Onada R30.2 (D11) · Internacionalització completa del portal /app en les
   5 llengües de Sóc de Poble (ca, es, en, eu, gl): títol, entradeta, estats,
   interruptor, insígnia beta, botó d'obertura, estat buit i panell de superadmin.
   R32 (proves febles, P2) · L'interruptor es comprova pel seu nom accessible
   (tx.vullVore) i la insígnia beta pel text de TEXTOS_BETA_OBERTA, i un cas en
   un registre de mòduls nou fixa la reserva coherent de L1: eu demanat sense el
   diccionari eu en memòria pinta tot el portal en valencià, i tot canvia alhora
   quan arriba. */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, screen, within } from '@testing-library/react';
import '../../../tests/helpers/diccionaris.js';
import { delVal } from '../../config/storage.js';
import { TEXTOS_BETA_OBERTA } from '../../sections/plugins/registrePlugins.js';
import { muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva } from './__fixtures__/manifests.js';
import { CLAU_PREFERENCIES, _reiniciaPreferencies } from './preferenciesApps.js';
import { creaRegistre } from './registreApps.js';
import { PortalApps, appsEnProves } from './PortalApps.jsx';
import { TEXTOS_PORTAL_APPS, etiquetaEstatApp, textosPortalApps } from './textosPortalApps.js';

const carrega = vi.fn(() => Promise.resolve({ default: () => null }));

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const TITOL_OBERTA = { ca: 'Eina Viva', es: 'Herramienta Viva', en: 'Live Tool', eu: 'Tresna Bizia', gl: 'Ferramenta Viva' };
const TITOL_APAGADA = { ca: 'Eina Apagada', es: 'Herramienta Apagada', en: 'Off Tool', eu: 'Tresna Itzalia', gl: 'Ferramenta Apagada' };
const TITOL_BETA = { ca: 'Eina en Proves', es: 'Herramienta en Pruebas', en: 'Testing Tool', eu: 'Proba Tresna', gl: 'Ferramenta en Probas' };
/* Una app interna on porta un plugin en proves (registrePlugins.js): l'única que porta la insígnia. */
const ID_BETA = appsEnProves()[0];
const nomInterruptor = (tx, titol) => tx.vullVore.replace('{titol}', titol);

beforeEach(() => {
  delVal(CLAU_PREFERENCIES);
  _reiniciaPreferencies();
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  delVal(CLAU_PREFERENCIES);
  _reiniciaPreferencies();
});

const ESTAT_SI = Object.freeze({ ca: 'Sí', es: 'Sí', en: 'Yes', eu: 'Bai', gl: 'Si' });

describe('D11 · PortalApps en les 5 llengües oficials (ca, es, en, eu, gl)', () => {
  test('els textos que es comproven són distints del valencià: una reserva indeguda no passaria per bona', () => {
    expect(ID_BETA).toBeTruthy();
    for (const lang of LLENGUES.filter((l) => l !== 'ca')) {
      expect(TEXTOS_PORTAL_APPS[lang].vullVore).not.toBe(TEXTOS_PORTAL_APPS.ca.vullVore);
      expect(TEXTOS_BETA_OBERTA[lang]).not.toBe(TEXTOS_BETA_OBERTA.ca);
    }
    expect(TEXTOS_PORTAL_APPS.eu.titol).not.toBe(TEXTOS_PORTAL_APPS.ca.titol);
    expect(TEXTOS_PORTAL_APPS.eu.estat.available).not.toBe(TEXTOS_PORTAL_APPS.ca.estat.available);
  });

  test.each(LLENGUES)('%s: traduïx títol, entradeta, estats, interruptor, insígnia beta, acció d’obrir i panell de superadmin', (lang) => {
    const tx = TEXTOS_PORTAL_APPS[lang];
    const registre = creaRegistre({
      internes: [
        manifestDeProva({
          id: 'oberta',
          titol: TITOL_OBERTA,
          carrega
        }),
        manifestDeProva({
          id: 'apagada',
          titol: TITOL_APAGADA,
          actiuPerDefecte: false,
          carrega
        }),
        manifestDeProva({
          id: 'sense-cap',
          titol: { ca: 'Eina Futura', es: 'Herramienta Futura', en: 'Future Tool', eu: 'Etorkizuneko Tresna', gl: 'Ferramenta Futura' },
          capacitats: ['salut'],
          carrega
        }),
        manifestDeProva({ id: ID_BETA, titol: TITOL_BETA, carrega })
      ]
    });

    const { container } = muntaPlataforma('/app', {
      registre,
      entorn: { produccio: true, teCapacitat: () => false, amaDelDocument: true },
      externalConfig: { language: lang },
      fills: <PortalApps esSuperadmin />
    });

    expect(screen.getByRole('heading', { level: 1, name: tx.titol })).toBeTruthy();
    expect(container.querySelector('.page-intro p.lead').textContent).toBe(tx.entradeta);

    const panell = container.querySelector('section.sdp-app-portal__testers');
    expect(panell).not.toBeNull();
    expect(within(panell).getByRole('heading', { level: 3, name: tx.testersTitol })).toBeTruthy();
    expect(panell.querySelector('.sdp-app-portal__testers-text').textContent).toBe(tx.testersCos);
    expect(within(panell).getByRole('link', { name: tx.testersGrup })).toBeTruthy();
    expect(within(panell).getByRole('link', { name: tx.testersAdmin })).toBeTruthy();

    const fitxaOberta = container.querySelector('li.sdp-app-fitxa[data-sdp-app="oberta"]');
    expect(fitxaOberta.textContent).toContain(tx.estat.available);
    expect(within(fitxaOberta).getByRole('link', { name: tx.obri })).toBeTruthy();
    // L'interruptor, pel seu nom accessible (l'etiqueta visible que el nomena): «Vull vore …» en la llengua del text.
    expect(within(fitxaOberta).getByRole('switch', { name: nomInterruptor(tx, TITOL_OBERTA[lang]) })).toBeTruthy();
    // R32 · El text de dins de l'interruptor (Sí/No) també en la llengua del text, com a PaginaNotificacions.
    expect(fitxaOberta.querySelector('.sdp-interruptor__estat').textContent).toBe(ESTAT_SI[lang]);
    expect(fitxaOberta.querySelector('.sdp-insignia-beta-oberta')).toBeNull();

    const fitxaApagada = container.querySelector('li.sdp-app-fitxa[data-sdp-app="apagada"]');
    expect(fitxaApagada.textContent).toContain(tx.estat.disabled);
    expect(within(fitxaApagada).getByRole('switch', { name: nomInterruptor(tx, TITOL_APAGADA[lang]) })).toBeTruthy();

    const fitxaSenseCap = container.querySelector('li.sdp-app-fitxa[data-sdp-app="sense-cap"]');
    expect(fitxaSenseCap.textContent).toContain(tx.estat.unavailable);

    // La insígnia «En proves · Beta oberta», només a l'app en proves i en la llengua del text.
    const fitxaBeta = container.querySelector(`li.sdp-app-fitxa[data-sdp-app="${ID_BETA}"]`);
    expect(fitxaBeta.querySelector('.sdp-insignia-beta-oberta').textContent).toBe(TEXTOS_BETA_OBERTA[lang]);
    expect(within(fitxaBeta).getByRole('switch', { name: nomInterruptor(tx, TITOL_BETA[lang]) })).toBeTruthy();
    expect(container.querySelectorAll('.sdp-insignia-beta-oberta')).toHaveLength(1);
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: traduïx l’estat buit quan el node no declara cap app', (lang) => {
    const tx = TEXTOS_PORTAL_APPS[lang];
    const { container } = muntaPlataforma('/app', {
      registre: creaRegistre({ internes: [] }),
      externalConfig: { language: lang }
    });
    const portal = container.querySelector('.sdp-app-portal');
    expect(portal.textContent).toContain(tx.buitTitol);
    expect(portal.textContent).toContain(tx.buitCos);
  });

  test('reserva segura a valencià davant un codi desconegut o estat desconegut', () => {
    expect(textosPortalApps('fr')).toBe(TEXTOS_PORTAL_APPS.ca);
    expect(etiquetaEstatApp('available', 'en-US')).toBe('Available');
    expect(etiquetaEstatApp('inexistent', 'ca')).toBe('');
  });
});

/* L1 (Fase D, 261020, tasca 4.1) · Mentre el diccionari de la llengua demanada
   no és en memòria, el portal parla valencià sencer: títol, títols de les apps,
   estats, interruptor i insígnia. Ací el registre de diccionaris de dalt ja
   porta l'eu (tests/helpers/diccionaris.js), així que el cas viu en un registre
   de mòduls nou (vi.resetModules), que només porta el valencià: tots els mòduls
   del muntatge es tornen a importar després del reinici, i el helper no s'hi
   torna a importar. El primer pintat es comprova de manera síncrona, abans que
   la càrrega de l'efecte demanaDiccionari('eu') puga resoldre. */
describe('L1 · eu demanat sense el diccionari eu en memòria', () => {
  test('el primer pintat és tot en valencià i, quan arriba el basc, tot canvia alhora', async () => {
    vi.resetModules();
    let desmunta = () => {};
    try {
      const i18n = await import('../../config/i18n.js');
      const { muntaPlataforma: munta } = await import('./__fixtures__/munta.jsx');
      const { manifestDeProva: manifest } = await import('./__fixtures__/manifests.js');
      const { creaRegistre: registreNou } = await import('./registreApps.js');
      const { PortalApps: Portal, appsEnProves: enProves } = await import('./PortalApps.jsx');
      const { TEXTOS_PORTAL_APPS: TEXTOS } = await import('./textosPortalApps.js');
      const { TEXTOS_BETA_OBERTA: BETA } = await import('../../sections/plugins/registrePlugins.js');
      const { waitFor: esperaQue } = await import('@testing-library/react');
      expect(i18n.teDiccionari('eu')).toBe(false);
      expect(enProves()[0]).toBe(ID_BETA);

      const { container, unmount } = munta('/app', {
        registre: registreNou({
          internes: [
            manifest({ id: 'oberta', titol: TITOL_OBERTA, carrega }),
            manifest({ id: ID_BETA, titol: TITOL_BETA, carrega })
          ]
        }),
        entorn: { produccio: true, teCapacitat: () => true, amaDelDocument: true },
        externalConfig: { language: 'eu' },
        fills: <Portal />
      });
      desmunta = unmount;
      const fitxa = (id) => container.querySelector(`li.sdp-app-fitxa[data-sdp-app="${id}"]`);
      const comprovaPortal = (lang) => {
        const tx = TEXTOS[lang];
        expect(within(container).getByRole('heading', { level: 1, name: tx.titol })).toBeTruthy();
        expect(container.querySelector('.page-intro p.lead').textContent).toBe(tx.entradeta);
        for (const [id, titols] of [['oberta', TITOL_OBERTA], [ID_BETA, TITOL_BETA]]) {
          expect(fitxa(id).querySelector('.sdp-app-fitxa__titol').textContent).toBe(titols[lang]);
          expect(fitxa(id).querySelector('.sdp-app-fitxa__estat').textContent).toContain(tx.estat.available);
          expect(within(fitxa(id)).getByRole('switch', { name: nomInterruptor(tx, titols[lang]) })).toBeTruthy();
          expect(within(fitxa(id)).getByRole('link', { name: tx.obri })).toBeTruthy();
        }
        expect(fitxa(ID_BETA).querySelector('.sdp-insignia-beta-oberta').textContent).toBe(BETA[lang]);
      };

      // Primer pintat, síncron: el diccionari eu encara no hi és.
      expect(i18n.teDiccionari('eu')).toBe(false);
      comprovaPortal('ca');

      // Quan el diccionari arriba, tot el portal passa al basc alhora.
      // Sostre de 5 s (no 1 s): amb la màquina carregada, el tros de l'eu pot tardar (vite.config.js · test).
      await esperaQue(() => expect(i18n.teDiccionari('eu')).toBe(true), { timeout: 5000 });
      await esperaQue(() => expect(within(container).getByRole('heading', { level: 1, name: TEXTOS.eu.titol })).toBeTruthy(), { timeout: 5000 });
      comprovaPortal('eu');
    } finally {
      desmunta();
      vi.resetModules();
    }
  });
});
