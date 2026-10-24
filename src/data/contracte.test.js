import { describe, expect, it, test } from 'vitest';
import * as port from './backendPort.js';
import {
  CAPACITATS, CONTRACTE_BACKEND, CONTRACTE_NUCLI, MISSATGES_MEMBRES_ORGANITZACIO, PAGINES_AMB_XAT, TIPUS_SUBJECTE_XAT,
  errorDeMembre, membreDOrganitzacio, rutaDeSubjecte, subjecteDeXat
} from './contracte.js';
import { SECTION_ORDER, SECTIONS } from '../config/sections.js';
import { RUTA_FITXA_IAIA } from '../config/navigation.js';
/* Fase D (261020, tasca 2) · La moderació: import a banda, perquè les altres
   tasques de la fase toquen la llista de dalt alhora. */
import {
  CODI_MODERACIO, MAXIM_DETALL_DENUNCIA, MAXIM_NOM_BLOQUEJAT, MISSATGE_MODERACIO, MOTIUS_DENUNCIA, TIPUS_BLOQUEJAT,
  TIPUS_OBJECTE_DENUNCIA, VERSIO_NORMES_CONVIVENCIA, autorDelContracte, denunciaDelContracte, errorDeModeracio, esIdDeModeracio
} from './contracte.js';
/* T6b (IDEA-14) · Els seguiments: import a banda, pel mateix motiu. */
import { MISSATGES_SEGUIMENTS, TIPUS_SEGUIT, errorDeSeguiment, seguitDelContracte } from './contracte.js';
/* L'adaptador Supabase sencer es valida a supabase/index.test.js: E1 de
   tractor-enxufe no deixa importar-lo des d'ací, tampoc en una prova. */

/* Les funcions pròpies del port, que no deleguen cap mètode del backend. */
const INFRAESTRUCTURA = ['setBackendImplementation', 'validaBackendImplementation', 'getBackendImplementation',
  'freezeImplementation', 'destroy', 'teCapacitat'];
const nucli = () => Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => nom]));
const capacitat = (cap, quants = CAPACITATS[cap].length) =>
  Object.fromEntries(CAPACITATS[cap].slice(0, quants).map((nom) => [nom, () => nom]));

/* E2 de tractor-enxufe, però en temps d'execució i en els dos sentits. */
test('el port delega exactament el contracte: ni un mètode de més ni un de menys', () => {
  for (const nom of CONTRACTE_BACKEND) expect(typeof port[nom], nom).toBe('function');
  const delegats = Object.keys(port).filter((nom) => !INFRAESTRUCTURA.includes(nom)).sort();
  expect(delegats).toEqual([...CONTRACTE_BACKEND].sort());
});

test('les capacitats compte i consentiment són les del contracte d’interfícies', () => {
  expect(CAPACITATS.compte).toEqual(['exportaLesMeuesDades', 'estatBaixa', 'demanaBaixa', 'cancelaBaixa']);
  expect(CAPACITATS.consentiment).toEqual(['estatConsentiment', 'registraConsentiment', 'revocaConsentiment']);
  expect(Object.isFrozen(CAPACITATS.compte) && Object.isFrozen(CAPACITATS.consentiment)).toBe(true);
  for (const nom of [...CAPACITATS.compte, ...CAPACITATS.consentiment]) expect(CONTRACTE_NUCLI).not.toContain(nom);
});

test('una capacitat compte a mitges para la validació', () => {
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('compte', 3) }))
    .toThrow('Capacitat parcial: compte');
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('consentiment', 2) }))
    .toThrow('Capacitat parcial: consentiment');
});

test('cicleNotes és una capacitat opcional de dos mètodes, fora del nucli', () => {
  expect(CAPACITATS.cicleNotes).toEqual(['mouNota', 'esborraNota']);
  expect(Object.isFrozen(CAPACITATS.cicleNotes)).toBe(true);
  for (const nom of CAPACITATS.cicleNotes) expect(CONTRACTE_NUCLI).not.toContain(nom);
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('cicleNotes', 1) }))
    .toThrow('Capacitat parcial: cicleNotes');
});

test('un backend injectat sense cicleNotes continua sent vàlid i no pot esborrar', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('cicleNotes')).toBe(false);
  expect(() => port.esborraNota('n', 0)).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('cicleNotes') });
  expect(port.teCapacitat('cicleNotes')).toBe(true);
  expect(port.mouNota('n', 'paperera', 0)).toBe('mouNota');
});

/* T43 (ordre del Mestre, 260928) · administrar organitzacions i el seu correu. */
test('T43 · reclamacions i contacteOrganitzacio són capacitats opcionals de dos mètodes, fora del nucli', () => {
  expect(CAPACITATS.reclamacions).toEqual(['reclamaOrganitzacio', 'lesMevesReclamacions']);
  expect(CAPACITATS.contacteOrganitzacio).toEqual(['llegeixContacteOrganitzacio', 'desaContacteOrganitzacio']);
  for (const cap of ['reclamacions', 'contacteOrganitzacio']) {
    expect(Object.isFrozen(CAPACITATS[cap])).toBe(true);
    for (const nom of CAPACITATS[cap]) {
      expect(CONTRACTE_NUCLI).not.toContain(nom);
      expect(CAPACITATS.admin).not.toContain(nom);
    }
    expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat(cap, 1) })).toThrow(`Capacitat parcial: ${cap}`);
  }
});

