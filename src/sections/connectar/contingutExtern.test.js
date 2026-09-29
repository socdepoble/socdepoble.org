/**
 * T71 · El contingut de fora: es valida, es normalitza i es clona com una
 * nota editable a «Connectats». Només http o https; cap url tallada; cap
 * imatge externa.
 */
import { expect, test } from 'vitest';
import {
  LIMITS_EXTERN, citaDeLOrigenExtern, contingutExternDeParams, cosDeLExternPerAlMur, notaDeContingutExtern,
  validaContingutExtern
} from './contingutExtern.js';
import { MAXIM_LEMA } from '../../data/limitsText.js';
import { normalitzaOrigen } from '../../data/origenNota.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

const BO = { url: 'https://exemple.org/recepta', titol: 'Coca de llanda', subtitol: 'De la iaia', entradilla: 'Farina, ous i sucre.' };

test('un contingut bo: url normalitzada, lloc deduït i textos nets en una línia', () => {
  expect(validaContingutExtern({ ...BO, titol: '  Coca\u0007 de\n\nllanda  ' })).toEqual({
    ok: true,
    valor: { url: 'https://exemple.org/recepta', lloc: 'exemple.org', titol: 'Coca de llanda', subtitol: 'De la iaia', entradilla: 'Farina, ous i sucre.' }
  });
  // Sense títol, el lloc d'on ve (no s'inventa res).
  expect(validaContingutExtern({ url: 'http://exemple.org' }).valor).toMatchObject({ titol: 'exemple.org', subtitol: '', entradilla: '' });
});

test('javascript:, data: i la resta d’esquemes es rebutgen amb el motiu, i no hi ha nota', () => {
  for (const url of ['javascript:alert(document.cookie)', 'data:text/html;base64,PHNjcmlwdD4=', 'file:///etc/passwd', 'vbscript:x']) {
    const resultat = validaContingutExtern({ ...BO, url });
    expect(resultat.ok).toBe(false);
    expect(resultat.errors.url).toBe('Només es poden guardar adreces web (http o https).');
    expect(notaDeContingutExtern({ ...BO, url })).toBeNull();
  }
  expect(validaContingutExtern({ ...BO, url: '' }).errors.url).toBe('Falta l’adreça de la pàgina.');
  expect(validaContingutExtern({ ...BO, url: '/ia' }).errors.url).toBe('L’adreça no és vàlida.');
  expect(validaContingutExtern({ ...BO, url: 'https://u:p@exemple.org' }).errors.url).toMatch(/contrasenya/);
  expect(validaContingutExtern(null).ok).toBe(false);
});

test('la url que passa de 2048 caràcters es rebutja, no es talla', () => {
  const llarga = `https://exemple.org/${'a'.repeat(LIMITS_EXTERN.url)}`;
  const resultat = validaContingutExtern({ ...BO, url: llarga });
  expect(resultat.ok).toBe(false);
  expect(resultat.errors.url).toMatch(/2048 caràcters/);
  expect(notaDeContingutExtern({ ...BO, url: llarga })).toBeNull();
});

test('els límits dels textos: l’entradilla el de limitsText; es compten caràcters de veres i no es talla res', () => {
  expect(LIMITS_EXTERN.entradilla).toBe(MAXIM_LEMA);
  const justa = '🌾'.repeat(MAXIM_LEMA);
  expect(validaContingutExtern({ ...BO, entradilla: justa }).valor.entradilla).toBe(justa);
  const massa = validaContingutExtern({ ...BO, entradilla: `${justa}x`, titol: 't'.repeat(LIMITS_EXTERN.titol + 1) });
  expect(massa.ok).toBe(false);
  expect(massa.errors).toEqual({
    entradilla: `L’entradilla passa de ${MAXIM_LEMA} caràcters.`,
    titol: `El títol passa de ${LIMITS_EXTERN.titol} caràcters.`
  });
});

