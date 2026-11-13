import { capturaSessio } from '../identitat.js';
import { sanejaDrets } from '../dretsAutor.js';
import { getDefaultUserId, NOTE_FOLDERS_SEED } from '../appSeed.js';
import { normalitzaOrigen } from '../origenNota.js';
import { ErrorSupabase, generateUUID, getCurrentUser, getResolvedConfig, request } from './runtime.js';
import { emojiSol } from '../../utils/emoji.js';
import { dataIsoONull } from '../../utils/calendari.js';
import { ambDescartats, creaColumnesOpcionals } from './columnesOpcionals.js';
import { coaccionaAmbit, esFitxaDAmbit } from '../../utils/publicacioUniversal.js';
import { nomDeCarpetaValid, carpetaDeFila } from '../carpetesNotes.js';
import { CODI_ESQUEMA_ABSENT } from '../errorsBackend.js';

async function carpetesPrivades(config, ownerUserId) {
  const { tenantId } = getResolvedConfig(config);
  validateScope(tenantId);
  try {
    const folders = [];
    let after = '';
    for (;;) {
      const rows = await request(`/rest/v1/note_folders?select=id,nom&tenant_id=eq.${encodeURIComponent(tenantId)}&owner_user_id=eq.${encodeURIComponent(ownerUserId)}&order=id.asc&limit=500${after ? `&id=gt.${encodeURIComponent(after)}` : ''}`, config, { signal: config.signal });
      if (!Array.isArray(rows) || rows.length > 500) throw new TypeError('Resposta de carpetes invàlida.');
      const page = rows.map(carpetaDeFila);
      for (const folder of page) {
        if (after && folder.id <= after) throw new TypeError('La pàgina de carpetes no avança.');
        after = folder.id;
        folders.push(folder);
      }
      if (rows.length < 500) return [...NOTE_FOLDERS_SEED, ...folders];
    }
  } catch (error) {
    // Un servidor anterior a R12 continua llegint Notes; no fingix crear carpetes.
    /* B4-S1 · ErrorSupabase no porta `code`: PostgREST respon 404 amb PGRST205
       al cos quan la taula no existix (un node sense la migració 76, 2611051930; a producció,
       la lectura REST del 6-11-2026 ja la troba). */
    if (['42P01', 'PGRST205'].includes(error?.code) || error?.status === 404 || /PGRST205|42P01/.test(String(error?.message || ''))) return NOTE_FOLDERS_SEED;
    throw error;
  }
}

