/**
 * T5 (ordre del Mestre, 260930) · La pastilla i la insígnia d'un acte es
 * lligen del model d'esdeveniment (acteAEsdeveniment, que MurSection passa
 * per prop) en hora local, amb els lectors d'editorial.js: cap toISOString ni
 * new Date('AAAA-MM-DD'), que es lligen en UTC. Sense acte vàlid, cap
 * insígnia i la pastilla de publicació (regla T51).
 */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { EventCard, rutaDeLaBoinaDeLActe } from './EventCard.jsx';
import { DEFAULT_AUTHOR } from './UniversalUtils.js';
import { acteAEsdeveniment } from '../../sections/mur/agendaMur.js';
import { CALENDAR_EVENTS } from '../../sections/mur/eventsSeed.js';
import { ocorreElDia } from '../../utils/esdeveniment.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { resolveAsset } from '../../config/assetResolver.js';

let arrel;
beforeEach(() => {
  arrel = document.createElement('div');
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

/* Com la pinta MurSection: el model de l'acte passa per prop. */
const pinta = (item, esdeveniment = acteAEsdeveniment(item)) => {
  cleanup();
  arrel = document.createElement('div');
  act(() => { render(<EventCard item={item} esdeveniment={esdeveniment} />, { container: arrel }); });
};
const pastilla = () => [...arrel.querySelectorAll('.btn-date-time span')].map((s) => s.textContent);
const insignia = () => arrel.querySelector('.sp-card-calendar-badge');
const pecesInsignia = () => ['dia', 'mes', 'any'].map((peca) => insignia().querySelector(`.sp-card-calendar-badge__${peca}`)?.textContent ?? null);

test('Llei del Píxel · l’Aplec de la llavor es pinta com sempre: «10:00 29/01/23» i 29 / GENER / 2023', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  pinta(CALENDAR_EVENTS[0]);
  expect(pastilla()).toEqual(['10:00', '29/01/23']);
  expect(pecesInsignia()).toEqual(['29', 'GENER', '2023']);
  expect(insignia().getAttribute('aria-label')).toBe('29 GENER 2023');
  expect(insignia().getAttribute('datetime')).toBe('2023-01-29');
  // El clic de la pastilla porta al Calendari en el mes de l'acte (ordre del
  // Mestre, 261001, carril A; abans el filtre del Mur, '/mur?date=…', i
  // després el dia, '/calendari?date=…').
  act(() => { arrel.querySelector('.btn-date-time').click(); });
  expect(mocks.navigate).toHaveBeenLastCalledWith('/calendari?mes=2023-01');
});

test('sense dia real no hi ha insígnia i la pastilla és la de publicació, en hora local', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  pinta({ id: 'x', title: 'Ball', created_at: '2026-09-30T22:30:00+00:00' });
  expect(insignia()).toBeNull();
  expect(pastilla()).toEqual(['00:30', '01/10/26']);
  // El mes LOCAL que pinta (octubre), no el d'UTC (setembre).
  act(() => { arrel.querySelector('.btn-date-time').click(); });
  expect(mocks.navigate).toHaveBeenLastCalledWith('/calendari?mes=2026-10');
});

test('la data de publicació triada (publish_date) no fa d’insígnia', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  pinta({ id: 'y', title: 'Ball', publish_date: '2026-10-05T18:00:00Z', created_at: '2026-09-01T10:00:00Z' });
  expect(insignia()).toBeNull();
  expect(pastilla()).toEqual(['20:00', '05/10/26']);
});

/* Llei del Píxel · Una hora escrita al costat del dia que el model no sap
   llegir es pinta tal qual, com abans: no s'inventa cap hora, però tampoc no
   se'n perd cap d'escrita. Per al calendari, l'acte continua sent de tot el
   dia. La que sap llegir es normalitza (canvi declarat: «9.05» → «09:05»). */
