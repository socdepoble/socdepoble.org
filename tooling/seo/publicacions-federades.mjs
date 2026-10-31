/** Lectura anònima d'app_content; cap section_submissions, cap sessió, cap seed. */
import { createHash } from 'node:crypto';
import { ESCAPADA, entornDelBuild, esPublicada, llegixClau } from './projeccio-publica.mjs';
import { normalitzaOrigen, dataIso } from '../../src/data/activitypub.js';
import { textPla } from '../../src/config/metadadesSocials.js';
import { plainText } from './build-social-manifest.mjs';
import { instantEnLaZona } from '../../src/utils/esdeveniment.js';

const MAXIM = 10000;
const net = valor => plainText(textPla(typeof valor === 'string' ? valor : '', 20000), 20000);
const clau = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const idPublic = valor => typeof valor === 'string' && /^[a-z0-9][a-z0-9_-]{0,127}$/i.test(valor);
function moment(valor, zona) {
  const iso = dataIso(valor); if (iso) return iso;
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(valor)) return null;
  try { const instant = instantEnLaZona({ dataHora: valor, zona: zona || 'Europe/Madrid' }); return instant === null ? null : new Date(instant).toISOString(); } catch { return null; }
}
/** {slug, element}, o null. Lloc del contingut; mai el poble de qui signa. */
export function projectaPublicacioFederada(seccio, item, { pobles, origen }) {
  if (!['mur', 'events'].includes(seccio) || !esPublicada(item) || !idPublic(String(item.id ?? ''))
      || Object.hasOwn(item, 'owner_user_id') || Object.hasOwn(item, 'ownerUserId')
      || !(item.author_entity_id || item.author_org_id || item.authorOrgId)) return null;
  const declarada = item.poble_id || item.town_id || item.municipi;
  const lloc = item.town_name || item.location;
  const poble = pobles.find(p => declarada ? p.slug === declarada : clau(p.nom) === clau(lloc));
  if (!poble) return null;
  try {
    const tipus = seccio === 'events' || item.type === 'event' ? 'Event' : ['article', 'news', 'noticia'].includes(item.type) ? 'Article' : 'Note';
    const nom = net(item.title || item.name), text = net(item.content || item.body || item.description || item.entradilla);
    if (!nom || (tipus === 'Note' && !text)) return null;
    const id = `${seccio}-${createHash('sha256').update(`${seccio}:${item.id}`).digest('hex').slice(0, 32)}`;
    const element = { id, tipus, nom, text, llengua: 'ca', url: `${normalitzaOrigen(origen)}/${seccio}/${encodeURIComponent(item.id)}` };
    const publicat = dataIso(item.created_at); if (publicat) element.publicat = publicat;
    if (tipus !== 'Note') element.resum = net(item.entradilla || item.summary || item.description);
    if (tipus === 'Event') {
      const inici = moment(item.inici, item.zona) || moment(item.date && `${item.date}T${item.time || '00:00'}`, item.zona);
      if (!inici) return null;
      element.inici = inici;
      const fi = moment(item.fi, item.zona); if (fi) element.fi = fi;
      const nomLloc = net(item.location); if (nomLloc) element.lloc = { nom: nomLloc };
    }
    return { slug: poble.slug, element };
  } catch { return null; } // text sospitós o data malformada: no ix.
}

export async function publicacionsDelBuild({ env = {}, origen, pobles, fetchImpl = globalThis.fetch } = {}) {
  // L'escapada del build sense xarxa (sandbox de Nix): es llig de process.env, perquè l'env de Vite només porta VITE_*.
  if (process.env[ESCAPADA] === '1') {
    console.warn(`AVÍS · ${ESCAPADA}=1: l'outbox federat ix sense publicacions remotes.`);
    return [];
  }
  // Un build sense cap configuració remota és documental. Una configuració parcial falla.
  if (!env.VITE_DATA_MODE && !env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_ANON_KEY && !env.VITE_TENANT_ID) return [];
  const entorn = entornDelBuild(env);
  if (entorn.dataMode !== 'remote') return [];
  const resultat = [], vistos = new Set();
  for (const [clauDades, seccio] of [['feedPosts', 'mur'], ['events', 'events']]) {
    const fila = await llegixClau(entorn, clauDades, { fetchImpl, termini: 5000, maxResposta: 16 * 1024 * 1024, pausa: () => Promise.resolve() });
    if (fila && !Array.isArray(fila.payload)) throw new TypeError('Payload públic federat invàlid.');
    const items = fila?.payload || [];
    if (items.length > MAXIM) throw new RangeError('Massa publicacions: no es retalla el municipi.');
    for (const item of items) {
      const projectat = projectaPublicacioFederada(seccio, item, { pobles, origen });
      if (!projectat) continue;
      const id = `${projectat.slug}:${projectat.element.id}`;
      if (vistos.has(id)) throw new Error('Identificador públic duplicat: cal resoldre el contingut abans del build.');
      vistos.add(id); resultat.push(projectat);
    }
  }
  return resultat.sort((a,b) => a.slug.localeCompare(b.slug) || a.element.id.localeCompare(b.element.id));
}
