/* v1.2.17 (IDEA-313) · Espècimen viu de la benvinguda del Foraster a /xat: el literal del Mestre
   (261121 16:03) en les 5 llengües, amb la ✕ que la tanca i la recorda i un sol «Entrar».
   v1.2.17 · Gauntlet R1 (L1-04) · La mostra va amb recorda={false}: la seua ✕ no llig ni escriu la clau
   de la targeta real del Xat (l'estat és només en memòria). */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { AcollidaForasterXat } from '../../../xat/components/AcollidaForasterXat.jsx';
import { PillToggle } from '../../../../components/PedraSeca/molecules/PillToggle.jsx';
import { Boto } from '../../../../components/PedraSeca/atoms/Boto.jsx';

const OPCIONS_IDIOMA = Object.freeze([
  { valor: 'ca', text: 'Valencià (ca)' },
  { valor: 'es', text: 'Castellano (es)' },
  { valor: 'en', text: 'English (en)' },
  { valor: 'eu', text: 'Euskara (eu)' },
  { valor: 'gl', text: 'Galego (gl)' },
]);

export default function EspecimenAcollidaForasterXat() {
  const [idioma, setIdioma] = useState('ca');
  /* La ✕ de la mostra la tanca només en memòria: «Torna a mostrar-la» la torna a muntar. */
  const [muntatge, setMuntatge] = useState(0);
  const mostraDeNou = () => setMuntatge((n) => n + 1);

  return (
    <Especimen
      id="acollida-foraster-xat"
      nom="Benvinguda del Foraster al Xat"
      fitxer="src/sections/xat/components/AcollidaForasterXat.jsx"
      descripcio="La targeta que veu qui aterra a /xat sense sessió (l’arrel canònica /): el títol, les dues línies del Mestre (IDEA-313) amb CONNECTAR destacat, un sol «Entrar» i una ✕ que la tanca i ho recorda en aquest dispositiu, sense deixar cap pastilla."
      contracte={[
        ['AcollidaForasterXat.idioma', "'ca' | 'es' | 'en' | 'eu' | 'gl'", "'ca'", 'La llengua de la interfície (XatWorkspace la passa); una de desconeguda recau en valencià.'],
        ['AcollidaForasterXat.tornar', 'string', "'/xat'", 'On torna «Entrar» (rutaDEntrada): la ruta del Xat amb la seua consulta.'],
        ['AcollidaForasterXat.onNavega', '(ruta) => void | null', 'null', 'La navegació del router; sense, «Entrar» no navega (dins d’un amfitrió no trau ningú de la pàgina).'],
        ['AcollidaForasterXat.recorda', 'boolean', 'true', 'Si la ✕ es recorda en aquest dispositiu; amb false (aquesta mostra), el tancament és només en memòria i no toca la clau de la targeta real.'],
      ]}
      a11y={[
        'Regió <section> anomenada pel seu títol <h2>; la ✕ porta un nom accessible traduït en les 5 llengües.',
        'En tancar-la, el focus passa al control següent del seu contenidor.',
        'Botó «Entrar» centrat amb objectiu tàctil mínim var(--sdp-touch); full diferit src/css/diferit-acollida-foraster.css (+0 B a l’arrencada).',
      ]}
      fes={[
        'Mostrar-la només a qui no té sessió i aterra al Xat sense cap conversa demanada.',
        'Usar el mateix verb d’entrada que la barra negra i /registre (B9).',
      ]}
      noFacis={[
        'Afegir-hi insígnies, frases defensives, desplegables o una llista de passos (IDEA-313: zero soroll).',
        'Deixar una pastilla flotant quan el Foraster la tanca, o cablejar cap poble concret.',
      ]}
    >
      <PillToggle
        etiqueta="Idioma de la mostra"
        valor={idioma}
        onCanvi={setIdioma}
        opcions={OPCIONS_IDIOMA}
      />
      <AcollidaForasterXat key={muntatge} idioma={idioma} onNavega={() => {}} recorda={false} />
      <div className="sdp-accions">
        <Boto onClick={mostraDeNou}>Torna a mostrar-la</Boto>
      </div>
    </Especimen>
  );
}
