import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const m = vi.hoisted(() => ({ hook: vi.fn(), desa: vi.fn(), api: null }));
vi.mock('../../hooks/useProjeccionsCataleg.js', () => ({ useProjeccionsCataleg: value => { m.hook(value); return m.api; } }));
import ProveidorProjeccionsCataleg from './ProveidorProjeccionsCataleg.jsx';
import { useProjeccionsCatalegContext } from '../../components/universal/workspace/ProjeccionsCatalegContext.js';
function Cos() {
  const api = useProjeccionsCatalegContext();
  return <><p>{api.estat}</p><button disabled={!api.autoritzat} onClick={() => api.desa('font', ['mur'])}>Desa</button></>;
}
beforeEach(() => { vi.clearAllMocks(); m.api = { estat: 'confirmat', autoritzat: true, desa: m.desa }; });
afterEach(cleanup);
test('el cos del nucli sense proveïdor és de només lectura i no carrega cap servei autenticat', () => {
  render(<Cos />); expect(screen.getByText('inactiu')).toBeTruthy(); expect(screen.getByRole('button').disabled).toBe(true); expect(m.hook).not.toHaveBeenCalled();
});
test('la ruta injecta el port autenticat i el cos només consumix el context fulla', () => {
  render(<ProveidorProjeccionsCataleg><Cos /></ProveidorProjeccionsCataleg>);
  expect(m.hook).toHaveBeenCalledWith({ enabled: true }); fireEvent.click(screen.getByRole('button'));
  expect(m.desa).toHaveBeenCalledWith('font', ['mur']); expect(screen.getByText('confirmat')).toBeTruthy();
});
test('la ruta pot desactivar explícitament el servei mantenint la injecció estable', () => {
  render(<ProveidorProjeccionsCataleg enabled={false}><Cos /></ProveidorProjeccionsCataleg>);
  expect(m.hook).toHaveBeenCalledWith({ enabled: false });
});
