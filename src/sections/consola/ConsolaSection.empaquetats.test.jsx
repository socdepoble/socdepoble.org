import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* P1-35 (pla 261028_1526 §3.5.2; decisió 6 del Mestre) · Empaquetats i
   llançament a /consola, amb el router de veres i les targetes de veres: la
   secció del tauler (el seu H2 i una targeta que porta a la seua pàgina),
   /consola/empaquetats amb cada plataforma (semàfor, versió declarada, noms
   dels artefactes i l'ordre exacta per a copiar, cap botó que publique), el
   mode privacitat, l'estat buit honest sense font, i la Versió Canònica del
   Sistema al peu de totes les pàgines, sense una segona regió viva. Només es
   falsegen les fonts i el que no té res a vore (SEO, avisos, graf, closca). */
const fonts = vi.hoisted(() => ({ empaquetats: null }));
/* El segell del build: a les proves no n'hi ha (vite.config.js només el posa
   en compilar). Una prova el fixa per a vore que el peu i la pàgina diuen
   versioCanonica() de config/versio.js, també amb build, i no un text fix. */
const segell = vi.hoisted(() => ({ build: null }));
vi.mock('../../config/versio.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, versioCanonica: (build = segell.build ?? real.BUILD_SISTEMA) => real.versioCanonica(build) };
});
const crides = vi.hoisted(() => ({ empaquetats: 0 }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, lead, children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header>
      {(subtitle || lead) && <div className="page-intro">{subtitle && <h2>{subtitle}</h2>}{lead && <p className="lead">{lead}</p>}</div>}
      {children}
    </main>
  )
}));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'absent', mapa: null, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(null)
}));
vi.mock('./govern/governContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaGovern: () => Promise.resolve(null)
}));
vi.mock('./empaquetats.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaEmpaquetats: () => { crides.empaquetats += 1; return Promise.resolve(fonts.empaquetats); }
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';
import { CLAU_PRIVACITAT, copyConsola } from './consolaPagines.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { dataLocal } from './consolaContent.js';
import {
  ETIQUETA_NAV_EMPAQUETATS, RUTA_EMPAQUETATS, TITOL_EMPAQUETATS, normalitzaEmpaquetats, paginaEmpaquetats
} from './empaquetats.js';
import { versioCanonica } from '../../config/versio.js';

const BRUT = {
  schema: 'sdp.empaquetats.v1',
  generat: '2026-10-28T16:30:00.000Z',
  canonica: '1.0.0',
  carpeta: true,
  plataformes: {
    android: { versions: ['1.0.0'], builds: ['1'], font: 'android/app/build.gradle', artefactes: ['261023_socdepoble_1.0.0+1.aab', 'socdepoble-beta.apk'] },
    ios: { versions: ['1.0.0'], builds: ['1'], font: 'ios/App/App.xcodeproj/project.pbxproj', artefactes: ['261024_socdepoble_1.0.0+1.xcarchive'] },
    pwa: { versions: ['1.0.0'], font: 'package.json', artefactes: [] },
    wordpress: { versions: ['1.1.9'], estable: '1.1.9', font: 'wordpress-plugin/socdepoble-enxufe.php', artefactes: ['261021_2015_wordpress_enxufe_v1.1.9.zip'] }
  }
};
const ORDRE_ANDROID = 'node scripts/botigues/puja-android.mjs --versio 1.0.0 --build 1 --confirma=1.0.0+1';
const ORDRE_IOS = 'node scripts/botigues/puja-ios.mjs --versio 1.0.0 --build 1 --confirma=1.0.0+1';

let errors;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  crides.empaquetats = 0;
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  localStorage.clear();
  fonts.empaquetats = null;
  segell.build = null;
});

function Aplicacio() {
  return (
    <RouterProvider>
      <Routes>
        <Route path="/consola/*" element={<ConsolaSection />} />
      </Routes>
    </RouterProvider>
  );
}
async function obri(ruta) {
  window.history.replaceState(null, '', ruta);
  render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
}
const main = () => document.querySelector('main');
const peu = () => document.querySelector('.sdp-consola__peu');