test('T43 · un backend injectat sense les capacitats noves continua sent vàlid i no les pot cridar', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('reclamacions')).toBe(false);
  expect(port.teCapacitat('contacteOrganitzacio')).toBe(false);
  expect(() => port.reclamaOrganitzacio('o')).toThrow('no està implementat');
  expect(() => port.llegeixContacteOrganitzacio('o')).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('reclamacions'), ...capacitat('contacteOrganitzacio') });
  expect(port.teCapacitat('reclamacions')).toBe(true);
  expect(port.teCapacitat('contacteOrganitzacio')).toBe(true);
  expect(port.desaContacteOrganitzacio('o', {})).toBe('desaContacteOrganitzacio');
});

/* T63.2 i T67 · el xat comú d'una Pàgina Universal. */
test('T63.2 · xatDePagina és una capacitat opcional d’un mètode, fora del nucli i congelada', () => {
  expect(CAPACITATS.xatDePagina).toEqual(['obriFilDePagina']);
  expect(Object.isFrozen(CAPACITATS.xatDePagina)).toBe(true);
  // T2 i T4 · la salut del node és opcional i no toca el nucli.
  expect(CAPACITATS.salut).toEqual(['comprovaServidor']);
  expect(Object.isFrozen(CAPACITATS.salut)).toBe(true);
  expect(CONTRACTE_NUCLI).not.toContain('comprovaServidor');
  expect(CONTRACTE_NUCLI).not.toContain('obriFilDePagina');
  expect(CONTRACTE_NUCLI).toHaveLength(32);
  expect(CONTRACTE_BACKEND).toContain('obriFilDePagina');
});

test('T63.2 · un backend sense xatDePagina continua sent vàlid i no el pot cridar', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('xatDePagina')).toBe(false);
  expect(() => port.obriFilDePagina({ tipus: 'publicacio', id: 'p1' })).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('xatDePagina') });
  expect(port.teCapacitat('xatDePagina')).toBe(true);
  expect(port.obriFilDePagina({ tipus: 'publicacio', id: 'p1' })).toBe('obriFilDePagina');
});

test('T63.2 · la llista blanca de subjectes no admet cap tipus privat ni personal', () => {
  const tots = [...TIPUS_SUBJECTE_XAT.comunitat, ...TIPUS_SUBJECTE_XAT.grup];
  for (const privat of ['nota', 'carpeta', 'categoria', 'etiqueta', 'persona', 'ia']) expect(tots).not.toContain(privat);
  expect(new Set(tots).size).toBe(tots.length);
  expect(Object.isFrozen(TIPUS_SUBJECTE_XAT.comunitat) && Object.isFrozen(TIPUS_SUBJECTE_XAT.grup)).toBe(true);
});

