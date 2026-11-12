import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import FitxaDadesDoctoralsArbre from './FitxaDadesDoctoralsArbre.jsx';
const m = vi.hoisted(() => ({ servei: null, hook: vi.fn() }));
vi.mock('./useRevisionsArbre.js', () => ({ useRevisionsArbre: (...args) => { m.hook(...args); return m.servei; } }));
const arbre = ARBRES_MONUMENTALS_2020[0];
const original = { id: '11111111-1111-4111-8111-111111111111', versio: 3,
  entitatTipus: 'arbre', entitatSlug: arbre.id, campanyaAny: 2025, estatConservacio: 'Observació anual',
  mesures: { alcadaM: 15, metodologia: 'Clinòmetre' }, observacions: 'Campanya amb observador.' };
beforeEach(() => {
  m.hook.mockReset();
  m.servei = { key: 'compte-a', files: [], fase: 'llest', autoritzat: true, disponible: true,
    mode: 'seed', desa: vi.fn().mockResolvedValue({}), esborra: vi.fn().mockResolvedValue(true) };
});
afterEach(cleanup);

describe('R18 · edició de campanyes des de la fitxa', () => {
  it('desa valors mesurats amb versió inicial i conserva buides les cotes pendents', async () => {
    render(<FitxaDadesDoctoralsArbre arbre={arbre} />);
    fireEvent.change(screen.getByLabelText(/^Any de campanya/), { target: { value: '2026' } });
    fireEvent.change(screen.getByLabelText(/^Estat de conservació observat/), { target: { value: 'Observat a peu d’arbre' } });
    fireEvent.change(screen.getByLabelText('Alçària total (m)'), { target: { value: '17.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Desa campanya' }));
    await waitFor(() => expect(m.servei.desa).toHaveBeenCalledTimes(1));
    expect(m.servei.desa.mock.calls[0][0]).toEqual({ campanyaAny: 2026, versio: 0,
      estatConservacio: 'Observat a peu d’arbre', mesures: { alcadaM: 17.5 }, observacions: '' });
    expect(await screen.findByText('Campanya desada en la memòria d’esta instància.')).toBeTruthy();
  });

  it('edita amb identificador i versió llegits i manté altres mesures primitives', async () => {
    m.servei.files = [original];
    render(<FitxaDadesDoctoralsArbre arbre={arbre} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar campanya 2025' }));
    fireEvent.change(screen.getByLabelText('Alçària total (m)'), { target: { value: '16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Desa campanya' }));
    await waitFor(() => expect(m.servei.desa).toHaveBeenCalledTimes(1));
    expect(m.servei.desa.mock.calls[0][0]).toMatchObject({ id: original.id, versio: 3, campanyaAny: 2025,
      mesures: { alcadaM: 16, metodologia: 'Clinòmetre' } });
  });

  it('confirma l’esborrat i desactiva el formulari mentre arriba la lectura inicial', async () => {
    m.servei.files = [original];
    const { rerender } = render(<FitxaDadesDoctoralsArbre arbre={arbre} />);
    fireEvent.click(screen.getByRole('button', { name: 'Editar campanya 2025' }));
    fireEvent.click(screen.getByRole('button', { name: 'Esborra campanya' }));
    expect(m.servei.esborra).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirma l’esborrat' }));
    await waitFor(() => expect(m.servei.esborra).toHaveBeenCalledWith({ id: original.id, versio: 3, campanyaAny: 2025 }));
    m.servei = { ...m.servei, key: 'compte-b', files: [], fase: 'carregant' };
    rerender(<FitxaDadesDoctoralsArbre arbre={arbre} />);
    expect(screen.getByRole('button', { name: 'Desa campanya' }).closest('fieldset').disabled).toBe(true);
  });
});
