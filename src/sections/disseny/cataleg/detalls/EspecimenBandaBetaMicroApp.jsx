/* Onada R32.5 (P0-112 / T3-UI-03) · Espècimen viu de BandaBetaMicroApp en les 5 llengües. */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { BandaBetaMicroApp } from '../../../../components/PedraSeca/molecules/BandaBetaMicroApp.jsx';
import { PillToggle } from '../../../../components/PedraSeca/molecules/PillToggle.jsx';

const OPCIONS_IDIOMA = Object.freeze([
  { valor: 'ca', text: 'Valencià (ca)' },
  { valor: 'es', text: 'Castellano (es)' },
  { valor: 'en', text: 'English (en)' },
  { valor: 'eu', text: 'Euskara (eu)' },
  { valor: 'gl', text: 'Galego (gl)' }
]);

export default function EspecimenBandaBetaMicroApp() {
  const [idioma, setIdioma] = useState('ca');

  return (
    <Especimen
      id="banda-beta-micro-app"
      nom="Banda de fase beta (micro-apps)"
      fitxer="src/components/PedraSeca/molecules/BandaBetaMicroApp.jsx"
      descripcio="Franja universal, serena i no bloquejant per a la capçalera de les micro-apps en fase Beta (Gestoria, El Bar, La Nevera, Salut, Genealogia, Lector i Avisador). Recorda en les 5 llengües oficials que l’eina és per a l’autoorganització personal i que no s’ha d’utilitzar per a producció crítica ni com a facturació oficial Verifactu."
      contracte={[
        ['BandaBetaMicroApp.idioma', "'ca' | 'es' | 'en' | 'eu' | 'gl' | undefined", 'llengua activa', 'Sense la prop, llig llenguaDelText de UIContext i recau en valencià si es munta aïllada.'],
        ['textosBandaBeta(idioma)', '{ regio: string, text: string }', '—', 'Funció pura que normalitza el codi d’idioma (p. ex. es-ES → es) i torna els textos congelats.']
      ]}
      a11y={[
        'Element semàntic <aside> amb aria-label traduït a les 5 llengües, sense interrompre lectors de pantalla com si fóra una alerta d’error.',
        'Contrast WCAG AAA sobre tokens semàntics --sdp-avis-fons i --sdp-avis-text en clar, fosc i mode Bancal.',
        'Text envoltant (white-space: normal) sense el·lipsi ni desbordament horitzontal des de 320 px.'
      ]}
      fes={[
        'Muntar-la a la capçalera de les micro-apps marcades en proves al registre de plugins.',
        'Mantindre el missatge honest i directe sobre l’abast no oficial i no Verifactu.'
      ]}
      noFacis={[
        'Usar modals bloquejants en entrar a una micro-app en proves.',
        'Prometre homologació fiscal Verifactu mentre la remissió oficial a l’AEAT no estiga certificada.'
      ]}
    >
      <PillToggle
        etiqueta="Idioma de la mostra"
        valor={idioma}
        onCanvi={setIdioma}
        opcions={OPCIONS_IDIOMA}
      />
      <BandaBetaMicroApp idioma={idioma} />
    </Especimen>
  );
}
