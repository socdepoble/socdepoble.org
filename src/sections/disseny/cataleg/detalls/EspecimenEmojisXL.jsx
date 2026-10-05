import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { FONT_UNICODE_EMOJIS, GRUPS_EMOJIS, TOTAL_EMOJIS, VERSIO_UNICODE_EMOJIS } from '../dades/emojisUnicode18.js';

/* El resultat d'una còpia no reconstrueix milers de botons estàtics ni
   torna a obrir un grup que la persona haja plegat. */
const Familia = memo(function Familia({ grup, copia }) {
  return (
    <details open>
      <summary>{grup.nom} ({grup.emojis.length})</summary>
      <ul className="sdp-emojis-xl__graella" aria-label={grup.nom}>
        {grup.emojis.map(([codi, emoji, nom]) => (
          <li key={codi}>
            <button type="button" className="sdp-emojis-xl__boto" data-emoji-code={codi} aria-label={`Copia ${nom}`} onClick={() => copia(emoji, nom)}>
              <span className="sdp-emojis-xl__glif" aria-hidden="true">{emoji}</span>
              <span lang="en">{nom}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
});

export default function EmojisXL() {
  const peticio = useRef(0);
  const [estat, setEstat] = useState({ text: 'Tria una emoticona per copiar-la.', nom: '', final: '' });
  useEffect(() => () => { peticio.current += 1; }, []);
  const copia = useCallback(async (emoji, nom) => {
    const id = ++peticio.current;
    try {
      const porta = globalThis.navigator?.clipboard;
      if (typeof porta?.writeText !== 'function') {
        setEstat({ text: 'La còpia no està disponible en aquest navegador.', nom: '', final: '' });
        return;
      }
      setEstat({ text: 'Copiant: ', nom, final: '…' });
      await porta.writeText(emoji);
      if (id === peticio.current) setEstat({ text: 'Copiat: ', nom, final: '.' });
    } catch {
      if (id === peticio.current) setEstat({ text: 'No s’ha pogut copiar: ', nom, final: '. Torna-ho a provar.' });
    }
  }, []);

  return (
    <Especimen id="emojis-xl" nom="Emojis XL" fitxer="src/sections/disseny/cataleg/detalls/EspecimenEmojisXL.jsx"
      descripcio="Totes les famílies s’obrin per defecte. Toca una emoticona per copiar-la. Els noms anglesos són els oficials; la forma i el color depenen del teu sistema, que pot no mostrar encara les més noves."
      a11y={['Cada família es pot plegar amb un summary natiu, operable amb el teclat.', 'Cada botó té un nom llegible; el glif és decoratiu i no substituïx el nom.', 'El resultat de la còpia s’anuncia sense moure el focus i només confirma l’èxit quan el navegador l’ha acceptada.']}
      fes={['Usa emoticones per orientar i acompanya-les d’un nom llegible.']}
      noFacis={['Dependre només del color o de la forma del glif per comunicar un estat.']}>
    <div className="sdp-emojis-xl" role="region" aria-label="Directori d’emoticones">
      <p>{TOTAL_EMOJIS} entrades del catàleg <a href={FONT_UNICODE_EMOJIS}>Unicode {VERSIO_UNICODE_EMOJIS}</a>, inclosos els components de color de pell i cabell.</p>
      <p className="sdp-emojis-xl__estat" role="status" aria-live="polite" aria-atomic="true">
        {estat.text}{estat.nom ? <span lang="en">{estat.nom}</span> : null}{estat.final}
      </p>
      {GRUPS_EMOJIS.map((grup) => <Familia key={grup.id} grup={grup} copia={copia} />)}
    </div>
    </Especimen>
  );
}
