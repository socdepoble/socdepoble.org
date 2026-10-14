import { expect, test } from 'vitest';
import { AUTORIA_BENVINGUDA, ID_COPIA_PROVA, actorAmbPobleDeLEntitat, autoriaDeLActor, autoriaDeNota, rutaDAutoriaDeNota, signaturaDeNota } from './autoriaNota.js';
import { DEFAULT_AUTHOR, FORASTER, MARQUES_SVG_ANTIGUES } from '../../components/universal/UniversalUtils.js';
import { RUTA_PERFIL_PROJECTE, rutaDAutoria } from '../../config/navigation.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';

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

/* Onada 6 (decisió 2 de la nit del 261009) · Si l'actor de l'entitat porta el
   poble de l'organització (town_name, 2610081401), el poble és el seu; mai el
   de la persona. */
test('Onada 6 · una entitat amb el seu poble (poble o town_name de l’actor) signa des d’ell', () => {
  const actor = { tipus: 'entitat', id: 'O', nom: 'Forn de Relleu', avatar: '' };
  expect(autoriaDeNota({ notaId: 'p', actor: { ...actor, poble: 'Relleu' }, actorId: 'O', currentUser: PEPA }).poble).toBe('Relleu');
  expect(autoriaDeNota({ notaId: 'p', actor: { ...actor, town_name: ' Sella ' }, actorId: 'O', currentUser: PEPA }).poble).toBe('Sella');
  expect(autoriaDeNota({ notaId: 'p', actor, actorId: 'O', currentUser: PEPA }).poble).toBe('');
});

/* Revisió adversarial de l'Onada 6 · L'actor entitat d'IdentitatContext no
   porta el poble: es pren del town_name de la seua fila de pertinença. */
