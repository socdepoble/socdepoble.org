import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T43 (ordre del Mestre, 260928) · la identitat de la barra negra amb el
   botó i el calaix de veres; la sessió, la identitat i els mitjans simulats. */
const m = vi.hoisted(() => ({ user: null, identitat: null, senseSessio: false, senseIdentitat: false }));
/* Prompt 261014_0400 (ordre del Mestre) · La simulació calca el contracte de
   veres dels dos mòduls: sense proveïdor, l'estricte llança amb el seu missatge
   (SessionContext.jsx, IdentitatContext.jsx) i l'opcional torna null. */
vi.mock('../../../app/contexts/SessionContext', () => ({
  useSession: () => {
    if (m.senseSessio) throw new Error('useSession ha de ser usat dins de SessionProvider');
    return { currentUser: m.user };
  },
  useSessioOpcional: () => (m.senseSessio ? null : { currentUser: m.user })
}));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => {
    if (m.senseIdentitat) throw new Error('useIdentitat ha de ser usat dins de IdentitatProvider');
    return m.identitat;
  },
  useIdentitatOpcional: () => (m.senseIdentitat ? null : m.identitat)
}));
/* Com la capacitat 'mitjans': un sdp-media:// es resol a una URL servible
   (ací, del mateix origen, que l'Avatar accepta). */
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => (ref?.startsWith('sdp-media://') ? `/media/${ref.slice('sdp-media://'.length)}` : ref || '')
}));
import { RUTA_PERFIL_PROPI, useIdentitatDeLaBarra } from './useIdentitatDeLaBarra.js';
import { BotoIdentitatActiva, etiquetaPerfilPropi } from './BotoIdentitatActiva.jsx';
import { CalaixIdentitats } from './CalaixIdentitats.jsx';
import { BrowserRouter, MemoryRouter } from '../../../app/contexts/RouterContext';

function Barra({ onNavega }) {
  const { boto, calaix } = useIdentitatDeLaBarra({ onNavega, etiquetaEntrar: 'Entrar' });
  return (
    <>
      <header className="bar-black"><div className="right-icons"><BotoIdentitatActiva {...boto} /></div></header>
      {calaix ? <CalaixIdentitats {...calaix} /> : null}
    </>
  );
}

const PERSONA = { tipus: 'persona', id: 'u-1', nom: 'Pepa Soler', avatar: 'https://lh3.googleusercontent.com/a/pepa.png', rol: 'persona' };
const FORN = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: null, rol: 'owner' };

afterEach(cleanup);
beforeEach(() => {
  m.senseSessio = false;
  m.senseIdentitat = false;
  m.user = { id: 'u-1', user_metadata: { avatar_url: 'https://lh3.googleusercontent.com/a/pepa.png' } };
  m.identitat = {
    actor: PERSONA,
    identitats: [{ ...PERSONA, activa: true }, { ...FORN, activa: false }],
    setActor: vi.fn(() => true)
  };
});

test('una entitat sense logo mostra les SEUES inicials, mai la foto de la persona', () => {
  m.identitat.actor = FORN;
  render(<Barra onNavega={vi.fn()} />);
  const boto = screen.getByRole('button', { name: 'Identitat activa: Forn de la Torre (organització). Canviar identitat' });
  expect(boto.querySelector('img')).toBeNull();
  expect(boto.querySelector('.sdp-avatar').textContent).toBe('FD');
  expect(boto.innerHTML).not.toContain('pepa.png');
});

test('el logo desat com a sdp-media:// es resol abans de pintar-lo', () => {
  m.identitat.actor = { ...FORN, avatar: 'sdp-media://mitjans/forn.webp' };
  render(<Barra onNavega={vi.fn()} />);
  const img = screen.getByRole('button', { name: /Forn de la Torre/ }).querySelector('img');
  expect(img.getAttribute('src')).toBe('/media/mitjans/forn.webp');
});

test('el calaix és germà del header, sense estils en línia; triar crida setActor i el tanca', async () => {
  const { container } = render(<Barra onNavega={vi.fn()} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' })); });
  const dialeg = screen.getByRole('dialog', { name: 'Amb qui actues?' });
  expect(dialeg.closest('header.bar-black')).toBeNull();
  expect(container.querySelector('header.bar-black').contains(dialeg)).toBe(false);
  expect(dialeg.querySelectorAll('[style]')).toHaveLength(0);
  expect(screen.getByRole('button', { name: /Identitat activa: Pepa Soler/ }).getAttribute('aria-expanded')).toBe('true');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Forn de la Torre/ })); });
  expect(m.identitat.setActor).toHaveBeenCalledWith('entitat', 'o-1');
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* T4 (ordre del Mestre, 260930) · Sense sessió el botó porta a /registre en
   mode Entrar i amb la ruta actual com a ?tornar (rutaDEntrada). Sense router
   llegible, la ruta és la de la barra d'adreces: '/' a jsdom. */
