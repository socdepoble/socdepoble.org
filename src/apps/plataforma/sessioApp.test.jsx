/* Plataforma d'Apps Enxufables · el pont de sessió (sessioApp.js), de només
   lectura (ordre del Mestre, 261006, TPV Universal). Una app hi llig { estat,
   teSessio, potEscriure, motiu, enLinia, modeProves, marca, rutaEntrada } i
   res més: mai el JWT, l'usuari ni el rol de plataforma. Es munta com una app
   de veres (RutaApps i ProveidorApp) i s'entra per l'API pública (index.js).
   La sessió hi arriba com a l'app (correcció del 261006, HMR): RutaApps passa
   a ProveidorApp la font (fontSessio.js), que llig els dos contexts de
   l'arrel, i el pont la crida; el pont no els importa. Els contexts es
   llegixen de veres, llevat que la prova en fixe un (m.sessio, m.identitat);
   entorn.sessio de ProveidorPlataforma els substituïx tots dos. Un bloc munta
   IdentitatProvider DE VERES damunt de RutaApps, com a l'arrel de l'app (amb
   la sessió i les pertinences del port simulades): la forma de l'actor que en
   ix és la que les altres proves copien a mà (ENTITAT).
   Ordres del Mestre del 261006 (offline prioritari, mode de proves, sessió
   desada sense xarxa): el motiu i el seu ordre es proven purs (motiuDe), per
   l'entorn i pels contexts de veres; el navegador sense xarxa es fixa com a
   useEnLinia.test.jsx (navigator.onLine tapat a la instància), el mode de
   dades per la configuració de l'amfitrió (UIProvider) i la sessió desada
   simulant sessioRecuperable (m.recuperable) o, sense simular-la, la de veres
   (amb la política de persistència fixada, m.politica, i el registre desat).
   Correccions de la revisió (261006): la sessió desada val també «en línia»
   (un servidor que no respon no talla la venda) i, amb el permís 'sessio',
   una «comprovant» que ja porta el compte és «dins».
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B: la boina de la
   Gestoria porta el titular de la sessió) · Derogat EN PART el «res més» del
   261006: una novena clau, `titular`, { nom, avatar, poble } de la PERSONA de
   la sessió (mai l'entitat activa), filtrada i només per a l'app interna que
   la declara (permisos.titular 'sessio'); per a la resta, sempre null. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { IdentitatProvider, desaPreferencia, useIdentitatOpcional } from '../../app/contexts/IdentitatContext.jsx';
import { Route, Routes } from '../../app/contexts/RouterContext.jsx';
import { ESTAT as ESTAT_DE_SESSIONCONTEXT } from '../../app/contexts/SessionContext.jsx';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { delVal, setVal } from '../../config/storage.js';
import { CLAU_PERSISTENT } from '../../data/identitat.js';
import { ENTORN_OBERT, muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva } from './__fixtures__/manifests.js';
import { useSessioDeLaRuta } from './ContextApp.jsx';
import { marcaDeLActor, titularDeLActor } from './fontSessio.js';
import { useSessioApp } from './index.js';
import { creaRegistre } from './registreApps.js';
import RutaApps from './RutaApps.jsx';
import { ESTAT, MOTIUS, NOM_SENSE_NOM, esModeDeProves, marcaNeta, motiuDe, titularNet } from './sessioApp.js';

/* undefined: el context de veres (sense proveïdor, null). Un valor: el que
   tornaria el proveïdor. `organitzacions`: les pertinences que torna el port
   a IdentitatProvider. `recuperable`: undefined, la sessió desada de veres;
   un booleà, el que diria sessioRecuperable. `lectures`: quantes vegades s'ha
   consultat. `politica`: null, la política de veres (cap, en proves); un
   objecte, la que llig identitat.js (la persistència del registre). */
const m = vi.hoisted(() => ({
  sessio: undefined, identitat: undefined, organitzacions: [], recuperable: undefined, lectures: 0, politica: null, lecturesSessio: 0
}));
vi.mock('../../config/runtimePolicy.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, getRuntimePolicy: (...args) => (m.politica ? m.politica : real.getRuntimePolicy(...args)) };
});
vi.mock('../../app/contexts/SessionContext.jsx', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    useSessioOpcional: () => {
      m.lecturesSessio += 1;
      return m.sessio === undefined ? real.useSessioOpcional() : m.sessio;
    },
    useSession: () => (m.sessio === undefined ? real.useSession() : m.sessio)
  };
});
vi.mock('../../app/contexts/IdentitatContext.jsx', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, useIdentitatOpcional: () => (m.identitat === undefined ? real.useIdentitatOpcional() : m.identitat) };
});
/* getProfile: el front A (pla 261013_1405) fa que IdentitatProvider llija el
   perfil pel port; ací cap fila, i la persona es queda amb les metadades. */
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, listMyOrganizations: async () => m.organitzacions, getProfile: async () => null };
});
vi.mock('../../data/identitat.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    sessioRecuperable: () => {
      m.lectures += 1;
      return m.recuperable === undefined ? real.sessioRecuperable() : m.recuperable;
    }
  };
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · nou claus: s'hi afig `titular`. */
const CLAUS = ['enLinia', 'estat', 'marca', 'modeProves', 'motiu', 'potEscriure', 'rutaEntrada', 'teSessio', 'titular'];
const ENTRADA_INICI = '/registre?mode=entrar&tornar=%2Fapp%2Fprova%2Finici';
const AMB_SESSIO = Object.freeze({ veure: 'public', escriure: 'sessio' });
const AMB_SUPERADMIN = Object.freeze({ veure: 'public', escriure: 'superadmin' });

/** La forma sencera que torna el pont, amb els valors d'una app sense sessió, en línia i en remot. */
const forma = (camps = {}) => ({
  estat: 'fora', teSessio: false, potEscriure: false, motiu: 'sense-sessio', enLinia: true, modeProves: false,
  marca: null, rutaEntrada: ENTRADA_INICI, titular: null, ...camps
});

/* L'actor d'una entitat tal com el dona IdentitatContext (tots els camps).
   Front A (pla 261013_1405, ordre del Mestre del 13-10-2026) · l'actor porta
   també el poble: el de la pertinença (town_name) o ''. */
const ENTITAT = Object.freeze({
  tipus: 'entitat', id: 'org-sonda-7', nom: 'Bar de la Parròquia', avatar: 'logo-parroquia.png',
  rol: 'owner', slug: 'bar-parroquia', kind: 'entitat', poble: ''
});
const MARCA = Object.freeze({ nom: 'Bar de la Parròquia', logotip: 'logo-parroquia.png', slug: 'bar-parroquia' });
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · la persona de la sessió tal com la posa
   IdentitatContext a identitats[0] (amb el poble del front A), el titular que n'ix i el manifest
   que el declara. */
