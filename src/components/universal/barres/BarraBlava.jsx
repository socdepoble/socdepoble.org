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
 *     Connectar es pinten igual però el clic va a onClickInoperatiu; T7 ·
 *     porten aria-disabled="true" i el clic diu quin botó és:
 *     onClickInoperatiu('comentar' | 'compartir' | 'connectar')) ·
 *   menuTraduir ({ obert, opcions, actual, onTria, onTanca } | null: el
 *     Traductor Sobirà, ordre del Mestre, 260930; el posa useAccions)
 *
 * Traductor Sobirà · Amb menuTraduir, Traduir diu que obri un menú
 * (aria-haspopup, aria-expanded) i, obert, el menú de llengües es pinta just
 * després del botó, dins del trio: l'ordre de tabulació passa per les
 * llengües abans de Comentar. Tancat, el trio té els tres botons de sempre
 * i cap píxel canvia fins que es prem Traduir (Llei del Píxel). El clic
 * continua anant a onTranslate: qui munta la barra decidix què fa.
 */
import { useRef } from 'react';
import {
  BackIcon, ForwardIcon, IndexIcon, TranslateIcon, CommentIcon, ShareIcon,
} from '../../PedraSeca/atoms/icones.jsx';
import { ActionControl, IconButton } from '../../PedraSeca/atoms/controls.jsx';
import { MenuTraduir } from '../traduccio/MenuTraduir.jsx';

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
  menuTraduir = null,
}) {
  const botoTraduir = useRef(null);
  const inoperativa = accionsInoperatives ? 'accio-inoperativa' : '';
  /* T7 (P7) · Inoperatius però enfocables i llegibles: aria-disabled, no
     `disabled` (patró de VistaEnConstruccio). El clic diu QUIN botó és, i qui
     munta la barra hi posa el missatge propi de cada un. */
  const ariaInoperatiu = accionsInoperatives ? 'true' : undefined;
  const clicDe = (accio, viu) => {
    if (!accionsInoperatives) return viu;
    return onClickInoperatiu ? () => onClickInoperatiu(accio) : null;
  };
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
          <IconButton label="Traduir" onClick={onTranslate} presentation refBoto={botoTraduir}
            ariaHaspopup={menuTraduir ? 'menu' : undefined}
            ariaExpanded={menuTraduir ? Boolean(menuTraduir.obert) : undefined}>
            <TranslateIcon className="icon" />
          </IconButton>
        )}
        {traduirVisible && menuTraduir?.obert ? (
          <MenuTraduir opcions={menuTraduir.opcions} actual={menuTraduir.actual}
            onTria={menuTraduir.onTria} onTanca={menuTraduir.onTanca} botoRef={botoTraduir} />
        ) : null}
        {comentarVisible && (
          <IconButton label={nomComentar} onClick={clicDe('comentar', onComment)} className={inoperativa} presentation ariaDisabled={ariaInoperatiu}>
            <CommentIcon className="icon" />
          </IconButton>
        )}
        {compartirVisible && (
          <IconButton label="Compartir" onClick={clicDe('compartir', onShare)} className={inoperativa} presentation ariaDisabled={ariaInoperatiu}>
            <ShareIcon className="icon" />
          </IconButton>
        )}
      </div>
      {connectarVisible && (
        <ActionControl className={`btn-connectar sp-card-connect ${inoperativa}`.trim()} label={connectLabel} onClick={clicDe('connectar', onConnect)} ariaDisabled={ariaInoperatiu}>
          <span className="sp-card-connect-text">{connectLabel}</span>
          <span className="sp-card-connect-plus" aria-hidden="true">+</span>
        </ActionControl>
      )}
    </header>
  );
}

export default BarraBlava;