describe('T63.2 · subjecteDeXat', () => {
  it('entitat, poble i organització fan comunitat; la resta de comentables, grup', () => {
    expect(subjecteDeXat({ tipus: 'entitat', id: 'org-1', titol: 'Cooperativa', ruta: '/empresa/org-1' }))
      .toEqual({ tipus: 'entitat', id: 'org-1', ruta: '/empresa/org-1', titol: 'Cooperativa', classe: 'comunitat' });
    expect(subjecteDeXat({ tipus: 'poble', id: 'la-torre' }).classe).toBe('comunitat');
    /* Àlies: la mateixa organització no pot tindre dos comunitats. */
    expect(subjecteDeXat({ tipus: 'organitzacio', id: 'o' })).toMatchObject({ tipus: 'entitat', id: 'o', classe: 'comunitat' });
    for (const tipus of ['publicacio', 'producte', 'esdeveniment', 'multimedia', 'grup']) {
      expect(subjecteDeXat({ tipus, id: 'x-1' })).toMatchObject({ tipus, id: 'x-1', classe: 'grup', ruta: null, titol: null });
    }
  });

  it('els tipus no comentables i els objectes sense id estable no tenen xat', () => {
    for (const tipus of ['nota', 'carpeta', 'categoria', 'etiqueta', 'persona', 'ia', 'desconegut', '']) {
      expect(subjecteDeXat({ tipus, id: 'x' })).toBeNull();
    }
    expect(subjecteDeXat({ tipus: 'publicacio', id: '' })).toBeNull();
    expect(subjecteDeXat({ tipus: 'publicacio', id: '   ' })).toBeNull();
    expect(subjecteDeXat({ tipus: 'publicacio', id: 'x'.repeat(201) })).toBeNull();
    expect(subjecteDeXat(null)).toBeNull();
    expect(subjecteDeXat('publicacio:1')).toBeNull();
  });

  it('una pàgina només té xat si és de la llista tancada i la ruta en fa d’id; si cau al títol, no en té', () => {
    expect(subjecteDeXat({ tipus: 'pagina', id: '/constitucio', ruta: '/constitucio', titol: 'Constitució' }))
      .toMatchObject({ tipus: 'pagina', id: '/constitucio', classe: 'grup' });
    expect(subjecteDeXat({ tipus: 'pagina', id: '/mur', ruta: '/mur' })).toMatchObject({ id: '/mur' });
    expect(subjecteDeXat({ tipus: 'pagina', id: 'Constitució', ruta: '', titol: 'Constitució' })).toBeNull();
    expect(subjecteDeXat({ tipus: 'pagina', id: 'p-1', ruta: '/constitucio' })).toBeNull();
    for (const ruta of ['/', '/cerca?q=festa', '/constitucio#seccio', '/constitucio/', `/${'a'.repeat(200)}`]) {
      expect(subjecteDeXat({ tipus: 'pagina', id: ruta, ruta })).toBeNull();
    }
  });

  it('una ruta privada o inventada no té xat de pàgina: ni notes, ni persones, ni vistes pròpies, ni detalls', () => {
    for (const ruta of ['/notes', '/notes/3f2c', '/gent/u1', '/perfil/iaia', '/el-meu-perfil', '/xat', '/xat/f1',
      '/control', '/consola', '/connectar', '/registre', '/e/x', '/a1', '/wiki/00_PORTAL', '/mur/3', '/events/fira', '/notesdepoble']) {
      expect(subjecteDeXat({ tipus: 'pagina', id: ruta, ruta, titol: 'Avís oficial' }), ruta).toBeNull();
    }
  });

  /* Gauntlet 261016_1530 (Bloc 3.6.3; F64 i F65) · Actualitzada a posta. El
     manifest «L'ànima de la iaia» (la secció 'ia') ha passat de /iaia a
     /anima, i /iaia és la fitxa de la IAIA MarIA. La clau '/iaia' del xat
     públic NO canvia (és el contracte del servidor, 2610042330, que
     tests/migracio-xat-de-pagina.test.mjs contrasta): és l'única que ja no és
     el path d'una secció, sinó la ruta de la fitxa de la IAIA, amb el títol
     literal del servidor. Cap altra clau té excepció, i /anima no guanya cap
     xat comú (seria una migració). */
  it('PAGINES_AMB_XAT són pàgines públiques de SECTION_ORDER, amb el seu nom, sense el Xat ni les Notes', () => {
    expect(Object.isFrozen(PAGINES_AMB_XAT)).toBe(true);
    /* Només en un sentit: una secció nova no té xat fins que el Mestre ho decidix. */
    for (const [ruta, titol] of Object.entries(PAGINES_AMB_XAT)) {
      if (ruta === RUTA_FITXA_IAIA) continue;
      const seccio = SECTIONS.find((s) => s.path === ruta);
      expect(seccio, ruta).toBeTruthy();
      expect(SECTION_ORDER, ruta).toContain(seccio.id);
      expect(['xat', 'notes'], ruta).not.toContain(seccio.id);
      expect(titol, ruta).toBe(seccio.label);
    }
  });

  it('Bloc 3.6.3 · la clau /iaia és el xat públic de la IAIA, a la ruta de la seua fitxa; el manifest, a /anima, sense xat comú', () => {
    expect(RUTA_FITXA_IAIA).toBe('/iaia');
    expect(PAGINES_AMB_XAT[RUTA_FITXA_IAIA]).toBe("L'ànima de la iaia");
    expect(SECTIONS.find((s) => s.path === RUTA_FITXA_IAIA)).toBeUndefined();
    const manifest = SECTIONS.find((s) => s.pageKey === 'anima');
    expect([manifest.id, manifest.path, manifest.label]).toEqual(['ia', '/anima', "L'ànima de la iaia"]);
    expect(Object.hasOwn(PAGINES_AMB_XAT, manifest.path)).toBe(false);
    /* El subjecte del xat de la IAIA es valida igual que abans. */
    expect(subjecteDeXat({ tipus: 'pagina', id: RUTA_FITXA_IAIA, ruta: RUTA_FITXA_IAIA })).toMatchObject({ tipus: 'pagina', id: '/iaia' });
    expect(subjecteDeXat({ tipus: 'pagina', id: '/anima', ruta: '/anima' })).toBeNull();
  });
});

describe('T63.2 · rutaDeSubjecte', () => {
  it('és la de rutaDePerfil i getSectionItemPath per a cada tipus que es guarda', () => {
    expect(rutaDeSubjecte('entitat', 'org-1')).toBe('/empresa/org-1');
    expect(rutaDeSubjecte('grup', 'g1')).toBe('/grup/g1');
    expect(rutaDeSubjecte('poble', 'la-torre')).toBe('/pobles/la-torre');
    expect(rutaDeSubjecte('publicacio', 'p1')).toBe('/mur/p1');
    expect(rutaDeSubjecte('producte', 'samarreta')).toBe('/mercat/samarreta');
    expect(rutaDeSubjecte('esdeveniment', 'fira')).toBe('/events/fira');
    expect(rutaDeSubjecte('multimedia', 'v1')).toBe('/multimedia/v1');
    expect(rutaDeSubjecte('pagina', '/constitucio')).toBe('/constitucio');
  });

  it('una clau que caldria codificar, un tipus sense xat o una pàgina fora de la llista no en tenen', () => {
    for (const clau of ['a b', 'a/b', 'a%2Fb', 'a:b', 'x'.repeat(201), '']) expect(rutaDeSubjecte('publicacio', clau), clau).toBeNull();
    expect(rutaDeSubjecte('nota', 'n1')).toBeNull();
    expect(rutaDeSubjecte('organitzacio', 'o')).toBeNull();
    expect(rutaDeSubjecte('pagina', '/notes/n1')).toBeNull();
    expect(rutaDeSubjecte('pagina', 'toString')).toBeNull();
  });

  it('descarta una ruta externa o bruta sense perdre el subjecte, i retalla el títol a 100', () => {
    for (const ruta of ['//enganyosa.test/x', 'https://fora.test', '/amb espai', '/barra\\invertida']) {
      expect(subjecteDeXat({ tipus: 'publicacio', id: 'p', ruta }).ruta).toBeNull();
    }
    expect(subjecteDeXat({ tipus: 'publicacio', id: 'p', titol: 't'.repeat(150) }).titol).toHaveLength(100);
  });
});