const PERSONA = Object.freeze({
  tipus: 'persona', id: 'usuari-sonda-1', nom: 'Pepa Soler', avatar: '/assets/cares/sonda.png',
  rol: 'persona', activa: false, poble: 'La Torre de les Maçanes'
});
const TITULAR = Object.freeze({ nom: 'Pepa Soler', avatar: '/assets/cares/sonda.png', poble: 'La Torre de les Maçanes' });
const AMB_TITULAR = Object.freeze({ veure: 'public', escriure: 'sessio', titular: 'sessio' });
/* La sessió tal com la dona SessionContext: l'usuari, el rol i un testimoni
   que no han d'eixir mai cap a l'app. */
const SESSIO_DINS = Object.freeze({
  estat: 'dins', rol: 'superadmin-sonda', esSuperadmin: false, generacio: 3,
  currentUser: Object.freeze({ id: 'usuari-sonda-1', access_token: 'testimoni-sonda' })
});
/* Sense xarxa, la pestanya que ha perdut el JWT: SessionContext la dona 'fora' (o 'comprovant') sense usuari. */
const SESSIO_FORA = Object.freeze({ estat: 'fora', rol: null, esSuperadmin: false, generacio: 4, currentUser: null });

let vist = null;
function Sonda() {
  vist = useSessioApp();
  return <output data-testid="sessio">{vist.estat}</output>;
}

const registreAmb = (permisos) => creaRegistre({
  internes: [manifestDeProva({ carrega: () => Promise.resolve({ default: Sonda }), ...(permisos ? { permisos } : {}) })]
});

/** Munta l'app de prova i torna el que ha vist useSessioApp. */
async function munta({ url = '/app/prova/inici', permisos, sessio, externalConfig } = {}) {
  muntaPlataforma(url, {
    registre: registreAmb(permisos),
    entorn: sessio === undefined ? ENTORN_OBERT : { ...ENTORN_OBERT, sessio },
    externalConfig
  });
  await screen.findByTestId('sessio');
  return vist;
}

/* Torna a pintar l'app (una navegació a la mateixa ruta): el ganxo rellig els contexts (per la font). */
const rellig = () => act(async () => {
  window.history.pushState(null, '', '/app/prova/inici');
  window.dispatchEvent(new PopStateEvent('popstate'));
});

