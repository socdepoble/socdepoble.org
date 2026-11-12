/**
 * gedcom.test.js — viatge d'anada i tornada GEDCOM 7.0 i 5.5.1, fitxers
 * malformats, límits, claus perilloses, filtre de vius i còpia JSON.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { creaArbre, creaPersona, creaRelacio, numeraSosa, MIDA_MAXIMA_IMPORTACIO, MAX_PERSONES } from '../nucli/index.js';
import {
  llegeixGedcom,
  lligTextFitxerArbre,
  escriuGedcom,
  dataGedcom,
  creaCopiaJson,
  llegeixCopiaJson,
  ESQUEMA_COPIA,
  descarregaText,
  nomFitxer,
  TIPUS_GED,
  TIPUS_JSON
} from './index.js';

const ANY = 2026;
const ARA = '2026-11-11T02:00:00.000Z';
const RE_LINIA = /^(\d{1,2}) (?:@([A-Za-z0-9_]{1,22})@ )?([A-Za-z0-9_]{1,31})(?: ([\s\S]*))?$/;

function generadorIds(prefix = 'id') {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix}-${n}`;
  };
}

/** Un arbre de mostra fictici: quatre generacions, una viva, germà, padrí i font. */
function arbreMostra() {
  const arbreId = 'arbre-1';
  const p = (id, camps) => creaPersona({ id, arbreId, ara: ARA, ...camps }, { anyActual: ANY });
  const persones = [
    p('jo', { nom: 'Clara', cognom1: 'Ferrer', cognom2: 'Llopis', viva: 'si', sexe: 'F', naixement: { precisio: 'exacta', any: 1978, mes: null, dia: null }, generacio: 'G4' }),
    p('pare', { nom: 'Josep', cognom1: 'Ferrer', cognom2: 'Mas', sexe: 'M', viva: 'no', naixement: { precisio: 'exacta', any: 1940, mes: 2, dia: null }, defuncio: { precisio: 'exacta', any: 2010, mes: 5, dia: 3 }, ofici: 'Llaurador', estat: 'confirmat', generacio: 'G3' }),
    p('mare', { nom: 'Maria', cognom1: 'Llopis', cognom2: 'Soler', sexe: 'F', viva: 'no', naixement: { precisio: 'aproximada', any: 1942, mes: null, dia: null }, defuncio: { precisio: 'estimada', any: 2015, mes: null, dia: null }, estat: 'aproximat' }),
    p('avi', { nom: 'Vicent', cognom1: 'Ferrer', cognom2: 'de la Torre', malnom: 'el Roig', casa: 'Ca el Roig', lloc: 'Mas de la Font', sexe: 'M', naixement: { precisio: 'exacta', any: 1908, mes: 3, dia: 12 }, estat: 'falta-confirmar' }),
    p('avia', { nom: 'Rosa', cognom1: 'Mas', sexe: 'F', naixement: { precisio: 'estimada', any: 1910, mes: null, dia: null }, notes: 'Deia que venia del mas\nSegona línia amb @arroba i @@doble', estat: 'contradiccio' }),
    p('germa', {
      nom: 'Pere', cognom1: 'Ferrer', sexe: 'M', viva: 'no', naixement: { precisio: 'exacta', any: 1905, mes: null, dia: null },
      fonts: [{ id: 'font-1', tipus: 'parroquial', titol: 'Llibre de baptismes', url: 'https://pares.cultura.gob.es/exemple', citacio: 'f. 23v', transcripcio: 'En lo any de 1905 [il·legible]', arxiuId: null, consultada: null }]
    }),
    p('padri', { nom: 'Joan', cognom1: 'Pastor', sexe: 'M', naixement: { precisio: 'exacta', any: 1880, mes: null, dia: null } })
  ];
  const r = (id, tipus, de, a, evidencia) => creaRelacio({ id, arbreId, tipus, de, a, evidencia, ara: ARA });
  const relacions = [
    r('r1', 'progenitor', 'avi', 'pare', { fontEscrita: true, memoriaOral: false, vincleExplicit: true }),
    r('r2', 'progenitor', 'avia', 'pare', { fontEscrita: true, memoriaOral: false, vincleExplicit: true }),
    r('r3', 'progenitor', 'pare', 'jo', { fontEscrita: false, memoriaOral: true, vincleExplicit: true }),
    r('r4', 'progenitor', 'mare', 'jo', { fontEscrita: false, memoriaOral: true, vincleExplicit: true }),
    r('r5', 'parella', 'pare', 'mare', { fontEscrita: false, memoriaOral: true, vincleExplicit: true }),
    r('r6', 'germa', 'germa', 'avi', { fontEscrita: false, memoriaOral: true, vincleExplicit: true }),
    r('r7', 'padri', 'padri', 'avi', { fontEscrita: true, memoriaOral: false, vincleExplicit: true }),
    /* En GEDCOM, HUSB i WIFE d'una FAM són una parella: el viatge la necessita. */
    r('r8', 'parella', 'avi', 'avia', { fontEscrita: true, memoriaOral: false, vincleExplicit: true })
  ];
  const arbre = { ...creaArbre({ id: arbreId, titol: 'Arbre de prova', ara: ARA }), arrelId: 'jo' };
  return { arbre, persones, relacions, entrevista: null };
}

