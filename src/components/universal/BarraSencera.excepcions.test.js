// @vitest-environment node
/* IDEA-23 (Llibre Mestre; directiva del Mestre, àudio 261025 01:04) · Tota
   pàgina porta la barra estandarditzada sencera, amb CONNECTAR. Esta prova
   fa, a l'arbre sintàctic (@babel/parser, com clausura.test.js), dos censos
   de src/, cadascun amb la seua llista tancada:
   1. Sense barra blava (SENSE_BARRA_BLAVA). PageFrame només pinta la barra
      blava, i amb ella CONNECTAR, Comentar, Compartir i Traduir, amb
      `chrome` 'full', 'context' o 'system'; per defecte és 'page', i 'page',
      'none' o un mode inventat la deixen sense. Es compta cada element JSX
      UniversalPage o PageFrame que:
      · porta un `chrome` el valor del qual pot ser un literal sense barra
        (un altre text, null o undefined, també dins d'una ternària o a la
        dreta d'una lògica), o
      · no porta `chrome` ni cap escampada, llevat d'una UniversalPage dins
        d'un <ContentProvider initialConfig={NOM}> del mateix fitxer on NOM
        és un objecte amb `chrome` literal de barra (Mur, Mercat…).
   2. CONNECTAR apagat dins de la barra (EXCEPCIONS_DE_CONNECTAR):
      · un atribut JSX o una propietat d'objecte `onConnect` / `showConnect`
        el valor del qual pot ser el literal `false` (el literal mateix, una
        ternària o una lògica amb una branca `false`, una negació `!` o una
        comparació) i, per a `showConnect`, també el literal 0 o '':
        UniversalPage només l'amaga amb `onConnect === false`, i
        PageFrame/useAccions amb qualsevol `showConnect` fals que no siga
        null ni undefined (`showConnect ?? …`);
      · cada escampada (`{...NOM}`) d'una constant d'objecte que porta una
        d'eixes propietats (SENSE_ACCIONS_DE_XARXA).
   Cada cens ha de ser exactament la seua llista, cada excepció amb el seu
   motiu. Una pàgina nova mutilada per un d'eixos camins, o un lloc més en un
   fitxer de la llista, la posa en roig; llevar-ne un sense tocar la llista,
   també (trinquet).
   Fora del cens (no ho veu): els valors no literals (un identificador, una
   crida com Boolean(x), una prop que reenvien embolcalls com PaginaApp,
   TextSection o ItemDetailSection), un element sense `chrome` però amb
   escampades (hi pot vindre dins), una escampada posterior que sobreescriga
   `chrome`, un ContentProvider d'un altre fitxer, els components que no
   siguen UniversalPage ni PageFrame, les proves, src/sections/disseny/
   (espècimens de /disseny, carril de Gemini) i les dues definicions
   (UniversalPage.jsx i PageFrame.jsx). Les proves de comportament (el botó
   s'amaga de veres) són a PageFrame.connectar.test.jsx, i les de la barra
   blava per `chrome`, a PageFrame.barraTaronja.test.jsx. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();

/**
 * La llista tancada. `ocurrencies` compta els llocs del fitxer segons el cens
 * de dalt. Afegir-hi una excepció és una decisió del Mestre, no d'una IA.
 */
