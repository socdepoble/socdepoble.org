/* Onada 3 (captura 19.12.49) · El diàleg «Nova conversa»: el cercador amb el
   focus, «Nou grup» i «Nova comunitat» amb el panell honest, els contactes
   freqüents, un mateix amb «(Tu)» i el padró per lletres, tot filtrat amb el
   plegat de /cerca. jsdom no té showModal: el Dialeg hi posa `open`. */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import DialegNovaConversa from './DialegNovaConversa.jsx';

const t = (_, alternativa) => alternativa;
const PADRO = [
  { usuari_id: 'u-jose', nom: 'José Martí', tipus: 'persona', fil_id: null },
  { usuari_id: 'u-angels', nom: 'Àngels Puig', tipus: 'persona', fil_id: null },
  { usuari_id: 'u-forn', nom: 'Forn de la Torre', tipus: 'entitat', fil_id: null },
  { usuari_id: 'iaia', nom: 'IAIA MarIA', tipus: 'ia', fil_id: 'f-iaia' },
  { usuari_id: 'jo', nom: 'Javi', tipus: 'persona', fil_id: null },
  { usuari_id: 'sdp', nom: 'Sóc de Poble', tipus: 'entitat', fil_id: null }
];

let props;
beforeEach(() => {
  props = {
    t,
    cercaMembres: vi.fn(async (terme) => (terme ? PADRO.filter((m) => m.nom.toLowerCase().includes(terme)) : PADRO)),
    contactesFrequents: [{ usuari_id: 'u-toni', nom: 'Toni Pastor', tipus: 'persona', avatar_url: null, fil_id: 'f-toni' }],
    joId: 'jo',
    joNom: 'Javi Llinares',
    /* R21 (carril f2) · El backend obri el xat propi (XatContext): la fila
       «(Tu)» va dalt. Els altres estats tenen la seua prova, davall. */
    xatPropi: 'disponible',
    filPersonal: null,
    onTriaMembre: vi.fn(),
    onObriFil: vi.fn(),
    onVes: vi.fn()
  };
});
afterEach(cleanup);

function Arnes(extra) {
  const [obert, setObert] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setObert(true)}>Obri</button>
      <DialegNovaConversa {...props} {...extra} obert={obert} onTanca={() => setObert(false)} />
    </>
  );
}

async function obert(extra = {}) {
  render(<Arnes {...extra} />);
  const dialeg = screen.getByRole('dialog', { name: 'Nova conversa' });
  await waitFor(() => expect(within(dialeg).getByRole('heading', { name: 'I' })).toBeTruthy());
  return dialeg;
}

test('el focus va al cercador i el diàleg té les seccions de la referència en ordre', async () => {
  const dialeg = await obert();
  const camp = within(dialeg).getByRole('searchbox', { name: "Nom del contacte" });
  expect(document.activeElement).toBe(camp);
  expect(props.cercaMembres).toHaveBeenCalledWith(null);
  expect(within(dialeg).getAllByRole('heading').map((h) => h.textContent)).toEqual([
    'Nova conversa', 'Contactes a Sóc de Poble', 'I', 'S'
  ]);
  expect(within(dialeg).getByRole('button', { name: 'Nou grup' })).toBeTruthy();
  expect(within(dialeg).getByRole('button', { name: 'Nova comunitat' })).toBeTruthy();
  const botoPropi = within(dialeg).getByRole('button', { name: /Javi Llinares \(Tu\)/ });
  expect(botoPropi.textContent).toContain("Envia't missatges a tu mateix");
  expect(within(dialeg).queryByRole('heading', { name: 'J' })).toBeNull();
  expect(within(dialeg).queryByRole('button', { name: /Toni Pastor/ })).toBeNull();
  expect(within(dialeg).queryByRole('button', { name: /José Martí/ })).toBeNull();
  expect(within(dialeg).getByRole('button', { name: /Sóc de Poble/ }).textContent).toContain('Entitat o empresa');
  expect(within(dialeg).getByRole('button', { name: /IAIA MarIA/ }).textContent).toContain('Intel·ligència artificial');
  /* R21.4-UI · Ordre canònic dins de «Contactes a Sóc de Poble»: <Nom> (Tu) dalt de tot. */
  const grupContactes = within(dialeg).getByRole('heading', { name: 'Contactes a Sóc de Poble' }).parentElement;
  expect(within(grupContactes).getAllByRole('button')[0]).toBe(botoPropi);
});

