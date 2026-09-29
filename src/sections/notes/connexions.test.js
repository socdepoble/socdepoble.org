/* T54 · El cos d'una connexió: el que es desa a la nota (privat, al MAS) i el
   que ix al Mur quan es compartix (fet amb l'origen, mai el cos desat). */
import { expect, test } from 'vitest';
import { contingutDeLaConnexio, cosDeConnexioPerAlMur, objecteDeConnexio, senseParagrafHeretat, signaturaDeCaiguda } from './connexions.js';
import { rutaXatDePagina } from '../../config/objecteConnectable.js';

const MERCAT = {
  tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta',
  autorNom: 'Sóc de Poble', ruta: '/mercat/samarreta-socdepoble', objecte: 'producte'
};

test('el cos desat enllaça l’element i no parla a «el teu MAS» ni promet accions del lector', () => {
  const cos = contingutDeLaConnexio(MERCAT);
  expect(cos).toContain('Element connectat des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">Samarreta</a>.');
  expect(cos).toContain('Guardat per a llegir-lo més tard.');
  expect(cos).not.toMatch(/teu MAS|etiqueta'l|compartix-lo/);
});

test('el cos desat escapa el text i, sense ruta interna, no enllaça', () => {
  const cos = contingutDeLaConnexio({ itemId: 'x', titol: '<b>Fira</b>', autorNom: 'Pep "el Roig"', ruta: '//mal.example' });
  expect(cos).toContain('<strong>&lt;b&gt;Fira&lt;/b&gt;</strong>');
  expect(cos).toContain('de Pep &quot;el Roig&quot;');
  expect(cos).not.toContain('<a ');
});

test('al Mur ix l’origen citat amb l’enllaç de l’original, sense res del cos privat', () => {
  const mur = cosDeConnexioPerAlMur(MERCAT);
  expect(mur).toBe('<p>Compartit des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">Samarreta</a>.</p>');
  expect(mur).not.toMatch(/MAS|Guardat|Ordena/);
});

test('al Mur, sense ruta (o amb una que no és interna i segura), el títol sense enllaç i un avís', () => {
  for (const ruta of [undefined, '', '//mal.example', 'javascript:alert(1)']) {
    const mur = cosDeConnexioPerAlMur({ ...MERCAT, ruta });
    expect(mur).toContain('<strong>Samarreta</strong>');
    expect(mur).not.toContain('<a ');
    expect(mur).toContain('Esta publicació no porta l’enllaç de l’original.');
  }
});

test('al Mur, sense autor ni títol: la secció i l’element, mai «undefined»', () => {
  expect(cosDeConnexioPerAlMur({ itemId: 'u1', sectionId: 'perfil', ruta: '/gent/u1' }))
    .toBe('<p>Compartit des del directori: <a href="/gent/u1">u1</a>.</p>');
  const buit = cosDeConnexioPerAlMur(null);
  expect(buit).toContain('Compartit des de Sóc de Poble: <strong>un element</strong>.');
  expect(buit).not.toContain('undefined');
});

test('el paràgraf fix d’abans de T54 es lleva (amb qualsevol apòstrof); la resta del cos es queda', () => {
  const heretat = '<p>Element connectat des del Mercat: <a href="/mercat/x">X</a>.</p>'
    + '<p>Ordena\'l a les teues carpetes, etiqueta\'l i, si vols, compartix-lo al teu mur.</p>';
  for (const apostrof of ['\'', '’', '&#39;', '&#x27;', '&apos;']) {
    const net = senseParagrafHeretat(heretat.replaceAll('\'', apostrof));
    expect(net).toBe('<p>Element connectat des del Mercat: <a href="/mercat/x">X</a>.</p>');
  }
  expect(senseParagrafHeretat('<p>Ordena la teua faena.</p>')).toBe('<p>Ordena la teua faena.</p>');
  expect(senseParagrafHeretat(undefined)).toBe('');
});

/* T71 · Sense l'original, ningú s'inventa l'autor: ni «Sóc de Poble» ni el Foraster. */
test('signaturaDeCaiguda: un perfil es signa ell mateix; si no, l’autor que recorda l’origen; si no, ningú', () => {
  for (const objecte of ['persona', 'entitat', 'grup', 'ia']) {
    expect(signaturaDeCaiguda({ objecte, titol: 'Pepa Soler', autorNom: 'Una altra', ruta: '/gent/u1' }))
      .toEqual({ nom: 'Pepa Soler', ruta: '/gent/u1' });
  }
  expect(signaturaDeCaiguda({ objecte: 'persona', titol: 'Pepa', ruta: '//mal.example' })).toEqual({ nom: 'Pepa', ruta: '' });
  expect(signaturaDeCaiguda({ ...MERCAT })).toEqual({ nom: 'Sóc de Poble', ruta: '' });
  expect(signaturaDeCaiguda({ objecte: 'pagina', titol: 'Wiki', ruta: '/wikidepoble?item=x' })).toBeNull();
  expect(signaturaDeCaiguda({ objecte: 'persona', titol: '  ', autorNom: '' })).toBeNull();
  expect(signaturaDeCaiguda(null)).toBeNull();
});

/* ── T63.2 (doctrina del Mestre, 260928) · Comentar una connexió és comentar
   l'ORIGINAL: el seu xat comú, o el directe d'una persona o una IA. Mai la
   nota, que és privada i viu a /notes?nota=…. */
test('T63.2 · objecteDeConnexio: el descriptor de l’original, amb el tipus que l’origen recorda', () => {
  expect(objecteDeConnexio(MERCAT)).toEqual({
    tipus: 'producte', id: 'samarreta-socdepoble', titol: 'Samarreta', seccio: 'mercat', ruta: '/mercat/samarreta-socdepoble', autor: null
  });
  const ruta = rutaXatDePagina(objecteDeConnexio(MERCAT));
  expect(ruta).toBe('/xat?sobre=producte:samarreta-socdepoble&titol=Samarreta&ruta=%2Fmercat%2Fsamarreta-socdepoble');
  expect(ruta).not.toMatch(/nota/);
});

test('T63.2 · una persona o una IA connectada: el directe; una pàgina: la seua ruta', () => {
  const persona = { tipus: 'connexio', sectionId: 'perfil', itemId: 'u1', titol: 'Pepa', autorTipus: 'persona', ruta: '/gent/u1', objecte: 'persona' };
  expect(rutaXatDePagina(objecteDeConnexio(persona))).toBe('/xat?amb=u1');
  const anima = { tipus: 'connexio', sectionId: '', itemId: '/ia', ruta: '/ia', objecte: 'pagina', titol: 'Ànima' };
  expect(rutaXatDePagina(objecteDeConnexio(anima))).toBe('/xat?sobre=pagina:%2Fia&titol=%C3%80nima&ruta=%2Fia');
});

test('T63.2 · una connexió d’abans de T43 (sense objecte) pren el tipus de la secció, com ConnectarSection', () => {
  const vella = { ...MERCAT, objecte: undefined };
  expect(objecteDeConnexio(vella).tipus).toBe('producte');
  expect(objecteDeConnexio({ tipus: 'connexio', sectionId: 'events', itemId: 'aplec' }).tipus).toBe('esdeveniment');
  expect(objecteDeConnexio({ tipus: 'connexio', sectionId: 'perfil', itemId: 'o1', autorTipus: 'entitat' }).tipus).toBe('entitat');
  expect(objecteDeConnexio({ tipus: 'connexio', sectionId: '', itemId: 'x' }).tipus).toBe('pagina');
  // Un objecte fora de la llista tancada no mana.
  expect(objecteDeConnexio({ ...MERCAT, objecte: 'inventat' }).tipus).toBe('producte');
});

test('T63.2 · cap Pàgina Universal: un contingut de fora, una nota o res', () => {
  expect(objecteDeConnexio({ tipus: 'extern', url: 'https://exemple.cat/', titol: 'Fora' })).toBeNull();
  expect(objecteDeConnexio(null)).toBeNull();
  expect(objecteDeConnexio({})).toBeNull();
  // Una connexió a una nota és d'un tipus sense xat comú.
  expect(rutaXatDePagina(objecteDeConnexio({ tipus: 'connexio', sectionId: 'notes', itemId: 'n1', objecte: 'nota' }))).toBeNull();
  // Una ruta insegura de dades desades no viatja.
  expect(objecteDeConnexio({ ...MERCAT, ruta: '//mal.example' }).ruta).toBe('');
});
