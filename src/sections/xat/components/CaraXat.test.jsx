/**
 * CaraXat (Onada 3, AV) · L'únic punt on el Xat decidix com es pinta una cara.
 *   · Un recurs propi, una URL d'un origen permés, una data:image o res pinten
 *     EL MATEIX Avatar que abans, de manera síncrona (Llei del Píxel).
 *   · Una foto pujada ('sdp-media://…') la resol el port: mai un <img> que el
 *     navegador no sap carregar. Sense la capacitat, si el port llança o si
 *     torna encara una referència opaca, les inicials.
 * El padró (FilaPersona, «Conversa nova») és la font de les persones amb
 * sessió: la mateixa foto hi ha d'arribar resolta.
 */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ mitjans: true, resol: vi.fn() }));
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => cap === 'mitjans' && mocks.mitjans,
  resolveAsset: (ref, opcions) => mocks.resol(ref, opcions)
}));

import CaraXat, { esMitjaOpac } from './CaraXat.jsx';
import FilaPersona from './FilaPersona.jsx';
import { Avatar } from '../../../components/PedraSeca/index.js';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { permetOrigenMitjans } from '../../../utils/sanitize.js';
import { AGENTS_MAP } from '../../../data/agentsSeed.js';
import { CARA_DE_LA_IAIA } from '../../../data/xatsPerDefecte.js';

const PAQUET = 'https://amfitrio.example/wp-content/plugins/socdepoble-enxufe/dist';
const NODE = 'https://node.example';
const IAIA = '/assets/fotos/iaia-maria.png';
const GOOGLE = 'https://lh3.googleusercontent.com/a/pepa=s96-c';
const DADA = 'data:image/png;base64,iVBORw0KGgo=';
const PUJADA = 'sdp-media://mitjans/t/u/avatars/foto.webp';
const RESOLTA = `${NODE}/storage/v1/object/public/mitjans/t/u/avatars/foto.webp`;
const t = (_, alternativa) => alternativa;
const srcDe = (container) => container.querySelector('img')?.getAttribute('src') ?? null;