describe('el tauler de /consola', () => {
  test('darrere de les xifres i abans de l’Índex, una secció amb el seu H2 i una sola targeta, cap a la seua pàgina', async () => {
    fonts.empaquetats = normalitzaEmpaquetats(BRUT);
    await obri('/consola');
    const seccio = screen.getByRole('region', { name: TITOL_EMPAQUETATS });
    expect(seccio.tagName).toBe('SECTION');
    expect([...seccio.querySelectorAll('h2')].map((h) => h.textContent)).toEqual([TITOL_EMPAQUETATS]);
    const despres = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(despres(screen.getByRole('region', { name: 'El Mas en xifres' }), seccio)).toBe(true);
    expect(despres(seccio, screen.getByRole('region', { name: 'Índex de la Consola' }))).toBe(true);
    const nav = within(seccio).getByRole('navigation', { name: ETIQUETA_NAV_EMPAQUETATS });
    expect(nav.className).toBe('sdp-card-grid sdp-consola__graella');
    const targetes = [...nav.querySelectorAll('article.sp-card')];
    expect(targetes).toHaveLength(1);
    const [t] = targetes;
    expect(t.className).toBe('sp-card sdp-consola__targeta');
    expect(t.querySelector('h3.sp-card-title').textContent).toBe(paginaEmpaquetats().title);
    expect(t.querySelector('h4.sp-card-subtitle').textContent).toMatch(/^Per a /);
    // La web és la font de la versió: no compta al recompte.
    expect(t.querySelector('.sdp-consola__dada').textContent).toBe(`v1.0.0 · 3 de 3 al pas`);
    expect([...t.querySelectorAll('.sp-card-label')].map((l) => l.textContent)).toEqual(['En ordre']);
    expect([...nav.querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href'))).toEqual([RUTA_EMPAQUETATS]);
    // La data de la pastilla: la de la instantània, més recent que la del copy.
    const quan = dataHoraDeBarra({ creat: copyConsola().date, modificat: BRUT.generat });
    expect(t.querySelector('.sp-card-header time').getAttribute('datetime')).toBe(quan.dateTime);
    expect(quan.dateTime).toMatch(/^2026-10-28T17:30/);
    expect(crides.empaquetats).toBe(1);
    expect(errors).not.toHaveBeenCalled();
  });

  test('sense font, la targeta diu per què i no inventa cap xifra', async () => {
    await obri('/consola');
    const t = within(screen.getByRole('navigation', { name: ETIQUETA_NAV_EMPAQUETATS })).getByRole('article');
    expect(t.querySelector('.sdp-consola__dada').textContent).toBe('Empaquetats no disponibles en este entorn');
    expect([...t.querySelectorAll('.sp-card-label')].map((l) => l.textContent)).toEqual(['Sense font']);
    expect(t.textContent).not.toMatch(/\d de \d/);
    expect(errors).not.toHaveBeenCalled();
  });
});

describe('/consola/empaquetats', () => {
  test('cada plataforma: el semàfor, la versió declarada, els noms dels artefactes i l’ordre exacta; cap botó publica', async () => {
    fonts.empaquetats = normalitzaEmpaquetats(BRUT);
    await obri(RUTA_EMPAQUETATS);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(paginaEmpaquetats().title);
    const molla = screen.getByRole('navigation', { name: 'Molla de pa' });
    expect(main().querySelector('.page-intro').nextElementSibling).toBe(molla);
    expect(main().textContent).toContain(`Versió Canònica del Sistema: ${versioCanonica()}`);
    const seccions = [...main().querySelectorAll('section')];
    expect(seccions.map((s) => s.querySelector('h3').textContent)).toEqual(['Android', 'iOS', 'Web (socdepoble.org)', 'Connector de WordPress']);
    const [android, ios, web, wordpress] = seccions;
    expect(android.querySelector('.sdp-insignia').textContent).toBe('Alineat');
    expect(android.textContent).toContain('Versió declarada: 1.0.0+1 · Font: android/app/build.gradle');
    expect([...android.querySelectorAll('ul > li')].map((li) => li.textContent)).toEqual(['261023_socdepoble_1.0.0+1.aab', 'socdepoble-beta.apk']);
    expect(android.querySelector('pre').textContent).toBe(ORDRE_ANDROID);
    expect(ios.querySelector('pre').textContent).toBe(ORDRE_IOS);
    // Els artefactes són els de la carpeta de builds; l'ordre puja el fitxer dels scripts.
    expect(android.textContent).toContain('A la carpeta de builds, l’últim artefacte és el de la versió declarada.');
    expect(android.querySelector('pre').nextElementSibling.textContent)
      .toBe('Puja android/app/build/outputs/bundle/release/app-release.aab, no cap artefacte de la carpeta de builds.');
    expect(ios.querySelector('pre').nextElementSibling.textContent)
      .toBe('Puja <SDP_BUILDS_DIR>/sdp-ios-1.0.0-1/export/*.ipa, no cap artefacte de la carpeta de builds.');
    expect(web.querySelector('pre')).toBeNull();
    expect(web.querySelector('.sdp-insignia').textContent).toBe('Font canònica');
    expect(web.textContent).not.toContain('Alineat');
    expect(web.textContent).toContain('Cap artefacte a la carpeta de builds.');
    expect(wordpress.textContent).toContain('El connector porta numeració pròpia.');
    expect(wordpress.querySelector('pre').textContent).toMatch(/^SDP_RELEASE=1 SDP_VERSIO=1\.1\.9 npm run build:wp && SDP_RELEASE=1 SDP_VERSIO=1\.1\.9 npm run build:wp:directori && node wordpress-plugin\/eines\/empaqueta\.mjs /);
    expect(wordpress.querySelector('pre').nextElementSibling.tagName).toBe('P');
    expect(wordpress.textContent).not.toContain('Puja ');
    // Cap botó publica: al peu, només Refrescar i l'interruptor de privacitat.
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Refrescar']);
    expect(main().querySelector('a[href^="http"], form')).toBeNull();
    // El peu: l'últim, amb la instantània dels empaquetats i la versió.
    const germans = [...main().children].filter((el) => el.tagName !== 'DIALOG');
    expect(germans.at(-1)).toBe(peu());
    expect(within(peu()).getByRole('status').textContent).toBe(`Instantània dels empaquetats: ${dataLocal(BRUT.generat, 'ca-ES')}`);
    expect(errors).not.toHaveBeenCalled();
  });

  test('Refrescar torna a llegir els empaquetats', async () => {
    fonts.empaquetats = normalitzaEmpaquetats(BRUT);
    await obri(RUTA_EMPAQUETATS);
    expect(crides.empaquetats).toBe(1);
    await act(async () => { fireEvent.click(within(peu()).getByRole('button', { name: /Refrescar/ })); });
    expect(crides.empaquetats).toBe(2);
  });

  test('amb el mode privacitat, ni les ordres ni els noms dels artefactes ni les fonts', async () => {
    localStorage.setItem(CLAU_PRIVACITAT, '1');
    fonts.empaquetats = normalitzaEmpaquetats(BRUT);
    await obri(RUTA_EMPAQUETATS);
    const text = main().textContent;
    for (const tros of [ORDRE_ANDROID, ORDRE_IOS, '261023_socdepoble_1.0.0+1.aab', 'android/app/build.gradle', 'npm run build:wp', 'app-release.aab', 'sdp-ios-1.0.0-1']) {
      expect(text, tros).not.toContain(tros);
    }
    expect(text).toContain('dada amagada pel mode privacitat');
  });

  test('sense font: ho diu, i cap plataforma inventada', async () => {
    await obri(RUTA_EMPAQUETATS);
    expect(screen.getByText('Empaquetats no disponibles')).toBeTruthy();
    expect(main().querySelector('section')).toBeNull();
    expect(main().querySelector('pre')).toBeNull();
    expect(within(peu()).getByRole('status').textContent).toBe('Instantània encara no disponible.');
    expect(errors).not.toHaveBeenCalled();
  });
});

/* P1-35 · El peu de dades de totes les pàgines diu la Versió Canònica del
   Sistema, sense una segona regió viva: la instantània continua sent l'única. */
test.each(['/consola/explorador', '/consola/pols', RUTA_EMPAQUETATS])('%s: el peu diu la versió del sistema, sense role=status', async (ruta) => {
  await obri(ruta);
  const versio = [...peu().querySelectorAll('p')].find((p) => p.textContent.startsWith('Versió del sistema: '));
  expect(versio.textContent).toBe(`Versió del sistema: ${versioCanonica()}`);
  expect(versio.className).toBe('sdp-consola__instantania');
  expect(versio.hasAttribute('role')).toBe(false);
  expect(within(peu()).getAllByRole('status')).toHaveLength(1);
});

test.each(['/consola/pols', RUTA_EMPAQUETATS])('%s: amb el build segellat, el peu i la pàgina diuen la versió amb el seu build', async (ruta) => {
  segell.build = '261028';
  await obri(ruta);
  expect(versioCanonica()).toBe('v1.0.0 (build 261028)');
  const versio = [...peu().querySelectorAll('p')].find((p) => p.textContent.startsWith('Versió del sistema: '));
  expect(versio.textContent).toBe('Versió del sistema: v1.0.0 (build 261028)');
  if (ruta === RUTA_EMPAQUETATS) expect(main().textContent).toContain('Versió Canònica del Sistema: v1.0.0 (build 261028)');
});
