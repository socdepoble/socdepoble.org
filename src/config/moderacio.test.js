/* Fase D (261020, tasca 2; pla 261020_1300) · Les regles pures de la
   moderació (config/moderacio.js): què es denuncia o es bloqueja, què
   s'amaga i la capa optimista de la sessió. Amb les tres regles de
   privacitat de la crítica 261020 (troballa 4): mai s'infereix qui opera una
   entitat, un missatge signat per una entitat no s'anota, i res de qui mira
   no s'amaga. */
import { describe, expect, test } from 'vitest';
import {
  afigAlCanvi, anotaFilsBloquejats, anotaMissatgesBloquejats, canviBuit, clauDeBloqueig, elementBloquejat, filtraElementsBloquejats,
  firmaDeClaus, fotoDelCanvi, fusionaBloquejos, llevaDelCanvi, objectiuDeContrapart, objectiuDeMissatge, objectiuDeTargeta, omple,
  revertix, senseDirectesBloquejats
} from './moderacio.js';
import { objecteDe, objecteDePerfil } from './navigation.js';
import { ENTITAT_PILOT_ID, IAIA_ID } from '../data/identitatsSeed.js';
import { PREFIX_PER_DEFECTE } from '../data/xatsPerDefecte.js';

const PEPA = 'pepa-veina';
const FORN = 'forn-de-la-placa';
const claus = (...llista) => new Set(llista);

describe('objectiuDeTargeta', () => {
  const publicacio = { id: 'p1', title: 'Fira de tardor', author_name: 'Pepa', ownerUserId: PEPA };

  test('una publicació, un producte i un acte d’una persona o d’una entitat', () => {
    expect(objectiuDeTargeta(objecteDe(publicacio, 'mur'))).toEqual({
      tipus: 'publicacio', id: 'p1', titol: 'Fira de tardor', autor: { tipus: 'persona', id: PEPA, nom: 'Pepa' }, filId: null, bloquejable: true
    });
    const producte = objectiuDeTargeta(objecteDe({ id: 'm1', name: 'Mel', seller: 'El Forn', author_org_id: FORN }, 'mercat'));
    expect(producte).toMatchObject({ tipus: 'producte', autor: { tipus: 'entitat', id: FORN, nom: 'El Forn' }, bloquejable: true });
    expect(objectiuDeTargeta(objecteDe({ ...publicacio, id: 'e1' }, 'events'))).toMatchObject({ tipus: 'esdeveniment', id: 'e1' });
    expect(Object.isFrozen(producte) && Object.isFrozen(producte.autor)).toBe(true);
  });

  test('fora: null, una pàgina, una nota, sense autor amb id o nom, el pilot, la IAIA i el que és de qui mira', () => {
    expect(objectiuDeTargeta(null)).toBeNull();
    expect(objectiuDeTargeta(objecteDe(publicacio, 'pagina'))).toBeNull();
    expect(objectiuDeTargeta(objecteDe(publicacio, 'notes'))).toBeNull();
    expect(objectiuDeTargeta(objecteDe({ id: 'p2', title: 'x', author_name: 'Anònim' }, 'mur'))).toBeNull();
    expect(objectiuDeTargeta(objecteDe({ id: 'p3', title: 'x', ownerUserId: PEPA }, 'mur'))).toBeNull();
    expect(objectiuDeTargeta(objecteDe({ id: 'p 4', title: 'x', author_name: 'Pepa', ownerUserId: PEPA }, 'mur'))).toBeNull();
    expect(objectiuDeTargeta(objecteDe({ id: 'p5', title: 'x', author_name: 'Sóc de Poble', author_org_id: ENTITAT_PILOT_ID }, 'mur'))).toBeNull();
    expect(objectiuDeTargeta(objecteDe({ id: 'p6', title: 'x', author_name: 'IAIA', ownerUserId: IAIA_ID }, 'mur'))).toBeNull();
    expect(objectiuDeTargeta(objecteDe(publicacio, 'mur'), { esDeQuiMira: (id) => id === PEPA })).toBeNull();
  });

  test('un perfil públic de persona o d’entitat; ni el pilot, ni la IAIA, ni el propi, ni una IA o un grup', () => {
    expect(objectiuDeTargeta(objecteDePerfil({ id: PEPA, tipus: 'persona', nom: 'Pepa' }))).toEqual({
      tipus: 'persona', id: PEPA, titol: 'Pepa', autor: { tipus: 'persona', id: PEPA, nom: 'Pepa' }, filId: null, bloquejable: true
    });
    expect(objectiuDeTargeta(objecteDePerfil({ id: FORN, tipus: 'empresa', nom: 'El Forn' }))).toMatchObject({ tipus: 'entitat', id: FORN });
    expect(objectiuDeTargeta(objecteDePerfil({ id: ENTITAT_PILOT_ID, tipus: 'entitat', nom: 'Sóc de Poble' }))).toBeNull();
    expect(objectiuDeTargeta(objecteDePerfil({ id: IAIA_ID, tipus: 'persona', nom: 'IAIA' }))).toBeNull();
    expect(objectiuDeTargeta(objecteDePerfil({ id: PEPA, tipus: 'persona', nom: 'Pepa' }), { esDeQuiMira: (id) => id === PEPA })).toBeNull();
    expect(objectiuDeTargeta(objecteDePerfil({ id: 'agent', tipus: 'ia', nom: 'Agent' }))).toBeNull();
    expect(objectiuDeTargeta(objecteDePerfil({ id: 'g1', tipus: 'grup', nom: 'Colla' }))).toBeNull();
    expect(objectiuDeTargeta(objecteDePerfil({ id: PEPA, tipus: 'persona', nom: '' }))).toBeNull();
  });
});

