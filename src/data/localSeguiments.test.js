/* T6b (IDEA-14; decisió del Mestre, 261024) · El servidor local dels
   seguiments (localSeguiments.js), sol i amb un padró de proves: les regles
   de public.segueix (2610241430) en el mateix ordre, la idempotència, els
   dos sostres (per hora i en total), els bloquejos que amaguen, la llista de
   qui seguix (la persona o l'entitat, només per a qui l'administra) i l'ordre
   per data, mai per cap puntuació. Cap xarxa, cap localStorage. */
import { describe, expect, test } from 'vitest';
import { ESPERA_DE_REPRESA, LIMIT_PER_HORA, LIMIT_TOTAL, createLocalSeguimentsAdapter, localSeguiments, reiniciaLocalSeguiments } from './localSeguiments.js';
import { PERSONA_PILOT } from './identitatsSeed.js';

const JO = { id: 'u-jo' };
const PEPA = { id: 'u-pepa' };
const ENTITATS = {
  forn: { tipus: 'entitat', id: 'forn', slug: 'forn-de-la-torre', nom: 'Forn de la Torre', propietari: false },
  colla: { tipus: 'grup', id: 'colla', nom: 'Colla del Poble', propietari: false },
  meua: { tipus: 'entitat', id: 'meua', nom: 'La meua botiga', propietari: true },
  iaia: { tipus: 'ia', id: 'iaia', nom: 'IAIA MarIA', propietari: false }
};
/* Un padró de proves: les fitxes per id o per slug, i el nom de cada sessió. */
const perfilsDeProva = (propietaries = new Set(['u-jo'])) => ({
  loadPerfilPublic(clau, usuari) {
    const fitxa = ENTITATS[clau] || Object.values(ENTITATS).find((f) => f.slug === clau) || null;
    if (!fitxa) return null;
    return { ...fitxa, propietari: fitxa.propietari && propietaries.has(usuari?.id) };
  },
  getProfile: (usuari) => ({ id: usuari.id, full_name: usuari.id === 'u-pepa' ? 'Pepa Garcia' : 'Jo Mateix' })
});
const persones = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, nom: `Persona ${i}` }));

function adaptador({ n = 3, ara } = {}) {
  let moment = Date.parse('2026-10-24T10:00:00Z');
  const rellotge = { avança: (ms) => { moment += ms; } };
  const local = createLocalSeguimentsAdapter({ perfils: perfilsDeProva(), persones: persones(n), ara: ara || (() => new Date(moment)) });
  return { local, rellotge };
}
const de = (usuari, bloquejos = []) => ({ usuari, qui: usuari?.id ?? 'convidat-1', bloquejos });
const codi = (fes) => { try { fes(); return null; } catch (error) { return error.code; } };

