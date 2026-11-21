/** R32.25 · Fulla pura del contracte; reexportada pel camí públic de sempre. */
/* ── T6b (IDEA-14; decisió del Mestre, 261024) · Els seguiments ──────────
   Una sola llista blanca, una sola taula de codis i una sola regla d'entrada
   per a tots els adaptadors de 'seguiments' (Supabase, la llavor i qualsevol
   node federat), com MISSATGES_MEMBRES_ORGANITZACIO: la interfície decidix
   pel `code`, mai pel text. Són el CHECK i els codis de
   supabase/migrations/2610241430_seguiments.sql, i
   src/data/supabase/seguiments.migracio.test.js els contrasta. SDP-SEG-007
   és d'IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025):
   2610250100_seguiments_des_d_entitat.sql, que contrasta
   src/data/supabase/seguimentsEntitat.migracio.test.js. */
export const TIPUS_SEGUIT = Object.freeze(['persona', 'entitat']);
export const MISSATGES_SEGUIMENTS = Object.freeze({
  'SDP-SEG-000': 'Cal entrar al compte per a seguir algú.',
  'SDP-SEG-001': 'La persona o l’entitat no són vàlides.',
  'SDP-SEG-002': 'No trobem esta persona o esta entitat, o no la pots seguir.',
  'SDP-SEG-003': 'No et pots seguir a tu mateix ni seguir una entitat que administres.',
  'SDP-SEG-004': 'L’has bloquejada: desbloqueja-la abans de seguir-la.',
  'SDP-SEG-005': 'Només qui administra l’entitat veu qui la seguix.',
  'SDP-SEG-006': 'Massa seguiments en poc de temps. Torna-ho a provar d’ací a una estona.',
  'SDP-SEG-007': 'No administres l’entitat amb què vols connectar.',
  'NO-DISPONIBLE': 'El servidor encara no té els seguiments. Cal aplicar la migració pendent.',
  DESCONEGUT: 'No s’ha pogut completar. Torna-ho a provar.'
});
const RE_ID_SEGUIT = /^[A-Za-z0-9._:~-]{1,200}$/;

/** Un Error amb el `code` de MISSATGES_SEGUIMENTS (un codi desconegut és DESCONEGUT) i, si n'hi ha, la causa. Pura. */
export function errorDeSeguiment(codi, cause) {
  const code = Object.hasOwn(MISSATGES_SEGUIMENTS, codi) ? codi : 'DESCONEGUT';
  return Object.assign(new Error(MISSATGES_SEGUIMENTS[code], cause ? { cause } : undefined), { code });
}

/**
 * El seguit ({ tipus, id }) normalitzat; si el tipus no és de TIPUS_SEGUIT o
 * l'id no és cap identificador, llança SDP-SEG-001. No valida si l'id és un
 * UUID: cada adaptador sap quins ids són seus. Pura.
 */
export function seguitDelContracte(dades) {
  const tipus = String(dades?.tipus ?? '').trim();
  const id = String(dades?.id ?? '').trim();
  if (!TIPUS_SEGUIT.includes(tipus) || !RE_ID_SEGUIT.test(id)) throw errorDeSeguiment('SDP-SEG-001');
  return { tipus, id };
}

/**
 * IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · L'entitat amb
 * què es connecta (`com` de { tipus, id, com }), normalitzada: null si no n'hi
 * ha (absent, null o ''), i si no és cap identificador, SDP-SEG-001, com l'id.
 * Si l'administres ho diu cada adaptador (SDP-SEG-007). Pura.
 */
export function comDelContracte(dades) {
  const com = dades?.com;
  if (com === undefined || com === null) return null;
  const id = String(com).trim();
  if (!id) return null;
  if (!RE_ID_SEGUIT.test(id)) throw errorDeSeguiment('SDP-SEG-001');
  return id;
}

/* FEDI23 · Entrades primitives compartides; cap conversió d'objectes ni getter. */
export const MISSATGES_CONNEXIONS = Object.freeze({
  'SDP-CONN-000': 'Cal iniciar sessió.',
  'SDP-CONN-001': 'Les dades de connexió no són vàlides.',
  'SDP-CONN-002': 'No pots gestionar les connexions d’este perfil.',
  'SDP-CONN-003': 'Este perfil no està disponible.',
  'NO-DISPONIBLE': 'El servidor encara no té esta capacitat.',
  DESCONEGUT: 'No s’ha pogut completar la connexió.'
});
export function errorDeConnexions(code, cause) {
  const clau = Object.hasOwn(MISSATGES_CONNEXIONS, code) ? code : 'DESCONEGUT';
  return Object.assign(new Error(MISSATGES_CONNEXIONS[clau]), { code: clau, ...(cause ? { cause } : {}) });
}
function campsConnexions(dades, admesos) {
  if (!dades || typeof dades !== 'object' || Array.isArray(dades)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(dades))) throw errorDeConnexions('SDP-CONN-001');
  const resultat = {};
  for (const clau of Reflect.ownKeys(dades)) {
    const descriptor = Object.getOwnPropertyDescriptor(dades, clau);
    if (typeof clau !== 'string' || !admesos.includes(clau) || !descriptor || !Object.hasOwn(descriptor, 'value') || !descriptor.enumerable) throw errorDeConnexions('SDP-CONN-001');
    resultat[clau] = descriptor.value;
  }
  return resultat;
}
function idConnexions(valor) {
  if (typeof valor !== 'string' || !RE_ID_SEGUIT.test(valor.trim())) throw errorDeConnexions('SDP-CONN-001');
  return valor.trim();
}
export function subjecteConnexionsDelContracte(dades, { ambPoble = true } = {}) {
  const { tipus, id } = campsConnexions(dades, ['tipus', 'id']);
  if (!['persona', 'entitat', ...(ambPoble ? ['poble'] : [])].includes(tipus)) throw errorDeConnexions('SDP-CONN-001');
  return { tipus, id: idConnexions(id) };
}
export function visibilitatConnexionsDelContracte(dades) {
  const entrada = campsConnexions(dades, ['tipus', 'id', 'visibilitatConnexions', 'connexio']);
  const subjecte = subjecteConnexionsDelContracte({ tipus: entrada.tipus, id: entrada.id });
  if (!['publica', 'privada'].includes(entrada.visibilitatConnexions)) throw errorDeConnexions('SDP-CONN-001');
  return { ...subjecte, visibilitatConnexions: entrada.visibilitatConnexions,
    ...(entrada.connexio !== undefined ? { connexio: subjecteConnexionsDelContracte(entrada.connexio) } : {}) };
}
export function inclusioPersonaDelContracte(dades) {
  const { orgId, personaId, rol } = campsConnexions(dades, ['orgId', 'personaId', 'rol']);
  if (!['administrador', 'treballador', 'usuari'].includes(rol)) throw errorDeConnexions('SDP-CONN-001');
  return { orgId: idConnexions(orgId), personaId: idConnexions(personaId), rol };
}
export function sollicitudEntitatDelContracte(dades) {
  const { orgId, rol } = campsConnexions(dades, ['orgId', 'rol']);
  if (!['administrador', 'treballador', 'usuari'].includes(rol)) throw errorDeConnexions('SDP-CONN-001');
  return { orgId: idConnexions(orgId), rol };
}
