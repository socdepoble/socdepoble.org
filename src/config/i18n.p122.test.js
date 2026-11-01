// @vitest-environment node
/* T5a · P1-22 (assalt 261101; TE-02 generalitzat) · GUARDA AST CONTRA ELS
   LITERALS VISIBLES. i18n.usades.test.js mira que cada clau demanada existisca;
   esta mira l'altra meitat: que un fitxer que ja passa pel traductor no torne
   a pintar un text en valencià a pèl. Es llig la font amb @babel/parser (ja
   és devDependency; cap mòdul de producció s'importa) i falla en:
    · un JSXText amb lletres;
    · un atribut visible (aria-label, title, titol, etiqueta, ajuda…) amb un
      literal o una plantilla amb lletres, també dins d'un ternari o d'un &&;
    · un fill {…} que és un literal amb lletres ({cond ? 'Sí' : 'No'});
    · una propietat d'objecte visible ({ etiqueta: 'Membre' }) o un valor per
      defecte d'una prop visible ({ titol = 'Hola' }) amb un literal amb lletres;
      també amb sufix (etiquetaDesa, titolDialeg…);
    · una plantilla literal com a primer argument d'omple() (omple('Llevar:
      {nom}', …)), on siga: els marcadors {…} no compten com a lletres.
   No entra dins de cap altra crida: la reserva de t('clau', 'Text') i de
   tradueix(t, ['clau', 'Text']) és legítima (la porta i18n.usades). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';

const ARREL = process.cwd();

/* Els fitxers de P1-22 que ja passen sencers pel traductor. Cada carril hi
   afig els seus, un per línia, dins del seu bloc. */
const FITXERS = Object.freeze([
  /* T5a · la gestió dels membres i la privacitat */
  'src/sections/profile/GestioMembres.jsx',
  'src/sections/profile/DetallPrivacitat.jsx',
  /* T5b · Connectar */
  'src/sections/connectar/ConnectarSection.jsx',
  'src/sections/connectar/ResumConnexio.jsx',
  /* T5c · L'enquadrament */
  'src/components/universal/enquadrament/DialegEnquadrament.jsx',
  'src/components/universal/enquadrament/UbicacioImatge.jsx',
]);

/* Excepcions (`fitxer:línia tipus «text»`). Buida: cap marca no ho necessita. */
const ADMESOS = new Set([]);

/* Els noms d'atribut o de prop que es lligen. Les props de text de la casa,
   també amb sufix en camelCase (etiquetaDesa, etiquetaConfirma, titolDialeg).
   Patró ancorat i sense alternatives niades: cap retrocés. */
const VISIBLE = /^(?:aria-(?:label|valuetext|description|roledescription|placeholder)|title|placeholder|alt|lead|subtitle|textTriada|(?:titol|etiqueta|llegenda|ajuda|descripcio)(?:[A-Z]\w*)?)$/;
const esVisible = (nom) => typeof nom === 'string' && VISIBLE.test(nom);
const LLETRES = /\p{L}{2,}/u;
const MARCADOR = /\{\w+\}/g;
const esOmple = (callee) => (callee?.type === 'Identifier' && callee.name === 'omple')
  || (callee?.type === 'MemberExpression' && callee.property?.type === 'Identifier' && callee.property.name === 'omple');
const OMESOS = new Set(['loc', 'start', 'end', 'range', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'comments', 'tokens']);

const nomDeClau = (clau) => (clau?.type === 'Identifier' ? clau.name : clau?.type === 'StringLiteral' ? clau.value : null);

/** Els trossos literals amb lletres que una expressió pot pintar tal qual (sense entrar a cap crida). */
function literalsDe(node) {
  if (!node) return [];
  switch (node.type) {
    case 'StringLiteral': return LLETRES.test(node.value) ? [node.value] : [];
    case 'TemplateLiteral': return [
      ...node.quasis.map((q) => q.value.cooked ?? q.value.raw).filter((text) => LLETRES.test(text)),
      ...node.expressions.flatMap(literalsDe),
    ];
    case 'ConditionalExpression': return [...literalsDe(node.consequent), ...literalsDe(node.alternate)];
    case 'LogicalExpression': return [...literalsDe(node.left), ...literalsDe(node.right)];
    case 'BinaryExpression': return node.operator === '+' ? [...literalsDe(node.left), ...literalsDe(node.right)] : [];
    case 'JSXExpressionContainer':
    case 'ParenthesizedExpression':
    case 'TSAsExpression': return literalsDe(node.expression);
    case 'SequenceExpression': return literalsDe(node.expressions.at(-1));
    default: return [];
  }
}

