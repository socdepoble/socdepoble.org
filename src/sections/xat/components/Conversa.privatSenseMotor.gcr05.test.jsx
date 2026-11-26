/* GCR-05 / SV-04 (v1.2.26, Lot C1-0a) · «Respon en privat» sense motor (sense onObriDirecteAmb)
   només porta a la conversa directa amb ?amb=. El text del missatge citat (abans, fins a 140
   caràcters a ?context=) mai no arriba a la URL, que queda a l'historial i a la barra d'adreces.
   Amb motor, el contracte continua: el motor rep el missatge i { cita: true }. */
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';

const t = (_, alternativa) => alternativa;
const FIL = { id: 'f-gcr05', tipus: 'grup', name: 'Comissió', potEscriure: true, llegitFinsSeq: 100 };
const SECRET = 'El codi de la porta del magatzem és 4821 i la clau està davall del test de la finestra';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function pinta(extra = {}) {
  const rutes = [];
  render(
    <MemoryRouter rutaInicial="/xat/f-gcr05" onCanvi={(r) => rutes.push(r)}>
      <AppGridContext.Provider value={{ mida: 'ample' }}>
        <Conversa
          fil={FIL}
          messages={[{
            id: 'm1', seq: 1, sender: 'other', author: 'Pep', usuariId: 'pep',
            text: SECRET, creatAl: new Date().toISOString(), estatEnviament: 'enviat'
          }]}
          onSendMessage={vi.fn().mockResolvedValue(undefined)}
          onBack={vi.fn()} onEnviaAlBloc={vi.fn()} onCopia={vi.fn()}
          hiHaMes={false} carregantMes={false} onCarregaMes={vi.fn()}
          onReintenta={vi.fn()} onDescarta={vi.fn()} onMarcaVist={vi.fn()}
          locale="ca-ES" t={t}
          {...extra}
        />
      </AppGridContext.Provider>
    </MemoryRouter>
  );
  const item = document.querySelector('[data-missatge="m1"]');
  act(() => { fireEvent.click(within(item).getByRole('button', { name: 'Opcions del missatge' })); });
  act(() => { fireEvent.click(within(within(item).getByRole('menu')).getByRole('menuitem', { name: 'Respon en privat' })); });
  return rutes;
}

describe('GCR-05 · «Respon en privat» sense motor', () => {
  test('navega a /xat?amb=<uid> i cap ruta no porta context ni cap tros del text', () => {
    const rutes = pinta();
    expect(rutes.at(-1)).toBe('/xat?amb=pep');
    for (const r of rutes) {
      const consulta = new URLSearchParams(r.split('?')[1] || '');
      expect(consulta.has('context')).toBe(false);
      expect(decodeURIComponent(r)).not.toMatch(/magatzem|4821|finestra/);
    }
  });

  test('amb motor, el motor rep el missatge amb { cita: true } i la URL no canvia', () => {
    const onObriDirecteAmb = vi.fn();
    const rutes = pinta({ onObriDirecteAmb });
    expect(onObriDirecteAmb).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1', usuariId: 'pep' }), { cita: true });
    expect(rutes.every((r) => r === '/xat/f-gcr05')).toBe(true);
  });
});