/* navigator.onLine és un getter del prototip: es tapa a la instància (useEnLinia.test.jsx). */
const posaEnLinia = (valor) => Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => valor });
/* El dispositiu perd o recupera la xarxa: el navegador ho avisa i useEnLinia ho torna a llegir. */
const canviaXarxa = (valor) => act(async () => {
  posaEnLinia(valor);
  window.dispatchEvent(new Event(valor ? 'online' : 'offline'));
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  delete window.navigator.onLine;
  vist = null;
  m.sessio = undefined;
  m.identitat = undefined;
  m.organitzacions = [];
  m.recuperable = undefined;
  m.lectures = 0;
  m.politica = null;
  m.lecturesSessio = 0;
  delVal(CLAU_PERSISTENT);
  desaPreferencia('usuari-sonda-1', null);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('sense proveïdors', () => {
  test('ni SessionProvider ni IdentitatProvider: fora, sense sessió, sense escriure i sense marca', async () => {
    const sessio = await munta({ permisos: AMB_SESSIO });
    expect(sessio).toEqual(forma());
    expect(Object.isFrozen(sessio)).toBe(true);
  });

  test('sense permís d’escriptura declarat, l’app escriu també sense sessió: «lliure»', async () => {
    const sessio = await munta();
    expect(sessio).toEqual(forma({ potEscriure: true, motiu: 'lliure' }));
  });

  test('fora d’una app llança, com useApp', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    /* React, en desenvolupament, torna a llançar l'error en un esdeveniment de la finestra: no és cap fallada. */
    const silencia = (esdeveniment) => esdeveniment.preventDefault();
    window.addEventListener('error', silencia);
    try {
      expect(() => render(<Sonda />)).toThrow(/dins d'una app de la plataforma/);
    } finally {
      window.removeEventListener('error', silencia);
    }
  });
});

describe('entorn.sessio: teSessio, potEscriure i el motiu segons el manifest', () => {
  test.each([
    ['sessio', { estat: 'dins' }, 'dins', true, true, 'sessio'],
    ['sessio', { estat: 'comprovant' }, 'comprovant', false, false, 'comprovant'],
    ['sessio', { estat: 'fora' }, 'fora', false, false, 'sense-sessio'],
    ['sessio', { estat: 'obert' }, 'fora', false, false, 'sense-sessio'],
    ['sessio', {}, 'fora', false, false, 'sense-sessio'],
    ['superadmin', { estat: 'dins' }, 'dins', true, false, 'sense-permis'],
    ['superadmin', { estat: 'dins', esSuperadmin: 'si' }, 'dins', true, false, 'sense-permis'],
    ['superadmin', { estat: 'dins', esSuperadmin: true }, 'dins', true, true, 'sessio'],
    ['superadmin', { estat: 'comprovant', esSuperadmin: true }, 'comprovant', false, false, 'comprovant'],
    ['superadmin', { estat: 'fora', esSuperadmin: true }, 'fora', false, false, 'sense-sessio'],
    [undefined, { estat: 'dins' }, 'dins', true, true, 'lliure'],
    [undefined, { estat: 'fora' }, 'fora', false, true, 'lliure']
  ])('escriure %s amb %j → %s, teSessio %s, potEscriure %s, motiu %s', async (escriure, sessio, estat, teSessio, potEscriure, motiu) => {
    const permisos = escriure ? { veure: 'public', escriure } : undefined;
    const vista = await munta({ permisos, sessio });
    expect(vista).toEqual(forma({ estat, teSessio, potEscriure, motiu }));
  });

  test('l’entorn mana damunt dels contexts', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = { actor: ENTITAT };
    const vista = await munta({ permisos: AMB_SESSIO, sessio: { estat: 'fora' } });
    expect(vista).toEqual(forma());
  });

  test('la marca de l’entorn passa pel mateix filtre: tres camps i prou, i mai sense sessió', async () => {
    const ambSobrants = { ...MARCA, id: 'org-sonda-7', rol: 'owner', usuari: 'usuari-sonda-1' };
    expect((await munta({ sessio: { estat: 'dins', marca: ambSobrants } })).marca).toEqual(MARCA);
    cleanup();
    expect((await munta({ sessio: { estat: 'fora', marca: MARCA } })).marca).toBeNull();
    cleanup();
    expect((await munta({ sessio: { estat: 'dins', marca: { nom: '   ', slug: 'bar' } } })).marca).toBeNull();
    cleanup();
    expect((await munta({ sessio: { estat: 'dins', marca: { nom: 'Bar', logotip: 7 } } })).marca).toEqual({ nom: 'Bar', logotip: null, slug: null });
  });
});

describe('el motiu, pur (motiuDe): l’ordre de prioritat', () => {
  /* Una app amb el permís 'sessio', sense sessió, en línia i en remot: 'sense-sessio'. */
  const BASE = Object.freeze({ escriure: 'sessio', teSessio: false, esSuperadmin: false, estat: 'fora', enLinia: true, modeProves: false, recuperable: false });

  test('MOTIUS és la llista, en l’ordre en què es decidixen', () => {
    expect(MOTIUS).toEqual(['lliure', 'sessio', 'mode-proves', 'fora-de-linia', 'comprovant-desada', 'comprovant', 'sense-permis', 'sense-sessio']);
    expect(Object.isFrozen(MOTIUS)).toBe(true);
  });

  test.each([
    ['cap permís declarat: «lliure», guanye el que guanye la resta', { escriure: undefined, estat: 'comprovant', teSessio: false }, 'lliure'],
    ['cap permís declarat i amb sessió: també «lliure»', { escriure: undefined, estat: 'dins', teSessio: true }, 'lliure'],
    ['«sessio» passa davant del mode de proves i de la sessió desada',
      { estat: 'dins', teSessio: true, modeProves: true, enLinia: false, recuperable: true }, 'sessio'],
    ['superadmin amb el permís', { escriure: 'superadmin', estat: 'dins', teSessio: true, esSuperadmin: true }, 'sessio'],
    ['«mode-proves» passa davant de «fora-de-linia»', { modeProves: true, enLinia: false, recuperable: true }, 'mode-proves'],
    ['«mode-proves» passa davant de «comprovant»', { estat: 'comprovant', modeProves: true }, 'mode-proves'],
    ['«fora-de-linia» passa davant de «comprovant»', { estat: 'comprovant', enLinia: false, recuperable: true }, 'fora-de-linia'],
    ['«fora-de-linia» amb estat «fora»', { enLinia: false, recuperable: true }, 'fora-de-linia'],
    ['sense xarxa i sense sessió desada', { enLinia: false, recuperable: false }, 'sense-sessio'],
    ['sense xarxa, comprovant i sense sessió desada', { estat: 'comprovant', enLinia: false }, 'comprovant'],
    ['en línia, «fora» i sessió desada: el servidor no ha respost, i la sessió no ha caigut', { enLinia: true, recuperable: true }, 'fora-de-linia'],
    ['en línia, comprovant i sessió desada: el servidor encara no ha contestat', { estat: 'comprovant', enLinia: true, recuperable: true }, 'comprovant-desada'],
    ['«mode-proves» passa davant de «comprovant-desada»', { estat: 'comprovant', modeProves: true, recuperable: true }, 'mode-proves'],
    ['«comprovant-desada» passa davant de «comprovant»', { estat: 'comprovant', recuperable: true }, 'comprovant-desada'],
    ['superadmin comprovant amb sessió desada: no val', { escriure: 'superadmin', estat: 'comprovant', recuperable: true }, 'comprovant'],
    ['comprovant en línia', { estat: 'comprovant' }, 'comprovant'],
    ['superadmin sense el permís, encara que hi haja mode de proves o sessió desada',
      { escriure: 'superadmin', estat: 'dins', teSessio: true, modeProves: true, enLinia: false, recuperable: true }, 'sense-permis'],
    ['superadmin sense sessió en mode de proves: no val', { escriure: 'superadmin', modeProves: true }, 'sense-sessio'],
    ['superadmin sense xarxa amb sessió desada: no val', { escriure: 'superadmin', enLinia: false, recuperable: true }, 'sense-sessio'],
    ['superadmin comprovant en mode de proves', { escriure: 'superadmin', estat: 'comprovant', modeProves: true }, 'comprovant'],
    ['un permís que no és del manifest, amb sessió', { escriure: 'tothom', estat: 'dins', teSessio: true }, 'sense-permis'],
    ['un permís que no és del manifest, en mode de proves i sense xarxa',
      { escriure: 'tothom', modeProves: true, enLinia: false, recuperable: true }, 'sense-sessio'],
    ['un booleà que no ho és (cadena) no obri res', { modeProves: 'si', enLinia: 'no', recuperable: 'si' }, 'sense-sessio'],
    ['la resta', {}, 'sense-sessio']
  ])('%s → %s', (_que, camps, esperat) => {
    expect(motiuDe({ ...BASE, ...camps })).toBe(esperat);
  });
});

describe('entorn.sessio fixa també la xarxa, el mode de proves i la sessió desada', () => {
  test.each([
    ['mode de proves, permís «sessio»: ven', 'sessio', { estat: 'fora', modeProves: true }, true, 'mode-proves'],
    ['mode de proves, manifest «superadmin»: no val', 'superadmin', { estat: 'fora', modeProves: true }, false, 'sense-sessio'],
    ['sense xarxa amb sessió desada: ven', 'sessio', { estat: 'fora', enLinia: false, recuperable: true }, true, 'fora-de-linia'],
    ['sense xarxa, «comprovant» i sessió desada: ven', 'sessio', { estat: 'comprovant', enLinia: false, recuperable: true }, true, 'fora-de-linia'],
    ['sense xarxa i sense sessió desada: no', 'sessio', { estat: 'fora', enLinia: false, recuperable: false }, false, 'sense-sessio'],
    ['sense xarxa, «comprovant» i sense sessió desada: no', 'sessio', { estat: 'comprovant', enLinia: false, recuperable: false }, false, 'comprovant'],
    ['en línia, «fora» i sessió desada (el servidor no ha respost): ven', 'sessio', { estat: 'fora', enLinia: true, recuperable: true }, true, 'fora-de-linia'],
    ['en línia, «comprovant» i sessió desada: ven mentre es comprova', 'sessio', { estat: 'comprovant', enLinia: true, recuperable: true }, true, 'comprovant-desada'],
    ['en línia, «comprovant» i sense sessió desada: no', 'sessio', { estat: 'comprovant', enLinia: true, recuperable: false }, false, 'comprovant'],
    ['en línia, «fora» i sense sessió desada: no', 'sessio', { estat: 'fora', enLinia: true, recuperable: false }, false, 'sense-sessio'],
    ['sense xarxa amb sessió desada, manifest «superadmin»: no val', 'superadmin', { estat: 'fora', enLinia: false, recuperable: true }, false, 'sense-sessio']
  ])('%s', async (_que, escriure, sessio, potEscriure, motiu) => {
    const vista = await munta({ permisos: { veure: 'public', escriure }, sessio });
    expect(vista).toEqual(forma({
      estat: sessio.estat, potEscriure, motiu,
      enLinia: sessio.enLinia ?? true, modeProves: sessio.modeProves ?? false
    }));
    expect(Object.keys(vista).sort()).toEqual(CLAUS);
  });

  test('amb la sessió desada fixada, no es consulta la del dispositiu', async () => {
    await munta({ permisos: AMB_SESSIO, sessio: { estat: 'fora', enLinia: false, recuperable: true } });
    expect(vist.motiu).toBe('fora-de-linia');
    expect(m.lectures).toBe(0);
  });

  test('l’entorn sense enLinia llig el navegador de veres', async () => {
    posaEnLinia(false);
    const vista = await munta({ permisos: AMB_SESSIO, sessio: { estat: 'fora', recuperable: true } });
    expect(vista).toEqual(forma({ enLinia: false, potEscriure: true, motiu: 'fora-de-linia' }));
  });
});

describe('el mode de proves, des de la configuració de l’amfitrió (el criteri de la closca)', () => {
  test.each([
    ['seed', true],
    ['local', true],
    ['remote', false],
    [undefined, false]
  ])('dataMode %s → modeProves %s', async (dataMode, modeProves) => {
    const vista = await munta({ permisos: AMB_SESSIO, externalConfig: dataMode ? { dataMode } : {} });
    expect(vista).toEqual(forma(modeProves ? { modeProves, potEscriure: true, motiu: 'mode-proves' } : {}));
  });

  test('en mode de proves, un manifest «superadmin» no escriu', async () => {
    const vista = await munta({ permisos: AMB_SUPERADMIN, externalConfig: { dataMode: 'seed' } });
    expect(vista).toEqual(forma({ modeProves: true }));
  });

  test('en mode de proves amb sessió (contexts): el motiu és la sessió', async () => {
    m.sessio = SESSIO_DINS;
    const vista = await munta({ permisos: AMB_SESSIO, externalConfig: { dataMode: 'local' } });
    expect(vista).toEqual(forma({ estat: 'dins', teSessio: true, potEscriure: true, motiu: 'sessio', modeProves: true }));
  });

  test('esModeDeProves, sol: una configuració que no es pot normalitzar compta com a remota', () => {
    expect(esModeDeProves({ dataMode: 'seed' })).toBe(true);
    expect(esModeDeProves({ dataMode: 'local' })).toBe(true);
    expect(esModeDeProves({ dataMode: 'remote' })).toBe(false);
    expect(esModeDeProves({ dataMode: 'altre' })).toBe(false);
    expect(esModeDeProves(null)).toBe(false);
    expect(esModeDeProves(undefined)).toBe(false);
    expect(esModeDeProves({ dataMode: 'seed', tenant_id: 'no-es-un-uuid' })).toBe(false);
  });
});

describe('sense xarxa, pels contexts i el navegador de veres', () => {
  test('qui havia entrat en este dispositiu (sessió desada) continua venent; sense sessió desada, no', async () => {
    posaEnLinia(false);
    m.sessio = SESSIO_FORA;
    m.recuperable = true;
    expect(await munta({ permisos: AMB_SESSIO })).toEqual(forma({ enLinia: false, potEscriure: true, motiu: 'fora-de-linia' }));
    cleanup();
    m.recuperable = false;
    expect(await munta({ permisos: AMB_SESSIO })).toEqual(forma({ enLinia: false }));
  });

  test('offline + «comprovant» (cap «dins» previ) + sessió desada: potEscriure cert', async () => {
    posaEnLinia(false);
    m.sessio = { ...SESSIO_FORA, estat: 'comprovant' };
    m.recuperable = true;
    const vista = await munta({ permisos: AMB_SESSIO });
    expect(vista).toEqual(forma({ estat: 'comprovant', enLinia: false, potEscriure: true, motiu: 'fora-de-linia' }));
  });

  test('la sessió desada de veres: sense política de persistència no n’hi ha, i no s’escriu', async () => {
    posaEnLinia(false);
    m.sessio = SESSIO_FORA;
    expect(await munta({ permisos: AMB_SESSIO })).toEqual(forma({ enLinia: false }));
    expect(m.lectures).toBeGreaterThan(0);
  });

  test('la sessió desada només es consulta quan decidix: amb sessió, en mode de proves, amb «superadmin» o en una app lliure, mai', async () => {
    m.recuperable = true;
    posaEnLinia(false);
    m.sessio = SESSIO_DINS;
    await munta({ permisos: AMB_SESSIO });
    cleanup();
    m.sessio = SESSIO_FORA;
    await munta({ permisos: AMB_SESSIO, externalConfig: { dataMode: 'seed' } });
    cleanup();
    await munta({ permisos: AMB_SUPERADMIN });
    cleanup();
    await munta();
    expect(m.lectures).toBe(0);
  });

  test('en línia també es consulta: un servidor que no respon no fa caure la sessió desada', async () => {
    m.sessio = SESSIO_FORA;
    m.recuperable = true;
    expect(await munta({ permisos: AMB_SESSIO })).toEqual(forma({ potEscriure: true, motiu: 'fora-de-linia' }));
    expect(m.lectures).toBeGreaterThan(0);
  });

  test('perdre i recuperar la xarxa, eixir des d’una altra pestanya: el pont ho seguix, i la sessió desada val fins que cau', async () => {
    m.sessio = SESSIO_FORA;
    m.recuperable = true;
    await munta({ permisos: AMB_SESSIO });
    expect([vist.enLinia, vist.potEscriure, vist.motiu]).toEqual([true, true, 'fora-de-linia']);
    await canviaXarxa(false);
    expect([vist.enLinia, vist.potEscriure, vist.motiu]).toEqual([false, true, 'fora-de-linia']);
    /* Eixir en una altra pestanya esborra la sessió desada: arriba per l'esdeveniment `storage`. */
    m.recuperable = false;
    await act(async () => { window.dispatchEvent(new Event('storage')); });
    expect([vist.enLinia, vist.potEscriure, vist.motiu]).toEqual([false, false, 'sense-sessio']);
    /* Una entrada nova en esta pestanya avisa per sdp:auth-change. */
    m.recuperable = true;
    await act(async () => { window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } })); });
    expect(vist.motiu).toBe('fora-de-linia');
    await canviaXarxa(true);
    expect([vist.enLinia, vist.potEscriure, vist.motiu]).toEqual([true, true, 'fora-de-linia']);
    /* El servidor rebutja el testimoni (400/401, oblidaRegistre): ara sí que cau. */
    m.recuperable = false;
    await act(async () => { window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } })); });
    expect([vist.enLinia, vist.potEscriure, vist.motiu]).toEqual([true, false, 'sense-sessio']);
  });

  test('la xarxa torna després de vendre sense xarxa: «comprovant» sense compte, «comprovant» amb compte i «dins», i potEscriure no baixa mai', async () => {
    posaEnLinia(false);
    m.sessio = SESSIO_FORA;
    m.recuperable = true;
    await munta({ permisos: AMB_SESSIO });
    const vistos = [[vist.estat, vist.potEscriure, vist.motiu]];
    /* sessionService escolta 'online' abans que useEnLinia: recuperaSessio ja diu 'comprovant' sense compte. */
    m.sessio = { ...SESSIO_FORA, estat: 'comprovant' };
    await canviaXarxa(true);
    vistos.push([vist.estat, vist.potEscriure, vist.motiu]);
    /* La renovació torna el testimoni: SessionContext dona 'comprovant' AMB el compte mentre llig el rol. */
    m.sessio = { ...SESSIO_DINS, estat: 'comprovant', rol: 'desconegut' };
    m.recuperable = false;
    await rellig();
    vistos.push([vist.estat, vist.potEscriure, vist.motiu]);
    m.sessio = SESSIO_DINS;
    await rellig();
    vistos.push([vist.estat, vist.potEscriure, vist.motiu]);
    expect(vistos).toEqual([
      ['fora', true, 'fora-de-linia'],
      ['comprovant', true, 'comprovant-desada'],
      ['dins', true, 'sessio'],
      ['dins', true, 'sessio']
    ]);
  });

  test('en línia, «fora» i la sessió desada DE VERES (el registre persistent, sense simular sessioRecuperable): continua venent', async () => {
    m.politica = { auth: { persistencia: 'local' } };
    setVal(CLAU_PERSISTENT, { v: 1, rt: 'testimoni-de-refresc-sonda', sub: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', t: 1 });
    m.sessio = SESSIO_FORA;
    const vista = await munta({ permisos: AMB_SESSIO });
    expect(vista).toEqual(forma({ potEscriure: true, motiu: 'fora-de-linia' }));
    expect(m.lectures).toBeGreaterThan(0);
    /* Eixir (o el 400/401 del servidor) esborra el registre: la sessió ja no és recuperable. */
    delVal(CLAU_PERSISTENT);
    await act(async () => { window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } })); });
    expect([vist.potEscriure, vist.motiu]).toEqual([false, 'sense-sessio']);
  });

  test('amb sessió viva i sense xarxa: el motiu és la sessió', async () => {
    posaEnLinia(false);
    m.sessio = SESSIO_DINS;
    m.identitat = { actor: ENTITAT };
    const vista = await munta({ permisos: AMB_SESSIO });
    expect(vista).toEqual(forma({ estat: 'dins', teSessio: true, potEscriure: true, motiu: 'sessio', enLinia: false, marca: MARCA }));
  });
});

