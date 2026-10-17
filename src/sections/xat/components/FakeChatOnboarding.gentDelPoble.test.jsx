/* Integració Xat i Pobles (Onada 6, pla 261009_0245, ítem 4) · Les dues
   superfícies del poble de l'amfitrió que pinten el grup abans que existisca
   passen les fitxes (`towns`) a pobleAmfitrio.js: sense `nomPoble` declarat,
   el grup es diu com la gent del poble, també un poble inventat. Amb nom
   declarat, mana el de l'amfitrió; sense fitxa, l'id de sempre. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useContext } from 'react';

const mocks = vi.hoisted(() => ({ externalConfig: {}, towns: [] }));
vi.mock('../../../app/contexts/UIContext.jsx', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: mocks.externalConfig })
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: mocks.towns }) }));

import FakeChatOnboarding from './FakeChatOnboarding.jsx';
import LlistaConverses from './LlistaConverses.jsx';
import { XatContext } from '../XatContext.jsx';
import { MOCK_TOWNS } from '../../pobles/townsSeed.js';

const t = (_, alternativa) => alternativa;
const TORRE = MOCK_TOWNS.find((town) => town.id === 'la-torre-de-les-macanes');
const INVENTAT = { id: 'olivera-inventada', title: "L'Olivera Inventada" };

let xat = null;
function Captura() {
  xat = useContext(XatContext);
  return null;
}
const muntaMostra = () => render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Captura /></FakeChatOnboarding>);
const filaPoble = (poble) => render(
  <LlistaConverses files={[{ clau: `poble:${poble.id}`, tipus: 'poble', poble, delPoble: true }]} onSelect={() => {}} onObriPoble={() => {}} locale="ca-ES" t={t} />
);

beforeEach(() => {
  xat = null;
  mocks.towns = [...MOCK_TOWNS, INVENTAT];
});
afterEach(cleanup);

test('xat de mostra: la comunitat del poble, el seu subjecte i l’autor dels Avisos diuen el nom de la gent', () => {
  mocks.externalConfig = { poble: TORRE.id };
  muntaMostra();
  const comunitat = xat.chatThreads.find((f) => f.id === 'fake-poble');
  expect([comunitat.name, comunitat.title, comunitat.subjecte.titol]).toEqual([TORRE.author, TORRE.author, TORRE.author]);
  expect(comunitat.subjecte).toMatchObject({ tipus: 'poble', id: TORRE.id, ruta: `/pobles/${TORRE.id}` });
  /* Gauntlet 261016_1530 (Bloc 3.6.1) · La mostra també porta la comunitat
     de Sóc de Poble: la del poble es busca pel seu id, no per la posició. */
  expect(xat.comunitats.find((c) => c.fil.id === 'fake-poble').fil.name).toBe(TORRE.author);
  const [avis] = xat.getThreadMessages('fake-poble-avisos');
  expect(avis.author).toBe(TORRE.author);
  expect(avis.text).toContain(`Benvinguts al xat de ${TORRE.author}.`);
});

test('xat de mostra amb un poble inventat', () => {
  mocks.externalConfig = { poble: INVENTAT.id };
  muntaMostra();
  expect(xat.chatThreads.find((f) => f.id === 'fake-poble').name).toBe("Gent de l'Olivera Inventada");
});

test('xat de mostra: el nom declarat per l’amfitrió mana; sense fitxa, l’id', () => {
  mocks.externalConfig = { poble: TORRE.id, nomPoble: 'Veïnat de prova' };
  muntaMostra();
  expect(xat.chatThreads.find((f) => f.id === 'fake-poble').name).toBe('Veïnat de prova');
  cleanup();
  mocks.externalConfig = { poble: 'enlloc' };
  muntaMostra();
  expect(xat.chatThreads.find((f) => f.id === 'fake-poble').name).toBe('enlloc');
});

test('la fila virtual del poble (FilaPoble) es diu com la gent, també d’un poble inventat', () => {
  const nomDeLaFila = () => document.querySelector('.sdp-xat-fila__nom').textContent;
  filaPoble({ id: TORRE.id, nom: '' });
  expect(nomDeLaFila()).toBe(`${TORRE.author}, Grup del poble`);
  expect(screen.getByRole('button', { name: new RegExp(`${TORRE.author}, Grup del poble`) })).toBeTruthy();
  cleanup();
  filaPoble({ id: INVENTAT.id, nom: '' });
  expect(nomDeLaFila()).toBe("Gent de l'Olivera Inventada, Grup del poble");
  cleanup();
  mocks.towns = [];
  filaPoble({ id: INVENTAT.id, nom: '' });
  expect(nomDeLaFila()).toBe(`${INVENTAT.id}, Grup del poble`);
});
