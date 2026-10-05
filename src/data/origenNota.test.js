/**
 * T43 (ordre del Mestre, 260928) · normalitzaOrigen és la llista blanca
 * comuna dels dos adaptadors (localNotes.clean i supabase/notes.js): el que
 * no hi passa no es guarda enlloc. Fins ara cap prova no la cobria.
 */
import { expect, test } from 'vitest';
import {
  MAXIM_CAMP_ORIGEN, MAXIM_DESTINS, MAXIM_DRETS, MAXIM_URL, TIPUS_OBJECTE, esConnexio, esExtern, netejaCampOrigen,
  netejaDrets, normalitzaAbast, normalitzaOrigen, origenPublic, teDretsReservats, urlExterna, validaUrlExterna
} from './origenNota.js';
import { netejaText } from '../utils/sanitize.js';

const BASE = { tipus: 'connexio', itemId: 'sella', titol: 'Sella', sectionId: 'pobles', ruta: '/pobles/sella' };

test('un origen antic, sense camps nous, continua exactament igual', () => {
  const antic = { ...BASE, autorId: 'u1', autorNom: 'Pepa', autorTipus: 'persona' };
  expect(normalitzaOrigen(antic)).toEqual(antic);
});

test('l’objecte només entra si és de la llista tancada', () => {
  expect(normalitzaOrigen({ ...BASE, objecte: 'poble' }).objecte).toBe('poble');
  expect(normalitzaOrigen({ ...BASE, objecte: 'script' })).not.toHaveProperty('objecte');
  expect(normalitzaOrigen({ ...BASE, objecte: { tipus: 'poble' } })).not.toHaveProperty('objecte');
  expect(TIPUS_OBJECTE).toContain('pagina');
  expect(Object.isFrozen(TIPUS_OBJECTE)).toBe(true);
});

test('un camp desconegut es descarta; sense itemId no hi ha origen', () => {
  const net = normalitzaOrigen({ ...BASE, permis: 'tothom', html: '<b>x</b>' });
  expect(net).not.toHaveProperty('permis');
  expect(net).not.toHaveProperty('html');
  expect(normalitzaOrigen({ tipus: 'connexio', titol: 'Sense id' })).toBeNull();
  expect(normalitzaOrigen({ ...BASE, tipus: 'altra' })).toBeNull();
});

test('abast: un mode desconegut cau a «privada» i les llistes d’altres modes no es guarden', () => {
  expect(normalitzaAbast({ mode: 'internet', persones: [{ id: 'a' }] })).toEqual({ mode: 'privada', persones: [], grups: [] });
  expect(normalitzaAbast({ mode: 'grups', persones: [{ id: 'a' }], grups: [{ id: 'g', nom: 'Comissió' }] }))
    .toEqual({ mode: 'grups', persones: [], grups: [{ id: 'g', nom: 'Comissió' }] });
  expect(normalitzaAbast(null)).toBeNull();
  expect(normalitzaAbast([])).toBeNull();
});

test('abast: destinataris nets, sense repetits ni entrades invàlides, i 50 com a màxim', () => {
  const moltes = Array.from({ length: 80 }, (_, i) => ({ id: `u${i}`, nom: `Persona ${i}` }));
  const net = normalitzaAbast({ mode: 'persones', persones: [null, 'u0', { nom: 'sense id' }, { id: 'u0', nom: 'Repetida' }, ...moltes] });
  expect(net.persones).toHaveLength(MAXIM_DESTINS);
  expect(net.persones[0]).toEqual({ id: 'u0', nom: 'Repetida' });
  expect(net.persones.filter((p) => p.id === 'u0')).toHaveLength(1);
  const brut = normalitzaAbast({ mode: 'persones', persones: [{ id: ' u\u0000x ', nom: `\u0007${'n'.repeat(300)}` }] });
  expect(brut.persones[0].id).toBe('ux');
  expect(brut.persones[0].nom).toHaveLength(120);
});