/** Cada literal visible de la font: `fitxer:línia tipus «text»`. */
function literalsVisibles(font, fitxer = 'font.jsx') {
  const ast = parse(font, { sourceType: 'module', plugins: ['jsx'] });
  const trobats = [];
  const anota = (node, tipus, text) => trobats.push(`${fitxer}:${node.loc.start.line} ${tipus} «${text.trim()}»`);
  const pila = [ast.program];
  while (pila.length) {
    const node = pila.pop();
    if (!node || typeof node.type !== 'string') continue;
    if (node.type === 'JSXText' && LLETRES.test(node.value.trim())) anota(node, 'JSXText', node.value);
    if (node.type === 'JSXAttribute' && esVisible(node.name?.name)) {
      for (const text of literalsDe(node.value)) anota(node, node.name.name, text);
    }
    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      for (const fill of node.children) {
        if (fill.type === 'JSXExpressionContainer') for (const text of literalsDe(fill.expression)) anota(fill, 'fill', text);
      }
    }
    if (node.type === 'ObjectProperty' && esVisible(nomDeClau(node.key))) {
      const valor = node.value?.type === 'AssignmentPattern' ? node.value.right : node.value;
      for (const text of literalsDe(valor)) anota(node, nomDeClau(node.key), text);
    }
    /* omple() pinta la seua plantilla: si és un literal, és un text a pèl. */
    if (node.type === 'CallExpression' && esOmple(node.callee)) {
      for (const text of literalsDe(node.arguments[0])) {
        if (LLETRES.test(text.replace(MARCADOR, ' '))) anota(node, 'omple', text);
      }
    }
    for (const [clau, valor] of Object.entries(node)) {
      if (OMESOS.has(clau)) continue;
      if (Array.isArray(valor)) for (let i = valor.length - 1; i >= 0; i -= 1) pila.push(valor[i]);
      else if (valor && typeof valor === 'object') pila.push(valor);
    }
  }
  return trobats.sort();
}

describe('P1-22 · cap literal visible als fitxers que ja passen pel traductor', () => {
  test.each(FITXERS)('%s', (fitxer) => {
    const font = readFileSync(path.join(ARREL, fitxer), 'utf8');
    expect(literalsVisibles(font, fitxer).filter((trobat) => !ADMESOS.has(trobat))).toEqual([]);
  });

  test('cap excepció admesa sobra', () => {
    const tots = new Set(FITXERS.flatMap((fitxer) => literalsVisibles(readFileSync(path.join(ARREL, fitxer), 'utf8'), fitxer)));
    expect([...ADMESOS].filter((admes) => !tots.has(admes))).toEqual([]);
  });
});