describe('des dels contexts: la marca, només d’una entitat owner o admin', () => {
  test('owner: { nom, logotip, slug } de l’organització activa, congelada', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = { actor: ENTITAT, actorKey: 'entitat::org-sonda-7' };
    const vista = await munta({ permisos: AMB_SESSIO });
    expect(vista).toEqual(forma({ estat: 'dins', teSessio: true, potEscriure: true, motiu: 'sessio', marca: MARCA }));
    expect(Object.isFrozen(vista.marca)).toBe(true);
  });

  test('admin també; amb «superadmin», en «comprovant» sense cap «dins» abans (l’arrencada), la marca es conserva però no s’escriu', async () => {
    m.sessio = { ...SESSIO_DINS, estat: 'comprovant' };
    m.identitat = { actor: { ...ENTITAT, rol: 'admin' } };
    const vista = await munta({ permisos: AMB_SUPERADMIN });
    expect(vista).toEqual(forma({ estat: 'comprovant', motiu: 'comprovant', marca: MARCA }));
  });

  test('amb el permís «sessio», una «comprovant» que ja porta el compte (només falta el rol) és «dins», sense cap «dins» abans', async () => {
    m.sessio = { ...SESSIO_DINS, estat: 'comprovant', rol: 'desconegut' };
    m.identitat = { actor: { ...ENTITAT, rol: 'admin' } };
    const vista = await munta({ permisos: AMB_SESSIO });
    expect(vista).toEqual(forma({ estat: 'dins', teSessio: true, potEscriure: true, motiu: 'sessio', marca: MARCA }));
    /* Sense compte, «comprovant» continua sent «comprovant» (i, sense sessió desada, no escriu). */
    m.sessio = { ...SESSIO_FORA, estat: 'comprovant' };
    m.recuperable = false;
    await rellig();
    expect([vist.estat, vist.potEscriure, vist.motiu]).toEqual(['comprovant', false, 'comprovant']);
  });

  test.each([
    ['una persona', { tipus: 'persona', id: 'usuari-sonda-1', nom: 'La persona', avatar: 'cara.png', rol: 'persona', slug: null, kind: null }],
    ['una entitat on és membre', { ...ENTITAT, rol: 'member' }],
    ['una entitat on és editora', { ...ENTITAT, rol: 'editor' }],
    ['una entitat sense rol', { ...ENTITAT, rol: undefined }],
    ['cap actor', null]
  ])('%s: cap marca', async (_que, actor) => {
    m.sessio = SESSIO_DINS;
    m.identitat = { actor };
    expect((await munta()).marca).toBeNull();
  });

  test('sense IdentitatProvider: cap marca, i la sessió es llig igual', async () => {
    m.sessio = SESSIO_DINS;
    const vista = await munta({ permisos: AMB_SESSIO });
    expect(vista).toEqual(forma({ estat: 'dins', teSessio: true, potEscriure: true, motiu: 'sessio' }));
  });

  test('una entitat owner sense sessió (fora): cap marca', async () => {
    m.sessio = { ...SESSIO_DINS, estat: 'fora' };
    m.identitat = { actor: ENTITAT };
    expect((await munta()).marca).toBeNull();
  });

  test('superadmin: el de la sessió, mai el rol cru', async () => {
    m.sessio = { ...SESSIO_DINS, esSuperadmin: true };
    expect((await munta({ permisos: AMB_SUPERADMIN })).potEscriure).toBe(true);
    cleanup();
    m.sessio = { ...SESSIO_DINS, rol: 'superadmin', esSuperadmin: false };
    const vista = await munta({ permisos: AMB_SUPERADMIN });
    expect([vista.potEscriure, vista.motiu]).toEqual([false, 'sense-permis']);
  });

  test('marcaDeLActor i marcaNeta, soles', () => {
    expect(marcaDeLActor(ENTITAT)).toEqual(MARCA);
    expect(marcaDeLActor({ ...ENTITAT, avatar: null })).toEqual({ ...MARCA, logotip: null });
    expect(marcaDeLActor({ ...ENTITAT, tipus: 'persona' })).toBeNull();
    expect(marcaDeLActor(undefined)).toBeNull();
    expect(marcaNeta('Bar')).toBeNull();
    expect(marcaNeta(null)).toBeNull();
    expect(Object.keys(marcaNeta({ ...MARCA, extra: 1 })).sort()).toEqual(['logotip', 'nom', 'slug']);
  });
});

