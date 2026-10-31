/* Ordre del Mestre (30-10-2026, prompt 2208, T2.2) · /consola/* és pública
   també fora de DEV, i per això també dins de l'app nativa (la targeta del Mur
   → /page/consola → «Obrir la Consola»). Dos contractes d'eixa obertura:
   1. Dins de l'app nativa cap pàgina de la Consola nomena una altra plataforma
      mòbil ni la seua botiga (regla 2.3.10 de l'App Store; ordre del Mestre
      261027; perAppNativa.js). A la web, tot tal qual.
   2. Sense Mapa (la web publicada), les pàgines que en viuen diuen la causa
      real: el servix només el servidor local; cap instal·lació pendent.
   Ací els hooks i els carregadors són els de veres (com
   ConsolaSection.produccio.test.jsx); només es dobla fetch, i el doble de
   UniversalPage pinta també el subtítol i l'entradilla. */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const ruta = vi.hoisted(() => ({ comodi: '' }));

vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ '*': ruta.comodi }),
  useNavigate: () => vi.fn(),
  Navigate: ({ to }) => <p data-testid="redirigix">{to}</p>,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, lead, children }) => (
    <main><header className="page-title"><h1>{title}</h1><p>{subtitle}</p><p>{lead}</p></header>{children}</main>
  )
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca-ES' }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));

import ConsolaSection from './ConsolaSection.jsx';
import { paginesConsola } from './consolaPagines.js';
import { IDS_GOVERN } from './govern/governConsola.js';
import { IDS_PANELLS } from './polsConsola.js';
import { PLATAFORMES, normalitzaEmpaquetats, paginaEmpaquetats, plataformesEmpaquetades } from './empaquetats.js';
import { nomenaPlataformaAliena } from '../text/perAppNativa.js';

/* Totes les rutes de la Consola que es poden obrir sense dades: el tauler (amb
   l'Índex i el Diagnòstic), els empaquetats, les nou pàgines, les quatre del
   Govern i els panells del pols. */
const RUTES = Object.freeze([
  '', 'empaquetats',
  ...paginesConsola().map((p) => p.id),
  ...IDS_GOVERN.map((id) => `govern/${id}`),
  ...IDS_PANELLS.map((id) => `pols/${id}`)
]);
/* Les pàgines que viuen del Mapa (AmbMapa i, /consola/salut, MapaConsola). */
const DEL_MAPA = Object.freeze(['explorador', 'fluxos', 'calendari', 'inventari', 'entrades', 'agents', 'actors', 'salut']);

/* Un servidor sense middleware: /__iaia/* és 404 (la web publicada). */
const senseMiddleware = () => vi.stubGlobal('fetch', vi.fn(async () => ({ status: 404, ok: false, statusText: 'Not Found', headers: { get: () => '' } })));

/* El que es llig i el que se sent: cada node de text a part (textContent
   enganxa «publicar-la» i «Android» i \b ja no hi casa) i els atributs que el
   lector llig. */
function textQueEsLlig() {
  const trossos = [];
  const camina = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = camina.nextNode(); node; node = camina.nextNode()) trossos.push(node.nodeValue);
  const atributs = [...document.body.querySelectorAll('[aria-label], [title], [alt], [aria-description]')]
    .flatMap((el) => ['aria-label', 'title', 'alt', 'aria-description'].map((a) => el.getAttribute(a) ?? ''));
  return [...trossos, ...atributs].join(' ');
}

async function pinta(comodi) {
  ruta.comodi = comodi;
  render(<ConsolaSection />);
  await act(async () => { await Promise.resolve(); });
  const text = textQueEsLlig();
  cleanup();
  return text;
}

beforeEach(() => {
  vi.stubEnv('DEV', false);
  senseMiddleware();
});

