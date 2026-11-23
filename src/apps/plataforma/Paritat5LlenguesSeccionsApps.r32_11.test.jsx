/* Onada R32.11 · Lot 04 (D03 Paritat Radical 5 Llengües ca, es, en, eu, gl + Llei 32).
   Verifica simetria d'esquema dels 9 diccionaris modulars nous/ampliats,
   renderitzat real en les 5 llengües de seccions secundàries i micro-apps
   (Lector, Nevera, Salut, FitxaSnippet, ProvaCorreuAmbContrasenya, BotiguesSistema)
   i 0 infraccions de la Llei 32 en tot el codi de producció de src/. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { BrowserRouter } from '../../app/contexts/RouterContext.jsx';
import { carregaDiccionari } from '../../config/i18n.js';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma, preparaNavegador } from './__fixtures__/munta.jsx';
import { _reiniciaPreferencies } from './preferenciesApps.js';
import { creaRegistre } from './registreApps.js';

import { textosFontsTerritorials } from '../../sections/pobles/i18nFontsTerritorials.js';
import { textosCalendariExtra } from '../../sections/calendari/i18nCalendariExtra.js';
import { textosFitxaSnippet } from '../../sections/control/i18nFitxaSnippet.js';
import { textosOnboardingExtra } from '../../sections/onboarding/i18nOnboardingExtra.js';
import { textosBotiguesSistema } from '../../sections/botigues/i18nBotiguesSistema.js';
import { TEXTOS_LECTOR } from '../lector/i18nLector.js';
import { TEXTOS_BUIT_NEVERA, TEXTOS_VISTA_NEVERA } from '../nevera/i18nNevera.js';
import { TEXTOS_SALUT } from '../salut/i18nSalut.js';

import { FitxaSnippet } from '../../sections/control/FitxaSnippet.jsx';
import { ProvaCorreuAmbContrasenya } from '../../../tests/fixtures/ProvaCorreuAmbContrasenya.jsx';
import BotiguesSistema from '../../sections/botigues/BotiguesSistema.jsx';

import AppLector from '../lector/AppLector.jsx';
import { creaFontNoticies } from '../lector/fontNoticies.js';
import { creaAdaptadorLlavor } from '../lector/llavor/fontLlavor.js';
import { creaMagatzemLector } from '../lector/magatzem.js';
import manifestLector from '../lector/manifest.js';
import { msDeData } from '../lector/nucli/index.js';

import AppNevera from '../nevera/AppNevera.jsx';
import { creaMagatzemNevera } from '../nevera/magatzem.js';
import manifestNevera from '../nevera/manifest.js';

import AppSalut from '../salut/AppSalut.jsx';
import { creaMagatzemSalut, desaMeta } from '../salut/magatzem.js';
import manifestSalut from '../salut/manifest.js';

const IDIOMES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);
const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ARA_MS = msDeData('2026-10-03T10:30:00Z');
const ARA_DATE = new Date(2026, 9, 5, 9, 30);

const taulaDe = (fn) => Object.fromEntries(IDIOMES.map((codi) => [codi, fn(codi)]));

const tancats = [];

beforeEach(async () => {
  window.localStorage.clear();
  _reiniciaPreferencies();
  preparaNavegador();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  await Promise.all(IDIOMES.map((codi) => carregaDiccionari(codi)));
});

afterEach(async () => {
  cleanup();
  while (tancats.length) await tancats.pop()?.tanca?.();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function comprovaSimetriaDiccionari(nom, diccionari) {
  expect(Object.keys(diccionari).sort(), `${nom}: idiomes`).toEqual([...IDIOMES].sort());
  const clausBase = Object.keys(diccionari.ca).sort();
  expect(clausBase.length, `${nom}: claus no buides`).toBeGreaterThan(0);
  for (const codi of IDIOMES) {
    expect(Object.keys(diccionari[codi]).sort(), `${nom}[${codi}]: mateixes claus que ca`).toEqual(clausBase);
    for (const clau of clausBase) {
      const base = diccionari.ca[clau];
      const valor = diccionari[codi][clau];
      expect(typeof valor, `${nom}[${codi}].${clau}: mateix tipus`).toBe(typeof base);
      if (typeof valor === 'string') {
        expect(valor.trim().length, `${nom}[${codi}].${clau}: cadena no buida`).toBeGreaterThan(0);
      }
    }
  }
}

describe('Onada R32.11 · Lot 04 · Simetria 5 llengües dels diccionaris modulars', () => {
  test.each([
    ['TEXTOS_FONTS_TERRITORIALS', taulaDe(textosFontsTerritorials)],
    ['TEXTOS_CALENDARI_EXTRA', taulaDe(textosCalendariExtra)],
    ['TEXTOS_FITXA_SNIPPET', taulaDe(textosFitxaSnippet)],
    ['TEXTOS_ONBOARDING_EXTRA', taulaDe(textosOnboardingExtra)],
    ['TEXTOS_BOTIGUES_SISTEMA', taulaDe(textosBotiguesSistema)],
    ['TEXTOS_LECTOR', TEXTOS_LECTOR],
    ['TEXTOS_BUIT_NEVERA', TEXTOS_BUIT_NEVERA],
    ['TEXTOS_VISTA_NEVERA', TEXTOS_VISTA_NEVERA],
    ['TEXTOS_SALUT', TEXTOS_SALUT],
  ])('%s té paritat exacta d’esquema en ca, es, en, eu i gl', (nom, diccionari) => {
    comprovaSimetriaDiccionari(nom, diccionari);
  });
});

describe('Onada R32.11 · Lot 04 · Renderitzat real en les 5 llengües', () => {
  test('Seccions secundàries (FitxaSnippet, ProvaCorreuAmbContrasenya, BotiguesSistema) es tradueixen en ca, es, en, eu i gl', () => {
    for (const codi of IDIOMES) {
      cleanup();
      window.localStorage.clear();
      render(
        <UIProvider externalConfig={{ language: codi }}>
          <BrowserRouter>
            <FitxaSnippet />
            <ProvaCorreuAmbContrasenya token="tok-test" onConfirma={async () => ({ login_required: true, verified: true })} />
            <BotiguesSistema />
          </BrowserRouter>
        </UIProvider>
      );
      expect(screen.getByText(textosFitxaSnippet(codi).subtitol)).toBeTruthy();
      expect(screen.getByRole('button', { name: textosOnboardingExtra(codi).provaSubmit })).toBeTruthy();
      expect(screen.getByText(textosBotiguesSistema(codi).verificadorsPlay)).toBeTruthy();
    }
  });

  test('AppLector renderitza l’espai de notícies traduït en ca, es, en, eu i gl', async () => {
    for (const codi of IDIOMES) {
      cleanup();
      window.localStorage.clear();
      const idb = creaIdbFals();
      const magatzem = creaMagatzemLector({ idb: idb.idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
      tancats.push(magatzem);
      const font = creaFontNoticies(creaAdaptadorLlavor({ ara: ARA_MS }));
      const App = () => <AppLector magatzem={magatzem} font={font} ara={() => ARA_MS} />;
      const registre = creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] });
      muntaPlataforma('/app/lector/noticies', { registre, entorn: ENTORN, externalConfig: { language: codi } });
      expect(await screen.findByRole('button', { name: TEXTOS_LECTOR[codi].espai.manage })).toBeTruthy();
      expect(screen.getAllByText(TEXTOS_LECTOR[codi].carpetesFixes.despres).length).toBeGreaterThan(0);
    }
  });

  test('AppNevera renderitza la llista de la compra traduïda en ca, es, en, eu i gl', async () => {
    for (const codi of IDIOMES) {
      cleanup();
      window.localStorage.clear();
      const idb = creaIdbFals();
      const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
      tancats.push(magatzem);
      const App = () => <AppNevera magatzem={magatzem} descarrega={() => {}} />;
      const registre = creaRegistre({ internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }] });
      muntaPlataforma('/app/nevera/llista/casa', { registre, entorn: ENTORN, externalConfig: { language: codi } });
      expect(await screen.findByRole('button', { name: TEXTOS_VISTA_NEVERA[codi].catalegDeBotiga })).toBeTruthy();
      expect(screen.getByRole('button', { name: TEXTOS_VISTA_NEVERA[codi].creaUnaLlista })).toBeTruthy();
    }
  });

  test('AppSalut renderitza el diari traduït en ca, es, en, eu i gl', async () => {
    for (const codi of IDIOMES) {
      cleanup();
      window.localStorage.clear();
      const magatzem = creaMagatzemSalut({ idb: null, navegador: null, Canal: null });
      await desaMeta(magatzem, 'avis', { acceptatA: '2026-10-01T08:00:00.000Z', versio: 1 });
      let seq = 0;
      const App = () => (
        <AppSalut
          magatzem={magatzem}
          rellotge={() => ARA_DATE}
          ofsetDe={() => 120}
          nouId={() => { seq += 1; return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`; }}
        />
      );
      const registre = creaRegistre({ internes: [{ ...manifestSalut, carrega: () => Promise.resolve({ default: App }) }] });
      await act(async () => {
        muntaPlataforma('/app/salut/diari', { registre, entorn: ENTORN, externalConfig: { language: codi } });
      });
      expect(await screen.findByRole('button', { name: TEXTOS_SALUT[codi].modeNit })).toBeTruthy();
      expect(screen.getByText(TEXTOS_SALUT[codi].buitJornada)).toBeTruthy();
    }
  });
});

function fitxersProduccioSrc(dir) {
  const out = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === '__fixtures__') continue;
      out.push(...fitxersProduccioSrc(abs));
    } else if (/\.[cm]?jsx?$/.test(entrada.name) && !/\.test\.[cm]?jsx?$/.test(entrada.name)) {
      out.push(abs);
    }
  }
  return out;
}

describe('Onada R32.11 · Lot 04 · Llei 32 en tot src/', () => {
  test('cap fitxer de producció de src/ utilitza expressions vetades per la Llei 32', () => {
    /* Componem els patrons a trossos per no auto-activar cap escàner literal. */
    const vetats = [
      new RegExp(`${'(?:servidor|serveis)'}\\s+${'del\\s+poble'}`, 'i'),
      new RegExp(`${'(?:servidor|servicios)'}\\s+${'del\\s+pueblo'}`, 'i'),
      new RegExp(`${"village['’]?s?"}\\s+${'(?:server|services)'}`, 'i'),
      new RegExp(`${'herriko'}\\s+${'zerbitzari'}`, 'i'),
      new RegExp(`${'servizos?'}\\s+${'da\\s+vila'}`, 'i'),
    ];
    const arrelSrc = path.join(process.cwd(), 'src');
    const infraccions = [];
    for (const fitxer of fitxersProduccioSrc(arrelSrc)) {
      const contingut = readFileSync(fitxer, 'utf8');
      for (const re of vetats) {
        if (re.test(contingut)) {
          infraccions.push(`${path.relative(process.cwd(), fitxer)} -> ${re}`);
        }
      }
    }
    expect(infraccions).toEqual([]);
  });
});