describe('la renovació del JWT pels contexts: el mateix compte continua dins', () => {
  test('«dins» → «comprovant» amb el mateix usuari: per a l’app continua dins, escriu i té la marca', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = { actor: ENTITAT };
    await munta({ permisos: AMB_SESSIO });
    m.sessio = { ...SESSIO_DINS, estat: 'comprovant' };
    await rellig();
    expect(vist).toEqual(forma({ estat: 'dins', teSessio: true, potEscriure: true, motiu: 'sessio', marca: MARCA }));
  });

  test('el permís de superadmin de l’últim «dins» es conserva mentre el rol es torna a llegir', async () => {
    m.sessio = { ...SESSIO_DINS, esSuperadmin: true };
    await munta({ permisos: AMB_SUPERADMIN });
    expect(vist.potEscriure).toBe(true);
    /* SessionContext, amb el rol 'desconegut', dona esSuperadmin fals mentre comprova. */
    m.sessio = { ...SESSIO_DINS, estat: 'comprovant', esSuperadmin: false };
    await rellig();
    expect([vist.estat, vist.teSessio, vist.potEscriure, vist.motiu]).toEqual(['dins', true, true, 'sessio']);
  });

  test('amb «superadmin», un altre compte, o un compte que ja ha eixit, no hereta res: «comprovant» és «comprovant»', async () => {
    m.sessio = SESSIO_DINS;
    await munta({ permisos: AMB_SUPERADMIN });
    m.sessio = { ...SESSIO_DINS, estat: 'comprovant', currentUser: { id: 'usuari-sonda-2' } };
    await rellig();
    expect([vist.estat, vist.teSessio, vist.potEscriure, vist.motiu]).toEqual(['comprovant', false, false, 'comprovant']);
    m.sessio = SESSIO_DINS;
    await rellig();
    expect(vist.estat).toBe('dins');
    m.sessio = { ...SESSIO_DINS, estat: 'fora', currentUser: null };
    await rellig();
    expect(vist.estat).toBe('fora');
    m.sessio = { ...SESSIO_DINS, estat: 'comprovant' };
    await rellig();
    expect([vist.estat, vist.teSessio, vist.potEscriure, vist.motiu]).toEqual(['comprovant', false, false, 'comprovant']);
  });
});