test('el cercador filtra totes les seccions amb el plegat d’accents i el ⊗ l’esborra', async () => {
  const dialeg = await obert();
  const camp = within(dialeg).getByRole('searchbox');
  fireEvent.change(camp, { target: { value: 'jose' } });
  expect(within(dialeg).getByRole('button', { name: /José Martí/ })).toBeTruthy();
  expect(within(dialeg).queryByRole('button', { name: /Àngels Puig/ })).toBeNull();
  expect(within(dialeg).queryByRole('heading', { name: 'Contactes freqüents' })).toBeNull();
  expect(within(dialeg).queryByRole('button', { name: 'Nou grup' })).toBeNull();
  /* També es pregunta al servidor amb el terme, per a pobles grans. */
  await waitFor(() => expect(props.cercaMembres).toHaveBeenCalledWith('jose'));

  fireEvent.change(camp, { target: { value: 'zzz' } });
  await waitFor(() => expect(within(dialeg).getByText('Cap contacte amb eixe nom.')).toBeTruthy());

  fireEvent.click(within(dialeg).getByRole('button', { name: 'Esborra la cerca' }));
  expect(camp.value).toBe('');
  expect(document.activeElement).toBe(camp);
  expect(within(dialeg).queryByRole('button', { name: /Àngels Puig/ })).toBeNull();

  /* Escape amb text esborra i no tanca el diàleg. */
  fireEvent.change(camp, { target: { value: 'ang' } });
  fireEvent.keyDown(camp, { key: 'Escape' });
  expect(camp.value).toBe('');
  expect(screen.getByRole('dialog', { name: 'Nova conversa' })).toBeTruthy();
});

test('triar un contacte crida onTriaMembre; els freqüents també', async () => {
  const dialeg = await obert();
  const camp = within(dialeg).getByRole('searchbox');
  fireEvent.change(camp, { target: { value: 'angels' } });
  fireEvent.click(within(dialeg).getByRole('button', { name: /Àngels Puig/ }));
  expect(props.onTriaMembre).toHaveBeenCalledWith(PADRO[1]);
  fireEvent.change(camp, { target: { value: 'toni' } });
  fireEvent.click(within(dialeg).getByRole('button', { name: /Toni Pastor/ }));
  expect(props.onTriaMembre).toHaveBeenLastCalledWith(props.contactesFrequents[0]);
});

test('els contactes d’ajuda absents no inventen un destinatari operatiu', async () => {
  props.cercaMembres = vi.fn(async () => []);
  const dialeg = await obert({ senseSessio: true });
  for (const nom of ['Sóc de Poble', 'IAIA MarIA']) {
    await waitFor(() => expect(within(dialeg).getByRole('button', { name: new RegExp(nom) }).disabled).toBe(true));
  }
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Entrar' }));
  /* T4: la forma única de l'entrada (rutaDEntrada); sense `tornar`, només el mode. */
  expect(props.onVes).toHaveBeenCalledWith('/registre?mode=entrar');
  expect(props.onTriaMembre).not.toHaveBeenCalled();
});

/* T4 · «Entrar» porta a l'entrada amb la ruta del Xat on tornar; una tornada
   que no és interna es descarta (tornadaSegura). */
test('T4 · sense sessió, «Entrar» porta a /registre?mode=entrar&tornar=<ruta del Xat>', async () => {
  props.cercaMembres = vi.fn(async () => []);
  const dialeg = await obert({ senseSessio: true, tornar: '/xat?context=hola' });
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Entrar' }));
  expect(props.onVes).toHaveBeenLastCalledWith(`/registre?${new URLSearchParams({ mode: 'entrar', tornar: '/xat?context=hola' })}`);
  cleanup();

  props.onVes = vi.fn();
  const altre = await obert({ senseSessio: true, tornar: 'https://dolent.test' });
  fireEvent.click(within(altre).getByRole('button', { name: 'Entrar' }));
  expect(props.onVes).toHaveBeenLastCalledWith('/registre?mode=entrar');
});

