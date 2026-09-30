/**
 * ConnexioFitxa.jsx — T71 · La fitxa d'una connexió («Connectats») al
 * llistat del Bloc. D4 (excepció del Mestre, 260930) · La connexió és una
 * còpia editable (s'obri amb NotesEditor), però la fitxa continua sent la
 * compacta de lectura: la del gestor, no un editor.
 *
 *   · Compacta, amb la forma de PublicacioFitxa (T1): el botó de sempre del
 *     gestor, amb aria-current quan és la triada. Mai la targeta viva de
 *     l'editor (TargetaViva), que signaria amb qui mira (el Foraster sense
 *     sessió), ompliria els buits amb els textos de llavor i diria que és la
 *     previsualització del Mur. NotaFitxa no es toca (lliçó core-edicio-segura).
 *   · Revisió de D4 (260930) · El títol i l'emoticona són els de la NOTA
 *     quan en té (el que la persona ha reanomenat o triat, el mateix que el
 *     rail i l'editor): si no, la fitxa diria «Samarreta» després de
 *     reanomenar-la i pareixeria que l'edició no s'ha desat. Les dades de
 *     l'ORIGINAL resolt (detail/elementDeSeccio.js · useOriginalDeConnexio)
 *     són la caiguda del títol i les de l'autoria: imatge, autor, subtítol o
 *     entradilla i la data de lectura (sdp-pedra-seca §10: creació, o
 *     l'última versió si és posterior). Mai les que l'URL de Connectar va
 *     deixar a l'origen.
 *   · Sense l'original (perfil, pàgina amb query, element retirat), el que
 *     recorda la connexió: el títol desat i qui la signa sense inventar-lo
 *     (connexions.js · signaturaDeCaiguda), o QUÈ és si no se sap. La data
 *     és la de la connexió desada.
 *   · Cap ploma per defecte: sense emoticona triada ni imatge, el glif de la
 *     carpeta.
 */
import { ItemMedia } from '../../components/universal/workspace/ItemMedia.jsx';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { emojiSol } from '../../utils/emoji.js';
import { useOriginalDeConnexio } from '../detail/elementDeSeccio.js';
import { ETIQUETA_OBJECTE } from '../connectar/abastConnexio.js';
import { signaturaDeCaiguda } from './connexions.js';

const text = (valor) => extractPlainText(valor || '', Infinity).trim();

export function ConnexioFitxa({ item, active, onSelect }) {
  const nota = item?.data || {};
  const origen = nota.origen || {};
  const { targeta } = useOriginalDeConnexio(origen);

  const titol = text(nota.title) || text(targeta?.titol) || text(origen.titol) || 'Element connectat';
  const emoticona = emojiSol(nota.icon) || undefined;
  const autor = targeta ? targeta.autor.nom : signaturaDeCaiguda(origen)?.nom;
  const extracte = targeta ? (text(targeta.subtitol) || text(targeta.entradilla)) : '';
  const peu = [autor ? `De ${autor}` : (ETIQUETA_OBJECTE[origen.objecte] || 'Element connectat'), extracte]
    .filter(Boolean)
    .join(' · ');
  const data = targeta?.data?.date ? targeta.data : dataHoraDeBarra({ creat: nota.createdAt, modificat: nota.updatedAt });

  return (
    <button
      type="button"
      className="sdp-gestor-fitxa"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <ItemMedia item={{ ...item, title: titol, image: targeta?.imatge || '', icon: emoticona }} titleFallback={titol} />
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-nota-fitxa__capcalera">
          <span className="sdp-gestor-fitxa__titol">{titol}</span>
          {data.date ? (
            <time className="sdp-nota-fitxa__data" dateTime={data.dateTime || undefined}>{data.date}</time>
          ) : null}
        </span>
        <span className="sdp-gestor-fitxa__subtitol">{peu}</span>
      </span>
    </button>
  );
}

export default ConnexioFitxa;
