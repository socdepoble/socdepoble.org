/**
 * EspecimenXatAjustos.jsx — el full «Ajustos» del Xat (torn 260930, T1;
 * captures 20.47–21.05 de WhatsApp Desktop; Pedra Seca §9).
 *
 * El cos del full (CosAjustos) en línia, dins d'un marc de la mida del full
 * (30×40rem), sense Dialeg: dos exemplars, l'arrel i la subpàgina Aparença.
 * És el component de producció amb dades de mostra: tot per props, cap
 * context de l'app. Les files naveguen de veres dins del marc (pila, ‹,
 * cerca); el tema, la llengua i l'amplària es trien de mentida (estat local,
 * no toquen l'app de qui mira) i les rutes ho diuen a l'avís.
 */
import { useMemo, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { CosAjustos } from '../../../xat/components/FullAjustos.jsx';
import { mostraDelXat } from './EspecimenXatLlista.jsx';

/* Traductor mínim: les alternatives ja són el text en valencià. */
const t = (clau, alternativa) => alternativa;

/* La mateixa pila que deixaria prémer «Aparença» a l'arrel. */
const PILA_APARENCA = Object.freeze([
  Object.freeze({ id: 'arrel', origen: null }),
  Object.freeze({ id: 'aparenca', origen: 'aparenca' })
]);

/* L'eixida de mostra: la fila roja, sense sessió de veres (a l'app,
   useEixidaSegura). */
function filaEixidaDeMostra(setAvis) {
  return function FilaEixidaDeMostra({ fila, etiqueta }) {
    return (
      <ul className="sdp-xat-ajustos__targeta">
        <li>
          <button type="button" className="sdp-xat-ajustos__fila sdp-xat-ajustos__fila--perill" data-sdp-fila={fila.id}
            onClick={() => setAvis('Tancaria la sessió: primer envia el pendent i, si queda res, ho diu ací dins.')}>
            <span className="sdp-xat-ajustos__linia"><span className="sdp-xat-ajustos__etiqueta">{etiqueta}</span></span>
          </button>
        </li>
      </ul>
    );
  };
}

function Marc({ etiqueta, pilaInicial, setAvis, FilaEixida, preferits }) {
  const [tema, setTema] = useState('light');
  const [llengua, setLlengua] = useState('ca');
  const [amplaria, setAmplaria] = useState('defecte');
  return (
    <div className="sdp-xat-ajustos-especimen" role="group" aria-label={etiqueta}>
      <CosAjustos
        t={t}
        pilaInicial={pilaInicial}
        joId="jo"
        joNom="Javi Llinares"
        joAvatar="/assets/fotos/javi-llinares-perfil-1200px.jpg"
        preferits={preferits}
        correu="javi@exemple.org"
        ambSessio
        ambPrivacitat
        FilaEixida={FilaEixida}
        tema={tema}
        llengua={llengua}
        amplaria={amplaria}
        mides={{ left: 260, middle: 280 }}
        onTema={(valor) => { setTema(valor); setAvis(`Tema triat: ${valor}.`); }}
        onLlengua={(valor) => { setLlengua(valor); setAvis(`Llengua triada: ${valor}.`); }}
        onAmplaria={(valor) => { setAmplaria(valor); setAvis(`Amplària triada: ${valor}.`); }}
        onVes={(ruta) => setAvis(`El full es tancaria i portaria a ${ruta}.`)}
        onObriConversa={(id) => setAvis(`El full es tancaria i obriria /xat/${id}.`)}
        onTanca={() => setAvis('La X tancaria el full sencer.')}
      />
    </div>
  );
}

export default function EspecimenXatAjustos() {
  const [avis, setAvis] = useState('Prem una fila, el ‹ o la X, o escriu al cercador.');
  const FilaEixida = useMemo(() => filaEixidaDeMostra(setAvis), []);
  const preferits = useMemo(() => {
    const { per } = mostraDelXat();
    return [per['g-festes'], per['dir-vicent']].map((fil) => ({ ...fil, preferit: true }));
  }, []);

  return (
    <Especimen id="xat-ajustos" nom="Xat · full «Ajustos»" fitxer="src/sections/xat/components/FullAjustos.jsx (FullAjustos · CosAjustos) · ajustosXat.js"
      descripcio="«Tu» al peu del rail obri este full, calcat del d’«Ajustes» de WhatsApp Desktop: un modal centrat de mida fixa, amb una pila de pàgines dins del mateix marc. A l’arrel, la X, el cercador, la targeta del perfil i els grups de files; a cada subpàgina, el ‹ i el títol. Només hi ha el que Sóc de Poble ja té: els preferits, el compte i l’eixida, l’aparença (tema i llengua), l’amplària de les columnes i les pàgines d’ajuda. La resta diu que està en construcció. Els canvis s’apliquen a l’acte. En estret ocupa tota la pantalla, amb el mateix tall que convertix els altres diàlegs en full inferior (≤720px; a l’encastat, [data-sdp-estret]). «Privacitat» obri el perfil, i la nota del grup ho diu mentre el Mestre no decidix com portar a «Privacitat i dades». La cerca troba també les capçaleres de secció: «llengua», «idioma» o «tema» porten a l’Aparença."
      contracte={[
        ['FullAjustos', '{ obert, onTanca(motiu), onRetornFocus? }', 'false', 'El Dialeg «sense-marc» amb les dades de l’app (useXat, UIContext, SessionContext, useAppGrid). ClosCaXat el munta una vegada. Obrir una ruta el tanca.'],
        ['CosAjustos', '{ t, pilaInicial?, joId, joNom, joAvatar?, preferits, correu, ambSessio, ambPrivacitat?, FilaEixida?, tema, llengua, amplaria, mides, onTema, onLlengua, onAmplaria, onVes, onObriConversa, onTanca, campRef? }', 'ambPrivacitat: null', 'El marc presentacional: tot per props. FilaEixida pinta «Tanca la sessió» quan hi ha sessió. ambPrivacitat (el backend té «Privacitat i dades»: true o false; null, no se sap i no hi ha nota) tria la nota de «Privacitat».'],
        ['PAGINES_AJUSTOS', '{ [id]: { titol, grups? | especial? | construccio? } }', '—', 'L’arbre (ajustosXat.js). Fila: pagina (xebró, empeny), ruta (xebró, obri i tanca), opcio (✓), accio (roig, sense xebró). Grup: capcalera?, paraules? (el que la cerca troba a més de la capçalera), notaDinamica? (\'amplaria\' o \'privacitat\').'],
        ['cercaAjustos(terme, { t, ambSessio })', 'string', 'null', 'Les files de tot l’arbre que contenen cada paraula, amb el plegat d’accents de /cerca, i la pàgina on viuen; i les capçaleres de secció, per la capçalera o les paraules clau (en la llengua de la interfície i en valencià), com a fila \'seccio\' que obri la seua pàgina.']
      ]}
      a11y={[
        'En obrir-lo, el focus va al cercador; en entrar a una subpàgina, al ‹; en tornar, a la fila que l’havia obert.',
        'Escape tanca el full sencer; dins del cercador amb text, primer l’esborra.',
        'Les opcions d’una selecció única porten aria-pressed i el grup, el nom de la seua capçalera.',
        'El botó del peu del rail es diu «Tu: ajustos»: comença pel que es veu.'
      ]}
      fes={['Copiar l’anatomia de WhatsApp: X a l’arrel, ‹ a les subpàgines, títol centrat, targetes amb xebró o ✓.', 'Dir «en construcció» on encara no hi ha dades.']}
      noFacis={['Inventar files que WhatsApp no té o funcions sense dades.', 'Posar un botó de desar: els canvis s’apliquen a l’acte.', 'Pintar la selecció amb el verd de WhatsApp: és el color d’acció.']}>
      <h4>L’arrel</h4>
      <Marc etiqueta="Full «Ajustos» de mostra: l’arrel" setAvis={setAvis} FilaEixida={FilaEixida} preferits={preferits} />
      <h4>La subpàgina Aparença</h4>
      <Marc etiqueta="Full «Ajustos» de mostra: Aparença" pilaInicial={PILA_APARENCA} setAvis={setAvis} FilaEixida={FilaEixida} preferits={preferits} />
      <p role="status">{avis}</p>
    </Especimen>
  );
}
