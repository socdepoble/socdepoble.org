import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';

/* T43 (ordre del Mestre, 260928) · la identitat de la barra negra amb el
   botó i el calaix de veres; la sessió, la identitat i els mitjans simulats. */
/* Revisió del Gauntlet 261017 (ID4) · `estat` és el de useSession
   ('comprovant' | 'dins' | 'fora'); undefined, com abans d'esta prova. */
/* v1.2.23 · R2E-04 (Gauntlet R2) · `t` és el traductor de la interfície; null
   (cap UIProvider), com abans d'esta prova. */
const m = vi.hoisted(() => ({
  user: null, identitat: null, senseSessio: false, senseIdentitat: false, estat: undefined,
  logout: vi.fn(), preparaEixida: vi.fn(), t: null,
}));
vi.mock('../../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => (m.t ? { t: m.t } : null),
}));
/* Prompt 261014_0400 (ordre del Mestre) · La simulació calca el contracte de
   veres dels dos mòduls: sense proveïdor, l'estricte llança amb el seu missatge
   (SessionContext.jsx, IdentitatContext.jsx) i l'opcional torna null. */
vi.mock('../../../app/contexts/SessionContext', () => ({
  useSession: () => {
    if (m.senseSessio) throw new Error('useSession ha de ser usat dins de SessionProvider');
    return { currentUser: m.user, estat: m.estat, logout: m.logout, preparaEixida: m.preparaEixida };
  },
  useSessioOpcional: () => (m.senseSessio ? null : { currentUser: m.user, estat: m.estat, logout: m.logout, preparaEixida: m.preparaEixida })
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
  m.t = null;
  m.senseSessio = false;
  m.senseIdentitat = false;
  m.estat = undefined;
  m.logout.mockReset().mockResolvedValue(undefined);
  m.preparaEixida.mockReset().mockResolvedValue([]);
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
  const boto = screen.getByRole('button', { name: 'Identitat activa: Forn de la Torre (organització). Canviar identitat, idioma o eixir' });
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
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat, idioma o eixir' })); });
  const dialeg = screen.getByRole('dialog', { name: 'Amb qui actues?' });
  expect(dialeg.closest('header.bar-black')).toBeNull();
  expect(container.querySelector('header.bar-black').contains(dialeg)).toBe(false);
  expect(dialeg.querySelectorAll('[style]')).toHaveLength(0);
  expect(screen.getByRole('button', { name: /Identitat activa: Pepa Soler/ }).getAttribute('aria-expanded')).toBe('true');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Forn de la Torre/ })); });
  expect(m.identitat.setActor).toHaveBeenCalledWith('entitat', 'o-1');
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* v1.2.23 · R2E-04 (Gauntlet R2) · El calaix que obri la barra negra parla la
   llengua de la interfície sencer, com el que obri el peu del rail del Xat
   (ClosCaXat.jsx): el títol, la descripció, el nom de la llista, «Activa» i el
   rol de cada fila, no només «Idioma del sistema» i «Eixir». Els textos fixos
   són els de textosCalaixIdentitats.js (un tros diferit); els rols, les claus
   section.perfil.* dels diccionaris. COOP no porta cap rol conegut. */
const COOP = { tipus: 'entitat', id: 'o-2', nom: 'Cooperativa del Comtat', avatar: null };
const IDENTITATS_R2E_04 = () => [{ ...PERSONA, activa: true }, { ...FORN, activa: false }, { ...COOP, activa: false }];
const LITERALS_CA_R2E_04 = ['Amb qui actues?', 'Tria amb quina identitat', 'Pots canviar quan vullgues', 'Organització'];

