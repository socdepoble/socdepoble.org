/**
 * Política universal de router (enxufe): taula de casos de les quatre peces.
 * La mateixa regla per a socdepoble.org, Sollutia i el banc de proves de
 * WordPress: sense declaració, memòria; amb base, amo només dins de la base.
 */
import { describe, expect, test } from 'vitest';
import { normalitzaBase, resolRuta, treuBase, triaRouter } from './politicaRouter.js';

// Els invisibles es construïxen per punt de codi: el font no en porta cap.
const amb = (punt) => `/a${String.fromCodePoint(punt)}b`;
// Meitat solta d'un parell subrogat: el parser d'URL la codifica com U+FFFD.
const SOLTA = String.fromCharCode(0xD800);

describe('normalitzaBase', () => {
  test.each([
    [undefined, '', 'absent'],
    [null, '', 'null'],
    [42, '', 'no és text'],
    [{}, '', 'objecte'],
    ['', '', 'buida'],
    ['/', '', 'l’arrel no és cap base'],
    ['/comunitat', '/comunitat', 'base simple'],
    ['/comunitat/', '/comunitat', 'barra final'],
    ['/comunitat///', '/comunitat', 'barres finals repetides'],
    ['/sdp/comunitat', '/sdp/comunitat', 'dos segments'],
    ['/pàgina', '/p%C3%A0gina', 'codificada com location.pathname'],
    ['/p%c3%a0gina', '/p%c3%a0gina', 'la caixa de les %xx declarades es conserva'],
    ['comunitat', '', 'sense barra inicial'],
    ['//amfitrio.test/comunitat', '', 'protocol relatiu'],
    ['https://amfitrio.test/comunitat', '', 'esquema'],
    ['javascript:alert(1)', '', 'esquema perillós'],
    ['/a//b', '', 'segment buit pel mig'],
    ['/a/./b', '', 'segment punt'],
    ['/a/../b', '', 'segment que puja'],
    ['/..', '', 'puja des de l’arrel'],
    ['/a/%2e%2e/b', '', 'punts codificats'],
    ['/a/%2E/b', '', 'punt codificat en majúscula'],
    ['/a\\b', '', 'barra invertida'],
    ['/\\amfitrio.test', '', 'barra invertida inicial'],
    ['/a b', '', 'espai'],
    [amb(0x09), '', 'tabulador'],
    [amb(0x0A), '', 'salt de línia'],
    [amb(0x00), '', 'NUL'],
    [amb(0x85), '', 'control C1'],
    [amb(0x200B), '', 'espai de zero amplada'],
    [amb(0x202E), '', 'marca bidi'],
    [amb(0x2066), '', 'aïllament bidi'],
    [amb(0xFEFF), '', 'BOM'],
    ['/a?x=1', '', 'consulta'],
    ['/a#x', '', 'fragment'],
  ])('%j → %j (%s)', (valor, esperat) => {
    expect(normalitzaBase(valor)).toBe(esperat);
  });
});

describe('treuBase', () => {
  test.each([
    ['/xat', '', '/xat', 'sense base, tal qual'],
    ['/xat', undefined, '/xat', 'base absent'],
    ['/xat', '//amfitrio.test', '/xat', 'base invàlida val com absent'],
    ['/comunitat', '/comunitat', '/', 'la base mateixa és l’arrel de l’app'],
    ['/comunitat/', '/comunitat', '/', 'la base amb barra final'],
    ['/comunitat/xat', '/comunitat', '/xat', 'ruta dins de la base'],
    ['/comunitat/xat/12', '/comunitat', '/xat/12', 'ruta fonda'],
    ['/comunitat/xat', '/comunitat/', '/xat', 'base amb barra final'],
    ['/comunitats', '/comunitat', null, 'veí de nom (límit de segment)'],
    ['/comunitats/xat', '/comunitat', null, 'veí de nom amb filla'],
    ['/', '/comunitat', null, 'arrel de l’amfitrió'],
    ['/blog/comunitat/xat', '/comunitat', null, 'la base pel mig no val'],
    ['/Comunitat/xat', '/comunitat', null, 'distingix majúscules'],
    [undefined, '/comunitat', null, 'camí absent amb base'],
    ['comunitat/xat', '/comunitat', null, 'camí sense barra inicial'],
    ['/comunitat//xat', '/comunitat', '//xat', 'segment buit després de la base, tal qual'],
  ])('%j sota %j → %j (%s)', (pathname, base, esperat) => {
    expect(treuBase(pathname, base)).toBe(esperat);
  });
});

