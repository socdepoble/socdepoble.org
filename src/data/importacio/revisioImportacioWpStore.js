/**
 * revisioImportacioWpStore.js — IDEA-125 · La revisió editorial d'un article
 * importat de WordPress, compartida entre el Banc d'Importació
 * (BancImportacioEditorial, a «Administració del sistema») i la fitxa de
 * revisió de l'«Edició avançada» del Bloc de notes (FitxaRevisioImportacioWp).
 *
 * No és una segona font de veritat: l'estat continua en el registre de
 * utils/revisioEditorialWp.js (localStorage, clau CLAU_STORAGE_REVISIO_WP) i
 * el desament continua sent desaRevisioArticleImportatAmbServidor, amb el
 * mateix CAS (actualitzatEsperat) i la mateixa autoria i destí que el Banc.
 * Este mòdul només avisa qui l'escolta:
 *  · quan una vista d'esta pestanya desa per ací (desaRevisio) o ha
 *    sincronitzat amb el servidor (notificaRevisio);
 *  · quan una altra pestanya canvia el registre (l'esdeveniment 'storage' de
 *    la finestra, filtrat per la clau).
 * Una escriptura que no passa per ací (per exemple, la fitxa del detall del
 * Mur) no avisa fins que la vista es torna a pintar.
 */
import { useMemo, useSyncExternalStore } from 'react';
import {
  CLAU_STORAGE_REVISIO_WP,
  desaRevisioArticleImportatAmbServidor,
  estatInicialArticleImportatWp,
  llegeixEstatRevisioEditorial
} from '../../utils/revisioEditorialWp.js';

/** L'insígnia de cada estat, la mateixa al Banc i a la fitxa del Bloc de notes. */
export const ETIQUETES_ESTAT_REVISIO_WP = Object.freeze({
  pendent_admin: Object.freeze({ label: '⏳ Pendent de revisió', to: 'avis' }),
  aprovat: Object.freeze({ label: '✅ Revisió aprovada', to: 'exit' }),
  amb_observacions: Object.freeze({ label: '📝 Amb observacions', to: 'primari' })
});

const oients = new Set();
let versioStore = 0;
let escoltaFinestra = null;

/** Avisa totes les vistes subscrites que el registre ha canviat. */
export function notificaRevisio() {
  versioStore += 1;
  for (const oient of [...oients]) {
    try { oient(); } catch { /* una vista que falla no deixa les altres sense avís */ }
  }
}

function enStorage(event) {
  if (event?.key === CLAU_STORAGE_REVISIO_WP || event?.key === null) notificaRevisio();
}

/** Subscriu una funció als canvis del registre. Torna la funció per a donar-se de baixa. */
export function subscriu(fn) {
  if (typeof fn !== 'function') return () => {};
  oients.add(fn);
  if (!escoltaFinestra && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    escoltaFinestra = enStorage;
    window.addEventListener('storage', escoltaFinestra);
  }
  return () => {
    oients.delete(fn);
    if (oients.size === 0 && escoltaFinestra && typeof window !== 'undefined') {
      window.removeEventListener('storage', escoltaFinestra);
      escoltaFinestra = null;
    }
  };
}

/** L'estat de revisió d'un article, amb el mateix estat per defecte que el Banc. */
export function llegeixRevisio(wpId, storage) {
  const id = String(wpId ?? '').trim();
  const registre = llegeixEstatRevisioEditorial(storage);
  return {
    estat: registre.estats?.[id] || estatInicialArticleImportatWp(id),
    nota: registre.anotacions?.[id] ?? '',
    versio: registre.versions?.[id] ?? null
  };
}

/**
 * L'autoria i el destí que el Banc envia per a un article (BancImportacioEditorial,
 * canviaEstatArticle): `author` i `destinacio_workspace || verticalProposada` de l'article
 * llegit amb el registre. Sense estos camps, l'adaptador del servidor posaria 'Sóc de Poble' i
 * 'mur' i la RPC amb CAS sobreescriuria els de la fila. El catàleg s'importa a demanda perquè
 * el Bloc de notes no el carregue fins que algú desa una revisió.
 */
async function autoriaIDestiDeLArticle(wpId, storage) {
  try {
    const { lligCorpusImportatCompletAmbRevisio } = await import('../../utils/transformadorEditorialWpBlogger.js');
    const id = String(wpId ?? '').trim();
    const item = lligCorpusImportatCompletAmbRevisio(storage).find((a) => String(a.wp_id) === id);
    return {
      autoria: item?.author || undefined,
      desti: item?.destinacio_workspace || item?.verticalProposada || undefined
    };
  } catch {
    return {};
  }
}

/**
 * Desa l'estat i la nota pel camí de sempre (local primer i, si el backend té
 * la capacitat, el servidor amb CAS) i avisa les vistes. L'autoria i el destí que
 * el cridador no passa (la fitxa del Bloc de notes) es completen amb els de
 * l'article, els mateixos que envia el Banc. Torna el resultat de
 * desaRevisioArticleImportatAmbServidor sense tocar-lo: { remot, conflicte, … }.
 */
export async function desaRevisio(wpId, { estat, nota = '', autoria, desti } = {}, opcions = {}) {
  const article = autoria === undefined || desti === undefined
    ? await autoriaIDestiDeLArticle(wpId, opcions?.storage)
    : {};
  const resultat = desaRevisioArticleImportatAmbServidor(wpId, {
    estat, nota, autoria: autoria ?? article.autoria, desti: desti ?? article.desti
  }, opcions);
  /* La còpia local s'escriu abans de l'espera del servidor: les vistes la veuen ja. */
  notificaRevisio();
  try {
    return await resultat;
  } finally {
    notificaRevisio();
  }
}

const versioActual = () => versioStore;

/** La revisió viva d'un article per a una vista de React. */
export function useRevisioImportacioWp(wpId) {
  const versio = useSyncExternalStore(subscriu, versioActual, versioActual);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => llegeixRevisio(wpId), [wpId, versio]);
}
