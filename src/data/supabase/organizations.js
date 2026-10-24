import { getCurrentUser, getResolvedConfig, request } from './runtime.js';
import { normalitzaContacte, normalitzaCorreu, validaCorreu } from '../correuOrganitzacio.js';
import { LIMIT_DIRECTORI_ENTITATS, errorDeMembre, membreDOrganitzacio } from '../contracte.js';
import { esPobleImpossible, pobleDOrganitzacio, pobleDelFiltre } from '../pobleOrganitzacio.js';

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
  /* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Tota entitat creada ha
     de portar el seu poble») · Sense poble, cap crida al servidor. */
  const poble = pobleDOrganitzacio(organization?.town_name);
  const body = { p_tenant_id: tenantId,
    p_kind: organization?.kind, p_name: organization?.name, p_slug: organization?.slug,
    p_description: organization?.description || '', p_parent_organization_id: organization?.parentOrganizationId || null };
  /* create_organization ja accepta p_lema (M01); només s'envia si ve, i així
     una crida sense lema és idèntica a la d'abans. */
  if (organization?.lema !== undefined) body.p_lema = organization.lema;
  /* Revisió adversarial del Gauntlet 261016 (encàrrec C; troballa «Crear una
     organització amb un slug que ja administres sobreescriu en silenci el
     poble de l'existent») · create_organization és idempotent: si la persona
     ja administra una organització amb eixe slug en este poble, en torna la
     MATEIXA fila sense dir-ho (2609281500, `if found`), i el PATCH de davall
     li canviava el poble. La resposta no distingix una fila nova d'una que ja
     hi era (les mateixes columnes, cap town_name): es mira ABANS de crear. */
  const previa = await organitzacioDelSlug(body.p_slug, tenantId, config);
  let rows;
  try {
    rows = await request('/rest/v1/rpc/create_organization', config, { method: 'POST', body });
  } catch (error) {
    throw errorDeCreacio(error);
  }
  const creada = Array.isArray(rows) ? rows[0] : rows;
  /* Ací coneixem el tenant efectivament enviat després de resoldre àlies i
     configuració del host. PostgreSQL retorna els UUID en minúscules. */
  const uuidCanon = (valor) => typeof valor === 'string'
    && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(valor) ? valor.toLowerCase() : valor;
  if (creada && Object.hasOwn(creada, 'tenant_id') && uuidCanon(creada.tenant_id) !== uuidCanon(body.p_tenant_id)) {
    throw new Error('El servidor ha retornat una organització d’un altre poble.');
  }
  /* Sense id confirmat no hi ha fila on desar el poble: el domini ho diu
     («El servidor no ha confirmat l’organització»). */
  if (typeof creada?.id !== 'string' || !creada.id.trim()) return creada;
  /* Revisió adversarial del Gauntlet 261016 (encàrrec C) · Una fila que ja hi
     era abans d'esta alta, i que no és d'una alta d'esta pàgina que no va
     poder desar el poble, no es toca: amb el mateix poble és el reintent
     idempotent de sempre; amb un altre, o sense cap (una fila d'abans de
     l'obligació, potser d'un altre poble), l'error diu quina és. */
  if (previa && String(previa.id) === creada.id && !ALTES_SENSE_POBLE.has(creada.id)) {
    const seu = typeof previa.town_name === 'string' ? previa.town_name.trim() : '';
    if (seu && seu === poble) return { ...creada, town_name: seu };
    throw errorAmbCodi(jaExistix(String(body.p_slug ?? '').trim().toLowerCase(), seu), 'JA-EXISTIX');
  }
  /* Gauntlet 261016 (Bloc 3.5.2) · create_organization no té cap paràmetre
     per al poble (la signatura canònica que fixa 2610042350): el poble es desa
     tot seguit a la mateixa fila, amb el PATCH de sempre (updateOrganization;
     la columna i el grant de 2610081401, amb la política «gestores
     actualitzen l'organització», que només deixa escriure-la a qui
     l'administra, i qui la crea n'és la propietària). La resposta porta el
     poble desat.
     Revisió adversarial del Gauntlet 261016 (encàrrec C; troballa «un error
     que promet un reintent que mai no funciona») · Si el PATCH falla,
     l'organització ja existix sense poble i el missatge diu per què
     (motiuDelPobleNoDesat): només un tall promet el reintent. La fila queda
     anotada com a alta d'esta pàgina sense poble (ALTES_SENSE_POBLE): el
     reintent (la RPC torna la mateixa fila) hi torna a desar el poble, i
     ara de veres, perquè la lectura prèvia ja la troba. */
  let desada;
  try {
    desada = await updateOrganization(creada.id, { town_name: poble }, config);
  } catch (error) {
    ALTES_SENSE_POBLE.add(creada.id);
    if (esCancel(error)) throw error;
    throw errorAmbCodi(motiuDelPobleNoDesat(error), 'POBLE-NO-DESAT', error);
  }
  ALTES_SENSE_POBLE.delete(creada.id);
  return { ...creada, town_name: typeof desada?.town_name === 'string' ? desada.town_name : poble };
}