describe('la guarda mossega (sonda)', () => {
  test('troba cada forma d’un literal visible', () => {
    const font = [
      "export const OPCIONS = [{ valor: 'm', etiqueta: 'Membre' }];",
      "export function A({ titol = 'Per defecte', esJo }) {",
      '  return (',
      '    <div>',
      '      <p>Hola</p>',
      '      <B aria-label="Tanca" titol={\'Títol\'} ajuda={`Escriu ${n} lletres`} etiqueta={esJo ? \'Sí\' : \'No\'} />',
      "      <p>{esJo ? ' (tu)' : ''}{'Llevar'}</p>",
      "      <D etiquetaDesa=\"Desa\" titolDialeg={'Retalla'} aria-label={omple('Llevar: {nom}', { nom })} />",
      '    </div>',
      '  );',
      '}',
      "const AVIS = omple(`${n} fotos de {nom}`, { nom });",
      "const RECOMPTE = moderacio.omple('Queden {n}', { n });",
    ].join('\n');
    expect(literalsVisibles(font)).toEqual([
      'font.jsx:1 etiqueta «Membre»',
      'font.jsx:2 titol «Per defecte»',
      'font.jsx:5 JSXText «Hola»',
      'font.jsx:6 aria-label «Tanca»',
      'font.jsx:6 ajuda «Escriu»',
      'font.jsx:6 ajuda «lletres»',
      'font.jsx:6 etiqueta «No»',
      'font.jsx:6 etiqueta «Sí»',
      'font.jsx:6 titol «Títol»',
      'font.jsx:7 fill «(tu)»',
      'font.jsx:7 fill «Llevar»',
      'font.jsx:8 etiquetaDesa «Desa»',
      'font.jsx:8 titolDialeg «Retalla»',
      'font.jsx:8 omple «Llevar: {nom}»',
      'font.jsx:12 omple «fotos de {nom}»',
      'font.jsx:13 omple «Queden {n}»',
    ].sort());
  });

  test('deixa passar el traductor, les classes, els buits i els noms propis de les dades', () => {
    const font = [
      "const PARELL = ['section.x.hola', 'Hola'];",
      'export function A({ t, nom }) {',
      '  return (',
      '    <div className="perfil-compte__text" role="status">',
      "      <p aria-label={`${t('section.x.tanca', 'Tanca')}: ${nom}`}>{t('section.x.hola', 'Hola')}</p>",
      "      <B titol={tradueix(t, PARELL)} alt=\"\" etiqueta={omple(t('section.x.n', '{n} lletres'), { n: 2 })} />",
      "      {' '}{nom || '—'}{' · '}",
      "      <D etiquetaDesa={t('section.x.desa', 'Desa')} etiquetaId=\"\" aria-label={omple('{nom} · {org}', { nom, org })} />",
      '    </div>',
      '  );',
      '}',
      "const etiquetaDeRol = (rol) => omple(tradueix(t, PARELL), { rol });",
    ].join('\n');
    expect(literalsVisibles(font)).toEqual([]);
  });

  test('les fonts de la llista existixen i porten JSX', () => {
    expect(FITXERS.length).toBeGreaterThanOrEqual(2);
    for (const fitxer of FITXERS) expect(readFileSync(path.join(ARREL, fitxer), 'utf8')).toMatch(/<\w/);
  });
});

/* T5a · D-9 (assalt 261101) · POLIMENT D'EU I GL. Els valors que s'havien
   quedat en valencià (claus de la Consola, el Control, la Gestoria, els
   Dispositius i el perfil antic) ja no ho tornen a ser, i la nota dels ajustos
   del xat cita «Privacitat i dades» amb el nom que l'apartat té en cada
   llengua. La revisió nadiua humana continua pendent per al 10/10. */
describe('D-9 · eu i gl sense valencià que s’hi haja quedat', () => {
  const POLIDES = {
    eu: ['section.dispositius.kicker', 'section.dispositius.title', 'section.dispositius.subtitle', 'section.control.kicker',
      'section.gestoria.kicker', 'section.gestoria.title', 'section.gestoria.subtitle', 'section.gestoria.meta2',
      'section.consola.title', 'section.consola.subtitle', 'section.consola.lead'],
    gl: ['section.control.kicker', 'section.gestoria.kicker', 'section.gestoria.title', 'section.gestoria.subtitle',
      'section.gestoria.meta2', 'section.consola.title', 'section.consola.subtitle', 'section.consola.lead',
      'section.myprofile.success', 'section.myprofile.error', 'section.myprofile.title', 'section.myprofile.subtitle'],
  };
  const DICS = { es: ES, en: EN, eu: EU, gl: GL };

  test.each(Object.keys(POLIDES))('%s: cap de les claus polides no és el valor valencià', (codi) => {
    expect(POLIDES[codi].filter((clau) => typeof DICS[codi][clau] !== 'string' || DICS[codi][clau] === CA[clau])).toEqual([]);
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: la nota de «Privacitat» del xat cita l’apartat amb el seu nom en la mateixa llengua', (codi) => {
    const dic = codi === 'ca' ? CA : DICS[codi];
    const apartat = dic['section.perfil.privacitat.pagina.titol'];
    for (const clau of ['section.xat.ajustos.privacitat.nota', 'section.xat.ajustos.privacitat.notaSense']) {
      expect([clau, dic[clau].includes(apartat)]).toEqual([clau, true]);
      if (codi !== 'ca') expect([clau, dic[clau].includes(CA['section.perfil.privacitat.pagina.titol'])]).toEqual([clau, false]);
    }
  });
});
