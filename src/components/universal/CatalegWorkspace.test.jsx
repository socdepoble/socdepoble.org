import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate, useParams } from '../../app/contexts/RouterContext';
import CatalegWorkspace from './CatalegWorkspace.jsx';
const ui = vi.hoisted(() => ({ language: 'ca' }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(), useUIActionsOpcional: () => ui }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
beforeEach(() => { vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }); vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); ui.language = 'ca'; });
const model = { status: 'ready', canAutoSelect: () => false, categories: [{ id: 'a', label: 'Carpeta A' }],
  items: [{ id: '1', title: 'Nom literal', categoryIds: ['a'], glyph: '🌿' }] };
function Path() { return <output data-testid="path">{useLocation().pathname}</output>; }
/* Regla de les Capçaleres (design_guard · h1-multiple): un sol H1 per fitxer, dins de
   header.page-title. Les dues proves el pinten amb esta capçalera compartida. */
const capcaleraDePagina = titol => <header className="page-title"><h1>{titol}</h1></header>;
function mount() { return render(<MemoryRouter rutaInicial="/page/herbari"><CatalegWorkspace id="prova-cataleg" ruta="/page/herbari" model={model}
  renderDetail={({ item }) => capcaleraDePagina(item ? `Fitxa ${item.title}` : 'Introducció canònica')} /><Path /></MemoryRouter>); }
