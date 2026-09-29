import { getCurrentUser, getResolvedConfig, request } from './runtime.js';
import { normalitzaContacte, normalitzaCorreu, validaCorreu } from '../correuOrganitzacio.js';

/* Lògica d'Usuari · en seed i local les organitzacions on la persona mana són
   les del padró pilot (localPerfils). Comprovació explícita: sense mode, remot. */
const MODES_LOCALS = new Set(['seed', 'local']);
const esModeLocal = (config) => MODES_LOCALS.has(getResolvedConfig(config).runtimeDataMode);
async function perfilsLocals() {
  const { localPerfils } = await import('../localPerfils.js');
  return localPerfils;
}

export async function listMyOrganizations(config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  const usuari = getCurrentUser();
  if (!usuari?.id) return [];
  if (esModeLocal(config)) return (await perfilsLocals()).listMyOrganizations(usuari);
  if (!hasSupabaseConfig) return [];
  const rows = await request('/rest/v1/rpc/list_my_organizations', config, { method: 'POST', body: { p_tenant_id: tenantId } });
  return Array.isArray(rows) ? rows : [];
}
export async function createOrganization(organization, config = {}) {
  if (esModeLocal(config)) throw new Error('Inicia sessió des del formulari d’entrada abans de crear una organització al servidor.');
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot crear una organització sense connexió al servidor.');
  if (!getCurrentUser()?.id) throw new Error('Cal iniciar sessió per crear una organització.');
  const body = { p_tenant_id: tenantId,
    p_kind: organization?.kind, p_name: organization?.name, p_slug: organization?.slug,
    p_description: organization?.description || '', p_parent_organization_id: organization?.parentOrganizationId || null };
  /* create_organization ja accepta p_lema (M01); només s'envia si ve, i així
     una crida sense lema és idèntica a la d'abans. */
  if (organization?.lema !== undefined) body.p_lema = organization.lema;
  const rows = await request('/rest/v1/rpc/create_organization', config, { method: 'POST', body });
  const creada = Array.isArray(rows) ? rows[0] : rows;
  /* Ací coneixem el tenant efectivament enviat després de resoldre àlies i
     configuració del host. PostgreSQL retorna els UUID en minúscules. */
  const uuidCanon = (valor) => typeof valor === 'string'
    && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(valor) ? valor.toLowerCase() : valor;
  if (creada && Object.hasOwn(creada, 'tenant_id') && uuidCanon(creada.tenant_id) !== uuidCanon(body.p_tenant_id)) {
    throw new Error('El servidor ha retornat una organització d’un altre poble.');
  }
  return creada;
}
/* Només columnes amb grant de SELECT: el RETURNING de return=representation
   exigix SELECT sobre cada columna que torna, i una sola sense grant fa fallar
   tot el PATCH amb 42501. */
const COLUMNES_ORG = 'id,tenant_id,slug,name,kind,parent_organization_id,lema,description,visibility,logo_url,hero_url,presentacio_html,copyright,created_at,updated_at';

/* T47 (ordre del Mestre, 260928) · Una columna del RETURNING que el servidor
   encara no té (p. ex. `copyright` mentre 2609262232 no s'aplica) feia fallar
   TOT el PATCH amb 42703: cap camp de la fitxa d'una organització es desava.
   Ara es torna a provar sense eixa columna i es recorda en este mòdul.
   Només es lleva del select, mai del cos: una columna que s'està escrivint i
   no existix continua sent un error (la cua posa eixe camp en quarantena). */
const columnesSelectAbsents = new Set();
function columnaAbsentDelSelect(error) {
  const text = String(error?.message || '');
  if (!/\b42703\b|does not exist/i.test(text)) return null;
  const trobada = /column\s+(?:"?[\w]+"?\.)?"?([\w]+)"?\s+does not exist/i.exec(text);
  return trobada ? trobada[1] : null;
}
const selectOrg = () => COLUMNES_ORG.split(',').filter((columna) => !columnesSelectAbsents.has(columna)).join(',');