test('una hora que el model no sap llegir es pinta com l’ha escrita l’autor; la que sap llegir, normalitzada', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  for (const hora of ['19h', '19 h', '10:00:00', '19:00-21:00', 'A les 19:00']) {
    const item = { id: 'h', title: 'Ball', date: '2026-11-14', time: hora };
    pinta(item);
    expect(pastilla()).toEqual([hora, '14/11/26']);
    expect(pecesInsignia()).toEqual(['14', 'NOVEMBRE', '2026']);
    expect(insignia().getAttribute('datetime')).toBe('2026-11-14');
    expect(acteAEsdeveniment(item).totElDia).toBe(true);
  }
  pinta({ id: 'n', title: 'Ball', date: '2026-11-14', time: '9.05' });
  expect(pastilla()).toEqual(['09:05', '14/11/26']);
  // Amb un inici al payload mana el model: el `time` solt no l'acompanya.
  pinta({ id: 'i', title: 'Ball', inici: { data: '2026-11-14' }, time: '19h' });
  expect(pastilla()).toEqual(['14/11/26']);
});

test('sense la prop esdeveniment, la regla T51 de qualsevol element i cap insígnia', () => {
  vi.stubEnv('TZ', 'Europe/Madrid');
  act(() => { render(<EventCard item={{ id: 'aplec-2023', title: 'Aplec', date: '2026-08-14T09:00:00' }} />, { container: arrel }); });
  expect(insignia()).toBeNull();
  expect(pastilla()).toEqual(['09:00', '14/08/26']);
});

/* T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · La boina d'un acte
   enllaça SEMPRE a la pàgina de qui signa: la que en fa qui pinta la targeta
   (authorHref, TargetaDelMur); sense, el sistema i la reserva «Sóc de Poble»
   van al projecte. Derogat per l'ordre del Mestre del 261004 (prompt
   261004_0515): el sistema ja no porta a /pobles. Un nom sense identitat
   coneguda queda sense enllaç. */
describe('T6 · la boina de l’acte', () => {
  const enllacDeLAutor = () => arrel.querySelector('.sp-card-header a.sp-card-author-link')?.getAttribute('href') ?? null;
  const nomDeLAutor = () => arrel.querySelector('.sp-card-header .sp-card-author-name').textContent;

  test('el sistema i la reserva «Sóc de Poble» porten a la pàgina del projecte', () => {
    pinta({ id: 's', title: 'Avís del sistema', isSystem: true, date: '2026-11-14' });
    expect([nomDeLAutor(), enllacDeLAutor()]).toEqual(['Sóc de Poble', '/projecte']);
    pinta({ id: 'r', title: 'Sense autor', date: '2026-11-14' });
    expect([nomDeLAutor(), enllacDeLAutor()]).toEqual(['Sóc de Poble', '/projecte']);
    expect(DEFAULT_AUTHOR.href).toBe('/projecte');
  });

  test('una persona o una entitat porta a la seua pàgina; un nom sense identitat, sense enllaç', () => {
    cleanup();
    arrel = document.createElement('div');
    act(() => {
      render(<EventCard item={{ id: 'p', title: 'Ball', author_name: 'Javi', date: '2026-11-14' }} authorHref="/gent/javillinares" />, { container: arrel });
    });
    expect([nomDeLAutor(), enllacDeLAutor()]).toEqual(['Javi', '/gent/javillinares']);
    pinta({ id: 'n', title: 'Ball', author_name: 'Pepa', date: '2026-11-14' });
    expect([nomDeLAutor(), enllacDeLAutor()]).toEqual(['Pepa', null]);
    expect(arrel.querySelector('.sp-card-header span.sp-card-author-block')).not.toBeNull();
  });

  test('rutaDeLaBoinaDeLActe: qui signa mana; després, el sistema i la reserva', () => {
    expect(rutaDeLaBoinaDeLActe({ isSystem: true, author_name: 'Javi' }, '/gent/javillinares')).toBe('/gent/javillinares');
    expect(rutaDeLaBoinaDeLActe({ isSystem: true }, undefined)).toBe('/projecte');
    expect(rutaDeLaBoinaDeLActe({}, null)).toBe('/projecte');
    expect(rutaDeLaBoinaDeLActe({ author: 'Associació' }, undefined)).toBeUndefined();
    expect(rutaDeLaBoinaDeLActe({ author_name: 'Pepa' }, '')).toBeUndefined();
    expect(rutaDeLaBoinaDeLActe(null)).toBe('/projecte');
  });
});

