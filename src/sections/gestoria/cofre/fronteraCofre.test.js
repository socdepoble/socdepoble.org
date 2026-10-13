// @vitest-environment node
/* Gestoria · la frontera del cofre xifrat (revisió adversarial de seguretat
   de l'Onada 6, 261009, després de la integració; ordre del Mestre del
   261009: «seguretat 1000x1000»).
   tractors/clausura.test.js comprova que cada fitxer del graf és a les fonts
   d'ALGUN manifest, i des de la integració eixa unió també porta les fonts de
   'gestoria.historic' (el cofre, l'Històric, les despeses i la simulació).
   Per al Tauler i l'Històric hi ha una prova per tractor; per als dos signats
   (factures i correus), no. Si un fitxer signat començara a importar el
   cofre, la prova de la unió continuaria verda i la signatura nova no
   cobriria el cofre: un canvi posterior del cofre no tornaria l'aprovació a
   «pendent». Esta prova tanca eixe forat sense tocar cap guarda ni cap font
   signada:
     · el graf dels tres tractors signats o d'abans (factures, correus i
       Tauler) no arriba al cofre, a l'Històric, a les despeses ni a la
       simulació;
     · el graf de les entrades de factures i correus és a les fonts d'eixos
       dos manifests (més tractors.js, que la clausura ja declara a part);
     · fora del cofre, només l'Històric l'importa.
   Les sondes comproven que el lector d'importacions troba de veres el que
   busca: una porta que no mira res no diu res.
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H; decisió de la
   direcció: la Fitxa d'identitat viu darrere de PortaCofre, a la col·lecció
   'identitat'): Derogat EN PART el «fora del cofre, només l'Històric
   l'importa» del 261009. Ara l'importen exactament l'Històric i la
   Finestreta, i els sis fitxers del cofre són també fonts de
   'gestoria.identitat' (un canvi del cofre torna les dues aprovacions a
   «pendent»). La resta es manté i s'amplia: el graf de factures, correus,
   el Tauler i l'Escàner (front D) no arriba al cofre, a l'Històric, a les
   despeses, a la simulació ni a la Finestreta. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';
import { TRACTOR_CORREUS, TRACTOR_FACTURES, TRACTOR_HISTORIC, TRACTOR_IDENTITAT } from '../tractors.js';

const ARREL = process.cwd();
const GESTORIA = 'src/sections/gestoria';
const TRACTORS = 'src/sections/tractors';
const ENTRADES_SIGNATS = Object.freeze([`${GESTORIA}/ContenidorGestoria.jsx`, `${GESTORIA}/nucli/tractor.js`]);
const ENTRADES_TAULER = Object.freeze([`${GESTORIA}/tauler/ShellGestoria.jsx`, `${GESTORIA}/tauler/nucli/tractorTauler.js`]);
const ENTRADES_HISTORIC = Object.freeze([`${GESTORIA}/historic/Historic.jsx`, `${GESTORIA}/historic/nucli/tractorHistoric.js`]);
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, fronts D i H): l'Escàner Local i la Finestreta. */
const ENTRADES_ESCANER = Object.freeze([
  `${GESTORIA}/escaner/PanellEscaner.jsx`, `${GESTORIA}/escaner/useEscaner.js`, `${GESTORIA}/escaner/nucli/tractorEscaner.js`
]);
const ENTRADES_IDENTITAT = Object.freeze([`${GESTORIA}/finestreta/Finestreta.jsx`, `${GESTORIA}/finestreta/nucli/tractorIdentitat.js`]);
/* La Finestreta tampoc no pot penjar dels tractors d'abans ni de l'Escàner: llig papers d'identitat. */
const delaFinestreta = (ruta) => ruta.startsWith(`${GESTORIA}/finestreta/`);
/* La mateixa excepció que tractors/clausura.test.js (LLISTA_BLANCA): els manifests. */
const MANIFESTS = `${GESTORIA}/tractors.js`;

const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const existix = (ruta) => existsSync(path.join(ARREL, ruta));
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');
const dinsCarrils = (ruta) => ruta.startsWith(`${GESTORIA}/`) || ruta.startsWith(`${TRACTORS}/`);
/* El que és de l'Històric i no pot penjar dels tractors d'abans. */
const delHistoric = (ruta) => ['cofre/', 'historic/', 'despeses/'].some((carpeta) => ruta.startsWith(`${GESTORIA}/${carpeta}`))
  || ruta === `${GESTORIA}/impostos/nucli/simulacio.js`;

/* Els especificadors d'importació per l'AST (estàtiques, reexportacions, d'efecte i dinàmiques literals). */
function especificadors(codi) {
  const ast = parse(codi, { sourceType: 'module', plugins: ['jsx'], createImportExpressions: true });
  const trobats = [];
  const visita = (node) => {
    if (!node || typeof node !== 'object') return;
    if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type) && node.source) {
      trobats.push(node.source.value);
    } else if (node.type === 'ImportExpression') {
      const font = node.source;
      const valor = font.type === 'StringLiteral' ? font.value
        : font.type === 'TemplateLiteral' && font.expressions.length === 0 ? font.quasis[0].value.cooked : null;
      if (typeof valor !== 'string') throw new Error('Importació dinàmica no literal: el graf no es pot saber.');
      trobats.push(valor);
    }
    for (const valor of Object.values(node)) {
      if (Array.isArray(valor)) valor.forEach((fill) => { if (fill?.type) visita(fill); });
      else if (valor?.type) visita(valor);
    }
  };
  visita(ast.program);
  return trobats;
}

