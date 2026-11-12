/* Plataforma d'Apps Enxufables · el portal /app com a pàgina de sistema.
   Norma del Mestre, 261004 (logotips; «SÍ A TOT») · Abans el portal pintava
   el bloc del títol a mà, fora de la Pàgina Universal: sense barra blava, ni
   taronja, ni logotip. Ara és una PaginaApp: doble barra, la boina de Sóc de
   Poble enllaçada al seu perfil (Onada 8, 261009; abans, a /projecte) i el
   seu logotip dalt de l'H1, amb el contingut
   i l'ordre de sempre (l'H1, l'entradeta i la llista). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { delVal } from '../../config/storage.js';
import { muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva, manifestExternDeProva } from './__fixtures__/manifests.js';
import { CLAU_PREFERENCIES, _reiniciaPreferencies } from './preferenciesApps.js';
import { ESTATS_APP } from './interruptors.js';
import { ETIQUETA_ESTAT, PortalApps, appsEnProves, textBetaOberta, textDelMotiu } from './PortalApps.jsx';
import { creaRegistre } from './registreApps.js';
import {
  CLASSE_BETA_OBERTA, ESTAT_PROVES, PLUGINS, TEXTOS_BETA_OBERTA, appDelPlugin
} from '../../sections/plugins/registrePlugins.js';
/* Onada 8 (261009) · La boina de Sóc de Poble porta al seu perfil, ja no a /projecte. */
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';

const carrega = vi.fn(() => Promise.resolve({ default: () => null }));
const registre = () => creaRegistre({ internes: [manifestDeProva({ carrega })] });

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

const fills = (element) => [...element.children].map((e) => e.className);