/* R (Onada 3, 261003) · Recuperar la contrasenya perduda. */
test('R · recuperacioContrasenya és una capacitat opcional de dos mètodes, fora del nucli i congelada', () => {
  expect(CAPACITATS.recuperacioContrasenya).toEqual(['demanaRecuperacioContrasenya', 'definixContrasenyaNova']);
  expect(Object.isFrozen(CAPACITATS.recuperacioContrasenya)).toBe(true);
  for (const nom of CAPACITATS.recuperacioContrasenya) {
    expect(CONTRACTE_NUCLI).not.toContain(nom);
    expect(CONTRACTE_BACKEND).toContain(nom);
  }
  /* El nucli no creix: la contrasenya nova de la sessió viva continua sent updateUserPassword. */
  expect(CONTRACTE_NUCLI).toHaveLength(32);
  expect(CONTRACTE_NUCLI).toContain('updateUserPassword');
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('recuperacioContrasenya', 1) }))
    .toThrow('Capacitat parcial: recuperacioContrasenya');
});

test('R · un backend injectat sense recuperacioContrasenya continua sent vàlid i no la pot cridar', () => {
  expect(() => port.validaBackendImplementation(nucli())).not.toThrow();
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('recuperacioContrasenya')).toBe(false);
  expect(() => port.demanaRecuperacioContrasenya('a@poble.test')).toThrow('no està implementat');
  expect(() => port.definixContrasenyaNova('contrasenya-nova')).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('recuperacioContrasenya') });
  expect(port.teCapacitat('recuperacioContrasenya')).toBe(true);
  expect(port.demanaRecuperacioContrasenya('a@poble.test')).toBe('demanaRecuperacioContrasenya');
  expect(port.definixContrasenyaNova('contrasenya-nova')).toBe('definixContrasenyaNova');
});

/* Fase D (261020, tasca 1) · Entrar amb el testimoni d'un proveïdor (Apple, Google). */
test('Fase D · entradaAmbToken és una capacitat opcional d’un mètode, fora del nucli i congelada', () => {
  expect(CAPACITATS.entradaAmbToken).toEqual(['entraAmbTokenDeProveidor']);
  expect(Object.isFrozen(CAPACITATS.entradaAmbToken)).toBe(true);
  expect(CONTRACTE_NUCLI).not.toContain('entraAmbTokenDeProveidor');
  expect(CONTRACTE_BACKEND).toContain('entraAmbTokenDeProveidor');
  /* El nucli no creix. */
  expect(CONTRACTE_NUCLI).toHaveLength(32);
});

test('Fase D · un backend sense entradaAmbToken continua sent vàlid i no la pot cridar', () => {
  expect(() => port.validaBackendImplementation(nucli())).not.toThrow();
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('entradaAmbToken')).toBe(false);
  expect(() => port.entraAmbTokenDeProveidor('apple', { testimoni: 'a.b.c' })).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('entradaAmbToken') });
  expect(port.teCapacitat('entradaAmbToken')).toBe(true);
  expect(port.entraAmbTokenDeProveidor('apple', { testimoni: 'a.b.c' })).toBe('entraAmbTokenDeProveidor');
});

/* Ordre del Mestre (261008, grup C) · Els membres d'una organització. */
test('grup C · membresOrganitzacio és una capacitat opcional de tres mètodes, fora del nucli i congelada', () => {
  expect(CAPACITATS.membresOrganitzacio).toEqual(['llistaMembresOrganitzacio', 'desaMembreOrganitzacio', 'llevaMembreOrganitzacio']);
  expect(Object.isFrozen(CAPACITATS.membresOrganitzacio)).toBe(true);
  for (const nom of CAPACITATS.membresOrganitzacio) {
    expect(CONTRACTE_NUCLI).not.toContain(nom);
    expect(CONTRACTE_BACKEND).toContain(nom);
  }
  /* El nucli no creix. */
  expect(CONTRACTE_NUCLI).toHaveLength(32);
  for (const quants of [1, 2]) {
    expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('membresOrganitzacio', quants) }))
      .toThrow('Capacitat parcial: membresOrganitzacio');
  }
});

