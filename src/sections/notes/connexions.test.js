/* T54 · El cos d'una connexió: el que es desa a la nota (al MAS) i la
   presentació de l'original per al Mur.
   D1 (ordre del Mestre, 260930) · el paràgraf fix diu «Connectat», no «Guardat».
   D4 (excepció del Mestre, 260930) · al Mur ix el cos EDITAT de la connexió i
   la presentació només si el cos ja no enllaça l'original. */
import { expect, test } from 'vitest';
import {
  contingutDeLaConnexio, cosDeConnexioEditadaPerAlMur, cosDeConnexioPerAlMur, hrefsDe, objecteDeConnexio,
  senseParagrafHeretat, signaturaDeCaiguda
} from './connexions.js';
import { rutaXatDePagina } from '../../config/objecteConnectable.js';

const MERCAT = {
  tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta',
  autorNom: 'Sóc de Poble', ruta: '/mercat/samarreta-socdepoble', objecte: 'producte'
};

test('el cos desat enllaça l’element i no parla a «el teu MAS» ni promet accions del lector', () => {
  const cos = contingutDeLaConnexio(MERCAT);
  expect(cos).toContain('Element connectat des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">Samarreta</a>.');
  expect(cos).toContain('Connectat per a llegir-lo més tard.');
  expect(cos).not.toMatch(/teu MAS|etiqueta'l|compartix-lo|[Gg]uardat/);
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

/* ── D4 · el cos editat d'una connexió al Mur ── */
test('D4 · sense editar, el cos nascut en connectar ix sense el paràgraf privat i sense duplicar l’enllaç', () => {
  const mur = cosDeConnexioEditadaPerAlMur(contingutDeLaConnexio(MERCAT), MERCAT);
  expect(mur).toBe('<p>Element connectat des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">Samarreta</a>.</p>');
  expect(mur.split('href="/mercat/samarreta-socdepoble"')).toHaveLength(2);
});

test('D4 · editat: ix el text de la persona; si ja no enllaça l’original, s’hi afig la presentació amb l’autoria', () => {
  const propi = '<p>La samarreta de la festa, molt bonica.</p>';
  expect(cosDeConnexioEditadaPerAlMur(propi, MERCAT))
    .toBe(`${propi}<p>Compartit des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">Samarreta</a>.</p>`);
  /* Revisió de D4 (260930) · Abans esta prova donava per bo que el cos amb
     l'enllaç (reescrit per l'editor: atributs en un altre ordre, cometes
     simples) però SENSE el nom de qui signa ixquera tal qual, i el Mur quedava
     sense autoria. Ara l'enllaç sol no basta: s'hi afig la presentació amb
     «de Sóc de Poble». Amb el nom al cos, o sense autor a l'origen, tal qual. */
  const reescrit = '<p>Mira-la <a target="_blank" rel="noopener" href=\'/mercat/samarreta-socdepoble\'>ací</a>.</p>';
  const ambPresentacio = cosDeConnexioEditadaPerAlMur(reescrit, MERCAT);
  expect(ambPresentacio).toBe(`${reescrit}<p>Compartit des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">Samarreta</a>.</p>`);
  expect(ambPresentacio).toContain(' de Sóc de Poble');
  const ambNom = '<p>Mira-la <a target="_blank" rel="noopener" href=\'/mercat/samarreta-socdepoble\'>ací</a>, de sóc&nbsp;de\npoble.</p>';
  expect(cosDeConnexioEditadaPerAlMur(ambNom, MERCAT)).toBe(ambNom);
  expect(cosDeConnexioEditadaPerAlMur(reescrit, { ...MERCAT, autorNom: '' })).toBe(reescrit);
  // Un nom que només és dins d'un atribut (href, title) no cita ningú.
  const nomEnAtribut = '<p><a title="Sóc de Poble" href="/mercat/samarreta-socdepoble">ací</a></p>';
  expect(cosDeConnexioEditadaPerAlMur(nomEnAtribut, MERCAT)).toContain('Compartit des del Mercat de Sóc de Poble');
  // Un enllaç a una altra pàgina no és l'original.
  const altre = '<p><a href="/mercat/altra">altra</a></p>';
  expect(cosDeConnexioEditadaPerAlMur(altre, MERCAT)).toContain('Compartit des del Mercat');
});

test('D4 · els paràgrafs fixos privats (d’ara i d’abans) no ixen al Mur; buit, només la presentació', () => {
  const vell = '<p>Element connectat des del Mercat: <a href="/mercat/samarreta-socdepoble">X</a>.</p>'
    + '<p>Ordena\'l a les teues carpetes, etiqueta\'l i, si vols, compartix-lo al teu mur.</p>'
    + '<p>Guardat al teu MAS per a llegir-lo quan vulgues.</p><p>Guardat per a llegir-lo més tard.</p>';
  const mur = cosDeConnexioEditadaPerAlMur(vell, MERCAT);
  /* Revisió de D4 (260930) · Este cos vell enllaça l'original però no nomena
     qui el signa («Sóc de Poble»): ara hi va també la presentació amb
     l'autoria. Els paràgrafs privats continuen sense eixir. */
  expect(mur).toBe(`<p>Element connectat des del Mercat: <a href="/mercat/samarreta-socdepoble">X</a>.</p>${cosDeConnexioPerAlMur(MERCAT)}`);
  expect(mur).not.toMatch(/MAS|Guardat|Ordena|Connectat per a/);
  // Amb l'autor nomenat (el cos d'ara ho fa), només es lleven els paràgrafs privats.
  const vellAmbAutor = vell.replace('des del Mercat:', 'des del Mercat de Sóc de Poble:');
  expect(cosDeConnexioEditadaPerAlMur(vellAmbAutor, MERCAT))
    .toBe('<p>Element connectat des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">X</a>.</p>');
  expect(cosDeConnexioEditadaPerAlMur('', MERCAT)).toBe(cosDeConnexioPerAlMur(MERCAT));
  expect(cosDeConnexioEditadaPerAlMur(null, MERCAT)).toBe(cosDeConnexioPerAlMur(MERCAT));
});

test('D4 · sense ruta segura de l’original, la presentació va sempre, amb l’avís', () => {
  for (const ruta of ['', '//mal.example']) {
    const origen = { ...MERCAT, ruta };
    const mur = cosDeConnexioEditadaPerAlMur('<p>Text meu amb <a href="//mal.example">enllaç</a>.</p>', origen);
    expect(mur.startsWith('<p>Text meu amb')).toBe(true);
    expect(mur).toContain('Esta publicació no porta l’enllaç de l’original.');
  }
});

test('hrefsDe: dobles, simples i nues, amb les entitats desfetes una sola vegada', () => {
  expect(hrefsDe('<a href="/a?x=1&amp;y=2">a</a><a href=\'/b\'>b</a><a href=/c>c</a>')).toEqual(['/a?x=1&y=2', '/b', '/c']);
  expect(hrefsDe('<a href="?q=&amp;quot;">x</a>')).toEqual(['?q=&quot;']);
  expect(hrefsDe(undefined)).toEqual([]);
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
  const anima = { tipus: 'connexio', sectionId: '', itemId: '/iaia', ruta: '/iaia', objecte: 'pagina', titol: 'Ànima' };
  expect(rutaXatDePagina(objecteDeConnexio(anima))).toBe('/xat?sobre=pagina:%2Fiaia&titol=%C3%80nima&ruta=%2Fiaia');
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
