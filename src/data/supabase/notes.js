import { getDefaultUserId } from '../appSeed.js';
import { mergeById } from '../mapejadorSeccions.js';
import { ErrorSupabase, buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, mapContentRowsToData, request } from './runtime.js';

const nota = (row) => ({ id: row.id, folderId: row.folder_id, title: row.title, subtitle: row.subtitle,
  lead: row.lead, content: row.content, categories: row.categories, tags: row.tags,
  heroImage: row.hero_image, logoImage: row.logo_image, isPublished: row.is_published,
  publishedSubmissionId: row.published_submission_id, revision: row.revision,
  createdAt: row.created_at, updatedAt: row.updated_at });

export async function loadNotes(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    return { notes: seed.notes, noteFolders: seed.noteFolders };
  }
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar les Notes.');
  const safeOwnerId = ownerUserId || getDefaultUserId();
  const [contentRows, submissions, rows] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(notes,noteFolders)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    request(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal }),
    request(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&owner_user_id=eq.${encodeURIComponent(safeOwnerId)}&order=updated_at.desc&limit=50`, config, { signal: config.signal })
  ]);
  const base = mapContentRowsToData(contentRows || []);
  const merged = mergeById(base.notes || [], Array.isArray(rows) ? rows.map(nota) : []);
  return {
    notes: mergeById(merged, (submissions || []).filter((s) => s.section_id === 'notes').map((s) => s.payload)),
    noteFolders: base.noteFolders || []
  };
}

export async function createNote(input, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  const user = getCurrentUser();
  if (!hasSupabaseConfig) throw new Error('No es pot crear la nota sense connexió.');
  if (!user) throw new Error('Cal iniciar sessió per crear una nota.');
  const rows = await request('/rest/v1/notes', config, {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: { id: input.id || generateUUID(), tenant_id: tenantId, owner_user_id: user.id,
      folder_id: input.folderId || 'f-notes', title: input.title || '', content: input.content || '' }
  });
  if (!rows?.[0]) throw new ErrorSupabase('Error al crear la nota.', 500);
  return nota(rows[0]);
}

export async function updateNote(id, updates, expectedRevision, config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('ATURADOR CRÍTIC: No es pot actualitzar una nota sense connexió al servidor.');
  if (expectedRevision === undefined || expectedRevision === null) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
  const payload = { folder_id: updates.folderId, title: updates.title, subtitle: updates.subtitle,
    lead: updates.lead, content: updates.content, categories: updates.categories, tags: updates.tags,
    hero_image: updates.heroImage, logo_image: updates.logoImage, is_published: updates.isPublished,
    published_submission_id: updates.publishedSubmissionId };
  for (const key of Object.keys(payload)) if (payload[key] === undefined) delete payload[key];
  const revision = expectedRevision ? `&revision=eq.${expectedRevision}` : '';
  const rows = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}${revision}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: payload });
  if (!rows?.[0]) throw new ErrorSupabase("No s'ha pogut actualitzar la nota. Conflicte de concurrència o nota no trobada.", 409);
  return nota(rows[0]);
}
