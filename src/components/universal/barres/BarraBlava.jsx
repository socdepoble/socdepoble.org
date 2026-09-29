/**
 * BarraBlava.jsx — La barra blava de navegació de pàgina: el component pare.
 *
 * T51 (ordre del Mestre, 260928) · Extreta de PageFrame (fase B1 de T52) amb
 * el MATEIX DOM, T53 inclòs: la pinten PageFrame i l'espècimen del catàleg,
 * que abans en feia una còpia a mà. Presentacional: qui la munta (PageFrame,
 * amb useAccions) decidix què es veu i què fa cada botó.
 *   [Arrere · Índex · Endavant] [Traduir · Comentar · Compartir] … [CONNECTAR]
 * La graella de tres columnes (T37) i els passos per amplària de barra (T20,
 * T53) són a components.css.
 *
 * CONTRACTE
 *   onBack · onForward (sense, la fletxa no es pinta) · onIndex ·
 *   traduirVisible · comentarVisible · compartirVisible · connectarVisible ·
 *   onTranslate · onComment · onShare · onConnect · connectLabel ·
 *   comentarXat ('comu' | 'directe' | null: el nom de Comentar, T63.2) ·
 *   accionsInoperatives + onClickInoperatiu (T36: Comentar, Compartir i
 *     Connectar es pinten igual però el clic va a onClickInoperatiu)
 */
import {
  BackIcon, ForwardIcon, IndexIcon, TranslateIcon, CommentIcon, ShareIcon,
} from '../../PedraSeca/atoms/icones.jsx';
import { ActionControl, IconButton } from '../../PedraSeca/atoms/controls.jsx';

/* T63.2 (doctrina del Mestre, 260928) · El nom accessible (i el title) de
   Comentar diu on porta: el xat comú de la Pàgina Universal o, per a una
   persona o una IA, el missatge directe. Sense saber-ho (un handler propi o
   l'editor, inoperatiu), només «Comentar»: mai un xat que no existix. */
export const NOMS_COMENTAR = Object.freeze({
  comu: 'Comentar al xat comú',
  directe: 'Comentar per missatge directe',
});
const COMENTAR = 'Comentar';

export function BarraBlava({
  onBack, onForward, onIndex,
  traduirVisible = false, comentarVisible = false, compartirVisible = false, connectarVisible = false,
  onTranslate, onComment, onShare, onConnect,
  connectLabel = 'Connectar',
  comentarXat = null,
  accionsInoperatives = false, onClickInoperatiu = null,
}) {
  const inoperativa = accionsInoperatives ? 'accio-inoperativa' : '';
  const nomComentar = NOMS_COMENTAR[comentarXat] || COMENTAR;
  return (
    <header className="bar-blue">
      <div className="bar-blue-left">
        {onBack && (
          <IconButton label="Tornar arrere" onClick={onBack} className="bar-blue-left__arrere" presentation>
            <BackIcon className="icon" />
          </IconButton>
        )}
        {/* Ordre del Mestre (260924): el Llibre (índex) entre les dues fletxes.
            L'ordre de tabulació seguix el visual. */}
        <IconButton label="Índex de secció" onClick={onIndex} presentation>
          <IndexIcon className="icon" />
        </IconButton>
        {onForward && (
          <IconButton label="Tornar endavant" onClick={onForward} className="bar-blue-left__endavant" presentation>
            <ForwardIcon className="icon" />
          </IconButton>
        )}
      </div>
      <div className="sp-card-actions">
        {traduirVisible && (
          <IconButton label="Traduir" onClick={onTranslate} presentation>
            <TranslateIcon className="icon" />
          </IconButton>
        )}
        {comentarVisible && (
          <IconButton label={nomComentar} onClick={accionsInoperatives ? onClickInoperatiu : onComment} className={inoperativa} presentation>
            <CommentIcon className="icon" />
          </IconButton>
        )}
        {compartirVisible && (
          <IconButton label="Compartir" onClick={accionsInoperatives ? onClickInoperatiu : onShare} className={inoperativa} presentation>
            <ShareIcon className="icon" />
          </IconButton>
        )}
      </div>
      {connectarVisible && (
        <ActionControl className={`btn-connectar sp-card-connect ${inoperativa}`.trim()} label={connectLabel} onClick={accionsInoperatives ? onClickInoperatiu : onConnect}>
          <span className="sp-card-connect-text">{connectLabel}</span>
          <span className="sp-card-connect-plus" aria-hidden="true">+</span>
        </ActionControl>
      )}
    </header>
  );
}

export default BarraBlava;