export async function updateOrganization(id, updates, config = {}) {
  const payload = {};
  const camps = { name: 'name', slug: 'slug', description: 'description', kind: 'kind',
    parentOrganizationId: 'parent_organization_id', lema: 'lema', logo_url: 'logo_url',
    visibility: 'visibility', presentacio_html: 'presentacio_html', hero_url: 'hero_url', copyright: 'copyright' };
  for (const [origen, desti] of Object.entries(camps)) if (updates?.[origen] !== undefined) payload[desti] = updates[origen];
  if (!Object.keys(payload).length) throw new Error('Cap camp de l’organització per desar.');
  if (esModeLocal(config)) return (await perfilsLocals()).updateOrganization(id, payload);
  /* Com updateProfile: una imatge incrustada no es desa mai a la fila (hero_url
     la rebutjaria el CHECK amb 23514; logo_url no en té cap i s'inflaria). */
  if (getResolvedConfig(config).runtimeDataMode !== 'seed'
    && [payload.logo_url, payload.hero_url].some((url) => typeof url === 'string' && url.startsWith('data:'))) {
    throw new Error('Les imatges no es desen incrustades. Puja-les amb uploadToStorage.');
  }
  const opcions = { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: payload };
  const columnesOrg = COLUMNES_ORG.split(',');
  let rows;
  for (;;) {
    try {
      rows = await request(`/rest/v1/organizations?id=eq.${encodeURIComponent(id)}&select=${selectOrg()}`, config, opcions);
      break;
    } catch (error) {
      const columna = columnaAbsentDelSelect(error);
      const nomesDelSelect = columna && columnesOrg.includes(columna) && !Object.hasOwn(payload, columna)
        && !columnesSelectAbsents.has(columna);
      if (!nomesDelSelect) throw error;
      columnesSelectAbsents.add(columna);
    }
  }
  if (!rows?.[0]) throw new Error("No s'ha pogut actualitzar l'organització.");
  return rows[0];
}

/* ═══════════════════════════════════════════════════════════════════
   T43 (ordre del Mestre, 260928) · ADMINISTRAR ORGANITZACIONS I CORREU

   Dues capacitats OPCIONALS (contracte.js), mai del nucli:
     · 'reclamacions': reclamaOrganitzacio(orgId, { justificacio }, config)
       i lesMevesReclamacions(config). En remot, l'RPC existent
       sollicita_reclamacio (entitats sense propietària; la revisa l'equip
       de Sóc de Poble) i la lectura de les PRÒPIES peticions.
     · 'contacteOrganitzacio': llegeixContacteOrganitzacio(orgId, config) i
       desaContacteOrganitzacio(orgId, { correu, public }, config). Les RPC
       encara no existixen al servidor: un 404 es tradueix a NO-DISPONIBLE i
       la interfície ho diu (l'SQL proposat va a l'informe del torn).
   Els errors es normalitzen ací (Model B): porten `code` i un missatge en
   valencià. El codi es llig del prefix SDP-… del missatge, mai només de
   l'estat HTTP: SDP-CLAIM-003 («ja té propietària») i el duplicat d'una
   petició pendent (idx_claims_una_pendent) tornen tots dos 23505/409.
   ═══════════════════════════════════════════════════════════════════ */
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIMIT_JUSTIFICACIO = 1000;
const RE_CODI_CLAIM = /SDP-CLAIM-\d{3}/;
const RE_CODI_ORGMAIL = /SDP-ORGMAIL-\d{3}/;
const CODIS_NORMALITZATS = /^(SDP-CLAIM-\d{3}|SDP-ORGMAIL-\d{3}|JA-PENDENT|NO-DISPONIBLE|CORREU-INVALID)$/;

const MISSATGES_CLAIM = Object.freeze({
  'SDP-CLAIM-000': 'Cal iniciar sessió per a administrar una organització.',
  'SDP-CLAIM-001': 'Esta organització no existix en este poble.',
  'SDP-CLAIM-002': 'Només la gent d’este poble pot demanar administrar les seues organitzacions.',
  'SDP-CLAIM-003': 'Esta organització ja té qui l’administra.'
});
const MISSATGES_ORGMAIL = Object.freeze({
  'SDP-ORGMAIL-000': 'Cal iniciar sessió.',
  'SDP-ORGMAIL-001': 'Només qui administra l’organització pot vore o canviar el seu correu.',
  'SDP-ORGMAIL-002': 'Esta organització no existix en este poble.'
});
const SENSE_RECLAMACIONS = 'El servidor d’este poble encara no permet demanar administrar organitzacions.';
const SENSE_CONTACTE = 'El servidor d’este poble encara no desa el correu de les organitzacions.';

const errorAmbCodi = (missatge, code, cause) => Object.assign(new Error(missatge), { code, ...(cause ? { cause } : {}) });
const jaNormalitzat = (error) => typeof error?.code === 'string' && CODIS_NORMALITZATS.test(error.code);
const esCancel = (error) => error?.name === 'AbortError' || error?.name === 'TimeoutError';
/* 404 d'rpc() o de la taula, o PGRST202/205: l'esquema no hi és. */
const esquemaAbsent = (error) => Number(error?.status) === 404 || /PGRST20[25]/.test(String(error?.message || ''));
const idOrganitzacio = (orgId) => {
  const id = String(orgId ?? '').trim();
  return RE_UUID.test(id) ? id.toLowerCase() : null;
};

