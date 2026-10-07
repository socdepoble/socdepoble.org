import { Suspense, memo, useCallback, useEffect, useRef, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { lazyRoute } from '../../../../apps/plataforma/lazyRoute.js';
import { Boto, Carregant, PantallaCompleta, usePantallaCompleta } from '../../../../components/PedraSeca/index.js';
import { useToast } from '../../../../components/universal/NotificationContext.jsx';
import { FONT_UNICODE_EMOJIS, GRUPS_EMOJIS, TOTAL_EMOJIS, VERSIO_UNICODE_EMOJIS } from '../dades/emojisUnicode18.js';

/* Ordre del Mestre (261007) · La pantalla «Assignar» (amb el Bloc, el
   manifest de Disseny i la cerca que porta) arriba en obrir-la, no amb
   l'espècimen, que ja pinta 3972 targetes. Amb lazyRoute, com els
   espècimens (detailRegistry.jsx): si el mòdul no arriba, ho recull la
   barrera de la ruta. */
const AssignacioEmoji = lazyRoute(() => import('../AssignacioEmoji.jsx'));

/* El resultat d'una còpia no reconstrueix milers de botons estàtics ni
   torna a obrir un grup que la persona haja plegat.
   Ordre del Mestre (261007) · Cada targeta porta, davall del botó de copiar,
   el seu «Assignar» (Boto primari). Només la família de l'emoji triat rep el
   codi de l'obridor: el seu «Assignar» porta l'id on usePantallaCompleta torna
   el focus en eixir, i la resta de famílies no es tornen a pintar. */
const Familia = memo(function Familia({ grup, copia, assigna, codiObridor, idObridor }) {
  return (
    <details open>
      <summary>{grup.nom} ({grup.emojis.length})</summary>
      <ul className="sdp-emojis-xl__graella" aria-label={grup.nom}>
        {grup.emojis.map(([codi, emoji, nom]) => (
          <li key={codi}>
            <div className="sdp-emojis-xl__targeta">
              <button type="button" className="sdp-emojis-xl__boto" data-emoji-code={codi} aria-label={`Copia ${nom}`} onClick={() => copia(emoji, nom)}>
                <span className="sdp-emojis-xl__glif" aria-hidden="true">{emoji}</span>
                <span lang="en">{nom}</span>
              </button>
              <Boto varietat="primari" className="sdp-emojis-xl__assigna" id={codi === codiObridor ? idObridor : undefined}
                aria-haspopup="dialog" aria-label={`Assignar ${emoji} ${nom}`}
                onClick={(e) => assigna(e, { grup: grup.id, codi, emoji, nom })}>
                Assignar
              </Boto>
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
});

export default function EmojisXL() {
  const peticio = useRef(0);
  const [estat, setEstat] = useState({ text: 'Tria una emoticona per copiar-la.', nom: '', final: '' });
  /* Ordre del Mestre (261007) · «Assignar»: una PantallaCompleta, no un menú
     flotant. L'emoji triat es queda en tancar-la: el seu «Assignar» conserva
     l'id de l'obridor fins que el focus hi ha tornat. */
  const { oberta, obri, tanca, idObridor } = usePantallaCompleta();
  const [triat, setTriat] = useState(null);
  const { showToast } = useToast();
  const assigna = useCallback((e, entrada) => {
    setTriat(entrada);
    obri(e);
  }, [obri]);
  /* Una nota assignada de veres: es tanca la pantalla (el focus torna a
     «Assignar») i el toast ho diu, ja fora del <dialog> modal. */
  const fet = useCallback((missatge) => {
    tanca();
    showToast(missatge, 'success');
  }, [tanca, showToast]);
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
      descripcio="Totes les famílies s’obrin per defecte. Toca una emoticona per copiar-la, o prem «Assignar» per posar-la a una nota teua. Els noms anglesos són els oficials; la forma i el color depenen del teu sistema, que pot no mostrar encara les més noves."
      a11y={['Cada família es pot plegar amb un summary natiu, operable amb el teclat.', 'Cada botó té un nom llegible; el glif és decoratiu i no substituïx el nom.', 'El resultat de la còpia s’anuncia sense moure el focus i només confirma l’èxit quan el navegador l’ha acceptada.',
        '«Assignar» és un botó blau de --sdp-touch d’alt amb el nom «Assignar 😀 grinning face». Obri una pantalla completa amb la cerca i els destins en grups (Notes personals, Wiki de Poble, Disseny i Pàgines de Sóc de Poble), amb les carpetes i els documents de cada un.',
        'A la pantalla, el focus comença a «Tornar»; «Tornar» o Escape la tanquen i el focus torna a l’«Assignar» que l’ha oberta. Amb text a la cerca, Escape primer l’esborra.',
        'Una pàgina o una família de Disseny es llista, però la seua fila és aria-disabled i diu «Al codi»: en prémer-la, un avís davall de la fila explica que l’emoji es canvia amb un commit. Una carpeta de la Wiki o del Bloc diu «Icona fixa»: porta la seua icona de Lucide.']}
      fes={['Usa emoticones per orientar i acompanya-les d’un nom llegible.', 'Assignar de veres només el que el navegador pot desar (l’emoticona d’una nota) i dir-ho clar de les pàgines del codi.']}
      noFacis={['Dependre només del color o de la forma del glif per comunicar un estat.', 'Un menú flotant per a triar el destí: hi hauria massa pàgines.']}>
    <div className="sdp-emojis-xl" role="region" aria-label="Directori d’emoticones">
      <p>{TOTAL_EMOJIS} entrades del catàleg <a href={FONT_UNICODE_EMOJIS}>Unicode {VERSIO_UNICODE_EMOJIS}</a>, inclosos els components de color de pell i cabell.</p>
      <p className="sdp-emojis-xl__estat" role="status" aria-live="polite" aria-atomic="true">
        {estat.text}{estat.nom ? <span lang="en">{estat.nom}</span> : null}{estat.final}
      </p>
      {GRUPS_EMOJIS.map((grup) => (
        <Familia key={grup.id} grup={grup} copia={copia} assigna={assigna}
          codiObridor={triat?.grup === grup.id ? triat.codi : null} idObridor={idObridor} />
      ))}
    </div>
    <PantallaCompleta oberta={oberta && Boolean(triat)} onTanca={tanca} etiquetaEixir="Tornar"
      titol={triat ? `Assignar ${triat.emoji} ${triat.nom}` : 'Assignar'}>
      {oberta && triat ? (
        <Suspense fallback={<Carregant etiqueta="Carregant els destins…" />}>
          <AssignacioEmoji emoji={triat.emoji} nom={triat.nom} onFet={fet} />
        </Suspense>
      ) : null}
    </PantallaCompleta>
    </Especimen>
  );
}
