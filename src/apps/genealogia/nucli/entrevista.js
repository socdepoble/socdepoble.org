/**
 * entrevista.js — Arbre Genealògic · l'entrevista guiada d'una sola pregunta
 * per torn (IDEA-100, kit R111).
 *
 * L'estat és un objecte pla i immutable: respon, salta i enrere en tornen un
 * de nou. aplicaEntrevista convertix les respostes en persones (estat
 * 'aproximat': memòria oral) i en vincles 'progenitor' de memòria oral (la
 * resposta 'font' no els confirma: cal apuntar la font escrita). És idempotent: cada persona porta l'`origen` del seu pas
 * ('entrevista:g3-pare', 'entrevista:g4-germa:0'…), i tornar-la a aplicar
 * actualitza en lloc de duplicar. Mai deduïx cap vincle per cognom.
 */
import { llegeixData } from './dates.js';
import { creaPersona, creaRelacio, netejaPersona } from './model.js';
import { MAX_REPETICIONS, PASSOS_ENTREVISTA, netejaRespostaPersona, pasPerId } from './passosEntrevista.js';
import { estatDeVincle } from './parentiu.js';
import { text } from './segur.js';

export { PASSOS_ENTREVISTA, PASSOS_G2, OPCIONS_FONT, MAX_REPETICIONS, pasPerId, netejaRespostaPersona } from './passosEntrevista.js';

/** L'entrevista d'un arbre, al primer pas. */
export function estatInicialEntrevista(arbreId, { ara = null } = {}) {
  return { arbreId, pas: 0, respostes: {}, completada: false, modificada: ara };
}

/** El pas que toca (una sola pregunta), o null si s'ha acabat. */
export function pasActual(estat) {
  if (!estat || estat.completada) return null;
  return PASSOS_ENTREVISTA[estat.pas] ?? null;
}

function avanca(estat, respostes, ara) {
  const pas = Math.min(estat.pas + 1, PASSOS_ENTREVISTA.length);
  return { ...estat, respostes, pas, completada: pas >= PASSOS_ENTREVISTA.length, modificada: ara ?? estat.modificada };
}

const esBuit = (valor) => valor === null || valor === undefined || (typeof valor === 'string' && valor.trim() === '');

/**
 * Respon el pas actual. No muta: torna { ok, errors: [{ camp, clau }], estat }.
 *   · text: un text (en un pas opcional, el buit passa al següent);
 *   · opcio: un dels valors del pas;
 *   · persona: RespostaPersona; la data es valida amb llegeixData. En un pas
 *     repetible la resposta s'afig a la llista i el pas no canvia (per a
 *     afegir-ne una altra); un valor buit hi passa al següent.
 */
export function respon(estat, valor, { anyActual, ara = null } = {}) {
  const pas = pasActual(estat);
  const ko = (camp, clau) => ({ ok: false, errors: [{ camp, clau }], estat });
  if (!pas) return ko('pas', 'acabada');
  if (esBuit(valor)) {
    if (!pas.opcional) return ko('valor', 'obligatori');
    return { ok: true, errors: [], estat: avanca(estat, estat.respostes, ara) };
  }
  if (pas.tipus === 'text') {
    let net;
    try {
      net = text(valor, 120);
    } catch {
      return ko('valor', 'invalid');
    }
    return { ok: true, errors: [], estat: avanca(estat, { ...estat.respostes, [pas.id]: net }, ara) };
  }
  if (pas.tipus === 'opcio') {
    if (!pas.opcions.includes(valor)) return ko('valor', 'opcio');
    return { ok: true, errors: [], estat: avanca(estat, { ...estat.respostes, [pas.id]: valor }, ara) };
  }
  let resposta;
  try {
    resposta = netejaRespostaPersona(valor, pas);
  } catch (error) {
    return ko(error.camp || 'valor', error.clau || 'invalid');
  }
  const data = llegeixData(resposta.naixement, { anyActual });
  if (!data.ok) return ko('naixement', data.error);
  if (resposta.fillDe && !estat.respostes[resposta.fillDe]) return ko('fillDe', 'sense-progenitor');
  if (!pas.repetible) {
    return { ok: true, errors: [], estat: avanca(estat, { ...estat.respostes, [pas.id]: resposta }, ara) };
  }
  const llista = estat.respostes[pas.id] || [];
  if (llista.length >= MAX_REPETICIONS) return ko('valor', 'maxim');
  return {
    ok: true,
    errors: [],
    estat: { ...estat, respostes: { ...estat.respostes, [pas.id]: [...llista, resposta] }, modificada: ara ?? estat.modificada }
  };
}

