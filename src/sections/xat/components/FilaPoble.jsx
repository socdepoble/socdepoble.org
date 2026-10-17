/**
 * FilaPoble.jsx — la fila del grup del poble de l'amfitrió quan encara no
 * existix a les dades (torn 260930, T1; pobleAmfitrio.js, anteposaPoble).
 *
 * Té l'anatomia de FilaComunitat (avatar quadrat amb les targetes apilades,
 * nom en negreta, xebró «›») perquè és el que serà: una comunitat amb Avisos i
 * General. Porta la xinxeta de fixada: és al capdamunt per decisió, no per
 * activitat. Prémer-la fa el mateix que el «Comentar» de la pàgina del poble:
 * l'obri o, si encara no n'hi ha, el crea (en remot, al servidor, i només
 * perquè la persona ho ha demanat; vegeu el pla 2135, P2).
 *
 * Onada 3 (P2) · Porta la cara del poble, la de la seua fitxa de Pobles
 * (avatarDelPoble), com la comunitat del Xat de mostra. Sense fitxa, les
 * inicials de sempre.
 *
 * Onada 6 (integració Xat i Pobles) · Amb la mateixa fitxa, i si l'amfitrió
 * no n'ha declarat el nom, es diu com la gent del poble (nomDelPoble amb
 * `towns`), el nom que tindrà el grup quan existisca.
 *
 * Gauntlet 261016_1530 (Bloc 3.6; actorsDelXat.js) · La mateixa fila porta a
 * la comunitat de Sóc de Poble quan encara no és a la llista: `nom`, `avatar`,
 * `etiqueta` i `clau` (la llavor de les inicials) són opcionals i, sense
 * ells, el DOM és el de sempre.
 */
import { ChevronRight, Pin } from 'lucide-react';
import { AvatarComunitat } from './FilaConversa.jsx';
import { useCoreContent } from '../../../app/contexts/CoreContentContext';
import { avatarDelPoble, nomDelPoble } from '../pobleAmfitrio.js';

export default function FilaPoble({ poble, onObri, t, nom: nomPropi = null, avatar = undefined, etiqueta = null, clau = null }) {
  const { towns } = useCoreContent();
  const nom = nomPropi || nomDelPoble(poble, towns);
  const cara = avatar === undefined ? avatarDelPoble(poble, towns) : avatar;
  return (
    <button type="button" className="sdp-xat-fila sdp-xat-fila--comunitat" onClick={() => onObri(poble)}>
      <AvatarComunitat fil={{ id: clau || `poble:${poble.id}`, avatar_url: cara }} nom={nom} />
      <span className="sdp-xat-fila__cos">
        <span className="sdp-xat-fila__cap">
          <span className="sdp-xat-fila__nom">
            {nom}
            <span className="sdp-nomes-lector">{`, ${etiqueta || t('section.xat.poble.etiqueta', 'Grup del poble')}`}</span>
          </span>
          <ChevronRight className="sdp-xat-fila__xebro" size={20} aria-hidden="true" focusable="false" />
        </span>
        <span className="sdp-xat-fila__peu">
          <span className="sdp-xat-fila__previa">{t('section.xat.poble.previa', 'Avisos, General')}</span>
          <span className="sdp-xat-fila__icones">
            <Pin size={16} aria-hidden="true" focusable="false" />
            <span className="sdp-nomes-lector">{t('section.xat.fixada', 'Fixada')}</span>
          </span>
        </span>
      </span>
    </button>
  );
}
