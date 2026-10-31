/**
 * Ordre del Mestre (30-10-2026, prompt 2208, T1.1; QA-VES-01 de Codex) · El
 * <head> de /plugin/<id> és el que prerenderitza el build (metadadesDePlugin,
 * compartida amb tooling/seo/build-social-manifest.mjs): el títol, l'entradeta
 * (i, sense, el subtítol) i la il·lustració pel selector social: una WebP o un
 * quadrat va al <head> per la seua variant JPEG de 1200x630, igual a og:image i
 * a twitter:image. La portada que es pinta continua sent l'original.
 * Router en memòria i plataforma de veres, com PluginPage.test.jsx, amb
 * l'amfitrió que declara el <head> (manageDocumentHead).
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { NotificationProvider } from '../../components/universal/NotificationContext.jsx';
import { ProveidorPlataforma } from '../../apps/plataforma/PlataformaContext.jsx';
import PluginPage from './PluginPage.jsx';
import { PLUGINS, pluginPerId } from './registrePlugins.js';

const ENTORN_OBERT = Object.freeze({ produccio: false, teDret: () => true, teCapacitat: () => true, amaDelDocument: true });

function munta(ruta) {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
  return render(
    <UIProvider externalConfig={{ manageDocumentHead: true }}>
      <NotificationProvider>
        <MemoryRouter rutaInicial={ruta}>
          <ProveidorPlataforma entorn={ENTORN_OBERT}>
            <Routes><Route path="/plugin/:id" element={<PluginPage />} /></Routes>
          </ProveidorPlataforma>
        </MemoryRouter>
      </NotificationProvider>
    </UIProvider>
  );
}

const contingut = (selector) => document.head.querySelector(selector)?.getAttribute('content') ?? null;
const variant = (imatge) => `https://socdepoble.org${imatge.replace(/\.[^./]+$/, '-social-1200x630.jpg')}`;

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('el head de /plugin/<id>', () => {
  test.each(PLUGINS.map((plugin) => [plugin.id]))('/plugin/%s: l’entradeta i la variant social de la il·lustració, la mateixa a og i a twitter', (id) => {
    const plugin = pluginPerId(id);
    const { container } = munta(`/plugin/${id}`);
    expect(contingut('meta[property="og:image"]')).toBe(variant(plugin.imatge));
    expect(contingut('meta[name="twitter:image"]')).toBe(variant(plugin.imatge));
    expect(contingut('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(contingut('meta[name="description"]')).toBe(plugin.entradilla);
    expect(contingut('meta[property="og:image:alt"]')).toBe(plugin.imatgeAlt);
    expect(document.title).toBe(`${plugin.titol} | Sóc de Poble`);
    // La portada que es pinta no canvia (Llei del Píxel): l'original.
    expect(container.querySelector('.hero-image img').getAttribute('src')).toBe(plugin.imatge);
  });
});
