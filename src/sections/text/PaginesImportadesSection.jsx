import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import ProjeccionsEnSuperficie from '../../components/universal/workspace/ProjeccionsEnSuperficie.jsx';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import { useSEO } from '../../hooks/useSEO.js';

const TEXTOS = Object.freeze({
  ca: ['Pàgines del fons documental', 'Referències d’entrades importades de socdepoble.net publicades pel poble.'],
  es: ['Páginas del fondo documental', 'Referencias de entradas importadas de socdepoble.net publicadas por el pueblo.'],
  en: ['Documentary collection pages', 'References to imported socdepoble.net entries published by the village.'],
  gl: ['Páxinas do fondo documental', 'Referencias de entradas importadas de socdepoble.net publicadas pola vila.'],
  eu: ['Dokumentu bildumako orrialdeak', 'Herriak argitaratutako socdepoble.net-etik inportatutako sarreren erreferentziak.']
});

export default function PaginesImportadesSection() {
  const { language = 'ca' } = useUIActionsOpcional() || {};
  const [title, lead] = TEXTOS[language] || TEXTOS.ca;
  useSEO({ title, description: lead });
  return <UniversalPage title={title} lead={lead} llenguaDelContingut={Object.hasOwn(TEXTOS, language) ? language : 'ca'}>
    <ProjeccionsEnSuperficie desti="pagina" />
  </UniversalPage>;
}
