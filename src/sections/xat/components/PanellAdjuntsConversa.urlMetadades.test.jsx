/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · El panell de contingut
   compartit segueix el contracte de la bombolla (AdjuntXat.jsx: «la bombolla
   guarda l'id, mai una URL pública ni una URL signada persistent»): la
   miniatura només es resol pel port (urlAdjuntXat) amb l'id de l'adjunt. Una
   URL que vinga a les metadades d'un missatge (que un altre membre pot posar:
   xat_envia accepta metadades lliures; el xifrat hi barreja les de la fila) no
   es carrega mai: seria un píxel espia que revela a tercers qui obri el panell. */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const port = vi.hoisted(() => ({ urlAdjuntXat: vi.fn() }));
vi.mock('../../../data/backendPort.js', () => ({
  teCapacitat: (nom) => nom === 'xatMultimedia',
  urlAdjuntXat: (...args) => port.urlAdjuntXat(...args)
}));

import PanellAdjuntsConversa from './PanellAdjuntsConversa.jsx';

const tReserva = (_clau, reserva) => reserva;
const ESPIA = 'https://tercer.example/pixel.png';

beforeEach(() => {
  port.urlAdjuntXat.mockReset();
  port.urlAdjuntXat.mockResolvedValue('blob:https://app.example/adj-1');
});
afterEach(cleanup);

const fotos = () => [...document.querySelectorAll('img')].map((img) => img.getAttribute('src'));

test('una foto amb una URL a les metadades es pinta amb la URL del port (per l’id), mai amb la de les metadades', async () => {
  render(
    <PanellAdjuntsConversa
      obert
      onTanca={() => {}}
      onVesAlMissatge={() => {}}
      onObriImatge={() => {}}
      messages={[
        { id: 'm-1', seq: 1, sender: 'other', author: 'Algú', tipus: 'imatge', creatAl: '2026-11-13T09:00:00.000Z',
          metadades: { url: ESPIA, adjunt: { id: 'adj-1', url: ESPIA } } }
      ]}
      t={tReserva}
    />
  );
  expect(fotos()).not.toContain(ESPIA);
  await waitFor(() => expect(fotos()).toEqual(['blob:https://app.example/adj-1']));
  expect(port.urlAdjuntXat).toHaveBeenCalledWith('adj-1', expect.any(Object), expect.any(Object));
});

test('sense id d’adjunt no hi ha res a resoldre: la icona de sempre, cap imatge de fora', () => {
  render(
    <PanellAdjuntsConversa
      obert
      onTanca={() => {}}
      onVesAlMissatge={() => {}}
      onObriImatge={() => {}}
      messages={[
        { id: 'm-2', seq: 2, sender: 'other', author: 'Algú', tipus: 'imatge', creatAl: '2026-11-13T09:00:00.000Z',
          metadades: { url: ESPIA } }
      ]}
      t={tReserva}
    />
  );
  expect(fotos()).toEqual([]);
  expect(screen.getByRole('button', { name: /Foto adjunta/ })).toBeTruthy();
  expect(port.urlAdjuntXat).not.toHaveBeenCalled();
});
