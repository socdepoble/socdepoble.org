import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test, vi } from 'vitest';
import { ALIES_DEL_PANELL, APLICACIONS, ESTATS_APLICACIO, aplicacionsValides } from './aplicacions.js';
import fontAplicacions from './aplicacions.js?raw';
import { IDS_PLUGINS } from '../plugins/registrePlugins.js';

/* Encàrrec d'harmonització (261018) · El catàleg complet del Panell: sis públiques i dues internes.
   P0-114 (ordre del Mestre, 261111) · I L'Avisador, darrere de l'Arbre Genealògic, com al Panell.
   R19 · T3 (ordre del Mestre, 261111; pla 261111_1720: «sincronització d'aplicacions.js perquè totes
   les eines del Panell de Control funcionen al 100%») · Les set amb destí real en este node són
   'connectades', amb la ruta de la seua targeta del Panell; el Snippet, les Mètriques i el Cervell,
   sense ruta pròpia, continuen 'pendent'. DEROGAT «totes pendents i sense `ruta`».
   Arbitratge del carril Genealogia + Perfil (P1) · El Snippet també és 'connectada': la seua secció és la seua
   fitxa del Panell (/control?fitxa=snippet). Només les Mètriques i el Cervell continuen 'pendent'. */
const CONNECTADES = Object.freeze({
  gestoria: '/app/gestoria', rebost: '/app/nevera/casa', salut: '/app/salut', genealogia: '/app/genealogia',
  avisador: '/page/avisador', 'lector-rss': '/app/lector', tpv: '/app/bar', snippet: '/control?fitxa=snippet'
});
test('les utilitats de sèrie: les declarades, amb icona; connectades les que tenen destí real i pendents la resta', () => {
  expect(APLICACIONS.map((a) => a.id)).toEqual(['gestoria', 'rebost', 'salut', 'genealogia', 'avisador', 'lector-rss', 'tpv', 'snippet', 'metriques', 'cervell']);
  for (const aplicacio of APLICACIONS) {
    expect(aplicacio.icona).toBeTruthy();
    expect(aplicacio.descripcio).toMatch(/\S/);
    if (Object.hasOwn(CONNECTADES, aplicacio.id)) {
      expect([aplicacio.id, aplicacio.estat, aplicacio.ruta]).toEqual([aplicacio.id, 'connectada', CONNECTADES[aplicacio.id]]);
    } else {
      expect([aplicacio.id, aplicacio.estat, Object.hasOwn(aplicacio, 'ruta')]).toEqual([aplicacio.id, 'pendent', false]);
    }
  }
  // La configuració de sèrie ja és vàlida: passar-la pel filtre no la canvia (ni l'estat ni la ruta).
  const valides = aplicacionsValides(APLICACIONS);
  expect(valides.map((a) => a.id)).toEqual(['gestoria', 'rebost', 'salut', 'genealogia', 'avisador', 'lector-rss', 'tpv', 'snippet', 'metriques', 'cervell']);
  expect(Object.fromEntries(valides.map((a) => [a.id, [a.estat, a.ruta]]))).toEqual({
    ...Object.fromEntries(Object.entries(CONNECTADES).map(([id, ruta]) => [id, ['connectada', ruta]])),
    metriques: ['pendent', null], cervell: ['pendent', null]
  });
  expect(Object.isFrozen(APLICACIONS)).toBe(true);
});

/* R19 · T3 · Cada utilitat amb app la governa el MATEIX literal de build que el `carrega` del seu
   manifest. Qualsevol valor que no siga '0', connectada.
   Arbitratge del carril Genealogia + Perfil (P1, tractor-promesa) · Amb =0, dos camins:
     · el Rebost, el Lector i el TPV, que qui porta la web pot afegir al seu paquet (VITE_SDP_APP_<ID>=1 al
       monolític, vite.standalone.config.js), queden 'pendent' i sense ruta (destiDelBuild);
     · la Gestoria, Salut i l'Arbre, que el paquet de l'amfitrió no porta MAI («Cap variable de l'entorn ho
       canvia»), no tenen fitxa (nomesSiElBuildLaPorta): una fitxa 'pendent' prometria «Quan s'hi connecte»
       en va. DEROGAT, per a estes tres, «la seua fitxa és pendent i sense ruta». */
