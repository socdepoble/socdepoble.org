/**
 * LlistaConverses.jsx — la llista de Xats amb els seus estats buits.
 * Filtrar, agrupar i cercar és cosa de qui la munta: ací només es pinta el
 * que arriba.
 *
 * Onada 3 (T67, T68): cada element de `files` és una conversa
 * ({ clau, tipus: 'fil', fil }) o una comunitat sencera
 * ({ clau, tipus: 'comunitat', comunitat }), que és UNA fila i obri la seua
 * fitxa. Amb `seleccio` ({ triades: Set de claus, onAlterna(clau) }) cada fila
 * és una casella. `fils` (una llista de converses soltes) es conserva per als
 * muntatges que encara no agrupen. Cada <li> porta la seua `data-clau`: en
 * tornar de la fitxa d'una comunitat, XatSection hi torna el focus.
 *
 * Torn 260930 (T1) · Una fila { tipus: 'poble', poble } és el grup del poble
 * de l'amfitrió que encara no existix a les dades (pobleAmfitrio.js): la pinta
 * FilaPoble i `onObriPoble(poble)` l'obri.
 *
 * Onada 6 (beta testers) · `peu`: un node que va darrere de la llista, FORA
 * de la <ul> (no és cap conversa: el lector de pantalla no el compta com a
 * fila). El porta «Informa d'un error». Revisió 261009 · També es pinta
 * davall de l'avís d'una llista que no s'ha pogut carregar i de l'estat buit:
 * és just quan cal informar de l'error. Mentre carrega, no. En compacte la
 * reserva de la barra mòbil passa de la llista al peu (sdp-xat-llista--amb-peu,
 * modules.css), i el botó queda per damunt de la barra. Sense `peu`, la
 * llista de sempre.
 *
 * Gauntlet 261016_1530 (Bloc 3.6; actorsDelXat.js) · Una fila
 * { tipus: 'entitat', entitat } és la comunitat de Sóc de Poble que encara
 * no és a la llista: la pinta FilaPoble amb el nom i la cara de l'entitat, i
 * `onObriEntitat(entitat)` hi porta. Sense eixa fila, la llista de sempre.
 *
 * Ordre del Mestre (261026_2126; pla 261026_2130, P1-36) · El «…» de la fila
 * de títol (MenuLlista, «Seleccionar xats») s'ha retirat: la selecció s'obri
 * amb una pulsació llarga sobre una fila, com a les apps de missatgeria. És
 * el camí de Pedra Seca (usePulsacioLlarga, pulsacioLlarga.js: el de les
 * rajoles i les targetes): el dit o el ratolí mantinguts mig segon, i quiets;
 * el menú contextual (botó dret, i la pulsació llarga d'Android); i Maj+F10 o
 * la tecla de menú sobre la fila enfocada. `onSelecciona(clau)` hi entra amb
 * eixa fila ja triada. Només les files triables (esFilaTriable): mai la del
 * poble, la de l'entitat ni les d'ajuda per defecte, que tampoc no es pinten
 * mentre se seleccionen xats. Ja dins de la selecció, la pulsació llarga no
 * fa res i el clic que la seguix, tampoc: a Android, amb el retard llarg
 * d'accessibilitat, el menú contextual arriba després del temporitzador i no
 * ha de desfer la tria. La pista per al lector de pantalla
 * (section.xat.seleccio.pista) va FORA de la <ul>, davant, i la descriu cada
 * fila triable, amb la drecera a aria-keyshortcuts; sense cap fila triable,
 * no es pinta. Sense `onSelecciona`, la llista de sempre.
 */
import { useCallback, useId } from 'react';
import { usePulsacioLlarga } from '../../../components/PedraSeca/organismes/pulsacioLlarga.js';
import FilaConversa, { FilaComunitat } from './FilaConversa.jsx';
import FilaPoble from './FilaPoble.jsx';

const sensePortar = () => {};

/** Una fila que «Seleccionar xats» pot triar: una conversa o una comunitat,
 *  mai la fila virtual del poble, la que porta a l'entitat ni una d'ajuda
 *  per defecte (no són converses i no tenen res a marcar). */