test('abast.aplicat: només ids, un booleà de veres per al Mur i una data vàlida', () => {
  const net = normalitzaAbast({
    mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }],
    aplicat: { persones: ['u1', 7, { id: 'x' }, 'u1'], grups: 'g1', mur: 'sí', al: '2026-09-28T02:00:00.000Z', extra: true }
  });
  expect(net.aplicat).toEqual({ persones: ['u1', '7'], grups: [], mur: false, al: '2026-09-28T02:00:00.000Z' });
  expect(normalitzaAbast({ mode: 'poble', aplicat: { mur: true, al: 'ahir' } }).aplicat).toEqual({ persones: [], grups: [], mur: true });
});

test('l’abast viatja dins de l’origen i esConnexio no canvia', () => {
  const net = normalitzaOrigen({ ...BASE, objecte: 'poble', abast: { mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }] } });
  expect(net.abast).toEqual({ mode: 'persones', persones: [{ id: 'u1', nom: 'Pepa' }], grups: [] });
  expect(normalitzaOrigen({ ...BASE, abast: 'tothom' })).not.toHaveProperty('abast');
  expect(esConnexio({ origen: net })).toBe(true);
});

/* T43 · correcció: l'abast diu a qui s'ha enviat la connexió i no pot eixir
   de la nota. Compartir al Mur copia l'origen a section_submissions.payload,
   que llig tot el poble per REST. */
test('origenPublic: el mateix origen net, però sense abast', () => {
  const privat = {
    ...BASE, objecte: 'poble', autorNom: 'Pepa',
    abast: { mode: 'persones', persones: [{ id: 'u1', nom: 'Toni' }], aplicat: { persones: ['u1'], grups: [], mur: false } }
  };
  const public_ = origenPublic(privat);
  expect(public_).not.toHaveProperty('abast');
  expect(public_).toEqual({ ...BASE, objecte: 'poble', autorNom: 'Pepa' });
  expect(JSON.stringify(public_)).not.toContain('Toni');
  expect(privat.abast.persones).toHaveLength(1);
  expect(origenPublic({ ...BASE, tipus: 'altra' })).toBeNull();
  expect(origenPublic(null)).toBeNull();
});

/* ── D4 (ordre del Mestre, 260930) · els drets de l'original, camp opcional de la connexió ── */
test('D4 · drets: text net, tallat a 256 caràcters de veres, i origenPublic el conserva', () => {
  expect(MAXIM_DRETS).toBe(256);
  const net = normalitzaOrigen({ ...BASE, drets: '  © Pepa\u0007 Soler  ' });
  expect(net.drets).toBe('© Pepa Soler');
  const llarg = normalitzaOrigen({ ...BASE, drets: `© ${'🌾'.repeat(400)}` }).drets;
  expect(Array.from(llarg)).toHaveLength(MAXIM_DRETS);
  expect(/[\uD800-\uDFFF]/u.test(llarg)).toBe(false);
  // L'atribució és pública: viatja al Mur amb l'origen (sense l'abast).
  expect(origenPublic({ ...BASE, drets: '© Pepa', abast: { mode: 'privada' } })).toEqual({ ...BASE, drets: '© Pepa' });
});

test('D4 · drets: buits, o que no són text, no es desen; un origen sense drets queda igual', () => {
  for (const drets of ['', '   ', null, undefined, 42, { text: '©' }, ['©']]) {
    expect(normalitzaOrigen({ ...BASE, drets })).not.toHaveProperty('drets');
  }
  expect(normalitzaOrigen(BASE)).toEqual(BASE);
  // Un contingut de fora no porta drets d'origen.
  expect(normalitzaOrigen({ tipus: 'extern', url: 'https://exemple.org/', drets: '© Fals' })).not.toHaveProperty('drets');
});

