/**
 * La Nevera de Casa · l'app (export per defecte: RutaApps la carrega amb
 * lazy() dins de /app/nevera/*).
 *
 * Ordre del Mestre (261002, sinergies T4/T8): La Compra és la segona
 * intel·ligència de dades sobre el MATEIX esquelet visual que el TPV del bar.
 * Ací només hi ha:
 *   · el nucli (nucli/): què falta, què s'ha comprat, què hi ha a casa;
 *   · el magatzem local (magatzem.js): tot en este dispositiu, cap xarxa;
 *   · la taula de rutes (rutes.js) sobre ClosaAplicacio i l'esquelet comú;
 *   · dos diàlegs de l'app: «Llista nova» i les confirmacions.
 * Cap component de llista, de graella ni de targeta propi.
 *
 * La llista que es veu va al camí a totes les entrades (Clàusula dels Slugs).
 * Si el camí no en porta cap (l'enllaç de la barra de l'app) o en porta una
 * que ja no existix (fora de La compra, que ho diu), es canonitza amb replace
 * a la per defecte: l'última que esta pestanya ha tingut al camí o, si no,
 * la darrera desada. La darrera es desa quan canvia la llista del camí d'esta
 * pestanya, mai en rellegir el disc: sense Web Locks, dues pestanyes en
 * llistes diferents s'ho reescriurien l'una a l'altra sense fi.
 *
 * `magatzem` i `descarrega` només els passen les proves; RutaApps munta
 * l'app sense props i llavors es fa servir el navegador de veres.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { Carregant, DialegConfirmacio } from '../../components/PedraSeca/index.js';
import { ClosaAplicacio, useApp, useRutaApp } from '../plataforma/index.js';
import { creaMagatzemNevera } from './magatzem.js';
import { LIMITS, llistaPerId } from './nucli/index.js';
import { RUTES, titolsDe } from './rutes.js';
import { useNevera } from './useNevera.js';
import { COMPRA, ENTRADES_AMB_LLISTA } from './vistes/constants.js';
import { ContextNevera, llistaDeLaRuta, llistaDelCami } from './vistes/context.js';
import { DialegNovaLlista } from './vistes/DialegNovaLlista.jsx';

/* Descàrrega amb Blob i un enllaç temporal: res passa per cap servidor. */
function descarregaFitxer({ nom, tipus, dades }) {
  const url = URL.createObjectURL(new Blob([dades], { type: tipus || 'application/octet-stream' }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  /* Safari necessita que la URL visca un moment després del clic. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Els trams del camí de la ruta `patro` amb la llista `id`: al lloc de
   :llista o, si la ruta no en porta, just darrere de l'entrada. */
function tramsAmbLlista(patro, id) {
  const trams = patro.split('/');
  return trams.includes(':llista') ? trams.map((tram) => (tram === ':llista' ? id : tram)) : [trams[0], id, ...trams.slice(1)];
}

/* Per què «Crea la llista» no ha creat res: el diàleg ho diu i no es tanca. */
function motiuSenseLlistaNova({ estat, llegit, mode }) {
  if (!llegit) return 'Ara no es pot crear cap llista: les dades d’este dispositiu no s’han pogut llegir.';
  if (mode === 'lectora') return 'La nevera està oberta en una altra pestanya: crea la llista des d’allà.';
  if (estat.llistes.length >= LIMITS.llistes) return `Ja tens ${LIMITS.llistes} llistes: esborra’n una abans de crear-ne una altra.`;
  return 'No s’ha pogut crear la llista. Torna-ho a provar.';
}

export default function AppNevera({ magatzem: magatzemPropi = null, descarrega = descarregaFitxer }) {
  const [magatzem] = useState(() => magatzemPropi || creaMagatzemNevera());
  const nevera = useNevera(magatzem);
  const { estat, accions } = nevera;
  const { ruta } = useApp();
  const navigate = useNavigate();
  const { search } = useLocation();
  const coincidencia = useRutaApp(RUTES);
  const entrada = coincidencia ? coincidencia.ruta.path.split('/')[0] : null;
  const delCami = coincidencia ? llistaDelCami(coincidencia.params) : null;
  const [novaLlista, setNovaLlista] = useState(false);
  const [confirmacio, setConfirmacio] = useState(null);

  /* L'última llista que esta pestanya ha tingut al camí (estat que es deriva
     de la URL en pintar, sense efecte: el patró de React per a ajustar l'estat
     quan canvia una entrada). */
  const [llistaPestanya, setLlistaPestanya] = useState(null);
  if (estat && delCami && delCami !== llistaPestanya && llistaPerId(estat, delCami)) setLlistaPestanya(delCami);
  const perDefecte = estat ? (llistaPerId(estat, llistaPestanya) ? llistaPestanya : estat.darreraLlista) : null;

  /* La darrera llista es desa una vegada per cada canvi de la del camí. */
  const desadaRef = useRef(null);
  useEffect(() => {
    if (!estat || !llistaPestanya || desadaRef.current === llistaPestanya) return;
    desadaRef.current = llistaPestanya;
    if (llistaPestanya !== estat.darreraLlista) accions.triaLlista(llistaPestanya);
  }, [estat, llistaPestanya, accions]);

  /* El camí canònic, si el d'ara no ho és (replace: l'historial no guanya cap pas). */
  let canonic = null;
  if (estat && coincidencia && ENTRADES_AMB_LLISTA.includes(entrada)) {
    const valida = delCami !== null && (llistaPerId(estat, delCami) || entrada === COMPRA.entrada);
    if (!valida) canonic = `${ruta(...tramsAmbLlista(coincidencia.ruta.path, perDefecte))}${search ? `?${search}` : ''}`;
  }
  useEffect(() => {
    if (canonic) navigate(canonic, { replace: true });
  }, [canonic, navigate]);

  const obriNovaLlista = useCallback(() => setNovaLlista(true), []);
  const valor = useMemo(() => (estat ? {
    ...nevera,
    ruta,
    llistaDe: (params) => llistaDeLaRuta(estat, params, perDefecte),
    llistaVigent: (params) => llistaDeLaRuta(estat, params, perDefecte) || llistaPerId(estat, perDefecte),
    obriNovaLlista,
    demanaConfirmacio: setConfirmacio,
    descarrega
  } : null), [nevera, estat, ruta, perDefecte, obriNovaLlista, descarrega]);

  if (!valor) return <Carregant etiqueta="Obrint la nevera…" />;

  return (
    <ContextNevera.Provider value={valor}>
      <ClosaAplicacio rutes={RUTES} titols={titolsDe(entrada)} />
      <DialegNovaLlista
        obert={novaLlista}
        onTanca={() => setNovaLlista(false)}
        onCrea={(nom) => {
          const id = accions.creaLlista(nom);
          if (!id) return motiuSenseLlistaNova(nevera);
          setNovaLlista(false);
          navigate(ruta(COMPRA.entrada, id));
          return null;
        }}
      />
      <DialegConfirmacio
        obert={Boolean(confirmacio)}
        destructiu
        titol={confirmacio?.titol || ''}
        descripcio={confirmacio?.descripcio}
        etiquetaConfirma={confirmacio?.etiquetaConfirma || 'Confirma'}
        etiquetaCancela="Cancel·la"
        onTanca={() => setConfirmacio(null)}
        onConfirma={() => {
          confirmacio?.accio?.();
          setConfirmacio(null);
        }}
      />
    </ContextNevera.Provider>
  );
}