/* Revisió adversarial del Gauntlet 261016 (encàrrec C) · Les organitzacions
   que una alta d'esta pàgina ha creat sense poder-ne desar el poble (l'id de
   la fila). Només el reintent d'una d'estes altes pot desar el poble en una
   fila que ja existia. Dura el que dura la pàgina: després de recarregar,
   l'organització ix al perfil sense poble i se li posa des de la seua fitxa. */
const ALTES_SENSE_POBLE = new Set();

/* La fila que ja té este slug en este poble i que la persona pot llegir (la
   seua, si l'administra: «members read own organizations»), o null:
   { id, town_name }. El slug, com el normalitza la RPC (lower(btrim)). Si el
   servidor encara no té la columna town_name (2610081401), es torna a llegir
   sense ella i es recorda (la memòria de T47, columnesSelectAbsents). */
async function organitzacioDelSlug(slug, tenantId, config) {
  const net = String(slug ?? '').trim().toLowerCase();
  if (!net) return null;
  const filtre = `slug=eq.${encodeURIComponent(net)}${tenantId ? `&tenant_id=eq.${encodeURIComponent(tenantId)}` : ''}`;
  for (;;) {
    const columnes = ['id', 'town_name'].filter((columna) => !columnesSelectAbsents.has(columna)).join(',');
    try {
      const files = await request(`/rest/v1/organizations?select=${columnes}&${filtre}&limit=1`, config, { signal: config.signal });
      return Array.isArray(files) && files[0]?.id != null ? files[0] : null;
    } catch (error) {
      if (columnaAbsentDelSelect(error) !== 'town_name' || columnesSelectAbsents.has('town_name')) throw error;
      columnesSelectAbsents.add('town_name');
    }
  }
}
/* Només columnes amb grant de SELECT: el RETURNING de return=representation
   exigix SELECT sobre cada columna que torna, i una sola sense grant fa fallar
   tot el PATCH amb 42501.
   Ordre del Mestre (261008, grup C) · `town_name`, el poble de l'organització
   (2610081401). Mentre la migració no s'aplica, el reintent de T47 la lleva
   del select; desar-la torna l'error de columna absent (PGRST204). */
const COLUMNES_ORG = 'id,tenant_id,slug,name,kind,parent_organization_id,lema,description,visibility,logo_url,hero_url,presentacio_html,copyright,town_name,created_at,updated_at';

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

/* ═══════════════════════════════════════════════════════════════════
   Pla 261022_1955 (Cercador Universal, T1) · EL DIRECTORI PÚBLIC

   Capacitat OPCIONAL 'directoriEntitats' (contracte.js): les organitzacions
   públiques de tots els pobles del node, per a /cerca. En remot, la vista
   organization_directory (visibility = 'public', sense correu; grant de
   lectura a anon i authenticated): cap filtre de tenant, perquè una entitat
   d'un altre poble també es pot trobar i el poble actiu només la pondera. En
   seed i local, localPerfils. Les columnes van una per una, mai '*': si la
   vista d'un servidor encara no en té alguna (town_name abans de
   2610081401), es torna a llegir sense ella i es recorda, com
   organitzacioDelSlug. La memòria és d'esta vista, no de la taula.
   ═══════════════════════════════════════════════════════════════════ */
const COLUMNES_DIRECTORI = Object.freeze(['id', 'tenant_id', 'slug', 'name', 'kind', 'parent_organization_id', 'lema',
  'description', 'logo_url', 'hero_url', 'presentacio_html', 'copyright', 'town_name', 'created_at', 'updated_at']);