test('«Nou grup» i «Nova comunitat» obrin dins del diàleg el panell honest, amb el camí al Mur i a Pobles', async () => {
  const dialeg = await obert();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Nova comunitat' }));
  expect(within(dialeg).getByText(/naixen d'una Pàgina Universal/)).toBeTruthy();
  expect(within(dialeg).queryByRole('searchbox')).toBeNull();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Anar al Mur' }));
  expect(props.onVes).toHaveBeenCalledWith('/mur');
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Anar a Pobles' }));
  expect(props.onVes).toHaveBeenCalledWith('/pobles');
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Tornar' }));
  const camp = within(dialeg).getByRole('searchbox');
  expect(document.activeElement).toBe(camp);
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Nou grup' }));
  expect(within(dialeg).getByText(/naixen d'una Pàgina Universal/)).toBeTruthy();
});

test('R21.4-UI · escriure’s a un mateix: sense fil personal crida onTriaMembre amb joId; amb filPersonal l’obri; sense sessió no s’oferix', async () => {
  let dialeg = await obert();
  fireEvent.click(within(dialeg).getByRole('button', { name: /Javi Llinares \(Tu\)/ }));
  expect(within(dialeg).queryByText(/Encara no pots escriure't a tu mateix/)).toBeNull();
  expect(props.onTriaMembre).toHaveBeenCalledWith({
    usuari_id: 'jo',
    nom: 'Javi Llinares',
    tipus: 'persona',
    avatar_url: null,
    fil_id: null
  });
  expect(props.onObriFil).not.toHaveBeenCalled();
  cleanup();

  props.onTriaMembre = vi.fn();
  props.onObriFil = vi.fn();
  dialeg = await obert({ filPersonal: 'f-jo' });
  fireEvent.change(within(dialeg).getByRole('searchbox'), { target: { value: 'javi' } });
  fireEvent.click(within(dialeg).getByRole('button', { name: /Javi Llinares \(Tu\)/ }));
  expect(props.onObriFil).toHaveBeenCalledWith('f-jo');
  expect(props.onTriaMembre).not.toHaveBeenCalled();
  cleanup();

  props.cercaMembres = vi.fn(async () => []);
  dialeg = await obert({ senseSessio: true });
  expect(within(dialeg).queryByRole('button', { name: /\(Tu\)/ })).toBeNull();
});

/* R21 (carril f2; Gauntlet R21 regressio_ui_xat-02/-05, honestedat_textos-04) ·
   En remot, el xat propi depén de la migració 2611121630_xat_propi. Sense que
   el backend l'haja acreditat, «(Tu)» no s'oferix dalt: només amb una cerca,
   i prémer-la acaba en l'avís honest (role="status", lligat a la fila), mai
   en un error mut ni en el text de SDP-XAT-002. */
const AVIS_PERSONAL = "Encara no pots escriure't a tu mateix: este poble no obri el xat personal.";

test('R21 f2 · «per confirmar»: cap «(Tu)» dalt; amb cerca, prémer-la pregunta (onTriaMembre) i el «no» del servidor pinta l’avís honest', async () => {
  const vista = render(<Arnes xatPropi="per-confirmar" />);
  let dialeg = screen.getByRole('dialog', { name: 'Nova conversa' });
  await waitFor(() => expect(within(dialeg).getByRole('heading', { name: 'I' })).toBeTruthy());
  expect(within(dialeg).queryByRole('button', { name: /\(Tu\)/ })).toBeNull();
  fireEvent.change(within(dialeg).getByRole('searchbox'), { target: { value: 'javi' } });
  const fila = within(dialeg).getByRole('button', { name: /Javi Llinares \(Tu\)/ });
  fireEvent.click(fila);
  expect(props.onTriaMembre).toHaveBeenCalledWith(expect.objectContaining({ usuari_id: 'jo', fil_id: null }));
  expect(within(dialeg).queryByText(AVIS_PERSONAL)).toBeNull();
  /* XatContext: SDP-XAT-002 → xatPropi 'no'. */
  vista.rerender(<Arnes xatPropi="no" />);
  dialeg = screen.getByRole('dialog', { name: 'Nova conversa' });
  const avis = within(dialeg).getByText(AVIS_PERSONAL);
  expect(avis.getAttribute('role')).toBe('status');
  expect(within(dialeg).getByRole('button', { name: /Javi Llinares \(Tu\)/ }).getAttribute('aria-describedby')).toBe(avis.id);
  expect(props.onTriaMembre).toHaveBeenCalledTimes(1);
});

test.each([
  ['no', { xatPropi: 'no' }],
  ['sense la prop (un consumidor d’abans)', { xatPropi: undefined }]
])('R21 f2 · «%s»: cap «(Tu)» dalt; amb cerca, prémer-la només avisa i no crida cap conversa', async (_, extra) => {
  const dialeg = await obert(extra);
  expect(within(dialeg).queryByRole('button', { name: /\(Tu\)/ })).toBeNull();
  fireEvent.change(within(dialeg).getByRole('searchbox'), { target: { value: 'javi' } });
  fireEvent.click(within(dialeg).getByRole('button', { name: /Javi Llinares \(Tu\)/ }));
  expect(within(dialeg).getByText(AVIS_PERSONAL).getAttribute('role')).toBe('status');
  expect(props.onTriaMembre).not.toHaveBeenCalled();
  expect(props.onObriFil).not.toHaveBeenCalled();
});

test('R21 f2 · amb un fil propi ja a la llista, la fila va dalt i l’obri; sense xat propi possible (null), cap fila', async () => {
  let dialeg = await obert({ xatPropi: 'no', filPersonal: 'f-jo' });
  fireEvent.click(within(dialeg).getByRole('button', { name: /Javi Llinares \(Tu\)/ }));
  expect(props.onObriFil).toHaveBeenCalledWith('f-jo');
  expect(within(dialeg).queryByText(AVIS_PERSONAL)).toBeNull();
  cleanup();

  dialeg = await obert({ xatPropi: null });
  fireEvent.change(within(dialeg).getByRole('searchbox'), { target: { value: 'javi' } });
  await waitFor(() => expect(within(dialeg).getByRole('status').textContent).toBe('Cap contacte amb eixe nom.'));
  expect(within(dialeg).queryByRole('button', { name: /\(Tu\)/ })).toBeNull();
});

/* El padró local en porta com a molt 100: mentre el servidor no ha respost
   per al terme escrit, es diu que carrega i mai «Cap contacte» (fals negatiu). */
test('amb un terme que el padró local no troba, carrega fins que respon el servidor', async () => {
  let resol;
  props.cercaMembres = vi.fn((terme) => (terme
    ? new Promise((r) => { resol = r; })
    : Promise.resolve(PADRO)));
  const dialeg = await obert();
  fireEvent.change(within(dialeg).getByRole('searchbox'), { target: { value: 'zor' } });
  expect(within(dialeg).queryByText('Cap contacte amb eixe nom.')).toBeNull();
  expect(within(dialeg).getByText('Carregant la gent del teu poble…')).toBeTruthy();
  await waitFor(() => expect(props.cercaMembres).toHaveBeenCalledWith('zor'));
  expect(within(dialeg).queryByText('Cap contacte amb eixe nom.')).toBeNull();

  await act(async () => resol([{ usuari_id: 'u-zoraida', nom: 'Zoraida Ferrer', tipus: 'persona', fil_id: null }]));
  expect(within(dialeg).getByRole('button', { name: /Zoraida Ferrer/ })).toBeTruthy();
  expect(within(dialeg).queryByText('Carregant la gent del teu poble…')).toBeNull();
});

/* L'error d'obrir la conversa el pinta el diàleg: fora, un toast quedaria
   davall del <dialog> modal i inert. */
test('l’error d’obrir la conversa es pinta dins del diàleg com a alerta', async () => {
  const dialeg = await obert({ errorObrir: 'Sense xarxa' });
  expect(within(dialeg).getByRole('alert').textContent).toBe('Sense xarxa');
});

test('un padró que falla ho diu; tancar el diàleg en desmunta el contingut', async () => {
  props.cercaMembres = vi.fn(async () => { throw new Error('Sense xarxa'); });
  render(<Arnes />);
  const dialeg = screen.getByRole('dialog', { name: 'Nova conversa' });
  await waitFor(() => expect(within(dialeg).getByRole('alert').textContent).toContain('Sense xarxa'));
  act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('searchbox')).toBeNull();
});
