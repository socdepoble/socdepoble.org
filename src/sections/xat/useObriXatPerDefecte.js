/**
 * useObriXatPerDefecte.js — Ordre del Mestre (261007) · On porta una fila
 * d'ajuda per defecte del Xat (Conversa.perDefecte, data/xatsPerDefecte.js).
 *
 * Una fila sintètica no és cap fil: no s'obri amb obriFil (xat_historial
 * rebutjaria el seu id i l'avís taparia la llista). XatSection la detecta en
 * UN sol punt (/xat/sdp-per-defecte:<clau>, vinga de la llista, de la cerca
 * del xat, de la cerca global, de l'historial o d'un enllaç) i crida esta
 * funció una sola vegada. Les dues vies naveguen amb `replace`: la ruta de pas
 * no queda a l'historial, i la fletxa enrere torna a la llista.
 *   · 'socdepoble' · la via «En privat» de Comentar (useComentaEnPrivat de
 *     Pedra Seca): el missatge directe amb l'entitat, /xat?amb=<id>, resolt
 *     una vegada per a tota l'app (en llavor, XAT_SOCDEPOBLE_DE_LLAVOR). En
 *     arribar, l'efecte ?amb= de XatSection crida creaFil, que obri (o troba:
 *     crea_fil_directe és idempotent) la conversa real abans de cap missatge,
 *     i porta a /xat/<filId>. Quan la llista la torna, la fila sintètica se
 *     n'ix (jaTeElXat, data/xatsPerDefecte.js).
 *   · 'iaia' · el xat públic de la seua pàgina (/iaia), com el «Comentar» de
 *     la pàgina: /xat?sobre=pagina:%2Fiaia&titol=…&ruta=%2Fiaia. El primer
 *     missatge hi entra (xat_entra_al_fil_de_pagina).
 * És l'ÚNIC punt que canvia si el Mestre tria una altra via per a la IAIA.
 */
import { useNavigate } from '../../app/contexts/RouterContext';
import { useComentaEnPrivat } from '../../components/PedraSeca/hooks/useAccions.js';
import { objecteDePagina, rutaXatDePagina } from '../../config/objecteConnectable.js';
import { PAGINES_AMB_XAT } from '../../data/contracte.js';

/** La ruta del xat públic de la pàgina de la IAIA, amb el títol del contracte. */
export const RUTA_XAT_DE_LA_IAIA = rutaXatDePagina(objecteDePagina({ titol: PAGINES_AMB_XAT['/iaia'], ruta: '/iaia' }));

/** (clau) => void: obri el xat real de la fila d'ajuda `clau` ('socdepoble' | 'iaia'). */
export default function useObriXatPerDefecte() {
  const navigate = useNavigate();
  const comentaEnPrivat = useComentaEnPrivat();
  return (clau) => {
    if (clau === 'socdepoble') comentaEnPrivat({ replace: true });
    else if (clau === 'iaia') navigate(RUTA_XAT_DE_LA_IAIA, { replace: true });
  };
}