describe('segueix, estatSeguiment, elsMeusSeguiments i deixaDeSeguir', () => {
  /* Actualitzada a posta (261024 correccions): motiu, segueix torna `primer` (= nou). */
  test('seguir és idempotent i l’estat diu des de quan; deixar de seguir, també idempotent', () => {
    const { local, rellotge } = adaptador();
    const primer = local.segueix({ tipus: 'persona', id: 'p1' }, de(JO));
    expect(primer).toEqual({ seguint: true, creatAl: '2026-10-24T10:00:00.000Z', nou: true, primer: true });
    rellotge.avança(1000);
    expect(local.segueix({ tipus: 'persona', id: 'p1' }, de(JO))).toEqual({ seguint: true, creatAl: primer.creatAl, nou: false, primer: false });
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, de(JO))).toEqual({ seguint: true, creatAl: primer.creatAl });
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, de(PEPA))).toEqual({ seguint: false, creatAl: null });
    expect(local.deixaDeSeguir({ tipus: 'persona', id: 'p1' }, de(JO))).toEqual({ seguint: false });
    expect(local.deixaDeSeguir({ tipus: 'persona', id: 'p1' }, de(JO))).toEqual({ seguint: false });
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, de(JO))).toEqual({ seguint: false, creatAl: null });
  });

  test('una entitat es guarda pel seu id, també si se seguix pel slug; un grup també és una entitat', () => {
    const { local, rellotge } = adaptador();
    expect(local.segueix({ tipus: 'entitat', id: 'forn-de-la-torre' }, de(JO))).toMatchObject({ nou: true });
    expect(local.segueix({ tipus: 'entitat', id: 'forn' }, de(JO))).toMatchObject({ nou: false });
    rellotge.avança(60 * 1000);
    local.segueix({ tipus: 'entitat', id: 'colla' }, de(JO));
    rellotge.avança(60 * 1000);
    local.segueix({ tipus: 'persona', id: 'p2' }, de(JO));
    /* Per data, la més nova primer: cap puntuació. */
    expect(local.elsMeusSeguiments(de(JO))).toEqual([
      { tipus: 'persona', id: 'p2', nom: 'Persona 2', creatAl: '2026-10-24T10:02:00.000Z' },
      { tipus: 'entitat', id: 'colla', nom: 'Colla del Poble', creatAl: '2026-10-24T10:01:00.000Z' },
      { tipus: 'entitat', id: 'forn', nom: 'Forn de la Torre', creatAl: '2026-10-24T10:00:00.000Z' }
    ]);
    expect(local.estatSeguiment({ tipus: 'entitat', id: 'forn-de-la-torre' }, de(JO))).toMatchObject({ seguint: true });
    expect(local.deixaDeSeguir({ tipus: 'entitat', id: 'forn-de-la-torre' }, de(JO))).toEqual({ seguint: false });
    expect(local.elsMeusSeguiments(de(JO)).map((s) => s.id)).toEqual(['p2', 'colla']);
  });

  test('les portes, en l’ordre del servidor: entrada, tu mateix o la teua entitat, el teu bloqueig, que existisca', () => {
    const { local } = adaptador();
    expect(codi(() => local.segueix({ tipus: 'grup', id: 'colla' }, de(JO)))).toBe('SDP-SEG-001');
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'amb espai' }, de(JO)))).toBe('SDP-SEG-001');
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'u-jo' }, de(JO)))).toBe('SDP-SEG-003');
    /* Amb sessió, els àlies de la persona pilot són de qui ha entrat (localPerfils). */
    for (const alies of PERSONA_PILOT.alies) expect(codi(() => local.segueix({ tipus: 'persona', id: alies }, de(JO))), alies).toBe('SDP-SEG-003');
    expect(codi(() => local.segueix({ tipus: 'entitat', id: 'meua' }, de(JO)))).toBe('SDP-SEG-003');
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p1' }, de(JO, [{ tipus: 'persona', id: 'p1' }])))).toBe('SDP-SEG-004');
    expect(codi(() => local.segueix({ tipus: 'entitat', id: 'forn-de-la-torre' }, de(JO, [{ tipus: 'entitat', id: 'forn' }])))).toBe('SDP-SEG-004');
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'ningu' }, de(JO)))).toBe('SDP-SEG-002');
    expect(codi(() => local.segueix({ tipus: 'entitat', id: 'iaia' }, de(JO)))).toBe('SDP-SEG-002');
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p1' }, { qui: null }))).toBe('SDP-SEG-000');
    expect(codi(() => local.deixaDeSeguir({ tipus: 'persona', id: 'p1' }, { qui: null }))).toBe('SDP-SEG-000');
    /* Qui no l'administra la pot seguir; sense sessió, la persona pilot no és seua. */
    expect(local.segueix({ tipus: 'entitat', id: 'meua' }, de(PEPA))).toMatchObject({ nou: true });
    expect(local.segueix({ tipus: 'persona', id: 'p0' }, de(null))).toMatchObject({ nou: true });
    expect(local.elsMeusSeguiments(de(JO))).toEqual([]);
  });

  test('un bloqueig posterior amaga el seguiment a l’estat i a la llista, i desbloquejar el torna', () => {
    const { local } = adaptador();
    local.segueix({ tipus: 'persona', id: 'p1' }, de(JO));
    const bloquejos = [{ tipus: 'persona', id: 'p1' }];
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, de(JO, bloquejos))).toEqual({ seguint: false, creatAl: null });
    expect(local.elsMeusSeguiments(de(JO, bloquejos))).toEqual([]);
    expect(local.elsMeusSeguiments(de(JO)).map((s) => s.id)).toEqual(['p1']);
  });

  test('els sostres: LIMIT_PER_HORA nous per hora i LIMIT_TOTAL en total', () => {
    /* Actualitzada a posta (Gauntlet 261024_1945, Codex G-01, Gemini G1945-02): el sostre per hora és 30. */
    expect([LIMIT_PER_HORA, LIMIT_TOTAL]).toEqual([30, 1000]);
    const { local, rellotge } = adaptador({ n: LIMIT_TOTAL + 1 });
    for (let i = 0; i < LIMIT_PER_HORA; i += 1) local.segueix({ tipus: 'persona', id: `p${i}` }, de(JO));
    expect(codi(() => local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO)))).toBe('SDP-SEG-006');
    /* Repetir-ne un no és cap seguiment nou: no topa amb el sostre. */
    expect(local.segueix({ tipus: 'persona', id: 'p0' }, de(JO))).toMatchObject({ nou: false });
    rellotge.avança(60 * 60 * 1000 + 1);
    expect(local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO))).toMatchObject({ nou: true });
    for (let i = LIMIT_PER_HORA + 1; i < LIMIT_TOTAL; i += 1) {
      if (i % LIMIT_PER_HORA === 0) rellotge.avança(60 * 60 * 1000 + 1);
      local.segueix({ tipus: 'persona', id: `p${i}` }, de(JO));
    }
    rellotge.avança(60 * 60 * 1000 + 1);
    expect(local.elsMeusSeguiments(de(JO))).toHaveLength(LIMIT_TOTAL);
    expect(codi(() => local.segueix({ tipus: 'persona', id: `p${LIMIT_TOTAL}` }, de(JO)))).toBe('SDP-SEG-006');
    /* El total compta els vius: deixar-ne un fa lloc a un altre. */
    local.deixaDeSeguir({ tipus: 'persona', id: 'p0' }, de(JO));
    expect(local.segueix({ tipus: 'persona', id: `p${LIMIT_TOTAL}` }, de(JO))).toMatchObject({ primer: true });
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p0' }, de(JO)))).toBe('SDP-SEG-006');
  });
});

