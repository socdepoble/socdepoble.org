/**
 * usePublicacionsDelPoble.js · Onada 6 (pla 261009_0245, ítem 5; prompt
 * 261009_0230, punt 6) · Les targetes que la gent d'un poble ha publicat des
 * del poble (Mur, Agenda i Mercat), per a la pestanya «Gent de …» de la seua
 * pàgina.
 *
 * Cap petició nova i cap lògica de dades nova (lliçó 261007: es reutilitza la
 * maquinària que ja existix): les dades són les del Mur (useMur → MurContext
 * → backendPort.loadMur, Model B) i el filtre i l'ordre, els de
 * publicacionsDelPoble.js. La forma de tornada és la d'usePublicacionsDeLActor
 * ({ elements, estat, error, refresh }), la que pinta la seua vista.
 *
 * A diferència de l'històric de l'actor, la veu també el Foraster: és
 * contingut públic del poble.
 *
 * Límit conegut · En remot el port porta les 50 darreres publicacions de
 * cada secció de tot el node (content.js · LIMIT_SECCIO) i el filtre es fa al
 * client: un poble poc actiu pot quedar amb la pestanya buida encara que tinga
 * publicacions més velles. El remei és un filtre al servidor (capacitat nova
 * del port, amb ADR): pendent.
 */
import { useMemo } from 'react';
import { useMur } from '../mur/MurContext';
import { usePaginesDelSistema } from '../mur/usePublicacionsDeLActor.js';
import { publicacionsDelPoble } from './publicacionsDelPoble.js';

const CAP = Object.freeze([]);
const textDe = (valor) => (valor == null ? '' : String(valor));
const senseTraduccio = (_clau, reserva) => reserva;

/**
 * Els textos de la pestanya ({ titol, buit, carregant, error }), per a la
 * vista de l'històric (VistaPublicacionsDeLActor). Sense títol: la pestanya
 * «Gent de …» ja nomena el panell (aria-labelledby) i, com mana el requisit,
 * la vista mostra només les targetes. Cap nom de poble ací.
 */
export function textosDelPoble(t = senseTraduccio) {
  const tradueix = typeof t === 'function' ? t : senseTraduccio;
  return {
    titol: '',
    buit: tradueix('section.detail.pobles.gent.buit', 'Encara no hi ha cap publicació des d’este poble.'),
    carregant: tradueix('section.detail.pobles.gent.carregant', 'Carregant les publicacions del poble…'),
    error: tradueix('section.detail.pobles.gent.error', 'No s’han pogut carregar les publicacions del poble')
  };
}

/** Les publicacions del poble `poble` (una fitxa de /pobles), amb l'estat, l'error i el Reintentar del Mur. */
export function usePublicacionsDelPoble(poble) {
  const mur = useMur();
  const { targetes: sistema, carregant: paginesCarregant } = usePaginesDelSistema();
  const delMur = mur?.feedPosts || CAP;
  const estatDelMur = mur?.status ?? 'ready';
  const ambSistema = sistema.length > 0 && estatDelMur === 'ready';
  const feedPosts = useMemo(() => (ambSistema ? [...delMur, ...sistema] : delMur), [ambSistema, delMur, sistema]);
  const marketItems = mur?.marketItems || CAP;
  const events = mur?.events || CAP;
  /* La clau del poble, no l'objecte: la fitxa pot arribar com un objecte nou
     a cada pintada (buildDetailSectionMeta) i el càlcul no ha de repetir-se. */
  const id = textDe(poble?.id);
  const slug = textDe(poble?.slug);
  const nom = textDe(poble?.title || poble?.name);
  const elements = useMemo(
    () => publicacionsDelPoble({ feedPosts, marketItems, events }, { id, slug, title: nom }),
    [feedPosts, marketItems, events, id, slug, nom]
  );
  const estat = estatDelMur === 'ready' && paginesCarregant ? 'loading' : estatDelMur;
  const error = mur?.error ?? null;
  const refresh = typeof mur?.refresh === 'function' ? mur.refresh : null;
  return useMemo(() => ({ elements, estat, error, refresh }), [elements, estat, error, refresh]);
}