/* Auditoria 261007 (B) · L'enllaç de tota la targeta només és una ruta de
   l'app: un mainHref de fora (un payload escrit per PostgREST) navegava la
   pestanya de l'amfitrió. */
describe('l’enllaç de tota la targeta', () => {
  const enllac = () => arrel.querySelector('a.sp-card-link-overlay')?.getAttribute('href') ?? null;

  test('sense mainHref, el detall de l’acte com sempre', () => {
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14' });
    expect(enllac()).toBe('/events/fira');
  });

  test('una ruta interna es conserva', () => {
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14', mainHref: '/page/xat' });
    expect(enllac()).toBe('/page/xat');
  });

  test.each(['https://fals-poble.example/entra', '//fals-poble.example', 'javascript:alert(1)'])('una adreça de fora (%s) cau al detall de l’acte', (mainHref) => {
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14', mainHref });
    expect(enllac()).toBe('/events/fira');
  });
});

/* Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT).» La imatge i l'avatar d'un acte passen pel mode
   estricte (fontImatgePropia) i es demanen sense referent: una de fora no es
   demana (cap portada; la silueta en lloc de l'avatar); una de pròpia, com
   abans. */
describe('Decisió 3 · només imatges pròpies', () => {
  const fonts = () => [...arrel.querySelectorAll('img')].map((img) => img.getAttribute('src'));

  test('una imatge o un avatar de tercers (també de Google) no es demanen', () => {
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14', image_url: 'https://lh3.googleusercontent.com/a/x.png', author_avatar: 'https://rastreig.example/p.gif' });
    expect(fonts()).toEqual([]);
    expect(arrel.querySelector('.sp-card-media-container')).toBeNull();
    expect(arrel.querySelector('.sp-card-avatar--fallback')).not.toBeNull();
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14', image: 'https://rastreig.example/p.gif', author_avatar: 'https://lh3.googleusercontent.com/a/x.png' });
    expect(fonts()).toEqual([]);
  });

  test('les pròpies es pinten amb la mateixa font, sense referent; sense avatar, el logotip de reserva', () => {
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14', image_url: '/assets/agenda/fira.webp', author_avatar: '/assets/gent/associacio.webp' });
    expect(fonts()).toEqual(['/assets/gent/associacio.webp', '/assets/agenda/fira.webp']);
    expect([...arrel.querySelectorAll('img')].map((img) => img.getAttribute('referrerpolicy'))).toEqual(['no-referrer', 'no-referrer']);
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14' });
    expect(fonts()).toEqual(['/assets/system/ui/logo-socdepoble-cuadrat-verd.svg']);
  });

  /* Revisió adversarial del 261007 · Les altres fonts pròpies d'un acte, com
     les d'una publicació: el nostre Storage quan la configuració el registra
     (runtime.js; un origen sintètic d'esta prova) i una referència sdp-media://,
     que fa el camí de sempre (resolveAsset, sense filtre de més). */
  test('el nostre Storage registrat i una referència sdp-media:// es pinten com abans', () => {
    const STORAGE = 'https://projecte-acte.supabase.co';
    const foto = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/agenda/fira.webp`;
    const avatar = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/perfil/a.webp`;
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14', image_url: foto, author_avatar: avatar });
    expect(fonts()).toEqual([]);
    permetOrigenMitjans(STORAGE);
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14', image_url: foto, author_avatar: avatar });
    expect(fonts()).toEqual([avatar, foto]);
    const ref = 'sdp-media://mitjans/poble/u/agenda/fira.webp';
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14', image: ref });
    expect(arrel.querySelector('img.sp-card-media').getAttribute('src')).toBe(resolveAsset(ref));
  });
});

