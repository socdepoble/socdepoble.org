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
 *
 * Bloc 3.8 del Gauntlet (261016) · `carregaCataleg` (opcional): amb ella, el
 * diàleg porta la graella del catàleg Emojis XL (GraellaEmojis) en lloc del
 * text de la drecera de teclat de l'OS, i passa a la mida 'g'. Un clic a un
 * emoji l'assigna directament (onDesa(glif): qui munta el diàleg desa i el
 * tanca). El camp de text es queda com a alternativa de teclat, sense
 * autoFocus (en mòbil, el teclat taparia la graella). Un emoji del catàleg
 * massa nou per a este navegador (emojiSol el rebutja: Safari 16 porta les
 * dades d'Unicode 14) no es desa: un avís ho diu, com a l'«Assignar» de
 * Disseny (M2-12). Sense la prop, el diàleg de sempre (Perfil, Snippet i
 * espècimens).
 */
import { useCallback, useState } from 'react';
import { Dialeg, Boto, Camp, CampText } from '../../PedraSeca/index.js';
import { emojiSol } from '../../../utils/emoji.js';
import { GraellaEmojis } from './GraellaEmojis.jsx';

const AJUDA = 'Escriu o apega un sol emoji. Al Mac: Control + Ordre + Espai; al mòbil, la tecla d’emojis del teclat.';
const AJUDA_AMB_GRAELLA = 'Toca una emoticona de la graella, o escriu-ne o apega-ne una ací.';
const ERROR = 'Ha de ser un sol emoji, sense text.';
const textNoReconegut = (glif) => `Este navegador encara no reconeix ${glif} com a emoji: no es pot desar.`;

export function DialegEmoticona({ obert, onTanca, actual = '', onDesa, carregaCataleg = null }) {
  const [valor, setValor] = useState(actual || '');
  const [avis, setAvis] = useState(null);
  const ambGraella = typeof carregaCataleg === 'function';
  const net = valor.trim();
  const valid = emojiSol(net);
  const error = net && !valid ? ERROR : null;

  const desa = () => { if (valid) onDesa?.(valid); };
  /* Estable: escriure al camp no torna a pintar els botons de la graella. */
  const triaDeLaGraella = useCallback((glif) => {
    const reconegut = emojiSol(glif);
    if (!reconegut) {
      setAvis(textNoReconegut(glif));
      return;
    }
    setAvis(null);
    onDesa?.(reconegut);
  }, [onDesa]);

  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol="Emoticona del document"
      mida={ambGraella ? 'g' : 's'}
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
        <Camp etiqueta="Emoticona" ajuda={ambGraella ? AJUDA_AMB_GRAELLA : AJUDA} error={error}>
          <CampText
            value={valor}
            autoFocus={!ambGraella}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); desa(); } }}
          />
        </Camp>
        <span className="sdp-classificacio-dialeg__mostra" aria-hidden="true">{valid || '—'}</span>
      </div>
      {ambGraella ? (
        <>
          {avis ? <p className="sdp-classificacio-dialeg__avis" role="status">{avis}</p> : null}
          <GraellaEmojis carregaCataleg={carregaCataleg} onTria={triaDeLaGraella} />
        </>
      ) : null}
    </Dialeg>
  );
}

export default DialegEmoticona;
