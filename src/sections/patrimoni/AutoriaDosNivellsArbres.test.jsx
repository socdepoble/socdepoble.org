/* P0-115 + P0-116 + P0-117 (ordre directa del Mestre, 261111 · Llei Universal d'Autoria de Dos Nivells i URLs compartibles) ·
   /page/arbres-monumentals i /page/receptes amb la maquinària real (PageDetailSection → Workspace → TextSection / UniversalPage):
   · Nivell 1 · la pàgina d'entrada sense cap llibre ni fitxa triada i la seua targeta del Mur: barra taronja i logotip de
     Sóc de Poble i COPYRIGHT_SDP; el text presenta l'acollida multipoble amb el primer llibre d'exemple.
   · Nivell 2 · les 20 pàgines del llibre de La Torre (la portada WP #619 i els 19 arbres) les signen El Rentonar i Pedro Ferrer
     Rodriguez (DRETS_CATALEG_ARBRES), i el llibre «Què dinem?» i les seues 149 receptes les signa l'Associació Gastronòmica i
     Cultural «Fins rebentar com Sangonereta» (COPYRIGHT_QUE_DINEM), mai dins del TextSection de Sóc de Poble i amb URL pròpia
     /page/:slug/:itemSlug + BarraBlava visible per a compartir-les i SEO dinàmic. */
import { webcrypto } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const ui = vi.hoisted(() => ({ language: 'ca', t: (_clau, reserva) => reserva, seoCalls: [] }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ui,
  useUIActionsOpcional: () => ui,
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (meta) => { ui.seoCalls.push(meta); } }));

import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';
import PageDetailSection from '../detail/PageDetailSection.jsx';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { localitzaPagina } from '../text/pageContent.r10.js';
import { DRETS_CATALEG_ARBRES, DRETS_QUE_DINEM } from '../text/pageContent.dretsPatrimoni.js';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import { FONT_ARBRES_MONUMENTALS } from '../../data/patrimoni/arbresMonumentals.js';
import { LLIBRES_ARBRES_MONUMENTALS } from '../../data/patrimoni/llibresArbresMonumentals.js';
import { OBRA_QUE_DINEM, RECEPTES_QUE_DINEM } from '../../data/patrimoni/queDinem.js';

const LLIBRE_LA_TORRE = LLIBRES_ARBRES_MONUMENTALS[0];
const AUTORIA_LLIBRE_ARBRES = LLIBRE_LA_TORRE.autoria;