test('D4 · teDretsReservats: només quan els drets nets comencen per «©»', () => {
  expect(teDretsReservats({ drets: '© Pepa' })).toBe(true);
  expect(teDretsReservats({ drets: '   © Pepa' })).toBe(true);
  expect(teDretsReservats({ drets: 'CC BY-SA 4.0' })).toBe(false);
  expect(teDretsReservats({ drets: 'Copyright Pepa' })).toBe(false);
  expect(teDretsReservats({})).toBe(false);
  expect(teDretsReservats(null)).toBe(false);
  expect(netejaDrets(7)).toBe('');
});

/* ── T71 · el contingut de fora (origen 'extern'): un clon editable que recorda la url ── */
const EXTERN = { tipus: 'extern', url: 'https://exemple.org/recepta?id=7#pas-2', titol: 'Recepta de coca' };

test('extern: url http(s) normalitzada, el lloc deduït de la url (mai rebut) i només els camps del tipus', () => {
  expect(normalitzaOrigen({ ...EXTERN, lloc: 'mentida.example', itemId: 'x', ruta: '/iaia', abast: { mode: 'poble' } })).toEqual({
    tipus: 'extern', url: 'https://exemple.org/recepta?id=7#pas-2', lloc: 'exemple.org', titol: 'Recepta de coca'
  });
  expect(normalitzaOrigen({ tipus: 'extern', url: 'http://Exemple.ORG' })).toEqual({ tipus: 'extern', url: 'http://exemple.org/', lloc: 'exemple.org' });
  expect(normalitzaOrigen({ ...EXTERN, autorNom: '  Pepa  ' }).autorNom).toBe('Pepa');
});

test('extern: sense url vàlida no hi ha origen; javascript:, data:, relatives i credencials, fora', () => {
  const dolentes = [
    undefined, '', '   ', 'javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>alert(1)</script>',
    'data:image/png;base64,AAAA', 'file:///etc/passwd', 'ftp://exemple.org/x', 'mailto:pepa@exemple.org', '/iaia', '//exemple.org/x',
    'exemple.org', 'https://usuari:clau@exemple.org/', 'https://exemple.org/amb espai', 'https://exemple.org/\u0000x', 42, { href: 'https://exemple.org' }
  ];
  for (const url of dolentes) {
    expect(urlExterna(url)).toBe('');
    expect(normalitzaOrigen({ ...EXTERN, url })).toBeNull();
  }
  expect(validaUrlExterna('javascript:alert(1)').motiu).toBe('esquema');
  expect(validaUrlExterna('data:text/html,x').motiu).toBe('esquema');
  expect(validaUrlExterna('https://u:p@exemple.org').motiu).toBe('credencials');
  expect(validaUrlExterna('/iaia').motiu).toBe('malformada');
  expect(validaUrlExterna('').motiu).toBe('buida');
  expect(validaUrlExterna('https://exemple.org/').motiu).toBeNull();
});

test('extern: una url de més de 2048 caràcters es rebutja, no es talla', () => {
  const base = 'https://exemple.org/';
  const justa = base + 'a'.repeat(MAXIM_URL - base.length);
  expect(justa).toHaveLength(MAXIM_URL);
  expect(urlExterna(justa)).toBe(justa);
  const llarga = justa + 'a';
  expect(validaUrlExterna(llarga)).toEqual({ url: '', motiu: 'llarga' });
  expect(normalitzaOrigen({ ...EXTERN, url: llarga })).toBeNull();
  // Normalitzar-la la faria passar del límit (l'accent es codifica): també es rebutja.
  const creix = base + 'à'.repeat(MAXIM_URL - base.length);
  expect(creix.length).toBe(MAXIM_URL);
  expect(validaUrlExterna(creix)).toEqual({ url: '', motiu: 'llarga' });
});

test('extern: esConnexio és només l’intern; esExtern, el de fora; origenPublic conserva la url', () => {
  const net = normalitzaOrigen(EXTERN);
  expect(esConnexio({ origen: net })).toBe(false);
  expect(esExtern({ origen: net })).toBe(true);
  expect(esExtern({ origen: normalitzaOrigen(BASE) })).toBe(false);
  expect(esExtern(null)).toBe(false);
  expect(origenPublic({ ...EXTERN, abast: { mode: 'persones', persones: [{ id: 'u1' }] } })).toEqual(net);
  expect(origenPublic(EXTERN).url).toBe('https://exemple.org/recepta?id=7#pas-2');
});