test('grup C · un backend sense membresOrganitzacio continua sent vàlid i no la pot cridar', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('membresOrganitzacio')).toBe(false);
  expect(() => port.llistaMembresOrganitzacio('o')).toThrow('no està implementat');
  expect(() => port.desaMembreOrganitzacio('o', { tipus: 'persona', id: 'p' })).toThrow('no està implementat');
  expect(() => port.llevaMembreOrganitzacio('o', { tipus: 'persona', id: 'p' })).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('membresOrganitzacio') });
  expect(port.teCapacitat('membresOrganitzacio')).toBe(true);
  expect(port.llevaMembreOrganitzacio('o', { tipus: 'persona', id: 'p' })).toBe('llevaMembreOrganitzacio');
});

describe('grup C · membreDOrganitzacio i els codis SDP-ORGMEM', () => {
  it('normalitza: rol member per defecte; una persona pot ser admin; una organització, només member', () => {
    expect(membreDOrganitzacio({ tipus: ' persona ', id: ' p1 ' })).toEqual({ tipus: 'persona', id: 'p1', rol: 'member' });
    expect(membreDOrganitzacio({ tipus: 'persona', id: 'p1', rol: 'admin' })).toEqual({ tipus: 'persona', id: 'p1', rol: 'admin' });
    expect(membreDOrganitzacio({ tipus: 'organitzacio', id: 'o1', rol: '' })).toEqual({ tipus: 'organitzacio', id: 'o1', rol: 'member' });
    expect(membreDOrganitzacio({ tipus: 'organitzacio', id: 'o1', rol: 'admin' }, { ambRol: false })).toEqual({ tipus: 'organitzacio', id: 'o1' });
  });

  it('rebutja amb SDP-ORGMEM-001 un tipus inventat, un id buit, owner o un rol que no toca', () => {
    for (const dades of [null, {}, { tipus: 'persona' }, { tipus: 'persona', id: '  ' }, { tipus: 'grup', id: 'g' },
      { tipus: 'persona', id: 'p', rol: 'owner' }, { tipus: 'persona', id: 'p', rol: 'Admin' }, { tipus: 'organitzacio', id: 'o', rol: 'admin' }]) {
      let error = null;
      try { membreDOrganitzacio(dades); } catch (e) { error = e; }
      expect(error, JSON.stringify(dades)).toMatchObject({ code: 'SDP-ORGMEM-001', message: MISSATGES_MEMBRES_ORGANITZACIO['SDP-ORGMEM-001'] });
    }
    expect(() => membreDOrganitzacio({ tipus: 'grup', id: 'g' }, { ambRol: false })).toThrow(MISSATGES_MEMBRES_ORGANITZACIO['SDP-ORGMEM-001']);
  });

  it('els nou codis tenen missatge en valencià; un error porta el code i, si n’hi ha, la causa', () => {
    expect(Object.keys(MISSATGES_MEMBRES_ORGANITZACIO)).toEqual(Array.from({ length: 9 }, (_, i) => `SDP-ORGMEM-00${i}`));
    expect(Object.isFrozen(MISSATGES_MEMBRES_ORGANITZACIO)).toBe(true);
    for (const missatge of Object.values(MISSATGES_MEMBRES_ORGANITZACIO)) expect(missatge).toMatch(/^[A-ZÀ-Ú].*\.$/);
    const causa = new Error('cru');
    expect(errorDeMembre('SDP-ORGMEM-006', causa)).toMatchObject({ code: 'SDP-ORGMEM-006', cause: causa,
      message: 'Només la propietària nomena, degrada o lleva administradores.' });
    expect(errorDeMembre('SDP-ORGMEM-000')).not.toHaveProperty('cause');
  });
});

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
   superadmin i la personalització del poble. */
test('Onada 11 · segonFactor és una capacitat opcional de cinc mètodes, fora del nucli i congelada', () => {
  expect(CAPACITATS.segonFactor).toEqual(['llistaFactors', 'inscriuFactor', 'reptaFactor', 'verificaFactor', 'retiraFactor']);
  expect(Object.isFrozen(CAPACITATS.segonFactor)).toBe(true);
  for (const nom of CAPACITATS.segonFactor) {
    expect(CONTRACTE_NUCLI).not.toContain(nom);
    expect(CAPACITATS.sessio).not.toContain(nom);
    expect(CONTRACTE_BACKEND).toContain(nom);
  }
  /* El nucli no creix. */
  expect(CONTRACTE_NUCLI).toHaveLength(32);
  for (const quants of [1, 2, 3, 4]) {
    expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('segonFactor', quants) }))
      .toThrow('Capacitat parcial: segonFactor');
  }
});

test('Onada 11 · un backend sense segonFactor continua sent vàlid i no el pot cridar', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('segonFactor')).toBe(false);
  expect(() => port.llistaFactors({})).toThrow('no està implementat');
  expect(() => port.inscriuFactor('Mòbil', {})).toThrow('no està implementat');
  expect(() => port.reptaFactor('f', {})).toThrow('no està implementat');
  expect(() => port.verificaFactor({ factorId: 'f', repteId: 'r', codi: '000000' }, {})).toThrow('no està implementat');
  expect(() => port.retiraFactor('f', {})).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('segonFactor') });
  expect(port.teCapacitat('segonFactor')).toBe(true);
  expect(port.verificaFactor({ factorId: 'f', repteId: 'r', codi: '000000' }, {})).toBe('verificaFactor');
});

