import { getDefaultUserId, NOTE_FOLDERS_SEED } from '../appSeed.js';
import { ErrorSupabase, buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, request } from './runtime.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireUuid(value, label) {
  if (!UUID.test(String(value || ''))) throw new Error(`${label} invàlid.`);
}
function validateScope(tenantId) {
  requireUuid(tenantId, 'Poble');
  requireUuid(getCurrentUser()?.id, 'Usuari');
}

const nota = (row) => ({ id: row.id, folderId: row.folder_id, title: row.title, subtitle: row.subtitle,
  lead: row.lead, content: row.content, categories: row.categories, tags: row.tags,
  heroImage: row.hero_image, logoImage: row.logo_image, isPublished: row.is_published,
  publishedSubmissionId: row.published_submission_id, revision: row.revision,
  createdAt: row.created_at, updatedAt: row.updated_at });

// Columnes de targeta explícites: el cos ric només viatja en resoldre un ID.
const SUMMARY_COLUMNS = 'id,folder_id,title,subtitle,lead,categories,tags,hero_image,logo_image,is_published,published_submission_id,revision,created_at,updated_at';
const summary = row => { const value = nota(row); delete value.content; return { ...value, contentLoaded: false }; };

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
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    const remaining = [...(seed.notes || [])].sort((a, b) => String(b.id).localeCompare(String(a.id)))
      .filter(note => after === null || String(note.id) < after);
    const notes = remaining.slice(0, limit).map(note => {
      const value = { ...note, contentLoaded: false }; delete value.content; return value;
    });
    const complete = remaining.length <= limit;
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
    + `&owner_user_id=eq.${encodeURIComponent(ownerUserId)}`
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
  return { notes: rows.map(summary), noteFolders: NOTE_FOLDERS_SEED, complete,
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
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    notes = (seed.notes || []).filter(note => String(note.id) === id);
  } else {
    if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar les Notes.');
    validateScope(tenantId); requireUuid(ownerUserId, 'Propietari'); requireUuid(id, 'Nota');
    const rows = await request(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}`
      + `&owner_user_id=eq.${encodeURIComponent(ownerUserId)}&id=eq.${encodeURIComponent(id)}&limit=1`,
      config, { signal: config.signal });
    if (!Array.isArray(rows) || rows.length > 1 || rows.some(row => row.id !== id)) throw new Error('Detall de Notes invàlid.');
    notes = rows.map(nota);
  }
  return { notes: notes.map(note => ({ ...note, contentLoaded: true })), noteFolders: NOTE_FOLDERS_SEED,
    notesComplete: false, noteResolution: { id, status: notes.length ? 'found' : 'not-found' } };
}

export async function createNote(input, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  const user = getCurrentUser();
  if (!hasSupabaseConfig) throw new Error('No es pot crear la nota sense connexió.');
  if (!user) throw new Error('Cal iniciar sessió per crear una nota.');
  validateScope(tenantId);
  if (input.id) requireUuid(input.id, 'Nota');
  const rows = await request('/rest/v1/notes', config, {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: { id: input.id || generateUUID(), tenant_id: tenantId, owner_user_id: user.id,
      folder_id: input.folderId || 'f-notes', title: input.title || '', content: input.content || '',
      categories: input.categories || [], tags: input.tags || [] }
  });
  if (!rows?.[0]) throw new ErrorSupabase('Error al crear la nota.', 500);
  return nota(rows[0]);
}

export async function updateNote(id, updates, expectedRevision, config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('ATURADOR CRÍTIC: No es pot actualitzar una nota sense connexió al servidor.');
  validateScope(tenantId);
  requireUuid(id, 'Nota');
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
  const payload = { folder_id: updates.folderId, title: updates.title, subtitle: updates.subtitle,
    lead: updates.lead, content: updates.content, categories: updates.categories, tags: updates.tags,
    hero_image: updates.heroImage, logo_image: updates.logoImage, is_published: updates.isPublished,
    published_submission_id: updates.publishedSubmissionId };
  for (const key of Object.keys(payload)) if (payload[key] === undefined) delete payload[key];
  const revision = expectedRevision != null ? `&revision=eq.${expectedRevision}` : '';
  const rows = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}${revision}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: payload });
  if (!rows?.[0]) {
    // F10: Comprovar si existeix realment per distingir entre conflicte i no trobada
    const verifica = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=id`, config);
    if (!verifica?.[0]) {
      throw new ErrorSupabase("No accessible o eliminada.", 404);
    }
    throw new ErrorSupabase("Conflicte de concurrència de revisió.", 409);
  }
  return nota(rows[0]);
}