const EXCEPCIONS_DE_CONNECTAR = Object.freeze([
  { fitxer: 'src/sections/notes/ConnexioDetall.jsx', ocurrencies: 3,
    motiu: 'Lectura d’una connexió que ja és al Mas (dins del Bloc): tornar-la a connectar la duplicaria; Compartir i Comentar apunten a l’original.' },
  { fitxer: 'src/sections/notes/PublicacioDetall.jsx', ocurrencies: 2,
    motiu: 'Lectura d’una publicació pròpia vista des del Mas (i d’una pàgina del sistema): ja és al Mas, i Compartir envia la ruta de la publicació.' },
  { fitxer: 'src/sections/connectar/ConnectarSection.jsx', ocurrencies: 2,
    motiu: 'És la pàgina /connectar mateixa (connectar un element i desar un enllaç extern): un botó CONNECTAR ací seria recursiu.' },
  { fitxer: 'src/sections/notes/SnippetCurador.jsx', ocurrencies: 1,
    motiu: 'És el flux de desar un enllaç al Bloc (el mateix camí que Connectar): un botó CONNECTAR ací seria recursiu.' },
  { fitxer: 'src/sections/multimedia/PaginesEspaiMultimedia.jsx', ocurrencies: 3,
    motiu: 'Arxiu local del dispositiu (SENSE_ACCIONS_DE_XARXA: la definició i les dues pàgines que l’escampen): cap acció de xarxa ni URL que es puga compartir.' },
  { fitxer: 'src/sections/gestoria/historic/Historic.jsx', ocurrencies: 1,
    motiu: 'Gestoria: extractes bancaris privats, classificats en este ordinador; les dades fiscals no ixen del dispositiu.' },
  { fitxer: 'src/sections/gestoria/finestreta/Finestreta.jsx', ocurrencies: 1,
    motiu: 'Gestoria: fitxa legal privada, xifrada al cofre del dispositiu; les dades d’identitat no es connecten a cap Bloc.' },
  { fitxer: 'src/apps/gestoria/AppGestoria.jsx', ocurrencies: 2,
    motiu: 'Gestoria (Aprendre i Facturació): dades fiscals privades de l’App; no hi ha res públic que connectar.' },
  { fitxer: 'src/sections/gestoria/tauler/TargetaTauler.jsx', ocurrencies: 1,
    motiu: 'barraPrivada sense onAvis: la caiguda tancada de la Gestoria (amb onAvis la barra va sencera i inoperativa, amb el perquè).' },
  { fitxer: 'src/components/universal/CatalegWorkspace.jsx', ocurrencies: 1,
    motiu: 'Projecció d’una fitxa de catàleg (referència pendent o publicada): es connecta des de la fitxa original, no des de la referència.' },
  { fitxer: 'src/apps/nevera/vistes/RebostWorkspace.jsx', ocurrencies: 1,
    motiu: 'Rebost de la Nevera: inventari privat de casa, sense Compartir ni Comentar; no hi ha res públic que connectar.' },
  { fitxer: 'src/apps/bar/vistes/CatalegBarWorkspace.jsx', ocurrencies: 2,
    motiu: 'Carta privada del Bar (catàleg del dispositiu, privateItems): sense Compartir ni Comentar; no hi ha res públic que connectar.' },
  { fitxer: 'src/sections/profile/PerfilPublicSection.jsx', ocurrencies: 1,
    motiu: 'Condicional: sense rutaConnectarPerfil (perfil sense descriptor) no hi ha res a connectar; amb ruta, la barra porta CONNECTAR.' },
  { fitxer: 'src/pages/AvisadorPage.jsx', ocurrencies: 1,
    motiu: 'Eina privada de seguretat (Batec de Vida). Avui el showConnect={false} és inert: PageFrame sense chrome (\'page\') no pinta la barra blava (vegeu SENSE_BARRA_BLAVA). Es compta perquè, si la pàgina rep barra, CONNECTAR hi seguiria apagat.' }
]);

/**
 * La llista tancada del cens 1: pàgines sense barra blava, i per tant sense
 * CONNECTAR, Comentar, Compartir ni Traduir. Donar-los barra (chrome 'system'
 * o 'context') és un canvi visible: decisió del Mestre, no d'una IA.
 */
const SENSE_BARRA_BLAVA = Object.freeze([
  { fitxer: 'src/sections/admin/AdminSection.jsx', ocurrencies: 3,
    motiu: 'Ordre del Mestre 261003 (MD): el Tauler i el detall d’Usuaris i d’Entitats van sense barra blava; la capçalera de la columna porta la tornada (AdminSection.barraTaronja.test.jsx).' },
  { fitxer: 'src/pages/AvisadorPage.jsx', ocurrencies: 1,
    motiu: 'Eina privada de seguretat (Batec de Vida), PageFrame sense chrome. Cap ordre registrada ací: pendent de decisió del Mestre (mantindre-la sense barra o donar-n’hi).' },
  /* Onada R32.14 · La pàgina 404 ix d'esta llista: el 404 Pedra Seca de Gemini R32.13 (lot 03) porta
     chrome 'system', integrat per ordre del Mestre al pla 261119_1414_pla_implementacio_onada_r32_14. */
  { fitxer: 'src/sections/text/PaginesImportadesSection.jsx', ocurrencies: 1,
    motiu: 'Pàgina pública del fons documental (importacions-editorials, servida per PageDetailSection.jsx), UniversalPage sense chrome. Pendent de decisió del Mestre.' },
  { fitxer: 'src/sections/patrimoni/NaturaPatrimoniWorkspaceSection.jsx', ocurrencies: 1,
    motiu: 'Caiguda de la Llibreria quan no hi ha pàgina de text (la via normal, TextSection, porta barra): UniversalPage sense chrome. Pendent de decisió del Mestre.' }
]);

