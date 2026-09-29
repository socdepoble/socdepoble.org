/**
 * T63.2 (doctrina del Mestre, 260928) · «Comentar» obri el Xat comú de la
 * Pàgina Universal de l'element: /xat?sobre=<tipus>:<id>&titol=…&ruta=…
 * Persona i IA: el missatge directe de sempre (/xat?amb=). Les notes, les
 * carpetes, les categories i les etiquetes no en tenen. Funcions pures.
 */
import { expect, test } from 'vitest';
import {
  esPrivat, modeXat, objecteDePagina, rutaXatDePagina, TIPUS_OBJECTE, tipusDeSeccio
} from './objecteConnectable.js';
import {
  objecteDe, objecteDePerfil, objecteDeRutaDePerfil, rutaDePerfil, tipusDeSeccio as tipusDeNavegacio
} from './navigation.js';
import { subjecteDeXat, TIPUS_SUBJECTE_XAT } from '../data/contracte.js';

/* El que llegirà XatSection (onada 3): URLSearchParams descodifica cada valor. */
const llig = (ruta) => {
  const url = new URL(ruta, 'http://localhost');
  return { cami: url.pathname, params: Object.fromEntries(url.searchParams) };
};

/* El que farà XatSection amb ?sobre=: tallar pel PRIMER «:» i passar-ho a
   obriFilDePagina, que ho valida amb subjecteDeXat. El botó només pot
   prometre un xat que este camí accepte. */
const subjecteQueLlegira = (ruta) => {
  const { sobre = '', titol, ruta: rutaPagina } = llig(ruta).params;
  const tall = sobre.indexOf(':');
  return subjecteDeXat({ tipus: sobre.slice(0, tall), id: sobre.slice(tall + 1), titol, ruta: rutaPagina });
};

test('un element de secció porta el seu tipus i el seu id, amb títol i ruta', () => {
  const ruta = rutaXatDePagina(objecteDe({ id: 'coca', title: 'Recepta de coca' }, 'mur'));
  expect(ruta).toBe('/xat?sobre=publicacio:coca&titol=Recepta%20de%20coca&ruta=%2Fmur%2Fcoca');
  expect(llig(ruta)).toEqual({ cami: '/xat', params: { sobre: 'publicacio:coca', titol: 'Recepta de coca', ruta: '/mur/coca' } });
  for (const [seccio, tipus] of [['mercat', 'producte'], ['events', 'esdeveniment'], ['pobles', 'poble'], ['multimedia', 'multimedia']]) {
    expect(llig(rutaXatDePagina(objecteDe({ id: 'x', title: 'X' }, seccio))).params.sobre).toBe(`${tipus}:x`);
  }
});

test('cada valor va amb encodeURIComponent: un id amb «:», «&» o espais no trenca la consulta', () => {
  const ruta = rutaXatDePagina({ tipus: 'producte', id: 'a:b&c d', titol: 'Oli & mel', ruta: '/mercat/a' });
  expect(ruta).toBe('/xat?sobre=producte:a%3Ab%26c%20d&titol=Oli%20%26%20mel&ruta=%2Fmercat%2Fa');
  // El tipus és de la llista tancada (sense «:»): el lector talla pel primer «:».
  expect(llig(ruta).params).toEqual({ sobre: 'producte:a:b&c d', titol: 'Oli & mel', ruta: '/mercat/a' });
});

test('el que no ve no s’escriu: sense títol ni ruta interna, només ?sobre=', () => {
  expect(rutaXatDePagina({ tipus: 'publicacio', id: 'p1' })).toBe('/xat?sobre=publicacio:p1');
  expect(rutaXatDePagina({ tipus: 'publicacio', id: 'p1', titol: '  ', ruta: '//mal.example' })).toBe('/xat?sobre=publicacio:p1');
  expect(rutaXatDePagina({ tipus: 'publicacio', id: 'p1', ruta: 'javascript:alert(1)' })).toBe('/xat?sobre=publicacio:p1');
});

test('una entitat, un grup i un poble tenen xat comú (la Comunitat la tria XatContext)', () => {
  expect(llig(rutaXatDePagina(objecteDePerfil({ tipus: 'entitat', id: 'forn', nom: 'Forn' }))).params)
    .toEqual({ sobre: 'entitat:forn', titol: 'Forn', ruta: '/empresa/forn' });
  expect(llig(rutaXatDePagina(objecteDePerfil({ tipus: 'grup', id: 'g1', nom: 'Colla' }))).params.sobre).toBe('grup:g1');
  expect(llig(rutaXatDePagina(objecteDePerfil({ tipus: 'empresa', id: 'e1', nom: 'E' }))).params.sobre).toBe('entitat:e1');
  expect(llig(rutaXatDePagina({ tipus: 'poble', id: 'sella' })).params.sobre).toBe('poble:sella');
  // 'organitzacio' és un àlies d'entitat al contracte: viatja com a entitat, una sola comunitat.
  expect(llig(rutaXatDePagina({ tipus: 'organitzacio', id: 'o1' })).params.sobre).toBe('entitat:o1');
});

