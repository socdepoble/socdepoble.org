/* Onada R32.5 / R32.10 (P0-112 / D-v127-BANDA) · Espècimen viu de BandaBetaMicroApp en les 5 llengües i les 2 variants declaratives ('general' | 'fiscal').
   Integrat a la v1.2.9 per ordre del Mestre del 18-11-2026 (versio.js en porta la nota).
   v1.2.17 · Gauntlet R1 (L3-15) · Documenta el plec de la general (Gemini R32.26) i que la fiscal no es plega. */
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
      descripcio="Franja universal, serena i no bloquejant per a la capçalera de les micro-apps en fase Beta. Resol de forma declarativa des del manifest (avisBeta: 'general' | 'fiscal', zero if per slug) si cal mostrar l’avís beta general de funcionalitat en proves o la clàusula sobre Verifactu / AEAT exclusiva de Gestoria i Bar/TPV. La general es pot plegar a «🧪 Fase Beta (Proves)» i l’aparell se’n recorda; la fiscal no es plega mai: sempre sencera i sense botó. Plegar-la en este espècimen la plega també a les apps d’este aparell: és la mateixa memòria."
      contracte={[
        ['BandaBetaMicroApp.idioma', "'ca' | 'es' | 'en' | 'eu' | 'gl' | undefined", 'llengua activa', 'Sense la prop, llig llenguaDelText de UIContext i recau en valencià si es munta aïllada.'],
        ['BandaBetaMicroApp.avisBeta', "'general' | 'fiscal' | undefined", 'manifest.avisBeta ?? "general"', 'Dins d’una micro-app llig declarativament manifest.avisBeta; fora, mostra "general" sense esmentar facturació.'],
        ['textosBandaBeta(idioma, avisBeta)', '{ regio: string, text: string, etiquetaCurta: string, plega: string }', '—', 'Funció pura que normalitza idioma i variant declarativa ("general" | "fiscal") i torna els textos congelats. etiquetaCurta i plega només els fa servir la general.'],
        ['bandaBetaPlegable(avisBeta)', 'boolean', 'true', 'Cert per a la general; fals per a la fiscal, que no es plega (decisió conservadora pendent del Mestre).'],
        ['bandaBetaPlegada(avisBeta) / desaBandaBetaPlegada(avisBeta, plegada)', 'boolean', 'false', 'El plec de la general en este aparell (config/storage.js, banda_beta_plegada_v1_general). Amb la fiscal, sempre false i no desen res.']
      ]}
      a11y={[
        'Element semàntic <aside> amb aria-label traduït a les 5 llengües, sense interrompre lectors de pantalla com si fóra una alerta d’error.',
        'Contrast WCAG AAA sobre tokens semàntics --sdp-avis-fons i --sdp-avis-text en clar, fosc i mode Bancal.',
        'Text envoltant (white-space: normal) sense el·lipsi ni desbordament horitzontal des de 320 px.',
        'El plec de la general és un sol <button> amb aria-expanded que no es desmunta en commutar: el focus s’hi queda (WCAG 2.4.3).',
        'Plegada, el nom del botó és el text visible «Fase Beta (Proves)» (WCAG 2.5.3); desplegada, la icona de tancar porta aria-label i title «Plega l’avís de fase beta» i aria-controls al text.'
      ]}
      fes={[
        'Declarar avisBeta: "fiscal" al manifest només en micro-apps amb llibres o tiquets (Gestoria i El Bar).',
        'Usar avisBeta: "general" a la resta de micro-apps (Nevera, Salut, Genealogia i Lector) per no confondre amb avisos fiscals.'
      ]}
      noFacis={[
        'Cablejar if (slug === ...) al component: el tipus d’avís ve sempre del manifest.',
        'Prometre homologació fiscal Verifactu mentre la remissió oficial a l’AEAT no estiga certificada.',
        'Fer plegable la variant fiscal: la clàusula Verifactu / AEAT es veu sempre sencera.'
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
