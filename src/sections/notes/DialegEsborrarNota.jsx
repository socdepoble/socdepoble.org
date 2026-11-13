/**
 * DialegEsborrarNota — què fer amb una nota que ha d'eixir del Bloc.
 *
 * Tres eixides, de la més suau a la definitiva (la destructiva, l'última):
 *   · «Guardar durant 30 dies» → onTria('paperera'): passats 30 dies s'esborra.
 *   · «Arxivar»                → onTria('arxivada'): sense caducitat.
 *   · «Borrar definitivament»  → segon pas DINS del mateix diàleg
 *     («Enrere» / «Borrar per sempre» → onTria('definitiu')). Cap diàleg dins
 *     d'un altre (EspecimenDialeg).
 *
 * Destructiu: el vel no tanca (tancaEnVel={false}). Escape i «Tancar» no fan
 * res amb la nota, i mentre treballa (ocupat) tampoc tanquen. Al segon pas el
 * focus va a «Enrere» (Llei de la Por Orgànica, Dialeg.jsx): un Intro distret
 * no esborra res.
 *
 * La vista per a recuperar notes de la paperera i de l'arxiu encara no
 * existix: els textos no prometen cap botó de recuperar.
 *
 * F03-UI (Onada R21) · `retiraDelMur`: el port té la capacitat
 * 'revocacioPublicacions' i la nota és publicada. Aleshores és cert (trigger
 * mur_retira_des_de_nota de 2611121430) que la paperera i l'esborrat la
 * retiren del Mur en la mateixa transacció, i que l'arxiu no; el diàleg ho
 * diu. `seccio` ('mur' o 'mercat') diu d'on. Sense, el text de sempre. Els
 * textos nous van en les cinc llengües (useTraductorOpcional); la resta del
 * diàleg continua en valencià, com abans.
 */
import { useState } from 'react';
import { Dialeg, Boto } from '../../components/PedraSeca';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { TITOL_NOTA_PREPARADA } from './notaPreparada.js';

export const TEXTOS_ESBORRAR_PUBLICADA = Object.freeze({
  publicada: Object.freeze(['section.notes.esborrar.publicada', 'Esta nota està publicada: arxivar-la, guardar-la a la paperera o borrar-la definitivament també la retira del Mur públic per a tothom. Recuperar la nota no recupera la publicació: si la tornes a publicar, tindrà un enllaç nou.']),
  publicadaMercat: Object.freeze(['section.notes.esborrar.publicadaMercat', 'Esta nota està publicada: arxivar-la, guardar-la a la paperera o borrar-la definitivament també la retira del Mercat per a tothom. Recuperar la nota no recupera la publicació: si la tornes a publicar, tindrà un enllaç nou.']),
  definitiu: Object.freeze(['section.notes.esborrar.definitiuRetira', 'També es retira del Mur públic per a tothom.']),
  definitiuMercat: Object.freeze(['section.notes.esborrar.definitiuRetiraMercat', 'També es retira del Mercat per a tothom.']),
});
const E = TEXTOS_ESBORRAR_PUBLICADA;

export function DialegEsborrarNota({ obert, nota, onTanca, onTria, ocupat = false, retiraDelMur = false, seccio = 'mur' }) {
  const t = useTraductorOpcional();
  const mercat = seccio === 'mercat';
  const retira = Boolean(retiraDelMur && nota?.isPublished);
  const [segonPas, setSegonPas] = useState(false);
  // «Enrere» desmunta el botó que tenia el focus: sense açò cauria al body,
  // fora del diàleg. En tornar, el focus va a «Borrar definitivament».
  const [tornat, setTornat] = useState(false);
  const [triada, setTriada] = useState(null);
  /* Gauntlet 261016 (Bloc 3.9) · Una nota sense títol es diu igual que a l'H1
     i a la targeta: «Nota sense títol». */
  const titol = extractPlainText(nota?.title || '', Infinity).trim() || TITOL_NOTA_PREPARADA;

  const tria = (opcio) => {
    setTriada(opcio);
    onTria?.(opcio);
  };
  const tanca = ocupat ? undefined : (motiu) => {
    setSegonPas(false);
    onTanca?.(motiu);
  };

  if (segonPas) {
    return (
      <Dialeg obert={obert} onTanca={tanca} mida="s" tancaEnVel={false}
        titol={`Borrar per sempre «${titol}»?`}
        descripcio="S’esborra ara i no es podrà recuperar: no passa per la paperera."
        accions={(
          /* Les claus fan que els botons del segon pas es munten de nou: sense
             elles React reutilitza el primer botó del pas anterior, autoFocus
             no es torna a aplicar i el focus cau al body. */
          <>
            <Boto key="enrere" varietat="secundari" onClick={() => { setSegonPas(false); setTornat(true); }} disabled={ocupat} autoFocus>Enrere</Boto>
            <Boto key="per-sempre" varietat="perill" onClick={() => tria('definitiu')} carregant={ocupat}>Borrar per sempre</Boto>
          </>
        )}>
        {retira
          ? <p>{tradueix(t, mercat ? E.definitiuMercat : E.definitiu)}</p>
          : (nota?.isPublished ? <p>La publicació al Mur es queda on és.</p> : null)}
      </Dialeg>
    );
  }

  return (
    <Dialeg obert={obert} onTanca={tanca} mida="s" tancaEnVel={false}
      titol={`Què vols fer amb «${titol}»?`}
      descripcio="Només «Borrar definitivament» no té volta arrere."
      accions={(
        <>
          <Boto key="paperera" varietat="secundari" onClick={() => tria('paperera')}
            disabled={ocupat} carregant={ocupat && triada === 'paperera'}>Guardar durant 30 dies</Boto>
          <Boto key="arxiu" varietat="secundari" onClick={() => tria('arxivada')}
            disabled={ocupat} carregant={ocupat && triada === 'arxivada'}>Arxivar</Boto>
          <Boto key="definitiu" varietat="perill" onClick={() => setSegonPas(true)} disabled={ocupat} autoFocus={tornat}>Borrar definitivament</Boto>
        </>
      )}>
      <p><strong>Guardar durant 30 dies.</strong> Ix del bloc i es guarda a la paperera 30 dies; després s’esborra per sempre.</p>
      <p><strong>Arxivar.</strong> Ix del bloc i es guarda a l’arxiu, sense data de caducitat.</p>
      <p><strong>Borrar definitivament.</strong> S’esborra ara i no es podrà recuperar.</p>
      {retira ? <p>{tradueix(t, mercat ? E.publicadaMercat : E.publicada)}</p> : null}
    </Dialeg>
  );
}

export default DialegEsborrarNota;
