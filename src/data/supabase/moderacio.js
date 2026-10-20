/* Fase D (261020, tasca 2; pla 261020_1300 · App Store 1.2 i Google Play
   UGC) · La moderació del contingut dels veïns: capacitats 'moderacio' i
   'normesConvivencia' (contracte.js). Taules, disparadors i RPC de
   supabase/migrations/2610201500_moderacio_denuncies_i_bloquejos.sql.
   · Denúncies: l'RPC denuncia_contingut (SECURITY INVOKER), que torna JSON.
     Un POST a la taula amb `Prefer: return=minimal` respon un 201 buit i
     runtime.request() el llegiria com a JSON i petaria; anon, a més, no hi
     té SELECT. També sense sessió.
   · Bloquejos: PostgREST sobre public.bloquejos (GET, POST amb
     `return=representation`, DELETE), com permeten els quatre permisos del
     mandat. El disparador força bloquejador, id i creat_al.
   · Normes: les RPC accepta_normes_convivencia(p_versio) i
     estat_normes_convivencia(p_versio), sobre private.normes_acceptades.
   · Errors: tot el que ix d'ací porta un `code` de CODI_MODERACIO. Sense la
     migració aplicada, rpc() i PostgREST tornen 404 i ací és 'no-disponible'
     (la interfície ho diu i guarda els bloquejos només en la sessió). Un 409
     només és «ja hi era» amb el 23505 al cos: el 23503 (la persona o
     l'entitat no existixen) és 'objectiu-invalid', mai un èxit fals.
   · Seed i local: un magatzem en memòria del mòdul per persona, com
     personalitzacio.js. Es perd en recarregar, a posta.
   La comprovació de mode és explícita (no `!== 'remote'`), com content.js i
   personalitzacio.js: una configuració sense mode és remota. El `signal` de
   la configuració arriba sempre a fetch (rpc() el pren de les opcions, el 4t
   argument). */
import { getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { getDefaultUserId } from '../identitat.js';
import {
  CODI_MODERACIO, VERSIO_NORMES_CONVIVENCIA, autorDelContracte, denunciaDelContracte, errorDeModeracio
} from '../contracte.js';

const MODES_LOCALS = new Set(['seed', 'local']);
const esModeLocal = (resolt) => MODES_LOCALS.has(resolt.runtimeDataMode);
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECCIO = 'bloquejat_tipus,bloquejat_persona,bloquejat_entitat,nom,creat_al';
const CODIS = new Set(Object.values(CODI_MODERACIO));

/* ── El magatzem en memòria (seed i local) ──
   denuncies: [{ qui, tipus, id, motiu }]; bloquejos: qui → Map(clau → Bloqueig);
   normes: qui → { versio, acceptadaAl }. */
const magatzem = { denuncies: [], bloquejos: new Map(), normes: new Map() };

/** Buida el magatzem en memòria (proves). */
export function reiniciaModeracioLocal() {
  magatzem.denuncies = [];
  magatzem.bloquejos.clear();
  magatzem.normes.clear();
}

/* Qui denuncia o bloqueja en seed i local: la sessió o el convidat. */
const propietariLocal = () => getCurrentUser()?.id || getDefaultUserId();
const clau = ({ tipus, id }) => `${tipus}:${id}`;
const signalDe = (config) => config?.signal;

/* Una fila de public.bloquejos en la forma del contracte, o null. */
const bloqueigDeFila = (fila) => {
  const tipus = fila?.bloquejat_tipus === 'entitat' ? 'entitat' : 'persona';
  const id = String((tipus === 'entitat' ? fila?.bloquejat_entitat : fila?.bloquejat_persona) ?? '');
  return id
    ? Object.freeze({ tipus, id, nom: typeof fila?.nom === 'string' && fila.nom ? fila.nom : null, creatAl: fila?.creat_al ?? null })
    : null;
};

/* El cos JSON de «Supabase NNN: {…}» (runtime.request), o null: PostgREST hi
   posa { code, message, details, hint }. Còpia de personalitzacio.js, que no
   l'exporta. */
function cosDePostgrest(error) {
  try {
    const cos = JSON.parse(String(error?.message ?? '').replace(/^Supabase\s+\d+:\s*/, ''));
    return cos && typeof cos === 'object' ? cos : null;
  } catch { return null; }
}

/**
 * L'error traduït a CODI_MODERACIO, o l'original si no es tradueix
 * (AbortError, o un que ja porta un code de la moderació). Un 403 (RLS amb
 * sessió) no és «cal entrar»: només el 401 i SDP-MOD-000 ho són.
 */
function traduix(error) {
  if (!error || typeof error !== 'object' || error.name === 'AbortError') return error;
  if (CODIS.has(error.code)) return error;
  const cos = cosDePostgrest(error);
  const missatge = String(cos?.message ?? error.message ?? '');
  const codiPg = String(cos?.code ?? '');
  let code = CODI_MODERACIO.DESCONEGUT;
  if (/SDP-MOD-429/.test(missatge) || error.status === 429) code = CODI_MODERACIO.LIMIT;
  else if (/SDP-MOD-000/.test(missatge) || error.status === 401) code = CODI_MODERACIO.SENSE_SESSIO;
  else if (/SDP-MOD-001/.test(missatge) || ['23514', '22P02', '23503'].includes(codiPg)) code = CODI_MODERACIO.OBJECTIU_INVALID;
  else if (/SDP-MOD-002/.test(missatge)) code = CODI_MODERACIO.MOTIU_INVALID;
  else if (/SDP-MOD-003/.test(missatge)) code = CODI_MODERACIO.DETALL_MASSA_LLARG;
  else if (/SDP-MOD-004/.test(missatge)) code = CODI_MODERACIO.AUTOBLOQUEIG;
  else if (/SDP-MOD-005/.test(missatge)) code = CODI_MODERACIO.VERSIO_INVALIDA;
  else if (error.status === 404 || /PGRST20[25]/.test(missatge)) code = CODI_MODERACIO.NO_DISPONIBLE;
  const traduit = errorDeModeracio(code, error);
  if (error.status !== undefined) traduit.status = error.status;
  /* CODI_BACKEND_INABASTABLE (sense xarxa) es conserva: la vista el llig. */
  if (error.codi) traduit.codi = error.codi;
  return traduit;
}

/**
 * Denuncia un contingut, un missatge, una persona o una entitat. Valida abans
 * de cap xarxa (denunciaDelContracte). Torna { rebuda: true, repetida }:
 * `repetida` diu que la mateixa persona ja l'havia denunciat i està pendent.
 * També sense sessió (anon).
 */
export async function denunciaContingut(dades = {}, config = {}) {
  const denuncia = denunciaDelContracte(dades);
  const resolt = getResolvedConfig(config);
  if (esModeLocal(resolt)) {
    const qui = propietariLocal();
    const { tipus, id } = denuncia.objecte;
    const repetida = magatzem.denuncies.some((d) => d.qui === qui && d.tipus === tipus && d.id === id);
    if (!repetida) magatzem.denuncies.push({ qui, tipus, id, motiu: denuncia.motiu });
    return { rebuda: true, repetida };
  }
  const cos = {
    p_objecte_tipus: denuncia.objecte.tipus,
    p_objecte_id: denuncia.objecte.id,
    p_motiu: denuncia.motiu,
    p_detall: denuncia.detall,
    p_autor_tipus: denuncia.autor?.tipus ?? null,
    p_autor_id: denuncia.autor?.id ?? null,
    p_fil_id: denuncia.filId && RE_UUID.test(denuncia.filId) ? denuncia.filId : null,
    p_tenant_id: resolt.tenantId && RE_UUID.test(resolt.tenantId) ? resolt.tenantId : null
  };
  const resposta = await rpc('denuncia_contingut', cos, config, { signal: signalDe(config) })
    .catch((error) => { throw traduix(error); });
  return { rebuda: true, repetida: resposta?.repetida === true };
}

/** Els bloquejos de qui crida, del més nou al més vell. Sense sessió en remot, [] i cap petició. */
export async function llistaBloquejos(config = {}) {
  const resolt = getResolvedConfig(config);
  if (esModeLocal(resolt)) return [...(magatzem.bloquejos.get(propietariLocal())?.values() ?? [])].reverse();
  const uid = getCurrentUser()?.id;
  if (!uid) return [];
  const files = await request(
    `/rest/v1/bloquejos?select=${SELECCIO}&bloquejador=eq.${encodeURIComponent(uid)}&order=creat_al.desc&limit=1000`,
    config, { signal: signalDe(config) }
  ).catch((error) => { throw traduix(error); });
  return (Array.isArray(files) ? files : []).map(bloqueigDeFila).filter(Boolean);
}

/**
 * Bloqueja una persona o una entitat ({ tipus, id, nom? }). Idempotent: si
 * ja hi era, torna el bloqueig (creatAl null si el servidor no l'ha tornat).
 * En remot, l'id ha de ser un UUID i ningú no es bloqueja a si mateix.
 */
export async function bloquejaAutor(dades = {}, config = {}) {
  const autor = autorDelContracte(dades);
  const resolt = getResolvedConfig(config);
  if (esModeLocal(resolt)) {
    const qui = propietariLocal();
    if (autor.tipus === 'persona' && autor.id === qui) throw errorDeModeracio(CODI_MODERACIO.AUTOBLOQUEIG);
    const meus = magatzem.bloquejos.get(qui) ?? new Map();
    const ja = meus.get(clau(autor));
    if (ja) return ja;
    const bloqueig = Object.freeze({ ...autor, creatAl: new Date().toISOString() });
    meus.set(clau(autor), bloqueig);
    magatzem.bloquejos.set(qui, meus);
    return bloqueig;
  }
  const uid = getCurrentUser()?.id;
  if (!uid) throw errorDeModeracio(CODI_MODERACIO.SENSE_SESSIO);
  if (!RE_UUID.test(autor.id)) throw errorDeModeracio(CODI_MODERACIO.OBJECTIU_INVALID);
  if (autor.tipus === 'persona' && autor.id === uid) throw errorDeModeracio(CODI_MODERACIO.AUTOBLOQUEIG);
  const fila = {
    bloquejat_tipus: autor.tipus,
    nom: autor.nom,
    [autor.tipus === 'persona' ? 'bloquejat_persona' : 'bloquejat_entitat']: autor.id
  };
  try {
    /* 201 amb el cos JSON: authenticated té SELECT sobre els seus. */
    const files = await request(`/rest/v1/bloquejos?select=${SELECCIO}`, config,
      { method: 'POST', headers: { Prefer: 'return=representation' }, body: fila, signal: signalDe(config) });
    return bloqueigDeFila(Array.isArray(files) ? files[0] : files) ?? Object.freeze({ ...autor, creatAl: null });
  } catch (error) {
    /* Només el 23505 (la fila única ja hi és) és «ja bloquejat». */
    if (error?.status === 409 && cosDePostgrest(error)?.code === '23505') return Object.freeze({ ...autor, creatAl: null });
    throw traduix(error);
  }
}

/** Desbloqueja ({ tipus, id }). Torna { desbloquejat }: false si no hi era. */
export async function desbloquejaAutor(dades = {}, config = {}) {
  const autor = autorDelContracte(dades, { ambNom: false });
  const resolt = getResolvedConfig(config);
  if (esModeLocal(resolt)) return { desbloquejat: Boolean(magatzem.bloquejos.get(propietariLocal())?.delete(clau(autor))) };
  const uid = getCurrentUser()?.id;
  if (!uid) throw errorDeModeracio(CODI_MODERACIO.SENSE_SESSIO);
  if (!RE_UUID.test(autor.id)) throw errorDeModeracio(CODI_MODERACIO.OBJECTIU_INVALID);
  const columna = autor.tipus === 'persona' ? 'bloquejat_persona' : 'bloquejat_entitat';
  const files = await request(
    `/rest/v1/bloquejos?bloquejador=eq.${encodeURIComponent(uid)}&${columna}=eq.${encodeURIComponent(autor.id)}&select=bloquejat_tipus`,
    config, { method: 'DELETE', headers: { Prefer: 'return=representation' }, signal: signalDe(config) }
  ).catch((error) => { throw traduix(error); });
  return { desbloquejat: Array.isArray(files) && files.length > 0 };
}

/**
 * Si qui crida ha acceptat la versió vigent de les normes:
 * { versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: ISO | null }. Sense
 * sessió en remot, acceptadaAl null i cap petició.
 */
export async function estatNormes(config = {}) {
  const resolt = getResolvedConfig(config);
  const buit = { versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: null };
  if (esModeLocal(resolt)) return { ...(magatzem.normes.get(propietariLocal()) ?? buit) };
  if (!getCurrentUser()?.id) return buit;
  const estat = await rpc('estat_normes_convivencia', { p_versio: VERSIO_NORMES_CONVIVENCIA }, config, { signal: signalDe(config) })
    .catch((error) => { throw traduix(error); });
  return { versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: estat?.acceptada_al ?? null };
}

/** Accepta la versió vigent de les normes. Una altra versió, 'versio-invalida'; sense sessió en remot, 'sense-sessio'. */
export async function acceptaNormes(versio, config = {}) {
  if (versio !== VERSIO_NORMES_CONVIVENCIA) throw errorDeModeracio(CODI_MODERACIO.VERSIO_INVALIDA);
  const resolt = getResolvedConfig(config);
  if (esModeLocal(resolt)) {
    const estat = { versio, acceptadaAl: new Date().toISOString() };
    magatzem.normes.set(propietariLocal(), estat);
    return { ...estat };
  }
  if (!getCurrentUser()?.id) throw errorDeModeracio(CODI_MODERACIO.SENSE_SESSIO);
  const estat = await rpc('accepta_normes_convivencia', { p_versio: versio }, config, { signal: signalDe(config) })
    .catch((error) => { throw traduix(error); });
  return { versio, acceptadaAl: estat?.acceptada_al ?? null };
}