const llig = (text, extra = {}) => llegeixGedcom(text, { arbreId: 'nou', nouId: generadorIds(), ara: ARA, anyActual: ANY, titol: 'Importat', ...extra });

/** Clau llegible d'una relació per noms (per a comparar arbres amb ids diferents). */
function clausRelacions(complet) {
  const nom = new Map(complet.persones.map((p) => [p.id, p.nom]));
  return complet.relacions
    .map((r) => {
      const extrems = r.tipus === 'parella' || r.tipus === 'germa' ? [nom.get(r.de), nom.get(r.a)].sort() : [nom.get(r.de), nom.get(r.a)];
      return `${r.tipus}:${extrems.join('>')}:${r.estat}`;
    })
    .sort();
}

const perNom = (complet, nom) => complet.persones.find((p) => p.nom === nom);

function comprovaViatge(versio) {
  const original = arbreMostra();
  const { text, ocultes } = escriuGedcom(original, { versio, incloureVius: true, anyActual: ANY, ara: ARA });
  expect(ocultes).toBe(0);
  for (const linia of text.trimEnd().split('\n')) {
    expect(RE_LINIA.test(linia)).toBe(true);
    if (versio === '5.5.1') expect(linia.length).toBeLessThanOrEqual(255);
  }
  const llegit = llig(text);
  expect(llegit.ok).toBe(true);
  expect(llegit.versio).toBe(versio);
  expect(llegit.recompte.persones).toBe(original.persones.length);
  for (const persona of original.persones) {
    const tornada = perNom(llegit.complet, persona.nom);
    expect(tornada, persona.nom).toBeTruthy();
    for (const camp of ['cognom1', 'cognom2', 'malnom', 'casa', 'lloc', 'sexe', 'ofici', 'estat', 'notes']) {
      expect(tornada[camp], `${persona.nom}.${camp}`).toEqual(persona[camp]);
    }
    expect(tornada.naixement).toEqual(persona.naixement);
    expect(tornada.defuncio).toEqual(persona.defuncio);
    expect(tornada.origen).toBe('gedcom');
    expect(tornada.id).not.toBe(persona.id);
  }
  expect(perNom(llegit.complet, 'Clara').viva).toBe('si');
  expect(perNom(llegit.complet, 'Josep').viva).toBe('no');
  const font = perNom(llegit.complet, 'Pere').fonts[0];
  expect(font).toMatchObject({ tipus: 'parroquial', titol: 'Llibre de baptismes', url: 'https://pares.cultura.gob.es/exemple', citacio: 'f. 23v', transcripcio: 'En lo any de 1905 [il·legible]' });
  expect(clausRelacions(llegit.complet)).toEqual(clausRelacions(original));
  expect(llegit.complet.arbre.arrelId).toBe(perNom(llegit.complet, 'Clara').id);
  expect(llegit.complet.arbre.titol).toBe('Importat');
  return text;
}