describe('amb IdentitatProvider de veres (la sessió i el port, simulats)', () => {
  test('una pertinença owner amb logo_url: la marca arriba per RutaApps i la font, i l’actor real té la forma d’ENTITAT', async () => {
    m.sessio = SESSIO_DINS;
    m.organitzacions = [{ id: 'org-sonda-7', name: 'Bar de la Parròquia', logo_url: 'logo-parroquia.png', role: 'owner', slug: 'bar-parroquia', kind: 'entitat' }];
    desaPreferencia('usuari-sonda-1', { type: 'entitat', id: 'org-sonda-7' });
    let actor = null;
    function SondaIdentitat() {
      actor = useIdentitatOpcional()?.actor ?? null;
      return <Sonda />;
    }
    const registre = creaRegistre({
      internes: [manifestDeProva({ carrega: () => Promise.resolve({ default: SondaIdentitat }), permisos: AMB_SESSIO })]
    });
    /* Damunt de RutaApps, com a l'arrel de l'app (PedraSecaEmbed): la font el llig des de ContenidorApp. */
    muntaPlataforma('/app/prova/inici', {
      registre,
      entorn: ENTORN_OBERT,
      fills: (
        <IdentitatProvider>
          <Routes><Route path="/app/*" element={<RutaApps />} /></Routes>
        </IdentitatProvider>
      )
    });
    await screen.findByTestId('sessio');
    await waitFor(() => expect(vist.marca).toEqual(MARCA));
    expect(vist).toEqual(forma({ estat: 'dins', teSessio: true, potEscriure: true, motiu: 'sessio', marca: MARCA }));
    /* Si IdentitatProvider canvia avatar, slug, rol o poble, esta prova cau abans que el TPV perda la
       marca. La forma inclou el poble des del front A (pla 261013_1405, ordre del Mestre del 13-10-2026). */
    expect(actor).toEqual(ENTITAT);
  });
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B: la boina de la Gestoria porta el titular de
   la sessió) · El titular és SEMPRE la persona que ha entrat (identitats, tipus 'persona'), mai
   l'entitat activa; només arriba a l'app interna que el declara (permisos.titular 'sessio') i mai
   amb estat 'fora'; i porta tres camps i prou, mai un correu. */
describe('el titular: la persona de la sessió, només a l’app que el declara', () => {
  const ambPersona = (actor = ENTITAT) => ({ actor, identitats: [PERSONA, { ...ENTITAT, activa: actor === ENTITAT }] });

  test('pels contexts, amb el permís: { nom, avatar, poble } de la persona, congelat, encara que actue com l’entitat', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = ambPersona(ENTITAT);
    const vista = await munta({ permisos: AMB_TITULAR });
    expect(vista).toEqual(forma({ estat: 'dins', teSessio: true, potEscriure: true, motiu: 'sessio', marca: MARCA, titular: TITULAR }));
    expect(Object.isFrozen(vista.titular)).toBe(true);
    expect(Object.keys(vista.titular).sort()).toEqual(['avatar', 'nom', 'poble']);
    cleanup();
    /* Actuant com a persona, la mateixa. */
    m.identitat = ambPersona(PERSONA);
    expect((await munta({ permisos: AMB_TITULAR })).titular).toEqual(TITULAR);
  });

  test('sense el permís al manifest, null: la persona no arriba a cap altra app, ni per l’entorn', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = ambPersona();
    expect((await munta({ permisos: AMB_SESSIO })).titular).toBeNull();
    cleanup();
    expect((await munta()).titular).toBeNull();
    cleanup();
    expect((await munta({ permisos: AMB_SESSIO, sessio: { estat: 'dins', titular: TITULAR } })).titular).toBeNull();
  });

  test('amb estat «fora», null; en la renovació del mateix compte es conserva (no parpelleja); en eixir, se’n va', async () => {
    m.sessio = { ...SESSIO_DINS, estat: 'fora' };
    m.identitat = ambPersona();
    expect((await munta({ permisos: AMB_TITULAR })).titular).toBeNull();
    cleanup();
    m.sessio = SESSIO_DINS;
    await munta({ permisos: AMB_TITULAR });
    expect(vist.titular).toEqual(TITULAR);
    m.sessio = { ...SESSIO_DINS, estat: 'comprovant' };
    await rellig();
    expect([vist.estat, vist.titular]).toEqual(['dins', TITULAR]);
    m.sessio = { ...SESSIO_DINS, estat: 'fora', currentUser: null };
    await rellig();
    expect([vist.estat, vist.titular]).toEqual(['fora', null]);
  });

  test('un convidat, una llista sense persona o cap llista: null (l’entitat no és mai el titular)', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = { actor: { tipus: 'persona', id: null, nom: null, avatar: null, rol: 'convidat', slug: null, kind: null }, identitats: [] };
    expect((await munta({ permisos: AMB_TITULAR })).titular).toBeNull();
    cleanup();
    m.identitat = { actor: ENTITAT, identitats: [{ ...ENTITAT, activa: true }] };
    expect((await munta({ permisos: AMB_TITULAR })).titular).toBeNull();
    cleanup();
    m.identitat = { actor: PERSONA };
    expect((await munta({ permisos: AMB_TITULAR })).titular).toBeNull();
  });

  test('un nom que és un correu, buit o absent: «El meu compte», mai el correu', async () => {
    m.sessio = SESSIO_DINS;
    for (const nom of ['sonda@exemple.invalid', '   ', null, undefined]) {
      m.identitat = { actor: PERSONA, identitats: [{ ...PERSONA, nom }] };
      const vista = await munta({ permisos: AMB_TITULAR });
      expect(vista.titular, String(nom)).toEqual({ ...TITULAR, nom: NOM_SENSE_NOM });
      expect(JSON.stringify(vista), String(nom)).not.toContain('@');
      cleanup();
    }
  });

  test('per l’entorn (entorn.sessio.titular): el mateix filtre i el mateix permís; l’entorn mana damunt dels contexts', async () => {
    const ambSobrants = { ...TITULAR, id: 'usuari-sonda-1', email: 'sonda@exemple.invalid', rol: 'owner', kind: 'entitat' };
    const vista = await munta({ permisos: AMB_TITULAR, sessio: { estat: 'dins', titular: ambSobrants } });
    expect(vista.titular).toEqual(TITULAR);
    expect(JSON.stringify(vista)).not.toMatch(/usuari-sonda-1|exemple\.invalid|owner|"kind"/);
    cleanup();
    expect((await munta({ permisos: AMB_TITULAR, sessio: { estat: 'dins', titular: { ...TITULAR, nom: 'sonda@exemple.invalid' } } })).titular)
      .toEqual({ ...TITULAR, nom: NOM_SENSE_NOM });
    cleanup();
    expect((await munta({ permisos: AMB_TITULAR, sessio: { estat: 'fora', titular: TITULAR } })).titular).toBeNull();
    cleanup();
    expect((await munta({ permisos: AMB_TITULAR, sessio: { estat: 'dins', titular: 'Pepa Soler' } })).titular).toBeNull();
    cleanup();
    m.sessio = SESSIO_DINS;
    m.identitat = ambPersona();
    expect((await munta({ permisos: AMB_TITULAR, sessio: { estat: 'dins' } })).titular).toBeNull();
  });

  test('la instantània de la font porta el titular de la persona i, de la persona, res més', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = ambPersona();
    let instantania = null;
    function SondaFont() {
      instantania = useSessioDeLaRuta();
      return <Sonda />;
    }
    const registre = creaRegistre({
      internes: [manifestDeProva({ carrega: () => Promise.resolve({ default: SondaFont }), permisos: AMB_TITULAR })]
    });
    muntaPlataforma('/app/prova/inici', { registre, entorn: ENTORN_OBERT });
    await screen.findByTestId('sessio');
    expect(instantania).toEqual({ estat: 'dins', idUsuari: 'usuari-sonda-1', esSuperadmin: false, marca: MARCA, titular: TITULAR });
    expect(Object.isFrozen(instantania.titular)).toBe(true);
    expect(JSON.stringify(instantania.titular)).not.toMatch(/usuari-sonda-1|"rol"|"tipus"|"activa"|"id"/);
  });

  test('amb IdentitatProvider de veres: la persona de les metadades, encara que la preferència siga l’entitat', async () => {
    m.sessio = {
      ...SESSIO_DINS,
      currentUser: Object.freeze({
        id: 'usuari-sonda-1', access_token: 'testimoni-sonda', email: 'sonda@exemple.invalid',
        user_metadata: { full_name: 'Pepa Soler', avatar_url: '/assets/cares/sonda.png' }
      })
    };
    m.organitzacions = [{ id: 'org-sonda-7', name: 'Bar de la Parròquia', logo_url: 'logo-parroquia.png', role: 'owner', slug: 'bar-parroquia', kind: 'entitat' }];
    desaPreferencia('usuari-sonda-1', { type: 'entitat', id: 'org-sonda-7' });
    const registre = creaRegistre({
      internes: [manifestDeProva({ carrega: () => Promise.resolve({ default: Sonda }), permisos: AMB_TITULAR })]
    });
    muntaPlataforma('/app/prova/inici', {
      registre,
      entorn: ENTORN_OBERT,
      fills: (
        <IdentitatProvider>
          <Routes><Route path="/app/*" element={<RutaApps />} /></Routes>
        </IdentitatProvider>
      )
    });
    await screen.findByTestId('sessio');
    await waitFor(() => expect(vist.marca).toEqual(MARCA));
    /* Sense poble a les metadades ni cap fila de perfil (getProfile simulat, null): ''. */
    expect(vist.titular).toEqual({ nom: 'Pepa Soler', avatar: '/assets/cares/sonda.png', poble: '' });
    expect(JSON.stringify(vist)).not.toMatch(/exemple\.invalid|usuari-sonda-1|testimoni-sonda/);
  });

  test('titularNet i titularDeLActor, soles', () => {
    expect(NOM_SENSE_NOM).toBe('El meu compte');
    expect(titularNet(TITULAR)).toEqual(TITULAR);
    expect(Object.isFrozen(titularNet(TITULAR))).toBe(true);
    expect(Object.keys(titularNet({ ...TITULAR, id: 'x', email: 'y', rol: 'owner', kind: 'k' })).sort()).toEqual(['avatar', 'nom', 'poble']);
    expect(titularNet(null)).toBeNull();
    expect(titularNet('Pepa Soler')).toBeNull();
    expect(titularNet({ nom: '   ' })).toBeNull();
    expect(titularNet({ nom: 7 })).toBeNull();
    expect(titularNet({ nom: '  Pepa Soler  ', avatar: 7, poble: 3 })).toEqual({ nom: 'Pepa Soler', avatar: null, poble: '' });
    expect(titularNet({ nom: 'Pepa', poble: '  La Torre de les Maçanes ' }).poble).toBe('La Torre de les Maçanes');
    expect(titularNet({ nom: 'pepa@exemple.invalid' }).nom).toBe(NOM_SENSE_NOM);
    /* 80 caràcters com a molt, comptats per caràcter: cap emoji partit per la meitat. */
    const llarg = titularNet({ nom: `${'🍅'.repeat(79)}ab` });
    expect(Array.from(llarg.nom)).toHaveLength(80);
    expect(llarg.nom.endsWith('🍅a')).toBe(true);
    expect(titularDeLActor(PERSONA)).toEqual(TITULAR);
    expect(titularDeLActor(ENTITAT)).toBeNull();
    expect(titularDeLActor({ ...PERSONA, rol: 'convidat' })).toBeNull();
    expect(titularDeLActor(null)).toBeNull();
    expect(titularDeLActor({ ...PERSONA, nom: 'pepa@exemple.invalid' })).toEqual({ ...TITULAR, nom: NOM_SENSE_NOM });
    expect(titularDeLActor({ ...PERSONA, poble: undefined })).toEqual({ ...TITULAR, poble: '' });
  });
});

