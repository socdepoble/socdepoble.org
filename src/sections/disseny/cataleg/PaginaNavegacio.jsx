import { useState } from 'react';
import { FileText, Images, History } from 'lucide-react';
import { Especimen } from './Especimen.jsx';
import { Pestanyes } from '../../../components/PedraSeca/Pestanyes.jsx';
import { MollaPa, Paginacio } from '../../../components/PedraSeca/navegacio.jsx';
import { Accordion, AccordionItem } from '../../../components/PedraSeca/Accordion.jsx';

export default function PaginaNavegacio() {
  const [pagina, setPagina] = useState(4);
  return (
    <>
      <h2>Navegació</h2>
      <p>Saber on soc, com tornar i què hi ha al costat. La navegació principal viu a l’UniversalShell (pàgina Estructura); ací hi ha la navegació dins d’una vista.</p>

      <Especimen id="pestanyes" nom="Pestanyes" fitxer="src/components/PedraSeca/Pestanyes.jsx"
        descripcio="Vistes germanes del mateix objecte (un poble: general, fotos, història). Substituïx la maqueta de <div class='tab'>, que no rebia focus."
        contracte={[
          ['pestanyes', '{ id, etiqueta, icona?, contingut }[]', '[]', 'Pestanyes i panells.'],
          ['activa / onCanvi', 'string / (id) => void', 'primera', 'Opcional: mode controlat.'],
          ['etiqueta', 'string', '—', 'Nom del tablist.'],
        ]}
        a11y={['role tablist/tab/tabpanel amb aria-controls.', '←/→ i Inici/Fi; focus itinerant (només l’activa és tabulable).', 'Indicador de 4px, no només color.']}
        fes={['2–6 pestanyes curtes.']} noFacis={['Pestanyes per a passos seqüencials (usa un assistent).', 'Pestanyes que naveguen a altres rutes (usa enllaços).']}>
        <Pestanyes etiqueta="Fitxa del poble" pestanyes={[
          { id: 'general', etiqueta: 'General', icona: FileText, contingut: <p>La Torre de les Maçanes, l’Alcoià. 700 habitants.</p> },
          { id: 'fotos', etiqueta: 'Fotografies', icona: Images, contingut: <p>Fototeca del poble.</p> },
          { id: 'historia', etiqueta: 'Història', icona: History, contingut: <p>Memòria dels Fadrins i de l’èxode.</p> },
        ]} />
      </Especimen>

      <Especimen id="molla" nom="MollaPa" fitxer="src/components/PedraSeca/navegacio.jsx"
        descripcio="Camí des de l’arrel fins a la pàgina actual. Obligatòria a partir del segon nivell de profunditat."
        contracte={[['passos', '{ etiqueta, a? }[]', '[]', 'L’últim és la pàgina actual (sense enllaç).']]}
        a11y={['<nav aria-label="Molla de pa"> + <ol>.', 'aria-current="page" a l’últim pas.']}
        fes={['Etiquetes iguals al títol de cada pàgina.']} noFacis={['Substituir el botó «Tornar arrere».']}>
        <MollaPa passos={[{ etiqueta: 'Inici', a: '/' }, { etiqueta: 'Pobles', a: '/pobles' }, { etiqueta: 'La Torre de les Maçanes' }]} />
      </Especimen>

      <Especimen id="paginacio" nom="Paginacio" fitxer="src/components/PedraSeca/navegacio.jsx"
        descripcio="Llistes llargues servides per pàgines (lligat a les RPC paginades per cursor de la Fase 2). Mai scroll infinit."
        contracte={[['pagina', 'number', '—', 'Actual (1-indexada).'], ['total', 'number', '—', 'Si és < 2, no es pinta res.'], ['onCanvi', '(n) => void', '—', '—']]}
        a11y={['Botons amb text «Anterior/Següent».', 'aria-current="page" i aria-label «Pàgina N».', 'Màxim 7 botons numèrics.']}
        fes={['Mostrar el total de resultats al costat.']} noFacis={['Scroll infinit (04_criteris_producte_i_disseny).']}>
        <Paginacio pagina={pagina} total={12} onCanvi={setPagina} />
      </Especimen>

      <Especimen id="acordio" nom="Accordion · AccordionItem" fitxer="src/components/PedraSeca/Accordion.jsx"
        descripcio="Contingut plegable per a preguntes freqüents i ajustos llargs."
        contracte={[['AccordionItem.title', 'node', '—', 'Capçalera clicable.'], ['AccordionItem.defaultOpen', 'boolean', 'false', '—']]}
        fes={['Preguntes freqüents.']} noFacis={['Amagar la informació principal d’una pàgina.']}>
        <Accordion>
          <AccordionItem title="Què és Sóc de Poble?"><p>Una xarxa pública per als pobles, feta des del poble.</p></AccordionItem>
          <AccordionItem title="Com puc col·laborar?"><p>Aportant fotos antigues o entrevistant els majors.</p></AccordionItem>
        </Accordion>
      </Especimen>

      <Especimen id="nav-mobil" nom="Barra de navegació mòbil" fitxer="src/app/App.jsx (nav.mobile-nav)"
        descripcio="≤1100px: barra inferior fixa amb 4 seccions i el Panell de Control al centre. La barra lateral passa a calaix."
        a11y={['Cada element porta icona + text (mai només icona).', 'Respecta env(safe-area-inset-bottom).']}
        fes={['Les 4 seccions de més ús.']} noFacis={['Més de 5 destinacions.', 'Amagar-la en fer scroll.']}>
        <p>Es veu reduint la finestra per davall de 1100px. L’espècimen viu és la mateixa app.</p>
      </Especimen>
    </>
  );
}