/* Correccions 261024 (Codex D-07.1, Gemini G2-06.1, R2-04, R4-01): deixar de
   seguir era un DELETE i tornar a seguir donava `nou: true` cada vegada; el
   límit per hora comptava files vives. Ara és un esborrat suau. */
describe('l’esborrat suau: el límit i l’avís no es reinicien seguint i deixant de seguir', () => {
  test(`${LIMIT_PER_HORA} altes en una hora, cada una deixada de seguida: la ${LIMIT_PER_HORA + 1}a topa amb el límit`, () => {
    const { local, rellotge } = adaptador({ n: LIMIT_PER_HORA + 1 });
    for (let i = 0; i < LIMIT_PER_HORA; i += 1) {
      expect(local.segueix({ tipus: 'persona', id: `p${i}` }, de(JO))).toMatchObject({ primer: true });
      local.deixaDeSeguir({ tipus: 'persona', id: `p${i}` }, de(JO));
      rellotge.avança(1000);
    }
    expect(local.elsMeusSeguiments(de(JO))).toEqual([]);
    expect(codi(() => local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO)))).toBe('SDP-SEG-006');
    /* Les represes també compten: tornar a seguir-ne una ara és el mateix 006. */
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p0' }, de(JO)))).toBe('SDP-SEG-006');
    rellotge.avança(60 * 60 * 1000);
    expect(local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO))).toMatchObject({ primer: true });
  });

  test('primer (i nou) només la primera vegada de totes: cap represa no torna a avisar', () => {
    const { local, rellotge } = adaptador();
    const respostes = [];
    for (let cicle = 0; cicle < 20; cicle += 1) {
      respostes.push(local.segueix({ tipus: 'persona', id: 'p1' }, de(JO)));
      local.deixaDeSeguir({ tipus: 'persona', id: 'p1' }, de(JO));
      rellotge.avança(ESPERA_DE_REPRESA + 1);
    }
    expect(respostes.filter((r) => r.primer === true)).toHaveLength(1);
    expect(respostes.filter((r) => r.nou === true)).toHaveLength(1);
    expect(respostes[0]).toMatchObject({ nou: true, primer: true });
    for (const resposta of respostes.slice(1)) expect(resposta).toMatchObject({ seguint: true, nou: false, primer: false });
    /* Una altra persona que seguix la mateixa parella té la seua primera vegada. */
    expect(local.segueix({ tipus: 'persona', id: 'p1' }, de(PEPA))).toMatchObject({ primer: true });
  });

  /* Actualitzada a posta (Gauntlet 261024_1945, Gemini G1945-03): el que fixava era el defecte («la primera
     desfeta és lliure»). L'espera es compta des de l'última represa o, si no n'hi ha cap, des de l'alta. */
  test('una represa de la mateixa parella com a molt cada ESPERA_DE_REPRESA, comptada des de l’alta: la primera tampoc no és lliure', () => {
    expect(ESPERA_DE_REPRESA).toBe(10 * 60 * 1000);
    const { local, rellotge } = adaptador();
    local.segueix({ tipus: 'persona', id: 'p1' }, de(JO));
    local.deixaDeSeguir({ tipus: 'persona', id: 'p1' }, de(JO));
    /* Un clic de més i tornar-hi de seguida: ja no es pot. */
    rellotge.avança(1000);
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p1' }, de(JO)))).toBe('SDP-SEG-006');
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, de(JO))).toEqual({ seguint: false, creatAl: null });
    /* Un mil·lisegon abans dels 10 minuts de l'alta, encara no; als 10 minuts justos, sí (com segueix:
       coalesce(v_represa, v_al) > v_ara - interval '10 minutes'). */
    rellotge.avança(ESPERA_DE_REPRESA - 1000 - 1);
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p1' }, de(JO)))).toBe('SDP-SEG-006');
    rellotge.avança(1);
    expect(local.segueix({ tipus: 'persona', id: 'p1' }, de(JO))).toEqual({ seguint: true, creatAl: '2026-10-24T10:10:00.000Z', nou: false, primer: false });
    /* I la següent, des d'esta represa. */
    local.deixaDeSeguir({ tipus: 'persona', id: 'p1' }, de(JO));
    rellotge.avança(ESPERA_DE_REPRESA - 1);
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p1' }, de(JO)))).toBe('SDP-SEG-006');
    rellotge.avança(1);
    expect(local.segueix({ tipus: 'persona', id: 'p1' }, de(JO))).toMatchObject({ seguint: true, primer: false });
  });

  test('una fila deixada no es veu enlloc; represa, diu des de quan se seguix ara i puja a dalt', () => {
    const { local, rellotge } = adaptador();
    local.segueix({ tipus: 'persona', id: 'p1' }, de(PEPA));
    rellotge.avança(1000);
    local.segueix({ tipus: 'persona', id: 'p2' }, de(PEPA));
    local.deixaDeSeguir({ tipus: 'persona', id: 'p1' }, de(PEPA));
    const deP1 = { usuari: { id: 'p1' }, qui: 'p1' };
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, de(PEPA))).toEqual({ seguint: false, creatAl: null });
    expect(local.elsMeusSeguiments(de(PEPA)).map((s) => s.id)).toEqual(['p2']);
    expect(local.quiEmSegueix({}, deP1)).toEqual([]);
    /* Actualitzada a posta (Gauntlet 261024_1945, Gemini G1945-03): la represa espera ESPERA_DE_REPRESA des de l'alta. */
    rellotge.avança(ESPERA_DE_REPRESA);
    local.segueix({ tipus: 'persona', id: 'p1' }, de(PEPA));
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, de(PEPA))).toEqual({ seguint: true, creatAl: '2026-10-24T10:10:01.000Z' });
    expect(local.elsMeusSeguiments(de(PEPA)).map((s) => [s.id, s.creatAl])).toEqual([
      ['p1', '2026-10-24T10:10:01.000Z'], ['p2', '2026-10-24T10:00:01.000Z']
    ]);
    expect(local.quiEmSegueix({}, deP1)).toEqual([{ id: 'u-pepa', nom: 'Pepa Garcia', creatAl: '2026-10-24T10:10:01.000Z' }]);
    /* Deixar de seguir dues vegades no mou la marca ni falla. */
    local.deixaDeSeguir({ tipus: 'persona', id: 'p2' }, de(PEPA));
    expect(local.deixaDeSeguir({ tipus: 'persona', id: 'p2' }, de(PEPA))).toEqual({ seguint: false });
  });
});