function errorDeReclamacio(error) {
  if (jaNormalitzat(error) || esCancel(error)) return error;
  const text = String(error?.message || '');
  const codi = RE_CODI_CLAIM.exec(text)?.[0];
  if (codi) return errorAmbCodi(MISSATGES_CLAIM[codi] || 'La petició no s’ha pogut registrar.', codi, error);
  /* Sense prefix SDP, un 409 només pot ser el duplicat de l'índex únic. */
  if (/idx_claims_una_pendent/.test(text) || Number(error?.status) === 409) {
    return errorAmbCodi('Ja tens una petició pendent per a esta organització.', 'JA-PENDENT', error);
  }
  if (esquemaAbsent(error)) return errorAmbCodi(SENSE_RECLAMACIONS, 'NO-DISPONIBLE', error);
  return error;
}

function errorDeContacte(error) {
  if (jaNormalitzat(error) || esCancel(error)) return error;
  const text = String(error?.message || '');
  const codi = RE_CODI_ORGMAIL.exec(text)?.[0];
  if (codi) return errorAmbCodi(MISSATGES_ORGMAIL[codi] || 'No s’ha pogut desar el correu.', codi, error);
  if (/\b23514\b/.test(text)) return errorAmbCodi('Escriu un correu vàlid, com ara forn@exemple.cat.', 'CORREU-INVALID', error);
  if (esquemaAbsent(error)) return errorAmbCodi(SENSE_CONTACTE, 'NO-DISPONIBLE', error);
  return error;
}

export async function reclamaOrganitzacio(orgId, { justificacio = '' } = {}, config = {}) {
  const usuari = getCurrentUser();
  if (!usuari?.id) throw errorAmbCodi(MISSATGES_CLAIM['SDP-CLAIM-000'], 'SDP-CLAIM-000');
  const text = String(justificacio ?? '').trim().slice(0, LIMIT_JUSTIFICACIO);
  if (esModeLocal(config)) return (await perfilsLocals()).reclamaOrganitzacio(orgId, usuari, { justificacio: text });
  if (!getResolvedConfig(config).hasSupabaseConfig) throw errorAmbCodi(SENSE_RECLAMACIONS, 'NO-DISPONIBLE');
  const id = idOrganitzacio(orgId);
  if (!id) throw errorAmbCodi(MISSATGES_CLAIM['SDP-CLAIM-001'], 'SDP-CLAIM-001');
  let resposta;
  try {
    resposta = await request('/rest/v1/rpc/sollicita_reclamacio', config, {
      method: 'POST', body: { p_organization_id: id, p_justificacio: text }
    });
  } catch (error) {
    throw errorDeReclamacio(error);
  }
  const fila = Array.isArray(resposta) ? resposta[0] : resposta;
  return {
    id: fila?.id ?? null,
    organitzacioId: String(fila?.organization_id ?? id),
    estat: 'pendent',
    role: null,
    data: fila?.created_at ?? null
  };
}

export async function lesMevesReclamacions(config = {}) {
  const usuari = getCurrentUser();
  if (!usuari?.id) return [];
  if (esModeLocal(config)) return (await perfilsLocals()).lesMevesReclamacions(usuari);
  if (!getResolvedConfig(config).hasSupabaseConfig) return [];
  /* El filtre per persona és OBLIGATORI: la política deixa llegir-les totes a
     un superadmin, i ací només es demanen les pròpies. */
  const filtre = `user_id=eq.${encodeURIComponent(String(usuari.id))}`;
  let files;
  try {
    files = await request(`/rest/v1/organization_claims?select=id,organization_id,estat,created_at,resolta_at&${filtre}&order=created_at.desc`, config);
  } catch (error) {
    throw errorDeReclamacio(error);
  }
  return (Array.isArray(files) ? files : []).map((fila) => ({
    id: fila.id ?? null,
    organitzacioId: String(fila.organization_id ?? ''),
    estat: ['pendent', 'aprovada', 'rebutjada'].includes(fila.estat) ? fila.estat : 'pendent',
    data: fila.created_at ?? null,
    resoltaAt: fila.resolta_at ?? null
  }));
}

/* La fila de les RPC de contacte (SQL proposat al torn T43):
   { correu, es_public, origen_per_defecte, correu_per_defecte }. */
const contacteDeFila = (resposta) => {
  const fila = Array.isArray(resposta) ? resposta[0] : resposta;
  return normalitzaContacte({
    correu: fila?.correu ?? '',
    public: fila?.es_public,
    perDefecte: { origen: fila?.origen_per_defecte, correu: fila?.correu_per_defecte }
  });
};