export function esFilaTriable(fila) {
  return Boolean(fila) && fila.tipus !== 'poble' && fila.tipus !== 'entitat' && !fila.fil?.perDefecte;
}

export default function LlistaConverses({
  files = null, fils = [], filActiuId = null, onSelect, onObriComunitat, onObriPoble = null, onObriEntitat = null, locale, t,
  estatBuit = null, avis = null, carregant = false, seleccio = null, joId = null, peu = null, onSelecciona = null
}) {
  const idPista = useId();
  const ambPulsacio = typeof onSelecciona === 'function';
  /* Dins de la selecció, la pulsació llarga no fa res (vegeu la capçalera). */
  const enPulsacio = useCallback((clau) => { if (!seleccio) onSelecciona?.(clau); }, [seleccio, onSelecciona]);
  const premuda = usePulsacioLlarga(ambPulsacio ? enPulsacio : null);
  const llista = Array.isArray(files) ? files : fils.map((fil) => ({ clau: String(fil.id), tipus: 'fil', fil }));
  const peuDeLaLlista = peu ? <div className="sdp-xat-llista__peu">{peu}</div> : null;
  if (avis) {
    return (
      <>
        <div className="sdp-workspace-state" role="alert">
          <strong>{t('section.xat.error.llista', "No s'ha pogut carregar el xat")}</strong>
          <p>{avis}</p>
        </div>
        {peuDeLaLlista}
      </>
    );
  }
  if (!llista.length) {
    if (carregant) {
      return <p className="sdp-workspace-state" role="status" aria-live="polite">{t('section.xat.carregant', 'Carregant…')}</p>;
    }
    return (
      <>
        <div className="sdp-workspace-state" role="status">{estatBuit}</div>
        {peuDeLaLlista}
      </>
    );
  }
  const triaDe = (clau) => (seleccio
    ? { triada: seleccio.triades.has(clau), onAlterna: () => seleccio.onAlterna(clau) }
    : null);
  /* P1-36 (261026_2126) · La pista només es pinta si alguna fila la pot
     complir: amb només files no triables (el poble, l'entitat o les d'ajuda
     d'una llista nova), cap instrucció que cap fila no suporta. Les files la
     descriuen (aria-describedby) només quan existix. */
  const ambPista = ambPulsacio && !seleccio && llista.some(esFilaTriable);
  const premudaDe = (fila) => (ambPulsacio && esFilaTriable(fila)
    ? { ...premuda(fila.clau), pista: ambPista ? idPista : null }
    : null);
  return (
    <>
      {ambPista ? (
        <p id={idPista} className="sdp-nomes-lector">
          {t('section.xat.seleccio.pista', 'Mantín premuda una conversa, fes clic amb el botó dret o prem Maj+F10 per a seleccionar xats.')}
        </p>
      ) : null}
      <ul className={peu ? 'sdp-xat-llista sdp-xat-llista--amb-peu' : 'sdp-xat-llista'} aria-label={t('section.xat.llista.titol', 'Converses')}>
        {llista.map((fila) => (
          <li key={fila.clau} data-clau={fila.clau}>
            {fila.tipus === 'poble' ? (
              <FilaPoble poble={fila.poble} onObri={onObriPoble || (() => {})} t={t} />
            ) : fila.tipus === 'entitat' ? (
              <FilaPoble
                poble={fila.entitat}
                nom={fila.entitat.nom}
                avatar={fila.entitat.avatar || null}
                etiqueta={t('section.xat.comunitat.etiqueta', 'Comunitat')}
                clau={fila.clau}
                onObri={onObriEntitat || sensePortar}
                t={t}
              />
            ) : fila.tipus === 'comunitat' ? (
              <FilaComunitat comunitat={fila.comunitat} onObri={onObriComunitat} t={t} seleccio={triaDe(fila.clau)} premuda={premudaDe(fila)} />
            ) : (
              <FilaConversa
                fil={fila.fil}
                activa={filActiuId != null && String(fila.fil.id) === String(filActiuId)}
                onSelect={onSelect}
                locale={locale}
                t={t}
                joId={joId}
                seleccio={triaDe(fila.clau)}
                premuda={premudaDe(fila)}
              />
            )}
          </li>
        ))}
      </ul>
      {peuDeLaLlista}
    </>
  );
}