describe('objectiuDeMissatge', () => {
  const fil = { id: 'f1' };
  const msg = (extra = {}) => ({ id: 'm1', threadId: 'f1', sender: 'other', usuariId: PEPA, author: 'Pepa', estatEnviament: 'enviat', ...extra });

  test('el d’una altra persona: denunciable i bloquejable', () => {
    expect(objectiuDeMissatge(msg(), fil)).toEqual({
      tipus: 'missatge', id: 'm1', titol: '', autor: { tipus: 'persona', id: PEPA, nom: 'Pepa' }, filId: 'f1', bloquejable: true
    });
  });

  test('fora: sistema, propi, esborrat, pendent o en error, fil de mostra o d’ajuda, IA i IAIA', () => {
    for (const extra of [{ tipus: 'sistema' }, { sender: 'me' }, { esborrat: true }, { esborratAl: '2026-10-20' },
      { estatEnviament: 'pendent' }, { estatEnviament: 'error' }, { is_ai: true }, { usuariId: IAIA_ID }]) {
      expect(objectiuDeMissatge(msg(extra), fil), JSON.stringify(extra)).toBeNull();
    }
    expect(objectiuDeMissatge(msg(), { id: 'fake-sdp' })).toBeNull();
    expect(objectiuDeMissatge(msg(), { id: `${PREFIX_PER_DEFECTE}iaia` })).toBeNull();
  });

  test('un visitant sense usuari i un missatge signat per una entitat només es denuncien', () => {
    expect(objectiuDeMissatge(msg({ usuariId: null }), fil)).toMatchObject({ autor: null, bloquejable: false });
    expect(objectiuDeMissatge(msg({ comEntitat: true, author: 'El Forn' }), fil)).toMatchObject({ bloquejable: false });
  });
});

