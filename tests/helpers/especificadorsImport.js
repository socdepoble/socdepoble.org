/* Suport de proves · Gauntlet 261030, cicle 3 (troballa
   inercia-per-text-cru-falsos-rojos) · Què importa de veres un fitxer, llegit
   de l'AST i no del text cru.
   · PER QUÈ: tres proves d'inèrcia («cap fitxer de producció l'importa
     encara») buscaven el nom del mòdul en el text sencer, comentaris inclosos.
     Un comentari que només el nomenava les posava en roig sense cap import, i
     el roig es va apagar reescrivint el comentari, no la prova. Una prova que
     castiga documentar inverteix l'incentiu (el mateix motiu que
     tooling/lib/codi.mjs).
   · QUÈ COMPTA COM A IMPORTAR: import … from '…', import '…', export … from
     '…', import('…'), require('…'), import.meta.glob('…' o ['…']) i
     new URL('…', import.meta.url). Només l'especificador literal (cadena o
     plantilla sense expressions). Un comentari, o una cadena qualsevol (la
     prosa de la Wiki que porta wikiManifest.js), no és un import.
   · El nom es compara amb el darrer tros de l'especificador, sense consulta
     (?raw), fragment ni extensió: './avisosPush.js', '@/pwa/avisosPush' i
     '../pwa/avisosPush.js?url' nomenen avisosPush; './avisosPushNatius.js',
     no. Sense resoldre àlies: davant el dubte, roig.
   · Fallada tancada: un fitxer candidat que @babel/parser (ja al
     package.json) no sap llegir llança; mai un verd per silenci.
   Res d'ací no és codi de producció: només l'importen les proves. */
import { parse } from '@babel/parser';

const EXTENSIO = /\.(?:[cm]?jsx?|tsx?)$/;
const CLAUS_SENSE_CODI = new Set(['loc', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'errors']);

const literal = (node) => {
  if (node?.type === 'StringLiteral') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
};
const esImportMeta = (node) => node?.type === 'MetaProperty' && node.meta?.name === 'import' && node.property?.name === 'meta';
const propietat = (node) => (node?.type === 'MemberExpression' && !node.computed ? node.property?.name : null);

/** Els especificadors literals de tot el que el fitxer importa, en l'ordre del codi. */
export function especificadorsImport(text, fitxer = '') {
  const ast = parse(text, { sourceType: 'unambiguous', plugins: ['jsx', ...(/\.tsx?$/.test(fitxer) ? ['typescript'] : [])] });
  const trobats = [];
  const afig = (node) => {
    const valor = literal(node);
    if (valor !== null) trobats.push(valor);
  };
  const visita = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visita);
      return;
    }
    if (['ImportDeclaration', 'ExportAllDeclaration', 'ExportNamedDeclaration', 'ImportExpression'].includes(node.type)) afig(node.source);
    else if (node.type === 'CallExpression') {
      const [primer] = node.arguments;
      if (node.callee.type === 'Import' || (node.callee.type === 'Identifier' && node.callee.name === 'require')) afig(primer);
      else if (propietat(node.callee) === 'glob' && esImportMeta(node.callee.object)) {
        if (primer?.type === 'ArrayExpression') primer.elements.forEach(afig);
        else afig(primer);
      }
    } else if (node.type === 'NewExpression' && node.callee.type === 'Identifier' && node.callee.name === 'URL'
      && propietat(node.arguments[1]) === 'url' && esImportMeta(node.arguments[1].object)) afig(node.arguments[0]);
    for (const [clau, fill] of Object.entries(node)) if (!CLAUS_SENSE_CODI.has(clau)) visita(fill);
  };
  visita(ast.program);
  return trobats;
}

/** El nom de mòdul que nomena un especificador: './x/avisosPush.js?raw' → 'avisosPush'. */
export function nomDelModul(especificador) {
  const cami = String(especificador).split(/[?#]/)[0];
  return cami.slice(cami.lastIndexOf('/') + 1).replace(EXTENSIO, '');
}

/** Cert si el codi importa (de qualsevol de les formes de dalt) un mòdul amb este nom.
 *  El prefiltre és el mateix text cru d'abans: un fitxer que no conté el nom
 *  ni s'analitza, i cap import de veres no se'n pot escapar. */
export function importaElModul(text, nom, fitxer = '') {
  if (!String(text).includes(nom)) return false;
  return especificadorsImport(text, fitxer).some((especificador) => nomDelModul(especificador) === nom);
}
