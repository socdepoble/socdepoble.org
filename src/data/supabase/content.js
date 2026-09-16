import { getDefaultUserId } from '../appSeed.js';
import { mapSectionSubmissionToItem, mergeById } from '../mapejadorSeccions.js';
import { APP_SEED_VERSION, buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, mapContentRowsToData, request } from './runtime.js';
import { enviaMissatge } from './xat.js';

const SECCIONS = new Set(['mur', 'mercat', 'events', 'multimedia', 'notes']);
export async function loadAppData(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') return buildSeedAppData(ownerUserId);
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar la AppData.');
  if (!tenantId) throw new Error('Poble no configurat: falta tenantId (VITE_TENANT_ID).');
  /* Les notes són privades: només amb sessió i sempre amb l'uuid de la sessió.
     `ownerUserId` pot ser un slug (/e/:slug) i PostgREST el rebutja amb 400. */
  const sessio = getCurrentUser();
  const opcional = (promesa, que) => promesa.catch((error) => {
    console.warn(`[supabase] ${que} no disponible:`, error?.message);
    return [];
  });
  const [contentRows, submissions, noteRows] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    opcional(request(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal }), 'section_submissions'),
    sessio?.id
      ? opcional(request(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&owner_user_id=eq.${encodeURIComponent(sessio.id)}&order=updated_at.desc&limit=50`, config, { signal: config.signal }), 'notes')
      : Promise.resolve([])]);
  if (!contentRows?.length) throw new Error('La BD remota està buida. Executa les migracions i la llavor.');
  const base = mapContentRowsToData(contentRows); const subs = Array.isArray(submissions) ? submissions : [];
  const notes = (noteRows || []).map((n) => ({ id: n.id, folderId: n.folder_id, title: n.title, subtitle: n.subtitle,
    lead: n.lead, content: n.content, categories: n.categories, tags: n.tags, heroImage: n.hero_image,
    logoImage: n.logo_image, isPublished: n.is_published, publishedSubmissionId: n.published_submission_id,
    revision: n.revision, createdAt: n.created_at, updatedAt: n.updated_at }));
  const combina = (clau, seccio) => mergeById(
  base[clau] || [],
  subs.filter((s) => s.section_id === seccio).map((s) => ({
    ...s.payload,
    id: s.id,
    created_at: s.created_at,
    author_name: s.payload?.author_name || s.title
  }))
);
  return { ...base, ownerUserId, feedPosts: combina('feedPosts', 'mur'), marketItems: combina('marketItems', 'mercat'),
    events: combina('events', 'events'), mediaItems: combina('mediaItems', 'multimedia'),
    notes: mergeById(mergeById(base.notes || [], notes), subs.filter((s) => s.section_id === 'notes').map((s) => s.payload)),
    chatMessages: [], sectionSubmissions: submissions, seedVersion: APP_SEED_VERSION };
}
export async function appendChatMessages(messages, config = {}) {
  const result = [];
  for (const message of Array.isArray(messages) ? messages : []) {
    result.push(await enviaMissatge(message.threadId ?? message.filId, message.text, config));
  }
  return result;
}
export async function appendSectionSubmissionNetworkOnly(submission, config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot escriure publicació sense connexió al servidor.');
  const ownerUserId = submission?.ownerUserId || getDefaultUserId();
  const sectionId = String(submission?.sectionId || '').trim(); if (!SECCIONS.has(sectionId)) throw new Error('Secció no suportada per a connectar.');
  const id = String(submission?.id || generateUUID()); const createdAt = submission?.createdAt || new Date().toISOString();
  const basePayload = submission?.payload && typeof submission.payload === 'object' ? submission.payload : {};
  const payload = mapSectionSubmissionToItem({ ...submission, id, ownerUserId, sectionId, createdAt,
    payload: { ...basePayload, id, ownerUserId, sectionId, created_at: basePayload.created_at || createdAt } });
  const stored = { id, ownerUserId, sectionId, title: submission?.title || payload.title || '',
    description: submission?.description || payload.description || payload.summary || '', createdAt, payload };
  await request('/rest/v1/section_submissions?on_conflict=id', config, { method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' }, body: [{ id, tenant_id: tenantId,
      owner_user_id: ownerUserId, section_id: sectionId, title: stored.title, description: stored.description, payload, created_at: createdAt }] });
  return stored;
}
export async function loadCoreContent(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config); const seed = await buildSeedAppData(ownerUserId);
  if (runtimeDataMode === 'seed') return { towns: seed.towns, pages: seed.pages, pageCopy: {}, agents: seed.agents, ownerUserId };
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar el contingut Core.');
  if (!tenantId) throw new Error('Poble no configurat: falta tenantId (VITE_TENANT_ID).');
  const rows = await request(`/rest/v1/app_content?select=key,payload,version&key=in.(towns,agents)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal });
  const base = mapContentRowsToData(rows || []); return { towns: base.towns, pages: seed.pages, pageCopy: {}, agents: base.agents, ownerUserId };
}
export async function loadMur(ownerUserId = getDefaultUserId(), config = {}) {
  const data = await loadAppData(ownerUserId, config); return { feedPosts: data.feedPosts, events: data.events, marketItems: data.marketItems };
}
export async function loadMultimedia(ownerUserId = getDefaultUserId(), config = {}) {
  const data = await loadAppData(ownerUserId, config); return { mediaItems: data.mediaItems };
}
