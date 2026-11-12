import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ARBRES_MONUMENTALS_2020, FONT_CATALEG_ARBRES_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import { slugRevisionsDoctoralsArbre } from '../../data/patrimoni/esquemaDoctoralArbres.js';
import FitxaArbreMonumental from './FitxaArbreMonumental.jsx';
const hook = vi.hoisted(() => vi.fn());
vi.mock('./useRevisionsArbre.js', () => ({
  useRevisionsArbre: (...args) => {
    hook(...args);
    return { key: 'segon-poble', files: [], fase: 'llest', disponible: false, autoritzat: false, mode: null };
  }
}));
afterEach(cleanup);

it('renderitza un segon poble real amb UTM pendent i el seu propi marc documental', () => {
  const arbre = { ...ARBRES_MONUMENTALS_2020[0], nom: 'Arbre del segon poble', utmEtrs89: null };
  const font = { ...FONT_CATALEG_ARBRES_2020, id: 'cataleg-segon-poble', municipi: 'Segon Poble',
    titol: 'Arbres de Segon Poble', dataInspeccioBase: '2021-10-02', dataAcordPlenari: null,
    marcNormatiu: ['Ordenança del segon poble'], llicencia: 'CC BY 4.0 · Equip del segon poble' };
  render(<FitxaArbreMonumental arbre={arbre} fontDoctoral={font} />);
  expect(screen.getByRole('heading', { level: 3, name: '#1 · Arbre del segon poble' })).toBeTruthy();
  expect(screen.getByText('Arbres de Segon Poble · Segon Poble')).toBeTruthy();
  expect(screen.getByText(/Data de presa de dades · 2021-10-02/)).toBeTruthy();
  expect(screen.getByText(/Coordenades pendents de campanya/)).toBeTruthy();
  expect(screen.getByText('Ordenança del segon poble')).toBeTruthy();
  expect(screen.queryByText(/Acord Plenari d’inclusió/)).toBeNull();
  expect(screen.queryByRole('tab', { name: /07\/09\/2007/ })).toBeNull();
  expect(hook).toHaveBeenCalledWith(slugRevisionsDoctoralsArbre(arbre.id, font.id));
});