describe('objectiuDeContrapart', () => {
  const directe = { id: 'f1', tipus: 'directe', name: 'Pepa', altres: [{ id: PEPA, nom: 'Pepa', tipus: 'persona' }] };

  test('l’altra part d’un directe 1:1 amb una persona', () => {
    expect(objectiuDeContrapart(directe)).toEqual({
      tipus: 'persona', id: PEPA, titol: 'Pepa', autor: { tipus: 'persona', id: PEPA, nom: 'Pepa' }, filId: 'f1', bloquejable: true
    });
  });

  test('null per a un grup, la IAIA, un canal d’entitat, un fil de pàgina, una entitat o un fil de mostra', () => {
    expect(objectiuDeContrapart({ ...directe, tipus: 'grup' })).toBeNull();
    expect(objectiuDeContrapart({ ...directe, esIA: true })).toBeNull();
    expect(objectiuDeContrapart({ ...directe, altres: [{ id: IAIA_ID, nom: 'IAIA', tipus: 'persona' }] })).toBeNull();
    expect(objectiuDeContrapart({ ...directe, comEntitat: true })).toBeNull();
    expect(objectiuDeContrapart({ ...directe, subjecte: { tipus: 'publicacio', id: 'p1' } })).toBeNull();
    expect(objectiuDeContrapart({ ...directe, altres: [{ id: FORN, nom: 'El Forn', tipus: 'entitat' }] })).toBeNull();
    expect(objectiuDeContrapart({ ...directe, id: 'fake-javi' })).toBeNull();
  });
});

describe('elementBloquejat i filtraElementsBloquejats', () => {
  const dePepa = { id: 'p1', ownerUserId: PEPA };
  const delForn = { id: 'p2', author_org_id: FORN, ownerUserId: PEPA };
  const deJoan = { id: 'p3', ownerUserId: 'joan' };

  test('per qui signa: la persona amaga el seu, l’entitat el de l’entitat; mai s’infereix qui opera l’entitat', () => {
    const persona = claus(clauDeBloqueig('persona', PEPA));
    expect(elementBloquejat(dePepa, persona)).toBe(true);
    expect(elementBloquejat(delForn, persona)).toBe(false);
    expect(elementBloquejat(delForn, claus(clauDeBloqueig('entitat', FORN)))).toBe(true);
    expect(elementBloquejat(deJoan, persona)).toBe(false);
    expect(elementBloquejat(dePepa, new Set())).toBe(false);
    expect(elementBloquejat(null, persona)).toBe(false);
  });

  test('res de qui mira no s’amaga mai', () => {
    const entitat = claus(clauDeBloqueig('entitat', FORN));
    expect(elementBloquejat(delForn, entitat, { esDeQuiMira: (id) => id === FORN })).toBe(false);
  });

  test('la MATEIXA llista si no en lleva cap; si en lleva, una de nova', () => {
    const llista = [dePepa, delForn, deJoan];
    expect(filtraElementsBloquejats(llista, () => false)).toBe(llista);
    expect(filtraElementsBloquejats(llista, null)).toBe(llista);
    const persona = claus(clauDeBloqueig('persona', PEPA));
    expect(filtraElementsBloquejats(llista, (item) => elementBloquejat(item, persona))).toEqual([delForn, deJoan]);
  });
});

describe('anotaMissatgesBloquejats', () => {
  const missatges = [
    { id: 'm1', seq: 1, sender: 'other', usuariId: PEPA, author: 'Pepa', text: 'Insult', metadades: { adjunts: [1] }, threadId: 'f1' },
    { id: 'm2', seq: 2, sender: 'me', usuariId: 'jo', text: 'Hola', metadades: {} },
    { id: 'm3', seq: 3, tipus: 'sistema', sender: 'other', usuariId: PEPA, text: 'Ha entrat', metadades: {} },
    { id: 'm4', seq: 4, sender: 'other', usuariId: PEPA, comEntitat: true, author: 'El Forn', text: 'Oferta', metadades: {} }
  ];
  const pepa = (id) => id === PEPA;

  test('buida el text i les metadades dels de la persona bloquejada; la resta, igual', () => {
    const eixida = anotaMissatgesBloquejats(missatges, pepa);
    expect(eixida[0]).toEqual({ ...missatges[0], text: '', metadades: {}, bloquejat: true });
    expect(eixida[0]).toMatchObject({ id: 'm1', seq: 1, sender: 'other', threadId: 'f1' });
    expect(eixida.slice(1)).toEqual(missatges.slice(1));
    expect(eixida[1]).toBe(missatges[1]);
    expect(eixida[2]).toBe(missatges[2]);
  });

  test('un missatge signat per una entitat no s’anota mai', () => {
    expect(anotaMissatgesBloquejats(missatges, pepa)[3]).toBe(missatges[3]);
  });

  test('la MATEIXA llista si no n’anota cap', () => {
    expect(anotaMissatgesBloquejats(missatges, () => false)).toBe(missatges);
    expect(anotaMissatgesBloquejats(missatges, null)).toBe(missatges);
  });
});