test.each([
  ['en', {
    titol: 'Who are you acting as?',
    descripcio: 'Choose which identity you want to publish and edit as. You can switch whenever you like.',
    llista: 'Identities', activa: 'Active', rols: ['Person', 'Owner', 'Organisation'], idioma: 'System language', eixir: 'Sign out of Sóc de Poble',
  }],
  ['es', {
    titol: '¿Con quién actúas?',
    descripcio: 'Elige con qué identidad quieres publicar y editar. Puedes cambiar cuando quieras.',
    llista: 'Identidades', activa: 'Activa', rols: ['Persona', 'Propietario', 'Organización'], idioma: 'Idioma del sistema', eixir: 'Salir de Sóc de Poble',
  }],
  ['eu', {
    titol: 'Norekin ari zara?',
    descripcio: 'Aukeratu zein identitaterekin argitaratu eta editatu nahi duzun. Nahi duzunean alda dezakezu.',
    llista: 'Identitateak', activa: 'Aktiboa', rols: ['Pertsona', 'Jabea', 'Erakundea'], idioma: 'Sistemaren hizkuntza', eixir: 'Irten Sóc de Pobletik',
  }],
  ['gl', {
    titol: 'Con quen actúas?',
    descripcio: 'Escolle con que identidade queres publicar e editar. Podes cambiar cando queiras.',
    llista: 'Identidades', activa: 'Activa', rols: ['Persoa', 'Propietario', 'Organización'], idioma: 'Idioma do sistema', eixir: 'Saír de Sóc de Poble',
  }],
])('R2E-04 · en %s, el calaix «Amb qui actues?» de la barra negra parla tot ell la llengua de la interfície', async (codi, x) => {
  m.t = createTranslator(codi);
  m.identitat.identitats = IDENTITATS_R2E_04();
  render(<Barra onNavega={vi.fn()} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Pepa Soler/ })); });
  const dialeg = await screen.findByRole('dialog', { name: x.titol });
  expect(within(dialeg).getByText(x.descripcio)).toBeTruthy();
  const files = within(within(dialeg).getByRole('list', { name: x.llista })).getAllByRole('button');
  expect(files.map((fila) => fila.querySelector('.sdp-calaix-identitats__rol').textContent)).toEqual(x.rols);
  expect(files[0].getAttribute('aria-current')).toBe('true');
  expect(within(files[0]).getByText(x.activa)).toBeTruthy();
  expect(within(dialeg).getByRole('button', { name: x.idioma })).toBeTruthy();
  expect(within(dialeg).getByRole('button', { name: x.eixir })).toBeTruthy();
  for (const literal of LITERALS_CA_R2E_04) expect(dialeg.textContent, literal).not.toContain(literal);
  expect(within(dialeg).queryByRole('list', { name: 'Identitats' })).toBeNull();
});

/* v1.2.23 · R2E-04 (Gauntlet R2) · Llei del Píxel · En valencià, amb el
   traductor de veres, el calaix és el de sempre, lletra per lletra, i s'obri
   en el mateix clic, sense esperar cap tros. */
test('R2E-04 · en valencià, el calaix de la barra negra és el de sempre i s’obri en el mateix clic', () => {
  m.t = createTranslator('ca');
  m.identitat.identitats = IDENTITATS_R2E_04();
  render(<Barra onNavega={vi.fn()} />);
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat, idioma o eixir' })); });
  const dialeg = screen.getByRole('dialog', { name: 'Amb qui actues?' });
  expect(within(dialeg).getByText('Tria amb quina identitat vols publicar i editar. Pots canviar quan vullgues.')).toBeTruthy();
  const files = within(within(dialeg).getByRole('list', { name: 'Identitats' })).getAllByRole('button');
  expect(files.map((fila) => fila.querySelector('.sdp-calaix-identitats__rol').textContent)).toEqual(['Persona', 'Propietari', 'Organització']);
  expect(within(files[0]).getByText('Activa')).toBeTruthy();
  expect(within(dialeg).getByRole('button', { name: 'Idioma del sistema' })).toBeTruthy();
  expect(within(dialeg).getByRole('button', { name: 'Eixir de Sóc de Poble' })).toBeTruthy();
});

/* Encàrrec 261018_1220 (Tasca 1, ordre del Mestre: «en clicar la identitat
   personal a Amb qui actues? la interfície es queda atrapada al Bloc de notes»)
   · Triar una identitat porta al seu workspace, el que ja existix: la persona,
   el Perfil; l'organització, la seua fitxa dins del Perfil. Cada anada porta un
   número nou a l'estat de l'historial; una tria que no s'aplica no navega. */
test('261018 · triar una identitat porta al seu workspace, amb un número d’anada nou cada vegada', async () => {
  const onNavega = vi.fn();
  render(<Barra onNavega={onNavega} />);
  const tria = async (nom) => {
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Identitat activa/ })); });
    const dialeg = screen.getByRole('dialog', { name: 'Amb qui actues?' });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: nom })); });
    return onNavega.mock.calls.at(-1);
  };
  const [rutaForn, opcionsForn] = await tria(/Forn de la Torre/);
  expect(rutaForn).toBe('/el-meu-perfil?organitzacio=o-1');
  const [rutaPersona, opcionsPersona] = await tria(/Pepa Soler/);
  expect(m.identitat.setActor).toHaveBeenLastCalledWith('persona', 'u-1');
  expect(rutaPersona).toBe('/el-meu-perfil');
  expect(opcionsPersona.state.espaiIdentitat).toBeGreaterThan(opcionsForn.state.espaiIdentitat);
  m.identitat.setActor.mockReturnValue(false);
  onNavega.mockClear();
  await tria(/Forn de la Torre/);
  expect(onNavega).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* T4 (ordre del Mestre, 260930) · Sense sessió el botó porta a /registre en
   mode Entrar i amb la ruta actual com a ?tornar (rutaDEntrada). Sense router
   llegible, la ruta és la de la barra d'adreces: '/' a jsdom. */