beforeEach(() => {
  ui.seoCalls = [];
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function UbicacioActual() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio-actual">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}

const visita = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <UbicacioActual />
    <Routes>
      <Route path="/page/:slug/:itemSlug" element={<PageDetailSection />} />
      <Route path="/page/:slug" element={<PageDetailSection />} />
    </Routes>
  </MemoryRouter>
);

function autoriaDelDetall() {
  const detall = document.getElementById('app-grid-main');
  const barra = detall.querySelector('section.bar-orange');
  const barraBlava = detall.querySelector('nav.bar-blue, header.bar-blue, section.bar-blue, .bar-blue');
  return {
    detall,
    barraBlava,
    nom: barra?.querySelector('.sp-card-author-name')?.textContent ?? null,
    lloc: barra?.querySelector('.sp-card-author-location')?.textContent ?? null,
    ruta: barra?.querySelector('a.sp-card-author-link')?.getAttribute('href') ?? null,
    drets: detall.querySelector('header.page-title .page-title-copyright')?.textContent ?? null,
    logos: [...detall.querySelectorAll('header.page-title img')].map((img) => img.getAttribute('alt')),
    h1: [...detall.querySelectorAll('h1')].map((h) => h.textContent)
  };
}

const entradaDeLaLlista = (id) => [...document.getElementById('app-grid-list').querySelectorAll('[data-element]')]
  .find((node) => node.getAttribute('data-element') === id && node.matches('button, a[href]'));

describe('P0-115 + P0-117 · Llei d’Autoria de Dos Nivells i URLs compartibles', () => {
  test('les dades: llibre amb portada WP #619 + 19 arbres i dos drets diferenciats', () => {
    expect(ARBRES_MONUMENTALS_2020).toHaveLength(19);
    expect(ARBRES_MONUMENTALS_2020.map((a) => a.id)).toContain('arbre-19-xiprers-del-cementeri');
    expect(PAGE_COPY['arbres-monumentals'].copyright).toBe(COPYRIGHT_SDP);
    expect(PAGE_COPY.receptes.copyright).toBe(COPYRIGHT_SDP);
    expect(AUTORIA_LLIBRE_ARBRES).toMatchObject({ nom: 'Associació El Rentonar', ruta: '/rentonar', drets: DRETS_CATALEG_ARBRES });
    expect(DRETS_CATALEG_ARBRES).toContain('Pedro Ferrer Rodriguez');
    expect(DRETS_CATALEG_ARBRES).toContain('El Rentonar');
    expect(COPYRIGHT_SDP).not.toMatch(/Rentonar|Pedro Ferrer|Sangonereta/);
  });

  /* D3 del Mestre (acta 261112_1400) · Gauntlet R21 (regressio_commit1-04) · L'autor de l'estudi tècnic del catàleg
     s'escriu «Rodriguez», com a la pàgina 619 de WordPress i a actaRentonar.js. Cap fitxer de producció de src no pot
     escriure «Ferrer Rodríguez», fora de les dues fonts de src/data que encara no han rebut D3: quan s'hi aplique, la
     llista s'ha de buidar i la prova ho exigix. */
  const GRAFIA_PENDENT_A_DADES = ['data/importacio/catalegArbresRentonarWp.js', 'data/patrimoni/revisionsArbresCief.js'];
  test('D3 · cap fitxer de producció escriu «Ferrer Rodríguez» fora de les fonts de dades pendents', () => {
    const arrel = resolve('src');
    const ambAccent = readdirSync(arrel, { recursive: true })
      .map((f) => String(f).split(sep).join('/'))
      .filter((f) => /\.(?:js|jsx|mjs)$/.test(f) && !f.includes('.test.'))
      .filter((f) => readFileSync(resolve(arrel, f), 'utf8').includes('Ferrer Rodríguez'));
    expect(ambAccent.sort()).toEqual(GRAFIA_PENDENT_A_DADES);
  });

  test('nivell 1 · el text d’entrada d’arbres presenta l’acollida multipoble en 5 llengües sense prometre cap formulari', () => {
    const invitacio = {
      ca: ['persona', 'associació', 'ajuntament', 'Comentar', '«En privat»'],
      es: ['persona', 'asociación', 'ayuntamiento', 'Comentar', '«En privado»'],
      en: ['person', 'association', 'town council', 'Comment', '“Privately”'],
      eu: ['pertsona', 'elkarte', 'udal', 'Iruzkindu', '«Pribatuan»'],
      gl: ['persoa', 'asociación', 'concello', 'Comentar', '«En privado»']
    };
    const senseFormulari = { ca: 'Encara no hi ha cap', es: 'Todavía no hay ningún', en: 'There is no', eu: 'Oraindik ez dago', gl: 'Aínda non hai ningún' };
    for (const [llengua, paraules] of Object.entries(invitacio)) {
      const p = localitzaPagina(PAGE_COPY['arbres-monumentals'], llengua);
      expect(p.lead, llengua).toMatch(/^Sóc de Poble/);
      for (const nom of ['La Torre de les Maçanes', 'El Rentonar', 'Pedro Ferrer Rodriguez']) expect(p.lead, `${llengua} ${nom}`).toContain(nom);
      for (const paraula of paraules) expect(p.html, `${llengua} ${paraula}`).toContain(`<strong>${paraula}</strong>`);
      expect(p.html, llengua).toContain(senseFormulari[llengua]);
      for (const par of p.html.match(/<p>.*?<\/p>/g)) expect((par.match(/<strong>/g) || []).length, `${llengua}: ${par.slice(0, 60)}`).toBeLessThanOrEqual(8);
    }
  });

  test('nivell 1 i nivell 2 a /page/arbres-monumentals: entrada de Sóc de Poble i les 20 pàgines (portada WP #619 + 19 arbres) d’El Rentonar amb URL pròpia', async () => {
    visita('/page/arbres-monumentals');
    await screen.findByRole('heading', { level: 1, name: PAGE_COPY['arbres-monumentals'].title }, { timeout: 8000 });
    const a1 = autoriaDelDetall();
    expect([a1.nom, a1.ruta, a1.drets]).toEqual(['Sóc de Poble', RUTA_PERFIL_PROJECTE, COPYRIGHT_SDP]);
    expect(a1.logos.join(' ')).not.toContain('Rentonar');

    // Portada del llibre (WP #619) des de la carpeta desplegable de Columna 1
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${LLIBRE_LA_TORRE.etiquetaNavegacio}`) }));
    });
    await screen.findByRole('heading', { level: 1, name: FONT_ARBRES_MONUMENTALS.titol }, { timeout: 8000 });
    expect(screen.getByTestId('ubicacio-actual').textContent).toBe(`/page/arbres-monumentals/${LLIBRE_LA_TORRE.id}`);
    const aPortada = autoriaDelDetall();
    expect([aPortada.nom, aPortada.lloc, aPortada.ruta, aPortada.drets])
      .toEqual([AUTORIA_LLIBRE_ARBRES.nom, AUTORIA_LLIBRE_ARBRES.poble, '/rentonar', DRETS_CATALEG_ARBRES]);
    expect(aPortada.logos).toEqual([AUTORIA_LLIBRE_ARBRES.altLogo]);
    expect(aPortada.barraBlava).toBeTruthy();

    // Els 19 arbres: cadascun en la seua pròpia UniversalPage i URL /page/arbres-monumentals/<arbre.id>
    for (const arbre of ARBRES_MONUMENTALS_2020) {
      const itemId = `${LLIBRE_LA_TORRE.id}:${arbre.id}`;
      const titol = `#${arbre.ordre} · ${arbre.nom}`;
      const entrada = entradaDeLaLlista(itemId);
      expect(entrada, itemId).toBeTruthy();
      await act(async () => { fireEvent.click(entrada); });
      const detall = document.getElementById('app-grid-main');
      await within(detall).findByRole('heading', { level: 1, name: titol });
      expect(screen.getByTestId('ubicacio-actual').textContent, arbre.id).toBe(`/page/arbres-monumentals/${arbre.id}`);
      const a = autoriaDelDetall();
      expect([a.nom, a.lloc, a.ruta, a.drets], arbre.id)
        .toEqual([AUTORIA_LLIBRE_ARBRES.nom, AUTORIA_LLIBRE_ARBRES.poble, '/rentonar', DRETS_CATALEG_ARBRES]);
      expect(a.logos, arbre.id).toEqual([AUTORIA_LLIBRE_ARBRES.altLogo]);
      expect(a.barraBlava, arbre.id).toBeTruthy();
      expect(a.detall.querySelector('.cms-preview'), arbre.id).toBeNull();
      expect(a.detall.querySelector('section.bar-orange').textContent, arbre.id).not.toContain('Sóc de Poble');
    }
  }, 60000);

  test('P0-117 · /page/receptes publica amb Sóc de Poble a la barra taronja (únic compte registrat) i conserva els drets de l’Associació al llibre i les receptes', async () => {
    visita('/page/receptes');
    await screen.findByRole('heading', { level: 1, name: 'Receptes' }, { timeout: 8000 });
    const aMarc = autoriaDelDetall();
    expect([aMarc.nom, aMarc.ruta, aMarc.drets]).toEqual(['Sóc de Poble', RUTA_PERFIL_PROJECTE, COPYRIGHT_SDP]);
    expect(aMarc.barraBlava).toBeTruthy();

    // Obrir la carpeta del llibre «Què dinem?» a la Columna 1
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Què dinem\? · Muro/ }));
    });
    await screen.findByRole('heading', { level: 1, name: 'Què dinem?' });
    expect(screen.getByTestId('ubicacio-actual').textContent).toBe('/page/receptes/que-dinem');
    const aLlibre = autoriaDelDetall();
    expect([aLlibre.nom, aLlibre.ruta, aLlibre.drets]).toEqual(['Sóc de Poble', RUTA_PERFIL_PROJECTE, DRETS_QUE_DINEM]);
    expect(aLlibre.barraBlava).toBeTruthy();
    expect(aLlibre.detall.textContent).toContain(OBRA_QUE_DINEM.associacio);

    // Obrir «Conserva de tomaca»
    const conserva = RECEPTES_QUE_DINEM.find((r) => r.slug === 'conserva-de-tomaca') || RECEPTES_QUE_DINEM[6];
    await act(async () => {
      fireEvent.click(entradaDeLaLlista(conserva.slug));
    });
    await screen.findByRole('heading', { level: 1, name: conserva.titol });
    expect(screen.getByTestId('ubicacio-actual').textContent).toBe(`/page/receptes/${conserva.slug}`);
    const aRecepta = autoriaDelDetall();
    expect([aRecepta.nom, aRecepta.ruta, aRecepta.drets]).toEqual(['Sóc de Poble', RUTA_PERFIL_PROJECTE, DRETS_QUE_DINEM]);
    expect(aRecepta.barraBlava).toBeTruthy();
    expect(ui.seoCalls.some((meta) => meta?.title?.includes(conserva.titol) && meta?.index === true)).toBe(true);
  });

  test('P0-117 · entrada directa per URL a /page/receptes/conserva-de-tomaca i /page/herbari/herbari-001-acacia-robinia (signat exclusivament per Sóc de Poble) i 404 honest', async () => {
    visita('/page/receptes/conserva-de-tomaca');
    await screen.findByRole('heading', { level: 1, name: 'Conserva de tomaca' }, { timeout: 8000 });
    expect(autoriaDelDetall().barraBlava).toBeTruthy();
    expect(autoriaDelDetall().nom).toBe('Sóc de Poble');
    expect(autoriaDelDetall().ruta).toBe(RUTA_PERFIL_PROJECTE);
    expect(autoriaDelDetall().drets).toBe(DRETS_QUE_DINEM);
    cleanup();

    visita('/page/herbari/herbari-001-acacia-robinia');
    await screen.findByRole('heading', { level: 1, name: 'Acacia robínia' }, { timeout: 8000 });
    const aHerbari = autoriaDelDetall();
    expect(aHerbari.barraBlava).toBeTruthy();
    expect([aHerbari.nom, aHerbari.ruta, aHerbari.drets]).toEqual(['Sóc de Poble', RUTA_PERFIL_PROJECTE, COPYRIGHT_SDP]);
    expect(aHerbari.detall.textContent).not.toMatch(/Projecte educatiu i etnobotànic/i);
    cleanup();

    visita('/page/receptes/recepta-inexistent-404');
    await screen.findByRole('heading', { level: 1, name: /ací no hi ha res|no hem trobat|pàgina no trobada|404/i }, { timeout: 8000 });
  });

  test('nivell 1 · les targetes del Mur d’arbres-monumentals i receptes les signa Sóc de Poble amb COPYRIGHT_SDP', () => {
    const targetes = targetesDeSistema(PAGE_COPY);
    for (const clau of ['arbres-monumentals', 'receptes']) {
      const item = targetes.find((targeta) => targeta.id === clau);
      expect(item, clau).toMatchObject({ isSystem: true, mainHref: `/page/${clau}`, copyright: COPYRIGHT_SDP });
      const { container, unmount } = render(<MemoryRouter rutaInicial="/mur"><TargetaDelMur item={item} /></MemoryRouter>);
      const article = container.querySelector('article');
      expect(article.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
      expect(article.querySelector('.sp-card-copyright__enllac').textContent).toBe(COPYRIGHT_SDP);
      unmount();
    }
  });
});