function resol(des, especificador) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(des), especificador.split('?')[0]));
  return [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`, `${base}/index.jsx`]
    .find((ruta) => /\.(?:m?js|jsx)$/.test(ruta) && existix(ruta)) ?? base;
}

/* El graf de producció dins dels dos carrils, des d'unes entrades. */
function clausura(entrades) {
  const vistos = new Set();
  const pendents = [...entrades];
  while (pendents.length) {
    const ruta = pendents.pop();
    if (vistos.has(ruta)) continue;
    vistos.add(ruta);
    for (const especificador of especificadors(llig(ruta))) {
      if (!especificador.startsWith('.')) continue;
      const desti = resol(ruta, especificador);
      if (dinsCarrils(desti) && existix(desti) && !esProva(desti)) pendents.push(desti);
    }
  }
  return [...vistos].sort();
}

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers;
}

describe('la frontera del cofre', () => {
  test('sondes: el lector troba el cofre al graf de l’Històric, i el correu i la porta al dels signats', () => {
    const historic = clausura(ENTRADES_HISTORIC);
    expect(historic).toEqual(expect.arrayContaining([
      `${GESTORIA}/cofre/cofre.js`, `${GESTORIA}/cofre/nucli/cripto.js`, `${GESTORIA}/cofre/magatzemCofre.js`, `${GESTORIA}/cofre/autobloqueig.js`
    ]));
    const signats = clausura(ENTRADES_SIGNATS);
    expect(signats).toEqual(expect.arrayContaining([
      `${GESTORIA}/nucli/correus.js`, `${GESTORIA}/nucli/csv.js`, `${GESTORIA}/PanellGestoria.jsx`, `${TRACTORS}/useTractors.js`
    ]));
    expect(signats.length).toBeGreaterThan(20);
    /* El Tauler sí que llig el banc amb la Norma 43: el lector hi arriba. */
    expect(clausura(ENTRADES_TAULER)).toContain(`${GESTORIA}/nucli/c43.js`);
    /* Les dos comprovacions de baix mosseguen: el graf de l'Històric les suspendria totes dues. */
    expect(historic.filter(delHistoric).length).toBeGreaterThan(5);
    const fontsSignades = new Set([...TRACTOR_FACTURES.fonts, ...TRACTOR_CORREUS.fonts, MANIFESTS]);
    expect(historic.filter((ruta) => !fontsSignades.has(ruta))).toContain(`${GESTORIA}/cofre/cofre.js`);
    /* Ordre del Mestre, 13-10-2026 (front H): el lector també troba el cofre al graf de la Finestreta, i l'Escàner al del Tauler (la closca el munta). */
    const identitat = clausura(ENTRADES_IDENTITAT);
    expect(identitat).toEqual(expect.arrayContaining([`${GESTORIA}/cofre/cofre.js`, `${GESTORIA}/cofre/PortaCofre.jsx`]));
    expect(identitat.filter(delaFinestreta).length).toBeGreaterThan(5);
    expect(clausura(ENTRADES_TAULER)).toContain(`${GESTORIA}/escaner/PanellEscaner.jsx`);
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, fronts D i H): també el graf de l'Escàner, i tampoc no arriba a la Finestreta. */
  test('el graf de factures, correus, el Tauler i l’Escàner no arriba al cofre, a l’Històric, a les despeses, a la simulació ni a la Finestreta', () => {
    const graf = clausura([...ENTRADES_SIGNATS, ...ENTRADES_TAULER, ...ENTRADES_ESCANER]);
    expect(graf.filter(delHistoric)).toEqual([]);
    expect(graf.filter(delaFinestreta)).toEqual([]);
  });

  test('el graf de les entrades de factures i correus és a les fonts d’eixos dos manifests, sense la unió amb els altres', () => {
    const fonts = new Set([...TRACTOR_FACTURES.fonts, ...TRACTOR_CORREUS.fonts, MANIFESTS]);
    const fora = clausura(ENTRADES_SIGNATS).filter((ruta) => !fonts.has(ruta));
    expect(fora).toEqual([]);
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): abans, «només
     l'Històric»; ara l'Històric i la Finestreta, i cap altre. */
  test('fora del cofre, només l’Històric i la Finestreta l’importen; i el cofre és font de l’Històric i de la Identitat sencer', () => {
    const importadors = [...fitxersDe(GESTORIA), ...fitxersDe(TRACTORS), ...fitxersDe('src/apps')]
      .filter((ruta) => !esProva(ruta) && !ruta.startsWith(`${GESTORIA}/cofre/`))
      .filter((ruta) => especificadors(llig(ruta)).some((e) => e.startsWith('.') && resol(ruta, e).startsWith(`${GESTORIA}/cofre/`)))
      .sort();
    expect(importadors).toEqual([`${GESTORIA}/finestreta/Finestreta.jsx`, `${GESTORIA}/historic/Historic.jsx`]);
    const delCofre = fitxersDe(`${GESTORIA}/cofre`).filter((ruta) => !esProva(ruta));
    expect(delCofre.length).toBe(6);
    expect(delCofre.filter((ruta) => !TRACTOR_HISTORIC.fonts.includes(ruta))).toEqual([]);
    expect(delCofre.filter((ruta) => !TRACTOR_IDENTITAT.fonts.includes(ruta))).toEqual([]);
  });
});