/* T2 (261024_1800, P2-10; auditoria Codex 261024_1800 C6-01) · El límit per hora compta les altes i
   represes acceptades (el registre de les altes), no les files: una parella represa diverses vegades
   en una hora hi compta cada vegada. Abans, 59 parelles i dues represes donaven 61 altes en una hora. */
describe(`T2 · el registre de les altes: cap combinació d’altes, baixes i represes passa de ${LIMIT_PER_HORA} per hora`, () => {
  /* Actualitzada a posta (Gauntlet 261024_1945): el sostre és 30 i la primera represa espera 10 minuts des de
     l'alta. La reproducció de Codex C6-01, adaptada: LIMIT_PER_HORA − 1 parelles noves i, passada l'espera,
     dues represes; la segona és l'alta LIMIT_PER_HORA + 1 i topa amb el límit. */
  test(`la reproducció de Codex C6-01 amb el sostre de ${LIMIT_PER_HORA}: ${LIMIT_PER_HORA - 1} parelles noves i dues represes passada l’espera; la segona és la ${LIMIT_PER_HORA + 1}a i topa amb el límit`, () => {
    const { local, rellotge } = adaptador({ n: LIMIT_PER_HORA });
    for (let i = 0; i < LIMIT_PER_HORA - 1; i += 1) local.segueix({ tipus: 'persona', id: `p${i}` }, de(JO));
    rellotge.avança(ESPERA_DE_REPRESA);
    local.deixaDeSeguir({ tipus: 'persona', id: 'p0' }, de(JO));
    expect(local.segueix({ tipus: 'persona', id: 'p0' }, de(JO))).toMatchObject({ seguint: true, primer: false });
    local.deixaDeSeguir({ tipus: 'persona', id: 'p1' }, de(JO));
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p1' }, de(JO)))).toBe('SDP-SEG-006');
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, de(JO))).toEqual({ seguint: false, creatAl: null });
  });

  test('una represa immediata després de l’alta topa amb l’espera i no gasta cap alta del registre', () => {
    const { local } = adaptador({ n: LIMIT_PER_HORA + 1 });
    local.segueix({ tipus: 'persona', id: 'p0' }, de(JO));
    local.deixaDeSeguir({ tipus: 'persona', id: 'p0' }, de(JO));
    for (let vegada = 0; vegada < 5; vegada += 1) expect(codi(() => local.segueix({ tipus: 'persona', id: 'p0' }, de(JO))), `intent ${vegada + 1}`).toBe('SDP-SEG-006');
    /* El registre només té l'alta de p0: encara hi caben LIMIT_PER_HORA − 1 parelles noves, i ni una més. */
    for (let i = 1; i < LIMIT_PER_HORA; i += 1) expect(local.segueix({ tipus: 'persona', id: `p${i}` }, de(JO)), `p${i}`).toMatchObject({ primer: true });
    expect(codi(() => local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO)))).toBe('SDP-SEG-006');
  });

  /* Actualitzada a posta (Gauntlet 261024_1945): el sostre és 30, de manera que hi caben 25 parelles més. */
  test(`una sola parella represa cada ESPERA_DE_REPRESA hi compta cada vegada: amb ${LIMIT_PER_HORA - 5} parelles més, la cinquena represa ja no passa`, () => {
    const { local, rellotge } = adaptador({ n: LIMIT_PER_HORA });
    for (let i = 1; i <= LIMIT_PER_HORA - 5; i += 1) local.segueix({ tipus: 'persona', id: `p${i}` }, de(JO));
    local.segueix({ tipus: 'persona', id: 'p0' }, de(JO));
    /* LIMIT_PER_HORA − 4 altes. Quatre represes de p0 (LIMIT_PER_HORA), i la cinquena topa. */
    for (let vegada = 0; vegada < 4; vegada += 1) {
      local.deixaDeSeguir({ tipus: 'persona', id: 'p0' }, de(JO));
      rellotge.avança(ESPERA_DE_REPRESA + 1);
      expect(local.segueix({ tipus: 'persona', id: 'p0' }, de(JO)), `represa ${vegada + 1}`).toMatchObject({ seguint: true, primer: false });
    }
    local.deixaDeSeguir({ tipus: 'persona', id: 'p0' }, de(JO));
    rellotge.avança(ESPERA_DE_REPRESA + 1);
    expect(codi(() => local.segueix({ tipus: 'persona', id: 'p0' }, de(JO)))).toBe('SDP-SEG-006');
  });

  test('la finestra llisca: una alta surt del compte quan fa una hora, ni abans ni després; seguir el que ja seguixes no compta', () => {
    const { local, rellotge } = adaptador({ n: LIMIT_PER_HORA + 2 });
    local.segueix({ tipus: 'persona', id: 'p0' }, de(JO));
    rellotge.avança(30 * 60 * 1000);
    for (let i = 1; i < LIMIT_PER_HORA; i += 1) local.segueix({ tipus: 'persona', id: `p${i}` }, de(JO));
    /* Cap no-res: tornar a seguir-ne una de viva no és cap alta. */
    for (let i = 0; i < 10; i += 1) expect(local.segueix({ tipus: 'persona', id: 'p5' }, de(JO))).toMatchObject({ nou: false });
    expect(codi(() => local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO)))).toBe('SDP-SEG-006');
    /* Un mil·lisegon abans de l'hora de la primera alta encara compta; a l'hora justa, ja no (com
       segueix: al > now() - interval '1 hour'). */
    rellotge.avança(30 * 60 * 1000 - 1);
    expect(codi(() => local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO)))).toBe('SDP-SEG-006');
    rellotge.avança(1);
    expect(local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO))).toMatchObject({ primer: true });
    expect(codi(() => local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA + 1}` }, de(JO)))).toBe('SDP-SEG-006');
  });

  test('el registre és de cada persona i reinicia() l’oblida', () => {
    const { local } = adaptador({ n: LIMIT_PER_HORA + 1 });
    for (let i = 0; i < LIMIT_PER_HORA; i += 1) local.segueix({ tipus: 'persona', id: `p${i}` }, de(JO));
    expect(codi(() => local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO)))).toBe('SDP-SEG-006');
    expect(local.segueix({ tipus: 'persona', id: 'p0' }, de(PEPA))).toMatchObject({ primer: true });
    local.reinicia();
    expect(local.segueix({ tipus: 'persona', id: `p${LIMIT_PER_HORA}` }, de(JO))).toMatchObject({ primer: true });
  });
});

describe('quiEmSegueix', () => {
  test('qui seguix la persona que crida (també pels àlies de la persona pilot), la més nova primer, amb el nom de cada sessió', () => {
    const { local, rellotge } = adaptador();
    local.segueix({ tipus: 'persona', id: 'p1' }, de(PEPA));
    rellotge.avança(1000);
    local.segueix({ tipus: 'persona', id: 'p1' }, de(null));
    local.segueix({ tipus: 'persona', id: 'p2' }, de(PEPA));
    const deP1 = createLocalSeguimentsAdapter({ perfils: perfilsDeProva(), persones: persones(3) });
    expect(deP1.quiEmSegueix({}, de({ id: 'p1' }))).toEqual([]);
    expect(local.quiEmSegueix({}, { usuari: { id: 'p1' }, qui: 'p1' })).toEqual([
      { id: 'convidat-1', nom: 'Veí/na', creatAl: '2026-10-24T10:00:01.000Z' },
      { id: 'u-pepa', nom: 'Pepa Garcia', creatAl: '2026-10-24T10:00:00.000Z' }
    ]);
    /* Qui crida amb sessió és la persona pilot: un seguiment a '0001' és seu. */
    const pilot = adaptador({ n: 0 }).local;
    const ambPilot = createLocalSeguimentsAdapter({ perfils: perfilsDeProva(), persones: [{ id: '0001', nom: 'Javi Llinares' }] });
    ambPilot.segueix({ tipus: 'persona', id: '0001' }, de(null));
    expect(ambPilot.quiEmSegueix({}, de(JO)).map((s) => s.id)).toEqual(['convidat-1']);
    expect(pilot.quiEmSegueix({}, de(JO))).toEqual([]);
  });

  test('una entitat: només per a qui l’administra (si no, SDP-SEG-005, també si no existix); un bloqueig de qui crida amaga qui seguix', () => {
    const { local } = adaptador();
    local.segueix({ tipus: 'entitat', id: 'meua' }, de(PEPA));
    expect(local.quiEmSegueix({ orgId: 'meua' }, de(JO))).toEqual([{ id: 'u-pepa', nom: 'Pepa Garcia', creatAl: '2026-10-24T10:00:00.000Z' }]);
    expect(codi(() => local.quiEmSegueix({ orgId: 'meua' }, de(PEPA)))).toBe('SDP-SEG-005');
    expect(codi(() => local.quiEmSegueix({ orgId: 'forn' }, de(JO)))).toBe('SDP-SEG-005');
    expect(codi(() => local.quiEmSegueix({ orgId: 'cap' }, de(JO)))).toBe('SDP-SEG-005');
    expect(codi(() => local.quiEmSegueix({ orgId: 'amb espai' }, de(JO)))).toBe('SDP-SEG-001');
    expect(local.quiEmSegueix({ orgId: 'meua' }, de(JO, [{ tipus: 'persona', id: 'u-pepa' }]))).toEqual([]);
    /* Les persones no es barregen amb les entitats. */
    expect(local.quiEmSegueix({}, de(JO))).toEqual([]);
  });

  test('sense qui crida, el buit; el singleton es reinicia', () => {
    const { local } = adaptador();
    expect(local.quiEmSegueix({}, { qui: null })).toEqual([]);
    expect(local.elsMeusSeguiments({ qui: null })).toEqual([]);
    expect(local.estatSeguiment({ tipus: 'persona', id: 'p1' }, { qui: null })).toEqual({ seguint: false, creatAl: null });
    reiniciaLocalSeguiments();
    expect(localSeguiments.elsMeusSeguiments({ qui: 'qualsevol' })).toEqual([]);
  });
});
