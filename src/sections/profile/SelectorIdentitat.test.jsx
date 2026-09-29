import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* El selector d'identitat. Des de T43 (ordre del Mestre, 260928) ja no viu al
   Perfil (l'antic SelectorIdentitat, un desplegable de la barra taronja): és
   el botó de la barra negra i el calaix «Amb qui actues?». Es munten les tres
   peces de veres com les munta la TopBar d'App.jsx; la sessió, la identitat i
   els mitjans simulats. Els comportaments són els que ja es provaven ací. */
const m = vi.hoisted(() => ({ user: null, valor: null, setActor: null }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../app/contexts/IdentitatContext', () => ({ useIdentitat: () => m.valor }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: () => '' }));
import { useIdentitatDeLaBarra } from '../../components/universal/identitat/useIdentitatDeLaBarra.js';
import { BotoIdentitatActiva } from '../../components/universal/identitat/BotoIdentitatActiva.jsx';
import { CalaixIdentitats } from '../../components/universal/identitat/CalaixIdentitats.jsx';

function Barra() {
  const { boto, calaix } = useIdentitatDeLaBarra({ onNavega: vi.fn(), etiquetaEntrar: 'Entrar' });
  return (
    <>
      <header className="bar-black"><div className="right-icons"><BotoIdentitatActiva {...boto} /></div></header>
      {calaix ? <CalaixIdentitats {...calaix} /> : null}
    </>
  );
}

const persona = { tipus: 'persona', id: 'U', nom: 'Pep', avatar: null, rol: 'persona', activa: true };
const forn = { tipus: 'entitat', id: 'O', nom: 'Forn', avatar: null, rol: 'owner', activa: false };

beforeEach(() => {
  m.user = { id: 'U' };
  m.setActor = vi.fn(() => true);
  m.valor = { identitats: [persona, forn], actor: { tipus: 'persona', id: 'U', nom: 'Pep', avatar: null }, setActor: m.setActor };
});
afterEach(cleanup);

async function obriCalaix() {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Canviar identitat/ })); });
  return screen.getByRole('dialog', { name: 'Amb qui actues?' });
}

test('amb una sola identitat el botó continua a la barra i el calaix només la llista a ella, activa', async () => {
  m.valor = { ...m.valor, identitats: [persona] };
  render(<Barra />);
  const dialeg = await obriCalaix();
  const files = within(within(dialeg).getByRole('list', { name: 'Identitats' })).getAllByRole('button');
  expect(files).toHaveLength(1);
  expect(files[0].getAttribute('aria-current')).toBe('true');
  expect(dialeg.textContent).not.toContain('Forn');
});

test('el disparador és un sol botó, sense botons niats, i té nom accessible complet', async () => {
  const { container } = render(<Barra />);
  const disparador = screen.getByRole('button', { name: 'Identitat activa: Pep. Canviar identitat' });
  expect(disparador.tagName).toBe('BUTTON');
  expect(disparador.getAttribute('aria-haspopup')).toBe('dialog');
  expect(disparador.getAttribute('aria-expanded')).toBe('false');
  expect(disparador.querySelector('button')).toBeNull();
  await obriCalaix();
  expect(container.ownerDocument.querySelector('button button')).toBeNull();
  expect(disparador.getAttribute('aria-expanded')).toBe('true');
});

test('triar «Forn» (Propietari) crida setActor amb la identitat d’entitat i tanca el calaix', async () => {
  render(<Barra />);
  const dialeg = await obriCalaix();
  const fila = within(dialeg).getByRole('button', { name: /Forn/ });
  /* El rol ve de la font única (identitat/rols.js), no d'un mapa del Perfil. */
  expect(fila.textContent).toContain('Propietari');
  await act(async () => { fireEvent.click(fila); });
  expect(m.setActor).toHaveBeenCalledWith('entitat', 'O');
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* Que el calaix queda fora del header de la barra negra ho comprova
   src/app/App.test.jsx sobre la TopBar de veres: ací la Barra és de la prova. */
test('ja no és un desplegable de la barra taronja: és el calaix lateral dret', async () => {
  render(<Barra />);
  const dialeg = await obriCalaix();
  expect(dialeg.classList.contains('sdp-dialeg--calaix')).toBe(true);
  expect(dialeg.classList.contains('sdp-dialeg--dreta')).toBe(true);
});

test('l’opció activa ho diu també sense color (aria-current i «Activa») i triar-la torna a la persona', async () => {
  render(<Barra />);
  const dialeg = await obriCalaix();
  const activa = within(dialeg).getByRole('button', { name: /Pep/ });
  expect(activa.getAttribute('aria-current')).toBe('true');
  expect(activa.textContent).toContain('Activa');
  expect(within(dialeg).getByRole('button', { name: /Forn/ }).hasAttribute('aria-current')).toBe(false);
  await act(async () => { fireEvent.click(activa); });
  expect(m.setActor).toHaveBeenCalledWith('persona', 'U');
});