test('list/tile state, selection, inline page and return home', () => {
  mount();
  expect(screen.getByRole('button', { name: 'Canònica', exact: true }).getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector('.sdp-gestor-fitxa[data-element="1"]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Gran', exact: true }));
  expect(document.querySelector('article.sp-card')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Gran', exact: true }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Quadrícula 2×2', exact: true }));
  expect(screen.getByRole('button', { name: 'Quadrícula 2×2', exact: true }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.queryByRole('button', { name: 'Pàgina principal' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Obri fitxa: Nom literal' }));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Fitxa Nom literal');
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Pàgina principal' }));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Introducció canònica');
  expect(screen.queryByRole('button', { name: 'Pàgina principal' })).toBeNull();
});
test('R21.7 · la columna 1 mai exposa el selector de prova Pàgina de destinació ni Obri la pàgina', () => {
  mount();
  expect(screen.queryByLabelText('Pàgina de destinació')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Obri la pàgina' })).toBeNull();
  expect(screen.getByTestId('path').textContent).toBe('/page/herbari');
});
test.each([['es','Cuadrícula 2×2'],['en','2×2 grid'],['eu','2×2 sareta'],['gl','Grade 2×2']])('common controls follow %s; literal items preserved', (language, label) => {
  ui.language = language; mount();
  expect(screen.getByRole('button', { name: label, exact: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Nom literal', exact: true })).toBeTruthy();
});


test('P116 · els tres renderers reals tenen selecció interior sobre el seu mitjà i cap sangrat esquerre', () => {
  const css = postcss.parse(readFileSync('src/css/modules.css', 'utf8'));
  mount();
  for (const nom of ['Canònica', 'Gran', 'Quadrícula 2×2']) {
    fireEvent.click(screen.getByRole('button', { name: nom, exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Nom literal', exact: true }));
    const actiu = document.querySelector('#app-grid-list [aria-current="true"]');
    const fila = actiu.matches('.sdp-gestor-fitxa') ? actiu : actiu.closest('article.sp-card');
    const mitja = fila.querySelector('.sdp-gestor-fitxa__media, .sp-card-media-container, .sp-card-calendar-badge');
    expect(mitja).toBeTruthy();
    let esquerra = null, overlay = null;
    css.walkRules(regla => {
      if (regla.selector.split(',').some(selector => {
        try { return fila.matches(selector.trim()); } catch { return false; }
      })) regla.walkDecls('border-left', decl => { esquerra = decl.value; });
      if (regla.selector.split(',').some(selector => {
        if (!selector.trim().endsWith('::after')) return false;
        try { return mitja.matches(selector.trim().replace(/::after$/, '')); } catch { return false; }
      })) overlay = Object.fromEntries(regla.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
    });
    expect(esquerra).toBe('0');
    expect(overlay.inset).toBe('0');
    expect(overlay['pointer-events']).toBe('none');
    expect(overlay['box-shadow']).toBe('var(--sdp-cataleg-filet)');
  }
  const tokens = postcss.parse(readFileSync('src/css/tokens.css', 'utf8'));
  const definitions = new Map();
  const filets = [];
  tokens.walkDecls(decl => {
    definitions.set(decl.prop, decl.value);
    if (decl.prop === '--sdp-cataleg-filet') filets.push(decl);
  });
  expect(filets).toHaveLength(2);
  expect(filets[0].parent.selector).not.toContain('[data-theme="dark"]');
  expect(filets[1].parent.selector).toContain('[data-theme="dark"]');
  const rgb = token => {
    const hex = definitions.get(token).replace('#', '');
    return [0, 2, 4].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16));
  };
  const colors = filets.map(decl => {
    expect(decl.value.match(/inset 0 0 0 [34]px/g)).toEqual(['inset 0 0 0 3px', 'inset 0 0 0 4px']);
    expect(decl.value).toContain('92%, transparent');
    return [...decl.value.matchAll(/var\(([^)]+)\)/g)].map(([, token]) => rgb(token));
  });
  expect(colors).toEqual([
    [[0, 0, 0], [255, 255, 255]],
    [[255, 255, 255], [0, 0, 0]]
  ]);
});

describe('R21.10 · T1 persistència universal de subcarpeta i fitxa activa a CatalegWorkspace', () => {
  const modelReceptes = {
    status: 'ready',
    canAutoSelect: () => false,
    categories: [
      { id: 'que-dinem', slugRuta: 'que-dinem', label: 'Què dinem? · Muro (2015)', count: 3, expandOnSelect: true, selectOnRepeat: true },
      { id: 'arrossos', parentId: 'que-dinem', llibreId: 'que-dinem', label: 'Arrossos', count: 1 },
      { id: 'postres', parentId: 'que-dinem', llibreId: 'que-dinem', label: 'Postres i pastes', count: 2 }
    ],
    items: [
      { id: 'arros-al-forn', slugRuta: 'arros-al-forn', title: 'Arròs al forn', categoryIds: ['que-dinem', 'arrossos'], glyph: '🥘' },
      { id: 'pastissets', slugRuta: 'pastissets', title: 'Pastissets de moniato', categoryIds: ['que-dinem', 'postres'], glyph: '🥟' },
      { id: 'mones-de-pasqua', slugRuta: 'mones-de-pasqua', title: 'Mones de Pasqua', categoryIds: ['que-dinem', 'postres'], glyph: '🥮' }
    ]
  };

  /* Una tria que no ve d'un clic a la Columna 2: un enllaç d'una altra part de
     l'app canvia la URL (com l'historial o un enllaç compartit). */
  function NavegacioExterna() {
    const navega = useNavigate();
    return <button type="button" onClick={() => navega('/page/receptes/pastissets')}>Enllaç extern a Pastissets</button>;
  }

  function RutaSincronitzada() {
    const { itemSlug = null } = useParams();
    return (
      <>
        <NavegacioExterna />
        <CatalegWorkspace
          id="prova-receptes-r21-10"
          ruta="/page/receptes"
          model={modelReceptes}
          inclouDescendents
          itemSlug={itemSlug}
          sincronitzaRuta
          renderDetail={({ item }) => capcaleraDePagina(item ? item.title : 'Portada')}
        />
        <Path />
      </>
    );
  }

  function muntaRuta(rutaInicial) {
    return render(
      <MemoryRouter rutaInicial={rutaInicial}>
        <Routes>
          <Route path="/page/receptes/:itemSlug" element={<RutaSincronitzada />} />
          <Route path="/page/receptes" element={<RutaSincronitzada />} />
        </Routes>
      </MemoryRouter>
    );
  }

  /* workspace-06 (Gauntlet R22) · Sense geometria, jsdom dona alçària 0 a tot i
     l'efecte R21.10 de UniversalWorkspace ix abans de mirar si la fila és fora
     de vista: la prova passava igual sense la guarda triaDeClic. Ara les dues
     postres cauen fora de la caixa del cos de la Columna 2, de manera que només
     la guarda impedix el desplaçament del clic, i una tria externa (canvi d'URL)
     sí que ha de desplaçar la fila. */
  function geometriaFora() {
    const origGetBCR = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.classList?.contains('sdp-workspace-column__body')) {
        return { top: 0, bottom: 400, left: 0, right: 320, width: 320, height: 400 };
      }
      if (this.tagName === 'LI' && this.querySelector?.('[data-element="mones-de-pasqua"], [data-element="pastissets"]')) {
        return { top: 920, bottom: 1006, left: 0, right: 320, width: 320, height: 86 };
      }
      return { top: 0, bottom: 86, left: 0, right: 320, width: 320, height: 86 };
    };
    return () => { HTMLElement.prototype.getBoundingClientRect = origGetBCR; };
  }

  test('clicar Mones de Pasqua dins de Postres i pastes MAI perd la subcarpeta ni reseteja scrollTop de Columna 2', () => {
    const restaura = geometriaFora();
    try {
      muntaRuta('/page/receptes');
      // Obrim el llibre arrel per desplegar les subcarpetes i entrem a «Postres i pastes»
      fireEvent.click(screen.getByRole('button', { name: /^Què dinem\?/ }));
      const botoPostres = screen.getByRole('button', { name: /^Postres i pastes/ });
      fireEvent.click(botoPostres);
      expect(botoPostres.getAttribute('aria-current')).toBe('page');

      const cosCol2 = document.querySelector('#app-grid-list .sdp-workspace-column__body');
      cosCol2.scrollTop = 320;
      const espiaScroll = vi.fn();
      for (const li of document.querySelectorAll('#app-grid-list .sdp-gestor-llista > li')) {
        li.scrollIntoView = espiaScroll;
      }

      const botoMones = document.querySelector('#app-grid-list .sdp-gestor-fitxa[data-element="mones-de-pasqua"]');
      expect(botoMones).toBeTruthy();
      fireEvent.click(botoMones);

      expect(screen.getByTestId('path').textContent).toBe('/page/receptes/mones-de-pasqua');
      // La subcarpeta activa continua sent «Postres i pastes», mai no salta a «Què dinem?»
      expect(screen.getByRole('button', { name: /^Postres i pastes/ }).getAttribute('aria-current')).toBe('page');
      expect(screen.getByRole('button', { name: /^Què dinem\?/ }).getAttribute('aria-current')).toBeNull();
      // Només les 2 postres continuen a la Columna 2 i Mones de Pasqua té aria-current="true"
      expect(document.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')).toHaveLength(2);
      expect(document.querySelector('#app-grid-list .sdp-gestor-fitxa[data-element="mones-de-pasqua"]').getAttribute('aria-current')).toBe('true');
      // Zero reset de scrollTop ni scrollIntoView innecessari en clic directe
      expect(cosCol2.scrollTop).toBe(320);
      expect(espiaScroll).not.toHaveBeenCalled();

      // Contraprova: la mateixa geometria, però la tria arriba de fora (URL) i no d'un clic a la fila.
      fireEvent.click(screen.getByRole('button', { name: 'Enllaç extern a Pastissets' }));
      expect(screen.getByTestId('path').textContent).toBe('/page/receptes/pastissets');
      expect(document.querySelector('#app-grid-list .sdp-gestor-fitxa[data-element="pastissets"]').getAttribute('aria-current')).toBe('true');
      expect(espiaScroll).toHaveBeenCalledTimes(1);
      expect(espiaScroll.mock.calls[0][0]).toMatchObject({ block: 'nearest' });
    } finally {
      restaura();
    }
  });

  test('entrada freda per URL (/page/receptes/mones-de-pasqua) tria la subcarpeta fulla, expandeix el pare i fa scrollIntoView si cau fora de vista', () => {
    const scrollCalls = [];
    const origScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const origGetBCR = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.scrollIntoView = function (opts) { scrollCalls.push({ tag: this.tagName, text: this.textContent, opts }); };
    HTMLElement.prototype.getBoundingClientRect = function () {
      if (this.classList?.contains('sdp-workspace-column__body')) {
        return { top: 0, bottom: 400, left: 0, right: 320, width: 320, height: 400 };
      }
      if (this.tagName === 'LI' && this.querySelector?.('[data-element="mones-de-pasqua"]')) {
        return { top: 920, bottom: 1006, left: 0, right: 320, width: 320, height: 86 };
      }
      return { top: 0, bottom: 86, left: 0, right: 320, width: 320, height: 86 };
    };
    try {
      muntaRuta('/page/receptes/mones-de-pasqua');
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Mones de Pasqua');
      const botoPostres = screen.getByRole('button', { name: /^Postres i pastes/ });
      expect(botoPostres.getAttribute('aria-current')).toBe('page');
      expect(document.querySelector('#app-grid-list .sdp-gestor-fitxa[data-element="mones-de-pasqua"]').getAttribute('aria-current')).toBe('true');
      expect(scrollCalls).toHaveLength(1);
      expect(scrollCalls[0].opts).toMatchObject({ block: 'nearest' });
    } finally {
      HTMLElement.prototype.scrollIntoView = origScrollIntoView;
      HTMLElement.prototype.getBoundingClientRect = origGetBCR;
    }
  });
});