const PROPIETATS = new Set(['onConnect', 'showConnect']);
const esProva = (ruta) => /\.test\.jsx?$/.test(ruta);
const FORA = new Set(['src/components/universal/UniversalPage.jsx', 'src/components/universal/PageFrame.jsx']);

function fitxersDe(dir) {
  return readdirSync(path.join(ARREL, dir), { withFileTypes: true }).flatMap((entrada) => {
    const ruta = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return ruta === 'src/sections/disseny' ? [] : fitxersDe(ruta);
    return /\.jsx?$/.test(entrada.name) && !esProva(ruta) && !FORA.has(ruta) ? [ruta] : [];
  });
}

/* El valor pot acabar sent el literal `false`? Amb `ambFalsos` (showConnect,
   que useAccions llig amb `??`), també el literal 0 o ''. */
function potSerFalse(node, ambFalsos = false) {
  if (!node) return false;
  switch (node.type) {
    case 'BooleanLiteral': return node.value === false;
    case 'NumericLiteral': return ambFalsos && node.value === 0;
    case 'StringLiteral': return ambFalsos && node.value === '';
    case 'ConditionalExpression': return potSerFalse(node.consequent, ambFalsos) || potSerFalse(node.alternate, ambFalsos);
    case 'LogicalExpression': return node.operator === '&&' || potSerFalse(node.right, ambFalsos);
    case 'UnaryExpression': return node.operator === '!';
    case 'BinaryExpression': return ['===', '!==', '==', '!=', '<', '>', '<=', '>=', 'in', 'instanceof'].includes(node.operator);
    case 'ParenthesizedExpression':
    case 'TSAsExpression': return potSerFalse(node.expression, ambFalsos);
    case 'SequenceExpression': return potSerFalse(node.expressions.at(-1), ambFalsos);
    default: return false;
  }
}

const nomDeClau = (prop) => (prop.computed ? null : prop.key.type === 'Identifier' ? prop.key.name : prop.key.type === 'StringLiteral' ? prop.key.value : null);
const esPropietatQueApaga = (node) => node.type === 'ObjectProperty' && PROPIETATS.has(nomDeClau(node))
  && potSerFalse(node.value, nomDeClau(node) === 'showConnect');
const esAtributQueApaga = (node) => node.type === 'JSXAttribute' && PROPIETATS.has(node.name?.name)
  && node.value?.type === 'JSXExpressionContainer' && potSerFalse(node.value.expression, node.name.name === 'showConnect');

/* `pares` és la pila dels avantpassats del node visitat (el més pròxim, a la fi). */
function recorre(node, visita, pares = []) {
  if (!node || typeof node.type !== 'string') return;
  visita(node, pares);
  pares.push(node);
  for (const [clau, fill] of Object.entries(node)) {
    if (clau === 'loc' || clau === 'start' || clau === 'end' || clau.endsWith('Comments')) continue;
    if (Array.isArray(fill)) fill.forEach((f) => f && typeof f === 'object' && recorre(f, visita, pares));
    else if (fill && typeof fill === 'object') recorre(fill, visita, pares);
  }
  pares.pop();
}

const arbre = (codi) => parse(codi, { sourceType: 'module', plugins: ['jsx'], errorRecovery: false });

/* Object.freeze({ … }) o { … } directament. */
function objecteDe(init) {
  if (init?.type === 'ObjectExpression') return init;
  if (init?.type === 'CallExpression' && init.arguments[0]?.type === 'ObjectExpression') return init.arguments[0];
  return null;
}

/* Cens 1 · La barra blava. */
/* v1.2.17 · El mode de taulell (chrome 'feed', R32.26 · IDEA-305) també porta la barra blava (PageFrame, showBlueBar). */
const CHROMES_AMB_BLAVA = new Set(['full', 'context', 'system', 'feed']);
const PAGINES = new Set(['UniversalPage', 'PageFrame']);