test('la query de /connectar: sense url no és cap contingut de fora; amb url, validat (titol o title)', () => {
  expect(contingutExternDeParams(new URLSearchParams('item_id=x&title=X'))).toBeNull();
  expect(contingutExternDeParams(null)).toBeNull();
  const params = new URLSearchParams({ url: BO.url, title: 'Per title', entradilla: BO.entradilla });
  expect(contingutExternDeParams(params).valor).toMatchObject({ titol: 'Per title', entradilla: BO.entradilla });
  params.set('titol', 'Per titol');
  expect(contingutExternDeParams(params).valor.titol).toBe('Per titol');
  expect(contingutExternDeParams(new URLSearchParams('url=javascript%3Aalert(1)')).ok).toBe(false);
});

test('la nota: textos escapats, un cos que cita d’on ve, «Connectats», cap imatge i un origen extern vàlid', () => {
  const nota = notaDeContingutExtern({ ...BO, titol: '<img src=x onerror=alert(1)> & "coca"' });
  expect(nota).toEqual({
    title: '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;coca&quot;',
    subtitle: 'De la iaia',
    lead: 'Farina, ous i sucre.',
    content: '<p>Font: <a href="https://exemple.org/recepta">exemple.org</a></p>',
    folderId: 'f-connectats',
    origen: { tipus: 'extern', url: 'https://exemple.org/recepta', titol: '<img src=x onerror=alert(1)> & "coca"' }
  });
  expect(nota).not.toHaveProperty('heroImage');
  expect(nota).not.toHaveProperty('coverImage');
  expect(normalitzaOrigen(nota.origen)).toMatchObject({ tipus: 'extern', lloc: 'exemple.org' });
  // Sense subtítol ni entradilla, cap clau buida; una altra carpeta, si es tria.
  const senseTextos = notaDeContingutExtern({ url: BO.url }, { carpeta: 'f-notes' });
  expect(senseTextos).not.toHaveProperty('subtitle');
  expect(senseTextos).not.toHaveProperty('lead');
  expect(senseTextos.folderId).toBe('f-notes');
});

test('la cita de l’origen escapa la url i, sense url vàlida, no cita res', () => {
  expect(citaDeLOrigenExtern({ url: 'https://exemple.org/?a=1&b="2"' }))
    .toBe('<p>Font: <a href="https://exemple.org/?a=1&amp;b=%222%22">exemple.org</a></p>');
  expect(citaDeLOrigenExtern({ url: 'javascript:alert(1)' })).toBe('');
  expect(citaDeLOrigenExtern(null)).toBe('');
});

/* ── T71b · el títol validat és el que es desa (revisió de T71: tall per unitats UTF-16) ── */
const ORFE = /[\uD800-\uDFFF]/u;
const titolDesat = (titol) => normalitzaOrigen(notaDeContingutExtern({ url: BO.url, titol }).origen).titol;

test('T71b · els emojis del títol es compten i es desen igual: el validat és el desat', () => {
  // La reproducció de la revisió: 200 emojis passen i es desen sencers, no 150.
  expect(titolDesat('🌾'.repeat(200))).toBe('🌾'.repeat(200));
  // 300 caràcters de veres (301 unitats UTF-16): cap surrogate orfe al final.
  const justa = `${'a'.repeat(LIMITS_EXTERN.titol - 1)}🌾`;
  expect(titolDesat(justa)).toBe(justa);
  expect(ORFE.test(titolDesat(justa))).toBe(false);
  expect(titolDesat('🌾'.repeat(LIMITS_EXTERN.titol))).toBe('🌾'.repeat(LIMITS_EXTERN.titol));
  // Un més ja no es desa tallat: es rebutja amb el motiu.
  const massa = validaContingutExtern({ ...BO, titol: '🌾'.repeat(LIMITS_EXTERN.titol + 1) });
  expect(massa.errors).toEqual({ titol: `El títol passa de ${LIMITS_EXTERN.titol} caràcters.` });
  expect(notaDeContingutExtern({ ...BO, titol: '🌾'.repeat(LIMITS_EXTERN.titol + 1) })).toBeNull();
});