export async function creaCarpetaNotes(input, config = {}) {
  const nom = nomDeCarpetaValid(input);
  const { runtimeDataMode, tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  if (runtimeDataMode !== 'remote') {
    const { localNotes } = await import('../localNotes.js');
    return localNotes.createFolder({ nom }, config);
  }
  if (!hasSupabaseConfig) throw new Error('No es pot crear la carpeta sense connexió.');
  validateScope(tenantId);
  const row = await request('/rest/v1/rpc/crea_carpeta_notes', config, { method: 'POST', body: JSON.stringify({ p_nom: nom, p_tenant_id: tenantId }) });
  return carpetaDeFila(Array.isArray(row) ? row[0] : row);
}

/* T47b (ordre del Mestre, 260928) · Columnes de `notes` que el client ja
   escriu i que el servidor pot no tindre encara (cap migració aplicada, D2).
   `icon` és l'emoticona de T23. Si PostgREST diu que no existix, el camp es
   recorda, s'envia la resta i el DTO porta `campsNoDesats`: la cua de Notes
   el conserva a l'esborrany del dispositiu.
   T40 (ordre del Mestre, 260928) · `publish_date`, la data de publicació
   triada al calendari de la barra taronja. Mateixa quarantena: sense la
   migració, la data es guarda al dispositiu i publishNote l'aplica igual.
   IDEA-61 (T0, prompt 261102_1532) · `fitxa`, la fitxa d'àmbit del Flux
   Universal de Publicació (jsonb, migració 2611021800). Mateixa quarantena. */
const opcionalsNotes = creaColumnesOpcionals('notes', { icon: 'icon', publishDate: 'publish_date', fitxa: 'fitxa', logoImageDark: 'logo_image_dark' });

/* IDEA-61 (T0, prompt 261102_1532) · La fitxa d'àmbit d'una nota, un sol
   objecte { ambit, estat, dades } coaccionat pel contracte en escriure i en
   llegir (el jsonb torna del servidor): sense àmbit vertical, null. */
const fitxaDeNota = (valor) => (esFitxaDAmbit(valor) ? coaccionaAmbit(valor) : null);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireUuid(value, label) {
  if (!UUID.test(String(value || ''))) throw new Error(`${label} invàlid.`);
}
function validateScope(tenantId) {
  requireUuid(tenantId, 'Poble');
  requireUuid(getCurrentUser()?.id, 'Usuari');
}

const nota = (row) => ({ id: row.id, folderId: row.folder_id, title: row.title, subtitle: row.subtitle,
  lead: row.lead, content: row.content, copyright: row.copyright, categories: row.categories, tags: row.tags,
  heroImage: row.hero_image, logoImage: row.logo_image, isPublished: row.is_published,
  /* IDEA-70 · Opcional fins a aplicar la migració: un resum d'un servidor
     antic no ha de tapar la variant conservada a l'esborrany del dispositiu. */
  ...(row.logo_image_dark !== undefined ? { logoImageDark: row.logo_image_dark ?? '' } : {}),
  publishedSubmissionId: row.published_submission_id, revision: row.revision,
  estat: row.status ?? 'activa', enPapereraAl: row.trashed_at ?? null,
  /* T5 · d'on ve una nota connectada. Només arriba amb `select=*` (detall per
     id): la llista de resums no demana la columna perquè una base sense la
     migració 260927_2100 no deixe de servir el Bloc. */
  origen: normalitzaOrigen(row.origen),
  /* T47b · l'emoticona (T23) només si la fila la porta (`select=*` o el
     RETURNING d'una escriptura amb la columna ja creada). Sense columna no
     s'inventa cap valor: l'esborrany del dispositiu continua manant. */
  ...(row.icon !== undefined ? { icon: row.icon ?? '' } : {}),
  /* T40 · la data de publicació, amb el mateix criteri: només si la fila la
     porta (fora de SUMMARY_COLUMNS: una base sense migració serveix el Bloc). */
  ...(row.publish_date !== undefined ? { publishDate: dataIsoONull(row.publish_date) } : {}),
  /* IDEA-61 · la fitxa d'àmbit, amb el mateix criteri (només si la fila la porta). */
  ...(row.fitxa !== undefined ? { fitxa: fitxaDeNota(row.fitxa) } : {}),
  createdAt: row.created_at, updatedAt: row.updated_at });

// Columnes de targeta explícites: el cos ric només viatja en resoldre un ID.
const SUMMARY_COLUMNS = 'id,folder_id,title,subtitle,lead,copyright,categories,tags,hero_image,logo_image,is_published,published_submission_id,revision,status,trashed_at,created_at,updated_at';
/* El Bloc només mostra les notes actives. La paperera i l'arxiu tenen les
   seues pròpies vistes (pendents); el filtre també val per a la consulta per
   ID, perquè resolveNote no torne a injectar una nota que ja ha eixit. */
const NOMES_ACTIVES = '&status=eq.activa';
const activa = note => (note.estat ?? 'activa') === 'activa';
const ESTATS_NOTA = ['activa', 'paperera', 'arxivada'];
/* El resum no porta ni el cos ni l'origen: un `origen: null` ací ombrejaria el
   del detall en fusionar (mergeNotes) i la nota deixaria de ser «connectada». */
const summary = row => { const value = nota(row); delete value.content; delete value.origen; return { ...value, contentLoaded: false }; };

/* Gauntlet 261022_0225 (crítica Claude, F10) · Sense servidor, l'ordre i el
   cursor fan servir el mateix comparador, per unitat de codi, com
   `order=id.desc` i `id=lt.` de PostgREST. Abans s'ordenava amb localeCompare
   i es tallava amb `<`: amb ids de caixa mixta (create accepta input.id), una
   pàgina repetia notes i se'n perdien d'altres. Amb UUID en minúscula i amb
   les llavors n1/n2, l'ordre és el mateix que abans. */
const perIdDesc = (a, b) => {
  const x = String(a.id);
  const y = String(b.id);
  return x < y ? 1 : x > y ? -1 : 0;
};
/* Gauntlet 261022_0225 (crítica Claude, F9) · Les actives, ordenades una sola
   vegada per lectura: les pàgines que compartixen una lectura del magatzem
   (localNotes, lectures en vol) ja no tornen a ordenar 7.000 notes cadascuna.
   La clau és la llista que torna load(): una lectura nova és una llista nova,
   i res no es queda vell. */
const activesPerLectura = new WeakMap();
function activesOrdenades(notes) {
  if (!activesPerLectura.has(notes)) activesPerLectura.set(notes, notes.filter(activa).sort(perIdDesc));
  return activesPerLectura.get(notes);
}

/** Una pàgina de metadades, amb cursor d’ID immutable (sense salts per offset).
 * complete confirma el final del recorregut, no una instantània transaccional.
 * El servidor pot imposar un límit inferior: sols un rang amb total o una
 * pàgina buida confirmen el final; mai la longitud inferior a 50.
 */
export async function loadNotesPage({ ownerUserId = getDefaultUserId(), cursor = null, limit = 50, signal } = {}, config = {}) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) throw new Error('Límit de Notes invàlid.');
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  let after = null;
  if (cursor !== null) {
    try {
      const decoded = JSON.parse(cursor);
      if (decoded.length !== 3 || decoded[0] !== tenantId || decoded[1] !== ownerUserId || typeof decoded[2] !== 'string') throw new Error();
      after = decoded[2];
    } catch { throw new Error('Cursor de Notes invàlid per a este àmbit.'); }
  }
  if (runtimeDataMode !== 'remote') {
    const { localNotes } = await import('../localNotes.js');
    // Sense servidor, la purga dels 30 dies es fa en començar el recorregut.
    // És millor esforç: si falla, la llista es carrega igual i es tornarà a
    // provar en la càrrega següent.
    if (cursor === null) await localNotes.purgaPaperera(config, ownerUserId).catch(() => 0);
    const seed = await localNotes.load(ownerUserId, config);
    const actives = activesOrdenades(seed.notes || []);
    // La primera nota de la pàgina és la primera per davall del cursor (llista ordenada).
    const desDe = after === null ? 0 : actives.findIndex(note => String(note.id) < after);
    const queden = desDe < 0 ? 0 : actives.length - desDe;
    const notes = (queden ? actives.slice(desDe, desDe + limit) : []).map(note => {
      const value = { ...note, contentLoaded: false }; delete value.content; return value;
    });
    const complete = queden <= limit;
    return { notes, noteFolders: seed.noteFolders || [], complete,
      nextCursor: complete ? null : JSON.stringify([tenantId, ownerUserId, String(notes.at(-1).id)]) };
  }
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar les Notes.');
  validateScope(tenantId);
  requireUuid(ownerUserId, 'Propietari');
  if (after !== null) requireUuid(after, 'Cursor');
  let contentRange = null;
  const rows = await request(
    `/rest/v1/notes?select=${SUMMARY_COLUMNS}&tenant_id=eq.${encodeURIComponent(tenantId)}`
    + `&owner_user_id=eq.${encodeURIComponent(ownerUserId)}${NOMES_ACTIVES}`
    + (after === null ? '' : `&id=lt.${encodeURIComponent(after)}`)
    + `&order=id.desc&limit=${limit}`, config,
    { signal: signal || config.signal, onResponseMetadata: metadata => { contentRange = metadata.contentRange; }, headers: { Prefer: 'count=exact' } }
  );
  if (!Array.isArray(rows) || rows.length > limit) throw new Error('Resposta de Notes amb un format inesperat.');
  let previousId = after;
  for (const row of rows) {
    requireUuid(row.id, 'Nota');
    if (previousId !== null && row.id >= previousId) throw new Error('La pàgina de Notes no avança.');
    if (!Number.isSafeInteger(row.revision) || row.revision < 0) throw new Error('Revisió de Notes invàlida.');
    previousId = row.id;
  }
  const range = /^(?:0-(\d+)|\*)\/(\d+)$/.exec(contentRange || '');
  const total = range ? Number(range[2]) : null;
  if (range && rows.length && Number(range[1]) + 1 !== rows.length) throw new Error('Rang de Notes inconsistent.');
  if (total !== null && total < rows.length) throw new Error('Total de Notes inconsistent.');
  const complete = rows.length === 0 || total === rows.length;
  return { notes: rows.map(summary), noteFolders: await carpetesPrivades(config, ownerUserId), complete,
    nextCursor: complete ? null : JSON.stringify([tenantId, ownerUserId, rows.at(-1).id]) };
}