test('Onada 11 · personalitzacio és una capacitat opcional de dos mètodes, fora del nucli i de admin, i congelada', () => {
  expect(CAPACITATS.personalitzacio).toEqual(['adminDesaPersonalitzacio', 'adminHistorialPersonalitzacio']);
  expect(Object.isFrozen(CAPACITATS.personalitzacio)).toBe(true);
  for (const nom of CAPACITATS.personalitzacio) {
    expect(CONTRACTE_NUCLI).not.toContain(nom);
    expect(CAPACITATS.admin).not.toContain(nom);
    expect(CONTRACTE_BACKEND).toContain(nom);
  }
  /* La lectura no és cap mètode nou: viatja dins de loadCoreContent. */
  expect(CONTRACTE_BACKEND.filter((nom) => /personalitzacio/i.test(nom))).toEqual(CAPACITATS.personalitzacio);
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('personalitzacio', 1) }))
    .toThrow('Capacitat parcial: personalitzacio');
});

test('Onada 11 · un backend sense personalitzacio continua sent vàlid i no la pot cridar', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('personalitzacio')).toBe(false);
  expect(() => port.adminDesaPersonalitzacio({ clau: 'taxonomia', payload: {}, versio: null }, {})).toThrow('no està implementat');
  expect(() => port.adminHistorialPersonalitzacio('taxonomia', {})).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('personalitzacio') });
  expect(port.teCapacitat('personalitzacio')).toBe(true);
  expect(port.adminDesaPersonalitzacio({ clau: 'estil', payload: {}, versio: null }, {})).toBe('adminDesaPersonalitzacio');
  expect(port.adminHistorialPersonalitzacio('estil', {})).toBe('adminHistorialPersonalitzacio');
});

/* Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · La biblioteca
   de fotos pròpies de «Multimèdia». Capacitat a banda: dins de 'mitjans', el
   control de capacitat parcial tombaria la pujada d'avatars d'un backend que
   només sap pujar. */
test('Pla 261018_1605 · mitjansPropis és una capacitat opcional de dos mètodes, fora del nucli i de mitjans, i congelada', () => {
  expect(CAPACITATS.mitjansPropis).toEqual(['llistaElsMeusMitjans', 'esborraElMeuMitja']);
  expect(Object.isFrozen(CAPACITATS.mitjansPropis)).toBe(true);
  expect(CAPACITATS.mitjans).toEqual(['uploadToStorage', 'getPublicUrl', 'resolveAsset', 'promoteToPublic']);
  for (const nom of CAPACITATS.mitjansPropis) {
    expect(CONTRACTE_NUCLI).not.toContain(nom);
    expect(CAPACITATS.mitjans).not.toContain(nom);
    expect(CONTRACTE_BACKEND).toContain(nom);
  }
  /* El nucli no creix. */
  expect(CONTRACTE_NUCLI).toHaveLength(32);
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('mitjansPropis', 1) }))
    .toThrow('Capacitat parcial: mitjansPropis');
});

test('Pla 261018_1605 · un backend que només sap pujar continua tenint mitjans i no pot llistar ni esborrar', () => {
  port.setBackendImplementation({ ...nucli(), ...capacitat('mitjans') });
  expect(port.teCapacitat('mitjans')).toBe(true);
  expect(port.teCapacitat('mitjansPropis')).toBe(false);
  expect(() => port.llistaElsMeusMitjans({})).toThrow('no està implementat');
  expect(() => port.esborraElMeuMitja('sdp-media://mitjans/x.webp', {})).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('mitjans'), ...capacitat('mitjansPropis') });
  expect(port.teCapacitat('mitjans')).toBe(true);
  expect(port.teCapacitat('mitjansPropis')).toBe(true);
  expect(port.llistaElsMeusMitjans({})).toBe('llistaElsMeusMitjans');
  expect(port.esborraElMeuMitja('sdp-media://mitjans/x.webp', {})).toBe('esborraElMeuMitja');
});

test('un node amb el nucli sol continua sent vàlid, sense compte ni consentiment', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('compte')).toBe(false);
  expect(port.teCapacitat('consentiment')).toBe(false);
  expect(() => port.exportaLesMeuesDades()).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('compte'), ...capacitat('consentiment') });
  expect(port.teCapacitat('compte')).toBe(true);
  expect(port.teCapacitat('consentiment')).toBe(true);
});

/* ── Fase D (261020, tasca 2; pla 261020_1300) · La moderació ── */
test('Fase D · moderacio i normesConvivencia són capacitats opcionals, fora del nucli, i congelades', () => {
  expect(CAPACITATS.moderacio).toEqual(['denunciaContingut', 'llistaBloquejos', 'bloquejaAutor', 'desbloquejaAutor']);
  expect(CAPACITATS.normesConvivencia).toEqual(['estatNormes', 'acceptaNormes']);
  for (const cap of ['moderacio', 'normesConvivencia']) {
    expect(Object.isFrozen(CAPACITATS[cap])).toBe(true);
    for (const nom of CAPACITATS[cap]) {
      expect(CONTRACTE_NUCLI).not.toContain(nom);
      expect(CONTRACTE_BACKEND).toContain(nom);
    }
    expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat(cap, 1) })).toThrow(`Capacitat parcial: ${cap}`);
  }
});

