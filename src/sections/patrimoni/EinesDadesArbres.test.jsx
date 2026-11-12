import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import { creaFitxaDoctoralArbre, exportaFitxesDoctoralsArbres, importaFitxesDoctoralsArbres } from '../../data/patrimoni/esquemaDoctoralArbres.js';
import EinesDadesArbres from './EinesDadesArbres.jsx';

let createDescriptor, revokeDescriptor;
const create = vi.fn(), revoke = vi.fn();
beforeEach(() => {
  createDescriptor = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
  revokeDescriptor = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
  create.mockReset().mockImplementation(() => `blob:fitxa-${create.mock.calls.length}`);
  revoke.mockReset();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: create });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
});
afterEach(() => {
  cleanup();
  if (createDescriptor) Object.defineProperty(URL, 'createObjectURL', createDescriptor);
  else delete URL.createObjectURL;
  if (revokeDescriptor) Object.defineProperty(URL, 'revokeObjectURL', revokeDescriptor);
  else delete URL.revokeObjectURL;
});

describe('R18 · intercanvi per la interfície normal', () => {
  it.each(['jsonld', 'csv', 'geojson'])('valida els 19 registres exportats en %s', format => {
    const dades = ARBRES_MONUMENTALS_2020.map(arbre => creaFitxaDoctoralArbre(arbre));
    const contingut = exportaFitxesDoctoralsArbres(dades, format);
    render(<EinesDadesArbres arbres={ARBRES_MONUMENTALS_2020} />);
    fireEvent.change(screen.getByLabelText('Format d’importació'), { target: { value: format } });
    fireEvent.change(screen.getByLabelText('Contingut per importar'), { target: { value: contingut } });
    fireEvent.click(screen.getByRole('button', { name: 'Valida i previsualitza' }));
    expect(screen.getByRole('status').textContent).toBe('19 fitxes validades.');
    fireEvent.change(screen.getByLabelText('Format d’exportació'), { target: { value: format } });
    fireEvent.click(screen.getByRole('button', { name: 'Exporta la importació validada' }));
    expect(importaFitxesDoctoralsArbres(screen.getByLabelText('Text exportat').value, format)).toEqual(dades);
  });

  it('allibera els Blob URL en substituir el fitxer i en tancar la vista', () => {
    const { unmount } = render(<EinesDadesArbres arbres={[ARBRES_MONUMENTALS_2020[0]]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exporta 1 fitxes del catàleg' }));
    fireEvent.click(screen.getByRole('button', { name: 'Exporta 1 fitxes del catàleg' }));
    expect(revoke).toHaveBeenCalledWith('blob:fitxa-1');
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:fitxa-2');
  });

  it('neteja una previsualització en canviar de llibre i rebutja JSON alié', () => {
    const { rerender } = render(<EinesDadesArbres arbres={[ARBRES_MONUMENTALS_2020[0]]} />);
    const text = exportaFitxesDoctoralsArbres([creaFitxaDoctoralArbre(ARBRES_MONUMENTALS_2020[0])], 'jsonld');
    fireEvent.change(screen.getByLabelText('Contingut per importar'), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Valida i previsualitza' }));
    expect(screen.getByText('1 fitxes validades.')).toBeTruthy();
    rerender(<EinesDadesArbres arbres={[ARBRES_MONUMENTALS_2020[1]]} />);
    expect(screen.queryByText('1 fitxes validades.')).toBeNull();
    fireEvent.change(screen.getByLabelText('Contingut per importar'), { target: { value: '{"@context":"https://alien.invalid"}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valida i previsualitza' }));
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
