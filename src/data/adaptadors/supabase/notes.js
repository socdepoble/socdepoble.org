/**
 * Traductor de referència: fila PostgREST de la NOSTRA taula `notes`
 * (supabase/migrations) → NotaDTO. És la plantilla de tot traductor de
 * Sollutia: forma d'entrada literal, mapa pur, cap lògica de negoci.
 * Reemplaça el mapeig en línia de supabaseBackend.loadNotes (que porta
 * `categories` mentre les facetes lligen `category`: el defecte que
 * esta capa fa impossible, perquè només hi ha UN nom intern).
 */
import { e } from '../esquema.js';
import { NotaDTO } from '../dto.js';
import { creaTraductor } from '../traductor.js';

const FilaNota = e.objecte({
  id: e.text(), tenant_id: e.opcional(e.text()), owner_user_id: e.opcional(e.text()),
  folder_id: e.nul(e.text()), title: e.nul(e.text()), subtitle: e.nul(e.text()), lead: e.nul(e.text()),
  content: e.nul(e.text()), categories: e.nul(e.llista(e.text())), tags: e.nul(e.llista(e.text())),
  hero_image: e.nul(e.text()), logo_image: e.opcional(e.nul(e.text())),
  is_published: e.nul(e.boolea()), published_submission_id: e.opcional(e.nul(e.text())),
  revision: e.nul(e.nombre()), created_at: e.opcional(e.data()), updated_at: e.data(),
});

export const notaDesDeSupabase = creaTraductor({
  origen: 'supabase', recurs: 'notes', versio: 1, entrada: FilaNota, eixida: NotaDTO,
  mapa: (f) => ({
    id: f.id,
    carpetaId: f.folder_id,
    titol: f.title ?? '',
    subtitol: f.subtitle ?? '',
    entradeta: f.lead ?? '',
    contingutHtml: f.content ?? '',
    categories: f.categories ?? [],
    etiquetes: f.tags ?? [],
    imatge: f.hero_image,
    publicada: f.is_published === true,
    revisio: f.revision ?? 0,
    actualitzada: f.updated_at,
  }),
});