test('persona i IA: el missatge directe existent (/xat?amb=), mai un xat comú', () => {
  expect(rutaXatDePagina(objecteDePerfil({ tipus: 'persona', id: 'u 1', nom: 'Pepa' }))).toBe('/xat?amb=u%201');
  expect(rutaXatDePagina(objecteDePerfil({ tipus: 'ia', id: 'iaia', nom: 'IAIA' }))).toBe('/xat?amb=iaia');
  expect(rutaXatDePagina({ tipus: 'persona', id: '' })).toBeNull();
  expect(modeXat({ tipus: 'persona', id: 'u1' })).toBe('directe');
  expect(modeXat({ tipus: 'publicacio', id: 'p1' })).toBe('comu');
  expect(esPrivat({ tipus: 'persona', id: 'u1' })).toBe(false);
});

test('notes, carpetes, categories i etiquetes són privades: cap xat, i esPrivat ho diu', () => {
  for (const tipus of ['nota', 'carpeta', 'categoria', 'etiqueta']) {
    expect(rutaXatDePagina({ tipus, id: 'n1', titol: 'Privada', ruta: '/notes?nota=n1' })).toBeNull();
    expect(modeXat({ tipus, id: 'n1' })).toBeNull();
    expect(esPrivat({ tipus, id: 'n1' })).toBe(true);
  }
  // Una nota del detall (/notes/:id) també és 'nota'.
  expect(rutaXatDePagina(objecteDe({ id: 'n1', title: 'Llista de la compra' }, 'notes'))).toBeNull();
  // Un element públic sense xat ara (sense id) no és privat: el botó es queda i avisa.
  expect(esPrivat({ tipus: 'publicacio', id: '' })).toBe(false);
  expect(esPrivat(null)).toBe(false);
});

test('sense id estable, cap xat; un tipus desconegut o cap objecte, tampoc (el límit és el del contracte, 200)', () => {
  expect(rutaXatDePagina({ tipus: 'publicacio', id: '' })).toBeNull();
  expect(rutaXatDePagina({ tipus: 'publicacio', id: '   ' })).toBeNull();
  expect(rutaXatDePagina({ tipus: 'publicacio', id: 'x'.repeat(200) })).not.toBeNull();
  expect(rutaXatDePagina({ tipus: 'publicacio', id: 'x'.repeat(201) })).toBeNull();
  expect(rutaXatDePagina({ tipus: 'inventat', id: 'o1' })).toBeNull();
  expect(rutaXatDePagina(null)).toBeNull();
  expect(rutaXatDePagina(undefined)).toBeNull();
  expect(modeXat(null)).toBeNull();
});

test('una «pagina» es clava per la ruta, mai pel títol (que canvia)', () => {
  // objecteDePagina sense id ni ruta cau al títol: eixa clau no val.
  expect(objecteDePagina({ titol: 'Fira' }).id).toBe('Fira');
  expect(rutaXatDePagina(objecteDePagina({ titol: 'Fira' }))).toBeNull();
  // Amb ruta, la clau és la ruta, encara que l'id propi siga una altra cosa.
  const constitucio = objecteDePagina({ titol: 'Constitució', ruta: '/constitucio', id: 'constitucio' });
  expect(rutaXatDePagina(constitucio)).toBe('/xat?sobre=pagina:%2Fconstitucio&titol=Constituci%C3%B3&ruta=%2Fconstitucio');
  // La mateixa pàgina, vinga de la targeta del Mur o de la seua barra, té el mateix subjecte.
  expect(llig(rutaXatDePagina(objecteDePagina({ titol: 'Un altre títol', ruta: '/constitucio' }))).params.sobre)
    .toBe(llig(rutaXatDePagina(constitucio)).params.sobre);
});

