import { createHash } from 'node:crypto';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const estat = vi.hoisted(() => ({ ui: { externalConfig: {}, language: 'ca', llenguaDelText: 'ca' } }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva, language: estat.ui.language || 'ca' }),
  useUIState: () => estat.ui,
  useUIActionsOpcional: () => null
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

import TextSection from './TextSection.jsx';
import { legalContent } from './legalContent.js';
import { PAGE_COPY } from './pageContent.js';

beforeEach(() => {
  estat.ui = { externalConfig: {}, language: 'ca', llenguaDelText: 'ca' };
});
afterEach(cleanup);

describe('IDEA-340 (R32.61) · Separació d’agraïments de /legal cap a /page/reconeixements en 5 llengües amb SDP-RGPD-021 intacte', () => {
  test('/legal preserva el SHA-256 segellat SDP-RGPD-021 en memòria però en lectura retira el llistat d’agraïments i enllaça /page/reconeixements', () => {
    const shaActual = createHash('sha256').update(legalContent.html, 'utf8').digest('hex');
    expect(shaActual).toBe('ea13f0c4ca8f69ebf8c29035d6f7804d401d48dbdc6e3b5d5fb2b1b975fc1fc7');

    const { container } = render(
      <MemoryRouter rutaInicial="/legal">
        <TextSection page={PAGE_COPY.legal} pageKey="legal" />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('legal-credits-s23')).toBeNull();
    expect(container.textContent).not.toContain("RECONEIXEMENTS I FONTS D'INSPIRACIÓ");
    expect(container.textContent).not.toContain('23. Agraïments a la comunitat divulgadora');
    expect(container.querySelector('a[href="/page/reconeixements"]')).not.toBeNull();
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])(
    '/page/reconeixements pinta el catàleg complet unificat amb divulgadors, blog oficial de Google, laboratoris d’IA i Llei 35/32 en %s',
    async (lang) => {
      estat.ui = { externalConfig: {}, language: lang, llenguaDelText: lang };
      const { container } = render(
        <MemoryRouter rutaInicial="/page/reconeixements">
          <TextSection page={PAGE_COPY.reconeixements} pageKey="reconeixements" />
        </MemoryRouter>
      );

      const bloc = await screen.findByTestId('reconeixements-credits-complet', {}, { timeout: 10000 });
      expect(bloc.getAttribute('lang')).toBe(lang);

      // Tots els divulgadors de §23 + §23.bis + R32.48
      for (const referent of [
        'Alejavi Rivera',
        'Ben Cord',
        'Benjamín Cordero',
        'OpenViking',
        'Emowe',
        'Fernando Tellado',
        'Informática DP',
        'Jon Hernández',
        'Jorge Marfil',
        'MecheTech',
        'Migue Baena',
        'Miriam Lao',
        'Paperclip',
        'Xavier Mitjana',
        // Blog oficial de Google + laboratoris d'IA + models oberts al Node 0
        'The Keyword',
        'blog.google',
        'Google DeepMind',
        'CodeMender',
        'Genie',
        'Google Labs',
        'Stitch',
        'Google Antigravity',
        'Anthropic',
        'Claude',
        'OpenAI',
        'Codex',
        'Node 0',
        'Ollama',
        // Sala neta, cartografia i programari obert
        'ArtCraft',
        'Craft Anything',
        'REA',
        'Leaflet',
        'OpenStreetMap'
      ]) {
        expect(bloc.textContent, `${lang}: ${referent}`).toContain(referent);
      }

      // Verificació d'enllaços oficials de Google i laboratoris
      for (const href of [
        'https://blog.google/',
        'https://blog.google/innovation-and-ai/',
        'https://deepmind.google/',
        'https://labs.google/',
        'https://www.anthropic.com',
        'https://openai.com',
        'https://ollama.com'
      ]) {
        expect(bloc.querySelector(`a[href="${href}"]`), `${lang}: ${href}`).not.toBeNull();
      }

      // Targeta UniversalCard cap a /legal al primer bloc
      expect(container.querySelector('a[href="/legal"]')).not.toBeNull();

      // Tipografia canònica: zero H3/H4 tot en majúscules i zero punt final
      for (const h of container.querySelectorAll('.cms-preview h3, .cms-preview h4')) {
        const t = h.textContent.trim();
        expect(t.endsWith('.'), `${lang} punt final en heading: ${t}`).toBe(false);
        expect(t === t.toUpperCase() && /[A-ZÀ-Ü]/.test(t), `${lang} heading en majúscules: ${t}`).toBe(false);
      }

      expect(bloc.querySelector('[rel~="ugc"]')).toBeNull();
      expect(bloc.querySelector('table')).toBeNull();

      // Llei 35: 6–8 strong en cada <p> editorial de l'obertura i del catàleg complet (excloent l'entradilla de UniversalCard)
      const paragrafsEditorials = container.querySelectorAll('.sdp-cos-tros > p, [data-testid="reconeixements-credits-complet"] > p');
      expect(paragrafsEditorials.length).toBe(11);
      for (const p of paragrafsEditorials) {
        const quantsStrong = p.querySelectorAll('strong').length;
        expect(quantsStrong).toBeGreaterThanOrEqual(6);
        expect(quantsStrong).toBeLessThanOrEqual(8);
      }
    }
  );
});