describe('la forma i la tornada', () => {
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · nou claus: s'hi afig `titular`. Amb el
     titular declarat i la persona de la sessió, tampoc no hi entra cap id, correu, rol ni kind. */
  test('nou claus i prou, congelada: cap id, usuari, rol ni testimoni, ni amb el titular', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = { actor: ENTITAT, actorKey: 'entitat::org-sonda-7', memberships: [{ id: 'org-sonda-7', role: 'owner' }] };
    const vista = await munta({ permisos: AMB_SESSIO });
    expect(Object.keys(vista).sort()).toEqual(CLAUS);
    expect(Object.isFrozen(vista)).toBe(true);
    const text = JSON.stringify(vista);
    for (const fuita of ['org-sonda-7', 'usuari-sonda-1', 'testimoni-sonda', 'superadmin-sonda', 'owner', 'entitat::', '"kind"']) {
      expect(text, fuita).not.toContain(fuita);
    }
    expect(() => { vista.teSessio = false; }).toThrow(TypeError);
    cleanup();
    m.identitat = { ...m.identitat, identitats: [{ ...PERSONA, email: 'sonda@exemple.invalid' }, { ...ENTITAT, activa: true }] };
    const ambTitular = await munta({ permisos: AMB_TITULAR });
    expect(Object.keys(ambTitular).sort()).toEqual(CLAUS);
    expect(ambTitular.titular).toEqual(TITULAR);
    const textAmbTitular = JSON.stringify(ambTitular);
    for (const fuita of ['org-sonda-7', 'usuari-sonda-1', 'testimoni-sonda', 'superadmin-sonda', 'owner', 'entitat::', '"kind"', '"rol"', '"id"', '@', '"persona"']) {
      expect(textAmbTitular, fuita).not.toContain(fuita);
    }
  });

  test('també sense xarxa i en mode de proves: les mateixes nou claus, i els camps nous són booleans o un motiu conegut', async () => {
    posaEnLinia(false);
    m.sessio = SESSIO_FORA;
    m.recuperable = true;
    const foraDeLinia = await munta({ permisos: AMB_SESSIO });
    cleanup();
    const deProves = await munta({ permisos: AMB_SESSIO, externalConfig: { dataMode: 'seed' } });
    for (const vista of [foraDeLinia, deProves]) {
      expect(Object.keys(vista).sort()).toEqual(CLAUS);
      expect(Object.isFrozen(vista)).toBe(true);
      expect([typeof vista.enLinia, typeof vista.modeProves, typeof vista.potEscriure]).toEqual(['boolean', 'boolean', 'boolean']);
      expect(MOTIUS).toContain(vista.motiu);
    }
    expect([foraDeLinia.motiu, deProves.motiu]).toEqual(['fora-de-linia', 'mode-proves']);
  });

  test('rutaEntrada és la de RequireAuth: /registre en «entrar», amb la ruta i la consulta per a tornar', async () => {
    const url = '/app/prova/inici?vista=mes';
    const vista = await munta({ url });
    expect(vista.rutaEntrada).toBe(rutaDEntrada({ mode: 'entrar', tornar: url }));
    const [cami, consulta] = vista.rutaEntrada.split('?');
    expect(cami).toBe('/registre');
    expect(new URLSearchParams(consulta).get('mode')).toBe('entrar');
    expect(new URLSearchParams(consulta).get('tornar')).toBe(url);
  });

  test('mai crida el port ni la xarxa: només llig contexts, el navegador i la sessió desada', async () => {
    const xarxa = vi.fn();
    vi.stubGlobal('fetch', xarxa);
    m.sessio = SESSIO_DINS;
    m.identitat = { actor: ENTITAT };
    await munta({ permisos: AMB_SESSIO });
    cleanup();
    /* Sense xarxa i amb la sessió desada de veres (sessioRecuperable sense simular), i en mode de proves. */
    posaEnLinia(false);
    m.sessio = SESSIO_FORA;
    await munta({ permisos: AMB_SESSIO });
    cleanup();
    await munta({ permisos: AMB_SESSIO, externalConfig: { dataMode: 'local' } });
    expect(xarxa).not.toHaveBeenCalled();
    const llig = (fitxer) => readFileSync(path.join(process.cwd(), 'src/apps/plataforma', fitxer), 'utf8');
    const especificadorsDe = (codi) => [...codi.matchAll(/\bfrom\s+'([^']+)'/g)].map((coincidencia) => coincidencia[1]);
    const codi = llig('sessioApp.js');
    /* El pont no importa cap context de l'arrel (fronteres.test.js): la sessió li arriba per ContextApp.jsx. */
    expect(especificadorsDe(codi)).toEqual([
      'react',
      '../../app/contexts/RouterContext',
      '../../app/contexts/UIContext',
      '../../config/rutaEntrada.js',
      '../../config/backendConfig.js',
      '../../data/identitat.js',
      '../../components/universal/connexio/useEnLinia.js',
      './ContextApp.jsx'
    ]);
    /* De la capa de la sessió, només el booleà de la sessió desada; de la configuració, només la normalització. */
    expect(codi).toContain("import { sessioRecuperable } from '../../data/identitat.js';");
    expect(codi).toContain("import { normalizeBackendConfig } from '../../config/backendConfig.js';");
    expect(codi).not.toMatch(/backendPort|getRuntimeDataMode|usuariDeSessio|llegixRegistre|triaRefresc/);
    /* La font: els dos contexts de l'arrel i el filtre de la marca, i res més. */
    const font = llig('fontSessio.js');
    expect(especificadorsDe(font)).toEqual([
      'react',
      '../../app/contexts/SessionContext',
      '../../app/contexts/IdentitatContext',
      './sessioApp.js'
    ]);
    expect(font).not.toMatch(/backendPort|access_token|getRuntimeDataMode|memberships/);
  });

  test('ESTAT del pont són els valors de SessionContext.ESTAT (el pont no el pot importar)', () => {
    expect(ESTAT).toEqual(ESTAT_DE_SESSIONCONTEXT);
    expect(Object.isFrozen(ESTAT)).toBe(true);
  });

  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · cinc camps: s'hi afig el titular, la
     persona de la sessió filtrada (sense identitats, cap: null). */
  test('la instantània de la font: cinc camps, congelada, sense testimoni, rol, pertinences ni actor', async () => {
    m.sessio = SESSIO_DINS;
    m.identitat = { actor: ENTITAT, actorKey: 'entitat::org-sonda-7', memberships: [{ id: 'org-sonda-7', role: 'owner' }] };
    let instantania = null;
    function SondaFont() {
      instantania = useSessioDeLaRuta();
      return <Sonda />;
    }
    const registre = creaRegistre({
      internes: [manifestDeProva({ carrega: () => Promise.resolve({ default: SondaFont }), permisos: AMB_SESSIO })]
    });
    muntaPlataforma('/app/prova/inici', { registre, entorn: ENTORN_OBERT });
    await screen.findByTestId('sessio');
    expect(instantania).toEqual({ estat: 'dins', idUsuari: 'usuari-sonda-1', esSuperadmin: false, marca: MARCA, titular: null });
    expect(Object.isFrozen(instantania)).toBe(true);
    const text = JSON.stringify(instantania);
    for (const fuita of ['testimoni-sonda', 'superadmin-sonda', 'owner', 'org-sonda-7', 'entitat::', '"kind"', 'generacio']) {
      expect(text, fuita).not.toContain(fuita);
    }
    /* L'id del compte només serveix per a la renovació: el pont no el torna mai. */
    expect(JSON.stringify(vist)).not.toContain('usuari-sonda-1');
  });

  test('només llig la sessió l’app que crida el pont: RutaApps passa la font, no la crida', async () => {
    m.sessio = SESSIO_DINS;
    function SenseSessio() {
      return <output data-testid="sense-sessio">sense pont</output>;
    }
    const registre = creaRegistre({
      internes: [manifestDeProva({ carrega: () => Promise.resolve({ default: SenseSessio }), permisos: AMB_SESSIO })]
    });
    muntaPlataforma('/app/prova/inici', { registre, entorn: ENTORN_OBERT });
    await screen.findByTestId('sense-sessio');
    expect(m.lecturesSessio).toBe(0);
    cleanup();
    await munta({ permisos: AMB_SESSIO });
    expect(m.lecturesSessio).toBeGreaterThan(0);
  });
});