describe('escriuGedcom i llegeixGedcom · viatge d\'anada i tornada', () => {
  it('7.0 conserva persones, famílies, dates, notes amb estat, fonts i FAN', () => {
    const text = comprovaViatge('7.0');
    expect(text.startsWith('0 HEAD\n1 GEDC\n2 VERS 7.0\n1 SOUR SOC_DE_POBLE\n2 NAME Arbre Genealògic\n1 DATE 11 NOV 2026\n')).toBe(true);
    expect(text).not.toContain('1 CHAR');
    expect(text).toContain('2 DATE 12 MAR 1908');
    expect(text).toContain('2 DATE ABT 1942');
    expect(text).toContain('2 DATE EST 2015');
    expect(text).toContain('1 NOTE [CONTRADICCIÓ] Deia que venia del mas\n2 CONT Segona línia amb @arroba i @@doble');
    expect(text).toContain('2 ROLE GODP');
    expect(text).toContain('3 PHRASE Sibling');
    expect(text).toContain('1 RESN PRIVACY');
    expect(text.endsWith('0 TRLR\n')).toBe(true);
  });

  it('5.5.1 conserva el mateix, amb CHAR, SUBM, @ doblada i CONC en les línies llargues', () => {
    const original = arbreMostra();
    const llarga = `${'Paraula '.repeat(120)}fi`.trim();
    original.persones = original.persones.map((p) => (p.id === 'avi' ? { ...p, notes: llarga } : p));
    const { text } = escriuGedcom(original, { versio: '5.5.1', incloureVius: true, anyActual: ANY, ara: ARA });
    expect(text).toContain('2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n1 CHAR UTF-8');
    expect(text).toContain('0 @U1@ SUBM\n1 NAME Sóc de Poble');
    expect(text).toContain('Segona línia amb @@arroba i @@@@doble');
    expect(text).toContain('2 CONC ');
    expect(text).toContain('2 RELA Godparent');
    for (const linia of text.split('\n')) expect(linia.length).toBeLessThanOrEqual(255);
    const llegit = llig(text);
    expect(perNom(llegit.complet, 'Vicent').notes).toBe(llarga);
    expect(perNom(llegit.complet, 'Rosa').notes).toBe('Deia que venia del mas\nSegona línia amb @arroba i @@doble');
    comprovaViatge('5.5.1');
  });

  it('la FAM porta l\'estat més feble i el vincle torna amb la mateixa evidència', () => {
    const { text } = escriuGedcom(arbreMostra(), { versio: '7.0', incloureVius: true, anyActual: ANY, ara: ARA });
    expect(text).toContain('1 NOTE [CONFIRMAT]');
    expect(text).toContain('1 NOTE [APROXIMAT]');
    const llegit = llig(text);
    const josep = perNom(llegit.complet, 'Josep');
    const vincle = llegit.complet.relacions.find((r) => r.tipus === 'progenitor' && r.a === josep.id);
    expect(vincle.evidencia).toEqual({ fontEscrita: true, memoriaOral: false, vincleExplicit: true });
  });

  it('escriu les quatre precisions de data i res per a la desconeguda', () => {
    expect(dataGedcom({ precisio: 'exacta', any: 1908, mes: 3, dia: 12 })).toBe('12 MAR 1908');
    expect(dataGedcom({ precisio: 'exacta', any: 1908, mes: 3, dia: null })).toBe('MAR 1908');
    expect(dataGedcom({ precisio: 'exacta', any: 1908, mes: null, dia: null })).toBe('1908');
    expect(dataGedcom({ precisio: 'aproximada', any: 1935, mes: null, dia: null })).toBe('ABT 1935');
    expect(dataGedcom({ precisio: 'estimada', any: 1908, mes: null, dia: null })).toBe('EST 1908');
    expect(dataGedcom({ precisio: 'desconeguda', any: null, mes: null, dia: null })).toBe('');
    expect(dataGedcom(null)).toBe('');
  });

  it('no inventa cap valor: una persona només amb nom no porta NICK, PLAC ni dates', () => {
    const arbre = creaArbre({ id: 'a', titol: 't', ara: ARA });
    const persona = creaPersona({ id: 'x', arbreId: 'a', ara: ARA, nom: 'Anna', viva: 'no' }, { anyActual: ANY });
    const { text } = escriuGedcom({ arbre, persones: [persona], relacions: [], entrevista: null }, { anyActual: ANY, ara: ARA });
    expect(text).not.toContain('NICK');
    expect(text).not.toContain('PLAC');
    expect(text).not.toContain('BIRT');
    expect(text).not.toContain('_SDPCASA');
    expect(text).toContain('1 DEAT Y');
    expect(text).toContain('1 NOTE [FALTA CONFIRMAR]');
  });

  it('rebutja una versió que no sap escriure', () => {
    expect(() => escriuGedcom(arbreMostra(), { versio: '5.5', anyActual: ANY, ara: ARA })).toThrow(TypeError);
  });
});

describe('escriuGedcom · persones vives', () => {
  it('per defecte anonimitza les vives: cap nom, data, nota ni font', () => {
    const { text, ocultes } = escriuGedcom(arbreMostra(), { versio: '7.0', anyActual: ANY, ara: ARA });
    expect(ocultes).toBe(1);
    expect(text).not.toContain('Clara');
    expect(text).not.toContain('1978');
    expect(text).toContain('0 @I1@ INDI\n1 NAME Persona viva //\n1 RESN PRIVACY\n1 FAMC @F');
    expect(text).toContain('Vicent');
  });

  it('usa l\'etiqueta de la llengua de la interfície i RESN en minúscules en 5.5.1', () => {
    const { text } = escriuGedcom(arbreMostra(), { versio: '5.5.1', anyActual: ANY, ara: ARA, etiquetaViva: 'Living person' });
    expect(text).toContain('1 NAME Living person //\n1 RESN privacy');
    expect(text).not.toContain('Clara');
  });

  it('una persona sense dades es protegix com a viva', () => {
    const arbre = creaArbre({ id: 'a', titol: 't', ara: ARA });
    const persona = creaPersona({ id: 'x', arbreId: 'a', ara: ARA, nom: 'Secret', cognom1: 'Amagat' }, { anyActual: ANY });
    const { text, ocultes } = escriuGedcom({ arbre, persones: [persona], relacions: [], entrevista: null }, { anyActual: ANY, ara: ARA });
    expect(ocultes).toBe(1);
    expect(text).not.toContain('Secret');
    expect(text).not.toContain('Amagat');
  });
});