describe('anotaFilsBloquejats i senseDirectesBloquejats', () => {
  const directe = { id: 'f1', tipus: 'directe', name: 'Pepa', ultimText: 'Insult', ultimAutorId: PEPA, searchText: 'pepa insult',
    altres: [{ id: PEPA, tipus: 'persona' }] };
  const grup = { id: 'f2', tipus: 'grup', name: 'Colla', ultimText: 'Insult', ultimAutorId: PEPA, altres: [] };
  const deLaPagina = { ...grup, id: 'f3', subjecte: { tipus: 'publicacio', id: 'p1' } };
  const ambEntitat = { ...grup, id: 'f4', comEntitat: true };
  const directeAmbEntitat = { ...directe, id: 'f5', altres: [{ id: FORN, tipus: 'entitat' }] };
  const pepa = (id) => id === PEPA;

  test('amaga la vista prèvia d’un directe amb la persona i d’un grup sense subjecte ni entitat', () => {
    const [a, b] = anotaFilsBloquejats([directe, grup], pepa);
    expect(a).toMatchObject({ ultimText: '', ultimAmagat: true, searchText: 'pepa' });
    expect(b).toMatchObject({ ultimText: '', ultimAmagat: true, searchText: 'colla' });
  });

  test('no toca un fil amb subjecte, amb entitat o un directe amb una entitat, ni el meu últim missatge', () => {
    const fils = [deLaPagina, ambEntitat, directeAmbEntitat, { ...directe, ultimAutorId: 'jo' }];
    expect(anotaFilsBloquejats(fils, pepa)).toBe(fils);
    expect(anotaFilsBloquejats([directe], () => false)).toEqual([directe]);
  });

  test('senseDirectesBloquejats lleva els directes amb la persona; la MATEIXA referència si no en lleva cap', () => {
    const fils = [directe, grup, directeAmbEntitat];
    expect(senseDirectesBloquejats(fils, pepa)).toEqual([grup, directeAmbEntitat]);
    expect(senseDirectesBloquejats(fils, () => false)).toBe(fils);
  });

  /* Fase D (261020, revisió) · correcció F1: la fila no avisa d'allò que el total ja no suma. */
  test('un directe amb la persona bloquejada no compta cap no llegit, també si l’últim és meu; un grup conserva el seu', () => {
    const ambNous = { ...directe, noLlegits: 3, noLlegitManual: true, ultimAl: '2026-10-20T10:00:00Z' };
    const meuAmbNous = { ...directe, ultimAutorId: 'jo', ultimText: 'Hola', noLlegits: 2, ultimAl: '2026-10-20T09:00:00Z' };
    const grupAmbNous = { ...grup, noLlegits: 4, ultimAl: '2026-10-20T11:00:00Z' };
    const [a, b, c] = anotaFilsBloquejats([ambNous, meuAmbNous, grupAmbNous], pepa);
    expect(a).toMatchObject({ noLlegits: 0, noLlegitManual: true, ultimAmagat: true, ultimText: '' });
    expect(b).toMatchObject({ noLlegits: 0, ultimText: 'Hola', ultimAl: '2026-10-20T09:00:00Z' });
    expect(b.ultimAmagat).toBeUndefined();
    expect(c).toMatchObject({ noLlegits: 4, ultimAmagat: true, ultimAl: '2026-10-20T11:00:00Z' });
    /* Les dades crues no es toquen. */
    expect(ambNous.noLlegits).toBe(3);
    expect(meuAmbNous.noLlegits).toBe(2);
  });

  test('si l’últim és de la persona bloquejada, el directe no en diu l’hora ni puja al capdamunt (ultimAl: null)', () => {
    const [a] = anotaFilsBloquejats([{ ...directe, ultimAl: '2026-10-20T10:00:00Z' }], pepa);
    expect(a.ultimAl).toBeNull();
    const [desbloquejat] = anotaFilsBloquejats([{ ...directe, ultimAl: '2026-10-20T10:00:00Z' }], () => false);
    expect(desbloquejat.ultimAl).toBe('2026-10-20T10:00:00Z');
  });
});