/** Passa al pas següent sense respondre; només en un pas opcional. */
export function salta(estat, { ara = null } = {}) {
  const pas = pasActual(estat);
  if (!pas || !pas.opcional) return estat;
  return avanca(estat, estat.respostes, ara);
}

/** Torna al pas anterior (les respostes es conserven). */
export function enrere(estat, { ara = null } = {}) {
  if (!estat || estat.pas <= 0) return estat;
  return { ...estat, pas: estat.pas - 1, completada: false, modificada: ara ?? estat.modificada };
}

/** Lleva una resposta d'un pas repetible (un germà o un besavi afegit per error). */
export function treuResposta(estat, pasId, index, { ara = null } = {}) {
  const llista = estat?.respostes?.[pasId];
  if (!pasPerId(pasId)?.repetible || !Array.isArray(llista) || !Number.isSafeInteger(index) || index < 0 || index >= llista.length) return estat;
  return { ...estat, respostes: { ...estat.respostes, [pasId]: llista.filter((_, i) => i !== index) }, modificada: ara ?? estat.modificada };
}

/** { fet, total, generacio } per a la barra de progrés. */
export function progresEntrevista(estat) {
  const total = PASSOS_ENTREVISTA.length;
  const fet = Math.min(estat?.pas ?? 0, total);
  return { fet, total, generacio: pasActual(estat)?.generacio ?? 'FI' };
}

/* Les persones que crea cada pas, amb el seu origen. */
function personesDeLesRespostes(respostes) {
  const llista = [];
  for (const pas of PASSOS_ENTREVISTA) {
    if (pas.tipus !== 'persona' || !respostes[pas.id]) continue;
    if (pas.repetible) {
      respostes[pas.id].forEach((resposta, i) => llista.push({ pas, resposta, origen: `entrevista:${pas.id}:${i}` }));
    } else llista.push({ pas, resposta: respostes[pas.id], origen: `entrevista:${pas.id}` });
  }
  return llista;
}

const SIMETRIQUES = new Set(['parella', 'germa']);
const mateixaRelacio = (r, tipus, de, a) => r.tipus === tipus && ((r.de === de && r.a === a) || (SIMETRIQUES.has(tipus) && r.de === a && r.a === de));

/**
 * Aplica les respostes a l'arbre: crea o actualitza les persones i els
 * vincles. Torna un ArbreComplet nou (amb l'entrevista dins).
 *   · g4-jo és l'arrel (Sosa 1) i, per defecte, viva;
 *   · cada persona és 'aproximat' (memòria oral) en crear-se; si ja existia,
 *     només s'actualitzen els camps de l'entrevista (l'estat, les fonts i les
 *     notes que la persona haja posat després es conserven);
 *   · la resposta viva ('si', 'no' o 'desconegut') es conserva; g4-jo és
 *     'si' llevat que es diga 'no';
 *   · vincles 'progenitor' amb evidència { memoriaOral, vincleExplicit,
 *     fontEscrita: false } i 'parella' entre els dos progenitors;
 *   · germans sense cap progenitor conegut → relació 'germa' amb g4-jo;
 *   · una resposta llevada no esborra la persona que ja s'havia creat.
 */