/* El valor de `chrome` pot acabar sent un literal sense barra blava? */
function potSerSenseBlava(node) {
  if (!node) return true; // `chrome` sense valor val `true`, que no és cap mode
  switch (node.type) {
    case 'StringLiteral': return !CHROMES_AMB_BLAVA.has(node.value);
    case 'TemplateLiteral': return node.expressions.length === 0 && !CHROMES_AMB_BLAVA.has(node.quasis[0].value.cooked);
    case 'NullLiteral': return true;
    case 'Identifier': return node.name === 'undefined';
    case 'JSXExpressionContainer':
    case 'ParenthesizedExpression':
    case 'TSAsExpression': return potSerSenseBlava(node.expression);
    case 'ConditionalExpression': return potSerSenseBlava(node.consequent) || potSerSenseBlava(node.alternate);
    case 'LogicalExpression': return potSerSenseBlava(node.right);
    default: return false;
  }
}

const esChromeAmbBlava = (node) => node?.type === 'StringLiteral' && CHROMES_AMB_BLAVA.has(node.value);

/* Cada nom de constant del fitxer → és sempre un objecte amb `chrome` de barra? */
function configsAmbBlava(programa) {
  const noms = new Map();
  recorre(programa, (node) => {
    if (node.type !== 'VariableDeclarator' || node.id.type !== 'Identifier') return;
    const ambBlava = Boolean(objecteDe(node.init)?.properties.some((p) => p.type === 'ObjectProperty'
      && nomDeClau(p) === 'chrome' && esChromeAmbBlava(p.value)));
    noms.set(node.id.name, (noms.get(node.id.name) ?? true) && ambBlava);
  });
  return noms;
}

/* Una UniversalPage dins d'un ContentProvider del fitxer amb `chrome` de barra. */
function dinsDeConfigAmbBlava(pares, configs) {
  return pares.some((pare) => {
    if (pare.type !== 'JSXElement' || pare.openingElement.name.name !== 'ContentProvider') return false;
    const valor = pare.openingElement.attributes.find((a) => a.type === 'JSXAttribute' && a.name.name === 'initialConfig')?.value?.expression;
    if (valor?.type === 'Identifier') return configs.get(valor.name) === true;
    return Boolean(objecteDe(valor)?.properties.some((p) => p.type === 'ObjectProperty' && nomDeClau(p) === 'chrome' && esChromeAmbBlava(p.value)));
  });
}

function esPaginaSenseBlava(node, pares, configs) {
  if (node.type !== 'JSXOpeningElement' || node.name.type !== 'JSXIdentifier' || !PAGINES.has(node.name.name)) return false;
  const chrome = node.attributes.findLast((a) => a.type === 'JSXAttribute' && a.name.name === 'chrome');
  if (chrome) return potSerSenseBlava(chrome.value);
  if (node.attributes.some((a) => a.type === 'JSXSpreadAttribute')) return false;
  return !(node.name.name === 'UniversalPage' && dinsDeConfigAmbBlava(pares, configs));
}

function censDeSenseBlava(codis) {
  const cens = {};
  for (const [ruta, codi] of codis) {
    if (!/UniversalPage|PageFrame/.test(codi)) continue;
    const programa = arbre(codi).program;
    const configs = configsAmbBlava(programa);
    recorre(programa, (node, pares) => {
      if (esPaginaSenseBlava(node, pares, configs)) cens[ruta] = (cens[ruta] || 0) + 1;
    });
  }
  return cens;
}

const codisDeSrc = () => new Map(fitxersDe('src').map((ruta) => [ruta, readFileSync(path.join(ARREL, ruta), 'utf8')]));

/* Cens 2 · CONNECTAR apagat. */
function censDeConnectar(codis) {
  const cens = {};
  const suma = (ruta) => { cens[ruta] = (cens[ruta] || 0) + 1; };
  const constantsQueApaguen = new Set();
  for (const [ruta, codi] of codis) {
    if (!/onConnect|showConnect/.test(codi)) continue;
    recorre(arbre(codi).program, (node) => {
      if (esAtributQueApaga(node) || esPropietatQueApaga(node)) suma(ruta);
      if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier'
        && objecteDe(node.init)?.properties.some(esPropietatQueApaga)) constantsQueApaguen.add(node.id.name);
    });
  }
  for (const nom of constantsQueApaguen) {
    for (const [ruta, codi] of codis) {
      if (!codi.includes(`...${nom}`)) continue;
      recorre(arbre(codi).program, (node) => {
        if ((node.type === 'JSXSpreadAttribute' || node.type === 'SpreadElement')
          && node.argument.type === 'Identifier' && node.argument.name === nom) suma(ruta);
      });
    }
  }
  return cens;
}

