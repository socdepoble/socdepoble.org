import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';

import { setBackendImplementation } from '../data/backendPort';

describe('App Component', () => {
  it('renders without crashing', async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    setBackendImplementation({
      getCurrentUser: async () => ({ id: '123' }),
      loadCoreContent: async () => {},
      getRuntimeDataMode: () => 'local',
      getBackendConfigurat: () => true,
      getDefaultUserId: () => '123',
      recullTornadaOAuth: async () => {}
    });
    const config = { routerType: 'memory' };
    let container;
    await act(async () => {
      const result = render(<PedraSecaEmbed config={config} />);
      container = result.container;
    });
    expect(container).toBeTruthy();
  });
});