/* Sense estes no hi ha fila que es puga pintar ni enllaçar: mai es lleven del select. */
const COLUMNES_DIRECTORI_FIXES = new Set(['id', 'slug', 'name']);
const columnesDirectoriAbsents = new Set();
/* Les columnes on el servidor busca una paraula (ilike), totes de la primera vista pública. */
const CAMPS_DE_CERCA_DIRECTORI = Object.freeze(['name', 'slug', 'lema', 'description']);
const MAXIM_PARAULES_DIRECTORI = 5;
const MAXIM_PARAULA_DIRECTORI = 40;

/* P1-11 (C11-01 de Codex) · El directori d'este servidor no porta el poble de les organitzacions. */
const errorSensePobleAlDirectori = () => Object.assign(
  new Error('El directori d’este servidor encara no diu de quin poble és cada organització (cal la migració 2610081401).'),
  { code: 'NO-DISPONIBLE' },
);

/** El `limit` d'una crida, entre 1 i LIMIT_DIRECTORI_ENTITATS. */
const limitDelDirectori = (valor) => {
  const n = Math.trunc(Number(valor));
  return Number.isFinite(n) && n >= 1 ? Math.min(n, LIMIT_DIRECTORI_ENTITATS) : LIMIT_DIRECTORI_ENTITATS;
};

/* Les paraules de la consulta, amb només lletres, xifres, l'apòstrof i el
   guionet: cap coma, parèntesi, punt, cometa ni comodí no arriba a la sintaxi
   de PostgREST. Una paraula ha d'apareixer en algun camp (or); totes juntes,
   AND. Gauntlet (crític de dades) · Es tallen per punts de codi, mai per
   unitats UTF-16 (un parell suplent partit fa caure encodeURIComponent), i
   cada paraula hi va com un patró tolerant als accents (patroTolerant). */