export function aplicaEntrevista(estat, complet, { nouId, ara, anyActual, nomesPasId = null } = {}) {
  if (typeof nouId !== 'function') throw new TypeError('aplicaEntrevista necessita nouId().');
  const arbreId = complet.arbre.id;
  const respostes = estat.respostes || {};
  const persones = [...complet.persones];
  const relacions = [...complet.relacions];
  const perOrigen = new Map(persones.map((p, i) => [p.origen, i]).filter(([origen]) => typeof origen === 'string' && origen.startsWith('entrevista:')));
  const idDePas = new Map();
  const idsDePasRepetible = new Map();
  const registra = (pas, personaId, resposta) => {
    if (!pas.repetible) {
      idDePas.set(pas.id, personaId);
      return;
    }
    if (!idsDePasRepetible.has(pas.id)) idsDePasRepetible.set(pas.id, []);
    idsDePasRepetible.get(pas.id).push({ id: personaId, resposta });
  };

  for (const { pas, resposta, origen } of personesDeLesRespostes(respostes)) {
    const posicio = perOrigen.get(origen);
    /* Amb nomesPasId, les persones ja creades d'altres passos no es reescriuen
       (així no es perden els canvis fets després a l'editor). */
    if (posicio !== undefined && nomesPasId && nomesPasId !== pas.id) {
      registra(pas, persones[posicio].id, resposta);
      continue;
    }
    const naixement = llegeixData(resposta.naixement, { anyActual });
    const camps = {
      nom: resposta.nom,
      cognom1: resposta.cognom1,
      cognom2: resposta.cognom2,
      lloc: resposta.lloc,
      ofici: resposta.ofici,
      generacio: pas.generacio
    };
    if (naixement.ok) camps.naixement = naixement.data;
    /* La resposta «viu» o «ha mort» es conserva sempre: sense ella, una
       persona viva nascuda fa 100 anys o més eixiria a les exportacions. */
    const vivaResposta = resposta.viva ?? (resposta.difunta ? 'no' : 'desconegut');
    if (vivaResposta === 'si' || vivaResposta === 'no') camps.viva = vivaResposta;
    else if (pas.id === 'g4-jo') camps.viva = 'si';
    const sexe = resposta.sexe && resposta.sexe !== 'U' ? resposta.sexe : pas.sexe;
    let persona;
    if (posicio === undefined) {
      persona = creaPersona({
        id: nouId(), arbreId, ara, ...camps, sexe,
        casa: pas.id === 'g4-jo' ? text(respostes.casa, 80) : '',
        estat: 'aproximat', origen
      }, { anyActual });
      persones.push(persona);
      perOrigen.set(origen, persones.length - 1);
    } else {
      const abans = persones[posicio];
      const viva = camps.viva ?? (abans.viva === 'no' ? 'desconegut' : abans.viva);
      persona = netejaPersona({ ...abans, ...camps, viva, sexe: abans.sexe !== 'U' && sexe === 'U' ? abans.sexe : sexe, modificada: ara ?? abans.modificada }, { anyActual });
      persones[posicio] = persona;
    }
    registra(pas, persona.id, resposta);
  }

  /* Els vincles de l'entrevista són sempre memòria oral ([APROXIMAT]). La
     resposta 'font' === 'document' NO els escala a [CONFIRMAT]: no hi ha cap
     Font desada ni cap fontId, i els prompts definixen [CONFIRMAT] com a font
     documental verificable. La font escrita s'apunta a l'editor, vincle a
     vincle; si ja hi era, es conserva (l'evidència només creix). */
  const evidencia = { memoriaOral: true, vincleExplicit: true, fontEscrita: false };
  const vincle = (tipus, de, a) => {
    if (!de || !a || de === a) return;
    const posicio = relacions.findIndex((r) => mateixaRelacio(r, tipus, de, a));
    if (posicio === -1) {
      relacions.push(creaRelacio({ id: nouId(), arbreId, tipus, de, a, evidencia, ara }));
      return;
    }
    /* Ja hi era: l'evidència només creix (una font escrita no es perd). */
    const abans = relacions[posicio];
    const nova = { fontEscrita: abans.evidencia.fontEscrita || evidencia.fontEscrita, memoriaOral: true, vincleExplicit: true };
    const igual = nova.fontEscrita === abans.evidencia.fontEscrita && abans.evidencia.memoriaOral && abans.evidencia.vincleExplicit;
    if (igual) return;
    relacions[posicio] = { ...abans, evidencia: nova, estat: abans.estat === 'contradiccio' ? abans.estat : estatDeVincle(nova), modificada: ara ?? abans.modificada };
  };

  const jo = idDePas.get('g4-jo');
  const germans = (idsDePasRepetible.get('g4-germa') || []).map((g) => g.id);
  for (const pas of PASSOS_ENTREVISTA) {
    if (!pas.progenitorDe || !idDePas.has(pas.id)) continue;
    vincle('progenitor', idDePas.get(pas.id), idDePas.get(pas.progenitorDe));
    if (pas.progenitorDe === 'g4-jo') for (const germa of germans) vincle('progenitor', idDePas.get(pas.id), germa);
  }
  if (!idDePas.has('g3-pare') && !idDePas.has('g3-mare')) for (const germa of germans) vincle('germa', jo, germa);
  vincle('parella', idDePas.get('g3-pare'), idDePas.get('g3-mare'));
  vincle('parella', idDePas.get('g2-pare-pare'), idDePas.get('g2-mare-pare'));
  vincle('parella', idDePas.get('g2-pare-mare'), idDePas.get('g2-mare-mare'));
  for (const { id: besavi, resposta } of idsDePasRepetible.get('g1-besavi') || []) vincle('progenitor', besavi, idDePas.get(resposta.fillDe));

  const arbre = { ...complet.arbre, modificat: ara ?? complet.arbre.modificat };
  if (jo) arbre.arrelId = jo;
  if (typeof respostes.casa === 'string' && respostes.casa !== '') arbre.malnomCasa = text(respostes.casa, 80);
  if (typeof respostes.lloc === 'string' && respostes.lloc !== '') arbre.poble = text(respostes.lloc, 120);
  return { arbre, persones, relacions, entrevista: estat };
}
