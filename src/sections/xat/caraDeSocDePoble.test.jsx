/**
 * Gauntlet 261022_0225 (XAT-3) · La cara de la comunitat de Sóc de Poble,
 * una sola regla (caraDeSocDePoble.js) per a totes les superfícies del Xat
 * que la pinten: la fila i la fitxa de la comunitat, el rail (plegat i
 * desplegat) i la vista «Comunitats». En remot, la comunitat arriba amb l'id
 * del servidor (un UUID) i amb el logo pujat de l'organització
 * (sdp-media://…): fins que el backend registra l'id
 * (registraEntitatDelProjecte), cap superfície la pot reconéixer; després,
 * totes porten el logo oficial. Mai pel nom: un homònim conserva la seua cara.
 * Revisió (XATR-4) · Un directe amb l'entitat no és la comunitat: conserva la
 * seua imatge, a la fila i a la capçalera (AvatarFil, com abans).
 */
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import { oblidaEntitatDelProjecte, registraEntitatDelProjecte } from '../../config/navigation.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { AJUDA_PER_CLAU } from '../../data/xatsPerDefecte.js';
import { LOGO_DE_SOC_DE_POBLE, caraDeComunitat, esComunitatDeSocDePoble } from './caraDeSocDePoble.js';
import { RailXat } from './components/ClosCaXat.jsx';
import VistaComunitats from './components/VistaComunitats.jsx';
import FitxaComunitat from './components/FitxaComunitat.jsx';
import CapcaleraConversa from './components/CapcaleraConversa.jsx';
import { FilaComunitat } from './components/FilaConversa.jsx';

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/xat' }),
    useSearchParams: () => [new URLSearchParams()],
    useParams: () => ({}),
    Link: ({ to, children, ...rest }) => createElement('a', { href: to, ...rest }, children)
  };
});

const t = (_, alternativa) => alternativa;
const UUID = '58325860-a199-4056-b160-94c19b124277';
const PUJADA = `sdp-media://mitjans/${UUID}/organitzacions/${UUID}.webp`;
const SUBJECTE = { tipus: 'entitat', id: UUID, ruta: '/socdepoble', titol: 'Sóc de Poble' };

/* La comunitat remota amb la forma de missatges.mapejaFil, el seu canal i el General. */
function comunitatRemota() {
  const fil = { id: 'c-sdp', tipus: 'comunitat', esComunitat: true, name: 'Sóc de Poble', title: 'Sóc de Poble', avatar_url: PUJADA, subjecte: SUBJECTE };
  const fills = [
    { id: 'a-sdp', tipus: 'canal', esCanal: true, name: 'Avisos', title: 'Avisos', comunitatId: 'c-sdp', avatar_url: PUJADA, subjecte: SUBJECTE },
    { id: 'g-sdp', tipus: 'grup', esGrup: true, name: 'General', title: 'General', comunitatId: 'c-sdp', avatar_url: null, subjecte: SUBJECTE }
  ];
  return { fil, fills };
}

const registra = () => registraEntitatDelProjecte({ tipus: 'entitat', id: UUID, slug: ENTITAT_PILOT_SLUG });
/* La imatge i les inicials de cada cara (Avatar porta el nom al title). */
const cares = (arrel) => [...arrel.querySelectorAll('.sdp-avatar')]
  .map((avatar) => [avatar.getAttribute('title'), avatar.querySelector('img')?.getAttribute('src') ?? avatar.textContent]);

afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
});

