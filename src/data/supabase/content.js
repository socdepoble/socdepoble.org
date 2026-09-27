import { getDefaultUserId } from '../appSeed.js';
import { mapSectionSubmissionToItem, mergeById } from '../mapejadorSeccions.js';
import { buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, mapContentRowsToData, request } from './runtime.js';
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
  const base = mapContentRowsToData(contentRows || []); const subs = Array.isArray(submissions) ? submissions : [];
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
    chatMessages: [], sectionSubmissions: submissions };
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
  if (!tenantId) throw new Error('Poble no configurat.');
  const ownerUserId = getCurrentUser()?.id;
  if (!ownerUserId) throw new Error('Cal iniciar sessió per publicar.');
  const sectionId = String(submission?.sectionId || '').trim(); if (!SECCIONS.has(sectionId)) throw new Error('Secció no suportada per a connectar.');
  const id = String(submission?.id || generateUUID()); const createdAt = submission?.createdAt || new Date().toISOString();
  const basePayload = submission?.payload && typeof submission.payload === 'object' ? submission.payload : {};
  const payload = mapSectionSubmissionToItem({ ...submission, id, ownerUserId, sectionId, createdAt,
    payload: { ...basePayload, id, ownerUserId, sectionId, created_at: basePayload.created_at || createdAt } });
  /* I2 · Qui signa. Una entitat sense id no es degrada a persona: signar amb un
     altre nom del que s'ha triat és pitjor que no publicar. El servidor (M18 i
     la política d'INSERT) decidix si la persona pot signar per eixa entitat.
     Sense actor (una crida d'abans d'I2) la columna no s'envia: l'upsert no
     esborra la signatura d'una publicació que ja en tenia. */
  const actor = submission?.actor;
  if (actor?.tipus === 'entitat' && !actor.id) throw new Error('Falta l’entitat que signa la publicació.');
  const authorOrgId = actor?.tipus === 'entitat' ? String(actor.id) : null;
  const stored = { id, ownerUserId, authorOrgId, sectionId, title: submission?.title || payload.title || '',
    description: submission?.description || payload.description || payload.summary || '', createdAt, payload };
  const fila = { id, tenant_id: tenantId, owner_user_id: ownerUserId, section_id: sectionId, title: stored.title,
    description: stored.description, payload, created_at: createdAt };
  if (actor) fila.author_org_id = authorOrgId;
  await request('/rest/v1/section_submissions?on_conflict=id', config, { method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' }, body: [fila] });
  return stored;
}
export async function loadCoreContent(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config); const seed = await buildSeedAppData(ownerUserId);
  if (runtimeDataMode === 'seed') return { towns: seed.towns, pages: seed.pages, pageCopy: {}, agents: seed.agents, ownerUserId };
  if (runtimeDataMode === 'local') return { towns: [], pages: seed.pages, pageCopy: {}, agents: [], ownerUserId };
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar el contingut Core.');
  if (!tenantId) throw new Error('Poble no configurat: falta tenantId (VITE_TENANT_ID).');
  const rows = await request(`/rest/v1/app_content?select=key,payload,version&key=in.(towns,agents)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal });
  const base = mapContentRowsToData(rows || []); return { towns: base.towns, pages: seed.pages, pageCopy: {}, agents: base.agents, ownerUserId };
}
/** Carrega exclusivament les fonts d’una secció; Notes té el seu port propi. */
async function loadSections(ownerUserId, config, sections) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'local') return Object.fromEntries(sections.map(([key]) => [key, []]));
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    return Object.fromEntries(sections.map(([key]) => [key, seed[key] || []]));
  }
  if (!hasSupabaseConfig || !tenantId) throw new Error('Falta configuració de dades del poble.');
  const tenant = encodeURIComponent(tenantId);
  const keys = sections.map(([key]) => key).join(',');
  /* Lògica d'Usuari (T1): l'autoria viatja com a columnes, no com a payload que
     el client mateix ha escrit. Amb elles el MAS sap quines publicacions són de
     la persona (owner_user_id) o de l'entitat que ha signat (author_org_id). */
  const [rows, ...submissions] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(${keys})&tenant_id=eq.${tenant}`, config, { signal: config.signal }),
    ...sections.map(([, section]) => request(
      `/rest/v1/section_submissions?select=id,payload,title,created_at,owner_user_id,author_org_id&tenant_id=eq.${tenant}&section_id=eq.${section}&order=created_at.desc,id.desc&limit=50`,
      config, { signal: config.signal }))
  ]);
  return Object.fromEntries(sections.map(([key], index) => [key, mergeById(
    rows.find(row => row.key === key)?.payload || [],
    submissions[index].map(row => ({ ...row.payload, id: row.id,
      created_at: row.created_at, author_name: row.payload?.author_name || row.title,
      ownerUserId: row.owner_user_id ?? row.payload?.ownerUserId ?? null,
      authorOrgId: row.author_org_id ?? null }))
  )]));
}
export function loadMur(ownerUserId = getDefaultUserId(), config = {}) {
  return loadSections(ownerUserId, config, [['feedPosts', 'mur'], ['events', 'events'], ['marketItems', 'mercat']]);
}
export function loadMultimedia(ownerUserId = getDefaultUserId(), config = {}) {
  return loadSections(ownerUserId, config, [['mediaItems', 'multimedia']]);
}
