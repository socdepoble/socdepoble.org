/**
 * Onada 3 (P2, incidència de producció del Mestre a gentdelatorre.net) · Sense
 * sessió en remot, la llista de Xats és la de mostra (FakeChatOnboarding) i
 * les seues files no portaven cap `avatar_url`: queien a les inicials (LT, IM,
 * SD). Ara cada fila porta la cara de la seua identitat, com a la llavor, i la
 * ruta pròpia es resol amb la base de l'amfitrió (Avatar → resolRecursPropi).
 * També la fila virtual del poble (FilaPoble), que és el mateix grup.
 *
 * Es pinten les files de veres (FilaComunitat, FilaConversa, LlistaConverses).
 * Com l'element <soc-de-poble> (PedraSecaEmbed.jsx, _aplicaBaseRecursos), una
 * base d'un altre origen es fixa i se'n permet l'origen al sanejador.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useContext } from 'react';

const mocks = vi.hoisted(() => ({ externalConfig: {}, towns: [] }));
vi.mock('../../../app/contexts/UIContext.jsx', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: mocks.externalConfig })
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: mocks.towns }) }));

import FakeChatOnboarding from './FakeChatOnboarding.jsx';
import FilaConversa, { FilaComunitat, esComunitat } from './FilaConversa.jsx';
import LlistaConverses from './LlistaConverses.jsx';
import { XatContext } from '../XatContext.jsx';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { permetOrigenMitjans } from '../../../utils/sanitize.js';
import { AJUDA_PER_CLAU, CARA_DE_LA_IAIA } from '../../../data/xatsPerDefecte.js';

const t = (_, alternativa) => alternativa;
const PAQUET = 'https://amfitrio.example/wp-content/plugins/socdepoble-enxufe/dist';
const POBLE = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };
const TORRE = {
  id: POBLE.id, title: 'La Torre de les Maçanes',
  image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg', avatar_url: '/assets/towns/la-torre-de-les-macanes/2.jpg'
};
/* Onada 6 (tasca 12) · La fila de la IAIA arriba amb l'avatar del padró
   (AJUDA) i el xat en pinta la cara retallada de «Festa del Poble» (CaraXat). */
const IAIA = CARA_DE_LA_IAIA.src;
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';

/* La llista de mostra amb les files de veres: les comunitats i els fils solts. */
function Llista() {
  const xat = useContext(XatContext);
  return (
    <ul>
      {xat.comunitats.map((c) => <li key={c.fil.id}><FilaComunitat comunitat={c} onObri={() => {}} t={t} /></li>)}
      {xat.chatThreads.filter((f) => !f.comunitatId && !esComunitat(f)).map((f) => (
        <li key={f.id}><FilaConversa fil={f} onSelect={() => {}} locale="ca-ES" t={t} /></li>
      ))}
    </ul>
  );
}
const munta = () => render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Llista /></FakeChatOnboarding>);

/* { nom: src | null } de cada avatar pintat (null: les inicials). */
const cares = (container) => Object.fromEntries([...container.querySelectorAll('.sdp-avatar')]
  .map((avatar) => [avatar.getAttribute('title'), avatar.querySelector('img')?.getAttribute('src') ?? null]));

beforeEach(() => {
  mocks.externalConfig = { poble: POBLE.id, nomPoble: POBLE.nom };
  mocks.towns = [TORRE];
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

test('sense amfitrió, cada fila de la mostra porta la seua cara: el poble, la IAIA i Sóc de Poble', () => {
  const { container } = munta();
  expect(cares(container)).toEqual({ 'Gent de la Torre': TORRE.avatar_url, 'IAIA MarIA': IAIA, 'Sóc de Poble': LOGO });
});

test('incrustat en un amfitrió, les cares pengen de la carpeta del paquet', () => {
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
  const { container } = munta();
  expect(cares(container)).toEqual({
    'Gent de la Torre': `${PAQUET}${TORRE.avatar_url}`, 'IAIA MarIA': `${PAQUET}${IAIA}`, 'Sóc de Poble': `${PAQUET}${LOGO}`
  });
});

test('si el contingut del node no té la fitxa del poble, la comunitat es queda amb les inicials (cap cara inventada)', () => {
  mocks.towns = [{ id: 'sella', avatar_url: '/assets/towns/sella/2.jpg' }];
  const { container } = munta();
  expect(cares(container)).toEqual({ 'Gent de la Torre': null, 'IAIA MarIA': IAIA, 'Sóc de Poble': LOGO });
  expect(container.querySelector('[title="Gent de la Torre"]').textContent).toContain('GD');
});

test('sense poble declarat, les dues entrades d’ajuda també porten cara', () => {
  mocks.externalConfig = {};
  const { container } = munta();
  expect(cares(container)).toEqual({ 'IAIA MarIA': IAIA, 'Sóc de Poble': LOGO });
});

test('«Nova conversa» de la mostra (cercaMembres) porta les mateixes cares que la llista', async () => {
  let xat = null;
  function Captura() { xat = useContext(XatContext); return null; }
  render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Captura /></FakeChatOnboarding>);
  const membres = await xat.cercaMembres('');
  /* Les dades porten l'avatar del padró (AJUDA); CaraXat en pinta la cara, com a la llista. */
  expect(Object.fromEntries(membres.map((m) => [m.nom, m.avatar_url]))).toEqual({ 'Sóc de Poble': LOGO, 'IAIA MarIA': AJUDA_PER_CLAU.iaia.avatar });
});

test('la fila virtual del poble (FilaPoble) porta la mateixa cara, resolta amb la base', () => {
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
  const files = [{ clau: `poble:${POBLE.id}`, tipus: 'poble', poble: POBLE, delPoble: true }];
  const { container } = render(<LlistaConverses files={files} onSelect={() => {}} onObriPoble={() => {}} locale="ca-ES" t={t} />);
  expect(cares(container)).toEqual({ 'Gent de la Torre': `${PAQUET}${TORRE.avatar_url}` });
});
