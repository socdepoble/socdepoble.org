/** R32.25 · Fulla pura del contracte; reexportada pel camí públic de sempre. */
/* ── Ordre del Mestre (261008, grup C) · Els membres d'una organització ──
   Una sola taula de codis i una sola regla d'entrada per a tots els
   adaptadors de 'membresOrganitzacio' (Supabase, la llavor i qualsevol node
   federat), com TIPUS_SUBJECTE_XAT: la interfície decidix pel `code`, mai
   pel text. Els codis són els de les RPC de
   supabase/migrations/2610081402_membres_organitzacio.sql, i
   tests/migracio-membres-organitzacio.test.mjs els contrasta. */
export const MISSATGES_MEMBRES_ORGANITZACIO = Object.freeze({
  'SDP-ORGMEM-000': 'Cal iniciar sessió.',
  'SDP-ORGMEM-001': 'El tipus de membre o el rol no és vàlid.',
  'SDP-ORGMEM-002': 'Només qui administra l’organització en veu i en gestiona els membres.',
  'SDP-ORGMEM-003': 'Esta persona no és del municipi de l’organització o ha demanat la baixa.',
  'SDP-ORGMEM-004': 'No pots canviar el teu propi rol.',
  'SDP-ORGMEM-005': 'La propietària no es canvia ni es lleva.',
  'SDP-ORGMEM-006': 'Només la propietària nomena, degrada o lleva administradores.',
  'SDP-ORGMEM-007': 'Una organització no pot ser membre d’ella mateixa ni d’una d’un altre poble.',
  'SDP-ORGMEM-008': 'Per a afegir una organització com a membre, cal que també l’administres.'
});

/** Un Error amb el `code` i el missatge de MISSATGES_MEMBRES_ORGANITZACIO. Pura. */
export function errorDeMembre(codi, cause) {
  return Object.assign(new Error(MISSATGES_MEMBRES_ORGANITZACIO[codi] || 'No s’han pogut desar els membres.'),
    { code: codi, ...(cause ? { cause } : {}) });
}

/**
 * El membre que es vol desar ({ tipus, id, rol }) o llevar ({ tipus, id },
 * amb `ambRol: false`), normalitzat; si no és vàlid, llança SDP-ORGMEM-001.
 * El rol per defecte és 'member'; una persona pot ser 'member' o 'admin' (mai
 * 'owner': la propietària no es nomena ací) i una organització, només 'member'.
 * No valida la forma de l'id: cada adaptador sap quins ids són seus. Pura.
 */
export function membreDOrganitzacio(dades, { ambRol = true } = {}) {
  const tipus = String(dades?.tipus ?? '').trim();
  const id = String(dades?.id ?? '').trim();
  const rol = String(dades?.rol ?? '').trim() || 'member';
  const rolValid = !ambRol || (tipus === 'persona' ? rol === 'member' || rol === 'admin' : rol === 'member');
  if ((tipus !== 'persona' && tipus !== 'organitzacio') || !id || !rolValid) throw errorDeMembre('SDP-ORGMEM-001');
  return ambRol ? { tipus, id, rol } : { tipus, id };
}

/* IDEA-24 (marató 261101_2143, B4) · Els tipus d'organització que canvien de
   propietària per transferència (capacitat 'transferenciaPropietat'), els
   mateixos que la RPC transfereix_propietat_organitzacio (2610311500, R3
   SQL-01). Una sola font per als adaptadors i per a la interfície. */
export const TIPUS_TRANSFERIBLES = Object.freeze(['group', 'company']);

/**
 * La destinatària d'una transferència de propietat ({ tipus: 'persona', id }),
 * normalitzada amb la regla de membreDOrganitzacio; si no és una persona amb
 * id, llança SDP-ORGMEM-001. No valida la forma de l'id. Pura.
 */
export function destinatariaDeTransferencia(dades) {
  const membre = membreDOrganitzacio(dades, { ambRol: false });
  if (membre.tipus !== 'persona') throw errorDeMembre('SDP-ORGMEM-001');
  return membre;
}

/* IDEA-22, punt 2 (pla 261025_0200) · Els codis de la tria de la titular
   (capacitat 'consentimentTitular'), els mateixos que
   supabase/migrations/2610250300_titular_public.sql, que contrasta
   src/data/supabase/titularPublic.migracio.test.js. La lectura
   (loadTitularPublic) no en té cap: torna null sense dir per què. */
export const MISSATGES_TITULAR = Object.freeze({
  'SDP-TIT-000': 'Cal entrar al compte per a triar si et mostrem com a titular.',
  'SDP-TIT-001': 'Només la propietària de l’organització pot triar si es mostra com a titular.',
  'SDP-TIT-002': 'La tria no és vàlida.',
  'NO-DISPONIBLE': 'El servidor encara no sap mostrar la titular. Cal aplicar la migració pendent.',
  DESCONEGUT: 'No s’ha pogut completar. Torna-ho a provar.'
});

/** Un Error amb el `code` de MISSATGES_TITULAR (un codi desconegut és DESCONEGUT) i, si n'hi ha, la causa. Pura. */
export function errorDeTitular(codi, cause) {
  const code = Object.hasOwn(MISSATGES_TITULAR, codi) ? codi : 'DESCONEGUT';
  return Object.assign(new Error(MISSATGES_TITULAR[code], cause ? { cause } : undefined), { code });
}

/**
 * La titular de loadTitularPublic amb la forma del contracte, i res més (cap
 * correu ni cap rol encara que l'adaptador en porte): { tipus: 'persona', id,
 * nom, avatar } o null. Pura.
 */
export function titularDelContracte(valor) {
  if (!valor || typeof valor !== 'object' || valor.tipus !== 'persona') return null;
  const id = typeof valor.id === 'string' || typeof valor.id === 'number' ? String(valor.id).trim() : '';
  const nom = typeof valor.nom === 'string' ? valor.nom.trim() : '';
  if (!id || !nom) return null;
  return { tipus: 'persona', id, nom, avatar: typeof valor.avatar === 'string' ? valor.avatar : '' };
}