test('una «pagina» només té xat si el contracte la té a la seua llista: cap consulta, cap privada, cap detall', () => {
  // La fitxa de la Wiki (?item=), /traduccions?item_id=… o /el-meu-perfil?organitzacio=…:
  // obriFilDePagina les rebutjaria, i el botó no ho pot prometre.
  for (const ruta of ['/wikidepoble?item=genoma', '/traduccions?item_id=x', '/cerca?q=festa', '/mur#dalt', '/']) {
    expect(rutaXatDePagina(objecteDePagina({ titol: 'P', ruta }))).toBeNull();
    expect(modeXat(objecteDePagina({ titol: 'P', ruta }))).toBeNull();
  }
  // Les pàgines privades (el Bloc, el compte, el registre) no en tenen, ni les seues subrutes.
  for (const ruta of ['/notes', '/notes/n1', '/el-meu-perfil', '/registre']) {
    expect(rutaXatDePagina(objecteDePagina({ titol: 'P', ruta }))).toBeNull();
  }
  // Una ruta de detall o de perfil tampoc és cap 'pagina': el seu xat el porta el seu objecte tipat.
  for (const ruta of ['/mur/3', '/events/fira', '/gent/u-1', '/xat', '/qualsevol-cosa']) {
    expect(rutaXatDePagina(objecteDePagina({ titol: 'P', ruta }))).toBeNull();
  }
  // Les pàgines públiques de la llista, sí.
  for (const ruta of ['/mur', '/constitucio', '/wikidepoble']) {
    expect(llig(rutaXatDePagina(objecteDePagina({ titol: 'P', ruta }))).params.sobre).toBe(`pagina:${ruta}`);
  }
});

test('tot el que promet el botó, obriFilDePagina ho acceptaria (una sola regla, subjecteDeXat)', () => {
  const casos = [
    objecteDe({ id: 'coca', title: 'Recepta de coca' }, 'mur'),
    objecteDe({ id: 'sella', title: 'Sella' }, 'pobles'),
    objecteDePerfil({ tipus: 'entitat', id: 'forn', nom: 'Forn' }),
    objecteDePagina({ titol: 'Constitució', ruta: '/constitucio' }),
    { tipus: 'producte', id: 'a:b&c d', titol: 'Oli & mel', ruta: '/mercat/a' },
    { tipus: 'organitzacio', id: 'o1', titol: 'Cooperativa' },
    { tipus: 'publicacio', id: 'p', titol: 't'.repeat(150) }
  ];
  for (const objecte of casos) {
    const ruta = rutaXatDePagina(objecte);
    expect(modeXat(objecte)).toBe('comu');
    expect(subjecteQueLlegira(ruta)).toEqual(subjecteDeXat(objecte.tipus === 'pagina' ? { ...objecte, id: objecte.ruta } : objecte));
  }
  // El títol viatja retallat com el guardaria el contracte (100): l'URL no creix sense límit.
  expect(llig(rutaXatDePagina({ tipus: 'publicacio', id: 'p', titol: 't'.repeat(150) })).params.titol).toHaveLength(100);
});

test('els tipus comentables són els del contracte: cap privat ni cap directe hi és', () => {
  const comentables = [...TIPUS_SUBJECTE_XAT.comunitat, ...TIPUS_SUBJECTE_XAT.grup];
  for (const tipus of comentables) {
    expect(modeXat(tipus === 'pagina' ? objecteDePagina({ ruta: '/constitucio' }) : { tipus, id: 'x' })).toBe('comu');
  }
  for (const tipus of ['nota', 'carpeta', 'categoria', 'etiqueta', 'persona', 'ia']) {
    expect(comentables).not.toContain(tipus);
    expect(TIPUS_OBJECTE).toContain(tipus);
  }
});

test('objecteDeRutaDePerfil és la inversa exacta de rutaDePerfil (el directori /perfil)', () => {
  for (const tipus of ['persona', 'entitat', 'grup', 'ia']) {
    const ruta = rutaDePerfil(tipus, 'id amb/barra');
    expect(objecteDeRutaDePerfil(ruta, 'Nom')).toEqual(objecteDePerfil({ tipus, id: 'id amb/barra', nom: 'Nom' }));
  }
  expect(rutaXatDePagina(objecteDeRutaDePerfil('/gent/pepa'))).toBe('/xat?amb=pepa');
  expect(rutaXatDePagina(objecteDeRutaDePerfil('/perfil/iaia'))).toBe('/xat?amb=iaia');
  for (const ruta of ['/perfil', '/mur/3', '/gent/a/b', '/gent/pepa?x=1', '/gent/%E0%A4%A', 'gent/pepa', null, undefined]) {
    expect(objecteDeRutaDePerfil(ruta)).toBeNull();
  }
});

test('tipusDeSeccio viu al mòdul lleuger i navigation.js el reexporta, el mateix', () => {
  expect(tipusDeNavegacio).toBe(tipusDeSeccio);
  expect(tipusDeSeccio('mur')).toBe('publicacio');
  expect(tipusDeSeccio('notes')).toBe('nota');
  expect(tipusDeSeccio('perfil')).toBeNull();
});