describe('llegeixGedcom · dates, notes i compatibilitat', () => {
  const capcalera = (vers = '5.5.1') => `0 HEAD\n1 GEDC\n2 VERS ${vers}\n1 CHAR UTF-8\n`;

  it('entén ABT, EST, CAL, BEF, AFT i BET…AND amb la precisió que toca', () => {
    const text = `${capcalera()}0 @I1@ INDI\n1 NAME A //\n1 BIRT\n2 DATE ABT 1900\n0 @I2@ INDI\n1 NAME B //\n1 BIRT\n2 DATE EST 1901\n`
      + `0 @I3@ INDI\n1 NAME C //\n1 BIRT\n2 DATE CAL 1902\n0 @I4@ INDI\n1 NAME D //\n1 BIRT\n2 DATE BEF 1903\n`
      + `0 @I5@ INDI\n1 NAME E //\n1 BIRT\n2 DATE AFT 1904\n0 @I6@ INDI\n1 NAME F //\n1 BIRT\n2 DATE BET 1900 AND 1910\n`
      + `0 @I7@ INDI\n1 NAME G //\n1 BIRT\n2 DATE 3 JUN 1907\n0 @I8@ INDI\n1 NAME H //\n1 BIRT\n2 DATE (en temps de la guerra)\n`
      + `0 @I9@ INDI\n1 NAME I //\n1 BIRT\n2 DATE @#DJULIAN@ 1500\n0 @I10@ INDI\n1 NAME J //\n1 BIRT\n2 DATE 31 FEB 1900\n0 TRLR\n`;
    const r = llig(text);
    expect(r.ok).toBe(true);
    const n = (nom) => perNom(r.complet, nom).naixement;
    expect(n('A')).toEqual({ precisio: 'aproximada', any: 1900, mes: null, dia: null });
    expect(n('B')).toEqual({ precisio: 'estimada', any: 1901, mes: null, dia: null });
    expect(n('C')).toEqual({ precisio: 'estimada', any: 1902, mes: null, dia: null, gedcom: 'CAL 1902' });
    expect(n('D')).toEqual({ precisio: 'aproximada', any: 1903, mes: null, dia: null, gedcom: 'BEF 1903' });
    expect(n('E')).toEqual({ precisio: 'aproximada', any: 1904, mes: null, dia: null, gedcom: 'AFT 1904' });
    expect(n('F')).toEqual({ precisio: 'aproximada', any: 1900, mes: null, dia: null, gedcom: 'BET 1900 AND 1910' });
    expect(n('G')).toEqual({ precisio: 'exacta', any: 1907, mes: 6, dia: 3 });
    expect(n('H').precisio).toBe('desconeguda');
    expect(n('I').precisio).toBe('desconeguda');
    expect(n('J').precisio).toBe('desconeguda');
    expect(r.avisos.some((a) => a.startsWith('data-interval:'))).toBe(false);
    expect(r.avisos.some((a) => a.startsWith('data-format:'))).toBe(true);
    expect(r.avisos.some((a) => a.startsWith('data-calendari:'))).toBe(true);
    expect(r.avisos.some((a) => a.startsWith('data-invalida:'))).toBe(true);
  });

  it('llig l\'estat de la nota, també la forma del kit i les notes per punter', () => {
    const text = `${capcalera()}0 @I1@ INDI\n1 NAME A /X/\n1 NOTE Estat epistemologic: [CONTRADICCIÓ DETECTADA] · G4\n`
      + `0 @I2@ INDI\n1 NAME B /X/\n1 NOTE @N1@\n0 @I3@ INDI\n1 NAME C /X/\n0 @N1@ NOTE [CONFIRMAT] Vist a l'acta\n1 CONT segona línia\n0 TRLR\n`;
    const r = llig(text);
    expect(perNom(r.complet, 'A').estat).toBe('contradiccio');
    expect(perNom(r.complet, 'B').estat).toBe('confirmat');
    expect(perNom(r.complet, 'B').notes).toBe("Vist a l'acta\nsegona línia");
    expect(perNom(r.complet, 'C').estat).toBe('falta-confirmar');
  });

  it('Cognom ≠ Parentiu: dos persones amb el mateix cognom i sense FAM no queden vinculades', () => {
    const text = `${capcalera()}0 @I1@ INDI\n1 NAME Pep /Ferrer Mas/\n0 @I2@ INDI\n1 NAME Toni /Ferrer Mas/\n0 TRLR\n`;
    const r = llig(text);
    expect(r.complet.persones).toHaveLength(2);
    expect(r.complet.relacions).toHaveLength(0);
  });

  it('entén un GEDCOM d\'altre programa: GIVN/SURN, NICK, font en línia, ASSO amb RELA i casa del FAM', () => {
    const text = `0 HEAD\n1 SOUR ALTRE\n1 GEDC\n2 VERS 5.5\n1 CHAR ANSEL\n0 @P1@ INDI\n1 NAME\n2 GIVN Teresa\n2 SURN Gil\n1 NICK la Xata\n1 SEX F\n`
      + `1 SOUR Padró de 1920\n2 PAGE full 4\n1 ASSO @P2@\n2 RELA Godfather\n1 DEAT\n2 DATE ABT 1950\n0 @P2@ INDI\n1 NAME Ramon /Gil/\n1 SEX M\n`
      + `0 @F1@ FAM\n1 HUSB @P2@\n1 CHIL @P1@\n1 _SDPCASA Ca la Xata\n1 SOUR @S9@\n0 @S9@ SOUR\n1 TITL Arxiu parroquial\n1 WWW http://insegur.example\n0 TRLR\n`;
    const r = llig(text);
    expect(r.ok).toBe(true);
    expect(r.versio).toBe('5.5');
    expect(r.avisos).not.toContain('codificacio');
    const teresa = perNom(r.complet, 'Teresa');
    expect(teresa).toMatchObject({ cognom1: 'Gil', malnom: 'la Xata', sexe: 'F', viva: 'no', casa: 'Ca la Xata' });
    expect(teresa.fonts[0]).toMatchObject({ titol: 'Padró de 1920', citacio: 'full 4', url: '' });
    const ramon = perNom(r.complet, 'Ramon');
    const tipus = r.complet.relacions.map((x) => `${x.tipus}:${x.de === ramon.id ? 'R' : 'T'}`).sort();
    expect(tipus).toEqual(['padri:R', 'progenitor:R']);
    const progenitor = r.complet.relacions.find((x) => x.tipus === 'progenitor');
    expect(progenitor.estat).toBe('confirmat');
  });
});

