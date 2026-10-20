/**
 * paginaDestacada.js — la pàgina destacada de la columna dreta de /xat.
 *
 * Ordre del Mestre (261007) · Sense cap conversa oberta, la columna dreta de
 * /xat (en ample i en mitjà) és un espai destacat: l'administrador tria quina
 * pàgina de text s'hi mostra («El Xat», «L'Ànima de la IAIA», «El
 * Projecte»…). Es tria ACÍ i només ací: PAGINA_DESTACADA_DEL_XAT és la clau
 * d'una pàgina de src/sections/text/pageContent.js (o del pageCopy del
 * contingut core, que mana, com a TextRoute). Si la clau no existix, la
 * columna cau a 'anima', la de sempre (ordre del Mestre, 260927).
 *
 * Per a canviar-la, canvia només la constant: 'xat', 'anima', 'projecte',
 * 'constitucio', 'roadmap'… «L'Ànima de la IAIA» no es retira: la secció
 * 'ia' continua com era, ara a /anima (Gauntlet 261016_1530, Bloc 3.6.3), i
 * el xat públic de /iaia és el de la IAIA MarIA, la de la seua fitxa.
 *
 * Pur: sense React ni xarxa. Fase D (261020, L4) · I sense contingut: la
 * còpia local (PAGE_COPY) arriba per paràmetre, i només la carrega el
 * document destacat diferit de XatSection.jsx, que en estret no es munta mai.
 */
import { resolvePageSlugPath } from '../../config/navigation.js';

/** La pàgina que es mostra a la columna dreta de /xat. Canvia-la ací. */
export const PAGINA_DESTACADA_DEL_XAT = 'xat';

/** La de reserva quan la triada no existix: la de sempre. */
export const PAGINA_DESTACADA_DE_RESERVA = 'anima';

/* Claus sempre pròpies (Object.hasOwn): «constructor» no és cap pàgina. */
const propia = (taula, clau) => (taula && typeof taula === 'object' && Object.hasOwn(taula, clau) ? taula[clau] : null);

/**
 * { clau, pagina } de la pàgina destacada: la triada (`clau`, per defecte
 * PAGINA_DESTACADA_DEL_XAT) si existix i, si no, la de reserva. Primer el
 * `pageCopy` del contingut core i, de reserva, la `copiaLocal` (PAGE_COPY,
 * que dona qui la crida). null si no n'hi ha cap.
 */
export function paginaDestacada(pageCopy, clau = PAGINA_DESTACADA_DEL_XAT, copiaLocal = null) {
  for (const candidata of [clau, PAGINA_DESTACADA_DE_RESERVA]) {
    if (typeof candidata !== 'string' || !candidata) continue;
    const pagina = propia(pageCopy, candidata) || propia(copiaLocal, candidata);
    if (pagina) return { clau: candidata, pagina };
  }
  return null;
}

/**
 * Ordre del Mestre (261007), proposta P4 · La ruta d'una pàgina de text que el
 * lector de connexions sap resoldre (paginaDeText.js · paginaDeRuta): la
 * canònica si en té (resolvePageSlugPath: 'anima' → '/anima') i, si no,
 * /page/<clau> ('xat' → '/page/xat'). Connectar, des del document destacat,
 * desa esta ruta i no /xat, que no és cap pàgina.
 */
export function rutaDeLaPaginaDestacada(clau) {
  return resolvePageSlugPath(clau) || `/page/${encodeURIComponent(String(clau))}`;
}
