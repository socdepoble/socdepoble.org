/* Gauntlet 261030 (Fase 3, TC3.3; lang-interficie-sobre-contingut-valencia)
   · PAGE_COPY és sempre en valencià: TextSection ho declara a la Pàgina
   Universal (llenguaDelContingut="ca"), i PageFrame hi posa el lang quan la
   interfície és en una altra llengua (PageFrame.traduccio.lliure.test.jsx).
   Els dobles de TextSection.imatgeSocial.test.jsx. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ props: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (cami) => cami }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/page/fediversity' }), useRouter: () => ({ basename: '' }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    mocks.props = props;
    return React.createElement('div', { 'data-pagina': '' }, children);
  }
}));
import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';

afterEach(cleanup);

test('TextSection declara el contingut de PAGE_COPY en valencià', () => {
  for (const clau of ['fediversity', 'consola', 'cervell']) {
    mocks.props = null;
    render(<TextSection page={PAGE_COPY[clau]} pageKey={clau} />);
    expect(mocks.props?.llenguaDelContingut, clau).toBe('ca');
    cleanup();
  }
});
