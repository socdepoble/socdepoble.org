import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { DialegNovaOrganitzacio } from './DialegNovaOrganitzacio.jsx';

afterEach(cleanup);

const obri = (props = {}) => {
  const onCrea = props.onCrea || vi.fn(async () => undefined);
  const onTanca = vi.fn();
  render(<DialegNovaOrganitzacio obert onTanca={onTanca} onCrea={onCrea} {...props} />);
  return { onCrea, onTanca };
};
const escriu = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
const crea = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Crear' })); });

test('l’identificador es deriva del nom i «Crear» envia una empresa', async () => {
  const { onCrea } = obri();
  escriu(/^Nom/, 'Forn Ca l’Àngela');
  expect(screen.getByLabelText('Identificador').value).toBe('forn-ca-l-angela');
  expect(screen.getByText(/Adreça pública: \/empresa\/forn-ca-l-angela/)).toBeTruthy();
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Forn Ca l’Àngela', slug: 'forn-ca-l-angela', kind: 'company' });
});

test('sense empreses que mane, no s’oferix «Grup» i s’explica per què', () => {
  obri();
  expect(screen.queryByRole('radio', { name: /Grup/ })).toBeNull();
  expect(screen.getByText('Per a crear un grup, primer has d’administrar una empresa.')).toBeTruthy();
});

test('un grup sense empresa mare no s’envia', async () => {
  const { onCrea } = obri({ empresesMare: [{ valor: 'E1', etiqueta: 'Forn' }] });
  escriu(/^Nom/, 'Colla de dolçainers');
  fireEvent.click(screen.getByRole('radio', { name: /Grup/ }));
  await crea();
  expect(onCrea).not.toHaveBeenCalled();
  expect(screen.getByText('Tria l’empresa de la qual penja el grup.')).toBeTruthy();
});

test('un grup amb mare envia parentOrganizationId', async () => {
  const { onCrea } = obri({ empresesMare: [{ valor: 'E1', etiqueta: 'Forn' }] });
  escriu(/^Nom/, 'Colla');
  fireEvent.click(screen.getByRole('radio', { name: /Grup/ }));
  fireEvent.change(screen.getByLabelText(/Empresa mare/), { target: { value: 'E1' } });
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Colla', slug: 'colla', kind: 'group', parentOrganizationId: 'E1' });
});

test('un nom massa curt es marca al camp i no s’envia', async () => {
  const { onCrea } = obri();
  escriu(/^Nom/, 'F');
  await crea();
  expect(onCrea).not.toHaveBeenCalled();
  expect(screen.getByText('El nom ha de tindre entre 2 i 120 caràcters.')).toBeTruthy();
});

test('l’identificador repetit que torna el servidor apareix al camp «Identificador»', async () => {
  const onCrea = vi.fn(async () => {
    throw new Error('Supabase 409: {"code":"23505","message":"L’identificador ja pertany a una altra organització."}');
  });
  obri({ onCrea });
  escriu(/^Nom/, 'Forn');
  await crea();
  const camp = screen.getByLabelText('Identificador');
  const error = screen.getByText('L’identificador ja pertany a una altra organització.');
  expect(camp.getAttribute('aria-describedby')).toContain(error.closest('p').id);
  expect(camp.getAttribute('aria-invalid')).toBe('true');
});

test('un altre error del servidor es mostra damunt del formulari', async () => {
  obri({ onCrea: vi.fn(async () => { throw new Error('Sense xarxa'); }) });
  escriu(/^Nom/, 'Forn');
  await crea();
  expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
});

test('l’identificador editat a mà es normalitza', async () => {
  const { onCrea } = obri();
  escriu(/^Nom/, 'Forn');
  escriu('Identificador', 'El Forn Vell');
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Forn', slug: 'el-forn-vell', kind: 'company' });
});

test('Cancel·lar tanca amb el motiu «boto»', () => {
  const { onTanca } = obri();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·lar' }));
  expect(onTanca).toHaveBeenCalledWith('boto');
});
