/* PROVES-03 (R15b) · Amb el hook de veres (useProjeccionsCataleg), un backend que no declara la capacitat
   'projeccionsCataleg' (l'adaptador HTTP del Node 0, o cap implementació del port) i una visita sense sessió: no hi ha
   res a llegir, i no és cap lectura fallida. Ni el Mur ni el Mercat no pinten cap avís ni cap secció. */
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { teCapacitat } from '../../../data/backendPort.js';
import { useProjeccionsCataleg } from '../../../hooks/useProjeccionsCataleg.js';
import ProjeccionsEnSuperficie from './ProjeccionsEnSuperficie.jsx';

afterEach(cleanup);

let estat = null;
function Espia() { estat = useProjeccionsCataleg({ escriptura: false }); return null; }

test.each(['mur', 'mercat'])('%s · sense capacitat i sense sessió, el hook real no publica cap error i no es pinta res', async (desti) => {
  expect(teCapacitat('projeccionsCataleg')).toBe(false);
  const { container } = render(<MemoryRouter rutaInicial={`/${desti}`}><ProjeccionsEnSuperficie desti={desti} /><Espia /></MemoryRouter>);
  await waitFor(() => expect(estat?.estat).not.toBe('carregant'));
  expect(estat).toMatchObject({ error: null, projeccions: [], autoritzat: false, ownerId: null });
  expect(container.innerHTML).toBe('');
  expect(container.querySelector('[role="status"]')).toBeNull();
});

test('el lector sense sessió no ofereix desar res', async () => {
  render(<Espia />);
  await expect(estat.desa({ font: 'herbari', id: 'x', title: 'x' }, ['mur'])).rejects.toMatchObject({ codi: 'sense-permis' });
});
