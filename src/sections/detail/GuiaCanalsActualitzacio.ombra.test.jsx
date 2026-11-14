/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · Dins del connector de
   WordPress l'App viu en l'arrel ombra de <soc-de-poble> (PedraSecaEmbed):
   document.querySelector no hi entra i el botó «Torna als botons oficials de
   descàrrega» no feia res. El títol es busca a l'arrel del mateix botó
   (getRootNode), com la resta de capes de l'App. */
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));

import GuiaCanalsActualitzacio from './GuiaCanalsActualitzacio.jsx';

afterEach(() => { cleanup(); document.body.replaceChildren(); });

test('dins d’una arrel ombra, el botó porta el scroll i el focus a l’H1 de la pàgina', () => {
  const amfitrio = document.createElement('soc-de-poble-prova');
  document.body.appendChild(amfitrio);
  const ombra = amfitrio.attachShadow({ mode: 'open' });
  const capcalera = document.createElement('header');
  capcalera.className = 'page-title';
  const h1 = document.createElement('h1');
  h1.textContent = 'Aplicacions';
  h1.scrollIntoView = vi.fn();
  capcalera.appendChild(h1);
  const lloc = document.createElement('div');
  ombra.append(capcalera, lloc);

  render(<GuiaCanalsActualitzacio />, { container: lloc });
  fireEvent.click(within(lloc).getByRole('button', { name: 'Torna als botons oficials de descàrrega' }));

  expect(h1.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  expect(ombra.activeElement).toBe(h1);
});
