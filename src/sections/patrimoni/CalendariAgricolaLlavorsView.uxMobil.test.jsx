import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import CalendariAgricolaLlavorsView from './CalendariAgricolaLlavorsView.jsx';

afterEach(cleanup);

describe('CENS01 · CalendariAgricolaLlavorsView (UX mòbil i proximitat dels filtres)', () => {
  test('mostra el recompte viu i el resum de filtres just davall de família i fase, permet restablir i desplaça dins de .sdp-root sense tocar l’amfitrió', () => {
    const scrollHost = vi.fn();
    const scrollApp = vi.fn();

    const host = document.createElement('div');
    host.style.overflowY = 'auto';
    Object.defineProperty(host, 'scrollHeight', { value: 3200, configurable: true });
    Object.defineProperty(host, 'clientHeight', { value: 640, configurable: true });
    host.scrollTo = scrollHost;

    const sdpRoot = document.createElement('div');
    sdpRoot.className = 'sdp-root';
    const contenidorApp = document.createElement('div');
    contenidorApp.style.overflowY = 'auto';
    Object.defineProperty(contenidorApp, 'scrollHeight', { value: 2600, configurable: true });
    Object.defineProperty(contenidorApp, 'clientHeight', { value: 640, configurable: true });
    contenidorApp.scrollTo = scrollApp;

    sdpRoot.appendChild(contenidorApp);
    host.appendChild(sdpRoot);
    document.body.appendChild(host);

    try {
      render(<CalendariAgricolaLlavorsView />, { container: contenidorApp });
      const resumProxim = screen.getByTestId('calendari-agricola-resum-proxim');
      const grupFases = screen.getByRole('group', { name: 'Filtre per fase agronòmica' });
      const grupMesos = screen.getByRole('group', { name: 'Filtre per mes de l’any' });

      expect(grupFases.nextElementSibling).toBe(resumProxim);
      expect(resumProxim.nextElementSibling).toBe(grupMesos);
      expect(within(resumProxim).getByRole('status').textContent).toMatch(/varietats tradicionals actives/);
      expect(within(resumProxim).queryByRole('button', { name: 'Restablir filtres' })).toBeNull();

      fireEvent.click(screen.getByRole('button', { name: /Tomaques tradicionals/ }));
      expect(resumProxim.textContent).toContain('Tomaques tradicionals');
      expect(within(resumProxim).getByRole('button', { name: 'Restablir filtres' })).toBeTruthy();

      fireEvent.click(within(resumProxim).getByRole('button', { name: /Veure varietats/ }));
      expect(scrollApp).toHaveBeenCalledTimes(1);
      expect(scrollHost).not.toHaveBeenCalled();
      expect(document.activeElement?.getAttribute('data-testid')).toBe('calendari-agricola-resultats');

      fireEvent.click(within(resumProxim).getByRole('button', { name: 'Restablir filtres' }));
      expect(within(resumProxim).queryByRole('button', { name: 'Restablir filtres' })).toBeNull();
      // El botó premut desapareix: el focus no cau al body, passa a «Veure varietats».
      expect(document.activeElement).toBe(within(resumProxim).getByRole('button', { name: /Veure varietats/ }));
      expect(scrollHost).not.toHaveBeenCalled();
    } finally {
      host.remove();
    }
  });
});