const INTERRUPTORS = Object.freeze([
  ['gestoria', 'GESTORIA', 'gestoria'], ['rebost', 'NEVERA', 'nevera'], ['salut', 'SALUT', 'salut'],
  ['genealogia', 'GENEALOGIA', 'genealogia'], ['lector-rss', 'LECTOR', 'lector'], ['tpv', 'BAR', 'bar']
]);
const NOMES_A_LA_WEB_PROPIA = Object.freeze(['gestoria', 'salut', 'genealogia']);
test('R19 · T3 · cada utilitat amb app porta el literal de build del seu manifest', () => {
  for (const [id, variable, app] of INTERRUPTORS) {
    const literal = `import.meta.env.VITE_SDP_APP_${variable} !== '0'`;
    const forma = NOMES_A_LA_WEB_PROPIA.includes(id) ? `...nomesSiElBuildLaPorta(${literal}, {` : `...destiDelBuild(${literal}, rutaDeApp(`;
    expect([id, fontAplicacions.includes(forma)]).toEqual([id, true]);
    expect([id, fontAplicacions.split(literal).length - 1]).toEqual([id, 1]);
    expect([id, readFileSync(path.join(process.cwd(), `src/apps/${app}/manifest.js`), 'utf8').includes(`carrega: ${literal} ? () => import(`)])
      .toEqual([id, true]);
  }
  // Cap estat escrit a mà per a una utilitat amb app: només L'Avisador i el Snippet porten la seua ruta literal.
  expect(fontAplicacions.match(/^\s*estat: 'connectada',$/gm)).toHaveLength(2);
});