test('Fase D · un backend sense moderació continua sent vàlid i no la pot cridar', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('moderacio')).toBe(false);
  expect(port.teCapacitat('normesConvivencia')).toBe(false);
  expect(() => port.llistaBloquejos({})).toThrow('no està implementat');
  expect(() => port.estatNormes({})).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('moderacio'), ...capacitat('normesConvivencia') });
  expect(port.teCapacitat('moderacio')).toBe(true);
  expect(port.teCapacitat('normesConvivencia')).toBe(true);
  expect(port.bloquejaAutor({ tipus: 'persona', id: 'p' }, {})).toBe('bloquejaAutor');
  expect(port.acceptaNormes(VERSIO_NORMES_CONVIVENCIA, {})).toBe('acceptaNormes');
});

describe('Fase D · la regla d’entrada de la moderació', () => {
  it('les llistes blanques són les de la migració, congelades', () => {
    expect(TIPUS_OBJECTE_DENUNCIA).toEqual(['publicacio', 'producte', 'esdeveniment', 'missatge', 'persona', 'entitat']);
    expect(MOTIUS_DENUNCIA).toEqual(['ofensiu', 'spam_frau', 'desinformacio', 'altre']);
    expect(TIPUS_BLOQUEJAT).toEqual(['persona', 'entitat']);
    expect([MAXIM_DETALL_DENUNCIA, MAXIM_NOM_BLOQUEJAT]).toEqual([1000, 120]);
    expect(VERSIO_NORMES_CONVIVENCIA).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const llista of [TIPUS_OBJECTE_DENUNCIA, MOTIUS_DENUNCIA, TIPUS_BLOQUEJAT, CODI_MODERACIO, MISSATGE_MODERACIO]) {
      expect(Object.isFrozen(llista)).toBe(true);
    }
  });

  it('cada codi té un missatge en valencià, i un error porta el code i la causa', () => {
    expect(Object.keys(MISSATGE_MODERACIO).sort()).toEqual(Object.values(CODI_MODERACIO).sort());
    for (const text of Object.values(MISSATGE_MODERACIO)) expect(text).toMatch(/^[A-ZÀ-Ú].*\.$/);
    const causa = new Error('cru');
    const error = errorDeModeracio(CODI_MODERACIO.LIMIT, causa);
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ code: 'limit', message: MISSATGE_MODERACIO.limit, cause: causa });
    expect(errorDeModeracio('inventat').code).toBe('desconegut');
  });

  it('esIdDeModeracio: el CHECK de la migració', () => {
    expect(esIdDeModeracio('a1b2-c3.d_e:f~g')).toBe(true);
    expect(esIdDeModeracio('x'.repeat(200))).toBe(true);
    for (const dolent of ['', 'amb espai', 'x'.repeat(201), 'barra/no', null, 7]) expect(esIdDeModeracio(dolent)).toBe(false);
  });

  it('denunciaDelContracte normalitza i descarta l’autor o el fil que no casen', () => {
    expect(denunciaDelContracte({ objecte: { tipus: ' publicacio ', id: ' p1 ' }, motiu: 'ofensiu', detall: '  massa soroll  ',
      autor: { tipus: 'persona', id: 'u1' }, filId: 'f1' }))
      .toEqual({ objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'ofensiu', detall: 'massa soroll', autor: { tipus: 'persona', id: 'u1' }, filId: 'f1' });
    expect(denunciaDelContracte({ objecte: { tipus: 'missatge', id: 'm1' }, motiu: 'altre', detall: '   ',
      autor: { tipus: 'ia', id: 'iaia' }, filId: 'amb espai' }))
      .toEqual({ objecte: { tipus: 'missatge', id: 'm1' }, motiu: 'altre', detall: null, autor: null, filId: null });
    expect(denunciaDelContracte({ objecte: { tipus: 'persona', id: 'u1' }, motiu: 'spam_frau', detall: 'x'.repeat(1000) }).detall).toHaveLength(1000);
  });

  it('denunciaDelContracte rebutja amb el code: objecte, motiu i detall', () => {
    const codi = (dades) => { try { denunciaDelContracte(dades); return null; } catch (error) { return error.code; } };
    expect(codi({ objecte: { tipus: 'nota', id: 'n1' }, motiu: 'ofensiu' })).toBe('objectiu-invalid');
    expect(codi({ objecte: { tipus: 'publicacio', id: 'amb espai' }, motiu: 'ofensiu' })).toBe('objectiu-invalid');
    expect(codi({ objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'inventat' })).toBe('motiu-invalid');
    expect(codi({ objecte: { tipus: 'publicacio', id: 'p1' }, motiu: 'ofensiu', detall: 'x'.repeat(1001) })).toBe('detall-massa-llarg');
  });

  it('autorDelContracte normalitza el nom (retallat, null si és buit) i rebutja el que no és persona ni entitat', () => {
    expect(autorDelContracte({ tipus: 'entitat', id: 'e1', nom: `  ${'n'.repeat(130)} ` })).toEqual({ tipus: 'entitat', id: 'e1', nom: 'n'.repeat(120) });
    expect(autorDelContracte({ tipus: 'persona', id: 'u1', nom: '  ' })).toEqual({ tipus: 'persona', id: 'u1', nom: null });
    expect(autorDelContracte({ tipus: 'persona', id: 'u1', nom: 'Pep' }, { ambNom: false })).toEqual({ tipus: 'persona', id: 'u1' });
    for (const dolent of [{ tipus: 'grup', id: 'g1' }, { tipus: 'persona', id: '' }, { tipus: 'persona', id: 'a b' }, null]) {
      expect(() => autorDelContracte(dolent)).toThrow(expect.objectContaining({ code: 'objectiu-invalid' }));
    }
  });
});