describe('llegeixGedcom · fitxers malformats i límits', () => {
  it('rebutja entrades buides, de tipus estrany o sense capçalera', () => {
    expect(llig('').errors).toEqual(['buit']);
    expect(llig(null).errors).toEqual(['buit']);
    expect(llig({ toString: () => '0 HEAD' }).errors).toEqual(['tipus']);
    expect(llig('0 @I1@ INDI\n1 NAME A //\n0 TRLR').errors).toEqual(['capcalera']);
    expect(llig('això no és cap GEDCOM').errors).toEqual(['capcalera']);
    expect(llig('<html><body>0 HEAD</body></html>').ok).toBe(false);
  });

  it('exigix nouId, anyActual i ara', () => {
    expect(() => llegeixGedcom('0 HEAD', { ara: ARA, anyActual: ANY })).toThrow(TypeError);
    expect(() => llegeixGedcom('0 HEAD', { nouId: generadorIds(), ara: ARA })).toThrow(TypeError);
    expect(() => llegeixGedcom('0 HEAD', { nouId: generadorIds(), anyActual: ANY })).toThrow(TypeError);
  });

  it('descarta els salts de nivell i les línies malformades amb la seua estructura, i continua', () => {
    /* El BOM es compon amb el seu punt de codi: cap caràcter invisible en cru al fitxer. */
    const text = String.fromCharCode(0xFEFF) + '0 HEAD\r\n1 GEDC\r\n2 VERS 7.0\r\n0 @I1@ INDI\r\n1 NAME Bo /Net/\r\n3 DATE 1900\r\n4 PLAC X\r\n'
      + 'linia sense nivell\r\n1 SEX M\r\n0 @I2@ INDI\r\nxx NAME\r\n1 NAME Segon //\r\n1 BIRT\r\n2 DATE ABT 1890\r\n'
      + '0 @F1@ FAM\r\n1 HUSB @I1@\r\n1 CHIL @I2@\r\n1 CHIL @NOEXISTIX@';
    const r = llig(text);
    expect(r.ok).toBe(true);
    expect(r.versio).toBe('7.0');
    expect(r.avisos).toContain('salt-de-nivell:6');
    expect(r.avisos).toContain('linia-malformada:8');
    expect(r.avisos).toContain('sense-trlr');
    expect(r.avisos).toContain('referencia-trencada');
    expect(perNom(r.complet, 'Bo').sexe).toBe('M');
    expect(perNom(r.complet, 'Segon').naixement.precisio).toBe('aproximada');
    expect(r.complet.relacions.filter((x) => x.tipus === 'progenitor')).toHaveLength(1);
  });

  it('accepta CR sols com a separador i línies sagnades', () => {
    const r = llig('0 HEAD\r  1 GEDC\r    2 VERS 5.5.1\r0 @I1@ INDI\r  1 NAME Sagnat //\r0 TRLR\r');
    expect(r.ok).toBe(true);
    expect(r.versio).toBe('5.5.1');
    expect(perNom(r.complet, 'Sagnat')).toBeTruthy();
  });

  it('rebutja un text més gran que el límit de mida', () => {
    const r = llig('0 HEAD\n'.padEnd(MIDA_MAXIMA_IMPORTACIO + 1, 'x'));
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual(['mida']);
  });

  it('rebutja massa línies', () => {
    const r = llig(`0 HEAD${'\n0 TRLR'.repeat(300001)}`);
    expect(r.errors).toEqual(['massa-linies']);
  });

  it('descarta una línia enorme i la seua estructura sense penjar-se', () => {
    const text = `0 HEAD\n1 GEDC\n2 VERS 7.0\n0 @I1@ INDI\n1 NAME Llarga //\n1 NOTE ${'x'.repeat(70000)}\n2 CONT segueix\n1 SEX F\n0 TRLR\n`;
    const inici = Date.now();
    const r = llig(text);
    expect(Date.now() - inici).toBeLessThan(2000);
    expect(r.avisos).toContain('linia-massa-llarga:6');
    const llarga = perNom(r.complet, 'Llarga');
    expect(llarga.notes).toBe('');
    expect(llarga.sexe).toBe('F');
  });

  it('talla els valors llargs a la mida del model sense descartar la persona', () => {
    const text = `0 HEAD\n1 GEDC\n2 VERS 7.0\n0 @I1@ INDI\n1 NAME ${'N'.repeat(500)} /${'C'.repeat(500)}/\n1 OCCU ${'o'.repeat(300)}\n0 TRLR\n`;
    const r = llig(text);
    expect(r.complet.persones[0].nom).toHaveLength(80);
    expect(r.complet.persones[0].cognom1).toHaveLength(80);
    expect(r.complet.persones[0].ofici).toHaveLength(80);
  });

  it('les claus perilloses als xref i a les etiquetes no contaminen cap prototip', () => {
    const text = '0 HEAD\n1 GEDC\n2 VERS 5.5.1\n0 @__proto__@ INDI\n1 NAME Proto //\n1 __PROTO__ x\n1 CONSTRUCTOR y\n'
      + '0 @constructor@ INDI\n1 NAME Cons //\n0 @prototype@ FAM\n1 HUSB @__proto__@\n1 CHIL @constructor@\n0 TRLR\n';
    const r = llig(text);
    expect(r.ok).toBe(true);
    expect(r.complet.persones.map((p) => p.nom).sort()).toEqual(['Cons', 'Proto']);
    expect(r.complet.relacions).toHaveLength(1);
    expect(r.complet.persones.every((p) => p.id.startsWith('id-'))).toBe(true);
    expect({}.x).toBeUndefined();
    expect(Object.prototype.polluted).toBeUndefined();
    expect(typeof Object.prototype.constructor).toBe('function');
  });

  it('una línia patològica per a regex no penja la lectura', () => {
    const text = `0 HEAD\n1 GEDC\n2 VERS 7.0\n${'1 @'.repeat(5000)}\n${`0 ${'@A'.repeat(20000)}`}\n0 TRLR\n`;
    const inici = Date.now();
    const r = llig(text);
    expect(Date.now() - inici).toBeLessThan(2000);
    expect(r.ok).toBe(true);
  });
});