describe('el portal /app és una Pàgina Universal de sistema', () => {
  test('doble barra, la boina de Sóc de Poble enllaçada al seu perfil, i el bloc del títol dins de la pàgina', () => {
    const { container } = muntaPlataforma('/app', { registre: registre() });
    const pagina = container.querySelector('.sdp-universal-page-container');
    expect(pagina).not.toBeNull();
    expect(fills(pagina)).toEqual(['bar-blue', 'bar-orange', 'page-title', 'content-wrapper']);
    const autor = pagina.querySelector('section.bar-orange').firstElementChild;
    expect(autor.getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
    expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
    expect(container.querySelectorAll('header.page-title')).toHaveLength(1);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  test('el logotip de Sóc de Poble, clar i fosc, va dalt de l’H1 «Apps»', () => {
    const { container } = muntaPlataforma('/app', { registre: registre() });
    const capcalera = container.querySelector('header.page-title');
    expect([...capcalera.children].map((e) => `${e.tagName}.${e.className}`)).toEqual([
      'IMG.page-title-logo light-only', 'IMG.page-title-logo dark-only', 'H1.'
    ]);
    // Onada 8 (261009) · Els PNG de 985x256 (abans, els SVG).
    expect([...capcalera.querySelectorAll('img')].map((img) => img.getAttribute('src'))).toEqual([
      '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png', '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png'
    ]);
    expect(screen.getByRole('heading', { level: 1, name: 'Apps' })).toBe(capcalera.querySelector('h1'));
  });

  test('el contingut i l’ordre de sempre: l’H1, l’entradeta i la llista de les apps', () => {
    const { container } = muntaPlataforma('/app', { registre: registre() });
    const article = container.querySelector('article.content-wrapper');
    expect(article.querySelector('.page-intro p.lead').textContent)
      .toBe('Eines del poble que s’enxufen i es desenxufen. El node decidix quines porta; tu, quines vols vore.');
    const llista = article.querySelector('.sdp-app-portal > ul.sdp-app-portal__llista');
    expect(llista).not.toBeNull();
    expect(article.querySelector('.page-intro').compareDocumentPosition(llista) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(llista).getByRole('heading', { level: 2, name: 'La Prova' })).toBeTruthy();
    expect(carrega).not.toHaveBeenCalled();
  });

  test('sense apps, l’estat buit va al mateix lloc, dins de la pàgina', () => {
    const { container } = muntaPlataforma('/app', { registre: creaRegistre({ internes: [] }) });
    expect(container.querySelector('article.content-wrapper .sdp-app-portal').textContent).toContain('Encara no hi ha cap app');
    expect(container.querySelectorAll('header.page-title > img.page-title-logo')).toHaveLength(2);
  });

  test('Tornar de la barra blava va a la pàgina d’abans', () => {
    const enrere = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    muntaPlataforma('/app', { registre: registre() });
    fireEvent.click(screen.getByRole('button', { name: 'Tornar arrere' }));
    expect(enrere).toHaveBeenCalledTimes(1);
    enrere.mockRestore();
  });

  test('AH-R17-09 · per a superadmin mostra l’accés directe al grup de verificadors i les botigues oficials', () => {
    const { container } = muntaPlataforma('/app', {
      registre: registre(),
      fills: <PortalApps esSuperadmin />
    });
    const panell = container.querySelector('section.sdp-app-portal__testers');
    expect(panell).not.toBeNull();
    expect(within(panell).getByRole('heading', { level: 2, name: 'Gestió de verificadors i botigues' })).toBeTruthy();
    expect(within(panell).getByRole('link', { name: /socdepoble-testers/i }).getAttribute('href'))
      .toBe('https://groups.google.com/g/socdepoble-testers');
    expect(within(panell).getByRole('link', { name: /Proves a Google Play/i }).getAttribute('href'))
      .toBe('https://play.google.com/apps/testing/org.socdepoble.app');
    expect(within(panell).getByRole('link', { name: /App Store/i }).getAttribute('href'))
      .toBe('https://apps.apple.com/es/app/soc-de-poble/id6826441844');
    expect(within(panell).getByRole('link', { name: /Tauler de botigues/i }).getAttribute('href'))
      .toBe('/admin');
    /* El panell va davant de la llista de les apps, dins del portal. */
    const llista = container.querySelector('.sdp-app-portal > ul.sdp-app-portal__llista');
    expect(panell.compareDocumentPosition(llista) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /* Arbitratge R18 (P1) · L'accés és exclusiu de la superadministració: un
     visitant, o qualsevol sessió sense el booleà, no veu ni el panell ni el grup. */
  test('AH-R17-09 · sense superadmin no hi ha panell de verificadors', () => {
    const { container } = muntaPlataforma('/app', { registre: registre(), fills: <PortalApps /> });
    expect(container.querySelector('section.sdp-app-portal__testers')).toBeNull();
    expect(container.textContent).not.toContain('socdepoble-testers');
    expect(container.querySelector('a[href="/admin"]')).toBeNull();
  });

  test('AH-R17-09 · la ruta /app sense sessió (RutaApps) tampoc no el pinta', () => {
    const { container } = muntaPlataforma('/app', { registre: registre() });
    expect(container.querySelector('.sdp-app-portal > ul.sdp-app-portal__llista')).not.toBeNull();
    expect(container.querySelector('section.sdp-app-portal__testers')).toBeNull();
    expect(container.textContent).not.toContain('socdepoble-testers');
  });
});

/* P0-113 (ordre del Mestre, 261111) · Tot el sistema és 100% gratuït i lliure:
   el portal no té cap estat, cap motiu ni cap cartell de pagament. */
describe('P0-113 · cap cartell de pagament al portal', () => {
  test('una etiqueta per a cada estat de la plataforma, i cap de pagament', () => {
    expect(Object.keys(ETIQUETA_ESTAT).sort()).toEqual([...ESTATS_APP].sort());
    expect(Object.values(ETIQUETA_ESTAT).join(' ')).not.toMatch(/premium/i);
    expect(textDelMotiu('sense-dret')).toBe('');
  });

  test('el portal no diu enlloc «Premium», «pagament» ni «es paga»', () => {
    const { container } = muntaPlataforma('/app', {
      registre: creaRegistre({ internes: [manifestDeProva({ carrega }), manifestDeProva({ id: 'tancada', titol: { ca: 'Tancada' }, actiuPerDefecte: false })] })
    });
    expect(container.querySelectorAll('.sdp-app-fitxa')).toHaveLength(2);
    expect(container.textContent).not.toMatch(/premium|pagament|es paga/i);
  });
});

/* P0-113 (ordre del Mestre, 261111) i R18 · T2 (P0-101) · La insígnia «En proves ·
   Beta oberta» del Panell, també a les fitxes del portal: només per a les apps on
   porta un plugin que el registre marca en proves. El registre és l'única font. */
describe('P0-113 · la insígnia «En proves · Beta oberta» al portal', () => {
  test('appsEnProves: els ids d’app dels plugins en proves, i res més', () => {
    const plugins = [
      { id: 'a', obrir: '/app/bar', estat: ESTAT_PROVES },
      { id: 'b', obrir: '/app/nevera/casa', estat: ESTAT_PROVES },
      { id: 'c', obrir: '/app/salut', estat: null },
      { id: 'd', obrir: '/mapa', estat: ESTAT_PROVES },
      { id: 'e', obrir: null, estat: ESTAT_PROVES },
      { id: 'f', obrir: '/app/bar', estat: ESTAT_PROVES }
    ];
    expect(appsEnProves(plugins)).toEqual(['bar', 'nevera']);
    expect(Object.isFrozen(appsEnProves(plugins))).toBe(true);
    expect(appsEnProves()).toEqual([...new Set(PLUGINS.filter((p) => p.estat === ESTAT_PROVES).map(appDelPlugin).filter(Boolean))]);
  });

  test('textBetaOberta: la llengua curta de la interfície i, si no, el valencià', () => {
    expect(textBetaOberta('es-ES')).toBe(TEXTOS_BETA_OBERTA.es);
    expect(textBetaOberta('eu')).toBe(TEXTOS_BETA_OBERTA.eu);
    expect(textBetaOberta('fr')).toBe(TEXTOS_BETA_OBERTA.ca);
    expect(textBetaOberta(undefined)).toBe('En proves · Beta oberta');
    /* PortalApps.jsx pinta la classe com a literal (qualitat.test.js no admet className={variable}): ha de ser la del registre. */
    expect(CLASSE_BETA_OBERTA).toBe('sdp-insignia-beta-oberta');
  });

  test('una fitxa porta la insígnia si i només si el registre de plugins marca la seua app en proves', () => {
    const ids = ['bar', 'nevera', 'salut', 'lector', 'gestoria'];
    const { container } = muntaPlataforma('/app', {
      registre: creaRegistre({ internes: ids.map((id) => manifestDeProva({ id, titol: { ca: `App ${id}` }, carrega })) })
    });
    const enProves = appsEnProves();
    for (const id of ids) {
      const insignia = container.querySelector(`li.sdp-app-fitxa[data-sdp-app="${id}"] .sdp-app-fitxa__estat > span.${CLASSE_BETA_OBERTA}`);
      if (enProves.includes(id)) {
        expect(insignia, id).not.toBeNull();
        expect(insignia.textContent, id).toBe('En proves · Beta oberta');
        expect(insignia.hasAttribute('href'), id).toBe(false);
      } else {
        expect(insignia, id).toBeNull();
      }
    }
    expect(carrega).not.toHaveBeenCalled();
  });

  test('una app de l’amfitrió amb el mateix nom no és cap eina del registre: sense insígnia', () => {
    const registreBuit = creaRegistre({ internes: [] });
    expect(registreBuit.registraAppExterna(manifestExternDeProva({ id: 'bar', element: 'sollutia-bar' })).ok).toBe(true);
    const { container } = muntaPlataforma('/app', { registre: registreBuit });
    expect(container.querySelector('li.sdp-app-fitxa[data-sdp-app="bar"]')).not.toBeNull();
    expect(container.querySelector(`.${CLASSE_BETA_OBERTA}`)).toBeNull();
  });
});