/* ── T6b (IDEA-14; decisió del Mestre, 261024) · Els seguiments ── */
test('T6b · seguiments és una capacitat opcional de cinc mètodes, fora del nucli, i congelada', () => {
  expect(CAPACITATS.seguiments).toEqual(['segueix', 'deixaDeSeguir', 'estatSeguiment', 'elsMeusSeguiments', 'quiEmSegueix']);
  expect(Object.isFrozen(CAPACITATS.seguiments)).toBe(true);
  for (const nom of CAPACITATS.seguiments) {
    expect(CONTRACTE_NUCLI).not.toContain(nom);
    expect(CONTRACTE_BACKEND).toContain(nom);
    expect(CAPACITATS.moderacio).not.toContain(nom);
    expect(typeof port[nom], nom).toBe('function');
  }
  expect(() => port.validaBackendImplementation({ ...nucli(), ...capacitat('seguiments', 4) })).toThrow('Capacitat parcial: seguiments');
});

test('T6b · un backend sense seguiments continua sent vàlid i no els pot cridar; amb ells, el port hi delega', () => {
  port.setBackendImplementation(nucli());
  expect(port.teCapacitat('seguiments')).toBe(false);
  expect(() => port.quiEmSegueix({}, {})).toThrow('no està implementat');
  expect(() => port.segueix({ tipus: 'persona', id: 'p' }, {})).toThrow('no està implementat');
  port.setBackendImplementation({ ...nucli(), ...capacitat('seguiments') });
  expect(port.teCapacitat('seguiments')).toBe(true);
  expect(port.segueix({ tipus: 'persona', id: 'p' }, {})).toBe('segueix');
  expect(port.elsMeusSeguiments({})).toBe('elsMeusSeguiments');
});

describe('T6b · la regla d’entrada dels seguiments', () => {
  it('la llista blanca és la del CHECK de la migració, i els codis són SDP-SEG-000…006 més NO-DISPONIBLE i DESCONEGUT', () => {
    expect(TIPUS_SEGUIT).toEqual(['persona', 'entitat']);
    expect(Object.isFrozen(TIPUS_SEGUIT) && Object.isFrozen(MISSATGES_SEGUIMENTS)).toBe(true);
    expect(Object.keys(MISSATGES_SEGUIMENTS)).toEqual([
      ...Array.from({ length: 7 }, (_, i) => `SDP-SEG-00${i}`), 'NO-DISPONIBLE', 'DESCONEGUT'
    ]);
    for (const text of Object.values(MISSATGES_SEGUIMENTS)) expect(text).toMatch(/^[A-ZÀ-Ú].*\.$/);
  });

  it('errorDeSeguiment porta el code, el missatge i la causa; un codi desconegut és DESCONEGUT', () => {
    const causa = new Error('cru');
    expect(errorDeSeguiment('SDP-SEG-004', causa)).toMatchObject({ code: 'SDP-SEG-004', message: MISSATGES_SEGUIMENTS['SDP-SEG-004'], cause: causa });
    expect(errorDeSeguiment('SDP-SEG-999')).toMatchObject({ code: 'DESCONEGUT', message: MISSATGES_SEGUIMENTS.DESCONEGUT });
    expect(errorDeSeguiment('SDP-SEG-000')).toBeInstanceOf(Error);
  });

  it('seguitDelContracte normalitza i rebutja amb SDP-SEG-001 el que no és persona ni entitat, o un id buit o estrany', () => {
    expect(seguitDelContracte({ tipus: ' entitat ', id: ' socdepoble ' })).toEqual({ tipus: 'entitat', id: 'socdepoble' });
    expect(seguitDelContracte({ tipus: 'persona', id: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5', nom: 'sobra' }))
      .toEqual({ tipus: 'persona', id: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5' });
    for (const dolent of [{ tipus: 'grup', id: 'g1' }, { tipus: 'ia', id: 'iaia' }, { tipus: 'persona', id: '' }, { tipus: 'persona', id: 'a b' },
      { tipus: 'entitat', id: 'x'.repeat(201) }, null]) {
      expect(() => seguitDelContracte(dolent)).toThrow(expect.objectContaining({ code: 'SDP-SEG-001' }));
    }
  });
});
