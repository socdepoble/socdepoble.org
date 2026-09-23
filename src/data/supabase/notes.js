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

export async function loadNotes(
  ownerUserId = getDefaultUserId(),
  config = {}
) {
  const {
    runtimeDataMode,
    hasSupabaseConfig,
    tenantId
  } = getResolvedConfig(config);

  const requestedId = config.noteId == null
    ? null
    : String(config.noteId);

  if (requestedId === '') {
    throw new Error('Cal un ID de nota no buit.');
  }

  function buildResult(notes, noteFolders, notesComplete) {
    if (requestedId === null) {
      return { notes, noteFolders, notesComplete };
    }

    const matches = notes.filter(
      (note) => String(note.id) === requestedId
    );

    return {
      notes: matches,
      noteFolders,
      // Aquesta resposta conté un detall, no la llista completa.
      notesComplete: false,
      noteResolution: {
        id: requestedId,
        status: matches.length > 0 ? 'found' : 'not-found'
      }
    };
  }

  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);

    return buildResult(
      seed.notes || [],
      seed.noteFolders || [],
      true
    );
  }

  if (!hasSupabaseConfig) {
    throw new Error(
      'Falten credencials de Supabase per carregar les Notes.'
    );
  }

  validateScope(tenantId);
  requireUuid(ownerUserId, 'Propietari');
  if (requestedId !== null) requireUuid(requestedId, 'Nota');
  const safeOwnerId = ownerUserId;
  const tenant = encodeURIComponent(tenantId);
  const owner = encodeURIComponent(safeOwnerId);

  const noteFilter = requestedId === null
    ? ''
    : `&id=eq.${encodeURIComponent(requestedId)}`;

  // Only native rows are editable. Editorial examples stay in the intro card.
  const notes = [];
  let offset = 0;
  while (true) {
    const rows = await request(
      `/rest/v1/notes?select=*&tenant_id=eq.${tenant}`
        + `&owner_user_id=eq.${owner}${noteFilter}`
        + `&order=updated_at.desc,id.desc&limit=50&offset=${offset}`,
      config, { signal: config.signal }
    );
    if (!Array.isArray(rows)) throw new Error('Resposta de Notes amb un format inesperat.');
    notes.push(...rows.map(nota));
    if (requestedId !== null || rows.length < 50) break;
    offset += rows.length;
  }
  return buildResult(notes, NOTE_FOLDERS_SEED, true);
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