test('T71b · un surrogate orfe a la query no arriba a validar-se ni a desar-se', () => {
  const valor = validaContingutExtern({ ...BO, titol: 'Coca\uD83C de llanda', subtitol: '\uDF3EDe la iaia' }).valor;
  expect(valor.titol).toBe('Coca de llanda');
  expect(valor.subtitol).toBe('De la iaia');
  expect(titolDesat('Coca\uD83C de llanda')).toBe('Coca de llanda');
  expect(JSON.stringify(notaDeContingutExtern({ url: BO.url, titol: '\uD83C🌾\uDF3E' }))).not.toMatch(/\\ud[89a-f]/i);
});

/* ── T71b · la cita de l'origen al Mur, una sola vegada ── */
const ORIGEN = { tipus: 'extern', url: 'https://exemple.org/recepta?id=7&pas=2' };
const CITA = citaDeLOrigenExtern(ORIGEN);
const vegades = (html) => html.split('Font:').length - 1;

test('T71b · el cos que ja porta la cita (la de naixement o la que reescriu l’editor) ix tal qual', () => {
  expect(cosDeLExternPerAlMur(CITA, ORIGEN)).toBe(CITA);
  // Després de passar pel sanejador (rel), i com la serialitza TipTap (atributs en un altre ordre, &amp;).
  const sanejada = sanitizeHtml(CITA);
  expect(cosDeLExternPerAlMur(sanejada, ORIGEN)).toBe(sanejada);
  const reescrita = '<p>La meua versió.</p><p>Font: <a target="_blank" rel="noopener noreferrer nofollow" href="https://exemple.org/recepta?id=7&amp;pas=2">exemple.org</a></p>';
  expect(cosDeLExternPerAlMur(reescrita, ORIGEN)).toBe(reescrita);
  expect(vegades(cosDeLExternPerAlMur(reescrita, ORIGEN))).toBe(1);
  // L'enllaç a l'origen, encara que la persona haja reescrit el paràgraf, ja cita d'on ve.
  const propi = '<p>La vaig trobar <a href=\'https://exemple.org/recepta?id=7&#38;pas=2\'>ací</a>.</p>';
  expect(cosDeLExternPerAlMur(propi, ORIGEN)).toBe(propi);
});

test('T71b · sense cap enllaç a l’origen, la cita va al final; sense url vàlida, el cos tal qual', () => {
  expect(cosDeLExternPerAlMur('<p>La meua recepta.</p>', ORIGEN)).toBe(`<p>La meua recepta.</p>${CITA}`);
  expect(cosDeLExternPerAlMur('', ORIGEN)).toBe(CITA);
  expect(cosDeLExternPerAlMur(null, ORIGEN)).toBe(CITA);
  // Un enllaç a una altra pàgina (o a la mateixa sense el paràmetre) no és la cita.
  const altra = '<p><a href="https://exemple.org/recepta?id=7">una altra</a></p>';
  expect(cosDeLExternPerAlMur(altra, ORIGEN)).toBe(`${altra}${CITA}`);
  expect(vegades(cosDeLExternPerAlMur(altra, ORIGEN))).toBe(1);
  // Les entitats es desfan una sola vegada: «&amp;quot;» és el text «&quot;», no unes cometes.
  expect(cosDeLExternPerAlMur('<a href="https://exemple.org/?q=&amp;quot;">x</a>', { url: 'https://exemple.org/?q="' }))
    .toContain('Font:');
  const literal = '<a href="https://exemple.org/?q=&amp;quot;">x</a>';
  expect(cosDeLExternPerAlMur(literal, { url: 'https://exemple.org/?q=&quot;' })).toBe(literal);
  expect(cosDeLExternPerAlMur('<p>x</p>', { url: 'javascript:alert(1)' })).toBe('<p>x</p>');
  expect(cosDeLExternPerAlMur('<p>x</p>', null)).toBe('<p>x</p>');
});