describe('creaCopiaJson i llegeixCopiaJson', () => {
  it('per defecte anonimitza les vives i no inclou l\'entrevista', () => {
    const complet = { ...arbreMostra(), entrevista: { arbreId: 'arbre-1', pas: 2, respostes: {}, completada: false, modificada: ARA } };
    const { text, ocultes } = creaCopiaJson(complet, { anyActual: ANY, ara: ARA });
    const dades = JSON.parse(text);
    expect(ocultes).toBe(1);
    expect(dades.schema).toBe(ESQUEMA_COPIA);
    expect(dades.incloureVius).toBe(false);
    expect(dades.entrevista).toBeNull();
    expect(text).not.toContain('Clara');
    expect(text).not.toContain('1978');
  });

  it('el viatge d\'anada i tornada dona ids nous i relacions remapejades', () => {
    const original = arbreMostra();
    const { text } = creaCopiaJson(original, { incloureVius: true, anyActual: ANY, ara: ARA });
    const r = llegeixCopiaJson(text, { nouId: generadorIds('nou'), anyActual: ANY });
    expect(r.ok).toBe(true);
    expect(r.complet.persones).toHaveLength(original.persones.length);
    expect(r.complet.arbre.id).not.toBe(original.arbre.id);
    expect(r.complet.persones.every((p) => p.arbreId === r.complet.arbre.id && p.id.startsWith('nou-'))).toBe(true);
    expect(r.complet.arbre.arrelId).toBe(perNom(r.complet, 'Clara').id);
    expect(clausRelacions(r.complet)).toEqual(clausRelacions(original));
    expect(perNom(r.complet, 'Rosa').notes).toBe(original.persones.find((p) => p.id === 'avia').notes);
  });

  it('rebutja les claus perilloses en qualsevol nivell', () => {
    const base = { schema: ESQUEMA_COPIA, arbre: {}, persones: [], relacions: [] };
    const ambProto = JSON.stringify(base).replace('"persones"', '"__proto__":{"x":1},"persones"');
    expect(llegeixCopiaJson(ambProto, { nouId: generadorIds(), anyActual: ANY }).errors).toEqual(['clau-perillosa']);
    const ambConstructor = JSON.stringify({ ...base, persones: [{ id: 'a', constructor: { prototype: { x: 1 } } }] });
    expect(llegeixCopiaJson(ambConstructor, { nouId: generadorIds(), anyActual: ANY }).errors).toEqual(['clau-perillosa']);
    expect({}.x).toBeUndefined();
  });

  it('rebutja JSON trencat, esquema estrany, mida i límits', () => {
    const opcions = { nouId: generadorIds(), anyActual: ANY };
    expect(llegeixCopiaJson('{trencat', opcions).errors).toEqual(['json']);
    expect(llegeixCopiaJson('[]', opcions).errors).toEqual(['esquema']);
    expect(llegeixCopiaJson(JSON.stringify({ schema: 'altre', arbre: {}, persones: [], relacions: [] }), opcions).errors).toEqual(['esquema']);
    expect(llegeixCopiaJson(' '.repeat(MIDA_MAXIMA_IMPORTACIO + 1), opcions).errors).toEqual(['mida']);
    expect(llegeixCopiaJson(42, opcions).errors).toEqual(['tipus']);
    expect(llegeixCopiaJson('', opcions).errors).toEqual(['buit']);
    const massa = JSON.stringify({ schema: ESQUEMA_COPIA, arbre: {}, persones: new Array(MAX_PERSONES + 1).fill(0), relacions: [] });
    expect(llegeixCopiaJson(massa, opcions).errors).toEqual(['limit']);
  });

  it('descarta els registres invàlids amb un avís i conserva la resta', () => {
    const original = arbreMostra();
    const { text } = creaCopiaJson(original, { incloureVius: true, anyActual: ANY, ara: ARA });
    const dades = JSON.parse(text);
    dades.persones[1] = { ...dades.persones[1], sexe: 'Z' };
    dades.relacions.push({ id: 'r-x', tipus: 'progenitor', de: 'no-hi-es', a: 'jo' });
    const r = llegeixCopiaJson(JSON.stringify(dades), { nouId: generadorIds(), anyActual: ANY });
    expect(r.ok).toBe(true);
    expect(r.avisos).toContain('persona-invalida:1');
    expect(r.avisos.some((a) => a.startsWith('relacio-invalida:'))).toBe(true);
    expect(r.complet.persones).toHaveLength(original.persones.length - 1);
  });
});

