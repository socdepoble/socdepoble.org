import { expect, test } from 'vitest';
import { AUTORIA_BENVINGUDA, ID_COPIA_PROVA, autoriaDeNota, rutaDAutoriaDeNota, signaturaDeNota } from './autoriaNota.js';
import { DEFAULT_AUTHOR, FORASTER } from '../../components/universal/UniversalUtils.js';
import { RUTA_PROJECTE } from '../../config/navigation.js';
import { ENTITAT_PILOT_ID } from '../../data/identitatsSeed.js';

/* T50 (D2) · Una sola autoria per a la barra taronja de l'editor de notes i
   per a la targeta viva de la llista. */
const PEPA = { id: 'U', user_metadata: { name: 'Pepa', avatar_url: 'https://exemple.org/pepa.png', town_name: 'Benifallim' } };

test('la nota de benvinguda (n1) és de Sóc de Poble, a La Torre, per a tothom', () => {
  expect(autoriaDeNota({ notaId: 'n1', currentUser: PEPA })).toBe(AUTORIA_BENVINGUDA);
  expect(autoriaDeNota({ notaId: 'n1', actor: { tipus: 'entitat', nom: 'Forn' } })).toBe(AUTORIA_BENVINGUDA);
});

test('amb una entitat activa signa l’entitat (nom i logo), mai la persona; el poble no se sap', () => {
  const actor = { tipus: 'entitat', id: 'O', nom: 'Forn & Cia', avatar: 'https://exemple.org/forn.png' };
  expect(autoriaDeNota({ notaId: 'p', actor, actorId: 'O', currentUser: PEPA }))
    .toEqual({ nom: 'Forn & Cia', avatar: 'https://exemple.org/forn.png', poble: '' });
  // Sense logo, cap imatge: la barra i la targeta pinten la silueta de reserva.
  expect(autoriaDeNota({ notaId: 'p', actor: { ...actor, avatar: '' }, actorId: 'O', currentUser: PEPA }).avatar).toBeNull();
});

test('un agent IA actiu signa amb el seu nom, la seua foto i el seu poble', () => {
  const agents = [{ id: 'A1', name: 'IAIA', image_url: '/assets/iaia.webp', location: 'Benilloba' }];
  expect(autoriaDeNota({ notaId: 'p', actorId: 'A1', agents, currentUser: PEPA }))
    .toEqual({ nom: 'IAIA', avatar: '/assets/iaia.webp', poble: 'Benilloba' });
});

test('si no, la sessió: nom, foto i poble (buit si no en té, mai el del Foraster)', () => {
  expect(autoriaDeNota({ notaId: 'p', actorId: 'U', currentUser: PEPA }))
    .toEqual({ nom: 'Pepa', avatar: 'https://exemple.org/pepa.png', poble: 'Benifallim' });
  expect(autoriaDeNota({ notaId: 'p', currentUser: { id: 'U', user_metadata: { name: 'Pep' } } }))
    .toEqual({ nom: 'Pep', avatar: null, poble: '' });
});

/* T65 (decisió del Mestre, 260928: «Editable, signa Sóc de Poble») · La
   còpia de la benvinguda que prova el Foraster ja no la signa el Foraster. */
test('sense sessió, una nota normal: el Foraster sencer, nom i poble junts', () => {
  expect(autoriaDeNota({ notaId: 'p' })).toEqual({ nom: FORASTER.name, avatar: null, poble: FORASTER.location });
  expect(autoriaDeNota()).toEqual({ nom: FORASTER.name, avatar: null, poble: FORASTER.location });
});

test('T65 · l’autoria de la benvinguda és Sóc de Poble amb el seu avatar oficial, la de les pàgines de sistema', () => {
  expect(AUTORIA_BENVINGUDA).toEqual({
    nom: 'Sóc de Poble',
    avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
    poble: 'La Torre de les Maçanes'
  });
  expect(AUTORIA_BENVINGUDA).toEqual({ nom: DEFAULT_AUTHOR.name, avatar: DEFAULT_AUTHOR.avatarUrl, poble: DEFAULT_AUTHOR.location });
  expect(Object.isFrozen(AUTORIA_BENVINGUDA)).toBe(true);
});

test('T65 · la còpia de prova de la benvinguda la signa Sóc de Poble, la llija o l’edite qui siga', () => {
  expect(ID_COPIA_PROVA).toBe('prova-local');
  // El Foraster (sense sessió).
  expect(autoriaDeNota({ notaId: ID_COPIA_PROVA })).toBe(AUTORIA_BENVINGUDA);
  // Una persona amb sessió, una entitat activa o un agent IA actiu: tampoc la signen.
  expect(autoriaDeNota({ notaId: ID_COPIA_PROVA, actorId: 'U', currentUser: PEPA })).toBe(AUTORIA_BENVINGUDA);
  expect(autoriaDeNota({ notaId: ID_COPIA_PROVA, actor: { tipus: 'entitat', id: 'O', nom: 'Forn' }, actorId: 'O', currentUser: PEPA }))
    .toBe(AUTORIA_BENVINGUDA);
  const agents = [{ id: 'A1', name: 'IAIA', image_url: '/assets/iaia.webp', location: 'Benilloba' }];
  expect(autoriaDeNota({ notaId: ID_COPIA_PROVA, actorId: 'A1', agents, currentUser: PEPA })).toBe(AUTORIA_BENVINGUDA);
});

