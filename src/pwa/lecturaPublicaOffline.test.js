import { afterEach, describe, expect, test, vi } from 'vitest';
import { capturaLecturaPublica, esRutaDeLecturaPublica, iniciaLecturaPublicaOffline } from './lecturaPublicaOffline.js';
import { CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../sections/mur/eventsSeed.js';

const fora = () => ({ estat: 'fora', usuari: null, generacio: 2 });
function entorn(cami = '/mercat') {
  const arrel = document.createElement('div');
  arrel.id = 'root';
  const main = document.createElement('main');
  main.textContent = 'ESBORRANY PRIVAT NO PUBLICAT DEL DOM ';
  const formulari = document.createElement('form');
  formulari.textContent = 'SECRET';
  main.append(formulari);
  arrel.append(main);
  document.body.replaceChildren(arrel);
  const finestra = { document, location: new URL(cami, 'https://socdepoble.org'), MutationObserver,
    addEventListener: vi.fn(), removeEventListener: vi.fn(), setTimeout, clearTimeout };
  const payload = { marketItems: [
    { id: 'oli', title: 'Oli del poble', description: '<p>Collita de novembre, oli d’oliva dels bancals de la Vall.</p>', price: '4.95€' },
    { id: 'privat', title: 'SECRET DEL VEÏNAT', content: 'Text que només poden llegir els membres.', ownerUserId: 'a' },
    { id: 'ocult', title: 'NO PUBLICAT', content: 'Nota que és privada.', visibility: 'private' }
  ], feedPosts: [{ id: 'publicacio', title: 'Mur del poble', content: 'Mel de romaní i oli d’oliva del poble, amb collita de novembre.' }] };
  return { finestra, publica: vi.fn(() => true), fonts: () => new Map([['mur', { payload, generacio: 2, capturadaEl: '2026-11-21T23:00:00.000Z' }]]), subscriuFonts: () => () => {} };
}
afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

describe('captura pública fail-closed des de DTO cru', () => {
  test.each(['/notes', '/xat', '/control', '/mercat/editar', '/mur/nova', '/mur/a?token=secret', '/mercat#secret', '/mercat/a/b', '/mur/%6eova'])('rebutja %s', cami => {
    const e = entorn(cami);
    expect(esRutaDeLecturaPublica(e.finestra.location)).toBe(false);
    expect(capturaLecturaPublica({ ...e, sessio: fora })).toBeNull();
  });
  test('només font pública: cap edició local del DOM, fila del veïnat ni visibilitat privada', () => {
    const resultat = capturaLecturaPublica({ ...entorn(), sessio: fora });
    expect(resultat.text).toContain('Oli del poble');
    expect(resultat.text).toContain('4,95\u00a0€');
    expect(resultat.text).not.toMatch(/SECRET|PRIVAT|NO PUBLICAT|ESBORRANY|<p>/);
    expect(resultat.capturadaEl).toBe('2026-11-21T23:00:00.000Z');
    expect(resultat).not.toHaveProperty('html');
  });
  test('un detall només guarda la seua fila pública: privat, absent o font antiga no tenen reserva', () => {
    expect(capturaLecturaPublica({ ...entorn('/mercat/oli'), sessio: fora }).titol).toBe('Oli del poble');
    for (const ruta of ['/mercat/privat', '/mercat/ocult', '/mercat/no-existix']) {
      expect(capturaLecturaPublica({ ...entorn(ruta), sessio: fora })).toBeNull();
    }
    expect(capturaLecturaPublica({ ...entorn(), sessio: () => ({ ...fora(), generacio: 3 }) })).toBeNull();
  });
  test.each([{ estat: 'comprovant', usuari: null }, { estat: 'dins', usuari: { id: 'a' } }, { estat: 'fora', usuari: { id: 'a' } }])('cap captura amb sessió no resolta o usuari: %j', estat => {
    expect(capturaLecturaPublica({ ...entorn(), sessio: () => estat })).toBeNull();
  });
  test('descarta una identitat que canvia durant la lectura', () => {
    expect(capturaLecturaPublica({ ...entorn(), sessio: vi.fn().mockReturnValueOnce(fora()).mockReturnValue({ ...fora(), generacio: 3 }) })).toBeNull();
  });
  test('després d’haver observat sessió, eixir no torna a capturar', () => {
    vi.useFakeTimers();
    const e = entorn();
    let avisa;
    const deixa = vi.fn();
    const neteja = iniciaLecturaPublicaOffline({ ...e, sessio: fora, subscriu: fn => { avisa = fn; fn(fora()); return deixa; } });
    avisa({ estat: 'dins', usuari: { id: 'jo' }, generacio: 3 });
    avisa({ estat: 'fora', usuari: null, generacio: 4 });
    vi.advanceTimersByTime(1000);
    expect(e.publica).not.toHaveBeenCalled();
    neteja();
    expect(deixa).toHaveBeenCalledOnce();
  });
  test('una visita anònima envia una reserva pública amb data de lectura original', () => {
    vi.useFakeTimers();
    const e = entorn('/mur/publicacio');
    const neteja = iniciaLecturaPublicaOffline({ ...e, sessio: fora, subscriu: fn => { fn(fora()); return () => {}; } });
    vi.advanceTimersByTime(1000);
    expect(e.publica).toHaveBeenCalledWith(expect.objectContaining({ tipus: 'sdp-lectura-publica', cami: '/mur/publicacio', capturadaEl: '2026-11-21T23:00:00.000Z' }));
    neteja();
  });
});

/* v1.2.20 · Gauntlet R1 (L3-07) · /events/<id> no té reserva pròpia: la llista de /calendari és
   l'única còpia d'un acte, i no pot perdre'n el dia, l'hora, el lloc ni la repetició. Tot ix del
   text públic que ja es guarda (payload.events), llegit amb el model del Calendari. */
describe('L3-07 · la còpia de /calendari conserva el quan, l’on i la repetició dels actes', () => {
  const captura = (events) => capturaLecturaPublica({ ...entorn('/calendari'), sessio: fora,
    fonts: () => new Map([['mur', { payload: { events }, generacio: 2, capturadaEl: '2026-11-21T23:00:00.000Z' }]]) }).text;
  test('un acte amb date, time i location: el dia, l’hora i el lloc del camp, no de la prosa', () => {
    const text = captura([{ id: 'aplec', type: 'event', title: '2n Aplec pel Territori', description: 'Trobada pel territori i la memòria de l’incendi.',
      date: '2023-01-29', time: '10:30', location: 'Balcó de Travadell · Benillup' }]);
    expect(text).toContain('Quan: diumenge, 29 de gener del 2023, a les 10:30');
    expect(text).toContain('On: Balcó de Travadell · Benillup');
  });
  test('l’acte de llavor dels cursos (inici i fi sense date): el primer i l’últim dia, i el date_label', () => {
    const text = captura([CURSOS_PEDRA_EN_SEC_2026_EVENT]);
    expect(text).toContain('Quan: divendres, 23 d’octubre del 2026');
    expect(text).toContain('Fins: dissabte, 14 de novembre del 2026');
    expect(text).toContain(CURSOS_PEDRA_EN_SEC_2026_EVENT.date_label);
  });
  test('un mercat repetit: diu que es repetix, quan va ser la primera vegada i fins a quina hora', () => {
    const text = captura([{ id: 'mercat', type: 'event', title: 'Mercat dels dissabtes', description: 'Verdura, oli i formatge del poble cada dissabte.',
      date: '2026-06-06', time: '09:00', endTime: '13:00', location: 'Plaça Major', recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] },
    { id: 'reg', type: 'event', title: 'Torn de reg', description: 'Torn de reg de la séquia dels bancals.', inici: '2026-07-01T07:00', recurrencia: ['RRULE:FREQ=DAILY;INTERVAL=3'] }]);
    expect(text).toContain('Primera vegada: dissabte, 6 de juny del 2026, a les 9:00\nFins: 13:00\nOn: Plaça Major\nEs repetix: cada setmana');
    expect(text).toContain('Primera vegada: dimecres, 1 de juliol del 2026, a les 7:00\nEs repetix: cada 3 dies');
  });
  test('una hora amb desfasament es diu en la zona de l’acte, i un element sense acte no inventa cap data', () => {
    const text = captura([{ id: 'ple', type: 'event', title: 'Ple municipal obert', description: 'Ple obert al veïnat a la sala de l’ajuntament.', inici: '2026-11-28T09:00:00Z' },
      { id: 'nota', title: 'Nota del calendari', description: 'Una nota sense cap data que no és cap acte.' }]);
    expect(text).toContain('Quan: dissabte, 28 de novembre del 2026, a les 10:00');
    expect(text).not.toMatch(/Quan:[^\n]*\n[^\n]*Nota del calendari/);
    expect(text.split('\n\n')[1]).toBe('Nota del calendari\nUna nota sense cap data que no és cap acte.');
  });
});
