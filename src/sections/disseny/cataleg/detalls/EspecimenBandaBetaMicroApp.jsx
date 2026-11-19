/* Onada R32.5 / R32.10 (P0-112 / D-v127-BANDA) · Espècimen viu de BandaBetaMicroApp en les 5 llengües i les 2 variants declaratives ('general' | 'fiscal').
   Integrat a la v1.2.9 per ordre del Mestre del 18-11-2026 (versio.js en porta la nota). */
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

const OPCIONS_AVIS = Object.freeze([
  { valor: 'general', text: 'General (micro-apps no fiscals)' },
  { valor: 'fiscal', text: 'Fiscal (Gestoria i Bar/TPV)' }
]);

export default function EspecimenBandaBetaMicroApp() {
  const [idioma, setIdioma] = useState('ca');
  const [avisBeta, setAvisBeta] = useState('general');

  return (
    <Especimen
      id="banda-beta-micro-app"
      nom="Banda de fase beta (micro-apps)"
      fitxer="src/components/PedraSeca/molecules/BandaBetaMicroApp.jsx"
      descripcio="Franja universal, serena i no bloquejant per a la capçalera de les micro-apps en fase Beta. Resol de forma declarativa des del manifest (avisBeta: 'general' | 'fiscal', zero if per slug) si cal mostrar l’avís beta general de funcionalitat en proves o la clàusula sobre Verifactu / AEAT exclusiva de Gestoria i Bar/TPV."
      contracte={[
        ['BandaBetaMicroApp.idioma', "'ca' | 'es' | 'en' | 'eu' | 'gl' | undefined", 'llengua activa', 'Sense la prop, llig llenguaDelText de UIContext i recau en valencià si es munta aïllada.'],
        ['BandaBetaMicroApp.avisBeta', "'general' | 'fiscal' | undefined", 'manifest.avisBeta ?? "general"', 'Dins d’una micro-app llig declarativament manifest.avisBeta; fora, mostra "general" sense esmentar facturació.'],
        ['textosBandaBeta(idioma, avisBeta)', '{ regio: string, text: string }', '—', 'Funció pura que normalitza idioma i variant declarativa ("general" | "fiscal") i torna els textos congelats.']
      ]}
      a11y={[
        'Element semàntic <aside> amb aria-label traduït a les 5 llengües, sense interrompre lectors de pantalla com si fóra una alerta d’error.',
        'Contrast WCAG AAA sobre tokens semàntics --sdp-avis-fons i --sdp-avis-text en clar, fosc i mode Bancal.',
        'Text envoltant (white-space: normal) sense el·lipsi ni desbordament horitzontal des de 320 px.'
      ]}
      fes={[
        'Declarar avisBeta: "fiscal" al manifest només en micro-apps amb llibres o tiquets (Gestoria i El Bar).',
        'Usar avisBeta: "general" a la resta de micro-apps (Nevera, Salut, Genealogia i Lector) per no confondre amb avisos fiscals.'
      ]}
      noFacis={[
        'Cablejar if (slug === ...) al component: el tipus d’avís ve sempre del manifest.',
        'Prometre homologació fiscal Verifactu mentre la remissió oficial a l’AEAT no estiga certificada.'
      ]}
    >
      <PillToggle
        etiqueta="Tipus d’avís declaratiu"
        valor={avisBeta}
        onCanvi={setAvisBeta}
        opcions={OPCIONS_AVIS}
      />
      <PillToggle
        etiqueta="Idioma de la mostra"
        valor={idioma}
        onCanvi={setIdioma}
        opcions={OPCIONS_IDIOMA}
      />
      <BandaBetaMicroApp idioma={idioma} avisBeta={avisBeta} />
    </Especimen>
  );
}
