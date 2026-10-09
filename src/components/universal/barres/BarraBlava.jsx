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
 *   comentarXat ('comu' | 'privat' | null: el menú de Comentar, ordre del
 *     Mestre, 261007; el posa useAccions) · comentarPrivatAmb (Onada 8: el
 *     nom de l'autor amb qui obri el xat «En privat», o null) ·
 *   accionsInoperatives + onClickInoperatiu (T36: Comentar, Compartir i
 *     Connectar es pinten igual però el clic va a onClickInoperatiu; T7 ·
 *     porten aria-disabled="true" i el clic diu quin botó és:
 *     onClickInoperatiu('comentar' | 'compartir' | 'connectar')) ·
 *   menuTraduir ({ obert, opcions, actual, onTria, onTanca } | null: el
 *     Traductor Sobirà, ordre del Mestre, 260930; el posa useAccions) ·
 *   indexControla (l'id del diàleg de l'Índex obert: ordre del Mestre,
 *     261004, integració final; el posa PageFrame mentre l'Índex propi és
 *     obert. Sense, el botó no porta aria-controls i el marcatge és el de
 *     sempre)
 *
 * Traductor Sobirà · Amb menuTraduir, Traduir diu que obri un menú
 * (aria-haspopup, aria-expanded) i, obert, el menú de llengües es pinta just
 * després del botó, dins del trio: l'ordre de tabulació passa per les
 * llengües abans de Comentar. Tancat, el trio té els tres botons de sempre
 * i cap píxel canvia fins que es prem Traduir (Llei del Píxel). El clic
 * continua anant a onTranslate: qui munta la barra decidix què fa.
 *
 * Ordre del Mestre (261007) · «COMENTARIS = XAT» · No hi ha fil de comentaris
 * davall de cap publicació: el debat és un xat. Comentar obri un menú amb dues
 * vies, el MATEIX patró que el de Traduir (MenuComentar, just després del
 * botó, dins del trio):
 *   · «En privat» · un xat privat només entre la persona i l'autor de la
 *     pàgina (Onada 8, 261009); sense autor, o amb el pilot, Sóc de Poble, el
 *     missatge directe amb l'entitat;
 *   · «En públic» · el xat públic de l'element, amb el seu títol com a nom,
 *     com els grups «General» o «Beta testers»: hi pot entrar tothom. Sense
 *     xat públic (comentarXat 'privat'), la fila es queda desactivada i diu
 *     per què.
 * La via triada va a onComment('privat' | 'public'). És la MATEIXA peça del
 * peu de la targeta (BotoComentar, PedraSeca/organismes/Comentar.jsx: esta
 * barra i UniversalCard l'importen d'allí), i a la targeta funciona igual.
 * Amb comentarXat null (un handler propi, que mana, o l'editor, inoperatiu)
 * no hi ha menú: el clic de sempre. Derogat el nom que deia on portava
 * Comentar (NOMS_COMENTAR de T63.2): ara ho diuen les dues files del menú, i
 * el botó diu que obri un menú.
 * Correcció C9 · MenuComentar i TEXTOS_COMENTAR es reexporten ací per a les
 * proves que ja els importaven d'esta barra.
 */
import { useLayoutEffect, useRef } from 'react';
import {
  BackIcon, ForwardIcon, IndexIcon, TranslateIcon, ShareIcon,
} from '../../PedraSeca/atoms/icones.jsx';
import { ActionControl, IconButton } from '../../PedraSeca/atoms/controls.jsx';
import { BotoComentar } from '../../PedraSeca/organismes/Comentar.jsx';
import { MenuTraduir } from '../traduccio/MenuTraduir.jsx';

export { MenuComentar } from '../../PedraSeca/organismes/Comentar.jsx';
export { TEXTOS_COMENTAR } from '../../PedraSeca/organismes/textosComentar.js';

export function BarraBlava({
  onBack, onForward, onIndex,
  traduirVisible = false, comentarVisible = false, compartirVisible = false, connectarVisible = false,
  onTranslate, onComment, onShare, onConnect,
  connectLabel = 'Connectar',
  comentarXat = null,
  /* Onada 8 (261009) · el nom de l'autor de «En privat» (useAccions). */
  comentarPrivatAmb = null,
  accionsInoperatives = false, onClickInoperatiu = null,
  menuTraduir = null,
  indexControla,
}) {
  const botoTraduir = useRef(null);
  /* Ordre del Mestre, 261004 (integració final, auditoria d'amfitrió) · El
     botó «Índex» diu quin diàleg obri (aria-controls), i el Lector reconeix
     l'Índex propi per l'id i no per la classe. L'atom IconButton
     (PedraSeca/atoms/controls.jsx, fora d'este front) encara no admet
     aria-controls: l'atribut es posa sobre el seu botó, abans de pintar.
     Quan l'atom l'admeta, passarà a ser una prop. */
  const botoIndex = useRef(null);
  useLayoutEffect(() => {
    const boto = botoIndex.current;
    if (!boto) return;
    if (indexControla) boto.setAttribute('aria-controls', indexControla);
    else boto.removeAttribute('aria-controls');
  }, [indexControla]);
  const inoperativa = accionsInoperatives ? 'accio-inoperativa' : '';
  /* T7 (P7) · Inoperatius però enfocables i llegibles: aria-disabled, no
     `disabled` (patró de VistaEnConstruccio). El clic diu QUIN botó és, i qui
     munta la barra hi posa el missatge propi de cada un. */
  const ariaInoperatiu = accionsInoperatives ? 'true' : undefined;
  const clicDe = (accio, viu) => {
    if (!accionsInoperatives) return viu;
    return onClickInoperatiu ? () => onClickInoperatiu(accio) : null;
  };
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
        <IconButton label="Índex de secció" onClick={onIndex} presentation refBoto={botoIndex}>
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
        {/* Ordre del Mestre (261007) · Inoperatiu (l'editor, T36), Comentar no
            obri cap menú: el clic diu quin botó és. */}
        {comentarVisible && (
          <BotoComentar comentarXat={accionsInoperatives ? null : comentarXat} privatAmb={comentarPrivatAmb} onComment={clicDe('comentar', onComment)}
            className={inoperativa} presentation ariaDisabled={ariaInoperatiu} />
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
