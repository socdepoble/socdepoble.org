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
import { PAGE_COPY } from './pageContent.js';

beforeEach(() => {
  estat.ui = { externalConfig: {}, language: 'ca', llenguaDelText: 'ca' };
});
afterEach(cleanup);

describe('R32.19 Lot 3 · IDEA-295 · CreditsComunitatS23 dins de /legal en 5 llengües', () => {
  test.each(['ca', 'es', 'en', 'eu', 'gl'])(
    '/legal pinta en viu l’ampliació de §23 amb Alejavi Rivera, ArtCraft, Informática DP, Jorge Marfil, MecheTech i REA en %s',
    async (lang) => {
      estat.ui = { externalConfig: {}, language: lang, llenguaDelText: lang };
      render(
        <MemoryRouter rutaInicial="/legal">
          <TextSection page={PAGE_COPY.legal} pageKey="legal" />
        </MemoryRouter>
      );

      /* Gauntlet v1.2.15 · El bloc ve d'un tros diferit (lazyRoute): sota càrrega, el primer cas tarda més d'1 s. */
      const bloc = await screen.findByTestId('legal-credits-s23', {}, { timeout: 10000 });
      expect(bloc.getAttribute('lang')).toBe(lang);
      expect(bloc.textContent).toContain('Alejavi Rivera');
      expect(bloc.textContent).toContain('ArtCraft');
      expect(bloc.textContent).toContain('Craft Anything');
      expect(bloc.textContent).toContain('Informática DP');
      expect(bloc.textContent).toContain('Jorge Marfil');
      expect(bloc.textContent).toContain('MecheTech');
      expect(bloc.textContent).toContain('REA');
      expect(bloc.querySelectorAll('a[target="_blank"][rel="noopener noreferrer"]').length).toBe(9);
      expect(bloc.querySelector('[rel~="ugc"]')).toBeNull();
    }
  );
});
