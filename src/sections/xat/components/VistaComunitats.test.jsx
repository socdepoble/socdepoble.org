/* Onada 3B (captura 19.41.43) · La vista «Comunitats» de la columna
   central: la fila de títol amb el «+» honest, cada comunitat amb la seua
   capçalera (avatar quadrat i nom en negreta), els Avisos primer, els grups
   amb hora i avanç, i «Veure-ho tot ›». Amb dades de la llavor passades per
   mapejaFil i agrupaComunitats, com les dona el context. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import VistaComunitats, { fillsEnOrdre } from './VistaComunitats.jsx';
import { agrupaComunitats, mapejaFil } from '../missatges.js';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

function comunitats() {
  const fils = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Almàssera' },
    { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', ultimText: 'Hola', ultimAl: '2026-09-28T10:00:00Z', ultimAutorId: 'pep', altres: [{ id: 'pep', nom: 'Pep' }], noLlegits: 2 },
    { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-1', rol: 'membre', ultimText: 'Benvinguts', ultimAl: '2026-09-27T10:00:00Z', imatgeUrl: '/logo.svg' },
    { id: 'c-2', tipus: 'comunitat', titol: 'Sóc de Poble' },
    { id: 'a-2', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-2', ultimText: 'Reunió', ultimAl: '2026-09-20T10:00:00Z' },
    { id: 'g-2', tipus: 'grup', titol: 'Privat, coses de Javi', comunitatId: 'c-2', ultimText: 'Foto', ultimAl: '2026-09-21T10:00:00Z' },
    { id: 'g-3', tipus: 'grup', titol: 'Beta testers', comunitatId: 'c-2', ultimText: 'Prova', ultimAl: '2026-09-22T10:00:00Z' }
  ].map((f) => mapejaFil(f));
  return agrupaComunitats(fils);
}

test('fillsEnOrdre: els Avisos primer i després els grups, sense tocar-ne l’ordre', () => {
  const fills = [{ id: 'g', tipus: 'grup' }, { id: 'a', tipus: 'canal' }, { id: 'h', tipus: 'grup' }];
  expect(fillsEnOrdre(fills).map((f) => f.id)).toEqual(['a', 'g', 'h']);
  expect(fillsEnOrdre(null)).toEqual([]);
});

test('la fila de títol «Comunitats» porta el «+», que avisa d’on naixen', () => {
  const onNova = vi.fn();
  render(<aside><VistaComunitats comunitats={comunitats()} onNova={onNova} t={t} locale="ca-ES" /></aside>);
  const capcalera = document.querySelector('.app-grid-col-header');
  expect(within(capcalera).getByText('Comunitats')).toBeTruthy();
  expect(capcalera.querySelector('svg.lucide-users')).toBeTruthy();
  const nova = within(capcalera).getByRole('button', { name: 'Nova comunitat' });
  expect(nova.classList.contains('sdp-xat-nova')).toBe(true);
  fireEvent.click(nova);
  expect(onNova).toHaveBeenCalledTimes(1);
});

test('cada comunitat: capçalera amb avatar quadrat, Avisos primer, grups amb hora i avanç, i «Veure-ho tot»', () => {
  const onObriFil = vi.fn();
  const onObriComunitat = vi.fn();
  render(<VistaComunitats comunitats={comunitats()} onObriFil={onObriFil} onObriComunitat={onObriComunitat} filActiuId="g-2" t={t} locale="ca-ES" joId="jo" />);
  /* Una regió per comunitat, amb el nom (les inicials de l'avatar no hi compten). */
  const blocs = screen.getAllByRole('region');
  expect(blocs).toEqual([screen.getByRole('region', { name: 'Almàssera' }), screen.getByRole('region', { name: 'Sóc de Poble' })]);

  const [almassera, soc] = blocs;
  const cap = within(almassera).getByRole('heading', { level: 3, name: 'Almàssera' });
  /* Captura 19.41.43: l'avatar de la capçalera és quadrat i net, sense les
     targetes apilades de la fila de la llista de Xats. */
  expect(cap.querySelector('.sdp-xat-vista-comunitats__avatar[aria-hidden="true"] .sdp-avatar--md.sdp-xat-avatar--quadrat')).toBeTruthy();
  expect(cap.querySelector('.sdp-xat-apilat')).toBeNull();
  /* Cada bloc diu de quina comunitat és: la tornada de la fitxa hi busca el
     seu «Veure-ho tot» per a tornar-hi el focus. */
  expect(blocs.map((b) => b.getAttribute('data-comunitat'))).toEqual(['c-1', 'c-2']);
  const files = (bloc) => within(bloc).getAllByRole('button').filter((b) => b.classList.contains('sdp-xat-fila'));
  const nomsDe = (bloc) => files(bloc).map((b) => b.querySelector('.sdp-xat-fila__nom').firstChild.textContent);
  expect(nomsDe(almassera)).toEqual(['Avisos', 'General']);
  expect(nomsDe(soc)).toEqual(['Avisos', 'Beta testers', 'Privat, coses de Javi']);
  /* Els Avisos porten el megàfon, no la imatge heretada. */
  const [avisos, general] = files(almassera);
  expect(avisos.querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(avisos.querySelector('img')).toBeNull();
  /* Com a la llista: hora, avanç «Nom: text» i els no llegits. */
  expect(general.querySelector('time.sdp-xat-fila__hora')).toBeTruthy();
  expect(within(general).getByText('Pep: Hola')).toBeTruthy();
  expect(within(general).getByText('2 missatges no llegits')).toBeTruthy();
  /* La conversa oberta es marca. */
  expect(files(soc).find((b) => b.textContent.includes('Privat')).getAttribute('aria-current')).toBe('true');

  fireEvent.click(general);
  expect(onObriFil).toHaveBeenCalledWith('g-1');
  const tot = within(soc).getByRole('button', { name: 'Veure-ho tot de Sóc de Poble' });
  expect(tot.textContent).toBe('Veure-ho tot');
  expect(tot.querySelector('svg.lucide-chevron-right')).toBeTruthy();
  fireEvent.click(tot);
  expect(onObriComunitat).toHaveBeenCalledWith('c-2');
});

test('sense comunitats, un estat buit honest; mentre carrega, «Carregant…»', () => {
  const { rerender } = render(<VistaComunitats comunitats={[]} t={t} locale="ca-ES" />);
  const estat = screen.getByRole('status');
  expect(estat.textContent).toContain('Encara no formes part de cap comunitat');
  expect(estat.textContent).toContain("Pàgina Universal d'una entitat o d'un poble");
  expect(screen.queryByRole('region')).toBeNull();
  rerender(<VistaComunitats comunitats={[]} carregant t={t} locale="ca-ES" />);
  expect(screen.getByRole('status').textContent).toBe('Carregant…');
});

test('el botó que obri el rail (esquerra) va a l’esquerra del títol', () => {
  render(<VistaComunitats comunitats={[]} esquerra={<button type="button">Menú</button>} t={t} locale="ca-ES" />);
  const capcalera = document.querySelector('.app-grid-col-header');
  expect(capcalera.firstElementChild.textContent).toBe('Menú');
});
