/* R22.1 · Gauntlet r221-text-05 i r221-ui-06 · El panell «Vídeo principal de
   capçalera» no s'oferix si el servidor no el pot desar. La detecció és de la
   fila viva (admetVideoDeCapcalera): sense la columna hero_video_url
   (servidor sense 20261113060000), la finestra de la capçalera és la de
   sempre; amb la columna (null inclòs), el panell hi és. Mateixes dobles que
   PerfilEditor.test.jsx. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ adapter: null, guardar: vi.fn(), puja: vi.fn(), toast: vi.fn(), recarrega: vi.fn(), identitats: [],
  autodesament: null, updateProfile: vi.fn(), updateOrganization: vi.fn(), updateAgent: vi.fn() }));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { m.adapter = adapter; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => ({ guardarCampPerfil: m.guardar, pujaMitja: m.puja, recarrega: m.recarrega,
  identitats: m.identitats, autodesament: m.autodesament }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getCurrentUser: () => ({ id: 'U' }),
  updateProfile: (...args) => m.updateProfile(...args),
  updateOrganization: (...args) => m.updateOrganization(...args),
  updateAgent: (...args) => m.updateAgent(...args),
}));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn() }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: vi.fn(async () => new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' })),
}));
import { PerfilEditor } from './PerfilEditor.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const ETIQUETA_VIDEO = 'Vídeo principal de capçalera (opcional)';
const PERSONA = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', avatar: 'a.webp', dades: { full_name: 'Pep', is_public: false, town_name: 'La Torre' } };
const ORG = { id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Administració', dades: { name: 'Forn', description: 'Pa', lema: 'Matí', presentacio_html: '', visibility: 'public', role: 'admin' } };
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);

async function obriFinestraDeCapcalera(identitat) {
  render(<PerfilEditor identitat={identitat} />);
  act(() => m.adapter.onHeroEdit({ acaba: vi.fn() }));
  await act(async () => {
    fireEvent.change(selector('heroImage'), { target: { files: [new File(['x'], 'pomes.jpg', { type: 'image/jpeg' })] } });
  });
  return screen.getByRole('dialog', { name: 'Retalla la capçalera' });
}

beforeEach(async () => {
  m.adapter = null; m.guardar.mockReset().mockResolvedValue(undefined); m.puja.mockReset(); m.toast.mockReset();
  m.recarrega.mockReset(); m.identitats = [];
  m.updateProfile.mockReset().mockImplementation(async (canvis) => ({ id: 'U', ...canvis }));
  m.updateOrganization.mockReset().mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  m.updateAgent.mockReset().mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  m.autodesament = { ambit: ambitDe(CONFIG, 'U'), context: CONFIG };
  await cuaDesament.reinicia();
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 800, alcada: 800, tipus: 'image/webp', element: {}, allibera: vi.fn() });
});
afterEach(cleanup);

describe('PerfilEditor · el panell del vídeo segons la fila', () => {
  test.each([['persona', PERSONA], ['organització', ORG]])('%s sense la columna hero_video_url: la finestra no oferix cap vídeo', async (_nom, identitat) => {
    const finestra = await obriFinestraDeCapcalera(identitat);
    expect(within(finestra).queryByText(ETIQUETA_VIDEO)).toBeNull();
    expect(finestra.querySelector('input[type="url"]')).toBeNull();
  });

  test.each([['persona', PERSONA], ['organització', ORG]])('%s amb la columna (null, sense vídeo): el panell hi és', async (_nom, identitat) => {
    const finestra = await obriFinestraDeCapcalera({ ...identitat, dades: { ...identitat.dades, hero_video_url: null } });
    expect(within(finestra).getByText(ETIQUETA_VIDEO)).toBeTruthy();
  });
});
