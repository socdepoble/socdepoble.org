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
 *   · 'socdepoble' · Derogada (Gauntlet 261016_1530, Bloc 3.6.1: «PROHIBIT
 *     duplicar Sóc de Poble»). Era la via «En privat» de Comentar, el directe
 *     amb l'entitat. Ja no hi ha cap fila sintètica de Sóc de Poble: el seu
 *     actor és la comunitat (sections/xat/actorsDelXat.js), i un directe amb
 *     l'entitat només naix quan algú el demana («Nova conversa», «En privat»).
 *   · 'iaia' · el xat públic de la seua pàgina (/iaia), com el «Comentar» de
 *     la pàgina: /xat?sobre=pagina:%2Fiaia&titol=…&ruta=%2Fiaia. El primer
 *     missatge hi entra (xat_entra_al_fil_de_pagina).
 *     Gauntlet 261016 (Bloc 3.6.2, «la IAIA falla a localhost») · Era el camí
 *     de TOTS els modes. En llavor i en local el xat públic de /iaia és un
 *     grup on ningú no contesta (localXat només fa respondre el fil 'iaia'),
 *     i el directe és rutaDelXatDeLaIAIA, la mateixa porta de «Anar al xat»
 *     de /iaia. Ara la fila també hi va per eixa funció, amb el mode del xat.
 *   · 'javi' (Gauntlet 261016, Bloc 3.6.1) · el directe amb la persona de
 *     contacte. En llavor i en local, el seu id del padró (xatSeed.js), que
 *     localXat obri. En remot el servidor no declara quin compte és el seu
 *     (cap slug de persona: supabase/perfils.js) i pel nom s'obriria el xat
 *     amb qualsevol que es diga igual: no s'obri res i un avís ho diu.
 *     Auditoria adversarial 261016 · Esta via és per a qui té sessió. Qui no
 *     en té no arriba ací: la seua fila de Javi ja és el xat de només lectura
 *     amb el missatge automàtic (XatContext en llavor i en local,
 *     FakeChatOnboarding en remot; data/xatsPerDefecte.js · filDeMostraDeJavi).
 *     Com es declara el compte remot de Javi és decisió del Mestre.
 *     Gauntlet 261016_1530 (Bloc 3.6; MCR b36_xat, proposta 1) · Des que
 *     /xat/sdp-per-defecte:<clau> s'encamina per la clau (XatSection), un
 *     enllaç vell sí que hi pot portar qui no té sessió en remot: va al seu
 *     xat de només lectura (fake-javi), com la fila del xat de mostra.
 * És l'ÚNIC punt que canvia si el Mestre tria una altra via per a la IAIA.
 */
import { useNavigate } from '../../app/contexts/RouterContext';
import { useTraductorOpcional, tradueix } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import { objecteDePagina, rutaXatDePagina, rutaXatPrivat } from '../../config/objecteConnectable.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { PAGINES_AMB_XAT } from '../../data/contracte.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { ID_FIL_DE_MOSTRA_DE_JAVI } from '../../data/xatsPerDefecte.js';

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

/**
 * Gauntlet 261016 (Bloc 3.6.1) · On porta la fila de Javi Llinares en cada
 * mode de dades, o null en remot (vegeu la capçalera): el directe de la
 * llavor amb el seu id del padró, que creaFilDirecte troba o crea.
 */
export function rutaDelXatDeJavi(modeDades) {
  return MODES_LOCALS.has(modeDades) ? rutaXatPrivat({ id: AGENTS_MAP.JAVI.id }) : null;
}

/** [clau i18n, reserva] de l'avís de la fila de Javi quan el servidor no en
    declara el compte.
    Auditoria adversarial 261016 (P2) · Abans era el de SDP-XAT-016 («Esta
    persona no està disponible al xat.»), que el servidor reserva per a qui no
    ha donat el consentiment (supabase/xat.js): deia de Javi una cosa que no
    és la causa. Ara és el del contacte que encara no està connectat al xat
    del poble, el de FilaPersona, que ja és a les cinc llengües (i18n.js) i
    diu el que passa: este poble encara no sap quin compte és el seu. */
export const AVIS_JAVI_NO_DISPONIBLE = Object.freeze(['section.xat.padro.ajudaPendent', 'Este contacte encara no està connectat al xat del poble.']);

/**
 * (clau, { modeDades, senseSessio }) => void: obri el xat real de la fila
 * `clau` ('javi' | 'iaia'; Gauntlet 261016_1530: ja cap 'socdepoble').
 * `modeDades` i `senseSessio` són els de useXat(); sense, el remot amb
 * sessió, com abans. Una clau desconeguda no fa res.
 */
export default function useObriXatPerDefecte() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const t = useTraductorOpcional();
  return (clau, { modeDades = 'remote', senseSessio = false } = {}) => {
    if (clau === 'iaia') navigate(rutaDelXatDeLaIAIA(modeDades, senseSessio), { replace: true });
    else if (clau === 'javi') {
      if (senseSessio) {
        navigate(`/xat/${ID_FIL_DE_MOSTRA_DE_JAVI}`, { replace: true });
        return;
      }
      const ruta = rutaDelXatDeJavi(modeDades);
      if (ruta) {
        navigate(ruta, { replace: true });
        return;
      }
      showToast(tradueix(t, AVIS_JAVI_NO_DISPONIBLE), 'info');
      navigate('/xat', { replace: true });
    }
  };
}
