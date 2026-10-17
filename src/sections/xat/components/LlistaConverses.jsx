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
 */
import FilaConversa, { FilaComunitat } from './FilaConversa.jsx';
import FilaPoble from './FilaPoble.jsx';

const sensePortar = () => {};

export default function LlistaConverses({
  files = null, fils = [], filActiuId = null, onSelect, onObriComunitat, onObriPoble = null, onObriEntitat = null, locale, t,
  estatBuit = null, avis = null, carregant = false, seleccio = null, joId = null, peu = null
}) {
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
  return (
    <>
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
              <FilaComunitat comunitat={fila.comunitat} onObri={onObriComunitat} t={t} seleccio={triaDe(fila.clau)} />
            ) : (
              <FilaConversa
                fil={fila.fil}
                activa={filActiuId != null && String(fila.fil.id) === String(filActiuId)}
                onSelect={onSelect}
                locale={locale}
                t={t}
                joId={joId}
                seleccio={triaDe(fila.clau)}
              />
            )}
          </li>
        ))}
      </ul>
      {peuDeLaLlista}
    </>
  );
}