test('les accions del calaix porten a Idioma i tanquen la sessió de forma segura; sense sessió el botó porta a /registre', async () => {
  const onNavega = vi.fn();
  const vista = render(<Barra onNavega={onNavega} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Identitat activa/ })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Idioma del sistema' })); });
  expect(onNavega).toHaveBeenLastCalledWith('/traduccions');
  expect(screen.queryByRole('dialog')).toBeNull();

  // Amb canvis pendents, mostra avís abans d'eixir
  m.preparaEixida.mockResolvedValueOnce([{ entitat: 'nota', camps: ['content'] }]);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Identitat activa/ })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Eixir de Sóc de Poble' })); });
  expect(m.logout).not.toHaveBeenCalled();
  expect(screen.getByText('Encara hi ha canvis sense desar')).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Eixir igualment' })); });
  expect(m.logout).toHaveBeenCalledTimes(1);
  expect(onNavega).toHaveBeenLastCalledWith('/registre', { replace: true });
  expect(screen.queryByRole('dialog')).toBeNull();

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
  expect(onNavega).toHaveBeenCalledWith('/el-meu-perfil', { state: { espaiIdentitat: expect.any(Number) } });
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('acta 261004_1027 · quan arriba una organització on mana, l’avatar torna a obrir el calaix', async () => {
  m.identitat.identitats = [{ ...PERSONA, activa: true }];
  const onNavega = vi.fn();
  const { rerender } = render(<Barra onNavega={onNavega} />);
  expect(screen.getByRole('button', { name: 'El teu perfil: Pepa Soler' })).toBeTruthy();
  m.identitat = { ...m.identitat, identitats: [{ ...PERSONA, activa: true }, { ...FORN, activa: false }] };
  rerender(<Barra onNavega={onNavega} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat, idioma o eixir' })); });
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
  expect(onNavega).toHaveBeenCalledWith(RUTA_PERFIL_PROPI, { state: { espaiIdentitat: expect.any(Number) } });
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* Revisió del Gauntlet 261017 (ID4; relleu 3: mai «Foraster» mentre la sessió
   és vàlida) · Una pestanya nova amb una sessió recordada: mentre es restaura
   (estat 'comprovant', encara sense usuari) la barra no és el Foraster. Cap
   «Entrar» ni cap clic que porte a /registre: un estat neutre i ocupat
   (aria-busy) fins que la comprovació es resol. Resolta sense sessió, el
   botó Entrar de sempre. */
test('ID4 · mentre es restaura la sessió: cap «Entrar», cap navegació i un estat ocupat; resolta sense sessió, Entrar', () => {
  m.user = null;
  m.estat = 'comprovant';
  m.identitat = { actor: { tipus: 'persona', id: null, nom: null, avatar: null, rol: 'convidat' }, identitats: [], setActor: vi.fn(() => false) };
  const onNavega = vi.fn();
  const { container, rerender } = render(<Barra onNavega={onNavega} />);
  expect(screen.queryByRole('button', { name: 'Entrar' })).toBeNull();
  expect(container.querySelector('button')).toBeNull();
  const pendent = screen.getByRole('status');
  expect(pendent.getAttribute('aria-busy')).toBe('true');
  expect(pendent.textContent).toBe('Comprovant la sessió…');
  fireEvent.click(pendent);
  expect(onNavega).not.toHaveBeenCalled();
  expect(container.ownerDocument.querySelector('dialog')).toBeNull();
  // La comprovació es resol sense sessió: el Foraster de sempre.
  m.estat = 'fora';
  rerender(<Barra onNavega={onNavega} />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(onNavega).toHaveBeenCalledWith('/registre?mode=entrar&tornar=%2F');
});

test('ID4 · amb la persona ja dins i el rol en vol (comprovant amb usuari): l’avatar de sempre, mai l’estat ocupat', () => {
  m.estat = 'comprovant';
  m.identitat.identitats = [{ ...PERSONA, activa: true }];
  render(<Barra onNavega={vi.fn()} />);
  expect(screen.getByRole('button', { name: etiquetaPerfilPropi('Pepa Soler') })).not.toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
});
