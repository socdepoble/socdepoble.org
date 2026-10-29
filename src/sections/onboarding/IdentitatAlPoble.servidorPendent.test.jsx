/* APP-D1: una escriptura no disponible conserva el valor pendent i no anuncia un desat. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ETIQUETA_USUARI, IdentitatAlPoble, TEXT_DESAT } from './IdentitatAlPoble.jsx';

afterEach(cleanup);
const camp = () => screen.getByLabelText(ETIQUETA_USUARI);


test('QA-C1 · RPC no disponible informa sense confirmar el valor ni marcar el camp com error', async () => {
  const desa = vi.fn(async()=>{throw Object.assign(new Error('Migració pendent'),{code:'NO-DISPONIBLE'});});
  render(<IdentitatAlPoble usuari="annaperez" onDesaUsuari={desa}/>);
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'D’acord, vull @annaperez'}));});
  expect(screen.getByText('Pendent de migració al servidor')).toBeTruthy();
  expect(screen.getByText(/El teu identificador @annaperez es queda escrit ací, sense desar/)).toBeTruthy();
  expect(camp().getAttribute('aria-invalid')).toBeNull();
  expect(screen.queryByText(TEXT_DESAT)).toBeNull();
  expect(camp().value).toBe('annaperez');
});