describe('la capa optimista de la sessió', () => {
  const pep = Object.freeze({ tipus: 'persona', id: PEPA, nom: 'Pepa', creatAl: null });
  const k = clauDeBloqueig('persona', PEPA);
  const visibles = (servidor, canvi) => [...fusionaBloquejos(servidor, canvi).keys()];

  test('bloquejar, desbloquejar i tornar a bloquejar torna a amagar (crítica 261020, 2)', () => {
    let canvi = canviBuit('a');
    canvi = afigAlCanvi(canvi, pep);
    expect(visibles([], canvi)).toEqual([k]);
    canvi = llevaDelCanvi(canvi, k);
    expect(visibles([pep], canvi)).toEqual([]);
    canvi = afigAlCanvi(canvi, pep);
    expect(visibles([pep], canvi)).toEqual([k]);
    expect(canvi.llevats.has(k)).toBe(false);
  });

  test('revertix torna la clau exactament a com era a la foto', () => {
    const abans = llevaDelCanvi(canviBuit('a'), k);
    const foto = fotoDelCanvi(abans, k);
    const despres = afigAlCanvi(abans, pep);
    const tornat = revertix(despres, k, foto);
    expect(tornat.llevats.has(k)).toBe(true);
    expect(tornat.afegits.has(k)).toBe(false);
    const ambAfegit = afigAlCanvi(canviBuit('a'), pep);
    const fotoAfegit = fotoDelCanvi(ambAfegit, k);
    expect(revertix(llevaDelCanvi(ambAfegit, k), k, fotoAfegit).afegits.get(k)).toBe(pep);
  });

  test('cap funció muta el canvi que rep', () => {
    const canvi = canviBuit('a');
    afigAlCanvi(canvi, pep);
    llevaDelCanvi(canvi, k);
    expect(canvi.afegits.size + canvi.llevats.size).toBe(0);
  });

  test('fusionaBloquejos: afegits primer (l’últim, primer), després el servidor, sense llevats ni duplicats', () => {
    const forn = { tipus: 'entitat', id: FORN, nom: 'El Forn', creatAl: '2026-10-19T10:00:00Z' };
    const joan = { tipus: 'persona', id: 'joan', nom: 'Joan', creatAl: '2026-10-18T10:00:00Z' };
    let canvi = afigAlCanvi(canviBuit('a'), pep);
    canvi = afigAlCanvi(canvi, { tipus: 'persona', id: 'rosa', nom: 'Rosa', creatAl: null });
    canvi = llevaDelCanvi(canvi, clauDeBloqueig('persona', 'joan'));
    expect(visibles([forn, joan, pep, { tipus: 'grup', id: 'g' }], canvi))
      .toEqual(['persona:rosa', k, `entitat:${FORN}`]);
  });

  test('firmaDeClaus és la mateixa siga quin siga l’ordre', () => {
    expect(firmaDeClaus(['b', 'a', 'c'])).toBe(firmaDeClaus(new Set(['c', 'b', 'a'])));
    expect(firmaDeClaus([])).toBe('');
  });
});

test('omple posa cada {clau}, deixa les que no hi són i no interpreta «$&» ni «$\'»', () => {
  expect(omple('Bloqueja {nom}', { nom: 'Pepa' })).toBe('Bloqueja Pepa');
  expect(omple('{nom} i {altre}', { nom: '$& $\'' })).toBe('$& $\' i {altre}');
  expect(omple(null)).toBe('');
});