/* ── T71b · els camps de text de l'origen es tallen per caràcters de veres ── */
const ORFE = /[\uD800-\uDFFF]/u;
const caracters = (text) => Array.from(text).length;

test('T71b · origen.titol extern: 300 caràcters de veres passen sencers encara que siguen 301 unitats UTF-16', () => {
  const justa = `${'a'.repeat(MAXIM_CAMP_ORIGEN - 1)}🌾`;
  expect(justa.length).toBe(MAXIM_CAMP_ORIGEN + 1);
  const net = normalitzaOrigen({ ...EXTERN, titol: justa });
  expect(net.titol).toBe(justa);
  expect(net.titol.endsWith('🌾')).toBe(true);
  expect(ORFE.test(net.titol)).toBe(false);
  // 200 emojis (400 unitats) són 200 caràcters: no es tallen a 150.
  expect(normalitzaOrigen({ ...EXTERN, titol: '🌾'.repeat(200) }).titol).toBe('🌾'.repeat(200));
});

test('T71b · el que passa del límit es talla per punts de codi: cap emoji partit ni surrogate orfe, tampoc al JSON', () => {
  const extern = normalitzaOrigen({ ...EXTERN, titol: '🌾'.repeat(400), autorNom: `${'b'.repeat(299)}🍅🍅` });
  expect(extern.titol).toBe('🌾'.repeat(MAXIM_CAMP_ORIGEN));
  expect(caracters(extern.autorNom)).toBe(MAXIM_CAMP_ORIGEN);
  expect(extern.autorNom.endsWith('b🍅')).toBe(true);
  const connexio = normalitzaOrigen({ ...BASE, titol: `${'c'.repeat(299)}🌾🌾`, autorNom: '👩‍🌾'.repeat(200) });
  expect(connexio.titol).toBe(`${'c'.repeat(299)}🌾`);
  expect(caracters(connexio.autorNom)).toBe(MAXIM_CAMP_ORIGEN);
  for (const net of [extern, connexio]) {
    for (const valor of Object.values(net)) if (typeof valor === 'string') expect(ORFE.test(valor)).toBe(false);
    // Un surrogate orfe ixiria com a «\udxxx» al JSON, i el jsonb de Postgres el rebutja.
    expect(JSON.stringify(net)).not.toMatch(/\\ud[89a-f]/i);
  }
});

test('T71b · un surrogate orfe que ja ve a l’entrada es lleva; el text sense astrals queda com amb netejaText', () => {
  expect(normalitzaOrigen({ ...EXTERN, titol: 'Coca\uD83C de llanda\uDF3E' }).titol).toBe('Coca de llanda');
  expect(normalitzaOrigen({ ...BASE, autorNom: '\uDF3E Pepa \uD83C' }).autorNom).toBe('Pepa');
  expect(normalitzaOrigen({ ...EXTERN, titol: '\uD83C' })).not.toHaveProperty('titol');
  for (const valor of ['  Sella\u0007  ', 'n'.repeat(400), 'Café amb llet', 'línia\r\nsegona']) {
    expect(netejaCampOrigen(valor)).toBe(netejaText(valor, MAXIM_CAMP_ORIGEN));
  }
});

test('T71b · els noms i ids de l’abast també es tallen per caràcters de veres', () => {
  const net = normalitzaAbast({ mode: 'persones', persones: [{ id: `${'u'.repeat(99)}🌾🌾`, nom: '🌾'.repeat(130) }] });
  expect(net.persones[0].id).toBe(`${'u'.repeat(99)}🌾`);
  expect(net.persones[0].nom).toBe('🌾'.repeat(120));
  expect(JSON.stringify(net)).not.toMatch(/\\ud[89a-f]/i);
});
