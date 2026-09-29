/* T69 · Els resultats de la cerca global del Xat: pinta el que torna
   cercaXat() de veres (cap mock del motor), per grups, amb <mark>, l'avís de
   l'abast i els estats buits honestos. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import ResultatsCercaXat from './ResultatsCercaXat.jsx';
import { cercaXat } from '../cercaXat.js';
import { agrupaComunitats, mapejaFil } from '../missatges.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

const FILS = [
  { id: 'f1', name: 'José Martí', tipus: 'directe', ultimText: 'Ens veiem a la plaça', ultimAl: '2026-09-28T10:00:00Z' },
  { id: 'f2', name: 'Comissió de Festes', tipus: 'grup', ultimText: 'Cal comprar coets', ultimAl: '2026-09-27T10:00:00Z' }
];
const MISSATGES = {
  f1: [{ id: 'm1', seq: 1, text: 'La plaça està plena', sender: 'other', author: 'José', creatAl: '2026-09-28T09:00:00Z' }],
  f2: [{ id: 'm2', seq: 1, text: 'Mira https://socdepoble.org/mur', sender: 'me', creatAl: '2026-09-27T09:00:00Z' }]
};
const MEMBRES = [
  { usuari_id: 'u-placa', nom: 'Pere de la Plaça', tipus: 'persona' },
  { usuari_id: 'jo', nom: 'Jo de la Plaça', tipus: 'persona' }
];

function pinta({ terme = '', filtre = null, ...props } = {}) {
  const resultat = cercaXat({ terme, filtre, fils: FILS, membres: MEMBRES, missatgesPerFil: MISSATGES, joId: 'jo' });
  return render(<ResultatsCercaXat resultat={resultat} terme={terme} filtre={filtre} onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" {...props} />);
}

test('tres grups amb el terme ressaltat (plegat d’accents) i l’avís de l’abast', () => {
  const onObriFil = vi.fn();
  const onObriPersona = vi.fn();
  pinta({ terme: 'placa', onObriFil, onObriPersona });
  const regio = screen.getByRole('region', { name: 'Resultats de la cerca' });
  expect(within(regio).getAllByRole('heading').map((h) => h.textContent)).toEqual(['Converses', 'Persones', 'Missatges']);
  /* «placa» troba «plaça»: el mateix plegat que /cerca. */
  const marques = [...regio.querySelectorAll('mark')].map((m) => m.textContent);
  expect(marques).toEqual(expect.arrayContaining(['plaça']));
  /* Mai un mateix. */
  expect(within(regio).queryByText(/Jo de la Plaça/)).toBeNull();
  expect(within(regio).getByText('Només es busca en les converses obertes en esta sessió.')).toBeTruthy();

  const converses = screen.getByRole('heading', { name: 'Converses' }).closest('section');
  fireEvent.click(within(converses).getByRole('button'));
  expect(onObriFil).toHaveBeenCalledWith(FILS[0]);
  const persones = screen.getByRole('heading', { name: 'Persones' }).closest('section');
  fireEvent.click(within(persones).getByRole('button', { name: /Pere de la Plaça/ }));
  expect(onObriPersona).toHaveBeenCalledWith(MEMBRES[0]);
  /* El missatge d'una altra persona diu qui l'ha escrit. */
  const missatges = screen.getByRole('heading', { name: 'Missatges' }).closest('section');
  expect(within(missatges).getByText('José:', { exact: false })).toBeTruthy();
});

test('un filtre sense dades diu la veritat; amb dades, només missatges', () => {
  pinta({ filtre: 'fotos' });
  expect(screen.getByRole('status').textContent).toBe("Encara no hi ha cap missatge d'este tipus en les converses obertes.");
  expect(screen.queryByRole('heading')).toBeNull();
  cleanup();

  pinta({ filtre: 'enllacos' });
  expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual(['Missatges']);
  expect(screen.queryByRole('status')).toBeNull();
});

test('sense cap resultat ho diu amb el terme', () => {
  pinta({ terme: 'zzz' });
  expect(screen.getByRole('status').textContent).toBe('Cap resultat per a «zzz».');
});

/* T67 també als resultats: una comunitat és la seua fila (avatar quadrat
   apilat, xebró, els grups de dins i mai «Cap missatge.»); el General porta
   la bafarada i no una «G»; els Avisos, el megàfon encara que tinguen imatge;
   i totes diuen el tipus en text per a lectors de pantalla. */
test('T67 · una comunitat, un grup i un canal es pinten als resultats com a la llista', () => {
  const fils = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Sóc de Poble' },
    { id: 'a-1', tipus: 'canal', titol: 'Avisos de Sóc de Poble', comunitatId: 'c-1', imatgeUrl: '/logo.svg', ultimText: 'Benvinguts', ultimAl: '2026-09-28T10:00:00Z' },
    { id: 'g-1', tipus: 'grup', titol: 'General de Sóc de Poble', comunitatId: 'c-1', ultimText: 'Hola', ultimAl: '2026-09-28T09:00:00Z' }
  ].map((f) => mapejaFil(f));
  const comunitats = agrupaComunitats(fils);
  const resultat = cercaXat({ terme: 'poble', fils, membres: [], missatgesPerFil: {}, joId: 'jo' });
  render(<ResultatsCercaXat resultat={resultat} terme="poble" comunitats={comunitats} onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" />);
  const converses = screen.getByRole('heading', { name: 'Converses' }).closest('section');
  const files = within(converses).getAllByRole('button');
  const perNom = (nom) => files.find((b) => b.querySelector('.sdp-xat-fila__nom').textContent.startsWith(nom));

  const comunitat = perNom('Sóc de Poble,');
  expect(comunitat).toBeTruthy();
  expect(within(comunitat).getByText(', Comunitat')).toBeTruthy();
  expect(comunitat.querySelector('.sdp-xat-apilat .sdp-xat-avatar--quadrat')).toBeTruthy();
  expect(comunitat.querySelector('.sdp-xat-fila__xebro')).toBeTruthy();
  expect(comunitat.querySelector('time')).toBeNull();
  expect(comunitat.querySelector('.sdp-xat-fila__previa').textContent).toBe('Avisos de Sóc de Poble, General de Sóc de Poble');
  expect(comunitat.textContent).not.toContain('Cap missatge.');

  const avisos = perNom('Avisos');
  expect(within(avisos).getByText(", Canal d'avisos")).toBeTruthy();
  expect(avisos.querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(avisos.querySelector('img')).toBeNull();

  const general = perNom('General');
  expect(within(general).getByText(', Grup')).toBeTruthy();
  expect(general.querySelector('svg.lucide-message-circle-more')).toBeTruthy();
  expect(general.querySelector('.sdp-avatar')).toBeNull();
});
