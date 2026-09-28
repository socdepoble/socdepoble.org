/**
 * DialegEmoticona — l'emoticona pròpia d'un document (T23, ordre del Mestre,
 * 260927 nit).
 *
 * L'element pot dur un emoji que substituïx la icona de sistema a la fitxa,
 * al rail i a l'arbre (ItemMedia i NavGlyph ja llegien `item.icon`). Ací es
 * tria: un camp de text on la persona escriu o apega UN emoji (el teclat
 * d'emojis del sistema fa de selector: no hi ha cap llibreria), amb
 * previsualització i validació (utils/emoji.emojiSol). «Desar» la guarda i
 * «Llevar» la buida: torna la ploma de la botonera mentre s'edita i, a la
 * llista i al rail de Notes, la ploma 🪶 per defecte (T34,
 * utils/emoji.EMOTICONA_PER_DEFECTE). Cap estat propi més enllà del camp:
 * qui la munta decidix on va.
 */
import { useState } from 'react';
import { Dialeg, Boto, Camp, CampText } from '../../PedraSeca/index.js';
import { emojiSol } from '../../../utils/emoji.js';

const AJUDA = 'Escriu o apega un sol emoji. Al Mac: Control + Ordre + Espai; al mòbil, la tecla d’emojis del teclat.';
const ERROR = 'Ha de ser un sol emoji, sense text.';

export function DialegEmoticona({ obert, onTanca, actual = '', onDesa }) {
  const [valor, setValor] = useState(actual || '');
  const net = valor.trim();
  const valid = emojiSol(net);
  const error = net && !valid ? ERROR : null;

  const desa = () => { if (valid) onDesa?.(valid); };

  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol="Emoticona del document"
      mida="s"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>Cancel·lar</Boto>
          {actual ? <Boto varietat="fantasma" onClick={() => onDesa?.('')}>Llevar</Boto> : null}
          <Boto varietat="primari" disabled={!valid} onClick={desa}>Desar</Boto>
        </>
      )}
    >
      <p className="sdp-classificacio-dialeg__avis">
        L’emoticona ocupa el lloc de la ploma 🪶 a la llista i al rail. Sense emoticona, mentre edites, hi veus una ploma.
      </p>
      <div className="sdp-classificacio-dialeg__afegir">
        <Camp etiqueta="Emoticona" ajuda={AJUDA} error={error}>
          <CampText
            value={valor}
            autoFocus
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); desa(); } }}
          />
        </Camp>
        <span className="sdp-classificacio-dialeg__mostra" aria-hidden="true">{valid || '—'}</span>
      </div>
    </Dialeg>
  );
}

export default DialegEmoticona;