test('R19 · T3 · amb l’app desendollada del build (=0): pendent i sense ruta, o sense fitxa si el paquet de l’amfitrió no la porta mai; la resta no canvia', async () => {
  try {
    for (const [id, variable] of INTERRUPTORS) {
      vi.stubEnv(`VITE_SDP_APP_${variable}`, '0');
      vi.resetModules();
      const { APLICACIONS: apagades, aplicacionsValides: valida } = await import('./aplicacions.js');
      const perId = Object.fromEntries(valida(apagades).map((a) => [a.id, a]));
      if (NOMES_A_LA_WEB_PROPIA.includes(id)) {
        expect([id, Object.hasOwn(perId, id), apagades.length]).toEqual([id, false, APLICACIONS.length - 1]);
      } else {
        expect([id, perId[id].estat, perId[id].ruta]).toEqual([id, 'pendent', null]);
      }
      // Les altres apps continuen connectades: cada interruptor només trau la seua.
      for (const [altra] of INTERRUPTORS.filter(([candidat]) => candidat !== id)) {
        expect([id, altra, perId[altra].estat]).toEqual([id, altra, 'connectada']);
      }
      vi.unstubAllEnvs();
    }
    // Qualsevol altre valor deixa la fitxa connectada.
    for (const valor of ['1', '', 'no']) {
      vi.stubEnv('VITE_SDP_APP_GENEALOGIA', valor);
      vi.resetModules();
      const { APLICACIONS: enceses } = await import('./aplicacions.js');
      expect([valor, enceses.find((a) => a.id === 'genealogia').estat]).toEqual([valor, 'connectada']);
    }
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});

/* P0-114 (ordre del Mestre, 261111) · La fitxa de L'Avisador al Perfil la governa el mateix literal
   de build que el registre i App.jsx: per defecte hi és (i la persona el pot llevar del Panell, amb
   `panell: 'avisador'`); amb VITE_SDP_APP_AVISADOR=0, no.
   R19 · T3 (261111) · Amb fitxa, connectada a la seua pàgina (/page/avisador). Abans: 'pendent'. */
test('P0-114 · L’Avisador al Perfil: el mateix literal de build, la seua targeta del Panell i fora amb =0', async () => {
  expect(fontAplicacions).toContain("...(import.meta.env.VITE_SDP_APP_AVISADOR !== '0' ? [aplicacioDelNode({");
  expect(APLICACIONS.find((a) => a.id === 'avisador')).toMatchObject({ nom: 'L’Avisador', estat: 'connectada', ruta: '/page/avisador', panell: 'avisador' });
  try {
    vi.stubEnv('VITE_SDP_APP_AVISADOR', '0');
    vi.resetModules();
    const apagat = await import('./aplicacions.js');
    expect(apagat.APLICACIONS.map((a) => a.id)).not.toContain('avisador');
    expect(apagat.APLICACIONS).toHaveLength(APLICACIONS.length - 1);
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
});

test('el filtre descarta ids invàlids, noms buits i repetits; guanya la primera', () => {
  const valides = aplicacionsValides([
    { id: 'forn', nom: ' Forn ' },
    { id: 'Forn Gran', nom: 'Majúscules i espais' },
    { id: 'buit', nom: '   ' },
    { id: 'forn', nom: 'Repetida' },
    null,
    { nom: 'Sense id' },
  ]);
  /* Peça C (ordre del Mestre, 261007) · Cada utilitat vàlida porta `panell`,
     l'id amb què el Panell llig la preferència; sense declarar-ne, el seu id. */
  expect(valides).toEqual([{ id: 'forn', nom: 'Forn', descripcio: '', icona: null, estat: 'pendent', ruta: null, panell: 'forn' }]);
  expect(aplicacionsValides('no és una llista')).toEqual([]);
});

/* Ordre del Mestre (261007, prompt 261007_1628, peça C) · La preferència que
   escriu el Perfil ha de ser la que llig el Panell: cada utilitat apunta a un
   id del registre de plugins (el que amaga ControlSection) o al Snippet.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
   DEROGAT «o a una pàgina del sistema de Maquinària i Sistema» (Onada 8):
   les targetes de la Consola i del Cervell ixen del Panell de Control i
   viuen només al Mur. L'ordre nova: tota utilitat amb `panell` apunta a una
   targeta que el Panell encara pinta, i les que no en tenen (la Consola de
   Mètriques i el Cervell) porten un null explícit, sense cap preferència. */
test('peça C · Onada 10 · cada aplicació del Perfil apunta a una targeta del Panell (del registre de plugins o «snippet») o a cap (null)', () => {
  const delPanell = new Set([...IDS_PLUGINS, 'snippet']);
  const valides = aplicacionsValides(APLICACIONS);
  for (const aplicacio of valides.filter((a) => a.panell !== null)) {
    expect(delPanell.has(aplicacio.panell), `${aplicacio.id} → ${aplicacio.panell}`).toBe(true);
  }
  expect(valides.map((a) => [a.id, a.panell])).toEqual([
    ['gestoria', 'gestoria'], ['rebost', 'rebost'], ['salut', 'salut'], ['genealogia', 'genealogia'], ['avisador', 'avisador'], ['lector-rss', 'rss'], ['tpv', 'tpv'], ['snippet', 'snippet'],
    ['metriques', null], ['cervell', null],
  ]);
  /* Cap utilitat apunta ja a la clau d'una de les tres pàgines que han eixit del Panell. */
  for (const clau of ['consola', 'cervell', 'disseny']) {
    expect(delPanell.has(clau), clau).toBe(false);
    expect(valides.map((a) => a.panell), clau).not.toContain(clau);
  }
  /* El null és a la taula, escrit: no ix d'un camp que falta. */
  for (const id of ['metriques', 'cervell']) {
    expect(APLICACIONS.find((a) => a.id === id).panell, id).toBeNull();
  }
});

/* Onada 10 (261010) · DEROGAT l'àlies 'metriques' → 'consola': la Consola ja
   no té targeta al Panell. Una utilitat amb `panell: null` no fa cap àlies;
   sense el filtre, ambAlies (utilitatsActives.js) copiaria la preferència
   vella a una clau «null». */
test('peça C · Onada 10 · ALIES_DEL_PANELL: només l’id vell que encara té targeta, de la mateixa taula; cap àlies cap a null', () => {
  expect(ALIES_DEL_PANELL).toEqual({ 'lector-rss': 'rss' });
  expect(Object.values(ALIES_DEL_PANELL).every((id) => typeof id === 'string' && id !== 'null')).toBe(true);
  expect(Object.isFrozen(ALIES_DEL_PANELL)).toBe(true);
});

/* Onada 10 (261010) · Un null EXPLÍCIT sí que passa: «sense targeta al
   Panell». Només el null: un camp que falta, undefined, buit o mal format
   continua caient a l'id, com abans (una llista federada que no el declara no
   canvia de comportament). */
test('peça C · un `panell` que no és un id vàlid no passa: queda el de l’aplicació; un null explícit es conserva', () => {
  const [buit, majuscules, bo, sense, indefinit, nul] = aplicacionsValides([
    { id: 'a', nom: 'A', panell: '' },
    { id: 'b', nom: 'B', panell: 'Consola Gran' },
    { id: 'c', nom: 'C', panell: 'consola' },
    { id: 'd', nom: 'D' },
    { id: 'e', nom: 'E', panell: undefined },
    { id: 'f', nom: 'F', panell: null },
  ]);
  expect([buit.panell, majuscules.panell, bo.panell, sense.panell, indefinit.panell, nul.panell]).toEqual(['a', 'b', 'consola', 'd', 'e', null]);
});

/* Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   La Consola de Mètriques i el Cervell són maquinària interna (intern: true,
   escrit a la taula), i el filtre conserva la marca. Només un true: qualsevol
   altre valor no hi posa cap clau (una llista federada no canvia). */
test('Bloc 3.4 · la maquinària interna porta `intern: true`, i el filtre només la conserva quan és un true', () => {
  expect(APLICACIONS.filter((a) => a.intern === true).map((a) => a.id)).toEqual(['metriques', 'cervell']);
  const valides = aplicacionsValides(APLICACIONS);
  expect(valides.filter((a) => a.intern === true).map((a) => a.id)).toEqual(['metriques', 'cervell']);
  for (const aplicacio of valides.filter((a) => !['metriques', 'cervell'].includes(a.id))) {
    expect(aplicacio, aplicacio.id).not.toHaveProperty('intern');
  }
  const [si, fals, text, sense] = aplicacionsValides([
    { id: 'a', nom: 'A', intern: true },
    { id: 'b', nom: 'B', intern: false },
    { id: 'c', nom: 'C', intern: 'true' },
    { id: 'd', nom: 'D' },
  ]);
  expect(si.intern).toBe(true);
  for (const aplicacio of [fals, text, sense]) expect(aplicacio, aplicacio.id).not.toHaveProperty('intern');
});

test('només una utilitat «connectada» amb ruta interna s’enllaça; la resta, pendent', () => {
  const [bona, sensRuta, externa, protocol] = aplicacionsValides([
    { id: 'a', nom: 'A', estat: 'connectada', ruta: '/mercat' },
    { id: 'b', nom: 'B', estat: 'connectada' },
    { id: 'c', nom: 'C', estat: 'connectada', ruta: 'https://fora.test' },
    { id: 'd', nom: 'D', estat: 'connectada', ruta: '//fora.test' },
  ]);
  expect(bona).toMatchObject({ estat: 'connectada', ruta: '/mercat' });
  for (const aplicacio of [sensRuta, externa, protocol]) expect(aplicacio).toMatchObject({ estat: 'pendent', ruta: null });
  expect(ESTATS_APLICACIO.pendent).toBe('Pendent de connectar en este node');
});
