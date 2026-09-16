/**
 * dto.js — Els DTO INTERNS de Sóc de Poble. És l'única forma de dades que
 * la UI coneix. No porten el nom de cap origen: ni `owner_user_id` (Supabase)
 * ni el que siga que use Sollutia. Si un origen canvia, canvia el seu
 * traductor; esta forma i els components no es toquen.
 */
import { e } from './esquema.js';

export const NotaDTO = e.objecte({
  id: e.text(),
  carpetaId: e.nul(e.text()),
  titol: e.text(),
  subtitol: e.text(),
  entradeta: e.text(),
  contingutHtml: e.text(),
  categories: e.llista(e.text()),
  etiquetes: e.llista(e.text()),
  imatge: e.nul(e.text()),
  publicada: e.boolea(),
  revisio: e.nombre(),
  actualitzada: e.data(),
});

export const CarpetaDTO = e.objecte({ id: e.text(), nom: e.text(), pareId: e.nul(e.text()) });