describe('descarrega', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('el nom del fitxer només porta la data', () => {
    expect(nomFitxer('ged', { ara: ARA })).toBe('arbre-genealogic-2026-11-11.ged');
    expect(nomFitxer('json', { ara: new Date(2026, 0, 5) })).toBe('arbre-genealogic-2026-01-05.json');
    expect(nomFitxer('ged', {})).toBe('arbre-genealogic.ged');
    expect(() => nomFitxer('exe', { ara: ARA })).toThrow(TypeError);
    expect(TIPUS_GED).toContain('gedcom');
    expect(TIPUS_JSON).toContain('application/json');
  });

  it('crea una adreça blob local, la clica i la revoca', () => {
    vi.useFakeTimers();
    const crea = vi.fn(() => 'blob:local');
    const revoca = vi.fn();
    const original = { crea: URL.createObjectURL, revoca: URL.revokeObjectURL };
    URL.createObjectURL = crea;
    URL.revokeObjectURL = revoca;
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    try {
      expect(descarregaText('0 HEAD\n0 TRLR\n', 'arbre.ged', TIPUS_GED)).toBe(true);
      expect(crea).toHaveBeenCalledTimes(1);
      expect(clic).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1000);
      expect(revoca).toHaveBeenCalledWith('blob:local');
      expect(descarregaText({}, 'x.ged')).toBe(false);
    } finally {
      URL.createObjectURL = original.crea;
      URL.revokeObjectURL = original.revoca;
    }
  });
});