beforeAll(() => permetOrigenMitjans(NODE));
beforeEach(() => {
  mocks.mitjans = true;
  mocks.resol.mockReset();
  mocks.resol.mockImplementation(async () => RESOLTA);
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

test('esMitjaOpac només reconeix les referències del port', () => {
  expect(esMitjaOpac(PUJADA)).toBe(true);
  expect(esMitjaOpac(`  ${PUJADA}`)).toBe(true);
  /* L'esquema no distingix majúscules, com el filtre de sanitize.js (/i). */
  expect(esMitjaOpac(PUJADA.replace('sdp-media', 'SDP-MEDIA'))).toBe(true);
  for (const valor of [IAIA, GOOGLE, DADA, 'blob:https://x/1', '', null, undefined, 42]) {
    expect(esMitjaOpac(valor)).toBe(false);
  }
});

test('qualsevol valor que no és del port pinta el mateix DOM que Avatar, sense esperar', () => {
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
  for (const src of [IAIA, GOOGLE, DADA, null, 'blob:https://x/1']) {
    const props = { nom: 'IAIA MarIA', src, mida: 'xs', llavor: 'f-1', alt: '', className: 'sdp-xat-avatar--quadrat' };
    const { container } = render(<><Avatar {...props} /><CaraXat {...props} /></>);
    const [abans, ara] = container.children;
    expect(ara.isEqualNode(abans)).toBe(true);
    cleanup();
  }
  expect(mocks.resol).not.toHaveBeenCalled();
});

test('un recurs propi penja de la base de l’amfitrió; sense base, la ruta de sempre', () => {
  const sense = render(<CaraXat nom="IAIA MarIA" src={IAIA} alt="" />);
  expect(srcDe(sense.container)).toBe(IAIA);
  cleanup();
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
  expect(srcDe(render(<CaraXat nom="IAIA MarIA" src={IAIA} alt="" />).container)).toBe(`${PAQUET}${IAIA}`);
});

test('una foto pujada es resol pel port: primer les inicials, després la foto; mai sdp-media al DOM', async () => {
  const { container } = render(<CaraXat nom="Maria Pujada" src={PUJADA} mida="md" llavor="u-1" alt="" />);
  expect(srcDe(container)).toBeNull();
  expect(container.textContent).toContain('MP');
  await waitFor(() => expect(srcDe(container)).toBe(RESOLTA));
  expect(mocks.resol).toHaveBeenCalledWith(PUJADA, expect.anything());
  expect(container.querySelector('.sdp-avatar--md')).not.toBeNull();
});

test('sense la capacitat «mitjans», una foto pujada es queda amb les inicials', async () => {
  mocks.mitjans = false;
  const { container } = render(<CaraXat nom="Maria Pujada" src={PUJADA} alt="" />);
  await waitFor(() => expect(container.textContent).toContain('MP'));
  expect(container.querySelector('img')).toBeNull();
  expect(mocks.resol).not.toHaveBeenCalled();
});

test('si el port falla, inicials (cap imatge trencada)', async () => {
  mocks.resol.mockImplementation(async () => { throw new Error('node caigut'); });
  const { container } = render(<CaraXat nom="Maria Pujada" src={PUJADA} alt="" />);
  await waitFor(() => expect(mocks.resol).toHaveBeenCalled());
  expect(container.querySelector('img')).toBeNull();
});

/* Revisió (AV) · L'adaptador de Supabase no llança quan no pot firmar una URL
   privada: torna la MATEIXA referència (storage.js, resolveAsset). El filtre
   de seguretat l'accepta; el Xat no l'ha de pintar. */
test('si el port torna una referència encara opaca, inicials (cap <img src="sdp-media:…">)', async () => {
  const PRIVADA = 'sdp-media://mitjans_privats/t/u/notes/foto.webp';
  for (const ref of [PUJADA, PRIVADA]) {
    mocks.resol.mockReset();
    mocks.resol.mockImplementation(async (r) => r);
    const { container } = render(<CaraXat nom="Maria Pujada" src={ref} alt="" />);
    await waitFor(() => expect(mocks.resol).toHaveBeenCalledWith(ref, expect.anything()));
    /* act buida el treball pendent de React en eixir: el valor resolt ja s'ha pintat. */
    await act(async () => { await new Promise((resolt) => { setTimeout(resolt, 0); }); });
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('MP');
    cleanup();
  }
});

/* Onada 6 (tasca 12) · La IAIA té cara pròpia al xat: el seu avatar del
   padró es pinta amb la iaia del mocador roig de «Festa del Poble», retallada
   per l'enquadrament 'iaia' d'Avatar (cap fitxer nou). Amb la base del paquet,
   com qualsevol recurs propi. */
test('l’avatar del padró de la IAIA es pinta amb la seua cara de «Festa del Poble», enquadrada', () => {
  const PADRO = AGENTS_MAP.IAIA.avatar_url;
  const { container } = render(<CaraXat nom="IAIA MarIA" src={PADRO} mida="md" llavor="f-iaia" alt="" />);
  const avatar = container.querySelector('.sdp-avatar');
  expect([...avatar.classList]).toEqual(['sdp-avatar', 'sdp-avatar--md', expect.stringMatching(/^sdp-avatar--to-\d$/), 'sdp-avatar--enquadrat', 'sdp-avatar--enquadrat-iaia']);
  expect(srcDe(container)).toBe(CARA_DE_LA_IAIA.src);
  cleanup();
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
  expect(srcDe(render(<CaraXat nom="IAIA MarIA" src={PADRO} alt="" />).container)).toBe(`${PAQUET}${CARA_DE_LA_IAIA.src}`);
  cleanup();
  /* Una altra cara (o una altra imatge de la IAIA) continua igual que Avatar, sense enquadrament. */
  const altra = render(<CaraXat nom="IAIA MarIA" src={IAIA} alt="" />);
  expect(altra.container.querySelector('.sdp-avatar--enquadrat')).toBeNull();
});

test('el padró (FilaPersona) pinta la foto pujada resolta, i la de la IAIA amb la base', async () => {
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
  const maria = render(<FilaPersona membre={{ usuari_id: 'u-1', nom: 'Maria Pujada', tipus: 'persona', avatar_url: PUJADA }} onSelect={() => {}} t={t} />);
  await waitFor(() => expect(srcDe(maria.container)).toBe(RESOLTA));
  cleanup();
  const iaia = render(<FilaPersona membre={{ usuari_id: 'ajuda:ia', nom: 'IAIA MarIA', tipus: 'ia', avatar_url: IAIA }} onSelect={() => {}} t={t} />);
  expect(srcDe(iaia.container)).toBe(`${PAQUET}${IAIA}`);
});