describe('treuBase · forma canònica de la base (C8)', () => {
  test.each([
    // Caixa dels hexadecimals.
    ['/p%c3%a0gina/xat', '/pàgina', '/xat', 'camí en minúscula, base crua'],
    ['/p%C3%A0gina/xat', '/p%c3%a0gina', '/xat', 'camí en majúscula, base en minúscula'],
    ['/p%c3%a0gina/xat', '/p%C3%A0gina', '/xat', 'camí en minúscula, base en majúscula'],
    ['/p%c3%a0gina', '/p%C3%A0gina', '/', 'la base mateixa amb una altra caixa'],
    ['/p%C3%a0gina/', '/pàgina', '/', 'caixa mixta i barra final'],
    ['/sdp/p%c3%a0gina/xat', '/sdp/pàgina', '/xat', 'dos segments'],
    // UTF-8 cru contra codificat.
    ['/pàgina/xat', '/pàgina', '/xat', 'camí cru, base crua'],
    ['/pàgina/xat', '/p%C3%A0gina', '/xat', 'camí cru, base codificada'],
    ['/pàgina/xat', '/p%c3%a0gina', '/xat', 'camí cru, base en minúscula'],
    ['/Ã/xat', '/%C3', null, 'una Ã crua no és l’octet C3 sol'],
    // La resta és l'original i el límit continua sent de segment.
    ['/p%c3%a0gina/%c3%a0/Xat', '/pàgina', '/%c3%a0/Xat', 'la resta no es retoca'],
    ['/pàgina/à', '/p%C3%A0gina', '/à', 'la resta crua es torna crua'],
    ['/p%c3%a0gines/xat', '/pàgina', null, 'veí de nom codificat'],
    ['/P%c3%a0gina/xat', '/pàgina', null, 'la caixa de les lletres encara compta'],
    ['/p%c3%a0gina%2Fxat', '/pàgina', null, 'una barra codificada no és límit de segment'],
    ['/x/p%c3%a0gina/xat', '/pàgina', null, 'la base pel mig no val'],
    // No reservats (RFC 3986 §6.2.2.2).
    ['/comunit%61t/xat', '/comunitat', '/xat', 'lletra no reservada codificada'],
    ['/comunitat/xat', '/comunit%61t', '/xat', 'base amb una lletra no reservada codificada'],
    ['/comunit%41t/xat', '/comunitat', null, 'la %41 és una A, no una a'],
    // Codificacions invàlides: no es descodifiquen ni fan petar res.
    ['/p%zz/xat', '/p%zz', '/xat', '% sense hexadecimals, tal qual'],
    ['/%c3/xat', '/%C3', '/xat', 'octet UTF-8 incomplet: només la caixa'],
    ['/%e0%a4%A/xat', '/%E0%A4%A', '/xat', 'seqüència tallada'],
    ['/%e0%a4%a/xat', '/%E0%A4%A', null, 'la lletra d’una % sense dos hexadecimals és literal'],
    ['/%%61/xat', '/%%61', '/xat', '% solta davant d’una %XX'],
    ['/%25C3/xat', '/%C3', null, 'un % literal no és l’octet'],
    ['/%C3/xat', '/%25C3', null, 'l’octet no és un % literal'],
    ['/%25zz/xat', '/%zz', null, '%25 no és una % solta'],
    [`/${SOLTA}/xat`, `/${SOLTA}`, '/xat', 'meitat solta de parell subrogat'],
    ['/%EF%BF%BD/xat', `/${SOLTA}`, '/xat', 'la meitat solta val U+FFFD, com al parser d’URL'],
  ])('%j sota %j → %j (%s)', (pathname, base, esperat) => {
    expect(treuBase(pathname, base)).toBe(esperat);
  });
});