/** Compatibilitat del port: llista inicial lleugera o detall complet per ID. */
export async function loadNotes(ownerUserId = getDefaultUserId(), config = {}) {
  if (config.noteId == null) {
    const page = await loadNotesPage({ ownerUserId, cursor: config.cursor ?? null, signal: config.signal }, config);
    return { ...page, notesComplete: page.complete };
  }
  const id = String(config.noteId);
  if (!id) throw new Error('Cal un ID de nota no buit.');
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  let notes;
  let carpetesLocals = null;
  if (runtimeDataMode !== 'remote') {
    const { localNotes } = await import('../localNotes.js');
    const seed = await localNotes.load(ownerUserId, config);
    notes = (seed.notes || []).filter(note => String(note.id) === id && activa(note));
    carpetesLocals = seed.noteFolders;
  } else {
    if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar les Notes.');
    validateScope(tenantId); requireUuid(ownerUserId, 'Propietari'); requireUuid(id, 'Nota');
    const rows = await request(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}`
      + `&owner_user_id=eq.${encodeURIComponent(ownerUserId)}&id=eq.${encodeURIComponent(id)}${NOMES_ACTIVES}&limit=1`,
      config, { signal: config.signal });
    if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => row.id !== id)) throw new Error('Detall de Notes invàlid.');
    notes = rows.map(nota);
  }
  return { notes: notes.map(note => ({ ...note, contentLoaded: true })), noteFolders: carpetesLocals ?? await carpetesPrivades(config, ownerUserId),
    notesComplete: false, noteResolution: { id, status: notes.length ? 'found' : 'not-found' } };
}

export async function createNote(input, config = {}) {
  if (getResolvedConfig(config).runtimeDataMode !== 'remote') {
    const { localNotes } = await import('../localNotes.js');
    return localNotes.create(input, config);
  }
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  const user = getCurrentUser();
  if (!hasSupabaseConfig) throw new Error('No es pot crear la nota sense connexió.');
  if (!user) throw new Error('Cal iniciar sessió per crear una nota.');
  validateScope(tenantId);
  if (input.id) requireUuid(input.id, 'Nota');
  const body = { id: input.id || generateUUID(), tenant_id: tenantId, owner_user_id: user.id,
    folder_id: input.folderId || 'f-notes', title: input.title || '', content: input.content || '',
    categories: input.categories || [], tags: input.tags || [],
    ...(input.copyright !== undefined ? { copyright: sanejaDrets(input.copyright, { estricte: true }) } : {}),
    /* T5 · només si ve: sense la columna al servidor, una nota normal no en pateix. */
    ...(normalitzaOrigen(input.origen) ? { origen: normalitzaOrigen(input.origen) } : {}),
    /* T47b · l'emoticona, com a localNotes: un sol emoji o buida. */
    ...(input.icon !== undefined ? { icon: emojiSol(input.icon) || '' } : {}),
    /* T40 · la data de publicació, si ve: ISO o null. */
    ...(input.publishDate !== undefined ? { publish_date: dataIsoONull(input.publishDate) } : {}),
    /* IDEA-61 · la fitxa d'àmbit, si ve: neta pel contracte o null. */
    ...(input.fitxa !== undefined ? { fitxa: fitxaDeNota(input.fitxa) } : {}),
    ...(input.logoImageDark !== undefined ? { logo_image_dark: input.logoImageDark } : {}) };
  const { resultat: rows, descartats } = await opcionalsNotes.envia(body, (cos) => request('/rest/v1/notes', config, {
    method: 'POST', headers: { Prefer: 'return=representation' }, body: cos
  }));
  if (!rows?.[0]) throw new ErrorSupabase('Error al crear la nota.', 500);
  return ambDescartats(nota(rows[0]), descartats);
}

export async function updateNote(id, updates, expectedRevision, config = {}) {
  if (getResolvedConfig(config).runtimeDataMode !== 'remote') {
    const { localNotes } = await import('../localNotes.js');
    return localNotes.update(id, updates, expectedRevision, config);
  }
  const sessionGuard = capturaSessio();
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('ATURADOR CRÍTIC: No es pot actualitzar una nota sense connexió al servidor.');
  validateScope(tenantId);
  requireUuid(id, 'Nota');
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
  if (updates.isPublished === false && updates.revocaPublicacioId) {
    requireUuid(updates.revocaPublicacioId, 'Publicació');
    if (Object.keys(updates).some(k => !['isPublished','publishedSubmissionId','revocaPublicacioId'].includes(k))) throw new TypeError('La retirada no admet canvis privats en la mateixa petició.');
    let ack;
    try {
      ack = await request('/rest/v1/rpc/revoca_publicacio_de_nota', config, { method:'POST', body:{
        p_id:id,p_tenant_id:tenantId,p_expected_revision:expectedRevision,p_publicacio_id:updates.revocaPublicacioId
      } });
    } catch (error) {
      /* Gauntlet R22 (dades-01) · Sense la retirada per acte (2611122200) el servidor no pot retirar
         esta publicació: es diu (CODI_ESQUEMA_ABSENT) i no s'encua cap reintent que no podria acabar. */
      if (error?.status === 404 && error?.postgrestCode === 'PGRST202') {
        throw Object.assign(new ErrorSupabase('El servidor encara no permet retirar publicacions del Mur.', 404),
          { codi: CODI_ESQUEMA_ABSENT, revocacioNoReencuar: true });
      }
      throw error;
    }
    sessionGuard();
    if (ack !== true) throw new Error('El servidor no ha confirmat la retirada.');
    const rows = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`,config);
    sessionGuard();
    if (!rows?.[0]) throw new ErrorSupabase('No accessible o eliminada.',404);
    const actual = nota(rows[0]);
    if (actual.isPublished || actual.publishedSubmissionId) {
      // Un replay de l’acte antic no afecta una republicació posterior.
      throw Object.assign(new ErrorSupabase('SDP-MUR-REVISION: hi ha una publicació posterior que este intent no retira.',409),{revocacioNoReencuar:true});
    }
    return actual;
  }
  const payload = { folder_id: updates.folderId, title: updates.title, subtitle: updates.subtitle,
    lead: updates.lead, content: updates.content, copyright: updates.copyright === undefined ? undefined : sanejaDrets(updates.copyright, { estricte: true }), categories: updates.categories, tags: updates.tags,
    hero_image: updates.heroImage, logo_image: updates.logoImage, logo_image_dark: updates.logoImageDark, is_published: updates.isPublished,
    published_submission_id: updates.publishedSubmissionId,
    origen: updates.origen === undefined ? undefined : normalitzaOrigen(updates.origen),
    /* T47b · l'emoticona (T23). Abans no es mapejava i es perdia en remot. */
    icon: updates.icon === undefined ? undefined : (emojiSol(updates.icon) || ''),
    /* T40 · la data de publicació (columna opcional, amb quarantena). */
    publish_date: updates.publishDate === undefined ? undefined : dataIsoONull(updates.publishDate),
    /* IDEA-61 · la fitxa d'àmbit (columna opcional, amb quarantena). */
    fitxa: updates.fitxa === undefined ? undefined : fitxaDeNota(updates.fitxa) };
  for (const key of Object.keys(payload)) if (payload[key] === undefined) delete payload[key];
  const revision = expectedRevision != null ? `&revision=eq.${expectedRevision}` : '';
  const url = `/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}${revision}`;
  /* T47b · Una columna opcional absent (PGRST204) ja no rebutja tot el PATCH:
     es torna a enviar la resta amb la MATEIXA revisió (el primer intent no ha
     escrit res) i el DTO diu quins camps no s'han desat. */
  const { resultat: rows, descartats } = await opcionalsNotes.envia(payload, (cos) => request(url, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: cos }));
  sessionGuard();
  if (!rows?.[0]) await senseFila(id, tenantId, config);
  return ambDescartats(nota(rows[0]), descartats);
}