/* Tres fusos: el del poble, un de negatiu (on el dia UTC recula) i el més
   positiu que hi ha (UTC+14). El desfasament de gener fa de guarda: si el
   canvi de TZ no s'aplica al worker, la guarda falla en lloc de deixar les
   altres proves verdes sense provar res. */
const DESFAS_GENER = Object.freeze({ 'Europe/Madrid': -60, 'America/Los_Angeles': 480, 'Pacific/Kiritimati': -840 });
/* Un instant amb desfasament (16:00 UTC del 3-10), en hora local. */
const INSTANT_LOCAL = Object.freeze({
  'Europe/Madrid': { pastilla: ['18:00', '03/10/26'], dia: '3' },
  'America/Los_Angeles': { pastilla: ['09:00', '03/10/26'], dia: '3' },
  'Pacific/Kiritimati': { pastilla: ['06:00', '04/10/26'], dia: '4' }
});

describe.each(Object.keys(DESFAS_GENER))('en hora local (%s)', (zona) => {
  beforeEach(() => { vi.stubEnv('TZ', zona); });

  test('guarda: la zona s’aplica de veres al worker', () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(DESFAS_GENER[zona]);
  });

  test('l’Aplec: «10:00 29/01/23» i 29 / GENER / 2023, el mateix dia que el calendari', () => {
    pinta(CALENDAR_EVENTS[0]);
    expect(pastilla()).toEqual(['10:00', '29/01/23']);
    expect(pecesInsignia()).toEqual(['29', 'GENER', '2023']);
    expect(ocorreElDia(acteAEsdeveniment(CALENDAR_EVENTS[0]), 2023, 0, 29)).toBe(true);
  });

  test('un acte de tot el dia no porta cap hora inventada ni recula de dia', () => {
    pinta({ id: 'fira', title: 'Fira', date: '2026-11-14' });
    expect(pastilla()).toEqual(['14/11/26']);
    expect(insignia().getAttribute('datetime')).toBe('2026-11-14');
    expect(pecesInsignia()).toEqual(['14', 'NOVEMBRE', '2026']);
  });

  test('a la vora de la mitjanit, la insígnia diu el dia de la pastilla', () => {
    pinta({ id: 'b', title: 'Ball', date: '2026-08-14', time: '00:30' });
    expect(pastilla()).toEqual(['00:30', '14/08/26']);
    expect(insignia().getAttribute('datetime')).toBe('2026-08-14');
    expect(pecesInsignia()[0]).toBe('14');
  });

  test('els dies del canvi d’hora europeu', () => {
    pinta({ id: 'p', title: 'Primavera', date: '2026-03-29' });
    expect(pastilla()).toEqual(['29/03/26']);
    expect(pecesInsignia()[0]).toBe('29');
    pinta({ id: 'o', title: 'Tardor', date: '2026-10-25', time: '02:30' });
    expect(pastilla()).toEqual(['02:30', '25/10/26']);
    expect(pecesInsignia()[0]).toBe('25');
  });

  test('un instant amb desfasament es llig en hora local, el mateix dia que ocorreElDia', () => {
    const item = { id: 'i', title: 'Concert', inici: '2026-10-03T16:00:00Z' };
    pinta(item);
    expect(pastilla()).toEqual(INSTANT_LOCAL[zona].pastilla);
    expect(pecesInsignia()[0]).toBe(INSTANT_LOCAL[zona].dia);
    const [any, mes, dia] = insignia().getAttribute('datetime').split('-').map(Number);
    expect(ocorreElDia(acteAEsdeveniment(item), any, mes - 1, dia)).toBe(true);
  });
});