test('la regla: per identitat, mai pel nom; ni els Avisos ni els grups de dins', () => {
  expect(LOGO_DE_SOC_DE_POBLE).toBe(AJUDA_PER_CLAU.socdepoble.avatar);
  const { fil, fills: [avisos, general] } = comunitatRemota();
  /* En remot, abans que el backend registre l'id: la seua imatge, com sempre. */
  expect(esComunitatDeSocDePoble(fil)).toBe(false);
  expect(caraDeComunitat(fil)).toBe(PUJADA);
  registra();
  expect(caraDeComunitat(fil)).toBe(LOGO_DE_SOC_DE_POBLE);
  expect(caraDeComunitat({ ...fil, avatar_url: null })).toBe(LOGO_DE_SOC_DE_POBLE);
  /* La llavor: l'id de l'entitat pilot ja és del projecte. */
  expect(caraDeComunitat({ id: 'c', tipus: 'comunitat', avatar_url: null, subjecte: { tipus: 'entitat', id: ENTITAT_PILOT_ID } })).toBe(LOGO_DE_SOC_DE_POBLE);
  /* Els Avisos i el General conserven la seua (AvatarFil hi posa la icona). */
  expect(caraDeComunitat(avisos)).toBe(PUJADA);
  expect(caraDeComunitat(general)).toBeNull();
  /* Un homònim (el mateix nom, una altra entitat) i un poble, la seua. */
  expect(caraDeComunitat({ ...fil, subjecte: { tipus: 'entitat', id: 'altra-entitat' } })).toBe(PUJADA);
  expect(caraDeComunitat({ ...fil, subjecte: { tipus: 'poble', id: UUID } })).toBe(PUJADA);
  /* XATR-4 · Un directe amb l'entitat no és la comunitat: la seua imatge. */
  const directe = { id: 'd', tipus: 'directe', name: 'Sóc de Poble', avatar_url: PUJADA, altres: [{ id: UUID, tipus: 'entitat' }] };
  expect(esComunitatDeSocDePoble(directe)).toBe(false);
  expect(caraDeComunitat(directe)).toBe(PUJADA);
  expect(caraDeComunitat(null)).toBeNull();
});

test('el rail, plegat i desplegat, porta el logo oficial i mai «SD»', () => {
  registra();
  for (const plegat of [false, true]) {
    const { container, unmount } = render(
      <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
        <RailXat titol="Menú" t={t} plegat={plegat} onAlterna={vi.fn()} onVes={vi.fn()} joId="jo" joNom="Javi Llinares" comunitats={[comunitatRemota()]} recordaSeccions={false} />
      </AppGridContext.Provider>
    );
    expect(Object.fromEntries(cares(container))['Sóc de Poble'], `plegat=${plegat}`).toBe(LOGO_DE_SOC_DE_POBLE);
    unmount();
  }
});

test('«Comunitats», la fitxa i la fila de la llista porten la mateixa cara', () => {
  registra();
  const comunitat = comunitatRemota();
  const vista = render(<aside><VistaComunitats comunitats={[comunitat]} t={t} locale="ca-ES" /></aside>);
  const cap = vista.container.querySelector('.sdp-xat-vista-comunitats__cap');
  expect(cap.querySelector('img').getAttribute('src')).toBe(LOGO_DE_SOC_DE_POBLE);
  /* Els Avisos de dins, el megàfon de sempre. */
  expect(vista.container.querySelector('.sdp-xat-vista-comunitats .sdp-xat-llista .sdp-xat-avatar-icona')).toBeTruthy();
  vista.unmount();

  const fitxa = render(<FitxaComunitat comunitat={comunitat} onObriFil={vi.fn()} onAfegirGrup={vi.fn()} t={t} locale="ca-ES" />);
  expect(fitxa.container.querySelector('.sdp-xat-fitxa-comunitat__cap img').getAttribute('src')).toBe(LOGO_DE_SOC_DE_POBLE);
  fitxa.unmount();

  const fila = render(<FilaComunitat comunitat={comunitat} onObri={vi.fn()} t={t} />);
  expect(fila.container.querySelector('img').getAttribute('src')).toBe(LOGO_DE_SOC_DE_POBLE);
});

/* XATR-4 · La regla és de la comunitat: la capçalera d'un directe amb
   l'entitat porta la imatge del fil, com abans (o, sense, les inicials). */
test('la capçalera d’un directe amb Sóc de Poble conserva la cara del fil', () => {
  registra();
  const directe = { id: 'd-sdp', tipus: 'directe', name: 'Sóc de Poble', title: 'Sóc de Poble', avatar_url: null, altres: [{ id: UUID, tipus: 'entitat', nom: 'Sóc de Poble' }] };
  const { container, rerender } = render(<CapcaleraConversa fil={directe} onTorna={vi.fn()} t={t} />);
  const capcalera = container.querySelector('header.sdp-xat-capcalera');
  expect(within(capcalera).getByRole('link').getAttribute('href')).toBe('/socdepoble');
  expect(capcalera.querySelector('img')).toBeNull();
  expect(capcalera.querySelector('.sdp-avatar').textContent).toBe('SD');
  rerender(<CapcaleraConversa fil={{ ...directe, avatar_url: '/assets/pujat.webp' }} onTorna={vi.fn()} t={t} />);
  expect(container.querySelector('header.sdp-xat-capcalera img').getAttribute('src')).toBe('/assets/pujat.webp');
});