/** F10: una escriptura amb revision=eq.N que no toca cap fila és una nota que
 * no existix (404) o una revisió vella (409). Sempre llança. */
async function senseFila(id, tenantId, config) {
  const verifica = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=id`, config);
  if (!verifica?.[0]) {
    throw new ErrorSupabase("No accessible o eliminada.", 404);
  }
  throw new ErrorSupabase("Conflicte de concurrència de revisió.", 409);
}

/** Capacitat 'cicleNotes'. Mou una nota a la paperera, a l'arxiu o la torna
 * activa. La data d'entrada a la paperera la posa el servidor (trigger de
 * 260927_1400_notes_paperera.sql); el client no l'envia. */
export async function mouNota(id, estat, expectedRevision, config = {}) {
  if (!ESTATS_NOTA.includes(estat)) throw new Error('Estat de nota invàlid.');
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
  if (getResolvedConfig(config).runtimeDataMode !== 'remote') {
    const { localNotes } = await import('../localNotes.js');
    return localNotes.move(id, estat, expectedRevision, config);
  }
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot moure la nota sense connexió al servidor.');
  validateScope(tenantId);
  requireUuid(id, 'Nota');
  const rows = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&revision=eq.${expectedRevision}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { status: estat } });
  if (!rows?.[0]) await senseFila(id, tenantId, config);
  return nota(rows[0]);
}

/** Esborrat definitiu amb guarda de revisió. La migració R21 revoca també
 * la publicació vinculada en la mateixa transacció del servidor. El port
 * encua abans la revocació perquè una caiguda de xarxa no la perda. */
export async function esborraNota(id, expectedRevision, config = {}) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
  if (getResolvedConfig(config).runtimeDataMode !== 'remote') {
    const { localNotes } = await import('../localNotes.js');
    return localNotes.remove(id, expectedRevision, config);
  }
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot borrar la nota sense connexió al servidor.');
  validateScope(tenantId);
  requireUuid(id, 'Nota');
  const rows = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&revision=eq.${expectedRevision}`, config,
    { method: 'DELETE', headers: { Prefer: 'return=representation' } });
  if (!rows?.[0]) await senseFila(id, tenantId, config);
  return { id: rows[0].id };
}