/* T48 · Memòria de les RPC de contacte en esta càrrega de pàgina, per RPC,
   origen i poble. Una RPC que ha tornat NO-DISPONIBLE ja no es torna a cridar.
   Només compta l'esquema absent, mai un SDP-ORGMAIL (permís o organització) ni
   la xarxa.
   Mentre no se sap si la RPC hi és, la primera crida fa de «sonda» i les
   concurrents esperen el seu resultat abans de decidir: PerfilContext en llança
   una per organització alhora, i StrictMode repetix l'efecte en
   desenvolupament. Sense la sonda, totes consultaven la memòria abans que
   tornara el primer 404 i n'eixien 2×N. Quan la RPC ja ha contestat (fila o
   error propi), les crides no s'esperen entre elles. */
const rpcsAbsents = new Set();
const rpcsPresents = new Set();
const sondesEnCurs = new Map();
const haContestat = (error) => /^(SDP-ORGMAIL-\d{3}|CORREU-INVALID)$/.test(String(error?.code || ''));

/* Per a les proves: la memòria és del mòdul i duraria d'una prova a l'altra. */
export function reiniciaMemoriaContacte() {
  rpcsAbsents.clear();
  rpcsPresents.clear();
  sondesEnCurs.clear();
}

async function rpcDeContacte(rpc, body, config) {
  const { supabaseUrl, tenantId } = getResolvedConfig(config);
  const clau = JSON.stringify([rpc, supabaseUrl || '', tenantId || '']);
  const sonda = sondesEnCurs.get(clau);
  if (sonda) await sonda.catch(() => {});
  if (rpcsAbsents.has(clau)) throw errorAmbCodi(SENSE_CONTACTE, 'NO-DISPONIBLE');
  /* Entre la consulta i el registre no hi ha cap await: dues crides no poden
     fer de sonda alhora. Qui ha esperat una sonda no en fa una altra. */
  const crida = request(`/rest/v1/rpc/${rpc}`, config, { method: 'POST', body });
  const esSonda = !sonda && !rpcsPresents.has(clau);
  if (esSonda) sondesEnCurs.set(clau, crida);
  try {
    const resposta = await crida;
    rpcsPresents.add(clau);
    return contacteDeFila(resposta);
  } catch (error) {
    const normalitzat = errorDeContacte(error);
    if (normalitzat?.code === 'NO-DISPONIBLE') rpcsAbsents.add(clau);
    else if (haContestat(normalitzat)) rpcsPresents.add(clau);
    throw normalitzat;
  } finally {
    if (esSonda && sondesEnCurs.get(clau) === crida) sondesEnCurs.delete(clau);
  }
}

export async function llegeixContacteOrganitzacio(orgId, config = {}) {
  const usuari = getCurrentUser();
  if (!usuari?.id) throw errorAmbCodi(MISSATGES_ORGMAIL['SDP-ORGMAIL-000'], 'SDP-ORGMAIL-000');
  if (esModeLocal(config)) return (await perfilsLocals()).llegeixContacteOrganitzacio(orgId, usuari);
  if (!getResolvedConfig(config).hasSupabaseConfig) throw errorAmbCodi(SENSE_CONTACTE, 'NO-DISPONIBLE');
  const id = idOrganitzacio(orgId);
  if (!id) throw errorAmbCodi(MISSATGES_ORGMAIL['SDP-ORGMAIL-002'], 'SDP-ORGMAIL-002');
  return rpcDeContacte('contacte_organitzacio', { p_organization_id: id }, config);
}

export async function desaContacteOrganitzacio(orgId, { correu = '', public: esPublic = false } = {}, config = {}) {
  const usuari = getCurrentUser();
  if (!usuari?.id) throw errorAmbCodi(MISSATGES_ORGMAIL['SDP-ORGMAIL-000'], 'SDP-ORGMAIL-000');
  const net = normalitzaCorreu(correu);
  if (net && !validaCorreu(net)) throw errorAmbCodi('Escriu un correu vàlid, com ara forn@exemple.cat.', 'CORREU-INVALID');
  if (esModeLocal(config)) {
    return (await perfilsLocals()).desaContacteOrganitzacio(orgId, { correu: net, public: esPublic }, usuari);
  }
  if (!getResolvedConfig(config).hasSupabaseConfig) throw errorAmbCodi(SENSE_CONTACTE, 'NO-DISPONIBLE');
  const id = idOrganitzacio(orgId);
  if (!id) throw errorAmbCodi(MISSATGES_ORGMAIL['SDP-ORGMAIL-002'], 'SDP-ORGMAIL-002');
  return rpcDeContacte('desa_contacte_organitzacio',
    { p_organization_id: id, p_correu: net || null, p_public: Boolean(esPublic) && Boolean(net) }, config);
}