const comptatge = (llista) => Object.fromEntries(llista.map((e) => [e.fitxer, e.ocurrencies]));

describe('IDEA-23 · barra sencera amb CONNECTAR', () => {
  const codis = codisDeSrc();

  test('les pàgines sense barra blava són exactament la llista tancada', () => {
    expect(censDeSenseBlava(codis)).toEqual(comptatge(SENSE_BARRA_BLAVA));
  });

  test('els llocs que apaguen CONNECTAR són exactament la llista tancada', () => {
    expect(censDeConnectar(codis)).toEqual(comptatge(EXCEPCIONS_DE_CONNECTAR));
  });

  test.each([['SENSE_BARRA_BLAVA', SENSE_BARRA_BLAVA], ['EXCEPCIONS_DE_CONNECTAR', EXCEPCIONS_DE_CONNECTAR]])(
    '%s: cada excepció porta el seu motiu i un sol registre per fitxer', (_nom, llista) => {
      const fitxers = llista.map((e) => e.fitxer);
      expect(new Set(fitxers).size).toBe(fitxers.length);
      for (const e of llista) {
        expect(e.motiu.trim().length, e.fitxer).toBeGreaterThan(20);
        expect(Number.isInteger(e.ocurrencies) && e.ocurrencies > 0, e.fitxer).toBe(true);
      }
    });

  test('el detector veu una pàgina nova sense barra blava (sense chrome, chrome sense barra, config)', () => {
    const casos = [
      ['<UniversalPage title="x" />', 1],
      ['<PageFrame title="x" showConnect={false} />', 1],
      ['<UniversalPage chrome="page" />', 1],
      ['<UniversalPage chrome={"none"} />', 1],
      ['<UniversalPage chrome={obert ? "context" : "inventat"} />', 1],
      ['<UniversalPage chrome={undefined} />', 1],
      ['<UniversalPage chrome="system" />', 0],
      /* v1.2.17 · El mode de taulell (R32.26 · IDEA-305) porta la barra blava. */
      ['<UniversalPage chrome="feed" />', 0],
      ['const config = { chrome: "feed" }; const A = () => <ContentProvider initialConfig={config}><UniversalPage /></ContentProvider>;', 0],
      ['<UniversalPage chrome={pagina.chrome || "full"} />', 0],
      ['<UniversalPage {...pagina} />', 0],
      ['const config = { chrome: "system" }; const A = () => <ContentProvider initialConfig={config}><UniversalPage /></ContentProvider>;', 0],
      ['const config = { chrome: "page" }; const A = () => <ContentProvider initialConfig={config}><UniversalPage /></ContentProvider>;', 1],
      ['const config = { chrome: "system" }; const A = () => <ContentProvider initialConfig={config}><PageFrame /></ContentProvider>;', 1]
    ];
    for (const [codi, n] of casos) {
      expect(censDeSenseBlava(new Map([['x.jsx', codi]]))['x.jsx'] ?? 0, codi).toBe(n);
    }
  });

  test('el detector veu una barra mutilada nova (atribut, ternària, objecte i escampada)', () => {
    const casos = [
      ['<UniversalPage title="x" onConnect={false} />', 1],
      ['<PageFrame title="x" showConnect={!publica} />', 1],
      ['<UniversalPage onConnect={pot ? () => obri() : false} />', 1],
      ['<UniversalPage onConnect={() => obri()} showConnect={true} />', 0],
      ['<PageFrame chrome="system" showConnect={0} />', 1],
      ['<UniversalPage onConnect={0} />', 0],
      ['const P = Object.freeze({ onConnect: false }); const A = () => <UniversalPage {...P} />;', 2]
    ];
    for (const [codi, n] of casos) {
      let vist = 0;
      const noms = new Set();
      recorre(arbre(codi).program, (node) => {
        if (esAtributQueApaga(node) || esPropietatQueApaga(node)) vist += 1;
        if (node.type === 'VariableDeclarator' && objecteDe(node.init)?.properties.some(esPropietatQueApaga)) noms.add(node.id.name);
      });
      recorre(arbre(codi).program, (node) => {
        if (node.type === 'JSXSpreadAttribute' && noms.has(node.argument.name)) vist += 1;
      });
      expect(vist, codi).toBe(n);
    }
  });
});