function filtreDeCercaDirectori(consulta) {
  const netes = String(consulta ?? '').normalize('NFC').toLowerCase()
    .replace(/[^\p{L}\p{N}'\u2019-]+/gu, ' ').split(' ').filter(Boolean)
    .map((paraula) => patroTolerant(Array.from(paraula).slice(0, MAXIM_PARAULA_DIRECTORI).join('')));
  const paraules = [...new Set(netes)].filter(Boolean).slice(0, MAXIM_PARAULES_DIRECTORI);
  if (!paraules.length) return '';
  const perParaula = paraules.map((paraula) => `or(${CAMPS_DE_CERCA_DIRECTORI.map((camp) => `${camp}.ilike."*${paraula}*"`).join(',')})`);
  return `&and=${encodeURIComponent(`(${perParaula.join(',')})`)}`;
}

/* Gauntlet (crític de dades) · ilike no plega accents, i a partir del sostre
   (LIMIT_DIRECTORI_ENTITATS) una entitat només es troba pel servidor. Cada
   paraula hi va, doncs, com un patró que és un SUPERCONJUNT de les formes
   valencianes (qui busca torna a plegar, filtrar i ordenar al client):
     · sense diacrítics (NFD i fora les marques);
     · cada vocal, la «c» (ç) i l'apòstrof, el comodí d'un caràcter ('_'):
       «sèquia», «sequia» i «SEQUIA» són «s_q___»;
     · «ll» és «l*l», que també casa amb «l·l». */
function patroTolerant(paraula) {
  return paraula.normalize('NFD').replace(/\p{M}/gu, '').replace(/[aeiouc'\u2019]/g, '_').replace(/ll/g, 'l*l');
}

export async function listPublicOrganizations(filtre = {}, config = {}) {
  const consulta = typeof filtre?.consulta === 'string' ? filtre.consulta.trim() : '';
  const limit = limitDelDirectori(filtre?.limit);
  /* P1-11 (pla 261024_2230, T5B-01) · `poble`: només les organitzacions
     d'eixe poble, filtrades AL SERVIDOR abans del límit (town_name=eq.),
     mai al client després de tallar a LIMIT_DIRECTORI_ENTITATS (reserva de
     Codex 1945). Un nom que passa del CHECK de la columna no el pot portar
     cap fila: buit sense preguntar. */
  const poble = pobleDelFiltre(filtre?.poble);
  if (poble && esPobleImpossible(poble)) return [];
  if (esModeLocal(config)) return (await perfilsLocals()).listPublicOrganizations({ consulta, limit, ...(poble ? { poble } : {}) });
  if (!getResolvedConfig(config).hasSupabaseConfig) return [];
  /* Un servidor d'abans de 2610081401 no té town_name a la vista: no sap de
     quin poble és cap organització. Mai la llista de tots els pobles com si
     fora la del poble, ni un buit mut (C11-01 de Codex: «propagar un error
     explicable»): NO-DISPONIBLE, com un esquema absent. */
  if (poble && columnesDirectoriAbsents.has('town_name')) throw errorSensePobleAlDirectori();
  const signal = filtre?.signal ?? config.signal;
  const cerca = filtreDeCercaDirectori(consulta);
  const delPoble = poble ? `&town_name=eq.${encodeURIComponent(poble)}` : '';
  for (;;) {
    const columnes = COLUMNES_DIRECTORI.filter((columna) => !columnesDirectoriAbsents.has(columna)).join(',');
    try {
      const files = await request(`/rest/v1/organization_directory?select=${columnes}${cerca}${delPoble}&order=name.asc,id.asc&limit=${limit}`,
        config, { signal });
      return Array.isArray(files) ? files : [];
    } catch (error) {
      const columna = columnaAbsentDelSelect(error);
      if (poble && columna === 'town_name') {
        columnesDirectoriAbsents.add('town_name');
        throw errorSensePobleAlDirectori();
      }
      const nomesDelSelect = columna && COLUMNES_DIRECTORI.includes(columna) && !COLUMNES_DIRECTORI_FIXES.has(columna)
        && !CAMPS_DE_CERCA_DIRECTORI.includes(columna) && !columnesDirectoriAbsents.has(columna);
      if (!nomesDelSelect) throw error;
      columnesDirectoriAbsents.add(columna);
    }
  }
}

/* Per a les proves: la memòria de columnes és del mòdul i duraria d'una prova a l'altra. */
export function reiniciaMemoriaDirectori() {
  columnesDirectoriAbsents.clear();
}

export async function updateOrganization(id, updates, config = {}) {
  const payload = {};
  const camps = { name: 'name', slug: 'slug', description: 'description', kind: 'kind',
    parentOrganizationId: 'parent_organization_id', lema: 'lema', logo_url: 'logo_url',
    visibility: 'visibility', presentacio_html: 'presentacio_html', hero_url: 'hero_url', copyright: 'copyright',
    town_name: 'town_name' };
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
const CODIS_NORMALITZATS = /^(SDP-CLAIM-\d{3}|SDP-ORGMAIL-\d{3}|SDP-ORGMEM-\d{3}|JA-PENDENT|NO-DISPONIBLE|CORREU-INVALID|ESQUEMA-DESFASAT|POBLE-NO-DESAT|JA-EXISTIX)$/;

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

/* F1 (ordre del Mestre, 261004; pla 2045, Marató 2230) · create_organization
   contra una base desfasada. PGRST203 (HTTP 300): hi ha més d'una versió de la
   funció i PostgREST no en tria cap, perquè la crida sense p_lema casa amb més
   d'una. PGRST202 (o 404): la funció no hi és. El diàleg pintava el `message`
   en anglés de PostgREST; ara rep un codi neutral i una frase en valencià.
   La frase no diu quantes versions hi ha (el client no ho sap) ni l'id de la
   migració, que no li diu res a qui crea l'organització. La crida no canvia
   (p_lema només si ve, M01): la cura és al servidor, la migració
   2610042350_convergencia_perfil_i_create_organization.sql. */
const ESQUEMA_DESFASAT = 'El servidor d’este poble té més d’una versió de la funció que crea organitzacions i no en sap triar cap: l’organització no s’ha creat. Cal aplicar-hi una migració pendent.';
const SENSE_CREACIO = 'El servidor d’este poble encara no té la funció que crea organitzacions: l’organització no s’ha creat. Cal aplicar-hi les migracions pendents.';
/* Gauntlet 261016 (Bloc 3.5.2) · El poble no s'ha pogut desar després de
   crear la fila (createOrganization): la frase diu què ha passat i què fer.
   Revisió adversarial del Gauntlet 261016 (encàrrec C) · Abans, una sola
   frase per a tot, «Torna-ho a provar: es desarà en la mateixa
   organització», també quan el servidor no té la columna (PGRST204/42703) o
   no deixa escriure-la (42501): el reintent tornava a fallar igual. Ara la
   frase depén del motiu, i només un tall (sense resposta, 5xx, 408 o 429)
   promet el reintent, que la memòria d'altes fa funcionar de veres. */
const POBLE_NO_DESAT_TALL = 'L’organització s’ha creat, però el poble no s’ha pogut desar perquè el servidor no ha respost. Torna a prémer «Crear»: es desarà en la mateixa organització, sense crear-ne cap altra.';
const POBLE_SENSE_COLUMNA = 'L’organització s’ha creat sense poble: el servidor d’este poble encara no té on desar-lo (li falta una migració pendent). Fins que no s’aplique, el poble no es podrà desar.';
const POBLE_REBUTJAT = 'L’organització s’ha creat sense poble: el servidor d’este poble no ha acceptat desar-lo. Cal revisar-ne els permisos abans de posar-li el poble.';

function motiuDelPobleNoDesat(error) {
  if (/\bPGRST204\b|\b42703\b/.test(String(error?.message || ''))) return POBLE_SENSE_COLUMNA;
  const status = Number(error?.status);
  const tall = error instanceof TypeError || status === 0 || status === 408 || status === 429 || status >= 500;
  return tall ? POBLE_NO_DESAT_TALL : POBLE_REBUTJAT;
}

/* Revisió adversarial del Gauntlet 261016 (encàrrec C) · L'alta ha tornat
   una organització que la persona ja administrava (createOrganization): no
   se n'ha creat cap ni se n'ha tocat el poble. */
const jaExistix = (slug, poble) => (poble
  ? `Ja administres una organització amb l’identificador «${slug}», i és de ${poble}: no se n’ha creat cap de nova ni se n’ha canviat el poble. Tria un altre identificador, o canvia-li el poble des de la seua fitxa.`
  : `Ja administres una organització amb l’identificador «${slug}»: no se n’ha creat cap de nova ni se n’ha tocat res, tampoc el poble. Tria un altre identificador, o posa-li el poble des de la seua fitxa.`);

function errorDeCreacio(error) {
  if (jaNormalitzat(error) || esCancel(error)) return error;
  if (/\bPGRST203\b/.test(String(error?.message || '')) || Number(error?.status) === 300) {
    return errorAmbCodi(ESQUEMA_DESFASAT, 'ESQUEMA-DESFASAT', error);
  }
  if (esquemaAbsent(error)) return errorAmbCodi(SENSE_CREACIO, 'NO-DISPONIBLE', error);
  return error;
}

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

/* ═══════════════════════════════════════════════════════════════════
   Ordre del Mestre (261008, grup C) · ELS MEMBRES D'UNA ORGANITZACIÓ

   Capacitat OPCIONAL 'membresOrganitzacio' (contracte.js), mai del nucli:
     · llistaMembresOrganitzacio(orgId, config) → Membre[]
     · desaMembreOrganitzacio(orgId, { tipus, id, rol }, config) → Membre
     · llevaMembreOrganitzacio(orgId, { tipus, id }, config) → { llevat }
   Membre: { tipus: 'persona' | 'organitzacio', id, nom, avatar,
   rol: 'owner' | 'admin' | 'member', desDe }. En remot, les RPC de
   2610081402 (membres_organitzacio, desa_membre_organitzacio i
   lleva_membre_organitzacio); en seed i local, localPerfils amb les MATEIXES
   regles. Decisions del Mestre: alta directa, la persona pot eixir-se'n, una
   organització membre no hereta cap permís i només l'afig qui administra
   totes dues, només la propietària gestiona les administradores, i la llista
   només la veuen owner i admin.
   Els errors porten `code` (SDP-ORGMEM-000..008 de
   MISSATGES_MEMBRES_ORGANITZACIO, contracte.js, o NO-DISPONIBLE) i un
   missatge en valencià; es llig del prefix SDP del missatge, mai de l'estat
   HTTP. L'entrada la normalitza membreDOrganitzacio (contracte.js), la
   mateixa regla que localPerfils, i els identificadors es validen ABANS de
   la xarxa: un id que no és cap UUID no arriba mai a Postgres (22P02).
   ═══════════════════════════════════════════════════════════════════ */
const RE_CODI_ORGMEM = /SDP-ORGMEM-\d{3}/;
const SENSE_MEMBRES = 'El servidor d’este poble encara no gestiona els membres de les organitzacions.';
const TIPUS_MEMBRE = new Set(['persona', 'organitzacio']);
const ROLS_MEMBRE = new Set(['owner', 'admin', 'member']);

function errorDeMembres(error) {
  if (jaNormalitzat(error) || esCancel(error)) return error;
  const codi = RE_CODI_ORGMEM.exec(String(error?.message || ''))?.[0];
  if (codi) return errorDeMembre(codi, error);
  if (esquemaAbsent(error)) return errorAmbCodi(SENSE_MEMBRES, 'NO-DISPONIBLE', error);
  return error;
}

/* La fila de les RPC: { tipus, membre_id, nom, avatar_url, role, created_at }.
   Un rol desconegut es mostra com a 'member', el que menys permet. */
function membreDeFila(fila) {
  if (!fila || typeof fila !== 'object' || !TIPUS_MEMBRE.has(fila.tipus)) return null;
  const id = String(fila.membre_id ?? '').trim();
  if (!id) return null;
  return {
    tipus: fila.tipus,
    id,
    nom: typeof fila.nom === 'string' ? fila.nom : '',
    avatar: typeof fila.avatar_url === 'string' ? fila.avatar_url : '',
    rol: ROLS_MEMBRE.has(fila.role) ? fila.role : 'member',
    desDe: typeof fila.created_at === 'string' && fila.created_at ? fila.created_at : null
  };
}

/* Sessió, mode i servidor, en el mateix ordre a les tres crides. */
function contextDeMembres(config) {
  const usuari = getCurrentUser();
  if (!usuari?.id) throw errorDeMembre('SDP-ORGMEM-000');
  return { usuari, local: esModeLocal(config) };
}
function idsRemots(orgId, membre, config) {
  if (!getResolvedConfig(config).hasSupabaseConfig) throw errorAmbCodi(SENSE_MEMBRES, 'NO-DISPONIBLE');
  /* Una organització que no és cap UUID no la pot administrar ningú: com el servidor, 002. */
  const id = idOrganitzacio(orgId);
  if (!id) throw errorDeMembre('SDP-ORGMEM-002');
  if (!membre) return { id };
  const membreId = idOrganitzacio(membre.id);
  if (!membreId) throw errorDeMembre(membre.tipus === 'persona' ? 'SDP-ORGMEM-003' : 'SDP-ORGMEM-007');
  return { id, membreId };
}

export async function llistaMembresOrganitzacio(orgId, config = {}) {
  const { usuari, local } = contextDeMembres(config);
  if (local) return (await perfilsLocals()).llistaMembresOrganitzacio(orgId, usuari);
  const { id } = idsRemots(orgId, null, config);
  let files;
  try {
    files = await request('/rest/v1/rpc/membres_organitzacio', config, {
      method: 'POST', body: { p_organization_id: id }, signal: config.signal
    });
  } catch (error) {
    throw errorDeMembres(error);
  }
  return (Array.isArray(files) ? files : []).map(membreDeFila).filter(Boolean);
}

export async function desaMembreOrganitzacio(orgId, dades = {}, config = {}) {
  const { usuari, local } = contextDeMembres(config);
  const membre = membreDOrganitzacio(dades);
  if (local) return (await perfilsLocals()).desaMembreOrganitzacio(orgId, membre, usuari);
  const { id, membreId } = idsRemots(orgId, membre, config);
  let resposta;
  try {
    resposta = await request('/rest/v1/rpc/desa_membre_organitzacio', config, {
      method: 'POST', signal: config.signal,
      body: { p_organization_id: id, p_membre_id: membreId, p_tipus: membre.tipus, p_role: membre.rol }
    });
  } catch (error) {
    throw errorDeMembres(error);
  }
  const desat = membreDeFila(Array.isArray(resposta) ? resposta[0] : resposta);
  /* Sense la fila no s'anuncia cap èxit: la interfície torna a llegir la llista. */
  if (!desat || desat.id !== membreId || desat.tipus !== membre.tipus) {
    throw new Error('El servidor no ha confirmat el membre. Torna a carregar la llista.');
  }
  return desat;
}

export async function llevaMembreOrganitzacio(orgId, dades = {}, config = {}) {
  const { usuari, local } = contextDeMembres(config);
  const membre = membreDOrganitzacio(dades, { ambRol: false });
  if (local) return (await perfilsLocals()).llevaMembreOrganitzacio(orgId, membre, usuari);
  const { id, membreId } = idsRemots(orgId, membre, config);
  let resposta;
  try {
    resposta = await request('/rest/v1/rpc/lleva_membre_organitzacio', config, {
      method: 'POST', signal: config.signal,
      body: { p_organization_id: id, p_membre_id: membreId, p_tipus: membre.tipus }
    });
  } catch (error) {
    throw errorDeMembres(error);
  }
  /* La RPC torna un booleà: true si hi era, false si ja no hi era (idempotent). */
  return { llevat: (Array.isArray(resposta) ? resposta[0] : resposta) === true };
}