test('Onada 6 · actorAmbPobleDeLEntitat: el poble de la fila de pertinença; si no, el mateix actor', () => {
  const actor = Object.freeze({ tipus: 'entitat', id: 'O', nom: 'Forn de Relleu', avatar: null, rol: 'owner', slug: 'forn', kind: 'company' });
  const files = [{ id: 'X', town_name: 'Sella' }, { id: 'O', town_name: ' Relleu ' }];
  expect(actorAmbPobleDeLEntitat(actor, files)).toEqual({ ...actor, poble: 'Relleu' });
  expect(autoriaDeNota({ notaId: 'p', actor: actorAmbPobleDeLEntitat(actor, files), actorId: 'O', currentUser: PEPA }).poble).toBe('Relleu');
  // Sense fila, sense town_name o sense llista: el mateix actor.
  expect(actorAmbPobleDeLEntitat(actor, [{ id: 'X', town_name: 'Sella' }])).toBe(actor);
  expect(actorAmbPobleDeLEntitat(actor, [{ id: 'O', town_name: '  ' }])).toBe(actor);
  expect(actorAmbPobleDeLEntitat(actor, undefined)).toBe(actor);
  // L'actor que ja el porta mana; una persona o cap actor, intactes.
  const ambPoble = { ...actor, poble: 'Tibi' };
  expect(actorAmbPobleDeLEntitat(ambPoble, files)).toBe(ambPoble);
  const persona = { tipus: 'persona', id: 'O', nom: 'Pepa' };
  expect(actorAmbPobleDeLEntitat(persona, files)).toBe(persona);
  expect(actorAmbPobleDeLEntitat(null, files)).toBeNull();
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
    // Onada 8 (261009) · L'avatar oficial és el PNG de 256x256 (abans, l'SVG).
    avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
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
/* Onada 8 (261009) · «La pàgina del projecte» és ara el perfil de Sóc de
   Poble (RUTA_PERFIL_PROJECTE), mai /projecte. */
test('261007 · la benvinguda i la còpia de prova porten al perfil de Sóc de Poble, signe qui signe', () => {
  expect(RUTA_PERFIL_PROJECTE).toBe('/empresa/socdepoble');
  expect(rutaDAutoriaDeNota({ notaId: 'n1', currentUser: PEPA })).toBe(RUTA_PERFIL_PROJECTE);
  expect(rutaDAutoriaDeNota({ notaId: ID_COPIA_PROVA })).toBe(RUTA_PERFIL_PROJECTE);
  expect(rutaDAutoriaDeNota({ notaId: ID_COPIA_PROVA, actor: { tipus: 'entitat', id: 'O', nom: 'Forn' }, actorId: 'O', currentUser: PEPA }))
    .toBe(RUTA_PERFIL_PROJECTE);
});

test('261007 · una entitat activa porta a la seua fitxa (l’entitat pilot, al seu perfil), mai a la persona', () => {
  const actor = { tipus: 'entitat', id: 'O', nom: 'Forn & Cia' };
  expect(rutaDAutoriaDeNota({ notaId: 'p', actor, actorId: 'O', currentUser: PEPA })).toBe('/empresa/O');
  const pilot = { tipus: 'entitat', id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' };
  expect(rutaDAutoriaDeNota({ notaId: 'p', actor: pilot, actorId: ENTITAT_PILOT_ID, currentUser: PEPA })).toBe(RUTA_PERFIL_PROJECTE);
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
  expect(signaturaDeNota({ notaId: 'n1' })).toEqual({ ...AUTORIA_BENVINGUDA, ruta: RUTA_PERFIL_PROJECTE });
  // La constant de la benvinguda no es toca (la targeta de la llista la compara per identitat).
  expect(Object.isFrozen(AUTORIA_BENVINGUDA)).toBe(true);
  expect(AUTORIA_BENVINGUDA).not.toHaveProperty('ruta');
});

/* Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
   Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
   oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · El
   pilot com a actor signa amb l'autoria oficial sencera (AUTORIA_BENVINGUDA,
   la de DEFAULT_AUTHOR) i porta al seu perfil, siga quin siga el logo de la
   seua fila: cap, buit, una referència opaca, l'SVG d'abans o un de propi.
   Es reconeix pel slug declarat o per l'id de la llavor, mai pel nom. */
const UUID_PILOT = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
const LOGOS_DE_LA_FILA = [null, '', 'sdp-media://organitzacions/x.png', MARQUES_SVG_ANTIGUES.avatar, 'https://exemple.org/logo-propi.png'];

test('prompt 261014_0400 · el pilot com a actor (slug declarat o id de la llavor) signa amb l’autoria oficial, siga quin siga el seu logo', () => {
  const pilots = [
    { tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble', rol: 'owner' },
    { tipus: 'entitat', id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble', rol: 'owner' },
    // Ni el nom de la fila (buit o un altre) ni el seu poble manen: l'autoria és l'oficial.
    { tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG, nom: '', poble: 'Relleu' }
  ];
  for (const pilot of pilots) {
    for (const avatar of LOGOS_DE_LA_FILA) {
      const params = { notaId: 'p', actor: { ...pilot, avatar }, actorId: pilot.id, currentUser: PEPA };
      expect(autoriaDeNota(params)).toBe(AUTORIA_BENVINGUDA);
      expect(rutaDAutoriaDeNota(params)).toBe(RUTA_PERFIL_PROJECTE);
      expect(signaturaDeNota(params)).toEqual({ ...AUTORIA_BENVINGUDA, ruta: RUTA_PERFIL_PROJECTE });
    }
  }
  // També abans que ningú registre l'uuid del pilot: rutaDAutoria encara no el reconeix.
  expect(rutaDAutoria({ tipus: 'entitat', id: UUID_PILOT })).toBe(`/empresa/${UUID_PILOT}`);
  // El PNG verd, mai l'SVG d'abans.
  expect(AUTORIA_BENVINGUDA.avatar).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
});

test('prompt 261014_0400 · no és el pilot: el nom «Sóc de Poble» amb un altre slug, una persona amb el slug del pilot o una entitat qualsevol signen com sempre', () => {
  const homonima = { tipus: 'entitat', id: 'X', slug: 'soc-de-poble-de-relleu', nom: 'Sóc de Poble', avatar: null };
  expect(autoriaDeNota({ notaId: 'p', actor: homonima, actorId: 'X', currentUser: PEPA })).toEqual({ nom: 'Sóc de Poble', avatar: null, poble: '' });
  expect(rutaDAutoriaDeNota({ notaId: 'p', actor: homonima, actorId: 'X', currentUser: PEPA })).toBe('/empresa/X');
  const persona = { tipus: 'persona', id: 'U', slug: ENTITAT_PILOT_SLUG, nom: 'Pepa', avatar: null };
  expect(autoriaDeNota({ notaId: 'p', actor: persona, actorId: 'U', currentUser: PEPA }))
    .toEqual({ nom: 'Pepa', avatar: 'https://exemple.org/pepa.png', poble: 'Benifallim' });
  expect(rutaDAutoriaDeNota({ notaId: 'p', actor: persona, actorId: 'U', currentUser: PEPA })).toBe('/gent/U');
  // Una entitat qualsevol sense logo: cap imatge, i la barra hi pinta la silueta de reserva.
  const forn = { tipus: 'entitat', id: 'O', nom: 'Forn & Cia', avatar: null };
  expect(autoriaDeNota({ notaId: 'p', actor: forn, actorId: 'O', currentUser: PEPA })).toEqual({ nom: 'Forn & Cia', avatar: null, poble: '' });
  expect(rutaDAutoriaDeNota({ notaId: 'p', actor: forn, actorId: 'O', currentUser: PEPA })).toBe('/empresa/O');
});

/* Revisió del prompt 261014_0400 (ordre del Mestre) · Reproduïx un deute
   conegut, no el fixa com a bo. La barra i la targeta viva del pilot signen
   amb l'autoria oficial. El selector «Publicaràs com a» i el payload del Mur
   (autoriaDeLActor, a NotesEditor i a NotesContext) continuen sent la fila, i
   el payload queda fora per ordre. Si la fila no porta logo, porta un altre
   town_name o no té nom, la previsualització promet el que la publicació no
   porta. Autoria sencera o només el logo és decisió del Mestre: quan la
   prenga, cal girar esta prova. */
test('[DEFECTE] prompt 261014_0400 · per al pilot, el selector i el payload del Mur (autoriaDeLActor) continuen sent la fila, mentre la barra diu l’autoria oficial', () => {
  const senseLogoNiPoble = { tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble', avatar: null };
  const senseNom = { tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG, nom: '', poble: 'Relleu', avatar: null };
  for (const pilot of [senseLogoNiPoble, senseNom]) {
    expect(autoriaDeNota({ notaId: 'p', actor: pilot, actorId: UUID_PILOT, currentUser: PEPA })).toBe(AUTORIA_BENVINGUDA);
  }
  expect(autoriaDeLActor(senseLogoNiPoble, PEPA)).toEqual({ nom: 'Sóc de Poble', avatar: null, poble: '' });
  expect(autoriaDeLActor(senseNom, PEPA)).toEqual({ nom: ENTITAT_PILOT_SLUG, avatar: null, poble: 'Relleu' });
});
