/**
 * TraduccioPagina.jsx — Les dues peces que PageFrame pinta quan una pàgina es
 * traduïx (Traductor Sobirà, ordre del Mestre, 260930 · via B).
 *
 *  · AvisTraduccio: l'avís en línia (Alerta «info», role=status). Mentre
 *    arriba la resposta, «Traduint al castellà…»; amb la traducció, «Traduït
 *    automàticament del valencià» i el botó «Veure l'original». No diu mai
 *    quin proveïdor hi ha darrere.
 *  · CosTraduit: els blocs traduïts (blocsTraduibles.js) com a elements de
 *    React. Cada text del servidor és TEXT: React l'escapa i un <script> que
 *    arribara en una resposta es pinta com a lletres, no s'executa. Els
 *    elements de llista seguits tornen a fer una llista.
 */
import { Alerta } from '../../PedraSeca/molecules/Alerta.jsx';
import { Boto } from '../../PedraSeca/atoms/Boto.jsx';
import { llenguaDeTraduccio } from '../../../data/traductor.js';

export const AVIS_TRADUIT = 'Traduït automàticament del valencià';
export const VEURE_ORIGINAL = 'Veure l’original';
export function avisTraduint(codi) {
  const cap = llenguaDeTraduccio(codi)?.cap;
  return cap ? `Traduint ${cap}…` : 'Traduint…';
}

export function AvisTraduccio({ llengua = null, carregant = null, onOriginal = null, className = '' }) {
  if (!llengua && !carregant) return null;
  const classes = ['sdp-avis-traduccio', className].filter(Boolean).join(' ');
  if (carregant) {
    return <Alerta to="info" className={classes}>{avisTraduint(carregant)}</Alerta>;
  }
  return (
    <Alerta to="info" className={classes}
      accions={onOriginal ? <Boto varietat="secundari" onClick={onOriginal}>{VEURE_ORIGINAL}</Boto> : null}>
      {AVIS_TRADUIT}
    </Alerta>
  );
}

const ETIQUETES = new Set(['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote']);

export function CosTraduit({ blocs = [] }) {
  const grups = [];
  for (const bloc of blocs) {
    const darrer = grups[grups.length - 1];
    if (bloc.etiqueta === 'li') {
      if (darrer?.llista) darrer.items.push(bloc.text);
      else grups.push({ llista: true, items: [bloc.text] });
    } else {
      grups.push(bloc);
    }
  }
  return grups.map((grup, i) => {
    if (grup.llista) {
      return <ul key={i}>{grup.items.map((text, j) => <li key={j}>{text}</li>)}</ul>;
    }
    const Etiqueta = ETIQUETES.has(grup.etiqueta) ? grup.etiqueta : 'p';
    return <Etiqueta key={i}>{grup.text}</Etiqueta>;
  });
}