describe('resolRuta', () => {
  test.each([
    ['/mur', '/xat', '/mur', 'absoluta, tal qual'],
    ['/mur?data=2026-09-29#dia', '/xat', '/mur?data=2026-09-29#dia', 'absoluta amb consulta i fragment'],
    ['../wikidepoble', '/skills', '/wikidepoble', 'germana des del primer nivell'],
    ['../wikidepoble', '/xat/12', '/wikidepoble', 'puja un nivell'],
    ['fil', '/xat/12', '/xat/fil', 'relativa al directori'],
    ['fil', '/xat/', '/xat/fil', 'relativa dins d’una carpeta'],
    ['./', '/xat/12', '/xat/', 'el directori actual'],
    ['?q=sella', '/cerca', '/cerca?q=sella', 'només consulta'],
    ['#privacitat', '/legal', '/legal#privacitat', 'només fragment'],
    ['../../../../mur', '/a', '/mur', 'no puja més enllà de l’arrel de l’app'],
    ['xat', undefined, '/xat', 'ruta actual absent'],
    ['xat', 'no-absoluta', '/xat', 'ruta actual invàlida'],
    ['xat', '//amfitrio.test/a', '/xat', 'ruta actual de protocol relatiu'],
    ['https://amfitrio.test/x', '/', null, 'un altre origen'],
    ['//amfitrio.test/x', '/', null, 'protocol relatiu'],
    ['/\\amfitrio.test/x', '/', null, 'barra invertida que obri un host'],
    [`/${String.fromCodePoint(0x09)}/amfitrio.test`, '/', null, 'tabulador que el parser lleva'],
    ['javascript:alert(1)', '/', null, 'esquema perillós'],
    ['mailto:veins@poble.test', '/', null, 'correu'],
    [undefined, '/', null, 'destí absent'],
    [42, '/', null, 'destí no text'],
  ])('%j des de %j → %j (%s)', (to, actual, esperat) => {
    expect(resolRuta(to, actual)).toBe(esperat);
  });

  test('sense ruta actual, resol sobre l’arrel', () => {
    expect(resolRuta('pobles/sella')).toBe('/pobles/sella');
  });
});

describe('triaRouter', () => {
  const MEMORIA = { memoria: true, basename: '' };
  test.each([
    [{ routerType: 'browser', basename: '/comunitat' }, { primeraInstancia: false }, MEMORIA, 'una segona instància mai és ama de la URL'],
    [{ routerType: 'memory', basename: '/comunitat' }, undefined, MEMORIA, 'memòria declarada guanya a la base'],
    [{ routerType: 'browser' }, undefined, { memoria: false, basename: '' }, 'el #root de socdepoble.org'],
    [{ routerType: 'browser', basename: '/comunitat/' }, undefined, { memoria: false, basename: '/comunitat' }, 'navegador amb base'],
    [{ routerType: 'browser', basePath: '/comunitat' }, undefined, { memoria: false, basename: '/comunitat' }, 'basePath com a base'],
    [{ routerType: 'browser', basename: '//amfitrio.test' }, undefined, { memoria: false, basename: '' }, 'base invàlida no es fa servir'],
    [{ basename: '/comunitat' }, undefined, { memoria: false, basename: '/comunitat' }, 'base declarada sense tipus'],
    [{ basePath: '/comunitat/' }, undefined, { memoria: false, basename: '/comunitat' }, 'basePath declarat sense tipus'],
    [{ basePath: '/' }, undefined, MEMORIA, 'l’arrel no és cap declaració'],
    [{ basename: 'https://amfitrio.test/' }, undefined, MEMORIA, 'una URL no és cap base'],
    [{ routerType: 'altre' }, undefined, MEMORIA, 'tipus desconegut'],
    [{}, undefined, MEMORIA, 'element incrustat sense declaració'],
    [{}, { primeraInstancia: true }, MEMORIA, 'primera instància sense declaració'],
    [null, undefined, MEMORIA, 'config null'],
    ['browser', undefined, MEMORIA, 'config que no és objecte'],
  ])('%j %j → %j (%s)', (config, opcions, esperat) => {
    expect(triaRouter(config, opcions)).toEqual(esperat);
  });

  test('sense arguments, memòria', () => {
    expect(triaRouter()).toEqual(MEMORIA);
  });

  test('el resultat és immutable', () => {
    expect(Object.isFrozen(triaRouter({ routerType: 'browser' }))).toBe(true);
    expect(Object.isFrozen(triaRouter())).toBe(true);
  });
});