test('T65 · una nota normal continua signant qui l’escriu: el Foraster sense sessió, la persona amb sessió', () => {
  expect(autoriaDeNota({ notaId: 'nota-del-foraster' }).nom).toBe(FORASTER.name);
  expect(autoriaDeNota({ notaId: 'nota-de-pepa', actorId: 'U', currentUser: PEPA }))
    .toEqual({ nom: 'Pepa', avatar: 'https://exemple.org/pepa.png', poble: 'Benifallim' });
  // Un id que només s'hi assembla no és la benvinguda.
  expect(autoriaDeNota({ notaId: 'prova-local-2' }).nom).toBe(FORASTER.name);
  expect(autoriaDeNota({ notaId: 'n10', currentUser: PEPA }).nom).toBe('Pepa');
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». La ruta segueix la mateixa tria que
   el nom: la barra no pot dir un autor i portar a la pàgina d'un altre. */
test('261007 · la benvinguda i la còpia de prova porten a la pàgina del projecte, signe qui signe', () => {
  expect(RUTA_PROJECTE).toBe('/projecte');
  expect(rutaDAutoriaDeNota({ notaId: 'n1', currentUser: PEPA })).toBe(RUTA_PROJECTE);
  expect(rutaDAutoriaDeNota({ notaId: ID_COPIA_PROVA })).toBe(RUTA_PROJECTE);
  expect(rutaDAutoriaDeNota({ notaId: ID_COPIA_PROVA, actor: { tipus: 'entitat', id: 'O', nom: 'Forn' }, actorId: 'O', currentUser: PEPA }))
    .toBe(RUTA_PROJECTE);
});

test('261007 · una entitat activa porta a la seua fitxa (l’entitat pilot, a /projecte), mai a la persona', () => {
  const actor = { tipus: 'entitat', id: 'O', nom: 'Forn & Cia' };
  expect(rutaDAutoriaDeNota({ notaId: 'p', actor, actorId: 'O', currentUser: PEPA })).toBe('/empresa/O');
  const pilot = { tipus: 'entitat', id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' };
  expect(rutaDAutoriaDeNota({ notaId: 'p', actor: pilot, actorId: ENTITAT_PILOT_ID, currentUser: PEPA })).toBe(RUTA_PROJECTE);
  // Una entitat sense nom públic no signa: signa la sessió, i la ruta també és la seua.
  expect(rutaDAutoriaDeNota({ notaId: 'p', actor: { tipus: 'entitat', id: 'O', nom: '' }, actorId: 'O', currentUser: PEPA })).toBe('/gent/U');
});

test('261007 · un agent IA actiu porta a la seua fitxa; la persona amb sessió, a la seua; el Foraster, enlloc', () => {
  const agents = [{ id: 'A1', name: 'IAIA', image_url: '/assets/iaia.webp', location: 'Benilloba' }];
  expect(rutaDAutoriaDeNota({ notaId: 'p', actorId: 'A1', agents, currentUser: PEPA })).toBe('/perfil/A1');
  expect(rutaDAutoriaDeNota({ notaId: 'p', actorId: 'U', currentUser: PEPA })).toBe('/gent/U');
  // Un nom sense identitat coneguda no s'endevina.
  expect(rutaDAutoriaDeNota({ notaId: 'p' })).toBeNull();
  expect(rutaDAutoriaDeNota()).toBeNull();
  expect(rutaDAutoriaDeNota({ notaId: 'p', currentUser: { user_metadata: { name: 'Sense id' } } })).toBeNull();
});

test('261007 · signaturaDeNota = autoriaDeNota + ruta; autoriaDeNota conserva la seua forma de tres camps', () => {
  const casos = [
    { notaId: 'n1', currentUser: PEPA },
    { notaId: 'p', actor: { tipus: 'entitat', id: 'O', nom: 'Forn' }, actorId: 'O', currentUser: PEPA },
    { notaId: 'p', actorId: 'U', currentUser: PEPA },
    { notaId: 'p' },
  ];
  for (const params of casos) {
    expect(signaturaDeNota(params)).toEqual({ ...autoriaDeNota(params), ruta: rutaDAutoriaDeNota(params) });
    expect(Object.keys(autoriaDeNota(params)).sort()).toEqual(['avatar', 'nom', 'poble']);
  }
  expect(signaturaDeNota({ notaId: 'n1' })).toEqual({ ...AUTORIA_BENVINGUDA, ruta: RUTA_PROJECTE });
  // La constant de la benvinguda no es toca (la targeta de la llista la compara per identitat).
  expect(Object.isFrozen(AUTORIA_BENVINGUDA)).toBe(true);
  expect(AUTORIA_BENVINGUDA).not.toHaveProperty('ruta');
});