afterEach(() => {
  cleanup();
  delete window.Capacitor;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('regla 2.3.10: la Consola pública dins de l’app nativa', () => {
  test('cap ruta de la Consola nomena una altra plataforma mòbil dins de l’app d’iOS', async () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' };
    const amb = {};
    for (const comodi of RUTES) {
      const text = await pinta(comodi);
      if (nomenaPlataformaAliena(text)) amb[`/consola${comodi ? `/${comodi}` : ''}`] = text.match(/.{0,60}(?:Android|Google\s*Play|APK).{0,60}/i)?.[0];
    }
    expect(amb).toEqual({});
  });

  test('dins de l’app, la pàgina dels empaquetats es queda, amb l’entradeta sense la menció', async () => {
    window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' };
    const text = await pinta('empaquetats');
    expect(text).toContain('iOS, la web i el connector de WordPress');
    expect(text).toContain('Empaquetats no disponibles');
  });

  test('a la web, tal qual: el tauler i els empaquetats nomenen Android (la prova sap trobar-ho)', async () => {
    expect(nomenaPlataformaAliena(await pinta(''))).toBe(true);
    expect(nomenaPlataformaAliena(await pinta('empaquetats'))).toBe(true);
  });
});

describe('les dades dels empaquetats dins de l’app nativa', () => {
  /* Una lectura sencera (com la del servidor local): també dins de l'app,
     cap camp que es pinta en nomena cap altra. */
  const valor = normalitzaEmpaquetats({
    schema: 'sdp.empaquetats.v1',
    generat: '2026-10-30T22:00:00.000Z',
    canonica: '1.0.0',
    carpeta: true,
    plataformes: {
      android: { versions: ['1.0.0'], builds: ['7'], font: 'android/app/build.gradle', artefactes: ['261030_socdepoble_1.0.0+7.aab', 'socdepoble-beta.apk'] },
      ios: { versions: ['1.0.0'], builds: ['7'], font: 'ios/App/App.xcodeproj/project.pbxproj', artefactes: ['261030_socdepoble_1.0.0+7.ipa', '261030_socdepoble_android_1.0.0+7.apk'] },
      pwa: { versions: ['1.0.0'], font: 'package.json' },
      wordpress: { versions: ['1.1.10'], estable: '1.1.10', font: 'wordpress-plugin/sdp.php', artefactes: ['261030_wordpress_directori_v1.1.10.zip'] }
    }
  });

  test('fora de l’app, les quatre plataformes; dins, cap camp en nomena cap altra', () => {
    expect(plataformesEmpaquetades(valor, '1.0.0', { nativa: false }).map((p) => p.id)).toEqual(PLATAFORMES.map((p) => p.id));
    const dins = plataformesEmpaquetades(valor, '1.0.0', { nativa: true });
    expect(dins.map((p) => p.id)).toEqual(['ios', 'pwa', 'wordpress']);
    expect(nomenaPlataformaAliena(JSON.stringify(dins))).toBe(false);
    expect(dins.find((p) => p.id === 'ios').artefactes.map((a) => a.nom)).toEqual(['261030_socdepoble_1.0.0+7.ipa']);
  });

  test('el copy de la pàgina: dins de l’app, sense la menció; fora, tal qual', () => {
    expect(nomenaPlataformaAliena(Object.values(paginaEmpaquetats({ nativa: true })).join(' '))).toBe(false);
    expect(paginaEmpaquetats({ nativa: false }).lead).toMatch(/^Android, iOS/);
  });
});

/* Decisió del Mestre (31-10-2026) · La web publicada porta la instantània
   sanejada del Mapa: «sense Mapa» és ara un paquet sense instantània
   (WordPress, l'app nativa). Prova actualitzada a propòsit. Derogat: «A la web
   publicada no hi és». */
describe('sense Mapa (un paquet sense la instantània publicada), la causa real', () => {
  test('les vuit pàgines del Mapa diuen d’on ve en viu i a la web, sense cap instal·lació pendent', async () => {
    for (const comodi of DEL_MAPA) {
      const text = await pinta(comodi);
      expect(text, `/consola/${comodi}`).toContain('Mapa no disponible');
      expect(text, `/consola/${comodi}`).toMatch(/En viu només el servix el servidor local de desenvolupament/);
      expect(text, `/consola/${comodi}`).toMatch(/la web publicada en porta la instantània sanejada de cada publicació\. Este paquet no la porta, i la Consola no n’inventa cap dada\./);
      expect(text, `/consola/${comodi}`).not.toMatch(/instal·l/);
    }
  });
});