describe('R19 · refutació de pèrdues i filtracions', () => {
  it.each(['5.5.1', '7.0'])('manté dates acotades, evidències i Sosa amb ids remapejats en %s', (versio) => {
    const arbreId = 'arbre-sintetic';
    const p = (id, camps) => creaPersona({ id, arbreId, ara: ARA, viva: 'no', ...camps }, { anyActual: ANY });
    const persones = [
      p('z', { nom: 'Fictici Arrel', cognom1: 'de Mostra', naixement: 'BET 3 MAR 1910 AND 5 NOV 1912' }),
      p('a', { nom: 'Fictici A', naixement: 'ABT 20 JAN 1882',
        fonts: [{ id: 'font-sintetica', tipus: 'oral', citacio: 'Dada sintètica', consultada: '2026-11-01', arxiuId: 'arxiu-sintetic' }] }),
      p('b', { nom: 'Fictici B', naixement: 'CAL FEB 1884' }),
      p('c', { nom: 'Fictici C', naixement: 'FROM JUN 1882 TO AUG 1883' })
    ];
    const nota = 'Àncores, ☃ i informació de prova. '.repeat(20).trim();
    const relacions = persones.slice(1).map((persona, index) => ({
      ...creaRelacio({ id: `rel-${index}`, arbreId, tipus: 'progenitor', de: persona.id, a: 'z', ara: ARA,
        evidencia: { fontEscrita: index === 0, memoriaOral: index === 1, vincleExplicit: index < 2 } }),
      ...(index === 0 ? { notes: nota, fontIds: ['font-sintetica'] } : {})
    }));
    const original = { arbre: creaArbre({ id: arbreId, arrelId: 'z', ara: ARA }), persones, relacions, entrevista: null };
    const exporta = (c) => escriuGedcom(c, { versio, anyActual: ANY, ara: ARA, incloureVius: true }).text;
    const text = exporta(original);
    expect(exporta({ ...original, persones: [...persones].reverse(), relacions: [...relacions].reverse() })).toBe(text);
    if (versio === '5.5.1') {
      expect(text).toContain('3 CONC');
      expect(Math.max(...text.split('\n').map((l) => new TextEncoder().encode(l).byteLength))).toBeLessThanOrEqual(255);
    }
    let ordinal = 500;
    const r = llig(text, { nouId: () => `remapat-${ordinal--}` });
    expect(r.ok).toBe(true);
    expect(r.complet.relacions).toHaveLength(3);
    expect(r.complet.relacions.every((r) => r.tipus === 'progenitor')).toBe(true);
    const a = perNom(r.complet, 'Fictici A');
    const vincle = r.complet.relacions.find((r) => r.de === a.id);
    expect(vincle).toMatchObject({ notes: nota, estat: 'confirmat', fontIds: [a.fonts[0].id] });
    expect(a.fonts[0]).toMatchObject({ citacio: 'Dada sintètica', consultada: '2026-11-01', arxiuId: 'arxiu-sintetic' });
    for (const p of persones) expect(perNom(r.complet, p.nom).naixement).toEqual(p.naixement);
    const nomsSosa = (complet) => numeraSosa(complet, complet.arbre.arrelId).files
      .map((fila) => complet.persones.find((p) => p.id === fila.personaId)?.nom);
    expect(nomsSosa(r.complet)).toEqual(nomsSosa(original));
    expect(llig(text.replace('1 _SDPVINCLES 3', '1 _SDPVINCLES 4')).errors).toEqual(['vincles-extension']);
    expect(llig(exporta({ ...original, arbre: { ...original.arbre, arrelId: null } })).complet.arbre.arrelId).toBeNull();
  });

  it('tanca la filtració indirecta, les dates obertes i les morts no acreditades', () => {
    const text = '0 HEAD\n1 GEDC\n2 VERS 7.0\n'
      + '0 @V1@ INDI\n1 NAME PersonaSinteticaViva //\n1 BIRT\n2 DATE AFT 1900\n'
      + '0 @V2@ INDI\n1 NAME PersonaSinteticaAmbDEATBuit //\n1 DEAT\n'
      + '0 @D1@ INDI\n1 NAME PersonaSinteticaDifunta //\n1 DEAT Y\n1 NOTE PersonaSinteticaViva\n'
      + '0 TRLR\n';
    const { complet } = llig(text);
    const original = { ...complet, arbre: { ...complet.arbre, titol: 'NomSinteticPrivat' } };
    for (const versio of ['5.5.1', '7.0']) {
      const sortida = escriuGedcom(original, { versio, anyActual: ANY });
      expect(sortida.ocultes).toBe(2);
      expect(sortida.text).not.toMatch(/PersonaSinteticaViva|PersonaSinteticaAmbDEATBuit|NomSinteticPrivat/);
      expect(sortida.text).toContain('PersonaSinteticaDifunta');
    }
    const json = creaCopiaJson(original, { anyActual: ANY });
    expect(json.ocultes).toBe(2);
    expect(json.text).not.toMatch(/PersonaSinteticaViva|PersonaSinteticaAmbDEATBuit|NomSinteticPrivat|id-1/);
    expect(llegeixCopiaJson(json.text, { nouId: generadorIds('nou'), anyActual: ANY }).ok).toBe(true);
  });

  it('descodifica ANSEL i UTF-16 antics i rebutja UTF-8 malformat', async () => {
    const ascii = (text) => new TextEncoder().encode(text);
    const fitxer = (bytes) => ({ arrayBuffer: async () => bytes.buffer });
    const head = '0 HEAD\n1 GEDC\n2 VERS 5.5.1\n1 CHAR ANSEL\n0 @P1@ INDI\n1 NAME Mostra Jos';
    const tail = 'e //\n0 TRLR\n';
    const ansel = Uint8Array.of(...ascii(head), 0xe2, ...ascii(tail));
    expect(llig(await lligTextFitxerArbre(fitxer(ansel))).complet.persones[0].nom).toBe('Mostra José');

    const legacy = '0 HEAD\r\n1 GEDC\r\n2 VERS 5.5.1\r\n1 CHAR UNICODE\r\n0 @P@ INDI\r\n1 NAME Mostra Té //\r\n0 TRLR\r\n';
    const utf16 = Uint8Array.of(0xfe, 0xff, ...[...legacy].flatMap((c) => [0, c.charCodeAt(0)]));
    expect(llig(await lligTextFitxerArbre(fitxer(utf16))).complet.persones[0].nom).toBe('Mostra Té');
    await expect(lligTextFitxerArbre(fitxer(Uint8Array.of(0xc3, 0x28)))).rejects.toMatchObject({ codiLectura: 'codificacio-invalida' });
    const ansel7 = Uint8Array.of(...ascii(head.replace('5.5.1', '7.0')), 0xe2, ...ascii(tail));
    await expect(lligTextFitxerArbre(fitxer(ansel7))).rejects.toMatchObject({ codiLectura: 'codificacio-invalida' });
  });
});
