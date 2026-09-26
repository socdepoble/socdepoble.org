import { Especimen } from '../Especimen.jsx';
import {
  ActionControl, IconButton, DateTimeControl,
  BackIcon, ForwardIcon, IndexIcon, TranslateIcon, CommentIcon, ShareIcon, PinIcon, IaiaIcon
} from '../../../../components/PedraSeca/index.js';

const res = () => {};

/**
 * Els botons que viuen damunt de les barres de color. Dues formes i prou:
 * cercle (icona) i pastilla (text). La pell és una sola família a
 * components.css («CONTROLS DE BARRA»); els àtoms són a atoms/controls.jsx.
 */
export default function EspecimenControlsBarra() {
  return (
    <Especimen id="controls-barra" nom="Controls de barra · IconButton · ActionControl · DateTimeControl" fitxer="src/components/PedraSeca/atoms/controls.jsx · atoms/icones.jsx"
      descripcio="La botonera de la barra blava (navegació de pàgina), de la barra taronja (autoria) i del peu de la UniversalCard. Una sola família visual: cercles de 48px per a icones, pastilles de 48px per a text, mateix hover (vel blanc) i cap transform."
      contracte={[
        ['IconButton.label', 'string', '—', 'Nom accessible obligatori; és el títol del botó.'],
        ['IconButton.onClick / presentation', 'fn / boolean', '—', 'Sense onClick ni presentation no es pinta; presentation el mostra desactivat sense semblar apagat.'],
        ['ActionControl.className', 'string', '—', 'btn-connectar per a l’acció principal (pastilla blava fosca).'],
        ['DateTimeControl.time / date / dateTime', 'string', '—', 'Pastilla amb hora i data; amb onClick és <button>, sense és <time>.']
      ]}
      a11y={['Cada icona porta aria-label i title amb l’objecte: «Comentar Samarreta…».', 'Zona tàctil de 48px en totes les formes.', 'Focus visible dins de la barra amb --sdp-accent-text (blava) o --sdp-crom-focus (closca).']}
      fes={['Icones de 24px, traç 2: les mateixes que .icon a tot el sistema.', 'Ordre fix a la barra blava: Arrere · Avant · Índex ‖ Traduir · Comentar · Compartir ‖ Connectar.']}
      noFacis={['Barrejar quadrats i cercles a la mateixa barra.', 'Text per davall de 14px a la pastilla «Connectar».', 'Escalar el botó en hover: el sistema canvia el fons, no la mida.']}>

      <h4>Barra blava (navegació de pàgina)</h4>
      <div className="sdp-especimen__barres">
        <header className="bar-blue">
          <div className="bar-blue-left">
            <IconButton label="Tornar arrere" onClick={res}><BackIcon className="icon" /></IconButton>
            <IconButton label="Tornar endavant" onClick={res}><ForwardIcon className="icon" /></IconButton>
            <IconButton label="Índex de secció" onClick={res}><IndexIcon className="icon" /></IconButton>
          </div>
          <div className="sp-card-actions">
            <IconButton label="Traduir" onClick={res}><TranslateIcon className="icon" /></IconButton>
            <IconButton label="Comentar (xat privat)" onClick={res}><CommentIcon className="icon" /></IconButton>
            <IconButton label="Compartir" onClick={res}><ShareIcon className="icon" /></IconButton>
          </div>
          <ActionControl className="btn-connectar sp-card-connect" label="Connectar" onClick={res}>Connectar</ActionControl>
        </header>
      </div>

      <h4>Barra taronja (autoria i data)</h4>
      <div className="sdp-especimen__barres">
        <section className="bar-orange" aria-label="Autoria i data (espècimen)">
          <div className="sp-card-author">
            <img className="sp-card-avatar" src="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg" alt="" width="48" height="48" />
            <div className="sp-card-author-info">
              <div className="sp-card-author-name">Sóc de Poble</div>
              <div className="sp-card-author-location">La Torre de les Maçanes</div>
            </div>
          </div>
          <div className="bar-actions">
            <IconButton label="Ancorar" className="btn-icon-orange" onClick={res}><PinIcon className="icon" /></IconButton>
            <DateTimeControl time="11:00" date="25/04/26" dateTime="2026-04-25T11:00:00" onClick={res} />
          </div>
        </section>
      </div>

      <h4>Icones pròpies</h4>
      <p>SVG de la casa a <code>atoms/icones.jsx</code>; la resta d’icones del sistema són de lucide-react.</p>
      <div className="sdp-especimen__fila sdp-especimen__icones">
        <span title="IaiaIcon"><IaiaIcon className="icon" /></span>
        <span title="BackIcon"><BackIcon className="icon" /></span>
        <span title="ForwardIcon"><ForwardIcon className="icon" /></span>
        <span title="IndexIcon"><IndexIcon className="icon" /></span>
        <span title="TranslateIcon"><TranslateIcon className="icon" /></span>
        <span title="CommentIcon"><CommentIcon className="icon" /></span>
        <span title="ShareIcon"><ShareIcon className="icon" /></span>
        <span title="PinIcon"><PinIcon className="icon" /></span>
      </div>
    </Especimen>
  );
}