test('les accions del calaix tanquen i naveguen; sense sessió el botó porta a /registre', async () => {
  const onNavega = vi.fn();
  const vista = render(<Barra onNavega={onNavega} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Identitat activa/ })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connectar-me a una organització' })); });
  // Poliment T43 · les organitzacions reals (padró), no el catàleg d'agents de /perfil.
  expect(onNavega).toHaveBeenLastCalledWith('/cerca?tipus=entitats');
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Identitat activa/ })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'La meua fitxa i ajustos' })); });
  expect(onNavega).toHaveBeenLastCalledWith('/el-meu-perfil');
  vista.unmount();
  m.user = null;
  m.identitat = { actor: { tipus: 'persona', id: null, nom: null, avatar: null, rol: 'convidat' }, identitats: [], setActor: vi.fn(() => false) };
  const { container } = render(<Barra onNavega={onNavega} />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(onNavega).toHaveBeenLastCalledWith('/registre?mode=entrar&tornar=%2F');
  expect(container.ownerDocument.querySelector('dialog')).toBeNull();
});

/* Acta 261004_1027 §3 (beta testers) · Una persona sense organitzacions no
   té res a triar: el seu avatar gran porta directament al perfil propi. */
test('acta 261004_1027 · persona sola: l’avatar porta a /el-meu-perfil i no obri cap calaix', async () => {
  m.identitat.identitats = [{ ...PERSONA, activa: true }];
  const onNavega = vi.fn();
  render(<Barra onNavega={onNavega} />);
  const boto = screen.getByRole('button', { name: 'El teu perfil: Pepa Soler' });
  expect(RUTA_PERFIL_PROPI).toBe('/el-meu-perfil');
  expect(boto.hasAttribute('aria-haspopup')).toBe(false);
  expect(boto.querySelector('.sdp-avatar--lg img').getAttribute('src')).toBe('https://lh3.googleusercontent.com/a/pepa.png');
  await act(async () => { fireEvent.click(boto); });
  expect(onNavega).toHaveBeenCalledTimes(1);
  expect(onNavega).toHaveBeenCalledWith('/el-meu-perfil');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('acta 261004_1027 · quan arriba una organització on mana, l’avatar torna a obrir el calaix', async () => {
  m.identitat.identitats = [{ ...PERSONA, activa: true }];
  const onNavega = vi.fn();
  const { rerender } = render(<Barra onNavega={onNavega} />);
  expect(screen.getByRole('button', { name: 'El teu perfil: Pepa Soler' })).toBeTruthy();
  m.identitat = { ...m.identitat, identitats: [{ ...PERSONA, activa: true }, { ...FORN, activa: false }] };
  rerender(<Barra onNavega={onNavega} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' })); });
  expect(screen.getByRole('dialog', { name: 'Amb qui actues?' })).toBeTruthy();
  expect(onNavega).not.toHaveBeenCalled();
});

const senseSessio = () => {
  m.user = null;
  m.identitat = { actor: { tipus: 'persona', id: null, nom: null, avatar: null, rol: 'convidat' }, identitats: [], setActor: vi.fn(() => false) };
};

test('T4 · sense sessió, en MEMÒRIA: /registre?mode=entrar amb la ruta de l’app (amb consulta) com a ?tornar', () => {
  senseSessio();
  window.history.replaceState(null, '', '/pagina-amfitrio?x=1');
  try {
    const onNavega = vi.fn();
    render(<MemoryRouter rutaInicial="/mur?item=3"><Barra onNavega={onNavega} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onNavega).toHaveBeenCalledTimes(1);
    expect(onNavega).toHaveBeenCalledWith('/registre?mode=entrar&tornar=%2Fmur%3Fitem%3D3');
  } finally { window.history.replaceState(null, '', '/'); }
});

test('T4 · sense sessió, al NAVEGADOR: la ruta de la barra d’adreces en el moment del clic', () => {
  senseSessio();
  window.history.replaceState(null, '', '/mercat?item=pa');
  try {
    const onNavega = vi.fn();
    render(<BrowserRouter><Barra onNavega={onNavega} /></BrowserRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(onNavega).toHaveBeenCalledWith('/registre?mode=entrar&tornar=%2Fmercat%3Fitem%3Dpa');
  } finally { window.history.replaceState(null, '', '/'); }
});

/* Correcció de la revisió T1–T4 (260930) · Un /connectar amb la consulta de més
   de 300 caràcters (Web Share Target): la tornada és sencera, no el camí sol. */
const CONSULTA_LLARGA = new URLSearchParams({
  url: 'https://www.diari.example/comarques/2026/09/30/fira-tardor-la-torre-123456.html',
  title: 'Fira de la Tardor a la Torre de les Maçanes: parades, música i productes de la terra',
  text: 'Fira de la Tardor https://www.diari.example/comarques/2026/09/30/fira-tardor-la-torre-123456.html'
}).toString();
const tornarDe = (ruta) => new URL(ruta, 'https://poble.test').searchParams.get('tornar');

test('T4 · MEMÒRIA: un /connectar de més de 300 caràcters torna sencer, amb la seua consulta', () => {
  senseSessio();
  const llarga = `/connectar?${CONSULTA_LLARGA}`;
  expect(llarga.length).toBeGreaterThan(300);
  const onNavega = vi.fn();
  render(<MemoryRouter rutaInicial={llarga}><Barra onNavega={onNavega} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(onNavega).toHaveBeenCalledTimes(1);
  expect(tornarDe(onNavega.mock.calls[0][0])).toBe(llarga);
});

test('T4 · NAVEGADOR: un /connectar de més de 300 caràcters torna sencer', () => {
  senseSessio();
  window.history.replaceState(null, '', `/connectar?${CONSULTA_LLARGA}`);
  try {
    const onNavega = vi.fn();
    render(<BrowserRouter><Barra onNavega={onNavega} /></BrowserRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(tornarDe(onNavega.mock.calls[0][0])).toBe(`/connectar?${CONSULTA_LLARGA}`);
  } finally { window.history.replaceState(null, '', '/'); }
});

test('T4 · si la ruta no hi cap ni en el topall de la tornada, no hi ha ?tornar (mai el camí sol, que perd l’element)', () => {
  senseSessio();
  const onNavega = vi.fn();
  render(<MemoryRouter rutaInicial={`/connectar?text=${'a'.repeat(2100)}`}><Barra onNavega={onNavega} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(onNavega).toHaveBeenCalledWith('/registre?mode=entrar');
});

test.each(['/registre', '/registre?mode=crear&tornar=/mur'])('T4 · a %s el botó no s’encadena amb l’entrada', (ruta) => {
  senseSessio();
  const onNavega = vi.fn();
  render(<MemoryRouter rutaInicial={ruta}><Barra onNavega={onNavega} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(onNavega).not.toHaveBeenCalled();
});

/* Prompt 261014_0400 (ordre del Mestre) · Guarda de la barra negra. Una peça
   muntada sola (una prova, o el HMR de desenvolupament que deixa la barra
   lligada a un context vell) no té SessionProvider ni IdentitatProvider:
   és el Foraster de sempre, «Entrar», i no llança. */
test('sense SessionProvider ni IdentitatProvider: «Entrar», cap calaix, cap error, i el clic porta a /registre', () => {
  m.senseSessio = true;
  m.senseIdentitat = true;
  const onNavega = vi.fn();
  expect(() => render(<Barra onNavega={onNavega} />)).not.toThrow();
  const boto = screen.getByRole('button', { name: 'Entrar' });
  expect(document.querySelector('dialog')).toBeNull();
  fireEvent.click(boto);
  expect(onNavega).toHaveBeenCalledTimes(1);
  expect(onNavega).toHaveBeenCalledWith('/registre?mode=entrar&tornar=%2F');
});

/* Prompt 261014_0400 (ordre del Mestre) · El cas de transició del HMR: la
   sessió hi és, però l'IdentitatContext de la barra ja no té proveïdor. No
   llança i el nom és honest: cap identitat carregada, cap foto de ningú. No és
   «sense sessió»: el calaix es munta, tancat, i el clic no l'obri. */
test('amb sessió però sense IdentitatProvider no llança i el botó porta un nom honest', async () => {
  m.senseIdentitat = true;
  const onNavega = vi.fn();
  expect(() => render(<Barra onNavega={onNavega} />)).not.toThrow();
  const boto = screen.getByRole('button', { name: etiquetaPerfilPropi('El meu compte') });
  expect(boto.querySelector('img')).toBeNull();
  expect(document.querySelector('dialog')?.open).toBe(false);
  await act(async () => { fireEvent.click(boto); });
  expect(onNavega).toHaveBeenCalledWith(RUTA_PERFIL_PROPI);
  expect(screen.queryByRole('dialog')).toBeNull();
});
