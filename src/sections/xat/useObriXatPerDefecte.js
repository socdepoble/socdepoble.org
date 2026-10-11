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
import { objecteDePagina, rutaXatDePagina, rutaXatPrivat } from '../../config/objecteConnectable.js';
import { PAGINES_AMB_XAT } from '../../data/contracte.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';

/** La ruta del xat públic de la pàgina de la IAIA, amb el títol del contracte. */
export const RUTA_XAT_DE_LA_IAIA = rutaXatDePagina(objecteDePagina({ titol: PAGINES_AMB_XAT['/iaia'], ruta: '/iaia' }));

/* Els modes sense servidor de dades, com a data/supabase/perfils.js. */
const MODES_LOCALS = new Set(['seed', 'local']);

/**
 * Onada 10 (261010; decisió del Mestre del 261010) · Per on s'entra al xat de
 * la IAIA des de FORA del Xat (el botó «Anar al xat» de /iaia): la mateixa
 * conversa que obri la fila «IAIA MarIA» de la llista, en cada mode de dades
 * (`modeDades` és el de useXat()).
 *   · remot · la fila és la d'ajuda per defecte, que porta a
 *     RUTA_XAT_DE_LA_IAIA, o el xat públic de /iaia ja obert, que és eixe
 *     mateix fil amb el seu nom (vestixLaIAIA, data/xatsPerDefecte.js);
 *   · llavor i local · la fila és el fil 'iaia' (el de data/xatSeed.js, o el
 *     que crea «Parla amb la IAIA»): el directe de sempre, /xat?amb=<id>, que
 *     creaFilDirecte troba o crea (data/localXat.js). Allí el xat públic de la
 *     pàgina és un altre xat, i la IAIA no hi contesta.
 * Un mode desconegut va per la via del remot. Pura: no navega ni obri cap
 * fil; XatSection resol totes dues rutes amb els efectes de sempre (?amb= i
 * ?sobre=). Si el Mestre tria una altra via per a la IAIA, canvia ací, amb la
 * constant de dalt.
 *
 * Revisió de l'Onada 10 (261010) · «La mateixa conversa que la fila» val AMB
 * sessió. En remot i sense sessió, la fila «IAIA MarIA» que veu el convidat
 * és la conversa de mostra (FakeChatOnboarding, 'fake-iaia'); amb només el
 * mode de dades, esta funció tornava igualment RUTA_XAT_DE_LA_IAIA i l'efecte
 * ?sobre= de XatSection portava el convidat a l'entrada (rutaDEntrada), com el
 * «Comentar» de /iaia, i després d'entrar a la pròpia identitat
 * (RUTA_DESPRES_D_ENTRAR), no al xat.
 * Onada 11 (261010; prompt 261010_1730, tasca 6, D2) · Decisió del Mestre: el
 * convidat va a la conversa de mostra, la mateixa fila que veu a la llista.
 * `senseSessio` és el de useXat() (remot sense sessió, ja comprovat); en
 * llavor i en local sempre hi ha joId i no canvia res.
 */
/** El fil de mostra de la IAIA per a qui entra sense sessió (FakeChatOnboarding.jsx · fakeThreads). */
export const ID_FIL_DE_MOSTRA_DE_LA_IAIA = 'fake-iaia';
/** La ruta d'eixa conversa de mostra. */
export const RUTA_XAT_DE_MOSTRA_DE_LA_IAIA = `/xat/${ID_FIL_DE_MOSTRA_DE_LA_IAIA}`;

export function rutaDelXatDeLaIAIA(modeDades, senseSessio = false) {
  if (MODES_LOCALS.has(modeDades)) return rutaXatPrivat({ id: IAIA_ID });
  return senseSessio ? RUTA_XAT_DE_MOSTRA_DE_LA_IAIA : RUTA_XAT_DE_LA_IAIA;
}

/** (clau) => void: obri el xat real de la fila d'ajuda `clau` ('socdepoble' | 'iaia'). */
export default function useObriXatPerDefecte() {
  const navigate = useNavigate();
  const comentaEnPrivat = useComentaEnPrivat();
  return (clau) => {
    if (clau === 'socdepoble') comentaEnPrivat({ replace: true });
    else if (clau === 'iaia') navigate(RUTA_XAT_DE_LA_IAIA, { replace: true });
  };
}
