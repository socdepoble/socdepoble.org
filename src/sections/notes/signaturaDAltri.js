/**
 * signaturaDAltri.js — D-B4-1 (Onada R6, Bloc 4; decisió de MarIA sobre el
 * Bloc 3) · Una sola guarda de signatura aliena per al Mur i per a l'agenda.
 *
 * Abans n'hi havia dues: la del Mur (NotesContext · rebuigDePublicacio, sense
 * cap excepció) i la dels actes (publicacioEditable.js · motiuActeDAltri, amb
 * l'excepció de superadmin). Ara totes dues criden esta funció pura:
 *  · cap usuari ordinari no edita una peça signada per una altra persona o
 *    entitat (autorDe + pertanyALActor + aliesDeLActor amb el mode RESOLT,
 *    el mateix criteri de sempre);
 *  · el superadmin estable (useSuperadminEstable, el mateix que el Perfil) pot
 *    REVISAR-la. Qui la crida decidix si l'operació és una revisió: una
 *    revisió editorial conserva l'autoria (només desa els camps canviats);
 *    l'upsert de publishNote, no (signa amb l'actor actiu), i per això
 *    publishNote no hi passa mai `esSuperadmin`.
 * Sense actor, sense autor conegut o sense publicació, no s'aplica (com
 * abans). Torna el motiu (el text del toast) o null.
 */
import { autorDe } from '../../config/navigation.js';
import { aliesDeLActor } from '../../data/identitatsSeed.js';
import { pertanyALActor } from './masDeLUsuari.js';
import { modeDeDadesResolt } from './autoriaNota.js';
import { motiuSignaturaAliena } from './visibilitatNota.js';

/** El nom visible de qui signa: el de l'autoria, el de qui ven o el de qui
 *  organitza un acte (abans, un acte amb només `organizer` deia «signant
 *  desconegut»). Només textos. */
function nomDelSignant(publicacio) {
  const nom = [publicacio.author_name, publicacio.seller, publicacio.organizer]
    .find((valor) => typeof valor === 'string' && valor.trim());
  return nom || '';
}

/** El motiu de no deixar editar `publicacio` (signada per altri) o null. */
export function motiuSignaturaDAltri(publicacio, { actor = null, config = null, esSuperadmin = false, t = null } = {}) {
  if (esSuperadmin === true || !publicacio || typeof publicacio !== 'object' || !actor?.id || !autorDe(publicacio)) return null;
  if (pertanyALActor(publicacio, aliesDeLActor(actor, { dataMode: modeDeDadesResolt(config) }))) return null;
  return motiuSignaturaAliena(nomDelSignant(publicacio), t);
}
