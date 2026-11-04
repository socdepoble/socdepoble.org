/* Revisió del Panell de Control (lot «control», 261104) · control-06.

   Mentre es carrega el mòdul diferit de «Mode rural» o de «Restaurar dades
   obertes», el Panell pinta el títol de la fitxa com a text d'espera. Abans
   llegia la reserva en valencià (`TEXTOS_*.titol[1]`) i no passava pel
   traductor. Un mòdul diferit carregat no torna a esperar: per això estes
   proves viuen en un fitxer propi, on cap altra prova l'ha carregat abans. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';

const marca = (clau) => `⟦${clau}⟧`;
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (clau) => `⟦${clau}⟧`, resolveAsset: (valor) => valor }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' } })
}));
vi.mock('../../components/universal/EixidaSegura.jsx', () => ({
  useEixidaSegura: () => ({ demana: vi.fn(), ocupat: false, avis: null, error: null })
}));
vi.mock('./ModeRural.jsx', () => ({ default: () => <p>Fitxa carregada</p> }));
vi.mock('./FitxaOpenData.jsx', () => ({ default: () => <p>Fitxa carregada</p> }));

import ControlSection from './ControlSection.jsx';

afterEach(cleanup);

test.each([
  ['/control?fitxa=mode-rural', 'section.control.rural.titol'],
  ['/control?fitxa=opendata', 'section.pobles.restaurador.titol']
])('control-06 · el text d’espera de %s passa pel traductor', async (ruta, clau) => {
  render(<MemoryRouter rutaInicial={ruta}><ControlSection /></MemoryRouter>);
  expect(screen.getByRole('status').textContent).toBe(marca(clau));
  await screen.findByText('Fitxa carregada');
});
