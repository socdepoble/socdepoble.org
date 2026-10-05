import { createOrganization, getCurrentUser } from './backendPort.js';
import { capturaSessio } from './identitat.js';
import { MAXIM_LEMA } from './limitsText.js';

const TIPUS = new Set(['company', 'group']);
const ROLS = new Set(['owner', 'admin', 'member']);
/* F5 (ordre del Mestre, 261004; pla 2045, Marató 2230) · Els tipus que poden
   ser mare d'un grup: el mateix conjunt que private.can_create_group
   (2609272201_grups_mare.sql:26), que és l'autoritat de seguretat. Abans el
   client només admetia 'company' i rebutjava una associació o un ajuntament
   que el servidor sí accepta. No amplia cap permís; organizations.test.js
   vigila que les dues capes no divergisquen. */
export const TIPUS_MARE = new Set(['company', 'entity', 'city_hall']);

/** Alta d'entitats del domini. El proveïdor, la persistència i els seus errors
 * queden darrere del port; el formulari només envia dades i espera confirmació. */
export async function creaOrganitzacio(dades, config = {}, organitzacions = []) {
  if (!getCurrentUser()?.id) throw new Error('Cal iniciar sessió per crear una organització.');
  const comprovaSessio = capturaSessio();
  const input = dades ?? {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const slug = typeof input.slug === 'string' ? input.slug.trim().toLowerCase() : '';
  const kind = input.kind ?? 'company';
  if (name.length < 2 || name.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Nom o identificador invàlid.');
  }
  if (!TIPUS.has(kind)) throw new Error('Tipus d’organització no vàlid.');
  const parentOrganizationId = typeof input.parentOrganizationId === 'string'
    ? input.parentOrganizationId.trim() : '';
  if (kind === 'group') {
    if (!parentOrganizationId) throw new Error('Un grup necessita una empresa mare.');
    if (!organitzacions.some((org) => org.id === parentOrganizationId && TIPUS_MARE.has(org.kind)
      && ['owner', 'admin'].includes(org.role))) {
      throw new Error('Tria una empresa que pugues administrar.');
    }
  } else if (parentOrganizationId) {
    throw new Error('Una empresa no pot tindre una organització mare.');
  }
  const payload = { name, slug, kind };
  if (kind === 'group') payload.parentOrganizationId = parentOrganizationId;
  /* T49 · En caràcters de veres, com char_length del CHECK: «🌾» és 1, no 2. */
  for (const [camp, limit] of [['description', 500], ['lema', MAXIM_LEMA]]) {
    if (input[camp] === undefined) continue;
    if (typeof input[camp] !== 'string' || [...input[camp].trim()].length > limit) {
      throw new Error(`El camp ${camp === 'lema' ? 'lema' : 'descripció'} no és vàlid.`);
    }
    payload[camp] = input[camp].trim();
  }
  comprovaSessio();
  const creada = await createOrganization(payload, config);
  comprovaSessio();
  if (typeof creada?.id !== 'string' || !creada.id.trim()) {
    throw new Error('El servidor no ha confirmat l’organització.');
  }
  /* Un port pot tornar només l'id; els camps que sí torna han de confirmar
     la mateixa entitat. El nom pot haver canviat en un reintent idempotent. */
  const esperats = { kind, slug, parentOrganizationId: parentOrganizationId || null,
    parent_organization_id: parentOrganizationId || null };
  if (Object.entries(esperats).some(([camp, esperat]) => Object.hasOwn(creada, camp) && creada[camp] !== esperat)
    || (Object.hasOwn(creada, 'role') && !ROLS.has(creada.role))
    || (Object.hasOwn(creada, 'name') && (typeof creada.name !== 'string'
      || creada.name.trim().length < 2 || creada.name.trim().length > 120))) {
    throw new Error('El servidor ha retornat una organització incoherent. Torna a carregar el perfil abans de reintentar.');
  }
  return { name, slug, kind, ...creada };
}
